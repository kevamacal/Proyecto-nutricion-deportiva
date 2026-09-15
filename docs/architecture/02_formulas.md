# Deterministic Nutritional & Activity Calculations

## 1. Overview and Deterministic Core Principles

This document defines all mathematical formulas, algorithms, and business rules executed in deterministic code within the backend engine.

### Strict Deterministic Boundaries

1. **Zero LLM Calculations**: The Large Language Model (LLM) agent is **strictly forbidden** from calculating calories, macronutrient targets, energy expenditures, or inventory quantities.
2. **Reproducibility**: All calculations are 100% deterministic, verifiable, and unit-tested. Given identical physical inputs, the system produces exact mathematical outputs.
3. **Execution Pipeline**:

$$\text{User Inputs / Activities} \xrightarrow{\text{Deterministic Engine}} \text{Nutritional Needs Object} \xrightarrow{\text{Structured Payload}} \text{LLM Recipe / Recommender Node}$$

---

## 2. Basal Metabolic Rate (BMR) & Total Daily Energy Expenditure (TDEE)

### 2.1. Basal Metabolic Rate (BMR) — Mifflin-St Jeor Formula

The system uses the **Mifflin-St Jeor** equation, recognized as the most accurate standard for non-clinical populations:

$$\text{BMR}_{\text{male}} = (10 \times \text{weight (kg)}) + (6.25 \times \text{height (cm)}) - (5 \times \text{age (years)}) + 5$$

$$\text{BMR}_{\text{female}} = (10 \times \text{weight (kg)}) + (6.25 \times \text{height (cm)}) - (5 \times \text{age (years)}) - 161$$

### 2.2. Total Daily Energy Expenditure (TDEE)

TDEE incorporates baseline non-sport Physical Activity Level (PAL):

$$\text{TDEE} = \text{BMR} \times \text{PAL Multiplier}$$

| Activity Level (`activity_level`) | PAL Multiplier | Description |
|---|---|---|
| `SEDENTARY` | `1.20` | Desk job, little to no daily movement |
| `MODERATE` | `1.55` | Light daily movement, standing job or moderate walking |
| `ACTIVE` | `1.725` | Active job, high daily step count (10k+ steps) |
| `VERY_ACTIVE` | `1.90` | Heavy physical labor or very high daily movement |

### 2.3. Caloric Target Adjustment by Body Composition Goal

$$\text{Daily Calories Target} = \text{TDEE} \times (1 + \text{Goal Adjustment})$$

| Goal (`body_composition_goal`) | Adjustment Factor | Caloric Delta | Purpose |
|---|---|---|---|
| `MAINTAIN` | `0.00` | $0\text{ kcal}$ | Energy balance maintenance |
| `BULK` | `+0.12` | $+10\% \text{ to } +15\%$ ($\approx +300 - 400\text{ kcal}$) | Controlled hypercaloric muscle growth |
| `CUT` | `-0.20` | $-15\% \text{ to } -20\%$ ($\approx -400 - 500\text{ kcal}$) | Hypocaloric fat loss |
| `RECOMP` | `0.00` | $0\text{ kcal}$ | Body recomposition at maintenance |

### 2.4. Macronutrient Distribution Target Algorithm

Macronutrient targets are derived deterministically in physiological order based on body weight, goal, and energy availability:

#### Step 1: Protein Target Calculation

$$\text{Daily Protein Target (g)} = \text{weight (kg)} \times \text{Protein Factor}$$

| Nutritional Goal (`nutritional_goal`) | Protein Factor ($\text{g/kg}$) | Focus Area |
|---|---|---|
| `HYPERTROPHY` | `2.0 g/kg` | Maximizing muscle protein synthesis |
| `PERFORMANCE` | `1.8 g/kg` | Athletic endurance, recovery & work capacity |
| `FAT_LOSS_FOCUS` | `2.3 g/kg` | Satiety & lean tissue preservation in deficit |
| `HEALTH` | `1.5 g/kg` | General balanced healthy nutrition |

$$\text{Protein Calories (kcal)} = \text{Daily Protein Target (g)} \times 4\text{ kcal/g}$$

#### Step 2: Fat Target Calculation

Fat is calculated on a bodyweight basis ($\text{g/kg}$) to ensure endocrine & hormonal health without over-saturating caloric intake, bounded between $20\%$ (minimum safety floor) and $30\%$ (maximum cap) of total daily calories:

$$\text{Fat Factor} = \begin{cases} 0.9\text{ g/kg} & \text{if } \text{nutritional\textunderscore{}goal} = \text{'FAT\_LOSS\_FOCUS'} \\ 1.0\text{ g/kg} & \text{otherwise} \end{cases}$$

