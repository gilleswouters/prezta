import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    useFournisseurs,
    useCreateFournisseur,
    useUpdateFournisseur,
    useDeleteFournisseur,
    useFournisseurProduits,
    useCreateFournisseurProduit,
    useDeleteFournisseurProduit,
    useAchatsFournisseur,
    useCreateAchat,
    useUpdateAchat,
} from '@/hooks/useFournisseurs';
import type {
    Fournisseur,
    FournisseurProduit,
    AchatFournisseur,
    AchatStatut,
} from '@/hooks/useFournisseurs';
import { useProjects } from '@/hooks/useProjects';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import {
    Truck,
    Plus,
    Search,
    Loader2,
    Trash2,
    Pencil,
    Mail,
    Phone,
    Globe,
    MapPin,
    Package,
    ShoppingCart,
    AlertTriangle,
    CheckCircle,
    X,
} from 'lucide-react';
import { format, parseISO, isBefore, startOfToday } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Zod schemas ───────────────────────────────────────────────────────────────

const fournisseurSchema = z.object({
    nom:         z.string().min(1, 'Le nom est requis'),
    contact_nom: z.string().optional().nullable(),
    email:       z.string().optional().nullable().refine(
        val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        'Format e-mail invalide',
    ),
    telephone: z.string().optional().nullable(),
    site_web:  z.string().optional().nullable(),
    adresse:   z.string().optional().nullable(),
    notes:     z.string().optional().nullable(),
});
type FournisseurFormValues = z.infer<typeof fournisseurSchema>;

const achatSchema = z.object({
    description:          z.string().min(1, 'La description est requise'),
    montant:              z.coerce.number().min(0, 'Le montant doit être positif'),
    date_achat:           z.string().min(1, 'La date est requise'),
    date_livraison_prevue: z.string().optional().nullable(),
    statut:               z.enum(['en_attente', 'commande', 'expedie', 'recu', 'en_retard', 'annule']),
    projet_id:            z.string().optional().nullable(),
    notes:                z.string().optional().nullable(),
});
type AchatFormValues = z.infer<typeof achatSchema>;

const produitSchema = z.object({
    nom:          z.string().min(1, 'Le nom est requis'),
    prix_unitaire: z.coerce.number().optional().nullable(),
    unite:        z.string().default('unité'),
    description:  z.string().optional().nullable(),
});
type ProduitFormValues = z.infer<typeof produitSchema>;

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUT_LABELS: Record<AchatStatut, string> = {
    en_attente: 'En attente',
    commande:   'Commandé',
    expedie:    'Expédié',
    recu:       'Reçu',
    en_retard:  'En retard',
    annule:     'Annulé',
};

const STATUT_CLASSES: Record<AchatStatut, string> = {
    en_attente: 'bg-gray-100 text-gray-600 border-gray-200',
    commande:   'bg-blue-50 text-blue-600 border-blue-100',
    expedie:    'bg-amber-50 text-amber-600 border-amber-100',
    recu:       'bg-emerald-50 text-emerald-600 border-emerald-100',
    en_retard:  'bg-red-50 text-red-600 border-red-200',
    annule:     'bg-white text-red-500 border-red-200',
};

