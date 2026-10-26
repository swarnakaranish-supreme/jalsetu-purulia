import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  onClearData: () => void;
  isSimulated: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onResetData,
  onClearData,
  isSimulated,
}) => {
  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Navigation">
        <div className="sidebar-brand">
          <h1>JalSetu Purulia</h1>
          <p>Water-Harvesting Planning &amp; Monitoring</p>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: isSimulated ? 'rgba(232, 218, 239, 0.25)' : 'rgba(72, 201, 176, 0.25)',
                color: isSimulated ? '#e8daef' : '#48c9b0',
                border: '1px solid currentColor',
              }}
            >
              {isSimulated ? 'Simulated Demo' : 'Local User Data'}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Overview Dashboard
          </NavLink>

          <NavLink to="/sites" className={({ isActive }) => (isActive ? 'active' : '')} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            Site Assessment
          </NavLink>

          <NavLink to="/interventions" className={({ isActive }) => (isActive ? 'active' : '')} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Intervention Comparison
          </NavLink>

          <NavLink to="/assets" className={({ isActive }) => (isActive ? 'active' : '')} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Asset Register
          </NavLink>

          <NavLink to="/monitoring" className={({ isActive }) => (isActive ? 'active' : '')} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            Water Monitoring
          </NavLink>

          <NavLink to="/maintenance" className={({ isActive }) => (isActive ? 'active' : '')} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Maintenance &amp; Inspection
          </NavLink>

          <NavLink to="/calculator" className={({ isActive }) => (isActive ? 'active' : '')} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="16" y1="14" x2="16" y2="18" />
              <path d="M16 10h.01" />
              <path d="M12 10h.01" />
              <path d="M8 10h.01" />
              <path d="M12 14h.01" />
              <path d="M8 14h.01" />
              <path d="M12 18h.01" />
              <path d="M8 18h.01" />
            </svg>
            Rainwater Calculator
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Reports &amp; Export
          </NavLink>

          <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            About &amp; Methodology
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={onResetData}
            >
              Reset to Demo Data
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px', color: '#ffb4a2', borderColor: 'rgba(255,255,255,0.2)' }}
              onClick={onClearData}
            >
              Clear All Data
            </button>
          </div>
          <p>Purulia District, West Bengal</p>
          <p>Student Prototype &bull; Local-first</p>
        </div>
      </aside>
    </>
  );
};
