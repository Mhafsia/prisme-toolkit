# WCST — Mécanique de jeu et scoring

Ce document décrit en détail le fonctionnement du Wisconsin Card Sorting Test implémenté dans cette application, les règles de jeu, la classification des erreurs et le calcul des scores.

---

## Vue d'ensemble

Le WCST est un test neuropsychologique qui évalue les fonctions exécutives, notamment :
- La flexibilité cognitive (capacité à changer de stratégie)
- La persévération (tendance à répéter une stratégie devenue inefficace)
- Le maintien de set (capacité à maintenir une règle sur plusieurs essais)

Le participant doit associer une carte de test (« carte du paquet ») à l'une des quatre cartes clés en fonction d'une règle implicite (couleur, forme ou nombre). La règle change périodiquement sans avertissement.

---

## 1. Stimuli et cartes

### Cartes clés (fixes)
Quatre cartes sont toujours visibles :
1. **Rouge, Triangle, 1**
2. **Vert, Étoile, 2**
3. **Jaune, Croix, 3**
4. **Bleu, Cercle, 4**

### Carte du paquet (variable)
À chaque essai, une nouvelle carte est présentée. Elle possède trois attributs :
- **Couleur** : rouge, vert, jaune ou bleu
- **Forme** : triangle, étoile, croix ou cercle
- **Nombre** : 1, 2, 3 ou 4 symboles

Le deck complet contient **64 cartes** (4 couleurs × 4 formes × 4 nombres), mélangées de manière déterministe via un seed.

---

## 2. Règles de classification

À tout moment, une seule règle est en vigueur parmi :
1. **Couleur** : associer selon la couleur (ex. rouge → carte 1)
2. **Forme** : associer selon la forme (ex. étoile → carte 2)
3. **Nombre** : associer selon le nombre (ex. 3 symboles → carte 3)

La règle est **jamais communiquée explicitement**. Le participant doit la déduire du feedback (« Correct » ou « Incorrect »).

### Ordre des règles
L'implémentation actuelle utilise une séquence fixe :
1. **Couleur** (première règle)
2. **Forme** (après 10 corrects consécutifs)
3. **Nombre** (après 10 corrects consécutifs)
4. Retour à **Couleur** (et ainsi de suite)

---

## 3. Déroulement d'un essai

1. **Présentation** : la carte du paquet est affichée.
2. **Réponse** : le participant choisit une des 4 cartes clés.
3. **Évaluation** :
   - Correcte si l'attribut en vigueur (couleur/forme/nombre) correspond entre la carte du paquet et la carte choisie.
   - Incorrecte sinon.
4. **Feedback** : « Correct » (vert) ou « Incorrect » (rouge).
5. **Avancement** : nouvelle carte du paquet pour l'essai suivant.

---

## 4. Changement de règle (set-shift)

### Critère de shift
Après **10 réponses correctes consécutives** sous une même règle, la règle change automatiquement (sans avertissement).

Exemple :
- Essais 1-10 : règle = couleur, 10 corrects → **shift**
- Essais 11-20 : règle = forme, 10 corrects → **shift**
- Essais 21-30 : règle = nombre, etc.

### Catégories complétées
Chaque série de 10 corrects = **1 catégorie complétée**.  
Condition de fin classique : **6 catégories** ou nombre max d'essais atteint.

---

## 5. Classification des erreurs

Chaque réponse incorrecte est classée en :

### 5.1 Erreur persévérative
Le participant continue à utiliser la **règle précédente** (celle qui était active avant le dernier shift).

**Critères** :
- Réponse incorrecte
- ET l'attribut de la règle précédente correspond entre la carte du paquet et la carte choisie

**Exemple** :
- Règle actuelle : **forme**
- Règle précédente : **couleur**
- Carte du paquet : rouge, étoile, 2
- Participant choisit : rouge, triangle, 1 (carte 1)
- Résultat : **erreur persévérative** (match couleur = ancienne règle)

**Interprétation** : difficulté à abandonner une stratégie devenue obsolète.

### 5.2 Erreur non-persévérative
Réponse incorrecte qui ne correspond **pas** à la règle précédente.

**Exemple** :
- Règle actuelle : **forme**
- Règle précédente : **couleur**
- Carte du paquet : vert, croix, 2
- Participant choisit : bleu, cercle, 4 (carte 4)
- Résultat : **erreur non-persévérative** (ni forme ni couleur ne correspondent)

**Interprétation** : réponse aléatoire ou stratégie inadaptée.