function StatutBadge({ statut }: { statut: AchatStatut }) {
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${STATUT_CLASSES[statut]}`}>
            {STATUT_LABELS[statut]}
        </span>
    );
}

function isOverdue(achat: AchatFournisseur): boolean {
    if (!achat.date_livraison_prevue) return false;
    if (achat.statut === 'recu' || achat.statut === 'annule') return false;
    return isBefore(parseISO(achat.date_livraison_prevue), startOfToday());
}

// ── FournisseurModal ──────────────────────────────────────────────────────────

interface FournisseurModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing?: Fournisseur | null;
}

function FournisseurModal({ open, onOpenChange, editing }: FournisseurModalProps) {
    const create = useCreateFournisseur();
    const update = useUpdateFournisseur();

    const form = useForm<FournisseurFormValues>({
        resolver: zodResolver(fournisseurSchema),
        defaultValues: {
            nom: editing?.nom ?? '',
            contact_nom: editing?.contact_nom ?? '',
            email:       editing?.email ?? '',
            telephone:   editing?.telephone ?? '',
            site_web:    editing?.site_web ?? '',
            adresse:     editing?.adresse ?? '',
            notes:       editing?.notes ?? '',
        },
    });

    // Reset when modal opens/changes target
    const handleOpenChange = (o: boolean) => {
        if (!o) form.reset();
        onOpenChange(o);
    };

    const onSubmit = async (values: FournisseurFormValues) => {
        const payload = {
            nom:         values.nom,
            contact_nom: values.contact_nom || null,
            email:       values.email || null,
            telephone:   values.telephone || null,
            site_web:    values.site_web || null,
            adresse:     values.adresse || null,
            notes:       values.notes || null,
        };
        if (editing) {
            await update.mutateAsync({ id: editing.id, ...payload });
        } else {
            await create.mutateAsync(payload);
        }
        handleOpenChange(false);
    };

    const isPending = create.isPending || update.isPending;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-surface text-text border-border">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">
                        {editing ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <FormField control={form.control} name="nom" render={({ field }) => (
                            <div className="space-y-1.5">
                                <FormLabel>Nom <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Nom du fournisseur" className="bg-surface2 border-border" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="contact_nom" render={({ field }) => (
                                <div className="space-y-1.5">
                                    <FormLabel>Contact</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Prénom Nom" className="bg-surface2 border-border" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <div className="space-y-1.5">
                                    <FormLabel>E-mail</FormLabel>
                                    <FormControl>
                                        <Input placeholder="contact@exemple.fr" className="bg-surface2 border-border" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="telephone" render={({ field }) => (
                                <div className="space-y-1.5">
                                    <FormLabel>Téléphone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+33 6 …" className="bg-surface2 border-border" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />
                            <FormField control={form.control} name="site_web" render={({ field }) => (
                                <div className="space-y-1.5">
                                    <FormLabel>Site web</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://…" className="bg-surface2 border-border" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />
                        </div>

                        <FormField control={form.control} name="adresse" render={({ field }) => (
                            <div className="space-y-1.5">
                                <FormLabel>Adresse</FormLabel>
                                <FormControl>
                                    <Input placeholder="12 rue de la Paix, Paris" className="bg-surface2 border-border" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <div className="space-y-1.5">
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Conditions, délais habituels…" className="bg-surface2 border-border resize-none" rows={3} {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="border-border">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isPending} className="bg-brand text-white hover:bg-brand-hover">
                                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                {editing ? 'Enregistrer' : 'Ajouter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// ── AchatModal ────────────────────────────────────────────────────────────────

interface AchatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fournisseurId: string;
}

function AchatModal({ open, onOpenChange, fournisseurId }: AchatModalProps) {
    const createAchat = useCreateAchat();
    const { data: projects } = useProjects();

    const form = useForm<AchatFormValues>({
        resolver: zodResolver(achatSchema),
        defaultValues: {
            description:           '',
            montant:               0,
            date_achat:            new Date().toISOString().slice(0, 10),
            date_livraison_prevue: null,
            statut:                'en_attente',
            projet_id:             null,
            notes:                 null,
        },
    });

    const handleOpenChange = (o: boolean) => {
        if (!o) form.reset();
        onOpenChange(o);
    };

    const onSubmit = async (values: AchatFormValues) => {
        await createAchat.mutateAsync({
            fournisseur_id:        fournisseurId,
            description:           values.description,
            montant:               values.montant,
            date_achat:            values.date_achat,
            date_livraison_prevue: values.date_livraison_prevue || null,
            date_livraison_reelle: null,
            statut:                values.statut,
            projet_id:             values.projet_id || null,
            rappel_envoye:         false,
            notes:                 values.notes || null,
        });
        handleOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[520px] bg-surface text-text border-border">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">Nouvel achat</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <div className="space-y-1.5">
                                <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex : Matière première, outillage…" className="bg-surface2 border-border" {...field} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="montant" render={({ field }) => (
                                <div className="space-y-1.5">
                                    <FormLabel>Montant (€) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" step="0.01" className="bg-surface2 border-border" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />
                            <FormField control={form.control} name="date_achat" render={({ field }) => (
                                <div className="space-y-1.5">
                                    <FormLabel>Date d'achat <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="date" className="bg-surface2 border-border" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="date_livraison_prevue" render={({ field }) => (
                                <div className="space-y-1.5">
                                    <FormLabel>Livraison prévue</FormLabel>
                                    <FormControl>
                                        <Input type="date" className="bg-surface2 border-border" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />
                            <FormField control={form.control} name="statut" render={({ field }) => (
                                <div className="space-y-1.5">
                                    <FormLabel>Statut</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-surface2 border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                            {(Object.entries(STATUT_LABELS) as [AchatStatut, string][]).map(([val, label]) => (
                                                <SelectItem key={val} value={val}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </div>
                            )} />
                        </div>

                        <FormField control={form.control} name="projet_id" render={({ field }) => (
                            <div className="space-y-1.5">
                                <FormLabel>Projet lié</FormLabel>
                                <Select
                                    onValueChange={val => field.onChange(val === '__none__' ? null : val)}
                                    value={field.value ?? '__none__'}
                                >
                                    <FormControl>
                                        <SelectTrigger className="bg-surface2 border-border">
                                            <SelectValue placeholder="Aucun projet" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="__none__">Aucun projet</SelectItem>
                                        {projects?.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </div>
                        )} />

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <div className="space-y-1.5">
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Remarques, conditions…" className="bg-surface2 border-border resize-none" rows={2} {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="border-border">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={createAchat.isPending} className="bg-brand text-white hover:bg-brand-hover">
                                {createAchat.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// ── Produits tab ──────────────────────────────────────────────────────────────

function ProduitsTab({ fournisseurId }: { fournisseurId: string }) {
    const { data: produits, isLoading } = useFournisseurProduits(fournisseurId);
    const createProduit = useCreateFournisseurProduit();
    const deleteProduit = useDeleteFournisseurProduit();

    const form = useForm<ProduitFormValues>({
        resolver: zodResolver(produitSchema),
        defaultValues: { nom: '', prix_unitaire: null, unite: 'unité', description: null },
    });

    const onAdd = async (values: ProduitFormValues) => {
        await createProduit.mutateAsync({
            fournisseur_id: fournisseurId,
            nom:            values.nom,
            description:    values.description || null,
            prix_unitaire:  values.prix_unitaire ?? null,
            unite:          values.unite || 'unité',
        });
        form.reset({ nom: '', prix_unitaire: null, unite: 'unité', description: null });
    };

    return (
        <div className="space-y-4">
            {/* Inline add form */}
            <form onSubmit={form.handleSubmit(onAdd)} className="flex gap-2 items-end p-3 bg-surface2 rounded-lg border border-border">
                <div className="flex-1 space-y-1">
                    <Label className="text-xs font-semibold text-text-muted">Nom du produit/service</Label>
                    <Input
                        placeholder="Nom…"
                        className="h-8 text-sm bg-white border-border"
                        {...form.register('nom')}
                    />
                </div>
                <div className="w-24 space-y-1">
                    <Label className="text-xs font-semibold text-text-muted">Prix (€)</Label>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="h-8 text-sm bg-white border-border"
                        {...form.register('prix_unitaire')}
                    />
                </div>
                <div className="w-24 space-y-1">
                    <Label className="text-xs font-semibold text-text-muted">Unité</Label>
                    <Input
                        placeholder="unité"
                        className="h-8 text-sm bg-white border-border"
                        {...form.register('unite')}
                    />
                </div>
                <Button type="submit" disabled={createProduit.isPending} size="sm" className="h-8 bg-brand text-white hover:bg-brand-hover shrink-0">
                    {createProduit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                </Button>
            </form>

            {isLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
            ) : !produits || produits.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Aucun produit ou service enregistré.
                </div>
            ) : (
                <div className="space-y-1">
                    {produits.map((p: FournisseurProduit) => (
                        <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-white hover:bg-surface2 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text truncate">{p.nom}</p>
                                {p.description && <p className="text-xs text-text-muted truncate">{p.description}</p>}
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-3">
                                {p.prix_unitaire !== null && (
                                    <span className="text-sm font-semibold text-text font-mono">
                                        {Number(p.prix_unitaire).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                        <span className="text-xs text-text-muted font-normal ml-1">/{p.unite}</span>
                                    </span>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-text-muted hover:text-red-500 hover:bg-red-50"
                                    onClick={() => deleteProduit.mutate({ id: p.id, fournisseurId })}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Achats tab ────────────────────────────────────────────────────────────────

function AchatsTab({ fournisseurId }: { fournisseurId: string }) {
    const { data: achats, isLoading } = useAchatsFournisseur(fournisseurId);
    const updateAchat = useUpdateAchat();
    const [achatModalOpen, setAchatModalOpen] = useState(false);

    const handleRappel = (achat: AchatFournisseur) => {
        // Mark rappel_envoye = true (email edge function can be wired here)
        updateAchat.mutate({
            id: achat.id,
            fournisseurId,
            rappel_envoye: true,
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button size="sm" onClick={() => setAchatModalOpen(true)} className="bg-brand text-white hover:bg-brand-hover h-8">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Nouvel achat
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
            ) : !achats || achats.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Aucun achat enregistré.
                </div>
            ) : (
                <div className="space-y-2">
                    {achats.map((achat: AchatFournisseur) => {
                        const overdue = isOverdue(achat);
                        return (
                            <div
                                key={achat.id}
                                className={`p-3 rounded-lg border bg-white transition-colors ${overdue ? 'border-red-200 bg-red-50/30' : 'border-border'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-semibold text-text truncate">{achat.description}</p>
                                            <StatutBadge statut={achat.statut} />
                                            {overdue && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-500 text-white uppercase tracking-wider">
                                                    EN RETARD
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted flex-wrap">
                                            <span className="font-semibold text-text font-mono">
                                                {Number(achat.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                            </span>
                                            <span>
                                                Achat : {format(parseISO(achat.date_achat), 'dd MMM yyyy', { locale: fr })}
                                            </span>
                                            {achat.date_livraison_prevue && (
                                                <span className={overdue ? 'text-red-600 font-medium' : ''}>
                                                    Livraison prévue : {format(parseISO(achat.date_livraison_prevue), 'dd MMM yyyy', { locale: fr })}
                                                </span>
                                            )}
                                        </div>
                                        {achat.notes && (
                                            <p className="text-xs text-text-muted mt-1 italic">{achat.notes}</p>
                                        )}
                                    </div>

                                    {/* Rappel button — shown for overdue purchases */}
                                    {overdue && (
                                        <div className="shrink-0">
                                            {achat.rappel_envoye ? (
                                                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Rappel envoyé
                                                </span>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleRappel(achat)}
                                                    disabled={updateAchat.isPending}
                                                >
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Envoyer un rappel
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <AchatModal
                open={achatModalOpen}
                onOpenChange={setAchatModalOpen}
                fournisseurId={fournisseurId}
            />
        </div>
    );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function FournisseurDetail({ fournisseur, onEdit, onClose }: {
    fournisseur: Fournisseur;
    onEdit: () => void;
    onClose: () => void;
}) {
    const deleteFournisseur = useDeleteFournisseur();

    const handleDelete = async () => {
        if (!confirm(`Supprimer "${fournisseur.nom}" ? Cette action est irréversible.`)) return;
        await deleteFournisseur.mutateAsync(fournisseur.id);
        onClose();
    };

    return (
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-text truncate">{fournisseur.nom}</h2>
                    {fournisseur.contact_nom && (
                        <p className="text-sm text-text-muted mt-0.5">{fournisseur.contact_nom}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                        {fournisseur.email && (
                            <a href={`mailto:${fournisseur.email}`} className="flex items-center gap-1 text-xs text-brand hover:underline">
                                <Mail className="h-3 w-3" />{fournisseur.email}
                            </a>
                        )}
                        {fournisseur.telephone && (
                            <a href={`tel:${fournisseur.telephone}`} className="flex items-center gap-1 text-xs text-text-muted hover:text-text">
                                <Phone className="h-3 w-3" />{fournisseur.telephone}
                            </a>
                        )}
                        {fournisseur.site_web && (
                            <a href={fournisseur.site_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-text-muted hover:text-text">
                                <Globe className="h-3 w-3" />{fournisseur.site_web.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                        {fournisseur.adresse && (
                            <span className="flex items-center gap-1 text-xs text-text-muted">
                                <MapPin className="h-3 w-3" />{fournisseur.adresse}
                            </span>
                        )}
                    </div>
                    {fournisseur.notes && (
                        <p className="text-xs text-text-muted mt-2 italic border-t border-border pt-2">{fournisseur.notes}</p>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-brand" onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-red-500 hover:bg-red-50" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted lg:hidden" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-1 overflow-y-auto p-6">
                <Tabs defaultValue="produits">
                    <TabsList className="bg-surface2 border border-border mb-4">
                        <TabsTrigger value="produits" className="data-[state=active]:bg-white data-[state=active]:text-text text-sm">
                            <Package className="h-3.5 w-3.5 mr-1.5" />
                            Produits & Services
                        </TabsTrigger>
                        <TabsTrigger value="achats" className="data-[state=active]:bg-white data-[state=active]:text-text text-sm">
                            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                            Achats
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="produits">
                        <ProduitsTab fournisseurId={fournisseur.id} />
                    </TabsContent>
                    <TabsContent value="achats">
                        <AchatsTab fournisseurId={fournisseur.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FournisseursPage() {
    const { data: fournisseurs, isLoading } = useFournisseurs();
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);

    const filtered = (fournisseurs ?? []).filter(f =>
        f.nom.toLowerCase().includes(search.toLowerCase()) ||
        (f.contact_nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (f.email ?? '').toLowerCase().includes(search.toLowerCase()),
    );

    const selected = fournisseurs?.find(f => f.id === selectedId) ?? null;

    const openCreate = () => {
        setEditingFournisseur(null);
        setModalOpen(true);
    };

    const openEdit = (f: Fournisseur) => {
        setEditingFournisseur(f);
        setModalOpen(true);
    };

    // When modal closes after create, auto-select the newest supplier
    const handleModalOpenChange = (open: boolean) => {
        setModalOpen(open);
        if (!open && !editingFournisseur && fournisseurs && fournisseurs.length > 0) {
            // Select the first (freshly sorted) fournisseur after creation
            setTimeout(() => {
                setSelectedId(prev => prev); // keep selection if already set
            }, 300);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif text-text">Fournisseurs</h1>
                    <p className="text-text-muted mt-1 text-sm">Gérez vos fournisseurs, leurs produits et vos achats.</p>
                </div>
                <Button onClick={openCreate} className="bg-brand text-white hover:bg-brand-hover">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un fournisseur
                </Button>
            </div>

            {/* Two-panel layout */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Left panel — Supplier list */}
                <div className="lg:w-[300px] flex-shrink-0 flex flex-col gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <Input
                            placeholder="Rechercher un fournisseur…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 bg-surface border-border"
                        />
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                <div className="bg-surface2 p-4 rounded-full mb-4 ring-1 ring-border">
                                    <Truck className="h-8 w-8 text-text-muted" />
                                </div>
                                <p className="font-semibold text-text-primary">
                                    {search ? 'Aucun résultat' : 'Aucun fournisseur'}
                                </p>
                                <p className="text-sm text-text-muted mt-1">
                                    {search ? 'Modifiez votre recherche.' : 'Ajoutez votre premier fournisseur.'}
                                </p>
                                {!search && (
                                    <Button size="sm" onClick={openCreate} className="mt-4 bg-brand text-white hover:bg-brand-hover">
                                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        Ajouter
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filtered.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setSelectedId(f.id)}
                                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                                        selectedId === f.id
                                            ? 'border-brand bg-brand/5'
                                            : 'border-border bg-white hover:bg-surface2'
                                    }`}
                                >
                                    <p className="font-semibold text-sm text-text truncate">{f.nom}</p>
                                    {f.contact_nom && (
                                        <p className="text-xs text-text-muted truncate">{f.contact_nom}</p>
                                    )}
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                        {f.email && (
                                            <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                                                <Mail className="h-3 w-3" />{f.email}
                                            </span>
                                        )}
                                        {f.telephone && (
                                            <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                                                <Phone className="h-3 w-3" />{f.telephone}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right panel — Detail */}
                <div className="flex-1 min-w-0">
                    {selected ? (
                        <FournisseurDetail
                            key={selected.id}
                            fournisseur={selected}
                            onEdit={() => openEdit(selected)}
                            onClose={() => setSelectedId(null)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-border rounded-2xl text-center px-8 py-16">
                            <Truck className="h-12 w-12 text-text-muted opacity-20 mb-4" />
                            <p className="text-text-muted text-sm">
                                Sélectionnez un fournisseur pour voir ses détails.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Fournisseur modal (create / edit) */}
            <FournisseurModal
                open={modalOpen}
                onOpenChange={handleModalOpenChange}
                editing={editingFournisseur}
            />
        </div>
    );
}
