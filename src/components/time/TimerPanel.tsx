import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Play, Square, Pause, RotateCcw, Plus, Clock, FolderOpen } from 'lucide-react';
import { useTimerStore } from '@/stores/timerStore';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTodayEntries, formatDuration, formatHours } from '@/hooks/useTimeEntries';
import { ManualTimeEntryModal } from './ManualTimeEntryModal';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
    open: boolean;
    onClose: () => void;
}

export function TimerPanel({ open, onClose }: Props) {
    const timer = useTimerStore();
    const { data: projects } = useProjects();
    const { data: tasks } = useTasks();
    const { data: todayEntries } = useTodayEntries();

    const [localProjectId, setLocalProjectId] = useState<string | null>(null);
    const [localTaskId, setLocalTaskId] = useState<string | null>(null);
    const [localDesc, setLocalDesc] = useState('');
    const [showManual, setShowManual] = useState(false);

    const filteredTasks = (tasks ?? []).filter(
        (t) => !localProjectId || t.project_id === localProjectId,
    );

    const activeProjectId = timer.isRunning || timer.isPaused ? timer.projectId : localProjectId;
    const activeProject = (projects ?? []).find((p) => p.id === activeProjectId);

    function handleStart() {
        timer.startTimer({
            projectId: localProjectId,
            taskId: localTaskId,
            description: localDesc,
        });
    }

    function handleStop() {
        timer.stopTimer();
        setLocalProjectId(null);
        setLocalTaskId(null);
        setLocalDesc('');
    }

    const isActive = timer.isRunning || timer.isPaused;

    return (
        <>
            <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
                <SheetContent className="w-[380px] sm:w-[420px] flex flex-col gap-0 p-0">
                    <SheetHeader className="px-6 py-4 border-b border-border">
                        <SheetTitle className="flex items-center gap-2 text-base">
                            <Clock className="h-4 w-4 text-brand" />
                            Chronomètre
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto">
                        {/* Timer display */}
                        <div className="px-6 py-6 border-b border-border">
                            <div className="text-center mb-6">
                                <span className="text-5xl font-mono font-bold text-text-primary tracking-tight">
                                    {formatDuration(timer.elapsedSeconds)}
                                </span>
                                {activeProject && (
                                    <p className="text-sm text-text-muted mt-2 flex items-center justify-center gap-1.5">
                                        <FolderOpen className="h-3.5 w-3.5" />
                                        {activeProject.name}
                                    </p>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex justify-center gap-3">
                                {!isActive ? (
                                    <Button
                                        className="bg-brand text-white hover:bg-brand/90 gap-2 px-6"
                                        onClick={handleStart}
                                    >
                                        <Play className="h-4 w-4" />
                                        Démarrer
                                    </Button>
                                ) : (
                                    <>
                                        {timer.isRunning ? (
                                            <Button
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => timer.pauseTimer()}
                                            >
                                                <Pause className="h-4 w-4" />
                                                Pause
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => timer.resumeTimer()}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Reprendre
                                            </Button>
                                        )}
                                        <Button
                                            variant="destructive"
                                            className="gap-2"
                                            onClick={handleStop}
                                        >
                                            <Square className="h-4 w-4" />
                                            Arrêter
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Configuration (disabled when timer is active) */}
                        <div className="px-6 py-4 space-y-3 border-b border-border">
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                Paramètres
                            </p>

                            {/* Project */}
                            <Select
                                value={isActive ? (timer.projectId ?? '__none__') : (localProjectId ?? '__none__')}
                                onValueChange={(v) => {
                                    if (!isActive) {
                                        setLocalProjectId(v === '__none__' ? null : v);
                                        setLocalTaskId(null);
                                    }
                                }}
                                disabled={isActive}
                            >
                                <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Projet (optionnel)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sans projet</SelectItem>
                                    {(projects ?? []).map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Task */}
                            {(filteredTasks.length > 0 || (isActive && timer.taskId)) && (
                                <Select
                                    value={isActive ? (timer.taskId ?? '__none__') : (localTaskId ?? '__none__')}
                                    onValueChange={(v) => {
                                        if (!isActive) setLocalTaskId(v === '__none__' ? null : v);
                                    }}
                                    disabled={isActive}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Tâche (optionnel)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Aucune tâche</SelectItem>
                                        {filteredTasks.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Description */}
                            <Input
                                placeholder="Description (optionnel)"
                                value={isActive ? timer.description : localDesc}
                                onChange={(e) => { if (!isActive) setLocalDesc(e.target.value); }}
                                disabled={isActive}
                                className="text-sm"
                            />
                        </div>

                        {/* Today's entries */}
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                    Aujourd'hui
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1.5 text-brand"
                                    onClick={() => setShowManual(true)}
                                >
                                    <Plus className="h-3 w-3" />
                                    Entrée manuelle
                                </Button>
                            </div>

                            {(!todayEntries || todayEntries.length === 0) ? (
                                <p className="text-sm text-text-muted text-center py-4">
                                    Aucune entrée aujourd'hui
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {todayEntries.map((e) => (
                                        <div
                                            key={e.id}
                                            className="flex items-center justify-between py-2 border-b border-border last:border-0"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">
                                                    {e.projects?.name ?? 'Sans projet'}
                                                </p>
                                                {e.description && (
                                                    <p className="text-xs text-text-muted truncate">{e.description}</p>
                                                )}
                                                <p className="text-xs text-text-muted">
                                                    {format(parseISO(e.started_at), 'HH:mm', { locale: fr })}
                                                    {e.ended_at && ` – ${format(parseISO(e.ended_at), 'HH:mm', { locale: fr })}`}
                                                </p>
                                            </div>
                                            <span className="text-sm font-mono font-semibold text-text-primary shrink-0 ml-3">
                                                {e.duration_seconds !== null ? formatHours(e.duration_seconds) : '–'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <ManualTimeEntryModal
                open={showManual}
                onClose={() => setShowManual(false)}
                defaultProjectId={localProjectId}
            />
        </>
    );
}
