-- Migration: 00017_seed_system_templates.sql
-- Seeds 4 French-law system contract templates into contract_templates table.
-- These are read-only for users (is_system = TRUE, user_id = NULL).

INSERT INTO public.contract_templates (user_id, name, description, content, jurisdiction, category, is_system)
VALUES

-- 1. Contrat de prestation de services
(NULL,
'Contrat de prestation de services',
'Modèle standard pour missions freelance B2B. Couvre objet, durée, prix, propriété intellectuelle et confidentialité.',
$$Entre les soussignés :

**Le Prestataire**
{{my_name}}
{{my_address}}
SIRET : {{my_bce}} — TVA : {{my_vat}}
(Ci-après dénommé « le Prestataire »)

**Le Client**
{{client_name}}
{{client_address}}
(Ci-après dénommé « le Client »)

Il a été convenu ce qui suit :

## Article 1 – Objet

Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire réalise, pour le compte du Client, la prestation suivante : {{project_name}}.

Les modalités détaillées de la prestation (livrables, cahier des charges, planning) sont définies d'un commun accord et peuvent être annexées au présent contrat.

## Article 2 – Durée

La mission débutera le {{start_date}}. La durée est fixée d'un commun accord entre les parties. Toute prolongation fera l'objet d'un avenant écrit signé des deux parties.

## Article 3 – Prix et modalités de paiement

En contrepartie des prestations réalisées, le Client versera au Prestataire la somme de {{total_price}} € HT.

Le paiement sera effectué par virement bancaire sous 30 jours à compter de la réception de chaque facture. Tout retard de paiement entraîne l'application de pénalités de retard conformément à l'article L. 441-10 du Code de commerce, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement.

## Article 4 – Obligations du Prestataire

Le Prestataire s'engage à exécuter les prestations avec soin, diligence et professionnalisme, dans le respect des règles de l'art. Il est tenu à une obligation de moyens. Il s'engage à informer le Client de toute difficulté susceptible d'affecter le bon déroulement de la mission.

## Article 5 – Obligations du Client

Le Client s'engage à fournir au Prestataire en temps utile toutes les informations, accès et ressources nécessaires à la bonne exécution de la mission. Il s'engage à régler les factures dans les délais convenus et à désigner un interlocuteur unique pour le suivi de la mission.

## Article 6 – Propriété intellectuelle

Les droits de propriété intellectuelle afférents aux livrables produits dans le cadre de la mission sont cédés au Client à titre exclusif, pour le monde entier et pour toute la durée légale de protection, à compter du paiement intégral des sommes dues. Jusqu'à ce paiement, le Prestataire reste titulaire de l'ensemble de ces droits.

## Article 7 – Confidentialité

Chaque partie s'engage à garder strictement confidentielle toute information de nature confidentielle communiquée par l'autre partie dans le cadre de l'exécution du présent contrat. Cette obligation de confidentialité est valable pendant toute la durée du contrat et pour une période de cinq (5) ans après son terme.

## Article 8 – Responsabilité

La responsabilité du Prestataire est limitée au montant total des sommes perçues au titre du présent contrat. En aucun cas le Prestataire ne pourra être tenu responsable de dommages indirects, consécutifs ou immatériels.

## Article 9 – Résiliation

Le présent contrat peut être résilié par l'une ou l'autre des parties en cas de manquement grave aux obligations contractuelles non réparé dans un délai de 15 jours suivant mise en demeure par lettre recommandée avec accusé de réception.

## Article 10 – Loi applicable et juridiction

Le présent contrat est régi par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable préalablement à tout recours judiciaire. À défaut d'accord, le tribunal compétent sera celui du siège social du Prestataire.

---

Fait en deux exemplaires originaux, le {{start_date}}.

**Pour le Prestataire :**                    **Pour le Client :**

{{my_name}}                                    {{client_name}}

Signature :___________________              Signature :___________________$$,
'FR', 'Prestation de services', TRUE),

