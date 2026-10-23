# Prospection — audit de saisie, sources de données et organisation cible

22 octobre 2026 — **diagnostic et proposition à valider, aucune modification applicative autorisée ou réalisée**.

## 1. Périmètre et méthode

Analyse statique du code courant, branche `codex/prospection-ux-six-lots`, HEAD `b0800783cb5940afed95842b6954d2083553cac0` ; dernier changement applicatif `e40dd1298616b8a635873d7b328d32f4e2f6473c`. Formulaires renderer, contrats partagés, handlers IPC, services et migrations SQLite ont été suivis. Aucune base utilisateur interrogée ou modifiée ; aucun comptage de doublons réels ne peut donc être affirmé. Les risques ci-dessous sont établis par les chemins de lecture/écriture, pas par un incident reproduit. Pas de nouvelle campagne de tests pour cet audit documentaire.

La demande actuelle porte sur la logique de saisie. Les anciens cahiers et captures sont du contexte ; ils ne valent pas autorisation de modifier le code. Les principes Entreprise → Contacts → Dossier → Devis → Client → Projet servent à organiser la proposition, sans ajouter un CRM parallèle.

## 2. Conclusion du diagnostic

Le socle possède déjà des entreprises et des personnes réutilisables. Un Prospect et un Client les référencent : la conversion ne recrée pas systématiquement l'identité. La bonne cible est une clarification du modèle existant et de ses accès, plutôt qu'une reconstruction.

Les principaux problèmes sont les suivants :

1. **Le « besoin » mélange expression client et catalogue.** `ProspectSummary.primaryNeed` est alimenté en priorité par les noms des éléments de `crm_needs`, puis seulement par `prospects.primary_need`. Ce DTO ne représente donc pas fidèlement la colonne du même nom. La demande initiale et le besoin confirmé partagent aussi `project_summary` et `project_context`.
2. **Plusieurs sources concurrentes existent pour les coordonnées.** `contact_methods` cohabite avec `organizations.email/phone` et `contacts.email/phone`. Certains lecteurs privilégient les méthodes actives puis reviennent aux anciennes colonnes ; d'autres utilisent directement les anciennes valeurs. Archiver la dernière méthode peut faire réapparaître une ancienne coordonnée dans un lecteur avec repli.
3. **La création Prospection n'emprunte pas le parcours Annuaire protégé.** Elle enchaîne création entreprise, personne, coordonnées, Prospect, recherche et action par appels séparés. Elle ne propose pas de réutiliser une entreprise existante. Un échec tardif puis une nouvelle tentative peut laisser des objets partiels ou recréés. Les créations Annuaire disposent déjà d'un identifiant d'opération et d'autres protections réutilisables.
4. **Une personne n'a qu'une organisation.** La fonction est portée par la personne, pas par sa relation à une entreprise. Référencer un décideur par son ID ne résout pas cette limite structurelle.
5. **L'action est cohérente dans Prospection, mais pas entre tous les modules.** `ActionService` maintient les anciens champs « prochaine action » comme projections. Le formulaire Client écrit directement ces champs sans créer une `crm_action` : deux circuits peuvent diverger.
6. **La recherche entreprise appartient au Prospect.** Les versions sont des événements JSON du dossier. Deux dossiers pour la même entreprise ne partagent pas automatiquement la connaissance. Des notes de préparation et des notes « pendant l'appel » y cohabitent avec les constats de recherche.
7. **L'historique de conversion reste réparti.** Les liens sont conservés, mais la lecture d'activité filtre exactement l'entité et son ID. Le Client ne reçoit pas automatiquement une vue regroupée du parcours Prospect, des actions et des devis.
8. **Les protections contre les modifications concurrentes sont inégales.** Les briefs Qualification/Besoins et certains éditeurs Annuaire comparent les valeurs attendues ; l'update général du Prospect écrit un ensemble de champs. Le changement de température transmet notamment un DTO complet. Un ancien état ou un champ calculé peut être réécrit.

### Preuves principales dans le code

Chemins relatifs à la racine du dépôt ; les numéros désignent le code audité.

| Sujet | Preuve et portée |
|---|---|
| Création séquentielle | `src/renderer/crm/ProspectsPageV2.tsx:322` : appels distincts ; formulaires vers 551. À comparer avec `src/main/crm/CrmService.ts:237` et `:253` : sauvegarde Annuaire, transaction et rejeu d'opération. |
| Besoin calculé | `src/main/crm/CrmService.ts:1043` : `group_concat` des noms catalogue ; `:1062` : affectation à `primaryNeed`. `src/main/workflow/WorkflowService.ts:31` : lecture des besoins structurés. |
| Écritures globales | `src/renderer/crm/ProspectsPageV2.tsx:372` et `src/main/crm/CrmService.ts:689`. Les CAS spécifiques commencent à `:747` et `:824`. |
| Coordonnées | `src/main/crm/CrmService.ts:376`, `:567`, `:633`, `:642`, `:659` : lecteurs avec repli, sauvegarde/archivage sans synchronisation des colonnes historiques. Migration 19 : initialisation de `contact_methods`. |
| Contact mono-organisation | `src/main/database/migrations.ts:91` : `contacts.organization_id` ; `src/main/workflow/WorkflowService.ts:15` : liste par ce lien unique. |
| Décideur | `src/main/ipc.ts:319` : l'IPC appelle bien `workflow.setDecisionMaker` avant `updateProspectQualification`. L'absence de la FK dans l'UPDATE de ce dernier service ne constitue donc pas, seule, un défaut de sauvegarde. |
| Recherche | `src/main/crm/CrmService.ts:1084` et `:1111` : versions `research_snapshot` dans `activity_events.metadata_json`. |
| Actions | `src/main/crm/ActionService.ts:258` : synchronisation des champs historiques ; `src/renderer/crm/ClientsPage.tsx:525` et `:542` : écriture directe côté Client. |
| Conversion et journal | `src/main/crm/CrmService.ts:1242` : conversion ; `:1385` : lecture d'activité par entité exacte. Migration 19 : trigger de rattachement des besoins au Client. |
| Devis et Projet | `src/main/commercial/QuoteService.ts` : création 221, préparation 632, acceptation 731 ; `src/main/projects/ProjectService.ts` : préparation 338, création 405. |
| Six colonnes | `src/shared/prospectPipelineProjection.ts:17` et `:35` : projection des statuts et du signal d'accord du devis courant, sans nouveau statut Finalisation. |

