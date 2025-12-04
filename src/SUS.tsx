import React, { useState, useMemo } from 'react'
import './styles.css'

const FSUS_QUESTIONS = [
    "Je voudrais utiliser ce système fréquemment",
    "Ce système est inutilement complexe",
    "Ce système est facile à utiliser",
    "J'aurais besoin du soutien d'un technicien pour être capable d'utiliser ce système",
    "Les différentes fonctionnalités de ce système sont bien intégrées",
    "Il y a trop d'incohérences dans ce système",
    "La plupart des gens apprendront à utiliser ce système très rapidement",
    "Ce système est très lourd à utiliser",
    "Je me suis senti·e très en confiance en utilisant ce système",
    "J'ai eu besoin d'apprendre beaucoup de choses avant de pouvoir utiliser ce système"
]

interface SUSProps {
    onComplete: (score: number, answers: number[], nps: number) => void
    onBack: () => void
    participantId: string
}

export default function SUS({ onComplete, onBack, participantId }: SUSProps) {
    const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null))
    const [npsAnswer, setNpsAnswer] = useState<number | null>(null)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [started, setStarted] = useState(false)
    const [showNPS, setShowNPS] = useState(false)

    const handleSelect = (questionIndex: number, value: number) => {
        const newAnswers = [...answers]
        newAnswers[questionIndex] = value
        setAnswers(newAnswers)

        // Auto-advance after short delay
        setTimeout(() => {
            if (questionIndex < 9) {
                setCurrentQuestion(questionIndex + 1)
            } else {
                setShowNPS(true)
            }
        }, 300)
    }

    const calculateSUSScore = () => {
        // F-SUS scoring adapted for 0-10 scale
        // Normalize to 0-4 range first, then apply SUS formula
        let total = 0
        answers.forEach((answer, index) => {
            if (answer === null) return
            const normalized = answer / 2.5 // Convert 0-10 to 0-4
            if (index % 2 === 0) {
                // Odd questions (positive): score = normalized
                total += normalized
            } else {
                // Even questions (negative): score = 4 - normalized
                total += (4 - normalized)
            }
        })
        return total * 2.5
    }

    const allAnswered = answers.every(a => a !== null)
    const isComplete = allAnswered && npsAnswer !== null
    const susScore = useMemo(() => allAnswered ? calculateSUSScore() : null, [answers, allAnswered])

    const handleSubmit = () => {
        if (isComplete && susScore !== null && npsAnswer !== null) {
            onComplete(susScore, answers as number[], npsAnswer)
        }
    }

    const downloadCSV = () => {
        const headers = [
            'participant_id',
            'timestamp_utc',
            ...FSUS_QUESTIONS.map((_, i) => `q${i + 1}`),
            'nps_score',
            'sus_score'
        ]

        const row = [
            participantId || 'anon',
            new Date().toISOString(),
            ...answers,
            npsAnswer,
            susScore?.toFixed(1)
        ]

        const csv = '\uFEFF' + headers.join(';') + '\n' + row.join(';')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `prisme-fsus-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Intro screen
    if (!started) {
        return (
            <div className="container">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="secondary" onClick={onBack} style={{ padding: '8px 16px' }}>
                        ← Retour
                    </button>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        Questionnaire F-SUS
                    </div>
                </header>

                <div className="intro-screen" style={{ marginTop: 40, textAlign: 'center' }}>
                    <h2 style={{
                        marginBottom: '10px',
                        background: 'linear-gradient(to right, #f97316, #ec4899, #a855f7, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '2.5rem',
                        letterSpacing: '4px',
                        fontWeight: '900'
                    }}>
                        PRISME
                    </h2>
                    <h3 style={{ marginBottom: '30px', color: '#94a3b8', fontSize: '1.2rem' }}>
                        Questionnaire d'utilisabilité
                    </h3>

                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: 32,
                        borderRadius: 16,
                        marginBottom: 30,
                        maxWidth: 500,
                        margin: '0 auto 30px'
                    }}>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#e2e8f0', marginBottom: 16 }}>
                            Nous allons vous poser <strong>10 questions</strong> pour savoir comment vous avez apprécié le jeu.
                        </p>
                        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#94a3b8' }}>
                            Pour chaque question, indiquez votre niveau d'accord sur une échelle de 0 à 10.
                        </p>
                    </div>

                    <p style={{ marginBottom: 30, color: '#e2e8f0' }}>
                        Participant : <strong style={{ color: '#ec4899' }}>{participantId}</strong>
                    </p>

                    <button
                        className="primary big-btn"
                        onClick={() => setStarted(true)}
                        style={{
                            padding: '16px 48px',
                            fontSize: '18px',
                            borderRadius: '12px'
                        }}
                    >
                        COMMENCER
                    </button>
                </div>
            </div>
        )
    }

    // NPS Question
    if (showNPS) {
        return (
            <div className="container">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="secondary" onClick={() => setShowNPS(false)} style={{ padding: '8px 16px' }}>
                        ← Retour
                    </button>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        Question finale
                    </div>
                </header>

                <div className="intro-screen" style={{ marginTop: 20 }}>
                    <h2 style={{
                        marginBottom: '10px',
                        textAlign: 'center',
                        background: 'linear-gradient(to right, #f97316, #ec4899, #a855f7, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '2rem',
                        letterSpacing: '4px',
                        fontWeight: '900'
                    }}>
                        PRISME
                    </h2>

                    {/* Fixed size question box */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: 32,
                        borderRadius: 16,
                        marginTop: 30,
                        width: '100%',
                        maxWidth: 600,
                        margin: '30px auto'
                    }}>
                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.6,
                            textAlign: 'center',
                            marginBottom: 32,
                            minHeight: 50
                        }}>
                            <strong>Recommanderiez-vous ce système à d'autres personnes ?</strong>
                        </p>

                        {/* 0-10 Scale */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 6,
                            flexWrap: 'nowrap',
                            marginBottom: 12
                        }}>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setNpsAnswer(val)}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 8,
                                        border: npsAnswer === val
                                            ? '2px solid #ec4899'
                                            : '1px solid rgba(255,255,255,0.2)',
                                        background: npsAnswer === val
                                            ? 'rgba(236, 72, 153, 0.3)'
                                            : 'rgba(255,255,255,0.05)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        color: '#e2e8f0',
                                        flexShrink: 0
                                    }}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 12,
                            color: '#94a3b8'
                        }}>
                            <span>Certainement pas</span>
                            <span>Absolument</span>
                        </div>
                    </div>

                    <button
                        className="primary"
                        onClick={handleSubmit}
                        disabled={npsAnswer === null}
                        style={{ padding: '12px 32px', marginTop: 20 }}
                    >
                        Terminer ✓
                    </button>

                    {/* Score display when complete */}
                    {isComplete && susScore !== null && (
                        <div style={{
                            marginTop: 30,
                            padding: 24,
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 16,
                            textAlign: 'center'
                        }}>
                            <h3 style={{ marginBottom: 16, color: '#22c55e' }}>✓ Questionnaire complété !</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 8 }}>
                                Score SUS: <span style={{ color: '#ec4899' }}>{susScore.toFixed(1)}</span> / 100
                            </p>
                            <p style={{ fontSize: '1rem', marginBottom: 16, color: '#94a3b8' }}>
                                Score NPS: <span style={{ color: '#3b82f6' }}>{npsAnswer}</span> / 10
                            </p>
                            <button className="primary" onClick={downloadCSV} style={{ padding: '12px 24px' }}>
                                📥 Télécharger CSV
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="secondary" onClick={onBack} style={{ padding: '8px 16px' }}>
                    ← Retour
                </button>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Question {currentQuestion + 1} / 10
                </div>
            </header>

            <div className="intro-screen" style={{ marginTop: 20 }}>
                <h2 style={{
                    marginBottom: '10px',
                    textAlign: 'center',
                    background: 'linear-gradient(to right, #f97316, #ec4899, #a855f7, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '2rem',
                    letterSpacing: '4px',
                    fontWeight: '900'
                }}>
                    PRISME
                </h2>

                {/* Progress bar */}
                <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    marginBottom: 30,
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${(answers.filter(a => a !== null).length / 10) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(to right, #f97316, #ec4899)',
                        borderRadius: 4,
                        transition: 'width 0.3s ease'
                    }} />
                </div>

                {/* FIXED SIZE Question Box */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: 32,
                    borderRadius: 16,
                    marginBottom: 20,
                    width: '100%',
                    maxWidth: 600,
                    minHeight: 300,
                    margin: '0 auto 20px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Fixed height question area */}
                    <div style={{
                        height: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24
                    }}>
                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.6,
                            textAlign: 'center',
                            maxWidth: 500
                        }}>
                            <strong>{currentQuestion + 1}.</strong> {FSUS_QUESTIONS[currentQuestion]}
                        </p>
                    </div>

                    {/* 0-10 Scale - Fixed size buttons */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 6,
                        flexWrap: 'nowrap',
                        marginBottom: 12
                    }}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                            <button
                                key={val}
                                onClick={() => handleSelect(currentQuestion, val)}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 8,
                                    border: answers[currentQuestion] === val
                                        ? '2px solid #ec4899'
                                        : '1px solid rgba(255,255,255,0.2)',
                                    background: answers[currentQuestion] === val
                                        ? 'rgba(236, 72, 153, 0.3)'
                                        : 'rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: '#e2e8f0',
                                    flexShrink: 0
                                }}
                            >
                                {val}
                            </button>
                        ))}
                    </div>

                    {/* Labels */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: '#94a3b8',
                        paddingLeft: 8,
                        paddingRight: 8
                    }}>
                        <span>Pas du tout d'accord</span>
                        <span>Tout à fait d'accord</span>
                    </div>
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, maxWidth: 400, margin: '0 auto' }}>
                    <button
                        className="secondary"
                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        style={{ flex: 1, padding: 12 }}
                    >
                        ← Précédent
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
                        style={{ flex: 1, padding: 12 }}
                    >
                        {currentQuestion < 9 ? 'Suivant →' : 'Suivant →'}
                    </button>
                </div>

                {/* Quick navigation dots */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 20
                }}>
                    {answers.map((answer, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentQuestion(i)}
                            style={{
                                width: 12,
                                height: 12,
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
    )
}
