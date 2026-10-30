import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  SiteAssessment,
  SiteType,
  SlopeCategory,
  SoilType,
  AssetCondition,
  OwnershipStatus,
  PreliminaryStructureType,
  StructureDimensions,
  ImplementationGapCategory,
  ImplementationGapAssessment,
  PreliminaryCostEstimate,
} from '../types';
import { screenSite } from '../lib/screening';
import { generateId, exportSitesToCSV } from '../lib/storage';
import {
  validateCoordinates,
  calculateRectangularTankDimensions,
  calculateTrapezoidalPondDimensions,
  estimatePreliminaryCost,
} from '../lib/calculations';
import { evaluateInterventionsForSite } from '../lib/interventions';
import { getDeviceLocation } from '../lib/geolocation';
import { NoticeBanner } from '../components/NoticeBanner';
import { ConfirmModal } from '../components/ConfirmModal';

interface SiteAssessmentPageProps {
  sites: SiteAssessment[];
  onSaveSite: (site: SiteAssessment) => void;
  onDeleteSite: (id: string) => void;
  isSimulated: boolean;
}

export const IMPLEMENTATION_GAP_OPTIONS: {
  category: ImplementationGapCategory;
  label: string;
  description: string;
  actionStep: string;
}[] = [
  {
    category: 'no_known_structure',
    label: 'No Known Harvesting Structure',
    description: 'No existing rainwater-harvesting or storage asset recorded in the locality.',
    actionStep: 'Identify suitable public/institutional roof or community depression for initial topographic survey.',
  },
  {
    category: 'requires_maintenance',
    label: 'Existing Structure Requires Maintenance',
    description: 'Existing pond, bandh, dug well, or check dam suffers from siltation, structural leakage, or broken channels.',
    actionStep: 'Prioritize desiltation, inlet silt-trap clearing, and embankment stabilization (Restoration-First) before new excavation.',
  },
  {
    category: 'insufficient_capacity',
    label: 'Insufficient Storage Capacity',
    description: 'Current storage fills quickly and overflows in peak monsoon while drying up early in dry season.',
    actionStep: 'Evaluate feasibility of deepening pond bed or adding a staged secondary storage chamber.',
  },
  {
    category: 'inadequate_catchment_connection',
    label: 'Inadequate Catchment Connection / Conveyance',
    description: 'Runoff from roofs or fields drains away uncollected due to missing gutters, channels, or broken flumes.',
    actionStep: 'Design PVC/GI gutter conveyance and stone-lined contour channels to link catchment to storage.',
  },
  {
    category: 'poor_drainage',
    label: 'Poor Drainage & Spillway Scouring Risk',
    description: 'Site risks severe gully erosion or uncontrolled flooding during intense cloudburst events.',
    actionStep: 'Incorporate stilling basin, masonry surplus weir, and vegetative riprap along discharge channels.',
  },
  {
    category: 'land_permission_issue',
    label: 'Land Availability or Permission Constraint',
    description: 'Land ownership unclear, disputed, or private owner consent not legally formalized.',
    actionStep: 'Convene Gram Sabha meeting to record consent on community land or identify GP-vested plots.',
  },
  {
    category: 'high_cost',
    label: 'High Preliminary Construction Cost',
    description: 'Capital cost exceeds local panchayat annual development budget.',
    actionStep: 'Prepare proposal for convergence funding under MGNREGS, USHARMUKTI, or Jal Jeevan Mission.',
  },
  {
    category: 'lack_of_technical_assessment',
    label: 'Lack of Hydrogeological & Soil Testing',
    description: 'Depth to hard granite bedrock, weathered zone thickness, and infiltration rate are unmeasured.',
    actionStep: 'Commission electrical resistivity (VES) geophysical survey and double-ring infiltration test before recharge design.',
  },
  {
    category: 'water_quality_concern',
    label: 'Water Quality Risk / Contamination',
    description: 'Endemic fluoride in surrounding aquifers or vulnerability to surface sewage/livestock runoff.',
    actionStep: 'Conduct laboratory water quality testing (IS 10500:2012) and mandate dual-stage sand filtration and hygienic storage.',
  },
  {
    category: 'unclear_ownership',
    label: 'Unclear Post-Construction Ownership',
    description: 'Absence of designated community body or user committee for periodic desiltation and upkeep.',
    actionStep: 'Form Village Water & Sanitation Committee (VWSC) / Pani Panchayat with defined seasonal maintenance duties.',
  },
  {
    category: 'insufficient_rainfall_data',
    label: 'Insufficient Localized Rainfall Data',
    description: 'Lack of micro-catchment rainfall records in undulating plateau terrain.',
    actionStep: 'Install manual rain gauge at local school or gram panchayat office for community rainfall logging.',
  },
];

const PURULIA_BLOCKS = [
  'Arsha',
  'Baghmundi',
  'Balarampur',
  'Barabazar',
  'Bundwan',
  'Hura',
  'Jaipur',
  'Jhalda-I',
  'Jhalda-II',
  'Kashipur',
  'Manbazar-I',
  'Manbazar-II',
  'Neturia',
  'Para',
  'Puncha',
  'Purulia-I',
  'Purulia-II',
  'Raghunathpur-I',
  'Raghunathpur-II',
  'Santuri',
];

const INITIAL_FORM: Omit<SiteAssessment, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  block: 'Purulia-I',
  village: '',
  latitude: null,
  longitude: null,
  siteType: 'rooftop',
  catchmentAreaSqm: null,
  catchmentSource: 'Visual estimate / unverified',
  rainfallMm: 1240,
  rainfallSource: 'IMD 30-year normal for Purulia District (~1,240 mm)',
  slopeCategory: 'unknown',
  soilType: 'unknown',
  geologyInfo: '',
  existingStructure: '',
  existingStructureCondition: 'unknown',
  waterDemand: '',
  intendedBeneficiaries: '',
  communityNeed: '',
  equityPriority: 'standard',
  ecologicalConstraints: 'None recorded',
  waterQualityConcerns: 'Not tested',
  assessorName: '',
  assessorRole: '',
  ownershipStatus: 'unknown',
  constraints: '',
  dataSource: 'Direct field visit assessment',
  assessmentDate: new Date().toISOString().substring(0, 10),
  notes: '',
  isSimulated: false,
  preliminaryStructureType: 'rectangular_tank',
  preliminaryDimensions: null,
  implementationGap: null,
  preliminaryCostEstimate: null,
};