## 3. Lire la matrice

« Partagé » signifie que plusieurs vues consultent la même ligne ou FK. « Initialisé » signifie une copie à la création, sans synchronisation ultérieure. « Versionné » signifie une copie historique intentionnelle. L'affichage répété d'un champ partagé n'est pas une double saisie.

Dans les tableaux, chaque nom de colonne séparé par une virgule est un champ distinct ; les familles imbriquées JSON sont détaillées séparément. Les champs techniques ID, horodatages et archivages sont regroupés en fin de matrice.

## 4. Matrice — entreprise et contacts

| Information / stockage SQLite | Saisie actuelle et réutilisation | Diagnostic et cible |
|---|---|---|
| `organizations.name` | Création Prospection ; Annuaire ; Identité du dossier ; affiché Prospect, Client, devis | Partagé. Conserver comme nom usuel ; proposer recherche/réutilisation avant création. |
| `legal_name`, `siret` | Éditeur entreprise Annuaire ; pas dans la création rapide Prospection | Conserver sur l'entreprise. Inutiles pour démarrer un échange ; les demander au moment pertinent pour les documents. Ne pas les ressaisir dans un dossier. |
| `industry` | Création, Annuaire, Identité ; activité affichée aussi en Référence | Partagé. Conserver ; métier de l'entreprise distinct du type de prestation vendue. |
| `notes` | Description d'activité lors de la création ; notes entreprise Annuaire/Identité ; notes source en recherche | Même colonne utilisée avec une portée trop large. Réserver aux informations stables sur l'entreprise ; sortir besoin, échange et proposition de ce champ. Ne pas convertir automatiquement les anciennes notes ambiguës. |
| `website` | Création, Annuaire, Identité ; préremplissage initial de Référence | Source officielle entreprise. Conserver une édition maître ; distinguer URL auditée et URL du site concerné par le projet. |
| `address_line1`, `address_line2`, `postal_code`, `city`, `country` | Annuaire complet ; création/Identité exposent un sous-ensemble ; ville affichée dans plusieurs vues | Partagé, pas doublon. Une adresse maître ; conserver les champs non exposés lors des sauvegardes partielles. Ne pas rendre une adresse complète obligatoire dès la prospection. |
| `organizations.email`, `phone` | Colonnes historiques ; anciens services ; nouvelles méthodes selon chemin de création | Retirer comme sources éditables concurrentes après migration contrôlée. Le canal générique de l'entreprise appartient à ses `contact_methods`. |
| `contacts.first_name`, `last_name` | Création, Annuaire, Identité, ajout de contact ; devis/Client via lien | Partagé. Rechercher une personne existante ; ne jamais dédupliquer automatiquement sur le seul nom ou email partagé. Une saisie partielle des noms en création entreprise doit être explicitement signalée, pas ignorée. |
| `contacts.organization_id` | Organisation du Contact Annuaire ; rattachement depuis Contacts liés | Vrai lien mono-organisation. Contacts liés montre les personnes de l'entreprise, pas une liste indépendante propre au dossier. Prévoir relation multiple seulement après validation du modèle cible. |
| `contacts.job_title` | Annuaire, Identité, ajout de contact ; intitulé du décideur | Fonction aujourd'hui globale à la personne. Cible : fonction sur la relation entreprise/personne. Ne pas confondre avec rôle commercial ou rôle de facturation. |
| `contacts.preferred_channel` | Éditeur Contact Annuaire | Conserver préférence personne ; ne prouve pas qu'un canal est disponible. Ne pas exiger au départ. |
| `contacts.notes` | Annuaire Contact | Notes personne, pas compte rendu de dossier. Conserver avec accès depuis la fiche liée. |
| `contacts.email`, `phone` | Création rapide les écrit ; plusieurs DTO historiques les lisent | Même risque que l'entreprise. Migrer vers méthodes canoniques avec traitement des divergences et valeurs archivées. |
| `contact_methods.organization_id` ou `contact_id` | Panneau Coordonnées Annuaire/Prospect/Client | Propriétaire exclusif, partagé. Entreprise pour standard/adresse générique ; personne pour coordonnée personnelle. Ne pas dupliquer un standard sur chaque personne. |
| `contact_methods.type`, `value` | Ajout email/téléphone ; liens, copie, recherche et résumé selon lecteur | Source cible unique. Normaliser sans fusionner deux personnes. Prévoir modification de la méthode existante plutôt qu'archiver/recréer pour une simple correction. |
| `contact_methods.label` | Usage choisi lors de l'ajout | Conserver ; distinguer usage et caractère principal. Corriger les présentations répétant « Principal · Principal ». |
| `contact_methods.is_primary` | Première méthode d'un type marquée principale ; service gère l'unicité active | Conserver principal **par propriétaire et type** ; ce n'est pas le contact principal du dossier. Rendre le choix explicite si plusieurs méthodes. |
| `contact_methods.notes`, `archived_at` | Notes prévues par contrat ; archivage depuis le panneau | Préserver. Une méthode archivée ne doit pas réapparaître via une ancienne colonne. |
| `crm_identity_assets` : propriétaire, `role`, `relative_path`, `original_name`, `mime_type`, `size_bytes` | Identité/logo/avatar ; réutilisation sur vues de la même identité | Partagé par entreprise/personne ; pas une copie par Prospect. Conserver fichier maître et métadonnées ; aucune migration des visuels nécessaire pour réorganiser les champs. |
| `client_contact_roles` : compte, contact, rôle, principal | Contacts Client, rôles primary/administrative/billing/technical/other | Conserver : rôle dans la relation Client, différent de la fonction professionnelle. Ne remplace pas la relation personne/entreprise. |

