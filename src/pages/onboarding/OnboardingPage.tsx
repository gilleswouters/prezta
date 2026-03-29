import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { openLemonSqueezyCheckout } from '@/lib/lemon'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Check, Loader2, Sparkles, ArrowRight, LogOut } from 'lucide-react'
import { LegalStatus } from '@/types/profile'
import { ProfessionCombobox } from '@/components/ui/ProfessionCombobox'

// ── Lemon Squeezy checkout URLs ───────────────────────────────────────────────
const LS_STARTER_MONTHLY = 'https://prezta.lemonsqueezy.com/checkout/buy/962125e4-80f2-4181-966e-f53763aae63d'
const LS_PRO_MONTHLY     = 'https://prezta.lemonsqueezy.com/checkout/buy/912fdc98-0a1e-40de-95c8-ffde04fab2a1'

// ── Luhn validation for SIRET ─────────────────────────────────────────────────
function luhn(value: string): boolean {
    if (!/^\d+$/.test(value)) return false
    let sum = 0
    let alt = false
    for (let i = value.length - 1; i >= 0; i--) {
        let n = parseInt(value[i])
        if (alt) {
            n *= 2
            if (n > 9) n -= 9
        }
        sum += n
        alt = !alt
    }
    return sum % 10 === 0
}

// ── Zod schemas ───────────────────────────────────────────────────────────────
const step1Schema = z.object({
    full_name:    z.string().min(2, 'Requis (min 2 caractères)'),
    company_name: z.string().min(2, 'Requis (min 2 caractères)'),
})

const step2Schema = z.object({
    legal_status: z.enum(
        ['independant_be', 'auto_entrepreneur_fr', 'eurl', 'sasu', 'srl_be', 'sa_be', 'autre'],
        { message: 'Statut juridique requis' }
    ),
    // transform strips spaces so "123 456 789 00012" → "12345678900012", then validates
    siret_number: z.string()
        .transform((v): string => v.replace(/\s/g, ''))
        .pipe(z.string()
            .regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres')
            .refine(luhn, 'SIRET invalide (clé de contrôle incorrecte)')
        ),
})

