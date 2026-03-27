/**
 * Registry of all contract clause templates, organised by contract type.
 * Clause content uses {{variable}} placeholders resolved by contract-parser.ts.
 *
 * Variables available:
 *   {{nom_prestataire}}, {{adresse_prestataire}}, {{siret_prestataire}}, {{tva_prestataire}}
 *   {{nom_client}}, {{adresse_client}}
 *   {{nom_projet}}, {{date_debut}}, {{date_fin}}, {{montant_total}}
 *   {{tjm}}, {{forfait}}, {{devise}}
 *   {{acompte_percent}}, {{penalite_retard}}
 *   {{salaire_base}}, {{convention_collective}}, {{periode_essai}}
 *   {{alternance_diplome}}, {{alternance_cfa}}, {{alternance_maitre}}
 */

import type { ContractClause, ContractType, ClauseCategory } from '@/types/contract';

// ─── Helper ───────────────────────────────────────────────────────────────────

function clause(
    id: string,
    label: string,
    category: ClauseCategory,
    appliesTo: ContractType[],
    content: string,
    required = true,
    editableByUser = true,
): ContractClause {
    return { id, label, content, required, category, appliesTo, editableByUser };
}

const ALL_TYPES: ContractType[] = [
    'prestation_services',
    'regie',
    'maintenance_support',
    'cession_droits',
    'contrat_travail_cdi',
    'contrat_travail_cdd',
    'contrat_alternance',
];

const TRAVAIL_TYPES: ContractType[] = [
    'contrat_travail_cdi',
    'contrat_travail_cdd',
    'contrat_alternance',
];

const PRESTATION_TYPES: ContractType[] = [
    'prestation_services',
    'regie',
    'maintenance_support',
    'cession_droits',
];

// ─── Clause registry ──────────────────────────────────────────────────────────