### Limite précise des associations

`WorkflowService.identity` ajoute à la liste les personnes explicitement référencées comme interlocuteur/décideur, même si elles ne proviennent pas de la liste organisationnelle. Cela permet une référence, pas un vrai emploi multi-entreprises. L'ajout depuis la fiche ne réaffecte pas silencieusement un contact d'une autre entreprise. La détection de candidats dans `ProspectLinkedContactsPanel` reste une protection d'interface, pas une contrainte de déduplication universelle ; les homonymes et emails communs exigent un choix explicite.

## 5. Matrice — dossier, qualification et besoins

Tous les champs suivants sont dans `prospects`, sauf mention contraire.

| Champs / stockage | Saisie, affichage et partage actuels | Organisation proposée |
|---|---|---|
| `organization_id`, `contact_id` | Création et Identité ; réutilisés dans résumés, devis, conversion | Conserver les FKs. Le contact principal du dossier n'est pas nécessairement le contact principal du Client ni le décideur. |
| `source`, `source_detail` | Création ; fiche et filtres selon présentation | Canal d'acquisition et précision. Conserver ; préremplir depuis contexte de création, éditable. |
| `origin_type` | Inféré depuis source à la création ; Qualification | Nature de la relation : sortant, entrant, recommandation, existant, partenaire, autre. Proche de source mais sens distinct. Ne pas fusionner ; présenter les deux clairement et éviter un second choix inutile si l'inférence convient. |
| `stage` | Démarrage/passage d'étape, actions et événements devis | Conserver les transitions protégées et leur journal. Le nouvel entrant `new` reste hors pipeline actif. |
| `temperature` | Création et commande rapide Annuaire ; synthèse | Appréciation commerciale globale cold/neutral/warm/hot. Ne pas l'assimiler à une preuve d'intérêt client. |
| `interest_level` | Qualification : none/low/confirm/interested/very_interested | Niveau d'intérêt explicite utilisé par les règles de qualification. Conserver pour ces règles ; expliquer sa différence ou réserver température à la synthèse. Pas de conversion automatique 4↔5 niveaux. |
| `targeting_reason_code`, `targeting_reason_text` | Qualification sortante | Pourquoi contacter cette entreprise. Utile avant premier échange ; masqué/replié en entrant, conservé historiquement. |
| `initial_observation` | Qualification sortante | Constat initial daté par l'activité de saisie, pas preuve de demande client. Conserver ; lien vers la recherche plutôt que ressaisie de tout l'audit. |
| `detected_opportunity` | Qualification sortante | Hypothèse commerciale, pas besoin confirmé ni prestation engagée. Conserver distinct, proposer un transfert volontaire vers besoin confirmé. |
| `first_contact_result_code`, `first_contact_result_text` | Qualification | Résumé initial structuré, susceptible de recouper un compte rendu d'action | Préremplir depuis le premier échange terminé avec provenance ; conserver l'ancien résumé. Pas d'écrasement par le dernier échange. |
| `project_summary` | « Demande initiale » en entrant / motif en Qualification ; résumé du projet en Besoins ; injecté dans brouillon devis | **Même valeur, plusieurs sens**. Séparer à terme demande initiale et besoin confirmé. La modification en Besoins change actuellement la demande affichée en Qualification. |
| `project_context` | Qualification et Besoins ; injecté dans résumé devis | Même partage et même ambiguïté. Un seul contexte de dossier peut suffire, à condition de nommer sa portée ; conserver les versions/source pour les informations initiales. |
| `primary_need` | Ancien texte ; DTO remplacé prioritairement par concaténation de `crm_needs` | Sortir le calcul catalogue de ce nom. Exposer explicitement besoin exprimé et prestations sélectionnées. Masquer l'ancien champ à terme sans le supprimer ni réécrire sa valeur par un DTO calculé. |
| `secondary_need` | Contrat/service historique ; peu exposé dans les panneaux actuels | Ne pas créer une seconde liste de prestations. Conserver en lecture patrimoniale et proposer classement manuel dans le besoin confirmé. |
| `crm_needs.catalog_item_id`, `other_text`, `prospect_id`, `client_account_id` | Panneau Besoins : choix catalogue ou besoin libre ; projection dossier, préparation devis, Client après lien | Association existante à conserver. Séparer visuellement besoin libre client et prestation catalogue ; ne pas convertir automatiquement l'un en l'autre. Les noms catalogue sont lus en version courante, pas figés comme un devis. |
| `budget_status`, `budget_min_cents`, `budget_max_cents` | Besoins ; montant exact/palier converti en statut et bornes ; contrôle avant devis | Budget exprimé par le client. Conserver avec non communiqué ; ne pas déduire des prix du devis. Les paliers ne sont pas des champs indépendants. |
| `estimated_value_cents` | Création, contrat général Prospect ; synthèses éventuelles | Estimation commerciale du dossier, distincte du budget et du devis. Déplacer de la création rapide vers qualification avancée ; afficher si estimée manuellement ou calculée, sans inventer de synchronisation actuelle. |
| `probability_percent` | Contrat/service Prospect ; pas un champ central du parcours actuel | Conserver les données ; masquer de la saisie initiale. Ne pas la recalculer implicitement depuis température ou étape. |
| `timeline_status`, `target_date`, `timeline_note` | Besoins ; date souhaitée ou indication/non communiqué ; délai du devis initialisé à partir de ces valeurs | Échéance souhaitée par le client. Distincte de la date d'action, validité du devis et date de production Projet. Préremplissage proposé, pas engagement automatique. |
| `existing_status`, `existing_url`, `existing_notes` | Besoins | Existant concerné par la demande. Proposer le site officiel comme valeur initiale explicitement acceptée ; l'URL auditée peut être différente. Ne pas maintenir trois champs indistincts « Site web ». |
| `decision_status` | Identité et Qualification : interlocuteur décideur oui/non/inconnu | Partagé, utile avant devis. Garder une commande métier unique et un affichage partout. |
| `decision_maker_contact_id` | Choix/création d'une vraie personne ; IPC + Workflow ; affichage Identité | Référence canonique à conserver. Généraliser les lectures résolues par FK plutôt que les anciens textes. |
| `decision_maker_details` | Identité / Qualification | Précision du circuit de décision, pas identité du décideur. Conserver. |
| `decision_maker_name`, `decision_maker_role`, `decision_maker_email`, `decision_maker_phone` | Colonnes anciennes ; éditeur moderne les efface en privilégiant le Contact lié ; certains résumés les lisent encore | Masquer en édition ; garder en lecture de compatibilité et migrer vers un Contact seulement après résolution des ambiguïtés. Aucun rapprochement automatique au nom seul. |
| `missing_information` | JSON version 1, items `id,label,status,isBlocking,answer,resolvedAt` ; ancien texte accepté | Une seule checklist partagée Besoins/avant-devis. Conserver état ouvert/résolu/plus tard, réponse et blocage ; ne pas copier en notes ou actions. Une action peut pointer vers une question sans dupliquer sa réponse. |
| `notes` | Notes générales du dossier, contrat/service et recherches | Réserver aux notes de dossier non structurées. Retirer de ce fourre-tout identité, budget et résultats d'échange déjà structurés. Garder l'ancien texte accessible. |
| `next_action_at`, `next_action_text` | Projetés par ActionService ; certains updates complets peuvent aussi les écrire | Lecture de compatibilité, pas deuxième éditeur. Afficher l'action ouverte pertinente de `crm_actions`. |
| `waiting_reason_code`, `waiting_reason_text`, `waiting_resume_at` | Mise en attente / refus et reprise | Conserver au dossier ; la date de reprise peut proposer une action à confirmer, pas créer silencieusement un doublon de relance. |
| `lost_reason`, `lost_reason_code`, `lost_at` | Clôture perdue ; contrôle du motif et historique | Texte/code/horodatage distincts. Un refus de devis ne signifie pas automatiquement dossier perdu. |
| `prospecting_started_at`, `qualification_validated_at`, `won_at` | Événements de progression / conversion | Automatiques, non à ressaisir. Conserver leur sens métier et les dérogations de qualification journalisées. |
| `client_account_id` | Conversion protégée et acceptation selon parcours existant | Lien de continuité ; ne pas recréer un Prospect « Client ». |

