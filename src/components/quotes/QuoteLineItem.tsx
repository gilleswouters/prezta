import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { QuoteLine } from '@/types/quote';
import type { Unit } from '@/types/product';

interface QuoteLineItemProps {
    line: QuoteLine;
    updateLine: (id: string, updates: Partial<QuoteLine>) => void;
    removeLine: (id: string) => void;
}

const KNOWN_TVA_RATES = ['20', '10', '5.5', '2.1', '0', '-1'];

function getTvaSelectValue(tvaRate: number): string {
    const key = tvaRate.toString();
    return KNOWN_TVA_RATES.includes(key) ? key : 'autre';
}

export function QuoteLineItem({ line, updateLine, removeLine }: QuoteLineItemProps) {
    const lineTotal = line.quantity * line.unitPrice;
    const isCustomUnit = line.unit === 'autre';
    const tvaSelectValue = getTvaSelectValue(line.tvaRate);
    const isCustomTva = tvaSelectValue === 'autre';

    return (
        <div className="grid grid-cols-12 gap-4 items-start p-4 bg-white border border-border rounded-lg shadow-sm hover:border-brand-border transition-colors group">
            {/* Col 1: Details */}
            <div className="col-span-12 md:col-span-5 space-y-3">
                <Input
                    placeholder="Titre de la prestation"
                    className="font-semibold text-text-primary h-9"
                    value={line.name}
                    onChange={(e) => updateLine(line.id, { name: e.target.value })}
                />
                <Input
                    placeholder="Description détaillée (optionnelle)"
                    className="text-sm text-text-secondary h-8"
                    value={line.description || ''}
                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                />
            </div>

            {/* Col 2: Qté & Unité */}
            <div className="col-span-6 md:col-span-2 space-y-3">
                <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="h-9"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.id, { quantity: parseFloat(e.target.value) || 0 })}
                />
                <Select
                    value={line.unit}
                    onValueChange={(val: Unit) => updateLine(line.id, { unit: val })}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="forfait">Forfait</SelectItem>
                        <SelectItem value="heure">À l'heure (/h)</SelectItem>
                        <SelectItem value="jour">À la journée (/jour)</SelectItem>
                        <SelectItem value="demi-jour">Demi-journée</SelectItem>
                        <SelectItem value="unite">À l'unité</SelectItem>
                        <SelectItem value="m2">Au m²</SelectItem>
                        <SelectItem value="km">Au km</SelectItem>
                        <SelectItem value="mot">Au mot</SelectItem>
                        <SelectItem value="page">À la page</SelectItem>
                        <SelectItem value="pièce">Pièce(s)</SelectItem>
                        <SelectItem value="autre">Personnalisé</SelectItem>
                    </SelectContent>
                </Select>
                {isCustomUnit && (
                    <Input
                        placeholder="Unité personnalisée"
                        className="h-8 text-xs"
                        value={line.unite_custom || ''}
                        onChange={(e) => updateLine(line.id, { unite_custom: e.target.value })}
                    />
                )}
            </div>

            {/* Col 3: Prix unitaire & TVA */}
            <div className="col-span-6 md:col-span-3 space-y-3">
                <div className="relative">
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        className="h-9 pl-7"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">€</span>
                </div>
                <Select
                    value={tvaSelectValue}
                    onValueChange={(val) => {
                        if (val !== 'autre') {
                            updateLine(line.id, { tvaRate: parseFloat(val) });
                        }
                    }}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="20">20% — Taux normal</SelectItem>
                        <SelectItem value="10">10% — Taux intermédiaire</SelectItem>
                        <SelectItem value="5.5">5.5% — Taux réduit</SelectItem>
                        <SelectItem value="2.1">2.1% — Taux particulier</SelectItem>
                        <SelectItem value="0">0% — Auto-entrepreneur (art. 293B)</SelectItem>
                        <SelectItem value="-1">Exonéré de TVA</SelectItem>
                        <SelectItem value="autre">Autre taux...</SelectItem>
                    </SelectContent>
                </Select>
                {isCustomTva && (
                    <div className="relative">
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="Taux (%)"
                            className="h-8 text-xs pr-6"
                            value={isCustomTva ? line.tvaRate : ''}
                            onChange={(e) => updateLine(line.id, { tvaRate: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-xs">%</span>
                    </div>
                )}
                {line.tvaRate === 0 && (
                    <p className="text-[10px] text-text-muted italic leading-tight">
                        TVA non applicable, art. 293B du CGI
                    </p>
                )}
            </div>

            {/* Col 4: Total & Action */}
            <div className="col-span-12 md:col-span-2 flex items-start justify-end gap-4 h-9 pt-1">
                <div className="flex flex-col items-end">
                    <span className="font-bold text-text-primary text-base">{lineTotal.toFixed(2)} €</span>
                    <span className="text-[10px] text-text-muted uppercase">HT</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-text-muted hover:text-danger hover:bg-danger-light opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    onClick={() => removeLine(line.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
