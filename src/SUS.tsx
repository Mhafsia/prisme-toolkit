import React, { useState, useMemo } from 'react'
import { useSettings, SettingsModal, T } from './Settings'
import logoImg from './assets/PRISME-Logo.png'
import './styles.css'

const FSUS_QUESTIONS = {
    fr: [
        "Je voudrais utiliser Pop'Balloons fréquemment",
        "Pop'Balloons est inutilement complexe",
        "Pop'Balloons est facile à utiliser",
        "J'aurais besoin du soutien d'un technicien pour être capable d'utiliser Pop'Balloons",
        "Les différentes fonctionnalités de Pop'Balloons sont bien intégrées",
        "Il y a trop d'incohérences dans Pop'Balloons",
        "La plupart des gens apprendront à utiliser Pop'Balloons très rapidement",
        "Pop'Balloons est très lourd à utiliser",
        "Je me suis senti·e très en confiance en utilisant Pop'Balloons",
        "J'ai eu besoin d'apprendre beaucoup de choses avant de pouvoir utiliser Pop'Balloons"
    ],
    en: [
        "I would like to use Pop'Balloons frequently",
        "Pop'Balloons is unnecessarily complex",
        "Pop'Balloons is easy to use",
        "I would need the support of a technical person to be able to use Pop'Balloons",
        "The various functions in Pop'Balloons are well integrated",
        "There is too much inconsistency in Pop'Balloons",
        "Most people would learn to use Pop'Balloons very quickly",
        "Pop'Balloons is very cumbersome to use",
        "I felt very confident using Pop'Balloons",
        "I needed to learn a lot of things before I could get going with Pop'Balloons"
    ]
}

const SCALE_EMOJIS = ['😞', '🙁', '😐', '🙂', '😊']

interface SUSProps {
    onComplete: (score: number, answers: number[], nps: number) => void
    onBack: () => void
    participantId: string
}

