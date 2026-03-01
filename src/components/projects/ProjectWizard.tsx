import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

import { useProjectWizardStore } from '@/stores/useProjectWizardStore';
import { projectStep1Schema, projectStep2Schema } from '@/lib/validations/project';
import { useClients } from '@/hooks/useClients';
import { useCreateProject } from '@/hooks/useProjects';
import type { ProjectDocument, ProjectFormData } from '@/types/project';
import { ProjectStatus } from '@/types/project';
import { askGemini } from '@/lib/gemini';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowRight, ArrowLeft, Check, Sparkles, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectWizard() {
    const { currentStep, projectData, setStep, updateData, reset } = useProjectWizardStore();
    const { data: clients, isLoading: clientsLoading } = useClients();
    const createProject = useCreateProject();
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
        }
    });

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

        const prompt = `Tu es un chef de projet pour un profil freelance. Génère une checklist de 5 à 8 documents obligatoires, attendus ou livrables pour le projet nommé "${projectData.name}".
    Description du brief du projet : "${projectData.description}".
    Réponds UNIQUEMENT avec un tableau JSON valide.
    Format exact : 
    [{ "name": "string (max 60 chars)" }]
    Exemples: "Acompte 30% payé", "Brief créatif validé", "Identifiants FTP reçus", "Maquette V1 validée".
    Reste concis.`;

        try {
            const responseText = await askGemini(prompt);

            let cleanedJson = responseText.trim();
            if (cleanedJson.startsWith('```json')) {
                cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
            } else if (cleanedJson.startsWith('```')) {
                cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
            }

            const parsedData = JSON.parse(cleanedJson);

            if (!Array.isArray(parsedData) || parsedData.length === 0) {
                throw new Error("Invalid format");
            }

            const aiDocs: ProjectDocument[] = parsedData.map(item => ({
                id: uuidv4(),
                name: String(item.name || 'Document'),
                is_completed: false
            }));

            // Append strictly non-existing items or replace? Let's append
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
            const payload: ProjectFormData = {
                name: projectData.name!,
                client_id: projectData.client_id!,
                description: projectData.description || null,
                status: ProjectStatus.DRAFT,
                start_date: null,
                end_date: null,
                expected_documents: documents
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
                                        <Select onValueChange={field.onChange} value={field.value} disabled={clientsLoading}>
                                            <FormControl>
                                                <SelectTrigger className="bg-surface2 border-border">
                                                    <SelectValue placeholder={clientsLoading ? "Chargement..." : "Sélect. client"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {clientsLoading ? null : clients?.length === 0 ? (
                                                    <SelectItem value="empty" disabled>Aucun client trouvé</SelectItem>
                                                ) : (
                                                    clients?.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
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
                                    <p className="text-center text-sm text-muted py-4">Aucun document dans la checklist.</p>
                                ) : (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded border border-border bg-surface2">
                                            <div className="flex items-center gap-3">
                                                <Checkbox checked={doc.is_completed} disabled className="opacity-50" />
                                                <span className="text-sm">{doc.name}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveDoc(doc.id)} className="h-8 w-8 text-muted hover:text-red-400">
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
                            <Button onClick={handleFinalSubmit} disabled={createProject.isPending} className="bg-accent text-bg hover:opacity-90">
                                {createProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Créer le projet
                            </Button>
                        </CardFooter>
                    </>
                )}
            </Card>
        </div>
    );
}
