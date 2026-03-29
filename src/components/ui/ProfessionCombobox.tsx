/**
 * Reusable profession combobox — shows all professions grouped by category.
 * Used in ProfilePage and OnboardingPage.
 */

import { useState } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfessionTemplates, groupProfessionsByCategory } from '@/hooks/useProfessions';

interface ProfessionComboboxProps {
    value: string | null;         // profession_slug
    customValue: string;          // profession_custom
    onChange: (slug: string | null, custom: string) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
}

export function ProfessionCombobox({
    value,
    customValue,
    onChange,
    label = 'Métier principal',
    placeholder = 'Sélectionnez ou recherchez votre métier',
    required = false,
}: ProfessionComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const { data: professions } = useProfessionTemplates();
    const grouped = professions ? groupProfessionsByCategory(professions) : new Map();

    // Find current display label
    const currentLabel = value === 'autre'
        ? customValue || 'Autre'
        : professions?.find(p => p.slug === value)?.nom ?? null;

    // Filter professions based on search
    const filteredGroups = new Map<string, ProfessionTemplate[]>();
    if (professions) {
        for (const [cat, profs] of grouped.entries()) {
            const filtered = profs.filter((p: ProfessionTemplate) =>
                p.nom.toLowerCase().includes(search.toLowerCase()) ||
                cat.toLowerCase().includes(search.toLowerCase()),
            );
            if (filtered.length > 0) filteredGroups.set(cat, filtered);
        }
    }

    return (
        <div className="space-y-2">
            {label && (
                <Label className="text-sm font-semibold text-text-primary">
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="w-full flex items-center justify-between h-10 px-3 py-2 bg-surface2 border border-border rounded-md text-sm text-left hover:bg-surface-hover transition-colors"
                    >
                        <span className={currentLabel ? 'text-text' : 'text-text-muted'}>
                            {currentLabel ?? placeholder}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 text-text-muted shrink-0" />
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="p-0 bg-white border-border shadow-lg"
                    style={{ width: 'var(--radix-popover-trigger-width)' }}
                    align="start"
                >
                    {/* Search */}
                    <div className="p-2 border-b border-border">
                        <Input
                            placeholder="Rechercher un métier…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-8 bg-surface2 border-border text-sm"
                            autoFocus
                        />
                    </div>

                    {/* List */}
                    <div className="max-h-64 overflow-y-auto">
                        {Array.from(filteredGroups.entries()).map(([cat, profs]) => (
                            <div key={cat}>
                                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                                    {cat}
                                </p>
                                {profs.map(p => (
                                    <button
                                        key={p.slug}
                                        type="button"
                                        onClick={() => {
                                            onChange(p.slug, '');
                                            setSearch('');
                                            setOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface2 text-left transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            {p.icon && <span>{p.icon}</span>}
                                            <span className="text-text">{p.nom}</span>
                                        </span>
                                        {value === p.slug && (
                                            <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        ))}

                        {/* Autre — always shown at bottom */}
                        {(!search || 'autre'.includes(search.toLowerCase())) && (
                            <div className="border-t border-border/50">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange('autre', '');
                                        setSearch('');
                                        setOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface2 text-left transition-colors"
                                >
                                    <span className="text-text">Autre</span>
                                    {value === 'autre' && (
                                        <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                                    )}
                                </button>
                            </div>
                        )}

                        {filteredGroups.size === 0 && search && (
                            <p className="px-3 py-4 text-xs text-text-muted text-center">
                                Aucun résultat pour « {search} »
                            </p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Custom input when "Autre" selected */}
            {value === 'autre' && (
                <Input
                    placeholder="Précisez votre métier…"
                    value={customValue}
                    onChange={e => onChange('autre', e.target.value)}
                    className="bg-surface2 border-border mt-1.5"
                />
            )}
        </div>
    );
}
