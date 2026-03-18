import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { Invoice } from '@/types/invoice';
import type { Profile } from '@/types/profile';
import { getLegalMentions } from '@/lib/pdf/legal-mentions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Font registration for professional look
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff' }, // Regular
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZJhjp-Ek-_EeA.woff', fontWeight: 600 }, // Semi-Bold
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZJhjp-Ek-_EeA.woff', fontWeight: 700 }  // Bold
    ]
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Inter',
        fontSize: 10,
        color: '#212529',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    logoSection: {
        width: '50%',
    },
    logo: {
        width: 120,
        height: 'auto',
        maxHeight: 60,
        marginBottom: 10,
    },
    companyName: {
        fontSize: 18,
        fontWeight: 700,
        color: '#212529',
        marginBottom: 4,
    },
    companyDetails: {
        color: '#495057',
        lineHeight: 1.4,
    },
    metaSection: {
        width: '40%',
        alignItems: 'flex-end',
    },
    docType: {
        fontSize: 24,
        fontWeight: 700,
        color: '#9333EA', // Purple for invoice
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4,
    },
    metaLabel: {
        color: '#868E96',
        marginRight: 10,
    },
    metaValue: {
        fontWeight: 600,
        minWidth: 80,
        textAlign: 'right',
    },
    clientSection: {
        marginBottom: 40,
        padding: 15,
        backgroundColor: '#F8F9FA',
        borderRadius: 4,
        width: '50%',
        alignSelf: 'flex-end',
    },
    clientTitle: {
        fontSize: 10,
        color: '#868E96',
        textTransform: 'uppercase',
        marginBottom: 5,
        fontWeight: 600,
    },
    clientName: {
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 3,
    },
    table: {
        width: '100%',
        marginBottom: 30,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        borderBottom: '1 solid #DEE2E6',
        paddingBottom: 8,
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottom: '1 solid #E9ECEF',
    },
    colDesc: { width: '70%' },
    colTotal: { width: '30%', textAlign: 'right' },

    colHeader: {
        color: '#868E96',
        fontSize: 9,
        textTransform: 'uppercase',
        fontWeight: 600,
    },
    lineTitle: {
        fontWeight: 600,
        marginBottom: 3,
    },
    lineDesc: {
        color: '#495057',
        fontSize: 9,
        lineHeight: 1.4,
    },
    totalsSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        marginBottom: 40,
    },
    totalsBox: {
        width: '40%',
    },
    totalsRowBold: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottom: '2 solid #212529',
        marginTop: 4,
    },
    notesSection: {
        marginBottom: 40,
    },
    notesLabel: {
        fontWeight: 600,
        marginBottom: 5,
        color: '#212529',
    },
    notesText: {
        color: '#495057',
        lineHeight: 1.5,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTop: '1 solid #E9ECEF',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 7,
        color: '#868E96',
        textAlign: 'center',
        lineHeight: 1.5,
    }
});

interface InvoicePDFDocumentProps {
    invoice: Invoice;
    profile: Profile | null;
    client?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    isPro?: boolean;
}

