import React, { useState } from 'react';
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
import type { MonitoringObservation, Asset, DataSourceType } from '../types';
import { generateId, exportObservationsToCSV } from '../lib/storage';
import { calculateRectangularTankVolume, validateWaterLevelReading } from '../lib/calculations';
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
  const [activeTab, setActiveTab] = useState<'log' | 'chart' | 'entry'>('chart');

  // Form State
  const [newRainfall, setNewRainfall] = useState<string>('');
  const [newWaterLevel, setNewWaterLevel] = useState<string>('');
  const [newTimestamp, setNewTimestamp] = useState<string>(
    new Date().toISOString().substring(0, 16)
  );
  const [newSource, setNewSource] = useState<DataSourceType>('manual_gauge');
  const [newNotes, setNewNotes] = useState<string>('');
  const [formValidationWarning, setFormValidationWarning] = useState<string | null>(null);

  // Selected asset
  const currentAsset = assets.find(a => a.id === selectedAssetId);

  // Observations for selected asset or all
  const filteredObs = selectedAssetId
    ? observations.filter(o => o.assetId === selectedAssetId)
    : observations;

  const sortedObs = [...filteredObs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Prepare chart series
  const chartData = sortedObs.map(o => ({
    timestamp: o.timestamp.substring(5, 16).replace('T', ' '),
    rainfallMm: o.rainfallMm ?? 0,
    waterLevelM: o.waterLevelM ?? 0,
    volumeLitres: o.calculatedVolumeLitres ?? 0,
    isOverflow: o.isOverflow ? 1 : 0,
    source: o.dataSource,
  }));

  const handleCreateObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      alert('Please select an asset first.');
      return;
    }

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

    // Storage calculation
    let calcVolume: number | null = null;
    let overflow = false;

    if (depth !== null && currentAsset) {
      if (
        currentAsset.tankLengthM &&
        currentAsset.tankWidthM &&
        currentAsset.type === 'rooftop_rwh'
      ) {
        // Vertical-sided rectangular tank formula
        const res = calculateRectangularTankVolume(
          currentAsset.tankLengthM,
          currentAsset.tankWidthM,
          depth
        );
        calcVolume = res.volumeLitres;
      } else if (currentAsset.storageCapacityLitres && currentAsset.tankDepthM) {
        // Proportional estimation for calibrated tank
        calcVolume = Math.round(
          (depth / currentAsset.tankDepthM) * currentAsset.storageCapacityLitres
        );
      }

      if (currentAsset.tankDepthM && depth >= currentAsset.tankDepthM) {
        overflow = true;
      }
    }

    const newObs: MonitoringObservation = {
      id: `obs-${generateId().substring(0, 8)}`,
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

    onSaveObservation(newObs);
    setNewRainfall('');
    setNewWaterLevel('');
    setNewNotes('');
    setActiveTab('chart');
  };

  const handleExportCSV = () => {
    const csv = exportObservationsToCSV();
    if (!csv) {
      alert('No observations to export.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `jalsetu_purulia_observations_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Rainfall &amp; Water-Level Monitoring</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Track rainfall events, storage depths, overflow events, and volume estimates.
          </p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            Export Observations CSV
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setActiveTab('entry')}
          >
            + Log Reading
          </button>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Scientific / Hydrological Distinction Alert */}
        <div className="notice notice--info" style={{ marginBottom: '1.25rem' }}>
          <div>
            <strong>Important Hydrological Distinction: </strong>
            <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0 }}>
              <li><strong>Measured Rainfall:</strong> Precipitation collected via standard rain gauge (mm).</li>
              <li><strong>Measured Water Depth:</strong> Water level in a specific storage tank or pond (m).</li>
              <li><strong>Calculated Storage:</strong> Geometric volume in a calibrated tank (Litres).</li>
              <li>
                <strong>Aquifer Recharge:</strong> A tank sensor measures <em>surface storage</em>, NOT direct groundwater recharge.
                Groundwater level changes require dedicated piezometer or well measurements.
              </li>
            </ul>
          </div>
        </div>

        {/* Asset Selector */}
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label htmlFor="select-asset" style={{ fontWeight: 600, fontSize: '0.875rem', minWidth: '120px' }}>
              Select Asset:
            </label>
            <select
              id="select-asset"
              style={{ flex: 1, minWidth: '240px' }}
              value={selectedAssetId}
              onChange={e => setSelectedAssetId(e.target.value)}
            >
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type.replace('_', ' ')}) &bull; {a.block || 'No block'}
                </option>
              ))}
            </select>
          </div>

          {currentAsset && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span>
                <strong>Geometry: </strong>
                {currentAsset.tankLengthM && currentAsset.tankWidthM
                  ? `${currentAsset.tankLengthM}m (L) × ${currentAsset.tankWidthM}m (W) × ${currentAsset.tankDepthM ?? '?'}m (Depth)`
                  : 'Irregular pond (Rectangular formula not applicable)'}
              </span>
              <span>
                <strong>Calibrated Capacity: </strong>
                {currentAsset.storageCapacityLitres ? `${currentAsset.storageCapacityLitres.toLocaleString()} L` : 'Uncalibrated'}
              </span>
            </div>
          )}
        </div>

        {/* View Tabs */}
        <div className="tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            Trend Graphs ({sortedObs.length} points)
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'log' ? 'active' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            Observations Table
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'entry' ? 'active' : ''}`}
            onClick={() => setActiveTab('entry')}
          >
            Log New Observation
          </button>
        </div>

        {activeTab === 'chart' && (
          <div className="card">
            <div className="card-header">
              <h2>Historical Water Level &amp; Rainfall Response</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Water depth (m) vs daily rainfall events (mm) for {currentAsset?.name || 'selected asset'}.
              </p>
            </div>

            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 320 }} aria-label="Water monitoring trend chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#666"
                      fontSize={11}
                      angle={-20}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis yAxisId="water" stroke="var(--color-teal)" fontSize={12} unit=" m" />
                    <YAxis yAxisId="rain" orientation="right" stroke="var(--color-primary)" fontSize={12} unit=" mm" />
                    <Tooltip
                      formatter={(val: any, name: any) => {
                        if (name === 'Water Depth') return [`${val} m`, name];
                        if (name === 'Rainfall') return [`${val} mm`, name];
                        if (name === 'Storage Volume') return [`${val.toLocaleString()} L`, name];
                        return [val, name];
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      yAxisId="water"
                      type="monotone"
                      dataKey="waterLevelM"
                      name="Water Depth"
                      stroke="var(--color-teal)"
                      fill="var(--color-teal-light)"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="rain"
                      type="monotone"
                      dataKey="rainfallMm"
                      name="Rainfall"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary-light)"
                      fillOpacity={0.2}
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                <p>No observations recorded for this asset yet.</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('entry')}>
                  Add First Reading
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Observations Log ({sortedObs.length} records)</h2>
            </div>

            {sortedObs.length === 0 ? (
              <div className="empty-state">
                <p>No observations logged for this asset.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Measured Rainfall</th>
                      <th>Measured Water Level</th>
                      <th>Calculated Storage</th>
                      <th>Overflow Status</th>
                      <th>Data Source</th>
                      <th>Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedObs.map(obs => (
                      <tr key={obs.id}>
                        <td>
                          {obs.timestamp.replace('T', ' ').substring(0, 16)}
                          {obs.isSimulated && (
                            <span className="badge badge--simulated" style={{ marginLeft: '4px' }}>Sim</span>
                          )}
                        </td>
                        <td>{obs.rainfallMm !== null ? `${obs.rainfallMm} mm` : '—'}</td>
                        <td>{obs.waterLevelM !== null ? `${obs.waterLevelM} m` : '—'}</td>
                        <td>
                          {obs.calculatedVolumeLitres !== null
                            ? `${obs.calculatedVolumeLitres.toLocaleString()} L`
                            : 'Not configured'}
                        </td>
                        <td>
                          {obs.isOverflow ? (
                            <span className="badge badge--poor">Overflow Active</span>
                          ) : (
                            <span className="badge badge--good">Normal</span>
                          )}
                        </td>
                        <td>
                          <code>{obs.dataSource}</code>
                        </td>
                        <td>{obs.notes || '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'entry' && (
          <div className="card" style={{ maxWidth: '600px' }}>
            <div className="card-header">
              <h2>Log Observation Reading</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Record manual gauge measurements or calibrate sensor imports for {currentAsset?.name}.
              </p>
            </div>

            {formValidationWarning && (
              <div className="notice notice--warning" style={{ marginBottom: '1rem' }}>
                {formValidationWarning}
              </div>
            )}

            <form onSubmit={handleCreateObservation}>
              <div className="form-group">
                <label htmlFor="obs-timestamp">Date and Time *</label>
                <input
                  id="obs-timestamp"
                  type="datetime-local"
                  required
                  value={newTimestamp}
                  onChange={e => setNewTimestamp(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="obs-rain">Rainfall Event (mm)</label>
                  <input
                    id="obs-rain"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 18.5"
                    value={newRainfall}
                    onChange={e => setNewRainfall(e.target.value)}
                  />
                  <span className="form-hint">Leave blank if no rain fell or not measured.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="obs-water">Water Depth (metres)</label>
                  <input
                    id="obs-water"
                    type="number"
                    step="0.01"
                    min="0"
                    max="50"
                    placeholder="e.g. 1.25"
                    value={newWaterLevel}
                    onChange={e => setNewWaterLevel(e.target.value)}
                  />
                  <span className="form-hint">Measured from tank base to surface.</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="obs-source">Data Source *</label>
                <select
                  id="obs-source"
                  value={newSource}
                  onChange={e => setNewSource(e.target.value as DataSourceType)}
                >
                  <option value="manual_gauge">Manual Rain Gauge / Dipstick Measurement</option>
                  <option value="sensor_esp32">ESP32 Ultrasonic Sensor Reading</option>
                  <option value="estimated">Estimated from Catchment Runoff</option>
                  <option value="simulated">Demonstration / Simulated Data</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="obs-notes">Observations / Field Notes</label>
                <textarea
                  id="obs-notes"
                  placeholder="e.g. Rain was intense over 45 minutes; silt trap inspected and functioning."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                />
              </div>

              <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('chart')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Observation
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
