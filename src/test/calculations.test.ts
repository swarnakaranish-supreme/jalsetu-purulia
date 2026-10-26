import { describe, it, expect } from 'vitest';
import {
  calculateRainwaterHarvest,
  calculateRectangularTankVolume,
  validateWaterLevelReading,
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
