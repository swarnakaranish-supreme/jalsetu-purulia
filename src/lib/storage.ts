/* ============================================================
   JalSetu Purulia — Local Browser Storage Layer
   
   All data is persisted in the browser's localStorage.
   Records are NOT shared between browsers or devices.
   This is intentional for the local-first, privacy-respecting
   decision-support prototype — see docs/architecture.md.
   ============================================================ */

import type {
  AppData,
  Asset,
  SiteAssessment,
  MonitoringObservation,
  MaintenanceIssue,
  DataSourceType,
} from '../types';

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
    if (!parsed || parsed.version !== STORAGE_VERSION || !parsed.data) {
      console.warn('Storage envelope unreadable or version mismatch, initializing empty');
      return { version: STORAGE_VERSION, data: emptyData(), lastModified: new Date().toISOString() };
    }
    // Ensure all collections exist
    parsed.data.assets = Array.isArray(parsed.data.assets) ? parsed.data.assets : [];
    parsed.data.siteAssessments = Array.isArray(parsed.data.siteAssessments) ? parsed.data.siteAssessments : [];
    parsed.data.observations = Array.isArray(parsed.data.observations) ? parsed.data.observations : [];
    parsed.data.maintenanceIssues = Array.isArray(parsed.data.maintenanceIssues) ? parsed.data.maintenanceIssues : [];

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
  return (
    data.assets.length > 0 ||
    data.siteAssessments.length > 0 ||
    data.observations.length > 0 ||
    data.maintenanceIssues.length > 0
  );
}

export function isAllSimulated(): boolean {
  const data = loadAllData();
  if (!hasAnyData()) return false;
  const allAssets = data.assets.length === 0 || data.assets.every(a => a.isSimulated);
  const allSites = data.siteAssessments.length === 0 || data.siteAssessments.every(s => s.isSimulated);
  const allObs = data.observations.length === 0 || data.observations.every(o => o.isSimulated);
  const allIssues = data.maintenanceIssues.length === 0 || data.maintenanceIssues.every(m => m.isSimulated);
  return allAssets && allSites && allObs && allIssues;
}

/* --- Export --- */
export function exportToJSON(): string {
  return JSON.stringify(loadAllData(), null, 2);
}

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }
  const str = String(val);
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

