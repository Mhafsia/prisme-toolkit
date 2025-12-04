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
                {/* Brain Logo */}
                <img
                    src="/logo.png"
                    alt="PRISME"
                    style={{
                        width: 100,
                        height: 100,
                        marginBottom: 20,
                        filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.5))',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}
                />
                <h1
                    style={{
                        background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '4rem',
                        letterSpacing: '10px',
                        fontWeight: '900',
                        marginBottom: '12px'
                    }}
                >
                    PRISME
                </h1>
                <p
                    style={{
                        color: '#94a3b8',
                        fontSize: '1.1rem',
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
