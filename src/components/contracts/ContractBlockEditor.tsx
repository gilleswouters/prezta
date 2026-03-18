import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    ChevronUp,
    ChevronDown,
    Trash2,
    Plus,
    Sparkles,
    Loader2,
    Check,
    X,
    Lock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Block {
    id: string;
    title: string; // heading text — empty string for the preamble block
    body: string;
}

interface AiPreview {
    title: string;
    body: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
    return crypto.randomUUID();
}

/** Parse a markdown string into blocks split on ## headings. */
function parseBlocks(content: string): Block[] {
    if (!content.trim()) return [{ id: makeId(), title: '', body: '' }];

    const parts = content.split(/(?=^## )/m).filter((p) => p.trim());

    return parts.map((part) => {
        if (part.startsWith('## ')) {
            const newlineIdx = part.indexOf('\n');
            if (newlineIdx === -1) {
                return { id: makeId(), title: part.slice(3).trim(), body: '' };
            }
            return {
                id: makeId(),
                title: part.slice(3, newlineIdx).trim(),
                body: part.slice(newlineIdx + 1).trim(),
            };
        }
        return { id: makeId(), title: '', body: part.trim() };
    });
}

/** Serialize blocks back to a markdown string. */
function blocksToContent(blocks: Block[]): string {
    return blocks
        .map((b) => {
            if (!b.title) return b.body;
            return `## ${b.title}\n\n${b.body}`;
        })
        .join('\n\n');
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ContractBlockEditorProps {
    /** Initial markdown content — only read on mount (use `key` to reset). */
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    /** When false, AI clause button shows a locked/upgrade state */
    canUseAI?: boolean;
}

export function ContractBlockEditor({
    value,
    onChange,
    disabled = false,
    canUseAI = true,
}: ContractBlockEditorProps) {
    const navigate = useNavigate();
    const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(value));

    // AI clause generator state
    const [aiOpen, setAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiPreview, setAiPreview] = useState<AiPreview | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const commit = (newBlocks: Block[]) => {
        setBlocks(newBlocks);
        onChange(blocksToContent(newBlocks));
    };

    const updateBlock = (id: string, field: 'title' | 'body', val: string) => {
        commit(blocks.map((b) => (b.id === id ? { ...b, [field]: val } : b)));
    };

    const moveBlock = (id: string, dir: -1 | 1) => {
        const idx = blocks.findIndex((b) => b.id === id);
        if (idx + dir < 0 || idx + dir >= blocks.length) return;
        const next = [...blocks];
        [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
        commit(next);
    };

    const deleteBlock = (id: string) => {
        commit(blocks.filter((b) => b.id !== id));
    };

    const addBlock = () => {
        commit([
            ...blocks,
            { id: makeId(), title: 'Nouvel article', body: '' },
        ]);
    };

    // ── AI clause generator ──────────────────────────────────────────────────

    const closeAi = () => {
        setAiOpen(false);
        setAiPrompt('');
        setAiPreview(null);
        setAiError(null);
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        setAiError(null);
        setAiPreview(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

            const { data, error } = await supabase.functions.invoke('generate-clause', {
                headers: { Authorization: `Bearer ${accessToken}` },
                body: { description: aiPrompt.trim() },
            });

            if (error) throw error;

            const result = data as { clause?: { title: string; body: string }; error?: string } | null;
            if (result?.error) throw new Error(result.error);
            if (!result?.clause?.title || !result?.clause?.body) throw new Error('Format inattendu.');

            setAiPreview({ title: result.clause.title, body: result.clause.body });
        } catch (err) {
            setAiError(
                "L'IA n'a pas pu générer cette clause. Vérifiez votre connexion ou reformulez la demande."
            );
            console.error('[AI clause]', err);
        } finally {
            setAiLoading(false);
        }
    };

    const insertAiClause = () => {
        if (!aiPreview) return;
        commit([...blocks, { id: makeId(), title: aiPreview.title, body: aiPreview.body }]);
        closeAi();
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-3">
            {blocks.map((block, idx) => (
                <div
                    key={block.id}
                    className={`rounded-lg border overflow-hidden bg-white ${
                        block.title
                            ? 'border-border'
                            : 'border-dashed border-text-muted/40'
                    }`}
                >
                    {/* Block header */}
                    <div
                        className={`flex items-center gap-2 px-4 py-2 ${
                            block.title
                                ? 'bg-surface/60 border-b border-border'
                                : 'bg-transparent'
                        }`}
                    >
                        <div className="flex-1 min-w-0">
                            {block.title !== '' ? (
                                <Input
                                    value={block.title}
                                    onChange={(e) =>
                                        updateBlock(block.id, 'title', e.target.value)
                                    }
                                    className="h-7 text-sm font-semibold border-none shadow-none bg-transparent px-0 focus-visible:ring-0 placeholder:text-text-muted"
                                    placeholder="Titre de l'article..."
                                    disabled={disabled}
                                />
                            ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted select-none">
                                    Préambule
                                </span>
                            )}
                        </div>

                        {!disabled && (
                            <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => moveBlock(block.id, -1)}
                                    disabled={idx === 0}
                                    title="Monter"
                                    className="h-6 w-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveBlock(block.id, 1)}
                                    disabled={idx === blocks.length - 1}
                                    title="Descendre"
                                    className="h-6 w-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => deleteBlock(block.id)}
                                    title="Supprimer"
                                    className="h-6 w-6 flex items-center justify-center rounded text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Block body */}
                    <Textarea
                        value={block.body}
                        onChange={(e) => updateBlock(block.id, 'body', e.target.value)}
                        className="border-none shadow-none rounded-none resize-none text-sm font-mono bg-white focus-visible:ring-0 min-h-[80px]"
                        placeholder={
                            block.title
                                ? 'Contenu de l\'article...'
                                : 'Identité des parties, contexte...'
                        }
                        disabled={disabled}
                    />
                </div>
            ))}

            {/* Action buttons (only when editable) */}
            {!disabled && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 border-dashed text-text-secondary hover:text-text-primary hover:border-solid"
                        onClick={addBlock}
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Ajouter un article
                    </Button>

                    {canUseAI ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 border-brand/30 text-brand hover:bg-brand-light hover:border-brand/60"
                            onClick={() => {
                                setAiOpen((v) => !v);
                                setAiPreview(null);
                                setAiError(null);
                            }}
                        >
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            ✦ Ajouter une clause IA
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 border-amber-300 text-amber-600 hover:bg-amber-50"
                            onClick={() => navigate('/pricing')}
                        >
                            <Lock className="h-3.5 w-3.5 mr-1.5" />
                            Clause IA — Plan Pro
                        </Button>
                    )}
                </div>
            )}

            {/* AI clause generator panel */}
            {aiOpen && !disabled && canUseAI && (
                <div className="rounded-xl border border-brand/30 bg-brand-light/15 p-4 space-y-3">
                    {/* Panel header */}
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-brand flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4" />
                            Générateur de clause IA
                        </h4>
                        <button
                            type="button"
                            onClick={closeAi}
                            className="h-6 w-6 flex items-center justify-center rounded text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Prompt input */}
                    <Textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ex : Clause de propriété intellectuelle pour une application mobile..."
                        className="text-sm resize-none bg-white border-border min-h-[72px]"
                    />

                    <Button
                        type="button"
                        size="sm"
                        className="bg-brand text-white hover:bg-brand-hover text-xs h-8"
                        onClick={handleAiGenerate}
                        disabled={!aiPrompt.trim() || aiLoading}
                    >
                        {aiLoading ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {aiLoading ? 'Génération en cours...' : 'Générer la clause'}
                    </Button>

                    {/* Error */}
                    {aiError && (
                        <p className="text-xs text-danger bg-danger-light/30 px-3 py-2 rounded-md">
                            {aiError}
                        </p>
                    )}

                    {/* Preview */}
                    {aiPreview && (
                        <div className="rounded-lg border border-border bg-white p-4 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                Aperçu de la clause générée
                            </p>
                            <p className="font-semibold text-sm text-brand">
                                ## {aiPreview.title}
                            </p>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                {aiPreview.body}
                            </p>
                            <div className="flex gap-2 pt-2 border-t border-border">
                                <Button
                                    type="button"
                                    size="sm"
                                    className="bg-brand text-white hover:bg-brand-hover text-xs h-8"
                                    onClick={insertAiClause}
                                >
                                    <Check className="h-3.5 w-3.5 mr-1.5" />
                                    Insérer dans le contrat
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8"
                                    onClick={() => {
                                        setAiPreview(null);
                                        setAiPrompt('');
                                    }}
                                >
                                    Régénérer
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
