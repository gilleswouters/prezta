-- ─── Profession templates seed ────────────────────────────────────────────────
-- Run this AFTER migration 00040 in the Supabase SQL Editor.

-- Clear existing seed data (idempotent re-run)
TRUNCATE public.profession_tasks CASCADE;
TRUNCATE public.profession_templates CASCADE;

INSERT INTO public.profession_templates (slug, nom, categorie, icon) VALUES
  -- Numérique & Tech
  ('developpeur-web',                'Développeur web / mobile',              'Numérique & Tech',          '💻'),
  ('designer-graphique',             'Graphiste / Designer',                  'Numérique & Tech',          '🎨'),
  ('web-designer',                   'Web designer',                          'Numérique & Tech',          '🖥️'),
  ('developpeur-app',                'Développeur d''applications',           'Numérique & Tech',          '📱'),
  ('expert-ia',                      'Expert en IA',                          'Numérique & Tech',          '🤖'),
  ('consultant-marketing-digital',   'Consultant en marketing digital',       'Numérique & Tech',          '📊'),
  ('monteur-video',                  'Monteur vidéo',                         'Numérique & Tech',          '🎬'),
  ('testeur-jeux',                   'Testeur de jeux vidéo',                 'Numérique & Tech',          '🎮'),
  -- Création & Médias
  ('photographe',                    'Photographe / Vidéaste',                'Création & Médias',         '📷'),
  ('redacteur',                      'Rédacteur / Copywriter',                'Création & Médias',         '✍️'),
  ('copywriter',                     'Copywriter (Concepteur-rédacteur)',     'Création & Médias',         '🖊️'),
  ('illustrateur',                   'Illustrateur freelance',                'Création & Médias',         '🖌️'),
  ('blogueur',                       'Blogueur',                              'Création & Médias',         '📝'),
  ('podcasteur',                     'Podcasteur',                            'Création & Médias',         '🎙️'),
  ('youtubeur',                      'YouTubeur',                             'Création & Médias',         '▶️'),
  ('influenceur',                    'Influenceur',                           'Création & Médias',         '⭐'),
  ('traducteur',                     'Traducteur(trice)',                     'Création & Médias',         '🌐'),
  ('editeur-correcteur',             'Éditeur / Correcteur',                  'Création & Médias',         '📖'),
  ('transcripteur',                  'Transcripteur audio',                   'Création & Médias',         '🎧'),
  -- Conseil & Formation
  ('consultant-coach',               'Consultant / Coach',                    'Conseil & Formation',       '🧭'),
  ('formateur',                      'Formateur / Enseignant',                'Conseil & Formation',       '🏫'),
  ('professeur-particulier',         'Professeur particulier',                'Conseil & Formation',       '📚'),
  ('coach-sante',                    'Coach santé / bien-être',               'Conseil & Formation',       '🏃'),
  ('conseiller-orientation',         'Conseiller d''orientation',             'Conseil & Formation',       '🎯'),
  ('redacteur-subvention',           'Rédacteur de demandes de subvention',   'Conseil & Formation',       '📋'),
  ('instructeur-webinar',            'Instructeur pour webinar',              'Conseil & Formation',       '💡'),
  ('preparateur-impots',             'Préparateur d''impôts',                 'Conseil & Formation',       '🧾'),
  -- Artisanat & BTP
  ('electricien',                    'Électricien / Artisan BTP',             'Artisanat & BTP',           '⚡'),
  ('plombier',                       'Plombier / Chauffagiste',               'Artisanat & BTP',           '🔧'),
  ('architecte',                     'Architecte / Décorateur',               'Artisanat & BTP',           '🏗️'),
  ('paysagiste',                     'Paysagiste',                            'Artisanat & BTP',           '🌿'),
  ('bricoleur',                      'Bricoleur',                             'Artisanat & BTP',           '🔨'),
  ('home-staging',                   'Professionnel du home staging',         'Artisanat & BTP',           '🏠'),
  ('decorateur',                     'Décorateur d''intérieur',               'Artisanat & BTP',           '🛋️'),
  ('tailleur',                       'Tailleur',                              'Artisanat & BTP',           '✂️'),
  ('fleuriste',                      'Fleuriste',                             'Artisanat & BTP',           '💐'),
  ('createur-bijoux',                'Créateur de bijoux',                    'Artisanat & BTP',           '💎'),
  -- Bien-être & Beauté
  ('maquilleur',                     'Maquilleur(euse)',                      'Bien-être & Beauté',        '💄'),
  ('massotherapeute',                'Massothérapeute',                       'Bien-être & Beauté',        '💆'),
  ('coach-prive',                    'Coach privé',                           'Bien-être & Beauté',        '🏋️'),
  ('doula',                          'Doula',                                 'Bien-être & Beauté',        '🤱'),
  -- Services à la personne
  ('aide-personne',                  'Aide à la personne',                    'Services à la personne',    '🤝'),
  ('nettoyage',                      'Nettoyage à domicile',                  'Services à la personne',    '🧹'),
  ('coach-rangement',                'Coach en rangement',                    'Services à la personne',    '📦'),
  ('personal-shopper',               'Personal shopper',                      'Services à la personne',    '🛍️'),
  ('promeneur-chiens',               'Promeneur de chiens / Pet sitter',      'Services à la personne',    '🐕'),
  ('toiletteur',                     'Toiletteur animalier',                  'Services à la personne',    '✂️'),
  ('jardinier',                      'Jardinier',                             'Services à la personne',    '🌱'),
  ('chauffeur-vtc',                  'Chauffeur de VTC',                      'Services à la personne',    '🚗'),
  -- Événementiel & Animation
  ('animateur',                      'Animateur',                             'Événementiel & Animation',  '🎉'),
  ('dj',                             'DJ',                                    'Événementiel & Animation',  '🎧'),
  ('organisateur-evenements',        'Organisateur d''événements',            'Événementiel & Animation',  '📅'),
  ('agent-publicitaire',             'Agent publicitaire',                    'Événementiel & Animation',  '📢'),
  -- Mode & Style
  ('styliste',                       'Styliste',                              'Mode & Style',              '👗'),
  ('redacteur-cv',                   'Rédacteur de CV',                       'Mode & Style',              '📄'),
  ('createur-paniers',               'Créateur de paniers cadeaux',           'Mode & Style',              '🎁'),
  -- Commerce & Divers
  ('ecommercant',                    'E-commerçant',                          'Commerce & Divers',         '🛒'),
  ('proprietaire-gite',              'Propriétaire d''un gîte',               'Commerce & Divers',         '🏡'),
  ('saisie-donnees',                 'Spécialiste en saisie de données',      'Commerce & Divers',         '⌨️'),
  ('sondages',                       'Petits jobs en ligne / Sondages',       'Commerce & Divers',         '📊'),
  ('comptable',                      'Comptable / Expert-comptable',          'Commerce & Divers',         '💰');


