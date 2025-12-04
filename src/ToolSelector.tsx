import React, { useState } from 'react'
import { useSettings, SettingsModal, T } from './Settings'
import './styles.css'

interface ToolSelectorProps {
    onSelectWCST: () => void
    onSelectSUS: () => void
    participantId: string
    setParticipantId: (id: string) => void
}

export default function ToolSelector({ onSelectWCST, onSelectSUS, participantId, setParticipantId }: ToolSelectorProps) {
    const { settings } = useSettings()
    const [showSettings, setShowSettings] = useState(false)
    const t = T[settings.language]

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 80 }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src="/logo.png" alt="" style={{ width: 28, height: 28 }} />
                    <span style={{
                        background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '1.5rem',
                        letterSpacing: '4px',
                        fontWeight: '800'
                    }}>PRISME</span>
                </div>
                <button className="secondary" onClick={() => setShowSettings(true)} style={{ padding: '8px 12px', fontSize: 16 }}>
                    ⚙️
                </button>
            </header>

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', width: '100%', maxWidth: 600 }}>
                    <h2 style={{ marginBottom: '30px', color: '#94a3b8', fontSize: '1.3rem', fontWeight: '400' }}>
                        {t.toolkitSubtitle}
                    </h2>

                    {/* Participant ID */}
                    <div style={{ maxWidth: 280, margin: '0 auto 30px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: 6 }}>{t.participantId}:</label>
                            <input
                                type="text"
                                value={participantId}
                                onChange={e => setParticipantId(e.target.value)}
                                placeholder={t.participantPlaceholder}
                            />
                        </div>
                    </div>

                    {/* Tool Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 20,
                        maxWidth: 500,
                        margin: '0 auto'
                    }}>
                        {/* WCST Card */}
                        <button
                            onClick={onSelectWCST}
                            disabled={!participantId.trim()}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 16,
                                padding: 24,
                                cursor: participantId.trim() ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s',
                                opacity: participantId.trim() ? 1 : 0.5
                            }}
                            onMouseEnter={e => {
                                if (participantId.trim()) {
                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                                    e.currentTarget.style.borderColor = '#818cf8'
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🃏</div>
                            <h3 style={{ marginBottom: 6, color: '#e2e8f0', fontSize: '1.2rem' }}>{t.wcstTitle}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.4 }}>
                                {t.wcstDesc}
                            </p>
                        </button>

                        {/* SUS Card */}
                        <button
                            onClick={onSelectSUS}
                            disabled={!participantId.trim()}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 16,
                                padding: 24,
                                cursor: participantId.trim() ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s',
                                opacity: participantId.trim() ? 1 : 0.5
                            }}
                            onMouseEnter={e => {
                                if (participantId.trim()) {
                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                                    e.currentTarget.style.borderColor = '#ec4899'
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                            <h3 style={{ marginBottom: 6, color: '#e2e8f0', fontSize: '1.2rem' }}>{t.susTitle}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.4 }}>
                                {t.susDesc}
                            </p>
                        </button>
                    </div>

                    <p style={{
                        textAlign: 'center',
                        color: '#f97316',
                        marginTop: 20,
                        fontSize: '0.85rem',
                        visibility: participantId.trim() ? 'hidden' : 'visible',
                        height: 20
                    }}>
                        {t.enterParticipant}
                    </p>
                </div>
            </div>
        </div>
    )
}
