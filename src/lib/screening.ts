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
 * Each factor scores 0–10 and has a weight (0–1).
 * Missing data reduces the maximum achievable score.
 * The system can return "insufficient information" when too much data is missing.
 */
export function screenSite(site: SiteAssessment): ScreeningResult {
  const factors: ScreeningFactor[] = [];
  const missingData: string[] = [];
  const warnings: string[] = [];

  // Factor 1: Catchment area potential
  factors.push(scoreCatchmentArea(site, missingData));

  // Factor 2: Slope suitability
  factors.push(scoreSlopeSuitability(site, missingData));

  // Factor 3: Soil and geology
  factors.push(scoreSoilGeology(site, missingData));

  // Factor 4: Existing structure condition
  factors.push(scoreExistingStructure(site, missingData));

  // Factor 5: Water demand
  factors.push(scoreWaterDemand(site, missingData));

  // Factor 6: Land availability
  factors.push(scoreLandAvailability(site, missingData));

  // Factor 7: Access and maintenance feasibility
  factors.push(scoreAccessFeasibility(site, missingData));

  // Factor 8: Data quality / evidence availability
  factors.push(scoreDataQuality(site, missingData));

  // Calculate totals
  const totalScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const maxPossibleScore = factors.reduce((sum, f) => sum + f.maxScore * f.weight, 0);
  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  // Count factors with data available
  const factorsWithData = factors.filter(f => f.dataAvailable).length;

  // Determine recommendation
  let recommendation: string;
  if (factorsWithData < 4) {
    recommendation = 'Insufficient information for a meaningful preliminary assessment. Collect the missing data listed below before proceeding.';
    warnings.push('More than half of the screening factors lack data. The score is unreliable.');
  } else if (percentage >= 70) {
    recommendation = 'This site may warrant further detailed assessment by a qualified person. This is a preliminary screening result, not a construction recommendation.';
  } else if (percentage >= 40) {
    recommendation = 'This site shows moderate potential but has significant gaps or constraints. Review the factor breakdown and address the listed concerns before further investment.';
  } else {
    recommendation = 'This site has substantial constraints or missing information. Consider alternative sites or address the identified issues before further assessment.';
  }

  warnings.push('This screening score is a provisional demonstration tool. Final site selection requires local field verification, geological survey, and appropriate technical approval.');

  return {
    siteId: site.id,
    totalScore: Math.round(totalScore * 10) / 10,
    maxPossibleScore: Math.round(maxPossibleScore * 10) / 10,
    percentage,
    factors,
    missingData,
    recommendation,
    warnings,
  };
}

/* ---------- Individual Scoring Functions ---------- */

function scoreCatchmentArea(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.15;
  if (site.catchmentAreaSqm === null) {
    missingData.push('Catchment area not specified');
    return { name: 'Catchment Area Potential', score: 0, maxScore: 10, weight, reasoning: 'No catchment area data provided', dataAvailable: false };
  }
  let score = 0;
  let reasoning = '';
  const area = site.catchmentAreaSqm;
  if (area >= 500) { score = 9; reasoning = `Large catchment area (${area} m²) — good runoff collection potential`; }
  else if (area >= 200) { score = 7; reasoning = `Moderate catchment area (${area} m²)`; }
  else if (area >= 50) { score = 5; reasoning = `Small catchment area (${area} m²) — limited collection potential`; }
  else { score = 3; reasoning = `Very small catchment area (${area} m²) — may not justify infrastructure cost`; }

  if (site.siteType === 'rooftop') {
    score = Math.min(10, score + 1);
    reasoning += '. Rooftop surfaces typically have higher runoff coefficients.';
  }
  return { name: 'Catchment Area Potential', score, maxScore: 10, weight, reasoning, dataAvailable: true };
}

function scoreSlopeSuitability(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.10;
  if (site.slopeCategory === 'unknown') {
    missingData.push('Slope category not specified');
    return { name: 'Slope Suitability', score: 0, maxScore: 10, weight, reasoning: 'No slope information provided', dataAvailable: false };
  }
  let score = 0;
  let reasoning = '';
  switch (site.slopeCategory) {
    case 'flat': score = 8; reasoning = 'Flat terrain — good for ponding and percolation, but verify drainage'; break;
    case 'gentle': score = 9; reasoning = 'Gentle slope — ideal for runoff collection and controlled flow'; break;
    case 'moderate': score = 6; reasoning = 'Moderate slope — suitable with appropriate engineering but higher runoff velocity'; break;
    case 'steep': score = 3; reasoning = 'Steep slope — difficult for water retention structures, high erosion risk'; break;
  }
  return { name: 'Slope Suitability', score, maxScore: 10, weight, reasoning, dataAvailable: true };
}

function scoreSoilGeology(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.15;
  if (site.soilType === 'unknown' && !site.geologyInfo) {
    missingData.push('Soil type and geology information not specified');
    return { name: 'Soil & Geology', score: 0, maxScore: 10, weight, reasoning: 'No soil or geology data provided. This is critical for percolation-based structures.', dataAvailable: false };
  }
  let score = 5; // Baseline
  let reasoning = '';
  switch (site.soilType) {
    case 'alluvial': score = 8; reasoning = 'Alluvial soil — generally good permeability for recharge'; break;
    case 'sandy': score = 7; reasoning = 'Sandy soil — high permeability, good for recharge but poor water retention'; break;
    case 'laterite': score = 6; reasoning = 'Laterite — moderate permeability, common in Purulia region. Weathered laterite may allow reasonable recharge.'; break;
    case 'red_soil': score = 6; reasoning = 'Red soil — moderate characteristics, further assessment needed'; break;
    case 'mixed': score = 5; reasoning = 'Mixed soil — variable permeability, site-specific testing recommended'; break;
    case 'clay': score = 3; reasoning = 'Clay soil — low permeability, poor for direct recharge but suitable for surface storage'; break;
    case 'rocky': score = 4; reasoning = 'Rocky terrain — limited natural percolation, may need engineering solutions'; break;
    case 'unknown': score = 0; reasoning = 'Soil type unknown'; break;
  }
  if (site.geologyInfo) {
    reasoning += `. Additional geology notes: ${site.geologyInfo}`;
    if (!score) score = 4; // At least some info available
  }
  return { name: 'Soil & Geology', score, maxScore: 10, weight, reasoning, dataAvailable: site.soilType !== 'unknown' || !!site.geologyInfo };
}

