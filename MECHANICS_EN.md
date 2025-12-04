# WCST — Game Mechanics and Scoring

This document details the functioning of the Wisconsin Card Sorting Test implemented in this application, the game rules, error classification, and score calculation.

---

## Overview

The WCST is a neuropsychological test that assesses executive functions, specifically:
- Cognitive flexibility (ability to change strategies)
- Perseveration (tendency to repeat a strategy that has become ineffective)
- Set maintenance (ability to maintain a rule over multiple trials)

The participant must match a test card ("deck card") to one of the four key cards based on an implicit rule (color, shape, or number). The rule changes periodically without warning.

---

## 1. Stimuli and Cards

### Key Cards (Fixed)
Four cards are always visible:
1. **Red, Triangle, 1**
2. **Green, Star, 2**
3. **Yellow, Cross, 3**
4. **Blue, Circle, 4**

### Deck Card (Variable)
In each trial, a new card is presented. It has three attributes:
- **Color**: red, green, yellow, or blue
- **Shape**: triangle, star, cross, or circle
- **Number**: 1, 2, 3, or 4 symbols

The full deck contains **64 cards** (4 colors × 4 shapes × 4 numbers), shuffled deterministically via a seed.

---

## 2. Classification Rules

At any given time, only one rule is in force among:
1. **Color**: match by color (e.g., red → card 1)
2. **Shape**: match by shape (e.g., star → card 2)
3. **Number**: match by number (e.g., 3 symbols → card 3)

The rule is **never explicitly communicated**. The participant must deduce it from the feedback ("Correct" or "Incorrect").

### Rule Order
The current implementation uses a fixed sequence:
1. **Color** (first rule)
2. **Shape** (after 10 consecutive correct)
3. **Number** (after 10 consecutive correct)
4. Return to **Color** (and so on)

---

## 3. Trial Procedure

1. **Presentation**: the deck card is displayed.
2. **Response**: the participant chooses one of the 4 key cards.
3. **Evaluation**:
   - Correct if the attribute in force (color/shape/number) matches between the deck card and the chosen card.
   - Incorrect otherwise.
4. **Feedback**: "Correct" (green) or "Incorrect" (red).
5. **Advancement**: new deck card for the next trial.

---

## 4. Rule Change (Set-Shift)

### Shift Criterion
After **10 consecutive correct responses** under the same rule, the rule changes automatically (without warning).

Example:
- Trials 1-10: rule = color, 10 correct → **shift**
- Trials 11-20: rule = shape, 10 correct → **shift**
- Trials 21-30: rule = number, etc.

### Categories Completed
Each series of 10 correct = **1 category completed**.  
Standard end condition: **6 categories** or max trials reached.

---

## 5. Error Classification

Each incorrect response is classified into:

### 5.1 Perseverative Error
The participant continues to use the **previous rule** (the one active before the last shift).

**Criteria**:
- Incorrect response
- AND the attribute of the previous rule matches between the deck card and the chosen card

**Example**:
- Current rule: **shape**
- Previous rule: **color**
- Deck card: red, star, 2
- Participant chooses: red, triangle, 1 (card 1)
- Result: **perseverative error** (color match = old rule)

**Interpretation**: difficulty abandoning an obsolete strategy.

### 5.2 Non-Perseverative Error
Incorrect response that does **not** match the previous rule.

**Example**:
- Current rule: **shape**
- Previous rule: **color**
- Deck card: green, cross, 2
- Participant chooses: blue, circle, 4 (card 4)
- Result: **non-perseverative error** (neither shape nor color match)

**Interpretation**: random response or unsuitable strategy.

### 5.3 Set-Maintenance Error
Error occurring **after 5 or more consecutive correct responses** under the current rule, but before reaching 10 (the shift threshold).

**Criterion**:
- Incorrect response
- AND `consecutive_correct >= 5`

**Interpretation**: difficulty maintaining a known rule (distractibility, attentional problem).

**Note**: an error can be both perseverative (or non-perseverative) **and** a set-maintenance error.

---

## 6. Extracted Metrics

### 6.1 Raw Data (Per Trial, in CSV)

Each row in the CSV corresponds to a trial and contains:

