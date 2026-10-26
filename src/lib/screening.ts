/* ============================================================
   JalSetu Purulia — Site Screening Logic
   
   IMPORTANT: This is a PROVISIONAL demonstration scoring system.
   The weights and rules are initial reasonable estimates that
   MUST be validated by local water-resource experts before
   use in any real planning decision.
   
   See docs/site-selection-method.md for full documentation.
   ============================================================ */

import type { SiteAssessment, ScreeningResult, ScreeningFactor } from '../types';

/**
 * Evaluate a site assessment and produce a transparent screening result.
 * 
 * If critical baseline parameters (catchment area, slope, geology/soil,
 * land permission, or water demand) are missing, the assessment is marked
 * as 'Insufficient information for assessment' to prevent treating an
 * incomplete record as an inherently poor or failed site.
 */
export function screenSite(site: SiteAssessment): ScreeningResult {
  const factors: ScreeningFactor[] = [];
  const missingData: string[] = [];
  const criticalMissing: string[] = [];
  const warnings: string[] = [];

  // Factor 1: Catchment area potential (Critical)
  const catchmentFactor = scoreCatchmentArea(site, missingData, criticalMissing);
  factors.push(catchmentFactor);

  // Factor 2: Slope suitability (Critical)
  const slopeFactor = scoreSlopeSuitability(site, missingData, criticalMissing);
  factors.push(slopeFactor);

  // Factor 3: Soil and geology (Critical)
  const soilGeologyFactor = scoreSoilGeology(site, missingData, criticalMissing);
  factors.push(soilGeologyFactor);

  // Factor 4: Existing structure condition (Supporting)
  const existingStructureFactor = scoreExistingStructure(site, missingData);
  factors.push(existingStructureFactor);

  // Factor 5: Water demand (Critical)
  const waterDemandFactor = scoreWaterDemand(site, missingData, criticalMissing);
  factors.push(waterDemandFactor);

  // Factor 6: Land availability (Critical)
  const landFactor = scoreLandAvailability(site, missingData, criticalMissing);
  factors.push(landFactor);

  // Factor 7: Access and maintenance feasibility (Supporting)
  const accessFactor = scoreAccessFeasibility(site, missingData);
  factors.push(accessFactor);

  // Factor 8: Data quality / evidence availability (Supporting)
  const dataQualityFactor = scoreDataQuality(site, missingData);
  factors.push(dataQualityFactor);

  // Calculate totals
  const totalScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const maxPossibleScore = factors.reduce((sum, f) => sum + f.maxScore * f.weight, 0);
  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  const isInsufficient = criticalMissing.length > 0;

  // Determine recommendation
  let recommendation: string;
  if (isInsufficient) {
    recommendation = `Insufficient information for assessment. The following critical parameters are unrecorded: ${criticalMissing.join(
      ', '
    )}. Complete field measurements for these parameters before evaluating site feasibility. Do not interpret a low score under incomplete data as poor site quality.`;
    warnings.push(
      `Critical baseline information is missing (${criticalMissing.length} critical factors). A low numerical score must not be cited as a reliable indication of poor site quality.`
    );
  } else if (percentage >= 70) {
    recommendation =
      'This candidate site has sufficient baseline data and shows favourable preliminary characteristics for further technical evaluation by a qualified water-resources engineer. This is an initial screening result, not a construction recommendation.';
  } else if (percentage >= 40) {
    recommendation =
      'This site has recorded baseline parameters but exhibits moderate constraints (e.g. soil limitations, slope challenges, or high siltation). Review the factor breakdown and resolve specific constraints before investment.';
  } else {
    recommendation =
      'This site has recorded baseline parameters but exhibits severe site constraints (e.g. disputed land status or steep erosion-prone slope). Consider alternative locations or major structural mitigation.';
  }

  warnings.push(
    'This screening score is a provisional demonstration heuristic. Final site selection requires local field verification, hydrogeological survey, and statutory technical approval.'
  );

  return {
    siteId: site.id,
    totalScore: Math.round(totalScore * 10) / 10,
    maxPossibleScore: Math.round(maxPossibleScore * 10) / 10,
    percentage,
    isInsufficient,
    criticalMissing,
    factors,
    missingData,
    recommendation,
    warnings,
  };
}

/* ---------- Individual Scoring Functions ---------- */

