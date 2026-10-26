/* ============================================================
   JalSetu Purulia — Simulated Demonstration Data
   
   WARNING: All data in this file is SIMULATED.
   These are hypothetical examples for demonstration purposes.
   They are NOT real field measurements, verified locations,
   or actual government records.
   ============================================================ */

import type { AppData } from '../types';
import { saveAllData } from './storage';

export const SAMPLE_DATA: AppData = {
  assets: [
    {
      id: 'demo-asset-001',
      name: 'Demo Site A — School Rooftop RWH',
      type: 'rooftop_rwh',
      block: 'Demo Block',
      village: 'Demo Village 1',
      latitude: 23.332,
      longitude: 86.365,
      installationDate: '2023-06-15',
      condition: 'fair',
      responsibleOrg: 'Hypothetical School Committee',
      maintenanceStatus: 'scheduled',
      storageCapacityLitres: 10000,
      catchmentAreaSqm: 200,
      tankLengthM: 4,
      tankWidthM: 2.5,
      tankDepthM: 1.5,
      notes: 'Simulated rooftop rainwater harvesting system. First-flush diverter may need inspection. This is demonstration data.',
      dataSource: 'Simulated for JalSetu demonstration',
      isSimulated: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'demo-asset-002',
      name: 'Demo Site B — Community Pond',
      type: 'pond',
      block: 'Demo Block',
      village: 'Demo Village 2',
      latitude: 23.340,
      longitude: 86.375,
      installationDate: '',
      condition: 'poor',
      responsibleOrg: 'Hypothetical Gram Panchayat',
      maintenanceStatus: 'overdue',
      storageCapacityLitres: 500000,
      catchmentAreaSqm: 5000,
      tankLengthM: null,
      tankWidthM: null,
      tankDepthM: 3,
      notes: 'Simulated community pond. Significant siltation reported in this hypothetical scenario. Irregular shape — rectangular volume formula not applicable.',
      dataSource: 'Simulated for JalSetu demonstration',
      isSimulated: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'demo-asset-003',
      name: 'Demo Site C — Farm Pond',
      type: 'farm_pond',
      block: 'Demo Block',
      village: 'Demo Village 1',
      latitude: 23.335,
      longitude: 86.360,
      installationDate: '2022-09-01',
      condition: 'good',
      responsibleOrg: 'Hypothetical Farmer Cooperative',
      maintenanceStatus: 'none_required',
      storageCapacityLitres: 80000,
      catchmentAreaSqm: 1200,
      tankLengthM: 10,
      tankWidthM: 8,
      tankDepthM: 2,
      notes: 'Simulated farm pond with lined base. Used for supplementary irrigation in this hypothetical scenario.',
      dataSource: 'Simulated for JalSetu demonstration',
      isSimulated: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
  ],

  siteAssessments: [
    {
      id: 'demo-site-001',
      name: 'Candidate Site — Demo Hillside',
      block: 'Demo Block',
      village: 'Demo Village 3',
      latitude: 23.345,
      longitude: 86.380,
      siteType: 'agricultural_land',
      catchmentAreaSqm: 3000,
      slopeCategory: 'gentle',
      soilType: 'laterite',
      geologyInfo: '',
      existingStructure: 'Abandoned check wall (partial)',
      existingStructureCondition: 'poor',
      waterDemand: 'Agricultural irrigation for approximately 2 hectares (hypothetical)',
      ownershipStatus: 'government',
      constraints: 'Access road is unpaved, seasonal flooding in downstream area (hypothetical)',
      dataSource: 'Simulated for JalSetu demonstration',
      assessmentDate: '2024-03-10',
      notes: 'This is a simulated candidate site. Geology information is intentionally incomplete to demonstrate the screening system\'s handling of missing data.',
      isSimulated: true,
      createdAt: '2024-03-10T09:00:00Z',
      updatedAt: '2024-03-10T09:00:00Z',
    },
  ],

  observations: generateDemoObservations(),

  maintenanceIssues: [
    {
      id: 'demo-issue-001',
      assetId: 'demo-asset-001',
      dateReported: '2024-07-20',
      category: 'blockage',
      description: 'Simulated: Leaf debris blocking gutter inlet to first-flush diverter',
      priority: 'medium',
      assignedTo: 'Hypothetical Caretaker',
      status: 'resolved',
      actionTaken: 'Simulated: Debris cleared and mesh guard installed',
      resolutionDate: '2024-07-22',
      isSimulated: true,
      createdAt: '2024-07-20T08:00:00Z',
      updatedAt: '2024-07-22T14:00:00Z',
    },
    {
      id: 'demo-issue-002',
      assetId: 'demo-asset-002',
      dateReported: '2024-08-05',
      category: 'siltation',
      description: 'Simulated: Significant silt accumulation reducing effective pond depth by approximately 0.8 m',
      priority: 'high',
      assignedTo: '',
      status: 'open',
      actionTaken: '',
      resolutionDate: '',
      isSimulated: true,
      createdAt: '2024-08-05T10:00:00Z',
      updatedAt: '2024-08-05T10:00:00Z',
    },
    {
      id: 'demo-issue-003',
      assetId: 'demo-asset-001',
      dateReported: '2024-09-15',
      category: 'inspection_overdue',
      description: 'Simulated: Quarterly inspection due — last inspection was in June',
      priority: 'low',
      assignedTo: 'Hypothetical School Committee',
      status: 'open',
      actionTaken: '',
      resolutionDate: '',
      isSimulated: true,
      createdAt: '2024-09-15T08:00:00Z',
      updatedAt: '2024-09-15T08:00:00Z',
    },
    {
      id: 'demo-issue-004',
      assetId: 'demo-asset-003',
      dateReported: '2024-06-10',
      category: 'leakage',
      description: 'Simulated: Minor seepage observed at the north-east corner of the lined farm pond',
      priority: 'medium',
      assignedTo: 'Hypothetical Farmer Cooperative',
      status: 'in_progress',
      actionTaken: 'Simulated: Seepage area identified and marked for patching',
      resolutionDate: '',
      isSimulated: true,
      createdAt: '2024-06-10T11:00:00Z',
      updatedAt: '2024-06-25T09:00:00Z',
    },
  ],
};

function generateDemoObservations() {
  const observations = [];
  const months = [
    { month: '2024-06', rainfall: [12, 18, 0, 5, 32, 0, 0, 8, 15, 0] },
    { month: '2024-07', rainfall: [25, 0, 42, 18, 0, 55, 12, 0, 30, 8] },
    { month: '2024-08', rainfall: [35, 20, 0, 60, 15, 0, 28, 0, 45, 10] },
    { month: '2024-09', rainfall: [8, 0, 22, 0, 12, 0, 5, 0, 15, 0] },
  ];

  let waterLevel = 0.3; // starting level in metres
  let obsIndex = 0;

  for (const m of months) {
    for (let i = 0; i < m.rainfall.length; i++) {
      obsIndex++;
      const day = (i * 3) + 1;
      const dayStr = String(day).padStart(2, '0');
      const rain = m.rainfall[i];

      // Simple water level simulation (not a real model)
      waterLevel += rain * 0.002; // rain adds
      waterLevel -= 0.02; // evaporation/use loss
      waterLevel = Math.max(0.1, Math.min(1.4, waterLevel));

      const isOverflow = waterLevel >= 1.4;

      observations.push({
        id: `demo-obs-${String(obsIndex).padStart(3, '0')}`,
        assetId: 'demo-asset-001',
        timestamp: `${m.month}-${dayStr}T08:00:00Z`,
        rainfallMm: rain,
        waterLevelM: Math.round(waterLevel * 100) / 100,
        calculatedVolumeLitres: Math.round(waterLevel * 4 * 2.5 * 1000),
        isOverflow,
        sensorStatus: 'not_applicable' as const,
        dataSource: 'simulated' as const,
        notes: 'Simulated observation — not a real measurement',
        isSimulated: true,
      });
    }
  }
  return observations;
}

export function loadSampleData(): void {
  saveAllData(SAMPLE_DATA);
}