| Field | Description |
|-------|-------------|
| `participant_id` | Participant ID (or "anon" if empty) |
| `session_id` | Unique session ID |
| `trial_index` | Trial number (0-indexed) |
| `deck_color`, `deck_shape`, `deck_number` | Deck card attributes |
| `selected_key_index` | Index of chosen card (0-3) |
| `correct` | `true` if correct, `false` otherwise |
| `error_type` | `perseverative`, `non-perseverative` or empty if correct |
| `set_maintenance_error` | `true` if set-maintenance error |
| `rule_in_force` | Active rule at the trial moment (`color`, `shape`, `number`) |
| `prev_rule` | Previous rule (empty if no shift yet) |
| `categories_completed` | Number of categories completed so far |
| `consecutive_correct` | Number of consecutive correct responses before this trial |
| `response_time_ms` | Response time in milliseconds |
| `timestamp_utc` | UTC timestamp (ISO 8601) |
| `seed` | Randomization seed (reproducibility) |
| `device_info` | Platform and user-agent |
| `app_version` | App version |

### 6.2 Aggregated Metrics (Post-hoc Calculation)

From the CSV, one can calculate:

#### Basic Scores
- **Total trials**: number of rows
- **Total correct**: `COUNT(correct = true)`
- **Total errors**: `COUNT(correct = false)`
- **Categories completed**: final value of `categories_completed`

#### Errors
- **Perseverative errors**: `COUNT(error_type = 'perseverative')`
- **Non-perseverative errors**: `COUNT(error_type = 'non-perseverative')`
- **Set-maintenance errors**: `COUNT(set_maintenance_error = true)`
- **% Perseverative errors**: `(persev. errors / total errors) × 100`

#### Performance
- **Trials to first category**: `trial_index` of the first row where `categories_completed = 1`
- **Mean Response Time**: `MEAN(response_time_ms)`
- **Mean RT on correct**: `MEAN(response_time_ms WHERE correct = true)`
- **Mean RT on error**: `MEAN(response_time_ms WHERE correct = false)`

#### Cognitive Flexibility
- **Shift efficiency**: number of correct responses needed to reach 10 after each shift (detected by `prev_rule` changing)
- **Failure to maintain set**: number of maintenance errors (indicator of sustained attention)

---

## 7. Step-by-Step Calculation (Example)

### Fictional Session (First 10 Trials)

| Trial | Deck card | Chosen | Rule | Prev | Correct | Consec | Error type | Categories |
|-------|-----------|--------|------|------|---------|--------|------------|------------|
| 0 | Red,Star,2 | 0 (R,Tri,1) | color | - | ✓ | 0 → 1 | - | 0 |
| 1 | Green,Cross,3 | 1 (G,Star,2) | color | - | ✓ | 1 → 2 | - | 0 |
| 2 | Blue,Tri,1 | 3 (B,Cir,4) | color | - | ✓ | 2 → 3 | - | 0 |
| 3 | Yellow,Cir,4 | 2 (Y,Cross,3) | color | - | ✓ | 3 → 4 | - | 0 |
| 4 | Red,Cir,2 | 0 (R,Tri,1) | color | - | ✓ | 4 → 5 | - | 0 |
| 5 | Green,Tri,3 | 1 (G,Star,2) | color | - | ✓ | 5 → 6 | - | 0 |
| 6 | Blue,Star,1 | 2 (Y,Cross,3) | color | - | ✗ | 6 → 0 | non-persev | 0 |
| 7 | Red,Cross,4 | 0 (R,Tri,1) | color | - | ✓ | 0 → 1 | - | 0 |
| 8 | Green,Cir,2 | 1 (G,Star,2) | color | - | ✓ | 1 → 2 | - | 0 |
| 9 | Yellow,Tri,1 | 2 (Y,Cross,3) | color | - | ✓ | 2 → 3 | - | 0 |

**Observations**:
- Trial 6: error after 6 consecutive correct → **set-maintenance error** (not perseverative as no previous rule yet).
- `consecutive_correct` counter reset to 0 after each error.

---

## 8. Determinism and Reproducibility

