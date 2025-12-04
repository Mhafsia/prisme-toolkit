import React, { useEffect, useState } from 'react'

interface SplashScreenProps {
    onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [phase, setPhase] = useState<'appear' | 'hold' | 'fade'>('appear')

    useEffect(() => {
        // Appear for 0.5s, hold for 1s, fade for 0.5s
        const appearTimer = setTimeout(() => setPhase('hold'), 500)
        const holdTimer = setTimeout(() => setPhase('fade'), 1500)
        const completeTimer = setTimeout(() => onComplete(), 2000)

        return () => {
            clearTimeout(appearTimer)
            clearTimeout(holdTimer)
            clearTimeout(completeTimer)
        }
    }, [onComplete])

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                opacity: phase === 'fade' ? 0 : 1,
                transition: 'opacity 0.5s ease-out'
            }}
        >
            <div
                style={{
                    textAlign: 'center',
                    transform: phase === 'appear' ? 'scale(0.8)' : 'scale(1)',
                    opacity: phase === 'appear' ? 0 : 1,
                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                <h1
                    style={{
                        background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '5rem',
                        letterSpacing: '12px',
                        fontWeight: '900',
                        marginBottom: '16px',
                        textShadow: '0 0 60px rgba(236, 72, 153, 0.3)'
                    }}
                >
                    PRISME
                </h1>
                <p
                    style={{
                        color: '#94a3b8',
                        fontSize: '1.2rem',
                        fontWeight: '400',
                        letterSpacing: '4px',
                        opacity: phase === 'appear' ? 0 : 0.8,
                        transform: phase === 'appear' ? 'translateY(10px)' : 'translateY(0)',
                        transition: 'all 0.5s ease 0.2s'
                    }}
                >
                    TOOLKIT
                </p>
            </div>
        </div>
    )
}
