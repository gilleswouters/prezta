import { useProjects, useDeleteProject } from '@/hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { ProjectStatus } from '@/types/project';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, Loader2, Pencil, Trash2, FolderPlus, CheckCircle2, Clock, FileText } from 'lucide-react';

export default function ProjectsPage() {
    const { data: projects, isLoading } = useProjects();
    const deleteProject = useDeleteProject();
    const navigate = useNavigate();

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Supprimer le projet "${name}" ? (Action irréversible)`)) {
            await deleteProject.mutateAsync(id);
        }
    };

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case ProjectStatus.COMPLETED: return <CheckCircle2 className="h-4 w-4 text-p1" />;
            case ProjectStatus.IN_PROGRESS: return <Clock className="h-4 w-4 text-p2" />;
            default: return <FileText className="h-4 w-4 text-muted" />;
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case ProjectStatus.COMPLETED: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-p1/10 text-p1 border border-p1/20">Terminé</span>;
            case ProjectStatus.IN_PROGRESS: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-p2/10 text-p2 border border-p2/20">En cours</span>;
            case ProjectStatus.CANCELLED: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-400/10 text-red-400 border border-red-400/20">Annulé</span>;
            default: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-surface2 text-muted border border-border">Brouillon</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted" />
            </div>
        );
    }

    const isEmpty = projects?.length === 0;

    return (
        <div className="space-y-6">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-text w-full max-w-sm">Projets</h1>
                    <p className="text-muted mt-1">Suivez l'avancement de vos missions.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate('/projets/nouveau')} className="bg-p3 text-bg hover:opacity-90">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Projet
                    </Button>
                </div>
            </div>

            {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-border rounded-lg bg-surface">
                    <div className="bg-surface2 p-4 rounded-full mb-4 ring-1 ring-border shadow-sm">
                        <FolderPlus className="h-10 w-10 text-muted" />
                    </div>
                    <h2 className="text-xl font-serif text-text mb-2">Aucun projet en cours</h2>
                    <p className="text-muted max-w-md mb-8">
                        Créez votre premier projet via le Wizard pour structurer une mission client, de sa conception à sa facturation.
                    </p>
                    <Button onClick={() => navigate('/projets/nouveau')} className="bg-p3 text-bg hover:opacity-90 h-12">
                        <Plus className="mr-2 h-5 w-5" />
                        Démarrer un projet
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border border-border bg-surface overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="text-muted">Nom du projet</TableHead>
                                <TableHead className="text-muted hidden md:table-cell">Client</TableHead>
                                <TableHead className="text-muted">Statut</TableHead>
                                <TableHead className="text-muted hidden sm:table-cell">Documents</TableHead>
                                <TableHead className="text-right text-muted">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects?.map((project) => {
                                const docsCount = project.expected_documents?.length || 0;
                                const docsCompleted = project.expected_documents?.filter(d => d.is_completed).length || 0;

                                return (
                                    <TableRow key={project.id} className="border-border hover:bg-surface2/50 transition-colors">
                                        <TableCell>
                                            <StatusIcon status={project.status} />
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-text truncate max-w-[200px] sm:max-w-[300px]" title={project.name}>{project.name}</p>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted">
                                            {project.clients?.name || <span className="italic opacity-50">Inconnu</span>}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={project.status} />
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-muted text-sm">
                                            {docsCount > 0 ? (
                                                <span className={docsCompleted === docsCount ? "text-p1" : ""}>
                                                    {docsCompleted} / {docsCount}
                                                </span>
                                            ) : (
                                                <span className="opacity-50">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted hover:text-text">
                                                        <span className="sr-only">Ouvrir le menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-surface2 border-border text-text">
                                                    <DropdownMenuItem onClick={() => { }} className="hover:bg-surface cursor-pointer focus:bg-surface">
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        <span>Ouvrir</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(project.id, project.name)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer focus:bg-red-400/10">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Supprimer</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

        </div>
    );
}