### Seed
Each session captures a **numeric seed** which determines:
- The shuffle order of the 64 deck cards
- The exact sequence of cards presented

With the same seed, the session will be identical (same card order).

### Replay
To replay a session:
1. Note the `seed` from the CSV
2. Relaunch the app with this seed
3. Reproduce the same choices → same sequence of events

---

## 9. Clinical Interpretation (Indicative)

| Metric | Interpretation |
|--------|----------------|
| **Categories completed < 6** | Difficulty reaching criterion (reduced flexibility) |
| **High perseverative errors** | Cognitive rigidity, difficulty inhibiting a strategy |
| **High non-perseverative errors** | Random responses, disorientation |
| **Set-maintenance errors** | Distractibility, attentional problems |
| **Highly variable RT** | Impulsivity or excessive hesitation |

**⚠️ Warning**: this implementation is a **research tool**, not a validated clinical device. Clinical norms and thresholds require psychometric validation.

---

## 10. Limitations and Differences from Standard WCST

### Modifiable Parameters
- **Corrects for shift**: 10 (standard), adjustable in code
- **Max trials**: 128 default, configurable in UI
- **Target categories**: 6 (standard)

### Potential Differences
- **Immediate feedback**: in some paper versions, feedback may be delayed
- **No strict "failure to maintain set"**: the threshold of 5 correct is indicative
- **No WCST-64 scoring**: this version uses 64 cards but does not implement all standard scores (e.g., conceptual level responses)

### Possible Extensions
- Add `conceptual_level_responses` (series of 3+ consecutive correct)
- Calculate `trials_to_first_category`
- Implement norms by age/population
- Multi-language support for feedback

---

## 11. Calculation Formulas (Post-processing)

### Python (pandas)
```python
import pandas as pd

df = pd.read_csv('wcst_session.csv')

# Basic metrics
total_trials = len(df)
total_correct = df['correct'].sum()
total_errors = total_trials - total_correct
categories = df['categories_completed'].iloc[-1]

# Errors
persev = (df['error_type'] == 'perseverative').sum()
non_persev = (df['error_type'] == 'non-perseverative').sum()
set_maint = df['set_maintenance_error'].sum()

# Response time
mean_rt = df['response_time_ms'].mean()
mean_rt_correct = df[df['correct']]['response_time_ms'].mean()
mean_rt_error = df[~df['correct']]['response_time_ms'].mean()

# First shift
first_shift_trial = df[df['prev_rule'].notna()].index[0] if any(df['prev_rule'].notna()) else None

print(f"Categories: {categories}")
print(f"Perseverative errors: {persev} ({100*persev/total_errors:.1f}%)")
print(f"Maintenance errors: {set_maint}")
print(f"Mean RT: {mean_rt:.0f} ms")
```

### R
```r
library(dplyr)

df <- read.csv('wcst_session.csv')

summary <- df %>%
  summarise(
    trials = n(),
    correct = sum(correct),
    errors = n() - sum(correct),
    persev = sum(error_type == 'perseverative', na.rm=TRUE),
    non_persev = sum(error_type == 'non-perseverative', na.rm=TRUE),
    set_maint = sum(set_maintenance_error, na.rm=TRUE),
    mean_rt = mean(response_time_ms),
    categories = last(categories_completed)
  )

print(summary)
```

---

## 12. References and Resources

- **Grant, D. A., & Berg, E. (1948)**. A behavioral analysis of degree of reinforcement and ease of shifting to new responses in a Weigl-type card-sorting problem. *Journal of Experimental Psychology*, 38(4), 404.
- **Heaton, R. K. (1981)**. *Wisconsin Card Sorting Test manual*. Psychological Assessment Resources.
- **Nyhus, E., & Barceló, F. (2009)**. The Wisconsin Card Sorting Test and the cognitive assessment of prefrontal executive functions: A critical update. *Brain and Cognition*, 71(3), 437-451.

---

## Contact and Contributions

For any questions about mechanics or calculations:
- Open a GitHub issue
- Consult source code: `src/engine/wcst.ts` (rule logic), `src/App.tsx` (UI and logging)

**Version**: 0.1.0  
**Last Update**: November 2025
