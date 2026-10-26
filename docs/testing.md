# Automated Test Suite & Verification: JalSetu Purulia

## 1. Test Overview
JalSetu Purulia features a comprehensive automated test suite built with [Vitest](https://vitest.dev/) and `@testing-library/jest-dom`.

Testing covers:
1. **Rainwater harvesting formulas**: Correctness of runoff calculation, zero handling, overflow estimation.
2. **Input validation**: Rejection of negative rainfall, invalid efficiencies, negative areas.
3. **Geometric calculations**: Rectangular vertical-sided tank volume ($L \times W \times D$).
4. **Sensor reading plausibility**: Rejection of negative depths, blind-zone acoustic echoes, and readings exceeding tank dimensions.
5. **Site screening engine**: 8-factor score breakdown, 5-baseline critical factor enforcement, score suppression under incomplete data, screening impact descriptions, restoration prioritization, disputed land penalties.
6. **Storage layer & CRUD**: Asset persistence, maintenance status transitions, CSV export formatting, corrupted JSON rejection.

## 2. Test Execution Command
To run the automated test suite locally:
```bash
npm test
```
Or with Vitest directly:
```bash
npx vitest run
```

## 3. Actual Test Results (Verified 2026-10-26)
```text
 RUN  v2.1.8 C:/Users/user/Desktop/JalSetu Purulia

 ✓ src/test/calculations.test.ts (17 tests) 9ms
 ✓ src/test/screening.test.ts (7 tests) 6ms
 ✓ src/test/storage.test.ts (6 tests) 6ms

 Test Files  3 passed (3)
      Tests  30 passed (30)
   Start at  17:34:04
   Duration  1.67s (transform 264ms, setup 568ms, collect 402ms, tests 21ms, environment 2.12s, prepare 878ms)
```

## 4. Test Case Matrix

### Suite: `calculations.test.ts` (17 tests)
- `correctly calculates harvestable volume for typical rooftop parameters`: Verifies $25\text{ mm} \times 100\text{ m}^2 \times 0.8 = 2000\text{ L}$.
- `detects overflow when harvest exceeds storage capacity`: Flags 3,000 L excess when 8,000 L harvest enters a 5,000 L tank.
- `returns zero volume when rainfall is zero or area is zero`: Validates non-negative boundary conditions.
- `handles null storage capacity without throwing error`: Ensures uncalibrated tanks don't crash the calculation.
- `throws descriptive error on negative rainfall`: Validates input rejection.
- `throws error when efficiency is out of range 0 to 1`: Enforces physical boundary.
- `throws error on negative catchment area or storage capacity`: Enforces domain constraints.
- `calculates rectangular tank volume correctly`: Tests $4\text{ m} \times 2.5\text{ m} \times 1.5\text{ m} = 15,000\text{ L}$.
- `throws on negative tank dimensions`: Validates geometry guards.
- `validates plausible water depths`: Confirms acceptable sensor readings.
- `rejects negative sensor depths`: Flags sensor anomalies.
- `rejects unrealistic water levels exceeding 50 metres`: Rejects unrealistic sensor spikes.
- `flags warning when level exceeds tank depth by more than 10%`: Detects calibration discrepancies.
- `flags warning for minor overflow within 10%`: Distinguishes minor spillage from catastrophic error.
- `converts mm to metres correctly`: $1000\text{ mm} = 1\text{ m}$.
- `converts litres to cubic metres correctly`: $1000\text{ L} = 1\text{ m}^3$.
- `converts cubic metres to litres correctly`: $1\text{ m}^3 = 1000\text{ L}$.

### Suite: `screening.test.ts` (7 tests)
- `produces a comprehensive score breakdown for a complete site`: Evaluates multi-factor breakdown and percentage calculation for fully documented sites.
- `flags incomplete assessments with isInsufficient and identifies critical missing data`: Confirms that a bare candidate site with missing baseline parameters triggers `isInsufficient = true` and `suitability = 'insufficient_data'`.
- `flags missing catchment area as critical`: Verifies that a site lacking catchment area is marked incomplete with a clear warning recommendation.
- `flags unverified land ownership as critical`: Confirms that an unknown land ownership status prevents final scoring.
- `flags missing water demand as critical`: Verifies that undefined demand prevents unvetted project execution.
- `includes comprehensive screening impact descriptions for all factors`: Asserts that all 8 factors provide engineering impact explanations.
- `favours restoration of fair-condition existing assets`: Verifies that pre-existing structures in fair condition score high (restoration-first).
- `penalises unpermitted or disputed land`: Checks that disputed lands receive score of 1.

### Suite: `storage.test.ts` (6 tests)
- `saves and retrieves assets`: Full CRUD persistence cycle in localStorage.
- `updates an existing asset`: Validates in-place mutation and timestamp updates.
- `deletes an asset by ID`: Verifies cleanup.
- `handles maintenance issue CRUD and status updates`: Validates transition from `open` to `resolved` with action notes.
- `exports assets to valid CSV format with proper escaping`: Verifies comma/quote escaping.
- `imports valid JSON and rejects corrupted payload`: Tests schema validation on import.

## 5. Production Build Verification
Ran `npm run build`:
- TypeScript compiler (`tsc -b`): Passed with zero type errors.
- Vite bundle production minification: Successfully generated `dist/` bundle (HTML, CSS, JS).
