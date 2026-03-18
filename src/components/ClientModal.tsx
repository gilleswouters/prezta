import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema } from '@/lib/validations/client';
import type { ClientFormValues } from '@/lib/validations/client';
import type { Client } from '@/types/client';
import { useCreateClient, useUpdateClient } from '@/hooks/useClients';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Search, Building2, MapPin } from 'lucide-react';

const CLIENT_CATEGORIES = ['Entreprise', 'Particulier', 'Association', 'Collectivité', 'Startup', 'Agence'] as const;
import { useSireneSearch } from '@/hooks/useSireneSearch';
import type { SireneResult } from '@/hooks/useSireneSearch';
import { calculateFrenchVAT } from '@/hooks/useSireneSearch';

interface ClientModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client?: Client | null; // null means create mode
}

export function ClientModal({ open, onOpenChange, client }: ClientModalProps) {
    const createClient = useCreateClient();
    const updateClient = useUpdateClient();
    const isEditing = !!client;

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: '',
            contact_name: '',
            email: '',
            phone: '',
            address: '',
            vat_number: '',
            notes: '',
            siret: '',
            legal_status: '',
            category: '',
        }
    });

    useEffect(() => {
        if (client && open) {
            form.reset({
                name: client.name,
                contact_name: client.contact_name || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                vat_number: client.vat_number || '',
                notes: client.notes || '',
                siret: client.siret || '',
                legal_status: client.legal_status || '',
                category: client.category || '',
            });
        } else if (!open) {
            form.reset();
        }
    }, [client, open, form]);

    const onSubmit = async (data: ClientFormValues) => {
        try {
            const payload = {
                name: data.name,
                contact_name: data.contact_name || null,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
                vat_number: data.vat_number || null,
                notes: data.notes || null,
                siret: data.siret || null,
                legal_status: data.legal_status || null,
                category: data.category || null,
            };

            if (isEditing && client) {
                await updateClient.mutateAsync({ id: client.id, updates: payload });
            } else {
                await createClient.mutateAsync(payload);
            }
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    const isPending = createClient.isPending || updateClient.isPending;
    const { results, search, isLoading: isSearchLoading, clearResults } = useSireneSearch();
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounce the search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.length >= 3) {
                search(searchQuery);
                setShowResults(true);
            } else {
                clearResults();
                setShowResults(false);
            }
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, search, clearResults]);

    const handleSelectCompany = (company: SireneResult) => {
        form.setValue('name', company.nom_entreprise, { shouldValidate: true });
        form.setValue('address', company.adresse_complete, { shouldValidate: true });
        form.setValue('siret', company.siret, { shouldValidate: true });
        form.setValue('legal_status', company.nature_juridique, { shouldValidate: true });

        const calculatedVat = calculateFrenchVAT(company.siren);
        if (calculatedVat) {
            form.setValue('vat_number', calculatedVat, { shouldValidate: true });
        }
        if (company.email) {
            form.setValue('email', company.email, { shouldValidate: true });
        }
        if (company.phone) {
            form.setValue('phone', company.phone, { shouldValidate: true });
        }

        setShowResults(false);
        setSearchQuery('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-surface text-text border-border">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">{isEditing ? 'Modifier Client' : 'Nouveau Client'}</DialogTitle>
                    <DialogDescription className="text-text-muted">
                        Remplissez les informations du client ci-dessous.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

                        <FormField control={form.control} name="name" render={({ field }) => (
                            <div className="space-y-2 relative" ref={searchRef}>
                                <FormLabel className="flex justify-between items-center">
                                    <span>Nom / Entreprise *</span>
                                    {!isEditing && (
                                        <span className="text-[10px] text-brand bg-brand-light px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                                            <Search className="w-3 h-3" />
                                            Recherche SIRENE
                                        </span>
                                    )}
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="Ex: Alan ou Prezta"
                                            className={`bg-surface2 border-border ${!isEditing ? 'pr-10' : ''}`}
                                            {...field}
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                if (!isEditing) setSearchQuery(e.target.value);
                                            }}
                                            onFocus={() => !isEditing && searchQuery.length >= 3 && setShowResults(true)}
                                            autoComplete="off"
                                        />
                                        {!isEditing && isSearchLoading && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                                            </div>
                                        )}
                                    </div>
                                </FormControl>

                                {/* Dropdown SIRENE */}
                                {showResults && results.length > 0 && !isEditing && (
                                    <div className="absolute z-50 w-full top-[100%] mt-1 bg-white border border-border shadow-xl rounded-md overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <div className="max-h-60 overflow-y-auto w-full">
                                            {results.map((company, index) => (
                                                <div
                                                    key={`${company.siren}-${index}`}
                                                    className="p-3 border-b border-border/50 hover:bg-surface-hover cursor-pointer transition-colors"
                                                    onClick={() => handleSelectCompany(company)}
                                                >
                                                    <div className="font-bold text-sm text-text-primary flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-brand" />
                                                        {company.nom_entreprise}
                                                    </div>
                                                    <div className="text-xs text-text-muted mt-1 flex flex-col gap-0.5 ml-6">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" /> {company.adresse_complete}
                                                        </span>
                                                        <span className="opacity-75">SIRET: {company.siret || company.siren} · {company.nature_juridique}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <FormMessage />
                            </div>
                        )} />

                        <FormField control={form.control} name="contact_name" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Nom du signataire</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Ex: Marie Dupont"
                                        className="bg-surface2 border-border"
                                        {...field}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <p className="text-[11px] text-text-muted">Personne physique qui signera les contrats</p>
                                <FormMessage />
                            </div>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="contact@acme.com" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />

                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel>Téléphone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+32 400 000 000" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />
                        </div>

                        <FormField control={form.control} name="address" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Adresse complète</FormLabel>
                                <FormControl>
                                    <Input placeholder="10 Avenue des Champs Elysées, 75008 Paris" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="siret" render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel>SIRET (14 chiffres)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="12345678900012" className="bg-surface2 border-border" {...field} value={field.value || ''} maxLength={14} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />

                            <FormField control={form.control} name="vat_number" render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel>Numéro TVA Fr.</FormLabel>
                                    <FormControl>
                                        <Input placeholder="FR00123456789" className="bg-surface2 border-border uppercase" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />
                        </div>

                        <FormField control={form.control} name="legal_status" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Forme Juridique (Optionnel)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: SASU, EURL, Auto-entrepreneur..." className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <FormField control={form.control} name="category" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Catégorie <span className="text-text-muted font-normal">(Optionnel)</span></FormLabel>
                                <FormControl>
                                    <Input
                                        list="client-categories"
                                        placeholder="Ex: Startup, Agence..."
                                        className="bg-surface2 border-border"
                                        {...field}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <datalist id="client-categories">
                                    {CLIENT_CATEGORIES.map(c => <option key={c} value={c} />)}
                                </datalist>
                                <FormMessage />
                            </div>
                        )} />

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Notes internes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Informations additionnelles..." className="bg-surface2 border-border resize-none" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-text hover:bg-surface-hover">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isPending} className="bg-brand text-white hover:bg-brand-hover">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Mettre à jour' : 'Créer le client'}
                            </Button>
                        </DialogFooter>

                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
