import React, { useState } from 'react';
import { INTERVENTION_OPTIONS } from '../lib/interventions';
import { NoticeBanner } from '../components/NoticeBanner';

interface InterventionPageProps {
  isSimulated: boolean;
}

export const InterventionPage: React.FC<InterventionPageProps> = ({ isSimulated }) => {
  const [selectedId, setSelectedId] = useState<string>('restore-existing');
  const [filterRestorationOnly, setFilterRestorationOnly] = useState<boolean>(false);

  const displayedOptions = filterRestorationOnly
    ? INTERVENTION_OPTIONS.filter(o => o.isRestoration)
    : INTERVENTION_OPTIONS;

  const currentOption = INTERVENTION_OPTIONS.find(o => o.id === selectedId) || INTERVENTION_OPTIONS[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Intervention Comparison &amp; Feasibility</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Systematic evaluation of conservation measures — prioritising restoration of existing water bodies before new construction.
          </p>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Essential Engineering Warning */}
        <div className="notice notice--warning" style={{ marginBottom: '1.5rem' }}>
          <div>
            <strong>Mandatory Field Verification Notice: </strong>
            In Purulia's undulating hard-rock and laterite terrain, check dams, subsurface dykes, and recharge shafts
            <strong> must never be selected or constructed based solely on software outputs</strong>.
            All interventions require ground geological verification, catchment yield analysis, and technical sanction
            from qualified engineers and competent authorities (such as the State Water Resources Investigation Directorate / CGWB).
          </div>
        </div>

        {/* Priority Restoration Principle Banner */}
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f0f9f8', borderLeft: '4px solid var(--color-teal)' }}>
          <h2 style={{ fontSize: '1.05rem', color: 'var(--color-teal)', marginBottom: '0.5rem' }}>
            Restoration-First Principle
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Purulia has thousands of traditional water-harvesting structures (including bandhs, hapas, and village tanks),
            many of which suffer from siltation or breached bunds. Rehabilitating and desilting an existing structure typically
            costs less, avoids land acquisition conflicts, and preserves established ecological micro-catchments.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

          <label style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterRestorationOnly}
              onChange={e => setFilterRestorationOnly(e.target.checked)}
            />
            Show Restoration Options Only
          </label>
        </div>

        {/* Detailed Option Card */}
        <div className={`card ${currentOption.isRestoration ? 'intervention-card restoration' : ''}`}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>
                {currentOption.name}
                {currentOption.isRestoration && (
                  <span className="badge badge--good" style={{ marginLeft: '10px' }}>
                    Restoration Priority
                  </span>
                )}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                {currentOption.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
            {/* Advantages */}
            <div className="intervention-section">
              <h4 style={{ color: 'var(--color-success)' }}>Potential Advantages</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                {currentOption.advantages.map((adv, i) => (
                  <li key={i} style={{ marginBottom: '0.35rem' }}>{adv}</li>
                ))}
              </ul>
            </div>

            {/* Limitations */}
            <div className="intervention-section">
              <h4 style={{ color: 'var(--color-danger)' }}>Known Limitations &amp; Caveats</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
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
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
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
                <strong>Transparent Note: </strong> No fixed cost number is displayed because arbitrary software cost projections
                mislead planners. Reliable estimates require a Schedule of Rates (SOR) analysis based on current local PWD/MGNREGA rates.
              </div>
            </div>

            <div className="intervention-section">
              <h4>Maintenance &amp; Upkeep Requirements</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
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
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                {currentOption.dataNeeded.map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.35rem' }}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="intervention-section">
              <h4>Engineering &amp; Permission Requirements</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                {currentOption.engineeringRequirements.map((eng, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>
                    <strong>Technical: </strong>{eng}
                  </li>
                ))}
                {currentOption.permissionRequirements.map((perm, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>
                    <strong>Statutory / Administrative: </strong>{perm}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
