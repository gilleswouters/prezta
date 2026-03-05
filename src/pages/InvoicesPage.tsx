import { useState } from 'react';
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices';
import { InvoiceModal } from '@/components/invoices/InvoiceModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit3, Trash2, Calendar, HandCoins, AlertCircle, Bell, Loader2 } from 'lucide-react';
import { InvoiceStatus, type Invoice } from '@/types/invoice';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
    const [remindingInvoiceId, setRemindingInvoiceId] = useState<string | null>(null);

    const handleOpenModal = (invoice?: Invoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        if (invoiceToDelete) {
            await deleteInvoice.mutateAsync(invoiceToDelete.id);
            setInvoiceToDelete(null);
        }
    };

    const handleRemind = async (invoice: Invoice) => {
        try {
            setRemindingInvoiceId(invoice.id);
            const { error } = await supabase.functions.invoke('send-invoice-reminder', {
                body: { invoice_id: invoice.id }
            });

            if (error) throw error;

            toast.success("Relance envoyée !", { description: "Le client a reçu un email de rappel." });
            // Ideally invalidate query here or let it refresh naturally
        } catch (error: any) {
            console.error("Erreur d'envoi de la relance :", error);
            toast.error("Erreur lors de la relance.", { description: error.message });
        } finally {
            setRemindingInvoiceId(null);
        }
    };

    const isOverdue = (invoice: Invoice) => {
        if (invoice.status === InvoiceStatus.PAID || !invoice.due_date) return false;
        return new Date(invoice.due_date) < new Date();
    };

    const filteredInvoices = invoices?.filter(inv => {
        const term = searchTerm.toLowerCase();
        // Gérer le cas où projects est retourné comme un tableau par Supabase
        const projectName = Array.isArray(inv.projects) ? inv.projects[0]?.name : (inv.projects as any)?.name;

        const matchSearch = (projectName || '').toLowerCase().includes(term) ||
            (inv.notes || '').toLowerCase().includes(term);
        const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        return matchSearch && matchStatus;
    }) || [];

    // Calculs Rapides
    const totalCollected = invoices?.filter(i => i.status === InvoiceStatus.PAID).reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;
    const totalPending = invoices?.filter(i => i.status === InvoiceStatus.PENDING).reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;
    const totalLate = invoices?.filter(i => i.status === InvoiceStatus.LATE).reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-text-primary mb-1 tracking-tight">Registre de facturation</h1>
                    <p className="text-text-secondary">Suivez vos encaissements et gérez vos paiements en attente.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-brand text-white hover:bg-brand-hover shadow-md font-semibold h-11 px-6">
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
                                {filteredInvoices.map((inv) => (
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
                                            {(Array.isArray(inv.projects) ? inv.projects[0]?.name : (inv.projects as any)?.name) || <span className="text-text-muted italic">Sans projet</span>}
                                            {inv.notes && (
                                                <p className="text-xs text-text-secondary mt-1 font-normal line-clamp-1">{inv.notes}</p>
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
                                                {(inv.status === InvoiceStatus.PENDING || inv.status === InvoiceStatus.LATE) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemind(inv)}
                                                        disabled={remindingInvoiceId === inv.id}
                                                        className={`h-8 w-8 ${isOverdue(inv) ? 'text-indigo-600 hover:bg-indigo-50' : 'text-text-muted hover:text-indigo-600 hover:bg-indigo-50'}`}
                                                        title="Envoyer une relance par email"
                                                    >
                                                        {remindingInvoiceId === inv.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <div className="relative">
                                                                <Bell className="h-4 w-4" />
                                                                {isOverdue(inv) && (
                                                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-text-muted hover:text-brand hover:bg-brand-light" onClick={() => handleOpenModal(inv)}>
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:bg-danger-light" onClick={() => setInvoiceToDelete(inv)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <InvoiceModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                invoice={selectedInvoice}
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