export default function SUS({ onComplete, onBack, participantId }: SUSProps) {
    const { settings } = useSettings()
    const [showSettings, setShowSettings] = useState(false)
    const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null))
    const [npsAnswer, setNpsAnswer] = useState<number | null>(null)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [started, setStarted] = useState(false)
    const [showNPS, setShowNPS] = useState(false)
    const [isFinished, setIsFinished] = useState(false)

    const t = T[settings.language]
    const questions = FSUS_QUESTIONS[settings.language]

    const handleBack = () => {
        const hasAnswers = answers.some(a => a !== null) || npsAnswer !== null
        if (hasAnswers) {
            if (window.confirm(t.warningBack)) {
                onBack()
            }
        } else {
            onBack()
        }
    }

    const handleSelect = (questionIndex: number, value: number) => {
        const newAnswers = [...answers]
        newAnswers[questionIndex] = value
        setAnswers(newAnswers)

        setTimeout(() => {
            if (questionIndex < 9) {
                setCurrentQuestion(questionIndex + 1)
            } else {
                setShowNPS(true)
            }
        }, 300)
    }

    const calculateSUSScore = () => {
        let total = 0
        answers.forEach((answer, index) => {
            if (answer === null) return
            if (index % 2 === 0) {
                total += answer
            } else {
                total += (4 - answer)
            }
        })
        return total * 2.5
    }

    const allAnswered = answers.every(a => a !== null)
    const isComplete = allAnswered && npsAnswer !== null
    const susScore = useMemo(() => allAnswered ? calculateSUSScore() : null, [answers, allAnswered])

    const handleSubmit = () => {
        if (isComplete && susScore !== null && npsAnswer !== null) {
            setIsFinished(true)
            onComplete(susScore, answers as number[], npsAnswer)
        }
    }

    const downloadCSV = () => {
        const headers = [
            'participant_id',
            'timestamp_utc',
            'language',
            ...questions.map((_, i) => `q${i + 1}`),
            'nps_score',
            'sus_score'
        ]

        const row = [
            participantId || 'anon',
            new Date().toISOString(),
            settings.language,
            ...answers,
            npsAnswer,
            susScore?.toFixed(1)
        ]

        const csv = '\uFEFF' + headers.join(';') + '\n' + row.join(';')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
        a.download = `SUS_${participantId}_${dateStr}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Fixed container style
    const fixedContainerStyle: React.CSSProperties = {
        background: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 16,
        width: '100%',
        maxWidth: 550,
        minHeight: 200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    }

    // Finished screen
    if (isFinished) {
        return (
            <div className="container">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="secondary" onClick={onBack} style={{ padding: '8px 16px' }}>
                        {t.back}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={logoImg} alt="" style={{ width: 28, height: 28 }} />
                        <span style={{
                            background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #8b5cf6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '1.5rem',
                            letterSpacing: '4px',
                            fontWeight: '800'
                        }}>PRISME</span>
                    </div>
                    <button className="primary" onClick={downloadCSV} style={{ padding: '8px 12px', fontSize: 14 }}>
                        {t.downloadCSV}
                    </button>
                </header>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
                        <h2 style={{ marginBottom: 24, color: '#22c55e' }}>{t.completed}</h2>
                    </div>
                </div>
            </div>
        )
    }

    // Intro screen
    if (!started) {
        return (
            <div className="container">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="secondary" onClick={onBack} style={{ padding: '8px 16px' }}>
                        {t.back}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={logoImg} alt="" style={{ width: 26, height: 26 }} />
                        <span style={{
                            background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #8b5cf6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '1.5rem',
                            letterSpacing: '3px',
                            fontWeight: '800'
                        }}>PRISME</span>
                    </div>
                    <button className="secondary" onClick={() => setShowSettings(true)} style={{ padding: '8px 12px', fontSize: 16 }}>
                        ⚙️
                    </button>
                </header>

                {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', maxWidth: 500 }}>
                        <h3 style={{ marginBottom: '24px', color: '#94a3b8', fontSize: '1.1rem' }}>
                            {t.usability}
                        </h3>

                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: 24,
                            borderRadius: 16,
                            marginBottom: 24
                        }}>
                            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#e2e8f0', marginBottom: 12 }}>
                                {t.intro1} <strong>{t.intro2}</strong> {t.intro3}
                            </p>
                            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#94a3b8' }}>
                                {t.intro4}
                            </p>
                        </div>

                        <p style={{ marginBottom: 20, color: '#94a3b8', fontSize: 14 }}>
                            {t.participant} : <strong style={{ color: '#ec4899' }}>{participantId}</strong>
                        </p>

                        <button
                            className="primary big-btn"
                            onClick={() => setStarted(true)}
                            style={{
                                padding: '14px 40px',
                                fontSize: '16px',
                                borderRadius: '12px'
                            }}
                        >
                            {t.start}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // NPS Question (0-10)
    if (showNPS) {
        return (
            <div className="container">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="secondary" onClick={handleBack} style={{ padding: '8px 16px' }}>
                        {t.back}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={logoImg} alt="" style={{ width: 26, height: 26 }} />
                        <span style={{
                            background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #8b5cf6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '1.5rem',
                            letterSpacing: '3px',
                            fontWeight: '800'
                        }}>PRISME</span>
                    </div>
                    <button className="secondary" onClick={() => setShowSettings(true)} style={{ padding: '8px 12px', fontSize: 16 }}>
                        ⚙️
                    </button>
                </header>

                {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: 600 }}>
                        <div style={fixedContainerStyle}>
                            <div style={{
                                minHeight: 60,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20
                            }}>
                                <p style={{ fontSize: '1rem', lineHeight: 1.5, textAlign: 'center' }}>
                                    <strong>{t.recommend}</strong>
                                </p>
                            </div>

                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: 4,
                                    flexWrap: 'nowrap',
                                    marginBottom: 10
                                }}>
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setNpsAnswer(val)}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 8,
                                                border: npsAnswer === val ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.2)',
                                                background: npsAnswer === val ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255,255,255,0.05)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: '#e2e8f0',
                                                flexShrink: 0
                                            }}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
                                    <span>{t.notAtAll}</span>
                                    <span>{t.absolutely}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                            <button
                                className="primary"
                                onClick={handleSubmit}
                                disabled={npsAnswer === null}
                                style={{ padding: '12px 32px' }}
                            >
                                {t.finish}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Main questionnaire with emojis (1-5)
    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="secondary" onClick={handleBack} style={{ padding: '8px 16px' }}>
                    {t.back}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={logoImg} alt="" style={{ width: 26, height: 26 }} />
                    <span style={{
                        background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '1.5rem',
                        letterSpacing: '3px',
                        fontWeight: '800'
                    }}>PRISME</span>
                </div>
                <button className="secondary" onClick={() => setShowSettings(true)} style={{ padding: '8px 12px', fontSize: 16 }}>
                    ⚙️
                </button>
            </header>

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: 600 }}>
                    {/* Progress bar */}
                    <div style={{
                        width: '100%',
                        height: 6,
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: 3,
                        marginBottom: 20,
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${(answers.filter(a => a !== null).length / 10) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(to right, #f97316, #ec4899)',
                            borderRadius: 3,
                            transition: 'width 0.3s ease'
                        }} />
                    </div>

                    {/* Question Box */}
                    <div style={fixedContainerStyle}>
                        <div style={{
                            minHeight: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <p style={{
                                fontSize: '1rem',
                                lineHeight: 1.4,
                                textAlign: 'center',
                                maxWidth: 480,
                                margin: 0
                            }}>
                                <strong>{currentQuestion + 1}.</strong> {questions[currentQuestion]}
                            </p>
                        </div>

                        <div style={{ marginTop: 0 }}>
                            {/* Emoji buttons */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 16,
                                marginBottom: 10
                            }}>
                                {SCALE_EMOJIS.map((emoji, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(currentQuestion, idx)}
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 12,
                                            border: answers[currentQuestion] === idx ? '3px solid #ec4899' : '1px solid rgba(255,255,255,0.2)',
                                            background: answers[currentQuestion] === idx ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: 28,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>

                            {/* Labels */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
                                <span>{t.disagree}</span>
                                <span>{t.agree}</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                        <button
                            className="secondary"
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0}
                            style={{ padding: '10px 20px' }}
                        >
                            {t.previous}
                        </button>

                        <button
                            className="primary"
                            onClick={() => {
                                if (currentQuestion < 9) {
                                    setCurrentQuestion(currentQuestion + 1)
                                } else {
                                    setShowNPS(true)
                                }
                            }}
                            disabled={answers[currentQuestion] === null}
                            style={{ padding: '10px 20px' }}
                        >
                            {t.next}
                        </button>
                    </div>

                    {/* Navigation dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                        {answers.map((answer, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentQuestion(i)}
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: answer !== null
                                        ? 'linear-gradient(to right, #f97316, #ec4899)'
                                        : i === currentQuestion
                                            ? 'rgba(255,255,255,0.5)'
                                            : 'rgba(255,255,255,0.2)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
