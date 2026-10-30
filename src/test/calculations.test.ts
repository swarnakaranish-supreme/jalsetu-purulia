import { describe, it, expect } from 'vitest';
import {
  calculateRainwaterHarvest,
  calculateRectangularTankVolume,
  calculateRectangularTankDimensions,
  calculateTrapezoidalPondDimensions,
  simulateMonthlyWaterBalance,
  estimatePreliminaryCost,
  validateWaterLevelReading,
  validateCoordinates,
  evaluateWaterQuality,
  RUNOFF_COEFFICIENTS,
  mmToMetres,
  litresToCubicMetres,
  cubicMetresToLitres,
} from '../lib/calculations';

describe('Rainwater Harvesting Calculations', () => {
  it('correctly calculates harvestable volume for typical rooftop parameters', () => {
    // 25 mm rain, 100 m² roof, 0.8 efficiency
    // Volume = (25 * 100 * 0.8) / 1000 = 2.0 m³ = 2000 Litres
    const result = calculateRainwaterHarvest({
      rainfallMm: 25,
      catchmentAreaSqm: 100,
      collectionEfficiency: 0.8,
      storageCapacityLitres: 5000,
    });

    expect(result.harvestableVolumeM3).toBe(2);
    expect(result.harvestableVolumeLitres).toBe(2000);
    expect(result.storageSufficient).toBe(true);
    expect(result.excessVolumeLitres).toBe(0);
    expect(result.grossRunoffLitres).toBe(2000);
  });

  it('detects overflow when harvest exceeds storage capacity', () => {
    // 50 mm rain, 200 m² roof, 0.8 efficiency = 8.0 m³ = 8000 Litres
    // Tank capacity = 5000 Litres -> Overflow = 3000 Litres
    const result = calculateRainwaterHarvest({
      rainfallMm: 50,
      catchmentAreaSqm: 200,
      collectionEfficiency: 0.8,
      storageCapacityLitres: 5000,
    });

    expect(result.harvestableVolumeM3).toBe(8);
    expect(result.harvestableVolumeLitres).toBe(8000);
    expect(result.storageSufficient).toBe(false);
    expect(result.excessVolumeLitres).toBe(3000);
  });

  it('returns zero volume when rainfall is zero or area is zero', () => {
    const zeroRain = calculateRainwaterHarvest({
      rainfallMm: 0,
      catchmentAreaSqm: 150,
      collectionEfficiency: 0.85,
      storageCapacityLitres: 3000,
    });
    expect(zeroRain.harvestableVolumeM3).toBe(0);
    expect(zeroRain.harvestableVolumeLitres).toBe(0);

    const zeroArea = calculateRainwaterHarvest({
      rainfallMm: 40,
      catchmentAreaSqm: 0,
      collectionEfficiency: 0.8,
      storageCapacityLitres: null,
    });
    expect(zeroArea.harvestableVolumeM3).toBe(0);
    expect(zeroArea.harvestableVolumeLitres).toBe(0);
    expect(zeroArea.excessVolumeLitres).toBeNull();
  });

  it('handles null storage capacity without throwing error', () => {
    const res = calculateRainwaterHarvest({
      rainfallMm: 30,
      catchmentAreaSqm: 100,
      collectionEfficiency: 0.75,
      storageCapacityLitres: null,
    });
    expect(res.harvestableVolumeLitres).toBe(2250);
    expect(res.storageSufficient).toBeNull();
    expect(res.excessVolumeLitres).toBeNull();
  });

  it('correctly models first-flush diversion losses', () => {
    // 30 mm rainfall, 100 m² roof, 0.8 efficiency, 2 mm first-flush
    // Gross = 30 * 100 * 0.8 = 2400 Litres
    // Diverted = 2 * 100 * 0.8 = 160 Litres
    // Net clean = 28 * 100 * 0.8 = 2240 Litres
    const res = calculateRainwaterHarvest({
      rainfallMm: 30,
      catchmentAreaSqm: 100,
      collectionEfficiency: 0.8,
      storageCapacityLitres: 5000,
      firstFlushMm: 2.0,
    });

    expect(res.grossRunoffLitres).toBe(2400);
    expect(res.firstFlushDivertedLitres).toBe(160);
    expect(res.harvestableVolumeLitres).toBe(2240);
    expect(res.harvestableVolumeM3).toBe(2.24);
  });

  it('handles rainfall less than first flush diversion', () => {
    // 1 mm rain, 2 mm diversion -> all 1 mm is diverted, net clean = 0
    const res = calculateRainwaterHarvest({
      rainfallMm: 1,
      catchmentAreaSqm: 100,
      collectionEfficiency: 0.8,
      storageCapacityLitres: 2000,
      firstFlushMm: 2.0,
    });

    expect(res.grossRunoffLitres).toBe(80);
    expect(res.firstFlushDivertedLitres).toBe(80);
    expect(res.harvestableVolumeLitres).toBe(0);
  });

  it('correctly models household water demand and supply duration', () => {
    // 50 mm rain, 150 m² roof, 0.85 eff = 6375 Litres
    // 5 people * 15 LPCD = 75 L/day
    // Target 60 days = 4500 L
    // Usable = 6375 L -> covers 6375 / 75 = 85 days, deficit = 0
    const res = calculateRainwaterHarvest({
      rainfallMm: 50,
      catchmentAreaSqm: 150,
      collectionEfficiency: 0.85,
      storageCapacityLitres: 10000,
      demandDailyLitres: 75,
      demandPeriodDays: 60,
    });

    expect(res.harvestableVolumeLitres).toBe(6375);
    expect(res.daysOfSupplySupported).toBe(85);
    expect(res.demandTotalLitres).toBe(4500);
    expect(res.demandDeficitLitres).toBe(0);
  });

  it('identifies demand deficit when storage is capped', () => {
    // Stored water capped at 2000 Litres
    // 100 L/day for 60 days = 6000 L demand -> deficit = 4000 L
    const res = calculateRainwaterHarvest({
      rainfallMm: 60,
      catchmentAreaSqm: 100,
      collectionEfficiency: 0.8,
      storageCapacityLitres: 2000,
      demandDailyLitres: 100,
      demandPeriodDays: 60,
    });

    expect(res.netUsableLitres).toBe(2000);
    expect(res.daysOfSupplySupported).toBe(20);
    expect(res.demandTotalLitres).toBe(6000);
    expect(res.demandDeficitLitres).toBe(4000);
  });

  it('throws descriptive error on negative rainfall', () => {
    expect(() =>
      calculateRainwaterHarvest({
        rainfallMm: -10,
        catchmentAreaSqm: 100,
        collectionEfficiency: 0.8,
        storageCapacityLitres: 1000,
      })
    ).toThrow('Rainfall cannot be negative');
  });

  it('throws error when efficiency is out of range 0 to 1', () => {
    expect(() =>
      calculateRainwaterHarvest({
        rainfallMm: 20,
        catchmentAreaSqm: 100,
        collectionEfficiency: 1.5,
        storageCapacityLitres: 1000,
      })
    ).toThrow('Collection efficiency must be between 0 and 1');

    expect(() =>
      calculateRainwaterHarvest({
        rainfallMm: 20,
        catchmentAreaSqm: 100,
        collectionEfficiency: -0.1,
        storageCapacityLitres: 1000,
      })
    ).toThrow('Collection efficiency must be between 0 and 1');
  });

  it('throws error on negative catchment area or storage capacity', () => {
    expect(() =>
      calculateRainwaterHarvest({
        rainfallMm: 20,
        catchmentAreaSqm: -50,
        collectionEfficiency: 0.8,
        storageCapacityLitres: 1000,
      })
    ).toThrow('Catchment area cannot be negative');

    expect(() =>
      calculateRainwaterHarvest({
        rainfallMm: 20,
        catchmentAreaSqm: 100,
        collectionEfficiency: 0.8,
        storageCapacityLitres: -500,
      })
    ).toThrow('Storage capacity cannot be negative');

    expect(() =>
      calculateRainwaterHarvest({
        rainfallMm: 20,
        catchmentAreaSqm: 100,
        collectionEfficiency: 0.8,
        storageCapacityLitres: 500,
        firstFlushMm: -1,
      })
    ).toThrow('First flush diversion cannot be negative');
  });
});

