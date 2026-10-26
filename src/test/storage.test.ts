import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveAllData,
  loadAllData,
  saveAsset,
  getAssets,
  getAssetById,
  deleteAsset,
  saveMaintenanceIssue,
  getMaintenanceIssues,
  deleteMaintenanceIssue,
  exportAssetsToCSV,
  exportObservationsToCSV,
  exportMaintenanceToCSV,
  importFromJSON,
  clearAllData,
} from '../lib/storage';
import type { Asset, MaintenanceIssue, AppData } from '../types';

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

  it('exports assets to valid CSV format with proper escaping', () => {
    saveAsset(sampleAsset);
    const csv = exportAssetsToCSV();
    expect(csv).toContain('id,name,type');
    expect(csv).toContain('Sirkabad Check Dam');
    expect(csv).toContain('Arsha');
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
});
