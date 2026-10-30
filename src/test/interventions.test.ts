import { describe, it, expect } from 'vitest';
import {
  INTERVENTION_OPTIONS,
  evaluateInterventionsForSite,
} from '../lib/interventions';
import type { SiteAssessment } from '../types';

describe('Intervention Catalog & Multi-Criteria Options', () => {
  it('includes 10 distinct, technically justified intervention options', () => {
    expect(INTERVENTION_OPTIONS.length).toBe(10);

    const ids = INTERVENTION_OPTIONS.map(o => o.id);
    expect(ids).toContain('restore-existing');
    expect(ids).toContain('rooftop-rwh');
    expect(ids).toContain('farm-pond');
    expect(ids).toContain('check-dam');
    expect(ids).toContain('contour-trenching');
    expect(ids).toContain('percolation-tank');
    expect(ids).toContain('recharge-shaft');
    expect(ids).toContain('infrastructure-repair');
    expect(ids).toContain('efficient-irrigation');
    expect(ids).toContain('storage-distribution');
  });

  it('clearly marks restoration interventions under the Restoration-First Principle', () => {
    const restorationOpts = INTERVENTION_OPTIONS.filter(o => o.isRestoration);
    expect(restorationOpts.length).toBeGreaterThanOrEqual(2);
    expect(restorationOpts.some(o => o.id === 'restore-existing')).toBe(true);
    expect(restorationOpts.some(o => o.id === 'infrastructure-repair')).toBe(true);
  });

  it('documents maintenance, engineering, and statutory permission requirements for every option', () => {
    INTERVENTION_OPTIONS.forEach(opt => {
      expect(opt.advantages.length).toBeGreaterThan(0);
      expect(opt.limitations.length).toBeGreaterThan(0);
      expect(opt.maintenanceRequirements.length).toBeGreaterThan(0);
      expect(opt.dataNeeded.length).toBeGreaterThan(0);
      expect(opt.engineeringRequirements.length).toBeGreaterThan(0);
      expect(opt.permissionRequirements.length).toBeGreaterThan(0);
      expect(opt.costBasis).toBeDefined();
    });
  });
});

describe('Site-Specific Intervention Evaluation Engine', () => {
  const rooftopSite: SiteAssessment = {
    id: 'eval-site-roof',
    name: 'Primary Health Centre Rooftop',
    block: 'Kashipur',
    village: 'Kashipur',
    latitude: 23.43,
    longitude: 86.66,
    siteType: 'rooftop',
    catchmentAreaSqm: 350,
    slopeCategory: 'flat',
    soilType: 'red_soil',
    geologyInfo: 'Granite gneiss',
    existingStructure: 'Downpipes',
    existingStructureCondition: 'good',
    waterDemand: 'Drinking and clinical water',
    ownershipStatus: 'government',
    constraints: '',
    dataSource: 'Field visit',
    assessmentDate: '2024-05-01',
    notes: '',
    isSimulated: false,
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  };

  const farmSite: SiteAssessment = {
    id: 'eval-site-farm',
    name: 'Terraced Agricultural Field',
    block: 'Baghmundi',
    village: 'Matha',
    latitude: 23.2,
    longitude: 86.08,
    siteType: 'agricultural_land',
    catchmentAreaSqm: 4000,
    slopeCategory: 'gentle',
    soilType: 'laterite',
    geologyInfo: 'Weathered mantle',
    existingStructure: '',
    existingStructureCondition: 'unknown',
    waterDemand: 'Supplementary irrigation for Kharif paddy',
    ownershipStatus: 'government',
    constraints: '',
    dataSource: 'Field visit',
    assessmentDate: '2024-05-01',
    notes: '',
    isSimulated: false,
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  };

  const rockyStreamSite: SiteAssessment = {
    id: 'eval-site-stream',
    name: 'Rocky Natural Drainage Channel',
    block: 'Arsha',
    village: 'Sirkabad',
    latitude: 23.28,
    longitude: 86.25,
    siteType: 'drainage_channel',
    catchmentAreaSqm: 12000,
    slopeCategory: 'gentle',
    soilType: 'rocky',
    geologyInfo: 'Massive unweathered granite gneiss bedrock',
    existingStructure: 'Old breached check dam',
    existingStructureCondition: 'fair',
    waterDemand: 'Community lift irrigation',
    ownershipStatus: 'government',
    constraints: '',
    dataSource: 'Field visit',
    assessmentDate: '2024-05-01',
    notes: '',
    isSimulated: false,
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  };

  it('recommends rooftop RWH for building rooftops and rejects check dams', () => {
    const results = evaluateInterventionsForSite(rooftopSite);

    const rwh = results.find(r => r.intervention.id === 'rooftop-rwh');
    expect(rwh?.recommendationStatus).toBe('highly_recommended');
    expect(rwh?.suitabilityReason).toContain('rooftop catchment');

    const checkDam = results.find(r => r.intervention.id === 'check-dam');
    expect(checkDam?.recommendationStatus).toBe('not_recommended');
  });

  it('recommends farm ponds for agricultural terraces and restoration when existing structure is present', () => {
    const results = evaluateInterventionsForSite(farmSite);

    const farmPond = results.find(r => r.intervention.id === 'farm-pond');
    expect(farmPond?.recommendationStatus).toBe('highly_recommended');
    expect(farmPond?.suitabilityReason).toContain('Agricultural land');
  });

  it('prioritises restoration for existing structures in fair condition', () => {
    const results = evaluateInterventionsForSite(rockyStreamSite);

    const restore = results.find(r => r.intervention.id === 'restore-existing');
    expect(restore?.recommendationStatus).toBe('highly_recommended');
    expect(restore?.suitabilityReason).toContain('Restoration Priority');
  });

  it('warns against sub-surface recharge shafts on massive unweathered crystalline bedrock', () => {
    const results = evaluateInterventionsForSite(rockyStreamSite);

    const recharge = results.find(r => r.intervention.id === 'recharge-shaft');
    expect(recharge?.recommendationStatus).toBe('not_recommended');
    expect(recharge?.suitabilityReason).toContain('crystalline granite-gneiss hard rock blocks downward recharge');
    expect(recharge?.siteSpecificRisks.some(risk => risk.includes('impermeable hard rock'))).toBe(true);
  });
});
