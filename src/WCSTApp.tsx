import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CardSpec, Rule, SessionSummary, TrialLogEntry } from './types'
import { KEY_CARDS, initWCST, getDeckCard, evaluateSelection } from './engine/wcst'
import { computeSummary, downloadCSV, toCSV } from './logger'
import { useSettings, T } from './Settings'
import './styles.css'

type Theme = 'forest' | 'classic'

function shapeSVG(shape: CardSpec['shape'], color: string, theme: Theme) {
  const stroke = color
  const fill = color

  if (theme === 'classic') {
    switch (shape) {
      case 'flower': // Circle
        return (
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill={fill} />
          </svg>
        )
      case 'butterfly': // Triangle
        return (
          <svg viewBox="0 0 100 100">
            <polygon points="50,15 15,85 85,85" fill={fill} />
          </svg>
        )
      case 'mushroom': // Star
        return (
          <svg viewBox="0 0 100 100">
            <polygon
              points="50,10 61,40 95,40 68,60 79,90 50,70 21,90 32,60 5,40 39,40"
              fill={fill}
            />
          </svg>
        )
      case 'leaf': // Cross
        return (
          <svg viewBox="0 0 100 100">
            <g stroke={stroke} strokeWidth="15" strokeLinecap="round">
              <line x1="20" y1="50" x2="80" y2="50" />
              <line x1="50" y1="20" x2="50" y2="80" />
            </g>
          </svg>
        )
    }
  }

  // Forest Theme
  switch (shape) {
    case 'flower':
      return (
        <svg viewBox="0 0 100 100">
          {/* Petals - 8 petals rotated */}
          <g transform="translate(50,50)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <ellipse
                key={angle}
                cx="0"
                cy="-25"
                rx="8"
                ry="22"
                fill={fill}
                transform={`rotate(${angle})`}
              />
            ))}
          </g>
          {/* Center - Darker shade of the main color */}
          <circle cx="50" cy="50" r="12" fill={fill} filter="brightness(0.7)" stroke="none" />
          {/* Fallback for brightness filter if needed, or use stroke as darker shade proxy */}
          <circle cx="50" cy="50" r="12" fill="black" fillOpacity="0.2" />
        </svg>
      )
    case 'leaf': // Simple Leaf style
      return (
        <svg viewBox="0 0 100 100">
          {/* Leaf Body - Main Color */}
          <path
            d="M50,5 C 90,30 90,70 50,95 C 10,70 10,30 50,5 Z"
            fill={fill}
          />

          {/* Veins & Outline - Darker Variation (Black Overlay) */}
          <g stroke="black" strokeOpacity="0.3" strokeWidth="2.5" fill="none" strokeLinecap="round">
            {/* Outline */}
            <path d="M50,5 C 90,30 90,70 50,95 C 10,70 10,30 50,5 Z" />
            {/* Central Vein */}
            <path d="M50,92 L50,15" />
            {/* Veins - Curved upwards - Shortened further */}
            <path d="M50,75 Q70,65 74,52" />
            <path d="M50,55 Q70,45 74,32" />
            <path d="M50,35 Q60,25 63,17" />

            <path d="M50,75 Q30,65 26,52" />
            <path d="M50,55 Q30,45 26,32" />
            <path d="M50,35 Q40,25 37,17" />
          </g>
        </svg>
      )
    case 'butterfly':
      return (
        <svg viewBox="0 0 100 100">
          {/* Top Wings */}
          <path d="M50,50 Q20,0 5,30 Q0,60 50,50 Z" fill={fill} />
          <path d="M50,50 Q80,0 95,30 Q100,60 50,50 Z" fill={fill} />
          {/* Bottom Wings */}
          <path d="M50,50 Q10,70 20,90 Q40,100 50,50 Z" fill={fill} />
          <path d="M50,50 Q90,70 80,90 Q60,100 50,50 Z" fill={fill} />

          {/* Body - Main Color + Dark Overlay */}
          <ellipse cx="50" cy="50" rx="5" ry="25" fill={fill} />
          <ellipse cx="50" cy="50" rx="5" ry="25" fill="black" fillOpacity="0.3" />

          {/* Antennae - Dark Overlay */}
          <g stroke="black" strokeOpacity="0.3" strokeWidth="2" fill="none">
            <path d="M48,25 Q40,10 30,15" />
            <path d="M52,25 Q60,10 70,15" />
          </g>
        </svg>
      )
    case 'mushroom':
      return (
        <svg viewBox="0 0 100 100">
          {/* Stem - Main Color + Dark Overlay */}
          <path d="M40,60 L40,85 Q40,95 50,95 Q60,95 60,85 L60,60" fill={fill} />
          <path d="M40,60 L40,85 Q40,95 50,95 Q60,95 60,85 L60,60" fill="black" fillOpacity="0.3" />

          {/* Cap */}
          <path d="M10,60 Q10,30 50,20 Q90,30 90,60 Q90,75 50,65 Q10,75 10,60 Z" fill={fill} />

          {/* Spots - Main Color + Light Overlay */}
          <g fill="white" fillOpacity="0.4">
            <circle cx="30" cy="45" r="6" />
            <circle cx="50" cy="35" r="8" />
            <circle cx="75" cy="45" r="5" />
            <circle cx="45" cy="55" r="4" />
            <circle cx="65" cy="55" r="4" />
          </g>
        </svg>
      )
  }
}

