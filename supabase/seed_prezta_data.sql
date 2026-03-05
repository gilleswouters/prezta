-- PREZTA SEED DATA (v4)
-- Instructions: 
-- 1. Get your User ID from Supabase (Authentication -> Users)
-- 2. Replace 'YOUR_USER_ID_HERE' with your real User ID in the first line below.
-- 3. Run this script in the Supabase SQL Editor.

DO $$ 
DECLARE 
    target_user_id UUID := 'f10e2733-92fd-41c8-8992-880af4a12da4'; -- <--- REPLACE THIS
    client_id_1 UUID := gen_random_uuid();
    client_id_2 UUID := gen_random_uuid();
    client_id_3 UUID := gen_random_uuid();
    client_id_4 UUID := gen_random_uuid();
    client_id_5 UUID := gen_random_uuid();
    client_id_6 UUID := gen_random_uuid();
    client_id_7 UUID := gen_random_uuid();
    client_id_8 UUID := gen_random_uuid();
    client_id_9 UUID := gen_random_uuid();
    client_id_10 UUID := gen_random_uuid();
BEGIN
    -- 1. DELETE EXISTING DATA (Optional, but helps for a clean test)
    -- DELETE FROM time_entries WHERE user_id = target_user_id;
    -- DELETE FROM tasks WHERE user_id = target_user_id;
    -- DELETE FROM invoices WHERE user_id = target_user_id;
    -- DELETE FROM projects WHERE user_id = target_user_id;
    -- DELETE FROM products WHERE user_id = target_user_id;
    -- DELETE FROM clients WHERE user_id = target_user_id;

    -- 2. INSERT CLIENTS (10)
    INSERT INTO clients (id, user_id, name, email, phone, address, vat_number, notes) VALUES
    (client_id_1, target_user_id, 'Studio Design Pro', 'contact@studiodesign.fr', '+33 1 23 45 67 89', '12 rue de la Paix, 75002 Paris', 'FR12345678901', 'Client fidèle, design UI/UX'),
    (client_id_2, target_user_id, 'E-commerce Solutions', 'info@ecom-sol.be', '+32 2 345 67 89', 'Avenue Louise 150, 1050 Bruxelles', 'BE0987654321', 'Boutique en ligne Shopify'),
    (client_id_3, target_user_id, 'Vins & Terroirs', 'vin@terroir.ch', '+41 21 345 67 89', 'Rue de Bourg 10, 1003 Lausanne', 'CHE-123.456.789', 'Site vitrine + Catalogue'),
    (client_id_4, target_user_id, 'Boulangerie Artisanale', 'boulange@gmail.com', '+33 4 56 78 90 12', 'Place du Marché, 69002 Lyon', NULL, 'Paiements souvent en retard'),
    (client_id_5, target_user_id, 'Tech Startup Inc', 'admin@techstartup.com', '+33 1 98 76 54 32', 'Station F, 75013 Paris', 'FR98765432109', 'Application SaaS complexes'),
    (client_id_6, target_user_id, 'Consulting Group', 'contact@consultgroup.be', '+32 475 12 34 56', 'Rue de la Loi 200, 1000 Bruxelles', 'BE0123456789', 'Audit digital annuel'),
    (client_id_7, target_user_id, 'Hotel Les Cimes', 'booking@lescimes.fr', '+33 4 50 12 34 56', 'Route des Alpes, 74400 Chamonix', 'FR56473829102', 'Nouveau site web responsive'),
    (client_id_8, target_user_id, 'Bio Market', 'hello@biomarket.ch', '+41 44 123 45 67', 'Bahnhofstrasse 45, 8001 Zurich', 'CHE-987.654.321', 'Refonte identité visuelle'),
    (client_id_9, target_user_id, 'Association Sportive', 'sport@club.fr', '+33 5 56 78 90 23', 'Rue des Sports, 33000 Bordeaux', NULL, 'Petit budget, besoins simples'),
    (client_id_10, target_user_id, 'Architecture & Co', 'arch@office.fr', '+33 1 45 67 89 01', 'Boulevard Raspail, 75006 Paris', 'FR09812376543', 'Portfolio haute qualité');

    -- 3. INSERT PRODUCTS (15 - Web Designer)
    INSERT INTO products (user_id, name, description, unit_price, tva_rate, unit, is_favorite) VALUES
    (target_user_id, 'Audit UX/UI', 'Analyse complète de l''expérience utilisateur et du design actuel', 750.00, 20.00, 'forfait', true),
    (target_user_id, 'Atelier Design Thinking', 'Session d''idéation et de définition du projet (4h)', 120.00, 20.00, 'heure', false),
    (target_user_id, 'Charte Graphique complète', 'Logo, palette, typographies et guide de style', 1800.00, 20.00, 'forfait', true),
    (target_user_id, 'Maquette Haute Fidélité (Mobile)', 'Design Figma par écran complexe', 95.00, 20.00, 'heure', false),
    (target_user_id, 'Landing Page Conversion', 'Design et développement d''une page de vente performante', 1200.00, 20.00, 'forfait', true),
    (target_user_id, 'Développement Web (Heure)', 'Intégration React / Next.js', 110.00, 20.00, 'heure', false),
    (target_user_id, 'Maintenance Mensuelle', 'Mises à jour et corrections mineures', 250.00, 20.00, 'forfait', false),
    (target_user_id, 'Optimisation SEO Technique', 'Audit et corrections pour le référencement naturel', 800.00, 20.00, 'forfait', false),
    (target_user_id, 'Intégration CMS (Webflow/Shopify)', 'Configuration et mise en ligne du contenu', 1500.00, 20.00, 'forfait', true),
    (target_user_id, 'Design System (Base)', 'Bibliothèque de composants Figma réutilisables', 2500.00, 20.00, 'forfait', false),
    (target_user_id, 'Iconographie personnalisée', 'Pack de 10 icônes sur mesure', 45.00, 20.00, 'pièce', false),
    (target_user_id, 'Formation Gestion Site Web', 'Formation de l''équipe client (par demi-journée)', 450.00, 20.00, 'jour', false),
    (target_user_id, 'Accompagnement Stratégique', 'Conseil mensuel sur l''évolution digitale', 150.00, 20.00, 'heure', false),
    (target_user_id, 'Refonte Logo', 'Modernisation d''un logo existant', 600.00, 20.00, 'forfait', false),
    (target_user_id, 'Pack Réseaux Sociaux', 'Templates Canva pour posts et stories (15 templates)', 350.00, 20.00, 'forfait', false);

    -- 4. INSERT PROJECTS (6)
    INSERT INTO projects (user_id, client_id, name, description, status) VALUES
    (target_user_id, client_id_1, 'Refonte Studio 2026', 'Nouveau site web vitrine pour le studio', 'in_progress'),
    (target_user_id, client_id_2, 'Migration Shopify E-com', 'Transfert de PrestaShop vers Shopify', 'in_progress'),
    (target_user_id, client_id_3, 'E-boutique Vins', 'Projet de vente en ligne direct producteur', 'draft'),
    (target_user_id, client_id_5, 'Dashboard SaaS Logic', 'Interface administration complexe pour startup', 'completed'),
    (target_user_id, client_id_7, 'Site Réservation Cimes', 'Système de booking pour l''hôtel', 'completed'),
    (target_user_id, client_id_10, 'Portfolio Minimaliste', 'Exposition des travaux d''architecture', 'draft');

    -- 5. INSERT INITIAL INVOICES (For Dashboard visibility)
    INSERT INTO invoices (user_id, client_id, project_id, amount, status, due_date, paid_date, notes) VALUES
    (target_user_id, client_id_5, (SELECT id FROM projects WHERE name = 'Dashboard SaaS Logic' LIMIT 1), '4200.00', 'payé', now() - interval '30 days', now() - interval '28 days', 'Facture finale payée'),
    (target_user_id, client_id_7, (SELECT id FROM projects WHERE name = 'Site Réservation Cimes' LIMIT 1), '1200.00', 'payé', now() - interval '5 days', now() - interval '2 days', 'Acompte versé'),
    (target_user_id, client_id_1, (SELECT id FROM projects WHERE name = 'Refonte Studio 2026' LIMIT 1), '1800.00', 'en_attente', now() + interval '15 days', NULL, 'Attente virement'),
    (target_user_id, client_id_2, (SELECT id FROM projects WHERE name = 'Migration Shopify E-com' LIMIT 1), '950.00', 'en_retard', now() - interval '10 days', NULL, 'Relance à envoyer');

END $$;
