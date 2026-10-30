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
  | 'contour_trench'
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
  commissioningAuthority?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  evidenceSource?: string;
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
  | 'contour_slope'
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
  catchmentSource?: string;
  rainfallMm?: number | null;
  rainfallSource?: string;
  slopeCategory: SlopeCategory;
  soilType: SoilType;
  geologyInfo: string;
  existingStructure: string;
  existingStructureCondition: AssetCondition;
  waterDemand: string;
  intendedBeneficiaries?: string;
  communityNeed?: string;
  equityPriority?: 'high' | 'medium' | 'standard';
  ecologicalConstraints?: string;
  waterQualityConcerns?: string;
  assessorName?: string;
  assessorRole?: string;
  ownershipStatus: OwnershipStatus;
  constraints: string;
  dataSource: string;
  assessmentDate: string;
  notes: string;
  isSimulated: boolean;
  createdAt: string;
  updatedAt: string;
  // Enhanced planning & sizing fields
  preliminaryStructureType?: string;
  preliminaryDimensions?: StructureDimensions | null;
  implementationGap?: ImplementationGapAssessment | null;
  preliminaryCostEstimate?: PreliminaryCostEstimate | null;
}

/* ---------- Water Quality ---------- */
export type WaterQualityParameter =
  | 'pH'
  | 'tds_ppm'
  | 'turbidity_ntu'
  | 'fluoride_mg_l'
  | 'iron_mg_l'
  | 'nitrate_mg_l'
  | 'coliform_presence'
  | 'other';

export type WaterTestingMethod =
  | 'field_test_kit'
  | 'laboratory_certified'
  | 'sensor_probe'
  | 'sensory_observation';

export interface WaterQualityObservation {
  parameter: WaterQualityParameter;
  value: number | string;
  unit: string;
  method: WaterTestingMethod;
  testingAgency?: string;
  samplingDate?: string;
  complianceStatus?: 'acceptable' | 'permissible' | 'exceeded' | 'uncertain';
  complianceNote?: string;
}

/* ---------- Monitoring Observation ---------- */
export type DataSourceType =
  | 'manual_gauge'
  | 'sensor_esp32'
  | 'laboratory_certified'
  | 'field_test_kit'
  | 'imported_csv'
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
  waterQuality?: WaterQualityObservation | null;
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
  | 'vegetation'
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
  isCritical: boolean;
  screeningImpact: string; // Explains how this factor affects screening decisions
}

export interface ScreeningResult {
  siteId: string;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  isInsufficient: boolean; // True when any critical baseline factor is missing
  criticalMissing: string[]; // List of missing critical factors
  status: 'favourable' | 'moderate_constraints' | 'severe_constraints' | 'insufficient_data';
  confidenceLevel: 'high' | 'medium' | 'low' | 'indeterminate';
  factors: ScreeningFactor[];
  missingData: string[];
  recommendation: string;
  positiveFactors: string[];
  constraintsAndRisks: string[];
  recommendedNextSteps: string[];
  rechargeFeasibilityNote: string;
  warnings: string[];
}

/* ---------- Intervention Comparison ---------- */
export interface InterventionOption {
  id: string;
  name: string;
  category?: 'rooftop' | 'surface_pond' | 'channel_barrier' | 'watershed_contour' | 'subsurface_recharge' | 'restoration' | 'farm_irrigation' | 'distribution';
  description: string;
  advantages: string[];
  limitations: string[];
  suitableSlope?: string;
  suitableSoilGeology?: string;
  costRangeLow: number | null;
  costRangeHigh: number | null;
  costCurrency: string;
  costBasis: string; // e.g. "per unit", "total estimated"
  maintenanceRequirements: string[];
  dataNeeded: string[];
  engineeringRequirements: string[];
  permissionRequirements: string[];
  downstreamImpacts?: string[];
  communityManagementRole?: string;
  isRestoration: boolean;
}

/* ---------- Calculator ---------- */
export interface RainwaterCalcInput {
  rainfallMm: number;
  catchmentAreaSqm: number;
  collectionEfficiency: number; // 0–1
  storageCapacityLitres: number | null;
  firstFlushMm?: number | null; // e.g. 1-2 mm initial diversion
  surfaceType?: string;
  demandDailyLitres?: number | null; // daily consumption需求
  demandPeriodDays?: number | null; // e.g. 60 or 90 days dry period
}

