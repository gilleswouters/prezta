-- Seed Base Contract Templates
INSERT INTO public.contract_templates (name, description, jurisdiction, category, content, is_system)
VALUES 
-- FRANCE: Contrat de Prestation (Freelance)
(
    'Contrat de Prestation - France', 
    'Modèle standard de prestation de services pour auto-entrepreneurs et freelances en France.',
    'FR',
    'Développement / Design',
    '# CONTRAT DE PRESTATION DE SERVICES

Entre le Prestataire : **{{my_name}}**
Et le Client : **{{client_name}}**

## 1. OBJET
Le Prestataire s''engage à réaliser pour le Client les prestations suivantes : {{project_name}}.

## 2. MODALITÉS D''EXÉCUTION
Les prestations débuteront le {{start_date}}.

## 3. PRIX ET PAIEMENT
Le montant total de la prestation est fixé à {{total_price}}€.
Le paiement s''effectuera selon les modalités suivantes : {{payment_terms}}.

## 4. PROPRIÉTÉ INTELLECTUELLE
La propriété des résultats sera transférée au Client dès paiement intégral du prix.

Fait à {{my_city}}, le {{current_date}}.
',
    true
),
-- BELGIQUE: Contrat de Collaboration (Indépendant)
(
    'Contrat de Collaboration - Belgique', 
    'Modèle de contrat pour indépendants belges, incluant les clauses spécifiques aux tribunaux de Bruxelles.',
    'BE',
    'Développement / Design',
    '# CONTRAT DE COLLABORATION PROFESSIONNELLE

Parties :
- Prestataire : **{{my_name}}** (n° BCE {{my_bce}})
- Client : **{{client_name}}**

## 1. MISSION
Le Prestataire s''engage à fournir ses services pour le projet : {{project_name}}.

## 2. HONORAIRES
Le prix convenu est de {{total_price}}€ Hors TVA.
La facture sera émise dès signature du présent contrat.

## 3. LITIGES
En cas de litige, seuls les tribunaux de l''arrondissement de {{my_city}} seront compétents.

Lu et approuvé,
',
    true
),
-- SUISSE: Contrat de Mandat
(
    'Contrat de Mandat - Suisse', 
    'Contrat de mandat selon le Code des Obligations (CO) suisse.',
    'CH',
    'Général',
    '# CONTRAT DE MANDAT (SUISSE)

Entre :
**{{my_name}}**
Et :
**{{client_name}}**

## 1. MANDAT
Le mandataire s''engage à exécuter le mandat suivant : {{project_name}}.

## 2. RÉTRIBUTION
Le mandataire recevra une rétribution de {{total_price}} CHF.

## 3. DROIT APPLICABLE
Le présent contrat est soumis au Code des Obligations suisse.

Signature,
',
    true
);
