import React, { useState } from 'react';
import {
  calculateRainwaterHarvest,
  RUNOFF_COEFFICIENTS,
  calculateRectangularTankDimensions,
  calculateTrapezoidalPondDimensions,
  simulateMonthlyWaterBalance,
  PURULIA_MONTHLY_NORMAL_RAINFALL,
} from '../lib/calculations';
import type { PreliminaryStructureType, StructureDimensions } from '../types';
import { NoticeBanner } from '../components/NoticeBanner';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CalculatorPageProps {
  isSimulated: boolean;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ isSimulated }) => {
  // Main Top-level View Tab
  const [activeTab, setActiveTab] = useState<'yield' | 'dimensions' | 'balance'>('yield');

  // Tab 1: Runoff & Yield States
  const [calcMode, setCalcMode] = useState<'event' | 'annual'>('event');
  const [rainfallMm, setRainfallMm] = useState<string>('30');
  const [catchmentAreaSqm, setCatchmentAreaSqm] = useState<string>('150');
  const [surfacePreset, setSurfacePreset] = useState<string>('rcc_roof');
  const [efficiency, setEfficiency] = useState<string>('0.85');
  const [storageCapacity, setStorageCapacity] = useState<string>('5000');
  const [firstFlushMm, setFirstFlushMm] = useState<string>('1.0');

  // Demand Comparison States
  const [includeDemand, setIncludeDemand] = useState<boolean>(true);
  const [householdMembers, setHouseholdMembers] = useState<string>('5');
  const [lpcd, setLpcd] = useState<string>('15'); // 15 LPCD drinking/cooking
  const [dryDays, setDryDays] = useState<string>('90');

  // Tab 2: Structure Sizing & Dimensions States
  const [dimStructureType, setDimStructureType] = useState<PreliminaryStructureType>('rectangular_tank');
  const [dimTargetLitres, setDimTargetLitres] = useState<string>('15000');
  const [dimDepthM, setDimDepthM] = useState<string>('1.8');
  const [dimFreeboardM, setDimFreeboardM] = useState<string>('0.25');
  const [dimSideSlopeZ, setDimSideSlopeZ] = useState<string>('1.5');
  const [dimWallThicknessM, setDimWallThicknessM] = useState<string>('0.25');
  const [dimClearanceBufferM, setDimClearanceBufferM] = useState<string>('1.0');
  const [dimensionResult, setDimensionResult] = useState<StructureDimensions | null>(() => {
    try {
      return calculateRectangularTankDimensions({
        targetUsableLitres: 15000,
        waterDepthM: 1.8,
        freeboardM: 0.25,
      });
    } catch {
      return null;
    }
  });

  // Tab 3: Monthly Water Balance Simulation States
  const [simCatchmentSqm, setSimCatchmentSqm] = useState<string>('200');
  const [simRunoffCoeff, setSimRunoffCoeff] = useState<string>('0.85');
  const [simStorageLitres, setSimStorageLitres] = useState<string>('20000');
  const [simDailyDemandLitres, setSimDailyDemandLitres] = useState<string>('120');

  // Handle Preset Selection
  const handlePresetChange = (presetKey: string) => {
    setSurfacePreset(presetKey);
    if (presetKey !== 'custom' && RUNOFF_COEFFICIENTS[presetKey]) {
      setEfficiency(String(RUNOFF_COEFFICIENTS[presetKey].coefficient));
    }
  };

  // Handle Mode Change
  const handleModeChange = (mode: 'event' | 'annual') => {
    setCalcMode(mode);
    if (mode === 'annual') {
      setRainfallMm('1240'); // Purulia 30-year IMD normal
      setFirstFlushMm('10.0'); // Cumulative seasonal first-flush/diversion
    } else {
      setRainfallMm('30'); // Typical 24-hr design storm event
      setFirstFlushMm('1.0');
    }
  };

  // Handle Sizing Calculation
  const handleCalculateDimensions = () => {
    const targetL = parseFloat(dimTargetLitres);
    const depth = parseFloat(dimDepthM);
    const freeboard = parseFloat(dimFreeboardM);
    const slopeZ = parseFloat(dimSideSlopeZ);
    const wallThick = parseFloat(dimWallThicknessM);
    const buffer = parseFloat(dimClearanceBufferM);

    if (isNaN(targetL) || targetL <= 0 || isNaN(depth) || depth <= 0) {
      alert('Please enter valid target capacity and depth.');
      return;
    }

    try {
      let res: StructureDimensions;
      if (dimStructureType === 'farm_pond_hapa') {
        res = calculateTrapezoidalPondDimensions({
          targetUsableLitres: targetL,
          waterDepthM: depth,
          freeboardM: !isNaN(freeboard) ? freeboard : 0.5,
          sideSlopeZ: !isNaN(slopeZ) ? slopeZ : 1.5,
          bermBufferM: !isNaN(buffer) ? buffer : 1.5,
        });
      } else {
        res = calculateRectangularTankDimensions({
          targetUsableLitres: targetL,
          waterDepthM: depth,
          freeboardM: !isNaN(freeboard) ? freeboard : 0.25,
          wallThicknessM: !isNaN(wallThick) ? wallThick : 0.25,
          maintenanceBufferM: !isNaN(buffer) ? buffer : 1.0,
        });
      }
      setDimensionResult(res);
    } catch (err: any) {
      alert(`Dimension calculation error: ${err.message}`);
    }
  };

  // Parse Inputs for Tab 1
  const rain = parseFloat(rainfallMm);
  const area = parseFloat(catchmentAreaSqm);
  const eff = parseFloat(efficiency);
  const cap = storageCapacity.trim() === '' ? null : parseFloat(storageCapacity);
  const ff = firstFlushMm.trim() === '' ? 0 : parseFloat(firstFlushMm);

  const members = parseInt(householdMembers, 10);
  const perCapita = parseFloat(lpcd);
  const days = parseInt(dryDays, 10);

  const dailyDemand =
    includeDemand && !isNaN(members) && !isNaN(perCapita) && members > 0 && perCapita > 0
      ? members * perCapita
      : null;

  let yieldResult = null;
  let validationError: string | null = null;

  if (isNaN(rain) || rain < 0) {
    validationError = 'Rainfall depth must be a non-negative number.';
  } else if (isNaN(area) || area < 0) {
    validationError = 'Catchment area must be a non-negative number.';
  } else if (isNaN(eff) || eff < 0 || eff > 1) {
    validationError = 'Runoff coefficient must be between 0.00 and 1.00.';
  } else if (cap !== null && (isNaN(cap) || cap < 0)) {
    validationError = 'Storage capacity cannot be negative.';
  } else if (isNaN(ff) || ff < 0) {
    validationError = 'First flush diversion cannot be negative.';
  } else {
    try {
      yieldResult = calculateRainwaterHarvest({
        rainfallMm: rain,
        catchmentAreaSqm: area,
        collectionEfficiency: eff,
        storageCapacityLitres: cap,
        firstFlushMm: ff,
        demandDailyLitres: dailyDemand,
        demandPeriodDays: !isNaN(days) && days > 0 ? days : null,
      });
    } catch (err: any) {
      validationError = err.message;
    }
  }

  // Parse Inputs for Tab 3 (Monthly Water Balance)
  const simArea = Math.max(10, parseFloat(simCatchmentSqm) || 100);
  const simCoeff = Math.min(1, Math.max(0.1, parseFloat(simRunoffCoeff) || 0.85));
  const simCap = Math.max(1000, parseFloat(simStorageLitres) || 15000);
  const simDemand = Math.max(10, parseFloat(simDailyDemandLitres) || 100);

  const monthlySimResult = simulateMonthlyWaterBalance(simArea, simCoeff, simCap, simDemand);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Rainwater Harvesting &amp; Sizing Calculator</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Transparent runoff calculations, preliminary structure dimensioning, land footprint models, and 12-month water balance curves.
          </p>
        </div>
        <div className="btn-group">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'yield' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('yield')}
          >
            Runoff Yield &amp; Demand
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'dimensions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('dimensions')}
          >
            Structure Dimensions &amp; Footprint
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'balance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('balance')}
          >
            12-Month Water Balance
          </button>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* TAB 1: RUNOFF YIELD & DEMAND */}
        {activeTab === 'yield' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Input Parameters Card */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Catchment &amp; Precipitation Inputs</h2>
                {/* Mode Selector */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--color-sand)', padding: '3px', borderRadius: 'var(--radius)' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${calcMode === 'event' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    onClick={() => handleModeChange('event')}
                  >
                    Single Storm
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${calcMode === 'annual' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    onClick={() => handleModeChange('annual')}
                  >
                    Annual Monsoon
                  </button>
                </div>
              </div>

              {validationError && (
                <div className="notice notice--warning" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {validationError}
                </div>
              )}

              {/* Surface Presets */}
              <div className="form-group">
                <label htmlFor="calc-surface-preset">Catchment Surface Preset</label>
                <select
                  id="calc-surface-preset"
                  value={surfacePreset}
                  onChange={e => handlePresetChange(e.target.value)}
                >
                  {Object.entries(RUNOFF_COEFFICIENTS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label} (C = {val.coefficient})
                    </option>
                  ))}
                  <option value="custom">Custom Surface (Manual Runoff Entry)</option>
                </select>
                {surfacePreset !== 'custom' && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {RUNOFF_COEFFICIENTS[surfacePreset]?.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Rainfall */}
                <div className="form-group">
                  <label htmlFor="calc-rain">
                    {calcMode === 'event' ? 'Storm Rainfall Depth (mm)' : 'Annual Rainfall (mm)'}
                  </label>
                  <input
                    id="calc-rain"
                    type="number"
                    min="0"
                    step="1"
                    value={rainfallMm}
                    onChange={e => setRainfallMm(e.target.value)}
                  />
                  <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    {calcMode === 'event' ? 'e.g. 25–50 mm 24-hr event' : 'Purulia IMD normal: ~1,240–1,346 mm'}
                  </small>
                </div>

                {/* Catchment Area */}
                <div className="form-group">
                  <label htmlFor="calc-area">Catchment Area (m²)</label>
                  <input
                    id="calc-area"
                    type="number"
                    min="0"
                    step="1"
                    value={catchmentAreaSqm}
                    onChange={e => setCatchmentAreaSqm(e.target.value)}
                  />
                  <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    100 m² ≈ 1,076 sq ft roof slab
                  </small>
                </div>

                {/* Runoff Efficiency */}
                <div className="form-group">
                  <label htmlFor="calc-eff">Runoff Coefficient (C: 0.0–1.0)</label>
                  <input
                    id="calc-eff"
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={efficiency}
                    disabled={surfacePreset !== 'custom'}
                    onChange={e => setEfficiency(e.target.value)}
                  />
                </div>

                {/* First Flush */}
                <div className="form-group">
                  <label htmlFor="calc-first-flush">First-Flush Loss (mm)</label>
                  <input
                    id="calc-first-flush"
                    type="number"
                    min="0"
                    step="0.5"
                    value={firstFlushMm}
                    onChange={e => setFirstFlushMm(e.target.value)}
                  />
                  <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    1–2 mm initial foul flush discarded
                  </small>
                </div>
              </div>

              {/* Proposed Storage Capacity */}
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label htmlFor="calc-cap">Existing / Proposed Storage Capacity (Litres)</label>
                <input
                  id="calc-cap"
                  type="number"
                  min="0"
                  step="500"
                  placeholder="Optional — leave empty to calculate unconstrained yield"
                  value={storageCapacity}
                  onChange={e => setStorageCapacity(e.target.value)}
                />
              </div>

              {/* Demand Comparison Box */}
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 'var(--radius)', marginTop: '1rem', border: '1px solid var(--color-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeDemand}
                    onChange={e => setIncludeDemand(e.target.checked)}
                  />
                  Compare with Household / Institutional Demand Model
                </label>

                {includeDemand && (
                  <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="calc-members" style={{ fontSize: '0.75rem' }}>Beneficiaries</label>
                      <input
                        id="calc-members"
                        type="number"
                        min="1"
                        value={householdMembers}
                        onChange={e => setHouseholdMembers(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="calc-lpcd" style={{ fontSize: '0.75rem' }}>Litres / Person / Day</label>
                      <input
                        id="calc-lpcd"
                        type="number"
                        min="5"
                        value={lpcd}
                        onChange={e => setLpcd(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="calc-days" style={{ fontSize: '0.75rem' }}>Dry Days Target</label>
                      <input
                        id="calc-days"
                        type="number"
                        min="1"
                        value={dryDays}
                        onChange={e => setDryDays(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Result Card */}
            <div style={{ position: 'sticky', top: '1rem' }}>
              <div className="card" style={{ borderTop: '4px solid var(--color-teal)' }}>
                <div className="card-header">
                  <h2>Harvesting &amp; Storage Output</h2>
                  <span style={{ fontSize: '0.75rem', background: 'var(--color-sand)', padding: '2px 6px', borderRadius: '4px' }}>
                    Theoretical Estimate
                  </span>
                </div>

                {yieldResult ? (
                  <div>
                    {/* Gross vs Usable Metric */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Gross Theoretical Runoff</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {yieldResult.grossRunoffLitres?.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>L</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          {(yieldResult.grossRunoffLitres! / 1000).toFixed(2)} m³ before losses
                        </div>
                      </div>

                      <div style={{ background: '#eafaf1', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid #a9dfbf' }}>
                        <span style={{ fontSize: '0.75rem', color: '#145a32', textTransform: 'uppercase' }}>Net Usable (Clean)</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#145a32' }}>
                          {yieldResult.harvestableVolumeLitres.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>L</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#145a32' }}>
                          {yieldResult.harvestableVolumeM3.toFixed(2)} m³ after first-flush
                        </div>
                      </div>
                    </div>

                    {/* Sizing & Storage Breakdown */}
                    <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span>First-Flush Diverted (Dirty water discarded):</span>
                        <strong>{yieldResult.firstFlushDivertedLitres?.toLocaleString()} L</strong>
                      </div>

                      {yieldResult.storageSufficient !== null && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span>Storage Capacity:</span>
                            <strong>{cap?.toLocaleString()} L</strong>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span>Actual Usable Stored Water:</span>
                            <strong style={{ color: 'var(--color-teal)' }}>{yieldResult.netUsableLitres?.toLocaleString()} L</strong>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span>Potential Tank Overflow:</span>
                            <strong style={{ color: yieldResult.excessVolumeLitres! > 0 ? '#c0392b' : '#27864a' }}>
                              {yieldResult.excessVolumeLitres! > 0 ? `${yieldResult.excessVolumeLitres?.toLocaleString()} L` : 'Zero (Tank sufficient)'}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Overflow Alert */}
                    {yieldResult.excessVolumeLitres !== null && yieldResult.excessVolumeLitres > 0 && (
                      <div
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius)',
                          background: '#fef9e7',
                          borderLeft: '4px solid #b7791f',
                          fontSize: '0.8125rem',
                          marginBottom: '1rem',
                          lineHeight: 1.45,
                        }}
                      >
                        <strong>Storage Bottleneck Identified: </strong>
                        Your tank capacity ({cap?.toLocaleString()} L) will overflow by approximately <strong>{yieldResult.excessVolumeLitres.toLocaleString()} Litres</strong>.
                        Consider sizing a larger cistern or directing overflow into a farm pond or groundwater recharge trench.
                      </div>
                    )}

                    {/* Demand & Security Output */}
                    {includeDemand && yieldResult.daysOfSupplySupported !== null && (
                      <div style={{ background: 'var(--color-sand)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)', marginBottom: '0.4rem' }}>
                          Household Water Security Impact
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                          At a consumption rate of <strong>{perCapita} LPCD</strong> for {members} people (<strong>{dailyDemand} L/day</strong>), your usable stored water ({yieldResult.netUsableLitres?.toLocaleString()} L) provides:
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.4rem' }}>
                          {yieldResult.daysOfSupplySupported} Days of Drinking Security
                        </div>
                        {yieldResult.demandDeficitLitres !== null && yieldResult.demandDeficitLitres !== undefined && (
                          <div style={{ fontSize: '0.75rem', color: yieldResult.demandDeficitLitres > 0 ? '#c0392b' : '#27864a', marginTop: '0.25rem' }}>
                            {yieldResult.demandDeficitLitres > 0
                              ? `Deficit of ${yieldResult.demandDeficitLitres.toLocaleString()} L over the targeted ${days}-day dry period.`
                              : `Full ${days}-day target covered with reserve buffer.`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Formula Verification Box */}
                    <div style={{ background: '#fcfcfc', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.75rem', color: '#666' }}>
                      <strong>Mathematical Verification:</strong><br />
                      <code>
                        V = P × A × C = {rain} mm × {area} m² × {eff} = {yieldResult.grossRunoffLitres?.toLocaleString()} L
                      </code>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Enter valid parameters to calculate harvestable yield.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STRUCTURE DIMENSIONS & LAND FOOTPRINT */}
        {activeTab === 'dimensions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', alignItems: 'start' }}>
            <div className="card">
              <div className="card-header">
                <h2>Structure Dimensioning &amp; Land Footprint Engine</h2>
                <span style={{ fontSize: '0.75rem', background: 'var(--color-sand)', padding: '2px 6px', borderRadius: '4px' }}>
                  Preliminary Civil Sizing
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="dim-type">Selected Structure Category</label>
                <select
                  id="dim-type"
                  value={dimStructureType}
                  onChange={e => setDimStructureType(e.target.value as PreliminaryStructureType)}
                >
                  <option value="rectangular_tank">Rectangular Storage Tank (Masonry / RCC)</option>
                  <option value="farm_pond_hapa">Excavated Farm Pond / Hapa (Sloped Earthen Embankment)</option>
                </select>
                <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  {dimStructureType === 'rectangular_tank'
                    ? 'Sized with freeboard, dead storage sump, wall thickness, and perimeter maintenance clearance.'
                    : 'Calculated using prismoidal excavation volume with 1.5:1 side slopes and embankment berm buffers.'}
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="dim-target">Target Usable Storage (Litres)</label>
                  <input
                    id="dim-target"
                    type="number"
                    min="500"
                    step="500"
                    value={dimTargetLitres}
                    onChange={e => setDimTargetLitres(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dim-depth">Effective Water Depth (m)</label>
                  <input
                    id="dim-depth"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="6.0"
                    value={dimDepthM}
                    onChange={e => setDimDepthM(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dim-freeboard">Design Freeboard (m)</label>
                  <input
                    id="dim-freeboard"
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1.5"
                    value={dimFreeboardM}
                    onChange={e => setDimFreeboardM(e.target.value)}
                  />
                  <small style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>Safety margin above water surface</small>
                </div>

                {dimStructureType === 'rectangular_tank' ? (
                  <div className="form-group">
                    <label htmlFor="dim-wall">Wall Thickness (m)</label>
                    <input
                      id="dim-wall"
                      type="number"
                      step="0.05"
                      min="0.15"
                      max="0.6"
                      value={dimWallThicknessM}
                      onChange={e => setDimWallThicknessM(e.target.value)}
                    />
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>Standard 250mm brick/RCC wall</small>
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="dim-slope">Side Slope Z:1 (H:V)</label>
                    <input
                      id="dim-slope"
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="3.0"
                      value={dimSideSlopeZ}
                      onChange={e => setDimSideSlopeZ(e.target.value)}
                    />
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>1.5:1 typical for Purulia red earth</small>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="dim-clearance">
                  {dimStructureType === 'rectangular_tank' ? 'Perimeter Access Clearance (m)' : 'Embankment Berm Buffer (m)'}
                </label>
                <input
                  id="dim-clearance"
                  type="number"
                  step="0.25"
                  min="0.5"
                  max="4.0"
                  value={dimClearanceBufferM}
                  onChange={e => setDimClearanceBufferM(e.target.value)}
                />
                <small style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                  Surrounding land needed for maintenance access, inspection, or soil berm stability
                </small>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCalculateDimensions}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Calculate Preliminary Dimensions &amp; Footprint
              </button>
            </div>

            {/* Dimensioning Results Card */}
            <div>
              {dimensionResult ? (
                <div className="card" style={{ borderTop: '4px solid var(--color-primary)' }}>
                  <div className="card-header">
                    <h2>Preliminary Dimensional Specifications</h2>
                    <span style={{ fontSize: '0.75rem', background: '#d4efdf', color: '#145a32', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      CALCULATED
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#666', textTransform: 'uppercase' }}>Internal Excavation Plan</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        {dimensionResult.lengthM}m × {dimensionResult.widthM}m
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#555' }}>
                        Total Depth: {dimensionResult.depthM} m
                      </div>
                    </div>

                    <div style={{ background: '#eafaf1', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid #a9dfbf' }}>
                      <span style={{ fontSize: '0.72rem', color: '#145a32', textTransform: 'uppercase' }}>Usable Storage Volume</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#145a32' }}>
                        {dimensionResult.usableVolumeLitres.toLocaleString()} L
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#196f3d' }}>
                        Gross Excavation: {dimensionResult.grossVolumeM3} m³
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                      Land Footprint Distinction:
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span>Internal Storage Plan Area:</span>
                      <strong>{dimensionResult.internalFootprintSqm} m²</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span>External Structure Footprint:</span>
                      <strong>{dimensionResult.externalStructureFootprintSqm} m²</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', background: '#ebf5fb', borderRadius: '4px', paddingLeft: '8px', paddingRight: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#1b4f72' }}>Total Land Requirement (with buffer):</span>
                      <strong style={{ fontSize: '1rem', color: '#1b4f72' }}>{dimensionResult.totalLandRequirementSqm} m²</strong>
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-sand)', padding: '0.85rem', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    <strong>Engineering Notes &amp; Safety Disclaimers:</strong>
                    <p style={{ marginTop: '0.25rem' }}>{dimensionResult.notes}</p>
                    <p style={{ marginTop: '0.25rem', fontStyle: 'italic', color: '#888' }}>
                      * Preliminary sizing estimate for spatial planning only. Structural wall reinforcement, base slab design, soil bearing capacity checks, and overflow spillways require qualified civil engineering drawings.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                  <p>Configure parameters on the left and click calculate to view preliminary structural dimensions.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 12-MONTH WATER BALANCE */}
        {activeTab === 'balance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Balance Simulation Controls */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>Purulia 12-Month Climatological Water Balance Simulation</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                    Models monthly precipitation inflow, storage limits, overflow losses, and dry-period supply reliability based on Purulia 30-year IMD climatology (~1,346 mm normal).
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', background: '#e8daef', color: '#5b2c6f', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  SEQUENTIAL BALANCE MODEL
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="sim-area" style={{ fontSize: '0.8rem' }}>Catchment Area (m²)</label>
                  <input
                    id="sim-area"
                    type="number"
                    min="10"
                    value={simCatchmentSqm}
                    onChange={e => setSimCatchmentSqm(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="sim-coeff" style={{ fontSize: '0.8rem' }}>Runoff Coeff (C)</label>
                  <input
                    id="sim-coeff"
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1.0"
                    value={simRunoffCoeff}
                    onChange={e => setSimRunoffCoeff(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="sim-storage" style={{ fontSize: '0.8rem' }}>Storage Capacity (L)</label>
                  <input
                    id="sim-storage"
                    type="number"
                    step="1000"
                    min="1000"
                    value={simStorageLitres}
                    onChange={e => setSimStorageLitres(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="sim-demand" style={{ fontSize: '0.8rem' }}>Daily Demand (L/day)</label>
                  <input
                    id="sim-demand"
                    type="number"
                    step="10"
                    min="10"
                    value={simDailyDemandLitres}
                    onChange={e => setSimDailyDemandLitres(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Simulation KPI Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: '#eafaf1', padding: '10px 14px', borderRadius: 'var(--radius)', borderLeft: '4px solid #27864a' }}>
                <div style={{ fontSize: '0.72rem', color: '#145a32', textTransform: 'uppercase', fontWeight: 600 }}>Annual Harvest Inflow</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#145a32' }}>
                  {monthlySimResult.totalAnnualInflowLitres.toLocaleString()} L
                </div>
                <div style={{ fontSize: '0.72rem', color: '#555' }}>From {monthlySimResult.totalAnnualRainfallMm} mm rainfall</div>
              </div>

              <div style={{ background: '#ebf5fb', padding: '10px 14px', borderRadius: 'var(--radius)', borderLeft: '4px solid #2980b9' }}>
                <div style={{ fontSize: '0.72rem', color: '#1b4f72', textTransform: 'uppercase', fontWeight: 600 }}>Total Annual Demand</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1b4f72' }}>
                  {monthlySimResult.totalAnnualDemandLitres.toLocaleString()} L
                </div>
                <div style={{ fontSize: '0.72rem', color: '#555' }}>
                  Supplied: {monthlySimResult.totalAnnualSuppliedLitres.toLocaleString()} L
                </div>
              </div>

              <div style={{ background: '#fef9e7', padding: '10px 14px', borderRadius: 'var(--radius)', borderLeft: '4px solid #b7791f' }}>
                <div style={{ fontSize: '0.72rem', color: '#7d6608', textTransform: 'uppercase', fontWeight: 600 }}>Monsoon Overflow Spill</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#7d6608' }}>
                  {monthlySimResult.totalAnnualOverflowLitres.toLocaleString()} L
                </div>
                <div style={{ fontSize: '0.72rem', color: '#555' }}>Uncaptured excess runoff</div>
              </div>

              <div style={{ background: monthlySimResult.totalAnnualDeficitLitres > 0 ? '#fdedec' : '#eafaf1', padding: '10px 14px', borderRadius: 'var(--radius)', borderLeft: `4px solid ${monthlySimResult.totalAnnualDeficitLitres > 0 ? '#c0392b' : '#27864a'}` }}>
                <div style={{ fontSize: '0.72rem', color: monthlySimResult.totalAnnualDeficitLitres > 0 ? '#78281f' : '#145a32', textTransform: 'uppercase', fontWeight: 600 }}>
                  Dry-Season Security Rate
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: monthlySimResult.totalAnnualDeficitLitres > 0 ? '#78281f' : '#145a32' }}>
                  {monthlySimResult.drySeasonReliabilityPercent}%
                </div>
                <div style={{ fontSize: '0.72rem', color: '#555' }}>
                  {monthlySimResult.peakDeficitMonth ? `Peak deficit in ${monthlySimResult.peakDeficitMonth}` : 'No dry deficit'}
                </div>
              </div>
            </div>

            {/* Monthly Balance Curves (Chart) */}
            <div className="card">
              <div className="card-header">
                <h2>Seasonal Dynamics: Inflow vs. Stored Volume vs. Deficit</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                  Notice the sharp monsoon influx (June–September) followed by seven dry months where stored water depletes.
                </p>
              </div>

              <div style={{ width: '100%', height: 320 }} aria-label="Monthly water balance chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySimResult.monthlyPoints} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(val: any) => `${Number(val).toLocaleString()} L`}
                      labelFormatter={(lbl: string) => `Month: ${lbl}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="inflowLitres" name="Monthly Rainfall Inflow (L)" stroke="#2980b9" fill="#aed6f1" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="storedLitres" name="Water in Storage Tank (L)" stroke="#27864a" fill="#abebc6" fillOpacity={0.5} />
                    <Area type="monotone" dataKey="overflowLitres" name="Overflow Spilled (L)" stroke="#f39c12" fill="#fdebd0" fillOpacity={0.4} />
                    <Line type="monotone" dataKey="deficitLitres" name="Water Deficit (L)" stroke="#c0392b" strokeWidth={2} dot />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Table Breakdown */}
            <div className="card">
              <div className="card-header">
                <h2>12-Month Water Balance Table</h2>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Normal Rainfall (mm)</th>
                      <th>Inflow (L)</th>
                      <th>Demand (L)</th>
                      <th>Supplied (L)</th>
                      <th>Stored End of Month (L)</th>
                      <th>Overflow (L)</th>
                      <th>Deficit (L)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySimResult.monthlyPoints.map(pt => (
                      <tr key={pt.month}>
                        <td><strong>{pt.month}</strong></td>
                        <td>{pt.rainfallMm} mm</td>
                        <td>{pt.inflowLitres.toLocaleString()} L</td>
                        <td>{pt.demandLitres.toLocaleString()} L</td>
                        <td>{pt.demandLitres - pt.deficitLitres > 0 ? (pt.demandLitres - pt.deficitLitres).toLocaleString() : '0'} L</td>
                        <td><strong>{pt.storedLitres.toLocaleString()} L</strong></td>
                        <td style={{ color: pt.overflowLitres > 0 ? '#d35400' : '#888' }}>
                          {pt.overflowLitres > 0 ? `${pt.overflowLitres.toLocaleString()} L` : '—'}
                        </td>
                        <td style={{ color: pt.deficitLitres > 0 ? '#c0392b' : '#27864a', fontWeight: pt.deficitLitres > 0 ? 600 : 400 }}>
                          {pt.deficitLitres > 0 ? `${pt.deficitLitres.toLocaleString()} L` : 'Covered'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
