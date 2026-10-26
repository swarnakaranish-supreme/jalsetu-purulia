import React from 'react';
import { NoticeBanner } from '../components/NoticeBanner';

interface AboutPageProps {
  isSimulated: boolean;
}

export const AboutPage: React.FC<AboutPageProps> = ({ isSimulated }) => {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>About JalSetu Purulia &amp; Methodology</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Background, regional hydrogeology, reference sources, and technical limitations.
          </p>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: '900px' }}>
        <NoticeBanner isSimulated={isSimulated} />

        {/* Section 1: Problem Background */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>
            1. The Local Hydrogeological Problem in Purulia
          </h2>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Purulia district in western West Bengal is characterized by undulating topography, shallow weathered mantles,
            and an underlying crystalline hard-rock basement (primarily granite-gneiss).
            Although the district receives reasonable annual monsoon precipitation (~1,100 to 1,300 mm),
            most of it falls within 40 to 50 rainy days.
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Due to steep slopes and low natural infiltration capacity of unweathered crystalline bedrock,
            surface runoff is rapid, causing flash streams that dry up shortly after the monsoon.
            During pre-monsoon summer months (March–June), shallow wells dry up, triggering severe drinking and agricultural water distress.
          </p>
        </div>

        {/* Section 2: Why This Workflow? */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>
            2. What Makes JalSetu Purulia Different
          </h2>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Rainwater harvesting is not a new idea, and government departments have constructed thousands of structures
            across the district over decades. The core bottleneck is not a lack of construction ideas, but:
          </p>
          <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            <li>
              <strong>Lack of asset tracking: </strong> Thousands of existing structures exist without condition or siltation records.
            </li>
            <li>
              <strong>Bias toward new construction: </strong> New excavation is often proposed when desilting an existing village bandh or pond would yield equivalent storage at a fraction of the cost.
            </li>
            <li>
              <strong>Missing maintenance feedback: </strong> Leaf clogs in rooftop filters, breached bunds, and silt build-up are not followed up until structures fail completely.
            </li>
            <li>
              <strong>Confusion of terms: </strong> Surface tank storage is often conflated with deep aquifer recharge.
            </li>
          </ul>
        </div>

        {/* Section 3: Reference Documentation */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>
            3. Official Reference Context (CGWB 2022)
          </h2>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Our background research is grounded in the published findings of the Central Ground Water Board (CGWB):
          </p>
          <div style={{ background: 'var(--color-sand)', padding: '1rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            <p><strong>Publication: </strong> Central Ground Water Board (CGWB), Ministry of Jal Shakti, Government of India</p>
            <p><strong>Report: </strong> <em>Report on National Aquifer Mapping &amp; Management Plan in Purulia District, West Bengal (2022)</em></p>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>Official CGWB Publication Record: </strong>{' '}
              <a href="https://cgwb.gov.in/cgwbpnm/public/publication-detail/1092" target="_blank" rel="noopener noreferrer">
                https://cgwb.gov.in/cgwbpnm/public/publication-detail/1092
              </a>
            </p>
            <p>
              <strong>Official CGWB Report PDF: </strong>{' '}
              <a href="https://www.cgwb.gov.in/old_website/AQM/NAQUIM_REPORT/WEST-BENGAL/Purulia%20Final%20West%20Bengal.pdf" target="_blank" rel="noopener noreferrer">
                Purulia Final West Bengal (CGWB Archive)
              </a>
            </p>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Note: Structure numbers and cost projections in the 2022 CGWB report are historical regional planning estimates,
            not a live inventory of currently unbuilt assets. Actual implementation requires current local field inspection.
          </p>
        </div>

        {/* Section 4: Architecture & Hardware */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>
            4. Architecture &amp; ESP32 Hardware Integration
          </h2>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            JalSetu Purulia uses a <strong>local-first web application</strong> that works completely offline in field settings
            without requiring paid cloud databases or API keys.
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            For storage monitoring, a sample ESP32 firmware prototype is included in the project repository (`firmware/jalsetu_esp32_sensor.ino`).
            It interfaces with an HC-SR04 ultrasonic depth sensor or JSN-SR04T waterproof sensor, runs range plausibility checks,
            outputs clean CSV serial data, and has a safe offline fallback when Wi-Fi is unavailable in remote villages.
          </p>
        </div>

        {/* Section 5: Safety & Honest Scope */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>
            5. What We Do NOT Claim
          </h2>
          <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <li>We do NOT claim this software has been officially adopted by any government department.</li>
            <li>We do NOT claim that our software calculations guarantee groundwater recharge.</li>
            <li>We do NOT claim raw collected rainwater is safe for drinking without appropriate boiling, filtration, or disinfection.</li>
            <li>We do NOT claim artificial intelligence or machine learning is making civil engineering decisions. All screening rules are documented, rule-based heuristics that need validation by local water engineers.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