$$\text{Raw Fat Target (g)} = \text{weight (kg)} \times \text{Fat Factor}$$

$$\text{Daily Fat Target (g)} = \text{Clamp}\left(\text{Raw Fat Target (g)}, \, \frac{\text{Daily Calories} \times 0.20}{9}, \, \frac{\text{Daily Calories} \times 0.30}{9}\right)$$

$$\text{Fat Calories (kcal)} = \text{Daily Fat Target (g)} \times 9\text{ kcal/g}$$

#### Step 3: Carbohydrate Target Calculation

Carbohydrates absorb all remaining daily energy after protein and fat allocations to maximize glycogen replenishment:

$$\text{Carbs Calories (kcal)} = \text{Daily Calories Target} - (\text{Protein Calories} + \text{Fat Calories})$$

$$\text{Daily Carbs Target (g)} = \frac{\text{Carbs Calories (kcal)}}{4\text{ kcal/g}}$$

---

## 3. Basketball Energy Expenditure & Recovery Demands

### 3.1. Energy Expenditure Calculation (MET Method)

Basketball expenditure is calculated using Metabolic Equivalent of Task (MET) values. To ensure robust backend execution, the MET value is determined via a complete lookup matrix covering all intensity levels (`LOW`, `MEDIUM`, `HIGH`, `VERY_HIGH`):

$$\text{Expenditure (kcal)} = \text{MET} \times \text{weight (kg)} \times \left(\frac{\text{duration (minutes)}}{60}\right)$$

#### Basketball MET Lookup Matrix

| Session Category (`session_category`) | `LOW` | `MEDIUM` | `HIGH` | `VERY_HIGH` | Context Description |
|---|---|---|---|---|---|
| `TRAINING` | `5.0` | `6.5` | `8.0` | `9.0` | Tactical drills (`LOW`), scrimmage (`HIGH`), intensive drills (`VERY_HIGH`) |
| `MATCH` | `6.5` | `8.0` | `9.0` | `10.0` | Light match minutes (`LOW`), competitive match (`HIGH`), playoff intensity (`VERY_HIGH`) |

### 3.2. Basketball Post-Session Recovery Demands

High-intensity basketball causes rapid muscle glycogen depletion and fluid loss through sweating.

#### 1. Glycogen Resynthesis Demand (Carbohydrates)
$$\text{Carb Recovery Demand (g)} = \begin{cases} \text{weight (kg)} \times 1.0 & \text{if session category = TRAINING} \\ \text{weight (kg)} \times 1.2 & \text{if session category = MATCH} \end{cases}$$

#### 2. Rehydration Demand (Fluid)
$$\text{Hydration Demand (ml)} = \text{duration (minutes)} \times 12.5\text{ ml/min} \quad (\approx 750\text{ ml per hour of play})$$

#### 3. Output Context Tag
$$\text{recovery priority} = \text{'GLYCOGEN REPLETON AND HYDRATION'}$$

---

## 4. Strength Training (Gym) Expenditure & Recovery Demands

### 4.1. Energy Expenditure Calculation (MET Method)

Strength training expenditure accounts for exercise type, load, volume, and rest intervals. The system maps all combinations of `training_type` and `intensity` to guarantee no unhandled execution paths:

$$\text{Expenditure (kcal)} = \text{MET} \times \text{weight (kg)} \times \left(\frac{\text{duration (minutes)}}{60}\right)$$

#### Strength Training MET Lookup Matrix

| Training Type (`training_type`) | `LOW` | `MEDIUM` | `HIGH` | `VERY_HIGH` | Session Context & Characteristics |
|---|---|---|---|---|---|
| `STRENGTH` / `POWER` | `4.0` | `5.0` | `6.0` | `7.0` | Heavy loads (1-5 reps), long rest intervals (3-5 min) |
| `HYPERTROPHY` | `4.5` | `6.0` | `7.0` | `8.0` | Moderate loads (8-12 reps), moderate rest intervals (60-90 s) |
| `HYBRID` / `ENDURANCE` | `5.0` | `6.5` | `7.5` | `9.0` | Circuit training, high volume, minimal rest intervals (<45 s) |

### 4.2. Strength Training Post-Session Recovery Demands

Resistance training triggers mechanical tension and micro-tears in muscle fibers, requiring an immediate post-workout amino acid spike.

#### 1. Muscle Protein Synthesis (MPS) Recovery Demand
$$\text{Protein Recovery Demand (g)} = \max\left(30.0, \, \text{weight (kg)} \times 0.35\right)$$

