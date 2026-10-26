/* ============================================================
   JalSetu Purulia — Core Type Definitions
   ============================================================ */

/* ---------- Asset ---------- */
export type AssetType =
  | 'rooftop_rwh'
  | 'pond'
  | 'check_dam'
  | 'percolation_tank'
  | 'recharge_shaft'
  | 'farm_pond'
  | 'channel'
  | 'other';

export type AssetCondition =
  | 'good'
  | 'fair'
  | 'poor'
  | 'non_functional'
  | 'unknown';

export type MaintenanceStatus =
  | 'none_required'
  | 'scheduled'
  | 'overdue'
  | 'in_progress'
  | 'unknown';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  block: string;
  village: string;
  latitude: number | null;
  longitude: number | null;
  installationDate: string; // ISO date or ''
  condition: AssetCondition;
  responsibleOrg: string;
  maintenanceStatus: MaintenanceStatus;
  storageCapacityLitres: number | null;
  catchmentAreaSqm: number | null;
  tankLengthM: number | null;
  tankWidthM: number | null;
  tankDepthM: number | null;
  notes: string;
  dataSource: string;
  isSimulated: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Site Assessment ---------- */
export type SiteType =
  | 'rooftop'
  | 'existing_pond'
  | 'drainage_channel'
  | 'agricultural_land'
  | 'other';

export type SlopeCategory =
  | 'flat'
  | 'gentle'
  | 'moderate'
  | 'steep'
  | 'unknown';

export type SoilType =
  | 'alluvial'
  | 'laterite'
  | 'red_soil'
  | 'sandy'
  | 'clay'
  | 'rocky'
  | 'mixed'
  | 'unknown';

export type OwnershipStatus =
  | 'government'
  | 'community'
  | 'private_with_permission'
  | 'private_no_permission'
  | 'disputed'
  | 'unknown';

export interface SiteAssessment {
  id: string;
  name: string;
  block: string;
  village: string;
  latitude: number | null;
  longitude: number | null;
  siteType: SiteType;
  catchmentAreaSqm: number | null;
  slopeCategory: SlopeCategory;
  soilType: SoilType;
  geologyInfo: string;
  existingStructure: string;
  existingStructureCondition: AssetCondition;
  waterDemand: string;
  ownershipStatus: OwnershipStatus;
  constraints: string;
  dataSource: string;
  assessmentDate: string;
  notes: string;
  isSimulated: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Monitoring Observation ---------- */
export type DataSourceType =
  | 'manual_gauge'
  | 'sensor_esp32'
  | 'estimated'
  | 'simulated'
  | 'other';

export interface MonitoringObservation {
  id: string;
  assetId: string;
  timestamp: string; // ISO
  rainfallMm: number | null;
  waterLevelM: number | null;
  calculatedVolumeLitres: number | null;
  isOverflow: boolean;
  sensorStatus: 'ok' | 'warning' | 'error' | 'offline' | 'not_applicable';
  dataSource: DataSourceType;
  notes: string;
  isSimulated: boolean;
}

/* ---------- Maintenance Issue ---------- */
export type IssueCategory =
  | 'blockage'
  | 'siltation'
  | 'damaged_component'
  | 'leakage'
  | 'sensor_failure'
  | 'inspection_overdue'
  | 'structural'
  | 'other';

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus = 'open' | 'in_progress' | 'resolved';

export interface MaintenanceIssue {
  id: string;
  assetId: string;
  dateReported: string;
  category: IssueCategory;
  description: string;
  priority: IssuePriority;
  assignedTo: string;
  status: IssueStatus;
  actionTaken: string;
  resolutionDate: string;
  isSimulated: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Site Screening ---------- */
export interface ScreeningFactor {
  name: string;
  score: number; // 0–10
  maxScore: number;
  weight: number;
  reasoning: string;
  dataAvailable: boolean;
}

export interface ScreeningResult {
  siteId: string;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  factors: ScreeningFactor[];
  missingData: string[];
  recommendation: string;
  warnings: string[];
}

/* ---------- Intervention Comparison ---------- */
export interface InterventionOption {
  id: string;
  name: string;
  description: string;
  advantages: string[];
  limitations: string[];
  costRangeLow: number | null;
  costRangeHigh: number | null;
  costCurrency: string;
  costBasis: string; // e.g. "per unit", "total estimated"
  maintenanceRequirements: string[];
  dataNeeded: string[];
  engineeringRequirements: string[];
  permissionRequirements: string[];
  isRestoration: boolean;
}

/* ---------- Calculator ---------- */
export interface RainwaterCalcInput {
  rainfallMm: number;
  catchmentAreaSqm: number;
  collectionEfficiency: number; // 0–1
  storageCapacityLitres: number | null;
}

export interface RainwaterCalcResult {
  harvestableVolumeM3: number;
  harvestableVolumeLitres: number;
  excessVolumeLitres: number | null;
  storageSufficient: boolean | null;
}

/* ---------- Application Data ---------- */
export interface AppData {
  assets: Asset[];
  siteAssessments: SiteAssessment[];
  observations: MonitoringObservation[];
  maintenanceIssues: MaintenanceIssue[];
}
