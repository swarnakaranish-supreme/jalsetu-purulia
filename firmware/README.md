# ESP32 Monitoring Firmware Prototype

## 1. Overview
This directory contains an Arduino-compatible C++ firmware sketch (`jalsetu_esp32_sensor.ino`) designed to run on an Espressif ESP32 microcontroller paired with an ultrasonic sensor (HC-SR04 or waterproof JSN-SR04T).

Its purpose is to monitor water levels in rectangular or vertical-sided rainwater storage tanks, detect overflow conditions, filter measurement noise, and output structured CSV data over the USB serial interface.

## 2. Hardware Verification Status
> **Honest Engineering Note:**  
> This firmware is an early lab prototype tested on an ESP32 bench-test setup and through serial simulation.  
> **It has NOT been permanently deployed or field-verified in a village or community structure in Purulia.**  
> Do not claim physical field deployment during your project presentation.

## 3. Circuit Connections
| ESP32 Pin | Sensor Pin (HC-SR04 / JSN-SR04T) | Function |
|---|---|---|
| GPIO 5 | TRIG | 10 µs Trigger Pulse (Output) |
| GPIO 18 | ECHO | Echo Return Pulse (Input, 3.3V safe) |
| 5V / VIN | VCC | Sensor Power Supply |
| GND | GND | Common Ground |
| GPIO 2 | Onboard LED | Blink indicator on measurement |
| GPIO 4 | External Red LED (optional) | Overflow alert indicator |

*Note: If using standard 5V HC-SR04, place a simple 1kΩ / 2kΩ resistor divider on the ECHO line to protect the ESP32 3.3V GPIO pin from 5V logic.*

## 4. Setup & Compilation
1. Copy `config.h.example` to `config.h`:
   ```bash
   cp config.h.example config.h
   ```
2. Open `jalsetu_esp32_sensor.ino` in Arduino IDE or VS Code with PlatformIO.
3. Select board: `ESP32 Dev Module`.
4. Set Serial Monitor baud rate to **115200**.
5. Compile and upload.

## 5. Serial Output Format
The device prints CSV lines at regular intervals (default 10s for testing):
```csv
timestamp_s,raw_distance_cm,water_depth_m,volume_litres,is_overflow,sensor_status
10,85.2,1.298,12980.0,0,ok
20,84.9,1.301,13010.0,0,ok
30,12.0,2.030,20300.0,1,overflow_detected
```

## 6. How to Import Readings into JalSetu Web App
1. Open the Arduino Serial Monitor or a terminal logging session (`PuTTY` / `screen`).
2. Copy the generated CSV rows.
3. Open JalSetu Purulia Web App &rarr; **Water Monitoring** &rarr; **Log New Observation**.
4. Input the measured depth and timestamp.