## 6. Matrice — Référence prospect / recherche

**Stockage commun à toutes les lignes de cette section :** `activity_events`, `action='research_snapshot'`, `metadata_json.snapshot.<clé>`, avec `entity_type='prospect'`, `entity_id` et liens de contexte. Chaque sauvegarde ajoute une version ; ce ne sont pas des colonnes `organizations`. L'historique versionné est utile, pas une duplication de saisie à supprimer.

| Clés JSON | Saisie/réutilisation actuelle | Cible et pertinence |
|---|---|---|
| `checkedAt`, `source`, `sourceUrl` | Référence ; création rapide initialise date du jour/source « Saisie annuaire » | Séparer collecte et vérification effective. Une simple saisie ne doit pas être présentée comme contrôle accompli. Source et date observée conservées sur chaque version. |
| `services[]`, `products[]`, `customerSegments[]`, `differentiators[]` | Création et onglet Entreprise de Référence | Activités/offre **de l'entreprise prospectée**, pas prestations vendues par AtoumWeb. Conserver comme connaissance d'entreprise réutilisable entre dossiers. |
| `googleBusiness.presence`, `url`, `category`, `rating`, `reviewCount` | Web & visibilité | Faits de recherche sourcés ; conserver sans obliger avant premier contact. Ne pas confondre URL fiche Google et site officiel. |
| `googleBusiness.hoursStatus`, `photosStatus`, `websiteLinkedStatus`, `contactConsistencyStatus`, `notes` | Contrôles rapides et remarques de la fiche | Conserver dans recherche. Incohérence observée ≠ correction automatique de l'identité. |
| `website.presence`, `url`, `cms`, `hosting` | Site observé, initialisé depuis URL entreprise/existant si disponible | Version observée, pas source officielle en écriture. Une correction du site officiel doit être explicite dans Identité. |
| `website.httpsStatus`, `responsiveStatus`, `ecommerceStatus`, `bookingStatus`, `contactFormStatus`, `blogStatus`, `notes` | Contrôles rapides Web | Conserver ; distinguer constat rapide du contrôle détaillé mobile. Proposer réutilisation de la conclusion détaillée, sans deux réponses obligatoires pour la même observation. |
| `legalNotices` | Contrôle détaillé Mentions légales | Recherche facultative ; aucun statut ne constitue une certification juridique. |
| `audits.privacy`, `.cookies`, `.seo`, `.performance`, `.mobile`, `.accessibility` | Six autres contrôles | Conserver en recherche progressive ; aucun blocage du parcours ajouté par cet audit. |
| Pour chacun des sept contrôles : `overallStatus`, `items[].key/label/status/note`, `observations`, `talkingPoint`, `source`, `url` | État global saisi et états des critères distincts ; observations, argument et provenance | Le global n'est pas automatiquement calculé depuis les critères. Clarifier « conclusion » vs détail ; éviter divergence avec une suggestion calculée modifiable, sans altérer les versions enregistrées. |
| `opportunities[].finding`, `service`, `priority`, `note`, `keep` | Onglet Opportunités ; service en texte libre | Hypothèse de vente. `service` n'est pas un ID catalogue et ne crée ni besoin ni ligne de devis. Ajouter une sélection catalogue facultative ou un transfert explicite ; ne pas transformer les opportunités cochées en commande. |
| `conversation.strengths`, `issues`, `talkingPoints`, `approach` | Préparation de conversation dans Référence ; certains champs initialisés à la création | Préparation propre au dossier ; à rendre visible depuis préparation d'action par référence. Les faits entreprise restent partagés, l'angle de conversation reste commercial. |
| `conversation.callNotes` | « À ne pas oublier / notes pendant l'appel » | Deux sens incompatibles. Garder préparation ici ; résultats réels dans le compte rendu d'action. Anciennes notes visibles avec provenance, sans déplacement automatique supposant leur sens. |
| `id`, `prospectId`, `createdAt` de la version | Attribués à la sauvegarde | Techniques/historiques ; conserver. `createdAt` n'est pas une date de vérification de terrain. |