### 5.3 Erreur de maintien de set (set-maintenance)
Erreur survenant **après 5 réponses correctes consécutives ou plus** sous la règle actuelle, mais avant d'atteindre 10 (le seuil de shift).

**Critère** :
- Réponse incorrecte
- ET `consecutive_correct >= 5`

**Interprétation** : difficulté à maintenir une règle connue (distractibilité, problème attentionnel).

**Note** : une erreur peut être à la fois persévérative (ou non-persévérative) **et** de maintien de set.

---

## 6. Métriques extraites

### 6.1 Données brutes (par essai, dans le CSV)

Chaque ligne du CSV correspond à un essai et contient :

| Champ | Description |
|-------|-------------|
| `participant_id` | ID du participant (ou "anon" si vide) |
| `session_id` | ID unique de la session |
| `trial_index` | Numéro de l'essai (0-indexé) |
| `deck_color`, `deck_shape`, `deck_number` | Attributs de la carte du paquet |
| `selected_key_index` | Index de la carte choisie (0-3) |
| `correct` | `true` si correct, `false` sinon |
| `error_type` | `perseverative`, `non-perseverative` ou vide si correct |
| `set_maintenance_error` | `true` si erreur de maintien de set |
| `rule_in_force` | Règle active au moment de l'essai (`color`, `shape`, `number`) |
| `prev_rule` | Règle précédente (vide si aucun shift encore) |
| `categories_completed` | Nombre de catégories complétées jusqu'à présent |
| `consecutive_correct` | Nombre de réponses correctes consécutives avant cet essai |
| `response_time_ms` | Temps de réaction en millisecondes |
| `timestamp_utc` | Horodatage UTC (ISO 8601) |
| `seed` | Seed de randomisation (reproductibilité) |
| `device_info` | Plateforme et user-agent |
| `app_version` | Version de l'app |

### 6.2 Métriques agrégées (calculées post-hoc)

À partir du CSV, on peut calculer :

#### Scores de base
- **Total d'essais** : nombre de lignes
- **Total correct** : `COUNT(correct = true)`
- **Total d'erreurs** : `COUNT(correct = false)`
- **Catégories complétées** : valeur finale de `categories_completed`

#### Erreurs
- **Erreurs persévératives** : `COUNT(error_type = 'perseverative')`
- **Erreurs non-persévératives** : `COUNT(error_type = 'non-perseverative')`
- **Erreurs de maintien de set** : `COUNT(set_maintenance_error = true)`
- **% d'erreurs persévératives** : `(erreurs persev. / total erreurs) × 100`

#### Performance
- **Essais jusqu'à la première catégorie** : `trial_index` de la première ligne où `categories_completed = 1`
- **Temps de réaction moyen** : `MEAN(response_time_ms)`
- **TR moyen sur réponses correctes** : `MEAN(response_time_ms WHERE correct = true)`
- **TR moyen sur erreurs** : `MEAN(response_time_ms WHERE correct = false)`

#### Flexibilité cognitive
- **Efficacité de shift** : nombre de corrects nécessaires pour atteindre 10 après chaque shift (détecté par `prev_rule` qui change)
- **Failure to maintain set** : nombre d'erreurs de maintien (indicateur d'attention soutenue)

---

## 7. Calcul pas-à-pas (exemple)

### Session fictive (10 premiers essais)

| Trial | Deck card | Choisie | Règle | Prev | Correct | Consec | Error type | Catégories |
|-------|-----------|---------|-------|------|---------|--------|------------|------------|
| 0 | Rouge,Étoile,2 | 0 (R,Tri,1) | color | - | ✓ | 0 → 1 | - | 0 |
| 1 | Vert,Croix,3 | 1 (V,Éto,2) | color | - | ✓ | 1 → 2 | - | 0 |
| 2 | Bleu,Tri,1 | 3 (B,Cer,4) | color | - | ✓ | 2 → 3 | - | 0 |
| 3 | Jaune,Cer,4 | 2 (J,Croi,3) | color | - | ✓ | 3 → 4 | - | 0 |
| 4 | Rouge,Cer,2 | 0 (R,Tri,1) | color | - | ✓ | 4 → 5 | - | 0 |
| 5 | Vert,Tri,3 | 1 (V,Éto,2) | color | - | ✓ | 5 → 6 | - | 0 |
| 6 | Bleu,Éto,1 | 2 (J,Croi,3) | color | - | ✗ | 6 → 0 | non-persev | 0 |
| 7 | Rouge,Croi,4 | 0 (R,Tri,1) | color | - | ✓ | 0 → 1 | - | 0 |
| 8 | Vert,Cer,2 | 1 (V,Éto,2) | color | - | ✓ | 1 → 2 | - | 0 |
| 9 | Jaune,Tri,1 | 2 (J,Croi,3) | color | - | ✓ | 2 → 3 | - | 0 |

