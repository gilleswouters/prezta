import { useState } from 'react';
import { useClients, useDeleteClient } from '@/hooks/useClients';
import type { Client } from '@/types/client';
import { ClientModal } from '@/components/ClientModal';
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
import { Plus, Loader2, Pencil, Trash2, Mail, Phone } from 'lucide-react';

export default function ClientsPage() {
    const { data: clients, isLoading } = useClients();
    const deleteClient = useDeleteClient();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<{ id: string, name: string } | null>(null);

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
        }
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
                <Button onClick={handleCreateNew} className="bg-p3 text-bg hover:opacity-90">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau Client
                </Button>
            </div>

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
                        ) : (
                            clients?.map((client) => (
                                <TableRow key={client.id} className="border-border hover:bg-surface2/50 transition-colors">
                                    <TableCell className="font-medium text-text">
                                        {client.name}
                                        {client.legal_status && (
                                            <span className="ml-2 text-[10px] bg-surface-hover px-1.5 py-0.5 rounded text-text-muted font-bold uppercase tracking-wider">
                                                {client.legal_status}
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
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(client)} className="h-8 w-8 text-text-muted hover:text-text-primary hover:bg-surface-hover" title="Modifier">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(client.id, client.name)} className="h-8 w-8 text-danger hover:text-danger-hover hover:bg-danger-light" title="Supprimer">
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
