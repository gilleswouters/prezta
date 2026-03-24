import type { Profile } from '@/types/profile'

/**
 * Returns true only if the profile has the minimum fields required before
 * a paid checkout can proceed. Matches the fields collected in OnboardingPage steps 1–3.
 */
export function isProfileComplete(profile: Profile | null | undefined): boolean {
    if (!profile) return false
    return !!(
        profile.full_name &&
        profile.legal_status &&
        profile.siret_number &&
        profile.address_street &&
        profile.address_city &&
        profile.address_zip
    )
}
