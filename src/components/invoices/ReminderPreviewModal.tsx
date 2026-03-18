import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Send, Sparkles, AlertCircle, Lock } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';
import { trackEvent } from '@/lib/plausible';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useUpdateInvoiceReminder } from '@/hooks/useInvoices';
import type { InvoiceWithProject } from '@/types/invoice';
import type { EmailTemplateType } from '@/types/email';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function selectReminderLevel(daysOverdue: number): EmailTemplateType {
    if (daysOverdue <= 15) return 'relance_1';
    if (daysOverdue <= 30) return 'relance_2';
    if (daysOverdue <= 60) return 'relance_3';
    return 'relance_mise_en_demeure';
}

/** Convert plain text (with **bold** and newlines) to basic HTML for Resend. */
function textToHtml(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ReminderPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: InvoiceWithProject;
    freelanceName: string; // from useProfile
    /** When false, skip Gemini improvement and show template-only mode */
    canUseAI?: boolean;
}

export function ReminderPreviewModal({
    open,
    onOpenChange,
    invoice,
    freelanceName,
    canUseAI = true,
}: ReminderPreviewModalProps) {
    const { getTemplate, substituteVars } = useEmailTemplates();
    const updateReminder = useUpdateInvoiceReminder();

    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [editedSubject, setEditedSubject] = useState('');
    const [editedBody, setEditedBody] = useState('');
    const [geminiError, setGeminiError] = useState<string | null>(null);

    // ── Compute overdue info ──────────────────────────────────────────────────

    const daysOverdue = invoice.due_date
        ? Math.max(0, differenceInDays(new Date(), parseISO(invoice.due_date)))
        : 0;

    const level = selectReminderLevel(daysOverdue);

    const clientName =
        invoice.projects?.clients?.contact_name ||
        invoice.projects?.clients?.name ||
        'Client';

    const clientEmail = invoice.projects?.clients?.email ?? '';
    const projectName = invoice.projects?.name ?? '';
    const reference = invoice.reference ?? `FAC-${invoice.id.slice(0, 8).toUpperCase()}`;
    const amountTtc = Number(invoice.amount).toFixed(2);

    // ── Build base email on modal open ────────────────────────────────────────

    useEffect(() => {
        if (!open) return;

        const tpl = getTemplate(level);
        if (!tpl) {
            setEditedSubject('');
            setEditedBody('');
            return;
        }

        const vars: Record<string, string> = {
            client_name: clientName,
            freelance_name: freelanceName,
            reference,
            amount_ttc: amountTtc,
            days_overdue: String(daysOverdue),
            project_name: projectName,
        };

        const baseSubject = substituteVars(tpl.subject, vars);
        const baseBody = substituteVars(tpl.body, vars);

        setEditedSubject(baseSubject);
        setEditedBody(baseBody);
        setGeminiError(null);

        // Skip Gemini when AI is not available on the user's plan
        if (!canUseAI) return;

        // Call Gemini to improve the email (server-side edge function)
        setIsGenerating(true);

        supabase.auth.getSession().then(({ data: { session } }) => {
            const accessToken = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
            return supabase.functions.invoke('generate-reminder', {
                headers: { Authorization: `Bearer ${accessToken}` },
                body: {
                    base_email: baseBody,
                    doc_title: reference,
                    amount: amountTtc,
                    days_overdue: daysOverdue,
                },
            });
        }).then(({ data, error }) => {
            if (error) {
                setGeminiError("L'IA n'a pas pu améliorer le texte. Vous pouvez l'éditer manuellement.");
            } else {
                const result = data as { improved_email?: string; error?: string };
                if (result.improved_email) {
                    setEditedBody(result.improved_email);
                } else {
                    setGeminiError("L'IA n'a pas renvoyé de résultat. Vous pouvez éditer manuellement.");
                }
            }
        }).catch(() => {
            setGeminiError("Connexion à l'IA impossible. Vous pouvez éditer manuellement.");
        }).finally(() => {
            setIsGenerating(false);
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, level]);

    // ── Send ──────────────────────────────────────────────────────────────────

    const handleSend = async () => {
        if (!clientEmail) {
            toast.error("Aucune adresse e-mail trouvée pour ce client.");
            return;
        }

        setIsSending(true);
        try {
            const result = await sendEmail({
                to: clientEmail,
                subject: editedSubject,
                html: textToHtml(editedBody),
            });

            if (!result.success) {
                throw new Error("L'envoi a échoué côté Resend.");
            }

            await updateReminder.mutateAsync({
                id: invoice.id,
                currentCount: invoice.reminder_count ?? 0,
            });

            trackEvent('reminder_sent');
            toast.success('Relance envoyée !', {
                description: `Email envoyé à ${clientEmail}.`,
            });
            onOpenChange(false);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi";
            toast.error(msg);
        } finally {
            setIsSending(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const levelLabels: Record<string, string> = {
        relance_1: 'Relance 1 (1–15j)',
        relance_2: 'Relance 2 (16–30j)',
        relance_3: 'Relance 3 (31–60j)',
        relance_mise_en_demeure: 'Mise en demeure (60j+)',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[620px] bg-white border-border flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                        <Sparkles className="h-5 w-5 text-brand" />
                        Relance IA — {levelLabels[level]}
                    </DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)] text-sm">
                        Facture <span className="font-semibold text-[var(--text-primary)]">{reference}</span>
                        {' '}· {amountTtc} €
                        {daysOverdue > 0 && (
                            <span className="ml-2 text-danger font-semibold">· {daysOverdue}j de retard</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-2">
                    {/* Destinataire */}
                    <div className="flex items-center gap-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
                        <Send className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                        <span className="text-[var(--text-muted)]">À :</span>
                        {clientEmail ? (
                            <span className="font-semibold text-[var(--text-primary)]">
                                {clientName} &lt;{clientEmail}&gt;
                            </span>
                        ) : (
                            <span className="text-danger font-semibold">Aucun email client — ajoutez-en un dans la fiche client</span>
                        )}
                    </div>

                    {/* Gemini status */}
                    {!canUseAI && (
                        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            <span>Amélioration IA disponible avec le plan Pro. Le modèle de base est prêt à être envoyé.</span>
                        </div>
                    )}
                    {isGenerating && (
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-brand-light border border-brand/20 rounded-lg px-3 py-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                            <span>✦ Amélioration IA en cours…</span>
                        </div>
                    )}
                    {geminiError && (
                        <div className="flex items-center gap-2 text-xs text-warning bg-warning-light border border-warning/20 rounded-lg px-3 py-2">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {geminiError}
                        </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            Objet
                        </label>
                        <Input
                            value={editedSubject}
                            onChange={e => setEditedSubject(e.target.value)}
                            className="border-[var(--border)] bg-[var(--surface)] focus:border-brand"
                            disabled={isGenerating}
                        />
                    </div>

                    {/* Body */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            Corps du message
                            <span className="ml-2 font-normal normal-case text-[var(--text-muted)]">(modifiable)</span>
                        </label>
                        <Textarea
                            value={editedBody}
                            onChange={e => setEditedBody(e.target.value)}
                            className="min-h-[220px] border-[var(--border)] bg-[var(--surface)] focus:border-brand font-mono text-sm resize-y"
                            disabled={isGenerating}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 pt-2 border-t border-[var(--border)]">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 sm:flex-none"
                        disabled={isSending}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isGenerating || isSending || !clientEmail}
                        className="flex-1 sm:flex-none bg-brand text-white hover:bg-[var(--brand-hover)]"
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        Envoyer la relance
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
