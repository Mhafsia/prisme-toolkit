import React, { useState, useMemo } from 'react'
import './styles.css'

type Language = 'fr' | 'en'

const FSUS_QUESTIONS = {
    fr: [
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
    ],
    en: [
        "I would like to use this system frequently",
        "This system is unnecessarily complex",
        "This system is easy to use",
        "I would need the support of a technical person to be able to use this system",
        "The various functions in this system are well integrated",
        "There is too much inconsistency in this system",
        "Most people would learn to use this system very quickly",
        "This system is very cumbersome to use",
        "I felt very confident using this system",
        "I needed to learn a lot of things before I could get going with this system"
    ]
}

const UI_TEXT = {
    fr: {
        back: '← Retour',
        questionnaire: 'Questionnaire F-SUS',
        usability: "Questionnaire d'utilisabilité",
        intro1: 'Nous allons vous poser',
        intro2: '10 questions',
        intro3: 'pour savoir comment vous avez apprécié le jeu.',
        intro4: "Pour chaque question, indiquez votre niveau d'accord sur une échelle de 0 à 10.",
        participant: 'Participant',
        start: 'COMMENCER',
        question: 'Question',
        finalQuestion: 'Question finale',
        recommend: 'Recommanderiez-vous ce système à d\'autres personnes ?',
        notAtAll: 'Certainement pas',
        absolutely: 'Absolument',
        disagree: "Pas du tout d'accord",
        agree: "Tout à fait d'accord",
        finish: 'Terminer ✓',
        previous: '← Précédent',
        next: 'Suivant →',
        completed: '✓ Questionnaire complété !',
        susScore: 'Score SUS',
        npsScore: 'Score NPS',
        downloadCSV: '📥 Télécharger CSV'
    },
    en: {
        back: '← Back',
        questionnaire: 'F-SUS Questionnaire',
        usability: 'Usability Questionnaire',
        intro1: 'We will ask you',
        intro2: '10 questions',
        intro3: 'to find out how you enjoyed the game.',
        intro4: 'For each question, indicate your level of agreement on a scale from 0 to 10.',
        participant: 'Participant',
        start: 'START',
        question: 'Question',
        finalQuestion: 'Final question',
        recommend: 'Would you recommend this system to other people?',
        notAtAll: 'Definitely not',
        absolutely: 'Absolutely',
        disagree: 'Strongly disagree',
        agree: 'Strongly agree',
        finish: 'Finish ✓',
        previous: '← Previous',
        next: 'Next →',
        completed: '✓ Questionnaire completed!',
        susScore: 'SUS Score',
        npsScore: 'NPS Score',
        downloadCSV: '📥 Download CSV'
    }
}

interface SUSProps {
    onComplete: (score: number, answers: number[], nps: number) => void
    onBack: () => void
    participantId: string
}

