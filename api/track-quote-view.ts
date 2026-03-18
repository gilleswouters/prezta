import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

// 1×1 transparent GIF
const TRANSPARENT_GIF_B64 =
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function gifResponse(): Response {
    const binary = atob(TRANSPARENT_GIF_B64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Response(bytes, {
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
        },
    });
}

export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) return gifResponse();

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) return gifResponse();

        const supabase = createClient(supabaseUrl, serviceKey);

        // Find project by portal_link
        const { data: project } = await supabase
            .from('projects')
            .select('id')
            .eq('portal_link', token)
            .maybeSingle();

        if (!project) return gifResponse();

        // Find sent quotes for this project
        const { data: sentQuotes } = await supabase
            .from('quotes')
            .select('id, status_history')
            .eq('project_id', project.id)
            .eq('status', 'sent');

        if (!sentQuotes?.length) return gifResponse();

        const now = new Date().toISOString();

        for (const quote of sentQuotes) {
            const history: Array<{ status: string; at: string }> =
                Array.isArray(quote.status_history) ? quote.status_history : [];

            await supabase
                .from('quotes')
                .update({
                    status: 'lu',
                    viewed_at: now,
                    status_history: [...history, { status: 'lu', at: now }],
                })
                .eq('id', quote.id);
        }
    } catch {
        // Silently fail — always return the pixel
    }

    return gifResponse();
}
