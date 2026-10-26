import React, { useState } from 'react';
import type { SiteAssessment, SiteType, SlopeCategory, SoilType, AssetCondition, OwnershipStatus } from '../types';
import { screenSite } from '../lib/screening';
import { generateId } from '../lib/storage';
import { NoticeBanner } from '../components/NoticeBanner';

interface SiteAssessmentPageProps {
  sites: SiteAssessment[];
  onSaveSite: (site: SiteAssessment) => void;
  onDeleteSite: (id: string) => void;
  isSimulated: boolean;
}

const INITIAL_FORM: Omit<SiteAssessment, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  block: '',
  village: '',
  latitude: null,
  longitude: null,
  siteType: 'rooftop',
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
  assessmentDate: new Date().toISOString().substring(0, 10),
  notes: '',
  isSimulated: false,
};

export const SiteAssessmentPage: React.FC<SiteAssessmentPageProps> = ({
  sites,
  onSaveSite,
  onDeleteSite,
  isSimulated,
}) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Compute live screening result for the active form
  const activeAssessment: SiteAssessment = {
    ...formData,
    id: selectedSiteId || 'draft-screening',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const screeningResult = screenSite(activeAssessment);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please provide a site name.');
      return;
    }

    const siteToSave: SiteAssessment = {
      ...formData,
      id: selectedSiteId || generateId(),
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
      slopeCategory: site.slopeCategory,
      soilType: site.soilType,
      geologyInfo: site.geologyInfo,
      existingStructure: site.existingStructure,
      existingStructureCondition: site.existingStructureCondition,
      waterDemand: site.waterDemand,
      ownershipStatus: site.ownershipStatus,
      constraints: site.constraints,
      dataSource: site.dataSource || 'Not verified / demonstration entry',
      assessmentDate: site.assessmentDate,
      notes: site.notes,
      isSimulated: site.isSimulated,
    });
    setSelectedSiteId(site.id);
    setActiveTab('form');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Site Assessment &amp; Rule-Based Screening</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Record candidate locations and evaluate provisional feasibility without artificial machine-learning models.
          </p>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {saveSuccess && (
          <div className="notice notice--info" style={{ marginBottom: '1rem' }}>
            <strong>Saved: </strong> {saveSuccess}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            {selectedSiteId ? 'Edit Assessment' : 'New Assessment & Live Screening'}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Recorded Assessments ({sites.length})
          </button>
        </div>

        {activeTab === 'form' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Form Section */}
            <form onSubmit={handleSubmit} className="card">
              <div className="card-header">
                <h2>Candidate Location Record</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Fields with unknown data should remain 'Unknown'. Never invent geological, ownership, or catchment numbers.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="site-name">Site / Candidate Name *</label>
                <input
                  id="site-name"
                  type="text"
                  required
                  placeholder="e.g. Primary School Roof, Demo Hillside Catchment"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="site-block">Block</label>
                  <input
                    id="site-block"
                    type="text"
                    placeholder="e.g. Purulia-I, Hura, Manbazar"
                    value={formData.block}
                    onChange={e => setFormData({ ...formData, block: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="site-village">Village / Locality</label>
                  <input
                    id="site-village"
                    type="text"
                    placeholder="e.g. Lagda, Sirkabad"
                    value={formData.village}
                    onChange={e => setFormData({ ...formData, village: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="site-lat">Latitude (if verified)</label>
                  <input
                    id="site-lat"
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 23.3320"
                    value={formData.latitude ?? ''}
                    onChange={e =>
                      setFormData({ ...formData, latitude: e.target.value === '' ? null : parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="site-lon">Longitude (if verified)</label>
                  <input
                    id="site-lon"
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 86.3650"
                    value={formData.longitude ?? ''}
                    onChange={e =>
                      setFormData({ ...formData, longitude: e.target.value === '' ? null : parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="site-type">Site Type *</label>
                  <select
                    id="site-type"
                    value={formData.siteType}
                    onChange={e => setFormData({ ...formData, siteType: e.target.value as SiteType })}
                  >
                    <option value="rooftop">Rooftop</option>
                    <option value="existing_pond">Existing Pond / Water Body</option>
                    <option value="drainage_channel">Drainage Channel / Nala</option>
                    <option value="agricultural_land">Agricultural Land</option>
                    <option value="other">Other / Mixed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="catchment-area">Approx. Catchment Area (m²)</label>
                  <input
                    id="catchment-area"
                    type="number"
                    min="0"
                    placeholder="e.g. 250"
                    value={formData.catchmentAreaSqm ?? ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        catchmentAreaSqm: e.target.value === '' ? null : parseFloat(e.target.value),
                      })
                    }
                  />
                  <span className="form-hint">Critical parameter for calculating runoff yield.</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="slope-cat">Slope Category</label>
                  <select
                    id="slope-cat"
                    value={formData.slopeCategory}
                    onChange={e => setFormData({ ...formData, slopeCategory: e.target.value as SlopeCategory })}
                  >
                    <option value="unknown">Unknown / Not Measured</option>
                    <option value="flat">Flat (&lt; 2%)</option>
                    <option value="gentle">Gentle (2% – 5%)</option>
                    <option value="moderate">Moderate (5% – 10%)</option>
                    <option value="steep">Steep (&gt; 10%)</option>
                  </select>
                  <span className="form-hint">Controls hydraulic velocity and breach risk.</span>
                </div>
                <div className="form-group">
                  <label htmlFor="soil-type">Predominant Soil Type</label>
                  <select
                    id="soil-type"
                    value={formData.soilType}
                    onChange={e => setFormData({ ...formData, soilType: e.target.value as SoilType })}
                  >
                    <option value="unknown">Unknown</option>
                    <option value="laterite">Laterite (Common in Purulia uplands)</option>
                    <option value="red_soil">Red Soil / Mixed loam</option>
                    <option value="alluvial">Alluvial (Valley bottoms)</option>
                    <option value="sandy">Sandy / Coarse</option>
                    <option value="clay">Clay (Low permeability)</option>
                    <option value="rocky">Rocky / Hard rock outcrop</option>
                    <option value="mixed">Mixed</option>
                  </select>
                  <span className="form-hint">Determines percolation vs surface impoundment.</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="geology-info">Geology Notes (if available)</label>
                <input
                  id="geology-info"
                  type="text"
                  placeholder="e.g. Weathered gneissic basement, fractured laterite mantle"
                  value={formData.geologyInfo}
                  onChange={e => setFormData({ ...formData, geologyInfo: e.target.value })}
                />
                <span className="form-hint">Leave blank if no hydrogeological study has been consulted.</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="existing-structure">Existing Structure (if any)</label>
                  <input
                    id="existing-structure"
                    type="text"
                    placeholder="e.g. Silted village pond, earthen bund, unlined tank"
                    value={formData.existingStructure}
                    onChange={e => setFormData({ ...formData, existingStructure: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="existing-cond">Existing Structure Condition</label>
                  <select
                    id="existing-cond"
                    value={formData.existingStructureCondition}
                    onChange={e =>
                      setFormData({ ...formData, existingStructureCondition: e.target.value as AssetCondition })
                    }
                  >
                    <option value="unknown">Unknown / Not Applicable</option>
                    <option value="good">Good (Minor maintenance only)</option>
                    <option value="fair">Fair (Desilting or repair needed)</option>
                    <option value="poor">Poor (Breached / heavy siltation)</option>
                    <option value="non_functional">Non-functional / Abandoned</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="water-demand">Water Demand / Intended Use</label>
                  <input
                    id="water-demand"
                    type="text"
                    placeholder="e.g. School drinking & sanitation, 1-acre rabi crops"
                    value={formData.waterDemand}
                    onChange={e => setFormData({ ...formData, waterDemand: e.target.value })}
                  />
                  <span className="form-hint">Identifies beneficiary group and utility.</span>
                </div>
                <div className="form-group">
                  <label htmlFor="ownership">Land Ownership / Permission</label>
                  <select
                    id="ownership"
                    value={formData.ownershipStatus}
                    onChange={e => setFormData({ ...formData, ownershipStatus: e.target.value as OwnershipStatus })}
                  >
                    <option value="unknown">Unknown / Unverified</option>
                    <option value="government">Government / Panchayat land</option>
                    <option value="community">Community / Common land</option>
                    <option value="private_with_permission">Private (Consent obtained)</option>
                    <option value="private_no_permission">Private (No consent yet)</option>
                    <option value="disputed">Disputed / Under litigation</option>
                  </select>
                  <span className="form-hint">Legal clearance required prior to work.</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="constraints">Main Constraints &amp; Observations</label>
                <textarea
                  id="constraints"
                  placeholder="e.g. Hard rock layer at 1.2m depth, seasonal road cut-off, cattle trampling"
                  value={formData.constraints}
                  onChange={e => setFormData({ ...formData, constraints: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="data-source-select">Data Source Category *</label>
                  <select
                    id="data-source-select"
                    value={[
                      'Not verified / demonstration entry',
                      'Direct field visit assessment',
                      'Gram Panchayat records / register',
                      'Community / stakeholder consultation',
                      'Secondary literature / CGWB report / GIS map',
                    ].includes(formData.dataSource) ? formData.dataSource : 'custom'}
                    onChange={e => {
                      if (e.target.value !== 'custom') {
                        setFormData({ ...formData, dataSource: e.target.value });
                      } else {
                        setFormData({ ...formData, dataSource: '' });
                      }
                    }}
                  >
                    <option value="Not verified / demonstration entry">Not verified / demonstration entry (Default)</option>
                    <option value="Direct field visit assessment">Direct field visit assessment</option>
                    <option value="Gram Panchayat records / register">Gram Panchayat records / register</option>
                    <option value="Community / stakeholder consultation">Community / stakeholder consultation</option>
                    <option value="Secondary literature / CGWB report / GIS map">Secondary literature / CGWB report / GIS map</option>
                    <option value="custom">Other / Custom source entry...</option>
                  </select>
                  <div style={{ marginTop: '0.35rem' }}>
                    <input
                      id="data-source"
                      type="text"
                      placeholder="Specify exact data source details"
                      value={formData.dataSource}
                      onChange={e => setFormData({ ...formData, dataSource: e.target.value })}
                    />
                    <span className="form-hint">
                      Default is "Not verified / demonstration entry". Select or type the source manually.
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="assessment-date">Assessment Date</label>
                  <input
                    id="assessment-date"
                    type="date"
                    value={formData.assessmentDate}
                    onChange={e => setFormData({ ...formData, assessmentDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="btn-group" style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  {selectedSiteId ? 'Update Assessment' : 'Save Site Assessment'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleReset}>
                  Clear Form
                </button>
              </div>
            </form>

            {/* Live Screening Breakdown Card */}
            <div className="card" style={{ position: 'sticky', top: '1rem' }}>
              <div className="card-header">
                <h2>Rule-Based Screening Panel</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Transparent heuristic evaluation based exclusively on supplied field entries.
                </p>
              </div>

              {/* Insufficient Information Alert Banner */}
              {screeningResult.isInsufficient ? (
                <div
                  style={{
                    backgroundColor: '#fff8e6',
                    border: '1px solid #ffeaa7',
                    borderLeft: '5px solid #d48806',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ad6800', marginBottom: '0.25rem' }}>
                    Insufficient information for assessment
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#614700', lineHeight: 1.45, margin: 0 }}>
                    Critical baseline parameters required for a reliable feasibility evaluation are missing.
                    Do not interpret a low score under incomplete data as an indication of poor site quality.
                  </p>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {screeningResult.criticalMissing.map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.725rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#ffe58f',
                          color: '#614700',
                          border: '1px solid #ffd666',
                          fontWeight: 600,
                        }}
                      >
                        Missing: {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Score Display (Suppressed when baseline data is incomplete) */}
              {screeningResult.isInsufficient ? (
                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: '#f9f9f9',
                    borderRadius: 'var(--radius)',
                    border: '1px dashed var(--color-border)',
                  }}
                >
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                    Score Indeterminate (Inputs Incomplete)
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {screeningResult.criticalMissing.length} critical baseline{' '}
                    {screeningResult.criticalMissing.length === 1 ? 'factor is' : 'factors are'} unrecorded.
                    Numerical score is deferred until required baseline data is supplied.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {screeningResult.totalScore}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      / {screeningResult.maxPossibleScore} ({screeningResult.percentage}%)
                    </span>
                  </div>

                  <div className="screening-bar-bg" style={{ marginBottom: '1rem' }}>
                    <div
                      className="screening-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(5, screeningResult.percentage))}%`,
                        backgroundColor:
                          screeningResult.percentage >= 70
                            ? 'var(--color-success)'
                            : screeningResult.percentage >= 40
                            ? 'var(--color-warning)'
                            : 'var(--color-danger)',
                      }}
                    />
                  </div>
                </>
              )}

              {/* Recommendation Callout */}
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-sand)',
                  border: '1px solid var(--color-border)',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                <strong>Evaluation Status: </strong>
                {screeningResult.recommendation}
              </div>

              {/* Factor Breakdown with Screening Impact Explanations */}
              <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Factor Breakdown &amp; Screening Rationale:
                </div>
                {screeningResult.factors.map((f, idx) => (
                  <div key={idx} className="screening-factor">
                    <div className="screening-factor-header">
                      <span className="screening-factor-name">
                        {f.name}
                        {f.isCritical && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              marginLeft: '6px',
                              borderRadius: '3px',
                              background: f.dataAvailable ? '#e8f4f8' : '#fce4ec',
                              color: f.dataAvailable ? '#1a5276' : '#c0392b',
                              fontWeight: 600,
                            }}
                          >
                            {f.dataAvailable ? 'Critical ✓' : 'Critical Missing'}
                          </span>
                        )}
                      </span>
                      <span className="screening-factor-score">
                        {f.dataAvailable ? `${f.score}/10` : 'No data'}
                      </span>
                    </div>

                    <p className="screening-factor-reasoning" style={{ marginBottom: '0.35rem' }}>
                      <strong>Assessment:</strong> {f.reasoning}
                    </p>

                    <div
                      style={{
                        fontSize: '0.725rem',
                        color: 'var(--color-text-secondary)',
                        background: '#f4ede1',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>How this affects screening:</strong> {f.screeningImpact}
                    </div>
                  </div>
                ))}
              </div>

              {/* Missing Information Notice */}
              {screeningResult.missingData.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fff9e6', borderRadius: 'var(--radius)', border: '1px solid #ffeaa7' }}>
                  <h4 style={{ fontSize: '0.8125rem', color: '#b7791f', marginBottom: '0.35rem' }}>
                    Information Still Needed ({screeningResult.missingData.length} items):
                  </h4>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#634a1b' }}>
                    {screeningResult.missingData.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warning Notice */}
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {screeningResult.warnings.map((w, i) => (
                  <p key={i} style={{ marginBottom: '0.25rem' }}>&bull; {w}</p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Recorded Site Assessments List */
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Saved Candidate Assessments ({sites.length})</h2>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab('form')}>
                + New Assessment
              </button>
            </div>

            {sites.length === 0 ? (
              <div className="empty-state">
                <p>No site assessments recorded yet. Switch to the form tab to record your first site.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Site Name</th>
                      <th>Location</th>
                      <th>Site Type</th>
                      <th>Screening Status / Score</th>
                      <th>Data Source</th>
                      <th>Condition</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sites.map(site => {
                      const res = screenSite(site);
                      return (
                        <tr key={site.id}>
                          <td>
                            <strong>{site.name}</strong>
                            {site.isSimulated && (
                              <span className="badge badge--simulated" style={{ marginLeft: '6px' }}>Simulated</span>
                            )}
                          </td>
                          <td>
                            {site.block || ''} {site.village ? `(${site.village})` : ''}
                          </td>
                          <td>{site.siteType.replace('_', ' ')}</td>
                          <td>
                            {res.isInsufficient ? (
                              <span
                                className="badge badge--fair"
                                title={`Critical parameters missing: ${res.criticalMissing.join(', ')}`}
                                style={{ fontWeight: 600 }}
                              >
                                Insufficient Data ({res.criticalMissing.length} missing)
                              </span>
                            ) : (
                              <span>
                                <strong>{res.percentage}%</strong> ({res.totalScore}/{res.maxPossibleScore})
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.785rem', maxWidth: '140px' }}>
                            {site.dataSource || 'Not verified'}
                          </td>
                          <td>
                            <span className={`badge badge--${site.existingStructureCondition}`}>
                              {site.existingStructureCondition}
                            </span>
                          </td>
                          <td>{site.assessmentDate}</td>
                          <td>
                            <div className="btn-group">
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleEdit(site)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  if (confirm(`Delete assessment "${site.name}"?`)) {
                                    onDeleteSite(site.id);
                                  }
                                }}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};
