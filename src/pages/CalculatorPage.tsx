import React, { useState } from 'react';
import { calculateRainwaterHarvest } from '../lib/calculations';
import { NoticeBanner } from '../components/NoticeBanner';

interface CalculatorPageProps {
  isSimulated: boolean;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ isSimulated }) => {
  const [rainfallMm, setRainfallMm] = useState<string>('25');
  const [catchmentAreaSqm, setCatchmentAreaSqm] = useState<string>('150');
  const [efficiency, setEfficiency] = useState<string>('0.80');
  const [storageCapacity, setStorageCapacity] = useState<string>('5000');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parse and calculate
  const rain = parseFloat(rainfallMm);
  const area = parseFloat(catchmentAreaSqm);
  const eff = parseFloat(efficiency);
  const cap = storageCapacity.trim() === '' ? null : parseFloat(storageCapacity);

  let result = null;
  let validationError = null;

  if (isNaN(rain) || rain < 0) {
    validationError = 'Rainfall must be a non-negative number.';
  } else if (isNaN(area) || area < 0) {
    validationError = 'Catchment area must be a non-negative number.';
  } else if (isNaN(eff) || eff < 0 || eff > 1) {
    validationError = 'Collection efficiency must be between 0.0 and 1.0.';
  } else if (cap !== null && (isNaN(cap) || cap < 0)) {
    validationError = 'Storage capacity cannot be negative.';
  } else {
    try {
      result = calculateRainwaterHarvest({
        rainfallMm: rain,
        catchmentAreaSqm: area,
        collectionEfficiency: eff,
        storageCapacityLitres: cap,
      });
    } catch (err: any) {
      validationError = err.message;
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Rooftop Rainwater Harvesting Calculator</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Theoretical yield estimation based on standard hydrological runoff equations.
          </p>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Clear Engineering Limitations Callout */}
        <div className="notice notice--warning" style={{ marginBottom: '1.5rem' }}>
          <div>
            <strong>Important Hydrological Disclaimers: </strong>
            <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0 }}>
              <li>
                <strong>Theoretical Runoff Only: </strong> This formula calculates immediate runoff volume.
                It does not account for temporal rainfall distribution, dry spell duration, or first-flush diverter losses (typically 1–2 mm per event).
              </li>
              <li>
                <strong>Not Ground Water Recharge: </strong> Never treat this calculation as measured aquifer recharge.
                Water diverted into a sealed tank supplies immediate consumption and does not replenish deep aquifers unless a scientifically validated recharge shaft is used in appropriate geology.
              </li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Input Card */}
          <div className="card">
            <div className="card-header">
              <h2>Calculation Parameters</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Equation: Volume (m³) = Rainfall (mm) &times; Catchment (m²) &times; Efficiency &divide; 1,000
              </p>
            </div>

            {validationError && (
              <div className="notice notice--danger" style={{ marginBottom: '1rem' }}>
                {validationError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="calc-rain">Rainfall Event or Seasonal Total (mm) *</label>
              <input
                id="calc-rain"
                type="number"
                min="0"
                step="0.5"
                value={rainfallMm}
                onChange={e => setRainfallMm(e.target.value)}
              />
              <span className="form-hint">
                Single rainfall event (e.g. 25 mm) or monsoon seasonal average for Purulia (~1,100 to 1,300 mm).
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="calc-area">Rooftop / Catchment Area (m²) *</label>
              <input
                id="calc-area"
                type="number"
                min="0"
                step="1"
                value={catchmentAreaSqm}
                onChange={e => setCatchmentAreaSqm(e.target.value)}
              />
              <span className="form-hint">
                Plan area of building roof. Example: 100 m² is approx. 1,076 sq ft.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="calc-eff">Runoff Collection Efficiency Factor (0.0 to 1.0) *</label>
              <input
                id="calc-eff"
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={efficiency}
                onChange={e => setEfficiency(e.target.value)}
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <strong>Typical reference guidelines:</strong>
                <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0 }}>
                  <li>Smooth GI / corrugated sheet: 0.85 – 0.90</li>
                  <li>Clay tiles: 0.75 – 0.85</li>
                  <li>Flat concrete roof (RCC): 0.70 – 0.80</li>
                  <li>Paved ground catchment: 0.55 – 0.65</li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="calc-cap">Storage Tank Capacity (Litres, Optional)</label>
              <input
                id="calc-cap"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 5000"
                value={storageCapacity}
                onChange={e => setStorageCapacity(e.target.value)}
              />
              <span className="form-hint">
                Supply your existing or planned tank volume to evaluate whether overflow will occur.
              </span>
            </div>

            <div className="btn-group" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setRainfallMm('30');
                  setCatchmentAreaSqm('200');
                  setEfficiency('0.80');
                  setStorageCapacity('5000');
                }}
              >
                Load Sample School Preset
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setRainfallMm('1200');
                  setCatchmentAreaSqm('80');
                  setEfficiency('0.75');
                  setStorageCapacity('10000');
                }}
              >
                Load Annual Household Preset
              </button>
            </div>
          </div>

          {/* Results Card */}
          <div className="card">
            <div className="card-header">
              <h2>Calculated Estimation</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Theoretical harvestable yield based on entered inputs.
              </p>
            </div>

            {result ? (
              <div>
                <dl className="calc-result" style={{ margin: 0 }}>
                  <dt>Theoretical Harvestable Volume (Cubic Metres)</dt>
                  <dd>{result.harvestableVolumeM3.toLocaleString()} m³</dd>

                  <dt>Equivalent Litres</dt>
                  <dd style={{ color: 'var(--color-teal)' }}>
                    {result.harvestableVolumeLitres.toLocaleString()} Litres
                  </dd>

                  {result.storageSufficient !== null && (
                    <>
                      <dt>Storage Capacity Status</dt>
                      <dd>
                        {result.storageSufficient ? (
                          <span style={{ color: 'var(--color-success)', fontSize: '1rem' }}>
                            ✓ Current tank capacity ({cap?.toLocaleString()} L) is sufficient for this event.
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-danger)', fontSize: '1rem' }}>
                            ⚠ Tank will overflow by approx. {result.excessVolumeLitres?.toLocaleString()} Litres.
                          </span>
                        )}
                      </dd>
                    </>
                  )}
                </dl>

                {/* Practical Household Context */}
                <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: '#f5f0e8', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
                  <strong>Practical Field Context: </strong>
                  At a standard drinking and cooking allowance of 10 Litres per person per day,
                  {' '}<strong>{result.harvestableVolumeLitres.toLocaleString()} Litres</strong> would theoretically support a family of 5 for
                  approx. <strong>{Math.floor(result.harvestableVolumeLitres / (5 * 10))} days</strong>,
                  assuming adequate storage hygiene and filtration.
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)' }}>Enter valid inputs to view calculated volume.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
