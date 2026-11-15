# Passation de la refonte du Manager (15/11/2026, après P6a)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P4b.md`, dont les pièges, ceux de `-apres-P4a.md`, `-apres-P3b.md`, `-apres-P3a.md`, `-apres-P2.md`, les dix décisions de `PASSATION-2026-11-14-apres-P1.md` et `PASSATION-2026-11-14-apres-R9.md` (données de test, outils, cycle d’un lot) restent valables. Il ne remplace ni `AGENTS.md`, ni `PROJECT_STATUS.md`, ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n’est poussé**, aucune PR. Derniers commits : P6a (voir `git log --oneline -5`), P4b `cd115045`, P4a `45259baf`, P3b `22426028`, P3a `79f7c3e7`.
- **Passe de finitions** : P1, P2, P3a, P3b, P4a, P4b, **P6a (faits)** ; **à faire** : **P6b États rares** (F7, F19, F30, F36, F41, F42, F53), **P5 Petits textes** (budget visé à zéro, F27) ; puis fin de refonte (styles AtoumWeb et Blanc, densités Compact et Confort +). Lot dédié hors interface : l’acompte par défaut.
- **Preuves de P6a** : typecheck propre ; 312 fichiers passés, 2 538 tests ; **plus aucune recette rouge** (bancs 01b, 01d, 01f verts ; `check-ux-v2-03e-directory` verte, 206 contrôles ; `check-contract-library-ui` 148 sans contrôle sauté) ; natifs 72, 18/18, 25, 857 ; budget petits textes 617.

## 2. Prochaine action concrète

1. **P6b États rares** : fiche courte déjà validée dans `docs/refonte/plans/2026-11-15-p6-etats-rares-design.md` (option A : états forcés dans la copie jetable de l’outil de capture, rien d’écrit dans la préproduction). À faire : **plan** (skill `superpowers:writing-plans`), puis exécution. Ce qu’on regarde : devis envoyé et accepté, étapes 2 à 5 de l’assistant, étapes « négociation » et « en attente » de la fiche prospect (F7) ; Sites rempli (F36, pas de site de test sans fichier Bridge : forcé dans la copie ou « non vu ») ; onglets de Réglages et confirmations (F41) ; projet terminé, incident, maintenance expirée, pack épuisé (F19) ; chrono en cours (F30) ; états d’erreur, noms très longs, fenêtre étroite, clavier (F42). **F53** (`check-home-shell-lot1` instable) à diagnostiquer pendant ce lot ou à part.
2. **P5** ensuite : 617 déclarations sous 14 px à zéro ; F27 ; F24, F26, F34 (`AtoumWebLibraryPage.css` 53), le reste de F35 (18) et de F40 (`.muted`, `styles.css`).
3. À vérifier à la main par Carlos (non vu par capture) : le redimensionnement de colonne à la souris dans les autres pages à tableau (Clients, Prospection, Annuaire…).

## 3. Ce qu’on a appris pendant P6a (à ajouter aux pièges)

- **Les recettes rouges cachent parfois de vrais défauts du produit** : F50 et F51 passaient pour des bancs périmés ; en réalité le redimensionnement à la souris était cassé depuis le 22/10. L’historique git (`git log -S`) a trouvé le commit qui avait défait un correctif précédent. Une expérience **temporaire** (3 lignes, annulée par `git checkout`) a confirmé la cause avant tout code.
- **Une recette composée (`03e`) enchaîne plusieurs fichiers** : en réparer un fait apparaître les suivants (parcours, `03d-client`, `03e-directory`). Pour itérer plus vite on peut neutraliser temporairement un bloc, mais **le bloc suivant peut dépendre de ses données** (c’était le cas) : rétablir par `git checkout` avant la vérification finale.
- **Sondes jetables** : écrire la sonde avec l’outil d’écriture (un script d’édition en ligne de commande a inséré une ligne mal formée) et la retirer avant de lancer la vraie recette ; vérifier `grep PROBE` avant de conclure.
- **`evalUI` est déjà asynchrone** : une attente `wait('(async()=>…)()')` est toujours vraie (promesse « truthy ») ; écrire `wait('(await …)…')` directement.
- **Le formulaire « Besoins » détecte les modifications faites ailleurs** (« Conflit entre fenêtres », voulu) : un parcours qui écrit en base derrière lui provoque ce conflit ; ne pas modifier le résumé derrière le formulaire monté.
- **Des sélecteurs périmés dans le produit lui-même** : `DirectoryPage` visait un sélecteur supprimé en R8. Chercher (`grep`) les anciens sélecteurs de barre d’outils dans `src` quand un composant partagé remplace une barre.
- **Nettoyage de fichiers jetables** : ne supprimer que les fichiers qu’on a créés ; nommer précisément (pas de motif `probe-*` qui peut attraper le fichier d’une autre session).
- **`check-home-shell-lot1`** exige `ATOUMWEB_UX_LOT1_OUTPUT` (dossier **inexistant**) ; elle est instable (F53) : la relancer seule avant de la dire cassée.
