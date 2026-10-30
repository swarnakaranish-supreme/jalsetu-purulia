/* ============================================================
   JalSetu Purulia — Rainwater Harvesting & Hydrological Calculations
   
   All formulas are transparent, unit-consistent, and documented.
   Results are clearly labelled as theoretical estimates.
   ============================================================ */

import type {
  RainwaterCalcInput,
  RainwaterCalcResult,
  WaterQualityParameter,
  WaterTestingMethod,
  StructureDimensions,
  MonthlyWaterBalancePoint,
  CostBreakdownItem,
  PreliminaryCostEstimate,
  PreliminaryStructureType,
} from '../types';

/**
 * Standard runoff coefficient reference values based on Central Ground Water Board (CGWB)
 * and Indian standard rainwater harvesting guidelines (CPWD / NBC 2016).
 */
export const RUNOFF_COEFFICIENTS: Record<
  string,
  { label: string; coefficient: number; description: string }
> = {
  rcc_roof: {
    label: 'Reinforced Concrete (RCC) Roof',
    coefficient: 0.85,
    description: 'Smooth, impermeable concrete slab. Very high runoff efficiency (0.80–0.90).',
  },
  metal_corrugated: {
    label: 'Galvanized Corrugated Iron / Metal Sheet',
    coefficient: 0.80,
    description: 'Smooth metal surface with fast runoff (0.75–0.85). Low surface retention.',
  },
  clay_tile: {
    label: 'Terracotta / Clay Tile Roof',
    coefficient: 0.75,
    description: 'Traditional pitched clay tiles. Moderate absorption and joint retention (0.70–0.80).',
  },
  paved_ground: {
    label: 'Paved / Concrete Courtyard',
    coefficient: 0.60,
    description: 'Flat paved courtyard with drainage channels. Losses from depression storage (0.50–0.70).',
  },
  compacted_earth: {
    label: 'Compacted Earth / Unpaved Yard',
    coefficient: 0.40,
    description: 'Hard-packed red earth / laterite surface. Significant infiltration and dust absorption (0.30–0.50).',
  },
  agricultural_land: {
    label: 'Agricultural Land / Farm Catchment',
    coefficient: 0.20,
    description: 'Terraced or bunded agricultural land in undulating terrain. High infiltration and crop interception (0.15–0.30).',
  },
  forested_natural: {
    label: 'Vegetated Slope / Forest Fringe',
    coefficient: 0.15,
    description: 'Upper ridge catchments with scrub or sal forest canopy. High ground infiltration (0.10–0.20).',
  },
};

/**
 * Calculate approximate harvestable rainwater volume with optional first-flush diversion
 * and demand comparison.
 *
 * Formula:
 *   Gross Volume (Litres) = rainfall (mm) × catchment area (m²) × collection efficiency
 *   (Because 1 mm over 1 m² = 1 Litre = 0.001 m³)
 *
 * Sizing & Loss Notes:
 * - First-flush diversion (typically 1–2 mm) removes atmospheric dust, bird droppings, and loose debris.
 * - Storage limitations constrain actual usable volume; excess overflows when storage capacity is specified.
 */
