import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { QuoteLine } from '@/types/quote';

interface QuoteLineItemProps {
    line: QuoteLine;
    updateLine: (id: string, updates: Partial<QuoteLine>) => void;
    removeLine: (id: string) => void;
}

export function QuoteLineItem({ line, updateLine, removeLine }: QuoteLineItemProps) {
    const lineTotal = line.quantity * line.unitPrice;

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

            {/* Col 2: Qte & Unite */}
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
                    onValueChange={(val: any) => updateLine(line.id, { unit: val })}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="heure">Heure(s)</SelectItem>
                        <SelectItem value="jour">Jour(s)</SelectItem>
                        <SelectItem value="forfait">Forfait</SelectItem>
                        <SelectItem value="pièce">Pièce(s)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Col 3: Prix unitaire & TVA */}
            <div className="col-span-6 md:col-span-2 space-y-3">
                <div className="relative">
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        className="h-9 pl-7"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-text-muted text-sm">€</span>
                </div>
                <Select
                    value={line.tvaRate.toString()}
                    onValueChange={(val) => updateLine(line.id, { tvaRate: parseFloat(val) })}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="21">TVA 21%</SelectItem>
                        <SelectItem value="20">TVA 20%</SelectItem>
                        <SelectItem value="10">TVA 10%</SelectItem>
                        <SelectItem value="6">TVA 6%</SelectItem>
                        <SelectItem value="5.5">TVA 5.5%</SelectItem>
                        <SelectItem value="0">TVA 0%</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Col 4: Total & Action */}
            <div className="col-span-12 md:col-span-3 flex items-start justify-end gap-4 h-9 pt-1">
                <div className="flex flex-col items-end">
                    <span className="font-bold text-text-primary text-base">{lineTotal.toFixed(2)} €</span>
                    <span className="text-[10px] text-text-text-muted uppercase">HTVA</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-text-text-muted hover:text-danger hover:bg-danger-light opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    onClick={() => removeLine(line.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
