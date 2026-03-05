import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { ProjectWithClient } from '@/types/project';
import { ProjectKanban } from './ProjectKanban';
import { FolderKanban } from 'lucide-react';

interface ProjectTasksModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: ProjectWithClient | null;
}

export function ProjectTasksModal({ open, onOpenChange, project }: ProjectTasksModalProps) {
    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] bg-surface flex flex-col p-0 overflow-hidden rounded-2xl sm:rounded-2xl">
                <div className="px-6 py-4 border-b border-border bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                    <div>
                        <DialogTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <FolderKanban className="h-5 w-5 text-[var(--brand)]" /> Pipeline des Tâches
                        </DialogTitle>
                        <DialogDescription className="text-text-muted text-sm mt-1">
                            {project.name} ({project.clients?.name || 'Sans client'})
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-hidden bg-gray-50/30">
                    <ProjectKanban projectId={project.id} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
