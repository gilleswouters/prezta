import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export const ProtectedRoute = () => {
    const { session, loading } = useAuth()
    const location = useLocation()
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
    const [profileChecked, setProfileChecked] = useState(false)

    useEffect(() => {
        if (!session?.user.id) {
            setProfileChecked(true)
            return
        }
        void (async () => {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', session.user.id)
                    .maybeSingle()
                setOnboardingCompleted(data?.onboarding_completed ?? null)
            } catch {
                // On error, do not block access — treat as completed
                setOnboardingCompleted(null)
            } finally {
                setProfileChecked(true)
            }
        })()
    }, [session?.user.id])

    if (loading || !profileChecked) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg">
                <div className="text-text-muted text-sm font-mono tracking-widest uppercase animate-pulse">
                    Chargement...
                </div>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    // Redirect to onboarding ONLY if strictly false (not null/undefined).
    // This prevents a loop when profile data is still loading or column is null.
    if (
        onboardingCompleted === false &&
        location.pathname !== '/onboarding'
    ) {
        return <Navigate to="/onboarding" replace />
    }

    return <Outlet />
}
