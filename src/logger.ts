import type { SessionSummary, TrialLogEntry } from './types'

export function toCSV(rows: TrialLogEntry[]): string {
  const headers = [
    'participant_id', 'session_id', 'trial_index', 'trial_within_category',
    'deck_color', 'deck_shape', 'deck_number', 'selected_key_index',
    'correct', 'is_perseverative_response', 'is_perseverative_error', 'is_non_perseverative_error',
    'is_conceptual_response', 'set_maintenance_error',
    'rule_in_force', 'prev_rule',
    'color_match', 'shape_match', 'number_match', 'no_attribute_match',
    'categories_completed', 'consecutive_correct', 'is_shift_trial', 'category_index',
    'response_time_ms', 'timestamp_utc', 'seed', 'device_info', 'app_version'
  ]

  const escape = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return s.includes(';') || s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s
  }

  const lines = [headers.join(';')]
  for (const r of rows) {
    lines.push([
      r.participant_id, r.session_id, r.trial_index, r.trial_within_category,
      r.deck_card.color, r.deck_card.shape, r.deck_card.number, r.selected_key_index,
      r.correct, r.is_perseverative_response, r.is_perseverative_error, r.is_non_perseverative_error,
      r.is_conceptual_response, r.set_maintenance_error,
      r.rule_in_force, r.prev_rule ?? '',
      r.color_match, r.shape_match, r.number_match, r.no_attribute_match,
      r.categories_completed, r.consecutive_correct, r.is_shift_trial, r.category_index,
      r.response_time_ms, r.timestamp_utc, r.seed, r.device_info, r.app_version
    ].map(escape).join(';'))
  }
  return lines.join('\n')
}

