/**
 * ============================================================================
 * JalSetu Purulia — ESP32 Rainwater Storage Level Prototype
 * 
 * Target Microcontroller: ESP32 (Espressif)
 * Sensor Type: Ultrasonic Distance Sensor (HC-SR04 or waterproof JSN-SR04T)
 * Purpose: Measure water depth in a rectangular or vertical-sided storage tank,
 *          validate readings, detect overflow, and stream clean CSV format.
 * 
 * Hardware Status: Prototyping code. Not field deployed in a live installation.
 * Tested via bench-top simulation and serial monitor.
 * ============================================================================
 */

#if __has_include("config.h")
  #include "config.h"
#else
  #include "config.h.example"
#endif

#if ENABLE_WIFI_UPLOAD
  #include <WiFi.h>
  #include <HTTPClient.h>
#endif

// Global state
unsigned long lastReadingTime = 0;
unsigned long readingCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_TRIGGER, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  #ifdef PIN_OVERFLOW_LED
  pinMode(PIN_OVERFLOW_LED, OUTPUT);
  #endif

  digitalWrite(PIN_TRIGGER, LOW);
  digitalWrite(PIN_STATUS_LED, LOW);

  Serial.println("=================================================");
  Serial.println("JalSetu Purulia — ESP32 Tank Monitoring Firmware");
  Serial.println("Target Geography: Purulia District, West Bengal");
  Serial.println("Output Format: CSV (elapsed_s, raw_dist_cm, water_depth_m, volume_litres, overflow_flag, status)");
  Serial.println("=================================================");
  Serial.println("timestamp_s,raw_distance_cm,water_depth_m,volume_litres,is_overflow,sensor_status");

#if ENABLE_WIFI_UPLOAD
  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected. IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[Wi-Fi] Connection failed. Reverting to offline serial-only mode.");
  }
#else
  Serial.println("[Mode] Standalone offline serial logging mode active.");
#endif
}

/**
 * Ping ultrasonic sensor and measure distance to water surface (in cm).
 * Takes multiple samples and discards noise outliers.
 */
float readDistanceCm() {
  float totalDist = 0;
  int validSamples = 0;

  for (int i = 0; i < SAMPLES_PER_READING; i++) {
    // Send 10-microsecond trigger pulse
    digitalWrite(PIN_TRIGGER, LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_TRIGGER, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_TRIGGER, LOW);

    // Read echo pulse travel time (timeout: 30ms -> ~5m max range)
    long durationUs = pulseIn(PIN_ECHO, HIGH, 30000);

    if (durationUs > 0) {
      // Speed of sound in air is ~343 m/s = 0.0343 cm/microsecond
      // Distance = (time * speed) / 2
      float dist = (durationUs * 0.0343) / 2.0;

      // Range check
      if (dist >= MIN_PLAUSIBLE_CM && dist <= MAX_PLAUSIBLE_CM) {
        totalDist += dist;
        validSamples++;
      }
    }
    delay(40); // Inter-ping interval to prevent acoustic echo overlap
  }

  if (validSamples == 0) {
    return -1.0; // Sensor read error / out of range
  }

  return (totalDist / validSamples);
}

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - lastReadingTime >= READING_INTERVAL_MS) {
    lastReadingTime = currentMillis;
    readingCount++;

    // Blink status LED
    digitalWrite(PIN_STATUS_LED, HIGH);

    float rawDistanceCm = readDistanceCm();
    String sensorStatus = "ok";
    float waterDepthM = 0.0;
    float volumeLitres = 0.0;
    bool isOverflow = false;

    if (rawDistanceCm < 0) {
      sensorStatus = "sensor_error";
      waterDepthM = -1.0;
      volumeLitres = -1.0;
    } else {
      // Tank water depth = Total depth - distance from sensor to water
      // Distance from top = rawDistanceCm - SENSOR_OFFSET_CM
      float airGapCm = rawDistanceCm - SENSOR_OFFSET_CM;
      float waterDepthCm = TANK_DEPTH_CM - airGapCm;

      // Bound check
      if (waterDepthCm < 0) {
        waterDepthCm = 0; // Empty tank
      } else if (waterDepthCm > TANK_DEPTH_CM) {
        // Water is overflowing above maximum intended depth
        isOverflow = true;
        sensorStatus = "overflow_detected";
      }

      waterDepthM = waterDepthCm / 100.0;

      // Rectangular volume calculation: Length(m) * Width(m) * Depth(m) * 1000 = Litres
      volumeLitres = TANK_LENGTH_M * TANK_WIDTH_M * waterDepthM * 1000.0;

      #ifdef PIN_OVERFLOW_LED
      digitalWrite(PIN_OVERFLOW_LED, isOverflow ? HIGH : LOW);
      #endif
    }

    // Print CSV output to Serial (easy to copy or pipe into Web App)
    unsigned long elapsedSeconds = currentMillis / 1000;
    Serial.print(elapsedSeconds);
    Serial.print(",");
    Serial.print(rawDistanceCm, 1);
    Serial.print(",");
    Serial.print(waterDepthM, 3);
    Serial.print(",");
    Serial.print(volumeLitres, 1);
    Serial.print(",");
    Serial.print(isOverflow ? "1" : "0");
    Serial.print(",");
    Serial.println(sensorStatus);

#if ENABLE_WIFI_UPLOAD
    if (WiFi.status() == WL_CONNECTED && rawDistanceCm >= 0) {
      HTTPClient http;
      http.begin(INGEST_ENDPOINT);
      http.addHeader("Content-Type", "application/json");

      String payload = "{\"timestamp\":\"" + String(elapsedSeconds) +
                       "\",\"waterDepthM\":" + String(waterDepthM, 3) +
                       ",\"calculatedVolumeLitres\":" + String(volumeLitres, 1) +
                       ",\"isOverflow\":" + (isOverflow ? "true" : "false") +
                       ",\"sensorStatus\":\"" + sensorStatus + "\"}";

      int httpResponseCode = http.POST(payload);
      if (httpResponseCode > 0) {
        // Successfully transmitted
      } else {
        Serial.println("[HTTP] Upload error: " + String(httpResponseCode));
      }
      http.end();
    }
#endif

    digitalWrite(PIN_STATUS_LED, LOW);
  }
}
