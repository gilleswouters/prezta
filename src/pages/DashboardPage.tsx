import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
    const { user, signOut } = useAuth()

    return (
        <div className="min-h-screen bg-bg text-text p-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif">
                    Dashboard <span className="text-accent italic">Prezta</span>
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted">{user?.email}</span>
                    <Button onClick={signOut} variant="outline" className="border-border hover:bg-surface text-text">
                        Déconnexion
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-border rounded-lg p-6">
                    <h2 className="text-lg font-medium mb-2">Projets actifs</h2>
                    <p className="text-3xl font-mono text-p1">0</p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-6">
                    <h2 className="text-lg font-medium mb-2">Paiements en attente</h2>
                    <p className="text-3xl font-mono text-p2">0 €</p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-6">
                    <h2 className="text-lg font-medium mb-2">Documents en cours</h2>
                    <p className="text-3xl font-mono text-p3">0</p>
                </div>
            </div>
        </div>
    )
}
