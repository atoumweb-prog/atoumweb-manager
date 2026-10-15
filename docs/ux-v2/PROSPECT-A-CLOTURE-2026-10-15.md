# Fiche Prospect — clôture ciblée de la variante A

## Décisions et sources

Départ local : `161fee0dcb0a1c8cdda9bdcdd05d3dd0e26620a3`, branche `codex/ux-v2-prospect-density-options`. Références distantes contrôlées le 15/10 : `main@c4bb744dbe58531350a61fb16ad5f8fbe90bd59d`, référentiel PR82 `docs/ux-v2-reference-v1@0bb0860ee7618af92a53d8711b4a06edbbadc4d6`.

Archive utilisateur : `ATOUM_MANAGER_SYNTHESE_REFERENTIEL_UXV2_67_CAPTURES.zip`, SHA256 `68502ffba382d552034737d4024161e0c833edd4e183b994394ec81bb57e7e13`. Synthèse, matrice et brief lus ; 67 captures parcourues en planches, schémas 202551, 202636 et 202723 examinés à leur taille. Comparaison avec DECISIONS, DESIGN-SYSTEM et LOT-03C de la branche documentaire. Les schémas illustrent une hiérarchie et des détails consultables ; ils n'imposent ni sept onglets UI ni des valeurs métier de démonstration.

| Constat | Décision appliquée |
|---|---|
| Ancienne demande de deux propositions et choix encore ouvert dans le ZIP | Remplacée par la dernière validation explicite de A ; B retirée du CSS actif et du banc courant, historique Git conservé. |
| Statut « Devis à préparer » répété dans Identité et centre | Retiré de l'Identité complète uniquement ; le centre lit toujours `prospect.stage`, sans changement du pipeline ni de la fiche rapide. |
| Prochaine action peu visible | Icône `OperationIcon clock` décorative, libellé 600 et couleur de texte du thème ; titre et date issus de la même action réelle, même callback de relance/focus. Aucun grand cadre. |
| Trois régions et trois groupes à la demande | Conservés ; aucun éditeur supprimé ou démonté au repli. |
| Maquette mentionnant « Enregistrer et quitter » | Pas de nouvelle garde ; UX-01 existant conservé. |

## Périmètre et preuves

Code limité à `ProspectsPageV2.tsx` et son CSS dédié. Banc permanent `scripts/check-ux-v2-prospect-density.cjs` / fixture associée : A seule, mêmes données synthétiques Atelier Horizon. Vérifications explicites du statut unique, de l'icône et du titre réel dans neuf thèmes/densités, focus vers la vraie relance, brouillon identique au repli, refus UX-01, absence de mutations métier, intégrité/FK TEMP, 125 et150%.

Après commit : typecheck, suite Vitest complète à deux workers (restaurations et comparaisons binaires incluses), banc Prospect A, recette CRM, parcours réels03B/03C et UX-01. Les journaux et captures synchronisées seront réunis dans un dossier de preuve nommé par le SHA candidat. Un succès ancien n'est pas repris comme preuve du nouveau candidat.

## Limites

Validation graphique de A déjà donnée ; dernières captures des deux ajustements soumises à l'utilisateur. Pas de généralisation aux Clients, de publication GitHub/CI, de fusion, d'installation ni de remplacement de l'application. Aucun service, IPC, schéma, migration ou moteur de sauvegarde modifié. La sauvegarde complète des médias hors SQLite reste une réserve distincte, non résolue par cette correction visuelle.