describe('Geographic Coordinate Validation', () => {
  it('validates coordinates strictly within Purulia District', () => {
    // Purulia Town approx 23.33°N, 86.36°E
    const res = validateCoordinates(23.332, 86.365);
    expect(res.valid).toBe(true);
    expect(res.inPuruliaDistrict).toBe(true);
    expect(res.inEasternPlateau).toBe(true);
    expect(res.message).toContain('within Purulia District');
  });

  it('identifies coordinates in the adjoining Eastern Plateau region outside Purulia', () => {
    // Ranchi/Bokaro fringe approx 23.6°N, 85.3°E
    const res = validateCoordinates(23.6, 85.3);
    expect(res.valid).toBe(true);
    expect(res.inPuruliaDistrict).toBe(false);
    expect(res.inEasternPlateau).toBe(true);
    expect(res.message).toContain('Eastern Plateau region outside Purulia');
  });

  it('flags coordinates completely outside the region', () => {
    // Delhi 28.6°N, 77.2°E
    const res = validateCoordinates(28.6, 77.2);
    expect(res.valid).toBe(true);
    expect(res.inPuruliaDistrict).toBe(false);
    expect(res.inEasternPlateau).toBe(false);
    expect(res.message).toContain('outside the Eastern Plateau');
  });

  it('handles missing or non-numeric coordinates gracefully', () => {
    expect(validateCoordinates(null, 86.36).valid).toBe(false);
    expect(validateCoordinates(23.33, null).valid).toBe(false);
    expect(validateCoordinates(NaN, 86.36).valid).toBe(false);
  });

  it('rejects mathematically impossible latitudes and longitudes', () => {
    expect(validateCoordinates(95, 86).valid).toBe(false);
    expect(validateCoordinates(23, 190).valid).toBe(false);
  });
});

