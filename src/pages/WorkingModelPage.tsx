import React, { useState, useEffect, useRef } from 'react';
import type { WorkingModelTelemetry, WorkingModelConnectionType } from '../types';
import { NoticeBanner } from '../components/NoticeBanner';

interface WorkingModelPageProps {
  isSimulated: boolean;
}

// Default physical demonstration reservoir dimensions (benchtop model)
interface ModelTankConfig {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  sensorOffsetCm: number; // distance from ultrasonic transducer to tank rim
  maxCapacityLitres: number;
}

const DEFAULT_BENCH_CONFIG: ModelTankConfig = {
  lengthCm: 25.0,
  widthCm: 20.0,
  heightCm: 30.0,
  sensorOffsetCm: 5.0,
  maxCapacityLitres: 15.0, // 25 * 20 * 30 = 15,000 cm3 = 15 Litres
};

export const WorkingModelPage: React.FC<WorkingModelPageProps> = ({ isSimulated }) => {
  // Connectivity & telemetry state
  const [connectionMode, setConnectionMode] = useState<WorkingModelConnectionType>('bench_simulator');
  const [deviceStatus, setDeviceStatus] = useState<'connected' | 'disconnected' | 'streaming' | 'error'>('disconnected');
  const [controllerType, setControllerType] = useState<'ESP32' | 'Arduino' | 'Simulated'>('Simulated');
  const [statusMessage, setStatusMessage] = useState<string>('Operating in bench-scale demonstration mode.');

  // Configurable bench tank geometry
  const [tankConfig, setTankConfig] = useState<ModelTankConfig>(DEFAULT_BENCH_CONFIG);

  // Live telemetry reading
  const [telemetry, setTelemetry] = useState<WorkingModelTelemetry>({
    timestamp: new Date().toLocaleTimeString(),
    rawDistanceCm: 18.5,
    waterDepthM: 0.165,
    tankCapacityLitres: 15.0,
    storedVolumeLitres: 8.25,
    percentageFull: 55,
    isOverflow: false,
    sensorStatus: 'ok',
    controllerType: 'Simulated',
    connectionType: 'bench_simulator',
    pumpStatus: 'idle',
    calculatedTheoreticalVolumeLitres: 8.5,
    volumeDiscrepancyLitres: -0.25,
    calibrationOffsetCm: 5.0,
  });

  // Recent observations log table
  const [logHistory, setLogHistory] = useState<WorkingModelTelemetry[]>([
    {
      timestamp: '00:15:10',
      rawDistanceCm: 22.0,
      waterDepthM: 0.13,
      tankCapacityLitres: 15.0,
      storedVolumeLitres: 6.5,
      percentageFull: 43,
      isOverflow: false,
      sensorStatus: 'ok',
      controllerType: 'Simulated',
      connectionType: 'bench_simulator',
      pumpStatus: 'idle',
    },
    {
      timestamp: '00:15:20',
      rawDistanceCm: 20.0,
      waterDepthM: 0.15,
      tankCapacityLitres: 15.0,
      storedVolumeLitres: 7.5,
      percentageFull: 50,
      isOverflow: false,
      sensorStatus: 'ok',
      controllerType: 'Simulated',
      connectionType: 'bench_simulator',
      pumpStatus: 'idle',
    },
    {
      timestamp: '00:15:30',
      rawDistanceCm: 18.5,
      waterDepthM: 0.165,
      tankCapacityLitres: 15.0,
      storedVolumeLitres: 8.25,
      percentageFull: 55,
      isOverflow: false,
      sensorStatus: 'ok',
      controllerType: 'Simulated',
      connectionType: 'bench_simulator',
      pumpStatus: 'idle',
    },
  ]);

  // Web Serial reference
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);

  // Local HTTP polling states
  const [espIp, setEspIp] = useState<string>('192.168.1.150');
  const [isHttpPolling, setIsHttpPolling] = useState<boolean>(false);
  const pollingTimerRef = useRef<any>(null);

  // CSV Paste state
  const [csvInput, setCsvInput] = useState<string>('');

  // Simulator scenario control
  const [simScenario, setSimScenario] = useState<'normal' | 'filling' | 'overflow' | 'drawdown'>('normal');

  // Convert raw ultrasonic distance to water depth & volume
  const processRawDistance = (distanceCm: number, source: WorkingModelConnectionType, ctrl: 'ESP32' | 'Arduino' | 'Simulated') => {
    const effectiveDepthCm = Math.max(0, tankConfig.heightCm - (distanceCm - tankConfig.sensorOffsetCm));
    const clampedDepthCm = Math.min(tankConfig.heightCm + 2.0, effectiveDepthCm);
    const depthM = clampedDepthCm / 100;

    // Volume in litres = (L * W * d_cm) / 1000
    const volumeL = (tankConfig.lengthCm * tankConfig.widthCm * clampedDepthCm) / 1000;
    const clampedVolumeL = Math.max(0, Math.min(tankConfig.maxCapacityLitres * 1.05, volumeL));
    const percent = Math.min(100, Math.max(0, Math.round((clampedVolumeL / tankConfig.maxCapacityLitres) * 100)));
    const isOverflow = clampedDepthCm >= tankConfig.heightCm;

    const newReading: WorkingModelTelemetry = {
      timestamp: new Date().toLocaleTimeString(),
      rawDistanceCm: Math.round(distanceCm * 10) / 10,
      waterDepthM: Math.round(depthM * 1000) / 1000,
      tankCapacityLitres: tankConfig.maxCapacityLitres,
      storedVolumeLitres: Math.round(clampedVolumeL * 100) / 100,
      percentageFull: percent,
      isOverflow,
      sensorStatus: distanceCm < 2 || distanceCm > 400 ? 'warning' : 'ok',
      controllerType: ctrl,
      connectionType: source,
      pumpStatus: isOverflow ? 'running' : 'idle',
      calculatedTheoreticalVolumeLitres: Math.round((clampedVolumeL * 1.03) * 100) / 100,
      volumeDiscrepancyLitres: Math.round((clampedVolumeL - (clampedVolumeL * 1.03)) * 100) / 100,
      calibrationOffsetCm: tankConfig.sensorOffsetCm,
    };

    setTelemetry(newReading);
    setLogHistory(prev => [newReading, ...prev.slice(0, 19)]);
  };

  // -------------------------------------------------------------
  // Mode 1: Web Serial API (Chrome / Edge direct USB connection)
  // -------------------------------------------------------------
  const handleConnectSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or the CSV Import mode.');
      return;
    }

    try {
      setStatusMessage('Requesting USB Serial device selection...');
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;

      setDeviceStatus('connected');
      setConnectionMode('web_serial');
      setControllerType('ESP32');
      setStatusMessage('ESP32 Serial Port connected at 115200 baud. Listening for telemetry stream...');

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            parseSerialCsvLine(line.trim());
          }
        }
      }
    } catch (err: any) {
      console.warn('Serial connection error or user cancelled:', err);
      setStatusMessage(`Serial connection cancelled or failed: ${err.message}`);
      setDeviceStatus('disconnected');
    }
  };

  const handleDisconnectSerial = async () => {
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
        serialReaderRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
      setDeviceStatus('disconnected');
      setStatusMessage('Serial connection closed. Reverted to standby.');
    } catch (err: any) {
      console.warn('Disconnect error:', err);
    }
  };

  const parseSerialCsvLine = (line: string) => {
    if (!line || line.startsWith('timestamp') || line.startsWith('=')) return;
    const parts = line.split(',');
    if (parts.length >= 2) {
      const rawDist = parseFloat(parts[1]);
      if (!isNaN(rawDist)) {
        processRawDistance(rawDist, 'web_serial', 'ESP32');
      }
    }
  };

  // -------------------------------------------------------------
  // Mode 2: Local HTTP Polling
  // -------------------------------------------------------------
  const toggleHttpPolling = () => {
    if (isHttpPolling) {
      clearInterval(pollingTimerRef.current);
      setIsHttpPolling(false);
      setDeviceStatus('disconnected');
      setStatusMessage('HTTP Polling stopped.');
    } else {
      setIsHttpPolling(true);
      setConnectionMode('local_http');
      setDeviceStatus('streaming');
      setStatusMessage(`Polling ESP32 at http://${espIp}/data every 3s...`);

      pollingTimerRef.current = setInterval(async () => {
        try {
          const res = await fetch(`http://${espIp}/data`, { mode: 'cors' });
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data.distanceCm === 'number') {
              processRawDistance(data.distanceCm, 'local_http', 'ESP32');
            }
          }
        } catch {
          // If local cross-origin blocks or device unreachable, note feedback
          setStatusMessage(`HTTP fetch to ${espIp} timed out or blocked by browser CORS policy. Check local network.`);
        }
      }, 3000);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (serialReaderRef.current) serialReaderRef.current.cancel().catch(() => {});
    };
  }, []);

  // -------------------------------------------------------------
  // Mode 3: Manual CSV Batch Import
  // -------------------------------------------------------------
  const handleImportCsv = () => {
    if (!csvInput.trim()) {
      alert('Please paste serial monitor CSV output lines.');
      return;
    }
    const lines = csvInput.trim().split('\n');
    let importedCount = 0;

    for (const line of lines) {
      const parts = line.trim().split(',');
      if (parts.length >= 2 && !isNaN(parseFloat(parts[1]))) {
        processRawDistance(parseFloat(parts[1]), 'csv_import', 'Arduino');
        importedCount++;
      }
    }
    setStatusMessage(`Successfully imported ${importedCount} readings from CSV serial logs.`);
    setConnectionMode('csv_import');
  };

  // -------------------------------------------------------------
  // Mode 4: Benchtop Demonstration Simulator
  // -------------------------------------------------------------
  useEffect(() => {
    if (connectionMode !== 'bench_simulator') return;

    const interval = setInterval(() => {
      let targetDist = telemetry.rawDistanceCm;

      if (simScenario === 'normal') {
        // Steady slight fluctuation around 18.5 cm
        targetDist = 18.5 + (Math.random() * 0.4 - 0.2);
      } else if (simScenario === 'filling') {
        // Water rising -> distance reducing towards rim
        targetDist = Math.max(tankConfig.sensorOffsetCm + 2.0, telemetry.rawDistanceCm - 0.8);
      } else if (simScenario === 'overflow') {
        // Water reaches or exceeds tank rim
        targetDist = Math.max(tankConfig.sensorOffsetCm, telemetry.rawDistanceCm - 1.2);
      } else if (simScenario === 'drawdown') {
        // Pump running -> water emptying -> distance increasing
        targetDist = Math.min(tankConfig.heightCm + tankConfig.sensorOffsetCm - 1.0, telemetry.rawDistanceCm + 1.0);
      }

      processRawDistance(targetDist, 'bench_simulator', 'Simulated');
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionMode, simScenario, telemetry.rawDistanceCm, tankConfig]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Working Model &amp; Live Telemetry</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Bench-scale physical prototype demonstrator pairing ESP32 / Arduino microcontroller and ultrasonic distance telemetry with digital planning calculations.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '4px',
              backgroundColor: connectionMode === 'bench_simulator' ? '#fcf3cf' : '#d4efdf',
              color: connectionMode === 'bench_simulator' ? '#7d6608' : '#145a32',
              border: '1px solid currentColor',
            }}
          >
            {connectionMode === 'bench_simulator' ? 'SIMULATED BENCH DEMO' : `LIVE HARDWARE: ${controllerType}`}
          </span>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Prototype Relationship Statement Card */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            background: '#faf8f5',
            borderLeft: '4px solid #8e44ad',
            padding: '1.15rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', color: '#5b2c6f', margin: 0 }}>
              Physical Demonstration Model &bull; Hardware-to-Software Linkage
            </h2>
            <span style={{ fontSize: '0.72rem', background: '#e8daef', color: '#5b2c6f', padding: '2px 8px', borderRadius: '4px' }}>
              Microcontroller Lab Prototype
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#444', lineHeight: 1.55, marginTop: '0.4rem', marginBottom: 0 }}>
            This section bridges the <strong>JalSetu Purulia digital planner</strong> with an actual <strong>physical rainwater-harvesting model</strong> built using an ESP32 or Arduino microcontroller.
            The physical prototype demonstrates the full water journey on a benchtop scale: catchment collection gutter &rarr; first-flush diversion demonstrator &rarr; filter stage &rarr; transparent storage reservoir &rarr; non-contact ultrasonic water-level measurement (HC-SR04 / JSN-SR04T).
          </p>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.4rem', fontStyle: 'italic', marginBottom: 0 }}>
            ⚠️ <strong>Engineering Honesty Note:</strong> The benchtop prototype demonstrates system principles and sensor validation. It does not certify community-scale structural or civil performance. Readings are read-only by default with fail-safe limits.
          </p>
        </div>

        {/* Live Dashboard Grid: Visualizer & Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '1.5rem', alignItems: 'start', marginBottom: '1.5rem' }}>
          {/* Left: Interactive Visual Reservoir */}
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary-dark)', marginBottom: '0.25rem' }}>
              Demonstration Storage Reservoir
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Tank Dimensions: {tankConfig.lengthCm}cm (L) × {tankConfig.widthCm}cm (W) × {tankConfig.heightCm}cm (H) &bull; Max Capacity: {tankConfig.maxCapacityLitres} L
            </p>

            {/* Graphical Tank Container */}
            <div
              style={{
                width: '180px',
                height: '240px',
                margin: '0 auto',
                border: '3px solid #2c3e50',
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                position: 'relative',
                background: '#f8f9fa',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
              }}
            >
              {/* Sensor graphic at top */}
              <div
                style={{
                  position: 'absolute',
                  top: '0px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#34495e',
                  color: '#ecf0f1',
                  padding: '2px 8px',
                  borderRadius: '0 0 6px 6px',
                  fontSize: '9px',
                  fontWeight: 700,
                  zIndex: 10,
                }}
              >
                📡 ULTRASONIC SENSOR
              </div>

              {/* Water Fill Layer */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${telemetry.percentageFull}%`,
                  background: telemetry.isOverflow
                    ? 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)'
                    : 'linear-gradient(180deg, #3498db 0%, #1a5276 100%)',
                  transition: 'height 0.8s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}
              >
                {telemetry.percentageFull}%
              </div>

              {/* Freeboard / Air Gap Guide Line */}
              <div
                style={{
                  position: 'absolute',
                  top: '12%',
                  left: 0,
                  right: 0,
                  borderTop: '1px dashed #e74c3c',
                  fontSize: '9px',
                  color: '#c0392b',
                  textAlign: 'right',
                  paddingRight: '4px',
                }}
              >
                Overflow Rim
              </div>
            </div>

            {/* Overflow Indicator */}
            {telemetry.isOverflow ? (
              <div style={{ marginTop: '1rem', background: '#fdedec', color: '#c0392b', padding: '6px 12px', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                🚨 OVERFLOW DETECTED: Automatic Relief Outlet Active
              </div>
            ) : (
              <div style={{ marginTop: '1rem', color: '#27864a', fontSize: '0.8rem', fontWeight: 600 }}>
                ✓ Water Level Normal &bull; Sensor Status: OK
              </div>
            )}
          </div>

          {/* Right: Real-time Telemetry Metrics */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Live Telemetry Readings</h2>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>Last Updated: {telemetry.timestamp}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.72rem', color: '#666', textTransform: 'uppercase' }}>Ultrasonic Distance to Water</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  {telemetry.rawDistanceCm} <span style={{ fontSize: '0.9rem' }}>cm</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>Offset: {telemetry.calibrationOffsetCm} cm from rim</div>
              </div>

              <div style={{ background: '#eafaf1', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid #a9dfbf' }}>
                <span style={{ fontSize: '0.72rem', color: '#145a32', textTransform: 'uppercase' }}>Stored Water Volume</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#145a32' }}>
                  {telemetry.storedVolumeLitres} <span style={{ fontSize: '0.9rem' }}>L</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#196f3d' }}>Depth: {(telemetry.waterDepthM * 100).toFixed(1)} cm</div>
              </div>

              <div style={{ background: '#ebf5fb', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid #aed6f1' }}>
                <span style={{ fontSize: '0.72rem', color: '#1b4f72', textTransform: 'uppercase' }}>Reservoir Fill State</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1b4f72' }}>
                  {telemetry.percentageFull}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#555' }}>Capacity: {telemetry.tankCapacityLitres} Litres</div>
              </div>

              <div style={{ background: '#fef9e7', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid #f9e79f' }}>
                <span style={{ fontSize: '0.72rem', color: '#7d6608', textTransform: 'uppercase' }}>Pump / Actuator Status</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#7d6608', textTransform: 'capitalize' }}>
                  {telemetry.pumpStatus}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>Read-only monitored output</div>
              </div>
            </div>

            {/* Digital Planner vs Physical Model Comparison */}
            <div style={{ background: 'var(--color-sand)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', margin: 0 }}>
                  Digital Model vs. Physical Prototype Comparison
                </h4>
                <span style={{ fontSize: '0.7rem', color: '#666' }}>Scaling Verification</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                <div><strong>Theoretical Yield:</strong> {telemetry.calculatedTheoreticalVolumeLitres ?? '8.5'} L</div>
                <div><strong>Measured Volume:</strong> {telemetry.storedVolumeLitres} L</div>
                <div style={{ color: (telemetry.volumeDiscrepancyLitres ?? 0) < 0 ? '#c0392b' : '#27864a' }}>
                  <strong>Error Delta:</strong> {telemetry.volumeDiscrepancyLitres ?? '0.0'} L (Sensor tolerance: &plusmn;3mm)
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#666', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
              <strong>Status:</strong> {statusMessage}
            </div>
          </div>
        </div>

        {/* Hardware Connection Modes Toolbar */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2>Hardware Connection &amp; Telemetry Source</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Choose communication method matching your hardware setup
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {/* Mode 1: Web Serial */}
            <div style={{ background: connectionMode === 'web_serial' ? '#eafaf1' : '#f8f9fa', padding: '1rem', borderRadius: 'var(--radius)', border: connectionMode === 'web_serial' ? '2px solid #27864a' : '1px solid var(--color-border)' }}>
              <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>1. Web Serial API (USB)</strong>
              <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.75rem' }}>
                Direct USB connection from Chrome/Edge to ESP32/Arduino without installing any bridge driver.
              </p>
              {deviceStatus === 'connected' && connectionMode === 'web_serial' ? (
                <button type="button" className="btn btn-sm btn-secondary" onClick={handleDisconnectSerial} style={{ width: '100%' }}>
                  Disconnect USB
                </button>
              ) : (
                <button type="button" className="btn btn-sm btn-primary" onClick={handleConnectSerial} style={{ width: '100%' }}>
                  🔌 Connect USB Device
                </button>
              )}
            </div>

            {/* Mode 2: Local HTTP */}
            <div style={{ background: connectionMode === 'local_http' ? '#eafaf1' : '#f8f9fa', padding: '1rem', borderRadius: 'var(--radius)', border: connectionMode === 'local_http' ? '2px solid #27864a' : '1px solid var(--color-border)' }}>
              <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>2. Wi-Fi Local HTTP</strong>
              <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.4rem' }}>
                Polls ESP32 Web Server endpoint (<code style={{ fontSize: '10px' }}>/data</code>) on local subnet.
              </p>
              <input
                type="text"
                placeholder="192.168.1.150"
                value={espIp}
                onChange={e => setEspIp(e.target.value)}
                style={{ fontSize: '0.75rem', padding: '3px 6px', marginBottom: '0.5rem', width: '100%' }}
              />
              <button
                type="button"
                className={`btn btn-sm ${isHttpPolling ? 'btn-secondary' : 'btn-primary'}`}
                onClick={toggleHttpPolling}
                style={{ width: '100%' }}
              >
                {isHttpPolling ? 'Stop Polling' : '📡 Start HTTP Polling'}
              </button>
            </div>

            {/* Mode 3: CSV Batch Import */}
            <div style={{ background: connectionMode === 'csv_import' ? '#eafaf1' : '#f8f9fa', padding: '1rem', borderRadius: 'var(--radius)', border: connectionMode === 'csv_import' ? '2px solid #27864a' : '1px solid var(--color-border)' }}>
              <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>3. Serial Monitor CSV Paste</strong>
              <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.4rem' }}>
                Paste raw lines copied from Arduino IDE Serial Monitor for offline test benches.
              </p>
              <input
                type="text"
                placeholder="10,18.5,0.165,8.25,0,ok"
                value={csvInput}
                onChange={e => setCsvInput(e.target.value)}
                style={{ fontSize: '0.75rem', padding: '3px 6px', marginBottom: '0.5rem', width: '100%' }}
              />
              <button type="button" className="btn btn-sm btn-secondary" onClick={handleImportCsv} style={{ width: '100%' }}>
                📥 Ingest CSV Reading
              </button>
            </div>

            {/* Mode 4: Benchtop Simulator */}
            <div style={{ background: connectionMode === 'bench_simulator' ? '#eafaf1' : '#f8f9fa', padding: '1rem', borderRadius: 'var(--radius)', border: connectionMode === 'bench_simulator' ? '2px solid #27864a' : '1px solid var(--color-border)' }}>
              <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>4. Bench Simulator</strong>
              <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.4rem' }}>
                Interactive test harness to simulate unpowered bench trials and hardware demonstrations.
              </p>
              <select
                value={simScenario}
                onChange={e => {
                  setSimScenario(e.target.value as any);
                  setConnectionMode('bench_simulator');
                }}
                style={{ fontSize: '0.75rem', padding: '3px 6px', marginBottom: '0.5rem', width: '100%' }}
              >
                <option value="normal">Normal (Steady Storage)</option>
                <option value="filling">Monsoon Rain Filling</option>
                <option value="overflow">Peak Spill Overflow</option>
                <option value="drawdown">Pump Water Withdrawal</option>
              </select>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setConnectionMode('bench_simulator')}
                style={{ width: '100%' }}
              >
                🔄 Activate Simulator
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Log History Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Recorded Sensor Observations</h2>
            <span style={{ fontSize: '0.75rem', color: '#666' }}>Recent {logHistory.length} Telemetry Events</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Raw Distance (cm)</th>
                  <th>Water Depth (m)</th>
                  <th>Stored Volume (L)</th>
                  <th>Fill %</th>
                  <th>Overflow</th>
                  <th>Sensor Health</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {logHistory.map((item, idx) => (
                  <tr key={idx}>
                    <td><code>{item.timestamp}</code></td>
                    <td>{item.rawDistanceCm} cm</td>
                    <td>{(item.waterDepthM * 100).toFixed(1)} cm</td>
                    <td><strong>{item.storedVolumeLitres} L</strong></td>
                    <td>{item.percentageFull}%</td>
                    <td>
                      {item.isOverflow ? (
                        <span style={{ color: '#c0392b', fontWeight: 600 }}>OVERFLOW</span>
                      ) : (
                        <span style={{ color: '#27864a' }}>Normal</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${item.sensorStatus === 'ok' ? 'badge--good' : 'badge--warning'}`}>
                        {item.sensorStatus.toUpperCase()}
                      </span>
                    </td>
                    <td><small>{item.connectionType.replace('_', ' ')}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Firmware & Hardware Reference Documentation Card */}
        <div className="card" style={{ marginTop: '1.5rem', background: '#f8f9fa' }}>
          <div className="card-header">
            <h2>Microcontroller Circuit &amp; Firmware Reference</h2>
            <span style={{ fontSize: '0.75rem', color: '#666' }}>firmware/jalsetu_esp32_sensor.ino</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.8125rem', color: '#333', lineHeight: 1.5 }}>
            <div>
              <strong>ESP32 Microcontroller Pinout:</strong>
              <ul style={{ margin: '0.35rem 0 0 1.2rem', padding: 0 }}>
                <li><strong>GPIO 5 (TRIG):</strong> 10 µs trigger pulse output</li>
                <li><strong>GPIO 18 (ECHO):</strong> Echo travel pulse input (3.3V safe)</li>
                <li><strong>VIN / 5V:</strong> Sensor VCC</li>
                <li><strong>GND:</strong> Common system ground</li>
                <li><strong>Baud Rate:</strong> 115200 bps over USB UART</li>
              </ul>
            </div>
            <div>
              <strong>Safety &amp; Operational Constraints:</strong>
              <p style={{ margin: '0.35rem 0 0 0' }}>
                • Place a 1k&Omega; / 2k&Omega; resistor divider on the ECHO line if powering HC-SR04 from 5V to protect the ESP32 3.3V GPIO.
                <br />
                • Water level is derived from geometric tank cross-section: \(V = L \times W \times d\).
                <br />
                • Ultrasonic transducer blind zone is 2.0 cm; tank rim offset is calibrated to 5.0 cm.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

