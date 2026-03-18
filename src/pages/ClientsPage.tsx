import { useState, useMemo } from 'react';
import { useClients, useDeleteClient } from '@/hooks/useClients';
import type { Client } from '@/types/client';
import { ClientModal } from '@/components/ClientModal';
import { ClientSlideOver } from '@/components/ClientSlideOver';
import { ImportClientsModal } from '@/components/ImportClientsModal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Pencil, Trash2, Mail, Phone, FileSpreadsheet } from 'lucide-react';

export default function ClientsPage() {
    const { data: clients, isLoading } = useClients();
    const deleteClient = useDeleteClient();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<{ id: string, name: string } | null>(null);
    const [slideOverOpen, setSlideOverOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const categories = useMemo(() => {
        const cats = new Set<string>();
        clients?.forEach(c => { if (c.category) cats.add(c.category); });
        return Array.from(cats).sort();
    }, [clients]);

    const displayedClients = useMemo(() => {
        if (!activeCategory) return clients;
        return clients?.filter(c => c.category === activeCategory);
    }, [clients, activeCategory]);

    const handleCreateNew = () => {
        setEditingClient(null);
        setModalOpen(true);
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setModalOpen(true);
    };

    const handleDeleteClick = (id: string, name: string) => {
        setClientToDelete({ id, name });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (clientToDelete) {
            await deleteClient.mutateAsync(clientToDelete.id);
            setDeleteDialogOpen(false);
            setClientToDelete(null);
            if (selectedClient?.id === clientToDelete.id) {
                setSlideOverOpen(false);
            }
        }
    };

    const handleRowClick = (client: Client) => {
        setSelectedClient(client);
        setSlideOverOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-text">Clients</h1>
                    <p className="text-text-muted mt-1">Gérez votre carnet d'adresses et professionnels.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button variant="outline" onClick={() => setImportModalOpen(true)} className="border-border text-text hover:bg-surface-hover">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Importer (CSV)
                    </Button>
                    <Button onClick={handleCreateNew} className="bg-p3 text-bg hover:opacity-90">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Client
                    </Button>
                </div>
            </div>

            {categories.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${!activeCategory ? 'bg-brand text-white' : 'bg-surface2 border border-border text-text-muted hover:bg-surface-hover'}`}
                    >
                        Toutes
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeCategory === cat ? 'bg-brand text-white' : 'bg-surface2 border border-border text-text-muted hover:bg-surface-hover'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            <div className="rounded-md border border-border bg-surface">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-text-muted">Nom / Entreprise</TableHead>
                            <TableHead className="text-text-muted">Contact</TableHead>
                            <TableHead className="text-text-muted hidden md:table-cell">Infos Légales</TableHead>
                            <TableHead className="text-right text-text-muted">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients?.length === 0 ? (
                            <TableRow className="border-border hover:bg-transparent">
                                <TableCell colSpan={4} className="h-32 text-center text-text-muted">
                                    Aucun client pour le moment.<br />
                                    <span className="text-sm">Commencez par en ajouter un pour établir des devis.</span>
                                </TableCell>
                            </TableRow>
                        ) : displayedClients?.length === 0 ? (
                            <TableRow className="border-border hover:bg-transparent">
                                <TableCell colSpan={4} className="h-24 text-center text-text-muted">
                                    Aucun client dans cette catégorie.
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayedClients?.map((client) => (
                                <TableRow
                                    key={client.id}
                                    className="border-border hover:bg-surface2/50 transition-colors cursor-pointer group"
                                    onClick={() => handleRowClick(client)}
                                >
                                    <TableCell className="font-medium text-text">
                                        {client.name}
                                        {client.legal_status && (
                                            <span className="ml-2 text-[10px] bg-surface-hover px-1.5 py-0.5 rounded text-text-muted font-bold uppercase tracking-wider">
                                                {client.legal_status}
                                            </span>
                                        )}
                                        {client.category && (
                                            <span className="ml-1.5 text-[10px] bg-brand-light text-brand px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                {client.category}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-sm text-text-muted">
                                            {client.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3" />
                                                    <a href={`mailto:${client.email}`} className="hover:text-text transition-colors">{client.email}</a>
                                                </div>
                                            )}
                                            {client.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{client.phone}</span>
                                                </div>
                                            )}
                                            {!client.email && !client.phone && <span className="opacity-50 italic">Aucun contact</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-text-muted text-sm">
                                        <div className="flex flex-col gap-0.5">
                                            {client.siret && <span className="font-mono text-xs">SIRET: {client.siret}</span>}
                                            {client.vat_number && <span className="font-mono text-xs">TVA: {client.vat_number}</span>}
                                            {!client.siret && !client.vat_number && <span className="opacity-50 italic">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                                                className="h-8 w-8 text-text-muted hover:text-text-primary hover:bg-surface-hover"
                                                title="Modifier"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(client.id, client.name); }}
                                                className="h-8 w-8 text-danger hover:text-danger-hover hover:bg-danger-light opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ClientModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                client={editingClient}
            />

            <ClientSlideOver
                open={slideOverOpen}
                onOpenChange={setSlideOverOpen}
                client={selectedClient}
            />

            <ImportClientsModal
                open={importModalOpen}
                onOpenChange={setImportModalOpen}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title="Supprimer le client"
                description={`Êtes-vous sûr de vouloir supprimer "${clientToDelete?.name}" ? Cette action supprimera également tous les projets associés et est irréversible.`}
                isDeleting={deleteClient.isPending}
            />
        </div>
    );
}
