-- INITIALISATION COMPLÈTE DES CONTRATS PREZTA
-- Ce script est auto-suffisant et gère les types, les tables et les données.

-- 1. Création des Types (si inexistants)
DO $$ BEGIN
    CREATE TYPE user_country AS ENUM ('FR', 'BE', 'CH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tables des Modèles
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    jurisdiction user_country NOT NULL DEFAULT 'FR',
    category TEXT DEFAULT 'general',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can view system templates" ON public.contract_templates;
    CREATE POLICY "Anyone can view system templates" 
        ON public.contract_templates FOR SELECT 
        USING (is_system = true OR user_id = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can manage own templates" ON public.contract_templates;
    CREATE POLICY "Users can manage own templates" 
        ON public.contract_templates FOR ALL 
        USING (user_id = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Table des Contrats par Projet
CREATE TABLE IF NOT EXISTS public.project_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    signed_at TIMESTAMPTZ,
    signature_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation RLS
ALTER TABLE public.project_contracts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own project contracts" ON public.project_contracts;
    CREATE POLICY "Users can view own project contracts" 
        ON public.project_contracts FOR SELECT 
        USING (user_id = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can manage own project contracts" ON public.project_contracts;
    CREATE POLICY "Users can manage own project contracts" 
        ON public.project_contracts FOR ALL 
        USING (user_id = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 4. Nettoyage et Insertion des Modèles de Base
DELETE FROM public.contract_templates WHERE is_system = true;

INSERT INTO public.contract_templates (name, description, jurisdiction, category, content, is_system)
VALUES 
(
    'Contrat de Prestation - France', 
    'Modèle standard professionnel pour freelances et auto-entrepreneurs en France.',
    'FR',
    'Développement / Design',
    '# CONTRAT DE PRESTATION DE SERVICES

**ENTRE LES SOUSSIGNÉS :**

**{{my_name}}**
Dont le siège social est situé à : {{my_city}}
Numéro SIRET : {{my_bce}}  -  TVA : {{my_vat}}
Ci-après désigné "Le Prestataire", d''une part,

**ET :**

**{{client_name}}**
Dont le siège social est situé à : {{client_address}}
Ci-après désigné "Le Client", d''autre part.

Il a été exposé et convenu ce qui suit :

## ARTICLE 1 : OBJET DU CONTRAT
Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire s''engage à fournir au Client les prestations de services suivantes : **{{project_name}}** (désignées ci-après "la Mission").

## ARTICLE 2 : OBLIGATIONS DU PRESTATAIRE
Le Prestataire s''engage à mettre en œuvre tous les moyens nécessaires à la bonne exécution de la Mission, conformément aux règles de l''art de sa profession. Il s''agit d''une obligation de moyens et non de résultat. Il organisera son travail en toute indépendance et sans lien de subordination.

## ARTICLE 3 : OBLIGATIONS DU CLIENT
Le Client s''engage à fournir au Prestataire toutes les informations, ressources et documents nécessaires à la bonne exécution de la Mission, dans les délais impartis.

## ARTICLE 4 : CONDITIONS FINANCIÈRES
En rémunération de la Mission, le Client s''engage à payer au Prestataire la somme de **{{total_price}} €**.
Les paiements s''effectueront selon les modalités suivantes : {{payment_terms}}.
En cas de retard de paiement, des pénalités de retard calculées sur la base de 3 fois le taux d''intérêt légal en vigueur seront exigibles, ainsi qu''une indemnité forfaitaire pour frais de recouvrement de 40 €.

## ARTICLE 5 : PROPRIÉTÉ INTELLECTUELLE
La propriété des droits d''auteur, et plus généralement de tous les éléments incorporels nés de l''exécution de la Mission, ne sera transférée au Client qu''après paiement intégral du prix convenu à l''Article 4.

## ARTICLE 6 : JURIDICTION COMPÉTENTE
En cas de litige relatif à l''interprétation ou à l''exécution du présent contrat, et à défaut de résolution à l''amiable, attribution exclusive de juridiction est faite aux tribunaux compétents dont dépend le siège du Prestataire.

Fait à {{my_city}}, le {{current_date}},
En deux exemplaires originaux.

**Pour le Prestataire**  
{{my_name}}

**Pour le Client**  
{{client_name}}
',
    true
),
(
    'Contrat de Collaboration - Belgique', 
    'Modèle formel B2B pour indépendants belges.',
    'BE',
    'Développement / Design',
    '# CONTRAT DE COLLABORATION INDÉPENDANTE

**ENTRE LES PARTIES :**

D''une part,
**{{my_name}}**
Établi à : {{my_city}}
Inscrit à la BCE sous le numéro : {{my_bce}} - Numéro de TVA : {{my_vat}}
Ci-après dénommé "Le Prestataire",

Et d''autre part,
**{{client_name}}**
Établi à : {{client_address}}
Ci-après dénommé "Le Client".

**IL A ÉTÉ CONVENU CE QUI SUIT :**

## ARTICLE 1 : OBJET DE LA COLLABORATION
Le Client confie au Prestataire, qui l''accepte, l''exécution des missions indépendantes suivantes : **{{project_name}}**.
Le Prestataire agit en toute indépendance et autonomie, sans aucun lien de subordination à l''égard du Client.

## ARTICLE 2 : EXÉCUTION DE LA MISSION
Le Prestataire organise son travail librement. La mission débute le {{start_date}}. Le Prestataire n''est soumis à aucun horaire ni aucune contrainte disciplinaire du Client.

## ARTICLE 3 : HONORAIRES ET PAIEMENT
En contrepartie de l''exécution de ces missions, le Client paiera au Prestataire une rémunération globale fixée à **{{total_price}} €** (hors TVA).
Les factures du Prestataire sont payables selon les conditions suivantes : {{payment_terms}}.
Toute facture impayée à l''échéance portera de plein droit un intérêt de retard de 10% l''an, ainsi qu''une indemnité forfaitaire de 10% avec un minimum de 65 €.

## ARTICLE 4 : CONFIDENTIALITÉ ET NON-CONCURRENCE
Le Prestataire s''engage à conserver la plus stricte confidentialité concernant les informations auxquelles il aurait accès dans le cadre de sa mission.

## ARTICLE 5 : DROIT APPLICABLE ET TRIBUNAUX COMPÉTENTS
Le présent contrat est régi par le droit belge. Tout litige relèvera de la compétence exclusive des tribunaux de l''arrondissement judiciaire de {{my_city}}.

Fait à {{my_city}}, le {{current_date}},
En deux exemplaires, chaque partie reconnaissant avoir reçu le sien.

**Le Prestataire**  
{{my_name}}

**Le Client**  
{{client_name}}
',
    true
),
(
    'Contrat de Mandat - Suisse', 
    'Contrat de mandat de type professionnel selon l''art 394 CO suisse.',
    'CH',
    'Général',
    '# CONTRAT DE MANDAT (ART. 394 ET SS CO)

**ENTRE :**

**{{my_name}}**
Ayant son siège à : {{my_city}}
Numéro IDE/TVA : {{my_vat}}
Ci-après "Le Mandataire",

**ET :**

**{{client_name}}**
Ayant son siège à : {{client_address}}
Ci-après "Le Mandant".

**IL EST PRÉALABLEMENT EXPOSÉ CE QUI SUIT :**

## 1. OBJET DU MANDAT
Le Mandant confie au Mandataire, qui l''accepte, la mission suivante : **{{project_name}}** (ci-après "le Mandat").

## 2. OBLIGATIONS DU MANDATAIRE
Le Mandataire s''engage à exécuter le Mandat avec soin et diligence, en sauvegardant fidèlement les intérêts du Mandant. Il rend occasionnellement compte de son activité au Mandant.

## 3. OBLIGATIONS DU MANDANT
Le Mandant s''engage à fournir tous les renseignements nécessaires, de manière complète et dans les délais, et à payer la rétribution convenue à l''Article 4.

## 4. RÉTRIBUTION
Pour l''exécution de son Mandat, le Mandataire percevra des honoraires fixés à **{{total_price}} CHF**.
Le paiement s''effectuera à 30 jours nets. Les frais extraordinaires de la mission seront remboursés sur présentation de justificatifs.

## 5. RÉSILIATION
Conformément à l''art. 404 CO, le Mandat peut être révoqué ou répudié en tout temps par chacune des parties. Si la résiliation intervient en temps inopportun ou entraîne un dommage sans faute de l''autre partie, la partie qui s''en départit est tenue d''indemniser l''autre pour le dommage causé.

## 6. FOR ET DROIT APPLICABLE
Le présent contrat est soumis au droit matériel suisse, en particulier les dispositions sur le mandat (art. 394 et suivants du Code des Obligations). 
Le for juridique exclusif est situé au domicile du Mandataire ({{my_city}}).

Fait à {{my_city}}, le {{current_date}}, en deux exemplaires.

**Le Mandataire**  
{{my_name}}

**Le Mandant**  
{{client_name}}
',
    true
);
