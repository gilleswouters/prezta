import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'

export const ProtectedRoute = () => {
    const { session, loading: authLoading } = useAuth()
    const { data: subscription, isLoading: subLoading } = useSubscription()
    const location = useLocation()

    if (authLoading || subLoading) {
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

    // Enforce Pro access for all protected routes EXCEPT /pricing
    if (location.pathname !== '/pricing' && !subscription?.isPro) {
        return <Navigate to="/pricing" replace />
    }

    return <Outlet />
}
