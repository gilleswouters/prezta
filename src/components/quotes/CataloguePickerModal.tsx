import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, PlusCircle } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useQuoteStore } from '@/stores/useQuoteStore';

export function CataloguePickerModal() {
    const { data: products, isLoading } = useProducts();
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const addProductLine = useQuoteStore(state => state.addProductLine);

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const handleAdd = (product: any) => {
        addProductLine(product);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-border text-text-secondary bg-white hover:bg-surface-hover hover:text-text-primary text-sm font-semibold h-10 w-full md:w-auto">
                    <BookOpen className="h-4 w-4 mr-2 text-brand" />
                    + Depuis Catalogue
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col bg-white border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl text-text-primary">Catalogue de Prestations</DialogTitle>
                    <DialogDescription className="text-text-secondary">
                        Recherchez et ajoutez vos tarifs pré-définis au devis courant.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mt-2 mb-4 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-text-muted" />
                    <Input
                        placeholder="Rechercher une prestation..."
                        className="pl-9 h-10 bg-surface border-border focus:bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {isLoading ? (
                        <p className="text-sm text-text-text-muted text-center py-8">Chargement du catalogue...</p>
                    ) : filteredProducts.length === 0 ? (
                        <p className="text-sm text-text-text-muted text-center py-8">Aucun produit trouvé.</p>
                    ) : (
                        filteredProducts.map(product => (
                            <div
                                key={product.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand-border bg-surface hover:bg-white transition-colors cursor-pointer group"
                                onClick={() => handleAdd(product)}
                            >
                                <div>
                                    <h4 className="font-semibold text-text-primary text-sm">{product.name}</h4>
                                    <p className="text-xs text-text-text-muted mt-0.5 max-w-[300px] truncate">{product.description || '...'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="block font-bold text-text-primary">{product.unit_price} €</span>
                                        <span className="block text-[10px] text-text-text-muted uppercase">/ {product.unit} · TVA {product.tva_rate}%</span>
                                    </div>
                                    <PlusCircle className="h-5 w-5 text-text-disabled group-hover:text-brand transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
