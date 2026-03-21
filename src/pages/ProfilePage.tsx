import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile, useUploadLogo, StorageLimitError } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { PLANS } from '@/lib/plans';
import { profileSchema } from '@/lib/validations/profile';
import type { ProfileFormValues } from '@/lib/validations/profile';
import { Country, LegalStatus } from '@/types/profile';
import { StorageBar } from '@/components/ui/StorageBar';
import { StorageLimitModal } from '@/components/ui/StorageLimitModal';
import { useStorageUsage } from '@/hooks/useStorageUsage';

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
import { Loader2, Check, ExternalLink, Sparkles, AlertTriangle, RefreshCw, Ban, Star, PauseCircle, XCircle, CreditCard } from 'lucide-react';
import { openLemonSqueezyCheckout } from '@/lib/lemon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

// ─── Lemon Squeezy ─────────────────────────────────────────────────────────
const LS_STARTER_MONTHLY = 'https://prezta.lemonsqueezy.com/checkout/buy/962125e4-80f2-4181-966e-f53763aae63d'
const LS_PRO_MONTHLY     = 'https://prezta.lemonsqueezy.com/checkout/buy/912fdc98-0a1e-40de-95c8-ffde04fab2a1'
const LS_CUSTOMER_PORTAL = 'https://app.lemonsqueezy.com/my-orders'
const POLL_INTERVAL_MS   = 2_000
const POLL_TIMEOUT_MS    = 30 * 1_000

// ─── Subscription card ──────────────────────────────────────────────────────

function PlanBadge({ plan, cancelled }: { plan: string; cancelled?: boolean }) {
    if (plan === 'pro')
        return <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${cancelled ? 'bg-gray-100 text-gray-500 line-through' : 'bg-brand-light text-brand'}`}>Pro</span>
    if (plan === 'starter')
        return <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${cancelled ? 'bg-gray-100 text-gray-500 line-through' : 'bg-surface2 text-text-secondary'}`}>Starter</span>
    return <span className="bg-amber-100 text-amber-700 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Essai gratuit</span>
}

