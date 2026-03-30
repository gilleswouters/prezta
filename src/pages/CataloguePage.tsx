import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts, useDeleteProduct, useToggleFavorite } from '@/hooks/useProducts';
import type { Product } from '@/types/product';
import { Unit } from '@/types/product';
import { ProductModal } from '@/components/products/ProductModal';
import { AiCatalogGenerator } from '@/components/products/AiCatalogGenerator';
import { BenchmarkModal } from '@/components/catalogue/BenchmarkModal';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import CostCalculatorPage from '@/pages/CostCalculatorPage';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Pencil, Trash2, Search, Star, Sparkles, BarChart2, Lock } from 'lucide-react';

export default function CataloguePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'calculateur' ? 'calculateur' : 'prestations';
    const { data: products, isLoading } = useProducts();
    const deleteProduct = useDeleteProduct();
    const toggleFavorite = useToggleFavorite();
    const { canUseAI } = usePlanLimits();

    const [modalOpen, setModalOpen] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [benchmarkProduct, setBenchmarkProduct] = useState<Product | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = useMemo(() => {
        const cats = new Set<string>();
        // no category column in products table
        return Array.from(cats).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesUnit = selectedUnit === 'all' || p.unit === selectedUnit;
            const matchesCategory = true;
            return matchesSearch && matchesUnit && matchesCategory;
        });
    }, [products, searchQuery, selectedUnit, selectedCategory]);

    const handleCreateNew = () => {
        setEditingProduct(null);
        setModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteProduct.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    const handleToggleFavorite = (product: Product) => {
        // Optimistic mutation call
        toggleFavorite.mutate({ id: product.id, is_favorite: product.is_favorite });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
            </div>
        );
    }

    const isEmpty = products?.length === 0;

    return (
        <div className="space-y-6">

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-border pb-0">
                {(['prestations', 'calculateur'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSearchParams(tab === 'prestations' ? {} : { tab })}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                            activeTab === tab
                                ? 'border-brand text-brand'
                                : 'border-transparent text-text-muted hover:text-text'
                        }`}
                    >
                        {tab === 'prestations' ? 'Prestations' : 'Calculateur de prix'}
                    </button>
                ))}
            </div>

            {/* Calculateur tab */}
            {activeTab === 'calculateur' && <CostCalculatorPage />}

            {/* Prestations tab */}
            {activeTab === 'prestations' && <>

            {/* HEADER SECTION */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-text w-full max-w-sm">Mon Catalogue</h1>
                    <p className="text-text-muted mt-1">Prestations et produits que vous proposez.</p>
                </div>

                <div className="flex items-center gap-3">
                    {!isEmpty && (
                        <Button variant="outline" onClick={() => setAiModalOpen(true)} className="border-border text-ai hover:bg-ai/10">
                            <Sparkles className="mr-2 h-4 w-4" />
                            IA
                        </Button>
                    )}
                    <Button onClick={handleCreateNew} className="bg-p3 text-bg hover:opacity-90">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle Prestation
                    </Button>
                </div>
            </div>

            {isEmpty ? (
                /* EMPTY STATE */
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-border rounded-lg bg-surface">
                    <div className="bg-surface2 p-4 rounded-full mb-4 ring-1 ring-border shadow-sm">
                        <Search className="h-10 w-10 text-text-muted" />
                    </div>
                    <h2 className="text-xl font-serif text-text mb-2">Aucune prestation définie</h2>
                    <p className="text-text-muted max-w-md mb-8">
                        Pour établir vos devis rapidement, commencez par construire votre catalogue de base.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={() => setAiModalOpen(true)} className="bg-ai text-white hover:bg-ai/90 h-12">
                            <Sparkles className="mr-2 h-5 w-5" />
                            Générer mon catalogue avec l'IA
                        </Button>
                        <Button onClick={handleCreateNew} variant="outline" className="h-12 border-border text-text hover:bg-surface2">
                            Créer manuellement
                        </Button>
                    </div>
                </div>
            ) : (
                /* DATA TABLE & FILTERS */
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                            <Input
                                placeholder="Rechercher une prestation..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-surface border-border"
                            />
                        </div>

                        <Tabs defaultValue="all" value={selectedUnit} onValueChange={setSelectedUnit} className="w-full sm:w-auto overflow-x-auto">
                            <TabsList className="bg-surface2 border border-border p-1 w-max">
                                <TabsTrigger value="all" className="data-[state=active]:bg-surface data-[state=active]:text-text">Tous</TabsTrigger>
                                <TabsTrigger value={Unit.HEURE} className="data-[state=active]:bg-surface data-[state=active]:text-text">Heure</TabsTrigger>
                                <TabsTrigger value={Unit.FORFAIT} className="data-[state=active]:bg-surface data-[state=active]:text-text">Forfait</TabsTrigger>
                                <TabsTrigger value={Unit.PIECE} className="data-[state=active]:bg-surface data-[state=active]:text-text">Pièce</TabsTrigger>
                                <TabsTrigger value={Unit.JOUR} className="data-[state=active]:bg-surface data-[state=active]:text-text">Jour</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {categories.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${!selectedCategory ? 'bg-brand text-white' : 'bg-surface2 border border-border text-text-muted hover:bg-surface-hover'}`}
                            >
                                Toutes
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${selectedCategory === cat ? 'bg-brand text-white' : 'bg-surface2 border border-border text-text-muted hover:bg-surface-hover'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="rounded-md border border-border bg-surface overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead className="text-text-muted">Prestation</TableHead>
                                    <TableHead className="text-right text-text-muted w-[120px]">Prix unitaire HT</TableHead>
                                    <TableHead className="text-text-muted hidden md:table-cell w-[100px]">Unité</TableHead>
                                    <TableHead className="text-text-muted w-[100px] hidden sm:table-cell">TVA</TableHead>
                                    <TableHead className="text-right text-text-muted w-[70px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length === 0 ? (
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableCell colSpan={6} className="h-32 text-center text-text-muted">
                                            Aucune prestation ne correspond à vos filtres.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <TableRow key={product.id} className="border-border hover:bg-surface2/50 transition-colors">
                                            <TableCell>
                                                <button
                                                    onClick={() => handleToggleFavorite(product)}
                                                    className={`hover:scale-110 transition-transform ${product.is_favorite ? 'text-accent' : 'text-text-muted hover:text-text'}`}
                                                >
                                                    <Star className={`h-5 w-5 ${product.is_favorite ? 'fill-accent' : ''}`} />
                                                </button>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] sm:max-w-none">
                                                <p className="font-medium text-text truncate" title={product.name}>{product.name}</p>
                                                {product.description && (
                                                    <p className="text-xs text-text-muted truncate mt-1" title={product.description}>{product.description}</p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-text font-mono">
                                                {product.unit_price} €
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-text-muted capitalize">
                                                {product.unit}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-text-muted">
                                                {product.tva_rate}%
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Benchmark — Pro gate */}
                                                    {canUseAI ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-text-muted hover:text-brand hover:bg-brand-light"
                                                            title="Benchmark marché"
                                                            onClick={() => setBenchmarkProduct(product)}
                                                        >
                                                            <BarChart2 className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-amber-400 opacity-60 cursor-not-allowed"
                                                            title="Fonctionnalité Pro — Passez au plan Pro pour accéder au benchmark marché"
                                                            disabled
                                                        >
                                                            <Lock className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="h-8 w-8 text-text-text-muted hover:text-text-primary hover:bg-surface-hover" title="Modifier">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(product.id)} className="h-8 w-8 text-danger hover:text-danger-hover hover:bg-danger-light" title="Supprimer">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                </div>
            )}

            {/* DIALOGS (always mounted for correct modal state) */}
            </>}
            <ProductModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                product={editingProduct}
            />

            <AiCatalogGenerator
                open={aiModalOpen}
                onOpenChange={setAiModalOpen}
            />

            {benchmarkProduct && (
                <BenchmarkModal
                    open={!!benchmarkProduct}
                    onOpenChange={open => { if (!open) setBenchmarkProduct(null); }}
                    product={benchmarkProduct}
                    onEditProduct={product => {
                        setBenchmarkProduct(null);
                        handleEdit(product);
                    }}
                />
            )}

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-surface text-text border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription className="text-text-muted">
                            Cette action supprimera définitivement cette prestation de votre catalogue.
                            (Les devis déjà générés avec cette prestation ne seront pas affectés).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-border text-text hover:bg-surface2">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-600">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
