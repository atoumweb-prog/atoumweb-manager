# Phase 1 — Plan de validation Windows

Ce document est la checklist de validation réelle de la Phase 1 CRM avant toute fusion de la PR #58.

## 1. Préconditions

- La fondation a déjà été validée sous Windows.
- La base existante Phase 0 se trouve dans le workspace local AtoumWeb Manager.
- Ne pas supprimer cette base avant le test : la migration réelle doit être testée sur elle.
- La PR #58 reste en brouillon pendant toute la validation.

## 2. Récupérer la branche Phase 1

Dans PowerShell, depuis le dépôt local :

```powershell
cd "$HOME\Documents\atoumweb-manager"
git fetch origin
git switch feature/phase-1-crm
git pull origin feature/phase-1-crm
```

## 3. Qualité statique et tests

Exécuter :

```powershell
npm install
npm run typecheck
npm test
```

Résultat attendu :

- aucune erreur TypeScript ;
- tous les tests Vitest verts ;
- tests des migrations, CRM et contacts client exécutés avec le runtime Node d’Electron.

En cas d’échec, ne pas fusionner et corriger avant de poursuivre.

## 4. Démarrage et migration réelle

Lancer :

```powershell
npm start
```

Au premier démarrage de la Phase 1 sur la base Phase 0 existante :

- une sauvegarde doit être créée automatiquement dans `backups\pre-migration\` ;
- SQLite doit passer de 1 à **3 migrations** ;
- l’application doit s’ouvrir normalement ;
- le thème et les réglages existants doivent être conservés.

Vérifier le dossier :

```powershell
Get-ChildItem "$HOME\Documents\AtoumWeb Manager\backups\pre-migration"
```

## 5. Prospect entreprise

Créer un prospect test avec :

- société : `Test Phase 1 Entreprise` ;
- prénom/nom d’un contact ;
- email ;
- besoin principal ;
- valeur estimée ;
- température ;
- source ;
- prochaine action.

Valider :

- la carte apparaît dans `Nouveau contact` ;
- la fiche latérale s’ouvre au clic ;
- identité, besoin, valeur et prochaine action sont cohérents ;
- l’historique contient la création.

## 6. Relances Prospect

Tester successivement :

- Demain ;
- +3 j ;
- +7 j ;
- +30 j ;
- Date personnalisée ;
- suppression d’une prochaine action.

À chaque fois :

- la carte est mise à jour ;
- le retard est signalé si la date est passée ;
- l’historique reçoit un événement.

## 7. Stages et Prospect perdu

Déplacer le prospect entre plusieurs étapes sans drag-and-drop.

Puis tester `Perdu` :

- annuler la saisie de raison → le prospect ne doit pas être classé perdu ;
- saisir une raison → passage en Perdu accepté ;
- la raison est visible dans la fiche Prospect.

Créer ensuite un autre prospect pour la conversion Client.

## 8. Conversion Prospect → Client

Sur un prospect non perdu :

1. cliquer `Transformer en client` ;
2. vérifier qu’un seul Client est créé ;
3. revenir au prospect : il doit être `Gagné` et rattaché au Client ;
4. ne jamais voir de coordonnées dupliquées sous forme de nouvelle identité.

Le test automatique vérifie également l’idempotence d’une double conversion.

## 9. Prospect particulier

Créer un Prospect sans société, uniquement avec prénom/nom.

Valider :

- création acceptée ;
- conversion Client acceptée ;
- le particulier est retrouvé dans Clients et Recherche.

## 10. Fiche Client

Vérifier les onglets :

- Résumé ;
- Contacts ;
- Commercial ;
- Historique.

Dans Résumé :

- identité ;
- contact principal ;
- email/téléphone ;
- date Client depuis ;
- prochaine action ;
- notes.

Programmer une prochaine action Client et vérifier sa mise à jour.

## 11. Contacts multiples et rôles

Dans l’onglet Contacts :

- ajouter un contact Administratif ;
- ajouter un contact Facturation ;
- ajouter un contact Technique ;
- vérifier que tous sont listés ;
- changer le contact principal ;
- vérifier qu’un seul contact reste Principal ;
- vérifier que le tableau Clients affiche le nouveau contact principal.

## 12. Archivage / réactivation

Archiver un Client :

- il reste disponible avec le filtre Archivés ;
- aucune donnée ni historique n’est supprimé.

Réactiver le Client :

- retour au statut Actif ;
- historique conservé ;
- événement de réactivation visible.

## 13. Recherche globale

Tester au minimum :

- nom société ;
- prénom/nom ;
- email ;
- téléphone ;
- ville si renseignée ;
- besoin Prospect.

Tester le clavier :

- `↓` / `↑` changent le résultat actif ;
- `Entrée` ouvre le résultat ;
- `Échap` ferme la liste.

Limite connue avant finalisation : l’ouverture cible encore le module pour certains résultats ; le deep-link exact Organisation/Contact reste à terminer.

## 14. Dashboard

Après création des données :

- `Prospects actifs` doit refléter les Prospects hors Gagné/Perdu ;
- les autres KPI restent à 0 tant que leurs modules ne sont pas développés.

## 15. Thèmes

Tester rapidement les écrans Phase 1 avec :

- AtoumWeb ;
- Noir ;
- Blanc.

Vérifier en particulier :

- Kanban ;
- formulaires ;
- panneaux latéraux ;
- tableau Clients ;
- recherche globale ;
- contrastes et lisibilité.

## 16. Sauvegarde finale de test

Après avoir créé quelques données CRM :

- créer une sauvegarde manuelle ;
- vérifier qu’elle est créée dans `backups\manual\`.

La restauration complète pourra être retestée si une modification de la couche base le justifie.

## 17. Critères de sortie

La Phase 1 peut quitter le statut brouillon uniquement si :

- [ ] typecheck vert ;
- [ ] tests verts ;
- [ ] migration réelle Phase 0 → Phase 1 réussie ;
- [ ] sauvegarde `pre-migration` créée ;
- [ ] 3 migrations actives ;
- [ ] parcours Prospect entreprise validé ;
- [ ] parcours Prospect particulier validé ;
- [ ] conversion sans doublon validée ;
- [ ] contacts multiples validés ;
- [ ] archivage/réactivation validé ;
- [ ] recherche validée ;
- [ ] trois thèmes validés ;
- [ ] aucun bug bloquant restant ;
- [ ] `PROJECT_STATUS.md` et issues #4–#9 mis à jour.