-- ─── Helper: insert tasks for a given profession slug ─────────────────────────

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'developpeur-web')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Création de site vitrine',       'Site web complet jusqu''à 5 pages',                     'forfait', 20.00, 1),
  ('Développement d''application web','Application web sur mesure',                            'forfait', 20.00, 2),
  ('Maintenance mensuelle',          'Mises à jour et corrections',                           'forfait', 20.00, 3),
  ('Audit de performance',           'Analyse et optimisation de la vitesse du site',         'forfait', 20.00, 4),
  ('Formation utilisateur',          'Formation à la prise en main du site',                  'heure',   20.00, 5),
  ('Intégration API',                'Connexion à des services tiers (Stripe, Zapier…)',       'forfait', 20.00, 6),
  ('Refonte graphique',              'Nouveau design et intégration front-end',                'forfait', 20.00, 7),
  ('SEO technique',                  'Optimisation pour les moteurs de recherche',             'forfait', 20.00, 8)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'designer-graphique')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Identité visuelle',              'Création de logo et charte graphique complète',          'forfait', 20.00, 1),
  ('Supports print',                 'Flyers, brochures et affiches',                          'forfait', 20.00, 2),
  ('Conception de bannières',        'Bannières pour réseaux sociaux et publicités',           'forfait', 20.00, 3),
  ('Infographie',                    'Création d''infographies personnalisées',                'forfait', 20.00, 4),
  ('Motion design',                  'Animation courte (After Effects ou équivalent)',         'forfait', 20.00, 5),
  ('Mockup produit',                 'Mise en scène de produit ou packaging',                  'forfait', 20.00, 6),
  ('Révision de visuels',            'Correction et adaptation de fichiers existants',         'heure',   20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'web-designer')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Design UI/UX',                   'Conception d''interfaces utilisateur complètes',         'forfait', 20.00, 1),
  ('Maquettage Figma',               'Wireframes et prototypes interactifs',                   'forfait', 20.00, 2),
  ('Intégration HTML/CSS',           'Intégration pixel-perfect d''une maquette',              'forfait', 20.00, 3),
  ('Landing page',                   'Page de conversion optimisée pour campagne',             'forfait', 20.00, 4),
  ('Design système',                 'Création d''un design system cohérent',                  'forfait', 20.00, 5),
  ('Audit UX',                       'Analyse de l''expérience utilisateur et recommandations','forfait', 20.00, 6),
  ('Responsive design',              'Adaptation mobile et tablette d''un site existant',      'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'developpeur-app')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Application mobile iOS/Android', 'Développement d''application native ou hybride',         'forfait', 20.00, 1),
  ('Application React Native',       'Application cross-platform iOS et Android',              'forfait', 20.00, 2),
  ('Débogage et corrections',        'Identification et résolution de bugs',                   'heure',   20.00, 3),
  ('Déploiement App Store/Play Store','Publication et mise en ligne de l''application',        'forfait', 20.00, 4),
  ('Intégration notifications push', 'Mise en place des notifications temps réel',             'forfait', 20.00, 5),
  ('Maintenance applicative',        'Suivi et mises à jour de l''application',                'forfait', 20.00, 6),
  ('Audit de code',                  'Revue de code et recommandations d''amélioration',       'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'expert-ia')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Automatisation de processus',    'Mise en place d''agents IA pour automatiser des tâches', 'forfait', 20.00, 1),
  ('Fine-tuning de modèle',          'Personnalisation d''un LLM sur vos données métier',      'forfait', 20.00, 2),
  ('Prompt engineering',             'Optimisation des prompts pour vos usages métier',        'heure',   20.00, 3),
  ('Formation IA en entreprise',     'Sensibilisation et formation à l''utilisation de l''IA', 'heure',   20.00, 4),
  ('Audit IA',                       'Identification des opportunités d''automatisation',      'forfait', 20.00, 5),
  ('Développement de chatbot',       'Création d''un assistant conversationnel sur mesure',    'forfait', 20.00, 6),
  ('Intégration API IA',             'Connexion et configuration d''API OpenAI / Anthropic',   'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'consultant-marketing-digital')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Stratégie digitale',             'Élaboration d''une roadmap marketing complète',          'forfait', 20.00, 1),
  ('Gestion réseaux sociaux',        'Animation et publication mensuelle sur vos comptes',     'forfait', 20.00, 2),
  ('Campagne Google Ads',            'Création et gestion de campagnes publicitaires',         'forfait', 20.00, 3),
  ('Email marketing',                'Conception et envoi de campagnes d''emailing',           'forfait', 20.00, 4),
  ('SEO éditorial',                  'Rédaction et optimisation de contenus SEO',              'forfait', 20.00, 5),
  ('Audit marketing',                'Analyse de la présence digitale et recommandations',     'forfait', 20.00, 6),
  ('Reporting mensuel',              'Suivi des KPIs et rapport d''analytics',                 'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'monteur-video')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Montage YouTube',                'Montage complet d''une vidéo longue format',             'forfait', 20.00, 1),
  ('Reels et TikTok',                'Montage de vidéos courtes pour réseaux sociaux',         'forfait', 20.00, 2),
  ('Vidéo institutionnelle',         'Film d''entreprise professionnel',                       'forfait', 20.00, 3),
  ('Sous-titrage',                   'Ajout de sous-titres et incrustations textuelles',       'forfait', 20.00, 4),
  ('Color grading',                  'Étalonnage colorimétrique professionnel',                'forfait', 20.00, 5),
  ('Motion graphics',                'Animations et génériques personnalisés',                 'forfait', 20.00, 6),
  ('Podcast vidéo',                  'Montage de session podcast en format vidéo',             'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'testeur-jeux')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Test fonctionnel',               'Session de test de jeu vidéo fonctionnel',               'heure',   20.00, 1),
  ('Rapport de bugs',                'Rédaction d''un rapport de bugs détaillé',                'forfait', 20.00, 2),
  ('Test de régression',             'Vérification de la stabilité après mise à jour',         'forfait', 20.00, 3),
  ('Test d''accessibilité',          'Évaluation de l''expérience et accessibilité joueur',    'forfait', 20.00, 4),
  ('Scénarios de test',              'Documentation des cas de test et critères',               'forfait', 20.00, 5),
  ('Test de performance',            'Analyse des performances et du taux de FPS',             'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'photographe')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Shooting photo',                 'Séance photo professionnelle sur site',                  'séance',  20.00, 1),
  ('Retouche photo',                 'Post-production et édition d''images',                   'heure',   20.00, 2),
  ('Reportage événementiel',         'Couverture photo complète d''un événement',              'forfait', 20.00, 3),
  ('Photo de produit',               'Photographie packshot et lifestyle produit',             'forfait', 20.00, 4),
  ('Vidéo corporate',                'Tournage et montage d''une vidéo professionnelle',       'forfait', 20.00, 5),
  ('Prise de vue drone',             'Photographie aérienne par drone',                        'forfait', 20.00, 6),
  ('Portrait professionnel',         'Séance portrait LinkedIn ou site web',                   'séance',  20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'redacteur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Article de blog SEO',            'Rédaction d''un article optimisé pour le référencement', 'forfait', 20.00, 1),
  ('Fiche produit',                  'Description produit optimisée pour e-commerce',          'forfait', 20.00, 2),
  ('Livre blanc',                    'Rédaction d''un livre blanc ou étude de cas',            'forfait', 20.00, 3),
  ('Newsletter',                     'Rédaction et structuration d''une newsletter',           'forfait', 20.00, 4),
  ('Audit éditorial',                'Analyse de la stratégie de contenu existante',           'forfait', 20.00, 5),
  ('Script vidéo',                   'Rédaction de script pour YouTube ou publicité',          'forfait', 20.00, 6),
  ('Textes web',                     'Rédaction des pages d''un site web',                     'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'copywriter')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Page de vente',                  'Rédaction d''une landing page persuasive',               'forfait', 20.00, 1),
  ('Email de vente',                 'Séquence d''emails de conversion automatisée',           'forfait', 20.00, 2),
  ('Publicité Facebook/Instagram',   'Textes d''annonces publicitaires performantes',          'forfait', 20.00, 3),
  ('Slogan et baseline',             'Création de slogans percutants pour une marque',         'forfait', 20.00, 4),
  ('Script publicitaire',            'Rédaction de script pour spot radio ou vidéo',           'forfait', 20.00, 5),
  ('Biographie / À propos',          'Rédaction de présentation professionnelle',              'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'illustrateur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Illustration éditoriale',        'Illustration pour article, couverture ou magazine',     'forfait', 20.00, 1),
  ('Création de personnage',         'Design de personnages ou de mascotte de marque',         'forfait', 20.00, 2),
  ('Illustration livre jeunesse',    'Illustration pour album ou roman illustré',             'forfait', 20.00, 3),
  ('BD / Storyboard',                'Réalisation de planches de bande dessinée',             'forfait', 20.00, 4),
  ('Flash de tatouage',              'Design de flash pour tatouage unique',                   'forfait', 20.00, 5),
  ('Impression sur produit',         'Visuel pour tote bag, t-shirt ou packaging',             'forfait', 20.00, 6),
  ('Art digital / NFT',              'Création d''œuvres numériques ou NFT',                   'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'blogueur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Article long format',            'Rédaction d''un article de plus de 1 500 mots',         'forfait', 20.00, 1),
  ('Optimisation SEO',               'Audit et amélioration d''articles existants',            'forfait', 20.00, 2),
  ('Gestion de blog',                'Publication et animation mensuelle du blog',             'forfait', 20.00, 3),
  ('Stratégie de contenu',           'Calendrier éditorial et ligne éditoriale',               'forfait', 20.00, 4),
  ('Intégration affiliation',        'Mise en place de liens partenaires',                     'forfait', 20.00, 5),
  ('Newsletter hebdomadaire',        'Rédaction et envoi d''une lettre d''information',        'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'podcasteur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Production d''épisode',          'Enregistrement et montage audio complet',               'forfait', 20.00, 1),
  ('Jingle et intro',                'Création de l''identité sonore du podcast',              'forfait', 20.00, 2),
  ('Retranscription',                'Transcription complète d''un épisode',                   'forfait', 20.00, 3),
  ('Distribution',                   'Mise en ligne sur toutes les plateformes d''écoute',    'forfait', 20.00, 4),
  ('Interview invité',               'Organisation et conduite d''un entretien',               'forfait', 20.00, 5),
  ('Stratégie podcast',              'Conception du concept, du format et du positionnement',  'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'youtubeur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Création de vidéo',              'Tournage et montage d''une vidéo complète',              'forfait', 20.00, 1),
  ('Miniature YouTube',              'Création de vignette optimisée pour le CTR',             'forfait', 20.00, 2),
  ('Script vidéo',                   'Rédaction et structuration du contenu',                  'forfait', 20.00, 3),
  ('SEO YouTube',                    'Optimisation du titre, description, tags et chapitres',  'forfait', 20.00, 4),
  ('Partenariat de marque',          'Collaboration sponsorisée intégrée',                     'forfait', 20.00, 5),
  ('Community management',           'Réponse aux commentaires et modération',                 'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'influenceur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Post sponsorisé Instagram',      'Publication de contenu branded sur le feed',             'forfait', 20.00, 1),
  ('Story sponsorisée',              'Série de stories promotionnelles',                       'forfait', 20.00, 2),
  ('Reel de marque',                 'Création d''un reel en partenariat',                     'forfait', 20.00, 3),
  ('Review de produit',              'Test et avis produit en vidéo ou texte',                 'forfait', 20.00, 4),
  ('Unboxing',                       'Présentation et déballage de produit',                   'forfait', 20.00, 5),
  ('Ambassadeur de marque',          'Partenariat long terme et représentation',               'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'traducteur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Traduction document',            'Traduction d''un document officiel ou commercial',       'forfait', 20.00, 1),
  ('Traduction site web',            'Traduction complète d''un site internet',                'forfait', 20.00, 2),
  ('Relecture de traduction',        'Correction et amélioration d''une traduction existante', 'heure',   20.00, 3),
  ('Localisation logiciel',          'Adaptation d''interface pour un marché local',           'forfait', 20.00, 4),
  ('Interprétation',                 'Interprétation simultanée ou consécutive',               'heure',   20.00, 5),
  ('Sous-titrage',                   'Traduction et synchronisation de sous-titres',           'forfait', 20.00, 6),
  ('Traduction légale',              'Document juridique avec certification assermentée',      'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'editeur-correcteur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Correction orthographique',      'Correction complète d''un texte (fautes et coquilles)', 'forfait', 20.00, 1),
  ('Réécriture assistée IA',         'Amélioration de style et de clarté assistée par IA',    'forfait', 20.00, 2),
  ('Reformulation',                  'Réécriture pour fluidité et lisibilité',                 'heure',   20.00, 3),
  ('Vérification factuelle',         'Vérification des données et des sources',                'heure',   20.00, 4),
  ('Relecture finale',               'Vérification finale avant publication',                  'forfait', 20.00, 5),
  ('Mise en forme de rapport',       'Structuration et mise en page d''un document',           'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'transcripteur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Transcription audio',            'Retranscription verbatim d''un fichier audio',           'heure',   20.00, 1),
  ('Transcription vidéo',            'Retranscription à partir d''une vidéo',                  'heure',   20.00, 2),
  ('Compte-rendu de réunion',        'Synthèse structurée et minutée d''une réunion',          'forfait', 20.00, 3),
  ('Sous-titrage',                   'Création d''un fichier SRT synchronisé',                 'forfait', 20.00, 4),
  ('Transcription médicale',         'Retranscription de dictée médicale',                     'heure',   20.00, 5),
  ('Transcription juridique',        'Audiences, actes notariés et pièces judiciaires',        'heure',   20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'consultant-coach')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Audit stratégique',              'Analyse approfondie et recommandations de direction',   'forfait', 20.00, 1),
  ('Coaching individuel',            'Accompagnement personnalisé en séance',                  'séance',  20.00, 2),
  ('Atelier collectif',              'Animation d''un workshop en groupe',                     'jour',    20.00, 3),
  ('Plan d''action',                 'Élaboration d''une feuille de route stratégique',        'forfait', 20.00, 4),
  ('Bilan de compétences',           'Accompagnement professionnel complet (24h)',             'forfait', 20.00, 5),
  ('Conférence',                     'Intervention en conférence ou table ronde',              'forfait', 20.00, 6),
  ('Suivi mensuel',                  'Accompagnement régulier par visioconférence',            'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'formateur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Formation présentielle',         'Session de formation en salle',                          'jour',    20.00, 1),
  ('Formation en ligne',             'Module e-learning asynchrone',                           'forfait', 20.00, 2),
  ('Contenu pédagogique',            'Conception de supports de cours et exercices',           'forfait', 20.00, 3),
  ('Webinaire',                      'Conférence en ligne interactive',                        'forfait', 20.00, 4),
  ('Coaching post-formation',        'Accompagnement individuel après la formation',           'heure',   20.00, 5),
  ('Préparation à certification',    'Préparation intensive à un examen ou certification',     'forfait', 20.00, 6),
  ('Ingénierie pédagogique',         'Conception complète d''un parcours de formation',        'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'professeur-particulier')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Cours particulier',              'Cours à domicile ou en visioconférence',                 'heure',   20.00, 1),
  ('Cours en groupe',                'Cours pour petit groupe de 2 à 5 élèves',                'heure',   20.00, 2),
  ('Préparation aux examens',        'Révisions intensives pour examens ou concours',          'séance',  20.00, 3),
  ('Remise à niveau',                'Programme de soutien scolaire personnalisé',             'forfait', 20.00, 4),
  ('Cours de langue',                'Cours d''anglais, espagnol ou autre langue',             'heure',   20.00, 5),
  ('Cours de musique',               'Solfège, guitare, piano ou autre instrument',            'heure',   20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'coach-sante')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Bilan initial',                  'Évaluation de la condition physique et des objectifs',   'séance',  20.00, 1),
  ('Programme personnalisé',         'Création d''un programme nutrition et sport adapté',     'forfait', 20.00, 2),
  ('Séance de coaching',             'Accompagnement individuel en séance',                    'séance',  20.00, 3),
  ('Suivi hebdomadaire',             'Contrôle et ajustement du programme',                   'forfait', 20.00, 4),
  ('Atelier bien-être entreprise',   'Animation d''ateliers groupe en entreprise',             'forfait', 20.00, 5),
  ('Coaching en ligne',              'Accompagnement complet à distance',                      'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'conseiller-orientation')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Bilan d''orientation',           'Évaluation des aptitudes et des intérêts',               'séance',  20.00, 1),
  ('Accompagnement post-bac',        'Aide à la construction du dossier Parcoursup',           'forfait', 20.00, 2),
  ('Réorientation professionnelle',  'Accompagnement adulte en reconversion',                  'forfait', 20.00, 3),
  ('Préparation aux entretiens',     'Simulation et coaching d''entretiens',                   'séance',  20.00, 4),
  ('Rédaction de CV et lettre',      'Aide à la rédaction de candidature',                     'forfait', 20.00, 5),
  ('Suivi personnalisé',             'Accompagnement régulier dans le projet',                 'séance',  20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'redacteur-subvention')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Montage de dossier',             'Rédaction complète d''un dossier de subvention',         'forfait', 20.00, 1),
  ('Veille subventions',             'Identification des aides et financements disponibles',   'forfait', 20.00, 2),
  ('Audit de financement',           'Analyse des financements potentiels pour le projet',     'forfait', 20.00, 3),
  ('Rapport d''activité',            'Rédaction du rapport pour organisme financeur',          'forfait', 20.00, 4),
  ('Suivi de dossier',               'Accompagnement du dossier jusqu''à la décision',         'forfait', 20.00, 5),
  ('Formation aux subventions',      'Formation aux bonnes pratiques de financement',          'heure',   20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'instructeur-webinar')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Webinaire live',                 'Animation d''un webinaire en direct',                    'forfait', 20.00, 1),
  ('Montage du replay',              'Édition et mise en ligne de la rediffusion',             'forfait', 20.00, 2),
  ('Création de slides',             'Conception des supports de présentation',                'forfait', 20.00, 3),
  ('Scénario pédagogique',           'Script et déroulé pédagogique complet',                  'forfait', 20.00, 4),
  ('Animation Q&A',                  'Gestion du module questions-réponses en direct',         'heure',   20.00, 5),
  ('Abonnement formation',           'Accès mensuel à une bibliothèque de webinaires',         'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'preparateur-impots')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Déclaration de revenus',         'Préparation et dépôt de la déclaration annuelle',        'forfait', 20.00, 1),
  ('Déclaration TVA',                'Déclaration mensuelle ou trimestrielle de TVA',          'forfait', 20.00, 2),
  ('Bilan comptable',                'Clôture annuelle des comptes',                           'forfait', 20.00, 3),
  ('Conseil fiscal',                 'Optimisation fiscale et planification',                  'heure',   20.00, 4),
  ('Création d''entreprise',         'Formalités administratives et comptables',               'forfait', 20.00, 5),
  ('Suivi comptable mensuel',        'Tenue de comptabilité mensuelle',                        'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'electricien')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Mise aux normes électriques',    'Mise en conformité d''une installation électrique',      'forfait', 10.00, 1),
  ('Installation tableau électrique','Remplacement ou installation d''un tableau',             'forfait', 10.00, 2),
  ('Pose de prises et interrupteurs','Installation d''une prise ou d''un interrupteur',        'forfait', 10.00, 3),
  ('Éclairage',                      'Installation de luminaires et d''éclairage LED',         'forfait', 10.00, 4),
  ('Câblage réseau',                 'Installation d''un réseau informatique',                 'forfait', 10.00, 5),
  ('Domotique',                      'Installation de système domotique connecté',             'forfait', 10.00, 6),
  ('Diagnostic électrique',          'Vérification et rapport de conformité',                  'forfait', 10.00, 7),
  ('Borne de recharge VE',           'Installation de borne pour véhicule électrique',         'forfait', 10.00, 8)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'plombier')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Dépannage urgent',               'Intervention d''urgence plomberie',                      'forfait', 10.00, 1),
  ('Installation sanitaire',         'Pose d''une salle de bain complète',                     'forfait', 10.00, 2),
  ('Remplacement chaudière',         'Dépose et installation d''une nouvelle chaudière',       'forfait', 10.00, 3),
  ('Installation climatisation',     'Pose de système de climatisation',                       'forfait', 10.00, 4),
  ('Débouchage canalisation',        'Débouchage et entretien des canalisations',              'forfait', 10.00, 5),
  ('Installation radiateur',         'Pose ou remplacement d''un radiateur',                   'forfait', 10.00, 6),
  ('Détection de fuite',             'Localisation et réparation de fuites',                   'forfait', 10.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'architecte')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Conception de projet',           'Avant-projet sommaire et esquisse',                      'forfait', 20.00, 1),
  ('Dossier permis de construire',   'Montage du dossier de demande de permis',                'forfait', 20.00, 2),
  ('Décoration intérieure',          'Conception d''un espace intérieur sur mesure',           'forfait', 20.00, 3),
  ('Coordination de chantier',       'Suivi et direction des travaux',                         'jour',    20.00, 4),
  ('Plan 3D',                        'Visualisation 3D réaliste d''un projet',                 'forfait', 20.00, 5),
  ('Audit immobilier',               'Analyse technique d''un bien avant achat',               'forfait', 20.00, 6),
  ('Conseil en aménagement',         'Consultation pour optimisation d''espace',               'heure',   20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'paysagiste')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Création de jardin',             'Conception et réalisation d''un jardin complet',         'forfait', 10.00, 1),
  ('Entretien régulier',             'Tonte, désherbage et taille mensuelle',                  'forfait', 10.00, 2),
  ('Terrassement',                   'Nivellement et préparation du terrain',                  'm²',      10.00, 3),
  ('Plantation',                     'Fourniture et mise en terre de végétaux',                'forfait', 10.00, 4),
  ('Arrosage automatique',           'Installation d''un système d''arrosage programmable',    'forfait', 10.00, 5),
  ('Conception piscine',             'Intégration paysagère autour d''une piscine',            'forfait', 10.00, 6),
  ('Élagage',                        'Taille et élagage d''arbres',                            'forfait', 10.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'bricoleur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Montage de meubles',             'Assemblage et installation de meubles (IKEA, etc.)',     'heure',   10.00, 1),
  ('Peinture intérieure',            'Peinture d''une pièce au complet',                       'm²',      10.00, 2),
  ('Petits travaux',                 'Réparations diverses et bricolage à domicile',            'heure',   10.00, 3),
  ('Pose de carrelage',              'Carrelage sol ou faïence mur',                           'm²',      10.00, 4),
  ('Installation d''équipements',    'TV murale, étagères, fixation',                          'forfait', 10.00, 5),
  ('Rénovation express',             'Rafraîchissement rapide d''un espace',                   'forfait', 10.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'home-staging')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Visite conseil',                 'Consultation sur site pour mise en valeur immobilière',  'forfait', 20.00, 1),
  ('Dépersonnalisation',             'Désencombrement et neutralisation de l''espace',          'forfait', 20.00, 2),
  ('Home staging complet',           'Transformation complète d''un bien à vendre',            'forfait', 20.00, 3),
  ('Photos immobilières',            'Shooting professionnel du bien',                         'forfait', 20.00, 4),
  ('Location de mobilier',           'Ameublement temporaire pour la mise en vente',           'forfait', 20.00, 5),
  ('Styling intérieur',              'Décoration et mise en scène pour location saisonnière',  'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'decorateur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Concept décoratif',              'Création d''un mood board et d''un concept',             'forfait', 20.00, 1),
  ('Plan d''aménagement',            'Proposition de mobilier et plan de circulation',         'forfait', 20.00, 2),
  ('Sélection de mobilier',          'Recherche et sélection de références',                   'heure',   20.00, 3),
  ('Coordination artisans',          'Suivi des intervenants du chantier',                     'jour',    20.00, 4),
  ('Shopping design',                'Accompagnement en showroom ou en ligne',                 'heure',   20.00, 5),
  ('Décoration d''événement',        'Décoration pour mariage, réception ou soirée',           'forfait', 20.00, 6),
  ('Rendu 3D',                       'Simulation visuelle réaliste de l''espace décoré',       'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'tailleur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Costume sur mesure',             'Création d''un costume complet',                         'forfait', 20.00, 1),
  ('Retouche',                       'Ourlet, reprise et ajustement de vêtement',              'forfait', 20.00, 2),
  ('Robe de mariée',                 'Création ou retouche de robe de mariée',                 'forfait', 20.00, 3),
  ('Tenue professionnelle',          'Création d''une tenue de travail personnalisée',         'forfait', 20.00, 4),
  ('Broderie',                       'Personnalisation textile par broderie',                  'forfait', 20.00, 5),
  ('Déguisement',                    'Création de costume de théâtre ou fête',                 'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'fleuriste')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Bouquet personnalisé',           'Composition florale sur mesure',                         'forfait',  5.50, 1),
  ('Décoration florale événement',   'Fleurs pour mariage ou réception',                       'forfait',  5.50, 2),
  ('Abonnement floral',              'Livraison hebdomadaire ou mensuelle',                    'forfait',  5.50, 3),
  ('Couronne mortuaire',             'Composition pour obsèques',                              'forfait',  5.50, 4),
  ('Atelier floral',                 'Cours de composition florale',                           'séance',   5.50, 5),
  ('Décoration végétale',            'Plants d''intérieur et terrariums',                      'forfait',  5.50, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'createur-bijoux')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Bijou sur mesure',               'Création d''une pièce unique',                           'forfait', 20.00, 1),
  ('Bague de fiançailles',           'Conception et fabrication d''une bague unique',          'forfait', 20.00, 2),
  ('Gravure',                        'Personnalisation par gravure',                            'forfait', 20.00, 3),
  ('Réparation de bijou',            'Remise en état d''un bijou endommagé',                   'forfait', 20.00, 4),
  ('Collection capsule',             'Création d''une mini-ligne de bijoux',                   'forfait', 20.00, 5),
  ('Atelier bijouterie',             'Cours de création de bijoux',                            'séance',  20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'maquilleur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Maquillage mariage',             'Maquillage de la mariée et préparation le jour J',       'séance',  20.00, 1),
  ('Maquillage événement',           'Maquillage pour soirée ou gala',                         'séance',  20.00, 2),
  ('Maquillage photo/vidéo',         'Maquillage pour plateau photo ou tournage',              'séance',  20.00, 3),
  ('Cours de maquillage',            'Apprentissage des techniques de base',                   'séance',  20.00, 4),
  ('Maquillage artistique',          'Body art et effets spéciaux',                            'séance',  20.00, 5),
  ('Essai maquillage',               'Séance d''essai avant l''événement',                     'séance',  20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'massotherapeute')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Massage relaxant',               'Séance de massage de détente',                           'séance',  10.00, 1),
  ('Massage thérapeutique',          'Traitement de douleurs musculaires',                     'séance',  10.00, 2),
  ('Massage sportif',                'Récupération pour sportifs',                             'séance',  10.00, 3),
  ('Massage prénatal',               'Massage adapté pour femmes enceintes',                   'séance',  10.00, 4),
  ('Réflexologie',                   'Massage réflexologie plantaire',                         'séance',  10.00, 5),
  ('Pack découverte',                'Forfait 3 séances initiales',                            'forfait', 10.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'coach-prive')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Personal training',              'Séance d''entraînement personnalisé',                    'séance',  20.00, 1),
  ('Programme d''entraînement',      'Création d''un programme adapté aux objectifs',          'forfait', 20.00, 2),
  ('Cours en groupe',                'Cours collectif (yoga, pilates, HIIT…)',                 'heure',   20.00, 3),
  ('Suivi nutritionnel',             'Bilan et plan alimentaire personnalisé',                 'forfait', 20.00, 4),
  ('Coaching en ligne',              'Accompagnement complet à distance',                      'forfait', 20.00, 5),
  ('Préparation physique',           'Préparation à un événement sportif',                     'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'doula')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Accompagnement prénatal',        'Suivi de grossesse et préparation à l''accouchement',   'séance',  10.00, 1),
  ('Présence à l''accouchement',     'Soutien continu lors de l''accouchement',               'forfait', 10.00, 2),
  ('Accompagnement postnatal',       'Soutien dans les semaines après la naissance',           'séance',  10.00, 3),
  ('Cours de préparation',           'Ateliers de préparation à la naissance',                 'forfait', 10.00, 4),
  ('Atelier allaitement',            'Soutien et conseil à l''allaitement',                    'séance',  10.00, 5),
  ('Massage de bébé',                'Initiation au massage pour bébé',                        'séance',  10.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'aide-personne')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Aide aux repas',                 'Préparation et aide aux repas',                          'heure',   10.00, 1),
  ('Aide à la toilette',             'Assistance à la toilette et à l''hygiène',               'heure',   10.00, 2),
  ('Compagnie',                      'Présence et conversation',                               'heure',   10.00, 3),
  ('Accompagnement médical',         'Transport et accompagnement aux rendez-vous',            'heure',   10.00, 4),
  ('Aide administrative',            'Aide aux démarches administratives et courrier',         'heure',   10.00, 5),
  ('Animation loisirs',              'Activités et sorties adaptées',                          'heure',   10.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'nettoyage')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Ménage régulier',                'Nettoyage hebdomadaire ou bihebdomadaire',               'heure',   10.00, 1),
  ('Grand ménage',                   'Nettoyage complet de printemps',                         'forfait', 10.00, 2),
  ('Nettoyage fin de chantier',      'Nettoyage après travaux de rénovation',                  'm²',      10.00, 3),
  ('Nettoyage déménagement',         'Remise en état pour déménagement',                       'forfait', 10.00, 4),
  ('Nettoyage de vitres',            'Nettoyage des vitres et fenêtres',                       'forfait', 10.00, 5),
  ('Nettoyage vitrine commerce',     'Nettoyage de devanture commerciale',                     'forfait', 10.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'coach-rangement')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Audit désencombrement',          'Visite et bilan complet de l''espace',                   'forfait', 20.00, 1),
  ('Session de tri',                 'Session pratique de tri et organisation',                'heure',   20.00, 2),
  ('Organisation d''une pièce',      'Optimisation complète d''un espace spécifique',          'forfait', 20.00, 3),
  ('Désencombrement accompagné',     'Tri de garde-robe ou de débarras',                       'heure',   20.00, 4),
  ('Organisation bureau',            'Optimisation de l''espace de travail',                   'forfait', 20.00, 5),
  ('Atelier minimalisme',            'Groupe d''apprentissage du zéro encombrement',           'séance',  20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'personal-shopper')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Audit vestimentaire',            'Analyse du style et de la garde-robe',                   'séance',  20.00, 1),
  ('Shopping accompagné',            'Sortie shopping personnalisée',                          'heure',   20.00, 2),
  ('Conseil en image',               'Coaching style et image professionnelle',                'séance',  20.00, 3),
  ('Sélection en ligne',             'Sélection de tenues sur sites en ligne',                 'forfait', 20.00, 4),
  ('Relooking complet',              'Transformation de look intégrale',                       'forfait', 20.00, 5),
  ('Conseils taille et fit',         'Conseils personnalisés pour les achats',                 'séance',  20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'promeneur-chiens')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Promenade quotidienne',          'Sortie de 30 à 60 minutes',                              'forfait', 10.00, 1),
  ('Garde à domicile',               'Pet sitting chez le propriétaire',                       'jour',    10.00, 2),
  ('Garde en famille',               'Accueil de l''animal chez le prestataire',               'jour',    10.00, 3),
  ('Visite à domicile',              'Passage pour nourrir, câliner et promener',              'forfait', 10.00, 4),
  ('Transport vétérinaire',          'Accompagnement chez le vétérinaire',                     'forfait', 10.00, 5),
  ('Dressage basique',               'Apprentissage des ordres de base',                       'séance',  10.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'toiletteur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Toilettage complet',             'Bain, séchage, coupe et finitions',                      'séance',  20.00, 1),
  ('Bain et séchage',                'Nettoyage complet sans coupe',                           'séance',  20.00, 2),
  ('Coupe',                          'Taille et coupe du poil',                                'séance',  20.00, 3),
  ('Coupe des griffes',              'Taille des griffes et nettoyage des oreilles',           'séance',  20.00, 4),
  ('Traitement antiparasitaire',     'Traitement anti-puces et anti-tiques',                   'séance',  20.00, 5),
  ('Abonnement mensuel',             'Forfait tout compris mensuel',                           'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'jardinier')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Entretien régulier',             'Tonte, désherbage et taille',                            'heure',   10.00, 1),
  ('Taille de haies',                'Taille et mise en forme des haies',                      'forfait', 10.00, 2),
  ('Plantation',                     'Achat et mise en terre de végétaux',                     'forfait', 10.00, 3),
  ('Traitement phytosanitaire',      'Application de produits de traitement',                  'forfait', 10.00, 4),
  ('Ramassage de feuilles',          'Nettoyage automnal du jardin',                           'forfait', 10.00, 5),
  ('Arrosage automatique',           'Installation et programmation d''arrosage',              'forfait', 10.00, 6),
  ('Création de potager',            'Conception et installation d''un potager',               'forfait', 10.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'chauffeur-vtc')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Course aéroport / gare',         'Transfert vers aéroport ou gare',                        'forfait', 10.00, 1),
  ('Mise à disposition',             'Chauffeur à disposition avec véhicule',                  'heure',   10.00, 2),
  ('Transfert entreprise',           'Transport de collaborateurs ou clients',                 'forfait', 10.00, 3),
  ('Soirée événementielle',          'Chauffeur pour soirée ou mariage',                       'forfait', 10.00, 4),
  ('Course longue distance',         'Trajet interurbain ou interrégional',                    'forfait', 10.00, 5),
  ('Abonnement professionnel',       'Contrat mensuel pour déplacements réguliers',            'forfait', 10.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'animateur')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Animation enfants',              'Jeux et activités pour enfants',                         'forfait', 20.00, 1),
  ('Team building',                  'Activité de cohésion d''équipe',                         'forfait', 20.00, 2),
  ('Animation soirée',               'Présentation et animation d''une soirée',                'forfait', 20.00, 3),
  ('Animation mariage',              'Animation et jeux pour mariage',                         'forfait', 20.00, 4),
  ('Mascotte',                       'Prestation en costume de mascotte',                      'heure',   20.00, 5),
  ('Animation musicale',             'Karaoké, blind test ou quiz musical',                    'forfait', 20.00, 6),
  ('Animation sportive',             'Organisation de tournoi ou challenge',                   'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'dj')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Soirée en club',                 'Prestation DJ set en discothèque',                       'forfait', 20.00, 1),
  ('Mariage',                        'Animation musicale de mariage complet',                  'forfait', 20.00, 2),
  ('Anniversaire privé',             'Prestation pour soirée privée',                          'forfait', 20.00, 3),
  ('Événement corporate',            'Animation musicale d''événement entreprise',             'forfait', 20.00, 4),
  ('Festival',                       'Prestation sur scène de festival',                       'forfait', 20.00, 5),
  ('Mix et production',              'Création d''un mix audio ou production musicale',        'forfait', 20.00, 6),
  ('Location matériel',              'Location de table de mixage et enceintes',               'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'organisateur-evenements')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Événement corporate',            'Organisation complète d''un séminaire d''entreprise',    'forfait', 20.00, 1),
  ('Mariage',                        'Coordination et organisation complète de mariage',       'forfait', 20.00, 2),
  ('Soirée thématique',              'Organisation de soirée à thème',                         'forfait', 20.00, 3),
  ('Coordination jour J',            'Présence et gestion le jour de l''événement',            'jour',    20.00, 4),
  ('Cocktail / Apéritif',            'Organisation d''un cocktail ou apéritif',                'forfait', 20.00, 5),
  ('Teambuilding',                   'Organisation d''activités de cohésion',                  'forfait', 20.00, 6),
  ('Congrès / Conférence',           'Logistique de conférence professionnelle',               'forfait', 20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'agent-publicitaire')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Stratégie publicitaire',         'Élaboration d''un plan média',                           'forfait', 20.00, 1),
  ('Achat d''espace',                'Négociation et achat d''emplacements publicitaires',     'forfait', 20.00, 2),
  ('Suivi de campagne',              'Monitoring et optimisation de campagne',                 'forfait', 20.00, 3),
  ('Création publicitaire',          'Brief et supervision de la création',                   'forfait', 20.00, 4),
  ('Relation presse',                'Rédaction et diffusion de communiqués de presse',        'forfait', 20.00, 5),
  ('Influence marketing',            'Activation d''influenceurs pour une marque',             'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'styliste')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Collection capsule',             'Création d''une mini-collection de vêtements',           'forfait', 20.00, 1),
  ('Stylisme éditorial',             'Direction artistique pour shooting mode',                'forfait', 20.00, 2),
  ('Stylisme de plateau',            'Habillage pour tournage vidéo ou photo',                 'forfait', 20.00, 3),
  ('Conseil stylistique',            'Accompagnement personnel en style',                      'séance',  20.00, 4),
  ('Stylisme mariage',               'Coordination des tenues pour mariage',                   'forfait', 20.00, 5),
  ('Design textile',                 'Création de motifs pour collections',                    'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'redacteur-cv')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Rédaction de CV',                'Création ou refonte de CV professionnel',                'forfait', 20.00, 1),
  ('Lettre de motivation',           'Rédaction d''une lettre personnalisée',                  'forfait', 20.00, 2),
  ('Profil LinkedIn',                'Optimisation complète du profil LinkedIn',               'forfait', 20.00, 3),
  ('Coaching entretien',             'Coaching pour entretien d''embauche',                    'séance',  20.00, 4),
  ('CV cadre supérieur',             'CV haut de gamme avec design premium',                   'forfait', 20.00, 5),
  ('Portfolio professionnel',        'Création d''un portfolio en ligne',                      'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'createur-paniers')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Panier cadeau personnalisé',     'Composition florale sur mesure selon budget',             'forfait',  5.50, 1),
  ('Cadeaux d''entreprise',          'Paniers d''affaires ou cadeaux de Noël',                  'forfait',  5.50, 2),
  ('Box abonnement',                 'Abonnement mensuel de produits sélectionnés',             'forfait',  5.50, 3),
  ('Panier naissance',               'Cadeau de naissance personnalisé',                       'forfait',  5.50, 4),
  ('Livraison et emballage',         'Expédition soignée avec emballage cadeau',               'forfait',  5.50, 5),
  ('Atelier DIY',                    'Atelier de création de paniers cadeaux',                  'séance',  20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'ecommercant')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Création de boutique en ligne',  'Création d''une boutique e-commerce',                    'forfait', 20.00, 1),
  ('Gestion des commandes',          'Traitement et expédition',                               'heure',   20.00, 2),
  ('Photographie produit',           'Photos pour fiches produit',                             'forfait', 20.00, 3),
  ('Fiche produit',                  'Rédaction de descriptions optimisées pour SEO',          'forfait', 20.00, 4),
  ('Publicité e-commerce',           'Campagnes Facebook et Google Shopping',                  'forfait', 20.00, 5),
  ('Service client',                 'Gestion des retours et questions clients',               'heure',   20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'proprietaire-gite')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Nuitée avec petit-déjeuner',     'Hébergement avec petit-déjeuner inclus',                 'jour',    10.00, 1),
  ('Location gîte week-end',         'Location à la semaine ou au week-end',                   'forfait', 10.00, 2),
  ('Table d''hôtes',                 'Repas gastronomique chez l''habitant',                   'séance',  10.00, 3),
  ('Activités guidées',              'Randonnée, visite ou dégustation',                       'forfait',  5.50, 4),
  ('Petit-déjeuner additionnel',     'Petit-déjeuner à la demande',                            'forfait',  5.50, 5),
  ('Location de vélos',              'Location de vélos ou équipements de loisirs',            'jour',    20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'saisie-donnees')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Saisie de données',              'Renseignment de bases de données',                       'heure',   20.00, 1),
  ('Numérisation',                   'Scan et indexation de documents',                        'heure',   20.00, 2),
  ('Traitement de tableaux Excel',   'Mise en forme et correction de fichiers Excel',          'heure',   20.00, 3),
  ('Veille documentaire',            'Collecte et synthèse d''informations',                   'heure',   20.00, 4),
  ('Extraction web',                 'Scraping et collecte de données en ligne',               'forfait', 20.00, 5),
  ('Mise en forme de document',      'Mise en page Word/PowerPoint',                           'forfait', 20.00, 6)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'sondages')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Réponse à sondage',              'Participation à une enquête en ligne',                   'forfait', 20.00, 1),
  ('Test utilisateur',               'Test d''application ou de site web',                     'heure',   20.00, 2),
  ('Groupe focus',                   'Participation à un groupe de discussion',                'heure',   20.00, 3),
  ('Mystery shopping',               'Achat mystère en boutique ou en ligne',                  'forfait', 20.00, 4),
  ('Micro-tâches',                   'Réalisation de petites tâches numériques',               'heure',   20.00, 5)
) AS t(nom, description, unite, tva_taux, ordre);

WITH prof AS (SELECT id FROM public.profession_templates WHERE slug = 'comptable')
INSERT INTO public.profession_tasks (profession_id, nom, description, unite, tva_taux, ordre)
SELECT prof.id, t.nom, t.description, t.unite, t.tva_taux, t.ordre FROM prof,
(VALUES
  ('Tenue de comptabilité',          'Saisie mensuelle des écritures comptables',              'forfait', 20.00, 1),
  ('Déclaration TVA',                'Établissement de la déclaration TVA',                    'forfait', 20.00, 2),
  ('Clôture annuelle',               'Bilan et compte de résultat annuel',                     'forfait', 20.00, 3),
  ('Conseil fiscal',                 'Optimisation et planification fiscale',                  'heure',   20.00, 4),
  ('Création d''entreprise',         'Formalités comptables de création',                      'forfait', 20.00, 5),
  ('Audit comptable',                'Révision des comptes et recommandations',                'forfait', 20.00, 6),
  ('Formation comptabilité',         'Formation aux bases comptables',                         'heure',   20.00, 7)
) AS t(nom, description, unite, tva_taux, ordre);
