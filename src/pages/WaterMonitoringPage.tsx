import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type {
  MonitoringObservation,
  Asset,
  DataSourceType,
  WaterQualityParameter,
  WaterTestingMethod,
} from '../types';
import { generateId, exportObservationsToCSV, importObservationsFromCSV } from '../lib/storage';
import {
  calculateRectangularTankVolume,
  validateWaterLevelReading,
  evaluateWaterQuality,
} from '../lib/calculations';
import { NoticeBanner } from '../components/NoticeBanner';

interface WaterMonitoringPageProps {
  observations: MonitoringObservation[];
  assets: Asset[];
  onSaveObservation: (obs: MonitoringObservation) => void;
  onDeleteObservation: (id: string) => void;
  isSimulated: boolean;
}

export const WaterMonitoringPage: React.FC<WaterMonitoringPageProps> = ({
  observations,
  assets,
  onSaveObservation,
  onDeleteObservation,
  isSimulated,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    assets.length > 0 ? assets[0].id : ''
  );
  const [activeTab, setActiveTab] = useState<'chart' | 'log' | 'quality' | 'entry' | 'import'>('chart');

  // Form State — Water Level & Rainfall
  const [entryMode, setEntryMode] = useState<'level' | 'quality'>('level');
  const [newRainfall, setNewRainfall] = useState<string>('');
  const [newWaterLevel, setNewWaterLevel] = useState<string>('');
  const [newTimestamp, setNewTimestamp] = useState<string>(
    new Date().toISOString().substring(0, 16)
  );
  const [newSource, setNewSource] = useState<DataSourceType>('manual_gauge');
  const [newNotes, setNewNotes] = useState<string>('');
  const [formValidationWarning, setFormValidationWarning] = useState<string | null>(null);

  // Form State — Water Quality
  const [wqParam, setWqParam] = useState<WaterQualityParameter>('pH');
  const [wqValue, setWqValue] = useState<string>('7.2');
  const [wqUnit, setWqUnit] = useState<string>('');
  const [wqMethod, setWqMethod] = useState<WaterTestingMethod>('field_test_kit');
  const [wqAgency, setWqAgency] = useState<string>('Gram Panchayat FTK');

  // CSV Import State
  const [csvInput, setCsvInput] = useState<string>('');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    errors: string[];
  } | null>(null);

  // Current selected asset
  const currentAsset = assets.find(a => a.id === selectedAssetId);

  // Filtered observations
  const filteredObs = useMemo(() => {
    return selectedAssetId
      ? observations.filter(o => o.assetId === selectedAssetId)
      : observations;
  }, [observations, selectedAssetId]);

  const sortedObs = useMemo(() => {
    return [...filteredObs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [filteredObs]);

  // Observations with water quality data
  const qualityObs = useMemo(() => {
    return filteredObs.filter(o => o.waterQuality !== null && o.waterQuality !== undefined);
  }, [filteredObs]);

  // Chart data
  const chartData = useMemo(() => {
    return sortedObs.map(o => ({
      timestamp: o.timestamp.substring(5, 16).replace('T', ' '),
      rainfallMm: o.rainfallMm ?? 0,
      waterLevelM: o.waterLevelM ?? 0,
      volumeLitres: o.calculatedVolumeLitres ?? 0,
      isOverflow: o.isOverflow ? 1 : 0,
      source: o.dataSource,
    }));
  }, [sortedObs]);

  // Handle Water Parameter Preset Unit Change
  const handleWqParamChange = (param: WaterQualityParameter) => {
    setWqParam(param);
    switch (param) {
      case 'pH':
        setWqUnit('');
        setWqValue('7.2');
        break;
      case 'tds_ppm':
        setWqUnit('mg/L');
        setWqValue('150');
        break;
      case 'turbidity_ntu':
        setWqUnit('NTU');
        setWqValue('1.5');
        break;
      case 'fluoride_mg_l':
        setWqUnit('mg/L');
        setWqValue('0.6');
        break;
      case 'iron_mg_l':
        setWqUnit('mg/L');
        setWqValue('0.3');
        break;
      case 'nitrate_mg_l':
        setWqUnit('mg/L');
        setWqValue('12');
        break;
      case 'coliform_presence':
        setWqUnit('in 100ml');
        setWqValue('absent');
        break;
      default:
        setWqUnit('');
    }
  };

  const handleCreateObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      alert('Please select an asset first.');
      return;
    }

    if (entryMode === 'level') {
      const rain = newRainfall.trim() === '' ? null : parseFloat(newRainfall);
      const depth = newWaterLevel.trim() === '' ? null : parseFloat(newWaterLevel);

      if (rain !== null && (isNaN(rain) || rain < 0)) {
        alert('Rainfall must be a positive number.');
        return;
      }

      if (depth !== null) {
        if (isNaN(depth)) {
          alert('Water level must be a valid number.');
          return;
        }
        const valRes = validateWaterLevelReading(depth, currentAsset?.tankDepthM ?? null);
        if (!valRes.valid) {
          alert(`Sensor reading error: ${valRes.warning}`);
          return;
        }
        if (valRes.warning) {
          setFormValidationWarning(valRes.warning);
        }
      }

      // Storage volume calculation
      let calcVolume: number | null = null;
      let overflow = false;

      if (depth !== null && currentAsset) {
        if (
          currentAsset.tankLengthM &&
          currentAsset.tankWidthM &&
          currentAsset.type === 'rooftop_rwh'
        ) {
          const res = calculateRectangularTankVolume(
            currentAsset.tankLengthM,
            currentAsset.tankWidthM,
            depth
          );
          calcVolume = res.volumeLitres;
        } else if (currentAsset.storageCapacityLitres && currentAsset.tankDepthM) {
          // Approximate proportional volume
          const ratio = Math.min(1.0, depth / currentAsset.tankDepthM);
          calcVolume = Math.round(currentAsset.storageCapacityLitres * ratio);
        }

        if (currentAsset.tankDepthM && depth >= currentAsset.tankDepthM) {
          overflow = true;
        }
      }

      const obsToSave: MonitoringObservation = {
        id: generateId(),
        assetId: selectedAssetId,
        timestamp: new Date(newTimestamp).toISOString(),
        rainfallMm: rain,
        waterLevelM: depth,
        calculatedVolumeLitres: calcVolume,
        isOverflow: overflow,
        sensorStatus: newSource === 'sensor_esp32' ? 'ok' : 'not_applicable',
        dataSource: newSource,
        notes: newNotes,
        isSimulated: false,
      };

      onSaveObservation(obsToSave);
      setNewRainfall('');
      setNewWaterLevel('');
      setNewNotes('');
      setActiveTab('chart');
    } else {
      // Water Quality Entry
      const evalRes = evaluateWaterQuality(wqParam, wqValue, wqMethod);

      const obsToSave: MonitoringObservation = {
        id: generateId(),
        assetId: selectedAssetId,
        timestamp: new Date(newTimestamp).toISOString(),
        rainfallMm: null,
        waterLevelM: null,
        calculatedVolumeLitres: null,
        isOverflow: false,
        sensorStatus: 'not_applicable',
        dataSource: (wqMethod === 'laboratory_certified' ? 'laboratory_certified' : 'field_test_kit') as DataSourceType,
        waterQuality: {
          parameter: wqParam,
          value: wqValue,
          unit: wqUnit,
          method: wqMethod,
          testingAgency: wqAgency,
          samplingDate: newTimestamp.substring(0, 10),
          complianceStatus: evalRes.status,
          complianceNote: `${evalRes.note} (Ref: ${evalRes.referenceLimit})`,
        },
        notes: newNotes || `Water quality test for ${wqParam}: ${wqValue} ${wqUnit}`,
        isSimulated: false,
      };

      onSaveObservation(obsToSave);
      setNewNotes('');
      setActiveTab('quality');
    }
  };

  const handleExportCSV = () => {
    const csv = exportObservationsToCSV();
    if (!csv) {
      alert('No observation records to export.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jalsetu_monitoring_observations_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSVSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvInput.trim()) {
      alert('Please paste CSV text or select a file.');
      return;
    }

    const res = importObservationsFromCSV(csvInput, selectedAssetId);
    setImportResult(res);
    if (res.success && res.importedCount > 0) {
      setCsvInput('');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Water Storage &amp; Quality Monitoring</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Track recorded rainfall events, storage water levels, and chemical/bacteriological water quality observations.
          </p>
        </div>
        <div className="btn-group">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'chart' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('chart')}
          >
            Trend Charts
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'log' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('log')}
          >
            Level &amp; Rain Log ({filteredObs.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'quality' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('quality')}
          >
            Water Quality ({qualityObs.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'entry' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('entry')}
          >
            + Log Reading
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'import' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('import')}
          >
            CSV Batch Import
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Sensor & Telemetry Integration Architecture Notice */}
        <div className="card" style={{ marginBottom: '1.5rem', background: '#fcfcfc', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>
                Field Observation &amp; Sensor Telemetry Context
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                JalSetu stores transparent field records. Physical ESP32 microcontrollers are integrated via standard CSV serial logs
                (firmware in <code>firmware/jalsetu_esp32_sensor.ino</code>).
                <strong> JalSetu does not fake active live hardware connections.</strong> All entries are labelled by data source.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', background: 'var(--color-sand)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
              Hardware Ready
            </span>
          </div>
        </div>

        {/* Asset Selector */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label htmlFor="monitoring-asset-select" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Monitored Asset:
            </label>
            <select
              id="monitoring-asset-select"
              value={selectedAssetId}
              onChange={e => setSelectedAssetId(e.target.value)}
              style={{ fontSize: '0.875rem', padding: '4px 10px', borderRadius: 'var(--radius)' }}
            >
              <option value="">All Assets (Overview)</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.block} &bull; {a.type.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {currentAsset && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1rem' }}>
              <span><strong>Capacity:</strong> {currentAsset.storageCapacityLitres ? `${currentAsset.storageCapacityLitres.toLocaleString()} L` : 'N/A'}</span>
              <span><strong>Max Depth:</strong> {currentAsset.tankDepthM ? `${currentAsset.tankDepthM} m` : 'N/A'}</span>
              <span><strong>Condition:</strong> <span style={{ textTransform: 'capitalize' }}>{currentAsset.condition}</span></span>
            </div>
          )}
        </div>

        {/* Tab 1: Trend Charts */}
        {activeTab === 'chart' && (
          <div className="card">
            <div className="card-header">
              <h2>Storage Water Level &amp; Rainfall History</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                Temporal correlation between rainfall depth (mm) and stored water depth (m) / volume.
              </p>
            </div>

            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 320 }} aria-label="Water storage and rainfall trend chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-teal)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-teal)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="timestamp" stroke="#666" fontSize={11} />
                    <YAxis yAxisId="left" stroke="var(--color-teal)" fontSize={12} unit="m" />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--color-primary)" fontSize={12} unit="mm" />
                    <Tooltip
                      formatter={(val: any, name: any) => {
                        if (name === 'Water Level') return [`${val} m`, name];
                        if (name === 'Rainfall') return [`${val} mm`, name];
                        return [val, name];
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="waterLevelM"
                      name="Water Level"
                      stroke="var(--color-teal)"
                      fillOpacity={1}
                      fill="url(#colorLevel)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="rainfallMm"
                      name="Rainfall"
                      stroke="var(--color-primary)"
                      fillOpacity={1}
                      fill="url(#colorRain)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No observations logged for this asset yet.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.75rem' }}
                  onClick={() => setActiveTab('entry')}
                >
                  Log First Observation
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Observations Log */}
        {activeTab === 'log' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Observation Records Log</h2>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                {filteredObs.length} logged records
              </span>
            </div>

            {filteredObs.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Asset</th>
                      <th>Rainfall</th>
                      <th>Water Level</th>
                      <th>Est. Volume</th>
                      <th>Data Source</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedObs.slice().reverse().map(obs => {
                      const related = assets.find(a => a.id === obs.assetId);
                      return (
                        <tr key={obs.id}>
                          <td>{obs.timestamp.substring(0, 16).replace('T', ' ')}</td>
                          <td><strong>{related?.name || obs.assetId}</strong></td>
                          <td>{obs.rainfallMm !== null ? `${obs.rainfallMm} mm` : '—'}</td>
                          <td>
                            {obs.waterLevelM !== null ? `${obs.waterLevelM} m` : '—'}
                            {obs.isOverflow && (
                              <span style={{ marginLeft: '4px', color: '#c0392b', fontSize: '10px', fontWeight: 600 }}>
                                OVERFLOW
                              </span>
                            )}
                          </td>
                          <td>{obs.calculatedVolumeLitres !== null ? `${obs.calculatedVolumeLitres.toLocaleString()} L` : '—'}</td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                background: obs.isSimulated ? '#fcf3cf' : '#d4efdf',
                                color: obs.isSimulated ? '#7d6608' : '#145a32',
                              }}
                            >
                              {obs.isSimulated ? 'Simulated' : obs.dataSource.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ maxWidth: '250px', fontSize: '0.8rem' }}>{obs.notes}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ color: '#c0392b', fontSize: '0.75rem' }}
                              onClick={() => {
                                if (confirm('Delete this observation reading?')) {
                                  onDeleteObservation(obs.id);
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No observations logged matching current selection.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Water Quality Testing Log */}
        {activeTab === 'quality' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem', background: '#fcfbf8', borderLeft: '4px solid var(--color-warning)' }}>
              <h3 style={{ fontSize: '0.95rem', color: '#7d6608', marginBottom: '0.35rem' }}>
                Drinking Water Safety &amp; BIS IS 10500:2012 Compliance Context
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                In Purulia district, fluoride contamination in deep groundwater is a documented risk across pockets of Arsha, Jhalda, Balarampur, and Purulia-I (CGWB 2022).
                Harvested rainwater is naturally low in dissolved minerals and fluoride-free, but requires disinfection.
                <strong> Note:</strong> Field test kit (FTK) results provide preliminary screening only; official drinking water certification requires NABL / Public Health Engineering Department (PHED) laboratory testing.
              </p>
            </div>

            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Water Quality Test Log</h2>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEntryMode('quality');
                    setActiveTab('entry');
                  }}
                >
                  + Add Water Quality Test
                </button>
              </div>

              {qualityObs.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Asset</th>
                        <th>Parameter</th>
                        <th>Measured Value</th>
                        <th>Testing Method</th>
                        <th>BIS 10500 Status</th>
                        <th>Agency / Assessor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qualityObs.map(obs => {
                        const q = obs.waterQuality!;
                        const statusColor =
                          q.complianceStatus === 'acceptable'
                            ? '#27864a'
                            : q.complianceStatus === 'exceeded'
                            ? '#c0392b'
                            : '#b7791f';
                        return (
                          <tr key={obs.id}>
                            <td>{q.samplingDate || obs.timestamp.substring(0, 10)}</td>
                            <td>{assets.find(a => a.id === obs.assetId)?.name || obs.assetId}</td>
                            <td><strong>{q.parameter.replace('_', ' ').toUpperCase()}</strong></td>
                            <td>
                              <span style={{ fontSize: '1rem', fontWeight: 600 }}>{String(q.value)}</span> {q.unit}
                            </td>
                            <td>{q.method.replace('_', ' ')}</td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: statusColor,
                                  border: `1px solid ${statusColor}`,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {q.complianceStatus}
                              </span>
                              <div style={{ fontSize: '0.725rem', color: '#666', marginTop: '2px' }}>
                                {q.complianceNote}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>{q.testingAgency || 'Unspecified'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                  <p>No water quality observations recorded yet for this asset.</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '0.75rem' }}
                    onClick={() => {
                      setEntryMode('quality');
                      setActiveTab('entry');
                    }}
                  >
                    Log Water Quality Test
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: New Reading Form */}
        {activeTab === 'entry' && (
          <div className="card" style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div className="card-header">
              <h2>Log Field Observation Reading</h2>
              <div className="btn-group" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${entryMode === 'level' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setEntryMode('level')}
                >
                  Water Level &amp; Rainfall
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${entryMode === 'quality' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setEntryMode('quality')}
                >
                  Water Quality Test
                </button>
              </div>
            </div>

            {formValidationWarning && (
              <div className="notice notice--warning" style={{ marginBottom: '1rem' }}>
                {formValidationWarning}
              </div>
            )}

            <form onSubmit={handleCreateObservation}>
              {/* Asset */}
              <div className="form-group">
                <label htmlFor="log-asset">Target Water Asset *</label>
                <select
                  id="log-asset"
                  required
                  value={selectedAssetId}
                  onChange={e => setSelectedAssetId(e.target.value)}
                >
                  <option value="">Select Asset...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.block})
                    </option>
                  ))}
                </select>
              </div>

              {/* Timestamp */}
              <div className="form-group">
                <label htmlFor="log-time">Observation Date &amp; Time *</label>
                <input
                  id="log-time"
                  type="datetime-local"
                  required
                  value={newTimestamp}
                  onChange={e => setNewTimestamp(e.target.value)}
                />
              </div>

              {entryMode === 'level' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Water Level */}
                    <div className="form-group">
                      <label htmlFor="log-level">Water Depth / Level (metres)</label>
                      <input
                        id="log-level"
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        placeholder="e.g. 1.25"
                        value={newWaterLevel}
                        onChange={e => setNewWaterLevel(e.target.value)}
                      />
                    </div>

                    {/* Rainfall */}
                    <div className="form-group">
                      <label htmlFor="log-rain">Rainfall Event (mm)</label>
                      <input
                        id="log-rain"
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="e.g. 32.5"
                        value={newRainfall}
                        onChange={e => setNewRainfall(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Data Source */}
                  <div className="form-group">
                    <label htmlFor="log-source">Measurement Source / Method *</label>
                    <select
                      id="log-source"
                      value={newSource}
                      onChange={e => setNewSource(e.target.value as DataSourceType)}
                    >
                      <option value="manual_gauge">Manual Staff Gauge / Tape Reading</option>
                      <option value="sensor_esp32">ESP32 Ultrasonic Sensor / Telemetry</option>
                      <option value="estimated">Visual Field Estimate</option>
                      <option value="imported_csv">Imported Serial Log / CSV</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Water Quality Form */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label htmlFor="wq-param">Parameter *</label>
                      <select
                        id="wq-param"
                        value={wqParam}
                        onChange={e => handleWqParamChange(e.target.value as WaterQualityParameter)}
                      >
                        <option value="pH">pH (Acceptable 6.5 – 8.5)</option>
                        <option value="tds_ppm">TDS — Total Dissolved Solids (mg/L)</option>
                        <option value="turbidity_ntu">Turbidity (NTU)</option>
                        <option value="fluoride_mg_l">Fluoride (mg/L — Critical for Purulia)</option>
                        <option value="iron_mg_l">Iron (mg/L)</option>
                        <option value="nitrate_mg_l">Nitrate (mg/L)</option>
                        <option value="coliform_presence">Coliform Bacteria (Presence/Absence)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="wq-val">
                        Measured Value {wqUnit ? `(${wqUnit})` : ''} *
                      </label>
                      <input
                        id="wq-val"
                        type="text"
                        required
                        placeholder="e.g. 7.2 or absent"
                        value={wqValue}
                        onChange={e => setWqValue(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label htmlFor="wq-method">Testing Method *</label>
                      <select
                        id="wq-method"
                        value={wqMethod}
                        onChange={e => setWqMethod(e.target.value as WaterTestingMethod)}
                      >
                        <option value="field_test_kit">Field Test Kit (FTK / Jal Jeevan Mission)</option>
                        <option value="laboratory_certified">NABL / PHED Laboratory Certified Assay</option>
                        <option value="sensor_probe">Digital Probe / Sensor</option>
                        <option value="sensory_observation">Sensory Check (Smell/Color/Taste)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="wq-agency">Testing Agency / Assessor</label>
                      <input
                        id="wq-agency"
                        type="text"
                        placeholder="e.g. Gram Panchayat Water Committee, PHED Lab"
                        value={wqAgency}
                        onChange={e => setWqAgency(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="form-group">
                <label htmlFor="log-notes">Observation Notes / Operational Remarks</label>
                <textarea
                  id="log-notes"
                  rows={2}
                  placeholder="e.g. Measured after heavy afternoon thunderstorm; water clear with no turbidity"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary">
                  Save Observation Record
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('chart')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 5: CSV Batch Import */}
        {activeTab === 'import' && (
          <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="card-header">
              <h2>Import Observation Data via CSV</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                Paste CSV text from manual field logs or ESP32 serial recordings.
                Columns supported: <code>timestamp, rainfallMm, waterLevelM, assetId, notes</code>
              </p>
            </div>

            {importResult && (
              <div
                className={`notice notice--${importResult.success ? 'success' : 'danger'}`}
                style={{ marginBottom: '1rem' }}
              >
                <div>
                  <strong>{importResult.success ? 'Import Completed: ' : 'Import Encountered Issues: '}</strong>
                  Successfully imported {importResult.importedCount} new observations.
                  {importResult.errors.length > 0 && (
                    <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0 }}>
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleImportCSVSubmit}>
              <div className="form-group">
                <label htmlFor="csv-asset-fallback">Default Asset (if assetId column omitted)</label>
                <select
                  id="csv-asset-fallback"
                  value={selectedAssetId}
                  onChange={e => setSelectedAssetId(e.target.value)}
                >
                  <option value="">Select Asset...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.block})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="csv-textarea">CSV Content</label>
                <textarea
                  id="csv-textarea"
                  rows={8}
                  style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                  placeholder={`timestamp,rainfallMm,waterLevelM,notes\n2024-07-01T08:00:00Z,25.0,0.65,Monsoon rain\n2024-07-05T08:00:00Z,12.5,0.72,Steady shower`}
                  value={csvInput}
                  onChange={e => setCsvInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Validate &amp; Import Records
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCsvInput(`timestamp,rainfallMm,waterLevelM,notes\n2024-08-01T08:00:00Z,35.0,0.82,Sample imported reading\n2024-08-08T08:00:00Z,18.0,0.90,Sample post-rain level`)}
                >
                  Load Sample CSV
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
