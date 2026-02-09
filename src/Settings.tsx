import React, { createContext, useContext, useState, ReactNode } from 'react'

type Language = 'fr' | 'en'
type Theme = 'forest' | 'classic'

interface Settings {
    language: Language
    soundEnabled: boolean
    theme: Theme
}

interface SettingsContextType {
    settings: Settings
    setLanguage: (lang: Language) => void
    setSoundEnabled: (enabled: boolean) => void
    setTheme: (theme: Theme) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>({
        language: 'fr',
        soundEnabled: true,
        theme: 'forest'
    })

    const setLanguage = (language: Language) => setSettings(s => ({ ...s, language }))
    const setSoundEnabled = (soundEnabled: boolean) => setSettings(s => ({ ...s, soundEnabled }))
    const setTheme = (theme: Theme) => setSettings(s => ({ ...s, theme }))

    return (
        <SettingsContext.Provider value={{ settings, setLanguage, setSoundEnabled, setTheme }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const ctx = useContext(SettingsContext)
    if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
    return ctx
}

// Global translations
export const T = {
    fr: {
        // Common
        back: '← Retour',
        settings: 'Paramètres',
        language: 'Langue',
        sound: 'Son',
        theme: 'Thème',
        close: 'Fermer',
        on: 'Activé',
        off: 'Désactivé',
        classic: 'Classique',
        forest: 'Forêt',
        participant: 'Participant',
        downloadCSV: '📥 Télécharger CSV',
        start: 'COMMENCER',

        // Tool Selector
        toolkitTitle: 'PRISME',
        toolkitSubtitle: 'Toolkit',
        toolkitVersion: 'v1.0',
        participantId: 'ID Participant',
        participantPlaceholder: 'Ex: P001',
        enterParticipant: '⚠️ Veuillez entrer un ID participant pour continuer',
        wcstTitle: 'WCST',
        wcstDesc: 'Wisconsin Card Sorting Test',
        susTitle: "Questionnaire d'utilisabilité",
        susDesc: "Questionnaire d'utilisabilité",

        // SUS
        usability: "Questionnaire d'utilisabilité",
        intro1: 'Nous allons vous poser',
        intro2: '10 questions',
        intro3: 'pour savoir comment vous avez apprécié le jeu.',
        intro4: "Pour chaque question, indiquez votre niveau d'accord.",
        question: 'Question',
        recommend: "Recommanderiez-vous Pop'Balloons à d'autres personnes ?",
        notAtAll: 'Certainement pas',
        absolutely: 'Absolument',
        disagree: "Pas du tout d'accord",
        agree: "Tout à fait d'accord",
        finish: 'Terminer ✓',
        previous: '← Précédent',
        next: 'Suivant →',
        warningBack: 'Attention ! Si vous quittez maintenant, vos réponses seront perdues. Voulez-vous vraiment quitter ?',
        completed: 'Merci pour vos réponses !',

        // WCST
        wcstSubtitle: 'Wisconsin Card Sorting Test',
        cardToSort: 'Carte à trier',
        correct: 'Correct !',
        incorrect: 'Incorrect',
        sessionComplete: 'Session Terminée !',
        thanksMessage: 'Merci beaucoup pour votre participation ! 🌟',
        greatJob: 'Vous avez fait du super travail.',
        results: '📊 Résultats',
        maxTrials: "Nombre d'essais max",
        seed: 'Seed',

        // WCST Tutorial
        tutorialTitle: 'Bienvenue dans le test',
        tutorialIntro: 'Tu vas voir quatre cartes modèles en haut de l\'écran et une carte à placer en bas. Ton rôle est de choisir à quelle carte modèle elle ressemble le plus.',
        tutorialMatch: 'Tu peux te baser sur :',
        tutorialColor: 'la couleur',
        tutorialShape: 'la forme',
        tutorialNumber: 'le nombre d\'objets sur la carte',
        tutorialImportant: 'Important :',
        tutorialRules: "Il n'y a pas d'explication au début. Tu dois simplement essayer, et Pop'Balloons te dira si ta réponse est correcte ou incorrecte.",
        tutorialChange: 'La règle peut changer sans prévenir, alors continue d\'observer les indices pour t\'adapter.',
        tutorialReady: 'Prends ton temps, mais garde un bon rythme. Si tu es prêt·e, appuie pour commencer.'
    },
    en: {
        // Common
        back: '← Back',
        settings: 'Settings',
        language: 'Language',
        sound: 'Sound',
        theme: 'Theme',
        close: 'Close',
        on: 'On',
        off: 'Off',
        classic: 'Classic',
        forest: 'Forest',
        participant: 'Participant',
        downloadCSV: '📥 Download CSV',
        start: 'START',

        // Tool Selector
        toolkitTitle: 'PRISME',
        toolkitSubtitle: 'Toolkit',
        toolkitVersion: 'v1.0',
        participantId: 'Participant ID',
        participantPlaceholder: 'E.g.: P001',
        enterParticipant: '⚠️ Please enter a participant ID to continue',
        wcstTitle: 'WCST',
        wcstDesc: 'Wisconsin Card Sorting Test',
        susTitle: 'Usability Questionnaire',
        susDesc: 'Usability Questionnaire',

        // SUS
        usability: 'Usability Questionnaire',
        intro1: 'We will ask you',
        intro2: '10 questions',
        intro3: 'to find out how you enjoyed the game.',
        intro4: 'For each question, indicate your level of agreement.',
        question: 'Question',
        recommend: "Would you recommend Pop'Balloons to other people?",
        notAtAll: 'Definitely not',
        absolutely: 'Absolutely',
        disagree: 'Strongly disagree',
        agree: 'Strongly agree',
        finish: 'Finish ✓',
        previous: '← Previous',
        next: 'Next →',
        warningBack: 'Warning! If you leave now, your answers will be lost. Do you really want to leave?',
        completed: 'Thank you for your answers!',

        // WCST
        wcstSubtitle: 'Wisconsin Card Sorting Test',
        cardToSort: 'Card to sort',
        correct: 'Correct!',
        incorrect: 'Incorrect',
        sessionComplete: 'Session Complete!',
        thanksMessage: 'Thank you so much for your participation! 🌟',
        greatJob: 'You did a great job.',
        results: '📊 Results',
        maxTrials: 'Max trials',
        seed: 'Seed',

        // WCST Tutorial
        tutorialTitle: 'Welcome to the test',
        tutorialIntro: 'You will see four model cards at the top of the screen and one card to sort at the bottom. Your task is to choose the model card that matches it the best.',
        tutorialMatch: 'You can match based on:',
        tutorialColor: 'color',
        tutorialShape: 'shape',
        tutorialNumber: 'number of items',
        tutorialImportant: 'Important:',
        tutorialRules: "No instructions are given at first. Try your best, and Pop'Balloons will tell you if your choice is correct or incorrect.",
        tutorialChange: 'The sorting rule may change without warning, so keep paying attention and adjust as needed.',
        tutorialReady: 'Take your time but keep a steady pace. When you\'re ready, tap to begin.'
    }
}

// Settings Modal Component
interface SettingsModalProps {
    onClose: () => void
    showTheme?: boolean
}

export function SettingsModal({ onClose, showTheme = false }: SettingsModalProps) {
    const { settings, setLanguage, setSoundEnabled, setTheme } = useSettings()
    const t = T[settings.language]

    return (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal" style={{ maxWidth: 400 }}>
                <h2>{t.settings}</h2>

                <div className="modal-option">
                    <label>{t.language}</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button
                            className={settings.language === 'fr' ? 'primary' : 'secondary'}
                            onClick={() => setLanguage('fr')}
                            style={{ padding: '6px 14px' }}
                        >
                            FR
                        </button>
                        <button
                            className={settings.language === 'en' ? 'primary' : 'secondary'}
                            onClick={() => setLanguage('en')}
                            style={{ padding: '6px 14px' }}
                        >
                            EN
                        </button>
                    </div>
                </div>

                <div className="modal-option">
                    <label>{t.sound}</label>
                    <button
                        className="secondary"
                        onClick={() => setSoundEnabled(!settings.soundEnabled)}
                    >
                        {settings.soundEnabled ? `${t.on} 🔊` : `${t.off} 🔇`}
                    </button>
                </div>

                {showTheme && (
                    <div className="modal-option">
                        <label>{t.theme}</label>
                        <button
                            className="secondary"
                            onClick={() => setTheme(settings.theme === 'classic' ? 'forest' : 'classic')}
                        >
                            {settings.theme === 'classic' ? `🔷 ${t.classic}` : `🌲 ${t.forest}`}
                        </button>
                    </div>
                )}

                <div className="actions" style={{ marginTop: 24 }}>
                    <button className="primary" onClick={onClose}>{t.close}</button>
                </div>
            </div>
        </div>
    )
}
