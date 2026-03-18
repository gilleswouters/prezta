import { useState, useMemo } from 'react';
import { Bell, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpiringContracts } from '@/hooks/useContracts';
import { useBusinessAnalytics } from '@/hooks/useBusinessAnalytics';
import { useProfile } from '@/hooks/useProfile';
import { differenceInDays, parseISO, addMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// ─── localStorage helpers ─────────────────────────────────────────────────────

const DISMISSED_KEY = 'prezta_dismissed_notifs';

function getDismissed(): string[] {
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]'); }
    catch { return []; }
}

function saveDismissed(ids: string[]): void {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

// ─── Notification types ───────────────────────────────────────────────────────

interface ContractNotif {
    type: 'contract';
    id: string;
    title: string;
    daysLeft: number;
    projectName: string | null;
    projectId: string | null;
}

interface SeasonalityNotif {
    type: 'seasonality';
    id: string;
    nextMonthName: string;
}

type AnyNotif = ContractNotif | SeasonalityNotif;

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
    const navigate = useNavigate();
    const { data: contracts } = useExpiringContracts();
    const { data: analytics } = useBusinessAnalytics();
    const { data: profile } = useProfile();
    const [dismissed, setDismissed] = useState<string[]>(getDismissed);
    const [open, setOpen] = useState(false);

    const now = new Date();

    // Compute next-month quiet detection
    const nextMonthLabel = useMemo(() => {
        const raw = format(addMonths(now, 1), 'MMMM', { locale: fr });
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    }, []);

    const nextMonthKey = format(addMonths(now, 1), 'yyyy-MM');
    const seasonalityNotifId = `seasonality-${nextMonthKey}`;

    const notifications = useMemo((): AnyNotif[] => {
        const result: AnyNotif[] = [];

        // Contract expiry notifications
        (contracts ?? [])
            .filter(c => !dismissed.includes(c.id))
            .forEach(c => {
                result.push({
                    type: 'contract',
                    id: c.id,
                    title: c.title,
                    daysLeft: differenceInDays(parseISO(c.expires_at), now),
                    projectName: c.projects?.name ?? null,
                    projectId: c.projects?.id ?? null,
                });
            });

        // Seasonality notification
        const seasonalityEnabled = profile?.seasonality_enabled !== false; // default true
        if (
            seasonalityEnabled &&
            analytics?.hasEnoughData &&
            analytics.quietMonths.includes(nextMonthLabel) &&
            !dismissed.includes(seasonalityNotifId)
        ) {
            result.push({
                type: 'seasonality',
                id: seasonalityNotifId,
                nextMonthName: nextMonthLabel,
            });
        }

        return result;
    }, [contracts, analytics, profile, dismissed, nextMonthLabel, seasonalityNotifId]);

    const count = notifications.length;

    function handleDismissAll() {
        const ids = notifications.map(n => n.id);
        const next = [...new Set([...dismissed, ...ids])];
        setDismissed(next);
        saveDismissed(next);
        setOpen(false);
    }

    function handleDismissOne(id: string) {
        const next = [...dismissed, id];
        setDismissed(next);
        saveDismissed(next);
    }

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-text-muted hover:text-text-primary"
                onClick={() => setOpen(v => !v)}
                aria-label="Notifications"
            >
                <Bell className="h-4 w-4" />
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[9px] font-black bg-red-500 text-white rounded-full flex items-center justify-center leading-none">
                        {count}
                    </span>
                )}
            </Button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <span className="font-bold text-sm text-text-primary">Notifications</span>
                            {count > 0 && (
                                <button
                                    className="text-xs text-text-muted hover:text-text-primary underline underline-offset-2"
                                    onClick={handleDismissAll}
                                >
                                    Tout marquer comme lu
                                </button>
                            )}
                        </div>

                        <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
                            {count === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-text-muted">
                                    Aucune notification en attente
                                </div>
                            ) : (
                                notifications.map(n => {
                                    if (n.type === 'contract') {
                                        return (
                                            <div
                                                key={n.id}
                                                className="px-4 py-3 hover:bg-surface-hover cursor-pointer flex items-start gap-3"
                                            >
                                                <div
                                                    className="flex-1 min-w-0"
                                                    onClick={() => {
                                                        setOpen(false);
                                                        navigate(n.projectId ? `/projets?open=${n.projectId}` : '/projets');
                                                    }}
                                                >
                                                    <p className="text-sm font-semibold text-text-primary truncate">
                                                        {n.title}
                                                    </p>
                                                    <p className="text-xs text-text-muted mt-0.5">
                                                        {n.projectName ?? 'Sans projet'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                                        n.daysLeft <= 7
                                                            ? 'bg-red-100 text-red-600'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {n.daysLeft <= 7 ? `⚠ J-${n.daysLeft}` : `J-${n.daysLeft}`}
                                                    </span>
                                                    <button
                                                        className="text-[10px] text-text-muted hover:text-text-primary underline"
                                                        onClick={() => handleDismissOne(n.id)}
                                                    >
                                                        Lu
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Seasonality notification
                                    return (
                                        <div
                                            key={n.id}
                                            className="px-4 py-3 hover:bg-surface-hover cursor-pointer flex items-start gap-3"
                                        >
                                            <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                                <TrendingDown className="h-3.5 w-3.5 text-blue-600" />
                                            </div>
                                            <div
                                                className="flex-1 min-w-0"
                                                onClick={() => { setOpen(false); navigate('/revenus'); }}
                                            >
                                                <p className="text-sm font-semibold text-text-primary">
                                                    Mois creux à venir : {n.nextMonthName}
                                                </p>
                                                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                                                    {n.nextMonthName} est historiquement votre mois le plus calme.
                                                    Anticipez en prospectant dès maintenant.
                                                </p>
                                            </div>
                                            <button
                                                className="text-[10px] text-text-muted hover:text-text-primary underline shrink-0 mt-1"
                                                onClick={() => handleDismissOne(n.id)}
                                            >
                                                Lu
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {count > 0 && (
                            <div className="px-4 py-2 border-t border-border bg-surface/50">
                                <p className="text-[10px] text-text-muted text-center">
                                    Contrats expirants et alertes de saisonnalité
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
