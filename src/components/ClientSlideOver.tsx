import { useState } from 'react';
import { useClientEvents, useCreateClientEvent } from '@/hooks/useClients';
import type { Client } from '@/types/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Phone, Building2, MapPin, StickyNote, Send, Calendar, Clock, Laptop } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ClientSlideOverProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: Client | null;
}

export function ClientSlideOver({ open, onOpenChange, client }: ClientSlideOverProps) {
    const [noteContent, setNoteContent] = useState('');
    const [noteType, setNoteType] = useState<'note' | 'email' | 'call'>('note');

    // Safety check - shouldn't render if no client but just in case
    const clientId = client?.id || '';

    const { data: events, isLoading: eventsLoading } = useClientEvents(clientId);
    const createEvent = useCreateClientEvent();

    if (!client) return null;

    const handleAddNote = async () => {
        if (!noteContent.trim() || !client.id) return;

        await createEvent.mutateAsync({
            client_id: client.id,
            type: noteType,
            content: noteContent
        });

        setNoteContent('');
        setNoteType('note');
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'note': return <StickyNote className="w-4 h-4 text-amber-500" />;
            case 'email': return <Mail className="w-4 h-4 text-blue-500" />;
            case 'call': return <Phone className="w-4 h-4 text-green-500" />;
            case 'system': return <Laptop className="w-4 h-4 text-gray-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto bg-surface border-l border-border p-0">
                {/* Header Section */}
                <div className="p-6 border-b border-border bg-white sticky top-0 z-10">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-serif text-text-primary flex items-center gap-2">
                            {client.name}
                        </SheetTitle>
                        <SheetDescription className="flex items-center gap-2 text-sm">
                            {client.legal_status && (
                                <span className="bg-surface2 px-2 py-0.5 rounded text-text-muted font-bold text-xs uppercase tracking-wider">
                                    {client.legal_status}
                                </span>
                            )}
                            <span className="text-text-muted">Client depuis le {format(new Date(client.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                        </SheetDescription>
                    </SheetHeader>

                    {/* Quick Contact Info */}
                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col gap-2 text-text-muted cursor-default">
                            {client.email && (
                                <a href={`mailto:${client.email}`} className="flex items-center gap-2 hover:text-brand transition-colors">
                                    <Mail className="w-4 h-4" /> <span className="truncate">{client.email}</span>
                                </a>
                            )}
                            {client.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> <span>{client.phone}</span>
                                </div>
                            )}
                            {!client.email && !client.phone && <span className="italic opacity-50">Aucun contact</span>}
                        </div>

                        <div className="flex flex-col gap-2 text-text-muted">
                            {client.siret && (
                                <div className="flex items-center gap-2" title="SIRET">
                                    <Building2 className="w-4 h-4" /> <span className="font-mono text-xs">{client.siret}</span>
                                </div>
                            )}
                            {client.vat_number && (
                                <div className="flex items-center gap-2" title="TVA">
                                    <span className="w-4 h-4 flex items-center justify-center font-bold text-[10px] bg-surface2 rounded text-text-primary">TVA</span>
                                    <span className="font-mono text-xs">{client.vat_number}</span>
                                </div>
                            )}
                        </div>

                        {client.address && (
                            <div className="col-span-2 flex items-start gap-2 text-text-muted mt-2">
                                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="text-sm leading-tight">{client.address}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="p-6 bg-surface min-h-screen">
                    <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-text-muted" /> Historique & Activité
                    </h3>

                    {/* Add Note Input */}
                    <div className="mb-8 bg-white border border-border rounded-lg p-3 shadow-sm focus-within:ring-2 focus-within:ring-brand/20 transition-all">
                        <Textarea
                            placeholder="Enregistrer une note, un appel, un résumé de mail..."
                            className="border-0 focus-visible:ring-0 resize-none min-h-[80px] p-0 text-sm bg-transparent"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                        />
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
                            <Select value={noteType} onValueChange={(val: any) => setNoteType(val)}>
                                <SelectTrigger className="w-[140px] h-8 text-xs bg-surface2 border-0">
                                    <SelectValue placeholder="Type d'action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="note"><div className="flex items-center gap-2"><StickyNote className="w-3 h-3 text-amber-500" /> Note interne</div></SelectItem>
                                    <SelectItem value="call"><div className="flex items-center gap-2"><Phone className="w-3 h-3 text-green-500" /> Appel / Visio</div></SelectItem>
                                    <SelectItem value="email"><div className="flex items-center gap-2"><Mail className="w-3 h-3 text-blue-500" /> Email</div></SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                size="sm"
                                className="h-8 bg-brand hover:bg-brand-hover text-white flex items-center gap-2 text-xs"
                                onClick={handleAddNote}
                                disabled={createEvent.isPending || !noteContent.trim()}
                            >
                                {createEvent.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                Ajouter
                            </Button>
                        </div>
                    </div>

                    {/* Timeline Feed */}
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">

                        {/* Always show creation as first event if no events */}
                        {eventsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                            </div>
                        ) : events && events.length > 0 ? (
                            events.map((event) => (
                                <div key={event.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        {getEventIcon(event.type)}
                                    </div>

                                    {/* Content Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border border-border shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-text-primary text-sm capitalize">{event.type === 'note' ? 'Note interne' : event.type === 'call' ? 'Appel / Réunion' : event.type}</span>
                                            <time className="text-[10px] text-text-muted font-mono">{format(new Date(event.created_at), 'dd MMM à HH:mm', { locale: fr })}</time>
                                        </div>
                                        <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                                            {event.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : null}

                        {/* Birth Node (Creation) */}
                        <div className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-surface2 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <Calendar className="w-4 h-4 text-text-muted" />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface2/50 p-4 rounded-lg border border-border border-dashed shadow-sm opacity-75">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-text-primary text-sm">Fiche créée</span>
                                    <time className="text-[10px] text-text-muted font-mono">{format(new Date(client.created_at), 'dd MMM yyyy', { locale: fr })}</time>
                                </div>
                                <p className="text-sm text-text-secondary">Le client a été ajouté au système.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
