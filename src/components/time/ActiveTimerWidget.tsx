import { useState, useEffect } from 'react';
import { Square, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimerStore } from '@/stores/timerStore';
import { TimerPanel } from './TimerPanel';
import { formatDuration } from '@/hooks/useTimeEntries';
import { useProjects } from '@/hooks/useProjects';

export function ActiveTimerWidget() {
    const timer = useTimerStore();
    const { data: projects } = useProjects();
    const [panelOpen, setPanelOpen] = useState(false);

    // Initialize timer on mount — restores any running entry from Supabase
    useEffect(() => {
        timer.initialize();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const isVisible = timer.isRunning || timer.isPaused;
    if (!isVisible) {
        return (
            <>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-text-muted hover:text-text-primary"
                    onClick={() => setPanelOpen(true)}
                    aria-label="Chronomètre"
                >
                    <Timer className="h-4 w-4" />
                </Button>
                <TimerPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
            </>
        );
    }

    const project = projects?.find((p) => p.id === timer.projectId);

    return (
        <>
            {/* Active timer pill — click to open panel */}
            <button
                onClick={() => setPanelOpen(true)}
                className={`flex items-center gap-2 px-3 h-9 rounded-lg border text-sm font-medium transition-colors
                    ${timer.isPaused
                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'border-brand/30 bg-brand-light text-brand hover:bg-brand-light/80'
                    }`}
                aria-label="Chronomètre actif"
            >
                <span className={`h-2 w-2 rounded-full shrink-0 ${timer.isPaused ? 'bg-amber-400' : 'bg-brand animate-pulse'}`} />
                <span className="font-mono font-bold tracking-tight">
                    {formatDuration(timer.elapsedSeconds)}
                </span>
                {project && (
                    <span className="max-w-[120px] truncate hidden sm:block">
                        · {project.name}
                    </span>
                )}
            </button>

            {/* Quick stop button */}
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-text-muted hover:text-danger hover:bg-danger-light"
                onClick={() => timer.stopTimer()}
                aria-label="Arrêter le chronomètre"
                title="Arrêter"
            >
                <Square className="h-4 w-4" />
            </Button>

            <TimerPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
        </>
    );
}
