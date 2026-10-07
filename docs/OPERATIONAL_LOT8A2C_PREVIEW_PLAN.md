# Lot 8A.2C — Plan UX et technique de recette visuelle BROUILLON

Statut actuel : **PLAN VALIDÉ — implémentation et recette technique terminées ; validation manuelle à faire, aucun commit**. Le §13 trace la réalisation ; les sections de conception conservent le plan validé.
Date : 05/10/2026.
Base technique contrôlée : branche feature/project-page-compositions-v1, HEAD c2bd002deec7e6742a24943132627c2d3a79bb5f, working tree propre avant rédaction du plan.
Validation-MSI : migrations 1–62, SHA-256 3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526, inchangé pendant cette préparation.
Source métier : staging réel validé 8A.2B, 112 modèles draft, 94 associations draft, 7 profils non opérationnels ; 0 instance d’action, 0 cible contribution.

## 1. Résultat attendu

Afficher dans Manager les plans calculés à partir des vraies versions catalogue, modèles, structures, associations et politiques du staging.
Le périmètre commercial utilisé pour la recette reste un **scénario fictif** : les trois vrais devis historiques ne contiennent pas les lignes V1 nécessaires aux 18 previews.

Les interactions choisissent un scénario, ajustent ses seules données de recette et recomputent une projection.
Aucune modification du catalogue, des modèles, du devis réel, des Projets ou de leurs cibles. Aucun ready, publication, chrono, activation, import ou matérialisation, même dans la copie de recette.

## 2. Constat précis de l’existant

| Élément existant | Capacité constatée | Utilisation proposée |
|---|---|---|
| OperationalStagingService.previewQuote | Lit des lignes de devis persistées, les derniers liens de leurs versions catalogue et les vrais modèles ; calcule operations, blueprint, targets et logicalChoices | Moteur unique pour tous les previews |
| ProjectOperationalService.stageQuote | Temps, unités, catégories, provenance, estimation obligatoire, politiques actionKey | Réutiliser sans réécrire les règles |
| ProjectBlueprintCompositionService.stageQuote | Plan schemaVersion 2 avec bases isolées et contributions ; aucune écriture | Réutiliser, compter toutes les bases et contributions |
| ProjectContributionTargetService.plan | Cibles logiques actives/pending et capacités requises | Afficher les décisions sans synchronize/assignTarget |
| OperationalStagingService choix explicites | Sélection d’une occurrence de base du plan et d’une Page parente de cette base | Choix éphémères Site/Page dans la recette |
| IPC projects:preview-quote | Preview commercial normal, avec gardes runtime | Ne pas lui ajouter une exception draft |
| ContributionTargetChoices | Composant destiné à enregistrer/créer une cible réelle, auteur et onAssign | Réutiliser seulement la présentation ; composant de simulation distinct |
| OperationalActionDetails | Affichage d’un ProjectNode réel et modification de sa catégorie | Réutiliser les conventions visuelles ; détail preview pur sans onUpdate |
| ProjectCommercialScopePanel | Synchronisation, décisions de conflit et affectations persistées | Ne pas monter ce panneau dans la recette |
| CatalogPage | Consultation des brouillons, mais aussi publier/modifier/archiver | Présentation catalogue en lecture seule ; ne pas utiliser la fiche éditable complète |
| main.ts + DatabaseService.initialize | Restauration éventuelle, migrations, tracking démo, defaults, reconstruction d’index, sauvegarde quotidienne | Démarrage dédié avant ce chemin pour garantir l’invariance physique |
| IPC/preload/shared API | Aucun accès renderer à OperationalStagingService | Ajouter une petite API dédiée uniquement à la recette après feu vert |

Les guards de matérialisation des actions, blueprints et cibles rejettent déjà les plans marqués staging.
Aucune nouvelle migration ni adaptation des schémas 60–62 n’est nécessaire pour cette UI.

## 3. Parcours écran proposé

### Écran 1 — Entrée et contrôle de la source

Lancement explicite de **Manager — Recette opérationnelle BROUILLON**.
Ce mode ouvre une vue dédiée dans le renderer Manager avec le style et les thèmes existants, sans charger le démarrage métier normal.

Bandeau permanent : **BROUILLON — simulation uniquement — aucune donnée Projet créée**.
Afficher : source Validation-MSI, empreinte de la session, migrations, 112 modèles, 94 associations, 7 profils, tous non actifs.
Une source inaccessible, active en WAL, incohérente ou modifiée entraîne un arrêt explicite, aucun repli sur une autre base.

Dans ce mode : **Offres & Tarifs → Recette opérationnelle**.
L’ouverture depuis le Manager métier normal n’est pas indispensable à ce premier incrément : elle ne garantirait pas que son initialisation a laissé Validation-MSI intacte.

