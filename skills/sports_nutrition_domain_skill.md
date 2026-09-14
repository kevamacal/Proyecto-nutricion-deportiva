# Developer Skill: Sports Nutrition & Athletic Performance Domain Verification

> **Skill Identifier**: `sports-nutrition-domain-verification`  
> **Target Role**: Sports Nutrition Domain Specialist Agent

## 1. Skill Purpose

Provides exact formulas, verification steps, and test criteria for validating physiological calculations (BMR, TDEE, basketball & strength training energy expenditures, macronutrient allocations, and hydration demands).

## 2. Core Mathematical Formulas Reference

### Basal Metabolic Rate (BMR) — Mifflin-St Jeor
$$\text{BMR}_{\text{male}} = (10 \times \text{weight (kg)}) + (6.25 \times \text{height (cm)}) - (5 \times \text{age (years)}) + 5$$
$$\text{BMR}_{\text{female}} = (10 \times \text{weight (kg)}) + (6.25 \times \text{height (cm)}) - (5 \times \text{age (years)}) - 161$$

### MET Energy Expenditure Formula
$$\text{Expenditure (kcal)} = \text{MET} \times \text{weight (kg)} \times \left(\frac{\text{duration (minutes)}}{60}\right)$$

### Activity MET Values Lookup
- **Basketball Match (Competitive)**: `MET = 9.0`
- **Basketball Training (Scrimmage)**: `MET = 8.0`
- **Strength Training (Hypertrophy, High Intensity)**: `MET = 7.0`
- **Strength Training (Power/Strength, Heavy)**: `MET = 6.0`

### Post-Workout Recovery Demands
- **Basketball Recovery (Glycogen Resynthesis)**: `weight (kg) * 1.2 g carbs` (Match) or `weight (kg) * 1.0 g carbs` (Training).
- **Basketball Rehydration**: `duration (minutes) * 12.5 ml` (~750 ml per hour).
- **Strength Training Recovery (MPS)**: `max(30.0 g, weight (kg) * 0.35 g protein)`.

## 3. Verification Protocol for Developers

When implementing backend code or API endpoints handling nutritional math:

1. **Verify Python Engine Source**: Ensure the function directly implements equations from `docs/architecture/02_formulas.md`.
2. **Zero-LLM Math Compliance**: Ensure no math is computed dynamically inside LLM prompt string templates.
3. **Automated Unit Tests**: Add test cases covering edge cases (e.g. low weight, female BMR offset, high intensity basketball match expenditure).