describe('Water Quality Threshold Evaluation (IS 10500:2012)', () => {
  it('evaluates pH within acceptable range (6.5 to 8.5)', () => {
    const normal = evaluateWaterQuality('pH', 7.4);
    expect(normal.status).toBe('acceptable');

    const acidic = evaluateWaterQuality('pH', 5.8);
    expect(acidic.status).toBe('exceeded');
    expect(acidic.note).toContain('Acidic');

    const alkaline = evaluateWaterQuality('pH', 9.2);
    expect(alkaline.status).toBe('exceeded');
    expect(alkaline.note).toContain('Alkaline');
  });

  it('evaluates fluoride with critical warnings (endemic risk in Purulia)', () => {
    const safe = evaluateWaterQuality('fluoride_mg_l', 0.6);
    expect(safe.status).toBe('acceptable');

    const borderline = evaluateWaterQuality('fluoride_mg_l', 1.2);
    expect(borderline.status).toBe('permissible');

    const dangerous = evaluateWaterQuality('fluoride_mg_l', 2.1);
    expect(dangerous.status).toBe('exceeded');
    expect(dangerous.note).toContain('CRITICAL WARNING');
    expect(dangerous.note).toContain('fluorosis');
  });

  it('evaluates bacteriological coliform presence', () => {
    const absent = evaluateWaterQuality('coliform_presence', 'absent');
    expect(absent.status).toBe('acceptable');

    const present = evaluateWaterQuality('coliform_presence', 'present');
    expect(present.status).toBe('exceeded');
    expect(present.note).toContain('CONTAMINATION');
  });

  it('evaluates TDS thresholds', () => {
    expect(evaluateWaterQuality('tds_ppm', 300).status).toBe('acceptable');
    expect(evaluateWaterQuality('tds_ppm', 1200).status).toBe('permissible');
    expect(evaluateWaterQuality('tds_ppm', 2500).status).toBe('exceeded');
  });
});