export interface RainwaterCalcResult {
  harvestableVolumeM3: number;
  harvestableVolumeLitres: number;
  excessVolumeLitres: number | null;
  storageSufficient: boolean | null;
  // Enhanced detail properties
  grossRunoffLitres?: number;
  firstFlushDivertedLitres?: number;
  netUsableLitres?: number;
  demandTotalLitres?: number | null;
  demandDeficitLitres?: number | null;
  daysOfSupplySupported?: number | null;
}

/* ---------- Sizing & Dimensions ---------- */
export type PreliminaryStructureType =
  | 'rectangular_tank'
  | 'rooftop_rwh'
  | 'farm_pond_hapa'
  | 'recharge_pit'
  | 'recharge_trench'
  | 'percolation_tank'
  | 'contour_trench'
  | 'check_dam'
  | 'other';

export interface StructureDimensions {
  structureType: PreliminaryStructureType;
  grossVolumeM3: number;
  usableVolumeLitres: number;
  lengthM: number;
  widthM: number;
  depthM: number;
  freeboardM: number;
  deadStorageM?: number;
  sideSlopeZ?: number; // for sloped/trapezoidal ponds (e.g. 1.5:1)
  internalFootprintSqm: number;
  externalStructureFootprintSqm: number;
  maintenanceClearanceBufferM: number;
  totalLandRequirementSqm: number;
  wallThicknessM?: number;
  notes: string;
}

/* ---------- Monthly Water Balance ---------- */
export interface MonthlyWaterBalancePoint {
  month: string;
  monthIndex: number;
  rainfallMm: number;
  inflowLitres: number;
  demandLitres: number;
  storedLitres: number;
  overflowLitres: number;
  deficitLitres: number;
}

/* ---------- Cost Estimation ---------- */
export interface CostBreakdownItem {
  category: string;
  item: string;
  unit: string;
  unitRateINR: number;
  quantity: number;
  totalINR: number;
  notes: string;
  source: string;
}

export interface PreliminaryCostEstimate {
  items: CostBreakdownItem[];
  capitalCostINR: number;
  annualMaintenanceINR: number;
  costPerLitresUsableINR: number;
  assumptions: string[];
}

/* ---------- Implementation Gap Assessment ---------- */
export type ImplementationGapCategory =
  | 'no_known_structure'
  | 'requires_maintenance'
  | 'insufficient_capacity'
  | 'inadequate_catchment_connection'
  | 'poor_drainage'
  | 'land_permission_issue'
  | 'high_cost'
  | 'lack_of_technical_assessment'
  | 'water_quality_concern'
  | 'unclear_ownership'
  | 'insufficient_rainfall_data'
  | 'other';

export interface ImplementationGapAssessment {
  identifiedGaps: ImplementationGapCategory[];
  notes: string;
  actionPlanSteps: string[];
}

/* ---------- Working Model & Live Telemetry ---------- */
export type WorkingModelConnectionType =
  | 'web_serial'
  | 'local_http'
  | 'csv_import'
  | 'bench_simulator';

export interface WorkingModelTelemetry {
  timestamp: string;
  rawDistanceCm: number;
  waterDepthM: number;
  tankCapacityLitres: number;
  storedVolumeLitres: number;
  percentageFull: number;
  isOverflow: boolean;
  sensorStatus: 'ok' | 'warning' | 'error' | 'offline';
  controllerType: 'ESP32' | 'Arduino' | 'Simulated';
  connectionType: WorkingModelConnectionType;
  pumpStatus: 'idle' | 'running' | 'off';
  calculatedTheoreticalVolumeLitres?: number;
  volumeDiscrepancyLitres?: number;
  calibrationOffsetCm?: number;
}

/* ---------- Application Data ---------- */
export interface AppData {
  assets: Asset[];
  siteAssessments: SiteAssessment[];
  observations: MonitoringObservation[];
  maintenanceIssues: MaintenanceIssue[];
}