### Écran 2 — Scénarios et références

Colonne gauche : scénarios validés, groupés Vitrine / Landing / WooCommerce / Mariage / Addons / Sans structure / Pending.
Liste secondaire des références 8A réellement associées : AW, libellé informatif, version catalogue, modèle V1, classe A/B/C/D, statut draft.
Les 18 références 8B sont consultables comme source mais non sélectionnables dans les scénarios de recette : **Lot 8B inerte**.

Choisir un scénario charge son périmètre fictif avec les IDs exacts du staging courant vérifié.
Le choix d’un libellé n’effectue jamais un rapprochement ni une résolution d’identité.

### Écran 3 — Lignes et options de recette

Afficher pour chaque ligne : origine stable du scénario, AW, version catalogue, quantité, modèle opérationnel, ligne directe ou achat optionnel explicite.
Distinguer clairement :
- inclus réellement présents dans la composition de la version sélectionnée ;
- option disponible, non achetée ;
- option sélectionnée : ligne d’achat de recette distincte.

Attention : Vitrine V3 et Landing V3 sont réellement sans composant historique. Le staging ne leur a pas ajouté une nouvelle composition d’options.
Pour reproduire les deux tests d’option du dry-run, leur disponibilité est une **fixture explicite de scénario**, ajoutée uniquement dans le sandbox et signalée « option de recette, non configurée dans l’offre réelle ». Aucun faux affichage de disponibilité commerciale réelle.

Sélectionner/désélectionner et changer une quantité ne modifie que la requête de recette. Une option non sélectionnée n’alimente ni temps, clause, contribution ou prérequis.
Les prix existants peuvent être consultés ; aucun prix manquant n’est inventé. La recette opérationnelle ne calcule pas un contrat ni une facture.

### Écran 4 — Aperçu du périmètre

Synthèse : nombre d’actions de production, temps de référence, estimation initiale calculable ou incomplète, Sites, Pages et modules projetés.
Les conteneurs de phase ne sont pas comptés comme actions. Les slots d’extension d’un addon ne sont pas comptés comme nouveaux Sites.
Afficher séparément Pages de contenu, auxiliaires éventuellement déclarées et modules. Les produits Woo restent des modules.

Trois vues, sans montage d’un éditeur Projet :
1. **Structure** : occurrences de base isolées → Site projeté → Pages/modules, contribution et quantité.
2. **Phases et actions** : actionKey, libellé, checklist, temps de référence, catégorie métier, unité et provenance.
3. **Destinations et contrôles** : requirements, capacités fournies/requises, choix automatique unique ou choix explicite, pending, blocages.

Les identités de projection utilisent origine commerciale + slot + unité + templateNodeId réel.
Un Site/Page projeté n’est jamais présenté comme un objet réel : aucun projectId, siteId ou pageNodeId fictivement materialisé.

### Écran 5 — Choix de cible simulé

Une seule base compatible : montrer « cible simulée déterminée par occurrence unique ».
Plusieurs bases : sélection explicite de l’occurrence, avec référence, origine de ligne et capacités ; aucun choix silencieux.
Module dans Page : choisir la Page parente de la base cible parmi les IDs réels du template ; sa présentation peut montrer un libellé sans en faire une clé d’identité.

Bouton **Recalculer l’aperçu**. Aucun « Affecter », « Créer le Site », « Préparer le Projet » ou « Enregistrer ».
Les choix sont conservés uniquement dans l’état de la session et retournés comme logicalChoices. Ils sont perdus à la fermeture.

Les cibles D site/page/context restent pending lorsqu’aucune cible valide du scénario n’est disponible.
Les actions sans cible requise sont montrées comme « cadrage sans destination requise » ; les autres « destination requise avant préparation/intégration ». Toutes restent non exécutables dans ce mode, même si leur cible simulée est résolue.

### Écran 6 — Détail et traçabilité

Afficher : AW, IDs/numéros des versions catalogue et modèle, ID/révision du lien, ID/version du blueprint, provenance XLSX/import, origine et unité, politique versionnée, critères de quantité, provides/requires, achat optionnel de recette.
Les textes de checklist sont rendus comme texte ; aucun HTML/JS de bibliothèque exécuté.
Les hash/UUID complets restent dans un détail dépliable afin de garder la vue principale lisible.

## 4. Données et statuts d’affichage

