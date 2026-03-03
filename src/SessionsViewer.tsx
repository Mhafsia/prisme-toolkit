/**
 * SessionsViewer.tsx — PRISME Toolkit
 * Reads locked sessions from Supabase and displays them for research review.
 *
 * Required env vars in prisme-toolkit:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */

import { useState, useEffect, useCallback } from 'react';

interface PrismeSession {
    id: string;
    session_id: string;
    protocol_id: string;
    status: string;
    locked_at: string;
    created_at: string;
    payload: Record<string, unknown>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function fetchSessions(protocolFilter?: string): Promise<PrismeSession[]> {
    const params = new URLSearchParams({
        select: '*',
        order: 'locked_at.desc',
        limit: '100',
    });
    if (protocolFilter) params.append('protocol_id', `eq.${protocolFilter}`);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/prisme_sessions?${params}`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
    });
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return res.json();
}

function downloadJSON(session: PrismeSession) {
    const blob = new Blob([JSON.stringify(session.payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.session_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function SessionsViewer({ isFr = true, onBack }: { isFr?: boolean; onBack?: () => void }) {
    const [sessions, setSessions] = useState<PrismeSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [protocolFilter, setProtocolFilter] = useState('');

    const t = isFr
        ? {
            title: 'Sessions PRISME',
            subtitle: 'Sessions cliniques verrouillées reçues automatiquement',
            filter: 'Filtrer par protocole',
            download: 'Télécharger JSON',
            noSessions: 'Aucune session reçue pour le moment.',
            lockedAt: 'Verrouillée le',
            errorMsg: 'Erreur de connexion à la base de données.',
            configMissing: 'Variables d\'environnement Supabase manquantes.',
        }
        : {
            title: 'PRISME Sessions',
            subtitle: 'Locked clinical sessions received automatically',
            filter: 'Filter by protocol',
            download: 'Download JSON',
            noSessions: 'No sessions received yet.',
            lockedAt: 'Locked on',
            errorMsg: 'Database connection error.',
            configMissing: 'Supabase environment variables missing.',
        };

    const load = useCallback(async () => {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            setError(t.configMissing);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSessions(protocolFilter || undefined);
            setSessions(data);
        } catch (err) {
            setError(t.errorMsg);
        } finally {
            setLoading(false);
        }
    }, [protocolFilter, t.configMissing, t.errorMsg]);

    useEffect(() => { load(); }, [load]);

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '0.25rem' }}>{t.title}</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{t.subtitle}</p>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder={t.filter}
                    value={protocolFilter}
                    onChange={e => setProtocolFilter(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                />
                <button
                    onClick={load}
                    style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#4DEB91', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                    ↻
                </button>
            </div>

            {loading && <p style={{ color: '#888' }}>Chargement…</p>}
            {error && <p style={{ color: '#e55', background: '#fee', padding: '0.75rem', borderRadius: '6px' }}>{error}</p>}

            {!loading && !error && sessions.length === 0 && (
                <p style={{ color: '#888', textAlign: 'center', padding: '3rem' }}>{t.noSessions}</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sessions.map(s => (
                    <div
                        key={s.id}
                        style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '10px',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#fafafa',
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{s.session_id}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                                {s.protocol_id} · {t.lockedAt} {new Date(s.locked_at).toLocaleString()}
                            </div>
                        </div>
                        <button
                            onClick={() => downloadJSON(s)}
                            style={{
                                padding: '0.4rem 0.9rem',
                                borderRadius: '6px',
                                border: '1px solid #4DEB91',
                                background: 'white',
                                color: '#1a7a50',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                            }}
                        >
                            ↓ {t.download}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
