import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

import { useProjectWizardStore } from '@/stores/useProjectWizardStore';
import { projectStep1Schema, projectStep2Schema } from '@/lib/validations/project';
import { useClients } from '@/hooks/useClients';
import { useCreateProject } from '@/hooks/useProjects';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import type { ProjectFormData } from '@/types/project';
import { ProjectStatus } from '@/types/project';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, ArrowRight, ArrowLeft, Check, Plus, ChevronsUpDown, CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
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
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    const handleNextStep1 = (data: any) => {
        updateData(data);
        setStep(2);
    };

    const handleFinalSubmit = async (data: any) => {
        updateData(data);
        try {
            const finalClientId = (data.client_id || projectData.client_id) && (data.client_id || projectData.client_id) !== "empty"
                ? (data.client_id || projectData.client_id)
                : null;

            const payload: ProjectFormData = {
                name: data.name || projectData.name!,
                client_id: finalClientId,
                description: data.description || null,
                status: ProjectStatus.DRAFT,
                expected_documents: [],
                start_date: data.start_date || null,
                end_date: data.end_date || null,
            };

            await createProject.mutateAsync(payload);
            reset();
            navigate('/projets');
        } catch {
            toast.error('Impossible de créer le projet.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">

            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-serif text-text">Nouveau Projet</h1>
                <div className="flex gap-2">
                    {[1, 2].map(step => (
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
                        <form onSubmit={form2.handleSubmit(handleFinalSubmit)}>
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
                                            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center justify-between h-10 px-3 py-2 bg-surface2 border border-border rounded-md text-sm text-left hover:bg-surface-hover transition-colors"
                                                    >
                                                        <span className={field.value ? 'text-text' : 'text-text-muted'}>
                                                            {field.value
                                                                ? format(parseISO(field.value), 'dd/MM/yyyy', { locale: fr })
                                                                : 'Sélectionner'}
                                                        </span>
                                                        <CalendarIcon className="h-4 w-4 text-text-muted shrink-0" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-white border-border shadow-lg z-50" align="start">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={field.value ? parseISO(field.value) : undefined}
                                                        onSelect={(date) => {
                                                            field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                                                            setStartDateOpen(false);
                                                        }}
                                                        locale={fr}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </div>
                                    )} />
                                    <FormField control={form2.control} name="end_date" render={({ field }) => (
                                        <div className="space-y-2">
                                            <FormLabel>Date de fin <span className="text-text-muted text-xs">(optionnel)</span></FormLabel>
                                            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center justify-between h-10 px-3 py-2 bg-surface2 border border-border rounded-md text-sm text-left hover:bg-surface-hover transition-colors"
                                                    >
                                                        <span className={field.value ? 'text-text' : 'text-text-muted'}>
                                                            {field.value
                                                                ? format(parseISO(field.value), 'dd/MM/yyyy', { locale: fr })
                                                                : 'Sélectionner'}
                                                        </span>
                                                        <CalendarIcon className="h-4 w-4 text-text-muted shrink-0" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-white border-border shadow-lg z-50" align="start">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={field.value ? parseISO(field.value) : undefined}
                                                        onSelect={(date) => {
                                                            field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                                                            setEndDateOpen(false);
                                                        }}
                                                        locale={fr}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </div>
                                    )} />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-border hover:bg-surface2" disabled={createProject.isPending}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                                </Button>
                                <Button type="submit" disabled={createProject.isPending || !canCreateProject} className="bg-accent text-bg hover:opacity-90 disabled:opacity-60">
                                    {createProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                    Créer le projet
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
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
