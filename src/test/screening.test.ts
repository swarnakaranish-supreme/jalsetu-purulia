import { describe, it, expect } from 'vitest';
import { screenSite } from '../lib/screening';
import type { SiteAssessment } from '../types';

describe('Site Screening Method', () => {
  const completeSite: SiteAssessment = {
    id: 'test-site-01',
    name: 'Lagda High School Roof',
    block: 'Purulia-I',
    village: 'Lagda',
    latitude: 23.33,
    longitude: 86.36,
    siteType: 'rooftop',
    catchmentAreaSqm: 400,
    slopeCategory: 'gentle',
    soilType: 'laterite',
    geologyInfo: 'Weathered granite gneiss mantle',
    existingStructure: 'Rooftop guttering (needs repair)',
    existingStructureCondition: 'fair',
    waterDemand: 'Drinking and midday meal water for 300 students',
    ownershipStatus: 'government',
    constraints: 'Electricity intermittent for pump',
    dataSource: 'Direct field visit assessment',
    assessmentDate: '2024-05-10',
    notes: 'Good candidate for rooftop rainwater harvesting',
    isSimulated: false,
    createdAt: '2024-05-10T10:00:00Z',
    updatedAt: '2024-05-10T10:00:00Z',
  };

  const bareSite: SiteAssessment = {
    id: 'test-site-bare',
    name: 'Unsurveyed Location',
    block: '',
    village: '',
    latitude: null,
    longitude: null,
    siteType: 'other',
    catchmentAreaSqm: null,
    slopeCategory: 'unknown',
    soilType: 'unknown',
    geologyInfo: '',
    existingStructure: '',
    existingStructureCondition: 'unknown',
    waterDemand: '',
    ownershipStatus: 'unknown',
    constraints: '',
    dataSource: 'Not verified / demonstration entry',
    assessmentDate: '',
    notes: '',
    isSimulated: false,
    createdAt: '2024-05-10T10:00:00Z',
    updatedAt: '2024-05-10T10:00:00Z',
  };

  it('produces a comprehensive score breakdown for a complete site without marking it insufficient', () => {
    const res = screenSite(completeSite);

    expect(res.isInsufficient).toBe(false);
    expect(res.criticalMissing.length).toBe(0);
    expect(res.totalScore).toBeGreaterThan(0);
    expect(res.percentage).toBeGreaterThan(60);
    expect(res.factors.length).toBe(8);
    expect(res.recommendation).toContain('favourable preliminary characteristics');
    expect(res.warnings.some(w => w.includes('provisional demonstration heuristic'))).toBe(true);
    expect(res.status).toBe('favourable');
    expect(res.positiveFactors.length).toBeGreaterThan(0);
    expect(res.recommendedNextSteps.length).toBeGreaterThan(0);

    // Verify all factors provide screening impact explanations
    res.factors.forEach(f => {
      expect(f.screeningImpact).toBeDefined();
      expect(f.screeningImpact.length).toBeGreaterThan(15);
    });
  });

  it('marks incomplete sites as Insufficient Information when critical factors are missing', () => {
    const res = screenSite(bareSite);

    expect(res.isInsufficient).toBe(true);
    expect(res.criticalMissing.length).toBe(5);
    expect(res.criticalMissing).toContain('Catchment area');
    expect(res.criticalMissing).toContain('Slope category');
    expect(res.criticalMissing).toContain('Soil / Geology information');
    expect(res.criticalMissing).toContain('Land ownership / permission status');
    expect(res.criticalMissing).toContain('Water demand / intended use');

    expect(res.recommendation).toContain('Insufficient information for assessment');
    expect(res.recommendation).toContain('Do not interpret a low score under incomplete data as poor site quality');
    expect(res.warnings.some(w => w.includes('Critical baseline information is missing'))).toBe(true);
    expect(res.status).toBe('insufficient_data');
  });

  it('marks site as insufficient even if only one critical parameter (e.g. Catchment Area) is missing', () => {
    const missingCatchment: SiteAssessment = {
      ...completeSite,
      catchmentAreaSqm: null,
    };
    const res = screenSite(missingCatchment);

    expect(res.isInsufficient).toBe(true);
    expect(res.criticalMissing).toEqual(['Catchment area']);
    expect(res.recommendation).toContain('Insufficient information for assessment');
  });

  it('marks site as insufficient if land permission is unverified', () => {
    const unverifiedLand: SiteAssessment = {
      ...completeSite,
      ownershipStatus: 'unknown',
    };
    const res = screenSite(unverifiedLand);

    expect(res.isInsufficient).toBe(true);
    expect(res.criticalMissing).toContain('Land ownership / permission status');
  });

  it('marks site as insufficient if water demand is missing or blank', () => {
    const noDemand: SiteAssessment = {
      ...completeSite,
      waterDemand: '   ',
    };
    const res = screenSite(noDemand);

    expect(res.isInsufficient).toBe(true);
    expect(res.criticalMissing).toContain('Water demand / intended use');
  });

  it('favours restoration of fair-condition existing assets', () => {
    const res = screenSite(completeSite);
    const structFactor = res.factors.find(f => f.name === 'Existing Structure Condition');
    expect(structFactor).toBeDefined();
    expect(structFactor?.score).toBe(7);
    expect(structFactor?.reasoning).toContain('Rehabilitation and desilting is prioritized');
    expect(structFactor?.screeningImpact).toContain('Restoration-First Principle');
  });

  it('penalises unpermitted or disputed land', () => {
    const disputedSite: SiteAssessment = {
      ...completeSite,
      id: 'disputed-site',
      ownershipStatus: 'disputed',
    };
    const res = screenSite(disputedSite);
    const landFactor = res.factors.find(f => f.name === 'Land Ownership & Permission');
    expect(landFactor?.score).toBe(1);
    expect(landFactor?.reasoning).toContain('Disputed ownership');
  });

  it('incorporates social equity and drinking water priority', () => {
    const highEquitySite: SiteAssessment = {
      ...completeSite,
      id: 'equity-site',
      equityPriority: 'high',
      communityNeed: 'Acute drinking water scarcity in underserved hamlet',
    };
    const res = screenSite(highEquitySite);
    expect(res.positiveFactors.some(p => p.includes('drinking water vulnerability'))).toBe(true);
  });

  it('detects reported water-quality risks and flags them in constraints and recommended steps', () => {
    const riskSite: SiteAssessment = {
      ...completeSite,
      id: 'wq-risk-site',
      waterQualityConcerns: 'High fluoride suspected from nearby tube wells (1.8 mg/L)',
    };
    const res = screenSite(riskSite);
    expect(res.constraintsAndRisks.some(c => c.includes('fluoride'))).toBe(true);
    expect(res.recommendedNextSteps.some(s => s.includes('NABL/PHED certified'))).toBe(true);
  });

  it('distinguishes recharge feasibility across hard rock, clay, and weathered laterite formations', () => {
    const rockySite: SiteAssessment = {
      ...completeSite,
      soilType: 'rocky',
      geologyInfo: 'Massive crystalline granite-gneiss basement',
    };
    const rockyRes = screenSite(rockySite);
    expect(rockyRes.rechargeFeasibilityNote).toContain('Impermeable crystalline hard-rock basement');
    expect(rockyRes.rechargeFeasibilityNote).toContain('NOT recommended without secondary fracture geophysics');

    const claySite: SiteAssessment = {
      ...completeSite,
      soilType: 'clay',
    };
    const clayRes = screenSite(claySite);
    expect(clayRes.rechargeFeasibilityNote).toContain('Heavy clay soil has very low infiltration');

    const lateriteSite: SiteAssessment = {
      ...completeSite,
      soilType: 'laterite',
    };
    const lateriteRes = screenSite(lateriteSite);
    expect(lateriteRes.rechargeFeasibilityNote).toContain('Weathered mantle or alluvial soil permits natural sub-surface percolation');
  });
});
