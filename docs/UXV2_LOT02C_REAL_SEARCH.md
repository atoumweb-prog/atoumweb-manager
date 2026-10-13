# Lot 02C — Recherche réelle et ouvertures ciblées

## Reprise et références — 13 octobre 2026

- Branche locale : `codex/ux-v2-02c-real-search`.
- Départ interrompu : `e1813e7d9d467bb8f21be19ed7493d113929d205`, avec 17 fichiers locaux déjà modifiés/non suivis. Aucun reset ni remplacement du travail existant.
- Sauvegarde Git du travail interrompu : `c9fc199ecbff4a3b978f0a2749f7f95baf95acd4`.
- PR #97 effectivement fusionnée ; `origin/main` revérifié à `278ff2da022ba5e58ae333de11e74bc4d12a2995`. CI post-fusion #665 SUCCESS : https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38366838851 . Cette CI concerne le shell, pas 02C.
- Actualisation locale par merge normal : `c149dfef2869ae548ab677ed89d8b42e191642db`, sans conflit. Le contenu de main et de l'ancien parent e1813e7 était identique.
- **Code testé : `1b0fbb999a90409026e8e8aa161d75e7e133a682`**, arbre `f3b544607c611f0d474cc6ffe4dffb896a5123c4`.
- Référentiel : branche documentaire officielle, `docs/ux-v2/LOT-02C-RECHERCHE-ROUTAGE.md`. Périmètre initial : propriétaire commun du routage, pilote Catalogue et parcours intermodules risqués ; pas migration des 14 éditeurs.

## Corrections et comportement

`App` conserve la propriété de la navigation, les routes et le registre UX-01 existants. Une intention est validée par type/ID, vérifiée par les API de lecture existantes, puis autorisée par UX-01 avant tout changement de page/clé. La palette conserve son texte jusqu'à réception de la confirmation de la page réellement chargée. Les réponses portent `opened`, `cancelled`, `failed` ou `unsupported`. Aucun type inconnu ne conduit à Clients.

Les générations de requêtes invalident les réponses après effacement, nouveau terme, fermeture ou changement de contexte. Les refus et erreurs restent visibles avec la recherche intacte ; la reprise est explicite. Le délai de 180 ms et le seuil de deux caractères sont conservés. Le pointeur ne ferme plus une fiche Client avant traitement du choix. Flèches, Entrée et Échap utilisent la palette existante ; Échap est consommé avant les gestionnaires des modules.

Le nouveau hook `useSearchTargetConfirmation` confirme l'identité des données déjà chargées par chaque page et permet un focus ciblé. Il ne crée ni registre concurrent ni service de chargement métier. Les pages exposent un compteur de demande lorsque l'ID reçu n'a pas changé alors que leur sélection locale a évolué. Le même dossier déjà visible reste monté sans remise à zéro de son onglet/brouillon.

Défauts démontrés pendant la reprise et corrigés :

- Raccordement manquant de la confirmation Bibliothèque dans le JSX multiligne d'App : la palette attendait indéfiniment malgré le chargement.
- Focus impossible sur la frontière Prospect en `display: contents` : le panneau enfant visible reçoit le focus.
- Catalogue A → chargement lent B → retour A : le cache A n'invalidait pas B, dont le retour remplaçait A. Retour vers A et fermeture invalident désormais la génération précédente.
- Confirmations de fiches masquées par une vue secondaire Documents/Projets : la confirmation suit la vue effectivement présentée.
- Erreurs tardives des chargements ciblés : ignorées si leur génération n'est plus active ; absence de cible signalée explicitement.

Catalogue réutilise UX-01 pour création, version et code ; fermeture/annulation sont protégées, les champs de création/version sont verrouillés pendant la sauvegarde, et la création réussie ouvre sa fiche sans être bloquée par sa propre garde pending. Un rafraîchissement conserve la saisie locale si une prestation disparaît. Clients inscrit les brouillons de création, coordonnées, contact et prochaine action au registre existant ; changement de fiche et fermeture principale sont protégés. Le test natif démontre le refus de sortie du formulaire de création Client. Cela ne constitue pas une recette complète de tous les sous-éditeurs Clients.

Fichiers : App, GlobalSearch, Catalogue, Clients, les adaptateurs de confirmation des douze autres types dans les pages existantes, `useSearchTargetConfirmation`, `searchNavigation` et ses 36 tests, ainsi que trois fichiers de banc local (`check-ux-v2-02c`, extension du banc réel, fixture 02C).

**Aucun diff dans `src/main` ou `src/preload` par rapport à main.** Aucun service, IPC, migration, contrat, montant ou règle de signature modifié. Le véritable GlobalTimer reste unique. Les préférences restent celles du shell déjà intégré.

## Validation finale réellement exécutée