export function InvoicePDFDocument({ invoice, profile, client, isPro = false }: InvoicePDFDocumentProps) {
    const today = new Date(invoice.created_at);
    const legalMentions = getLegalMentions(profile, 'invoice');
    const invoiceNumber = `FAC-${today.getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`; // Simple generation

    const clientName = client?.name || "Client";
    const clientAddress = client?.address || "";

    const isPaid = invoice.status === 'payé';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        {profile?.logo_url ? (
                            <Image src={profile.logo_url} style={styles.logo} />
                        ) : (
                            <Text style={styles.companyName}>
                                {profile?.company_name || profile?.full_name || 'Ma Société'}
                            </Text>
                        )}
                        <Text style={styles.companyDetails}>{profile?.address_street}</Text>
                        <Text style={styles.companyDetails}>
                            {profile?.address_zip ? `${profile.address_zip} ${profile?.address_city || ''}` : profile?.address_city}
                        </Text>
                        <Text style={styles.companyDetails}>
                            {profile?.bce_number ? `BCE: ${profile.bce_number}` : profile?.siret_number ? `SIRET: ${profile.siret_number}` : ''}
                        </Text>
                    </View>

                    <View style={styles.metaSection}>
                        <Text style={styles.docType}>Facture</Text>
                        {isPaid && (
                            <Text style={{ ...styles.docType, color: '#16A34A', fontSize: 16 }}>ACQUITTÉE</Text>
                        )}

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Numéro :</Text>
                            <Text style={styles.metaValue}>{invoiceNumber}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Date d'émission :</Text>
                            <Text style={styles.metaValue}>{format(today, 'dd/MM/yyyy', { locale: fr })}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Date d'échéance :</Text>
                            <Text style={styles.metaValue}>{invoice.due_date ? format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: fr }) : '-'}</Text>
                        </View>
                        {isPaid && invoice.paid_date && (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Date de paiement :</Text>
                                <Text style={styles.metaValue}>{format(new Date(invoice.paid_date), 'dd/MM/yyyy', { locale: fr })}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ADRESSE CLIENT */}
                <View style={styles.clientSection}>
                    <Text style={styles.clientTitle}>Facturé à</Text>
                    <Text style={styles.clientName}>{clientName}</Text>
                    <Text style={styles.companyDetails}>{clientAddress}</Text>
                    {client?.vat_number && <Text style={styles.companyDetails}>TVA: {client.vat_number}</Text>}
                </View>

                {/* TABLEAU DES LIGNES (Forfaitaire pour l'instant vu le schéma) */}
                <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.colHeader, styles.colDesc]}>Description</Text>
                        <Text style={[styles.colHeader, styles.colTotal]}>Total TTC</Text>
                    </View>

                    <View style={styles.tableRow} wrap={false}>
                        <View style={styles.colDesc}>
                            <Text style={styles.lineTitle}>Prestation de services (Forfaitaire)</Text>
                            {invoice.notes && (
                                <Text style={styles.lineDesc}>{invoice.notes}</Text>
                            )}
                        </View>
                        <Text style={styles.colTotal}>{Number(invoice.amount).toFixed(2)} €</Text>
                    </View>
                </View>

                {/* TOTAUX */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalsBox}>
                        <View style={styles.totalsRowBold}>
                            <Text style={{ fontWeight: 700, fontSize: 12 }}>TOTAL À PAYER :</Text>
                            <Text style={{ fontWeight: 700, fontSize: 12, color: '#9333EA' }}>
                                {Number(invoice.amount).toFixed(2)} €
                            </Text>
                        </View>
                        {isPaid && (
                            <View style={styles.totalsRowBold}>
                                <Text style={{ fontWeight: 700, fontSize: 12, color: '#16A34A' }}>SOLDE RESTANT :</Text>
                                <Text style={{ fontWeight: 700, fontSize: 12, color: '#16A34A' }}>
                                    0.00 €
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* NOTES */}
                {(!isPaid && profile?.iban) && (
                    <View style={styles.notesSection} wrap={false}>
                        <Text style={styles.notesLabel}>Modalités de paiement :</Text>
                        <Text style={styles.notesText}>Merci de bien vouloir effectuer le virement sur le compte suivant :</Text>
                        <Text style={styles.notesText}>IBAN: {profile.iban}</Text>
                        <Text style={{ ...styles.notesText, marginTop: 4 }}>En cas de retard de paiement, des pénalités pourront être appliquées selon les CGV.</Text>
                    </View>
                )}

                {/* FOOTER DES MENTIONS LÉGALES */}
                <View style={styles.footerContainer} fixed>
                    <Text style={styles.footerText}>
                        {legalMentions.join(' - ')}
                    </Text>
                    {isPro && (
                        <Text style={{ ...styles.footerText, marginTop: 3, color: '#6366F1' }}>
                            Facture électronique conforme Factur-X / ZUGFeRD EN16931
                        </Text>
                    )}
                </View>

            </Page>
        </Document>
    );
}