function scoreExistingStructure(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.15;
  if (!site.existingStructure) {
    return { name: 'Existing Structure', score: 5, maxScore: 10, weight, reasoning: 'No existing structure noted — a new intervention may be needed, or existing structures were not assessed', dataAvailable: true };
  }
  let score = 0;
  let reasoning = '';
  switch (site.existingStructureCondition) {
    case 'good':
      score = 8;
      reasoning = `Existing structure "${site.existingStructure}" is in good condition. Consider whether repair, augmentation, or maintenance is sufficient before new construction.`;
      break;
    case 'fair':
      score = 7;
      reasoning = `Existing structure "${site.existingStructure}" is in fair condition. Restoration may be more cost-effective than new construction.`;
      break;
    case 'poor':
      score = 5;
      reasoning = `Existing structure "${site.existingStructure}" is in poor condition. Assess whether repair is viable before considering replacement.`;
      break;
    case 'non_functional':
      score = 4;
      reasoning = `Existing structure "${site.existingStructure}" is non-functional. Major rehabilitation or replacement may be needed.`;
      break;
    case 'unknown':
      score = 3;
      reasoning = `Existing structure "${site.existingStructure}" — condition is unknown. Field inspection needed.`;
      missingData.push('Condition of existing structure not assessed');
      break;
  }
  return { name: 'Existing Structure', score, maxScore: 10, weight, reasoning, dataAvailable: true };
}

function scoreWaterDemand(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.10;
  if (!site.waterDemand) {
    missingData.push('Water demand or intended use not specified');
    return { name: 'Water Demand', score: 0, maxScore: 10, weight, reasoning: 'No water demand information provided', dataAvailable: false };
  }
  return { name: 'Water Demand', score: 7, maxScore: 10, weight, reasoning: `Water demand/use noted: "${site.waterDemand}". Quantitative demand assessment not yet implemented — this is a qualitative indicator only.`, dataAvailable: true };
}

function scoreLandAvailability(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.15;
  if (site.ownershipStatus === 'unknown') {
    missingData.push('Land ownership and permission status not verified');
    return { name: 'Land Availability', score: 0, maxScore: 10, weight, reasoning: 'Land ownership status unknown — this must be clarified before any intervention', dataAvailable: false };
  }
  let score = 0;
  let reasoning = '';
  switch (site.ownershipStatus) {
    case 'government': score = 8; reasoning = 'Government land — appropriate permissions may be obtainable through official channels'; break;
    case 'community': score = 7; reasoning = 'Community land — requires community consent and agreement'; break;
    case 'private_with_permission': score = 6; reasoning = 'Private land with owner permission — ensure documented agreement'; break;
    case 'private_no_permission': score = 1; reasoning = 'Private land without permission — cannot proceed without landowner consent'; break;
    case 'disputed': score = 1; reasoning = 'Disputed ownership — resolve ownership before any planning'; break;
  }
  return { name: 'Land Availability', score, maxScore: 10, weight, reasoning, dataAvailable: true };
}

function scoreAccessFeasibility(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.10;
  // This is a simplified assessment based on available data
  let score = 6;
  let reasoning = 'Access and maintenance feasibility assessment is based on limited available data. ';
  let dataAvailable = false;

  if (site.constraints) {
    dataAvailable = true;
    if (site.constraints.toLowerCase().includes('access') || site.constraints.toLowerCase().includes('road')) {
      score = 4;
      reasoning += `Noted constraints include access issues: "${site.constraints}".`;
    } else {
      score = 6;
      reasoning += `Constraints noted: "${site.constraints}". No specific access issues mentioned.`;
    }
  } else {
    reasoning += 'No constraints or access information provided.';
    missingData.push('Site access and constraints not documented');
  }
  return { name: 'Access & Maintenance Feasibility', score, maxScore: 10, weight, reasoning, dataAvailable };
}

function scoreDataQuality(site: SiteAssessment, missingData: string[]): ScreeningFactor {
  const weight = 0.10;
  let score = 0;
  const checks = [
    site.catchmentAreaSqm !== null,
    site.slopeCategory !== 'unknown',
    site.soilType !== 'unknown',
    site.ownershipStatus !== 'unknown',
    !!site.waterDemand,
    !!site.existingStructure || site.siteType === 'rooftop',
    site.latitude !== null && site.longitude !== null,
    !!site.dataSource,
    !!site.assessmentDate,
    !!site.constraints || !!site.notes,
  ];
  const available = checks.filter(Boolean).length;
  score = Math.round((available / checks.length) * 10);
  const reasoning = `${available} of ${checks.length} key data points are available. Higher data quality improves screening reliability.`;
  if (available < 5) {
    missingData.push('Overall data quality is low — many fields are missing');
  }
  return { name: 'Data Quality & Evidence', score, maxScore: 10, weight, reasoning, dataAvailable: true };
}
