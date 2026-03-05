import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { Profile } from '@/types/profile';
import type { ProjectContract } from '@/types/contract';
import { getLegalMentions } from '@/lib/pdf/legal-mentions';

// Font registration
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff' },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZJhjp-Ek-_EeA.woff', fontWeight: 600 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZJhjp-Ek-_EeA.woff', fontWeight: 700 }
    ]
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
        fontSize: 20,
        fontWeight: 700,
        marginBottom: 20,
        color: '#2d3436',
    },
    content: {
        lineHeight: 1.6,
        textAlign: 'justify',
    },
    footerContainer: {
        position: 'absolute',
        bottom: 30,
        left: 50,
        right: 50,
        borderTop: '1 solid #dfe6e9',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 7,
        color: '#b2bec3',
        textAlign: 'center',
    }
});

interface ContractPDFDocumentProps {
    contract: ProjectContract;
    profile: Profile | null;
}

export function ContractPDFDocument({ contract, profile }: ContractPDFDocumentProps) {
    const legalMentions = getLegalMentions(profile);

    // Basic Markdown to text converter (removes #, **, etc.)
    const cleanContent = contract.content
        .replace(/#+\s/g, '') // remove headers
        .replace(/\*\*/g, '') // remove bold
        .replace(/__/g, '')   // remove italics
        .trim();

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
                    <Text style={styles.companyDetails}>
                        {profile?.vat_number ? `TVA : ${profile.vat_number}` : ''}
                    </Text>
                </View>

                {/* TITLE */}
                <Text style={styles.title}>{contract.title}</Text>

                {/* CONTENT */}
                <View style={styles.content}>
                    <Text>{cleanContent}</Text>
                </View>

                {/* FOOTER */}
                <View style={styles.footerContainer} fixed>
                    <Text style={styles.footerText}>
                        {legalMentions.join(' - ')}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
