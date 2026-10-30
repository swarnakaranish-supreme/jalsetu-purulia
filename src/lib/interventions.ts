/* ============================================================
   JalSetu Purulia — Intervention Options & Site Matching Engine
   
   These options represent practical rainwater-harvesting,
   storage, watershed, and irrigation measures suited to
   Purulia's undulating hard-rock terrain.
   
   Cost ranges and indicative parameters are transparently
   documented approximations based on standard Schedule of
   Rates (West Bengal PWD / WRIDD / MGNREGS norms).
   ============================================================ */

import type { InterventionOption, SiteAssessment } from '../types';

export const INTERVENTION_OPTIONS: InterventionOption[] = [
  {
    id: 'restore-existing',
    name: 'Restore Existing Pond, Bandh or Tank',
    category: 'restoration',
    description:
      'Repair, desilt, and rehabilitate an existing water body (traditional village pukur, bandh, or hapa). Often the most cost-effective and environmentally sound intervention in Purulia.',
    advantages: [
      'Restoration-First Principle: Significantly lower capital cost than new excavation',
      'Preserves traditional village water bodies and community access commons',
      'Existing catchment and natural drainage flow paths are already established',
      'Eligible for MGNREGA, Jal Dharo-Jal Bharo, and Panchayat development schemes',
      'Excavated fertile silt can be applied to improve adjacent agricultural fields',
    ],
    limitations: [
      'Effectiveness depends on the condition and stability of the existing embankment',
      'Desilting must be coupled with upstream catch-water bunds or siltation will rapidly recur',
      'Requires disposal planning for excavated silt (especially if contaminated by domestic effluents)',
      'Community consensus required if multiple hamlets share traditional fishing or washing rights',
    ],
    suitableSlope: 'Flat to gentle slopes (< 5%) in natural drainage depressions.',
    suitableSoilGeology: 'Clay to weathered laterite loams with reasonable water retention.',
    costRangeLow: 35000,
    costRangeHigh: 250000,
    costCurrency: 'INR',
    costBasis: 'Indicative per pond based on machine/manual earthwork desilting (₹120–₹180/m³) and bund dressing.',
    maintenanceRequirements: [
      'Periodic desilting every 3–5 years depending on upstream erosion',
      'Inspection and turfing of earthen embankments before and after monsoon rains',
      'Clearing aquatic weeds (water hyacinth) and cleaning inlet/outlet weirs',
      'Maintaining stone riprap on the water-facing bund slope',
    ],
    dataNeeded: [
      'Silt depth measurement and estimated volume to be excavated (m³)',
      'Condition of embankment, sluice gate, and emergency spillway',
      'Catchment land use and rate of upstream soil erosion',
      'Water usage rights and consensus among neighbouring hamlets',
    ],
    engineeringRequirements: [
      'Levelling survey for depth, bed slope, and spillway crest elevation',
      'Desilting plan specifying disposal areas outside the active catchment',
      'Compaction of dressed earthen bunds to prevent seepage piping',
    ],
    permissionRequirements: [
      'Panchayat or Departmental resolution for public water bodies',
      'Gram Sabha consensus for community-held water rights',
      'Environmental / Fisheries clearance if commercial fish culture is leased',
    ],
    downstreamImpacts: [
      'Restores downstream baseflow and reduces flash flood surges',
      'Recharges surrounding shallow open wells within 200–500 metres',
    ],
    communityManagementRole:
      'Village Water User Committee or Gram Panchayat manages desilting schedules and seasonal water sharing.',
    isRestoration: true,
  },
  {
    id: 'rooftop-rwh',
    name: 'Rooftop Rainwater Harvesting with First-Flush Diverter',
    category: 'rooftop',
    description:
      'Collect rainwater from institutional (school, health centre, panchayat office) or residential rooftops via gutters, first-flush diverter, and slow-sand filter into sealed storage tanks.',
    advantages: [
      'Delivers direct potable or cooking water supply during acute summer scarcity',
      'Independent of local geological hard-rock variations or borewell failure',
      'Can be installed on public buildings (schools for Midday Meal water security)',
      'Eliminates fluoride and heavy metal exposure common in deep hard-rock borewells',
      'Low energy footprint — water can be drawn via gravity tap or hand pump',
    ],
    limitations: [
      'Volume is strictly limited by available roof catchment area and storage tank size',
      'Requires disciplined pre-monsoon gutter cleaning and first-flush diverter operation',
      'Sealed storage tanks (masonry, ferrocement, or food-grade polymer) have capital costs',
      'Raw collected rainwater must be boiled, filtered, or disinfected before drinking',
    ],
    suitableSlope: 'Applicable to any building with structural integrity, independent of terrain slope.',
    suitableSoilGeology: 'Not dependent on soil or geology; independent surface harvesting.',
    costRangeLow: 18000,
    costRangeHigh: 85000,
    costCurrency: 'INR',
    costBasis: 'Typical 5,000–10,000 Litre institutional ferrocement or HDPE system including piping, filter, and stand.',
    maintenanceRequirements: [
      'Cleaning rooftop surface and clearing downpipe leaf-traps before first monsoon shower',
      'Operating the first-flush diverter to discard initial 1–2 mm of contaminated runoff',
      'Washing and sun-drying filter sand/gravel media twice per season',
      'Quarterly chlorinated disinfection of storage tank interior',
    ],
    dataNeeded: [
      'Rooftop footprint area (m²) and roof material (RCC, sheet metal, tile)',
      'Local monthly rainfall data and target dry-period duration (days)',
      'Estimated daily consumption demand for target beneficiaries',
      'Foundation ground bearing capacity for storage tank placement',
    ],
    engineeringRequirements: [
      'Sizing gutter cross-section for maximum 15-minute rainfall intensity (typically 50–75 mm/hr)',
      'First-flush diverter sized for minimum 1.0 mm rainfall depth wash-off',
      'Dual-chamber slow sand filter design (gravel, coarse sand, activated charcoal)',
    ],
    permissionRequirements: [
      'Building owner or school management committee approval',
      'Gram Panchayat No Objection Certificate for public campus installations',
    ],
    downstreamImpacts: [
      'Reduces localised campus waterlogging and soil erosion around foundations',
    ],
    communityManagementRole:
      'School caretaker, Self-Help Group, or designated youth volunteer operates first-flush valve and cleans gutters.',
    isRestoration: false,
  },
  {
    id: 'farm-pond',
    name: 'Farm Pond / Hapa (30-40 Model)',
    category: 'farm_irrigation',
    description:
      'Excavated earthen pond on agricultural land to store localized surface runoff for critical Kharif supplementary irrigation and early Rabi pulse or oilseed cultivation.',
    advantages: [
      'Provides critical life-saving irrigation during 15–20 day monsoon dry spells',
      'Enables second crop (mustard, gram, vegetables) on previously single-cropped lands',
      'Proven agricultural resilience model across the Western Plateau (USHARMUKTI & PRADAN models)',
      'Can support dual-use duck rearing and seasonal carp fingerling nursery',
      'Constructible under MGNREGS 100-day employment guarantee',
    ],
    limitations: [
      'Consumes 5%–10% of cultivable plot area; requires farmer consent and landholding',
      'High evaporation losses (up to 5–8 mm/day) during hot pre-monsoon summer months',
      'Seepage losses can be severe in permeable sandy/fractured soils without clay lining',
      'Siltation requires annual inlet desilting and grass sodding on perimeter bunds',
    ],
    suitableSlope: 'Gentle to moderate slopes (2% – 8%) along lower farm terrace contours.',
    suitableSoilGeology: 'Clay loam or lateritic soils with clay compaction. Rocky or fractured beds require bentonite/silt blanket.',
    costRangeLow: 45000,
    costRangeHigh: 140000,
    costCurrency: 'INR',
    costBasis: 'Standard 20m × 20m × 3m (approx 1,000 m³ capacity) unlined earthen excavation under standard schedule.',
    maintenanceRequirements: [
      'Desilting inlet silt basin prior to monsoon onset',
      'Repairing breaches in earthen embankments and maintaining grass cover',
      'Weeding perimeter and ensuring domestic cattle do not trample inlet walls',
    ],
    dataNeeded: [
      'Catchment area draining into the pond location',
      'Soil texture profile and percolation rate at proposed bed depth',
      'Irrigation requirement of target crops and cropping calendar',
      'Documented farmer ownership and no-dispute certification',
    ],
    engineeringRequirements: [
      'Side slope ratio (minimum 1.5:1 horizontal to vertical in stable soils; 2:1 in loose soils)',
      'Stone-pitching or vegetative apron at runoff inlet to avoid gullying',
      'Protected earthen waste weir / emergency spillway to discharge excess flood runoff safely',
    ],
    permissionRequirements: [
      'Panchayat NREGA work order or Agriculture Department scheme sanction',
      'Clear title deed (Parcha/RoR) confirming farmer ownership',
    ],
    downstreamImpacts: [
      'Reduces agricultural runoff velocity, trapping topsoil nutrients',
      'Raises soil moisture in adjacent terraced plots downstream',
    ],
    communityManagementRole:
      'Individual farmer or shared user group coordinates water distribution via low-head siphon or diesel/solar pump.',
    isRestoration: false,
  },
  {
    id: 'check-dam',
    name: 'Check Dam / Nala Bund on Drainage Channels',
    category: 'channel_barrier',
    description:
      'Small masonry, gabion, or reinforced concrete barrier constructed across second- or third-order drainage streams to retard flash runoff velocity, trap silt, and store water in the stream bed.',
    advantages: [
      'Retains surface water within natural drainage corridors for post-monsoon lift irrigation',
      'Moderates flash flood velocity and arrests streambed incision and bank erosion',
      'Induces local subsurface recharge in adjoining weathered valley aquifers',
      'Provides livestock watering points and community bathing water in dry months',
    ],
    limitations: [
      'Strict engineering requirement: foundation must anchor into competent bedrock to prevent undermining',
      'High siltation rates rapidly fill storage pool within 3–5 years without upstream watershed treatment',
      'Must never compromise statutory riparian rights of downstream villages',
      'High structural failure risk if flood spillway is undersized for cloudburst events',
    ],
    suitableSlope: 'Gentle to moderate stream bed slope (< 3% longitudinal bed gradient).',
    suitableSoilGeology: 'Exposed or shallow hard crystalline bedrock foundation with stable abutment walls.',
    costRangeLow: 250000,
    costRangeHigh: 1200000,
    costCurrency: 'INR',
    costBasis: 'Masonry or RCC check dam (10m–25m crest width, 1.5m–2.5m height) with apron and downstream training walls.',
    maintenanceRequirements: [
      'Annual pre-monsoon and post-monsoon structural inspection of spillway crest and abutments',
      'Desilting stream bed upstream of the dam crest using machinery or community labour',
      'Repairing scoured downstream stilling basin and energy dissipating boulders',
      'Clearing debris caught in weep holes and overflow notches',
    ],
    dataNeeded: [
      'Catchment area and 25-year return period design peak flood discharge (m³/sec)',
      'Stream cross-section profile and high-flood level (HFL) marks from local elders',
      'Geotechnical rock core or trial pit confirming foundation bedrock depth',
      'Downstream water use rights and inventory of existing structures on the same stream',
    ],
    engineeringRequirements: [
      'Hydraulic sizing of broad-crested ogee or stepped spillway for design flood discharge',
      'Anti-seepage cutoff wall beneath upstream apron and downstream scour apron',
      'Structural stability analysis against overturning, sliding, and foundation crushing',
    ],
    permissionRequirements: [
      'Technical sanction from Executive Engineer (Water Resources Investigation & Development / PWD)',
      'Gram Panchayat NOC and inter-panchayat consultation if stream spans block/panchayat borders',
      'Forest Department clearance if stream touches notified forest land',
    ],
    downstreamImpacts: [
      'Moderates peak downstream flood surges while maintaining statutory minimum ecological flow',
      'Must include controlled low-level sluice or notch to ensure downstream riparian rights are respected',
    ],
    communityManagementRole:
      'Pani Panchayat (Water User Association) manages seasonal lift irrigation turns and maintenance funds.',
    isRestoration: false,
  },
  {
    id: 'contour-trenching',
    name: 'Staggered Contour Trenches & Gully Plugs',
    category: 'watershed_contour',
    description:
      'Ridge-to-valley soil-water conservation on barren or degraded hillslopes (e.g. Ayodhya, Joychandi fringes). Involves contour bunding, staggered trenches (SCT), and loose boulder gully checks.',
    advantages: [
      'Arrests rapid overland sheet runoff at the ridge before it accumulates erosive energy',
      'Significantly enhances sub-surface soil moisture, aiding tree afforestation and fodder regeneration',
      'Protects downstream ponds, check dams, and paddy terraces from catastrophic siltation',
      'Highly labour-intensive; ideal for MGNREGS rural employment generation',
      'Promoted under West Bengal’s USHARMUKTI Western Plateau watershed mission',
    ],
    limitations: [
      'Does not provide direct standing surface water for domestic pipe supply or pump irrigation',
      'Must be strictly surveyed along topographic contours; improper alignment creates gully bursts',
      'Requires protection from cattle grazing during initial 2–3 seasons of vegetative establishment',
      'Ineffective on slopes steeper than 25% without heavy stone terracing',
    ],
    suitableSlope: 'Moderate to steep slopes (5% – 20%) in upper and middle catchment ridges.',
    suitableSoilGeology: 'Shallow degraded red lateritic soils with gravelly weathered horizons.',
    costRangeLow: 15000,
    costRangeHigh: 60000,
    costCurrency: 'INR',
    costBasis: 'Per hectare of catchment treated with 0.5m × 0.5m × 4m staggered trenches and vegetative hedge planting.',
    maintenanceRequirements: [
      'Desilting sediment from trenches after heavy monsoon downpours',
      'Replanting vetiver grass or perennial shrubs along trench berms',
      'Repairing dislodged stones on dry boulder gully plugs',
    ],
    dataNeeded: [
      'Topographic contour map or handheld levelling survey',
      'Soil depth profile across the slope',
      'Forest and revenue land boundaries',
      'Community grazing rights and livestock population',
    ],
    engineeringRequirements: [
      'Accurate contour alignment using A-frame or dumpy level (zero slope along trench bed)',
      'Inter-row trench spacing based on slope gradient (steeper slopes require closer spacing)',
      'Loose boulder checks stepped with wire-mesh gabions at active gully heads',
    ],
    permissionRequirements: [
      'Forest Department Joint Forest Management (JFM) approval if on protected slopes',
      'Gram Panchayat watershed development resolution',
    ],
    downstreamImpacts: [
      'Major reduction in peak sediment load entering valley ponds and reservoirs',
      'Prolongs baseflow duration in seasonal springs and natural stream headwaters',
    ],
    communityManagementRole:
      'Village Forest Protection Committee / Watershed Committee enforces grazing bans and maintains vegetative hedgerows.',
    isRestoration: false,
  },
  {
    id: 'percolation-tank',
    name: 'Percolation Tank with Silt Trap',
    category: 'subsurface_recharge',
    description:
      'Constructed earthen or masonry retention basin positioned in upper-middle valley reaches over permeable weathered mantles to maximize groundwater recharge to downstream wells.',
    advantages: [
      'Directly augments water table in downstream shallow open wells and tube wells',
      'Improves post-monsoon drinking water availability in rural village wells',
      'Low evaporation loss compared to long-term surface storage (water percolates underground)',
      'Natural filtration through weathered mantle improves sub-surface water clarity',
    ],
    limitations: [
      'CRITICAL: Highly sensitive to geology. Ineffective in unweathered crystalline granite-gneiss or thick clay',
      'Silt deposition rapidly seals bottom pores, turning percolation structure into an evaporating pond',
      'Recharge impact is distributed and difficult to monitor without dedicated piezometer observation',
      'Does not provide immediate off-take pipe supply for drinking',
    ],
    suitableSlope: 'Gentle valley slopes (1% – 3%) upstream of village habitation or agricultural clusters.',
    suitableSoilGeology: 'Weathered lateritic mantle, fractured pegmatite zones, or porous saprolite (minimum 2–3 m depth).',
    costRangeLow: 120000,
    costRangeHigh: 450000,
    costCurrency: 'INR',
    costBasis: 'Earthen percolation tank with masonry surplus weir, reverse filter bed, and inlet silt basin.',
    maintenanceRequirements: [
      'Mandatory annual scraping of top 5–10 cm silt layer from tank bed before monsoon',
      'Flushing and replenishment of gravel filter bed at inlet',
      'Vegetation control on perimeter bund to prevent root piping',
    ],
    dataNeeded: [
      'Hydrogeological resistivity survey confirming weathered/fractured aquifer beneath site',
      'Depth to water table in pre-monsoon and post-monsoon seasons in nearby wells',
      'Soil infiltration rate test (double-ring infiltrometer) on tank bed',
      'Upstream catchment area and sediment yield',
    ],
    engineeringRequirements: [
      'Infiltration bed left uncompacted; reverse filter (coarse sand/gravel) laid over recharge pits',
      'Inlet settling basin sized for 30-minute detention time to settle coarse sediment',
      'Waste weir sized for safe passage of 25-year flood overflow',
    ],
    permissionRequirements: [
      'Hydrogeological clearance from State Water Resources Investigation Directorate / CGWB',
      'Panchayat administrative approval and land title verification',
    ],
    downstreamImpacts: [
      'Recharges surrounding unconfined aquifer up to 1 km downstream',
      'Reduces fluoride concentration in surrounding wells via seasonal fresh dilution',
    ],
    communityManagementRole:
      'Gram Panchayat water sub-committee schedules pre-monsoon silt scraping and downstream well monitoring.',
    isRestoration: false,
  },
  {
    id: 'recharge-shaft',
    name: 'Recharge Shaft / Injection Well (Hydrogeologically Qualified)',
    category: 'subsurface_recharge',
    description:
      'Vertical borehole or dug shaft backfilled with graded filter media to guide clean roof or filtered runoff past impermeable surficial layers into deep fractured aquifers.',
    advantages: [
      'Bypasses impermeable top clay or massive sheet-rock to reach deeper fractured rock zones',
      'Very compact footprint; suitable for institutional campuses, market yards, or dense settlements',
      'Directly recharges deep fractures that feed village drinking water hand pumps',
    ],
    limitations: [
      'EXTREME RISK OF CONTAMINATION: If unfiltered surface runoff enters shaft, aquifer is permanently polluted',
      'Completely ineffective in massive granite bedrock lacking secondary fractures',
      'Filter media clogs rapidly if fine clay runoff enters without multi-stage settling',
      'Requires professional geophysical electrical resistivity sounding before drilling',
    ],
    suitableSlope: 'Flat campus or settlement ground with controlled surface drainage.',
    suitableSoilGeology: 'Hard-rock areas with confirmed sub-surface fracture zones below 15–30 metres depth.',
    costRangeLow: 45000,
    costRangeHigh: 180000,
    costCurrency: 'INR',
    costBasis: '150mm–200mm diameter bored shaft with slotted casing, multi-layer gravel filter, and desilting chamber.',
    maintenanceRequirements: [
      'Quarterly replacement or backwashing of top sand/charcoal filter media',
      'Cleaning settling chamber and removing floating debris after every storm event',
      'Water quality monitoring of nearby monitor wells for turbidity or bacterial intrusion',
    ],
    dataNeeded: [
      'Electrical resistivity tomography (ERT) or vertical electrical sounding (VES) report',
      'Aquifer fracture geometry, depth, and hydrostatic pressure head',
      'Catchment cleanliness guarantee (free from open drains, pesticides, or animal dung)',
    ],
    engineeringRequirements: [
      'Three-stage filtration: sedimentation tank + slow-sand filter + inverted gravel bed',
      'Non-return valve and air vent to prevent air locking during recharge surges',
      'Slotted PVC/steel screen positioned strictly within permeable fracture horizons',
    ],
    permissionRequirements: [
      'MANDATORY statutory clearance from Central Ground Water Authority (CGWA) / SWID',
      'Environmental compliance verification confirming zero industrial or sewage runoff',
    ],
    downstreamImpacts: [
      'Directly recharges targeted fractured deep aquifer; zero surface runoff retention',
    ],
    communityManagementRole:
      'Appointed technician or institutional maintenance staff inspects filter chambers after rain.',
    isRestoration: false,
  },
  {
    id: 'infrastructure-repair',
    name: 'Rehabilitation of Existing Sluice Gates, Canals & Lift Schemes',
    category: 'restoration',
    description:
      'Engineering repair of cracked masonry weirs, broken steel sluice gates, eroded canal earthen banks, and non-operational river-lift pumps (RLI schemes) built under previous government programmes.',
    advantages: [
      'Re-activates millions of litres of existing infrastructure capacity at low marginal cost',
      'Avoids land acquisition delays and environmental clearance hurdles',
      'Restores community trust in existing government water schemes that fell into disrepair',
      'Immediate delivery of irrigation water compared to multi-year new construction',
    ],
    limitations: [
      'Requires thorough civil and electro-mechanical diagnostic inspection before repair',
      'Old canals may have severe vegetation growth and unauthorized breaching by head-reach farmers',
      'River-lift schemes require reliable three-phase power supply or solar hybrid conversion',
      'Requires resolving institutional disputes regarding past maintenance neglect',
    ],
    suitableSlope: 'Existing canal command areas and riverbank lift locations.',
    suitableSoilGeology: 'Existing civil infrastructure footprints.',
    costRangeLow: 25000,
    costRangeHigh: 350000,
    costCurrency: 'INR',
    costBasis: 'Masonry grouting, gate replacement, rubber seals, canal lining patch-up, and motor rewinding.',
    maintenanceRequirements: [
      'Greasing and operating steel sluice gate spindles twice monthly',
      'Clearing weed and silt obstructions from secondary distribution channels',
      'Patching concrete cracks before minor seepage develops into structural failure',
    ],
    dataNeeded: [
      'Original design drawings and capacity specifications (if available in block records)',
      'Structural crack audit and leakage rate estimation',
      'Pump motor health diagnosis (insulation resistance, impeller wear, suction line integrity)',
      'Current command area farmer roster and willing Water User Association',
    ],
    engineeringRequirements: [
      'Non-shrink polymer-modified mortar for underwater masonry crack repair',
      'Epoxy-coated or hot-dip galvanized steel replacement sluice gates with neoprene seals',
      'Surge protection and automatic dry-run cut-off for irrigation pumpsets',
    ],
    permissionRequirements: [
      'Water Resources Investigation & Development Department (WRIDD) / Agri-Irrigation sanction',
      'Panchayat Samiti resolution',
    ],
    downstreamImpacts: [
      'Restores equitable tail-end water delivery in previously abandoned canal reaches',
    ],
    communityManagementRole:
      'Re-constituted Water User Association (WUA) collects water cess for minor routine repairs.',
    isRestoration: true,
  },
  {
    id: 'efficient-irrigation',
    name: 'Farm-Level Micro-Irrigation & Crop Water Budgeting',
    category: 'farm_irrigation',
    description:
      'Shift from flood irrigation to drip or portable sprinkler systems combined with mulching and crop water budgeting (encouraging mustard, pulses, and vegetables instead of water-intensive Boro paddy).',
    advantages: [
      'Saves 40%–60% of irrigation water compared to traditional flood irrigation',
      'Allows existing farm ponds and wells to irrigate 2× to 3× greater acreage',
      'Mitigates summer evaporative losses and prevents soil salinisation in red laterite soils',
      'Eligible for up to 55%–80% government subsidy under Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)',
      'Significantly increases crop yield and fertilizer efficiency through fertigation',
    ],
    limitations: [
      'Requires initial capital investment even after government subsidy',
      'Drip emitters clog easily if pond water contains suspended algae or fine silt (requires screen filter)',
      'Cattle trampling and rodent damage to flexible lateral pipes require protective management',
      'Requires farmer training on system flushing, pressure regulation, and crop scheduling',
    ],
    suitableSlope: 'Adaptable to undulating terrain and terraced plots without land levelling.',
    suitableSoilGeology: 'Ideal for light laterite, red loamy, and sandy soils with high infiltration rates.',
    costRangeLow: 25000,
    costRangeHigh: 75000,
    costCurrency: 'INR',
    costBasis: 'Per acre portable sprinkler or gravity drip kit with sand/disc filter and HDPE sub-mains.',
    maintenanceRequirements: [
      'Flushing sub-mains and lateral pipes fortnightly with clean water',
      'Cleaning screen/disc filter elements weekly during irrigation season',
      'Acid/chlorine washing of drip emitters at end of season to dissolve mineral scale',
    ],
    dataNeeded: [
      'Available water source discharge rate and total seasonal storage volume (m³)',
      'Soil texture profile and water holding capacity (available water capacity AWC)',
      'Crop water requirement (CWR) across crop growth stages (mm/day)',
      'Pump operating pressure and power source reliability',
    ],
    engineeringRequirements: [
      'Hydraulic design ensuring uniform discharge across undulating terrace elevation heads',
      'Disc/screen filtration with minimum 120-mesh rating for surface water sources',
      'Pressure relief valve and vacuum breakers on delivery manifolds',
    ],
    permissionRequirements: [
      'Agriculture Department registration for PMKSY subsidy allocation',
      'Land title verification (RoR)',
    ],
    downstreamImpacts: [
      'Substantially conserves regional groundwater and surface reservoir storage',
    ],
    communityManagementRole:
      'Farmer Producer Organisations (FPO) or Self-Help Groups share portable sprinkler sets across members.',
    isRestoration: false,
  },
  {
    id: 'storage-distribution',
    name: 'Decentralized Community Storage Cisterns & Distribution Stands',
    category: 'distribution',
    description:
      'Covered masonry, ferrocement, or composite ground/elevated cisterns fed by harvested rainwater or shallow borewells to supply decentralized drinking water stands in water-scarce rural hamlets.',
    advantages: [
      'Directly reduces women’s walking distance and fetching time during peak summer months',
      'Protected covered storage prevents mosquito breeding, algae growth, and dust contamination',
      'Can be paired with solar-powered low-wattage submersible pumps',
      'Provides buffer storage when grid electricity is disrupted for days during storm events',
    ],
    limitations: [
      'Requires reliable raw water replenishment (either monsoon harvesting or protected spring/well)',
      'Must have strict hygiene protocols to prevent tap contamination at public standposts',
      'Requires land allocation near village central habitation',
      'Vandalism or broken taps can cause rapid leakage if community stewardship is weak',
    ],
    suitableSlope: 'Elevated or central village ground for gravity distribution.',
    suitableSoilGeology: 'Stable soil with adequate structural bearing capacity for masonry foundation.',
    costRangeLow: 60000,
    costRangeHigh: 280000,
    costCurrency: 'INR',
    costBasis: '10,000–25,000 Litre ferrocement or reinforced brick masonry tank with tap stand and soak pit.',
    maintenanceRequirements: [
      'Monthly disinfection and scrubbing of tank walls using bleaching powder',
      'Immediate replacement of worn tap washers and leaking bib cocks',
      'Clearing gravel soak pit around standpost to prevent stagnant puddles',
    ],
    dataNeeded: [
      'Hamlet population and daily basic drinking/cooking water demand (LPCD)',
      'Safe replenishment source yield and seasonal reliability',
      'Chemical and bacteriological water test report for the supply source',
      'Village consensus on public tap stand location',
    ],
    engineeringRequirements: [
      'Ventilated mosquito-proof overflow and inspection hatch with brass padlock',
      'Elevated tap platform with concrete apron and gravity drain leading to soak pit',
      'Residual chlorine dosing apparatus or in-line multi-media filtration',
    ],
    permissionRequirements: [
      'Gram Panchayat resolution approving site and utility connection',
      'PHED / Jal Jeevan Mission village water committee concurrence',
    ],
    downstreamImpacts: [
      'Zero downstream hydrological negative impacts; promotes sanitary public health',
    ],
    communityManagementRole:
      'Village Water & Sanitation Committee (VWSC) / Self-Help Group oversees daily distribution and tap upkeep.',
    isRestoration: false,
  },
];