| Donnée | Source | Règle d’affichage |
|---|---|---|
| Actions et référence unitaire | model_json réel | Aucune réécriture ni changement de valeur métier |
| Temps total de référence | Somme des actions du plan | Inclut les unités réellement sélectionnées ; exclut les conteneurs |
| Estimation finale | estimateRequired de chaque contribution | Si manque une estimation spécifique : « incomplète », jamais le cadrage comme estimation finale |
| Estimation courante/temps réel | Aucun ProjectNode/session créé | « Non établi en recette », « Aucune session enregistrée » ; ne pas simuler une vraie mesure |
| Catégorie métier du temps | action.category | Lecture seule, distincte d’une catégorie d’activité development/design |
| Statut draft/ready | Modèle, lien, profil séparément | Trois états indépendants ; cible simulée résolue ne signifie jamais mise en ready |
| Pages/modules | structureContract + unités | Identités explicites, aucune déduction depuis un nom ou une URL |
| Prérequis | Périmètre de recette et moteur existant | Seulement les prestations représentées par les lignes vendues du scénario |
| Hypothèse de cible | logicalChoices | Projection éphémère ; aucune décision opérationnelle persistée |
| Blocage | Validation métier du moteur | Code de diagnostic + message lisible + ligne/slot/actionKey concernés |
| Réponse périmée | Session/source et numéro de requête | Ignorer les réponses d’un ancien scénario ou état de sélection |

Les diagnostics différencient quantité invalide, Blog déjà prévu sur ce Site, capacité absente, cible ambiguë, Page parente absente, estimation obligatoire et dépendance structurelle manquante.
Les messages techniques ne doivent pas exposer des données client privées.

## 5. Composants proposés

Noms indicatifs, sans création à ce stade :
- OperationalRecipePage : écran orchestrateur et mode sûr, indépendant du bootstrap normal App.
- OperationalRecipeSourceBanner : source, états draft et invariance.
- OperationalRecipeScenarioPicker : cas validés et références.
- OperationalRecipeLines : lignes/options et quantités éphémères.
- OperationalRecipeSummary : actions, temps et structure.
- OperationalRecipeStructure : arbre de projection, occurrences multiples.
- OperationalRecipeActions : phases/actions, détail/checklist/provenance, filtre métier.
- OperationalRecipeTargets : choix Site/Page logiques, pending et capacités.

Réutiliser styles/tokens/panels, formatage des temps, badges et affordances existants. Les composants d’édition Projet ne sont pas utilisés avec des callbacks factices : leur comportement de mutation est absent de cette UI.

Thèmes AtoumWeb/Noir/Blanc, navigation clavier, labels des sélecteurs, focus conservé au recalcul, erreurs et résultats annoncés, petit écran et longues checklists.

## 6. Backend de session et garde lecture seule

Recommandation : **session de recette sur copie éphémère du staging réel**, utilisée uniquement pour les calculs.

1. Détecter un mode de lancement dédié avant resolveWorkspace/restore/DatabaseService.initialize.
2. Source fixée et contrôlée par le main ; aucune chaîne SQL ou chemin arbitraire envoyé par le renderer.
3. Vérifier fichier existant, empreinte attendue, absence WAL/SHM/journal et stabilité de l’empreinte avant/après copie ; contrôler schéma 1–62, intégrité et états du snapshot. Si la source est active ou change, refuser ; pas de checkpoint/migration « pour aider ».
4. Lire/copier la source sans connexion en écriture ni modification des préférences workspace. Répertoire de session distinct de Validation-MSI, contenant seulement la copie de travail et les éventuelles traces de recette.
5. Un constructeur minimal de fixture écrit seulement le devis, ses lignes et ses achats de scénario dans la copie ; pas de nouvelle version catalogue/modèle, profil, lien, état ready, Projet, action, cible, pack ou session. L’option disponible de fixture peut être représentée comme lors du dry-run, explicitement dans un savepoint sandbox.
6. Injecter ensuite au moteur un DatabaseAdapter de consultation : get/all autorisés ; run/exec de mutation refusés. La capacité d’écriture des fixtures reste privée au constructeur sandbox, jamais à l’IPC ni au moteur preview.
7. Calculer via OperationalStagingService.previewQuote. Ne pas passer par ProjectCommercialService.prepare, synchronize, assignTarget, ni les méthodes apply de production.
8. Valider la réponse, puis rollback des fixtures. Le snapshot de staging et toutes ses données sources restent logiquement identiques dans la copie ; fermer et détruire uniquement le répertoire de session contrôlé.
9. Contrôler l’empreinte de Validation-MSI après la session ; les essais et thèmes ne produisent pas de settings, index, activité, dossiers client ou provenance réelle.
10. Session fermée/invalide/crash : refus des requêtes et nettoyage limité aux chemins éphémères connus. Aucune relance automatique du mode métier normal.

Une copie technique n’est pas une seconde source métier : elle est datée, contrôlée par hash, non éditable commercialement et jetable.
Ne pas charger les anciens JSON de résultats comme vérité runtime : ils servent uniquement d’oracle de comparaison et de trace des résultats attendus.