describe('Rectangular Tank Storage Calculations', () => {
  it('calculates rectangular tank volume correctly', () => {
    // 4m length × 2.5m width × 1.5m water depth = 15 m³ = 15,000 Litres
    const tank = calculateRectangularTankVolume(4, 2.5, 1.5);
    expect(tank.volumeM3).toBe(15);
    expect(tank.volumeLitres).toBe(15000);
  });

  it('throws on negative tank dimensions', () => {
    expect(() => calculateRectangularTankVolume(-2, 3, 1)).toThrow('Tank dimensions cannot be negative');
    expect(() => calculateRectangularTankVolume(2, -3, 1)).toThrow('Tank dimensions cannot be negative');
    expect(() => calculateRectangularTankVolume(2, 3, -1)).toThrow('Tank dimensions cannot be negative');
  });
});

describe('Sensor Reading Plausibility Validation', () => {
  it('validates plausible water depths', () => {
    const res = validateWaterLevelReading(1.2, 2.0);
    expect(res.valid).toBe(true);
    expect(res.warning).toBeNull();
  });

  it('rejects negative sensor depths', () => {
    const res = validateWaterLevelReading(-0.5, 2.0);
    expect(res.valid).toBe(false);
    expect(res.warning).toContain('cannot be negative');
  });

  it('rejects unrealistic water levels exceeding 50 metres', () => {
    const res = validateWaterLevelReading(55, null);
    expect(res.valid).toBe(false);
    expect(res.warning).toContain('exceeds 50 m');
  });

  it('flags warning when level exceeds tank depth by more than 10%', () => {
    const res = validateWaterLevelReading(2.5, 2.0);
    expect(res.valid).toBe(false);
    expect(res.warning).toContain('exceeds tank depth');
  });

  it('flags warning for minor overflow within 10%', () => {
    const res = validateWaterLevelReading(2.1, 2.0);
    expect(res.valid).toBe(true);
    expect(res.warning).toContain('possible overflow');
  });
});

describe('Runoff Coefficient Reference Data', () => {
  it('provides justified runoff coefficients for different Purulia surfaces', () => {
    expect(RUNOFF_COEFFICIENTS.rcc_roof.coefficient).toBe(0.85);
    expect(RUNOFF_COEFFICIENTS.metal_corrugated.coefficient).toBe(0.80);
    expect(RUNOFF_COEFFICIENTS.clay_tile.coefficient).toBe(0.75);
    expect(RUNOFF_COEFFICIENTS.agricultural_land.coefficient).toBe(0.20);
  });
});

describe('Unit Conversions', () => {
  it('converts mm to metres correctly', () => {
    expect(mmToMetres(1000)).toBe(1);
    expect(mmToMetres(25)).toBe(0.025);
  });

  it('converts litres to cubic metres correctly', () => {
    expect(litresToCubicMetres(1000)).toBe(1);
    expect(litresToCubicMetres(500)).toBe(0.5);
  });

  it('converts cubic metres to litres correctly', () => {
    expect(cubicMetresToLitres(1)).toBe(1000);
    expect(cubicMetresToLitres(3.5)).toBe(3500);
  });
});

