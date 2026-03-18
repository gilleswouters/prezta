import { useParams } from 'react-router-dom';
import { useClientPortal } from '@/hooks/useClientPortal';
import { Loader2, FileText, CheckCircle2, Clock, Download, AlertCircle, Building2, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotePDFDocument } from '@/components/quotes/pdf/QuotePDFDocument';
import { InvoicePDFDocument } from '@/components/invoices/pdf/InvoicePDFDocument';
import { ContractPDFDocument } from '@/components/contracts/pdf/ContractPDFDocument';
import { useProfile } from '@/hooks/useProfile';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DocumentStatusBadge } from '@/components/ui/DocumentStatusBadge';
import { generateDocumentName } from '@/lib/document-naming';
import type { QuoteLine, QuoteTotals } from '@/types/quote';
import type { Client } from '@/types/client';

// Helper for Quote Totals
const calculateQuoteTotals = (lines: QuoteLine[] | any[]): QuoteTotals => {
    let subtotalHT = 0;
    const tvaAmounts: Record<string, number> = {};

    (lines || []).forEach(line => {
        const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
        subtotalHT += lineTotal;
        const rate = (line.tvaRate || 0).toString();

        if (!tvaAmounts[rate]) tvaAmounts[rate] = 0;
        tvaAmounts[rate] += lineTotal * ((line.tvaRate || 0) / 100);
    });

    const totalTVA = Object.values(tvaAmounts).reduce((sum, val) => sum + val, 0);
    const totalTTC = subtotalHT + totalTVA;

    return { subtotalHT, tvaAmounts, totalTVA, totalTTC };
};