-- 2. Accord de confidentialité (NDA)
(NULL,
'Accord de confidentialité (NDA)',
'Accord de non-divulgation mutuel pour protéger les informations échangées dans le cadre d''une collaboration.',
$$Entre les soussignés :

**Partie A (Prestataire)**
{{my_name}}
{{my_address}}
SIRET : {{my_bce}}
(Ci-après dénommée « la Partie A »)

**Partie B (Client)**
{{client_name}}
{{client_address}}
(Ci-après dénommée « la Partie B »)

Ensemble dénommées « les Parties ».

## Article 1 – Objet et contexte

Les Parties envisagent ou entretiennent une relation d'affaires dans le cadre du projet : {{project_name}}.

Dans ce contexte, chaque Partie peut être amenée à communiquer à l'autre des informations confidentielles. Le présent accord a pour objet de définir les conditions de protection de ces informations.

## Article 2 – Définition des informations confidentielles

Sont considérées comme confidentielles toutes les informations, données, documents, savoir-faire techniques, commerciaux ou financiers, de quelque nature que ce soit, communiqués par une Partie à l'autre, oralement, par écrit ou par tout autre moyen, et clairement désignés comme confidentiels ou dont la nature confidentielle est évidente au regard du contexte.

Ne sont pas considérées comme confidentielles les informations qui : (a) étaient déjà connues du récipiendaire avant la communication ; (b) sont ou deviennent accessibles au public sans faute du récipiendaire ; (c) ont été obtenues légitimement d'un tiers non soumis à une obligation de confidentialité ; (d) ont été développées de manière indépendante.

## Article 3 – Obligations de confidentialité

Chaque Partie s'engage à : (i) garder strictement confidentielles les informations reçues ; (ii) ne les utiliser qu'aux fins de l'évaluation ou de l'exécution du projet mentionné à l'article 1 ; (iii) ne les divulguer qu'aux collaborateurs ou sous-traitants qui en ont un besoin strict et qui sont eux-mêmes soumis à une obligation de confidentialité équivalente.

## Article 4 – Durée

Le présent accord prend effet à compter de sa signature et reste en vigueur pendant toute la durée de la relation d'affaires entre les Parties, ainsi que pour une période de cinq (5) ans après la fin de ladite relation ou la résiliation du présent accord.

## Article 5 – Restitution des informations

À la demande de la Partie divulgatrice, ou au terme du présent accord, le récipiendaire s'engage à restituer ou détruire, dans les meilleurs délais, tous les documents et supports contenant des informations confidentielles, en conservant toutefois les copies requises par la loi.

## Article 6 – Sanctions

Tout manquement aux obligations du présent accord expose la Partie défaillante à des dommages et intérêts, sans préjudice de toute autre action légale applicable, y compris en cas d'urgence par voie de référé.

## Article 7 – Loi applicable

Le présent accord est soumis au droit français. Tout litige sera soumis aux tribunaux compétents du ressort du siège social de la Partie A, après tentative de règlement amiable.

---

Fait en deux exemplaires, le {{start_date}}.

**Partie A :**                                **Partie B :**

{{my_name}}                                    {{client_name}}

Signature :___________________              Signature :___________________$$,
'FR', 'Accord de confidentialité', TRUE),

-- 3. Conditions Générales de Vente (CGV)
(NULL,
'Conditions Générales de Vente (CGV)',
'CGV complètes pour freelance : tarifs, délais de paiement, propriété intellectuelle, responsabilité et litiges.',
$$**CONDITIONS GÉNÉRALES DE VENTE**

{{my_name}} — {{my_address}} — SIRET : {{my_bce}} — TVA : {{my_vat}}

(Ci-après « le Prestataire »)

## Article 1 – Champ d'application

Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les prestations de services réalisées par le Prestataire au profit de ses clients professionnels (ci-après « le Client »). Elles prévalent sur tout autre document émanant du Client, notamment ses conditions générales d'achat.

Toute commande passée auprès du Prestataire implique l'acceptation sans réserve des présentes CGV.

## Article 2 – Devis et commandes

Toute prestation fait l'objet d'un devis préalable établi par le Prestataire, valable 30 jours à compter de sa date d'émission. Le contrat est conclu dès lors que le Client retourne le devis signé avec la mention « Bon pour accord », accompagné, le cas échéant, de l'acompte demandé.

## Article 3 – Tarifs

Les tarifs sont libellés en euros HT. Le Prestataire se réserve le droit de modifier ses tarifs à tout moment, étant entendu que les prestations en cours restent facturées au tarif convenu.

## Article 4 – Conditions de paiement

Les factures sont payables par virement bancaire à réception, sauf accord contraire mentionné sur le devis. Tout retard de paiement entraîne, de plein droit et sans mise en demeure préalable : (i) des pénalités de retard calculées au taux de trois fois le taux d'intérêt légal (art. L.441-10 C. com.) ; (ii) une indemnité forfaitaire pour frais de recouvrement de 40 € (art. D.441-5 C. com.).

## Article 5 – Acompte et facturation intermédiaire

Un acompte de 30 % du montant HT total pourra être demandé à la signature du devis. Pour les missions longues, une facturation intermédiaire par jalons peut être convenue. Le solde est facturé à la livraison des travaux.

## Article 6 – Délais d'exécution

Les délais de réalisation sont indiqués à titre prévisionnel dans le devis. Ils ne sont engageants qu'à condition que le Client fournisse dans les délais prévus tous les éléments nécessaires à l'exécution de la mission.

## Article 7 – Propriété intellectuelle

L'ensemble des créations réalisées par le Prestataire dans le cadre de ses missions demeure sa propriété exclusive jusqu'au règlement intégral de la facture correspondante. À réception du paiement complet, les droits patrimoniaux d'auteur sont cédés au Client, à titre exclusif, pour le monde entier et toute la durée légale de protection.

## Article 8 – Responsabilité

La responsabilité du Prestataire est expressément limitée au montant HT des prestations facturées au titre de la commande en cause. Le Prestataire ne saurait être tenu responsable des dommages indirects, pertes d'exploitation ou manque à gagner subis par le Client.

## Article 9 – Confidentialité

Le Prestataire s'engage à ne pas divulguer à des tiers les informations confidentielles du Client. Cette obligation s'étend à ses collaborateurs et sous-traitants.

## Article 10 – Résiliation

En cas de résiliation anticipée à l'initiative du Client, les prestations réalisées jusqu'à la date de résiliation sont dues intégralement, augmentées d'une indemnité forfaitaire équivalant à 20 % du montant restant dû.

## Article 11 – Loi applicable et litiges

Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à tenter une résolution amiable. À défaut, le tribunal du siège social du Prestataire sera seul compétent.

---

Dernière mise à jour : {{start_date}} — {{my_name}}$$,
'FR', 'Conditions Générales de Vente', TRUE),

