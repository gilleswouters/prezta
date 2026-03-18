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
import { useProfile } from '@/hooks/useProfile';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/lib/supabase';
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
    const { data: clients } = useClients();

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
            // Build contextual data string hidden from UI
            let contextData = "=== CONTEXTE DONNÉES UTILISATEUR ===\n";
            if (profile) contextData += `- Profil: ${profile.full_name}, Entreprise: ${profile.company_name}\n`;
            if (clients) {
                contextData += `- Clients: Tu as ${clients.length} clients enregistrés.\n`;
                const clientNames = clients.map(c => c.name).join(', ');
                contextData += `  Noms des clients: ${clientNames}\n`;
            }
            if (projects) contextData += `- Projets: Tu as ${projects.length} projets en cours ou passés.\n`;
            if (products) contextData += `- Catalogue Prestations: Tu as ${products.length} prestations enregistrées.\n`;
            contextData += "====================================\n\n";

            const payloadMessage = `${contextData}Voici ma question: ${userMsg}`;

            const messagePayload = [...messages, { role: 'user', content: payloadMessage }];

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error("Not authenticated");

            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({ messages: messagePayload })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "API Error");
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No stream available");

            const decoder = new TextDecoder();
            let assistantResponse = "";

            // Add empty assistant message to initialize the streaming container
            setMessages(prev => [...prev, { role: 'assistant', content: "" }]);
            setIsLoading(false); // Enable typing effect UI

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkText = decoder.decode(value, { stream: true });
                assistantResponse += chunkText;

                setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1].content = assistantResponse;
                    return next;
                });
            }

        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai rencontré une erreur technique. Veuillez réessayer." }]);
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

            {/* Quick prompt chips */}
            <div className="flex flex-wrap gap-2 px-4 pb-2 pt-1 border-t border-[var(--border)]">
                {[
                    { label: '📊 Projet le plus rentable ?', prompt: 'Quel est mon projet le plus rentable ce mois ?' },
                    { label: '⏱ Heures ce mois ?', prompt: 'Combien d\'heures ai-je travaillé ce mois ?' },
                    { label: '💶 Taux horaire effectif ?', prompt: 'Quel est mon taux horaire effectif ce mois ?' },
                ].map(({ label, prompt }) => (
                    <button
                        key={label}
                        type="button"
                        disabled={isLoading}
                        onClick={() => { setInput(prompt); }}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--brand)] transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        {label}
                    </button>
                ))}
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
