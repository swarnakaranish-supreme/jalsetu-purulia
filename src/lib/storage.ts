/* ============================================================
   JalSetu Purulia — Local Browser Storage Layer
   
   All data is persisted in the browser's localStorage.
   Records are NOT shared between browsers or devices.
   This is intentional for the MVP — see docs/architecture.md.
   ============================================================ */

import type { AppData, Asset, SiteAssessment, MonitoringObservation, MaintenanceIssue } from '../types';

const STORAGE_KEY = 'jalsetu_purulia_data';
const STORAGE_VERSION = 1;

interface StorageEnvelope {
  version: number;
  data: AppData;
  lastModified: string;
}

function emptyData(): AppData {
  return {
    assets: [],
    siteAssessments: [],
    observations: [],
    maintenanceIssues: [],
  };
}

function loadEnvelope(): StorageEnvelope {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: STORAGE_VERSION, data: emptyData(), lastModified: new Date().toISOString() };
    }
    const parsed = JSON.parse(raw) as StorageEnvelope;
    if (parsed.version !== STORAGE_VERSION) {
      // Future: migration logic
      console.warn('Storage version mismatch, resetting data');
      return { version: STORAGE_VERSION, data: emptyData(), lastModified: new Date().toISOString() };
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load data from localStorage:', e);
    return { version: STORAGE_VERSION, data: emptyData(), lastModified: new Date().toISOString() };
  }
}

function saveEnvelope(envelope: StorageEnvelope): void {
  envelope.lastModified = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

/* ---------- Public API ---------- */

export function loadAllData(): AppData {
  return loadEnvelope().data;
}

export function saveAllData(data: AppData): void {
  saveEnvelope({ version: STORAGE_VERSION, data, lastModified: new Date().toISOString() });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/* --- Assets --- */
export function getAssets(): Asset[] {
  return loadAllData().assets;
}

export function getAssetById(id: string): Asset | undefined {
  return getAssets().find(a => a.id === id);
}

export function saveAsset(asset: Asset): void {
  const data = loadAllData();
  const idx = data.assets.findIndex(a => a.id === asset.id);
  if (idx >= 0) {
    data.assets[idx] = { ...asset, updatedAt: new Date().toISOString() };
  } else {
    data.assets.push({ ...asset, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveAllData(data);
}

export function deleteAsset(id: string): void {
  const data = loadAllData();
  data.assets = data.assets.filter(a => a.id !== id);
  saveAllData(data);
}

/* --- Site Assessments --- */
export function getSiteAssessments(): SiteAssessment[] {
  return loadAllData().siteAssessments;
}

export function getSiteAssessmentById(id: string): SiteAssessment | undefined {
  return getSiteAssessments().find(s => s.id === id);
}

export function saveSiteAssessment(site: SiteAssessment): void {
  const data = loadAllData();
  const idx = data.siteAssessments.findIndex(s => s.id === site.id);
  if (idx >= 0) {
    data.siteAssessments[idx] = { ...site, updatedAt: new Date().toISOString() };
  } else {
    data.siteAssessments.push({ ...site, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveAllData(data);
}

export function deleteSiteAssessment(id: string): void {
  const data = loadAllData();
  data.siteAssessments = data.siteAssessments.filter(s => s.id !== id);
  saveAllData(data);
}

/* --- Observations --- */
export function getObservations(): MonitoringObservation[] {
  return loadAllData().observations;
}

export function getObservationsByAsset(assetId: string): MonitoringObservation[] {
  return getObservations().filter(o => o.assetId === assetId);
}

export function saveObservation(obs: MonitoringObservation): void {
  const data = loadAllData();
  const idx = data.observations.findIndex(o => o.id === obs.id);
  if (idx >= 0) {
    data.observations[idx] = obs;
  } else {
    data.observations.push(obs);
  }
  saveAllData(data);
}

export function deleteObservation(id: string): void {
  const data = loadAllData();
  data.observations = data.observations.filter(o => o.id !== id);
  saveAllData(data);
}

/* --- Maintenance Issues --- */
export function getMaintenanceIssues(): MaintenanceIssue[] {
  return loadAllData().maintenanceIssues;
}

export function getMaintenanceIssuesByAsset(assetId: string): MaintenanceIssue[] {
  return getMaintenanceIssues().filter(m => m.assetId === assetId);
}

export function saveMaintenanceIssue(issue: MaintenanceIssue): void {
  const data = loadAllData();
  const idx = data.maintenanceIssues.findIndex(m => m.id === issue.id);
  if (idx >= 0) {
    data.maintenanceIssues[idx] = { ...issue, updatedAt: new Date().toISOString() };
  } else {
    data.maintenanceIssues.push({ ...issue, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveAllData(data);
}

export function deleteMaintenanceIssue(id: string): void {
  const data = loadAllData();
  data.maintenanceIssues = data.maintenanceIssues.filter(m => m.id !== id);
  saveAllData(data);
}

/* --- Data check --- */
export function hasAnyData(): boolean {
  const data = loadAllData();
  return data.assets.length > 0 || data.siteAssessments.length > 0 ||
    data.observations.length > 0 || data.maintenanceIssues.length > 0;
}

export function isAllSimulated(): boolean {
  const data = loadAllData();
  const allAssets = data.assets.every(a => a.isSimulated);
  const allSites = data.siteAssessments.every(s => s.isSimulated);
  const allObs = data.observations.every(o => o.isSimulated);
  const allIssues = data.maintenanceIssues.every(m => m.isSimulated);
  return allAssets && allSites && allObs && allIssues;
}

/* --- Export --- */
export function exportToJSON(): string {
  return JSON.stringify(loadAllData(), null, 2);
}

export function exportAssetsToCSV(): string {
  const assets = getAssets();
  if (assets.length === 0) return '';
  const headers = Object.keys(assets[0]);
  const rows = assets.map(a =>
    headers.map(h => {
      const val = (a as unknown as Record<string, unknown>)[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportObservationsToCSV(): string {
  const obs = getObservations();
  if (obs.length === 0) return '';
  const headers = Object.keys(obs[0]);
  const rows = obs.map(o =>
    headers.map(h => {
      const val = (o as unknown as Record<string, unknown>)[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportMaintenanceToCSV(): string {
  const issues = getMaintenanceIssues();
  if (issues.length === 0) return '';
  const headers = Object.keys(issues[0]);
  const rows = issues.map(m =>
    headers.map(h => {
      const val = (m as unknown as Record<string, unknown>)[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

/* --- Import --- */
export function importFromJSON(jsonStr: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonStr) as AppData;
    if (!parsed.assets || !Array.isArray(parsed.assets)) {
      return { success: false, message: 'Invalid data format: missing assets array' };
    }
    saveAllData(parsed);
    return { success: true, message: `Imported ${parsed.assets.length} assets, ${parsed.observations?.length ?? 0} observations, ${parsed.maintenanceIssues?.length ?? 0} maintenance issues` };
  } catch (e) {
    return { success: false, message: `Parse error: ${e instanceof Error ? e.message : 'Unknown error'}` };
  }
}

/* --- Clear --- */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
