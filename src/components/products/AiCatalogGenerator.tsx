import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useCreateProductBatch } from '@/hooks/useProducts';
import { askGemini } from '@/lib/gemini';
import { Country } from '@/types/profile';
import { Unit } from '@/types/product';
import type { ProductFormData } from '@/types/product';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

const JOB_CATEGORIES = [
    "Design & Création",
    "Conseil & Formation",
    "Développement",
    "Photo & Vidéo",
    "Bâtiment & Artisanat",
    "Juridique & Admin",
    "Autre"
];

interface AiCatalogGeneratorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AiCatalogGenerator({ open, onOpenChange }: AiCatalogGeneratorProps) {
    const { data: profile } = useProfile();
    const createBatch = useCreateProductBatch();

    const [jobCategory, setJobCategory] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedProducts, setGeneratedProducts] = useState<ProductFormData[]>([]);
    const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

    const resetState = () => {
        setJobCategory('');
        setGeneratedProducts([]);
        setSelectedIndexes(new Set());
        setIsGenerating(false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
    };

    const handleGenerate = async () => {
        if (!jobCategory) return;

        setIsGenerating(true);
        setGeneratedProducts([]);

        const countryStr = profile?.country === Country.FR ? "France"
            : profile?.country === Country.CH ? "Suisse"
                : "Belgique";

        const prompt = `Tu es un assistant pour freelances ${countryStr}. Génère exactement 8 prestations typiques pour un freelance "${jobCategory}" en ${countryStr} en 2026.
    Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans markdown, sans backticks.
    Format exact : 
    [{ "name": "string", "description": "string (max 80 chars)", "unit_price": number, "tva_rate": number, "unit": "heure" | "forfait" | "pièce" | "jour" }]
    Les prix doivent être réalistes pour le marché ${countryStr}.
    L'unité doit être exactement l'une de ces 4 chaînes : "heure" | "forfait" | "pièce" | "jour".`;

        try {
            const responseText = await askGemini(prompt);

            // Clean up markdown block if the model ignores the instruction
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

            const validatedProducts: ProductFormData[] = parsedData.map(item => ({
                name: String(item.name || 'Prestation'),
                description: item.description ? String(item.description).substring(0, 100) : null,
                unit_price: Number(item.unit_price) || 0,
                tva_rate: Number(item.tva_rate) || 0,
                unit: (Object.values(Unit).includes(item.unit as Unit) ? item.unit : Unit.FORFAIT) as Unit,
            }));

            setGeneratedProducts(validatedProducts);
            setSelectedIndexes(new Set(validatedProducts.map((_, i) => i)));

        } catch (error) {
            console.error("Gemini Parsing Error", error);
            toast.error("Génération échouée, veuillez réessayer.");
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleSelection = (index: number) => {
        setSelectedIndexes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) newSet.delete(index);
            else newSet.add(index);
            return newSet;
        });
    };

    const handleImport = async () => {
        const productsToImport = generatedProducts.filter((_, i) => selectedIndexes.has(i));
        if (productsToImport.length === 0) return;

        try {
            await createBatch.mutateAsync(productsToImport);
            handleOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-surface text-text border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-ai" />
                        Générer avec l'IA
                    </DialogTitle>
                    <DialogDescription className="text-text-muted">
                        Créez instantanément un catalogue sur-mesure pour votre spécialité.
                    </DialogDescription>
                </DialogHeader>

                {generatedProducts.length === 0 ? (
                    <div className="py-6 space-y-6">
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="category">Quel est votre domaine d'activité ?</Label>
                            <Select value={jobCategory} onValueChange={setJobCategory} disabled={isGenerating}>
                                <SelectTrigger id="category" className="bg-surface2 border-border">
                                    <SelectValue placeholder="Sélectionnez un métier..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {JOB_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={!jobCategory || isGenerating}
                            className="w-full bg-ai text-white hover:bg-ai/90 h-12"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Génération en cours...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Générer mon catalogue (8 prestations)
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        <p className="text-sm font-medium">Sélectionnez les prestations à conserver :</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {generatedProducts.map((prod, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start space-x-3 p-3 rounded-md border transition-colors cursor-pointer ${selectedIndexes.has(idx) ? 'border-ai/50 bg-ai-bg' : 'border-border bg-surface2'
                                        }`}
                                    onClick={() => toggleSelection(idx)}
                                >
                                    <Checkbox
                                        checked={selectedIndexes.has(idx)}
                                        onCheckedChange={() => { }} // handled by parent onClick
                                        className="mt-1 data-[state=checked]:bg-ai data-[state=checked]:border-ai"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-text truncate">{prod.name}</p>
                                        {prod.description && <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{prod.description}</p>}
                                        <div className="flex items-center gap-2 mt-1.5 text-xs font-mono text-text-muted">
                                            <span className="text-p1">{prod.unit_price}€ HT</span>
                                            <span>•</span>
                                            <span>{prod.unit}</span>
                                            <span>•</span>
                                            <span>TVA {prod.tva_rate}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
                            <Button type="button" variant="outline" onClick={() => setGeneratedProducts([])} className="border-border text-text hover:bg-surface2 h-11">
                                Recommencer
                            </Button>
                            <Button
                                onClick={handleImport}
                                className="bg-accent text-bg hover:opacity-90 h-11"
                                disabled={selectedIndexes.size === 0 || createBatch.isPending}
                            >
                                {createBatch.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Importer ({selectedIndexes.size}) prestations
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
