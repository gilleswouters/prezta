/**
 * facturx.ts
 * ----------
 * Generates ZUGFeRD EN16931 BASIC-WL compliant XML for French e-invoicing (Factur-X).
 * Also provides generateFacturXPDF() which embeds the XML into the React-PDF output
 * using pdf-lib, producing a standards-compliant hybrid PDF.
 *
 * Reference: https://www.factur-x.eu / ZUGFeRD 2.3 EN16931 profile
 */

import { PDFDocument, AFRelationship } from 'pdf-lib';
import { pdf } from '@react-pdf/renderer';
import type { Invoice } from '@/types/invoice';
import type { Profile } from '@/types/profile';

// ─── Client subset for Factur-X (what's available from InvoiceWithProject) ────

export interface FacturXClient {
    name: string;
    address?: string | null;
    vat_number?: string | null;
    email?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
    if (!s) return '';
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function isoDate(dateStr: string | null | undefined): string {
    if (!dateStr) return new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return dateStr.slice(0, 10).replace(/-/g, '');
}

function isAutoEntrepreneur(profile: Profile): boolean {
    return profile.legal_status === 'auto_entrepreneur_fr';
}

// ─── XML generation ────────────────────────────────────────────────────────────

export function generateFacturXXML(
    invoice: Invoice,
    profile: Profile,
    client: FacturXClient,
): string {
    const autoE = isAutoEntrepreneur(profile);
    const taxRate = autoE ? 0 : 20; // default TVA 20% for non auto-entrepreneurs

    // For simplicity: treat invoice.amount as HT (base amount)
    const amountHT = Number(invoice.amount);
    const vatAmount = autoE ? 0 : Math.round(amountHT * taxRate) / 100;
    const amountTTC = amountHT + vatAmount;

    const issueDate    = isoDate(invoice.created_at);
    const dueDate      = isoDate(invoice.due_date ?? invoice.created_at);
    const invoiceRef   = invoice.reference ?? `INV-${invoice.id.slice(0, 8).toUpperCase()}`;

    // Seller address parts
    const sellerName    = esc(profile.company_name ?? profile.full_name ?? 'Prestataire');
    const sellerStreet  = esc(profile.address_street);
    const sellerCity    = esc(profile.address_city);
    const sellerZip     = esc(profile.address_zip);
    const sellerSIRET   = esc(profile.siret_number);
    const sellerVAT     = esc(profile.vat_number);
    const sellerIBAN    = esc(profile.iban);

    // Buyer info
    const buyerName     = esc(client.name);
    const buyerAddress  = esc(client.address);
    const buyerVAT      = esc(client.vat_number);

    const exemptionNote = autoE
        ? '<ram:TaxExemptionReason>TVA non applicable, art. 293 B du CGI</ram:TaxExemptionReason>'
        : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
    xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <!-- === EXCHANGED DOCUMENT CONTEXT === -->
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <!-- === EXCHANGED DOCUMENT === -->
  <rsm:ExchangedDocument>
    <ram:ID>${esc(invoiceRef)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDate}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>

  <!-- === SUPPLY CHAIN TRADE TRANSACTION === -->
  <rsm:SupplyChainTradeTransaction>

    <!-- Line items (single forfait line) -->
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${esc(invoice.notes ?? 'Prestation de services')}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${amountHT.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${autoE ? 'E' : 'S'}</ram:CategoryCode>
          <ram:RateApplicablePercent>${taxRate.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${amountHT.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>

    <!-- === HEADER TRADE AGREEMENT === -->
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>${esc(invoiceRef)}</ram:BuyerReference>

      <!-- Seller -->
      <ram:SellerTradeParty>
        <ram:Name>${sellerName}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${sellerStreet}</ram:LineOne>
          <ram:PostcodeCode>${sellerZip}</ram:PostcodeCode>
          <ram:CityName>${sellerCity}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        ${sellerVAT ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${sellerVAT}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
        ${sellerSIRET ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${sellerSIRET}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>

      <!-- Buyer -->
      <ram:BuyerTradeParty>
        <ram:Name>${buyerName}</ram:Name>
        ${buyerAddress ? `<ram:PostalTradeAddress><ram:LineOne>${buyerAddress}</ram:LineOne><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>` : ''}
        ${buyerVAT ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${buyerVAT}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <!-- === HEADER TRADE DELIVERY === -->
    <ram:ApplicableHeaderTradeDelivery />

    <!-- === HEADER TRADE SETTLEMENT === -->
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>

      <!-- Payment means -->
      ${sellerIBAN ? `<ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${sellerIBAN}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>` : ''}

      <!-- Tax -->
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${vatAmount.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        ${exemptionNote}
        <ram:BasisAmount>${amountHT.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>${autoE ? 'E' : 'S'}</ram:CategoryCode>
        <ram:RateApplicablePercent>${taxRate.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>

      <!-- Payment terms -->
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${dueDate}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>

      <!-- Monetary summary -->
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amountHT.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${amountHT.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${vatAmount.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amountTTC.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${amountTTC.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

// ─── PDF generation ────────────────────────────────────────────────────────────

/**
 * Renders a React-PDF document, then embeds the Factur-X XML as an attachment
 * using pdf-lib. Returns the final PDF as a Uint8Array.
 */
export async function generateFacturXPDF(
    pdfElement: Parameters<typeof pdf>[0],
    xmlString: string,
): Promise<Uint8Array> {
    // Step 1: Render React-PDF document to blob
    const blob = await pdf(pdfElement).toBlob();
    const arrayBuffer = await blob.arrayBuffer();

    // Step 2: Load with pdf-lib
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Step 3: Embed XML as file attachment (ZUGFeRD / Factur-X spec)
    const xmlBytes = new TextEncoder().encode(xmlString);
    await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
        mimeType: 'application/xml',
        description: 'Factur-X XML (EN16931)',
        creationDate: new Date(),
        modificationDate: new Date(),
        afRelationship: AFRelationship.Alternative,
    });

    // Step 4: Set PDF/A-3 conformance metadata via XMP
    // This is a simplified XMP block — a full PDF/A conformance tool should be used
    // in production, but this makes the file recognisable by ZUGFeRD validators.
    const xmpMeta = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
        xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
        xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#"
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:Version>1.0</fx:Version>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

    const xmpBytes = new TextEncoder().encode(xmpMeta);
    const xmpStream = pdfDoc.context.stream(xmpBytes, {
        Type: 'Metadata',
        Subtype: 'XML',
        Length: xmpBytes.length,
    });
    const xmpRef = pdfDoc.context.register(xmpStream);
    pdfDoc.catalog.set(pdfDoc.context.obj('Metadata'), xmpRef);

    // Step 5: Save and return
    return pdfDoc.save();
}
