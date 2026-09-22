# Handoff Codex MSI — AtoumWeb Manager

> État partagé au 22/09/2026. À lire avec `AGENTS.md`, `PROJECT_STATUS.md` et le document de phase concerné.

## Branche de travail à utiliser

- Dépôt : `atoumweb-prog/atoumweb-manager`
- Branche de travail active : `feature/project-blueprints-v1`
- PR : **#73 — Projet V2 — Blueprints de production et atelier AtoumWeb**
- Base de la PR : `fix/pre-phase5-commercial-ux`
- Ne pas travailler directement sur `main`.
- Ne pas fusionner la PR #73 tant que la recette du dernier lot n'est pas terminée.

Synchronisation MSI :

```powershell
cd C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager
git fetch --all --prune
git switch feature/project-blueprints-v1
git pull --ff-only
```

Contrôle local recommandé :

```powershell
npm run typecheck
npm test
npm run package
C:\DEV\Lanceurs\AtoumWeb-Validation-MSI.cmd
```

Le workspace de validation reste :

`C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI`

Ne jamais utiliser la base Production pour une recette.

## État fonctionnel actuel

Le socle utilisé par l'application contient les phases CRM, Commercial, Projets, Opérations, Référentiels et les correctifs UX validés avant Phase 5. La Phase 5 Administration/Finance reste volontairement différée.

Le chantier actif est **Projet V2 / atelier de production** :

- Devis accepté → Projet avec blueprint de production ;
- snapshot du projet indépendant des futurs changements de modèle ;
- phases / étapes numérotées ;
- phases repliées par défaut ;
- glisser-déposer des étapes ;
- séparation Plan / Fiche redimensionnable ;
- barre latérale globale escamotable et masquée automatiquement en Production ;
- timer rattaché à l'étape ;
- notes et mini-actions par étape ;
- Ressources / Technique / Temps en fenêtre au-dessus de Production ;
- pages renommables directement dans l'arbre ;
- validation d'une phase avec avertissement sur les champs manquants ;
- clôture d'une phase = toutes ses étapes passent en Terminé ;
- undo / redo du travail courant ;
- aide contextuelle désactivable dans Réglages ;
- coffre d'accès projet/étape chiffré par Electron `safeStorage` ;
- couche UI transverse appliquée aux écrans historiques : champs, boutons, onglets, focus, débordements et lisibilité.

## Migrations

La branche Projet V2 porte désormais **30 migrations SQLite**.

La migration 30 ajoute `project_node_secrets` pour les métadonnées et le ciphertext des accès sécurisés.

Les mots de passe / clés ne doivent jamais être stockés en clair dans SQLite, les logs ou les documents de suivi.

## Validation

La recette locale précédente a confirmé typecheck/tests verts avant le dernier lot « aide / actions / coffre sécurisé / cohérence UI globale ».

Le **HEAD actuel doit donc être revalidé** sur MSI avec :

- `npm run typecheck`
- `npm test`
- `npm run package`
- lancement du profil Validation-MSI
- vérification de la migration 30
- test du coffre avec une fausse clé, jamais une vraie
- vérification rapide des anciens écrans après la nouvelle couche UI globale.

## Phase 7

La branche `feature/phase-7-analytics-v1` / PR #71 existe toujours. Elle est une branche sœur de Projet V2 : les deux partent de `fix/pre-phase5-commercial-ux`.

Ne pas poursuivre simultanément les deux sans intégration explicite. Après validation de Projet V2, il faudra réintégrer/rebaser Phase 7 sur le nouveau socle afin que la rentabilité lise le vrai suivi de production.

## Branches historiques

De nombreuses branches `feature/phase-*`, `feature/atoum-v02-*` et anciennes branches de recette sont encore présentes sur GitHub. Elles servent d'historique mais ne doivent pas être choisies comme nouvelle base de travail.

Avant toute nouvelle branche, partir de la branche fonctionnelle explicitement indiquée dans `PROJECT_STATUS.md`.

## Règles UI désormais transverses

- aucun texte fonctionnel sous 14 px ;
- contrôles lisibles avec fond cohérent avec le thème ;
- pas de champ noir natif en thème clair ;
- champs et boutons dimensionnés selon la densité globale ;
- panneaux et onglets doivent gérer leur propre défilement sans casser toute la page ;
- contenu secondaire accessible à la demande plutôt qu'affiché en permanence ;
- aide contextuelle utile au survol, désactivable ;
- panneau latéral global escamotable ;
- fermeture des fenêtres secondaires par × / clic extérieur / Échap quand le composant le permet ;
- couleur utilisée pour l'état et la progression, pas pour surcharger l'écran.

## Règle de coordination ChatGPT / Codex

ChatGPT pilote actuellement la conception et les modifications de la branche Projet V2. Codex MSI peut auditer, tester, diagnostiquer ou appliquer un lot explicitement demandé, mais ne doit pas lancer une refonte parallèle ni repartir d'une branche historique sans instruction.
