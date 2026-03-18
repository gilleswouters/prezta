-- ============================================================
-- SEED: 5 Test Clients + Projects + Invoices + Tasks
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

DO $$
DECLARE
    uid UUID := 'f10e2733-92fd-41c8-8992-880af4a12da4';

    c1 UUID := gen_random_uuid(); -- Agence Lune
    c2 UUID := gen_random_uuid(); -- FitTracker SAS
    c3 UUID := gen_random_uuid(); -- BioNord SARL
    c4 UUID := gen_random_uuid(); -- Nexus Analytics
    c5 UUID := gen_random_uuid(); -- Maison Duroc

    p1 UUID := gen_random_uuid(); -- Refonte Brand Agence Lune
    p2 UUID := gen_random_uuid(); -- App Mobile FitTracker
    p3 UUID := gen_random_uuid(); -- Site E-commerce BioNord
    p4 UUID := gen_random_uuid(); -- Dashboard Analytics Nexus
    p5 UUID := gen_random_uuid(); -- Identité Visuelle Maison Duroc
BEGIN

    -- ── 1. Clients (with full legal info) ────────────────────

    INSERT INTO clients (id, user_id, name, email, phone, address, vat_number, siret, legal_status, notes)
    VALUES
        (c1, uid,
         'Agence Lune SAS',
         'hello@agence-lune.fr',
         '+33 1 44 55 66 77',
         '8 rue Oberkampf, 75011 Paris',
         'FR 24 512 345 678',   -- TVA intracommunautaire
         '51234567800012',      -- SIRET 14 chiffres
         'sas',
         'Agence créative parisienne, réactive et bon payeur'),

        (c2, uid,
         'FitTracker SAS',
         'tech@fittracker.io',
         '+33 6 12 34 56 78',
         '23 avenue Montaigne, 75008 Paris',
         'FR 87 498 765 432',
         '49876543200034',
         'sas',
         'Startup sport-tech, levée de fonds série A en 2025'),

        (c3, uid,
         'BioNord SARL',
         'contact@bionord.fr',
         '+33 3 20 11 22 33',
         '17 rue du Faubourg National, 59000 Lille',
         'FR 61 423 987 654',
         '42398765400056',
         'sarl',
         'E-commerce bio et local, paiement comptant'),

        (c4, uid,
         'Nexus Analytics SA',
         'admin@nexus-analytics.fr',
         '+33 4 72 00 11 22',
         'Tour Incity, 84 quai Charles de Gaulle, 69006 Lyon',
         'FR 03 778 234 901',
         '77823490100078',
         'sa',
         'Grand compte logistique, conditions paiement net-60'),

        (c5, uid,
         'Maison Duroc SASU',
         'contact@maisonduroc.com',
         '+33 5 56 67 78 89',
         'Allée des Vignes, Château Duroc, 33250 Pauillac',
         'FR 55 314 567 890',
         '31456789000090',
         'sasu',
         'Domaine viticole prestige, segment luxe');

    -- ── 2. Projects ──────────────────────────────────────────

    INSERT INTO projects (id, user_id, client_id, name, description, status, created_at, updated_at)
    VALUES
        (p1, uid, c1,
         'Refonte Brand Agence Lune',
         'Refonte identité visuelle complète : logo, charte graphique, templates réseaux sociaux et kit de marque.',
         'in_progress', NOW() - INTERVAL '45 days', NOW() - INTERVAL '2 days'),

        (p2, uid, c2,
         'App Mobile FitTracker',
         'Design UX/UI + prototype Figma haute fidélité pour une app de suivi fitness iOS/Android.',
         'in_progress', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),

        (p3, uid, c3,
         'Site E-commerce BioNord',
         'Création d''une boutique en ligne Shopify avec catalogue produits bio, paiement CB et livraison locale.',
         'draft', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

        (p4, uid, c4,
         'Dashboard Analytics Nexus',
         'Interface de pilotage KPI temps réel pour un grand compte en logistique. Stack React + Supabase.',
         'completed', NOW() - INTERVAL '90 days', NOW() - INTERVAL '15 days'),

        (p5, uid, c5,
         'Identité Visuelle Maison Duroc',
         'Création d''une identité premium : logo, étiquettes bouteilles, site vitrine et supports print.',
         'in_progress', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days');

    -- ── 3. Invoices ──────────────────────────────────────────

    INSERT INTO invoices (user_id, client_id, project_id, amount, status, due_date, paid_date, notes, created_at)
    VALUES
        -- Nexus: payé — gonfle le CA encaissé
        (uid, c4, p4, 5800.00, 'payé',
         NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days',
         'Facture finale — projet livré et validé', NOW() - INTERVAL '90 days'),

        (uid, c4, p4, 2900.00, 'payé',
         NOW() - INTERVAL '50 days', NOW() - INTERVAL '48 days',
         'Acompte 50% au démarrage', NOW() - INTERVAL '90 days'),

        -- Agence Lune: en attente
        (uid, c1, p1, 1800.00, 'en_attente',
         NOW() + INTERVAL '14 days', NULL,
         'Facture intermédiaire — jalon 1 validé', NOW() - INTERVAL '20 days'),

        -- FitTracker: en RETARD — apparaît dans Actions Requises
        (uid, c2, p2, 3200.00, 'en_retard',
         NOW() - INTERVAL '35 days', NULL,
         'Relance envoyée le 01/03 — sans réponse', NOW() - INTERVAL '60 days'),

        -- BioNord: en attente
        (uid, c3, p3, 950.00, 'en_attente',
         NOW() + INTERVAL '30 days', NULL,
         'Acompte 30% à la commande', NOW() - INTERVAL '5 days');

    -- ── 4. Tasks ─────────────────────────────────────────────

    INSERT INTO tasks (user_id, project_id, title, description, status, priority, due_date, created_at)
    VALUES
        -- Urgente < 48h → Actions Requises
        (uid, p1,
         'Livraison maquettes finales Agence Lune',
         'Envoyer les fichiers Figma exportés + guide de style PDF au client.',
         'todo', 'high', NOW() + INTERVAL '20 hours', NOW() - INTERVAL '3 days'),

        -- Haute priorité en retard → Actions Requises
        (uid, p2,
         'Corriger les retours UX Sprint 3',
         'Intégrer les 7 retours client FitTracker sur l''onboarding mobile.',
         'in_progress', 'high', NOW() - INTERVAL '1 day', NOW() - INTERVAL '10 days'),

        -- Tâche normale
        (uid, p5,
         'Validation palette couleurs Maison Duroc',
         'Présenter 3 propositions de palette aux propriétaires du domaine.',
         'todo', 'medium', NOW() + INTERVAL '7 days', NOW() - INTERVAL '5 days'),

        -- Terminée (projet completed)
        (uid, p4,
         'Déploiement dashboard en production',
         'Mise en ligne sur l''infra AWS du client — tests de charge validés.',
         'done', 'high', NOW() - INTERVAL '16 days', NOW() - INTERVAL '20 days');

END $$;