describe('Civil Structure Dimensioning & Land Footprint', () => {
  it('sizes rectangular storage tank with freeboard, dead storage, and access buffer', () => {
    const tank = calculateRectangularTankDimensions({
      targetUsableLitres: 15000, // 15 m³ usable
      waterDepthM: 1.8,
      freeboardM: 0.25,
      deadStorageM: 0.15,
      wallThicknessM: 0.25,
      maintenanceBufferM: 1.0,
    });

    expect(tank.structureType).toBe('rectangular_tank');
    expect(tank.usableVolumeLitres).toBeGreaterThanOrEqual(14000);
    expect(tank.depthM).toBe(2.2); // 1.8 + 0.25 + 0.15
    expect(tank.internalFootprintSqm).toBeGreaterThan(0);
    expect(tank.externalStructureFootprintSqm).toBeGreaterThan(tank.internalFootprintSqm);
    expect(tank.totalLandRequirementSqm).toBeGreaterThan(tank.externalStructureFootprintSqm);
    expect(tank.notes).toContain('Rectangular masonry/RCC tank');
  });

  it('sizes trapezoidal farm pond (hapa) with sloped sides and embankment berm', () => {
    const pond = calculateTrapezoidalPondDimensions({
      targetUsableLitres: 50000, // 50 m³
      waterDepthM: 2.0,
      freeboardM: 0.5,
      sideSlopeZ: 1.5,
      bermBufferM: 1.5,
    });

    expect(pond.structureType).toBe('farm_pond_hapa');
    expect(pond.usableVolumeLitres).toBeGreaterThanOrEqual(45000);
    expect(pond.depthM).toBe(2.5); // 2.0 water + 0.5 freeboard
    expect(pond.sideSlopeZ).toBe(1.5);
    expect(pond.totalLandRequirementSqm).toBeGreaterThan(pond.externalStructureFootprintSqm);
    expect(pond.notes).toContain('Hapa');
  });

  it('throws on invalid or non-positive dimensioning inputs', () => {
    expect(() =>
      calculateRectangularTankDimensions({ targetUsableLitres: -500 })
    ).toThrow('Target usable volume must be greater than zero');

    expect(() =>
      calculateTrapezoidalPondDimensions({ targetUsableLitres: 0 })
    ).toThrow('Target pond volume must be greater than zero');
  });
});

describe('12-Month Water Balance Simulation', () => {
  it('models monthly sequential storage balance over 12 months with IMD Purulia normal', () => {
    const sim = simulateMonthlyWaterBalance(
      150, // 150 m² roof
      0.85, // RCC roof C = 0.85
      10000, // 10,000 L tank
      120 // 120 L/day demand
    );

    expect(sim.monthlyPoints).toHaveLength(12);
    expect(sim.totalAnnualRainfallMm).toBeGreaterThan(1200);
    expect(sim.totalAnnualInflowLitres).toBeGreaterThan(0);
    expect(sim.totalAnnualDemandLitres).toBeGreaterThan(0);
    expect(sim.totalAnnualSuppliedLitres).toBeGreaterThan(0);

    // Stored volume can never exceed tank capacity
    sim.monthlyPoints.forEach(pt => {
      expect(pt.storedLitres).toBeLessThanOrEqual(10000);
      expect(pt.storedLitres).toBeGreaterThanOrEqual(0);
    });

    // In dry season (Nov-May), reliability is calculated
    expect(sim.drySeasonReliabilityPercent).toBeGreaterThanOrEqual(0);
    expect(sim.drySeasonReliabilityPercent).toBeLessThanOrEqual(100);
  });
});

describe('Preliminary Cost Estimation', () => {
  it('generates itemized cost breakdown for rectangular storage tank', () => {
    const cost = estimatePreliminaryCost({
      structureType: 'rectangular_tank',
      usableCapacityLitres: 15000,
      catchmentAreaSqm: 120,
      includeSensorMonitoring: true,
    });

    expect(cost.capitalCostINR).toBeGreaterThan(20000);
    expect(cost.annualMaintenanceINR).toBeGreaterThan(0);
    expect(cost.costPerLitresUsableINR).toBeGreaterThan(0);
    expect(cost.items.length).toBeGreaterThan(4);

    // Verifies key components exist
    const categories = cost.items.map(i => i.category);
    expect(categories).toContain('Conveyance');
    expect(categories).toContain('Pre-Treatment');
    expect(categories).toContain('Storage');
    expect(categories).toContain('Monitoring');
    expect(categories).toContain('Labour & Installation');
  });

  it('generates earthwork and weir cost breakdown for farm pond (hapa)', () => {
    const cost = estimatePreliminaryCost({
      structureType: 'farm_pond_hapa',
      usableCapacityLitres: 50000,
      includeSensorMonitoring: false,
    });

    expect(cost.capitalCostINR).toBeGreaterThan(0);
    const categories = cost.items.map(i => i.category);
    expect(categories).toContain('Earthwork');
    expect(categories).toContain('Civil Works');
  });
});