/**
 * Evaluate the compatibility of candidate interventions against an assessed site.
 */
export function evaluateInterventionsForSite(site: SiteAssessment): Array<{
  intervention: InterventionOption;
  recommendationStatus: 'highly_recommended' | 'conditionally_suitable' | 'not_recommended' | 'requires_more_data';
  suitabilityReason: string;
  siteSpecificRisks: string[];
}> {
  return INTERVENTION_OPTIONS.map(opt => {
    const siteSpecificRisks: string[] = [];
    let recommendationStatus: 'highly_recommended' | 'conditionally_suitable' | 'not_recommended' | 'requires_more_data' =
      'conditionally_suitable';
    let suitabilityReason = '';

    // Check for restoration of existing structure first
    if (opt.id === 'restore-existing') {
      if (site.existingStructure && site.existingStructure.trim() && site.existingStructureCondition !== 'unknown') {
        if (site.existingStructureCondition === 'good' || site.existingStructureCondition === 'fair') {
          recommendationStatus = 'highly_recommended';
          suitabilityReason = `Restoration Priority: Site has existing structure ("${site.existingStructure}") in ${site.existingStructureCondition} condition. Desilting or repairing this asset provides immediate capacity at lower cost than new excavation.`;
        } else if (site.existingStructureCondition === 'poor') {
          recommendationStatus = 'conditionally_suitable';
          suitabilityReason = `Existing structure ("${site.existingStructure}") is in poor condition. Engineering survey required to compare desilting/rehabilitation cost against replacement.`;
          siteSpecificRisks.push('Damaged embankment or deep siltation may require extensive earthwork.');
        } else {
          recommendationStatus = 'conditionally_suitable';
          suitabilityReason = 'Existing structure is non-functional. Detailed structural stability survey needed.';
        }
      } else if (site.existingStructure && site.existingStructureCondition === 'unknown') {
        recommendationStatus = 'requires_more_data';
        suitabilityReason = 'Existing structure is recorded but physical condition is unassessed. Field inspection required.';
      } else {
        recommendationStatus = 'not_recommended';
        suitabilityReason = 'No pre-existing water body reported at this site. New construction intervention required.';
      }
      return { intervention: opt, recommendationStatus, suitabilityReason, siteSpecificRisks };
    }

    // Rooftop RWH
    if (opt.id === 'rooftop-rwh') {
      if (site.siteType === 'rooftop') {
        recommendationStatus = 'highly_recommended';
        suitabilityReason = `Excellent match: Site is an existing rooftop catchment (${site.catchmentAreaSqm ?? 'unmeasured'} m²). Ideal for direct domestic or school water supply.`;
      } else {
        recommendationStatus = 'not_recommended';
        suitabilityReason = `Site type is "${site.siteType.replace('_', ' ')}", not a building rooftop.`;
      }
      return { intervention: opt, recommendationStatus, suitabilityReason, siteSpecificRisks };
    }

    // Farm Pond
    if (opt.id === 'farm-pond') {
      if (site.siteType === 'agricultural_land' || site.siteType === 'other') {
        if (site.slopeCategory === 'steep') {
          recommendationStatus = 'not_recommended';
          suitabilityReason = 'Steep slope (> 10%) creates severe embankment breach risks and excessive earthwork for farm ponds.';
          siteSpecificRisks.push('High erosion hazard on steep slopes.');
        } else if (site.soilType === 'sandy') {
          recommendationStatus = 'conditionally_suitable';
          suitabilityReason = 'Sandy soil has rapid permeability. Earthen farm pond will lose water quickly unless clay or polymer liner is installed.';
          siteSpecificRisks.push('Seepage losses require pond lining.');
        } else {
          recommendationStatus = 'highly_recommended';
          suitabilityReason = `Favourable: Agricultural land with ${site.slopeCategory} slope. Suitable for supplementary Kharif/Rabi irrigation storage.`;
        }
      } else {
        recommendationStatus = 'conditionally_suitable';
        suitabilityReason = `Site is classified as "${site.siteType.replace('_', ' ')}". Land availability for farm pond excavation must be confirmed.`;
      }
      return { intervention: opt, recommendationStatus, suitabilityReason, siteSpecificRisks };
    }

    // Check Dam
    if (opt.id === 'check-dam') {
      if (site.siteType === 'drainage_channel') {
        if (site.slopeCategory === 'steep') {
          recommendationStatus = 'not_recommended';
          suitabilityReason = 'High hydraulic flow velocity on steep channels risks scouring abutments and structural breach.';
          siteSpecificRisks.push('Channel bed gradient is too steep for stable small check dam without heavy energy dissipators.');
        } else if (site.soilType === 'rocky' || (site.geologyInfo && site.geologyInfo.toLowerCase().includes('granite'))) {
          recommendationStatus = 'highly_recommended';
          suitabilityReason = 'Favourable: Drainage channel with crystalline rock foundation provides solid anchorage for check dam abutments.';
        } else {
          recommendationStatus = 'conditionally_suitable';
          suitabilityReason = 'Drainage channel suitable, but geotechnical foundation rock depth must be verified by trial pits.';
          siteSpecificRisks.push('Soft foundation may require deep concrete cutoff walls to prevent piping.');
        }
      } else {
        recommendationStatus = 'not_recommended';
        suitabilityReason = `Check dams require an active drainage channel. Site is classified as "${site.siteType.replace('_', ' ')}".`;
      }
      return { intervention: opt, recommendationStatus, suitabilityReason, siteSpecificRisks };
    }

    // Contour Trenching
    if (opt.id === 'contour-trenching') {
      if (site.siteType === 'contour_slope' || site.slopeCategory === 'moderate' || site.slopeCategory === 'steep') {
        recommendationStatus = 'highly_recommended';
        suitabilityReason = `Favourable: Sloping terrain (${site.slopeCategory}) benefits directly from ridge-to-valley staggered contour trenches and gully plugs.`;
      } else if (site.slopeCategory === 'flat') {
        recommendationStatus = 'not_recommended';
        suitabilityReason = 'Contour trenching is designed for sloping hillslopes; flat terrain does not require contour barriers.';
      } else {
        recommendationStatus = 'conditionally_suitable';
        suitabilityReason = 'May be suitable if upper catchment ridges feed this site.';
      }
      return { intervention: opt, recommendationStatus, suitabilityReason, siteSpecificRisks };
    }

    // Percolation Tank & Recharge Shaft (Hydrogeological check)
    if (opt.id === 'percolation-tank' || opt.id === 'recharge-shaft') {
      if (site.soilType === 'rocky' || (site.geologyInfo && site.geologyInfo.toLowerCase().includes('massive'))) {
        recommendationStatus = 'not_recommended';
        suitabilityReason =
          'Massive crystalline granite-gneiss hard rock blocks downward recharge. Recharge structures will fail without secondary fracture geophysics. Prioritize surface storage instead.';
        siteSpecificRisks.push('Bedrock is impermeable hard rock; high risk of non-functional recharge structure.');
      } else if (site.soilType === 'clay') {
        recommendationStatus = 'not_recommended';
        suitabilityReason = 'Dense clay soil has very low infiltration capacity. Deep percolation tanks will act merely as shallow evaporating ponds.';
        siteSpecificRisks.push('Very low soil permeability blocks groundwater infiltration.');
      } else if (site.soilType === 'laterite' || site.soilType === 'alluvial') {
        recommendationStatus = 'highly_recommended';
        suitabilityReason = `Favourable hydrogeology: ${site.soilType} formations have natural permeability suited for augmenting shallow unconfined aquifers.`;
      } else {
        recommendationStatus = 'requires_more_data';
        suitabilityReason = 'Geological permeability and sub-surface fracture information are missing. Hydrogeological resistivity survey required.';
      }
      return { intervention: opt, recommendationStatus, suitabilityReason, siteSpecificRisks };
    }

    // Default for other options
    suitabilityReason = `General water conservation option. Evaluate against site water demand ("${site.waterDemand || 'Unspecified'}").`;
    return { intervention: opt, recommendationStatus, suitabilityReason, siteSpecificRisks };
  });
}
