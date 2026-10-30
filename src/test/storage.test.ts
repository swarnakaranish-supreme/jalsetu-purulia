import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveAllData,
  loadAllData,
  saveAsset,
  getAssets,
  getAssetById,
  deleteAsset,
  saveSiteAssessment,
  getSiteAssessments,
  deleteSiteAssessment,
  saveMaintenanceIssue,
  getMaintenanceIssues,
  deleteMaintenanceIssue,
  saveObservation,
  getObservations,
  exportAssetsToCSV,
  exportSitesToCSV,
  exportObservationsToCSV,
  exportMaintenanceToCSV,
  importFromJSON,
  importObservationsFromCSV,
  clearAllData,
} from '../lib/storage';
import type { Asset, SiteAssessment, MaintenanceIssue, MonitoringObservation, AppData } from '../types';

describe('Storage & CRUD Operations', () => {
  beforeEach(() => {
    clearAllData();
  });

  const sampleAsset: Asset = {
    id: 'test-asset-1',
    name: 'Sirkabad Check Dam',
    type: 'check_dam',
    block: 'Arsha',
    village: 'Sirkabad',
    latitude: 23.28,
    longitude: 86.25,
    installationDate: '2021-02-14',
    condition: 'fair',
    responsibleOrg: 'Arsha Gram Panchayat',
    maintenanceStatus: 'scheduled',
    storageCapacityLitres: 250000,
    catchmentAreaSqm: 15000,
    tankLengthM: null,
    tankWidthM: null,
    tankDepthM: 2.2,
    notes: 'Requires silt clearance before monsoon',
    dataSource: 'Gram Panchayat Register',
    isSimulated: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const sampleSite: SiteAssessment = {
    id: 'test-site-1',
    name: 'Candidate Terraced Field Hapa',
    block: 'Baghmundi',
    village: 'Matha',
    latitude: 23.2,
    longitude: 86.1,
    siteType: 'agricultural_land',
    catchmentAreaSqm: 2500,
    slopeCategory: 'gentle',
    soilType: 'laterite',
    geologyInfo: 'Weathered laterite mantle',
    existingStructure: '',
    existingStructureCondition: 'unknown',
    waterDemand: 'Kharif supplementary irrigation for 2 ha',
    ownershipStatus: 'government',
    constraints: 'None',
    dataSource: 'Direct field visit',
    assessmentDate: '2024-05-15',
    notes: 'Suitable for 30-40 farm pond',
    isSimulated: false,
    createdAt: '2024-05-15T09:00:00Z',
    updatedAt: '2024-05-15T09:00:00Z',
  };

  it('saves and retrieves assets', () => {
    saveAsset(sampleAsset);
    const assets = getAssets();
    expect(assets.length).toBe(1);
    expect(assets[0].name).toBe('Sirkabad Check Dam');

    const byId = getAssetById('test-asset-1');
    expect(byId?.village).toBe('Sirkabad');
  });

  it('updates an existing asset', () => {
    saveAsset(sampleAsset);
    const modified: Asset = {
      ...sampleAsset,
      condition: 'good',
      maintenanceStatus: 'none_required',
    };
    saveAsset(modified);

    const assets = getAssets();
    expect(assets.length).toBe(1);
    expect(assets[0].condition).toBe('good');
    expect(assets[0].maintenanceStatus).toBe('none_required');
  });

  it('deletes an asset by ID', () => {
    saveAsset(sampleAsset);
    expect(getAssets().length).toBe(1);
    deleteAsset('test-asset-1');
    expect(getAssets().length).toBe(0);
  });

  it('performs CRUD operations on site assessments', () => {
    saveSiteAssessment(sampleSite);
    let sites = getSiteAssessments();
    expect(sites.length).toBe(1);
    expect(sites[0].name).toBe('Candidate Terraced Field Hapa');

    deleteSiteAssessment('test-site-1');
    sites = getSiteAssessments();
    expect(sites.length).toBe(0);
  });

  it('handles maintenance issue CRUD and status updates', () => {
    const issue: MaintenanceIssue = {
      id: 'issue-01',
      assetId: 'test-asset-1',
      dateReported: '2024-06-01',
      category: 'siltation',
      description: 'Silt depth reached 0.8m',
      priority: 'high',
      assignedTo: 'NREGA Team',
      status: 'open',
      actionTaken: '',
      resolutionDate: '',
      isSimulated: false,
      createdAt: '2024-06-01T10:00:00Z',
      updatedAt: '2024-06-01T10:00:00Z',
    };

    saveMaintenanceIssue(issue);
    let issues = getMaintenanceIssues();
    expect(issues.length).toBe(1);
    expect(issues[0].status).toBe('open');

    // Update status to resolved
    const resolvedIssue: MaintenanceIssue = {
      ...issue,
      status: 'resolved',
      actionTaken: 'Desilted 120 cubic metres of silt',
      resolutionDate: '2024-06-05',
    };
    saveMaintenanceIssue(resolvedIssue);

    issues = getMaintenanceIssues();
    expect(issues.length).toBe(1);
    expect(issues[0].status).toBe('resolved');
    expect(issues[0].actionTaken).toContain('Desilted');

    deleteMaintenanceIssue('issue-01');
    expect(getMaintenanceIssues().length).toBe(0);
  });

  it('exports assets and site assessments to valid CSV format with proper escaping', () => {
    saveAsset(sampleAsset);
    const assetCsv = exportAssetsToCSV();
    expect(assetCsv).toContain('id,name,type');
    expect(assetCsv).toContain('Sirkabad Check Dam');
    expect(assetCsv).toContain('Arsha');

    saveSiteAssessment(sampleSite);
    const siteCsv = exportSitesToCSV();
    expect(siteCsv).toContain('id,name,block');
    expect(siteCsv).toContain('Candidate Terraced Field Hapa');
    expect(siteCsv).toContain('Baghmundi');
  });

  it('imports valid JSON and rejects corrupted payload', () => {
    const validData: AppData = {
      assets: [sampleAsset],
      siteAssessments: [],
      observations: [],
      maintenanceIssues: [],
    };
    const res = importFromJSON(JSON.stringify(validData));
    expect(res.success).toBe(true);
    expect(getAssets().length).toBe(1);

    const invalidRes = importFromJSON('{ corrupted json ');
    expect(invalidRes.success).toBe(false);
  });

  it('imports observations from CSV with validation and duplicate prevention', () => {
    saveAsset(sampleAsset);

    const validCsv = `timestamp,rainfallMm,waterLevelM,assetId,notes
2024-07-01T08:00:00Z,25.5,1.10,test-asset-1,Morning reading
2024-07-05T08:00:00Z,14.0,1.25,test-asset-1,After shower`;

    const res = importObservationsFromCSV(validCsv);
    expect(res.success).toBe(true);
    expect(res.importedCount).toBe(2);
    expect(res.errors.length).toBe(0);

    const obs = getObservations();
    expect(obs.length).toBe(2);
    expect(obs[0].rainfallMm).toBe(25.5);

    // Duplicate import test — re-importing identical timestamps should not create duplicates
    const resDup = importObservationsFromCSV(validCsv);
    expect(resDup.importedCount).toBe(0);
    expect(getObservations().length).toBe(2);
  });

  it('handles invalid rows in CSV observation import gracefully', () => {
    saveAsset(sampleAsset);

    const malformedCsv = `timestamp,rainfallMm,waterLevelM,notes
invalid-date,25.5,1.10,Bad date
2024-07-10T08:00:00Z,-5.0,1.10,Negative rain
2024-07-12T08:00:00Z,10.0,60.0,Implausible depth exceeding 50m
2024-07-15T08:00:00Z,15.0,1.05,Valid row with fallback asset`;

    const res = importObservationsFromCSV(malformedCsv, 'test-asset-1');
    expect(res.importedCount).toBe(1);
    expect(res.errors.length).toBe(3);
    expect(res.errors.some(e => e.includes('Invalid timestamp'))).toBe(true);
    expect(res.errors.some(e => e.includes('negative'))).toBe(true);
    expect(res.errors.some(e => e.includes('out of plausible range'))).toBe(true);
  });
});
