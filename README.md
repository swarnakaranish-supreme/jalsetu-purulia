# JalSetu Purulia (জলসেতু পুরুলিয়া)

> **Rainwater-Harvesting Planning, Asset Registry & Storage Monitoring Prototype**  
> *A student innovation submission to the Seva First Innovation Challenge – Eastern Region*  
> Initial geographic focus: Purulia District, West Bengal, India

---

## 1. Prototype Notice & Honest Scope
**JalSetu Purulia is an open-source student innovation prototype.**  
- **Not government-approved or field-deployed:** The system has not been commissioned by a government department or implemented across a live village.
- **Simulated demonstration data:** Example records pre-loaded in this application are simulated to demonstrate the workflow. They must not be cited as real field evidence or verified district water metrics.
- **No unverified AI claims:** The application does not use artificial intelligence or black-box algorithms to make civil engineering decisions. It uses transparent, rule-based screening heuristics.

---

## 2. The Local Problem in Purulia District
Purulia district, situated in the western hard-rock upland zone of West Bengal, experiences acute water distress during pre-monsoon summer months (March–June). 

Key hydrogeological factors from the *Central Ground Water Board (CGWB) Report (2022)*:
- **Undulating topography & rapid runoff:** Monsoon rainfall (~1,100 to 1,300 mm) falls predominantly in short, intense spells. Steep slopes drain runoff into seasonal streams within hours.
- **Crystalline bedrock & shallow aquifer:** The underlying granite-gneiss hard-rock basement has very low primary porosity. Groundwater is restricted to a thin weathered mantle (5–15 m depth) and secondary fracture networks.
- **Premature drying of traditional sources:** Despite the historical presence of village ponds (*bandhs* and *hapas*), heavy siltation and unmaintained bunds cause them to run dry right when summer demand peaks.

---

## 3. What Makes This Workflow Different
Rainwater harvesting is a centuries-old practice in Purulia; government agencies have executed hundreds of schemes under MGNREGA and WBFD. The primary bottleneck is rarely a lack of construction ideas, but rather:
1. **Asset Visibility & Tracking:** Thousands of existing village tanks and rooftops lack structured condition or siltation records.
2. **Prioritizing Restoration Over New Excavation:** In many locations, desilting and repairing an existing breached pond yields immediate storage at a fraction of the cost and land-acquisition friction of excavating a new pond.
3. **Closing the Maintenance Loop:** Physical infrastructure fails because minor clogs, torn mesh guards, and silt accumulation go unrecorded until catastrophic failure occurs.
4. **Distinguishing Storage from Aquifer Recharge:** A full rainwater tank provides domestic water storage; it does not automatically recharge the regional deep aquifer. JalSetu keeps these terms scientifically separate.

---

## 4. Current Features (Implemented)
- **Overview Dashboard:** Live summary cards calculated dynamically from the current dataset (registered assets, inspection needs, open issues, latest readings), a 15-point time-series trend chart (Recharts), Leaflet GIS asset map, and recent maintenance logs.
- **Site Assessment & Rule-Based Screening:** Multi-parameter candidate site survey form. Live 8-factor transparent screening breakdown (catchment potential, slope, soil/geology, existing structure condition, water demand, land availability, access feasibility, and data quality). Explicitly reports missing data.
- **Intervention Comparison:** Side-by-side analysis of 5 options, leading with **Restoration of Existing Ponds/Structures**, followed by Rooftop RWH, Farm Ponds, Percolation Tanks, and Check Dams. Features transparent cost notes (no fake rupee numbers) and mandatory engineering clearance warnings.
- **Asset Register:** Local storage registry with search, type and condition filtering, full CRUD (Create, Read, Update, Delete with confirmation modal), rectangular tank geometry input ($L \times W \times D$), and CSV/JSON export.
- **Water Monitoring:** Observation logger tracking rainfall events, measured water levels, calculated rectangular storage volumes, and overflow alerts. Includes sensor range validation and clear hydrological distinctions.
- **Maintenance & Inspection Tracker:** Action tracking workflow categorizing siltation, leakages, blockages, and overdue inspections. Filter by status and priority, log resolution actions, and export to CSV.
- **Rainwater Calculation Tool:** Rooftop runoff calculation tool with standard hydrological runoff formula, tank capacity sufficiency evaluation, and realistic domestic consumption context.
- **Reports & Export:** Clean printable audit summary (`window.print()`), complete database JSON backup, and independent CSV exports for assets, observations, and maintenance items.
- **About & Methodology:** Purulia hydrogeology review, CGWB 2022 citations, and engineering disclaimers.
- **ESP32 Firmware Prototype (`firmware/`):** Arduino C++ sketch for ultrasonic depth sensing with noise rejection, rectangular tank volume estimation, overflow alerts, and offline CSV serial streaming.