### Critères détaillés existants

Chaque clé ci-dessous possède un statut et une note dans `items[]` ; aucune ne devient un champ obligatoire de création.

| Groupe | Clés des critères |
|---|---|
| Mentions légales (8) | `identity`, `address`, `registration`, `contact`, `publisher`, `hosting`, `consistency`, `access` |
| Confidentialité (5) | `privacy-policy`, `controller`, `purposes`, `rights`, `contact` |
| Cookies (4) | `banner`, `refuse`, `prior-consent`, `preferences` |
| SEO (5) | `title`, `description`, `h1`, `indexable`, `local` |
| Performance (3) | `loading`, `images`, `errors` |
| Mobile (4) | `layout`, `navigation`, `tap-targets`, `forms` |
| Accessibilité (4) | `contrast`, `alt`, `headings`, `controls` |

Soit 33 critères détaillés, en plus des constats rapides. Répéter le nom et l'adresse dans un contrôle signifie « cohérence vérifiée », pas créer une seconde identité légale.

## 7. Matrice — actions, échanges et journal

| Information / SQLite | Fonctionnement réel | Proposition |
|---|---|---|
| `crm_actions.owner_type`, `prospect_id`, `client_account_id` | Propriétaire Prospect ou Client ; les anciennes actions ne changent pas automatiquement de propriétaire à la conversion | Conserver l'origine ; lecture transversale par liens, pas copie des lignes ni déplacement destructif d'historique. |
| `type`, `title`, `due_at` | Dialogue action/relance ; date obligatoire pour follow_up | Action à effectuer, pas échange déjà réalisé. Une commande commune Prospect/Client. |
| `notes` | Préparation / notes de l'action avant exécution | Nommer « Préparation » ; réutiliser les arguments de Référence sans ressaisie. |
| `target_contact_id` | Personne ciblée ; contrôle existence/activité | Garder lien. Montrer l'entreprise et le rôle pour éviter le choix d'une personne hors contexte ; ne pas inventer de relation d'emploi lors du choix. |
| `reason_code`, `reason_text` | Motif structuré / précision | Conserver lorsque pertinent ; pas une deuxième description obligatoire du besoin. |
| `related_type`, `related_id` | Objet métier lié, notamment devis | Conserver référence ; ne pas coller le contenu du devis dans l'action. |
| `recurrence_*` | Paramètres de répétition ; création de la suite selon service | Conserver ; distinguer série et action suivante ponctuelle, éviter double proposition. |
| `status`, `completed_at` | open/done/cancelled ; passage terminé/annulé/réouvert | Automatiques via commandes ; aucune ressaisie de date de dernière activité. |
| `completion_channel`, `completion_outcome`, `completion_notes` | Compte rendu réel de fin d'action | Source maître du résultat d'échange. Un événement de journal ne contient pas à lui seul ce compte rendu complet. |
| Action suivante | Créée comme nouvelle ligne, éventuellement avec récurrence | Vrai nouvel objet, pas doublon de la précédente ; afficher son lien et préremplir propriétaire/contact/contexte. |
| Dernière activité | Dernier `activity_events.created_at` du dossier | Inclut modification administrative/qualification. Garder le libellé ; ne pas l'appeler « dernier échange ». |
| Dernier échange | Pas de champ/projection métier dédié identifié | Ajouter une projection des actions terminées représentant réellement une interaction. Définir quels canaux/résultats comptent ; une tâche terminée n'est pas nécessairement un échange. Pas besoin d'une date saisie à la main. |
| `activity_events.action`, `summary`, `metadata_json`, liens de contexte, `created_at` | Événements automatiques ; filtre d'entité exact ; actions journalisées avec résumé, sans leur résultat détaillé complet | Conserver journal append-only ; proposer détail lié à l'action/devis et vue regroupée, avec dédoublonnage par ID d'événement. |

## 8. Matrice — devis, parcours, Client et Projet

