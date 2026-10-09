# Feuille de route d'implémentation UX/UI V2 — par risques et dépendances

**Version de cadrage : 09/10/2026.** Ce plan est **proposé**, pas une autorisation de coder, pousser, lancer une CI ou fusionner. Il remplace l'idée d'implémenter mécaniquement les Lots 01→10 dans l'ordre. La priorité vient des **dépendances réelles** et des **effets métier dangereux**, pas du nombre d'écrans.

Références : [synthèse 10 lots](CONSOLIDATION-TRANSVERSE-10-LOTS.md), [registre des écarts](REGISTRE-ECARTS-TRANSVERSES.md), [matrice des recettes](MATRICE-RECETTE-ET-GATES-UX-V2.md), [décisions](DECISIONS.md).

## 1. Préalable non négociable — stabiliser, ne pas reconstruire
**G0 — CI et protection des opérations sensibles (bloque tout chantier de code UX V2 sur fichiers partagés).**

| Dépendance | Situation | Sortie requise |
|---|---|---|
| #84 runner Windows | **Fusionnée**, `main@2b390632`; run #589 et CI post-merge #628 annoncés verts | Ne pas refaire la CI; utiliser ce workflow comme base |
| #81 restaure SQLite | **Correctif local non poussé `50f2b40`**; distance HEAD `5d43e16d` et CI #649 745/748 | Sur **ordre AtoumWeb seulement**, pousser correctif, valider **le bon SHA** sur Windows, reviewer, puis merge après approbation |
| #83 sauvegarde des brouillons UX-01 | Draft HEAD `5b38cbe`, conflit avec `main` / #81 | Après #81, conserver **les deux** branches fonctionnelles dans `ipc.ts/main.ts`, tests 3 thèmes × 3 densités, CI hébergée, autorisation de fusion distincte |
| #82 référence V2 | Draft documentaire sur base antérieure, sans code UX V2 | Relire puis décider si fusionner le corpus; aucune CI payante pour seule mise à jour Markdown, `[skip ci]` |

**Point d'arrêt G0 :** tant que #81 et #83 ne sont pas stabilisées, ne pas refaire leur garde dans un autre service/une branche UX. Les autres audits documentaires restent possibles. **Pas de merge automatique**.

## 2. Séquence technique recommandée après G0
| Chantier | Priorité | Petite livraison autonome | Dépendances et preuves de sortie |
|---|---|---|---|
| **S1 — Sécuriser documents probants** | **P0** | E259 : refus serveur de suppression physique de facture Abby liée, même archivée, tests FK/archives; auditer autres liens `client_documents` | Très ciblé service + tests, pas refonte Documents; rollback et historique |
| **S2 — Sécuriser les actions de Devis et le pipeline** | **P0/P1** | E152 : « Valider » → « Confirmer accepté dans Abby », conséquences exactes. E72/E153 : créer Devis depuis `new` **sans** démarrer prospection. E151 : prix proposé = preview | CRM/Devis/Projet/Abby tests nominal/rejet/versions; pas Client ou vente inattendus |
| **S3 — Reproduire sûreté de clôture** | **P0 investigation** | E222/UX-03 : injecter pannes entre statut/pack/billing et prouver atomicité/reprise; **corriger service seulement si échec démontré** | Idempotence, mouvements et statut cohérents; pas d'assertion diluée |
| **S4 — Corriger les cycles maintenance manuels** | **P1** | E223/UX-02 : `anniversary` par défaut sur nouveaux manuels, engagements 12× mensuels malgré paiement annuel, zéro report | Fixtures fin de mois/année, vieux `calendar` inchangés, règles quota/routine à instruire |
| **S5 — Fondations UI V2 sans perdre l'existant** | **P2 structurant** | Lot 01A–01F en **PR séparées petites** : tokens, aide `?`, champs, confirmations, fiches, tableaux, garde UX-01 **unique** | 3 thèmes×3 densités, Compact 14 px; 17 modules existants fonctionnels, pas de rewrite |
| **S6 — Navigation, Accueil et recherche** | **P2 structurant** | Lot 02 : rail réduit avec favoris, accès 17 modules, recherche par ID, entête compacte/chrono, Accueil 1 scroll | Dépend de S5/UX-01 et métriques sourcées; pas de suppression de menu/fonction |
| **S7 — Parcours commercial cohérent** | **P1/P2** | Lots 03/04 : CRM six colonnes actives+Conversion historique, besoins consultatifs, catégories et aides Catalogue éditables, version/recommandation N:N | Garde E72, pas d'ajout Devis par suggestion; pipeline E73 à documenter sans stage inventé |
| **S8 — Contrat et devis au quotidien** | **P1/P2** | Lots 05/06 : bibliothèque existante, rubriques de clauses après revue humaine, Builder des Devis et six étapes, Abby copier/import et révisions | Anciennes CGV gelées et `historical_missing` inchangés, aucune conformité juridique automatique |
| **S9 — Projets, Sites/Pages et réutilisation** | **P2/P3** | Lot 07 : renforcer `previewQuote/prepareQuote/syncCommercial`, blueprint idempotent, composeur et undo local; remplacement **complet** du pré-Projet dans sous-PR après schéma transactionnel | Pas de fichier/temps/secret/export Bridge perdu; Projet unique, changements de Devis explicites |
| **S10 — Opérations et finance quotidiennes** | **P2** | Lots 08/09 : fiches Interventions/Packs/Maintenance/Temps, suivis Facturation/Dépenses, preuves et versions justificatifs | Après S1/S3/S4; pas de doubles débits ni paiement Abby inventé |
| **S11 — Statistiques fiables, sauvegardes et réglages** | **P1/P2** | Lot 10 : E290/E293/E297 d'abord; métriques communes, drilldowns, alertes backup métier vs restore SQLite, préférences UI | Pas CA encaissé ni marge nette inventés, garde #81 appliquée selon code fusionné |
| **S12 — Capacités avancées indépendantes** | **P3 facultatif** | DOCX aller-retour avec diff humain; Bridge Workbench→production avec backup/rollback WP; registre CSS/JS et nettoyage sûr | **Nouveaux sous-chantiers distincts**, validation légale pour CGV et **site WP de démo** uniquement avant publication réelle |

