import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Calculator, BookOpen, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';

// ─── Row types ────────────────────────────────────────────────────────────────

interface MaterialRow { id: string; description: string; quantity: string; unit_price: string; }
interface LaborRow    { id: string; description: string; hours: string; hourly_rate: string; }
interface TravelRow   { id: string; description: string; km: string; rate_per_km: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function n(v: string): number {
    const parsed = parseFloat(v.replace(',', '.'));
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function uid(): string { return Math.random().toString(36).slice(2, 9); }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CostCalculatorPage() {
    const navigate = useNavigate();
    const createProduct = useCreateProduct();

    const [materials, setMaterials] = useState<MaterialRow[]>([
        { id: uid(), description: '', quantity: '', unit_price: '' },
    ]);
    const [labor, setLabor] = useState<LaborRow[]>([
        { id: uid(), description: '', hours: '', hourly_rate: '' },
    ]);
    const [travel, setTravel] = useState<TravelRow[]>([
        { id: uid(), description: '', km: '', rate_per_km: '0.50' },
    ]);
    const [marge, setMarge] = useState('');

    // Reactive totals
    const totals = useMemo(() => {
        const coutMaterials = materials.reduce((s, r) => s + n(r.quantity) * n(r.unit_price), 0);
        const coutLabor     = labor.reduce((s, r) => s + n(r.hours) * n(r.hourly_rate), 0);
        const coutTravel    = travel.reduce((s, r) => s + n(r.km) * n(r.rate_per_km), 0);
        const sousTotal     = coutMaterials + coutLabor + coutTravel;
        const margeRate     = Math.min(100, Math.max(0, n(marge)));
        const margeAmount   = sousTotal * margeRate / 100;
        const prixHT        = sousTotal + margeAmount;
        const prixTTC       = prixHT * 1.20;
        return { coutMaterials, coutLabor, coutTravel, sousTotal, margeAmount, prixHT, prixTTC };
    }, [materials, labor, travel, marge]);

    // ── Material row handlers ──────────────────────────────────────────────────
    function updateMaterial(id: string, field: keyof MaterialRow, value: string) {
        setMaterials(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    }
    function addMaterial() {
        setMaterials(rows => [...rows, { id: uid(), description: '', quantity: '', unit_price: '' }]);
    }
    function removeMaterial(id: string) {
        setMaterials(rows => rows.filter(r => r.id !== id));
    }

    // ── Labor row handlers ─────────────────────────────────────────────────────
    function updateLabor(id: string, field: keyof LaborRow, value: string) {
        setLabor(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    }
    function addLabor() {
        setLabor(rows => [...rows, { id: uid(), description: '', hours: '', hourly_rate: '' }]);
    }
    function removeLabor(id: string) {
        setLabor(rows => rows.filter(r => r.id !== id));
    }

    // ── Travel row handlers ───────────────────────────────────────────────────
    function updateTravel(id: string, field: keyof TravelRow, value: string) {
        setTravel(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    }
    function addTravel() {
        setTravel(rows => [...rows, { id: uid(), description: '', km: '', rate_per_km: '0.50' }]);
    }
    function removeTravel(id: string) {
        setTravel(rows => rows.filter(r => r.id !== id));
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    async function handleExportCatalogue() {
        if (totals.prixHT === 0) {
            toast.warning('Renseignez au moins un élément pour exporter.');
            return;
        }
        await createProduct.mutateAsync({
            name: 'Prix de revient calculé',
            description: `Matériaux : ${totals.coutMaterials.toFixed(2)} € · Main d'œuvre : ${totals.coutLabor.toFixed(2)} € · Déplacements : ${totals.coutTravel.toFixed(2)} €`,
            unit_price: totals.prixHT,
            tva_rate: 20,
            unit: 'forfait',
            categorie: null,
        });
        navigate('/catalogue');
    }

    function handleCreerDevis() {
        if (totals.prixHT === 0) {
            toast.warning('Renseignez au moins un élément avant de créer un devis.');
            return;
        }
        navigate('/projets', {
            state: {
                prefillPrice: totals.prixHT,
                prefillDescription: `Forfait calculé — HT : ${totals.prixHT.toFixed(2)} €, TTC : ${totals.prixTTC.toFixed(2)} €`,
            },
        });
        toast.info('Sélectionnez ou créez un projet pour démarrer le devis.');
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-6 items-start">

            {/* Left: input sections */}
            <div className="flex-1 min-w-0 space-y-6">

                {/* Matériaux */}
                <SectionCard
                    title="Matériaux"
                    subtitle={eur(totals.coutMaterials)}
                >
                    <div className="space-y-2">
                        <div className="grid grid-cols-[1fr_100px_110px_36px] gap-2 px-1 mb-1">
                            <ColHeader>Description</ColHeader>
                            <ColHeader right>Qté</ColHeader>
                            <ColHeader right>PU HT (€)</ColHeader>
                            <span />
                        </div>
                        {materials.map(row => (
                            <div key={row.id} className="grid grid-cols-[1fr_100px_110px_36px] gap-2 items-center">
                                <Input placeholder="Description" value={row.description}
                                    onChange={e => updateMaterial(row.id, 'description', e.target.value)}
                                    className="h-9 text-sm" />
                                <Input placeholder="0" type="number" min="0" value={row.quantity}
                                    onChange={e => updateMaterial(row.id, 'quantity', e.target.value)}
                                    className="h-9 text-sm text-right" />
                                <Input placeholder="0.00" type="number" min="0" step="0.01" value={row.unit_price}
                                    onChange={e => updateMaterial(row.id, 'unit_price', e.target.value)}
                                    className="h-9 text-sm text-right" />
                                <RemoveBtn onClick={() => removeMaterial(row.id)} disabled={materials.length === 1} />
                            </div>
                        ))}
                        <AddRowBtn onClick={addMaterial} />
                    </div>
                </SectionCard>

                {/* Main d'œuvre */}
                <SectionCard
                    title="Main d'œuvre"
                    subtitle={eur(totals.coutLabor)}
                >
                    <div className="space-y-2">
                        <div className="grid grid-cols-[1fr_90px_130px_36px] gap-2 px-1 mb-1">
                            <ColHeader>Description</ColHeader>
                            <ColHeader right>Heures</ColHeader>
                            <ColHeader right>Taux horaire (€)</ColHeader>
                            <span />
                        </div>
                        {labor.map(row => (
                            <div key={row.id} className="grid grid-cols-[1fr_90px_130px_36px] gap-2 items-center">
                                <Input placeholder="Description" value={row.description}
                                    onChange={e => updateLabor(row.id, 'description', e.target.value)}
                                    className="h-9 text-sm" />
                                <Input placeholder="0" type="number" min="0" step="0.5" value={row.hours}
                                    onChange={e => updateLabor(row.id, 'hours', e.target.value)}
                                    className="h-9 text-sm text-right" />
                                <Input placeholder="0.00" type="number" min="0" step="0.50" value={row.hourly_rate}
                                    onChange={e => updateLabor(row.id, 'hourly_rate', e.target.value)}
                                    className="h-9 text-sm text-right" />
                                <RemoveBtn onClick={() => removeLabor(row.id)} disabled={labor.length === 1} />
                            </div>
                        ))}
                        <AddRowBtn onClick={addLabor} />
                    </div>
                </SectionCard>

                {/* Déplacements */}
                <SectionCard
                    title="Déplacements"
                    subtitle={eur(totals.coutTravel)}
                >
                    <div className="space-y-2">
                        <div className="grid grid-cols-[1fr_90px_130px_36px] gap-2 px-1 mb-1">
                            <ColHeader>Description</ColHeader>
                            <ColHeader right>Km</ColHeader>
                            <ColHeader right>Taux/km (€)</ColHeader>
                            <span />
                        </div>
                        {travel.map(row => (
                            <div key={row.id} className="grid grid-cols-[1fr_90px_130px_36px] gap-2 items-center">
                                <Input placeholder="Description" value={row.description}
                                    onChange={e => updateTravel(row.id, 'description', e.target.value)}
                                    className="h-9 text-sm" />
                                <Input placeholder="0" type="number" min="0" value={row.km}
                                    onChange={e => updateTravel(row.id, 'km', e.target.value)}
                                    className="h-9 text-sm text-right" />
                                <Input placeholder="0.50" type="number" min="0" step="0.01" value={row.rate_per_km}
                                    onChange={e => updateTravel(row.id, 'rate_per_km', e.target.value)}
                                    className="h-9 text-sm text-right" />
                                <RemoveBtn onClick={() => removeTravel(row.id)} disabled={travel.length === 1} />
                            </div>
                        ))}
                        <AddRowBtn onClick={addTravel} />
                    </div>
                </SectionCard>

                {/* Marge */}
                <div className="bg-white border border-border rounded-xl p-5">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-semibold text-text-primary whitespace-nowrap">
                            Marge bénéficiaire (%)
                        </label>
                        <div className="flex items-center gap-2 max-w-[160px]">
                            <Input
                                type="number" min="0" max="100" step="1" placeholder="0"
                                value={marge}
                                onChange={e => setMarge(e.target.value)}
                                className="h-9 text-sm text-right"
                            />
                            <span className="text-sm font-medium text-text-secondary">%</span>
                        </div>
                        {totals.sousTotal > 0 && n(marge) > 0 && (
                            <span className="text-sm text-text-muted">
                                = <span className="font-semibold text-text-primary">{eur(totals.margeAmount)}</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: sticky summary */}
            <div className="w-[300px] flex-shrink-0 sticky top-0">
                <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-brand" />
                        <h2 className="font-bold text-sm text-text-primary">Récapitulatif</h2>
                    </div>

                    <div className="space-y-2 text-sm">
                        <SummaryLine label="Coût matériaux HT"      value={totals.coutMaterials} />
                        <SummaryLine label="Coût main d'œuvre HT"   value={totals.coutLabor} />
                        <SummaryLine label="Coût déplacements HT"   value={totals.coutTravel} />
                        <div className="border-t border-border pt-2">
                            <SummaryLine label="Sous-total HT" value={totals.sousTotal} bold />
                        </div>
                        <SummaryLine
                            label={`Marge (${n(marge) > 0 ? `${n(marge)}%` : '0%'})`}
                            value={totals.margeAmount}
                            className="text-emerald-600"
                        />
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-text-secondary">Prix de vente HT</span>
                            <span className="text-xl font-extrabold text-brand">{eur(totals.prixHT)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-text-muted">Prix de vente TTC (20%)</span>
                            <span className="text-sm font-semibold text-text-secondary">{eur(totals.prixTTC)}</span>
                        </div>
                    </div>

                    <div className="pt-2 space-y-2">
                        <Button
                            className="w-full bg-brand text-white hover:bg-brand-hover text-sm h-9"
                            onClick={handleCreerDevis}
                            disabled={totals.prixHT === 0}
                        >
                            <FolderKanban className="h-4 w-4 mr-2" />
                            Créer un devis
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full text-sm h-9 border-border text-text-secondary"
                            onClick={handleExportCatalogue}
                            disabled={totals.prixHT === 0 || createProduct.isPending}
                        >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Exporter vers le catalogue
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
    return (
        <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm text-text-primary">{title}</h2>
                <span className="text-sm font-semibold text-brand">{subtitle}</span>
            </div>
            {children}
        </div>
    );
}

function ColHeader({ children, right }: { children: ReactNode; right?: boolean }) {
    return (
        <span className={`text-[11px] text-text-muted font-medium ${right ? 'text-right' : ''}`}>
            {children}
        </span>
    );
}

function RemoveBtn({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-text-muted hover:text-danger hover:bg-danger/10"
            onClick={onClick}
            disabled={disabled}
        >
            <Trash2 className="h-3.5 w-3.5" />
        </Button>
    );
}

function AddRowBtn({ onClick }: { onClick: () => void }) {
    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-brand hover:text-brand hover:bg-brand-light text-xs mt-1"
            onClick={onClick}
        >
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une ligne
        </Button>
    );
}

function SummaryLine({ label, value, bold, className }: {
    label: string; value: number; bold?: boolean; className?: string;
}) {
    return (
        <div className={`flex justify-between items-center ${className ?? ''}`}>
            <span className={bold ? 'font-semibold text-text-primary' : 'text-text-secondary'}>{label}</span>
            <span className={bold ? 'font-bold text-text-primary' : ''}>{eur(value)}</span>
        </div>
    );
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function eur(v: number): string {
    return v.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
}
