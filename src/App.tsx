import React, { useState } from 'react'
import { SettingsProvider } from './Settings'
import SplashScreen from './SplashScreen'
import ToolSelector from './ToolSelector'
import WCSTApp from './WCSTApp'
import SUS from './SUS'
import SessionsViewer from './SessionsViewer'
import './styles.css'

type ActiveTool = 'selector' | 'wcst' | 'sus' | 'sessions'

function AppContent() {
    const [showSplash, setShowSplash] = useState(true)
    const [activeTool, setActiveTool] = useState<ActiveTool>('selector')
    const [participantId, setParticipantId] = useState('')

    const handleBack = () => {
        setActiveTool('selector')
    }

    if (showSplash) {
        return <SplashScreen onComplete={() => setShowSplash(false)} />
    }

    if (activeTool === 'wcst') {
        return <WCSTApp participantId={participantId} onBack={handleBack} />
    }

    if (activeTool === 'sessions') {
        return <SessionsViewer isFr onBack={handleBack} />
    }

    if (activeTool === 'sus') {
        return (
            <SUS
                participantId={participantId}
                onBack={handleBack}
                onComplete={(score, answers, nps) => {
                    console.log('SUS completed:', score, answers, nps)
                }}
            />
        )
    }

    return (
        <ToolSelector
            participantId={participantId}
            setParticipantId={setParticipantId}
            onSelectWCST={() => setActiveTool('wcst')}
            onSelectSUS={() => setActiveTool('sus')}
            onSelectSessions={() => setActiveTool('sessions')}
        />
    )
}

export default function App() {
    return (
        <SettingsProvider>
            <AppContent />
        </SettingsProvider>
    )
}
