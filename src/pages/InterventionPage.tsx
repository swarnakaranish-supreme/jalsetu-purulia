import React, { useState, useMemo } from 'react';
import { INTERVENTION_OPTIONS, evaluateInterventionsForSite } from '../lib/interventions';
import { getSiteAssessments } from '../lib/storage';
import { NoticeBanner } from '../components/NoticeBanner';
import type { SiteAssessment } from '../types';

interface InterventionPageProps {
  isSimulated: boolean;
  sites?: SiteAssessment[];
}

export const InterventionPage: React.FC<InterventionPageProps> = ({ isSimulated, sites }) => {
  const [selectedId, setSelectedId] = useState<string>('restore-existing');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterRestorationOnly, setFilterRestorationOnly] = useState<boolean>(false);

  // Active candidate site for site-specific evaluation
  const availableSites = useMemo(() => {
    return sites && sites.length > 0 ? sites : getSiteAssessments();
  }, [sites]);

  const [activeSiteId, setActiveSiteId] = useState<string>(
    availableSites.length > 0 ? availableSites[0].id : ''
  );

  const selectedSite = useMemo(() => {
    return availableSites.find(s => s.id === activeSiteId) || null;
  }, [availableSites, activeSiteId]);

  // Evaluate candidate interventions for the selected site
  const siteEvaluationResults = useMemo(() => {
    if (!selectedSite) return null;
    return evaluateInterventionsForSite(selectedSite);
  }, [selectedSite]);

  // Filtered interventions
  const displayedOptions = useMemo(() => {
    return INTERVENTION_OPTIONS.filter(opt => {
      if (filterRestorationOnly && !opt.isRestoration) return false;
      if (selectedCategory !== 'all' && opt.category !== selectedCategory) return false;
      return true;
    });
  }, [filterRestorationOnly, selectedCategory]);

  const currentOption =
    INTERVENTION_OPTIONS.find(o => o.id === selectedId) || INTERVENTION_OPTIONS[0];

  const currentEvaluation = siteEvaluationResults
    ? siteEvaluationResults.find(r => r.intervention.id === currentOption.id)
    : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Intervention Comparison &amp; Feasibility</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Multi-criteria comparison of water conservation interventions — prioritising restoration of existing assets before new construction.
          </p>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Mandatory Engineering Warning Banner */}
        <div className="notice notice--warning" style={{ marginBottom: '1.5rem' }}>
          <div>
            <strong>Mandatory Scientific Caution: </strong>
            In Purulia's undulating hard-rock terrain, check dams, subsurface dykes, and recharge shafts
            <strong> must NEVER be sanctioned or excavated based solely on software screening</strong>.
            All interventions require on-ground geological verification (identifying crystalline granite-gneiss vs weathered mantle),
            catchment yield calculations, downstream water rights consultation, and formal technical sanction from qualified engineers.
          </div>
        </div>

        {/* Priority Restoration Principle Banner */}
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f0f9f8', borderLeft: '4px solid var(--color-teal)' }}>
          <h2 style={{ fontSize: '1.05rem', color: 'var(--color-teal)', marginBottom: '0.4rem' }}>
            Restoration-First Principle (Jal Dharo-Jal Bharo &amp; Traditional Water Bodies)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
            Purulia has thousands of traditional water-harvesting structures (including bandhs, hapas, pukurs, and village tanks),
            many of which suffer from silt accumulation, weed invasion, or breached earthen bunds.
            Desilting and rehabilitating an existing water body restores critical storage capacity at a fraction of the cost of new excavation, avoids land acquisition conflict, and respects historic drainage flows.
          </p>
        </div>

        {/* Interactive Site-Specific Compatibility Mode */}
        {availableSites.length > 0 && (
          <div
            className="card"
            style={{
              marginBottom: '1.5rem',
              padding: '1.25rem',
              background: '#fbfcfd',
              border: '1px solid #d0d7de',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                  Site-Specific Compatibility Evaluation
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Select an assessed candidate site to evaluate technical feasibility across all 10 conservation interventions.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label htmlFor="eval-site-select" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Assessed Site:
                </label>
                <select
                  id="eval-site-select"
                  value={activeSiteId}
                  onChange={e => setActiveSiteId(e.target.value)}
                  style={{ fontSize: '0.8125rem', padding: '4px 10px', borderRadius: 'var(--radius)' }}
                >
                  {availableSites.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.block} &bull; {s.siteType.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSite && (
              <div style={{ background: 'var(--color-sand)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                  <div><strong>Morphology:</strong> {selectedSite.siteType.replace('_', ' ')}</div>
                  <div><strong>Slope:</strong> {selectedSite.slopeCategory}</div>
                  <div><strong>Soil / Geology:</strong> {selectedSite.soilType} {selectedSite.geologyInfo ? `(${selectedSite.geologyInfo})` : ''}</div>
                  <div><strong>Catchment:</strong> {selectedSite.catchmentAreaSqm ? `${selectedSite.catchmentAreaSqm} m²` : 'Unmeasured'}</div>
                  <div><strong>Existing Structure:</strong> {selectedSite.existingStructure ? `${selectedSite.existingStructure} (${selectedSite.existingStructureCondition})` : 'None'}</div>
                </div>
              </div>
            )}

            {/* Quick Compatibility Grid */}
            {siteEvaluationResults && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
                {siteEvaluationResults.map(res => {
                  const statusColor =
                    res.recommendationStatus === 'highly_recommended'
                      ? '#27864a'
                      : res.recommendationStatus === 'not_recommended'
                      ? '#c0392b'
                      : res.recommendationStatus === 'requires_more_data'
                      ? '#2980b9'
                      : '#b7791f';

                  const statusBg =
                    res.recommendationStatus === 'highly_recommended'
                      ? '#eafaf1'
                      : res.recommendationStatus === 'not_recommended'
                      ? '#fdedec'
                      : res.recommendationStatus === 'requires_more_data'
                      ? '#ebf5fb'
                      : '#fef9e7';

                  return (
                    <div
                      key={res.intervention.id}
                      onClick={() => setSelectedId(res.intervention.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius)',
                        background: statusBg,
                        border: selectedId === res.intervention.id ? `2px solid ${statusColor}` : '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                          {res.intervention.name}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.725rem', fontWeight: 600, color: statusColor, textTransform: 'uppercase', marginTop: '2px' }}>
                        {res.recommendationStatus.replace(/_/g, ' ')}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '3px', lineHeight: 1.3 }}>
                        {res.suitabilityReason.length > 85 ? `${res.suitabilityReason.substring(0, 85)}...` : res.suitabilityReason}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Category Filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginRight: '4px' }}>
              Categories:
            </span>
            <button
              type="button"
              className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory('all')}
            >
              All (10)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedCategory === 'restoration' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory('restoration')}
            >
              ★ Restoration First
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedCategory === 'rooftop' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory('rooftop')}
            >
              Rooftop RWH
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedCategory === 'farm_irrigation' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory('farm_irrigation')}
            >
              Farm Irrigation &amp; Hapas
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedCategory === 'channel_barrier' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory('channel_barrier')}
            >
              Check Dams / Channels
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedCategory === 'watershed_contour' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory('watershed_contour')}
            >
              Ridge Contours / SCT
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedCategory === 'subsurface_recharge' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory('subsurface_recharge')}
            >
              Subsurface Recharge
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedCategory === 'distribution' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory('distribution')}
            >
              Community Cisterns
            </button>
          </div>

          <label style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterRestorationOnly}
              onChange={e => setFilterRestorationOnly(e.target.checked)}
            />
            Show Restoration Options Only
          </label>
        </div>

        {/* Intervention Selector Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {displayedOptions.map(option => (
            <button
              key={option.id}
              type="button"
              className={`btn btn-sm ${selectedId === option.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedId(option.id)}
            >
              {option.isRestoration && '★ '}
              {option.name}
            </button>
          ))}
        </div>

        {/* Detailed Option Card */}
        <div className={`card ${currentOption.isRestoration ? 'intervention-card restoration' : ''}`}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>
                {currentOption.name}
                {currentOption.isRestoration && (
                  <span className="badge badge--good" style={{ marginLeft: '10px' }}>
                    Restoration Priority
                  </span>
                )}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                {currentOption.description}
              </p>
            </div>
            {currentOption.costRangeLow !== null && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Indicative Range:</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  ₹{currentOption.costRangeLow.toLocaleString()} – ₹{currentOption.costRangeHigh?.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Current Evaluation Alert for active site */}
          {currentEvaluation && (
            <div
              style={{
                margin: '1rem 0',
                padding: '0.85rem',
                borderRadius: 'var(--radius)',
                background: currentEvaluation.recommendationStatus === 'highly_recommended' ? '#eafaf1' : currentEvaluation.recommendationStatus === 'not_recommended' ? '#fdedec' : '#fef9e7',
                borderLeft: `4px solid ${currentEvaluation.recommendationStatus === 'highly_recommended' ? '#27864a' : currentEvaluation.recommendationStatus === 'not_recommended' ? '#c0392b' : '#b7791f'}`,
              }}
            >
              <strong style={{ fontSize: '0.875rem' }}>
                Compatibility with {selectedSite?.name}:{' '}
                <span style={{ textTransform: 'uppercase' }}>{currentEvaluation.recommendationStatus.replace(/_/g, ' ')}</span>
              </strong>
              <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: '#333' }}>
                {currentEvaluation.suitabilityReason}
              </p>
              {currentEvaluation.siteSpecificRisks.length > 0 && (
                <ul style={{ margin: '0.25rem 0 0 1.2rem', padding: 0, fontSize: '0.8rem', color: '#c0392b' }}>
                  {currentEvaluation.siteSpecificRisks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Physical Conditions */}
          {(currentOption.suitableSlope || currentOption.suitableSoilGeology) && (
            <div style={{ background: 'var(--color-sand)', padding: '0.85rem', borderRadius: 'var(--radius)', margin: '1rem 0', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {currentOption.suitableSlope && (
                  <div>
                    <strong style={{ color: 'var(--color-primary-dark)' }}>Suitable Topography:</strong>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{currentOption.suitableSlope}</p>
                  </div>
                )}
                {currentOption.suitableSoilGeology && (
                  <div>
                    <strong style={{ color: 'var(--color-primary-dark)' }}>Suitable Soil / Hydrogeology:</strong>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{currentOption.suitableSoilGeology}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
            {/* Advantages */}
            <div className="intervention-section">
              <h4 style={{ color: 'var(--color-success)', marginBottom: '0.4rem' }}>Potential Advantages</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {currentOption.advantages.map((adv, i) => (
                  <li key={i} style={{ marginBottom: '0.35rem' }}>{adv}</li>
                ))}
              </ul>
            </div>

            {/* Limitations */}
            <div className="intervention-section">
              <h4 style={{ color: 'var(--color-danger)', marginBottom: '0.4rem' }}>Known Limitations &amp; Caveats</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {currentOption.limitations.map((lim, i) => (
                  <li key={i} style={{ marginBottom: '0.35rem' }}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>

          <hr style={{ margin: '1.25rem 0', borderColor: 'var(--color-border)' }} />

          {/* Cost Basis & Maintenance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="intervention-section">
              <h4>Cost Basis &amp; Financial Considerations</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {currentOption.costBasis}
              </p>
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--color-sand)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                <strong>Methodology Note: </strong> Cost ranges are indicative benchmarks based on Schedule of Rates (SOR)
                for earthwork, masonry, and piping. Actual cost requires detailed estimates by the block engineering cell.
              </div>
            </div>

            <div className="intervention-section">
              <h4>Maintenance &amp; Upkeep Requirements</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {currentOption.maintenanceRequirements.map((req, i) => (
                  <li key={i} style={{ marginBottom: '0.35rem' }}>{req}</li>
                ))}
              </ul>
            </div>
          </div>

          <hr style={{ margin: '1.25rem 0', borderColor: 'var(--color-border)' }} />

          {/* Data Needed & Statutory Permissions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="intervention-section">
              <h4>Prerequisite Field Data Needed</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {currentOption.dataNeeded.map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.35rem' }}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="intervention-section">
              <h4>Engineering &amp; Statutory Requirements</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {currentOption.engineeringRequirements.map((eng, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>
                    <strong>Technical: </strong>{eng}
                  </li>
                ))}
                {currentOption.permissionRequirements.map((perm, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>
                    <strong>Statutory: </strong>{perm}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Downstream & Community Role */}
          {(currentOption.downstreamImpacts || currentOption.communityManagementRole) && (
            <>
              <hr style={{ margin: '1.25rem 0', borderColor: 'var(--color-border)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {currentOption.downstreamImpacts && (
                  <div className="intervention-section">
                    <h4>Downstream &amp; Riparian Impacts</h4>
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {currentOption.downstreamImpacts.map((imp, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentOption.communityManagementRole && (
                  <div className="intervention-section">
                    <h4>Community Stewardship &amp; Management</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {currentOption.communityManagementRole}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
