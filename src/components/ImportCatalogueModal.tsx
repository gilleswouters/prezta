import { useState, useRef } from 'react';
import { useCreateProductBatch } from '@/hooks/useProducts';
import { Unit } from '@/types/product';
import type { ProductFormData } from '@/types/product';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const UNIT_MAP: Record<string, Unit> = {
    'heure': Unit.HEURE,
    'h': Unit.HEURE,
    'hour': Unit.HEURE,
    'forfait': Unit.FORFAIT,
    'flat': Unit.FORFAIT,
    'pièce': Unit.PIECE,
    'piece': Unit.PIECE,
    'pce': Unit.PIECE,
    'jour': Unit.JOUR,
    'day': Unit.JOUR,
    'j': Unit.JOUR,
};

function normalizeUnit(raw: string | undefined): Unit {
    if (!raw) return Unit.FORFAIT;
    return UNIT_MAP[raw.toLowerCase().trim()] ?? Unit.FORFAIT;
}

interface ParsedProductRow extends ProductFormData {
    _preview_name: string;
}

interface ImportCatalogueModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportCatalogueModal({ open, onOpenChange }: ImportCatalogueModalProps) {
    const createBatch = useCreateProductBatch();

    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedProductRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setFile(null);
        setParsedData([]);
        setError(null);
        setIsProcessing(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) resetState();
        onOpenChange(newOpen);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    const parseCSV = (text: string): ParsedProductRow[] => {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error("Le fichier semble vide ou ne contient que les en-têtes.");

        const sep = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());

        const nameIdx = headers.findIndex(h => h.includes('nom') || h.includes('name'));
        if (nameIdx === -1) throw new Error("Colonne 'Nom' introuvable. Colonnes attendues: nom, prix_ht, unite, description, categorie.");

        const descIdx = headers.findIndex(h => h.includes('desc'));
        const priceIdx = headers.findIndex(h => h.includes('prix') || h.includes('price'));
        const unitIdx = headers.findIndex(h => h.includes('unit') || h.includes('unité'));
        const categoryIdx = headers.findIndex(h => h.includes('cat'));

        const rows: ParsedProductRow[] = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
            const name = cols[nameIdx];
            if (!name) continue;

            const rawPrice = priceIdx !== -1 ? cols[priceIdx] : '';
            const unit_price = rawPrice ? Number(rawPrice.replace(',', '.')) : 0;

            rows.push({
                name,
                description: descIdx !== -1 && cols[descIdx] ? cols[descIdx].substring(0, 200) : null,
                unit_price: isNaN(unit_price) ? 0 : unit_price,
                tva_rate: 0,
                unit: normalizeUnit(unitIdx !== -1 ? cols[unitIdx] : undefined),
                _preview_name: name,
            });
        }

        if (rows.length === 0) throw new Error("Aucune prestation valide trouvée à importer.");
        return rows;
    };

    const processFile = (f: File) => {
        if (f.type !== 'text/csv' && !f.name.endsWith('.csv')) {
            setError("Seuls les fichiers CSV sont acceptés.");
            return;
        }
        setFile(f);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                setParsedData(parseCSV(text));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur de lecture du fichier CSV.");
                setFile(null);
            }
        };
        reader.onerror = () => setError("Erreur lors de la lecture du fichier.");
        reader.readAsText(f, 'UTF-8');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);
        const dropped = e.dataTransfer.files[0];
        if (dropped) processFile(dropped);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files?.[0]) processFile(e.target.files[0]);
    };

    const handleImport = async () => {
        if (!parsedData.length) return;
        setIsProcessing(true);
        try {
            // Strip the _preview_name helper field before inserting
            const products: ProductFormData[] = parsedData.map(({ _preview_name: _, ...rest }) => rest);
            await createBatch.mutateAsync(products);
            toast.success(`${products.length} prestation(s) importée(s) avec succès !`);
            handleOpenChange(false);
        } catch (err) {
            console.error("Erreur import CSV catalogue:", err);
            setError("Une erreur est survenue lors de l'importation.");
        } finally {
            setIsProcessing(false);
        }
    };

    const generateTemplate = () => {
        const header = "Nom;Description;Prix_HT;Unite;Categorie\n";
        const row1 = "Développement site vitrine;Création d'un site web sur-mesure;2500;forfait;Développement\n";
        const row2 = "Consultation stratégie;Séance de conseil personnalisée;150;heure;Conseil\n";
        const blob = new Blob([header + row1 + row2], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "Prezta_catalogue_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white border-border shadow-xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-brand" /> Importer un Catalogue
                    </DialogTitle>
                    <DialogDescription>
                        Ajoutez plusieurs prestations d'un coup à partir d'un fichier CSV.
                        <button onClick={generateTemplate} className="text-brand hover:underline font-medium block mt-1 focus:outline-none">
                            Télécharger un modèle CSV
                        </button>
                    </DialogDescription>
                </DialogHeader>

                {!file ? (
                    <div
                        className={`mt-4 border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${isDragging ? 'border-brand bg-brand-light/30' : 'border-border hover:border-text-muted hover:bg-surface'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-brand' : 'text-text-muted'}`} />
                        <h3 className="font-bold text-text-primary text-sm mb-1">Cliquez ou glissez votre fichier CSV ici</h3>
                        <p className="text-xs text-text-muted text-center">Colonnes : nom, description, prix_ht, unite, categorie</p>
                    </div>
                ) : (
                    <div className="mt-4 space-y-4">
                        <div className="bg-surface rounded-lg border border-border p-4 flex items-start gap-4">
                            <div className="bg-green-100 p-2 rounded-full shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-text-primary truncate">{file.name}</h4>
                                <p className="text-xs text-text-muted mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setParsedData([]); }} className="shrink-0 text-danger hover:text-danger hover:bg-danger-light h-8 text-xs">
                                Retirer
                            </Button>
                        </div>

                        <div className="bg-brand-light/20 border border-brand/20 p-3 rounded-md">
                            <p className="text-sm font-medium text-brand">
                                ✅ {parsedData.length} prestation(s) prête(s) à être importée(s)
                            </p>
                            <p className="text-xs text-text-muted mt-1">
                                Exemple détecté : <span className="font-bold">{parsedData[0]?._preview_name}</span>
                                {parsedData[0]?.unit_price ? ` — ${parsedData[0].unit_price} € HT` : ''}
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-start gap-2 text-danger bg-danger-light/30 p-3 rounded-md text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || parsedData.length === 0 || isProcessing}
                        className="bg-brand text-white hover:bg-brand-hover"
                    >
                        {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isProcessing ? 'Import en cours...' : 'Lancer l\'importation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