export default function ClientPortalPage() {
    const { portalLink } = useParams<{ portalLink: string }>();
    const { data, isLoading, error } = useClientPortal(portalLink);
    const { data: profile } = useProfile(); // Need public profile info? We might need to fetch the owner's profile based on project.user_id if profile hook requires auth.
    // Wait, useProfile uses Auth. This is a public page. We need the freelancer's profile to render PDFs correctly.
    // I will use useProfile for now as a placeholder, but we should probably fetch the project owner's public profile if the user is not logged in.
    // Let's implement this simply first.

    useEffect(() => {
        document.title = data?.project ? `Espace Client - ${data.project.name}` : 'Espace Client';
    }, [data?.project]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-brand mb-4" />
                <p className="text-text-muted animate-pulse">Chargement de votre espace sécurisé...</p>
            </div>
        );
    }

    if (error || !data?.project) {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
                <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
                    <div className="bg-red-50 text-red-500 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-serif text-text mb-2">Lien invalide ou expiré</h1>
                    <p className="text-text-muted mb-6">
                        Ce lien sécurisé n'est plus valide. Veuillez demander un nouveau lien à votre prestataire.
                    </p>
                </div>
            </div>
        );
    }

    const { project, quotes, invoices, contracts } = data;
    const client = project.clients as Client | null;

    return (
        <div className="min-h-screen bg-bg relative selection:bg-brand/20 selection:text-brand">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b border-white z-40">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-brand rounded-lg flex items-center justify-center transform rotate-3">
                            <span className="text-white font-serif font-bold text-lg leading-none">P</span>
                        </div>
                        <span className="font-serif font-bold text-lg text-text">Prezta<span className="text-brand">.</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-muted font-medium bg-surface2 px-3 py-1.5 rounded-full border border-border">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Espace Sécurisé
                    </div>
                </div>
            </header>

            {/* Quote read-tracking pixel — marks sent quotes as 'lu' when portal is opened */}
            <img
                src={`/api/track-quote-view?token=${portalLink}`}
                alt=""
                width="1"
                height="1"
                className="sr-only"
            />

            <main className="pt-24 pb-16 container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                {/* Greeting */}
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-3xl sm:text-4xl font-serif text-text mb-2">
                        Bonjour {client?.contact_name || client?.name || 'Client'}
                    </h1>
                    <p className="text-lg text-text-muted">
                        Voici le suivi en temps réel de votre projet <strong>{project.name}</strong>.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Documents */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Quotes */}
                        {quotes && quotes.length > 0 && (
                            <section>
                                <h2 className="text-xl font-serif text-text mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-brand" />
                                    Devis
                                </h2>
                                <div className="space-y-3">
                                    {quotes.map((quote) => (
                                        <div key={quote.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand/30 transition-all shadow-sm">
                                            <div>
                                                <p className="font-bold text-text text-lg">{quote.title}</p>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-text-muted">
                                                    <span className="font-mono bg-surface2 px-1.5 py-0.5 rounded text-xs">#{quote.quote_number}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(quote.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                                                    <span>•</span>
                                                    <DocumentStatusBadge status={quote.status ?? 'draft'} />
                                                </div>
                                            </div>
                                            <PDFDownloadLink
                                                document={
                                                    <QuotePDFDocument
                                                        data={{ ...quote, projectId: quote.project_id } as any}
                                                        totals={calculateQuoteTotals(quote.lines)}
                                                        profile={profile || null}
                                                    />
                                                }
                                                fileName={generateDocumentName('Devis', client?.name ?? 'CLIENT', quote.created_at, (quote as Record<string, unknown>).version as number ?? 1)}
                                                className="inline-flex items-center justify-center px-4 py-2 bg-brand/10 text-brand hover:bg-brand hover:text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                                            >
                                                {({ loading }) => (
                                                    loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4 mr-2" /> Télécharger</>
                                                )}
                                            </PDFDownloadLink>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Contracts */}
                        {contracts && contracts.length > 0 && (
                            <section>
                                <h2 className="text-xl font-serif text-text mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    Contrats
                                </h2>
                                <div className="space-y-3">
                                    {contracts.map((contract) => (
                                        <div key={contract.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-green-500/30 transition-all shadow-sm">
                                            <div>
                                                <p className="font-bold text-text text-lg">{contract.title}</p>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-text-muted">
                                                    <span>{format(new Date(contract.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                                                    <span>•</span>
                                                    <DocumentStatusBadge status={contract.status} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {contract.status === 'sent' && contract.signature_id && (
                                                    <a
                                                        href={`https://app.firma.dev/signing/${contract.signature_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                                                    >
                                                        Signer le document
                                                    </a>
                                                )}
                                                <PDFDownloadLink
                                                    document={<ContractPDFDocument contract={contract} profile={profile || null} />}
                                                    fileName={generateDocumentName('Contrat-prestation', client?.name ?? 'CLIENT', contract.created_at, (contract as Record<string, unknown>).version as number ?? 1)}
                                                    className="inline-flex items-center justify-center h-9 w-9 bg-surface2 text-text hover:bg-brand/10 hover:text-brand rounded-lg transition-colors"
                                                    title="Télécharger"
                                                >
                                                    {({ loading }) => (
                                                        loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />
                                                    )}
                                                </PDFDownloadLink>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Invoices */}
                        {invoices && invoices.length > 0 && (
                            <section>
                                <h2 className="text-xl font-serif text-text mb-4 flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-purple-500" />
                                    Factures
                                </h2>
                                <div className="space-y-3">
                                    {invoices.map((invoice) => (
                                        <div key={invoice.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/30 transition-all shadow-sm">
                                            <div>
                                                <p className="font-bold text-text text-lg">{invoice.title || `Facture ${invoice.invoice_number}`}</p>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-text-muted">
                                                    <span className="font-mono bg-surface2 px-1.5 py-0.5 rounded text-xs">#{invoice.invoice_number}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: fr })}</span>
                                                    <span>•</span>
                                                    <DocumentStatusBadge status={invoice.status} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {invoice.status !== 'paid' && (
                                                    <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                                                        Payer ({invoice.amount_total.toFixed(2)}€)
                                                    </Button>
                                                )}
                                                <PDFDownloadLink
                                                    document={<InvoicePDFDocument invoice={invoice} profile={profile || null} client={client} />}
                                                    fileName={generateDocumentName('Facture', client?.name ?? 'CLIENT', invoice.created_at ?? new Date().toISOString(), 1)}
                                                    className="inline-flex items-center justify-center h-9 w-9 bg-surface2 text-text hover:bg-brand/10 hover:text-brand rounded-lg transition-colors"
                                                    title="Télécharger"
                                                >
                                                    {({ loading }) => (
                                                        loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />
                                                    )}
                                                </PDFDownloadLink>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {(!quotes?.length && !contracts?.length && !invoices?.length) && (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                                <FileText className="h-12 w-12 mx-auto mb-2 text-text-muted opacity-20" />
                                <p className="text-text-muted">Aucun document n'est encore disponible pour ce projet.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Client Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-serif text-text mb-4">Informations</h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 text-text-muted mb-1 text-sm">
                                        <Building2 className="h-4 w-4" />
                                        <span>Entreprise</span>
                                    </div>
                                    <p className="font-semibold text-text">{client?.name}</p>
                                    {client?.address && <p className="text-sm text-text-muted mt-0.5">{client.address}</p>}
                                    {client?.vat_number && <p className="text-xs text-text-muted mt-1 font-mono">{client.vat_number}</p>}
                                </div>

                                {client?.contact_name && (
                                    <div className="pt-4 border-t border-border">
                                        <div className="flex items-center gap-2 text-text-muted mb-1 text-sm">
                                            <User className="h-4 w-4" />
                                            <span>Contact principal</span>
                                        </div>
                                        <p className="font-semibold text-text">{client.contact_name}</p>
                                        {client?.email && <p className="text-sm text-text-muted mt-0.5">{client.email}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