| Données / stockage | Réutilisation actuelle | Cible / protection |
|---|---|---|
| `quotes.prospect_id`, `client_account_id` | Liens de création et conversion/acceptation | Conserver mêmes identités ; pas de deuxième Client pour une nouvelle affaire de la même entreprise. |
| `quotes.subject`, `need_summary` | Initialisés depuis besoin sélectionné et brief, puis éditables dans devis | **Copie documentaire intentionnelle.** Le besoin du dossier reste maître pour la qualification ; le devis a sa formulation commerciale. Signaler la provenance à la création, pas synchroniser rétroactivement. |
| Validité / date de validité, délai estimé, acompte | Préremplis à la création (notamment validité 30 jours et acompte 30 % dans le parcours avant-devis) ; devis ensuite | Paramètres du devis, pas budget client ni relance. Conserver les règles existantes ; distinguer suggestion et engagement. |
| `quote_lines` : catalogue/version, description, quantités, prix, taxes, options, `snapshot_json` | Préparation des lignes depuis besoins/catalogue ; valeurs du document | Prix proposé distinct du budget. Versions et snapshots indispensables ; ne pas relire une nouvelle version catalogue pour réécrire un devis engagé. |
| Préparation contrat, instantanés, empreintes, pièces et transmissions | Services commerciaux ; préparation obligatoire puis envoi protégé | Conserver intégralement. La présence d'un libellé destinataire figé ne prouve pas, à elle seule, que toutes les coordonnées/adresses sont figées : vérifier chaque export avant un futur changement de source. |
| Accord de principe du devis courant | Signal `principleAgreementAt` pour projection Finalisation | Conserver signal explicite ; pas conversion, pas nouveau statut Prospect. |
| Acceptation / refus | Acceptation convertit/rattache selon service ; refus peut mener à attente et compte rendu | Conserver confirmation et invariants. Refus devis ≠ perte automatique ; accord de principe ≠ acceptation contractuelle. |
| Six colonnes actives | À qualifier ; Besoins ; Préparer le devis ; Attente du retour ; Négociation ; Finalisation | Ne changer ni leur nombre ni leur projection. Les statuts techniques restent plus nombreux ; nouveau, gagné, perdu, archivé et converti n'ajoutent pas de colonne active. |
| `client_accounts.organization_id`, `primary_contact_id` | Conversion réutilise ou crée compte, avec mêmes FKs | Continuité d'identité réelle. Les besoins sont rattachés au compte par trigger ; pas dupliqués. |
| `client_accounts.status`, `notes`, `relationship_status`, `relationship_note` | Éditeurs Client ; certaines sauvegardes ciblées protégées | Relation Client distincte du dossier et de sa température. Ne pas recopier aveuglément les notes Prospect. |
| `client_accounts.next_action_at`, `next_action_text` | Édition directe Client ; ActionService peut également les recalculer | Remplacer l'édition directe par le même service d'actions ; réconcilier les valeurs anciennes avant migration. |
| Brief, recherche, actions du Prospect converti | Restent sur le dossier source | Pas de perte en stockage ; manque de continuité de consultation. Rendre accessibles depuis Client via liens, sans recréer la recherche et les échanges. |
| `projects` : client, Prospect, `source_quote_id`, nom, date cible | Nom initial depuis sujet devis ; date de préparation Projet saisie séparément | Date de production distincte de date souhaitée client. Proposer préremplissage contrôlé, jamais assimiler les deux sans confirmation. |
| `project_services` : `source_quote_line_id`, version catalogue, instantanés | Projet dérivé des lignes et modèles autorisés | Conserver versions et liens. Modification d'un brief ou du catalogue ne doit jamais modifier rétroactivement un Projet/contrat existant. |

### Champs techniques transversaux

IDs, `created_at`, `updated_at`, `archived_at` et empreintes sont générés par les services ; ils servent aux liens, tris, conflits et protections. Ils ne deviennent pas des champs de formulaire. L'archivage est distinct de la perte d'une affaire et de l'annulation d'une action. Les champs de recherche calculés, compteurs, libellés d'identité, signaux de devis et états d'historique sont des projections : ils doivent être exclus des commandes d'écriture métier.

## 9. Organisation cible proposée

### A. Entreprise et personnes

L'entreprise porte identité, adresse, activité, site officiel et coordonnées génériques. La personne porte son identité, ses coordonnées personnelles et préférences. Sa relation à une entreprise porte fonction et contexte professionnel. Le dossier sélectionne ses interlocuteurs et son décideur parmi ces personnes ; le Client conserve ses rôles administratifs/facturation/techniques.

La création commence par « Rechercher ou créer une entreprise », puis « Associer ou créer une personne ». Minimum : entreprise ou personne correctement identifiée, origine utile ; la première action reste facultative. Adresse complète, SIRET, audit web, budget et valeur estimée ne bloquent pas une simple entrée dans l'annuaire.

### B. Fiche de travail

Conserver l'en-tête et les deux panneaux à la demande déjà validés, ainsi que les deux onglets pleine largeur. La synthèse montre étape, température, intérêt explicite si utile, prochaine action réelle et date du dernier échange distincte de dernière activité.

Sections proposées, sans changer les règles de passage :

1. **Origine et demande initiale** : provenance, raison du ciblage ou demande reçue, constat initial ; données initiales conservées.
2. **Qualification et besoin confirmé** : besoin en mots client, contexte, interlocuteurs/décision, budget communiqué, échéance souhaitée, existant et informations manquantes.
3. **Prestations et devis** : sélection catalogue séparée du besoin client, estimation commerciale, revue avant devis, documents et état du devis courant.
4. **Échanges et actions** : préparation, programme, compte rendu réel, prochaine action et historique lié.
5. **Clôture et continuité** : attente, perte, archivage, conversion protégée et accès Client/Projet.

