# Prospection : rendre les listes et les fiches utilisables sans changer le workflow

## Description preparee pour revue

La fiche rapide comprimait la table, les formulaires de creation et d'action coupaient la lecture du dossier, et les controles de reference occupaient plusieurs ecrans. La refonte limite le tableau standard aux cinq colonnes utiles, superpose le volet lorsqu'il manque de place, focalise les saisies dans des dialogues et conserve la fiche pleine largeur validee par l'utilisateur. Les etats commerciaux, sources d'identite, gardes de brouillon et services existants sont conserves.

Six lots sequentiels : Annuaire, creation/contacts, fiche/besoins/devis, actions/historique, reference et pipeline. Sept commits de code distincts apres baseline50b749b0. Details et adaptations dans PROSPECTION-SIX-LOTS-2026-10-22.md.

Validation :1666 tests complets,85 cibles,118 controles natifs cumules TEMP, typecheck et build renderer de production. Galerie comparative49 captures apres et11 avant.

Limites : Contact mono-entreprise ; acceptation de devis couplee par le service existant a la conversion ; snapshots de reference append-only sans CAS atomique public ; approbation ergonomique humaine a venir.

## Publication non executee

Branche locale codex/prospection-ux-six-lots. Code c51aaebec315ce7ed8c8d0c3784de167d7f66cad. Aucun push/CI/PR distant. Le pilote parent n'est pas encore dans origin/main : choisir explicitement la base de convergence avant publication pour ne pas incorporer silencieusement la refonte Accueil/shell deja livree. Aucune fusion, installation ni activation EC04/B1.
