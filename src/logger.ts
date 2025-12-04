import type { SessionSummary, TrialLogEntry } from './types'
import { COLORS, SHAPES, NUMBERS } from './engine/wcst'

export function toCSV(rows: TrialLogEntry[]): string {
  const headers = [
    'participant_id', 'session_id', 'trial_index',
    'deck_color', 'deck_shape', 'deck_number',
    'selected_key_index', 'correct',
    'error_type', 'set_maintenance_error',
    'rule_in_force', 'prev_rule',
    'categories_completed', 'consecutive_correct',
    'response_time_ms', 'timestamp_utc', 'seed', 'device_info', 'app_version'
  ]

  const escape = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return s.includes(';') || s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s
  }

  // Add BOM for Excel UTF-8 recognition
  const lines = ['\uFEFF' + headers.join(';')]

  for (const r of rows) {
    let error_type = ''
    if (!r.correct) {
      if (r.is_perseverative_error) error_type = 'perseverative'
      else if (r.is_non_perseverative_error) error_type = 'non-perseverative'
    }

    lines.push([
      r.participant_id, r.session_id, r.trial_index,
      r.deck_card.color, r.deck_card.shape, r.deck_card.number,
      r.selected_key_index, r.correct,
      error_type, r.set_maintenance_error,
      r.rule_in_force, r.prev_rule ?? '',
      r.categories_completed, r.consecutive_correct,
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