export function calculateRainwaterHarvest(input: RainwaterCalcInput): RainwaterCalcResult {
  const {
    rainfallMm,
    catchmentAreaSqm,
    collectionEfficiency,
    storageCapacityLitres,
    firstFlushMm = 0,
    demandDailyLitres = null,
    demandPeriodDays = null,
  } = input;

  // Input validation
  if (rainfallMm < 0) throw new Error('Rainfall cannot be negative');
  if (catchmentAreaSqm < 0) throw new Error('Catchment area cannot be negative');
  if (collectionEfficiency < 0 || collectionEfficiency > 1) {
    throw new Error('Collection efficiency must be between 0 and 1');
  }
  if (storageCapacityLitres !== null && storageCapacityLitres < 0) {
    throw new Error('Storage capacity cannot be negative');
  }
  if (firstFlushMm !== null && firstFlushMm !== undefined && firstFlushMm < 0) {
    throw new Error('First flush diversion cannot be negative');
  }
  if (demandDailyLitres !== null && demandDailyLitres < 0) {
    throw new Error('Daily demand cannot be negative');
  }
  if (demandPeriodDays !== null && demandPeriodDays < 0) {
    throw new Error('Demand period days cannot be negative');
  }

  // Zero rainfall or zero catchment
  if (rainfallMm === 0 || catchmentAreaSqm === 0) {
    return {
      harvestableVolumeM3: 0,
      harvestableVolumeLitres: 0,
      excessVolumeLitres: null,
      storageSufficient: storageCapacityLitres !== null ? true : null,
      grossRunoffLitres: 0,
      firstFlushDivertedLitres: 0,
      netUsableLitres: 0,
      demandTotalLitres: demandDailyLitres && demandPeriodDays ? demandDailyLitres * demandPeriodDays : null,
      demandDeficitLitres: demandDailyLitres && demandPeriodDays ? demandDailyLitres * demandPeriodDays : null,
      daysOfSupplySupported: 0,
    };
  }

  // Total theoretical gross runoff
  const grossRunoffLitres = rainfallMm * catchmentAreaSqm * collectionEfficiency;

  // First-flush diversion (if applied)
  const diversionDepthMm = firstFlushMm && firstFlushMm > 0 ? Math.min(rainfallMm, firstFlushMm) : 0;
  const firstFlushDivertedLitres = diversionDepthMm * catchmentAreaSqm * collectionEfficiency;

  // Effective harvestable runoff after diversion
  const netHarvestableLitres = Math.max(0, grossRunoffLitres - firstFlushDivertedLitres);
  const harvestableVolumeM3 = netHarvestableLitres / 1000;

  let excessVolumeLitres: number | null = null;
  let storageSufficient: boolean | null = null;
  let usableStoredLitres = netHarvestableLitres;

  if (storageCapacityLitres !== null) {
    if (netHarvestableLitres > storageCapacityLitres) {
      excessVolumeLitres = netHarvestableLitres - storageCapacityLitres;
      storageSufficient = false;
      usableStoredLitres = storageCapacityLitres;
    } else {
      excessVolumeLitres = 0;
      storageSufficient = true;
      usableStoredLitres = netHarvestableLitres;
    }
  }

  // Demand calculations
  let demandTotalLitres: number | null = null;
  let demandDeficitLitres: number | null = null;
  let daysOfSupplySupported: number | null = null;

  if (demandDailyLitres !== null && demandDailyLitres > 0) {
    if (demandPeriodDays !== null && demandPeriodDays > 0) {
      demandTotalLitres = demandDailyLitres * demandPeriodDays;
      demandDeficitLitres = Math.max(0, demandTotalLitres - usableStoredLitres);
    }
    daysOfSupplySupported = roundTo(usableStoredLitres / demandDailyLitres, 1);
  }

  return {
    harvestableVolumeM3: roundTo(harvestableVolumeM3, 3),
    harvestableVolumeLitres: roundTo(netHarvestableLitres, 1),
    excessVolumeLitres: excessVolumeLitres !== null ? roundTo(excessVolumeLitres, 1) : null,
    storageSufficient,
    grossRunoffLitres: roundTo(grossRunoffLitres, 1),
    firstFlushDivertedLitres: roundTo(firstFlushDivertedLitres, 1),
    netUsableLitres: roundTo(usableStoredLitres, 1),
    demandTotalLitres: demandTotalLitres !== null ? roundTo(demandTotalLitres, 1) : null,
    demandDeficitLitres: demandDeficitLitres !== null ? roundTo(demandDeficitLitres, 1) : null,
    daysOfSupplySupported,
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
 * Geographic Coordinate Validation for Purulia District and Eastern Plateau.
 *
 * Purulia District bounding box (approximate):
 *   Latitude: 22.70° N to 23.85° N
 *   Longitude: 85.80° E to 87.05° E
 *
 * Adjoining Eastern Plateau (Jharkhand / WB / Odisha fringe):
 *   Latitude: 22.00° N to 24.50° N
 *   Longitude: 85.00° E to 87.50° E
 */
export function validateCoordinates(
  lat: number | null,
  lon: number | null
): {
  valid: boolean;
  inPuruliaDistrict: boolean;
  inEasternPlateau: boolean;
  message: string;
} {
  if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
    return {
      valid: false,
      inPuruliaDistrict: false,
      inEasternPlateau: false,
      message: 'Coordinates not provided or not numeric.',
    };
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return {
      valid: false,
      inPuruliaDistrict: false,
      inEasternPlateau: false,
      message: 'Invalid geographical coordinates (latitude must be -90 to 90, longitude -180 to 180).',
    };
  }

  const inPurulia = lat >= 22.7 && lat <= 23.85 && lon >= 85.8 && lon <= 87.05;
  const inPlateau = lat >= 22.0 && lat <= 24.5 && lon >= 85.0 && lon <= 87.5;

  if (inPurulia) {
    return {
      valid: true,
      inPuruliaDistrict: true,
      inEasternPlateau: true,
      message: 'Coordinates are within Purulia District boundaries.',
    };
  }

  if (inPlateau) {
    return {
      valid: true,
      inPuruliaDistrict: false,
      inEasternPlateau: true,
      message: 'Coordinates are in the adjoining Eastern Plateau region outside Purulia district.',
    };
  }

  return {
    valid: true,
    inPuruliaDistrict: false,
    inEasternPlateau: false,
    message: 'Coordinates fall outside the Eastern Plateau region. Check for transcription errors or simulated location.',
  };
}

/**
 * Evaluation of water-quality parameters against Bureau of Indian Standards
 * IS 10500:2012 (Drinking Water — Specification, Second Revision).
 *
 * DISCLAIMER: This is an automated screening check against reference thresholds.
 * Field test kits and single readings CANNOT certify water safe to drink.
 * Comprehensive microbiological, heavy metal, and statutory testing must be
 * conducted by accredited (NABL/PHED) testing laboratories.
 */
export function evaluateWaterQuality(
  param: WaterQualityParameter,
  val: number | string,
  _method: WaterTestingMethod = 'field_test_kit'
): {
  status: 'acceptable' | 'permissible' | 'exceeded' | 'uncertain';
  note: string;
  referenceLimit: string;
} {
  const numericVal = typeof val === 'number' ? val : parseFloat(val);

  switch (param) {
    case 'pH':
      if (isNaN(numericVal)) return { status: 'uncertain', note: 'Invalid reading', referenceLimit: '6.5 – 8.5' };
      if (numericVal >= 6.5 && numericVal <= 8.5) {
        return { status: 'acceptable', note: 'Within acceptable range for drinking water (IS 10500:2012).', referenceLimit: '6.5 – 8.5' };
      }
      return { status: 'exceeded', note: numericVal < 6.5 ? 'Acidic: below acceptable 6.5 minimum.' : 'Alkaline: exceeds 8.5 maximum.', referenceLimit: '6.5 – 8.5' };

    case 'tds_ppm':
      if (isNaN(numericVal)) return { status: 'uncertain', note: 'Invalid reading', referenceLimit: '500 mg/L (Max 2000 in absence of alt source)' };
      if (numericVal <= 500) {
        return { status: 'acceptable', note: 'Within desirable limit (≤ 500 mg/L).', referenceLimit: '≤ 500 mg/L' };
      } else if (numericVal <= 2000) {
        return { status: 'permissible', note: 'Permissible in the absence of an alternate drinking water source (500–2,000 mg/L).', referenceLimit: '500 – 2,000 mg/L' };
      }
      return { status: 'exceeded', note: 'Exceeds maximum permissible limit of 2,000 mg/L.', referenceLimit: 'Max 2,000 mg/L' };

    case 'turbidity_ntu':
      if (isNaN(numericVal)) return { status: 'uncertain', note: 'Invalid reading', referenceLimit: '1 NTU (Max 5 NTU permissible)' };
      if (numericVal <= 1) {
        return { status: 'acceptable', note: 'Clear water, within desirable limit (≤ 1 NTU).', referenceLimit: '≤ 1 NTU' };
      } else if (numericVal <= 5) {
        return { status: 'permissible', note: 'Permissible in absence of alternate source (1–5 NTU). Filtration advised.', referenceLimit: '1 – 5 NTU' };
      }
      return { status: 'exceeded', note: 'Exceeds permissible limit (> 5 NTU). Clarification and filtration required.', referenceLimit: 'Max 5 NTU' };

    case 'fluoride_mg_l':
      if (isNaN(numericVal)) return { status: 'uncertain', note: 'Invalid reading', referenceLimit: '1.0 mg/L (Max 1.5 mg/L permissible)' };
      if (numericVal <= 1.0) {
        return { status: 'acceptable', note: 'Within safe acceptable limit (≤ 1.0 mg/L).', referenceLimit: '≤ 1.0 mg/L' };
      } else if (numericVal <= 1.5) {
        return { status: 'permissible', note: 'Permissible in absence of alternate source (1.0–1.5 mg/L). Monitor closely for dental fluorosis.', referenceLimit: '1.0 – 1.5 mg/L' };
      }
      return { status: 'exceeded', note: 'CRITICAL WARNING: Exceeds 1.5 mg/L. High fluorosis risk. Water must NOT be used for drinking without defluoridation.', referenceLimit: 'Max 1.5 mg/L' };

    case 'iron_mg_l':
      if (isNaN(numericVal)) return { status: 'uncertain', note: 'Invalid reading', referenceLimit: '1.0 mg/L' };
      if (numericVal <= 1.0) {
        return { status: 'acceptable', note: 'Within acceptable limit (≤ 1.0 mg/L).', referenceLimit: '≤ 1.0 mg/L' };
      }
      return { status: 'exceeded', note: 'Exceeds 1.0 mg/L limit. Causes staining, metallic taste, and turbidity. Iron removal plant required.', referenceLimit: '≤ 1.0 mg/L' };

    case 'nitrate_mg_l':
      if (isNaN(numericVal)) return { status: 'uncertain', note: 'Invalid reading', referenceLimit: '45 mg/L' };
      if (numericVal <= 45) {
        return { status: 'acceptable', note: 'Within acceptable limit (≤ 45 mg/L).', referenceLimit: '≤ 45 mg/L' };
      }
      return { status: 'exceeded', note: 'CRITICAL WARNING: Exceeds 45 mg/L. Risk of infant methemoglobinemia (blue baby syndrome). Indicates agricultural or sewage contamination.', referenceLimit: '≤ 45 mg/L' };

    case 'coliform_presence': {
      const strVal = String(val).toLowerCase().trim();
      if (strVal === 'absent' || strVal === '0' || strVal === 'negative') {
        return { status: 'acceptable', note: 'Coliform absent in sample.', referenceLimit: 'Shall not be detectable in 100 ml' };
      } else if (strVal === 'present' || strVal === 'positive' || numericVal > 0) {
        return { status: 'exceeded', note: 'CRITICAL BACTERIOLOGICAL CONTAMINATION: Coliform bacteria detected. Water unsafe for drinking without disinfection (boiling/chlorination).', referenceLimit: '0 in 100 ml' };
      }
      return { status: 'uncertain', note: 'Indeterminate coliform observation.', referenceLimit: '0 in 100 ml' };
    }

    default:
      return { status: 'uncertain', note: 'Parameter threshold reference not specified.', referenceLimit: 'Consult laboratory' };
  }
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

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/* ============================================================
   Structure Sizing & Land Footprint Calculations
   ============================================================ */

export interface RectangularTankInput {
  targetUsableLitres: number;
  waterDepthM?: number; // default ~1.8m
  freeboardM?: number; // default ~0.25m
  deadStorageM?: number; // default ~0.15m (silt zone below outlet)
  wallThicknessM?: number; // default ~0.25m for brick masonry / RCC
  maintenanceBufferM?: number; // default ~1.0m around tank for access
  lengthWidthRatio?: number; // default ~1.5 (Length = 1.5 * Width)
  fixedLengthM?: number | null;
  fixedWidthM?: number | null;
}

/**
 * Preliminary sizing for a rectangular storage tank (masonry or RCC).
 * Accounts for usable water depth, freeboard, dead storage, wall thickness,
 * internal footprint, external structure footprint, and access/maintenance land requirement.
 */
export function calculateRectangularTankDimensions(
  input: RectangularTankInput
): StructureDimensions {
  const {
    targetUsableLitres,
    waterDepthM = 1.8,
    freeboardM = 0.25,
    deadStorageM = 0.15,
    wallThicknessM = 0.25,
    maintenanceBufferM = 1.0,
    lengthWidthRatio = 1.5,
    fixedLengthM = null,
    fixedWidthM = null,
  } = input;

  if (targetUsableLitres <= 0) {
    throw new Error('Target usable volume must be greater than zero');
  }
  if (waterDepthM <= 0) {
    throw new Error('Water depth must be greater than zero');
  }

  const usableVolumeM3 = targetUsableLitres / 1000;
  let internalLength: number;
  let internalWidth: number;

  if (fixedLengthM && fixedWidthM) {
    internalLength = fixedLengthM;
    internalWidth = fixedWidthM;
  } else if (fixedLengthM) {
    internalLength = fixedLengthM;
    internalWidth = Math.max(0.5, usableVolumeM3 / (internalLength * waterDepthM));
  } else if (fixedWidthM) {
    internalWidth = fixedWidthM;
    internalLength = Math.max(0.5, usableVolumeM3 / (internalWidth * waterDepthM));
  } else {
    // Sizing using aspect ratio: L = ratio * W => Volume = ratio * W^2 * depth => W = sqrt(Volume / (ratio * depth))
    const requiredPlanArea = usableVolumeM3 / waterDepthM;
    internalWidth = Math.sqrt(requiredPlanArea / lengthWidthRatio);
    internalLength = internalWidth * lengthWidthRatio;
  }

  internalLength = roundTo(Math.max(0.8, internalLength), 2);
  internalWidth = roundTo(Math.max(0.8, internalWidth), 2);

  const totalHeight = roundTo(waterDepthM + freeboardM + deadStorageM, 2);
  const grossVolumeM3 = roundTo(internalLength * internalWidth * totalHeight, 2);
  const actualUsableVolumeLitres = roundTo(internalLength * internalWidth * waterDepthM * 1000, 0);

  const internalFootprint = roundTo(internalLength * internalWidth, 2);
  const externalLength = roundTo(internalLength + 2 * wallThicknessM, 2);
  const externalWidth = roundTo(internalWidth + 2 * wallThicknessM, 2);
  const externalStructureFootprint = roundTo(externalLength * externalWidth, 2);

  const landLength = roundTo(externalLength + 2 * maintenanceBufferM, 2);
  const landWidth = roundTo(externalWidth + 2 * maintenanceBufferM, 2);
  const totalLandRequirement = roundTo(landLength * landWidth, 2);

  return {
    structureType: 'rectangular_tank',
    grossVolumeM3,
    usableVolumeLitres: actualUsableVolumeLitres,
    lengthM: internalLength,
    widthM: internalWidth,
    depthM: totalHeight,
    freeboardM,
    deadStorageM,
    internalFootprintSqm: internalFootprint,
    externalStructureFootprintSqm: externalStructureFootprint,
    maintenanceClearanceBufferM: maintenanceBufferM,
    totalLandRequirementSqm: totalLandRequirement,
    wallThicknessM,
    notes: `Rectangular masonry/RCC tank: ${internalLength}m (L) × ${internalWidth}m (W) × ${totalHeight}m (H). Effective water depth: ${waterDepthM}m with ${freeboardM}m freeboard and ${deadStorageM}m dead storage sump. External footprint includes ${wallThicknessM}m walls and ${maintenanceBufferM}m perimeter access.`,
  };
}

export interface FarmPondHapaInput {
  targetUsableLitres: number;
  waterDepthM?: number; // default ~2.5m
  freeboardM?: number; // default ~0.5m
  sideSlopeZ?: number; // horizontal to vertical slope (e.g. 1.5 for 1.5H:1V in lateritic/red soil)
  bermBufferM?: number; // embankment / inspection berm width (e.g. 1.5m)
  lengthWidthRatio?: number; // default ~1.2 (L = 1.2 * W)
}

/**
 * Preliminary sizing for a farm pond / hapa with sloped earthen embankments.
 * Uses the prismoidal formula for an inverted truncated pyramid.
 */
export function calculateTrapezoidalPondDimensions(
  input: FarmPondHapaInput
): StructureDimensions {
  const {
    targetUsableLitres,
    waterDepthM = 2.5,
    freeboardM = 0.5,
    sideSlopeZ = 1.5,
    bermBufferM = 1.5,
    lengthWidthRatio = 1.2,
  } = input;

  if (targetUsableLitres <= 0) throw new Error('Target pond volume must be greater than zero');
  if (waterDepthM <= 0) throw new Error('Water depth must be greater than zero');

  const usableVolumeM3 = targetUsableLitres / 1000;
  const totalExcavationDepth = roundTo(waterDepthM + freeboardM, 2);

  // Iteratively determine top dimensions (or direct prismoidal approximation)
  // For trapezoidal pond: V_water approx = d * (A_top_water + A_bottom + sqrt(A_top_water * A_bottom)) / 3
  // Where L_bottom = L_top_water - 2*Z*d, W_bottom = W_top_water - 2*Z*d
  let topWaterWidth = Math.max(3.0, Math.pow(usableVolumeM3 / (0.8 * waterDepthM), 0.5));
  let topWaterLength = topWaterWidth * lengthWidthRatio;

  // Refine top dimensions to meet target volume
  for (let iter = 0; iter < 10; iter++) {
    const bottomW = Math.max(1.0, topWaterWidth - 2 * sideSlopeZ * waterDepthM);
    const bottomL = Math.max(1.0, topWaterLength - 2 * sideSlopeZ * waterDepthM);
    const aTop = topWaterLength * topWaterWidth;
    const aBottom = bottomL * bottomW;
    const currentVol = (waterDepthM / 6) * (aTop + aBottom + 4 * ((topWaterLength + bottomL) / 2) * ((topWaterWidth + bottomW) / 2));
    const factor = Math.sqrt(usableVolumeM3 / Math.max(1, currentVol));
    topWaterWidth = Math.max(2 * sideSlopeZ * waterDepthM + 1.0, topWaterWidth * factor);
    topWaterLength = topWaterWidth * lengthWidthRatio;
  }

  topWaterLength = roundTo(topWaterLength, 1);
  topWaterWidth = roundTo(topWaterWidth, 1);

  // Full excavation dimensions including freeboard
  const excavationTopLength = roundTo(topWaterLength + 2 * sideSlopeZ * freeboardM, 1);
  const excavationTopWidth = roundTo(topWaterWidth + 2 * sideSlopeZ * freeboardM, 1);
  const bottomLength = roundTo(Math.max(1.0, excavationTopLength - 2 * sideSlopeZ * totalExcavationDepth), 1);
  const bottomWidth = roundTo(Math.max(1.0, excavationTopWidth - 2 * sideSlopeZ * totalExcavationDepth), 1);

  const aTopExcav = excavationTopLength * excavationTopWidth;
  const aBottomExcav = bottomLength * bottomWidth;
  const aMidExcav = ((excavationTopLength + bottomLength) / 2) * ((excavationTopWidth + bottomWidth) / 2);
  const grossExcavationM3 = roundTo((totalExcavationDepth / 6) * (aTopExcav + aBottomExcav + 4 * aMidExcav), 1);

  const aTopWater = topWaterLength * topWaterWidth;
  const aMidWater = ((topWaterLength + bottomLength) / 2) * ((topWaterWidth + bottomWidth) / 2);
  const usableStorageM3 = roundTo((waterDepthM / 6) * (aTopWater + aBottomExcav + 4 * aMidWater), 1);

  const waterSpreadArea = roundTo(aTopWater, 1);
  const excavationFootprint = roundTo(aTopExcav, 1);
  const totalLandLength = roundTo(excavationTopLength + 2 * bermBufferM, 1);
  const totalLandWidth = roundTo(excavationTopWidth + 2 * bermBufferM, 1);
  const totalLandRequirement = roundTo(totalLandLength * totalLandWidth, 1);

  return {
    structureType: 'farm_pond_hapa',
    grossVolumeM3: grossExcavationM3,
    usableVolumeLitres: roundTo(usableStorageM3 * 1000, 0),
    lengthM: excavationTopLength,
    widthM: excavationTopWidth,
    depthM: totalExcavationDepth,
    freeboardM,
    sideSlopeZ,
    internalFootprintSqm: waterSpreadArea,
    externalStructureFootprintSqm: excavationFootprint,
    maintenanceClearanceBufferM: bermBufferM,
    totalLandRequirementSqm: totalLandRequirement,
    notes: `Earthen farm pond (Hapa): Top excavation ${excavationTopLength}m × ${excavationTopWidth}m, bed ${bottomLength}m × ${bottomWidth}m, depth ${totalExcavationDepth}m (${waterDepthM}m water + ${freeboardM}m freeboard). Side slope ${sideSlopeZ}:1 (H:V). Includes ${bermBufferM}m embankment berm.`,
  };
}

/* ============================================================
   Purulia Monthly Climatological Normal & Water Balance
   ============================================================ */

/**
 * Monthly normal rainfall (mm) for Purulia District, West Bengal.
 * Derived from India Meteorological Department (IMD) climatological normals
 * and Central Ground Water Board (CGWB) district reports (annual mean ~ 1,346 mm).
 */
export const PURULIA_MONTHLY_NORMAL_RAINFALL: { month: string; rainfallMm: number }[] = [
  { month: 'Jan', rainfallMm: 14 },
  { month: 'Feb', rainfallMm: 22 },
  { month: 'Mar', rainfallMm: 26 },
  { month: 'Apr', rainfallMm: 38 },
  { month: 'May', rainfallMm: 78 },
  { month: 'Jun', rainfallMm: 242 },
  { month: 'Jul', rainfallMm: 346 },
  { month: 'Aug', rainfallMm: 320 },
  { month: 'Sep', rainfallMm: 195 },
  { month: 'Oct', rainfallMm: 52 },
  { month: 'Nov', rainfallMm: 8 },
  { month: 'Dec', rainfallMm: 5 },
];

export interface MonthlyBalanceSimulationResult {
  monthlyPoints: MonthlyWaterBalancePoint[];
  totalAnnualRainfallMm: number;
  totalAnnualInflowLitres: number;
  totalAnnualDemandLitres: number;
  totalAnnualSuppliedLitres: number;
  totalAnnualOverflowLitres: number;
  totalAnnualDeficitLitres: number;
  peakDeficitMonth: string | null;
  drySeasonReliabilityPercent: number; // percentage of demand met in Nov-May
}

/**
 * 12-Month sequential water balance simulation.
 * Models seasonal rainfall inflow, storage capacity boundaries, overflow, and demand deficit.
 */
export function simulateMonthlyWaterBalance(
  catchmentAreaSqm: number,
  runoffCoeff: number,
  storageCapacityLitres: number,
  dailyDemandLitres: number,
  customMonthlyRainfall?: { month: string; rainfallMm: number }[]
): MonthlyBalanceSimulationResult {
  const rainfallProfile = customMonthlyRainfall || PURULIA_MONTHLY_NORMAL_RAINFALL;
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let currentStorage = 0;
  let totalRainfallMm = 0;
  let totalInflow = 0;
  let totalDemand = 0;
  let totalSupplied = 0;
  let totalOverflow = 0;
  let totalDeficit = 0;

  let drySeasonDemand = 0;
  let drySeasonSupplied = 0;
  let peakDeficitVal = 0;
  let peakDeficitMonth: string | null = null;

  const points: MonthlyWaterBalancePoint[] = [];

  for (let i = 0; i < 12; i++) {
    const item = rainfallProfile[i];
    const monthDays = daysInMonths[i];
    const rainfall = Math.max(0, item.rainfallMm);
    totalRainfallMm += rainfall;

    // Monthly gross inflow = P (mm) * A (m2) * C (L)
    const inflow = roundTo(rainfall * catchmentAreaSqm * runoffCoeff, 0);
    totalInflow += inflow;

    const monthlyDemand = roundTo(dailyDemandLitres * monthDays, 0);
    totalDemand += monthlyDemand;

    // Available before withdrawal
    const available = currentStorage + inflow;
    const supplied = Math.min(available, monthlyDemand);
    totalSupplied += supplied;

    const deficit = Math.max(0, monthlyDemand - supplied);
    totalDeficit += deficit;

    // Is dry season? (Nov, Dec, Jan, Feb, Mar, Apr, May -> indices 10, 11, 0, 1, 2, 3, 4)
    const isDryMonth = i === 10 || i === 11 || i === 0 || i === 1 || i === 2 || i === 3 || i === 4;
    if (isDryMonth) {
      drySeasonDemand += monthlyDemand;
      drySeasonSupplied += supplied;
    }

    if (deficit > peakDeficitVal) {
      peakDeficitVal = deficit;
      peakDeficitMonth = item.month;
    }

    // Remaining water in tank after supplying demand
    const remainingAfterDemand = available - supplied;
    let overflow = 0;

    if (remainingAfterDemand > storageCapacityLitres) {
      overflow = remainingAfterDemand - storageCapacityLitres;
      currentStorage = storageCapacityLitres;
    } else {
      currentStorage = remainingAfterDemand;
    }
    totalOverflow += overflow;

    points.push({
      month: item.month,
      monthIndex: i,
      rainfallMm: rainfall,
      inflowLitres: inflow,
      demandLitres: monthlyDemand,
      storedLitres: roundTo(currentStorage, 0),
      overflowLitres: roundTo(overflow, 0),
      deficitLitres: roundTo(deficit, 0),
    });
  }

  const drySeasonReliabilityPercent =
    drySeasonDemand > 0 ? roundTo((drySeasonSupplied / drySeasonDemand) * 100, 1) : 100;

  return {
    monthlyPoints: points,
    totalAnnualRainfallMm: roundTo(totalRainfallMm, 1),
    totalAnnualInflowLitres: roundTo(totalInflow, 0),
    totalAnnualDemandLitres: roundTo(totalDemand, 0),
    totalAnnualSuppliedLitres: roundTo(totalSupplied, 0),
    totalAnnualOverflowLitres: roundTo(totalOverflow, 0),
    totalAnnualDeficitLitres: roundTo(totalDeficit, 0),
    peakDeficitMonth,
    drySeasonReliabilityPercent,
  };
}

/* ============================================================
   Preliminary Cost & Feasibility Estimation
   ============================================================ */

export interface PreliminaryCostInput {
  structureType: PreliminaryStructureType;
  usableCapacityLitres: number;
  catchmentAreaSqm?: number;
  conveyanceLengthM?: number; // gutter & piping length
  includeSensorMonitoring?: boolean;
}

/**
 * Itemized preliminary cost estimation using typical regional rates in West Bengal / Eastern Plateau.
 * All rates are dated reference estimates and are subject to local site conditions and PWD SOR.
 */
export function estimatePreliminaryCost(input: PreliminaryCostInput): PreliminaryCostEstimate {
  const {
    structureType,
    usableCapacityLitres,
    catchmentAreaSqm = 100,
    conveyanceLengthM = 15,
    includeSensorMonitoring = true,
  } = input;

  const items: CostBreakdownItem[] = [];

  if (structureType === 'rooftop_rwh' || structureType === 'rectangular_tank') {
    // Gutters
    const gutterLen = roundTo(conveyanceLengthM * 0.7, 1);
    items.push({
      category: 'Conveyance',
      item: 'Semi-circular PVC/GI Gutters & Heavy Brackets',
      unit: 'metre',
      unitRateINR: 380,
      quantity: gutterLen,
      totalINR: roundTo(gutterLen * 380, 0),
      notes: 'UV-stabilized PVC / GI guttering along roof eaves',
      source: 'West Bengal regional market reference (2024)',
    });

    // Downpipes
    const downpipeLen = roundTo(conveyanceLengthM * 0.3 + 4, 1);
    items.push({
      category: 'Conveyance',
      item: '110mm PVC Downpipe & Fittings',
      unit: 'metre',
      unitRateINR: 260,
      quantity: downpipeLen,
      totalINR: roundTo(downpipeLen * 260, 0),
      notes: 'Vertical conveyance from roof to first-flush unit',
      source: 'Regional plumbing schedule rate',
    });

    // First Flush
    items.push({
      category: 'Pre-Treatment',
      item: 'First-Flush Diverter with Drain Valve',
      unit: 'unit',
      unitRateINR: 2200,
      quantity: 1,
      totalINR: 2200,
      notes: 'Initial 1–2mm rainfall diversion chamber to discard debris',
      source: 'CPWD RWH guidelines standard kit',
    });

    // Dual-Stage Filter
    items.push({
      category: 'Pre-Treatment',
      item: 'Dual-Stage Sand-Gravel-Charcoal Filter Unit',
      unit: 'unit',
      unitRateINR: 4500,
      quantity: 1,
      totalINR: 4500,
      notes: 'Gravity filtration unit with mesh screen and backwash outlet',
      source: 'State rural water supply benchmark',
    });

    // Storage Tank
    const ratePerLitre = usableCapacityLitres > 10000 ? 4.2 : 5.0;
    items.push({
      category: 'Storage',
      item: 'RCC / Brick Masonry Tank with Plaster & Waterproofing',
      unit: 'litre',
      unitRateINR: ratePerLitre,
      quantity: usableCapacityLitres,
      totalINR: roundTo(usableCapacityLitres * ratePerLitre, 0),
      notes: 'Includes foundation, 250mm masonry, internal waterproof plaster, and lockable cover',
      source: 'WB PWD Schedule of Rates approximation (2023-24)',
    });

    // Plumbing & Overflow
    items.push({
      category: 'Distribution',
      item: 'Overflow Piping, Tap Cock & Drain Valves',
      unit: 'lump sum',
      unitRateINR: 3500,
      quantity: 1,
      totalINR: 3500,
      notes: 'Screened overflow to garden / recharge trench, draw-off bibcock',
      source: 'Standard plumbing fittings bundle',
    });
  } else if (structureType === 'farm_pond_hapa') {
    const excavationVolumeM3 = roundTo(usableCapacityLitres / 850, 1); // accounts for freeboard and slopes

    items.push({
      category: 'Earthwork',
      item: 'Earth Excavation in Red / Lateritic Soil (Manual + Machine)',
      unit: 'm³',
      unitRateINR: 135,
      quantity: excavationVolumeM3,
      totalINR: roundTo(excavationVolumeM3 * 135, 0),
      notes: 'Includes pit excavation, dressing of side slopes (1.5:1), and embankment consolidation',
      source: 'MGNREGS / State Water Resources Investigation Directorate (WRIDD)',
    });

    items.push({
      category: 'Civil Works',
      item: 'Inlet Silt-Trap Forebay with Stone Pitching',
      unit: 'unit',
      unitRateINR: 6500,
      quantity: 1,
      totalINR: 6500,
      notes: 'Dry boulder apron at inlet to prevent scouring and settle coarse silt',
      source: 'USHARMUKTI watershed development rate',
    });

    items.push({
      category: 'Civil Works',
      item: 'Masonry / Riprap Emergency Spillway',
      unit: 'unit',
      unitRateINR: 5200,
      quantity: 1,
      totalINR: 5200,
      notes: 'Surplus overflow weir with stone pitching to safely discharge peak monsoon flood',
      source: 'Watershed engineering standard practice',
    });
  } else {
    // Generic or recharge structure
    items.push({
      category: 'Civil Works',
      item: 'Recharge Pit / Trench Excavation & Filter Packing',
      unit: 'unit',
      unitRateINR: 14000,
      quantity: 1,
      totalINR: 14000,
      notes: 'Graded boulder, gravel, and coarse sand packing with geotextile wrap',
      source: 'CGWB artificial recharge manual',
    });
  }

  // Monitoring sensor option
  if (includeSensorMonitoring) {
    items.push({
      category: 'Monitoring',
      item: 'ESP32 / Ultrasonic Level Sensor & Weatherproof Enclosure',
      unit: 'unit',
      unitRateINR: 2800,
      quantity: 1,
      totalINR: 2800,
      notes: 'Microcontroller, waterproof ultrasonic probe (JSN-SR04T), power supply, and junction box',
      source: 'Open hardware component estimate',
    });
  }

  // Calculate Subtotals
  const materialsSubtotal = items.reduce((acc, it) => acc + it.totalINR, 0);
  const labourRatePercent = 0.15;
  const labourTotal = roundTo(materialsSubtotal * labourRatePercent, 0);

  items.push({
    category: 'Labour & Installation',
    item: 'Skilled Masonry, Plumbing & Site Supervision',
    unit: 'job',
    unitRateINR: labourTotal,
    quantity: 1,
    totalINR: labourTotal,
    notes: 'Estimated at 15% of material capital costs',
    source: 'Standard engineering overhead guideline',
  });

  const capitalCostINR = materialsSubtotal + labourTotal;
  const annualMaintenanceINR = roundTo(capitalCostINR * 0.03, 0); // 3% per year
  const costPerLitresUsableINR = usableCapacityLitres > 0 ? roundTo(capitalCostINR / usableCapacityLitres, 2) : 0;

  return {
    items,
    capitalCostINR,
    annualMaintenanceINR,
    costPerLitresUsableINR,
    assumptions: [
      'Estimates are indicative preliminary planning benchmarks, NOT an approved detailed project report (DPR) or tender quotation.',
      'Excludes land acquisition costs; assumes legal community or private site ownership.',
      'Local transport costs over 15 km from block headquarters may incur an additional 5–10% contingency.',
      'Annual maintenance allowance covers pre-monsoon gutter clearing, filter sand washing, and sensor battery/check.',
    ],
  };
}
