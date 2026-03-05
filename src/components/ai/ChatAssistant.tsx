import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Send,
    X,
    Sparkles,
    User,
    Bot,
    Loader2
} from 'lucide-react';
import { askGemini } from '@/lib/gemini';
import { useProfile } from '@/hooks/useProfile';
import { useProjects } from '@/hooks/useProjects';
import { useProducts } from '@/hooks/useProducts';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatAssistant({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Bonjour ! Je suis votre assistant Prezta. Comment puis-je vous aider aujourd'hui ?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { data: profile } = useProfile();
    const { data: projects } = useProjects();
    const { data: products } = useProducts();

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            // Build Context
            const context = `
CONTEXTE UTILISATEUR PREZTA:
- Profil: ${profile?.full_name || 'Inconnu'}, ${profile?.legal_status || 'Freelance'} en ${profile?.country || 'FR'}.
- Catalogue: ${products?.length || 0} prestations enregistrées.
- Projets actifs: ${projects?.filter(p => p.status === 'in_progress').map(p => p.name).join(', ') || 'Aucun'}.

CONSIGNE:
Tu es l'assistant de l'application Prezta. Tu aides les freelances à gérer leur business. 
Sois concis, professionnel et utile. Réponds en Français.
Utilise les informations du contexte ci-dessus si pertinent pour répondre.
`;

            const fullPrompt = `${context}\n\nHistorique:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\nuser: ${userMsg}`;

            const response = await askGemini(fullPrompt);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai rencontré une erreur technique. Veuillez réessayer." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-[var(--border)] transition-transform duration-300 animate-in slide-in-from-right">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--brand)] text-white">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-bold">Assistant IA</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 h-8 w-8">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user'
                                ? 'bg-[var(--brand)] text-white rounded-tr-none'
                                : 'bg-[var(--surface)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border)]'
                                }`}>
                                <div className="flex items-center gap-2 mb-1 opacity-70">
                                    {m.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                        {m.role === 'user' ? 'Vous' : 'Prezta AI'}
                                    </span>
                                </div>
                                <div className="leading-relaxed whitespace-pre-wrap">
                                    {m.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-[var(--surface)] p-4 rounded-2xl rounded-tl-none border border-[var(--border)] flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-[var(--brand)]" />
                                <span className="text-sm text-[var(--text-muted)] italic">Réflexion en cours...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
                    <Input
                        placeholder="Posez une question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="bg-white border-[var(--border)] flex-1 h-10 shadow-sm"
                        autoFocus
                    />
                    <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] h-10 w-10 p-0 shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">
                    L'IA peut faire des erreurs. Vérifiez les informations importantes.
                </p>
            </div>
        </div>
    );
}