-- 4. Ordre de mission freelance
(NULL,
'Ordre de mission freelance',
'Document simple de commande pour une mission à livrable précis, avec planning, livrables et conditions de paiement.',
$$**ORDRE DE MISSION N° ___**

**Prestataire :**
{{my_name}}
{{my_address}}
SIRET : {{my_bce}} — TVA : {{my_vat}}

**Client :**
{{client_name}}
{{client_address}}

**Mission :** {{project_name}}
**Date de début :** {{start_date}}
**Montant total HT :** {{total_price}} €

---

## Article 1 – Description de la mission

Le Prestataire s'engage à réaliser la mission décrite ci-dessus pour le compte du Client. Les livrables attendus, le planning détaillé et les conditions techniques de réalisation sont définis d'un commun accord et peuvent être joints en annexe au présent document.

## Article 2 – Conditions d'exécution

Le Prestataire travaille en totale autonomie dans l'organisation de son temps et de ses méthodes de travail. Il n'est lié au Client par aucun lien de subordination. La mission est réalisée dans les locaux du Prestataire, sauf accord contraire pour les phases nécessitant une présence sur site.

## Article 3 – Livrables et validation

À l'issue de chaque phase de la mission, le Prestataire soumet ses livrables au Client. Le Client dispose de 7 jours calendaires pour valider les livrables ou formuler des réserves motivées par écrit. Passé ce délai, les livrables sont réputés acceptés.

## Article 4 – Rémunération

En contrepartie de la mission, le Client versera au Prestataire la somme de {{total_price}} € HT selon l'échéancier suivant :
- 30 % à la signature du présent ordre de mission
- 40 % à mi-parcours (validation intermédiaire)
- 30 % à la livraison finale et validation

Les paiements sont effectués par virement bancaire dans les 15 jours suivant réception de chaque facture.

## Article 5 – Modifications de périmètre

Toute modification du périmètre initial de la mission, demandée par le Client, fera l'objet d'un avenant écrit signé des deux parties, précisant les nouvelles modalités et, le cas échéant, le supplément de rémunération correspondant.

## Article 6 – Propriété intellectuelle

L'ensemble des droits de propriété intellectuelle sur les livrables est cédé au Client à titre exclusif, pour le monde entier, à compter du paiement intégral de toutes les sommes dues au titre du présent ordre de mission.

## Article 7 – Droit applicable

Le présent ordre de mission est soumis au droit français. Tout litige sera soumis au tribunal du siège social du Prestataire, après tentative de règlement amiable.

---

**Bon pour accord — Le {{start_date}}**

**Le Prestataire :**                          **Le Client :**

{{my_name}}                                    {{client_name}}

Signature :___________________              Signature :___________________$$,
'FR', 'Mission freelance', TRUE);