export function exportAssetsToCSV(): string {
  const assets = getAssets();
  if (assets.length === 0) return '';
  const headers: (keyof Asset)[] = [
    'id',
    'name',
    'type',
    'block',
    'village',
    'latitude',
    'longitude',
    'condition',
    'maintenanceStatus',
    'storageCapacityLitres',
    'catchmentAreaSqm',
    'tankDepthM',
    'installationDate',
    'responsibleOrg',
    'evidenceSource',
    'dataSource',
    'isSimulated',
  ];
  const rows = assets.map(a => headers.map(h => escapeCSV(a[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportSitesToCSV(): string {
  const sites = getSiteAssessments();
  if (sites.length === 0) return '';
  const headers: (keyof SiteAssessment)[] = [
    'id',
    'name',
    'block',
    'village',
    'siteType',
    'latitude',
    'longitude',
    'catchmentAreaSqm',
    'slopeCategory',
    'soilType',
    'geologyInfo',
    'existingStructure',
    'existingStructureCondition',
    'waterDemand',
    'ownershipStatus',
    'assessmentDate',
    'dataSource',
    'isSimulated',
  ];
  const rows = sites.map(s => headers.map(h => escapeCSV(s[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportObservationsToCSV(): string {
  const obs = getObservations();
  if (obs.length === 0) return '';
  const headers: (keyof MonitoringObservation)[] = [
    'id',
    'assetId',
    'timestamp',
    'rainfallMm',
    'waterLevelM',
    'calculatedVolumeLitres',
    'isOverflow',
    'sensorStatus',
    'dataSource',
    'isSimulated',
    'notes',
  ];
  const rows = obs.map(o => headers.map(h => escapeCSV(o[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportMaintenanceToCSV(): string {
  const issues = getMaintenanceIssues();
  if (issues.length === 0) return '';
  const headers: (keyof MaintenanceIssue)[] = [
    'id',
    'assetId',
    'dateReported',
    'category',
    'priority',
    'status',
    'assignedTo',
    'description',
    'actionTaken',
    'resolutionDate',
    'isSimulated',
  ];
  const rows = issues.map(m => headers.map(h => escapeCSV(m[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

/* --- Import --- */
export function importFromJSON(jsonStr: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonStr) as AppData;
    if (!parsed.assets || !Array.isArray(parsed.assets)) {
      return { success: false, message: 'Invalid data format: missing assets array' };
    }
    const current = loadAllData();
    const merged: AppData = {
      assets: parsed.assets || current.assets,
      siteAssessments: parsed.siteAssessments || current.siteAssessments,
      observations: parsed.observations || current.observations,
      maintenanceIssues: parsed.maintenanceIssues || current.maintenanceIssues,
    };
    saveAllData(merged);
    return {
      success: true,
      message: `Imported ${merged.assets.length} assets, ${merged.siteAssessments.length} assessments, ${merged.observations.length} observations, ${merged.maintenanceIssues.length} maintenance issues`,
    };
  } catch (e) {
    return { success: false, message: `Parse error: ${e instanceof Error ? e.message : 'Unknown error'}` };
  }
}

/**
 * Robust CSV Observation Importer.
 * Supports standard CSV columns: timestamp, assetId, rainfallMm, waterLevelM, dataSource, notes.
 */
export function importObservationsFromCSV(
  csvContent: string,
  targetAssetIdFallback?: string
): { success: boolean; importedCount: number; errors: string[] } {
  const errors: string[] = [];
  const lines = csvContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    return { success: false, importedCount: 0, errors: ['CSV content must have at least a header row and one data row.'] };
  }

  const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  const timestampIdx = rawHeaders.findIndex(h => h.includes('time') || h.includes('date'));
  const rainfallIdx = rawHeaders.findIndex(h => h.includes('rain'));
  const waterLevelIdx = rawHeaders.findIndex(h => h.includes('level') || h.includes('depth'));
  const assetIdIdx = rawHeaders.findIndex(h => h.includes('asset'));
  const notesIdx = rawHeaders.findIndex(h => h.includes('note') || h.includes('comment'));

  if (timestampIdx === -1) {
    return { success: false, importedCount: 0, errors: ['CSV missing required "timestamp" or "date" column header.'] };
  }

  const existingObs = getObservations();
  const newObservations: MonitoringObservation[] = [];
  let rowNum = 1;

  for (let i = 1; i < lines.length; i++) {
    rowNum++;
    const row = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

    const rawTs = row[timestampIdx] || '';
    if (!rawTs) {
      errors.push(`Row ${rowNum}: Empty timestamp.`);
      continue;
    }

    const parsedDate = new Date(rawTs);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`Row ${rowNum}: Invalid timestamp format "${rawTs}". Use ISO (YYYY-MM-DDTHH:mm:ss) or YYYY-MM-DD.`);
      continue;
    }
    const isoTimestamp = parsedDate.toISOString();

    const assetId = (assetIdIdx >= 0 ? row[assetIdIdx] : '') || targetAssetIdFallback || '';
    if (!assetId) {
      errors.push(`Row ${rowNum}: Missing asset ID.`);
      continue;
    }

    const rainVal = rainfallIdx >= 0 && row[rainfallIdx] !== '' ? parseFloat(row[rainfallIdx]) : null;
    if (rainVal !== null && (isNaN(rainVal) || rainVal < 0)) {
      errors.push(`Row ${rowNum}: Invalid negative or non-numeric rainfall value.`);
      continue;
    }

    const levelVal = waterLevelIdx >= 0 && row[waterLevelIdx] !== '' ? parseFloat(row[waterLevelIdx]) : null;
    if (levelVal !== null && (isNaN(levelVal) || levelVal < 0 || levelVal > 50)) {
      errors.push(`Row ${rowNum}: Water level out of plausible range (0 to 50 m).`);
      continue;
    }

    // Check duplicate
    const isDuplicate =
      existingObs.some(o => o.assetId === assetId && o.timestamp === isoTimestamp) ||
      newObservations.some(o => o.assetId === assetId && o.timestamp === isoTimestamp);

    if (isDuplicate) {
      // Skip duplicate gracefully
      continue;
    }

    const notes = notesIdx >= 0 && row[notesIdx] ? row[notesIdx] : 'Imported via CSV batch upload';

    newObservations.push({
      id: generateId(),
      assetId,
      timestamp: isoTimestamp,
      rainfallMm: rainVal,
      waterLevelM: levelVal,
      calculatedVolumeLitres: null,
      isOverflow: false,
      sensorStatus: 'ok',
      dataSource: 'imported_csv' as DataSourceType,
      notes,
      isSimulated: false,
    });
  }

  if (newObservations.length > 0) {
    const data = loadAllData();
    data.observations.push(...newObservations);
    saveAllData(data);
  }

  return {
    success: newObservations.length > 0 || errors.length === 0,
    importedCount: newObservations.length,
    errors,
  };
}

/* --- Clear --- */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
