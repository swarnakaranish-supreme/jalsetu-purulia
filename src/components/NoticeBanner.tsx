import React from 'react';

interface NoticeBannerProps {
  isSimulated: boolean;
  customMessage?: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ isSimulated, customMessage }) => {
  if (!isSimulated && !customMessage) return null;

  return (
    <div className="notice" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <svg
        style={{ width: '20px', height: '20px', flexShrink: 0, color: 'var(--color-warning)' }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>
        <strong>Demonstration notice: </strong>
        {customMessage ||
          'Demonstration dataset — values are simulated and are not field measurements. Do not cite as actual district water metrics or verified asset counts.'}
      </div>
    </div>
  );
};