## 7. IPC/API proposé

Namespace distinct, méthodes définies dans un contrat shared typé. Les noms ci-dessous sont proposés.

| IPC | API preload | Entrée | Sortie | Écriture métier |
|---|---|---|---|---|
| operational-recipe:state | operationalRecipe.state | Aucune | Mode autorisé par main, session, empreinte, compteurs, statut | Aucune |
| operational-recipe:references | operationalRecipe.references | Filtre/code/ID validé | Références et versions réelles, politiques, readiness | Aucune |
| operational-recipe:scenarios | operationalRecipe.scenarios | Aucune | Descripteurs des cas et paramètres permis | Aucune |
| operational-recipe:preview | operationalRecipe.preview | sessionId, scenarioId, quantités/achats permis, choix logiques, requestId | DTO de projection, contrôles, provenance, sourceFingerprint | Aucune ; fixture privée éphémère |
| operational-recipe:close | operationalRecipe.close | sessionId | Fermeture/confirmation | Aucune ; nettoyage sandbox uniquement |

Le DTO de sortie indique explicitement mode=staging, readOnly=true, canMaterialize=false. Ne pas distribuer un jeton d’application Projet ni une API apply/ready/save-target.
Le main lie session et appelant webContents/frame ; une query string renderer ou un champ mode envoyé par l’utilisateur ne donne jamais de droit supplémentaire.
Rejeter champs inconnus, projectId, ready/status, IDs hors session, choix dupliqués, quantités invalides et parentPage appartenant à une autre occurrence.
N’enregistrer que cette liste IPC dans le démarrage de recette ; les handlers usuels de mutation ne sont pas exposés. Conserver toutes les gardes runtime existantes.
Recalcul uniquement sur événements explicites ou debounced ; annulation/ignorance des réponses anciennes. Limiter taille/nombre de lignes selon les guards existants.

## 8. Limites fonctionnelles explicitement conservées

- StagingTargetChoice accepte actuellement une occurrence Site du plan et une Page de sa base. Il ne permet pas l’affectation d’un contexte réel ni d’un Site historique. En V1 de recette, ces cas restent pending et sont expliqués ; ne pas inventer des IDs pour les « résoudre ».
- Landing existing est une politique autorisée affichée. Les 18 previews validés utilisent Landing create. L’essai complet sur un Site existant ne sera pas prétendu couvert sans adaptation/test explicite supplémentaire.
- La Page parente choisie est dans logicalChoices ; pageNodeId reste null faute de matérialisation. La UI suit cette information et affiche « Page projetée sélectionnée », jamais « cible enregistrée ».
- Les modifications humaines, retraits travaillés et décisions après acceptation concernent des Projets réels. Le présent lot expose les projections et guards ; il ne crée pas de Projet pour les recetter.
- Les cinq catégories existent, mais seules les catégories réellement présentes dans les modèles sont attribuées aux actions de recette. Aucune réserve d’avant-vente/interne/garantie inventée.
- Aucun historique n’est utilisé pour deviner une option, une capacité Woo ou une association opérationnelle.

## 9. Scénarios nominaux à recetter

| Cas | Actions | Référence | Sites | Pages | Modules |
|---|---:|---|---:|---:|---:|
| Vitrine | 21 | 24 h 30 | 1 | 5 | 0 |
| Landing | 13 | 12 h 45 | 1 | 1 | 0 |
| WooCommerce | 20 | 42 h 30 | 1 | 4 | 0 |
| Mariage Essentiel | 9 | 10 h 30 | 1 | 1 | 0 |
| Mariage Grand Jour | 10 | 17 h | 1 | 1 | 0 |
| Mariage Histoire (correction 06/10/2026) | 10 | 23 h | 1 | 4 | 0 |
| Vitrine + 2 Pages + Blog | 34 | 31 h | 1 | 8 | 0 |
| Landing + Section, Page parente explicite | 16 | 13 h 20 | 1 | 1 | 1 |
| Woo + produit simple | 23 | 43 h | 1 | 4 | 1 |
| Woo + produit variable | 23 | 43 h 15 | 1 | 4 | 1 |
| Deux Vitrines + Page sur deuxième base | 46 | 50 h 45 | 2 | 11 | 0 |
| Article SEO seul | 5 | 3 h 30 | 0 | 0 | 0 |
| Cadrage WordPress, estimation finale absente | 3 | 2 h indicatives | 0 | 0 | 0 |
| Option disponible non achetée, Vitrine seule | 21 | 24 h 30 | 1 | 5 | 0 |
| Pack 4 articles SEO | 4 | 13 h | 0 | 0 | 0 |
| Application sur mesure, classe C, estimation finale absente | 3 | 3 h indicatives | 0 | 0 | 0 |
| Logo | 6 | 7 h | 0 | 0 | 0 |
| Audit SEO | 6 | 4 h 30 | 0 | 0 | 0 |

