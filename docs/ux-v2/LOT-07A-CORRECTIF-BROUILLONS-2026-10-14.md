# Lot 07A — Premier incrément UX-01 sur les composants

Date : 14/10/2026. Branche indépendante `fix/ux-v2-07a-composition-unsaved-20261014`.

## Portée du correctif
- `ProjectCompositionItemSettings.tsx` : enregistre l'édition locale du composant dans le registre existant UX-01 via `useUnsavedDraft`, avec `dirty`, `pending`, mise à jour de référence après sauvegarde/réinitialisation réussies.
- `ProjectPageCompositionPanel.tsx` : protège le changement de composant (inspecter/réglages) et la fermeture des réglages via `requestUnsavedExit`.
- `ProjectSitesTab.tsx` : protège la sélection d'un autre Site ou d'une autre Page avant de démonter l'éditeur de composition.

## Limites / blocages de validation
Ce correctif est **partiel** : les créations/suppressions, autres changements d'onglet, navigation vers un autre Projet, fermeture de panneaux globaux, resets et effets asynchrones n'ont pas tous été audités/branchés sur UX-01. Une garde globale de sortie non filtrée peut toujours être nécessaire pour certains chemins du shell. Les brouillons de création de composants sont hors de ce premier incrément.

Aucun TypeScript, Vitest ou test Electron n'a été exécuté ici ; **ne pas interpréter les commits comme des tests réussis**. Le dépôt local Windows du développeur n'est pas accessible dans cette session.

## Recette indispensable avant fusion
1. Éditer HTML/CSS/JS + note, choisir un autre composant et **annuler** : contenu et composant inchangés.
2. Refaire puis **confirmer** : une seule transition, référence enregistrée source inchangée.
3. Éditer et changer Site/Page : garde avant changement et aucun brouillon perdu si refus.
4. Sauvegarder : confirmation absente si `dirty=false` ; bascule libre et valeur persistée.
5. Écriture `pending` : changement de sélection refusé durant la sauvegarde.
6. Chemins supplémentaires : autre Projet/onglet, panneau replié, suppression composant, réinitialisation source, latence d'inspection et création d'un composant.
7. Typecheck, suite Vitest complète, tests UI Electron sur TEMP, 3 thèmes × 3 densités ; intégrité et FK, absence de mutation Validation-MSI.
8. Rebase/convergence explicitement contrôlés avec lots 03–06 et évolutions UX-01.

**Pas de fusion, pas d'intervention WordPress, pas de modification de main.**