export const CONTRACT_CLAUSES: ContractClause[] = [

    // ── Avertissement juridique (travail uniquement, non désactivable) ──────

    clause(
        'avertissement_juridique',
        '⚠️ Avertissement juridique',
        'avertissement_juridique',
        TRAVAIL_TYPES,
        `**AVERTISSEMENT — DROIT DU TRAVAIL**

Ce document est un modèle indicatif fourni par Prezta à titre d'exemple. Il ne constitue pas un conseil juridique. Les contrats de travail (CDI, CDD, alternance) sont soumis au Code du travail français et, le cas échéant, à la convention collective applicable.

**Consultez un avocat spécialisé en droit social ou un expert-comptable avant toute signature.**`,
        true,
        false,
    ),

    // ── Identification des parties ──────────────────────────────────────────

    clause(
        'identification_prestation',
        'Identification des parties',
        'identification',
        PRESTATION_TYPES,
        `Entre les soussignés :

**Le Prestataire**
{{nom_prestataire}}
{{adresse_prestataire}}
SIRET : {{siret_prestataire}} — TVA : {{tva_prestataire}}
(Ci-après dénommé « le Prestataire »)

**Le Client**
{{nom_client}}
{{adresse_client}}
(Ci-après dénommé « le Client »)

Il a été convenu ce qui suit :`,
        true,
        true,
    ),

    clause(
        'identification_travail',
        'Identification des parties',
        'identification',
        ['contrat_travail_cdi', 'contrat_travail_cdd'],
        `Entre les soussignés :

**L'Employeur**
{{nom_prestataire}}
{{adresse_prestataire}}
SIRET : {{siret_prestataire}}
(Ci-après dénommé « l'Employeur »)

**Le Salarié**
{{nom_client}}
(Ci-après dénommé « le Salarié »)

Il a été convenu et arrêté ce qui suit :`,
        true,
        true,
    ),

    clause(
        'identification_alternance',
        'Identification des trois parties',
        'identification',
        ['contrat_alternance'],
        `Entre les soussignés :

**L'Employeur**
{{nom_prestataire}}
{{adresse_prestataire}}
SIRET : {{siret_prestataire}}

**L'Alternant**
{{nom_client}}

**Le CFA**
{{alternance_cfa}}

Il a été convenu et arrêté ce qui suit :`,
        true,
        true,
    ),

    // ── Objet ───────────────────────────────────────────────────────────────

    clause(
        'objet_prestation',
        'Objet de la mission',
        'objet',
        ['prestation_services', 'cession_droits'],
        `Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire réalise, pour le compte du Client, la mission suivante : **{{nom_projet}}**.

Les livrables attendus, le calendrier détaillé et les modalités techniques sont définis d'un commun accord et peuvent faire l'objet d'une annexe au présent contrat.`,
        true,
        true,
    ),

    clause(
        'objet_regie',
        'Objet et bon de commande',
        'objet',
        ['regie'],
        `Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire intervient en régie pour le compte du Client sur la mission : **{{nom_projet}}**.

Les interventions sont facturées sur la base d'un taux journalier moyen (TJM) de **{{tjm}} {{devise}} HT/jour**, validé par bon de commande écrit avant chaque période d'intervention.

Le Prestataire remettra au Client un **compte-rendu d'activité (CRA) mensuel** détaillant les jours prestés, validé conjointement avant facturation.`,
        true,
        true,
    ),

    clause(
        'objet_maintenance',
        'Objet du support',
        'objet',
        ['maintenance_support'],
        `Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire assure le support et la maintenance des services suivants : **{{nom_projet}}**.

Le Prestataire s'engage à maintenir la disponibilité et la performance des services dans les limites définies aux articles SLA ci-après.`,
        true,
        true,
    ),

    clause(
        'objet_cession',
        'Objet de la création',
        'objet',
        ['cession_droits'],
        `Le présent contrat a pour objet de définir les conditions de création et de cession des droits afférents à l'œuvre suivante : **{{nom_projet}}**.

Description précise de l'œuvre : [À compléter — nature, format, dimensions, supports].`,
        true,
        true,
    ),

    clause(
        'objet_travail_cdi',
        'Qualification et poste',
        'objet',
        ['contrat_travail_cdi'],
        `Le Salarié est engagé à compter du **{{date_debut}}** en qualité de **[Intitulé du poste]**, statut **[Employé / Technicien / Cadre]**, coefficient **[XXX]** de la convention collective applicable.

Le lieu de travail habituel est : {{adresse_prestataire}}.

La durée hebdomadaire de travail est fixée à **[35 / 39] heures** par semaine.`,
        true,
        true,
    ),

    clause(
        'objet_travail_cdd',
        'Motif de recours et poste',
        'objet',
        ['contrat_travail_cdd'],
        `Le Salarié est engagé dans le cadre d'un **contrat à durée déterminée** pour le motif suivant : **[Motif légal de recours — ex : remplacement de M./Mme XXX, accroissement temporaire d'activité, etc.]**.

Poste : **[Intitulé du poste]**, coefficient **[XXX]** de la convention collective applicable.

Le lieu de travail habituel est : {{adresse_prestataire}}.`,
        true,
        true,
    ),

    clause(
        'objet_alternance',
        'Type de contrat et diplôme visé',
        'objet',
        ['contrat_alternance'],
        `Le présent contrat est conclu dans le cadre d'un contrat d'**[apprentissage / professionnalisation]**.

**Diplôme ou titre visé :** {{alternance_diplome}}
**Centre de Formation des Apprentis (CFA) :** {{alternance_cfa}}
**Maître d'apprentissage :** {{alternance_maitre}}`,
        true,
        true,
    ),

    // ── Durée ───────────────────────────────────────────────────────────────

    clause(
        'duree_prestation',
        'Durée et calendrier',
        'duree',
        ['prestation_services', 'regie', 'cession_droits'],
        `La mission débutera le **{{date_debut}}** et se terminera le **{{date_fin}}**, sauf accord contraire des parties formalisé par avenant écrit.

Toute prolongation de la mission fera l'objet d'un avenant signé des deux parties avant l'expiration du terme initial.`,
        true,
        true,
    ),

    clause(
        'duree_maintenance',
        'Durée et renouvellement',
        'duree',
        ['maintenance_support'],
        `Le présent contrat prend effet le **{{date_debut}}** pour une durée d'**un (1) an**, renouvelable par tacite reconduction par périodes successives d'un an, sauf dénonciation par l'une des parties avec un préavis de **trois (3) mois** avant le terme.`,
        true,
        true,
    ),

    clause(
        'duree_cdi',
        'Durée du contrat',
        'duree',
        ['contrat_travail_cdi'],
        `Le présent contrat est conclu pour une **durée indéterminée** à compter du **{{date_debut}}**.

**Période d'essai :** {{periode_essai}} mois, renouvelable une fois avec l'accord exprès des deux parties, conformément à la convention collective applicable.`,
        true,
        true,
    ),

    clause(
        'duree_cdd',
        'Durée et terme du CDD',
        'duree',
        ['contrat_travail_cdd'],
        `Le présent contrat est conclu pour une durée déterminée allant du **{{date_debut}}** au **{{date_fin}}**.

Il ne pourra être renouvelé que dans les conditions et limites prévues par le Code du travail.

À l'échéance du terme, le Salarié percevra une **indemnité de fin de contrat (précarité) égale à 10 % de la rémunération totale brute** perçue pendant la durée du contrat, sauf dans les cas d'exclusion légalement prévus.`,
        true,
        true,
    ),

    clause(
        'duree_alternance',
        'Durée et calendrier de l\'alternance',
        'duree',
        ['contrat_alternance'],
        `Le contrat débute le **{{date_debut}}** et se termine le **{{date_fin}}**.

**Période d'essai :** 45 jours ouvrés (pour le contrat d'apprentissage), conformément à l'article L. 6222-18 du Code du travail.

Le calendrier de présence en entreprise et au CFA est défini par l'annexe pédagogique jointe au présent contrat.`,
        true,
        true,
    ),

    // ── Rémunération ────────────────────────────────────────────────────────

    clause(
        'remuneration_forfait',
        'Rémunération — forfait',
        'remuneration',
        ['prestation_services', 'cession_droits'],
        `En contrepartie des prestations réalisées, le Client versera au Prestataire la somme de **{{forfait}} {{devise}} HT** pour l'ensemble de la mission.

Un acompte de **{{acompte_percent}} %** du montant total HT sera versé à la signature du présent contrat, le solde étant dû à la livraison finale et validation des travaux.`,
        true,
        true,
    ),

    clause(
        'remuneration_tjm',
        'Rémunération — TJM',
        'remuneration',
        ['regie'],
        `La facturation est établie sur la base d'un **taux journalier moyen (TJM) de {{tjm}} {{devise}} HT/jour**.

Le nombre de jours prestés est arrêté mensuellement par CRA co-signé. La facturation intervient en fin de mois sur la base du CRA validé.`,
        true,
        true,
    ),

    clause(
        'remuneration_maintenance',
        'Rémunération du support',
        'remuneration',
        ['maintenance_support'],
        `Le Client versera au Prestataire une redevance forfaitaire de **{{forfait}} {{devise}} HT/mois**, payable le 1er de chaque mois par virement bancaire.

Cette redevance est révisable annuellement selon l'indice Syntec publié par l'INSEE.`,
        true,
        true,
    ),

    clause(
        'remuneration_salaire',
        'Rémunération brute mensuelle',
        'remuneration',
        ['contrat_travail_cdi', 'contrat_travail_cdd'],
        `Le Salarié percevra une **rémunération brute mensuelle de {{salaire_base}} €**, versée le dernier jour ouvré de chaque mois.

**Convention collective applicable :** {{convention_collective}}.

Le Salarié bénéficie des congés payés légaux (5 semaines par an) et des avantages en nature ou en espèces prévus par ladite convention collective.`,
        true,
        true,
    ),

    clause(
        'remuneration_alternance',
        'Rémunération selon barème légal',
        'remuneration',
        ['contrat_alternance'],
        `La rémunération de l'alternant est calculée conformément au barème légal en vigueur fixé par les articles L. 6222-27 et D. 6222-26 du Code du travail (apprentissage) ou L. 6325-8 (professionnalisation).

Le montant mensuel brut est précisé dans l'annexe financière jointe au présent contrat et sera actualisé à chaque anniversaire du contrat.`,
        true,
        true,
    ),

    // ── Paiement ────────────────────────────────────────────────────────────

    clause(
        'paiement',
        'Modalités de paiement et pénalités de retard',
        'paiement',
        PRESTATION_TYPES,
        `Les factures sont payables par virement bancaire dans un délai de **30 jours** à compter de leur réception.

Tout retard de paiement entraîne de plein droit, sans mise en demeure préalable :
- Des **pénalités de retard** calculées au taux de **{{penalite_retard}} fois le taux d'intérêt légal** (art. L. 441-10 du Code de commerce) ;
- Une **indemnité forfaitaire de recouvrement de 40 €** (art. D. 441-5 du Code de commerce).`,
        true,
        true,
    ),

    // ── Livrables ───────────────────────────────────────────────────────────

    clause(
        'livrables',
        'Livrables et validation',
        'livrables',
        ['prestation_services', 'cession_droits'],
        `Les livrables attendus sont définis en annexe ou dans le devis joint au présent contrat.

Le Client dispose d'un délai de **7 jours calendaires** à compter de la remise de chaque livrable pour formuler des réserves motivées par écrit. Passé ce délai sans réserves, les livrables sont réputés acceptés.

Toute demande de modification substantielle du périmètre fera l'objet d'un avenant tarifé.`,
        true,
        true,
    ),

    // ── SLA ─────────────────────────────────────────────────────────────────

    clause(
        'sla',
        'Niveaux de service (SLA)',
        'sla',
        ['maintenance_support'],
        `Le Prestataire s'engage à respecter les niveaux de service suivants :

| Criticité | Temps de réponse | Temps de résolution cible |
|-----------|-----------------|--------------------------|
| Critique  | 2 heures        | 8 heures ouvrées         |
| Haute     | 4 heures        | 24 heures ouvrées        |
| Normale   | 1 jour ouvré    | 5 jours ouvrés           |

**Plages horaires de support :** du lundi au vendredi, de 9h à 18h (hors jours fériés français).

Les incidents hors plage horaire sont traités au niveau de service "Normale" sauf accord spécifique.`,
        true,
        true,
    ),

    clause(
        'exclusions_garantie',
        'Exclusions de garantie',
        'sla',
        ['maintenance_support'],
        `Le Prestataire ne peut être tenu responsable des incidents causés par :
- Des modifications apportées au système par le Client ou un tiers sans accord préalable ;
- Des défaillances d'infrastructure tierces (hébergeur, opérateur réseau, services cloud) ;
- Un usage manifestement contraire aux préconisations techniques du Prestataire.`,
        true,
        true,
    ),

    // ── Propriété intellectuelle ─────────────────────────────────────────────

    clause(
        'propriete_intellectuelle',
        'Propriété intellectuelle',
        'propriete_intellectuelle',
        ['prestation_services', 'regie', 'maintenance_support'],
        `L'ensemble des créations réalisées par le Prestataire dans le cadre de la présente mission demeure sa propriété exclusive jusqu'au paiement intégral du prix convenu.

À réception du paiement complet, les droits patrimoniaux d'auteur sont cédés au Client, à titre exclusif, pour le monde entier et toute la durée légale de protection.`,
        false,
        true,
    ),

    clause(
        'cession_droits_clause',
        'Cession des droits patrimoniaux',
        'propriete_intellectuelle',
        ['cession_droits'],
        `**CLAUSE ESSENTIELLE — NON DÉSACTIVABLE**

Toutes les créations réalisées par le Prestataire dans le cadre de la présente mission demeurent sa propriété jusqu'au paiement intégral du prix convenu, date à laquelle les droits patrimoniaux sont cédés au Client pour :

- **Domaine d'utilisation :** [À compléter — ex : reproduction, représentation, adaptation]
- **Durée :** [À compléter — ex : toute la durée légale de protection]
- **Support :** [À compléter — ex : tout support numérique et physique]
- **Territoire :** monde entier

Le Prestataire garantit être l'auteur unique des œuvres et disposer de tous les droits nécessaires à cette cession.`,
        true,
        false, // non-désactivable
    ),

    clause(
        'garantie_eviction',
        'Garantie d\'éviction',
        'propriete_intellectuelle',
        ['cession_droits'],
        `Le Prestataire garantit au Client la jouissance paisible des droits cédés contre tout trouble, revendication ou éviction de tiers. À ce titre, le Prestataire prend à sa charge la défense du Client en cas d'action en contrefaçon intentée par un tiers.`,
        true,
        true,
    ),

    // ── Confidentialité ─────────────────────────────────────────────────────

    clause(
        'confidentialite',
        'Confidentialité',
        'confidentialite',
        ALL_TYPES,
        `Chaque partie s'engage à garder strictement confidentielles toutes les informations de nature confidentielle communiquées par l'autre partie dans le cadre de l'exécution du présent contrat.

Cette obligation de confidentialité est valable pendant toute la durée du contrat et pour une période de **cinq (5) ans** après son terme.`,
        true,
        true,
    ),

    // ── Non-concurrence ──────────────────────────────────────────────────────

    clause(
        'non_concurrence',
        'Non-concurrence',
        'non_concurrence',
        [...PRESTATION_TYPES, 'contrat_travail_cdi', 'contrat_travail_cdd'] as ContractType[],
        `Le Prestataire s'engage à ne pas exercer, directement ou indirectement, une activité concurrente à celle du Client pendant une durée de **[X] mois** après la fin du présent contrat, dans un rayon géographique de **[zone]**.

Cette clause ne s'applique que si elle est raisonnablement limitée dans le temps, l'espace et son objet, et est assortie d'une contrepartie financière (pour les salariés, conformément à la jurisprudence de la Cour de cassation).`,
        false,
        true,
    ),

    // ── Résiliation ─────────────────────────────────────────────────────────

    clause(
        'resiliation_prestation',
        'Résiliation anticipée',
        'resiliation',
        PRESTATION_TYPES,
        `Le présent contrat peut être résilié par l'une ou l'autre des parties en cas de manquement grave non réparé dans un délai de **15 jours** suivant mise en demeure par lettre recommandée avec accusé de réception.

En cas de résiliation anticipée à l'initiative du Client, les prestations réalisées jusqu'à la date effective de résiliation sont dues intégralement.`,
        true,
        true,
    ),

    clause(
        'resiliation_maintenance',
        'Résiliation avec préavis',
        'resiliation',
        ['maintenance_support'],
        `Chaque partie peut résilier le présent contrat à l'issue de la période initiale d'un an, moyennant un préavis de **trois (3) mois** notifié par lettre recommandée avec accusé de réception.

En cas de faute grave, la résiliation peut être prononcée sans préavis.`,
        true,
        true,
    ),

    clause(
        'resiliation_travail',
        'Rupture du contrat',
        'resiliation',
        ['contrat_travail_cdi', 'contrat_travail_cdd'],
        `La rupture du présent contrat est régie par les dispositions du Code du travail en vigueur.

Pour le CDI : démission, licenciement pour motif personnel ou économique, rupture conventionnelle homologuée, retraite.

Pour le CDD : rupture anticipée possible uniquement d'un commun accord écrit, en cas de faute grave, force majeure, ou embauche en CDI par le salarié.`,
        true,
        true,
    ),

    // ── Litiges ─────────────────────────────────────────────────────────────

    clause(
        'litiges_commercial',
        'Résolution des litiges',
        'litiges',
        PRESTATION_TYPES,
        `En cas de litige relatif à l'interprétation ou à l'exécution du présent contrat, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire.

À défaut d'accord dans un délai de **30 jours**, le litige sera soumis au **tribunal compétent du ressort du siège social du Prestataire**.

Le présent contrat est régi par le **droit français**.`,
        true,
        true,
    ),

    clause(
        'litiges_prudhommes',
        'Résolution des litiges — Conseil de prud\'hommes',
        'litiges',
        TRAVAIL_TYPES,
        `Tout litige relatif à l'exécution ou à la rupture du présent contrat de travail est de la compétence exclusive du **Conseil de prud'hommes** du lieu de travail.

Le présent contrat est régi par le **Code du travail français** et la **convention collective applicable**.`,
        true,
        true,
    ),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns all clauses applicable to a given contract type, in display order. */
export function getClausesForType(type: ContractType): ContractClause[] {
    return CONTRACT_CLAUSES.filter(c => c.appliesTo.includes(type));
}

/** Returns required clauses for a contract type. */
export function getRequiredClauses(type: ContractType): ContractClause[] {
    return getClausesForType(type).filter(c => c.required);
}

/** Returns optional clauses for a contract type. */
export function getOptionalClauses(type: ContractType): ContractClause[] {
    return getClausesForType(type).filter(c => !c.required);
}

/** Human-readable labels for contract types. */
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
    prestation_services:  'Contrat de prestation de services',
    regie:                'Contrat de régie (TJM)',
    maintenance_support:  'Contrat de maintenance / support',
    cession_droits:       'Contrat de cession de droits',
    contrat_travail_cdi:  'Contrat de travail — CDI',
    contrat_travail_cdd:  'Contrat de travail — CDD',
    contrat_alternance:   'Contrat d\'alternance',
};