Contre-épreuve complémentaire : **AW-SEO-PERF** est une vraie D pending, quatre actions, zéro Site/Page, slot Site en attente ; AW-SEO-PERF-A04 reste site/integration.
Les anciens intitulés D pending WordPress/Application ne deviennent pas de nouvelles règles métier. Les libellés UI ci-dessus sont descriptifs ; codes/politiques restent exacts.

Recette interactive supplémentaire :
- option cochée/non cochée : ligne explicite, quantité et provenance présentes/absentes ;
- deux bases : addon pending, puis choix du deuxième Site projeté ;
- module : absence de Page parente, puis choix de la Page dans la base correcte ;
- D : distinguer actions none, site, page, context et requiredAt ; ne rien exécuter ;
- répétition / retour au scénario / fermeture : résultat déterministe, aucune sauvegarde métier.

## 10. Tests techniques et UI à préparer après validation

### Services et isolation
- Recalcul des 18 oracles plus vrai D pending avec IDs réels sur copie ; état source inchangé.
- Chaque preview seulement get/all après fixture ; tentative run/exec de mutation refusée ; aucun appel aux apply/prepare/assign.
- Copie sans Projet/action/cible/session ; modèles/liens draft et profils non ready même pendant fixture.
- Sans publication implicite pour tester, y compris les 18 références 8B.
- Boot de recette ne passe jamais par restore, initialize, migrations, seed, FTS/rebuildIndex, suivi démo ou dailyBackup.
- Traitement d’une base absente, schéma incorrect, WAL actif, empreinte modifiée, erreur moteur et interruption de session.
- Choix/quantités impossibles : A×2, Blog×2/même cible, produit sur base sans Woo, option sans base, parentPage d’une autre base, doublons, IDs/session erronés.
- Rejeu déterministe ; absence de contamination entre demandes, rollback et nettoyage sandbox contrôlé.
- Non-régression du chemin runtime qui refuse les drafts ; absence de publication/activation suite au preview.
- Toutes les tables source et empreinte avant/après exactes, intégrité et FK vides ; trois devis historiques et deux Projets inchangés.

### IPC et renderer
- Contrat typé, validation stricte, allowlist par fenêtre/frame, payload de mutation rejeté.
- Tests de concurrence UI : sélection rapide/ancienne réponse, recalcul après achat/quantité/cible, erreurs affichées sans effacer les choix valides.
- Comptages phases/actions et slots/Sites corrects ; estimation obligatoire sans faux total définitif ; aucune donnée de temps réel inventée.
- Absence de bouton Publier/Ready/Préparer/Affecter/Créer/Chrono et de callback de mutation.
- Scénarios et filtres, détails de provenance, texte de checklist, longs libellés et actions regroupées.
- Harness Electron existant réutilisable pour vrais composants rendus, assertions DOM et captures sur trois thèmes ; tailles desktop et largeur minimale, clavier/focus/contraste.
- La recette manuelle AtoumWeb reste une étape séparée de ces contrôles automatiques.
- Typecheck et suite complète après implémentation, avec résultats réels ; aucun objectif de nombre de tests artificiel.

## 11. Fichiers envisagés, non modifiés à ce stade

