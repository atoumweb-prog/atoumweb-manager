# Lot 07B — Démarrage isolé

Référentiel : `docs/ux-v2/LOT-07B-FICHE-PROJET-PRODUCTION.md` au commit `0bb0860e` (PR #82).

## Premier incrément

- Liste des Projets : filtre commercial distinct du filtre opérationnel.
- Affichage textuel explicite `Prévisionnel · devis non signé`, `Confirmé · devis accepté`, ou `Historique`.
- Aucun Client n'est créé, aucun projet n'est converti, aucune mutation SQLite ni action commerciale.
- Les états absents sont affichés comme `Historique` pour assurer la compatibilité des enregistrements anciens ; cela ne constitue pas une migration.
- Branche indépendante depuis `main`, sans incorporer la PR #111. La fusion future devra préserver les protections UX-01 de #111 et effectuer une validation combinée après intégration.

## Prochaines portes

1. Vérifier typecheck et Vitest sur le SHA exact du 07B ; contrôle Electron TEMP du filtre prévisionnel/confirmé/historique (R07B-02 et R07B-15).
2. Revoir identité Projet, origine Devis et ouverture Client/Prospect dans la fiche ; ne pas attribuer un Client fictif aux dossiers provisoires.
3. Inspecter sauvegarde des sélections, panneaux et sous-onglets avant changements de structure (R07B-03/04/14).
4. Valider chrono global et conflits sur fixture isolée (R07B-08/09/10).
5. Ne pas fusionner, ne pas publier WordPress, ne pas toucher les autres branches ni Validation-MSI.

**Ce premier incrément n'est pas encore validé par une exécution des tests.**
