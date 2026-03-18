import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfile, useUpdateProfile, useUploadLogo, StorageLimitError } from '@/hooks/useProfile';
import { profileSchema } from '@/lib/validations/profile';
import type { ProfileFormValues } from '@/lib/validations/profile';
import { Country, LegalStatus } from '@/types/profile';
import { StorageBar } from '@/components/ui/StorageBar';
import { StorageLimitModal } from '@/components/ui/StorageLimitModal';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import { toast } from 'sonner';

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

export default function ProfilePage() {
    const { data: profile, isLoading } = useProfile();
    const updateProfile = useUpdateProfile();
    const uploadLogo = useUploadLogo();
    const { used, limit } = useStorageUsage();
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [storageLimitOpen, setStorageLimitOpen] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: '',
            phone: '',
            company_name: '',
            country: Country.FR, // TODO: add BE/CH when ready
            legal_status: LegalStatus.AUTO_ENTREPRENEUR_FR,
            bce_number: '',
            siret_number: '',
            vat_number: '',
            iban: '',
            address_street: '',
            address_city: '',
            address_zip: '',
            logo_url: '',
            legal_representative_name: '',
            legal_representative_role: ''
        }
    });

    const { setValue, reset } = form;

    useEffect(() => {
        if (profile) {
            reset({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                company_name: profile.company_name || '',
                country: Country.FR, // TODO: add BE/CH when ready
                legal_status: profile.legal_status || LegalStatus.AUTO_ENTREPRENEUR_FR,
                bce_number: profile.bce_number || '',
                siret_number: profile.siret_number || '',
                vat_number: profile.vat_number || '',
                iban: profile.iban || '',
                address_street: profile.address_street || '',
                address_city: profile.address_city || '',
                address_zip: profile.address_zip || '',
                logo_url: profile.logo_url || '',
                legal_representative_name: profile.legal_representative_name || '',
                legal_representative_role: profile.legal_representative_role || ''
            });
        }
    }, [profile, reset]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                toast.error("L'image ne doit pas dépasser 2 MB.");
                return;
            }
            setLogoFile(file);
            // Create a temporary object URL for preview
            setValue('logo_url', URL.createObjectURL(file));
        }
    };

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            let finalLogoUrl = data.logo_url;
            if (logoFile) {
                finalLogoUrl = await uploadLogo.mutateAsync(logoFile);
            }

            await updateProfile.mutateAsync({
                ...data,
                logo_url: finalLogoUrl
            });
        } catch (error) {
            if (error instanceof StorageLimitError) {
                setStorageLimitOpen(true);
                return;
            }
            console.error(error);
            // Toast already handled by mutation
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
            <StorageLimitModal
                open={storageLimitOpen}
                onOpenChange={setStorageLimitOpen}
                used={used}
                limit={limit}
            />

            {/* Storage Usage */}
            <div className="bg-white border border-border rounded-xl p-5">
                <StorageBar />
            </div>

            <Card className="bg-surface border-border">
                <CardHeader>
                    <CardTitle className="text-2xl font-serif text-text">Profil & Informations Légales</CardTitle>
                    <CardDescription className="text-text-muted">
                        Ces informations apparaîtront sur tous vos documents générés (devis, factures).
                    </CardDescription>
                </CardHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <CardContent className="space-y-6">

                            {/* === IDENTITE === */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-mono text-text-muted uppercase tracking-wider">Identité</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="full_name" render={({ field }) => (
                                        // We removed the Item component requirement since shadcn v4 uses FormItem instead
                                        <div className="space-y-2">
                                            <FormLabel className="text-text">Nom complet *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Jean Dupont" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )} />

                                    <FormField control={form.control} name="phone" render={({ field }) => (
                                        <div className="space-y-2">
                                            <FormLabel className="text-text">Téléphone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="06 12 34 56 78" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )} />
                                </div>
                            </div>

                            {/* === ENTREPRISE === */}
                            <div className="space-y-4 pt-6 border-t border-border">
                                <h3 className="text-sm font-mono text-text-muted uppercase tracking-wider">Entreprise</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="country" render={({ field }) => (
                                        <div className="space-y-2">
                                            {/* TODO: add BE/CH when ready */}
                                            <FormLabel className="text-text">Pays</FormLabel>
                                            <input type="hidden" {...field} value={Country.FR} />
                                            <div className="h-10 px-3 py-2 bg-surface2 border border-border rounded-md text-sm flex items-center gap-2 text-text-muted select-none">
                                                🇫🇷 France
                                            </div>
                                            <FormMessage />
                                        </div>
                                    )} />

                                    <FormField control={form.control} name="legal_status" render={({ field }) => (
                                        <div className="space-y-2">
                                            <FormLabel className="text-text">Statut Juridique *</FormLabel>
                                            <Select defaultValue={field.value} onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-surface2 border-border">
                                                        <SelectValue placeholder="Statut légal" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value={LegalStatus.AUTO_ENTREPRENEUR_FR}>Auto-entrepreneur</SelectItem>
                                                    <SelectItem value={LegalStatus.EURL}>EURL</SelectItem>
                                                    <SelectItem value={LegalStatus.SASU}>SASU</SelectItem>
                                                    <SelectItem value={LegalStatus.SAS}>SAS</SelectItem>
                                                    <SelectItem value={LegalStatus.SARL}>SARL</SelectItem>
                                                    <SelectItem value={LegalStatus.AUTRE}>Autre</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            <FormDescription>Définit les mentions légales obligatoires.</FormDescription>
                                        </div>
                                    )} />
                                </div>

                                <FormField control={form.control} name="company_name" render={({ field }) => (
                                    <div className="space-y-2">
                                        <FormLabel className="text-text">Nom de la société (Optionnel)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ma Société SRL" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </div>
                                )} />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="legal_representative_name" render={({ field }) => (
                                        <div className="space-y-2">
                                            <FormLabel className="text-text">Nom du représentant légal</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Jean Dupont" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )} />


                                    <FormField control={form.control} name="legal_representative_role" render={({ field }) => (
                                        <div className="space-y-2">
                                            <FormLabel className="text-text">Fonction du représentant</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Gérant, Président, Indépendant..." className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* France only — TODO: add BE/CH when ready */}
                                    <FormField control={form.control} name="siret_number" render={({ field }) => (
                                        <div className="space-y-2">
                                            <FormLabel className="text-text">Numéro SIRET *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 456 789 00012" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )} />

                                    <FormField control={form.control} name="vat_number" render={({ field }) => (
                                        <div className="space-y-2">
                                            <FormLabel className="text-text">Numéro de TVA</FormLabel>
                                            <FormControl>
                                                <Input placeholder="FR00 123 456 789" className="bg-surface2 border-border uppercase" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )} />
                                </div>
                            </div>

                            {/* === FINANCIAL & ADDRESS === */}
                            <div className="space-y-4 pt-6 border-t border-border">
                                <h3 className="text-sm font-mono text-text-muted uppercase tracking-wider">Facturation & Coordonnées</h3>

                                <FormField control={form.control} name="iban" render={({ field }) => (
                                    <div className="space-y-2">
                                        <FormLabel className="text-text">IBAN de réception</FormLabel>
                                        <FormControl>
                                            <Input placeholder="FR76 3000 6000 0112 3456 7890 189" className="bg-surface2 border-border uppercase tracking-widest" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </div>
                                )} />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <FormField control={form.control} name="address_street" render={({ field }) => (
                                            <div className="space-y-2">
                                                <FormLabel className="text-text">Rue & Numéro</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="12 rue de la Paix" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </div>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="address_zip" render={({ field }) => (
                                        <div className="space-y-2">
                                            <FormLabel className="text-text">Code Postal</FormLabel>
                                            <FormControl>
                                                <Input placeholder="75001" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )} />
                                </div>

                                <FormField control={form.control} name="address_city" render={({ field }) => (
                                    <div className="space-y-2">
                                        <FormLabel className="text-text">Ville</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Paris" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </div>
                                )} />

                            </div>

                            {/* === LOGO === */}
                            <div className="space-y-4 pt-6 border-t border-border">
                                <h3 className="text-sm font-mono text-text-muted uppercase tracking-wider">Identité Visuelle</h3>
                                <div className="flex items-center space-x-6">
                                    <Avatar className="h-24 w-24 border border-border bg-surface2">
                                        <AvatarImage src={form.watch('logo_url') || ''} alt="Logo" className="object-cover" />
                                        <AvatarFallback className="text-text-muted">LOGO</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <FormLabel className="text-text">Logo (Optionnel)</FormLabel>
                                        <Input
                                            type="file"
                                            accept="image/png, image/jpeg, image/webp"
                                            className="bg-surface2 border-border text-text-muted cursor-pointer"
                                            onChange={handleLogoChange}
                                        />
                                        <FormDescription>Max 2MB. JPG, PNG ou WEBP.</FormDescription>
                                    </div>
                                </div>
                            </div>

                        </CardContent>

                        <CardFooter className="bg-surface2/50 border-t border-border py-4 px-6 flex justify-end">
                            <Button type="submit" disabled={updateProfile.isPending || uploadLogo.isPending} className="bg-accent text-bg hover:opacity-90 min-w-32">
                                {(updateProfile.isPending || uploadLogo.isPending) ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Enregistrer
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            {/* Notifications preferences */}
            <Card className="bg-surface border-border">
                <CardHeader>
                    <CardTitle className="text-base font-bold text-text-primary">Notifications</CardTitle>
                    <CardDescription className="text-text-muted text-sm">
                        Gérez vos préférences de notifications automatiques.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4 py-2">
                        <div>
                            <p className="text-sm font-semibold text-text-primary">
                                Alertes de saisonnalité
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                                Recevoir un email le 1er de chaque mois si le mois suivant est
                                historiquement calme (nécessite 12 mois de données).
                            </p>
                        </div>
                        <Switch
                            checked={profile?.seasonality_enabled ?? true}
                            onCheckedChange={async (checked) => {
                                await updateProfile.mutateAsync({ seasonality_enabled: checked });
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