function scoreCatchmentArea(
  site: SiteAssessment,
  missingData: string[],
  criticalMissing: string[]
): ScreeningFactor {
  const weight = 0.15;
  const isCritical = true;
  const screeningImpact =
    'Determines the total theoretical volume of harvestable surface runoff. Without catchment area measurements, storage structure sizing, cost-benefit ratios, and seasonal yield cannot be calculated.';

  if (site.catchmentAreaSqm === null || site.catchmentAreaSqm <= 0) {
    missingData.push('Catchment area not specified');
    criticalMissing.push('Catchment area');
    return {
      name: 'Catchment Area Potential',
      score: 0,
      maxScore: 10,
      weight,
      reasoning: 'No catchment area data provided. Critical for calculating harvestable yield.',
      dataAvailable: false,
      isCritical,
      screeningImpact,
    };
  }

  let score = 0;
  let reasoning = '';
  const area = site.catchmentAreaSqm;
  if (area >= 500) {
    score = 9;
    reasoning = `Large catchment area (${area} m²) — high runoff collection potential`;
  } else if (area >= 200) {
    score = 7;
    reasoning = `Moderate catchment area (${area} m²) — viable for medium storage structures`;
  } else if (area >= 50) {
    score = 5;
    reasoning = `Small catchment area (${area} m²) — limited collection potential`;
  } else {
    score = 3;
    reasoning = `Very small catchment area (${area} m²) — may not justify infrastructure investment`;
  }

  if (site.siteType === 'rooftop') {
    score = Math.min(10, score + 1);
    reasoning += '. Rooftop surfaces typically have higher runoff coefficients (0.80–0.85) than ground surfaces.';
  }

  return {
    name: 'Catchment Area Potential',
    score,
    maxScore: 10,
    weight,
    reasoning,
    dataAvailable: true,
    isCritical,
    screeningImpact,
  };
}

function scoreSlopeSuitability(
  site: SiteAssessment,
  missingData: string[],
  criticalMissing: string[]
): ScreeningFactor {
  const weight = 0.10;
  const isCritical = true;
  const screeningImpact =
    'Controls runoff flow velocity, sediment deposition, and erosion hazard. Flat to gentle slopes allow controlled interception, whereas steep slopes increase structural breach risks and rapid siltation.';

  if (site.slopeCategory === 'unknown') {
    missingData.push('Slope category not specified');
    criticalMissing.push('Slope category');
    return {
      name: 'Slope Suitability',
      score: 0,
      maxScore: 10,
      weight,
      reasoning: 'No slope information provided. Critical for assessing hydraulic velocity and erosion risk.',
      dataAvailable: false,
      isCritical,
      screeningImpact,
    };
  }

  let score = 0;
  let reasoning = '';
  switch (site.slopeCategory) {
    case 'flat':
      score = 8;
      reasoning = 'Flat terrain (< 2%) — good for surface storage and percolation, but verify drainage clearance.';
      break;
    case 'gentle':
      score = 9;
      reasoning = 'Gentle slope (2% – 5%) — ideal for runoff interception, gravity drainage, and controlled velocity.';
      break;
    case 'moderate':
      score = 6;
      reasoning = 'Moderate slope (5% – 10%) — viable with check barriers and energy dissipators; higher runoff velocity.';
      break;
    case 'steep':
      score = 3;
      reasoning = 'Steep slope (> 10%) — high erosion hazard and risk of embankment breach; unsuited for unlined retention.';
      break;
  }

  return {
    name: 'Slope Suitability',
    score,
    maxScore: 10,
    weight,
    reasoning,
    dataAvailable: true,
    isCritical,
    screeningImpact,
  };
}