**Observations** :
- Essai 6 : erreur après 6 corrects consécutifs → **erreur de maintien de set** (pas persévérative car pas de règle précédente encore).
- Compteur `consecutive_correct` remis à 0 après chaque erreur.

---

## 8. Déterminisme et reproductibilité

### Seed
Chaque session capture un **seed numérique** qui détermine :
- L'ordre de mélange des 64 cartes du deck
- La séquence exacte des cartes présentées

Avec le même seed, la session sera identique (même ordre de cartes).

### Replay
Pour rejouer une session :
1. Noter le `seed` du CSV
2. Relancer l'app avec ce seed
3. Reproduire les mêmes choix → même séquence d'événements

---

## 9. Interprétation clinique (indicatif)

| Métrique | Interprétation |
|----------|----------------|
| **Catégories complétées < 6** | Difficulté à atteindre le critère (flexibilité réduite) |
| **Erreurs persévératives élevées** | Rigidité cognitive, difficulté à inhiber une stratégie |
| **Erreurs non-persévératives élevées** | Réponses aléatoires, désorientation |
| **Erreurs de maintien de set** | Distractibilité, problèmes attentionnels |
| **TR très variables** | Impulsivité ou hésitation excessive |

**⚠️ Avertissement** : cette implémentation est un **outil de recherche**, pas un dispositif clinique validé. Les normes et seuils cliniques nécessitent une validation psychométrique.

---

## 10. Limitations et différences avec le WCST standard

### Paramètres modifiables
- **Nombre de corrects pour shift** : 10 (standard), ajustable dans le code
- **Max essais** : 128 par défaut, configurable dans l'UI
- **Catégories cibles** : 6 (standard)

### Différences potentielles
- **Feedback immédiat** : dans certaines versions papier, le feedback peut être différé
- **Pas de "failure to maintain set" strict** : le seuil de 5 corrects est indicatif
- **Pas de scoring WCST-64** : cette version utilise les 64 cartes mais n'implémente pas tous les scores standards (ex. conceptual level responses)

### Extensions possibles
- Ajouter `conceptual_level_responses` (séries de 3+ corrects consécutifs)
- Calculer `trials_to_first_category`
- Implémenter des normes par âge/population
- Support multi-langues pour feedback

---

## 11. Formules de calcul (post-traitement)

### Python (pandas)
```python
import pandas as pd

df = pd.read_csv('wcst_session.csv')

# Métriques de base
total_trials = len(df)
total_correct = df['correct'].sum()
total_errors = total_trials - total_correct
categories = df['categories_completed'].iloc[-1]

# Erreurs
persev = (df['error_type'] == 'perseverative').sum()
non_persev = (df['error_type'] == 'non-perseverative').sum()
set_maint = df['set_maintenance_error'].sum()

# Temps de réaction
mean_rt = df['response_time_ms'].mean()
mean_rt_correct = df[df['correct']]['response_time_ms'].mean()
mean_rt_error = df[~df['correct']]['response_time_ms'].mean()

# Premier shift
first_shift_trial = df[df['prev_rule'].notna()].index[0] if any(df['prev_rule'].notna()) else None

print(f"Catégories: {categories}")
print(f"Erreurs persévératives: {persev} ({100*persev/total_errors:.1f}%)")
print(f"Erreurs maintien: {set_maint}")
print(f"RT moyen: {mean_rt:.0f} ms")
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

## 12. Références et ressources

- **Grant, D. A., & Berg, E. (1948)**. A behavioral analysis of degree of reinforcement and ease of shifting to new responses in a Weigl-type card-sorting problem. *Journal of Experimental Psychology*, 38(4), 404.
- **Heaton, R. K. (1981)**. *Wisconsin Card Sorting Test manual*. Psychological Assessment Resources.
- **Nyhus, E., & Barceló, F. (2009)**. The Wisconsin Card Sorting Test and the cognitive assessment of prefrontal executive functions: A critical update. *Brain and Cognition*, 71(3), 437-451.

---

## Contact et contributions

Pour toute question sur la mécanique ou les calculs :
- Ouvrir une issue GitHub
- Consulter le code source : `src/engine/wcst.ts` (logique des règles), `src/App.tsx` (UI et logging)

**Version** : 0.1.0  
**Dernière mise à jour** : Novembre 2025
