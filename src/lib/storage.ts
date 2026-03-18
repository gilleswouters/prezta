import { supabase } from '@/lib/supabase';

export const FREE_LIMIT = 1_073_741_824;   // 1 GB in bytes
export const PRO_LIMIT  = 10_737_418_240;  // 10 GB in bytes

export interface StorageUsage {
    used: number;
    limit: number;
    percent: number;
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

/**
 * Sums file sizes in known Supabase Storage buckets for the given user.
 * Currently only the 'public' bucket (logos/) is used.
 */
export async function getStorageUsage(
    userId: string,
    isPro: boolean,
): Promise<StorageUsage> {
    const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

    let used = 0;

    // List files in 'public' bucket under logos/ — names start with userId
    const { data: files } = await supabase.storage
        .from('public')
        .list('logos', { limit: 1000, offset: 0 });

    if (files) {
        const userFiles = files.filter(f => f.name.startsWith(userId));
        used = userFiles.reduce((sum, f) => sum + ((f.metadata as { size?: number } | null)?.size ?? 0), 0);
    }

    return {
        used,
        limit,
        percent: Math.min(100, Math.round((used / limit) * 100)),
    };
}
