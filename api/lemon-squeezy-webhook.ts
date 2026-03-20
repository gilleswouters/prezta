// Thin proxy — all business logic lives in the Supabase Edge Function.
// Update the Lemon Squeezy webhook URL in the LS dashboard to:
//   https://zpugepezfuzuvxacfmna.supabase.co/functions/v1/lemon-squeezy-webhook

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_FN_URL =
    'https://zpugepezfuzuvxacfmna.supabase.co/functions/v1/lemon-squeezy-webhook';

async function getRawBody(req: VercelRequest): Promise<string> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    const rawBody = await getRawBody(req);

    try {
        const upstream = await fetch(SUPABASE_FN_URL, {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'x-signature':   req.headers['x-signature'] as string ?? '',
            },
            body: rawBody,
        });
        res.status(upstream.status).send(await upstream.text());
    } catch (err) {
        console.error('[LS proxy] Forward error:', err instanceof Error ? err.message : String(err));
        res.status(200).send('OK');
    }
}
