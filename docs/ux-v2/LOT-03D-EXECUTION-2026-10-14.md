# Lot03D — Fiche Client V2 : exécution

## Base et décision

Branche `codex/ux-v2-03d-client` depuis main `b2796812ee24c9e9e824f3d66564f2c1a335bffe`, aprèsCI781 verte et recette native post-merge1421/216. Référentiel repris dePR82 `0bb0860e` : [03D](LOT-03D-FICHE-CLIENT.md). Conception conservée, huit onglets Résumé/Contacts/Commercial/Contrats/Projets/Interventions/Documents/Historique. Sources métier et identités réutilisées. Recette humaine finale différée par décision utilisateur.

## Écarts corrigés

- Six onglets devenus huit ; Commercial et Projets distincts ; Devis refusés conservés et ventes non assimilées aux simples propositions. Projet prévisionnel/confirmé/historique/archivé explicite ; ouverture de l'ID exact. Maintenance, demandes et packs conservés dans Interventions, listes complètes et accès ciblés.
- Sections conservées montées au changement d'onglet, à l'agrandissement et au filtrage. Pas de seconde garde : registreUX-01 existant. Annulations/fermetures et remplacement d'un éditeur passent par celui-ci ; pending empêche sortie, champs désactivés jusqu'au retour du service.
- Chargements indépendants, erreurs par source sans faux zéro ; réponses d'anciens clients ignorées ; rafraîchissement n'efface plus les formulaires montés.
- Relation Client distincte de température Prospect ; note modifiable. Nouvelle commande ciblée `clients.updateRelationshipIfUnchanged` : comparaison des deux champs sous verrou SQLite, réutilisation `updateClient`, rollback des données et des journaux, aucun champ tiers écrasé. Note historisée avec provenance événementielle ; conflit conserve la saisie.
- Onglets accessibles au clavier avec flèches/Home/End et focus ; retour au déclencheur lors de fermeture ; texte fonctionnel>=14px. Préférence de largeur enregistrée par workspace via le store existant, clé explicitement autorisée, une écriture en fin de geste, ni ID ni brouillon persisté.
- Historique Client + événements des Prospects réellement liés, dédoublonnage parID. Les boutons ouvrant seulement un module sont désormais libellés « Ouvrir ».

## Tests et traçabilité

Mise au point :125 contrôles Electron réels TEMP sur le code de travail, neuf combinaisons thème/densité et huit onglets, identité des nœuds/brouillon, filtres, Stay/Quitter, pending et panne après soumission, erreur Devis partielle/reprise, note via vraiIPC, intégrité/FK/migrations1–66/nettoyage. Scripts permanents : `check-ux-v2-03d-client.cjs`, `fixtures/03d-client-scenarios.cjs`.

Tests unitaires permanents : onglets/clavier, histoire parID, lectures partielles et erreurs synchrones ; préférence seule par workspace ; concurrence/rollback du journal de relation. Les injections d'erreurs prévues sont visibles dansstderr et ne sont pas des erreurs masquées.

Les résultats de mise au point ne sont pas une validation du commit final. Avant publication : typecheck, suite complète et recette native combinée du SHA propre, puis125 contrôles03D/72 captures. Références effectives à consigner dans le corps dePR et le manifeste au SHA testé, sans CI documentaire supplémentaire.

## Limites et suite

03D n'achève pas03E. L'Annuaire a toujours ses propres créations/éditions, sa dernière vérification et ses conflits à sécuriser. Aucun changement de règles de vente/conversion, CGV, contrat, Blueprint, migration ou schéma. La bibliothèque de documents est réutilisée avec ses capacités et limites existantes ; aucune importation Word comparée inventée. Aucune fusion de03D autorisée.

Suite :PR03D draft après contrôle complet ;03E sur branche dédiée basée sur03D si celle-ci n'est pas fusionnée, dépendance explicite ; recette globale03A–E puis seulement Catalogue préparé dansPR82.
