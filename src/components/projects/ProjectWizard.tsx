import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

import { useProjectWizardStore } from '@/stores/useProjectWizardStore';
import { projectStep1Schema, projectStep2Schema } from '@/lib/validations/project';
import { useClients } from '@/hooks/useClients';
import { useCreateProject } from '@/hooks/useProjects';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import type { ProjectDocument, ProjectFormData } from '@/types/project';
import { ProjectStatus } from '@/types/project';
import { supabase } from '@/lib/supabase';
import { ClientModal } from '@/components/ClientModal';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowRight, ArrowLeft, Check, Sparkles, Plus, Trash2, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';

function extractCity(address: string | null): string | null {
    if (!address) return null;
    const parts = address.split(',').map(p => p.trim()).filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1] : null;
}

export default function ProjectWizard() {
    const { currentStep, projectData, setStep, updateData, reset } = useProjectWizardStore();
    const { data: clients, isLoading: clientsLoading } = useClients();
    const createProject = useCreateProject();
    const { canCreateProject } = usePlanLimits();
    const navigate = useNavigate();

    const [isGeneratingAi, setIsGeneratingAi] = useState(false);

    // Step 1 Form
    const form1 = useForm({
        resolver: zodResolver(projectStep1Schema),
        defaultValues: {
            name: projectData.name || '',
            client_id: projectData.client_id || '',
        }
    });

    // Step 2 Form
    const form2 = useForm({
        resolver: zodResolver(projectStep2Schema),
        defaultValues: {
            description: projectData.description || '',
            start_date: projectData.start_date || '',
            end_date: projectData.end_date || '',
        }
    });

    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [comboOpen, setComboOpen] = useState(false);
    const [comboSearch, setComboSearch] = useState('');

    // Step 3 Local State (bypassing full react-hook-form for dynamic array simplicity here)
    const [documents, setDocuments] = useState<ProjectDocument[]>(projectData.expected_documents || []);
    const [newDocName, setNewDocName] = useState('');

    const handleNextStep1 = (data: any) => {
        updateData(data);
        setStep(2);
    };

    const handleNextStep2 = (data: any) => {
        updateData(data);
        setStep(3);
    };

    const handleAddManualDoc = () => {
        if (!newDocName.trim()) return;
        setDocuments([...documents, { id: uuidv4(), name: newDocName.trim(), is_completed: false }]);
        setNewDocName('');
    };

    const handleRemoveDoc = (id: string) => {
        setDocuments(documents.filter(d => d.id !== id));
    };

    const handleSuggestDocs = async () => {
        if (!projectData.name && !projectData.description) {
            toast.error("Veuillez remplir le nom et la description du brief d'abord.");
            return;
        }

        setIsGeneratingAi(true);

        try {
            const { data, error } = await supabase.functions.invoke<{ suggestions: Array<{ name: string }> }>(
                'suggest-project-documents',
                { body: { projectName: projectData.name ?? '', description: projectData.description ?? '' } }
            );

            if (error || !data?.suggestions) throw error ?? new Error('Invalid response');

            const aiDocs: ProjectDocument[] = data.suggestions.map(item => ({
                id: uuidv4(),
                name: item.name,
                is_completed: false,
            }));

            setDocuments(prev => [...prev, ...aiDocs]);
            toast.success("Documents suggérés ajoutés !");
        } catch (error) {
            console.error(error);
            toast.error("La génération a échoué.");
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handleFinalSubmit = async () => {
        try {
            const finalClientId = projectData.client_id && projectData.client_id !== "empty" ? projectData.client_id : null;

            const payload: ProjectFormData = {
                name: projectData.name!,
                client_id: finalClientId,
                description: projectData.description || null,
                status: ProjectStatus.DRAFT,
                expected_documents: documents,
                start_date: projectData.start_date || null,
                end_date: projectData.end_date || null,
            };

            await createProject.mutateAsync(payload);
            reset();
            navigate('/projets');
        } catch (error) {
            // handled by mutation global error logs
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">

            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-serif text-text">Nouveau Projet</h1>
                <div className="flex gap-2">
                    {[1, 2, 3].map(step => (
                        <div key={step} className={`h-2 w-16 rounded-full transition-colors ${currentStep >= step ? 'bg-p3' : 'bg-surface2 border border-border'}`} />
                    ))}
                </div>
            </div>

            <Card className="bg-surface text-text border-border">
                {currentStep === 1 && (
                    <Form {...form1}>
                        <form onSubmit={form1.handleSubmit(handleNextStep1)}>
                            <CardHeader>
                                <CardTitle>Étape 1 : Informations générales</CardTitle>
                                <CardDescription>Sélectionnez le client et nommez ce nouvel espace de travail.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form1.control} name="client_id" render={({ field }) => (
                                    <div className="space-y-2">
                                        <FormLabel>Client associé *</FormLabel>
                                        <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full flex items-center justify-between h-10 px-3 py-2 bg-surface2 border border-border rounded-md text-sm text-left hover:bg-surface-hover transition-colors disabled:opacity-50"
                                                    disabled={clientsLoading}
                                                >
                                                    <span className={field.value && clients?.find(c => c.id === field.value) ? 'text-text' : 'text-text-muted'}>
                                                        {field.value && clients?.find(c => c.id === field.value)
                                                            ? clients!.find(c => c.id === field.value)!.name
                                                            : clientsLoading ? 'Chargement...' : 'Sélectionner un client'}
                                                    </span>
                                                    <ChevronsUpDown className="h-4 w-4 text-text-muted shrink-0" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0 bg-white border-border shadow-lg" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                                                <div className="p-2 border-b border-border">
                                                    <Input
                                                        placeholder="Rechercher un client..."
                                                        value={comboSearch}
                                                        onChange={(e) => setComboSearch(e.target.value)}
                                                        className="h-8 bg-surface2 border-border text-sm"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-52 overflow-y-auto">
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-brand font-medium hover:bg-brand-light/20 cursor-pointer text-left border-b border-border/50"
                                                        onClick={() => { setComboOpen(false); setIsClientModalOpen(true); }}
                                                    >
                                                        <Plus className="h-4 w-4 shrink-0" />
                                                        Créer un nouveau client
                                                    </button>
                                                    {clients?.filter(c => c.name.toLowerCase().includes(comboSearch.toLowerCase())).map(c => {
                                                        const city = extractCity(c.address);
                                                        return (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-surface2 cursor-pointer text-left"
                                                                onClick={() => { field.onChange(c.id); setComboOpen(false); setComboSearch(''); }}
                                                            >
                                                                <span className="text-text">{c.name}</span>
                                                                {city && <span className="text-xs text-text-muted ml-2 shrink-0">{city}</span>}
                                                            </button>
                                                        );
                                                    })}
                                                    {clients?.filter(c => c.name.toLowerCase().includes(comboSearch.toLowerCase())).length === 0 && comboSearch && (
                                                        <p className="px-3 py-4 text-xs text-text-muted text-center">Aucun résultat</p>
                                                    )}
                                                    {clients?.length === 0 && !comboSearch && (
                                                        <p className="px-3 py-4 text-xs text-text-muted text-center">Aucun client trouvé</p>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </div>
                                )} />

                                <FormField control={form1.control} name="name" render={({ field }) => (
                                    <div className="space-y-2">
                                        <FormLabel>Nom du projet *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Refonte UI/UX site e-commerce" className="bg-surface2 border-border" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </div>
                                )} />
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button type="button" variant="outline" onClick={() => navigate('/projets')} className="border-border hover:bg-surface2">
                                    Annuler
                                </Button>
                                <Button type="submit" className="bg-p3 text-bg hover:opacity-90">
                                    Suivant <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                )}

                {currentStep === 2 && (
                    <Form {...form2}>
                        <form onSubmit={form2.handleSubmit(handleNextStep2)}>
                            <CardHeader>
                                <CardTitle>Étape 2 : Le Brief</CardTitle>
                                <CardDescription>Définissez les contours du projet pour vous et l'IA.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form2.control} name="description" render={({ field }) => (
                                    <div className="space-y-2">
                                        <FormLabel>Description détaillée</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Le client souhaite une refonte complète de son tunnel de paiement avec intégration Stripe. Besoin d'un design system fluide..."
                                                className="bg-surface2 border-border h-32 resize-none"
                                                {...field}
                                                value={field.value || ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </div>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form2.control} name="start_date" render={({ field }) => (
                                        <div className="space-y-2">
                                            <FormLabel>Date de début <span className="text-text-muted text-xs">(optionnel)</span></FormLabel>
                                            <FormControl>
                                                <Input type="date" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )} />
                                    <FormField control={form2.control} name="end_date" render={({ field }) => (
                                        <div className="space-y-2">
                                            <FormLabel>Date de fin <span className="text-text-muted text-xs">(optionnel)</span></FormLabel>
                                            <FormControl>
                                                <Input type="date" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )} />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-border hover:bg-surface2">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                                </Button>
                                <Button type="submit" className="bg-p3 text-bg hover:opacity-90">
                                    Suivant <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                )}

                {currentStep === 3 && (
                    <>
                        <CardHeader>
                            <CardTitle>Étape 3 : Checklist & Documents</CardTitle>
                            <CardDescription>Gérez les prérequis (contrats, acomptes) avant de démarrer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="flex gap-2">
                                <Button onClick={handleSuggestDocs} disabled={isGeneratingAi} className="w-full bg-ai text-white hover:bg-ai/90">
                                    {isGeneratingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Suggérer avec l'IA
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {documents.length === 0 ? (
                                    <p className="text-center text-sm text-text-muted py-4">Aucun document dans la checklist.</p>
                                ) : (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded border border-border bg-surface2">
                                            <div className="flex items-center gap-3">
                                                <Checkbox checked={doc.is_completed} disabled className="opacity-50" />
                                                <span className="text-sm">{doc.name}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveDoc(doc.id)} className="h-8 w-8 text-text-muted hover:text-red-400">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-2 items-center">
                                <Input
                                    placeholder="Ajouter manuellement..."
                                    value={newDocName}
                                    onChange={(e) => setNewDocName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualDoc())}
                                    className="bg-surface2 border-border"
                                />
                                <Button onClick={handleAddManualDoc} variant="outline" size="icon" className="border-border hover:bg-surface2 shrink-0">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setStep(2)} className="border-border hover:bg-surface2" disabled={createProject.isPending}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                            </Button>
                            <Button onClick={handleFinalSubmit} disabled={createProject.isPending || !canCreateProject} className="bg-accent text-bg hover:opacity-90 disabled:opacity-60">
                                {createProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Créer le projet
                            </Button>
                        </CardFooter>
                    </>
                )}
            </Card>

            <ClientModal
                open={isClientModalOpen}
                onOpenChange={setIsClientModalOpen}
                client={null}
            />
        </div>
    );
}
