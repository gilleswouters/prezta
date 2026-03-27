import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { Profile } from '@/types/profile';
import type { ProjectContract } from '@/types/contract';
import { getLegalMentions } from '@/lib/pdf/legal-mentions';
import { CONTRACT_TYPE_LABELS, TRAVAIL_CONTRACT_TYPES } from '@/data/contractClauses';

// Font registration
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZJhjp-Ek-_EeA.woff', fontWeight: 600 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZJhjp-Ek-_EeA.woff', fontWeight: 700 },
    ],
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 50,
        fontFamily: 'Inter',
        fontSize: 10,
        color: '#2d3436',
    },
    header: {
        marginBottom: 30,
        borderBottom: '1 solid #dfe6e9',
        paddingBottom: 20,
    },
    companyName: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 4,
    },
    companyDetails: {
        fontSize: 9,
        color: '#636e72',
        lineHeight: 1.4,
    },
    title: {
        fontSize: 18,
        fontWeight: 700,
        marginBottom: 4,
        color: '#2d3436',
    },
    reference: {
        fontSize: 9,
        color: '#636e72',
        marginBottom: 24,
        fontFamily: 'Inter',
    },
    sectionHeading: {
        fontSize: 11,
        fontWeight: 700,
        marginTop: 14,
        marginBottom: 6,
        color: '#1a1a2e',
    },
    paragraph: {
        fontSize: 10,
        lineHeight: 1.6,
        color: '#2d3436',
        marginBottom: 6,
        textAlign: 'justify',
    },
    separator: {
        borderBottom: '1 solid #dfe6e9',
        marginVertical: 10,
    },
    disclaimer: {
        backgroundColor: '#fff8e1',
        border: '1 solid #ffd54f',
        borderRadius: 4,
        padding: 10,
        marginBottom: 20,
    },
    disclaimerText: {
        fontSize: 8.5,
        color: '#7a5500',
        lineHeight: 1.5,
    },
    signatureBlock: {
        marginTop: 40,
        borderTop: '1 solid #dfe6e9',
        paddingTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureCol: {
        width: '44%',
    },
    signatureLabel: {
        fontSize: 9,
        fontWeight: 600,
        color: '#636e72',
        marginBottom: 4,
    },
    signatureName: {
        fontSize: 10,
        fontWeight: 700,
        marginBottom: 20,
    },
    signatureLine: {
        borderBottom: '1 solid #b2bec3',
        marginTop: 30,
    },
    signatureDate: {
        fontSize: 8,
        color: '#b2bec3',
        marginTop: 4,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 25,
        left: 50,
        right: 50,
        borderTop: '1 solid #dfe6e9',
        paddingTop: 8,
    },
    footerText: {
        fontSize: 7,
        color: '#b2bec3',
        textAlign: 'center',
    },
});

// ─── Markdown renderer ────────────────────────────────────────────────────────

/**
 * Very light markdown → React-PDF renderer.
 * Handles:
 *   ## Heading        → sectionHeading
 *   ---               → horizontal rule
 *   **bold** inline   → bold span (simplified: strips ** markers)
 *   Regular paragraph → paragraph
 */
function renderMarkdown(content: string) {
    const blocks = content.split(/\n{2,}/);
    const elements: React.ReactElement[] = [];

    blocks.forEach((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return;

        if (trimmed === '---') {
            elements.push(<View key={idx} style={styles.separator} />);
        } else if (trimmed.startsWith('## ')) {
            const text = trimmed.replace(/^## /, '');
            elements.push(
                <Text key={idx} style={styles.sectionHeading}>
                    {text}
                </Text>,
            );
        } else {
            // Strip **bold** markers for simplicity in PDF (no inline span support needed)
            const clean = trimmed.replace(/\*\*/g, '').replace(/__/g, '');
            elements.push(
                <Text key={idx} style={styles.paragraph}>
                    {clean}
                </Text>,
            );
        }
    });

    return elements;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ContractPDFDocumentProps {
    contract: ProjectContract;
    profile: Profile | null;
    clientName?: string;
}

export function ContractPDFDocument({ contract, profile, clientName }: ContractPDFDocumentProps) {
    const legalMentions = getLegalMentions(profile, 'contract');

    const isTravail =
        contract.contract_type !== null &&
        TRAVAIL_CONTRACT_TYPES.includes(contract.contract_type);

    const displayTitle =
        contract.contract_type && CONTRACT_TYPE_LABELS[contract.contract_type]
            ? CONTRACT_TYPE_LABELS[contract.contract_type]
            : contract.title;

    const prestataire = profile?.company_name || profile?.full_name || 'Le Prestataire';
    const client = clientName || 'Le Client';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.companyName}>
                        {profile?.company_name || profile?.full_name || 'Ma Société'}
                    </Text>
                    <Text style={styles.companyDetails}>{profile?.address_street}</Text>
                    <Text style={styles.companyDetails}>
                        {profile?.address_zip} {profile?.address_city}
                    </Text>
                    {profile?.vat_number ? (
                        <Text style={styles.companyDetails}>TVA : {profile.vat_number}</Text>
                    ) : null}
                </View>

                {/* TITLE */}
                <Text style={styles.title}>{displayTitle}</Text>
                {contract.reference ? (
                    <Text style={styles.reference}>Réf. {contract.reference}</Text>
                ) : null}

                {/* LEGAL DISCLAIMER — travail types only */}
                {isTravail && (
                    <View style={styles.disclaimer}>
                        <Text style={styles.disclaimerText}>
                            ⚠ AVERTISSEMENT — Ce document est un modèle indicatif fourni par Prezta.
                            Il ne constitue pas un conseil juridique. Les contrats de travail sont soumis
                            au Code du travail français et à la convention collective applicable.
                            Consultez un avocat spécialisé en droit social avant toute signature.
                        </Text>
                    </View>
                )}

                {/* CONTENT — markdown-rendered */}
                <View>{renderMarkdown(contract.content)}</View>

                {/* SIGNATURE BLOCK */}
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureCol}>
                        <Text style={styles.signatureLabel}>Le Prestataire</Text>
                        <Text style={styles.signatureName}>{prestataire}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureDate}>Signature et date</Text>
                    </View>
                    <View style={styles.signatureCol}>
                        <Text style={styles.signatureLabel}>Le Client</Text>
                        <Text style={styles.signatureName}>{client}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureDate}>Signature et date</Text>
                    </View>
                </View>

                {/* FOOTER */}
                <View style={styles.footerContainer} fixed>
                    <Text style={styles.footerText}>{legalMentions.join(' — ')}</Text>
                </View>
            </Page>
        </Document>
    );
}
