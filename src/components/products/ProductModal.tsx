import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@/lib/validations/product';
import type { ProductFormValues } from '@/lib/validations/product';
import { Unit, TVA_RATES } from '@/types/product';
import type { Product } from '@/types/product';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';

const PRODUCT_CATEGORIES = ['Développement', 'Design', 'Conseil', 'Formation', 'Maintenance', 'Autre'] as const;
import { useProfile } from '@/hooks/useProfile';
import { Country } from '@/types/profile';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface ProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
}

export function ProductModal({ open, onOpenChange, product }: ProductModalProps) {
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const { data: profile } = useProfile();

    const isEditing = !!product;
    const userCountry = profile?.country || Country.BE;
    const rates = TVA_RATES[userCountry] || TVA_RATES[Country.BE];

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema as any),
        defaultValues: {
            name: '',
            description: '',
            unit_price: 0,
            tva_rate: rates[0],
            unit: Unit.HEURE,
            category: ''
        }
    });

    const { watch, reset } = form;
    const currentPrice = watch('unit_price') || 0;
    const currentTva = watch('tva_rate') || 0;

    useEffect(() => {
        if (product && open) {
            reset({
                name: product.name,
                description: product.description || '',
                unit_price: product.unit_price,
                tva_rate: product.tva_rate,
                unit: product.unit,
                category: product.category || ''
            });
        } else if (!open && !isEditing) {
            reset({
                name: '',
                description: '',
                unit_price: 0,
                tva_rate: rates[0],
                unit: Unit.HEURE,
                category: ''
            });
        }
    }, [product, open, reset, isEditing, rates]);

    const onSubmit = async (data: ProductFormValues) => {
        try {
            const payload = {
                name: data.name,
                description: data.description || null,
                unit_price: data.unit_price,
                tva_rate: data.tva_rate,
                unit: data.unit as Unit,
                category: data.category || null,
            };

            if (isEditing && product) {
                await updateProduct.mutateAsync({ id: product.id, updates: payload });
            } else {
                await createProduct.mutateAsync(payload);
            }
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    const isPending = createProduct.isPending || updateProduct.isPending;
    const ttcPrice = (currentPrice * (1 + currentTva / 100)).toFixed(2);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-surface text-text border-border">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">{isEditing ? 'Modifier la prestation' : 'Nouvelle prestation'}</DialogTitle>
                    <DialogDescription className="text-text-muted">
                        Configurez le prix, la TVA et l'unité de facturation.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

                        <FormField control={form.control} name="name" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Nom de la prestation *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Développement site vitrine" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="unit_price" render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel>Prix unitaire HT (€)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" min="0" className="bg-surface2 border-border" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-p1 font-medium mt-1">
                                        TTC: {ttcPrice} €
                                    </FormDescription>
                                    <FormMessage />
                                </div>
                            )} />

                            <FormField control={form.control} name="tva_rate" render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel>Taux TVA (%)</FormLabel>
                                    <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger className="bg-surface2 border-border">
                                                <SelectValue placeholder="Sélect. TVA" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                            {rates.map(rate => (
                                                <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </div>
                            )} />
                        </div>

                        <FormField control={form.control} name="unit" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Unité de facturation</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-surface2 border-border">
                                            <SelectValue placeholder="Unité" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white">
                                        <SelectItem value={Unit.HEURE}>Heure</SelectItem>
                                        <SelectItem value={Unit.FORFAIT}>Forfait</SelectItem>
                                        <SelectItem value={Unit.PIECE}>Pièce</SelectItem>
                                        <SelectItem value={Unit.JOUR}>Jour</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </div>
                        )} />

                        <FormField control={form.control} name="description" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Description détaillée (Optionnel)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Infos à afficher sur le devis..."
                                        className="bg-surface2 border-border resize-none"
                                        {...field}
                                        value={field.value || ''}
                                        maxLength={200}
                                    />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <FormField control={form.control} name="category" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Catégorie <span className="text-text-muted font-normal">(Optionnel)</span></FormLabel>
                                <FormControl>
                                    <Input
                                        list="product-categories"
                                        placeholder="Ex: Développement, Design..."
                                        className="bg-surface2 border-border"
                                        {...field}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <datalist id="product-categories">
                                    {PRODUCT_CATEGORIES.map(c => <option key={c} value={c} />)}
                                </datalist>
                                <FormMessage />
                            </div>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-text hover:bg-surface2">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isPending} className="bg-p3 text-bg hover:opacity-90">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Mettre à jour' : 'Ajouter au catalogue'}
                            </Button>
                        </DialogFooter>

                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
