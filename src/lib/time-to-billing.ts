import { v4 as uuidv4 } from 'uuid';
import type { TimeEntry } from '@/types/time';
import type { QuoteLine } from '@/types/quote';
import type { Product } from '@/types/product';

export interface TimeEntryGroup {
    projectId: string | null;
    projectName: string;
    entries: TimeEntry[];
    totalSeconds: number;
}

export function groupEntriesByProject(entries: TimeEntry[]): TimeEntryGroup[] {
    const map = new Map<string, TimeEntryGroup>();

    for (const entry of entries) {
        const key = entry.project_id ?? '__none__';
        if (!map.has(key)) {
            map.set(key, {
                projectId: entry.project_id,
                projectName: entry.projects?.name ?? 'Sans projet',
                entries: [],
                totalSeconds: 0,
            });
        }
        const group = map.get(key)!;
        group.entries.push(entry);
        group.totalSeconds += entry.duration_seconds ?? 0;
    }

    return Array.from(map.values());
}

export function buildQuoteLines(entries: TimeEntry[], products: Product[]): QuoteLine[] {
    const groups = groupEntriesByProject(entries);
    const hourlyProduct = products.find((p) => p.unit === 'heure');

    return groups.map((group) => {
        const hours = parseFloat((group.totalSeconds / 3600).toFixed(2));

        const descriptions = group.entries
            .filter((e) => e.description)
            .map((e) => e.description!)
            .join(', ');
        const truncated = descriptions.length > 80 ? descriptions.slice(0, 77) + '...' : descriptions;

        return {
            id: uuidv4(),
            name: group.projectName,
            description: truncated || undefined,
            quantity: hours,
            unitPrice: hourlyProduct?.unit_price ?? 0,
            tvaRate: hourlyProduct?.tva_rate ?? 20,
            unit: 'heure' as const,
        };
    });
}