function scoreSoilGeology(
  site: SiteAssessment,
  missingData: string[],
  criticalMissing: string[]
): ScreeningFactor {
  const weight = 0.15;
  const isCritical = true;
  const screeningImpact =
    'Governs sub-surface infiltration and permeability. In Purulia, unweathered granite-gneiss hard rock blocks downward recharge, whereas weathered laterite mantles enable natural percolation. Mandatory to avoid building recharge shafts in impermeable bedrock.';

  const hasGeology = site.geologyInfo && site.geologyInfo.trim().length > 0;
  const hasSoil = site.soilType !== 'unknown';

  if (!hasSoil && !hasGeology) {
    missingData.push('Soil type and geology information not specified');
    criticalMissing.push('Soil / Geology information');
    return {
      name: 'Soil & Geology',
      score: 0,
      maxScore: 10,
      weight,
      reasoning: 'No soil or geology data provided. Critical to determine whether structure should retain surface water or attempt recharge.',
      dataAvailable: false,
      isCritical,
      screeningImpact,
    };
  }

  let score = 5;
  let reasoning = '';
  switch (site.soilType) {
    case 'alluvial':
      score = 8;
      reasoning = 'Alluvial soil — generally good permeability for infiltration and storage.';
      break;
    case 'sandy':
      score = 7;
      reasoning = 'Sandy soil — high permeability, good for groundwater infiltration but poor for unlined surface pond retention.';
      break;
    case 'laterite':
      score = 6;
      reasoning = 'Laterite — common in Purulia uplands. Weathered laterite zones permit moderate infiltration.';
      break;
    case 'red_soil':
      score = 6;
      reasoning = 'Red soil / mixed loam — moderate infiltration characteristics typical of western Bengal uplands.';
      break;
    case 'mixed':
      score = 5;
      reasoning = 'Mixed soil — variable permeability; site-specific pit test recommended.';
      break;
    case 'clay':
      score = 3;
      reasoning = 'Clay soil — very low permeability; poor for percolation structures, but suitable for surface ponds with minimal seepage.';
      break;
    case 'rocky':
      score = 4;
      reasoning = 'Rocky terrain — massive hard rock basement impedes natural infiltration without deep secondary fracturing.';
      break;
    case 'unknown':
      score = 4;
      reasoning = 'Specific soil type unrecorded, but geological field notes were supplied.';
      break;
  }

  if (hasGeology) {
    reasoning += `. Geology note: "${site.geologyInfo}".`;
  }

  return {
    name: 'Soil & Geology',
    score,
    maxScore: 10,
    weight,
    reasoning,
    dataAvailable: true,
    isCritical,
    screeningImpact,
  };
}

function scoreExistingStructure(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.15;
  const isCritical = false;
  const screeningImpact =
    'Restoration-First Principle: Evaluates whether repairing an existing village tank, bandh, or rooftop downpipe can provide immediate water storage at lower cost and with established community acceptance compared to new excavation.';

  if (!site.existingStructure || !site.existingStructure.trim()) {
    return {
      name: 'Existing Structure Condition',
      score: 5,
      maxScore: 10,
      weight,
      reasoning: 'No pre-existing water structure reported. A new intervention would be required.',
      dataAvailable: true,
      isCritical,
      screeningImpact,
    };
  }

  let score = 0;
  let reasoning = '';
  switch (site.existingStructureCondition) {
    case 'good':
      score = 8;
      reasoning = `Pre-existing structure "${site.existingStructure}" is in good condition. Minor maintenance or capacity augmentation is likely sufficient before considering new construction.`;
      break;
    case 'fair':
      score = 7;
      reasoning = `Pre-existing structure "${site.existingStructure}" is in fair condition. Rehabilitation and desilting is prioritized over new excavation.`;
      break;
    case 'poor':
      score = 5;
      reasoning = `Pre-existing structure "${site.existingStructure}" is in poor condition (breached or heavily silted). Engineering review needed to compare restoration cost versus replacement.`;
      break;
    case 'non_functional':
      score = 4;
      reasoning = `Pre-existing structure "${site.existingStructure}" is non-functional or abandoned. Complete reconstruction or alternative siting may be warranted.`;
      break;
    case 'unknown':
      score = 3;
      reasoning = `Pre-existing structure "${site.existingStructure}" exists but its physical condition is unassessed. Field inspection required.`;
      missingData.push('Condition of existing structure not assessed');
      break;
  }

  return {
    name: 'Existing Structure Condition',
    score,
    maxScore: 10,
    weight,
    reasoning,
    dataAvailable: true,
    isCritical,
    screeningImpact,
  };
}

function scoreWaterDemand(
  site: SiteAssessment,
  missingData: string[],
  criticalMissing: string[]
): ScreeningFactor {
  const weight = 0.10;
  const isCritical = true;
  const screeningImpact =
    'Confirms an identifiable community, domestic, or agricultural beneficiary group. Water harvesting infrastructure installed without clear user demand often suffers from lack of routine maintenance and eventual abandonment.';

  if (!site.waterDemand || !site.waterDemand.trim()) {
    missingData.push('Water demand or intended use not specified');
    criticalMissing.push('Water demand / intended use');
    return {
      name: 'Water Demand / Intended Use',
      score: 0,
      maxScore: 10,
      weight,
      reasoning: 'No water demand or intended beneficiary group documented. Essential for viability and community ownership.',
      dataAvailable: false,
      isCritical,
      screeningImpact,
    };
  }

  return {
    name: 'Water Demand / Intended Use',
    score: 7,
    maxScore: 10,
    weight,
    reasoning: `Documented demand: "${site.waterDemand}". Qualitative indication of community utility recorded.`,
    dataAvailable: true,
    isCritical,
    screeningImpact,
  };
}

