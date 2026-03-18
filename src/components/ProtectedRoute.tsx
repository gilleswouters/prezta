import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export const ProtectedRoute = () => {
    const { session, loading } = useAuth()
    const location = useLocation()

    const { data: profileCheck, isLoading: profileLoading } = useQuery({
        queryKey: ['profile-onboarding', session?.user.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('profiles')
                .select('legal_status')
                .eq('id', session!.user.id)
                .maybeSingle()
            return data
        },
        enabled: !!session?.user.id,
        staleTime: 1000 * 60 * 5,
    })

    if (loading || (!!session && profileLoading)) {
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

    const needsOnboarding = !profileCheck?.legal_status
    if (needsOnboarding && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />
    }

    return <Outlet />
}