**S1–S4** sont des correctifs de sécurité métier ciblés, **pas une refonte UX des 10 lots**. Ils peuvent être indépendants entre eux après G0 si leurs services/fixtures ne se chevauchent pas. S5–S12 comportent ensuite des lots incrémentaux ; ne pas fusionner toute la V2 en une seule PR.

## 3. Découpage recommandé de chaque PR d'implémentation
- **Une idée vérifiable par PR**, typiquement une vue ou un service + ses tests; ne pas créer un programme « Réécrire Manager ».
- Indiquer **IDs E/UX2 concernés**, anciens contrôles conservés, vues/routes/handlers/IPC/services touchés, tables et fichiers, rôles/droits.
- Tester **l'ancien comportement à préserver** en plus du nouveau; tests ciblés locaux lors du développement, suite complète sur état stabilisé.
- Effectuer tests Windows **sur fixtures temporaires** sans lancer le Manager en écriture sur Validation-MSI, protéger les fichiers/répertoires réels.
- Évaluer changements à l'aide de **vraies sauvegardes de sécurité de démonstration**, erreurs injectées et rejeu ; nouvelle migration additive si nécessaire.
- **CI Actions** : financer/autoriser le run requis au bon SHA; éviter la multiplication des runs sur docs avec `[skip ci]`; ne pas esquiver la CI finale en portant des assertions affaiblies.
- Résultats à communiquer : HEAD de base/PR, nombre tests ciblés/complets exécutés, captures 3×3, risques résiduels, rollback, détails non vérifiés, décision de fusion **humaine**.

## 4. Définition du « prêt à coder » — porte d'entrée
Un chantier ne passe pas de `specification` à `prêt à coder` tant que sont absents :
1. **Un HEAD `main` figé et lu** avec état de #81/#83 intégré ou bloqué explicitement.
2. **Une matrice UI/handlers/IPC/service/DB** pour chaque action modifiée, incluant sorties de formulaire et versions/snapshots.
3. **Les décisions métier fermées** pour ce chantier; ne pas inventer E59/E73, réouverture ou conditions juridiques.
4. **Le jeu de tests ciblé et les échecs injectés**, ses fixtures isolées et sa stratégie de rollback.
5. **Un plan de navigation/captures accessible** 3 thèmes × 3 densités, petit écran et clavier.
6. **L'autorisation AtoumWeb** pour le travail de code, la CI payante nécessaire et le merge (séparément).

## 5. Plan de valeur et dépendances
- **Court terme — sûreté** : #81/#83, document PDF facture, valider les conséquences du bouton Devis, corriger la transition `new`, stabiliser prix, fin Intervention et cycles maintenance.
- **Ensuite — gestes quotidiens** : fondations réutilisées, navigation et fiches, CRM/Devis/Projet/Temps, puis documents et tableau de bord.
- **Après — enrichissement** : structurer catalogue/CGV et bibliothèque, compatibilité DOCX, nouvelles versions de composants et Bridge publication.
- **Fin de vague — preuve d'intégration** : parcourir Devis→Projet→Intervention→Pack/maintenance→Facturation Abby→Documents→Statistiques→Sauvegardes avec les mêmes IDs et sans double source.

## 6. Ce que la roadmap ne permet pas
Elle **ne** vaut pas ordre à Codex de reprendre ou modifier #81/#83, de lancer Windows Actions, de modifier le budget, de rendre le dépôt public, de changer une clause contractuelle, de restaurer SQLite ou de publier WordPress. Ces opérations exigent **une demande et une validation distinctes d'AtoumWeb**.

**Prochain livrable concret après validation du plan : fiche S1 ou S2 avec vrai HEAD, récap des tests et PR ciblée, pas la V2 entière.**