export const SiteAssessmentPage: React.FC<SiteAssessmentPageProps> = ({
  sites,
  onSaveSite,
  onDeleteSite,
  isSimulated,
}) => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewingSiteDetail, setViewingSiteDetail] = useState<SiteAssessment | null>(null);

  // Sizing assistant state
  const [sizingType, setSizingType] = useState<PreliminaryStructureType>('rectangular_tank');
  const [sizingTargetLitres, setSizingTargetLitres] = useState<number>(15000);
  const [sizingDepthM, setSizingDepthM] = useState<number>(1.8);
  const [sizingFreeboardM, setSizingFreeboardM] = useState<number>(0.25);
  const [sizingSideSlopeZ, setSizingSideSlopeZ] = useState<number>(1.5);
  const [sizingResult, setSizingResult] = useState<StructureDimensions | null>(null);

  // Implementation-gap selection state
  const [selectedGaps, setSelectedGaps] = useState<ImplementationGapCategory[]>([]);

  // Filter state for list tab
  const [filterBlock, setFilterBlock] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // GPS state for site assessment
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Detect GPS position directly into the site assessment form
  const handleDetectGpsForSite = async () => {
    setIsGpsLocating(true);
    setGpsError(null);
    try {
      const loc = await getDeviceLocation();
      setIsGpsLocating(false);
      setGpsAccuracy(Math.round(loc.accuracy));
      setFormData(prev => ({
        ...prev,
        latitude: Math.round(loc.latitude * 10000) / 10000,
        longitude: Math.round(loc.longitude * 10000) / 10000,
      }));
    } catch (err: any) {
      setIsGpsLocating(false);
      setGpsError(err.message || 'Unable to detect GPS location.');
    }
  };

  // Listen to coordinates from URL search params (e.g. from Map click-to-pin)
  useEffect(() => {
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    if (latParam && lngParam && !selectedSiteId) {
      const latNum = parseFloat(latParam);
      const lngNum = parseFloat(lngParam);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        setFormData(prev => ({
          ...prev,
          latitude: latNum,
          longitude: lngNum,
        }));
        setActiveTab('form');
      }
    }
  }, [searchParams, selectedSiteId]);

  // Compute live screening result for the active form
  const activeAssessment: SiteAssessment = {
    ...formData,
    id: selectedSiteId || 'draft-screening',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preliminaryDimensions: sizingResult || formData.preliminaryDimensions,
  };

  const screeningResult = screenSite(activeAssessment);
  const candidateInterventions = evaluateInterventionsForSite(activeAssessment);

  // Coordinate check for form
  const coordValidation = validateCoordinates(formData.latitude, formData.longitude);

  // Sizing calculation action
  const handleCalculateSizing = () => {
    try {
      let result: StructureDimensions;
      if (sizingType === 'farm_pond_hapa') {
        result = calculateTrapezoidalPondDimensions({
          targetUsableLitres: sizingTargetLitres,
          waterDepthM: sizingDepthM,
          freeboardM: sizingFreeboardM,
          sideSlopeZ: sizingSideSlopeZ,
        });
      } else {
        result = calculateRectangularTankDimensions({
          targetUsableLitres: sizingTargetLitres,
          waterDepthM: sizingDepthM,
          freeboardM: sizingFreeboardM,
        });
      }
      setSizingResult(result);

      // Compute preliminary cost estimate for this structure
      const costEst = estimatePreliminaryCost({
        structureType: sizingType,
        usableCapacityLitres: result.usableVolumeLitres,
        catchmentAreaSqm: formData.catchmentAreaSqm || 100,
      });

      setFormData(prev => ({
        ...prev,
        preliminaryStructureType: sizingType,
        preliminaryDimensions: result,
        preliminaryCostEstimate: costEst,
      }));
    } catch (err: any) {
      alert(`Sizing calculation error: ${err.message}`);
    }
  };

  // Gap toggle action
  const handleToggleGap = (category: ImplementationGapCategory) => {
    const updated = selectedGaps.includes(category)
      ? selectedGaps.filter(g => g !== category)
      : [...selectedGaps, category];
    setSelectedGaps(updated);

    const actionSteps = updated
      .map(cat => IMPLEMENTATION_GAP_OPTIONS.find(o => o.category === cat)?.actionStep || '')
      .filter(Boolean);

    setFormData(prev => ({
      ...prev,
      implementationGap: {
        identifiedGaps: updated,
        notes: `${updated.length} gap(s) identified during field assessment.`,
        actionPlanSteps: actionSteps,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please provide a descriptive candidate site name.');
      return;
    }

    const siteToSave: SiteAssessment = {
      ...formData,
      id: selectedSiteId || generateId(),
      preliminaryDimensions: sizingResult || formData.preliminaryDimensions,
      createdAt: selectedSiteId
        ? sites.find(s => s.id === selectedSiteId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveSite(siteToSave);
    setSaveSuccess(`Site assessment "${siteToSave.name}" successfully saved.`);
    setTimeout(() => setSaveSuccess(null), 4000);
    handleReset();
    setActiveTab('list');
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setSelectedSiteId(null);
    setSizingResult(null);
    setSelectedGaps([]);
    setGpsAccuracy(null);
    setGpsError(null);
  };

  const handleEdit = (site: SiteAssessment) => {
    setFormData({
      name: site.name,
      block: site.block,
      village: site.village,
      latitude: site.latitude,
      longitude: site.longitude,
      siteType: site.siteType,
      catchmentAreaSqm: site.catchmentAreaSqm,
      catchmentSource: site.catchmentSource || 'Visual estimate / unverified',
      rainfallMm: site.rainfallMm ?? 1240,
      rainfallSource: site.rainfallSource || 'IMD 30-year normal for Purulia District (~1,240 mm)',
      slopeCategory: site.slopeCategory,
      soilType: site.soilType,
      geologyInfo: site.geologyInfo || '',
      existingStructure: site.existingStructure || '',
      existingStructureCondition: site.existingStructureCondition,
      waterDemand: site.waterDemand || '',
      intendedBeneficiaries: site.intendedBeneficiaries || '',
      communityNeed: site.communityNeed || '',
      equityPriority: site.equityPriority || 'standard',
      ecologicalConstraints: site.ecologicalConstraints || 'None recorded',
      waterQualityConcerns: site.waterQualityConcerns || 'Not tested',
      assessorName: site.assessorName || '',
      assessorRole: site.assessorRole || '',
      ownershipStatus: site.ownershipStatus,
      constraints: site.constraints || '',
      dataSource: site.dataSource || 'Direct field visit assessment',
      assessmentDate: site.assessmentDate,
      notes: site.notes || '',
      isSimulated: site.isSimulated,
      preliminaryStructureType: site.preliminaryStructureType || 'rectangular_tank',
      preliminaryDimensions: site.preliminaryDimensions || null,
      implementationGap: site.implementationGap || null,
      preliminaryCostEstimate: site.preliminaryCostEstimate || null,
    });
    if (site.preliminaryDimensions) {
      setSizingResult(site.preliminaryDimensions);
      setSizingType(site.preliminaryDimensions.structureType);
      setSizingTargetLitres(site.preliminaryDimensions.usableVolumeLitres);
    }
    if (site.implementationGap) {
      setSelectedGaps(site.implementationGap.identifiedGaps || []);
    }
    setSelectedSiteId(site.id);
    setActiveTab('form');
  };

  const handleExportCSV = () => {
    const csv = exportSitesToCSV();
    if (!csv) {
      alert('No candidate site records to export.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jalsetu_candidate_sites_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered sites for list
  const filteredSites = sites.filter(s => {
    const matchBlock = filterBlock === 'all' || s.block.toLowerCase() === filterBlock.toLowerCase();
    const matchType = filterType === 'all' || s.siteType === filterType;
    if (!matchBlock || !matchType) return false;

    if (filterStatus !== 'all') {
      const scr = screenSite(s);
      if (filterStatus === 'insufficient' && !scr.isInsufficient) return false;
      if (filterStatus === 'favourable' && (scr.isInsufficient || scr.status !== 'favourable')) return false;
      if (filterStatus === 'moderate' && (scr.isInsufficient || scr.status !== 'moderate_constraints')) return false;
      if (filterStatus === 'severe' && (scr.isInsufficient || scr.status !== 'severe_constraints')) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Site Assessment &amp; Rule-Based Screening</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Systematic field assessment for rainwater-harvesting and conservation feasibility in Purulia’s undulating hard-rock terrain.
          </p>
        </div>
        <div className="btn-group">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'form' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('form')}
          >
            {selectedSiteId ? 'Edit Assessment' : '+ New Assessment'}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('list')}
          >
            Candidate Sites List ({sites.length})
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {saveSuccess && (
          <div className="notice notice--success" style={{ marginBottom: '1.5rem' }}>
            {saveSuccess}
          </div>
        )}

        {/* Tab 1: Form & Live Screening */}
        {activeTab === 'form' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left: Input Form */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{selectedSiteId ? 'Edit Candidate Site Assessment' : 'New Field Site Assessment'}</h2>
                {selectedSiteId && (
                  <button type="button" className="btn btn-sm" onClick={handleReset} style={{ fontSize: '0.75rem' }}>
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Name */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="site-name">Candidate Site Name *</label>
                    <input
                      id="site-name"
                      type="text"
                      required
                      placeholder="e.g. Sirkabad Primary School Roof, Ajodhya Foothill Gully"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Block */}
                  <div className="form-group">
                    <label htmlFor="site-block">Block *</label>
                    <select
                      id="site-block"
                      value={formData.block}
                      onChange={e => setFormData({ ...formData, block: e.target.value })}
                    >
                      {PURULIA_BLOCKS.map(b => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Village / Locality */}
                  <div className="form-group">
                    <label htmlFor="site-village">Village / Hamlet / Mouza</label>
                    <input
                      id="site-village"
                      type="text"
                      placeholder="e.g. Lagda, Matha, Sirkabad"
                      value={formData.village}
                      onChange={e => setFormData({ ...formData, village: e.target.value })}
                    />
                  </div>

                  {/* GPS Detection Bar */}
                  <div
                    style={{
                      gridColumn: 'span 2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      background: 'var(--color-sand)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                        📍 Geographical Coordinates
                      </span>
                      <small style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                        (Enter manually or detect on site via GPS)
                      </small>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={handleDetectGpsForSite}
                      disabled={isGpsLocating}
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                      }}
                      title="Detect device coordinates via browser Geolocation API"
                    >
                      {isGpsLocating ? '⏳ Detecting GPS...' : '📍 Use Current GPS Location'}
                    </button>
                  </div>

                  {/* GPS Success Pill */}
                  {gpsAccuracy !== null && formData.latitude !== null && formData.longitude !== null && (
                    <div
                      style={{
                        gridColumn: 'span 2',
                        fontSize: '0.75rem',
                        background: '#ebf5fb',
                        color: '#1b4f72',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        border: '1px solid #aed6f1',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '4px',
                      }}
                    >
                      <span>
                        ✓ <strong>GPS Coordinates Detected:</strong> {formData.latitude.toFixed(4)}° N, {formData.longitude.toFixed(4)}° E &bull; Accuracy: &plusmn;{gpsAccuracy} metres
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#555' }}>
                        Manual edits are preserved below if needed.
                      </span>
                    </div>
                  )}

                  {/* GPS Error Alert */}
                  {gpsError && (
                    <div
                      style={{
                        gridColumn: 'span 2',
                        fontSize: '0.75rem',
                        background: '#fdedec',
                        color: '#78281f',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid #f5b7b1',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>⚠️ {gpsError}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={handleDetectGpsForSite}
                          style={{
                            fontSize: '0.7rem',
                            background: '#c0392b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '2px 8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => setGpsError(null)}
                          style={{
                            fontSize: '0.85rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#78281f',
                            fontWeight: 700,
                          }}
                          title="Dismiss message"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Latitude */}
                  <div className="form-group">
                    <label htmlFor="site-lat">Latitude (°N)</label>
                    <input
                      id="site-lat"
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 23.3320"
                      value={formData.latitude ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          latitude: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  {/* Longitude */}
                  <div className="form-group">
                    <label htmlFor="site-lon">Longitude (°E)</label>
                    <input
                      id="site-lon"
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 86.3650"
                      value={formData.longitude ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          longitude: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {/* Coordinate Verification Feedback */}
                {formData.latitude !== null && formData.longitude !== null && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      background: coordValidation.inPuruliaDistrict ? '#eafaf1' : '#fef9e7',
                      color: coordValidation.inPuruliaDistrict ? '#145a32' : '#7d6608',
                      border: '1px solid currentColor',
                    }}
                  >
                    📍 {coordValidation.message}
                  </div>
                )}

                {/* Physical Characteristics */}
                <h3 style={{ fontSize: '1rem', marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  Physical &amp; Hydrological Baseline
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Site Type */}
                  <div className="form-group">
                    <label htmlFor="site-type">Site Morphology Type *</label>
                    <select
                      id="site-type"
                      value={formData.siteType}
                      onChange={e => setFormData({ ...formData, siteType: e.target.value as SiteType })}
                    >
                      <option value="rooftop">Building Rooftop</option>
                      <option value="existing_pond">Existing Pond / Bandh</option>
                      <option value="drainage_channel">Natural Drainage Channel / Nala</option>
                      <option value="agricultural_land">Agricultural Terrace Land</option>
                      <option value="contour_slope">Sloping Hillslope / Ridge</option>
                      <option value="other">Other Landscape Feature</option>
                    </select>
                  </div>

                  {/* Catchment Area */}
                  <div className="form-group">
                    <label htmlFor="site-catchment">
                      Catchment Area (m²) <small style={{ color: 'var(--color-text-muted)' }}>(Leave empty if unknown)</small>
                    </label>
                    <input
                      id="site-catchment"
                      type="number"
                      min="0"
                      placeholder="e.g. 250 for roof, 5000 for pond"
                      value={formData.catchmentAreaSqm ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          catchmentAreaSqm: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  {/* Catchment Source */}
                  <div className="form-group">
                    <label htmlFor="site-catchment-source">Catchment Measurement Source</label>
                    <select
                      id="site-catchment-source"
                      value={formData.catchmentSource}
                      onChange={e => setFormData({ ...formData, catchmentSource: e.target.value })}
                    >
                      <option value="Tape measurement on site">Physical Tape Measurement on site</option>
                      <option value="Building / architectural plan">Building / Architectural Plan</option>
                      <option value="Satellite / Cadastral map">Satellite Imagery / Cadastral Map</option>
                      <option value="Topographic survey levelling">Topographic Survey Levelling</option>
                      <option value="Visual estimate / unverified">Visual Estimate / Unverified</option>
                    </select>
                  </div>

                  {/* Slope Category */}
                  <div className="form-group">
                    <label htmlFor="site-slope">Topographic Slope Category *</label>
                    <select
                      id="site-slope"
                      value={formData.slopeCategory}
                      onChange={e => setFormData({ ...formData, slopeCategory: e.target.value as SlopeCategory })}
                    >
                      <option value="unknown">Unknown / Not Measured (Will flag incomplete)</option>
                      <option value="flat">Flat (&lt; 2%)</option>
                      <option value="gentle">Gentle (2% – 5%)</option>
                      <option value="moderate">Moderate (5% – 10%)</option>
                      <option value="steep">Steep (&gt; 10%)</option>
                    </select>
                  </div>

                  {/* Soil Type */}
                  <div className="form-group">
                    <label htmlFor="site-soil">Soil Texture / Formation *</label>
                    <select
                      id="site-soil"
                      value={formData.soilType}
                      onChange={e => setFormData({ ...formData, soilType: e.target.value as SoilType })}
                    >
                      <option value="unknown">Unknown / Not Measured (Will flag incomplete)</option>
                      <option value="laterite">Laterite / Gravelly Mantle (Purulia Uplands)</option>
                      <option value="red_soil">Red Loam / Red Sandy Loam</option>
                      <option value="alluvial">Alluvial / Valley Fill</option>
                      <option value="clay">Heavy Clay (Low infiltration, good retention)</option>
                      <option value="sandy">Sandy / Coarse (High seepage)</option>
                      <option value="rocky">Rocky / Hard Rock Outcrop</option>
                      <option value="mixed">Mixed Texture</option>
                    </select>
                  </div>

                  {/* Geology Info */}
                  <div className="form-group">
                    <label htmlFor="site-geology">Geology / Hard-Rock Context</label>
                    <input
                      id="site-geology"
                      type="text"
                      placeholder="e.g. Weathered granite gneiss, pegmatite dyke, massive bedrock"
                      value={formData.geologyInfo}
                      onChange={e => setFormData({ ...formData, geologyInfo: e.target.value })}
                    />
                  </div>
                </div>

                {/* Existing Infrastructure & Water Demand */}
                <h3 style={{ fontSize: '1rem', marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  Infrastructure, Demand &amp; Community Stakeholders
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Existing Structure */}
                  <div className="form-group">
                    <label htmlFor="site-structure">Existing Water Structure (Restoration)</label>
                    <input
                      id="site-structure"
                      type="text"
                      placeholder="e.g. Old village bandh, breached weir, roof gutters"
                      value={formData.existingStructure}
                      onChange={e => setFormData({ ...formData, existingStructure: e.target.value })}
                    />
                  </div>

                  {/* Structure Condition */}
                  <div className="form-group">
                    <label htmlFor="site-structure-cond">Existing Structure Condition</label>
                    <select
                      id="site-structure-cond"
                      value={formData.existingStructureCondition}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          existingStructureCondition: e.target.value as AssetCondition,
                        })
                      }
                    >
                      <option value="unknown">Unknown / Unassessed</option>
                      <option value="good">Good (Minor maintenance)</option>
                      <option value="fair">Fair (Desilting / repair prioritised)</option>
                      <option value="poor">Poor (Heavily breached/silted)</option>
                      <option value="non_functional">Non-functional / Abandoned</option>
                    </select>
                  </div>

                  {/* Water Demand */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="site-demand">
                      Water Demand &amp; Intended Use * <small style={{ color: 'var(--color-text-muted)' }}>(Critical for screening)</small>
                    </label>
                    <input
                      id="site-demand"
                      type="text"
                      placeholder="e.g. Mid-day meal drinking water for 250 students, supplementary Kharif irrigation for 15 ha"
                      value={formData.waterDemand}
                      onChange={e => setFormData({ ...formData, waterDemand: e.target.value })}
                    />
                  </div>

                  {/* Intended Beneficiaries */}
                  <div className="form-group">
                    <label htmlFor="site-beneficiaries">Beneficiary Group</label>
                    <input
                      id="site-beneficiaries"
                      type="text"
                      placeholder="e.g. 40 marginal farming households, primary school children"
                      value={formData.intendedBeneficiaries}
                      onChange={e => setFormData({ ...formData, intendedBeneficiaries: e.target.value })}
                    />
                  </div>

                  {/* Equity Priority */}
                  <div className="form-group">
                    <label htmlFor="site-equity">Vulnerability &amp; Social Priority</label>
                    <select
                      id="site-equity"
                      value={formData.equityPriority}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          equityPriority: e.target.value as 'high' | 'medium' | 'standard',
                        })
                      }
                    >
                      <option value="high">High — Acute drinking water scarcity / SC-ST hamlet</option>
                      <option value="medium">Medium — Single-crop rainfed agricultural distress</option>
                      <option value="standard">Standard — Regular institutional/community proposal</option>
                    </select>
                  </div>

                  {/* Land Ownership */}
                  <div className="form-group">
                    <label htmlFor="site-ownership">Land Ownership &amp; Permissions *</label>
                    <select
                      id="site-ownership"
                      value={formData.ownershipStatus}
                      onChange={e => setFormData({ ...formData, ownershipStatus: e.target.value as OwnershipStatus })}
                    >
                      <option value="unknown">Unknown / Unverified (Will flag incomplete)</option>
                      <option value="government">Government / Gram Panchayat Land</option>
                      <option value="community">Community / Common Land (Gram Sabha consent)</option>
                      <option value="private_with_permission">Private Land with Written Consent</option>
                      <option value="private_no_permission">Private Land without Permission (Cannot proceed)</option>
                      <option value="disputed">Disputed / Under Active Litigation</option>
                    </select>
                  </div>

                  {/* Water Quality Concerns */}
                  <div className="form-group">
                    <label htmlFor="site-wq">Water Quality Alert / Context</label>
                    <select
                      id="site-wq"
                      value={formData.waterQualityConcerns}
                      onChange={e => setFormData({ ...formData, waterQualityConcerns: e.target.value })}
                    >
                      <option value="Not tested">Not tested (Baseline testing required)</option>
                      <option value="None observed">None observed / Fresh runoff</option>
                      <option value="Fluoride endemic in locality">Fluoride risk endemic in surrounding tube wells</option>
                      <option value="High iron content">High iron staining observed in local water</option>
                      <option value="Surface drainage contamination">Open drain / livestock runoff risk</option>
                    </select>
                  </div>
                </div>

                {/* Constraints & Notes */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label htmlFor="site-constraints">Known Physical &amp; Environmental Constraints</label>
                    <textarea
                      id="site-constraints"
                      rows={2}
                      placeholder="e.g. Unpaved road, seasonal stream flooding, downstream water rights, rocky ridge"
                      value={formData.constraints}
                      onChange={e => setFormData({ ...formData, constraints: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label htmlFor="site-assessor">Assessor Name &amp; Designation</label>
                      <input
                        id="site-assessor"
                        type="text"
                        placeholder="e.g. S. Mahato, Panchayat Junior Engineer"
                        value={formData.assessorName}
                        onChange={e => setFormData({ ...formData, assessorName: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="site-date">Assessment Date</label>
                      <input
                        id="site-date"
                        type="date"
                        value={formData.assessmentDate}
                        onChange={e => setFormData({ ...formData, assessmentDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section F: Structure Sizing & Land Footprint Assistant */}
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--color-primary-dark)', margin: 0 }}>
                      Section F: Preliminary Structure Sizing &amp; Land Footprint Assistant
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>Engineering Sizing Suite</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group">
                      <label htmlFor="sizing-type" style={{ fontSize: '0.8rem' }}>Structure Type</label>
                      <select
                        id="sizing-type"
                        value={sizingType}
                        onChange={e => setSizingType(e.target.value as PreliminaryStructureType)}
                        style={{ fontSize: '0.8125rem' }}
                      >
                        <option value="rectangular_tank">Masonry / RCC Storage Tank (Rooftop/Yard)</option>
                        <option value="farm_pond_hapa">Excavated Farm Pond / Hapa (Sloped Sides)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="sizing-target" style={{ fontSize: '0.8rem' }}>Target Usable Capacity (Litres)</label>
                      <input
                        id="sizing-target"
                        type="number"
                        min="500"
                        step="500"
                        value={sizingTargetLitres}
                        onChange={e => setSizingTargetLitres(Math.max(500, parseFloat(e.target.value) || 0))}
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    {formData.catchmentAreaSqm && formData.catchmentAreaSqm > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                        onClick={() => {
                          const approxYield = Math.round((formData.catchmentAreaSqm || 100) * (formData.rainfallMm || 1240) * 0.8 * 0.25);
                          setSizingTargetLitres(approxYield);
                        }}
                      >
                        ⚡ Auto-size (25% Catchment Monsoon Storage)
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                      onClick={() => setSizingTargetLitres(10000)}
                    >
                      10,000 L (School/Anganwadi)
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                      onClick={() => setSizingTargetLitres(50000)}
                    >
                      50,000 L (Small Farm Pond / Hapa)
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group">
                      <label htmlFor="sizing-depth" style={{ fontSize: '0.75rem' }}>Water Depth (m)</label>
                      <input
                        id="sizing-depth"
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="6"
                        value={sizingDepthM}
                        onChange={e => setSizingDepthM(parseFloat(e.target.value) || 1.8)}
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sizing-freeboard" style={{ fontSize: '0.75rem' }}>Freeboard (m)</label>
                      <input
                        id="sizing-freeboard"
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="1.5"
                        value={sizingFreeboardM}
                        onChange={e => setSizingFreeboardM(parseFloat(e.target.value) || 0.25)}
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    {sizingType === 'farm_pond_hapa' && (
                      <div className="form-group">
                        <label htmlFor="sizing-slope" style={{ fontSize: '0.75rem' }}>Side Slope Z:1 (H:V)</label>
                        <input
                          id="sizing-slope"
                          type="number"
                          step="0.1"
                          min="1"
                          max="3"
                          value={sizingSideSlopeZ}
                          onChange={e => setSizingSideSlopeZ(parseFloat(e.target.value) || 1.5)}
                          style={{ fontSize: '0.8125rem' }}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCalculateSizing}
                    style={{ width: '100%', fontWeight: 600 }}
                  >
                    Calculate Dimensions &amp; Land Requirement
                  </button>

                  {sizingResult && (
                    <div style={{ marginTop: '0.75rem', background: '#ffffff', padding: '0.75rem', borderRadius: '4px', border: '1px solid #dcdde1', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div><strong>Internal Plan:</strong> {sizingResult.lengthM}m × {sizingResult.widthM}m × {sizingResult.depthM}m (Depth)</div>
                        <div><strong>Usable Capacity:</strong> {sizingResult.usableVolumeLitres.toLocaleString()} L ({sizingResult.grossVolumeM3} m³ gross)</div>
                        <div><strong>Structure Footprint:</strong> {sizingResult.externalStructureFootprintSqm} m²</div>
                        <div style={{ color: '#1a5276' }}>
                          <strong>Total Land Required:</strong> <strong>{sizingResult.totalLandRequirementSqm} m²</strong> (includes {sizingResult.maintenanceClearanceBufferM}m access buffer)
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                        {sizingResult.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section G: Implementation-Gap Diagnosis & Action Plan */}
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#fef9e7', borderRadius: 'var(--radius)', border: '1px solid #f9e79f' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', color: '#7d6608', margin: 0 }}>
                      Section G: Implementation-Gap Diagnosis &amp; Action Plan
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#9a7d0a', fontWeight: 600 }}>
                      {selectedGaps.length} Identified
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.75rem' }}>
                    Select observed operational, institutional, or physical bottlenecks to generate a site-specific remediation action plan:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {IMPLEMENTATION_GAP_OPTIONS.map(opt => {
                      const isChecked = selectedGaps.includes(opt.category);
                      return (
                        <label
                          key={opt.category}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px',
                            fontSize: '0.78rem',
                            padding: '4px 6px',
                            borderRadius: '3px',
                            background: isChecked ? '#fff' : 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleGap(opt.category)}
                            style={{ marginTop: '2px' }}
                          />
                          <div>
                            <strong>{opt.label}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#666' }}>{opt.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {formData.implementationGap && formData.implementationGap.actionPlanSteps.length > 0 && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fff', borderRadius: '4px', border: '1px solid #eedc82' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#7d6608' }}>Recommended Implementation Action Plan:</strong>
                      <ol style={{ margin: '0.25rem 0 0 1.2rem', padding: 0, fontSize: '0.78rem', color: '#333' }}>
                        {formData.implementationGap.actionPlanSteps.map((step, idx) => (
                          <li key={idx} style={{ marginBottom: '2px' }}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Section H: Preliminary Cost Estimation Preview */}
                {formData.preliminaryCostEstimate && (
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#eafaf1', borderRadius: 'var(--radius)', border: '1px solid #a9dfbf' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.95rem', color: '#145a32', margin: 0 }}>
                        Section H: Preliminary Implementation Costing Preview
                      </h3>
                      <strong style={{ color: '#145a32', fontSize: '0.95rem' }}>
                        Est. Capital: ₹{formData.preliminaryCostEstimate.capitalCostINR.toLocaleString()}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#196f3d', marginBottom: '0.5rem' }}>
                      <span>Annual Upkeep: ₹{formData.preliminaryCostEstimate.annualMaintenanceINR.toLocaleString()}/yr</span>
                      <span>Unit Cost: ₹{formData.preliminaryCostEstimate.costPerLitresUsableINR} / Litre usable</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#555', fontStyle: 'italic' }}>
                      Includes conveyance, first-flush, filtration, masonry/earthwork, labour (15%), and level monitoring kit.
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="submit" className="btn btn-primary">
                    {selectedSiteId ? 'Update Assessment Record' : 'Save Site Assessment'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleReset}>
                    Reset Form
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Live Rule-Based Screening Panel */}
            <div style={{ position: 'sticky', top: '1rem' }}>
              <div className="card" style={{ borderTop: `4px solid ${screeningResult.isInsufficient ? 'var(--color-info)' : screeningResult.status === 'favourable' ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.1rem' }}>Screening Feasibility Result</h2>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: screeningResult.isInsufficient
                        ? '#ebf5fb'
                        : screeningResult.status === 'favourable'
                        ? '#d4efdf'
                        : '#fcf3cf',
                      color: screeningResult.isInsufficient
                        ? '#1b4f72'
                        : screeningResult.status === 'favourable'
                        ? '#145a32'
                        : '#7d6608',
                      border: '1px solid currentColor',
                    }}
                  >
                    {screeningResult.isInsufficient
                      ? 'INSUFFICIENT DATA'
                      : `${screeningResult.percentage}% (${screeningResult.status.replace('_', ' ').toUpperCase()})`}
                  </span>
                </div>

                {/* Score or Incomplete Callout */}
                {screeningResult.isInsufficient ? (
                  <div style={{ background: '#ebf5fb', padding: '0.85rem', borderRadius: 'var(--radius)', marginBottom: '1rem', borderLeft: '3px solid #2980b9' }}>
                    <strong style={{ color: '#1b4f72', fontSize: '0.875rem' }}>
                      Score Indeterminate — Incomplete Baseline Information
                    </strong>
                    <p style={{ fontSize: '0.8125rem', color: '#2c3e50', marginTop: '0.35rem', lineHeight: 1.45 }}>
                      The following critical parameter(s) have not been recorded:
                    </p>
                    <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0, fontSize: '0.8125rem', color: '#c0392b' }}>
                      {screeningResult.criticalMissing.map(m => (
                        <li key={m}>
                          <strong>{m}</strong>
                        </li>
                      ))}
                    </ul>
                    <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      JalSetu does not silently assume zeros or assign arbitrary failure scores for unmeasured fields. Complete field measurements to evaluate technical feasibility.
                    </p>
                  </div>
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                      <span>Provisional Score</span>
                      <strong>{screeningResult.totalScore} / {screeningResult.maxPossibleScore} ({screeningResult.percentage}%)</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--color-sand)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${screeningResult.percentage}%`,
                          height: '100%',
                          background: screeningResult.status === 'favourable' ? 'var(--color-success)' : 'var(--color-warning)',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  <strong>Recommendation:</strong> {screeningResult.recommendation}
                </div>

                {/* Subsurface Recharge Feasibility Note */}
                <div style={{ background: 'var(--color-sand)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                  <strong style={{ color: 'var(--color-primary-dark)' }}>Hydrogeological Recharge Note:</strong>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    {screeningResult.rechargeFeasibilityNote}
                  </p>
                </div>

                {/* Positives & Constraints */}
                {screeningResult.positiveFactors.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e8449' }}>Key Favourable Factors:</span>
                    <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0, fontSize: '0.8rem', color: '#2c3e50' }}>
                      {screeningResult.positiveFactors.slice(0, 3).map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {screeningResult.constraintsAndRisks.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#c0392b' }}>Identified Constraints &amp; Risks:</span>
                    <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0, fontSize: '0.8rem', color: '#555' }}>
                      {screeningResult.constraintsAndRisks.slice(0, 3).map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Next Actions */}
                {screeningResult.recommendedNextSteps.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>Recommended Next Actions:</span>
                    <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0, fontSize: '0.8rem', color: '#444' }}>
                      {screeningResult.recommendedNextSteps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Candidate Interventions for this site */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
                    Candidate Intervention Matching
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {candidateInterventions.slice(0, 4).map(ci => (
                      <div
                        key={ci.intervention.id}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: ci.recommendationStatus === 'highly_recommended' ? '#eafaf1' : ci.recommendationStatus === 'not_recommended' ? '#fdedec' : 'var(--color-sand)',
                          borderLeft: `3px solid ${ci.recommendationStatus === 'highly_recommended' ? '#27864a' : ci.recommendationStatus === 'not_recommended' ? '#c0392b' : '#b7791f'}`,
                        }}
                      >
                        <strong>{ci.intervention.name}</strong>: {ci.suitabilityReason}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                  Screening heuristic only. Technical sanction requires qualified engineering design &amp; statutory clearances.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Candidate Sites List */}
        {activeTab === 'list' && (
          <div>
            {/* Filter controls */}
            <div
              className="card"
              style={{
                marginBottom: '1rem',
                padding: '0.85rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label htmlFor="filter-site-block" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Block:
                </label>
                <select
                  id="filter-site-block"
                  value={filterBlock}
                  onChange={e => setFilterBlock(e.target.value)}
                  style={{ fontSize: '0.8125rem', padding: '3px 8px', borderRadius: 'var(--radius)' }}
                >
                  <option value="all">All Blocks</option>
                  {PURULIA_BLOCKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label htmlFor="filter-site-type" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Morphology:
                </label>
                <select
                  id="filter-site-type"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  style={{ fontSize: '0.8125rem', padding: '3px 8px', borderRadius: 'var(--radius)' }}
                >
                  <option value="all">All Types</option>
                  <option value="rooftop">Rooftop</option>
                  <option value="existing_pond">Existing Pond</option>
                  <option value="drainage_channel">Drainage Channel</option>
                  <option value="agricultural_land">Agricultural Land</option>
                  <option value="contour_slope">Contour Slope</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label htmlFor="filter-site-status" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Screening Status:
                </label>
                <select
                  id="filter-site-status"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ fontSize: '0.8125rem', padding: '3px 8px', borderRadius: 'var(--radius)' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="favourable">Favourable</option>
                  <option value="moderate">Moderate Constraints</option>
                  <option value="severe">Severe Constraints</option>
                  <option value="insufficient">Insufficient Information</option>
                </select>
              </div>

              <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Showing {filteredSites.length} of {sites.length} candidate assessments
              </div>
            </div>

            {filteredSites.length > 0 ? (
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Site Name</th>
                        <th>Block &amp; Village</th>
                        <th>Type</th>
                        <th>Catchment</th>
                        <th>Slope / Soil</th>
                        <th>Screening Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSites.map(site => {
                        const scr = screenSite(site);
                        return (
                          <tr key={site.id}>
                            <td>
                              <strong>{site.name}</strong>
                              {site.isSimulated && (
                                <span style={{ marginLeft: '6px', fontSize: '10px', background: '#fcf3cf', color: '#7d6608', padding: '1px 4px', borderRadius: '3px' }}>
                                  SIMULATED
                                </span>
                              )}
                              <div style={{ fontSize: '0.75rem', color: '#666' }}>Assessed {site.assessmentDate}</div>
                            </td>
                            <td>
                              {site.block || 'Not specified'}
                              {site.village ? `, ${site.village}` : ''}
                            </td>
                            <td>{site.siteType.replace('_', ' ')}</td>
                            <td>
                              {site.catchmentAreaSqm ? `${site.catchmentAreaSqm.toLocaleString()} m²` : <span style={{ color: '#c0392b' }}>Unmeasured</span>}
                            </td>
                            <td>
                              <span style={{ textTransform: 'capitalize' }}>{site.slopeCategory}</span> / <span style={{ textTransform: 'capitalize' }}>{site.soilType.replace('_', ' ')}</span>
                            </td>
                            <td>
                              {scr.isInsufficient ? (
                                <span className="badge badge--warning" title={`Missing: ${scr.criticalMissing.join(', ')}`}>
                                  Insufficient Info
                                </span>
                              ) : scr.status === 'favourable' ? (
                                <span className="badge badge--good">{scr.percentage}% Favourable</span>
                              ) : (
                                <span className="badge badge--poor">{scr.percentage}% Constraints</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setViewingSiteDetail(site)}
                                  title="View full screening breakdown"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleEdit(site)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  style={{ color: '#c0392b' }}
                                  onClick={() => setDeleteTargetId(site.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No candidate site assessments match your selected filters.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.75rem' }}
                  onClick={() => setActiveTab('form')}
                >
                  Create New Assessment
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal: View Full Site Screening Details */}
        {viewingSiteDetail && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
            onClick={() => setViewingSiteDetail(null)}
          >
            <div
              className="card"
              style={{
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.5rem',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>
                    {viewingSiteDetail.name}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {viewingSiteDetail.block}, {viewingSiteDetail.village || 'Purulia District'} &bull; Assessed: {viewingSiteDetail.assessmentDate}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setViewingSiteDetail(null)}
                >
                  ✕ Close
                </button>
              </div>

              {(() => {
                const scr = screenSite(viewingSiteDetail);
                const inter = evaluateInterventionsForSite(viewingSiteDetail);
                return (
                  <div>
                    <div style={{ background: scr.isInsufficient ? '#ebf5fb' : scr.status === 'favourable' ? '#eafaf1' : '#fef9e7', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '1rem', color: scr.isInsufficient ? '#1b4f72' : scr.status === 'favourable' ? '#145a32' : '#7d6608' }}>
                          Screening Status: {scr.isInsufficient ? 'INSUFFICIENT INFORMATION' : `${scr.status.replace('_', ' ').toUpperCase()} (${scr.percentage}%)`}
                        </strong>
                      </div>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                        {scr.recommendation}
                      </p>
                    </div>

                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Factor-by-Factor Evaluation:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      {scr.factors.map(f => (
                        <div key={f.name} style={{ background: 'var(--color-sand)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8125rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>{f.name} {f.isCritical && <span style={{ color: '#c0392b' }}>(Critical)</span>}</span>
                            <span>{f.score} / {f.maxScore}</span>
                          </div>
                          <p style={{ color: '#555', marginTop: '2px' }}>{f.reasoning}</p>
                          <small style={{ color: '#888', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>{f.screeningImpact}</small>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Recommended Candidate Interventions:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                      {inter.map(ci => (
                        <div
                          key={ci.intervention.id}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            background: ci.recommendationStatus === 'highly_recommended' ? '#eafaf1' : ci.recommendationStatus === 'not_recommended' ? '#fdedec' : 'var(--color-sand)',
                            borderLeft: `3px solid ${ci.recommendationStatus === 'highly_recommended' ? '#27864a' : ci.recommendationStatus === 'not_recommended' ? '#c0392b' : '#b7791f'}`,
                          }}
                        >
                          <strong>{ci.intervention.name}</strong>: {ci.suitabilityReason}
                        </div>
                      ))}
                    </div>

                    {/* Sizing & Land Footprint in Modal */}
                    {viewingSiteDetail.preliminaryDimensions && (
                      <div style={{ marginTop: '1rem', background: '#f8f9fa', padding: '0.85rem', borderRadius: '4px', border: '1px solid #dcdde1' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', marginBottom: '0.4rem' }}>
                          Preliminary Sizing &amp; Land Footprint
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.8rem' }}>
                          <div><strong>Type:</strong> {viewingSiteDetail.preliminaryDimensions.structureType.replace('_', ' ')}</div>
                          <div><strong>Usable Storage:</strong> {viewingSiteDetail.preliminaryDimensions.usableVolumeLitres.toLocaleString()} L</div>
                          <div><strong>Dimensions:</strong> {viewingSiteDetail.preliminaryDimensions.lengthM}m × {viewingSiteDetail.preliminaryDimensions.widthM}m × {viewingSiteDetail.preliminaryDimensions.depthM}m</div>
                          <div><strong>Structure Footprint:</strong> {viewingSiteDetail.preliminaryDimensions.externalStructureFootprintSqm} m²</div>
                          <div style={{ gridColumn: 'span 2', color: '#1a5276' }}>
                            <strong>Total Land Requirement:</strong> {viewingSiteDetail.preliminaryDimensions.totalLandRequirementSqm} m² (with {viewingSiteDetail.preliminaryDimensions.maintenanceClearanceBufferM}m perimeter access)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Implementation Gap in Modal */}
                    {viewingSiteDetail.implementationGap && viewingSiteDetail.implementationGap.identifiedGaps.length > 0 && (
                      <div style={{ marginTop: '1rem', background: '#fef9e7', padding: '0.85rem', borderRadius: '4px', border: '1px solid #f9e79f' }}>
                        <h4 style={{ fontSize: '0.85rem', color: '#7d6608', marginBottom: '0.4rem' }}>
                          Identified Implementation Gaps &amp; Action Plan
                        </h4>
                        <ul style={{ margin: '0 0 0.5rem 1.2rem', padding: 0, fontSize: '0.78rem', color: '#555' }}>
                          {viewingSiteDetail.implementationGap.identifiedGaps.map(g => (
                            <li key={g}><strong>{g.replace(/_/g, ' ')}</strong></li>
                          ))}
                        </ul>
                        {viewingSiteDetail.implementationGap.actionPlanSteps.length > 0 && (
                          <div style={{ borderTop: '1px dashed #d4ac0d', paddingTop: '0.4rem', fontSize: '0.78rem' }}>
                            <strong>Action Steps:</strong>
                            <ol style={{ margin: '0.2rem 0 0 1.2rem', padding: 0 }}>
                              {viewingSiteDetail.implementationGap.actionPlanSteps.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cost Preview in Modal */}
                    {viewingSiteDetail.preliminaryCostEstimate && (
                      <div style={{ marginTop: '1rem', background: '#eafaf1', padding: '0.85rem', borderRadius: '4px', border: '1px solid #a9dfbf' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '0.85rem', color: '#145a32', margin: 0 }}>
                            Preliminary Cost Benchmark
                          </h4>
                          <strong style={{ color: '#145a32', fontSize: '0.85rem' }}>
                            ₹{viewingSiteDetail.preliminaryCostEstimate.capitalCostINR.toLocaleString()}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#196f3d', marginTop: '0.25rem' }}>
                          Annual Upkeep: ₹{viewingSiteDetail.preliminaryCostEstimate.annualMaintenanceINR.toLocaleString()}/yr &bull; ₹{viewingSiteDetail.preliminaryCostEstimate.costPerLitresUsableINR}/L
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteTargetId !== null}
          title="Delete Site Assessment"
          message="Are you sure you want to permanently delete this candidate site assessment? This cannot be undone."
          confirmLabel="Delete Assessment"
          onConfirm={() => {
            if (deleteTargetId) {
              onDeleteSite(deleteTargetId);
              setDeleteTargetId(null);
            }
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      </div>
    </div>
  );
};
