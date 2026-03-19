// Shared config for the free/trial tier.
// The DB column defaults to 'free'; the app uses 'trial' as the canonical key.
// Both keys point to identical limits.
const FREE_TIER = {
    maxProjects:  3,
    maxDocuments: 15,
    storageBytes: 524_288_000,       // 500 Mo
    firmaPerMonth: 0,
    aiEnabled: false,
    price: { monthly: 0, annual: 0 },
    label: 'Gratuit',
    trialDays: 14,
} as const;

export const PLANS = {
    trial:   FREE_TIER,              // canonical in-app value
    free:    FREE_TIER,              // DB column default — same limits as trial
    starter: {
        maxProjects: 10,
        maxDocuments: 50,
        storageBytes: 2_147_483_648,     // 2 Go
        firmaPerMonth: 3,
        aiEnabled: false,
        price: { monthly: 9, annual: 7.20 },
        annualTotal: 86.40,
        label: 'Starter',
        trialDays: 0,
    },
    pro: {
        maxProjects: Infinity,
        maxDocuments: Infinity,
        storageBytes: 10_737_418_240,    // 10 Go
        firmaPerMonth: Infinity,
        aiEnabled: true,
        price: { monthly: 19, annual: 15.20 },
        annualTotal: 182.40,
        label: 'Pro',
        trialDays: 0,
    },
} as const;

export type PlanKey = keyof typeof PLANS;

// Document count rule: active = status !== 'archivé'
// Versioning (v1→v2) = 1 slot. Archive frees 1 slot immediately.
// At limit: document created as brouillon with send_blocked = true