export default function SUS({ onComplete, onBack, participantId }: SUSProps) {
    const [lang, setLang] = useState<Language>('fr')
    const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null))
    const [npsAnswer, setNpsAnswer] = useState<number | null>(null)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [started, setStarted] = useState(false)
    const [showNPS, setShowNPS] = useState(false)

    const t = UI_TEXT[lang]
    const questions = FSUS_QUESTIONS[lang]

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
            const normalized = answer / 2.5
            if (index % 2 === 0) {
                total += normalized
            } else {
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
            'language',
            ...questions.map((_, i) => `q${i + 1}`),
            'nps_score',
            'sus_score'
        ]

        const row = [
            participantId || 'anon',
            new Date().toISOString(),
            lang,
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

    // Language toggle button
    const LanguageToggle = () => (
        <div style={{ display: 'flex', gap: 4 }}>
            <button
                onClick={() => setLang('fr')}
                style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: lang === 'fr' ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.2)',
                    background: lang === 'fr' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: lang === 'fr' ? 700 : 400,
                    color: lang === 'fr' ? '#ec4899' : '#94a3b8'
                }}
            >
                FR
            </button>
            <button
                onClick={() => setLang('en')}
                style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: lang === 'en' ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.2)',
                    background: lang === 'en' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: lang === 'en' ? 700 : 400,
                    color: lang === 'en' ? '#ec4899' : '#94a3b8'
                }}
            >
                EN
            </button>
        </div>
    )

    // Fixed container style
    const fixedContainerStyle: React.CSSProperties = {
        background: 'rgba(255,255,255,0.05)',
        padding: 32,
        borderRadius: 16,
        width: '100%',
        maxWidth: 650,
        minWidth: 500,
        minHeight: 350,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    }

    // Intro screen
    if (!started) {
        return (
            <div className="container">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="secondary" onClick={onBack} style={{ padding: '8px 16px' }}>
                        {t.back}
                    </button>
                    <LanguageToggle />
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
                        {t.usability}
                    </h3>

                    <div style={{ ...fixedContainerStyle, marginBottom: 30, justifyContent: 'center' }}>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#e2e8f0', marginBottom: 16 }}>
                            {t.intro1} <strong>{t.intro2}</strong> {t.intro3}
                        </p>
                        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#94a3b8' }}>
                            {t.intro4}
                        </p>
                    </div>

                    <p style={{ marginBottom: 30, color: '#e2e8f0' }}>
                        {t.participant} : <strong style={{ color: '#ec4899' }}>{participantId}</strong>
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
                        {t.start}
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
                        {t.back}
                    </button>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {t.finalQuestion}
                    </div>
                </header>

                <div className="intro-screen" style={{ marginTop: 20 }}>
                    <h2 style={{
                        marginBottom: '30px',
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

                    <div style={fixedContainerStyle}>
                        <div style={{
                            minHeight: 80,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <p style={{
                                fontSize: '1.1rem',
                                lineHeight: 1.6,
                                textAlign: 'center'
                            }}>
                                <strong>{t.recommend}</strong>
                            </p>
                        </div>

                        <div>
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
                                <span>{t.notAtAll}</span>
                                <span>{t.absolutely}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="primary"
                        onClick={handleSubmit}
                        disabled={npsAnswer === null}
                        style={{ padding: '12px 32px', marginTop: 24 }}
                    >
                        {t.finish}
                    </button>

                    {isComplete && susScore !== null && (
                        <div style={{
                            marginTop: 30,
                            padding: 24,
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 16,
                            textAlign: 'center'
                        }}>
                            <h3 style={{ marginBottom: 16, color: '#22c55e' }}>{t.completed}</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 8 }}>
                                {t.susScore}: <span style={{ color: '#ec4899' }}>{susScore.toFixed(1)}</span> / 100
                            </p>
                            <p style={{ fontSize: '1rem', marginBottom: 16, color: '#94a3b8' }}>
                                {t.npsScore}: <span style={{ color: '#3b82f6' }}>{npsAnswer}</span> / 10
                            </p>
                            <button className="primary" onClick={downloadCSV} style={{ padding: '12px 24px' }}>
                                {t.downloadCSV}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Main questionnaire
    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="secondary" onClick={onBack} style={{ padding: '8px 16px' }}>
                    {t.back}
                </button>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {t.question} {currentQuestion + 1} / 10
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
                    maxWidth: 650,
                    height: 8,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    marginBottom: 30,
                    overflow: 'hidden',
                    margin: '0 auto 30px'
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
                <div style={fixedContainerStyle}>
                    <div style={{
                        minHeight: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <p style={{
                            fontSize: '1.15rem',
                            lineHeight: 1.6,
                            textAlign: 'center',
                            maxWidth: 550
                        }}>
                            <strong>{currentQuestion + 1}.</strong> {questions[currentQuestion]}
                        </p>
                    </div>

                    <div>
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

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 12,
                            color: '#94a3b8'
                        }}>
                            <span>{t.disagree}</span>
                            <span>{t.agree}</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, maxWidth: 400, margin: '24px auto 0' }}>
                    <button
                        className="secondary"
                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        style={{ flex: 1, padding: 12 }}
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
                        style={{ flex: 1, padding: 12 }}
                    >
                        {t.next}
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
