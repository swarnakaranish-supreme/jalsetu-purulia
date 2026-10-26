# Site Suitability Screening Methodology

## 1. Purpose & Scope
This document details the transparent, rule-based screening engine implemented in `src/lib/screening.ts`.

> **CRITICAL DISCLAIMER:**  
> The screening method in JalSetu Purulia is a **provisional demonstration screening tool**.  
> The scoring rules and weights are transparent heuristics designed to structure field observations.  
> **They are NOT a scientifically validated prediction of groundwater recharge or engineering feasibility.**  
> No dam, check dam, recharge shaft, or subsurface barrier may ever be constructed solely on the basis of this score. All decisions require on-site hydrogeological investigation, yield testing, and technical approval by competent authorities.

## 2. Factor Breakdown & Weights

| Factor Name | Weight | Scoring Range | Baseline Critical? | Rationale & Inclusion Reason |
|---|---|---|---|---|
| **1. Catchment Area Potential** | 15% (0.15) | 0 – 10 | **YES** | Measures immediate runoff collection potential based on plan area. Rooftops receive a bonus due to higher runoff coefficients (0.8 vs 0.3 for soil). Without catchment area, harvest potential cannot be calculated. |
| **2. Slope Suitability** | 10% (0.10) | 0 – 10 | **YES** | Evaluates terrain grade. Gentle slopes (2–5%) are ideal for controlled collection. Flat land (&lt;2%) is prone to waterlogging; steep slopes (&gt;10%) suffer high erosion risk. Unknown slope poses severe safety/scour hazards. |
| **3. Soil & Geology** | 15% (0.15) | 0 – 10 | **YES** | Identifies formation permeability. Purulia's laterite and weathered gneiss mantle offer moderate percolation, while massive unweathered hard rock and heavy clay severely impede recharge. Unknown soil leaves recharge feasibility undetermined. |
| **4. Existing Structure Condition** | 15% (0.15) | 0 – 10 | No | **Restoration-First Principle:** High scores (7–8) are awarded to structures in 'Fair' condition where desilting or bund repair can restore full storage faster and cheaper than new construction. |
| **5. Water Demand** | 10% (0.10) | 0 – 10 | **YES** | Checks if there is an identified community, domestic, or agricultural need nearby so harvested water will be utilized productively. Interventions without defined demand risk abandonment. |
| **6. Land Availability & Consent** | 15% (0.15) | 0 – 10 | **YES** | Prevents administrative or social deadlocks. Government and community lands with consensus score highest (7–8); unpermitted or disputed lands receive near-zero (1). Unverified/unknown land status prevents legal execution. |
| **7. Access & Feasibility** | 10% (0.10) | 0 – 10 | No | Checks whether repair machinery, desilting tractors, or maintenance workers can physically reach the site. |
| **8. Data Quality & Evidence** | 10% (0.10) | 0 – 10 | No | Scores the completeness of the observation. Sites with verified GPS coordinates, inspection dates, and documented constraints receive higher confidence. |

## 3. Handling Missing Information & Score Suppression
Unlike typical software that arbitrarily defaults missing values to zeros or averages and produces misleading low scores (which may look like a complete assessment that failed), JalSetu Purulia explicitly enforces rigorous completeness checks:

1. **Five Baseline Critical Factors**:
   - Catchment Area ($> 0\text{ m}^2$)
   - Terrain Slope ($\ne \text{unknown}$)
   - Soil / Geology Formation ($\ne \text{unknown}$ or specific geological notes provided)
   - Land Ownership / Permission ($\ne \text{unknown}$)
   - Identified Water Demand (non-empty specification)
2. **"Insufficient Information for Assessment" Banner**:
   If **any** of the 5 baseline critical factors are missing or unknown, the algorithm sets `isInsufficient = true`.
3. **Score Suppression**:
   When `isInsufficient = true`, the system **suppresses the numerical percentage score** (displaying *"Score Indeterminate / Inputs Incomplete"*). It refuses to present an incomplete survey as a reliable low score.
4. **Transparent Factor Impact Explanations**:
   The screening panel explicitly lists which critical baseline parameters are missing, explains the exact screening impact of each factor, and details how the missing data impacts the decision.

## 4. Scoring Heuristic Calculation (When Inputs Complete)
When all critical baseline factors are present:
Let $S_i$ be the score of factor $i$ ($0 \le S_i \le 10$), and $W_i$ be its weight ($\sum W_i = 1.0$).
$$\text{Total Score} = \sum_{i=1}^{8} (S_i \times W_i)$$
$$\text{Percentage} = \frac{\text{Total Score}}{\text{Max Possible Score}} \times 100$$

- **$\ge 70\%$**: May warrant further detailed assessment by a qualified engineer.
- **$40\% - 69\%$**: Moderate potential with notable gaps or constraints.
- **$&lt; 40\%$**: High constraints or site unfavourability.
