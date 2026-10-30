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
          <h1>About JalSetu Purulia &amp; Scientific Methodology</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Regional water-security context, hard-rock hydrogeology, research verification, references, and system limitations.
          </p>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: '960px' }}>
        <NoticeBanner isSimulated={isSimulated} />

        {/* SECTION 1: REGIONAL WATER SECURITY THEMES */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>
            1. Regional Water-Security Context &bull; Purulia &amp; The Eastern Plateau
          </h2>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Purulia district and the adjoining Eastern Plateau (encompassing western West Bengal and bordering tracts of Jharkhand and Odisha)
            represent a unique socio-ecological landscape where abundant natural resources coexist with acute seasonal water vulnerability.
          </p>

          {/* Theme A */}
          <div style={{ background: '#fcfcfc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
              A. The Development Paradox: Resource Wealth vs Seasonal Scarcity
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
              The Eastern Plateau contains rich mineral deposits, dense sal and mixed dry-deciduous forests, vibrant biodiversity,
              and culturally rich communities historically reliant on agriculture and forest produce.
              Nevertheless, the region experiences acute seasonal water stress. Water planning cannot treat water solely as an industrial or domestic commodity:
              it must holistically balance <strong>household drinking security</strong>, <strong>rainfed agrarian livelihoods</strong>, <strong>livestock sustenance</strong>, <strong>local enterprise</strong>, and <strong>vital ecological streamflows</strong>.
            </p>
          </div>

          {/* Theme B */}
          <div style={{ background: '#fcfcfc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
              B. Seasonal Rainfall Concentration &amp; Rapid Runoff
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
              Water insecurity in Purulia is not due to a total absence of rain. The district receives an annual normal precipitation of
              <strong> 1,100 to 1,300 mm</strong>. However, over <strong>80% of this rain falls within 40 to 50 monsoon days</strong> (mid-June to September).
              Due to undulating topography, steep upper slopes, and an impermeable crystalline hard-rock basement (granite-gneiss),
              precipitation generates high-velocity surface runoff that quickly discharges into rainfed rivers (Kangsabati, Kumari, Subarnarekha tributaries, and Dwarakeswar),
              leaving little natural retention. During the dry pre-monsoon summer (March–June), high temperatures (often exceeding 42°C–45°C)
              drive potential evapotranspiration (PET) to 1,400–1,600 mm/year, rapidly evaporating shallow open waters and drying up dug wells.
            </p>
          </div>

          {/* Theme C */}
          <div style={{ background: '#fcfcfc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
              C. Agricultural Vulnerability &amp; Rainfed Cropping
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
              Agriculture is predominantly monocropped Aman (Kharif) paddy dependent on monsoon timing.
              When monsoon dry spells exceed 15–20 days during crucial flowering or tillering phases, rainfed yields decline sharply.
              In extreme meteorological drought anomalies (such as 2010), localized crop losses were reported to reach up to 60–65% in un-irrigated uplands.
              Providing decentralized supplementary irrigation through farm ponds (hapas) and renovated bandhs acts as a vital risk-mitigation buffer,
              enabling farmers to harvest their Kharif paddy and cultivate a low-water winter (Rabi) crop of mustard or gram.
            </p>
          </div>

          {/* Theme D */}
          <div style={{ background: '#fcfcfc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
              D. Infrastructure Maintenance: The Restoration-First Imperative
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
              Over decades, state departments and local communities constructed thousands of traditional water-harvesting structures
              (including <em>bandhs</em>, <em>hapas</em>, village tanks, check dams, and river-lift irrigation schemes).
              A major bottleneck today is not a lack of structures, but <strong>severe siltation, breached earthen bunds, choked inlets, and unmaintained sluices</strong>.
              JalSetu establishes a <strong>Restoration-First Principle</strong>: desilting and repairing an existing traditional water body typically costs
              ₹35,000 to ₹2,50,000, avoids land acquisition conflict, restores established micro-catchments, and activates immediate storage volume
              at a fraction of the capital cost of constructing new structures.
            </p>
          </div>

          {/* Theme E */}
          <div style={{ background: '#fcfcfc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
              E. Hard-Rock Hydrogeology &amp; Water-Quality Realities
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
              Purulia’s geology is dominated by the Chhotanagpur Gneissic Complex (Archaean crystalline granite-gneiss and schists),
              mantled by weathered laterite in upland ridges and thin alluvium along river valleys.
              In hard-rock formations, groundwater occurs in two distinct zones:
            </p>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.4rem 0' }}>
              <li><strong>Weathered Mantle (Shallow Aquifer, 5–15 m): </strong> Tapped by traditional open dug wells. Recharged directly by local rainfall and percolation tanks, but prone to summer desiccation.</li>
              <li><strong>Fractured Bedrock (Deep Aquifer, 20–100+ m): </strong> Secondary fracture and joint networks tapped by borewells. Discontinuous, highly localized, and variable over tens of metres.</li>
            </ul>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
              <strong>Recharge vs Storage Distinction: </strong> In massive unweathered crystalline rock or heavy clay, downward infiltration is nearly zero.
              Constructing deep recharge shafts in massive hard rock without geophysical resistivity confirmation will fail.
              Furthermore, deep borewells in specific blocks (such as Arsha, Jhalda, Balarampur) exhibit endemic geogenic <strong>fluoride contamination</strong> (exceeding BIS 1.5 mg/L limits).
              Rooftop rainwater harvesting provides an essential, fluoride-free drinking water buffer.
            </p>
          </div>

          {/* Theme F */}
          <div style={{ background: '#fcfcfc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
              F. Distribution, Gender Equity &amp; Community Participation
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
              Infrastructure availability alone does not guarantee water security.
              During summer dry spells, rural women and adolescent girls bear a heavy burden of head-loading water from distant functional borewells.
              Equitable water security requires active community governance: <strong>Gram Sabhas</strong>, <strong>Pani Panchayats (Water User Associations)</strong>,
              and <strong>Women’s Self-Help Groups (SHGs)</strong> must participate in site selection, operation and maintenance (O&amp;M),
              and transparent seasonal water budgeting.
            </p>
          </div>

          {/* Theme G */}
          <div style={{ background: '#fcfcfc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
              G. Integrated Ridge-to-Valley Water Security
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
              Sustainable planning requires an integrated watershed approach:
              <strong> Ridge conservation</strong> (staggered contour trenching, afforestation, gully plugs under USHARMUKTI) slows runoff and traps silt;
              <strong> middle-slope storage</strong> (farm ponds, check dams) supplies irrigation;
              and <strong>settlement-level capture</strong> (rooftop rainwater harvesting with filters) safeguards domestic drinking water quality.
            </p>
          </div>

          {/* Theme H */}
          <div style={{ background: '#fcfcfc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
              H. The Role of JalSetu: Practical Decision Support
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
              JalSetu is designed as a local-first, evidence-aware decision-support tool for local authorities, panchayat engineers,
              student researchers, and watershed committees.
              It systematically organizes available field evidence, audits maintenance backlogs, evaluates 10 candidate conservation measures,
              and calculates transparent rainwater runoff.
              <strong> JalSetu does not replace professional hydrogeological field investigations, civil engineering DPRs, or statutory government sanctions.</strong>
            </p>
          </div>
        </div>

        {/* SECTION 2: RESEARCH SOURCES & FACTUAL VERIFICATION */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>
            2. Verified Research Sources &amp; Fact-Checking Notes
          </h2>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            JalSetu Purulia grounds its domain logic in official government publications, peer-reviewed hydrogeological literature,
            and recognized technical standards. Below are authentic citations and specific fact-checking analyses of regional research claims.
          </p>

          <div style={{ background: 'var(--color-sand)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <h4 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>Official Technical References:</h4>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.65 }}>
              <li>
                <strong>Central Ground Water Board (CGWB), Ministry of Jal Shakti, Government of India (2022): </strong>
                <em>Report on National Aquifer Mapping &amp; Management Plan in Purulia District, West Bengal.</em>{' '}
                <a href="https://cgwb.gov.in/cgwbpnm/public/publication-detail/1092" target="_blank" rel="noopener noreferrer">
                  CGWB Publication Record 1092
                </a>{' '}|{' '}
                <a href="https://www.cgwb.gov.in/old_website/AQM/NAQUIM_REPORT/WEST-BENGAL/Purulia%20Final%20West%20Bengal.pdf" target="_blank" rel="noopener noreferrer">
                  Full Report PDF (Archive)
                </a>
                <br /><small style={{ color: '#666' }}>Supports: Hard-rock hydrogeology, granite-gneiss fracture patterns, weathered mantle depth, and block-wise groundwater draft estimates.</small>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <strong>Central Ground Water Board (CGWB), Ministry of Jal Shakti, Government of India (2024): </strong>
                <em>Aquifer Management Plan for Seven Northern Blocks of Purulia District, West Bengal.</em>{' '}
                <a href="https://cgwb.gov.in/cgwbpnm/publication-detail/1568" target="_blank" rel="noopener noreferrer">
                  CGWB Publication Record 1568
                </a>
                <br /><small style={{ color: '#666' }}>Supports: Identification of water-stressed micro-watersheds, localized fluoride and poor-quality zones, and managed artificial recharge suitability.</small>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <strong>Central Public Works Department (CPWD), Government of India: </strong>
                <em>Rain Water Harvesting &amp; Conservation Manual.</em>{' '}
                <a href="https://cpheeo.gov.in/upload/uploadfiles/files/Rainwater%20Harvesting%20Manual-CPWD.pdf" target="_blank" rel="noopener noreferrer">
                  CPWD Manual PDF
                </a>
                <br /><small style={{ color: '#666' }}>Supports: Mathematical sizing formula ($V = P \times A \times C$), first-flush diversion depth (1–2 mm), dual-stage sand-gravel filter sizing, and storage tank civil dimensions.</small>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <strong>Ministry of Jal Shakti &amp; National Water Mission: </strong>
                <em>Jal Shakti Abhiyan — Catch the Rain Knowledge Resources.</em>{' '}
                <a href="https://jsactr.mowr.gov.in/Public_Dash/KnowledgeCentre.aspx" target="_blank" rel="noopener noreferrer">
                  JSA Catch the Rain Knowledge Centre
                </a>
                <br /><small style={{ color: '#666' }}>Supports: Catchment preservation, enumeration and geo-tagging of water bodies, and traditional pond rejuvenation before new construction.</small>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <strong>West Bengal Pollution Control Board (WB PCB): </strong>
                <em>Rainwater Harvesting Guidance Document.</em>{' '}
                <a href="https://www.wbpcb.gov.in/writereaddata/files/RWH.pdf" target="_blank" rel="noopener noreferrer">
                  WB PCB RWH Guidance PDF
                </a>
                <br /><small style={{ color: '#666' }}>Supports: Rooftop collection layouts, pre-treatment filtration, institutional storage norms, and groundwater contamination avoidance rules.</small>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <strong>India Meteorological Department (IMD), Ministry of Earth Sciences: </strong>
                <em>District Climate Profile &amp; Rainfall Statistics for Purulia District.</em>
                <br /><small style={{ color: '#666' }}>Supports: 30-year normal rainfall statistics (~1,240 mm), 40–50 rainy days, and seasonal monsoon distribution.</small>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <strong>Water Resources Investigation &amp; Development Department (WRIDD), Government of West Bengal: </strong>
                <em>Operational Guidelines for Jal Dharo-Jal Bharo Scheme and Minor Surface Water Irrigation.</em>
                <br /><small style={{ color: '#666' }}>Supports: Re-excavation of village tanks, check dam engineering norms, and minor irrigation command areas.</small>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <strong>Panchayats &amp; Rural Development Department, Government of West Bengal: </strong>
                <em>USHARMUKTI Watershed Development Mission Guidelines (Western Plateau Region).</em>
                <br /><small style={{ color: '#666' }}>Supports: Ridge-to-valley conservation, staggered contour trenching, 30-40 farm pond models, and MGNREGS convergence.</small>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <strong>Bureau of Indian Standards (BIS): </strong>
                <em>IS 10500:2012 Drinking Water — Specification (Second Revision).</em>
                <br /><small style={{ color: '#666' }}>Supports: Threshold parameters for pH (6.5–8.5), TDS (≤500 mg/L), Turbidity (≤1 NTU), Fluoride (≤1.0 mg/L), Iron (≤1.0 mg/L), and Coliform (0 in 100 ml).</small>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <strong>Census of India (2011): </strong>
                <em>District Census Handbook — Purulia.</em>
                <br /><small style={{ color: '#666' }}>Supports: Demographic context, rural household drinking water sources, and agrarian employment share.</small>
              </li>
            </ul>
          </div>

          <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
            Critical Evaluation of Supplied Research Claims:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ background: '#f9f9f9', borderLeft: '3px solid var(--color-teal)', padding: '8px 12px', borderRadius: '4px' }}>
              <strong>Claim 1: "Agricultural losses reach up to 65% in Purulia."</strong>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                <em>Verification Finding:</em> This figure represents <strong>severe historical meteorological drought anomalies</strong>
                (specifically documented during the 2010 severe drought by state agriculture assessments), where early monsoon cessation caused up to 65% loss in un-irrigated upland paddy.
                It is NOT a static annual loss figure. In normal monsoon seasons, Aman paddy production is substantial. JalSetu models this as a seasonal risk factor rather than a constant baseline.
              </p>
            </div>

            <div style={{ background: '#f9f9f9', borderLeft: '3px solid var(--color-teal)', padding: '8px 12px', borderRadius: '4px' }}>
              <strong>Claim 2: "Summer temperatures exceed 48°C–50°C."</strong>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                <em>Verification Finding:</em> IMD official observatories in Purulia record regular peak pre-monsoon summer maxima of <strong>42°C to 45°C</strong> (with occasional heatwave peaks up to 46°C–47°C).
                While 50°C is an anecdotal extreme, the critical physical consequence is that <strong>potential evapotranspiration (PET) exceeds 1,400 mm/year</strong>,
                causing rapid evaporation from shallow open water bodies (losing 5–8 mm of depth per hot summer day).
              </p>
            </div>

            <div style={{ background: '#f9f9f9', borderLeft: '3px solid var(--color-teal)', padding: '8px 12px', borderRadius: '4px' }}>
              <strong>Claim 3: "Rainfed rivers and streams completely dry up."</strong>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                <em>Verification Finding:</em> Upper reaches of the Kangsabati (Kasai), Kumari, and Dwarakeswar rivers in Purulia are indeed ephemeral to intermittent.
                Because the crystalline bedrock has low primary porosity, groundwater baseflow discharge into streams is minimal after winter.
                Streams experience rapid flash surges during monsoon downpours followed by negligible dry-season baseflow unless supported by upstream watershed conservation.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: SYSTEM ARCHITECTURE & PRIVACY */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>
            3. Local-First Architecture &amp; Data Integrity
          </h2>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            JalSetu Purulia is built as a <strong>local-first web application</strong> running in the user’s browser.
            Key architectural design choices:
          </p>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <li><strong>Zero Server Dependency: </strong> Persists all asset records, assessments, and observations in browser <code>localStorage</code>. Operates in remote village locations without internet connectivity or paid database subscriptions.</li>
            <li><strong>Complete Data Privacy: </strong> Household locations, community water data, and field notes are never transmitted to external cloud servers or commercial third parties.</li>
            <li><strong>Interoperable Export &amp; Backup: </strong> Full database export and import via standard JSON, plus structured CSV exports for assets, candidate sites, observations, and maintenance logs.</li>
            <li><strong>ESP32 Hardware Readiness: </strong> Supports serial CSV data from ultrasonic water-depth sensors (e.g. JSN-SR04T / HC-SR04) with strict range validation and offline fallback.</li>
          </ul>
        </div>

        {/* SECTION 4: SCOPE & HONEST DISCLAIMERS */}
        <div className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', color: 'var(--color-danger)' }}>
            4. Scope &amp; Explicit Non-Claims
          </h2>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
            <li>We do <strong>NOT</strong> claim this software has been officially adopted, sanctioned, or certified by the Government of West Bengal or the Ministry of Jal Shakti.</li>
            <li>We do <strong>NOT</strong> claim that theoretical runoff calculations represent measured groundwater recharge. Surface capture in a tank does not recharge deep aquifers.</li>
            <li>We do <strong>NOT</strong> claim raw collected rainwater or field-tested water is safe to drink without accredited laboratory verification, filtration, and appropriate disinfection.</li>
            <li>We do <strong>NOT</strong> use artificial machine-learning "black-box" models to dictate civil engineering decisions. All screening rules are transparent, documented heuristics that require field engineering verification.</li>
            <li>We do <strong>NOT</strong> infer tribal status, caste, household income, or vulnerability from geographic names or village coordinates.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