function SubscriptionSection() {
    const { user } = useAuth()
    const navigate  = useNavigate()
    const queryClient = useQueryClient()
    const { data: subscription } = useSubscription()

    const plan           = subscription?.plan ?? 'trial'
    const subStatus      = subscription?.status ?? null
    const isCancelled    = subscription?.isCancelled  ?? (subStatus === 'cancelled')
    const isPastDue      = subscription?.isPastDue    ?? (subStatus === 'past_due' || subStatus === 'unpaid')
    const isExpired      = subscription?.isExpired    ?? (subStatus === 'expired')
    const isPaused       = subscription?.isPaused     ?? (subStatus === 'paused')
    const pauseResumesAt = subscription?.pauseResumesAt ?? null
    const isActive       = subStatus === 'active'
    const isPro          = plan === 'pro'
    const isStarter      = plan === 'starter'
    const isTrial        = plan === 'trial' || plan === 'free'
    const isPaid         = isStarter || isPro

    const [checkoutPending, setCheckoutPending] = useState<'starter' | 'pro' | null>(null)
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const pollTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

    const trialDaysRemaining = user?.created_at
        ? Math.max(0, PLANS.trial.trialDays - Math.floor(
            (Date.now() - new Date(user.created_at).getTime()) / 86_400_000
          ))
        : PLANS.trial.trialDays
    const trialProgress = Math.round(((PLANS.trial.trialDays - trialDaysRemaining) / PLANS.trial.trialDays) * 100)

    // Format date in French
    const formatFR = (iso: string) =>
        new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    const periodEndDate   = subscription?.currentPeriodEnd ? formatFR(subscription.currentPeriodEnd) : null
    const pauseResumeDate = pauseResumesAt ? formatFR(pauseResumesAt) : null

    // Poll for plan upgrade while checkout is open
    useEffect(() => {
        if (!checkoutPending) return
        const upgraded = (checkoutPending === 'starter' && isStarter && isActive) ||
                         (checkoutPending === 'pro'     && isPro     && isActive)
        if (upgraded) {
            stopPolling()
            toast.success(`🎉 Bienvenue sur le plan ${checkoutPending === 'pro' ? 'Pro' : 'Starter'} !`)
            navigate('/dashboard')
        }
    }, [plan, subStatus, checkoutPending]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => () => stopPolling(), []) // eslint-disable-line react-hooks/exhaustive-deps

    function startPolling(target: 'starter' | 'pro') {
        setCheckoutPending(target)
        pollIntervalRef.current = setInterval(async () => {
            await queryClient.refetchQueries({ queryKey: ['subscription'] })
        }, POLL_INTERVAL_MS)
        pollTimeoutRef.current = setTimeout(stopPolling, POLL_TIMEOUT_MS)
    }

    function stopPolling() {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        if (pollTimeoutRef.current)  clearTimeout(pollTimeoutRef.current)
        pollIntervalRef.current = null
        pollTimeoutRef.current  = null
        setCheckoutPending(null)
    }

    function handleCheckout(url: string, target: 'starter' | 'pro') {
        if (!user?.id) return
        openLemonSqueezyCheckout({
            url,
            userId: user.id,
            onSuccess: () => {
                // Overlay closed — invalidate immediately so the next render fetches fresh data.
                // The polling loop (started below) continues to check every 2 s until the
                // webhook has updated Supabase (async, ~5–30 s after payment).
                void queryClient.invalidateQueries({ queryKey: ['subscription'] })
            },
        })
        startPolling(target)
    }

    return (
        <div id="abonnement" className="bg-white rounded-2xl border border-border p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <h2 className="text-base font-bold text-text-primary">Abonnement</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <PlanBadge plan={plan} cancelled={isCancelled} />

                        {/* Trial status */}
                        {isTrial && trialDaysRemaining > 0 && (
                            <span className="text-sm text-amber-700 font-medium">
                                Essai gratuit · expire dans <strong>{trialDaysRemaining} jour{trialDaysRemaining !== 1 ? 's' : ''}</strong>
                            </span>
                        )}
                        {isTrial && trialDaysRemaining === 0 && (
                            <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Essai expiré
                            </span>
                        )}

                        {/* Active paid */}
                        {isPaid && isActive && (
                            <span className="text-sm text-text-secondary flex items-center gap-1.5">
                                <RefreshCw className="h-3 w-3 text-emerald-500 shrink-0" />
                                Renouvellement automatique{periodEndDate && <> · <strong>{periodEndDate}</strong></>}
                            </span>
                        )}

                        {/* Cancelled but still has access */}
                        {isPaid && isCancelled && (
                            <span className="text-sm text-orange-600 font-medium flex items-center gap-1.5">
                                <Ban className="h-3.5 w-3.5 shrink-0" />
                                Annulé · Accès jusqu'au{periodEndDate && <strong> {periodEndDate}</strong>}
                            </span>
                        )}

                        {/* Past due — payment failed */}
                        {isPaid && isPastDue && (
                            <span className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                                Paiement en retard · Mettez à jour votre moyen de paiement
                            </span>
                        )}

                        {/* Paused */}
                        {isPaid && isPaused && (
                            <span className="text-sm text-violet-600 font-medium flex items-center gap-1.5">
                                <PauseCircle className="h-3.5 w-3.5 shrink-0" />
                                En pause{pauseResumeDate && <> · Reprend le <strong>{pauseResumeDate}</strong></>}
                            </span>
                        )}

                        {/* Expired */}
                        {isPaid && isExpired && (
                            <span className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                                Expiré · Choisissez un plan pour continuer
                            </span>
                        )}
                    </div>
                </div>

                {isPaid && (
                    <Button asChild variant="outline" size="sm" className="shrink-0 text-xs border-border">
                        <a href={LS_CUSTOMER_PORTAL} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Gérer mon abonnement
                        </a>
                    </Button>
                )}
            </div>

            {/* Trial progress bar */}
            {isTrial && (
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-text-muted">
                        <span>Jour {PLANS.trial.trialDays - trialDaysRemaining} / {PLANS.trial.trialDays}</span>
                        <span>{trialDaysRemaining} jour{trialDaysRemaining !== 1 ? 's' : ''} restant{trialDaysRemaining !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 w-full bg-surface2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${trialProgress}%` }} />
                    </div>
                </div>
            )}

            {/* Firma usage for paid plans */}
            {isPaid && isActive && (
                <div className="pt-3 border-t border-border/60 text-sm text-text-secondary">
                    Signatures FIRMA utilisées ce mois :{' '}
                    <strong className="text-text-primary">{subscription?.firmaUsed ?? 0}</strong>
                    {isStarter && ' / 3'}
                </div>
            )}

            {/* Checkout pending indicator */}
            {checkoutPending && (
                <div className="flex items-center gap-2 text-sm text-brand bg-brand-light rounded-lg px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    En attente de confirmation de paiement…
                    <button onClick={stopPolling} className="ml-auto text-text-muted hover:text-text-primary text-xs underline">
                        Annuler
                    </button>
                </div>
            )}

            {/* Upgrade options — shown for trial, starter, cancelled, expired. Hidden for past_due/paused (use portal). */}
            {!(isPro && isActive) && !isPastDue && !isPaused && !checkoutPending && (
                <div className={`pt-3 border-t border-border/60 grid gap-3 ${isTrial ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {isTrial && (
                        <div className="rounded-xl border border-border p-4 flex flex-col gap-2">
                            <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                                <p className="text-xs font-bold uppercase tracking-wider text-text-primary">Starter — 9€/mois</p>
                            </div>
                            <ul className="space-y-1 text-xs text-text-secondary flex-1">
                                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500 shrink-0" />10 projets · 50 documents · 2 Go</li>
                                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500 shrink-0" />3 signatures FIRMA/mois</li>
                                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500 shrink-0" />Tous les outils essentiels</li>
                            </ul>
                            <Button
                                size="sm"
                                className="w-full bg-text-primary text-white hover:bg-text-primary/90 mt-1"
                                onClick={() => handleCheckout(LS_STARTER_MONTHLY, 'starter')}
                            >
                                Choisir Starter
                            </Button>
                        </div>
                    )}
                    <div className="rounded-xl border-2 border-brand p-4 flex flex-col gap-2 relative overflow-hidden">
                        {!isStarter && (
                            <div className="absolute top-0 right-0 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">
                                Recommandé
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-brand" />
                            <p className="text-xs font-bold uppercase tracking-wider text-brand">Pro — 19€/mois</p>
                        </div>
                        <ul className="space-y-1 text-xs text-text-secondary flex-1">
                            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500 shrink-0" />Illimité · FIRMA illimité</li>
                            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-brand shrink-0" /><span className="font-semibold text-text-primary">IA complète</span></li>
                        </ul>
                        <Button
                            size="sm"
                            className="w-full bg-brand text-white hover:bg-brand-hover shadow-sm shadow-blue-200 mt-1"
                            onClick={() => handleCheckout(LS_PRO_MONTHLY, 'pro')}
                        >
                            Passer au Pro
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Profile skeleton ────────────────────────────────────────────────────────

function ProfileSkeleton() {
    return (
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-6 animate-pulse">
            {/* Subscription skeleton */}
            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-6 w-40 bg-gray-100 rounded-full" />
                <div className="h-2 w-full bg-gray-100 rounded-full" />
            </div>
            {/* Storage skeleton */}
            <div className="bg-white border border-border rounded-xl p-5">
                <div className="h-4 w-48 bg-gray-200 rounded mb-3" />
                <div className="h-2 w-full bg-gray-100 rounded-full" />
            </div>
            {/* Form skeleton */}
            <div className="bg-white border border-border rounded-2xl p-6 space-y-6">
                <div className="h-6 w-56 bg-gray-200 rounded" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-100 rounded-lg" />
                    <div className="h-10 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-10 bg-gray-100 rounded-lg" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-100 rounded-lg" />
                    <div className="h-10 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-10 bg-gray-100 rounded-lg" />
                <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
        </div>
    )
}

// ─── Main page ───────────────────────────────────────────────────────────────

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
            country: Country.FR,
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
                country: Country.FR,
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
            setValue('logo_url', URL.createObjectURL(file));
        }
    };

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            let finalLogoUrl = data.logo_url;
            if (logoFile) {
                finalLogoUrl = await uploadLogo.mutateAsync(logoFile);
            }
            await updateProfile.mutateAsync({ ...data, logo_url: finalLogoUrl });
        } catch (error) {
            if (error instanceof StorageLimitError) {
                setStorageLimitOpen(true);
                return;
            }
            console.error(error);
        }
    };

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    return (
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
            <StorageLimitModal
                open={storageLimitOpen}
                onOpenChange={setStorageLimitOpen}
                used={used}
                limit={limit}
            />

            {/* Subscription section */}
            <SubscriptionSection />

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