### C. Référence

Faits et contrôles entreprise réutilisables ; chaque observation garde source/date/version. Opportunités et préparation commerciale restent rattachées au dossier. Un échange terminé appartient aux actions, jamais seulement à une version de recherche.

Un nouveau dossier de la même entreprise propose la connaissance déjà disponible, indique son ancienneté et permet une nouvelle version. Il ne doit pas prétendre qu'un contrôle ancien vient d'être refait. Une recherche d'entreprise et un angle commercial de dossier ne peuvent pas être fusionnés sans distinguer leur portée.

### D. Ce qui doit rester distinct

| Ne pas fusionner | Raison |
|---|---|
| Source / origine | Canal d'acquisition / nature du contact. |
| Température / intérêt | Appréciation interne / intérêt explicite utilisé par les règles. |
| Demande initiale / besoin confirmé | Évolution du besoin et provenance à conserver. |
| Budget / valeur estimée / montant devis | Capacité annoncée / prévision commerciale / proposition chiffrée. |
| Site officiel / URL auditée / existant du projet | Trois objets parfois identiques, parfois différents. |
| Préparation / compte rendu | Intention avant échange / fait réellement constaté. |
| Dernier échange / dernière activité | Interaction / toute modification du dossier. |
| Donnée vivante / snapshot devis ou contrat | Référentiel actuel / preuve de ce qui a été proposé ou engagé. |

## 10. Règles de préremplissage

| Déclencheur | Automatisation proposée | Limite |
|---|---|---|
| Sélection entreprise/personne | Afficher identité et méthodes actuelles par ID | Pas recopier les coordonnées dans Prospect ou Client. |
| Création dossier | Inférer origine depuis provenance ; proposer personnes liées | Confirmer les cas ambigus ; pas dédupliquer un homonyme automatiquement. |
| Ouverture Référence | Réutiliser dernière connaissance d'entreprise et sa date | Pas changer `checkedAt` tant qu'une vérification n'a pas eu lieu. |
| Confirmation du besoin | Proposer demande initiale comme point de départ | Conserver l'original ; pas l'écraser. |
| Préparation échange | Montrer constats et arguments de Référence | Notes de préparation distinctes des résultats. |
| Premier échange terminé | Proposer résumé de premier contact | Aucun écrasement silencieux ; lien vers action source. |
| Devis brouillon | Initialiser résumé, destinataire et suggestions de délai | Snapshot volontaire ; avertir sur mise à jour d'un brouillon, jamais modifier un devis engagé. |
| Conversion | Réutiliser identité et liens ; rendre historique navigable | Pas copier les personnes, actions ou événements. |
| Projet | Proposer échéance souhaitée comme suggestion | Confirmation de la date de production ; règles actuelles du service conservées. |

## 11. Travaux possibles et migrations à valider

### Lot proposé 1 — fiabiliser les accès, sans nouveau modèle métier

- Unifier lectures des coordonnées et décideurs ; supprimer les replis qui réactivent une valeur archivée, après analyse de compatibilité.
- Séparer DTO de lecture calculés et commandes d'écriture ; sauvegardes ciblées avec contrôle de conflit.
- Réutiliser les services Annuaire pour la création Prospection, avec recherche de l'existant, opération idempotente et transaction de création complète. Une transaction SQLite ne traverse pas plusieurs appels IPC indépendants : il faut une commande orchestrée côté main.
- Unifier commandes d'actions Prospect/Client ; lectures de continuité après conversion par liens explicites.
- Clarifier libellés, affichages et sections sans supprimer les données historiques.

Fichiers principaux : `src/renderer/crm/ProspectsPageV2.tsx`, `ClientsPage.tsx`, `ProspectIdentityPanel.tsx`, `ProspectDecisionEditor.tsx`, `ProspectLinkedContactsPanel.tsx`, `ContactMethodsPanel.tsx`, `src/renderer/directory/DirectoryPage.tsx`, `src/main/crm/CrmService.ts`, `ActionService.ts`, `src/main/workflow/WorkflowService.ts`, `src/main/ipc.ts`, contrats `src/shared/crm.ts` et pont preload concerné. Vérifier tous les consommateurs avant de changer le sens de `primaryNeed`.

### Lot proposé 2 — réconcilier les anciennes coordonnées

Migration additive et rapport d'anomalies : colonnes anciennes vs méthodes actives/archivées, mêmes valeurs normalisées, absence de méthode et divergences. Importer uniquement les valeurs non ambiguës en conservant provenance. Une valeur déjà archivée ne doit pas être réimportée comme active. Ne pas supprimer les colonnes dans ce premier lot ; neutraliser les anciens écrivains et lecteurs concurrents après vérification.

Même discipline pour les anciennes actions Client : comparer avec les actions ouvertes, importer au plus une fois avec une clé de provenance stable, jamais créer une deuxième relance équivalente. Une simple date ancienne ne prouve pas qu'une action est encore à effectuer.

### Lot proposé 3 — demande initiale et besoin confirmé

Ajouter un champ distinct pour la demande initiale et, si retenu, sa provenance/date ; réserver le brief actuel au besoin confirmé. **Les anciens `project_summary` sont ambigus** : ils ont pu être saisis comme demande initiale ou réécrits ensuite. Ne pas prétendre reconstruire l'original. Garder un libellé patrimonial « résumé existant, origine non déterminée », proposer un classement explicite ; toute initialisation de deux champs depuis ce texte doit rester identifiée comme reprise, pas deux faits historiques établis.

Clarifier besoin client libre vs choix catalogue et retirer le faux alias `primaryNeed`. Garder les anciennes colonnes lisibles jusqu'à validation de la reprise. Mise à jour des deux briefs CAS, du pré-devis et des contrats publics correspondants. Aucun contenu de devis/contrat historique recalculé.

