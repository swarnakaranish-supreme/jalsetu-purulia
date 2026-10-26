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
    dataSource: 'School survey',
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
    dataSource: '',
    assessmentDate: '',
    notes: '',
    isSimulated: false,
    createdAt: '2024-05-10T10:00:00Z',
    updatedAt: '2024-05-10T10:00:00Z',
  };

  it('produces a comprehensive score breakdown for a complete site', () => {
    const res = screenSite(completeSite);

    expect(res.totalScore).toBeGreaterThan(0);
    expect(res.percentage).toBeGreaterThan(60);
    expect(res.factors.length).toBe(8);
    expect(res.recommendation).toContain('warrant further detailed assessment');
    expect(res.warnings.some(w => w.includes('provisional demonstration tool'))).toBe(true);
  });

  it('handles insufficient information gracefully without throwing', () => {
    const res = screenSite(bareSite);

    expect(res.recommendation).toContain('Insufficient information');
    expect(res.missingData.length).toBeGreaterThan(3);
    expect(res.missingData).toContain('Catchment area not specified');
    expect(res.missingData).toContain('Slope category not specified');
    expect(res.missingData).toContain('Land ownership and permission status not verified');
    expect(res.warnings.some(w => w.includes('More than half'))).toBe(true);
  });

  it('favours restoration of fair-condition existing assets', () => {
    const res = screenSite(completeSite);
    const structFactor = res.factors.find(f => f.name === 'Existing Structure');
    expect(structFactor).toBeDefined();
    expect(structFactor?.score).toBe(7);
    expect(structFactor?.reasoning).toContain('Restoration may be more cost-effective');
  });

  it('penalises unpermitted or disputed land', () => {
    const disputedSite: SiteAssessment = {
      ...completeSite,
      id: 'disputed-site',
      ownershipStatus: 'disputed',
    };
    const res = screenSite(disputedSite);
    const landFactor = res.factors.find(f => f.name === 'Land Availability');
    expect(landFactor?.score).toBe(1);
    expect(landFactor?.reasoning).toContain('Disputed');
  });
});
