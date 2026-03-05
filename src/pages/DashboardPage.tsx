import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useInvoices } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/button';
import {
    TrendingUp,
    AlertCircle,
    FolderKanban,
    FileSignature,
    Plus,
    Sparkles,
    ArrowUpRight,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isSameMonth, parseISO, subMonths, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: projects, isLoading: projectsLoading } = useProjects();
    const { data: invoices, isLoading: invoicesLoading } = useInvoices();

    const isLoading = projectsLoading || invoicesLoading;

    // --- CALCULATIONS ---

    // 1. CA ce mois (Paid invoices in the current month)
    const currentMonthPaidInvoices = invoices?.filter(inv => {
        if (inv.status !== 'payé' || !inv.paid_date) return false;
        return isSameMonth(parseISO(inv.paid_date), new Date());
    }) || [];

    const caCeMois = currentMonthPaidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

    // 2. En attente (Pending + Late invoices)
    const pendingInvoices = invoices?.filter(inv =>
        inv.status === 'en_attente' || inv.status === 'en_retard'
    ) || [];

    const enAttenteTotal = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

    // 3. Projets actifs
    const activeProjectsCount = projects?.filter(p => p.status === 'in_progress').length || 0;

    // 4. Docs à signer (Proxy: Pending invoices for now)
    const docsASignerCount = pendingInvoices.length;

    // Recent Projects (Top 3)
    const recentProjects = projects?.slice(0, 3) || [];

    // Required Actions (Overdue invoices or projects with no documents)
    const requiredActions = [
        ...(invoices?.filter(inv => inv.status === 'en_retard').map(inv => ({
            id: inv.id,
            title: `Facture impayée : ${inv.projects?.name || 'Client'}`,
            desc: `${Number(inv.amount).toFixed(2)}€ - Échéance: ${inv.due_date ? format(parseISO(inv.due_date), 'dd MMM', { locale: fr }) : 'Retard'}`,
            badge: 'Relancer',
            variant: 'danger' as const,
            onClick: () => navigate('/invoices') // Point to invoices to use the new Bell icon
        })) || []),
        ...(projects?.filter(p => p.status === 'draft').slice(0, 2).map(p => ({
            id: p.id,
            title: `Compléter ${p.name}`,
            desc: "Devis en attente",
            badge: "À faire",
            variant: "warning" as const,
            onClick: () => navigate(`/projets/${p.id}`)
        })) || [])
    ].slice(0, 3);

    // --- CHART DATA PREPARATION ---
    // Generate last 6 months data
    const generateChartData = () => {
        if (!invoices) return [];
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthStart = startOfMonth(date);
            const monthName = format(date, 'MMM', { locale: fr });

            // Calculate CA for this month (paid date falls in this month)
            const ca = invoices
                .filter(inv => inv.status === 'payé' && inv.paid_date && isSameMonth(parseISO(inv.paid_date), monthStart))
                .reduce((sum, inv) => sum + Number(inv.amount), 0);

            // Calculate generated invoices that are still pending from this month (creation date in month)
            const expected = invoices
                .filter(inv => (inv.status === 'en_attente' || inv.status === 'en_retard') && isSameMonth(parseISO(inv.created_at), monthStart))
                .reduce((sum, inv) => sum + Number(inv.amount), 0);

            data.push({
                name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                'CA Encaissé': ca,
                'En Attente': expected,
            });
        }
        return data;
    };

    const chartData = generateChartData();

    const firstName = user?.email?.split('@')[0] || 'Freelance';

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-80 bg-gray-100 rounded-xl"></div>
                    <div className="h-80 bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with welcome and quick actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                        Bonjour, <span className="capitalize">{firstName}</span> 👋
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">
                        Voici votre radar d'activité et cashflow pour {format(new Date(), 'MMMM yyyy', { locale: fr })}.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="bg-[var(--brand-light)] text-[var(--brand)] hover:bg-[var(--brand-border)] border-[var(--brand-border)] transition-all shadow-sm"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Assistant IA
                    </Button>
                    <Button
                        onClick={() => navigate('/projets/nouveau')}
                        className="bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau projet
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    label="CA ENCAISSÉ (MOIS)"
                    value={`${caCeMois.toLocaleString('fr-FR')} €`}
                    sub={<span className="text-[var(--success)] flex items-center gap-1 font-semibold">
                        <ArrowUpRight className="h-3 w-3" /> À jour
                    </span>}
                    icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                    gradient="from-emerald-500/10 to-transparent"
                />
                <StatCard
                    label="CASHFLOW EN ATTENTE"
                    value={`${enAttenteTotal.toLocaleString('fr-FR')} €`}
                    sub={<span className="text-[var(--text-muted)]">{docsASignerCount} facture{docsASignerCount > 1 ? 's' : ''} en cours</span>}
                    icon={<AlertCircle className="h-5 w-5 text-purple-500" />}
                    valueColor="text-purple-600"
                    gradient="from-purple-500/10 to-transparent"
                />
                <StatCard
                    label="PROJETS ACTIFS"
                    value={activeProjectsCount}
                    sub={<span className="text-[var(--text-muted)]">En cours de réalisation</span>}
                    icon={<FolderKanban className="h-5 w-5 text-blue-500" />}
                    gradient="from-blue-500/10 to-transparent"
                />
                <StatCard
                    label="DOCS À SIGNER"
                    value={docsASignerCount}
                    sub={<span className="text-[var(--text-muted)]">Attente signature client</span>}
                    icon={<FileSignature className="h-5 w-5 text-amber-500" />}
                    gradient="from-amber-500/10 to-transparent"
                />
            </div>

            {/* Charts & Actions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Evolution du CA Chart */}
                <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-gray-50/50">
                        <div>
                            <h2 className="text-base font-bold text-[var(--text-primary)]">Performance & Trésorerie</h2>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">Évolution sur les 6 derniers mois</p>
                        </div>
                    </div>
                    <div className="p-6 flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `${value}€`} />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                <Bar dataKey="CA Encaissé" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="En Attente" fill="#A855F7" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Actions & Recent */}
                <div className="space-y-6">
                    {/* Required Actions */}
                    <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm relative">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-400"></div>
                        <div className="px-6 py-5 border-b border-[var(--border)]">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                Actions Requises
                            </h2>
                        </div>
                        <div className="divide-y divide-[var(--border)] bg-gray-50/30">
                            {requiredActions.length > 0 ? (
                                requiredActions.map((action, i) => (
                                    <div
                                        key={i}
                                        onClick={action.onClick}
                                        className="px-6 py-4 flex items-center justify-between hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                                    >
                                        <div className="pr-4">
                                            <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight group-hover:text-[var(--brand)] transition-colors">{action.title}</p>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">{action.desc}</p>
                                        </div>
                                        <Button size="sm" variant={action.variant === 'danger' ? 'destructive' : 'outline'} className="text-[10px] h-7 px-2 shrink-0">
                                            {action.badge}
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                                    <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    Tout est à jour !
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Projects Minimal */}
                    <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Projets récents
                            </h2>
                            <Button variant="ghost" size="sm" className="text-xs h-7 text-[var(--brand)] hover:text-[var(--brand-hover)]" onClick={() => navigate('/projets')}>
                                Voir tout <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                        <div className="divide-y divide-[var(--border)]">
                            {recentProjects.length > 0 ? (
                                recentProjects.map((project: any) => (
                                    <div key={project.id} className="px-6 py-3 bg-white hover:bg-[var(--surface)] transition-colors cursor-pointer" onClick={() => navigate(`/projets/${project.id}`)}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate pr-2">{project.name}</p>
                                            <Badge status={project.status} />
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{project.clients?.name || 'Sans client'}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-[var(--text-muted)] text-sm">
                                    Aucun projet récent.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function StatCard({ label, value, sub, icon, valueColor = "text-[var(--text-primary)]", gradient }: {
    label: string,
    value: string | number,
    sub: React.ReactNode,
    icon: React.ReactNode,
    valueColor?: string,
    gradient?: string
}) {
    return (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
            {gradient && (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 pointer-events-none transition-opacity group-hover:opacity-100`}></div>
            )}
            <div className="relative z-10 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                {label}
            </div>
            <div className="relative z-10 flex items-center justify-between mb-2">
                <div className={`text-3xl font-extrabold tracking-tight ${valueColor}`}>
                    {value}
                </div>
                <div className="h-12 w-12 bg-white/50 backdrop-blur-sm shadow-sm rounded-xl border border-white/20 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            </div>
            <div className="relative z-10 text-[11px] font-medium leading-none">
                {sub}
            </div>
        </div>
    );
}

function Badge({ status }: { status: string }) {
    const variants: Record<string, string> = {
        'in_progress': 'bg-blue-50 text-blue-600 border-blue-100',
        'completed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'draft': 'bg-amber-50 text-amber-600 border-amber-100',
        'cancelled': 'bg-red-50 text-red-600 border-red-100'
    };

    const labels: Record<string, string> = {
        'in_progress': 'En cours',
        'completed': 'Terminé',
        'draft': 'Brouillon',
        'cancelled': 'Annulé'
    };

    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${variants[status] || variants.draft}`}>
            {labels[status] || status}
        </span>
    );
}
