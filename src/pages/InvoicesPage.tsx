import { useState } from 'react';
import { useInvoices, useDeleteInvoice, useArchiveInvoice, useUnarchiveInvoice } from '@/hooks/useInvoices';
import { InvoiceModal } from '@/components/invoices/InvoiceModal';
import { ReminderPreviewModal } from '@/components/invoices/ReminderPreviewModal';
import { InvoicePDFDocument } from '@/components/invoices/pdf/InvoicePDFDocument';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit3, Trash2, Calendar, HandCoins, AlertCircle, Bell, Archive, ChevronDown, MoreVertical, ArchiveRestore, FileDown, Loader2 } from 'lucide-react';
import { InvoiceStatus, type InvoiceWithProject } from '@/types/invoice';
import { differenceInDays, parseISO } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { ProfileCompleteBanner } from '@/components/ui/ProfileCompleteBanner';
import { PlanLimitModal } from '@/components/ui/PlanLimitModal';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { generateDocumentName } from '@/lib/document-naming';
import { generateFacturXXML, generateFacturXPDF, type FacturXClient } from '@/lib/facturx';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InvoicesPage() {
    const { data: invoices, isLoading } = useInvoices();
    const deleteInvoice = useDeleteInvoice();
    const archiveInvoice = useArchiveInvoice();
    const unarchiveInvoice = useUnarchiveInvoice();
    const { data: profile } = useProfile();
    const { data: subscription } = useSubscription();
    const { canCreateDocument, documentsUsed, documentsLimit, isNearDocumentLimit } = usePlanLimits();
    const isPro = subscription?.isPro ?? false;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [facturxLoading, setFacturxLoading] = useState<string | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithProject | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
    const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceWithProject | null>(null);
    const [reminderInvoice, setReminderInvoice] = useState<InvoiceWithProject | null>(null);
    const [planLimitOpen, setPlanLimitOpen] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    const handleOpenModal = (invoice?: InvoiceWithProject) => {
        if (!invoice && !canCreateDocument) {
            setPlanLimitOpen(true);
            return;
        }
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        if (invoiceToDelete) {
            await deleteInvoice.mutateAsync(invoiceToDelete.id);
            setInvoiceToDelete(null);
        }
    };

    const isOverdue = (invoice: InvoiceWithProject) => {
        if (invoice.status === InvoiceStatus.PAID || !invoice.due_date) return false;
        return new Date(invoice.due_date) < new Date();
    };

    const activeInvoices = invoices?.filter(i => i.status !== InvoiceStatus.ARCHIVED) ?? [];
    const archivedInvoices = invoices?.filter(i => i.status === InvoiceStatus.ARCHIVED) ?? [];

    const filteredInvoices = activeInvoices.filter(inv => {
        const term = searchTerm.toLowerCase();
        const projectName = inv.projects?.name ?? '';
        const matchSearch =
            projectName.toLowerCase().includes(term) ||
            (inv.notes || '').toLowerCase().includes(term);
        const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // Calculs Rapides
    const totalCollected = activeInvoices.filter(i => i.status === InvoiceStatus.PAID).reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const totalPending = activeInvoices.filter(i => i.status === InvoiceStatus.PENDING).reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const totalLate = activeInvoices.filter(i => i.status === InvoiceStatus.LATE).reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const freelanceName = profile?.full_name || profile?.company_name || 'Votre prestataire';

    // ── PDF helpers ─────────────────────────────────────────────────────────────

    function triggerBlobDownload(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function downloadStandardPDF(inv: InvoiceWithProject) {
        const clientName = inv.projects?.clients?.name ?? 'Client';
        const filename = generateDocumentName('Facture', clientName, inv.created_at.slice(0, 10));
        const element = React.createElement(InvoicePDFDocument, {
            invoice: inv,
            profile: profile ?? null,
            client: inv.projects?.clients,
            isPro,
        });
        const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob();
        triggerBlobDownload(blob, filename);
    }

    async function downloadFacturXInvoice(inv: InvoiceWithProject) {
        if (!profile) return;
        setFacturxLoading(inv.id);
        try {
            const clientName = inv.projects?.clients?.name ?? 'Client';
            const clientData: FacturXClient = {
                name: clientName,
                address: null,
                vat_number: null,
                email: inv.projects?.clients?.email ?? null,
            };
            const xmlString = generateFacturXXML(inv, profile, clientData);
            const element = React.createElement(InvoicePDFDocument, {
                invoice: inv,
                profile,
                client: inv.projects?.clients,
                isPro: true,
            });
            const pdfBytes = await generateFacturXPDF(element as Parameters<typeof pdf>[0], xmlString);
            const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
            const base = generateDocumentName('Facture', clientName, inv.created_at.slice(0, 10));
            triggerBlobDownload(blob, base.replace('.pdf', '-facturx.pdf'));
        } finally {
            setFacturxLoading(null);
        }
    }

    return (
        <div className="space-y-6">
            <ProfileCompleteBanner profile={profile} />

            {/* Near-limit banner */}
            {isNearDocumentLimit && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>
                        Vous avez utilisé <strong>{documentsUsed}/{documentsLimit}</strong> documents actifs de votre plan.{' '}
                        Archivez des documents anciens ou{' '}
                        <button onClick={() => setPlanLimitOpen(true)} className="underline font-semibold">passez au Pro</button>.
                    </span>
                </div>
            )}

            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-text-primary mb-1 tracking-tight">Registre de facturation</h1>
                    <p className="text-text-secondary">Suivez vos encaissements et gérez vos paiements en attente.</p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    disabled={!canCreateDocument}
                    className="bg-brand text-white hover:bg-brand-hover shadow-md font-semibold h-11 px-6 disabled:opacity-60"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Ajouter un encaissement
                </Button>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-text-secondary mb-1">Total encaissé</p>
                        <p className="text-2xl font-black text-text-primary">{totalCollected.toFixed(2)} €</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-success-light flex items-center justify-center text-success">
                        <HandCoins className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-text-secondary mb-1">En attente</p>
                        <p className="text-2xl font-black text-text-primary">{totalPending.toFixed(2)} €</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-warning-light flex items-center justify-center text-warning">
                        <Calendar className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-text-secondary mb-1">En retard</p>
                        <p className="text-2xl font-black text-danger">{totalLate.toFixed(2)} €</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-danger-light flex items-center justify-center text-danger">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <Input
                        placeholder="Rechercher par projet ou note..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-surface2 border-border focus-visible:ring-brand w-full"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <Button
                        variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('ALL')}
                        className={`h-9 px-4 text-sm font-semibold whitespace-nowrap rounded-full ${statusFilter === 'ALL' ? 'bg-text-primary text-white' : 'text-text-secondary border-border hover:bg-surface-hover'}`}
                    >
                        Tous
                    </Button>
                    <Button
                        variant={statusFilter === InvoiceStatus.PAID ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(InvoiceStatus.PAID)}
                        className={`h-9 px-4 text-sm font-semibold whitespace-nowrap rounded-full ${statusFilter === InvoiceStatus.PAID ? 'bg-success text-white border-success' : 'text-text-secondary border-border hover:bg-surface-hover'}`}
                    >
                        Payés
                    </Button>
                    <Button
                        variant={statusFilter === InvoiceStatus.PENDING ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(InvoiceStatus.PENDING)}
                        className={`h-9 px-4 text-sm font-semibold whitespace-nowrap rounded-full ${statusFilter === InvoiceStatus.PENDING ? 'bg-warning text-white border-warning' : 'text-text-secondary border-border hover:bg-surface-hover'}`}
                    >
                        En attente
                    </Button>
                    <Button
                        variant={statusFilter === InvoiceStatus.LATE ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(InvoiceStatus.LATE)}
                        className={`h-9 px-4 text-sm font-semibold whitespace-nowrap rounded-full ${statusFilter === InvoiceStatus.LATE ? 'bg-danger text-white border-danger' : 'text-text-secondary border-border hover:bg-surface-hover'}`}
                    >
                        En retard
                    </Button>
                </div>
            </div>

            {/* Liste */}
            {isLoading ? (
                <div className="text-center py-20 text-text-muted animate-pulse">Chargement du registre...</div>
            ) : filteredInvoices.length === 0 ? (
                <div className="bg-white border text-center border-dashed border-border rounded-xl p-16 flex flex-col items-center justify-center">
                    <div className="h-16 w-16 bg-brand-light rounded-full flex items-center justify-center mb-4">
                        <HandCoins className="h-8 w-8 text-brand" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">Aucun enregistrement trouvé</h3>
                    <p className="text-text-secondary max-w-sm mx-auto mb-6">
                        Créez votre première entrée pour assurer le suivi de vos encaissements.
                    </p>
                    <Button onClick={() => handleOpenModal()} className="bg-brand text-white hover:bg-brand-hover shadow-md font-semibold h-11 px-6">
                        <Plus className="h-5 w-5 mr-2" />
                        Nouveau paiement
                    </Button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-surface2 text-text-secondary uppercase text-xs font-bold border-b border-border">
                                <tr>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4">Projet / Client</th>
                                    <th className="px-6 py-4">Montant TTC</th>
                                    <th className="px-6 py-4">Échéance</th>
                                    <th className="px-6 py-4">Payée le</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((inv) => {
                                    const daysSinceReminder = inv.last_reminder_sent_at
                                        ? differenceInDays(new Date(), parseISO(inv.last_reminder_sent_at))
                                        : null;

                                    return (
                                        <tr key={inv.id} className="border-b border-border hover:bg-surface-hover transition-colors group">
                                            <td className="px-6 py-4">
                                                {inv.status === InvoiceStatus.PAID && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-light text-success border border-success/20">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div> Payé
                                                    </span>
                                                )}
                                                {inv.status === InvoiceStatus.PENDING && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-light text-warning border border-warning/20">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-warning"></div> En attente
                                                    </span>
                                                )}
                                                {inv.status === InvoiceStatus.LATE && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-light text-danger-hover border border-danger/20">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-danger"></div> En retard
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-text-primary">
                                                {inv.projects?.name ?? <span className="text-text-muted italic">Sans projet</span>}
                                                {inv.notes && (
                                                    <p className="text-xs text-text-secondary mt-1 font-normal line-clamp-1">{inv.notes}</p>
                                                )}
                                                {/* Reminder tracking */}
                                                {inv.reminder_count > 0 && daysSinceReminder !== null && (
                                                    <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                                                        <Bell className="h-2.5 w-2.5" />
                                                        Relancé il y a {daysSinceReminder}j ({inv.reminder_count} fois)
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-black text-text-primary">
                                                {Number(inv.amount || 0).toFixed(2)} €
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                {inv.paid_date ? new Date(inv.paid_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* PDF download — split button for Pro */}
                                                    {isPro ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 px-2.5 text-xs border-border text-text-secondary gap-1"
                                                                    disabled={facturxLoading === inv.id}
                                                                >
                                                                    {facturxLoading === inv.id
                                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        : <FileDown className="h-3.5 w-3.5" />
                                                                    }
                                                                    <ChevronDown className="h-3 w-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-white border-border">
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-sm"
                                                                    onClick={() => downloadStandardPDF(inv)}
                                                                >
                                                                    <FileDown className="h-4 w-4 mr-2 text-text-muted" />
                                                                    Télécharger PDF standard
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-sm"
                                                                    onClick={() => downloadFacturXInvoice(inv)}
                                                                >
                                                                    <FileDown className="h-4 w-4 mr-2 text-brand" />
                                                                    <span>
                                                                        Télécharger Factur-X
                                                                        <span className="ml-1.5 text-[10px] font-bold bg-brand-light text-brand px-1.5 py-0.5 rounded">
                                                                            Conforme FR 2026
                                                                        </span>
                                                                    </span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-text-muted hover:text-brand hover:bg-brand-light"
                                                            title="Télécharger PDF"
                                                            onClick={() => downloadStandardPDF(inv)}
                                                        >
                                                            <FileDown className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {(inv.status === InvoiceStatus.PENDING || inv.status === InvoiceStatus.LATE) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setReminderInvoice(inv)}
                                                            className={`h-8 w-8 ${isOverdue(inv) ? 'text-indigo-600 hover:bg-indigo-50' : 'text-text-muted hover:text-indigo-600 hover:bg-indigo-50'}`}
                                                            title="Envoyer une relance IA"
                                                        >
                                                            <div className="relative">
                                                                <Bell className="h-4 w-4" />
                                                                {isOverdue(inv) && (
                                                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Button>
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-white border-border">
                                                            <DropdownMenuItem onClick={() => handleOpenModal(inv)} className="cursor-pointer">
                                                                <Edit3 className="h-4 w-4 mr-2 text-text-muted" />
                                                                Modifier
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => archiveInvoice.mutate(inv.id)}
                                                                className="cursor-pointer text-text-muted"
                                                            >
                                                                <Archive className="h-4 w-4 mr-2" />
                                                                Archiver
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => setInvoiceToDelete(inv)}
                                                                className="cursor-pointer text-danger focus:text-danger focus:bg-danger-light"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Archived invoices section */}
            {archivedInvoices.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowArchived(v => !v)}
                        className="w-full flex items-center gap-2 px-5 py-3 text-sm font-semibold text-text-muted hover:bg-surface2 transition-colors"
                    >
                        <Archive className="h-4 w-4" />
                        Documents archivés ({archivedInvoices.length})
                        <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                    </button>
                    {showArchived && (
                        <div className="overflow-x-auto border-t border-border">
                            <table className="w-full text-sm text-left">
                                <tbody>
                                    {archivedInvoices.map(inv => (
                                        <tr key={inv.id} className="border-b border-border opacity-60 hover:opacity-80 transition-opacity">
                                            <td className="px-6 py-3 font-semibold text-text-primary">
                                                {inv.projects?.name ?? <span className="italic text-text-muted">Sans projet</span>}
                                            </td>
                                            <td className="px-6 py-3 font-black text-text-primary">
                                                {Number(inv.amount || 0).toFixed(2)} €
                                            </td>
                                            <td className="px-6 py-3 text-text-muted">
                                                {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs text-text-muted hover:text-brand"
                                                    onClick={() => unarchiveInvoice.mutate(inv.id)}
                                                >
                                                    <ArchiveRestore className="h-3.5 w-3.5 mr-1" />
                                                    Désarchiver
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <InvoiceModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                invoice={selectedInvoice}
            />

            {reminderInvoice && (
                <ReminderPreviewModal
                    open={!!reminderInvoice}
                    onOpenChange={(v) => { if (!v) setReminderInvoice(null); }}
                    invoice={reminderInvoice}
                    freelanceName={freelanceName}
                />
            )}

            <PlanLimitModal
                open={planLimitOpen}
                onOpenChange={setPlanLimitOpen}
                limitType="documents actifs"
                used={documentsUsed}
                limit={documentsLimit === Infinity ? 9999 : documentsLimit}
            />

            <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
                <AlertDialogContent className="bg-white border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-text-primary">Supprimer la facture</AlertDialogTitle>
                        <AlertDialogDescription className="text-text-secondary">
                            Voulez-vous vraiment supprimer cet enregistrement de {Number(invoiceToDelete?.amount || 0).toFixed(2)} € ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 border-t border-border pt-4">
                        <AlertDialogCancel className="border-border hover:bg-surface-hover text-text-primary">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-danger hover:bg-danger-hover text-white">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
