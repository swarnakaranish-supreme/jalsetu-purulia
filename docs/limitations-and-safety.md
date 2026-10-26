# Technical Limitations, Water Quality & Safety Guidelines

## 1. Field Validation & Engineering Approval
- **Preliminary Screening Only**: The screening engine in JalSetu Purulia produces heuristic scores based solely on user-entered values.
- **No Civil Engineering Substitution**: Civil engineering structures (check dams, percolation tanks, large earthen bunds) must never be approved or constructed without an on-site geotechnical survey, soil-mechanics testing, and formal design sanction by a licensed civil or water-resources engineer.

## 2. Groundwater Recharge Uncertainty
- **Surface Storage $\ne$ Aquifer Recharge**: Water depth measured in a rooftop storage tank or lined farm pond represents localized, temporary surface retention. It does **not** indicate groundwater table elevation or recharge.
- **Geological Variability**: In Purulia's fractured granite-gneiss and laterite terrains, groundwater percolation occurs only where weathered mantles and fractures connect directly with the water table. Unweathered crystalline bedrock prevents downward infiltration regardless of surface water availability. Accurate aquifer monitoring requires dedicated piezometer tubes or monitored open dug wells.

## 3. Water Quality & Public Health Safety
- **Untreated Rainwater is NOT Potable**: Rainwater collected from rooftops or surface catchments may contain bird droppings, dust, particulate matter, airborne heavy metals, and bacterial pathogens.
- **First-Flush Diversion**: All rooftop systems must include a first-flush diverter to discard the initial 1 to 2 mm of rainfall containing accumulated roof contaminants.
- **Treatment Requirements**: Rainwater stored for domestic or drinking purposes must undergo multi-stage physical filtration (sand/gravel or micron cartridge) and certified disinfection (chlorination, boiling, or UV treatment) before consumption.
- **Mosquito Breeding Prevention**: Storage tanks must be tightly sealed with fine stainless steel mesh guards (&lt; 1 mm) over all overflow and vent pipes to prevent vector breeding (dengue/malaria).

## 4. Sensor Calibration & Environmental Limits
- **Speed of Sound Temperature Drift**: The speed of sound in air varies with ambient temperature ($c \approx 331.3 + 0.606 \times T^\circ\text{C}$). In Purulia summers where ambient temperatures exceed 42°C, uncompensated ultrasonic readings may drift by up to 5–8% unless paired with a temperature sensor (e.g. DS18B20).
- **Acoustic Reflections**: In corrugated or narrow tanks, ultrasonic pings can bounce off sidewalls or inlet pipes. Waterproof sensors (such as JSN-SR04T) have a wider beam angle (~45°) and require mounting in the tank's center clear of internal obstructions.
- **Blind-Zone Limitation**: Ultrasonic sensors have a minimum physical distance (~15–20 cm for JSN-SR04T, ~2–4 cm for HC-SR04). Water rising into this dead zone will report false echoes or maximum range.

## 5. Network Independence & Data Privacy
- **Local Browser Boundary**: All data is stored in the browser's `localStorage`. Clearing browser cache or switching devices will not automatically transfer records unless the user manually exports their database via JSON or CSV.
- **Offline Assurance**: The application does not depend on cloud uptime or external authentication servers, making it resilient to remote rural network blackouts.

## 6. Social & Administrative Clearances
- **Land Ownership**: Interventions on private or disputed land without written consent can lead to community conflict or legal disputes.
- **Panchayat & Watershed Consultation**: In community water harvesting, downstream water rights must be respected. Check dams must not completely starve downstream farming communities of normal baseflow.
