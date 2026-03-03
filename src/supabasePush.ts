/**
 * supabasePush.ts — PRISME Toolkit
 * Push test results to the shared Supabase database.
 * Called by WCST and SUS when the clinician validates/exports data.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export type TestType = 'WCST' | 'SUS';

export interface PrismeTestResult {
    participant_id: string;
    test_type: TestType;
    completed_at: string;
    payload: Record<string, unknown>;
}

export async function pushTestResult(result: PrismeTestResult): Promise<{ success: boolean; error?: string }> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('[supabasePush] Supabase env vars missing — skipping push.');
        return { success: false, error: 'SUPABASE_ENV_MISSING' };
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/prisme_test_results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify(result),
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('[supabasePush] Push failed:', response.status, text);
            return { success: false, error: `HTTP_${response.status}` };
        }

        console.info('[supabasePush] Result pushed:', result.test_type, result.participant_id);
        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
        console.error('[supabasePush] Network error:', message);
        return { success: false, error: message };
    }
}
