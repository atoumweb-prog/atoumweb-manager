# 02D — Accueil réel : confiance, alertes et disposition

## Autorisation et périmètre

Poursuite autonome autorisée par AtoumWeb le 13/10/2026, sans fusion. Référentiel : [LOT-02D-ACCUEIL-PILOTAGE.md sur la branche officielle](https://github.com/atoumweb-prog/atoumweb-manager/blob/docs/ux-v2-reference-v1/docs/ux-v2/LOT-02D-ACCUEIL-PILOTAGE.md).

Branche dédiée `codex/ux-v2-02d-home-trust`, issue de #99 à `7549770428fcbb53d89a60fcc92dd5cb6d8f258d`. Main recontrôlé à `278ff2da022ba5e58ae333de11e74bc4d12a2995`. #98 a évolué de4eeb5a7 à9f697b0 pendant le travail : aucun merge, cherry-pick, rebase, modification ou remplacement de cette branche. Ses fichiers actuels ont été comparés au périmètre choisi.

Ce premier incrément traite 02D.1, les accès honnêtes de02D.4, et la confiance/présentation de02D.5 dans **le véritable Accueil**. La recette utilise le renderer, le preload et les IPC réels sur TEMP. Elle ne certifie pas tout02D : la projection commerciale à sept étapes de02D.2 dépend du chantier03A–03C de#98 et n'a pas été reproduite.

## Inventaire vérifié des huit sources

| Lecture existante | Population/calcul préservé | Lien / confiance |
|---|---|---|
| workflow.dashboard | Dossiers groupés « Aujourd’hui », fournis par le service | Type/ID exact par openEntity/02C ; état inconnu distinct d'un résultat vide |
| crm.prospects.list | Exclusion archivés/convertis/won/lost ; pipeline exclut new ; devis à préparer selon stages existants | Projection historique préservée, non déclarée V2 finale |
| crm.actions.list(ownerType:prospect) | follow_up/open, ownerId dédupliqués, fin de journée locale et retard par instant courant | Relances existantes et filtre relaunch préservés |
| projects.projects.list | Compteur to_prepare | « Ouvrir tous les projets » explicite, aucun filtre ciblé inventé |
| operations.interventions.list | Compteur in_progress | Navigation générique Opérations annoncée explicitement |
| time.summary | Mois local courant, limites ISO ; secondes → heures | Montants/temps calculés comme auparavant, GlobalTimer non dupliqué |
| billing.list | Éléments ready, expectedAmountCents | « À facturer » explicite, aucune prétendue facture officielle Abby |
| operationsAlerts.get | Snapshot, sévérités/kinds/cibles du service | Toutes les alertes accessibles, critiques toujours visibles, échec jamais traduit en « tout à jour » |

Événements d'actualisation conservés : changed, time-changed, intervention-updated. Aucun nouveau service, calcul SQL, état commercial ou détecteur de sauvegarde/intégrité supposé disponible.

## Fonctionnalités intégrées

- Les huit lectures progressent indépendamment. Une source en échec conserve sa dernière valeur confirmée, si elle existe, avec état error/horodatage/message. Une source jamais chargée reste inconnue ; ses compteurs affichent « — », pas zéro.
- Une génération de chargement empêche succès/erreurs anciens d'écraser la requête actuelle. Le démontage invalide la génération, sans requête, navigation ou enregistrement supplémentaire. Aucun retry caché.
- Actualisation et reprise explicites via AppButton ; erreurs via AppNotice et détail des huit sources.
- Toutes les alertes ouvrent leur objet exact ; la sévérité critical vient du service. Un bandeau indépendant garde les critiques accessibles même si le widget Alertes est masqué.
- Aujourd'hui est obligatoire et placé avant les préférences secondaires. Son accessibilité initiale a été mesurée à1280×720 avec les notifications et les données de fixture ; aucune affirmation universelle sur tous les volumes.
- Les quatre actions ouvrent réellement des modules et sont renommées « Ouvrir… » ; aucune création anticipée. Les KPI annoncent clairement leurs liens génériques.
- Widgets secondaires : masquer, déplacer par boutons accessibles, drag/drop en une écriture au dépôt, relire la disposition dans une autre fenêtre et réinitialiser uniquement l'Accueil. Aujourd'hui reste épinglé.
- Nouveau schéma visuel Home whitelisté dans le propriétaire01F existant. Seuls version/order/hidden de clés de widgets connues persistent ; aucun ID de dossier, note, filtre métier, résultat de lecture ou brouillon. Schémas incompatibles et écritures refusées ne produisent pas de faux succès.
- Texte fonctionnel >=14px dans les variantes contrôlées ; le contexte des KPI n'est plus tronqué. Aucun nouveau logo, pictogramme ou chrono.

## SHA et preuves locales exactes

Code TypeScript, unités et backend visuel validés à **ebf4e0d1fd5efc32d653ae818e37d4362905b736** : typecheck OK (6,95 s), 42 ciblés (5 fichiers), **963/963 Vitest** (102 fichiers, processus72,73 s), dont35 restaurations et6 binaires, sansRPC. Manifest : `outputs/02d-ebf4e0d1-1791909483805/manifest.json`.

Cette première exécution s'est arrêtée honnêtement sur une capture montrant encore la trame précédente. Aucune assertion supprimée : le protocole sentinelle du banc commun a été repris pour attendre la vraie trame composée. Correction test à55e198a, puis petite correction de lisibilité CSS et fixture priorités à **3343ebc2143a727ecb3132c0e8e745cbef05c5ac**. Entre ebf4e0d et ce SHA : **aucun changement de fichier TypeScript/TSX ni de test Vitest**, uniquement bancs natifs et une règle CSS de lisibilité ; preuve par diff Git.

Les contrôles concernés et les bancs non encore exécutés ont été rejoués à3343ebc (mode native-only, typecheck/Vitest explicitement marqués non exécutés dans ce second manifeste) :

| Banc réel | Résultat |
|---|---|
| Accueil, preload/IPC réels | **54/54**, dont neuf captures compositées synchronisées |
| Recherche02C | **92/92** |
| Shell,17 routes, neuf variantes, étroit/zoom | **374/374**,63 captures vérifiées |
| UX-01 B/C/revue | **183/183** |

Manifest final natif : `outputs/02d-3343ebc2-1791909891717/manifest.json`. Captures Home dans home-captures ; contrôles visuels ponctuels effectués sur le rendu réel. Ces sorties ignorées ne sont pas incluses au commit. Ce sont des preuves locales distinctes de GitHub Actions ; la recette humaine globale reste différée.

Scénarios nouveaux : priorités critical+warning réellement calculées par le service, plusieurs alertes, masquage sans disparition critique, une écriture par dépôt et aucune pendant dragover, ordre clavier/instance Today, refus de persistance sans modification du layout, lecture dans une seconde fenêtre, cache explicitement ancien après erreur, première lecture inconnue, réponse IPC périmée, changement de contexte avec brouillon Client conservé et une confirmation UX-01, liens Aujourd'hui/critique par ID, quatre liens rapides sans insertions, reset sans modification métier, neuf thèmes/densités,1280×720 et fenêtre760/zoom125%.

Intégrité/FK et migrations1–66 TEMP vérifiées ; comparaison exacte de toutes les tables hors settings sur les gestes et pannes Accueil ; profils/bases TEMP nettoyés. Les exceptions IPC volontairement injectées sont enregistrées, traitées et assertées. Aucun accès à Validation-MSI/données réelles ni migration.

## Matrice de fin d'incrément

- R02D01–03,04,11–13,16–19,21 : preuves directes dans les bancs et unités, dans le volume de fixture déclaré.
- R02D05 et14–15 : calculs historiques conservés, non-régression générale et absence de mutation/chrono supplémentaire ; aucune refonte des règles de décompte ou comptabilité annoncée.
- R02D06–07 : liens génériques explicitement nommés ; ne pas annoncer une population filtrée qui n'est pas affichée.
- **R02D08–10 : projection sept étapes/conversions et navigation contextualisée dépendantes de#98, non réalisées ici.**
- R02D20 : instance unique conservée lors des navigations ; cycle natif du vrai chrono rejoué par le banc shell, aucune intégration d'un second timer.
- R02D22 : preuves locales ci-dessus, CI candidate à publier séparément et résultat à consigner dans la PR.

## Publication, dépendances et suite

Publication autonome autorisée, PR draft dédiée **vers main** pour utiliser le déclencheur CI standard pull_request sans modifier le workflow. La branche contient son parent02C ; son diff propre à02D est celui comparé à7549770. La PR ne signifie pas que02C est fusionné ni que03C est intégré. Ordre recommandé : #99, puis cette PR Accueil ; après fusion autorisée du parent, vérifier à nouveau l'arbre/les dépendances et la CI d'intégration. Aucun reciblage d'une PR existante, aucune fusion automatique.

Une seule CI candidate automatique à l'ouverture, aucun dispatch supplémentaire. Le résultat sera inscrit dans le corps de PR, sans nouveau commit documentaire déclenchant un doublon.

Prochaines évolutions : terminer la projection/navigation pipeline02D avec le propriétaire#98 après rapprochement explicitement autorisé ; poursuivre02E sur la couverture/migration vérifiée du shell. La certification universelle des sous-éditeurs et des volumes réels n'est pas remplacée par ce pilote. Les branches et l'historique restent intacts.
