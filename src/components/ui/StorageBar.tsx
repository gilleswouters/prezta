import { HardDrive, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import { formatBytes } from '@/lib/storage';

interface StorageBarProps {
    /** When true, renders a compact single-line variant for the sidebar */
    compact?: boolean;
}

export function StorageBar({ compact = false }: StorageBarProps) {
    const navigate = useNavigate();
    const { used, limit, percent, isAtLimit, isLoading } = useStorageUsage();

    if (isLoading) return null;

    const barColor =
        percent < 60 ? 'bg-emerald-500' :
        percent < 80 ? 'bg-amber-500' :
        'bg-red-500';

    if (compact) {
        return (
            <div className="space-y-1.5 px-4 py-3 border-t border-[var(--sidebar-border)]">
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <div className="flex items-center gap-1.5">
                        <HardDrive className="h-3 w-3" />
                        <span>Stockage</span>
                    </div>
                    <span className={percent >= 80 ? 'text-red-500 font-semibold' : ''}>
                        {percent}%
                    </span>
                </div>
                <div className="w-full bg-surface2 rounded-full h-1 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {isAtLimit && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold">Vous approchez de votre limite de stockage</p>
                        <p className="text-amber-700 text-xs mt-0.5">
                            {formatBytes(used)} utilisés sur {formatBytes(limit)}.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-amber-700 hover:bg-amber-100 hover:text-amber-900 shrink-0 font-semibold text-xs"
                        onClick={() => navigate('/pricing')}
                    >
                        Passer au Pro →
                    </Button>
                </div>
            )}

            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-text-muted">
                        <HardDrive className="h-4 w-4" />
                        <span className="font-medium">Stockage utilisé</span>
                    </div>
                    <span className={`font-semibold text-xs ${percent >= 80 ? 'text-red-600' : percent >= 60 ? 'text-amber-600' : 'text-text-secondary'}`}>
                        {formatBytes(used)} sur {formatBytes(limit)}
                    </span>
                </div>
                <div className="w-full bg-surface2 rounded-full h-2 overflow-hidden border border-border">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.max(percent, 1)}%` }}
                    />
                </div>
                <p className="text-xs text-text-muted">{percent}% utilisé</p>
            </div>
        </div>
    );
}