function scoreLandAvailability(
  site: SiteAssessment,
  missingData: string[],
  criticalMissing: string[]
): ScreeningFactor {
  const weight = 0.15;
  const isCritical = true;
  const screeningImpact =
    'Determines statutory feasibility and community access. Interventions proposed on unpermitted private or disputed land cannot proceed without legal friction or conflict. Public or consensus community land ensures sustained access.';

  if (site.ownershipStatus === 'unknown') {
    missingData.push('Land ownership and permission status not verified');
    criticalMissing.push('Land ownership / permission status');
    return {
      name: 'Land Ownership & Permission',
      score: 0,
      maxScore: 10,
      weight,
      reasoning: 'Land ownership status is unverified. Critical baseline parameter to ensure access and prevent legal disputes.',
      dataAvailable: false,
      isCritical,
      screeningImpact,
    };
  }

  let score = 0;
  let reasoning = '';
  switch (site.ownershipStatus) {
    case 'government':
      score = 8;
      reasoning = 'Government / Panchayat land — permissions obtainable through standard block administrative channels.';
      break;
    case 'community':
      score = 7;
      reasoning = 'Community / common land — viable with formal Gram Sabha / Water User Association resolution.';
      break;
    case 'private_with_permission':
      score = 6;
      reasoning = 'Private land with documented owner consent — verify written agreement for community maintenance access.';
      break;
    case 'private_no_permission':
      score = 1;
      reasoning = 'Private land without owner permission — cannot proceed without documented consent.';
      break;
    case 'disputed':
      score = 1;
      reasoning = 'Disputed ownership / active litigation — intervention cannot proceed until title is cleared.';
      break;
  }

  return {
    name: 'Land Ownership & Permission',
    score,
    maxScore: 10,
    weight,
    reasoning,
    dataAvailable: true,
    isCritical,
    screeningImpact,
  };
}

function scoreAccessFeasibility(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.10;
  const isCritical = false;
  const screeningImpact =
    'Ensures civil contractors, desilting machinery (e.g. tractors/excavators), and inspection personnel can physically reach the site during both dry and wet seasons.';

  let score = 6;
  let reasoning = 'Baseline access feasibility estimated from recorded observations.';
  let dataAvailable = false;

  if (site.constraints && site.constraints.trim().length > 0) {
    dataAvailable = true;
    const lower = site.constraints.toLowerCase();
    if (lower.includes('access') || lower.includes('road') || lower.includes('path') || lower.includes('isolated')) {
      score = 4;
      reasoning = `Documented constraints include physical access hurdles: "${site.constraints}".`;
    } else {
      score = 6;
      reasoning = `Documented constraints noted: "${site.constraints}". No direct road barrier reported.`;
    }
  } else {
    reasoning = 'No specific access constraints or notes provided.';
    missingData.push('Site access and physical constraints not documented');
  }

  return {
    name: 'Access & Maintenance Feasibility',
    score,
    maxScore: 10,
    weight,
    reasoning,
    dataAvailable,
    isCritical,
    screeningImpact,
  };
}

function scoreDataQuality(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.10;
  const isCritical = false;
  const screeningImpact =
    'Scores empirical evidence depth (GPS coordinates, verified assessment date, data source, field constraints). Higher quality reduces planning uncertainty.';

  const checks = [
    site.catchmentAreaSqm !== null && site.catchmentAreaSqm > 0,
    site.slopeCategory !== 'unknown',
    site.soilType !== 'unknown' || (site.geologyInfo && site.geologyInfo.trim().length > 0),
    site.ownershipStatus !== 'unknown',
    !!site.waterDemand && site.waterDemand.trim().length > 0,
    !!site.existingStructure || site.siteType === 'rooftop',
    site.latitude !== null && site.longitude !== null,
    !!site.dataSource && site.dataSource !== 'Not verified / demonstration entry',
    !!site.assessmentDate,
    !!site.constraints || !!site.notes,
  ];

  const available = checks.filter(Boolean).length;
  const score = Math.round((available / checks.length) * 10);
  const reasoning = `${available} of ${checks.length} baseline verification checkpoints satisfied. Higher data depth increases screening reliability.`;

  if (available < 5) {
    missingData.push('Overall data quality is low — multiple verification fields are unrecorded');
  }

  return {
    name: 'Data Quality & Evidence',
    score,
    maxScore: 10,
    weight,
    reasoning,
    dataAvailable: true,
    isCritical,
    screeningImpact,
  };
}
