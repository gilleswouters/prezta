import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

// ─── Types ────────────────────────────────────────────────────────────────────

interface OptimizableTask {
    id: string;
    title: string;
    clientName: string;
    address: string;
    currentOrder: number;
}

interface RequestBody {
    tasks: OptimizableTask[];
    userAddress: string;
}

interface OptimizeResult {
    optimizedOrder: string[];
    timeSaved: number;
    summary: string;
    error?: string;
}

interface DistanceMatrixResponse {
    rows: Array<{
        elements: Array<{
            status: string;
            duration?: { value: number; text: string };
        }>;
    }>;
}

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function originalOrder(tasks: OptimizableTask[]): OptimizeResult {
    return {
        optimizedOrder: tasks.map(t => t.id),
        timeSaved: 0,
        summary: 'Votre planning est déjà optimal.',
    };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    // JWT verification
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
        return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 });
    }

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!,
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Session invalide' }), { status: 401 });
    }

    const body = await req.json() as RequestBody;
    const { tasks, userAddress } = body;

    if (!tasks || tasks.length < 2) {
        return new Response(JSON.stringify(originalOrder(tasks ?? [])), { status: 200 });
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

    if (!GOOGLE_MAPS_API_KEY || !GEMINI_API_KEY) {
        return new Response(
            JSON.stringify({ ...originalOrder(tasks), error: 'Configuration manquante' }),
            { status: 200 },
        );
    }

    // ── Step 1: Google Maps Distance Matrix ──────────────────────────────────
    const allAddresses = [userAddress, ...tasks.map(t => t.address)];
    const origins = encodeURIComponent(allAddresses.join('|'));
    const destinations = encodeURIComponent(allAddresses.join('|'));

    const mapsUrl =
        `https://maps.googleapis.com/maps/api/distancematrix/json` +
        `?origins=${origins}&destinations=${destinations}` +
        `&mode=driving&language=fr&key=${GOOGLE_MAPS_API_KEY}`;

    let matrixText = 'Matrice de temps de trajet non disponible.';
    try {
        const mapsRes = await fetch(mapsUrl);
        const mapsData = await mapsRes.json() as DistanceMatrixResponse;

        if (mapsData.rows) {
            const lines: string[] = [];
            const labels = ['Domicile', ...tasks.map(t => t.clientName)];
            mapsData.rows.forEach((row, i) => {
                row.elements.forEach((el, j) => {
                    if (i !== j && el.status === 'OK' && el.duration) {
                        lines.push(
                            `${labels[i]} → ${labels[j]} : ${Math.round(el.duration.value / 60)} min`,
                        );
                    }
                });
            });
            matrixText = lines.join('\n');
        }
    } catch {
        // Continue with Gemini even if Maps fails
    }

    // ── Step 2: Gemini 2.0 Flash ─────────────────────────────────────────────
    const taskList = tasks
        .map((t, i) => `${i + 1}. ${t.title} — ${t.clientName} (${t.address})`)
        .join('\n');

    const prompt = `Tu es un assistant de planification pour un freelance français.
Voici les temps de trajet en minutes entre ces adresses :
${matrixText}

Tâches du jour :
${taskList}

Propose l'ordre de visite optimal pour minimiser les déplacements. Réponds uniquement en JSON valide, sans markdown :
{ "optimizedOrder": ["id1","id2",...], "timeSaved": <minutes économisées (nombre entier)>, "summary": "<une phrase en français expliquant l'optimisation>" }

Les IDs des tâches sont : ${tasks.map(t => `"${t.id}"`).join(', ')}.`;

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
                }),
            },
        );

        const geminiData = await geminiRes.json() as GeminiResponse;
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        // Strip markdown fences if present
        const jsonText = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonText) as OptimizeResult;

        // Validate task IDs
        const validIds = new Set(tasks.map(t => t.id));
        const allValid = parsed.optimizedOrder?.every(id => validIds.has(id));
        if (!allValid || parsed.optimizedOrder.length !== tasks.length) {
            return new Response(JSON.stringify(originalOrder(tasks)), { status: 200 });
        }

        return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch {
        return new Response(
            JSON.stringify({ ...originalOrder(tasks), error: 'Optimisation indisponible' }),
            { status: 200 },
        );
    }
}
