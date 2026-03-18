/**
 * DocumentStatusBadge — reusable status pill for quotes, contracts, and invoices.
 *
 * Colors use design tokens from src/index.css @theme block.
 * All document status values are handled in a single component to ensure visual
 * consistency across ProjectContractsModal, ProjectDashboardModal, and any future list view.
 */

interface Config {
    label: string;
    className: string;
    dotClass: string;
}

const STATUS_CONFIG: Record<string, Config> = {
    // ── Contract & Quote shared ──────────────────────────────────────────────
    draft: {
        label: 'Brouillon',
        className: 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]',
        dotClass: 'bg-[var(--text-muted)]',
    },
    sent: {
        label: 'Envoyé',
        className: 'bg-brand-light text-brand border-brand/20',
        dotClass: 'bg-brand',
    },
    lu: {
        label: 'Lu',
        className: 'bg-warning-light text-warning border-warning/20',
        dotClass: 'bg-warning',
    },
    archived: {
        label: 'Archivé',
        className: 'bg-[var(--surface)] text-[var(--text-disabled)] border-[var(--border)]',
        dotClass: 'bg-[var(--text-disabled)]',
    },

    // ── Contract specific ────────────────────────────────────────────────────
    signed: {
        label: 'Signé',
        className: 'bg-success-light text-success border-success/20',
        dotClass: 'bg-success',
    },

    // ── Quote specific ───────────────────────────────────────────────────────
    accepted: {
        label: 'Accepté',
        className: 'bg-success-light text-success border-success/20',
        dotClass: 'bg-success',
    },
    rejected: {
        label: 'Rejeté',
        className: 'bg-danger-light text-danger border-danger/20',
        dotClass: 'bg-danger',
    },

    // ── Invoice specific (for ProjectDashboardModal combined list) ───────────
    en_attente: {
        label: 'En attente',
        className: 'bg-warning-light text-warning border-warning/20',
        dotClass: 'bg-warning',
    },
    payé: {
        label: 'Payé',
        className: 'bg-success-light text-success border-success/20',
        dotClass: 'bg-success',
    },
    en_retard: {
        label: 'En retard',
        className: 'bg-danger-light text-danger border-danger/20',
        dotClass: 'bg-danger',
    },
};

interface DocumentStatusBadgeProps {
    status: string;
    className?: string;
}

export function DocumentStatusBadge({ status, className = '' }: DocumentStatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? {
        label: status,
        className: 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]',
        dotClass: 'bg-[var(--text-muted)]',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.className} ${className}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} />
            {config.label}
        </span>
    );
}