---

## 5. Planned (Future) Features
- [ ] Bluetooth Low Energy (BLE) direct sync between ESP32 hardware and browser Web Bluetooth API.
- [ ] Bengali language (বাংলা) interface localization.
- [ ] Multi-user synchronization using peer-to-peer CRDTs or optional self-hosted SQLite backend.
- [ ] Offline raster base-layer caching using service workers for 100% disconnected map tiles.

---

## 6. Technology Stack & Decision Rationale
- **Frontend:** React 18 + TypeScript — Type safety ensures calculations and data structures avoid runtime errors.
- **Build Tool:** Vite 6 — Instant HMR in development and clean production bundle creation.
- **Styling:** Vanilla CSS design system (`src/index.css`) — Lightweight, responsive, zero bulky CSS framework dependencies, custom natural water/earth palette.
- **Charts:** Recharts 2.x — SVG-based charting for time-series data.
- **Mapping:** Leaflet 1.9.4 + OpenStreetMap — Lightweight GIS viewer with an automatic offline fallback mode.
- **Storage:** Browser `localStorage` — Local-first architecture; runs anywhere without cloud accounts, backend servers, or internet dependencies.
- **Testing:** Vitest 2.x + `@testing-library/jest-dom` — 27 automated unit tests covering calculations, screening, validation, and storage.
- **Firmware:** Arduino C++ for ESP32.

---

## 7. Installation & Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or newer)
- npm (version 9.0 or newer)

### Step 1: Clone or Navigate to Project
```bash
cd "c:/Users/user/Desktop/JalSetu Purulia"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```
The application will launch at **`http://localhost:3000`**.

### Step 4: Run Automated Tests
```bash
npm test
```
All 27 automated tests will execute and verify formula accuracy, unit conversions, geometry logic, and storage integrity.

### Step 5: Build for Production
```bash
npm run build
```
Generates a minified, optimized production bundle in the `dist/` folder.

---

## 8. How to Load or Reset Demonstration Data
1. Launch the web application (`npm run dev`).
2. On first launch, the simulated dataset (`SAMPLE_DATA`) is loaded automatically into browser storage.
3. To reload the demonstration data at any time, click the **"Reset to Demo Data"** button in the sidebar footer.
4. To start with a clean slate, click **"Clear All Data"**.

---

## 9. Firmware Setup (ESP32)
1. Navigate to the `firmware/` directory.
2. Copy `config.h.example` to `config.h`:
   ```bash
   cp firmware/config.h.example firmware/config.h
   ```
3. Open `firmware/jalsetu_esp32_sensor.ino` in Arduino IDE.
4. Connect an ESP32 board and an HC-SR04 or JSN-SR04T ultrasonic sensor according to the pinout in `firmware/README.md`.
5. Upload the sketch and open the Serial Monitor at **115200 baud** to view real-time CSV depth output.

---

## 10. References & Primary Sources
1. **Central Ground Water Board (CGWB)**, Ministry of Jal Shakti, Government of India:  
   *Report on National Aquifer Mapping & Management Plan in Purulia District, West Bengal (2022)*.  
   - Official Publication Record: [https://cgwb.gov.in/cgwbpnm/public/publication-detail/1092](https://cgwb.gov.in/cgwbpnm/public/publication-detail/1092)  
   - Official Report PDF: [https://www.cgwb.gov.in/old_website/AQM/NAQUIM_REPORT/WEST-BENGAL/Purulia%20Final%20West%20Bengal.pdf](https://www.cgwb.gov.in/old_website/AQM/NAQUIM_REPORT/WEST-BENGAL/Purulia%20Final%20West%20Bengal.pdf)
2. **Indian Standard (IS 15797:2008)**: *Roof Top Rainwater Harvesting — Guidelines*. Bureau of Indian Standards, New Delhi.

---

## 11. Safety & Water Quality Considerations
- **Untreated Rainwater is Non-Potable:** Surface runoff carries microbiological contaminants, dust, and avian waste. Rainwater must not be consumed without physical filtration and certified disinfection (boiling/chlorination/UV).
- **First-Flush:** The initial 1–2 mm of rain must be diverted away from storage.
- **Physical Verification:** Check dams and recharge structures require formal geotechnical design and statutory clearance.

---

## 12. Contributing & License
Contributions are welcome! Please open an issue or submit a pull request with test coverage.

Licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
