/* ============================================================
   JalSetu Purulia — Rainwater Harvesting Calculations
   
   All formulas are documented and transparent.
   Results are clearly labelled as theoretical estimates.
   ============================================================ */

import type { RainwaterCalcInput, RainwaterCalcResult } from '../types';

/**
 * Calculate approximate harvestable rainwater volume.
 *
 * Formula:
 *   Volume (m³) = rainfall (mm) × catchment area (m²) × efficiency ÷ 1000
 *
 * Assumptions and limitations:
 * - Does not account for temporal rainfall distribution.
 * - Does not model first-flush diversion loss.
 * - Does not consider water quality or filtration losses.
 * - Collection efficiency is an estimate (typical 0.7–0.9 for rooftops).
 * - Storage overflow is only estimated when capacity is provided.
 */
export function calculateRainwaterHarvest(input: RainwaterCalcInput): RainwaterCalcResult {
  const { rainfallMm, catchmentAreaSqm, collectionEfficiency, storageCapacityLitres } = input;

  // Input validation
  if (rainfallMm < 0) throw new Error('Rainfall cannot be negative');
  if (catchmentAreaSqm < 0) throw new Error('Catchment area cannot be negative');
  if (collectionEfficiency < 0 || collectionEfficiency > 1) {
    throw new Error('Collection efficiency must be between 0 and 1');
  }
  if (storageCapacityLitres !== null && storageCapacityLitres < 0) {
    throw new Error('Storage capacity cannot be negative');
  }

  // Zero rainfall → zero harvest
  if (rainfallMm === 0 || catchmentAreaSqm === 0) {
    return {
      harvestableVolumeM3: 0,
      harvestableVolumeLitres: 0,
      excessVolumeLitres: null,
      storageSufficient: storageCapacityLitres !== null ? true : null,
    };
  }

  const harvestableVolumeM3 = (rainfallMm * catchmentAreaSqm * collectionEfficiency) / 1000;
  const harvestableVolumeLitres = harvestableVolumeM3 * 1000;

  let excessVolumeLitres: number | null = null;
  let storageSufficient: boolean | null = null;

  if (storageCapacityLitres !== null) {
    if (harvestableVolumeLitres > storageCapacityLitres) {
      excessVolumeLitres = harvestableVolumeLitres - storageCapacityLitres;
      storageSufficient = false;
    } else {
      excessVolumeLitres = 0;
      storageSufficient = true;
    }
  }

  return {
    harvestableVolumeM3: roundTo(harvestableVolumeM3, 3),
    harvestableVolumeLitres: roundTo(harvestableVolumeLitres, 1),
    excessVolumeLitres: excessVolumeLitres !== null ? roundTo(excessVolumeLitres, 1) : null,
    storageSufficient,
  };
}

/**
 * Calculate storage volume for a rectangular/vertical-sided tank.
 *
 * Formula:
 *   Volume (m³) = length (m) × width (m) × water depth (m)
 *
 * This is ONLY valid for rectangular tanks with vertical walls.
 * Do NOT use for irregular ponds without an appropriate geometry model.
 */
export function calculateRectangularTankVolume(
  lengthM: number,
  widthM: number,
  waterDepthM: number
): { volumeM3: number; volumeLitres: number } {
  if (lengthM < 0 || widthM < 0 || waterDepthM < 0) {
    throw new Error('Tank dimensions cannot be negative');
  }
  const volumeM3 = lengthM * widthM * waterDepthM;
  return {
    volumeM3: roundTo(volumeM3, 3),
    volumeLitres: roundTo(volumeM3 * 1000, 1),
  };
}

/**
 * Validate a sensor water-level reading for plausibility.
 * Returns an object indicating whether the reading is plausible.
 */
export function validateWaterLevelReading(
  waterLevelM: number,
  maxDepthM: number | null
): { valid: boolean; warning: string | null } {
  if (isNaN(waterLevelM)) {
    return { valid: false, warning: 'Water level is not a valid number' };
  }
  if (waterLevelM < 0) {
    return { valid: false, warning: 'Water level cannot be negative' };
  }
  if (waterLevelM > 50) {
    return { valid: false, warning: 'Water level exceeds 50 m — implausible for a local structure' };
  }
  if (maxDepthM !== null && waterLevelM > maxDepthM * 1.1) {
    return { valid: false, warning: `Water level ${waterLevelM} m exceeds tank depth ${maxDepthM} m by more than 10%` };
  }
  if (maxDepthM !== null && waterLevelM > maxDepthM) {
    return { valid: true, warning: `Water level ${waterLevelM} m slightly exceeds tank depth ${maxDepthM} m — possible overflow` };
  }
  return { valid: true, warning: null };
}

/**
 * Convert millimetres to metres.
 */
export function mmToMetres(mm: number): number {
  return mm / 1000;
}

/**
 * Convert litres to cubic metres.
 */
export function litresToCubicMetres(litres: number): number {
  return litres / 1000;
}

/**
 * Convert cubic metres to litres.
 */
export function cubicMetresToLitres(m3: number): number {
  return m3 * 1000;
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