Commande : `node scripts/check-ux-v2-02c.cjs`. Exécution locale Windows, working tree propre au lancement et à la fin, SHA figé ci-dessus. Aucun retry du banc final.

Preuves locales : `outputs/02c-1b0fbb99-1791893180207/manifest.json` et logs adjacents ; ce dossier ignoré n'est pas commité.

| Contrôle | Résultat réel | Durée du processus |
|---|---|---|
| Typecheck | OK | 7,65 s |
| Tests ciblés conservés | 36/36 | 0,84 s |
| Vitest, deux workers | **943/943**, 100 fichiers | 78,95 s |
| Restaurations, incluses dans Vitest | **35/35**, fichier 4,239 s | pas de nouvelle exécution séparée |
| Équivalence binaire, incluse dans Vitest | **6/6**, fichier 0,107 s | pas de nouvelle exécution séparée |
| Electron recherche réelle, preload/IPC réels | **68/68**, aucune erreur renderer | 19,20 s |
| Electron shell réel | **374/374**, 17 destinations, 63 captures, neuf variantes, fenêtres étroites, zoom 125/150 % | 35,12 s |
| Electron UX-01 B/C/revue | **183/183** | 23,61 s |

Aucune erreur RPC Vitest, aucun échec ni timeout. Les refus de service, sauvegarde et conflit volontairement injectés apparaissent dans stderr Electron ; ils sont attendus et leurs conséquences sont assertées. Ils ne sont pas masqués et ne sont pas des rejets renderer non gérés.

Les bases sont créées directement dans des TEMP propriétaires, contrôlées (`integrity_check`, `foreign_key_check`, registre de migrations 1–66) puis nettoyées. Aucun accès à Validation-MSI, aucune copie de base réelle. Les fichiers binaires, les 35 restaurations et leurs protections restent inchangés.

Le banc 02C compare toutes les tables métier et les journaux préexistants. Une exception précise est qualifiée : le **chargement historique de ContractTermsBuilder synchronise déjà les CGV d'un devis brouillon** et ajoute des traces `quote_contract_synced`, également sur main/e1813e7. Chaque nouvelle trace doit correspondre exactement à un appel réel du synchroniseur du devis de fixture, avec action, entité et résumé attendus ; seul son compteur `sqlite_sequence` peut augmenter d'autant. Toutes les autres lignes restent identiques. Nous n'avons pas supprimé cette synchronisation métier pour rendre le test vert.

## Matrice R02C — périmètre et limites des preuves

| Critères | Preuve obtenue / réserve |
|---|---|
| 01–05 | 14 destinations réelles, homonymes Catalogue par ID, type inconnu, aucune restauration déclenchée |
| 06 | Devis dirty/pending, une confirmation Rester par tentative, texte et instance conservés ; protections Prospect rejouées par le banc UX-01 |
| 07 | Devis déjà actif : aucune confirmation supplémentaire, même instance et même texte dirty |
| 08–10 | Détail Catalogue retardé, réponse après effacement, erreur obsolète après succès récent, erreur de recherche et reprise explicite |
| 11 | Objet absent réel via événement ; archives et ID reçus différents contrôlés par les tests ciblés |
| 12–13 | Pointeur, flèches/Entrée natifs, Échap et focus neuf variantes ; **Tab/Shift-Tab complet dans toutes les fiches non certifié par le nouveau banc** |
| 14 | Ancien `atoumweb:navigate` rejoué notamment par les tests UX-01 Devis/Prospect ; événements Catalogue/Bibliothèque adaptés au même propriétaire |
| 15 | Chemin `open-intervention-conclusion` conservé et audité ; **son focus spécifique depuis Accueil n'a pas été rejoué dans le nouveau banc 02C** |
| 16 | Même dossier conservé, génération Catalogue invalidée ; **retours liste/agrandissement de chaque éditeur métier restent à leur recette dédiée** |
| 17 | Recherche clavier neuf thèmes × densités, fenêtre 760 px/zoom 125 %, shell réel neuf variantes et 63 captures ; recette visuelle humaine différée |
| 18 | Tous les contrôles locaux ci-dessus sur SHA exact ; **aucune CI 02C exécutée ni autorisée** |

## État et suite

Le périmètre initial de recherche réelle 02C est validé techniquement localement. Aucun défaut bloquant observé dans les parcours exécutés. Les réserves de la matrice sont des limites de couverture, pas des preuves implicites de réussite. Les chargements annexes et tous les sous-éditeurs des autres modules ne sont pas certifiés universellement par ce lot ; leur migration complète reste hors périmètre.

Branche et commits conservés uniquement localement. Aucun push, PR 02C, workflow hébergé, merge dans main, rebase, force-push, suppression de branche ou modification des PR historiques. Avant intégration : revue du diff et des réserves, autorisation distincte de publication/PR et d'une CI candidate ; fusion soumise à accord distinct. Aucun nouveau lot engagé.