| Fichiers | Intervention minimale envisagée |
|---|---|
| src/main/main.ts | Branche de démarrage recette avant initialisation métier |
| src/main/projects/OperationalRecipeService.ts (nouveau) | Session, snapshot source, fixture privée, contrôle de provenance et projection DTO |
| src/main/projects/operationalRecipeIpc.ts (nouveau) | IPC restreinte, validation/ownership |
| src/main/projects/operationalRecipeScenarios.ts (nouveau) | Descripteurs des 18 cas + D, AW/versions/paramètres explicites |
| src/shared/operationalRecipe.ts (nouveau) | DTO/request/response de recette ; discriminant non matérialisable |
| src/preload/preload.ts + déclaration Window/API existante | Namespace limité au mode recette |
| src/renderer/main.tsx | Sélection renderer dédié avant montage App/bootstrap normal |
| src/renderer/projects/recipe/* (nouveau) | Page et composants purs lecture seule |
| scripts/check-operational-recipe-ui.cjs (nouveau) | Harness Electron trois thèmes |
| Tests services/IPC/session/guards | Fixtures synthétiques et copies, jamais Validation-MSI |

Les trois moteurs existants et leurs tables sont réutilisés. Pas de généralisation de DatabaseService ni refonte du bootstrap métier normal. Aucun nouveau schéma.

## 12. Séquence et critères de sortie

1. Valider ce plan, notamment le mode de lancement isolé et les scénarios de vente fictifs clairement identifiés.
2. Implémenter la session sûre, l’IPC et ses tests ; démontrer source intacte avant de raccorder la UI.
3. Construire l’écran de recette et les contrôles Electron ; comparer aux 18 oracles.
4. Présenter les écrans à AtoumWeb, écran par écran, noter les défauts de recette.
5. Bilan code/tests/typecheck/UI/SHA, puis arrêt ; ready/activation/raccords de production sur instruction ultérieure séparée.

Aucun arbitrage métier nouveau nécessaire : géométrie, capacités, quantités, temps, catégories et mapping D demeurent ceux déjà validés.
La décision attendue porte sur cette organisation technique/UX et sa limite aux choix logiques pris en charge par le staging actuel.

Historique de la conception avant autorisation : cette passe a produit uniquement le plan documentaire. Aucun Manager lancé, aucun scénario matérialisé, aucun code/IPC/API créé, aucune migration/test/simulation exécuté, aucune donnée métier écrite, aucun commit/push/merge.

## 13. Réalisation autorisée et contrôles finaux

## 05/10/2026 — Lot 8A.2C réalisé, recette manuelle à faire

- Plan et implémentation autorisés par AtoumWeb depuis **c2bd002deec7e6742a24943132627c2d3a79bb5f**, branche **feature/project-page-compositions-v1**. Aucun commit/push/merge.
- Démarrage **--operational-recipe** avant workspace/restore/DatabaseService.initialize ; copie physique éphémère du staging réel, jamais de connexion en écriture à la source. Fixtures privées dans savepoint, rollback et comparaison exhaustive après chaque calcul. Moteur **OperationalStagingService.previewQuote**, adaptateur get/all uniquement.
- Fenêtre dédiée / preload restreint : cinq opérations état, références, scénarios, preview, fermeture. API métier normale absente ; propriétaire/frame et champs contrôlés. Aucun bouton/IPC ready, activation, Projet/action/cible ou chrono.
- UI trois thèmes, quantités/options de recette, choix logiques Site/Page, structure/actions/checklist/provenance/pending ; bandeau **BROUILLON — simulation uniquement — aucune donnée Projet créée**.
- **625/625 tests**, typecheck OK, Chromium **133/133** avec vraie IPC/preload et cycle de fenêtre ; **19/19 scénarios** dont AW-SEO-PERF pending, A04 site/integration ; **36 captures**. Aucun changement des temps, politiques, modèles ou migrations.
- Validation-MSI SHA avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** strictement identique. Python SQLite ro/immutable : **118 tables identiques**, migrations 1–62, intégrité ok, FK vide, absence WAL/SHM/journal ; 112 modèles draft/0 ready, 94 liens draft/0 ready, sept profils readiness=0, zéro action/cible/achat. Historique intact.
- Nettoyage vérifié sur fermeture API/native et échec contrôlé d'initialisation/chargement. Rejeu déterministe, aucun résidu du scénario précédent. Refus métier de quantité/cible : rollback neutre, scénario corrigeable.
- Limites conservées : Landing sur Site existant non validé ; contextes D et Sites historiques pending. Options fixtures signalées comme non configurées dans l'offre réelle ; aucune résolution inventée.
- Preuves hors dépôt : **outputs/operational-lot8a2c/BILAN_LOT8A2C.md**, recette-chromium.json, source-before/after.json, journaux et captures. **16 fichiers code/doc**, aucune migration.
- **Arrêt pour validation AtoumWeb ; recette manuelle à faire. Aucun ready/activation/publication, Lot 8B, Abby, Bridge ou 8C.**

### Démarrage et cycle de vie

Depuis le dépôt : `npx electron-forge start -- --operational-recipe`.
Le CLI installé passe le flag à Electron. Sans flag, le démarrage métier normal s'applique et ne fait pas partie de la recette isolée.
La source et son SHA sont fixés au checkpoint dans le main ; source modifiée/active = refus, jamais migration ou restauration automatique.

`operationalRecipeWindow.ts` assure le cycle de vie partagé avec le harness Chromium. La fermeture API termine la session et confirme SHA/nettoyage dans la page ; fermeture native et échec contrôlé détruisent aussi la copie. Un choix métier refusé annule la fixture, laissant la session disponible pour corriger le scénario.

Le renderer dédié est choisi avant montage de App. Les thèmes restent locaux à la session. Le DTO contient des identités réelles et origines synthétiques, sans token/plan applicable ni API de mutation. Les moteurs staging, schémas et données métier restent inchangés.

Tests : 25 nouveaux tests d'isolation et allowlist ; harness réel de page/preload/IPC et cycle de fenêtre, 19 scénarios, refus runtime draft, quantité, payload, parent Page, deuxième Site, option, estimation, changement de scénario, cleanup et trois thèmes. Les erreurs des contre-épreuves quantité/payload sont des refus attendus ; aucune erreur finale de test/UI.


## 14. Passe UX seule après validation technique

## 05/10/2026 — Lot 8A.2C, passe UX seule réalisée avant recette manuelle

- Validation technique AtoumWeb reçue, puis autorisation d'une passe UX seule. Aucune nouvelle règle métier, aucune modification de moteur, scénario, temps, quantité, mapping ou association.
- Vue principale : noms catalogue, quantités, actions/temps, Sites/Pages/modules, estimation complète/incomplète, option achetée/non achetée, destination définie/à choisir. Codes, UUID, états internes et provenance dans **Détails techniques** repliés par défaut, accessibles sur demande. Libellés accessibles des champs également simplifiés.
- Bandeau courant : **RECETTE — simulation uniquement — aucune donnée enregistrée**. Avertissement visible : rien activé ni enregistré dans devis/projets. Message SEO Performance conforme à la demande ; aucune résolution de destination inventée. Limites Landing existant / contextes / Sites historiques conservées en langage métier.
- **Typecheck OK ; Chromium 481/481**, 19 scénarios dans chacun des trois thèmes et quatre vues, 36 captures après + 36 captures avant conservées. **19 DTO complets strictement identiques** à la recette technique précédente. Empreintes des dix fichiers techniques protégés identiques ; état/effets/handlers UI inchangés. Suite **625/625** précédemment validée, non relancée pour cette passe de présentation uniquement.
- Validation-MSI SHA avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables identiques, migrations 1–62, intégrité ok, FK vide, aucun WAL/SHM/journal source. Modèles/liens draft uniquement, profils inactifs, zéro action/cible/achat.
- Première passe Chromium interrompue par sa limite de 120 s ; délai du harness adapté, passe finale complète verte. Les copies des sessions terminées et échecs contrôlés sont supprimées. Une copie du premier processus interrompu reste dans **%TEMP%/atoumweb-operational-recipe-2e23Wn** : nettoyage shell refusé par la politique automatique, y compris fichiers explicites sans récursion. Source Validation-MSI intacte ; ce reliquat est signalé, aucun nettoyage global revendiqué.
- Passe limitée à six fichiers déjà dans le Lot 8A.2C : renderer TSX/CSS, harness UI, PROJECT_STATUS, roadmap commune et plan de recette. Preuves et galerie **outputs/operational-lot8a2c-ux/** hors dépôt. **Aucun commit/push/merge, ready, activation ou matérialisation. Arrêt pour recette manuelle AtoumWeb.**


## 15. Clôture de recette sur le principe — décisions du 06/10/2026

## 06/10/2026 — Recette 8A.2C sur le principe, audit du vrai Devis

- AtoumWeb termine la recette sur le principe : operational-recipe reste un banc d'essai isolé du moteur, jamais une vue métier autonome. Parcours cible Prospect → Devis/prestations/options/clauses → préparation Abby → Projet prévisionnel → même Projet actif après acceptation ; le devis signé comprend le contrat, aucun contrat indépendant.
- Future vraie vue Projet : bloc global **Conditions avant démarrage** (devis accepté, acompte, contenus/visuels, accès, informations légales, autres prérequis), puis **Origine commerciale → Structure prévue → Affectation → Plan de travail**, ce dernier ouvert par défaut en production si pertinent. Réutiliser Sites/Pages/slug/sections/modules, actions manuelles, référence immuable/estimation courante/chrono et provenance ; ne pas ajouter ces fonctions au banc.
- Nouvelle décision : Mariage Essentiel et Grand Jour restent chacun 1 Site/1 Page ; **Histoire devient mini-site multipage**. L'ancienne décision commune 1/1 est dépassée pour Histoire uniquement, et demeure conservée historiquement. Configuration actuelle partagée 1/1 non modifiée : nombre/liste/rôles des Pages Histoire non précisés, question à AtoumWeb en attente. Aucune structure commerciale inventée, temps 10 actions/23 h non modifié. Préparer ensuite un profil/version distinct sans toucher la Page unique des autres formules.
- Audit maître : **docs/AUDIT_DEVIS_POST_RECETTE_8A2C.md**. Devis/option/CGV/snapshot/Client/Projet prévisionnel et moteur opérationnel existent ; principales limites : sélection privilégiant ancien publié, brouillons affichables mais refusés à l'ajout, zéro option configurée sur les V3, 118 clauses draft non consommées, runtime opérationnel exige ready, copie Abby limitée au texte contractuel, absence de taxonomie sous-catégorie et d'admin opérationnel complet.
- Exigence future de roadmap : séparation moteur / base métier ; administration depuis Manager des AW, taxonomie, types/prix/textes Abby/commerciaux, clauses, actions/temps, structures, capacités/cibles, versions/états ; exports complets et métier éditables, réimport avec diff/version brouillon. Architecture versionnée compatible, module non développé. Ne pas confondre publication commerciale/contractuelle et états opérationnels ready.
- Proposition minimale non démarrée : recette sur vraie UI Devis en workspace isolé avec faux dossiers explicites et consultation staging réutilisée, sans ready/publication/Projet matérialisé. Bout-en-bout acceptance/Projet V1 à cadrer séparément sans contourner les guards. Aucun nouveau gros développement.
- **174/174 tests ciblés**, huit fichiers existants. Validation-MSI source SHA **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** ; contre-vérification avant/après et 118 tables inchangées dans outputs/audit-devis-post-recette-8a2c. Historique, 112 modèles draft, 94 liens draft, sept profils inactifs et zéro action/cible/achat conservés.
- Documentation seulement dans cette passe ; aucun code fonctionnel modifié, aucun import, ready, activation, publication, base/migration, commit/push/merge ou Lot8B/Abby/Bridge/8C. **Arrêt pour validation du diagnostic et précision des Pages Histoire.**


## 16. Histoire — oracle corrigé après arbitrage

L’oracle initial 1 Site/1 Page est conservé dans les rapports historiques ; le tableau de recette courant retient désormais 1/4.

## 06/10/2026 — Correction préparatoire Mariage Histoire, arbitrage des quatre Pages appliqué sur copies

- AtoumWeb précise Histoire : **1 Site / 4 Pages** — Accueil `/`, Notre histoire `/notre-histoire/`, Le Jour J `/jour-j/`, Espace privé `/espace-prive/`. Espace privé = protection prévue pour galerie/souvenirs, vidéo/diaporama, livre d'or, contenus post-mariage ; aucune protection activée par le plan. RSVP/galerie/vidéo restent des sections/modules selon Projet, pas des Pages supplémentaires.
- Configuration versionnée **mariageHistoireStructure.json** ; préparation distincte du blueprint Page unique partagé, profil inactif et association candidate draft. Raccord Histoire remplacé seulement dans le savepoint de la copie de recette, puis rollback intégral. Aucun moteur normal ni schéma/migration modifié ; aucune application dans Validation-MSI.
- Essentiel et Grand Jour restent 1/1 ; Landing inchangée. Modèle Histoire, dix textes d'actions, checklist, catégories, minutes et politiques/cibles existantes intacts : **10 actions / 1380 min = 23 h**. Aucune multiplication des actions par quatre Pages.
- Quatre tests de non-régression ajoutés : profil distinct/draft/idempotence/rollback/historique ; refus du chemin réel ; vrai staging des trois Mariage et actions exactes ; génération synthétique des quatre slugs et conservation du partage one-page. Le moteur existant normalise les slugs de Projet sans slash final ; chemins de configuration/preview gardés comme demandés, aucune modification de ce moteur.
- **629/629 tests complets**, typecheck OK, Chromium **485/485**, 19 scénarios × trois thèmes. Histoire 1/4/10/23h, chemins et intention de protection contrôlés ; les 18 autres DTO identiques hors exposition descriptive des chemins et descriptions. Trois captures Histoire ajoutées aux 36 captures habituelles.
- Réserve métier avant validation de la charge : A02 architecture/navigation, A03 contenus des quatre Pages, A05 espace privé/enrichissements, A06 responsive multi-pages, A07 navigation/liens/accès protégé méritent précision/revue. Aucun intitulé n'impose une Page unique ; les 23 h ne sont ni changées ni certifiées suffisantes. Checklist protection/navigation non inventée ou ajoutée sans accord.
- Validation-MSI avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables exactes, migrations 1–62, 112 modèles draft / 94 liens draft / sept profils inactifs / zéro action/cible/achat. Le staging réel reste au checkpoint antérieur : seule la préparation sur copies est corrigée ; application réelle sur instruction distincte.
- Preuves : **outputs/mariage-histoire-4-pages/** hors dépôt. Aucun ready/publication/activation réelle, import/backfill, commit/push/merge, Lot8B/Abby/Bridge/8C. **Arrêt pour validation.**


## Mise à jour 06/10/2026 — doctrine et banc technique

Les contraintes de copies/SHA et comptages de Validation-MSI ci-dessus sont des décisions historiques désormais remplacées. Validation-MSI est la base non productive de recette réelle, mutable. Le banc technique démarre désormais sur une fixture versionnée maîtrisée ; il ne remplace ni Devis ni Projet. Suite normale indépendante de Validation-MSI. Aucun nouveau lot Devis ni publication/ready engagé par ce découplage.
