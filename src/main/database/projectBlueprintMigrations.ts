import type { Migration } from './migrations';

export const PROJECT_BLUEPRINT_MIGRATIONS: Migration[] = [
  {
    id: 27,
    name: 'project_v2_blueprints_and_work_cards',
    sql: `
      ALTER TABLE project_template_nodes ADD COLUMN semantic_key TEXT;
      ALTER TABLE project_template_nodes ADD COLUMN work_card_json TEXT;
      ALTER TABLE project_template_nodes ADD COLUMN advice_json TEXT;

      ALTER TABLE project_nodes ADD COLUMN semantic_key TEXT;
      ALTER TABLE project_nodes ADD COLUMN work_card_json TEXT;
      ALTER TABLE project_nodes ADD COLUMN advice_json TEXT;
      ALTER TABLE project_nodes ADD COLUMN is_paused INTEGER NOT NULL DEFAULT 0 CHECK (is_paused IN (0,1));
      ALTER TABLE project_nodes ADD COLUMN pause_reason TEXT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_project_template_nodes_semantic_key
        ON project_template_nodes(template_version_id, semantic_key)
        WHERE semantic_key IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_project_nodes_semantic_key
        ON project_nodes(project_id, semantic_key)
        WHERE semantic_key IS NOT NULL;

      CREATE TABLE IF NOT EXISTS catalog_project_blueprints (
        id TEXT PRIMARY KEY,
        catalog_version_id TEXT NOT NULL REFERENCES catalog_versions(id) ON DELETE CASCADE,
        template_version_id TEXT NOT NULL REFERENCES project_template_versions(id) ON DELETE RESTRICT,
        role TEXT NOT NULL CHECK (role IN ('base','addon')),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        UNIQUE (catalog_version_id, template_version_id, role)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_catalog_project_blueprints_catalog
        ON catalog_project_blueprints(catalog_version_id, role, sort_order);

      CREATE INDEX IF NOT EXISTS idx_catalog_project_blueprints_template
        ON catalog_project_blueprints(template_version_id, role);

      CREATE TABLE IF NOT EXISTS project_node_sources (
        id TEXT PRIMARY KEY,
        project_node_id TEXT NOT NULL REFERENCES project_nodes(id) ON DELETE CASCADE,
        quote_line_id TEXT REFERENCES quote_lines(id) ON DELETE SET NULL,
        catalog_version_id TEXT REFERENCES catalog_versions(id) ON DELETE SET NULL,
        template_version_id TEXT REFERENCES project_template_versions(id) ON DELETE SET NULL,
        source_role TEXT NOT NULL CHECK (source_role IN ('direct','offer_component','manual')),
        created_at TEXT NOT NULL,
        UNIQUE (project_node_id, quote_line_id, catalog_version_id, template_version_id, source_role)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_project_node_sources_node
        ON project_node_sources(project_node_id, created_at);

      CREATE INDEX IF NOT EXISTS idx_project_node_sources_quote_line
        ON project_node_sources(quote_line_id, created_at);
    `,
  },
  {
    id: 28,
    name: 'project_v2_seed_site_vitrine_blueprint',
    sql: `
      INSERT OR IGNORE INTO project_templates
        (id,name,project_type,status,created_at,updated_at)
      VALUES
        ('atoumweb-project-template-vitrine','AtoumWeb · Site vitrine','website','active','2026-09-21T00:00:00.000Z','2026-09-21T00:00:00.000Z');

      INSERT OR IGNORE INTO project_template_versions
        (id,template_id,version_number,status,description,published_at,created_at)
      VALUES
        ('atoumweb-project-template-vitrine-v1','atoumweb-project-template-vitrine',1,'published',
         'Blueprint de production AtoumWeb pour un site vitrine. Arbre modifiable après génération depuis le devis.',
         '2026-09-21T00:00:00.000Z','2026-09-21T00:00:00.000Z');

      INSERT OR IGNORE INTO project_template_nodes
        (id,template_version_id,parent_id,node_type,display_subtype,name,description,sort_order,estimated_minutes,is_required,initial_status,time_category,created_at,semantic_key,work_card_json,advice_json)
      VALUES
        ('aw-vitrine-preparation','atoumweb-project-template-vitrine-v1',NULL,'lot',NULL,'Préparation du projet',
         'Cadrer le projet avant toute production.',10,30,1,'todo','administrative','2026-09-21T00:00:00.000Z','setup',
         '{"goal":"Valider le périmètre réellement vendu et réunir les accès nécessaires.","fields":[{"key":"scope_checked","label":"Périmètre du devis vérifié","type":"check"},{"key":"missing_items","label":"Éléments manquants","type":"textarea"}]}',
         '[{"kind":"best_practice","title":"Partir du devis signé","body":"Le plan de production doit refléter ce qui a réellement été vendu. Les ajouts futurs restent traçables."}]'),

        ('aw-vitrine-domain-hosting','atoumweb-project-template-vitrine-v1','aw-vitrine-preparation','module',NULL,'Domaine & hébergement',
         'Vérifier la situation actuelle avant tout achat ou transfert.',20,15,1,'todo','administrative','2026-09-21T00:00:00.000Z','setup.domain_hosting',
         '{"goal":"Connaître la situation domaine/hébergement.","fields":[{"key":"domain_status","label":"Nom de domaine","type":"select","options":["Déjà possédé","À acheter","À transférer","À vérifier"]},{"key":"hosting_status","label":"Hébergement","type":"select","options":["Existant","À créer","À migrer","À vérifier"]},{"key":"access_notes","label":"Accès / notes","type":"textarea"}]}',
         '[{"kind":"check","title":"Ne pas acheter trop vite","body":"Vérifier le propriétaire, le registrar, les DNS et les accès avant de modifier quoi que ce soit."}]'),

        ('aw-vitrine-domain-action','atoumweb-project-template-vitrine-v1','aw-vitrine-domain-hosting','task',NULL,'Acheter / transférer / configurer le domaine',
         'À activer uniquement si la situation du client le nécessite.',10,30,0,'todo','administrative','2026-09-21T00:00:00.000Z','setup.domain_action',
         '{"goal":"Mettre le domaine dans la configuration prévue pour le projet.","fields":[{"key":"action","label":"Action retenue","type":"textarea"},{"key":"done","label":"Domaine prêt","type":"check"}]}',
         '[{"kind":"best_practice","title":"Tracer les changements DNS","body":"Noter l’état initial avant modification et conserver les références utiles dans la fiche."}]'),

        ('aw-vitrine-hosting-action','atoumweb-project-template-vitrine-v1','aw-vitrine-domain-hosting','task',NULL,'Créer / préparer l’hébergement',
         'À activer si un hébergement doit être créé ou repris.',20,30,0,'todo','administrative','2026-09-21T00:00:00.000Z','setup.hosting_action',
         '{"goal":"Disposer d’un environnement prêt pour WordPress.","fields":[{"key":"provider","label":"Hébergeur","type":"text"},{"key":"environment_ready","label":"Environnement prêt","type":"check"}]}',
         '[{"kind":"check","title":"Conserver les accès hors des notes publiques","body":"Les secrets ne doivent pas être stockés en clair dans les champs de projet."}]'),

        ('aw-vitrine-tech','atoumweb-project-template-vitrine-v1',NULL,'lot',NULL,'Installation technique',
         'Installer et sécuriser le socle WordPress / Divi.',20,120,1,'todo','development','2026-09-21T00:00:00.000Z','technical',
         '{"goal":"Obtenir un WordPress propre, sauvegardé et prêt à produire.","fields":[{"key":"wp_url","label":"URL WordPress","type":"url"},{"key":"environment_notes","label":"Notes techniques","type":"textarea"}]}',
         '[{"kind":"best_practice","title":"Créer un point de restauration","body":"Conserver une sauvegarde exploitable avant les modifications importantes."}]'),

        ('aw-vitrine-wordpress','atoumweb-project-template-vitrine-v1','aw-vitrine-tech','task',NULL,'Installer WordPress',
         NULL,10,30,1,'todo','development','2026-09-21T00:00:00.000Z','technical.wordpress',
         '{"goal":"Installer WordPress et vérifier les réglages de base.","fields":[{"key":"installed","label":"Installation vérifiée","type":"check"},{"key":"permalinks","label":"Permaliens vérifiés","type":"check"}]}',
         '[{"kind":"check","title":"Indexation","body":"Pendant la production, vérifier que l’environnement de travail ne soit pas indexé par erreur."}]'),

        ('aw-vitrine-divi','atoumweb-project-template-vitrine-v1','aw-vitrine-tech','task',NULL,'Installer et configurer Divi',
         NULL,20,30,1,'todo','development','2026-09-21T00:00:00.000Z','technical.divi',
         '{"goal":"Préparer Divi et les réglages globaux nécessaires au projet.","fields":[{"key":"divi_ready","label":"Divi prêt","type":"check"},{"key":"global_notes","label":"Réglages globaux","type":"textarea"}]}',
         '[{"kind":"best_practice","title":"Rester réutilisable","body":"Privilégier les styles globaux et les composants réutilisables plutôt que les corrections isolées."}]'),

        ('aw-vitrine-foundation','atoumweb-project-template-vitrine-v1','aw-vitrine-tech','task',NULL,'Sécurité, sauvegardes, cache et polices',
         NULL,30,60,1,'todo','development','2026-09-21T00:00:00.000Z','technical.foundation',
         '{"goal":"Configurer le socle technique avant la construction des pages.","fields":[{"key":"ssl","label":"HTTPS / SSL","type":"check"},{"key":"backup","label":"Sauvegarde initiale","type":"check"},{"key":"cache","label":"Cache / performance","type":"check"},{"key":"fonts","label":"Polices locales","type":"check"}]}',
         '[{"kind":"check","title":"Performance","body":"Éviter d’empiler des extensions lorsque Divi, WordPress ou le serveur répondent déjà au besoin."}]'),

        ('aw-vitrine-global','atoumweb-project-template-vitrine-v1',NULL,'lot',NULL,'Éléments globaux',
         'Construire les éléments visibles sur l’ensemble du site.',30,120,1,'todo','design','2026-09-21T00:00:00.000Z','global',
         '{"goal":"Créer une base graphique cohérente et réutilisable.","fields":[{"key":"style_notes","label":"Styles globaux / notes","type":"textarea"}]}',
         '[{"kind":"best_practice","title":"Tester tôt sur mobile","body":"Le header et le footer doivent être vérifiés sur mobile avant de multiplier les pages."}]'),

        ('aw-vitrine-header','atoumweb-project-template-vitrine-v1','aw-vitrine-global','module','header','Header',
         'Header global du site.',10,75,1,'todo','design','2026-09-21T00:00:00.000Z','global.header',
         '{"goal":"Créer un header lisible, cohérent et responsive.","fields":[{"key":"desktop_validated","label":"Desktop validé","type":"check"},{"key":"mobile_validated","label":"Mobile validé","type":"check"},{"key":"code_notes","label":"Code / réglages particuliers","type":"textarea"}]}',
         '[{"kind":"check","title":"Navigation","body":"Vérifier le menu, les états actifs, le CTA éventuel et la navigation clavier raisonnable."},{"kind":"library","title":"Réutilisation","body":"Si un code du header devient générique, conserver la version client ici puis préparer une copie pour la Bibliothèque AtoumWeb."}]'),

        ('aw-vitrine-footer','atoumweb-project-template-vitrine-v1','aw-vitrine-global','module','footer','Footer',
         'Footer global du site.',20,45,1,'todo','design','2026-09-21T00:00:00.000Z','global.footer',
         '{"goal":"Créer un footer complet et responsive.","fields":[{"key":"legal_links","label":"Liens légaux présents","type":"check"},{"key":"contact_checked","label":"Coordonnées vérifiées","type":"check"}]}',
         '[{"kind":"check","title":"Cohérence","body":"Vérifier que les coordonnées et liens correspondent aux informations validées du client."}]'),

        ('aw-vitrine-pages','atoumweb-project-template-vitrine-v1',NULL,'lot',NULL,'Pages',
         'Construire les pages prévues au devis. Renommer les pages génériques selon le projet.',40,0,1,'todo','production','2026-09-21T00:00:00.000Z','pages',
         '{"goal":"Construire les pages du site à partir du périmètre réellement vendu.","fields":[{"key":"tree_notes","label":"Arborescence / notes","type":"textarea"}]}',
         '[{"kind":"best_practice","title":"Une fiche par page","body":"Rattacher les textes, visuels, code et temps à la page ou à la section réellement concernée."}]'),

        ('aw-vitrine-home','atoumweb-project-template-vitrine-v1','aw-vitrine-pages','module','page','Accueil',
         'Page d’accueil du site.',10,180,1,'todo','production','2026-09-21T00:00:00.000Z','pages.home',
         '{"goal":"Construire une page d’accueil claire qui présente rapidement la proposition de valeur.","fields":[{"key":"page_goal","label":"Objectif de la page","type":"textarea"},{"key":"client_text","label":"Texte client / source","type":"textarea"},{"key":"final_text","label":"Texte de travail / validé","type":"textarea"}]}',
         '[{"kind":"best_practice","title":"Structure","body":"Faire comprendre qui est le client, ce qu’il propose et quelle action effectuer sans surcharge."}]'),

        ('aw-vitrine-home-hero','atoumweb-project-template-vitrine-v1','aw-vitrine-home','module','hero','Hero',
         'Première section de la page d’accueil.',10,75,1,'todo','design','2026-09-21T00:00:00.000Z','pages.home.hero',
         '{"goal":"Créer un Hero compréhensible immédiatement.","fields":[{"key":"h1","label":"H1","type":"text"},{"key":"lead","label":"Accroche","type":"textarea"},{"key":"cta","label":"CTA principal","type":"text"},{"key":"visual_notes","label":"Visuel / ressource liée","type":"textarea"},{"key":"code_notes","label":"Code / réglages","type":"textarea"}]}',
         '[{"kind":"check","title":"H1","body":"Un seul H1 pertinent et visible."},{"kind":"check","title":"Mobile","body":"Vérifier hauteur, lisibilité, cadrage du visuel et CTA sur petit écran."},{"kind":"library","title":"Code réutilisable","body":"Le code spécifique reste dans le projet ; une version nettoyée peut être préparée pour la Bibliothèque AtoumWeb."}]'),

        ('aw-vitrine-home-content','atoumweb-project-template-vitrine-v1','aw-vitrine-home','task',NULL,'Sections de contenu',
         'Présentation, services, preuves, appels à l’action selon le besoin.',20,90,1,'todo','production','2026-09-21T00:00:00.000Z','pages.home.content',
         '{"goal":"Construire les sections utiles sans imposer une structure artificielle.","fields":[{"key":"sections","label":"Sections retenues","type":"textarea"},{"key":"content_notes","label":"Contenus / notes","type":"textarea"}]}',
         '[{"kind":"best_practice","title":"Hiérarchie","body":"Les sections doivent suivre une progression logique plutôt qu’un empilement de blocs."}]'),

        ('aw-vitrine-page-2','atoumweb-project-template-vitrine-v1','aw-vitrine-pages','module','page','Page complémentaire 1',
         'À renommer selon le devis : À propos, Services, prestation, etc.',20,90,1,'todo','production','2026-09-21T00:00:00.000Z','pages.extra1',
         '{"goal":"Réaliser la page correspondant au périmètre vendu.","fields":[{"key":"page_name","label":"Nom définitif","type":"text"},{"key":"client_text","label":"Texte client / source","type":"textarea"},{"key":"final_text","label":"Texte de travail / validé","type":"textarea"}]}',
         '[{"kind":"check","title":"Contenu","body":"Conserver la source client et la version retravaillée dans la fiche plutôt que dans des notes dispersées."}]'),

        ('aw-vitrine-page-3','atoumweb-project-template-vitrine-v1','aw-vitrine-pages','module','page','Page complémentaire 2',
         'À renommer selon le devis.',30,90,1,'todo','production','2026-09-21T00:00:00.000Z','pages.extra2',
         '{"goal":"Réaliser la page correspondant au périmètre vendu.","fields":[{"key":"page_name","label":"Nom définitif","type":"text"},{"key":"client_text","label":"Texte client / source","type":"textarea"},{"key":"final_text","label":"Texte de travail / validé","type":"textarea"}]}',
         '[{"kind":"check","title":"Responsive","body":"Valider la page en desktop, tablette et mobile."}]'),

        ('aw-vitrine-page-4','atoumweb-project-template-vitrine-v1','aw-vitrine-pages','module','page','Page complémentaire 3',
         'À renommer selon le devis.',40,90,1,'todo','production','2026-09-21T00:00:00.000Z','pages.extra3',
         '{"goal":"Réaliser la page correspondant au périmètre vendu.","fields":[{"key":"page_name","label":"Nom définitif","type":"text"},{"key":"client_text","label":"Texte client / source","type":"textarea"},{"key":"final_text","label":"Texte de travail / validé","type":"textarea"}]}',
         '[{"kind":"check","title":"Validation","body":"Conserver les remarques et corrections importantes dans la fiche de la page."}]'),

        ('aw-vitrine-page-5','atoumweb-project-template-vitrine-v1','aw-vitrine-pages','module','page','Page complémentaire 4',
         'À renommer selon le devis.',50,90,1,'todo','production','2026-09-21T00:00:00.000Z','pages.extra4',
         '{"goal":"Réaliser la page correspondant au périmètre vendu.","fields":[{"key":"page_name","label":"Nom définitif","type":"text"},{"key":"client_text","label":"Texte client / source","type":"textarea"},{"key":"final_text","label":"Texte de travail / validé","type":"textarea"}]}',
         '[{"kind":"check","title":"SEO de base","body":"Renseigner un title, une meta description pertinente et une hiérarchie de titres cohérente."}]'),

        ('aw-vitrine-quality','atoumweb-project-template-vitrine-v1',NULL,'lot',NULL,'SEO, conformité & recette',
         'Vérifier le site avant mise en ligne.',50,120,1,'todo','production','2026-09-21T00:00:00.000Z','quality',
         '{"goal":"Valider qualité, conformité et fonctionnement avant publication.","fields":[{"key":"issues","label":"Points restant à corriger","type":"textarea"}]}',
         '[{"kind":"best_practice","title":"Recette structurée","body":"Tester les éléments critiques de façon répétable plutôt que de se fier à une simple relecture visuelle."}]'),

        ('aw-vitrine-seo','atoumweb-project-template-vitrine-v1','aw-vitrine-quality','task',NULL,'SEO de base',
         NULL,10,45,1,'todo','production','2026-09-21T00:00:00.000Z','quality.seo',
         '{"goal":"Configurer le minimum SEO prévu dans un site vitrine.","fields":[{"key":"titles","label":"Titles / metas vérifiés","type":"check"},{"key":"sitemap","label":"Sitemap vérifié","type":"check"},{"key":"indexation","label":"Indexation vérifiée","type":"check"}]}',
         '[{"kind":"check","title":"Search Console","body":"Prévoir la connexion ou la vérification après mise en ligne si elle fait partie du périmètre."}]'),

        ('aw-vitrine-rgpd','atoumweb-project-template-vitrine-v1','aw-vitrine-quality','task',NULL,'RGPD, cookies & pages légales',
         NULL,20,45,1,'todo','production','2026-09-21T00:00:00.000Z','quality.rgpd',
         '{"goal":"Mettre en place les éléments prévus et vérifier les informations fournies par le client.","fields":[{"key":"legal","label":"Pages légales vérifiées","type":"check"},{"key":"cookies","label":"Bandeau / consentement vérifié","type":"check"}]}',
         '[{"kind":"check","title":"Responsabilité des contenus","body":"Ne pas inventer les informations légales du client ; conserver ce qui a été fourni ou validé."}]'),

        ('aw-vitrine-tests','atoumweb-project-template-vitrine-v1','aw-vitrine-quality','task',NULL,'Recette desktop, tablette & mobile',
         NULL,30,30,1,'todo','production','2026-09-21T00:00:00.000Z','quality.tests',
         '{"goal":"Tester navigation, formulaires, liens et responsive.","fields":[{"key":"desktop","label":"Desktop","type":"check"},{"key":"tablet","label":"Tablette","type":"check"},{"key":"mobile","label":"Mobile","type":"check"},{"key":"forms","label":"Formulaires","type":"check"},{"key":"links","label":"Liens","type":"check"}]}',
         '[{"kind":"check","title":"Formulaire réel","body":"Effectuer au moins un test de formulaire sur l’environnement final."}]'),

        ('aw-vitrine-launch','atoumweb-project-template-vitrine-v1',NULL,'lot',NULL,'Mise en ligne & livraison',
         'Publier, sécuriser le point de sortie et remettre le projet au client.',60,90,1,'todo','administrative','2026-09-21T00:00:00.000Z','launch',
         '{"goal":"Mettre en ligne sans perdre la possibilité de revenir à un état stable.","fields":[{"key":"launch_notes","label":"Notes de mise en ligne","type":"textarea"}]}',
         '[{"kind":"best_practice","title":"Sauvegardes de sortie","body":"Créer une sauvegarde avant mise en ligne puis une sauvegarde stable après validation."}]'),

        ('aw-vitrine-prelaunch-backup','atoumweb-project-template-vitrine-v1','aw-vitrine-launch','task',NULL,'Sauvegarde avant mise en ligne',
         NULL,10,15,1,'todo','administrative','2026-09-21T00:00:00.000Z','launch.backup_before',
         '{"goal":"Conserver un point de retour avant publication.","fields":[{"key":"backup_recorded","label":"Sauvegarde enregistrée","type":"check"}]}',
         '[{"kind":"check","title":"Traçabilité","body":"Lier la sauvegarde au projet dans le Manager."}]'),

        ('aw-vitrine-go-live','atoumweb-project-template-vitrine-v1','aw-vitrine-launch','task',NULL,'Mise en ligne',
         NULL,20,45,1,'todo','development','2026-09-21T00:00:00.000Z','launch.go_live',
         '{"goal":"Basculer le site sur son environnement final.","fields":[{"key":"dns","label":"DNS / domaine vérifiés","type":"check"},{"key":"ssl","label":"HTTPS vérifié","type":"check"},{"key":"forms","label":"Formulaires retestés","type":"check"},{"key":"indexation","label":"Indexation finale vérifiée","type":"check"}]}',
         '[{"kind":"check","title":"Après bascule","body":"Retester les parcours critiques sur le domaine définitif."}]'),

        ('aw-vitrine-stable-backup','atoumweb-project-template-vitrine-v1','aw-vitrine-launch','task',NULL,'Sauvegarde stable après validation',
         NULL,30,15,1,'todo','administrative','2026-09-21T00:00:00.000Z','launch.backup_after',
         '{"goal":"Conserver la version stable livrée.","fields":[{"key":"stable_backup","label":"Sauvegarde stable enregistrée","type":"check"}]}',
         '[{"kind":"library","title":"Archive projet","body":"Cette sauvegarde fait partie de l’archive finale du projet."}]'),

        ('aw-vitrine-handover','atoumweb-project-template-vitrine-v1','aw-vitrine-launch','task',NULL,'Formation & livraison',
         'Formation client, remise des éléments prévus et proposition de maintenance.',40,60,1,'todo','meeting','2026-09-21T00:00:00.000Z','launch.handover',
         '{"goal":"Clôturer le projet avec une remise claire au client.","fields":[{"key":"training","label":"Formation réalisée","type":"check"},{"key":"access_delivered","label":"Accès / éléments remis","type":"check"},{"key":"maintenance_proposed","label":"Maintenance proposée","type":"check"},{"key":"delivery_notes","label":"Notes de livraison","type":"textarea"}]}',
         '[{"kind":"best_practice","title":"Clôture","body":"Ne marquer le projet terminé qu’après validation des éléments de sortie prévus."}]');

      INSERT OR IGNORE INTO catalog_project_blueprints
        (id,catalog_version_id,template_version_id,role,sort_order,created_at)
      SELECT
        'atoumweb-blueprint-link-vitrine',
        'atoumweb-vitrine-v1',
        'atoumweb-project-template-vitrine-v1',
        'base',
        10,
        '2026-09-21T00:00:00.000Z'
      WHERE EXISTS (SELECT 1 FROM catalog_versions WHERE id='atoumweb-vitrine-v1')
        AND EXISTS (SELECT 1 FROM project_template_versions WHERE id='atoumweb-project-template-vitrine-v1');
    `,
  },
];