export function computeSummary(logs: TrialLogEntry[]): SessionSummary {
  if (logs.length === 0) {
    return {
      total_trials: 0,
      total_correct: 0,
      total_errors: 0,
      categories_completed: 0,
      perseverative_responses: 0,
      perseverative_errors: 0,
      non_perseverative_errors: 0,
      conceptual_level_responses: 0,
      failure_to_maintain_set: 0,
      trials_to_complete_first_category: 0,
      trials_per_category: [],
      learning_to_learn: 0,
      shift_efficiency_mean: 0,
      mean_rt: 0,
      mean_rt_correct: 0,
      mean_rt_error: 0,
    }
  }

  const total_trials = logs.length
  const total_correct = logs.filter(l => l.correct).length
  const total_errors = total_trials - total_correct
  const categories_completed = logs[logs.length - 1].categories_completed

  const perseverative_responses = logs.filter(l => l.is_perseverative_response).length
  const perseverative_errors = logs.filter(l => l.is_perseverative_error).length
  const non_perseverative_errors = logs.filter(l => l.is_non_perseverative_error).length
  const conceptual_level_responses = logs.filter(l => l.is_conceptual_response).length
  const failure_to_maintain_set = logs.filter(l => l.set_maintenance_error).length

  // Trials to complete first category
  const firstCatIdx = logs.findIndex(l => l.categories_completed === 1)
  const trials_to_complete_first_category = firstCatIdx >= 0 ? firstCatIdx + 1 : 0

  // Trials per category
  const trials_per_category: number[] = []
  for (let cat = 0; cat < categories_completed; cat++) {
    const catLogs = logs.filter(l => l.category_index === cat)
    trials_per_category.push(catLogs.length)
  }

  // Learning-to-learn: compare first half vs second half of categories
  const half = Math.floor(categories_completed / 2)
  const firstHalf = trials_per_category.slice(0, half)
  const secondHalf = trials_per_category.slice(half)
  const avgFirst = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0
  const avgSecond = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0
  const learning_to_learn = avgFirst > 0 ? (avgFirst - avgSecond) / avgFirst : 0

  // Shift efficiency: trials needed after each shift to reach next category
  const shiftTrials = logs.filter(l => l.is_shift_trial).map(l => l.trial_index)
  const shiftEffs: number[] = []
  for (let i = 0; i < shiftTrials.length - 1; i++) {
    shiftEffs.push(shiftTrials[i + 1] - shiftTrials[i])
  }
  const shift_efficiency_mean = shiftEffs.length ? shiftEffs.reduce((a, b) => a + b, 0) / shiftEffs.length : 0

  // RT stats
  const mean_rt = logs.reduce((a, l) => a + l.response_time_ms, 0) / logs.length
  const correctLogs = logs.filter(l => l.correct)
  const errorLogs = logs.filter(l => !l.correct)
  const mean_rt_correct = correctLogs.length ? correctLogs.reduce((a, l) => a + l.response_time_ms, 0) / correctLogs.length : 0
  const mean_rt_error = errorLogs.length ? errorLogs.reduce((a, l) => a + l.response_time_ms, 0) / errorLogs.length : 0

  return {
    total_trials,
    total_correct,
    total_errors,
    categories_completed,
    perseverative_responses,
    perseverative_errors,
    non_perseverative_errors,
    conceptual_level_responses,
    failure_to_maintain_set,
    trials_to_complete_first_category,
    trials_per_category,
    learning_to_learn,
    shift_efficiency_mean,
    mean_rt,
    mean_rt_correct,
    mean_rt_error,
  }
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// PsyToolkit-compatible export
// 14 columns: card_id, correct_target, perseveration_target, trial_in_sequence, task_name, shape_label, symbol_count, color_label, reaction_time_ms, status, clicked_card, is_error, is_perseveration_error, is_non_perseveration_error
import { COLORS, SHAPES, NUMBERS } from './engine/wcst'

export function toCSV_WCST(rows: TrialLogEntry[]): string {
  const headers = [
    'card_id', 'correct_target', 'perseveration_target', 'trial_in_sequence',
    'task_name', 'shape_label', 'symbol_count', 'color_label',
    'reaction_time_ms', 'status', 'clicked_card',
    'is_error', 'is_perseveration_error', 'is_non_perseveration_error'
  ]

  const lines = [headers.join(';')] // Use semicolon for French Excel compatibility 
  // User prompt said "Séparateur utilisé (espace, tabulation, virgule…)". Let's stick to comma for now as it's safer for Excel, unless user complains.
  // Actually, let's use comma to match previous function style.

  // Helper to find target index (1-4) for a given attribute
  const getTargetFor = (rule: string | null, card: any) => {
    if (!rule) return 0
    if (rule === 'color') {
      // Red=1, Green=2, Yellow=3, Blue=4
      if (card.color === 'red') return 1
      if (card.color === 'green') return 2
      if (card.color === 'yellow') return 3
      if (card.color === 'blue') return 4
    }
    if (rule === 'shape') {
      // Flower=1, Butterfly=2, Mushroom=3, Leaf=4
      if (card.shape === 'flower') return 1
      if (card.shape === 'butterfly') return 2
      if (card.shape === 'mushroom') return 3
      if (card.shape === 'leaf') return 4
    }
    if (rule === 'number') {
      return card.number // 1-4
    }
    return 0
  }

  for (const r of rows) {
    // 1. card_id (1-64)
    const colorIdx = COLORS.indexOf(r.deck_card.color)
    const shapeIdx = SHAPES.indexOf(r.deck_card.shape)
    const numberIdx = NUMBERS.indexOf(r.deck_card.number)
    // Formula: color * 16 + shape * 4 + number + 1
    const card_id = (colorIdx * 16) + (shapeIdx * 4) + numberIdx + 1

    // 2. correct_target
    const correct_target = getTargetFor(r.rule_in_force, r.deck_card)

    // 3. perseveration_target
    const perseveration_target = getTargetFor(r.prev_rule, r.deck_card)

    // 4. trial_in_sequence
    const trial_in_sequence = r.trial_within_category + 1

    // 5. task_name
    const task_name = r.rule_in_force

    // 6-8. Labels
    const shape_label = r.deck_card.shape
    const symbol_count = r.deck_card.number
    const color_label = r.deck_card.color

    // 9. RT
    const reaction_time_ms = r.response_time_ms

    // 10. status (1=correct, 2=error)
    const status = r.correct ? 1 : 2

    // 11. clicked_card (1-4)
    const clicked_card = r.selected_key_index + 1

    // 12. is_error
    const is_error = r.correct ? 0 : 1

    // 13. is_perseveration_error
    const is_perseveration_error = r.is_perseverative_error ? 1 : 0

    // 14. is_non_perseveration_error
    const is_non_perseveration_error = r.is_non_perseverative_error ? 1 : 0

    lines.push([
      card_id, correct_target, perseveration_target, trial_in_sequence,
      task_name, shape_label, symbol_count, color_label,
      reaction_time_ms, status, clicked_card,
      is_error, is_perseveration_error, is_non_perseveration_error
    ].join(';'))
  }

  return lines.join('\n')
}
