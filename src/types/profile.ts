export const Country = {
    BE: 'BE',
    FR: 'FR',
    CH: 'CH'
} as const;

export type Country = typeof Country[keyof typeof Country];

export const LegalStatus = {
    INDEPENDANT_BE: 'independant_be',
    AUTO_ENTREPRENEUR_FR: 'auto_entrepreneur_fr',
    EURL: 'eurl',
    SASU: 'sasu',
    SAS: 'sas',
    SARL: 'sarl',
    SRL_BE: 'srl_be',
    SA_BE: 'sa_be',
    AUTRE: 'autre'
} as const;

export type LegalStatus = typeof LegalStatus[keyof typeof LegalStatus];

export interface LogoPreferences {
    contracts: boolean;
    quotes: boolean;
    invoices: boolean;
    emails: boolean;
}

export interface Profile {
    id: string; // references auth.users
    full_name: string | null;
    email: string | null;
    phone: string | null;
    country: Country | null;
    legal_status: LegalStatus | null;
    company_name: string | null;
    bce_number: string | null;
    siret_number: string | null;
    vat_number: string | null;
    iban: string | null;
    address_street: string | null;
    address_city: string | null;
    address_zip: string | null;
    logo_url: string | null;
    logo_preferences: LogoPreferences | null;
    legal_representative_name: string | null;
    legal_representative_role: string | null;
    created_at: string;
    updated_at: string;
    // Seasonality alerts (migration 00028)
    seasonality_enabled: boolean;
    last_seasonality_alert_sent_at: string | null;
    // Onboarding completion flag (migration 00034)
    onboarding_completed: boolean;
    // Profession (migration 00040)
    profession_slug: string | null;
    profession_custom: string | null;
}

// Omit database generated fields for the form mapping
export type ProfileFormData = Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'email'> & {
    email?: string | null; // email is usually readonly in profile forms but kept sync'd
};