### Lot proposé 4 — relation personne/entreprise

Si le multi-entreprises est validé : table de relation additive, par exemple `organization_contact_links`, référençant **les tables existantes**, avec unicité du couple actif, fonction, statut actif/archivé et rôle contextuel défini. Reprendre chaque `contacts.organization_id` en relation ; conserver provisoirement l'ancien champ comme compatibilité explicitement dérivée, pas un deuxième maître éditable. Reprendre `job_title` avec provenance, sans inventer les autres fonctions d'une personne.

À décider avant schéma : une personne peut-elle avoir plusieurs fonctions dans la même entreprise ? Les coordonnées professionnelles appartiennent-elles à la personne en général ou à une relation précise ? Le contact principal est-il par dossier, entreprise ou compte Client ? Recommandation : interlocuteur par dossier, rôles Client existants inchangés, fonction sur la relation, coordonnées génériques sur entreprise. Une coordonnée professionnelle limitée à une relation exige un lien explicite supplémentaire ; ne pas déplacer toutes les coordonnées personnelles sans examen.

Fichiers : migrations et registre `src/main/database/migrations.ts`, types CRM/workflow, Annuaire, identité, contacts liés, services CRM/Workflow, destinataires d'actions, recherche et exports. La migration ne doit ni fusionner des personnes ni modifier des snapshots contractuels.

### Lot proposé 5 — portée de la recherche et continuité

Les événements de recherche ont déjà des liens de contexte organisation/personne ; une lecture par entreprise est envisageable sans recréer un registre d'entreprises. Mais les versions actuelles mélangent faits entreprise et préparation du dossier. Les garder intégralement avec provenance ; définir un format de nouvelle version séparant ces portées, puis offrir la connaissance réutilisable par entreprise et les notes propres au dossier. Une ancienne version sans organisation fiable reste au Prospect source. Pas de transfert massif de toutes les notes vers l'entreprise.

Fichiers : `ProspectResearchPanel.tsx`, types de snapshots dans `src/shared/crm.ts`, lecture/sauvegarde de recherche dans `CrmService.ts`, affichages Client/dossier et journal. Versionner le JSON ; ne pas réécrire les anciens événements. Migration SQL seulement si l'indexation ou les liens nécessaires ne peuvent pas être exprimés avec les colonnes actuelles.

### Gestion des migrations

Le registre audité va jusqu'à 71. Les numéros futurs seront choisis dans l'état réel du registre **après validation**, sans modifier rétroactivement les migrations existantes. Exécution future d'abord sur bases temporaires, sauvegarde avant migration d'un espace existant, rapport des cas ambigus et reprise idempotente. Aucun script de migration n'est fourni ou exécuté par cet audit.

## 12. Risques et recette exigée avant réalisation

| Risque | Vérification à prévoir lors du lot concerné |
|---|---|
| Coordonnée ancienne réactivée / mauvais destinataire | Méthodes actives et archivées, principal par type, divergence legacy, propriétaire personne/entreprise ; Annuaire, Prospect, Client, recherche et documents. |
| Écrasement depuis une seconde fenêtre | Deux éditeurs sur même brief, changement température pendant édition, conflit identité, recherche concurrente ; brouillon conservé, message exploitable, aucune perte silencieuse. |
| Création partielle ou répétée | Échec après chaque sous-opération, rejeu même opération, réutilisation identité, noms partiels, homonymes et emails génériques. |
| Multi-entreprises réaffectant une personne | Deux organisations, deux fonctions, décideur externe, action ciblée ; ancien rattachement et droits de consultation conservés. |
| Mauvaise interprétation des textes anciens | Résumé initial/confirmé, notes d'appel mixtes, ancien texte checklist, décideur libre : aucune classification automatique irréversible. |
| Double relance / historique incomplet | Action ouverte avant conversion, ancienne prochaine action Client, complétion et suite, annulation/réouverture/récurrence ; événements regroupés une seule fois avec source. |
| Régression commerciale | Six colonnes et accord du devis courant ; gardes qualification et dérogations ; refus sans perte forcée ; acceptation et conversion idempotentes ; compte existant réutilisé. |
| Modification d'un engagement ancien | Devis brouillon vs envoyé/accepté, versions catalogue, contrats/préparations/transmissions, Projet préparé puis activé ; aucun recalcul rétroactif. |
| Régression UX-01 | Modification explicite, Annuler, fermeture/changement d'onglet, brouillons, suppression/archivage confirmés, clavier et récupération après erreur. |

Ce tableau est un plan de validation futur, pas un bilan de tests exécutés. Les suites applicatives déjà validées ne sont pas relancées pour ce document.

## 13. Décisions proposées à l'utilisateur

1. Valider la propriété des informations : entreprise, personne, relation, dossier, action, document et Projet.
2. Conserver demande initiale et besoin confirmé séparés ; prestations proposées dans un bloc distinct.
3. Conserver température et intérêt tant que les règles de qualification utilisent l'intérêt ; rendre leur différence lisible.
4. Faire des méthodes de contact et des actions les seules sources éditables correspondantes, avec reprise prudente des anciens champs.
5. Valider ou différer le multi-entreprises ; il ne doit pas être introduit implicitement comme simple correction graphique.
6. Réutiliser la connaissance entreprise et consulter le parcours complet après conversion, sans copier les historiques.

Ordre recommandé : fiabilisation des accès et créations → clarification des champs → reprises contrôlées → relations multiples si validées → partage de recherche. Chaque lot conserve les protections existantes et peut être relu avant application. **Aucun de ces lots n'est commencé par la remise de cet audit.**
