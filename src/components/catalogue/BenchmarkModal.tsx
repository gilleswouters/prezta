import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingDown, CheckCircle2, TrendingUp, AlertCircle, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/product';
import { useProfile } from '@/hooks/useProfile';

// ─── Types ────────────────────────────────────────────────────────────────────

type Verdict = 'sous_marche' | 'dans_la_norme' | 'premium';
type Confidence = 'faible' | 'moyenne' | 'élevée';

interface BenchmarkResult {
    verdict: Verdict;
    marketMin: number;
    marketMax: number;
    marketMedian: number;
    advice: string;
    confidence: Confidence;
}

// ─── Verdict config ────────────────────────────────────────────────────────────

const VERDICT_CONFIG: Record<
    Verdict,
    { label: string; icon: React.ReactNode; badgeCls: string }
> = {
    sous_marche: {
        label: 'Vous êtes sous le marché',
        icon: <TrendingDown className="h-4 w-4" />,
        badgeCls: 'bg-red-50 text-red-700 border-red-200',
    },
    dans_la_norme: {
        label: 'Vous êtes dans la norme',
        icon: <CheckCircle2 className="h-4 w-4" />,
        badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    premium: {
        label: 'Vous êtes en tarif premium',
        icon: <TrendingUp className="h-4 w-4" />,
        badgeCls: 'bg-brand-light text-brand border-brand/20',
    },
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
    faible: 'Données estimatives',
    moyenne: 'Données moyennes',
    'élevée': 'Données fiables',
};

// ─── Range bar ────────────────────────────────────────────────────────────────

function RangeBar({
    min,
    max,
    median,
    userPrice,
    unit,
}: {
    min: number;
    max: number;
    median: number;
    userPrice: number;
    unit: string;
}) {
    const span = max - min || 1;
    const clamp = (v: number) => Math.max(0, Math.min(100, ((v - min) / span) * 100));

    const medianPct = clamp(median);
    const userPct   = clamp(userPrice);

    const formatK = (v: number) =>
        v >= 1000
            ? `${Math.round(v / 100) / 10}k`
            : `${v}`;

    return (
        <div className="space-y-2">
            <div className="relative h-3 bg-gray-100 rounded-full overflow-visible">
                {/* Market range fill */}
                <div
                    className="absolute top-0 h-full rounded-full bg-gray-200"
                    style={{ left: '0%', width: '100%' }}
                />
                {/* Median marker */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-5 w-0.5 bg-text-muted rounded-full"
                    style={{ left: `${medianPct}%` }}
                    title={`Médiane : ${median} € / ${unit}`}
                />
                {/* User price marker */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-full bg-brand shadow-sm"
                    style={{ left: `${userPct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                    title={`Votre tarif : ${userPrice} € / ${unit}`}
                />
            </div>
            <div className="flex justify-between text-xs text-text-muted">
                <span>{formatK(min)} €</span>
                <span className="text-text-secondary font-medium">
                    Médiane : {median} € / {unit}
                </span>
                <span>{formatK(max)} €</span>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-text-muted pt-1">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-1.5 rounded-full bg-brand" />
                    Votre tarif ({userPrice} €)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-4 w-0.5 bg-text-muted rounded-full" />
                    Médiane marché
                </span>
            </div>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BenchmarkModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    onEditProduct: (product: Product) => void;
}

export function BenchmarkModal({
    open,
    onOpenChange,
    product,
    onEditProduct,
}: BenchmarkModalProps) {
    const { data: profile } = useProfile();
    const [result, setResult]   = useState<BenchmarkResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    const userMetier =
        profile?.company_name ?? profile?.legal_status ?? 'freelance';

    const runBenchmark = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const { data, error: fnError } = await supabase.functions.invoke<BenchmarkResult>(
                'benchmark-rate',
                {
                    body: {
                        productName: product.name,
                        unit: product.unit,
                        priceHT: product.unit_price,
                        userMetier,
                    },
                },
            );
            if (fnError) throw new Error(fnError.message);
            if (!data) throw new Error('Réponse vide');
            setResult(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    // Reset state when modal opens with a new product
    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setResult(null);
            setError(null);
        }
        onOpenChange(val);
    };

    const verdict = result ? VERDICT_CONFIG[result.verdict] : null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md bg-white border-border">
                <DialogHeader>
                    <DialogTitle className="text-text-primary">
                        Benchmark marché
                    </DialogTitle>
                    <DialogDescription className="text-text-muted">
                        Comparez votre tarif au marché français 2026.
                    </DialogDescription>
                </DialogHeader>

                {/* Product info */}
                <div className="rounded-lg border border-border bg-surface px-4 py-3 space-y-0.5">
                    <p className="font-semibold text-text-primary">{product.name}</p>
                    <p className="text-sm text-text-muted">
                        <span className="font-mono font-bold text-text-primary">{product.unit_price} €</span>
                        {' '}HT / {product.unit}
                    </p>
                </div>

                {/* CTA or results */}
                {!result && !loading && !error && (
                    <div className="py-2 text-center">
                        <p className="text-sm text-text-muted mb-4">
                            L'IA analyse votre tarif et le compare au marché français.
                        </p>
                        <Button
                            className="bg-brand text-white hover:bg-brand-hover"
                            onClick={runBenchmark}
                        >
                            Lancer l'analyse
                        </Button>
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center gap-3 py-8 text-text-muted">
                        <Loader2 className="h-8 w-8 animate-spin text-brand" />
                        <p className="text-sm">Analyse en cours…</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-red-800">
                            <p className="font-medium mb-1">Analyse impossible</p>
                            <p className="text-xs">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 h-7 text-xs border-red-300 text-red-700 hover:bg-red-100"
                                onClick={runBenchmark}
                            >
                                Réessayer
                            </Button>
                        </div>
                    </div>
                )}

                {result && verdict && (
                    <div className="space-y-4">
                        {/* Verdict badge */}
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border font-semibold text-sm ${verdict.badgeCls}`}>
                            {verdict.icon}
                            {verdict.label}
                        </div>

                        {/* Range bar */}
                        <RangeBar
                            min={result.marketMin}
                            max={result.marketMax}
                            median={result.marketMedian}
                            userPrice={product.unit_price}
                            unit={product.unit}
                        />

                        {/* Advice */}
                        <p className="text-sm text-text-secondary italic leading-relaxed">
                            "{result.advice}"
                        </p>

                        {/* Confidence */}
                        <p className="text-xs text-text-muted">
                            Données : {CONFIDENCE_LABEL[result.confidence]}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-border text-text-secondary"
                                onClick={() => { handleOpenChange(false); onEditProduct(product); }}
                            >
                                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                Mettre à jour mon tarif
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-text-muted"
                                onClick={() => handleOpenChange(false)}
                            >
                                Fermer
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
