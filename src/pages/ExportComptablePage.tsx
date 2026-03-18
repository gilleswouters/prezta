import { useState } from 'react';
import { Download, Loader2, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const MONTHS = [
    { value: '1',  label: 'Janvier' },  { value: '2',  label: 'Février' },
    { value: '3',  label: 'Mars' },     { value: '4',  label: 'Avril' },
    { value: '5',  label: 'Mai' },      { value: '6',  label: 'Juin' },
    { value: '7',  label: 'Juillet' },  { value: '8',  label: 'Août' },
    { value: '9',  label: 'Septembre' }, { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' },
];

type DocType = 'factures' | 'devis' | 'contrats' | 'registre';

const DOC_TYPES: { value: DocType; label: string; desc: string }[] = [
    { value: 'factures', label: 'Factures',      desc: 'Toutes les factures de la période' },
    { value: 'devis',    label: 'Devis signés',  desc: 'Devis avec statut "signé"' },
    { value: 'contrats', label: 'Contrats',       desc: 'Contrats de prestation' },
    { value: 'registre', label: 'Registre CSV',  desc: 'Export CSV pour votre comptable' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExportComptablePage() {
    const [year,      setYear]      = useState(CURRENT_YEAR);
    const [month,     setMonth]     = useState('all');
    const [types,     setTypes]     = useState<Record<DocType, boolean>>({
        factures: true,
        devis:    true,
        contrats: true,
        registre: true,
    });
    const [isLoading, setIsLoading] = useState(false);

    const selectedTypes = (Object.keys(types) as DocType[]).filter(k => types[k]);

    function toggle(t: DocType) {
        setTypes(prev => ({ ...prev, [t]: !prev[t] }));
    }

    async function handleExport() {
        if (selectedTypes.length === 0) {
            toast.warning('Sélectionnez au moins un type de document.');
            return;
        }

        setIsLoading(true);
        try {
            const invokeBody: { year: number; month?: number; types: string[] } = {
                year,
                types: selectedTypes,
            };
            if (month !== 'all') invokeBody.month = parseInt(month, 10);

            const { data, error } = await supabase.functions.invoke('export-comptable', {
                body: invokeBody,
            });

            if (error) throw new Error(error.message ?? 'Échec de la génération');

            const blob     = new Blob([data as ArrayBuffer], { type: 'application/zip' });
            const suffix   = month !== 'all' ? `-${month.padStart(2, '0')}` : '';
            const filename = `Prezta-Export-Comptable-${year}${suffix}.zip`;

            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            toast.success('Export généré et téléchargé.');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'export');
        } finally {
            setIsLoading(false);
        }
    }

    const previewName = `Prezta-Export-Comptable-${year}${month !== 'all' ? `-${month.padStart(2, '0')}` : ''}.zip`;

    return (
        <div className="max-w-xl space-y-6">

            <div className="bg-white border border-border rounded-xl p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-2">
                    <FileArchive className="h-5 w-5 text-brand" />
                    <h2 className="font-bold text-base text-text-primary">Paramètres de l'export</h2>
                </div>

                {/* Period selector */}
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-text-primary">Période</p>
                    <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-text-muted">Année</Label>
                            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {YEARS.map(y => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-text-muted">Mois (optionnel)</Label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les mois</SelectItem>
                                    {MONTHS.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Document types */}
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-text-primary">Types de documents</p>
                    <div className="grid grid-cols-2 gap-3">
                        {DOC_TYPES.map(dt => (
                            <label
                                key={dt.value}
                                className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-border p-3 hover:bg-surface-hover transition-colors"
                            >
                                <Checkbox
                                    checked={types[dt.value]}
                                    onCheckedChange={() => toggle(dt.value)}
                                    className="mt-0.5 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                                />
                                <div>
                                    <p className="text-sm font-medium text-text-primary">{dt.label}</p>
                                    <p className="text-xs text-text-muted mt-0.5">{dt.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* ZIP preview */}
                <div className="bg-surface rounded-lg p-4 border border-border space-y-1.5">
                    <p className="text-xs font-mono font-semibold text-text-secondary">
                        📦 {previewName}
                    </p>
                    <div className="space-y-0.5 pl-4">
                        {types.registre  && <p className="text-xs font-mono text-text-muted">└─ Registre.csv</p>}
                        {types.factures  && <p className="text-xs font-mono text-text-muted">└─ Factures/</p>}
                        {types.devis     && <p className="text-xs font-mono text-text-muted">└─ Devis_signes/</p>}
                        {types.contrats  && <p className="text-xs font-mono text-text-muted">└─ Contrats/</p>}
                        {selectedTypes.length === 0 && (
                            <p className="text-xs text-text-muted italic">Aucun type sélectionné</p>
                        )}
                    </div>
                </div>

                {/* CTA */}
                <Button
                    className="w-full bg-brand text-white hover:bg-brand-hover h-10 font-semibold"
                    onClick={handleExport}
                    disabled={isLoading || selectedTypes.length === 0}
                >
                    {isLoading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération en cours…</>
                    ) : (
                        <><Download className="h-4 w-4 mr-2" /> Générer l'export</>
                    )}
                </Button>
            </div>

            <p className="text-xs text-text-muted text-center px-2">
                L'export inclut le registre CSV et les fiches récapitulatives de chaque document.
                Pour les PDFs complets, téléchargez chaque document depuis la fiche projet.
            </p>
        </div>
    );
}
