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

## Deuxième incrément — Fiche Projet
- Le bandeau complet et compact distinguent Projet prévisionnel non signé / Projet confirmé accepté / Projet historique.
- Pour un Projet provisoire sans `clientAccountId`, l'identité est libellée comme Prospect, et non Client ; aucune création d'entité.
- Présence d'une association au Devis source signalée à partir de `sourceQuoteId` ; ouverture/routage du devis encore à traiter en vérifiant le système de navigation existant. L'identifiant affiché est technique et ne vaut pas numéro commercial.
- Le bandeau rappelle que le Projet prévisionnel est une préparation interne et non une commande acceptée.
- Aucun service ni SQL modifié ; toujours pas de test fonctionnel exécuté pour cet incrément.

## Troisième incrément — ouverture du devis source
- Ajout d'un bouton `Ouvrir le devis` sur la fiche du Projet uniquement lorsque `sourceQuoteId` est renseigné.
- Réutilisation de l'événement existant `atoumweb:navigate` avec la cible `quote`. Dans `App.tsx`, ce flux passe par `openSearchResult`, `readSearchTarget`, le registre UX-01 et `QuotesPage initialId` ; ne crée aucun routeur alternatif.
- L'identifiant technique du devis n'est plus affiché comme si c'était un numéro de devis commercial. Aucun changement de statut, conversion, appel d'écriture ni modification du Devis.
- Contrôle à exécuter : depuis un Projet provisoire et confirmé, vérifier ouverture du bon Devis ; tester une saisie sale puis choisir Rester, un Devis introuvable et un devis archivé ; vérifier le retour à la fiche et le focus.

La CI du commit précédent `c3fc64b` était verte lors du contrôle GitHub. Le nouveau commit de routage exige une nouvelle validation sur son propre SHA ; aucune réussite de CI n'est anticipée.