#### 2. Glycogen Replenishment Demand
$$\text{Carb Recovery Demand (g)} = \text{weight (kg)} \times 0.60$$

#### 3. Output Context Tag
$$\text{recovery priority} = \text{'MUSCLE PROTEIN SYNTHESIS AND REPAIR'}$$

---

## 5. Current Nutritional State & Remaining Targets

### 5.1. Aggregation of Consumed Intakes

For any given day $T$:

$$\text{Consumed}_{\text{calories}} = \sum_{i \in \text{Meals}_T} \text{Meal}_i.\text{total calories (kcal)}$$

$$\text{Consumed}_{\text{protein}} = \sum_{i \in \text{Meals}_T} \text{Meal}_i.\text{total protein (g)}$$

$$\text{Consumed}_{\text{carbs}} = \sum_{i \in \text{Meals}_T} \text{Meal}_i.\text{total carbs (g)}$$

$$\text{Consumed}_{\text{fat}} = \sum_{i \in \text{Meals}_T} \text{Meal}_i.\text{total fat (g)}$$

### 5.2. Aggregation of Activity Expenditure

$$\text{Expended}_{\text{activities}} = \sum_{j \in \text{Activities}_T} \text{Activity}_j.\text{estimated expenditure (kcal)}$$

### 5.3. Dynamic Adjusted Daily Targets

When physical activity occurs on day $T$, energy expenditure increases the caloric budget:

$$\text{Adjusted Calories Target} = \text{Daily Calories Target} + \text{Expended}_{\text{activities}}$$

$$\text{Adjusted Carbs Target (g)} = \text{Daily Carbs Target} + \left(\frac{\text{Expended}_{\text{activities}} \times 0.60}{4\text{ kcal/g}}\right)$$

### 5.4. Remaining Needs Math

$$\text{Remaining Calories (kcal)} = \text{Adjusted Calories Target} - \text{Consumed}_{\text{calories}}$$

$$\text{Remaining Protein (g)} = \text{Daily Protein Target} - \text{Consumed}_{\text{protein}}$$

$$\text{Remaining Carbs (g)} = \text{Adjusted Carbs Target} - \text{Consumed}_{\text{carbs}}$$

$$\text{Remaining Fat (g)} = \text{Daily Fat Target} - \text{Consumed}_{\text{fat}}$$

---

## 6. Deterministic Inventory Recommendation Pre-Filtering Algorithm

Before passing candidate ingredients to the LLM agent, the deterministic engine filters and ranks pantry inventory items:

### Algorithm Steps

1. **Status & Quantity Filter**:
   $$\text{Filter: } \text{InventoryItem.status} = \text{'AVAILABLE'} \quad \text{AND} \quad \text{InventoryItem.quantity} > 0$$

2. **Expiration Urgency Sorting**:
   Sort items by `expiration_date ASC` (nulls last) to prioritize consuming expiring foods first.

3. **Macronutrient Profile Classification**:
   For each item, compute energy density per serving:
   
   - **Protein-Dense**: $\frac{\text{protein (g)} \times 4}{\text{calories (kcal)}} \ge 0.35$
   - **Carb-Dense**: $\frac{\text{carbohydrates (g)} \times 4}{\text{calories (kcal)}} \ge 0.55$
   - **Fat-Dense**: $\frac{\text{fat (g)} \times 9}{\text{calories (kcal)}} \ge 0.50$

4. **Need-Driven Inventory Selection**:
   - If $\text{Remaining Protein} > 30\text{g}$: Filter and include all `Protein-Dense` inventory items.
   - If $\text{Remaining Carbs} > 50\text{g}$: Filter and include all `Carb-Dense` inventory items.

### Structured Output Payload Example for LLM

```json
{
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "remaining_targets": {
    "remaining_calories_kcal": 650.0,
    "remaining_protein_g": 42.5,
    "remaining_carbs_g": 75.0,
    "remaining_fat_g": 18.0
  },
  "recovery_context": {
    "sport": "BASKETBALL",
    "session_type": "MATCH",
    "recovery_priority": "GLYCOGEN_REPLETON_AND_HYDRATION",
    "fluid_recommendation_ml": 1250.0
  },
  "available_inventory": [
    {
      "food_item_id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "name": "Chicken breast",
      "available_quantity": 400.0,
      "unit": "g",
      "density_class": "PROTEIN_DENSE",
      "expiration_date": "2026-09-12"
    },
    {
      "food_item_id": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
      "name": "White rice",
      "available_quantity": 1000.0,
      "unit": "g",
      "density_class": "CARB_DENSE",
      "expiration_date": null
    }
  ]
}
```