const ColorHex: Record<CardSpec['color'], string> = {
  red: '#ff5d5d', green: '#4cd964', blue: '#5ca8ff', yellow: '#ffd85c'
}

function CardVisual({ spec, theme }: { spec: CardSpec, theme: Theme }) {
  const color = ColorHex[spec.color]

  function positionsFor(n: CardSpec['number']): Array<{ x: number; y: number }> {
    switch (n) {
      case 1:
        return [{ x: 0.5, y: 0.5 }]
      case 2:
        return [
          { x: 0.5, y: 0.35 },
          { x: 0.5, y: 0.70 },
        ]
      case 3:
        // Requested: 2 bottom, 1 top (center)
        return [
          { x: 0.5, y: 0.28 },
          { x: 0.30, y: 0.72 }, // Bottom Left
          { x: 0.70, y: 0.72 }, // Bottom Right
        ]
      case 4:
        // Requested: 2 top, 2 bottom
        return [
          { x: 0.35, y: 0.33 },
          { x: 0.65, y: 0.33 },
          { x: 0.35, y: 0.72 },
          { x: 0.65, y: 0.72 },
        ]
    }
  }

  const pos = positionsFor(spec.number)
  const sizePct = 28

  return (
    <div className="card-canvas">
      {pos.map((p, i) => (
        <span
          className="shape"
          key={i}
          style={{
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: `${sizePct}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {shapeSVG(spec.shape, color, theme)}
        </span>
      ))}
    </div>
  )
}

function Card({
  spec,
  onClick,
  selected,
  theme,
}: {
  spec: CardSpec
  onClick?: () => void
  selected?: boolean
  theme: Theme
}) {
  return (
    <div
      onClick={onClick}
      className={`card-container ${selected ? 'selected' : ''}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <CardVisual spec={spec} theme={theme} />
    </div>
  )
}

function Summary({ logs, onExport, onPreview }: { logs: TrialLogEntry[], onExport?: () => void, onPreview?: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button className="primary" onClick={() => {
          downloadCSV(`prisme-wcst-${Date.now()}.csv`, toCSV(logs))
          onExport?.()
        }}>Télécharger CSV</button>
        <button className="secondary" onClick={onPreview}>toCSV
          Voir Résultats
        </button>
      </div>
    </div>
  )
}

function WCSTSettingsModal({
  onClose,
  language,
  setLanguage,
  soundEnabled,
  setSoundEnabled,
  theme,
  setTheme,
  maxTrials,
  setMaxTrials,
  seed,
  setSeed
}: {
  onClose: () => void
  language: 'fr' | 'en'
  setLanguage: (lang: 'fr' | 'en') => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
  theme: Theme
  setTheme: (t: Theme) => void
  maxTrials: number
  setMaxTrials: (n: number) => void
  seed: number
  setSeed: (n: number) => void
}) {
  const isFr = language === 'fr'

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>{isFr ? 'Paramètres' : 'Settings'}</h2>

        <div className="modal-option">
          <label>{isFr ? 'Langue' : 'Language'}</label>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={language === 'fr' ? 'primary' : 'secondary'}
              onClick={() => setLanguage('fr')}
              style={{ padding: '6px 14px' }}
            >
              FR
            </button>
            <button
              className={language === 'en' ? 'primary' : 'secondary'}
              onClick={() => setLanguage('en')}
              style={{ padding: '6px 14px' }}
            >
              EN
            </button>
          </div>
        </div>

        <div className="modal-option">
          <label>{isFr ? 'Son' : 'Sound'}</label>
          <button className="secondary" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? (isFr ? 'Activé 🔊' : 'On 🔊') : (isFr ? 'Désactivé 🔇' : 'Off 🔇')}
          </button>
        </div>

        <div className="modal-option">
          <label>{isFr ? 'Thème Visuel' : 'Visual Theme'}</label>
          <button className="secondary" onClick={() => setTheme(theme === 'classic' ? 'forest' : 'classic')}>
            {theme === 'classic' ? (isFr ? '🔷 Classique' : '🔷 Classic') : (isFr ? '🌲 Forêt' : '🌲 Forest')}
          </button>
        </div>

        <div className="modal-option">
          <label>{isFr ? "Nombre d'essais max" : 'Max trials'}</label>
          <input
            type="number"
            value={maxTrials}
            onChange={(e) => setMaxTrials(parseInt(e.target.value) || 128)}
            style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
          />
        </div>

        <div className="modal-option">
          <label>Seed</label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
            style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
          />
        </div>

        <div className="actions" style={{ marginTop: 24 }}>
          <button className="primary" onClick={onClose}>{isFr ? 'Fermer' : 'Close'}</button>
        </div>
      </div>
    </div>
  )
}

function StatsModal({ logs, onClose }: { logs: TrialLogEntry[]; onClose: () => void }) {
  const summary = useMemo(() => computeSummary(logs), [logs])

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal admin-stats">
        <h2>Résultats de la Session</h2>
        <div className="stats-grid">
          <div className="stat-row"><strong>Total trials:</strong> {summary.total_trials}</div>
          <div className="stat-row"><strong>Total correct:</strong> {summary.total_correct}</div>
          <div className="stat-row"><strong>Total errors:</strong> {summary.total_errors}</div>
          <div className="stat-row"><strong>Categories completed:</strong> {summary.categories_completed}</div>
          <hr />
          <div className="stat-row"><strong>Perseverative Responses (PR):</strong> {summary.perseverative_responses}</div>
          <div className="stat-row"><strong>Perseverative Errors (PE):</strong> {summary.perseverative_errors}</div>
          <div className="stat-row"><strong>Non-Perseverative Errors (NPE):</strong> {summary.non_perseverative_errors}</div>
          <div className="stat-row"><strong>Conceptual Level Responses (CLR):</strong> {summary.conceptual_level_responses}</div>
          <div className="stat-row"><strong>Failure to Maintain Set:</strong> {summary.failure_to_maintain_set}</div>
          <hr />
          <div className="stat-row"><strong>Trials to 1st category:</strong> {summary.trials_to_complete_first_category}</div>
          <div className="stat-row"><strong>Trials per category:</strong> {summary.trials_per_category.join(', ')}</div>
          <div className="stat-row"><strong>Learning-to-Learn index:</strong> {summary.learning_to_learn.toFixed(3)}</div>
          <div className="stat-row"><strong>Shift efficiency (mean):</strong> {summary.shift_efficiency_mean.toFixed(1)}</div>
          <hr />
          <div className="stat-row"><strong>Mean RT:</strong> {Math.round(summary.mean_rt)} ms</div>
          <div className="stat-row"><strong>Mean RT (correct):</strong> {Math.round(summary.mean_rt_correct)} ms</div>
          <div className="stat-row"><strong>Mean RT (error):</strong> {Math.round(summary.mean_rt_error)} ms</div>
        </div>
        <div className="actions" style={{ marginTop: 16 }}>
          <button className="primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

function playBeep(f = 600, duration = 0.18) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    osc.connect(gain)
    gain.connect(ctx.destination)
    const now = ctx.currentTime
    gain.gain.setValueAtTime(0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.start(now)
    osc.stop(now + duration)
  } catch (e) {
    // silently ignore
  }
}

interface WCSTAppProps {
  participantId: string
  onBack: () => void
}

export default function WCSTApp({ participantId, onBack }: WCSTAppProps) {
  const { settings, setLanguage, setSoundEnabled, setTheme } = useSettings()
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).slice(2))
  const [seed, setSeed] = useState(42)
  const [maxTrials, setMaxTrials] = useState<number>(128)
  const [running, setRunning] = useState(false)
  const [feedback, setFeedback] = useState<null | { text: string; ok: boolean }>(null)
  const [logs, setLogs] = useState<TrialLogEntry[]>([])
  const [showEndModal, setShowEndModal] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [hasExported, setHasExported] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const t = T[settings.language]

  const [deckWidth, setDeckWidth] = useState<number | null>(null)

  const stateRef = useRef(initWCST({ seed }))
  const [deckCard, setDeckCard] = useState<CardSpec>(() => getDeckCard(stateRef.current))
  const [rule, setRule] = useState<Rule>(() => stateRef.current.rules[stateRef.current.ruleIndex])
  const [rtStart, setRtStart] = useState<number | null>(null)

  const appVersion = '0.1.0'
  const deviceInfo = useMemo(() => `${navigator.platform}|${navigator.userAgent}`, [])

  const categoriesToComplete = 6

  const started = running
  const finished = (started && ((logs[logs.length - 1]?.categories_completed ?? 0) >= categoriesToComplete))
    || (logs.length >= maxTrials)

  useEffect(() => {
    if (finished && running) {
      setShowEndModal(true)
    }
  }, [finished, running])

  // Warn on page reload/close if data not exported
  // Warn on page reload/close if data not exported
  const logsRef = useRef(logs)
  const hasExportedRef = useRef(hasExported)

  useEffect(() => {
    logsRef.current = logs
    hasExportedRef.current = hasExported
  }, [logs, hasExported])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (logsRef.current.length > 0 && !hasExportedRef.current) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  function toggleFullScreen() {
    const docEl = document.documentElement as any
    const requestFullScreen = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen

    if (requestFullScreen && !document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      requestFullScreen.call(docEl).catch((err: any) => {
        console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
      })
    }
  }

  function actuallyStart() {
    setLogs([])
    const s = initWCST({ seed })
    stateRef.current = s
    setDeckCard(getDeckCard(s))
    setRule(s.rules[s.ruleIndex])
    setFeedback(null)
    setRtStart(performance.now())
    setHasExported(false)
  }

  function startWithCountdown() {
    if (running || countdown !== null) return
    if (!participantId.trim()) {
      alert("Veuillez entrer un ID Participant avant de commencer.")
      return
    }

    toggleFullScreen()

    // Start the game UI immediately
    setRunning(true)
    actuallyStart() // Initialize game state

    let n = 3
    setCountdown(n)

    const tick = () => {
      n -= 1
      if (n <= 0) {
        setCountdown(null)
        if (settings.soundEnabled) playBeep(740)
        setRtStart(performance.now()) // Start timing when countdown ends
      } else {
        setCountdown(n)
        if (settings.soundEnabled) playBeep(500)
        setTimeout(tick, 1000)
      }
    }
    setTimeout(tick, 1000)
  }

  function handleCardClick(cardIndex: number) {
    if (!running || feedback || finished || countdown !== null) return

    const rt = performance.now() - (rtStart || 0)
    const res = evaluateSelection(stateRef.current, cardIndex)

    // Play sound
    if (settings.soundEnabled) {
      if (res.correct) playBeep(880, 0.1)
      else playBeep(200, 0.3)
    }

    // Feedback
    setFeedback({
      text: res.correct ? 'Correct !' : 'Incorrect',
      ok: res.correct
    })

    // Log
    const logEntry: TrialLogEntry = {
      participant_id: participantId,
      session_id: sessionId,
      timestamp_utc: new Date().toISOString(),
      trial_index: stateRef.current.trialIndex,
      trial_within_category: res.trialWithinCategory,
      deck_card: deckCard,
      selected_key_index: cardIndex,
      correct: res.correct,
      is_perseverative_response: res.isPerseverativeResponse,
      is_perseverative_error: res.isPerseverativeError,
      is_non_perseverative_error: res.isNonPerseverativeError,
      is_conceptual_response: res.isConceptualResponse,
      set_maintenance_error: res.setMaintenanceError,
      rule_in_force: rule,
      prev_rule: stateRef.current.prevRule,
      color_match: res.colorMatch,
      shape_match: res.shapeMatch,
      number_match: res.numberMatch,
      no_attribute_match: res.noAttributeMatch,
      categories_completed: stateRef.current.categoriesCompleted,
      consecutive_correct: stateRef.current.consecutiveCorrect,
      is_shift_trial: res.isShiftTrial,
      category_index: stateRef.current.categoriesCompleted,
      response_time_ms: rt,
      seed: seed,
      device_info: deviceInfo,
      app_version: appVersion
    }
    setLogs(prev => [...prev, logEntry])

    // Update state
    stateRef.current = res.nextState

    // Next trial
    setTimeout(() => {
      setFeedback(null)
      // Update state for next trial
      setDeckCard(getDeckCard(stateRef.current))
      setRule(stateRef.current.rules[stateRef.current.ruleIndex])
      setRtStart(performance.now())
    }, 1000)
  }

  if (showEndModal) {
    return (
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            WCST v{appVersion} | Session: {sessionId}
          </div>
          <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
            <button className="secondary" onClick={() => setShowMenu(!showMenu)} style={{ borderRadius: '12px', padding: '8px 16px' }}>
              Options ▼
            </button>

            {showMenu && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => {
                  setShowStatsModal(true)
                  setShowMenu(false)
                }}>
                  📊 Résultats
                </button>
                <button className="dropdown-item" onClick={() => {
                  downloadCSV(`prisme-wcst-${Date.now()}.csv`, toCSV(logs))
                  setHasExported(true)
                  setShowMenu(false)
                }}>
                  📥 Télécharger CSV
                </button>

              </div>
            )}
          </div>
        </header>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingBottom: 100
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉✨</div>
          <h1 style={{ fontSize: '48px', marginBottom: '16px', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Session Terminée !
          </h1>
          <p style={{ fontSize: '24px', color: '#cbd5e1', maxWidth: '600px', lineHeight: '1.5' }}>
            Merci beaucoup pour votre participation ! 🌟<br />
            Vous avez fait du super travail.
          </p>
        </div>

        {showStatsModal && (
          <StatsModal logs={logs} onClose={() => setShowStatsModal(false)} />
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="secondary" onClick={onBack} style={{ padding: '8px 16px' }}>
          {t.back}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/PRISME-Logo.png" alt="" style={{ width: 26, height: 26 }} />
          <span style={{
            background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '1.5rem',
            letterSpacing: '3px',
            fontWeight: '800'
          }}>PRISME</span>
        </div>
        <button className="secondary" onClick={() => setShowSettingsModal(true)} style={{ padding: '8px 12px', fontSize: 16 }}>⚙️</button>
      </header>

      {showSettingsModal && (
        <WCSTSettingsModal
          onClose={() => setShowSettingsModal(false)}
          language={settings.language}
          setLanguage={setLanguage}
          soundEnabled={settings.soundEnabled}
          setSoundEnabled={setSoundEnabled}
          theme={settings.theme}
          setTheme={setTheme}
          maxTrials={maxTrials}
          setMaxTrials={setMaxTrials}
          seed={seed}
          setSeed={setSeed}
        />
      )}

      {!started ? (
        <div className="intro-screen">
          <h2 style={{ marginBottom: '10px', textAlign: 'center', background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.5rem', letterSpacing: '5px', fontWeight: '900' }}>PRISME</h2>
          <h1 style={{ marginBottom: '20px', textAlign: 'center', fontSize: '1.3rem', color: '#94a3b8', fontWeight: '400' }}>{t.wcstSubtitle}</h1>
          <p style={{ textAlign: 'center', marginBottom: '30px', color: '#e2e8f0' }}>{t.participant}: <strong>{participantId}</strong></p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '300px', margin: '0 auto' }}>


            <button className="primary big-btn" onClick={startWithCountdown} style={{
              marginTop: '20px',
              padding: '16px',
              fontSize: '18px',
              borderRadius: '12px'
            }}>
              {t.start}
            </button>
          </div>
        </div>
      ) : (
        <div className="game-board">
          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="countdown-overlay">
              <div className="countdown-number">{countdown}</div>
            </div>
          )}

          {/* Deck Card (Top) */}
          <div className="deck-area">
            <div className="deck-label">{t.cardToSort}</div>
            <div className="card-container">
              <CardVisual spec={deckCard} theme={settings.theme} />
            </div>
          </div>

          {/* Feedback Overlay - Positioned between deck and keys */}
          <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 }}>
            {feedback && (
              <div className={`feedback-overlay ${feedback.ok ? 'correct' : 'incorrect'}`}>
                {feedback.text}
              </div>
            )}
          </div>

          {/* Key Cards (Bottom) */}
          <div className="key-cards-row" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {KEY_CARDS.map((spec, i) => (
              <div key={i} className="key-card-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <Card
                  spec={spec}
                  onClick={() => handleCardClick(i)}
                  selected={false}
                  theme={settings.theme}
                />
              </div>
            ))}
          </div>


        </div>
      )}
    </div>
  )
}
