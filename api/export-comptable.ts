import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

export const config = { runtime: 'edge' };

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestBody {
    year: number;
    month?: number;
    types: string[];
}

type InvoiceRow = {
    id: string;
    reference: string | null;
    amount: number;
    status: string;
    created_at: string;
    due_date: string | null;
    projects: { name: string; clients: { name: string } | null } | null;
};

type QuoteRow = {
    id: string;
    title: string;
    amount: number | null;
    status: string;
    created_at: string;
    projects: { name: string; clients: { name: string } | null } | null;
};

type ContractRow = {
    id: string;
    title: string;
    status: string;
    created_at: string;
    projects: { name: string; clients: { name: string } | null } | null;
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return json({ error: 'Non autorisé' }, 401);
    }

    const supabaseUrl  = process.env.SUPABASE_URL ?? '';
    const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    const anonKey      = process.env.SUPABASE_ANON_KEY ?? '';

    if (!supabaseUrl || !serviceKey || !anonKey) {
        return json({ error: 'Configuration serveur manquante' }, 500);
    }

    // Verify JWT
    const anonClient = createClient(supabaseUrl, anonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
        return json({ error: 'Non autorisé' }, 401);
    }

    let body: RequestBody;
    try {
        body = await req.json() as RequestBody;
    } catch {
        return json({ error: 'Corps de requête invalide' }, 400);
    }

    const { year, month, types } = body;
    if (!year || !Array.isArray(types) || types.length === 0) {
        return json({ error: 'Paramètres invalides' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Build date range
    const startDate = month
        ? new Date(year, month - 1, 1)
        : new Date(year, 0, 1);
    const endDate = month
        ? new Date(year, month, 0, 23, 59, 59)   // last day of month
        : new Date(year, 11, 31, 23, 59, 59);

    const zip = new JSZip();

    // ── Invoices ─────────────────────────────────────────────────────────────

    let invoiceRows: InvoiceRow[] = [];

    if (types.includes('factures') || types.includes('registre')) {
        const { data } = await admin
            .from('invoices')
            .select('id, reference, amount, status, created_at, due_date, projects(name, clients(name))')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: true });
        invoiceRows = (data ?? []) as unknown as InvoiceRow[];
    }

    if (types.includes('registre')) {
        zip.file('Registre.csv', generateInvoicesCsv(invoiceRows));
    }

    if (types.includes('factures')) {
        const folder = zip.folder('Factures');
        for (const inv of invoiceRows) {
            const clientName = sanitize(inv.projects?.clients?.name ?? 'Client');
            const name = `${inv.created_at.slice(0, 7)}-${clientName}-Facture.txt`;
            folder?.file(name, invoiceToText(inv));
        }
    }

    // ── Signed quotes ─────────────────────────────────────────────────────────

    if (types.includes('devis')) {
        const { data } = await admin
            .from('quotes')
            .select('id, title, amount, status, created_at, projects(name, clients(name))')
            .eq('user_id', user.id)
            .eq('status', 'signed')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: true });

        const rows = (data ?? []) as unknown as QuoteRow[];
        const folder = zip.folder('Devis_signes');
        for (const q of rows) {
            const clientName = sanitize(q.projects?.clients?.name ?? 'Client');
            const name = `${q.created_at.slice(0, 7)}-${clientName}-Devis.txt`;
            folder?.file(name, quoteToText(q));
        }
    }

    // ── Contracts ─────────────────────────────────────────────────────────────

    if (types.includes('contrats')) {
        const { data } = await admin
            .from('project_contracts')
            .select('id, title, status, created_at, projects(name, clients(name))')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: true });

        const rows = (data ?? []) as unknown as ContractRow[];
        const folder = zip.folder('Contrats');
        for (const c of rows) {
            const clientName = sanitize(c.projects?.clients?.name ?? 'Client');
            const name = `${c.created_at.slice(0, 7)}-${clientName}-Contrat.txt`;
            folder?.file(name, contractToText(c));
        }
    }

    // ── Build ZIP ─────────────────────────────────────────────────────────────

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const suffix = month ? `-${String(month).padStart(2, '0')}` : '';
    const filename = `Prezta-Export-Comptable-${year}${suffix}.zip`;

    return new Response(zipBuffer, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}

// ─── CSV generator ────────────────────────────────────────────────────────────

function generateInvoicesCsv(invoices: InvoiceRow[]): string {
    const BOM    = '\uFEFF';
    const header = 'Numéro;Client;Projet;Montant HT;TVA (20%);Montant TTC;Statut;Date émission;Date échéance';
    const rows   = invoices.map(inv => [
        inv.reference ?? inv.id.slice(0, 8),
        inv.projects?.clients?.name ?? 'Inconnu',
        inv.projects?.name ?? '-',
        Number(inv.amount).toFixed(2),
        (Number(inv.amount) * 0.2).toFixed(2),
        (Number(inv.amount) * 1.2).toFixed(2),
        inv.status,
        inv.created_at.slice(0, 10),
        inv.due_date?.slice(0, 10) ?? '',
    ].join(';'));
    return BOM + [header, ...rows].join('\n');
}

// ─── Text formatters ──────────────────────────────────────────────────────────

function invoiceToText(inv: InvoiceRow): string {
    return [
        `Numéro   : ${inv.reference ?? inv.id.slice(0, 8)}`,
        `Client   : ${inv.projects?.clients?.name ?? 'Inconnu'}`,
        `Projet   : ${inv.projects?.name ?? '-'}`,
        `HT       : ${Number(inv.amount).toFixed(2)} €`,
        `TVA 20%  : ${(Number(inv.amount) * 0.2).toFixed(2)} €`,
        `TTC      : ${(Number(inv.amount) * 1.2).toFixed(2)} €`,
        `Statut   : ${inv.status}`,
        `Émission : ${inv.created_at.slice(0, 10)}`,
        `Échéance : ${inv.due_date?.slice(0, 10) ?? '-'}`,
    ].join('\n');
}

function quoteToText(q: QuoteRow): string {
    return [
        `Devis    : ${q.title}`,
        `Client   : ${q.projects?.clients?.name ?? 'Inconnu'}`,
        `Projet   : ${q.projects?.name ?? '-'}`,
        `Montant  : ${q.amount != null ? Number(q.amount).toFixed(2) + ' €' : '-'}`,
        `Statut   : ${q.status}`,
        `Date     : ${q.created_at.slice(0, 10)}`,
    ].join('\n');
}

function contractToText(c: ContractRow): string {
    return [
        `Contrat  : ${c.title}`,
        `Client   : ${c.projects?.clients?.name ?? 'Inconnu'}`,
        `Projet   : ${c.projects?.name ?? '-'}`,
        `Statut   : ${c.status}`,
        `Date     : ${c.created_at.slice(0, 10)}`,
    ].join('\n');
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sanitize(s: string): string {
    return s.replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g, '_').slice(0, 40);
}

function json(body: Record<string, unknown>, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