## Contrôle CI du 14/10 — HEAD cc6494c
- Workflow [#38564044517](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38564044517), déclenché sur PR #111 : **failure** (12:28:22Z → 12:28:24Z).
- Le endpoint GitHub Actions /jobs signale le job `quality` en échec avec **zéro étape renseignée** : aucune preuve d'exécution Checkout, `npm ci`, typecheck ou Vitest. La cause infrastructure exacte n'est pas démontrée par ces seules métadonnées.
- Le workflow `.github/workflows/ci.yml` prévoit bien Windows 2022, Node 24, `npm ci`, `npm run typecheck`, `npm test -- --maxWorkers=2`. **Ne pas étiqueter cet échec comme un échec TypeScript.**
- Validation bloquée ; ne pas multiplier les reruns GitHub Actions sans diagnostic et accord sur le budget. Une recette Windows TEMP autonome reste nécessaire.
- Exigence avant clôture : relever la cause de l'échec du job (annotation/diagnostic GitHub), typecheck et tests réellement exécutés sur SHA courant, Electron natif et revue du comportement dirty/pending.

## Finalisation Windows — 14/10/2026

### Références et isolement

- PR111 : branche `fix/ux-v2-07a-composition-unsaved-20261014`, départ `2cc1bd2fb17a9729c829e3f6ae148e8a1cbf6983`, incluant le code `cc6494c842ba1dd3fbaf5c0dd60527e7e728d8fb`.
- Base vérifiée : `origin/main@cc0bc679400321f5afacdbee3317ea8acc451518`, ancêtre du candidat. 03D/E sont déjà inclus. Les lots04/05/06 restent développés en branches parallèles (#104/#106/#108/#110/#112) : aucune intégration ni preuve de compatibilité combinée revendiquée ici.
- Worktree indépendant `C:/DEV/01_PROJETS/AtoumWeb/manager-07a-validation`. Recettes App/préchargement/IPC/services réels sur SQLite et profil exclusivement TEMP. Aucun accès Validation-MSI, données réelles, Bridge ou WordPress. Services, migrations, contrats et règles métier inchangés.

### Anomalies et corrections

| Anomalie constatée dans le code initial | Correction et régression permanente |
|---|---|
| Réduire Réglages remplaçait le composant par un bouton : démontage et perte silencieuse. | Garder l'éditeur monté dans un conteneur masqué ; identité DOM et note conservées dans les neuf variantes. |
| Changer de composant réutilisait potentiellement l'instance et sa baseline UX-01. | Clé par occurrence ; clés Page/Projet uniquement lors d'un changement d'identité déjà protégé. Pas de démontage pour une simple réduction. |
| Création de composant et changements de mode/modale hors registre. | `useUnsavedDraft` existant ; fermeture, fond et Échap passent par sa requête ; refus conserve tout, une seule confirmation. Créations Site/Page également inscrites au registre. |
| Réinitialisation et retrait pouvaient détruire le brouillon sans garde. | Garde existante avant commande ; refus sans mutation, confirmation suivie d'une seule opération. |
| Entrées modifiables pendant une écriture, commandes de réglages/composition concurrentes. | Champs désactivés pendant écriture, mutex local anti-double commande, états pending du registre, blocage des sorties même après confirmation. Aucun nouveau moteur de garde. |
| Retour de chargement de Page obsolète ; fermeture Projet n'invalidant pas une ouverture en vol. | Génération de chargement et nettoyage ; clé d'identité Page ; invalidation d'ouverture Projet à la fermeture. Retard réellement injecté dans le service et contrôlé dans Electron. |
| Source absente ou version introuvable pouvant laisser un éditeur vide utilisable. | Réglages en lecture seule après échec ; aucune sauvegarde vers une source inconnue. Une personnalisation HTML vide reste une valeur locale, sans substitution silencieuse par le modèle. |

Les aperçus du même composant conservent le brouillon. Ajouter et déplacer passent par la protection existante, conservent l'instance de réglages et ne modifient jamais la version Bibliothèque source. Les opérations de création volontaire de composant/variante gardent leur comportement métier existant.

### Tests et preuves

- Nouveau banc permanent : `node scripts/check-ux-v2-07a-composition.cjs`, véritable App/IPC/SQLite, identifiants réels. 64 assertions fonctionnelles sans captures, dont refus/confirmation, HTML/CSS/JS/note, Projet/Site/Page/composant, retrait/reset/ajout/déplacement, sauvegarde pending/échouée, réponse périmée et source manquante. Option `ATOUMWEB_07A_CAPTURES` : neuf captures synchronisées/empreintes au SHA et neuf assertions de composition de frame supplémentaires.
- Deux tests Vitest permanents ajoutés au registre UX-01 : opération pending + éditeur dirty et fermeture ciblée de création sans abandon du voisin. L'atelier Composition historique reçoit uniquement le contrat `unsaved.confirmExit` requis par l'App actuelle ; aucune assertion retirée.
- Checkpoint de code `e3a8942dbef92020d72d68b97275986bec4a830a` : typecheck OK ; suite complète **1042/1042**,109 fichiers ; migrations10/10 (registre1–66), restaurations35/35, équivalences6/6, sans RPC ; banc dédié70/70 avec neuf captures ; atelier Composition historique65/65 ; UX-01183/183/intégrité/FK/nettoyage OK. Les trois assertions clavier complémentaires ont ensuite passé dans le banc64 sans captures, sans modification applicative.
- Le dernier commit porteur de ce rapport doit être validé avant push ; son SHA exact, ses résultats définitifs et les chemins des manifestes sont consignés dans la description de PR111. Ne pas assimiler ce checkpoint à une CI GitHub verte.

### Diagnostic GitHub Actions

Run `38564044517`, tentative consultée via API : job `quality` failure, aucun runner attribué et zéro étape. L'annotation dit exactement :

> The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings

Cela établit un refus GitHub lié à la facturation/plafond ; l'API ne permet pas de choisir entre les alternatives du message ni de connaître le quota gratuit restant. Ce n'est pas un échec TypeScript/Vitest. Aucun budget, workflow ou timeout modifié ; aucun dispatch/rerun. Un push normal peut produire un événement synchronize : ce n'est pas une preuve de CI réussie si le refus persiste.

### Verdict et suite

Périmètre correctif de PR111 recevable techniquement **si les contrôles du HEAD final restent verts**, avec réserve distincte de CI hébergée bloquée. Le lot07A du référentiel reste un inventaire des capacités : cette PR sécurise la composition, elle ne constitue pas une refonte complète des Projets ni la validation des branches04–06 en parallèle.

07B : repartir du référentiel existant `LOT-07B-FICHE-PROJET-PRODUCTION.md`, comparer le prochain main autorisé, conserver le même projectId, les états commercial/opérationnel et le chrono unique. Reprendre ces régressions, vérifier les conflits avec les branches commerciales, puis développer la fiche/production et ses autres formulaires sur une branche distincte après autorisation. Aucun démarrage07B ou merge autorisé par ce rapport. Recette humaine globale différée. Archivage des identités Annuaire toujours non exposé.