const step3Schema = z.object({
    address_street: z.string().optional(),
    address_city:   z.string().optional(),
    // strip spaces before validating zip
    address_zip: z.string()
        .transform((v): string => v.replace(/\s/g, ''))
        .refine(v => !v || /^\d{5}$/.test(v), 'Code postal invalide (5 chiffres)')
        .optional(),
    phone: z.string().optional(),
    // strip spaces from IBAN (e.g. "FR76 3000 …" → "FR76300…")
    iban: z.string()
        .transform((v): string => v.replace(/\s/g, ''))
        .optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

// ── Legal status options ──────────────────────────────────────────────────────
const LEGAL_STATUS_OPTIONS: { value: LegalStatus; label: string }[] = [
    { value: 'auto_entrepreneur_fr', label: 'Auto-entrepreneur (FR)' },
    { value: 'eurl',                 label: 'EURL' },
    { value: 'sasu',                 label: 'SASU' },
    { value: 'autre',                label: 'SAS / SARL / Autre' },
    { value: 'independant_be',       label: 'Indépendant (BE)' },
    { value: 'srl_be',               label: 'SRL (BE)' },
    { value: 'sa_be',                label: 'SA (BE)' },
]

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < current ? 'bg-brand' : 'bg-border'
                    }`}
                />
            ))}
            <span className="text-xs text-text-muted font-medium shrink-0">
                {current}/{total}
            </span>
        </div>
    )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
    label,
    error,
    children,
    hint,
}: {
    label: string
    error?: string
    children: React.ReactNode
    hint?: string
}) {
    return (
        <div>
            <Label className="text-sm font-semibold text-text-primary">{label}</Label>
            <div className="mt-1">{children}</div>
            {hint && !error && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const queryClient = useQueryClient()

    console.log('[onboarding] rendered, pendingCheckout:', sessionStorage.getItem('pendingCheckout'), 'location.state:', location.state)
    const [step, setStep] = useState(1)
    const [professionSlug, setProfessionSlug] = useState<string | null>(null)
    const [professionCustom, setProfessionCustom] = useState('')

    // FIX 5 — context banner when arriving from a paid checkout gate
    const fromCheckout = (location.state as { reason?: string; planName?: string } | null)?.reason === 'checkout'
    const checkoutPlanName = (location.state as { reason?: string; planName?: string } | null)?.planName ?? null
    const [saving, setSaving] = useState(false)
    const [quitOpen, setQuitOpen] = useState(false)
    // null = not waiting; 'starter'|'pro' = waiting for webhook after paid checkout
    const [waitingForPayment, setWaitingForPayment] = useState<'starter' | 'pro' | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // Prevent finishOnboarding from running twice (Checkout.Success + poll race)
    const finishCalledRef = useRef(false)

    // ── Safety exit: already completed → dashboard ─────────────────────────
    const { data: profileData } = useQuery({
        queryKey: ['profile-onboarding', user?.id],
        queryFn: async () => {
            if (!user?.id) return null
            const { data } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', user.id)
                .maybeSingle()
            return data
        },
        enabled: !!user?.id,
        staleTime: 0,
    })

    console.log('[onboarding] onboarding_completed:', profileData?.onboarding_completed)

    useEffect(() => {
        // Skip redirect if user was sent here to complete their profile before a paid checkout
        const hasPendingCheckout = !!sessionStorage.getItem('pendingCheckout')
        console.log('[onboarding] redirect check — onboarding_completed:', profileData?.onboarding_completed, 'hasPendingCheckout:', hasPendingCheckout)
        if (profileData?.onboarding_completed === true && !hasPendingCheckout) {
            navigate('/dashboard', { replace: true })
        }
    }, [profileData, navigate])

    // ── FIX 5: Warn before leaving mid-onboarding ──────────────────────────
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault()
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [])

    // ── FIX 4: Poll subscriptions after paid checkout (Option B fallback) ──
    useEffect(() => {
        if (!waitingForPayment || !user?.id) return

        pollRef.current = setInterval(async () => {
            const { data } = await supabase
                .from('subscriptions')
                .select('plan, status')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .maybeSingle()

            if (data && (data.plan === 'starter' || data.plan === 'pro')) {
                if (pollRef.current) clearInterval(pollRef.current)
                if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
                setWaitingForPayment(null)
                await finishOnboarding(false)
            }
        }, 3000)

        // Stop polling after 10 minutes
        pollTimeoutRef.current = setTimeout(() => {
            if (pollRef.current) clearInterval(pollRef.current)
            setWaitingForPayment(null)
        }, 10 * 60 * 1000)

        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
            if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waitingForPayment, user?.id])

    // ── Profile helpers ────────────────────────────────────────────────────
    const saveToProfile = async (updates: Record<string, unknown>) => {
        if (!user?.id) return
        await supabase.from('profiles').update(updates).eq('id', user.id)
    }

    // insertTrialSubscription: only called for the free plan choice
    const insertTrialSubscription = async () => {
        if (!user?.id) return
        await supabase.from('subscriptions').upsert(
            { user_id: user.id, plan: 'trial', status: 'active' },
            { onConflict: 'user_id' }
        )
    }

    // finishOnboarding: withTrialUpsert=true for free plan, false for paid (webhook handles it)
    const finishOnboarding = async (withTrialUpsert = true) => {
        // Guard: only run once per page lifecycle (Checkout.Success + poll may race)
        if (finishCalledRef.current) return
        finishCalledRef.current = true
        if (withTrialUpsert) await insertTrialSubscription()
        await saveToProfile({ onboarding_completed: true })
        await queryClient.refetchQueries({ queryKey: ['profile-onboarding', user?.id] })
        await queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] })

        // FIX 4 — resume pending paid checkout that was blocked by incomplete profile
        const raw = sessionStorage.getItem('pendingCheckout')
        if (raw) {
            sessionStorage.removeItem('pendingCheckout')
            try {
                const { variantUrl, userId } = JSON.parse(raw) as { variantUrl: string; userId: string }
                navigate('/dashboard', { replace: true })
                setTimeout(() => {
                    openLemonSqueezyCheckout({
                        url:      variantUrl,
                        userId,
                        onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['subscription'] }) },
                    })
                }, 500)
            } catch {
                navigate('/dashboard', { replace: true })
            }
        } else {
            navigate('/dashboard', { replace: true })
        }
    }

    // ── FIX 4: Open LS checkout — delegates to openLemonSqueezyCheckout so
    //    checkout[custom][user_id] is always included in the URL (BUG 1 fix)
    const openPaidCheckout = (url: string, plan: 'starter' | 'pro') => {
        if (!user?.id) return
        openLemonSqueezyCheckout({
            url,
            userId: user.id,
            onSuccess: () => {
                setWaitingForPayment(null)
                void finishOnboarding(false)
            },
        })
        // Also start polling as safety net (overlay might miss the event)
        setWaitingForPayment(plan)
    }

    // ── FIX 5: Quit handler ────────────────────────────────────────────────
    const handleQuit = () => setQuitOpen(true)
    const confirmQuit = () => navigate('/dashboard', { replace: true })

    // ── Step forms ────────────────────────────────────────────────────────
    const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
    const onStep1 = async (data: Step1Data) => {
        setSaving(true)
        await saveToProfile({ full_name: data.full_name, company_name: data.company_name })
        setSaving(false)
        setStep(2)
    }

    // Step 2 (NEW): profession selection — always optional, skip allowed
    const onStep2Profession = async () => {
        if (professionSlug) {
            setSaving(true)
            await saveToProfile({
                profession_slug:   professionSlug,
                profession_custom: professionCustom || null,
            })
            setSaving(false)
        }
        setStep(3)
    }
    const skipStep2Profession = () => setStep(3)

    const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })
    const onStep2 = async (data: Step2Data) => {
        setSaving(true)
        await saveToProfile({
            legal_status:  data.legal_status,
            siret_number:  data.siret_number,
            country:       'FR',
        })
        setSaving(false)
        setStep(4)
    }

    const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) })
    const onStep3 = async (data: Step3Data) => {
        setSaving(true)
        await saveToProfile({
            address_street: data.address_street ?? null,
            address_city:   data.address_city ?? null,
            address_zip:    data.address_zip ?? null,
            phone:          data.phone ?? null,
            iban:           data.iban ?? null,
        })
        setSaving(false)
        // BUG 2 fix: if a paid checkout was queued before onboarding, skip plan selection
        // and resume that checkout directly — avoids opening the LS form twice
        if (sessionStorage.getItem('pendingCheckout')) {
            void finishOnboarding(false)
        } else {
            setStep(5)
        }
    }
    const skipStep3 = () => {
        if (sessionStorage.getItem('pendingCheckout')) {
            void finishOnboarding(false)
        } else {
            setStep(5)
        }
    }

    // ── Payment waiting screen ─────────────────────────────────────────────
    if (waitingForPayment) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center py-12 px-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <span className="font-extrabold text-brand text-2xl tracking-tight">Prezta</span>
                    <div className="bg-white rounded-2xl border border-border shadow-sm p-10 space-y-5">
                        <Loader2 className="h-10 w-10 animate-spin text-brand mx-auto" />
                        <div>
                            <h2 className="text-lg font-black text-text-primary">
                                En attente de confirmation de paiement…
                            </h2>
                            <p className="text-sm text-text-secondary mt-2">
                                Cette page se mettra à jour automatiquement après votre paiement.
                            </p>
                        </div>
                        <p className="text-xs text-text-muted">
                            Si vous avez déjà payé,{' '}
                            <button
                                onClick={() => void finishOnboarding(false)}
                                className="text-brand underline font-medium"
                            >
                                actualisez ici
                            </button>
                            .
                        </p>
                        <Button
                            variant="ghost"
                            className="text-text-muted text-sm w-full"
                            onClick={() => setWaitingForPayment(null)}
                        >
                            Annuler et revenir au choix de plan
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
        <AlertDialog open={quitOpen} onOpenChange={setQuitOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Continuer plus tard ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Votre progression sera sauvegardée. Vous pourrez compléter votre profil plus tard depuis votre tableau de bord.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Rester ici</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmQuit}>
                        Accéder au tableau de bord
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <div className="min-h-screen bg-surface flex flex-col items-center justify-center py-12 px-4">
            <div className="w-full max-w-lg">
                {/* Brand + quit button */}
                <div className="flex items-center justify-between mb-8">
                    <span className="font-extrabold text-brand text-2xl tracking-tight">Prezta</span>
                    <button
                        onClick={handleQuit}
                        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Quitter
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
                    {/* FIX 5 — context banner when redirected from a paid checkout gate */}
                    {fromCheckout && (
                        <div className="mb-5 rounded-xl bg-brand/5 border border-brand/20 px-4 py-3 flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-brand">
                                    Finalisez votre profil pour accéder au plan{' '}
                                    {checkoutPlanName === 'pro' ? 'Pro ✦' : checkoutPlanName === 'starter' ? 'Starter ⭐' : 'payant'}
                                </p>
                                <p className="text-xs text-text-secondary mt-0.5">
                                    Ces informations sont requises pour émettre des factures conformes. Une fois complétées, votre commande reprendra automatiquement.
                                </p>
                            </div>
                        </div>
                    )}

                    <ProgressBar current={step} total={5} />

                    {/* ── Step 1: Bienvenue ───────────────────────────────── */}
                    {step === 1 && (
                        <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-6">
                            <div className="space-y-1 mb-6">
                                <h1 className="text-xl font-black text-text-primary">
                                    Bienvenue sur Prezta !
                                </h1>
                                <p className="text-sm text-text-secondary">
                                    Configurons votre espace en 3 minutes.
                                </p>
                            </div>

                            <Field label="Nom complet" error={form1.formState.errors.full_name?.message}>
                                <Input
                                    placeholder="Marie Dupont"
                                    defaultValue={user?.user_metadata?.full_name ?? ''}
                                    {...form1.register('full_name')}
                                />
                            </Field>

                            <Field
                                label="Métier / activité"
                                error={form1.formState.errors.company_name?.message}
                                hint="Ex : Développeur web, Graphiste, Consultant marketing…"
                            >
                                <Input
                                    placeholder="Développeur web freelance"
                                    {...form1.register('company_name')}
                                />
                            </Field>

                            <Button type="submit" disabled={saving} className="w-full bg-brand text-white hover:bg-brand-hover">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Commencer <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </form>
                    )}

                    {/* ── Step 2: Votre activité (NEW) ────────────────────── */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-1 mb-6">
                                <h1 className="text-xl font-black text-text-primary">
                                    Quel est votre métier ?
                                </h1>
                                <p className="text-sm text-text-secondary">
                                    Prezta adaptera votre catalogue de prestations à votre activité.
                                </p>
                            </div>

                            <ProfessionCombobox
                                value={professionSlug}
                                customValue={professionCustom}
                                onChange={(slug, custom) => {
                                    setProfessionSlug(slug)
                                    setProfessionCustom(custom)
                                }}
                                label="Métier principal"
                                placeholder="Rechercher votre métier…"
                            />

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="flex-none"
                                >
                                    Retour
                                </Button>
                                <Button
                                    type="button"
                                    onClick={onStep2Profession}
                                    disabled={saving}
                                    className="flex-1 bg-brand text-white hover:bg-brand-hover"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Suivant <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={skipStep2Profession}
                                    className="text-text-muted hover:text-text-secondary text-sm"
                                >
                                    Je le définirai plus tard
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Informations légales ────────────────────── */}
                    {step === 3 && (
                        <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-6">
                            <div className="space-y-1 mb-6">
                                <h1 className="text-xl font-black text-text-primary">
                                    Informations légales
                                </h1>
                                <p className="text-sm text-text-secondary">
                                    Ces informations apparaissent sur vos documents.
                                </p>
                            </div>

                            <Field
                                label="Statut juridique"
                                error={form2.formState.errors.legal_status?.message}
                            >
                                <Controller
                                    control={form2.control}
                                    name="legal_status"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner votre statut…" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white z-[100] opacity-100">
                                                {LEGAL_STATUS_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </Field>

                            <Field
                                label="SIRET"
                                error={form2.formState.errors.siret_number?.message}
                                hint="14 chiffres — trouvez-le sur papiers.fr ou infogreffe.fr"
                            >
                                {/* maxLength=20 allows spaces: "123 456 789 00012" */}
                                <Input
                                    placeholder="123 456 789 00012"
                                    maxLength={20}
                                    {...form2.register('siret_number')}
                                />
                            </Field>

                            <div>
                                <Label className="text-sm font-semibold text-text-primary">Pays</Label>
                                <div className="mt-1 h-10 px-3 flex items-center rounded-md border border-border bg-surface text-sm text-text-muted">
                                    🇫🇷 France
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(2)}
                                    className="flex-1"
                                >
                                    Retour
                                </Button>
                                <Button type="submit" disabled={saving} className="flex-1 bg-brand text-white hover:bg-brand-hover">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Suivant
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* ── Step 4: Coordonnées ─────────────────────────────── */}
                    {step === 4 && (
                        <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-5">
                            <div className="space-y-1 mb-6">
                                <h1 className="text-xl font-black text-text-primary">Coordonnées</h1>
                                <p className="text-sm text-text-secondary">
                                    Pour vos devis et factures. Vous pourrez modifier ces informations plus tard.
                                </p>
                            </div>

                            <Field label="Adresse" error={form3.formState.errors.address_street?.message}>
                                <Input placeholder="12 rue de la Paix" {...form3.register('address_street')} />
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Ville" error={form3.formState.errors.address_city?.message}>
                                    <Input placeholder="Paris" {...form3.register('address_city')} />
                                </Field>
                                <Field label="Code postal" error={form3.formState.errors.address_zip?.message}>
                                    <Input placeholder="75001" maxLength={5} {...form3.register('address_zip')} />
                                </Field>
                            </div>

                            <Field label="Téléphone" error={form3.formState.errors.phone?.message}>
                                <Input placeholder="+33 6 12 34 56 78" {...form3.register('phone')} />
                            </Field>

                            <Field
                                label="IBAN (optionnel)"
                                error={form3.formState.errors.iban?.message}
                                hint="Affiché sur vos factures — les espaces sont automatiquement supprimés"
                            >
                                <Input placeholder="FR76 3000 …" {...form3.register('iban')} />
                            </Field>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(3)}
                                >
                                    Retour
                                </Button>
                                <Button type="submit" disabled={saving} className="flex-1 bg-brand text-white hover:bg-brand-hover">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Suivant
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={skipStep3}
                                    className="text-text-muted hover:text-text-secondary"
                                >
                                    Je compléterai plus tard
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* ── Step 5: Choisir un plan ─────────────────────────── */}
                    {step === 5 && (
                        <div className="space-y-4">
                            <div className="space-y-1 mb-6">
                                <h1 className="text-xl font-black text-text-primary">Choisir un plan</h1>
                                <p className="text-sm text-text-secondary">
                                    Commencez gratuitement, changez de plan à tout moment.
                                </p>
                            </div>

                            {/* Trial card */}
                            <div className="rounded-xl border-2 border-border p-5 space-y-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Gratuit</p>
                                    <p className="text-2xl font-black text-text-primary mt-1">
                                        0€ <span className="text-sm font-normal text-text-muted">/ 14 jours</span>
                                    </p>
                                </div>
                                <ul className="space-y-1.5 text-sm text-text-secondary">
                                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" />3 projets · 15 documents</li>
                                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" />Devis, factures & contrats PDF</li>
                                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" />Portail client</li>
                                </ul>
                                <Button
                                    className="w-full bg-text-primary text-white hover:bg-text-primary/90"
                                    disabled={saving}
                                    onClick={() => void finishOnboarding(true)}
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Commencer l'essai gratuit
                                </Button>
                            </div>

                            {/* Starter card */}
                            <div className="rounded-xl border border-border p-5 space-y-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-brand">Starter</p>
                                    <p className="text-2xl font-black text-text-primary mt-1">
                                        9€ <span className="text-sm font-normal text-text-muted">/ mois</span>
                                    </p>
                                </div>
                                <ul className="space-y-1.5 text-sm text-text-secondary">
                                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" />10 projets · 50 documents</li>
                                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" />3 signatures FIRMA/mois</li>
                                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" />2 Go de stockage</li>
                                </ul>
                                <Button
                                    variant="outline"
                                    className="w-full border-border"
                                    onClick={() => openPaidCheckout(LS_STARTER_MONTHLY, 'starter')}
                                >
                                    Choisir Starter
                                </Button>
                            </div>

                            {/* Pro card */}
                            <div className="rounded-xl border-2 border-brand p-5 space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                                    Recommandé
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-brand" />
                                        <p className="text-xs font-bold uppercase tracking-wider text-brand">Pro</p>
                                    </div>
                                    <p className="text-2xl font-black text-text-primary mt-1">
                                        19€ <span className="text-sm font-normal text-text-muted">/ mois</span>
                                    </p>
                                </div>
                                <ul className="space-y-1.5 text-sm text-text-secondary">
                                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" />Projets & documents illimités</li>
                                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" />Signatures FIRMA illimitées</li>
                                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brand" /><span className="font-semibold text-text-primary">IA complète</span> — clauses, relances, route</li>
                                </ul>
                                <Button
                                    className="w-full bg-brand text-white hover:bg-brand-hover shadow-md shadow-blue-200"
                                    onClick={() => openPaidCheckout(LS_PRO_MONTHLY, 'pro')}
                                >
                                    Choisir Pro
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    )
}
