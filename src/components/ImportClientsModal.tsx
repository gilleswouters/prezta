import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ClientFormData } from '@/types/client';

// Subset of ClientFormData that a CSV row can provide, plus user_id for the insert
type ParsedClientRow = Pick<ClientFormData, 'name' | 'email' | 'phone' | 'address' | 'siret' | 'vat_number'> & {
    user_id: string | undefined;
};

interface ImportClientsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportClientsModal({ open, onOpenChange }: ImportClientsModalProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedClientRow[]>([]);
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const parseCSV = (text: string) => {
        try {
            // Very simple CSV parser (handles commas and semicolons, no escape quotes for simplicity here)
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) throw new Error("Le fichier semble vide ou ne contient que les en-têtes.");

            // Detect separator
            const headerLine = lines[0];
            const sep = headerLine.includes(';') ? ';' : ',';

            const headers = headerLine.split(sep).map(h => h.trim().toLowerCase());

            // Map expected columns
            const nameIdx = headers.findIndex(h => h.includes('nom') || h.includes('name') || h.includes('entreprise'));
            if (nameIdx === -1) throw new Error("Colonne 'Nom' introuvable dans le CSV.");

            const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('courriel'));
            const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('tel') || h.includes('téléphone'));
            const addressIdx = headers.findIndex(h => h.includes('adresse') || h.includes('address'));
            const siretIdx = headers.findIndex(h => h.includes('siret'));
            const vatIdx = headers.findIndex(h => h.includes('tva') || h.includes('vat'));

            const validClients: ParsedClientRow[] = [];

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
                if (!cols[nameIdx]) continue; // skip if no name

                validClients.push({
                    name: cols[nameIdx],
                    email: emailIdx !== -1 ? cols[emailIdx] || null : null,
                    phone: phoneIdx !== -1 ? cols[phoneIdx] || null : null,
                    address: addressIdx !== -1 ? cols[addressIdx] || null : null,
                    siret: siretIdx !== -1 ? cols[siretIdx] || null : null,
                    vat_number: vatIdx !== -1 ? cols[vatIdx] || null : null,
                    user_id: user?.id
                });
            }

            if (validClients.length === 0) throw new Error("Aucun client valide trouvé à importer.");
            return validClients;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erreur de lecture du fichier CSV.";
            throw new Error(message);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) processFile(droppedFile);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file: File) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError("Seuls les fichiers CSV sont acceptés.");
            return;
        }

        setFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const rows = parseCSV(text);
                setParsedData(rows);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur de lecture du fichier CSV.");
                setFile(null);
            }
        };
        reader.onerror = () => {
            setError("Erreur matérielle lors de la lecture du fichier.");
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!parsedData.length || !user?.id) return;

        setIsProcessing(true);
        try {
            // Batch insert into Supabase
            const { error } = await supabase
                .from('clients')
                .insert(parsedData);

            if (error) throw error;

            toast.success(`${parsedData.length} clients importés avec succès !`);
            queryClient.invalidateQueries({ queryKey: ['clients', user.id] });
            handleOpenChange(false);
        } catch (err) {
            console.error("Erreur import CSV:", err);
            setError("Une erreur est survenue lors de l'importation. Certains clients existent peut-être déjà ou les données sont invalides.");
        } finally {
            setIsProcessing(false);
        }
    };

    const generateTemplate = () => {
        const header = "Nom;Email;Téléphone;Adresse;SIRET;TVA\n";
        const row = "Acme Corp;contact@acme.com;0400000000;10 Rue de la Paix, Paris;12345678900012;FR123456789\n";
        const blob = new Blob([header + row], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "Prezta_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white border-border shadow-xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-brand" /> Importer des Clients
                    </DialogTitle>
                    <DialogDescription>
                        Ajoutez plusieurs clients d'un coup à partir d'un fichier CSV.
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
                        <p className="text-xs text-text-muted text-center">Taille max: 5Mo. Encodage UTF-8 recommandé.</p>
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
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="shrink-0 text-danger hover:text-danger hover:bg-danger-light h-8 text-xs">
                                Retirer
                            </Button>
                        </div>

                        <div className="bg-brand-light/20 border border-brand/20 p-3 rounded-md">
                            <p className="text-sm font-medium text-brand">
                                ✅ {parsedData.length} client(s) prêt(s) à être importé(s)
                            </p>
                            <p className="text-xs text-text-muted mt-1">
                                Exemple détecté : <span className="font-bold">{parsedData[0]?.name}</span> {parsedData[0]?.email ? `(${parsedData[0].email})` : ''}
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
