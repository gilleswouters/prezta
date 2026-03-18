import { useState, useEffect } from 'react';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, RotateCcw, Save, Mail, CheckCircle2 } from 'lucide-react';
import {
    EMAIL_TEMPLATE_LABELS,
    EMAIL_TEMPLATE_VARIABLES,
    type EmailTemplateType,
} from '@/types/email';

const TEMPLATE_TYPES = Object.keys(EMAIL_TEMPLATE_LABELS) as EmailTemplateType[];

export default function ParametresEmailsPage() {
    const { getTemplate, isOverridden, isLoading, upsertTemplate, resetTemplate } = useEmailTemplates();

    const [selectedType, setSelectedType] = useState<EmailTemplateType>('quote_sent');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    // Load the active template whenever the selected type changes
    useEffect(() => {
        const tpl = getTemplate(selectedType);
        setSubject(tpl?.subject ?? '');
        setBody(tpl?.body ?? '');
        setIsDirty(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedType, isLoading]);

    const handleSubjectChange = (v: string) => { setSubject(v); setIsDirty(true); };
    const handleBodyChange = (v: string) => { setBody(v); setIsDirty(true); };

    const insertVariable = (varName: string, target: 'subject' | 'body') => {
        const snippet = `{{${varName}}}`;
        if (target === 'subject') {
            setSubject(prev => prev + snippet);
        } else {
            setBody(prev => prev + snippet);
        }
        setIsDirty(true);
    };

    const handleSave = async () => {
        try {
            await upsertTemplate.mutateAsync({ type: selectedType, subject, body });
            toast.success('Modèle sauvegardé avec succès');
            setIsDirty(false);
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    const handleReset = async () => {
        try {
            await resetTemplate.mutateAsync(selectedType);
            toast.success('Modèle réinitialisé au texte par défaut');
            setIsDirty(false);
        } catch {
            toast.error('Erreur lors de la réinitialisation');
        }
    };

    const variables = EMAIL_TEMPLATE_VARIABLES[selectedType];
    const isCustomised = isOverridden(selectedType);
    const isSaving = upsertTemplate.isPending;
    const isResetting = resetTemplate.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                    Modèles d'e-mails
                </h1>
                <p className="text-[var(--text-muted)] text-sm mt-1">
                    Personnalisez les e-mails envoyés automatiquement à vos clients.
                    Les variables entre doubles accolades sont remplacées automatiquement.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Type list */}
                <div className="lg:col-span-1 bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-[var(--border)] bg-gray-50/50">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            Types de modèles
                        </h2>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                        {TEMPLATE_TYPES.map((type) => {
                            const active = type === selectedType;
                            const customised = isOverridden(type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                                        active
                                            ? 'bg-brand-light text-brand'
                                            : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Mail className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-brand' : 'text-[var(--text-muted)]'}`} />
                                        <span className="text-sm font-medium truncate">
                                            {EMAIL_TEMPLATE_LABELS[type]}
                                        </span>
                                    </div>
                                    {customised && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-light text-brand border border-brand/20 shrink-0 uppercase tracking-wider">
                                            Perso
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Editor */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64 bg-white border border-[var(--border)] rounded-2xl">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
                        </div>
                    ) : (
                        <>
                            {/* Editor card */}
                            <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                                <div className="px-6 py-4 border-b border-[var(--border)] bg-gray-50/50 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                                            {EMAIL_TEMPLATE_LABELS[selectedType]}
                                        </h2>
                                        {isCustomised && (
                                            <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3 text-brand" />
                                                Modèle personnalisé actif
                                            </p>
                                        )}
                                    </div>
                                    {isCustomised && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs h-8 text-[var(--text-muted)] hover:text-danger"
                                            onClick={handleReset}
                                            disabled={isResetting}
                                        >
                                            {isResetting ? (
                                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                            ) : (
                                                <RotateCcw className="h-3 w-3 mr-1" />
                                            )}
                                            Réinitialiser
                                        </Button>
                                    )}
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Subject */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                            Objet
                                        </label>
                                        <Input
                                            value={subject}
                                            onChange={e => handleSubjectChange(e.target.value)}
                                            placeholder="Objet de l'e-mail..."
                                            className="border-[var(--border)] bg-[var(--surface)] focus:border-brand"
                                        />
                                    </div>

                                    {/* Body */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                            Corps du message
                                        </label>
                                        <Textarea
                                            value={body}
                                            onChange={e => handleBodyChange(e.target.value)}
                                            placeholder="Rédigez votre message..."
                                            className="border-[var(--border)] bg-[var(--surface)] focus:border-brand min-h-[260px] font-mono text-sm resize-y"
                                        />
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t border-[var(--border)] bg-gray-50/50 flex justify-end">
                                    <Button
                                        onClick={handleSave}
                                        disabled={!isDirty || isSaving}
                                        className="bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] h-9 text-sm"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                        )}
                                        Enregistrer
                                    </Button>
                                </div>
                            </div>

                            {/* Variables palette */}
                            <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                                    Variables disponibles — cliquez pour insérer dans le corps
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {variables.map(v => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => insertVariable(v, 'body')}
                                            className="text-xs font-mono px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-brand/50 hover:text-brand hover:bg-brand-light transition-colors"
                                            title={`Insérer {{${v}}}`}
                                        >
                                            {`{{${v}}}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