export const CONTRACT_TYPE_DESCRIPTIONS: Record<ContractType, string> = {
    prestation_services:  'Mission à livrable unique ou forfait. Idéal pour dev, design, consulting.',
    regie:                'Facturation au TJM. Compte-rendu d\'activité mensuel requis.',
    maintenance_support:  'Support récurrent avec engagement de niveau de service (SLA).',
    cession_droits:       'Création artistique ou intellectuelle avec transfert de droits au client.',
    contrat_travail_cdi:  'Embauche en CDI. Régi par le Code du travail et la convention collective.',
    contrat_travail_cdd:  'Contrat à durée déterminée avec motif légal obligatoire.',
    contrat_alternance:   'Apprentissage ou professionnalisation avec un CFA partenaire.',
};

export const TRAVAIL_CONTRACT_TYPES: ContractType[] = [
    'contrat_travail_cdi',
    'contrat_travail_cdd',
    'contrat_alternance',
];

export const CATEGORY_LABELS: Record<string, string> = {
    identification:          'Identification des parties',
    objet:                   'Objet & Mission',
    duree:                   'Durée',
    remuneration:            'Rémunération',
    paiement:                'Paiement',
    livrables:               'Livrables',
    propriete_intellectuelle: 'Propriété intellectuelle',
    confidentialite:         'Confidentialité',
    non_concurrence:         'Non-concurrence',
    sla:                     'Niveaux de service',
    resiliation:             'Résiliation',
    avertissement_juridique: 'Avertissement',
    litiges:                 'Résolution des litiges',
};
