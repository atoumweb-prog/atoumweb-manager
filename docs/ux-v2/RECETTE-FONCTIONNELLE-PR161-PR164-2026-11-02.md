# Recette fonctionnelle PR #161 + PR #164 — 02/11/2026

## Livraison

- Branche source : `codex/rgpd-v3-site-agreements-20261101`.
- Lanceur : `C:\DEV\03_LIVRAISONS\AtoumWeb\Manager-RECETTE-PR161-PR164-20261102-60c65a2b\LANCER-RECETTE-TEST.cmd`.
- Réinitialisation : `REINITIALISER-LES-DONNEES-TEST.cmd` dans le même dossier.
- Recette automatisée : `RECETTE_AUTO.cmd` dans le même dossier.
- Profil imposé : `Profil-RECETTE`.
- Workspace imposé : `Workspace-RECETTE`.
- Schéma SQLite : migrations 1 à 80.

La livraison ne lit ni le profil Electron habituel, ni le fichier `workspace.json` habituel, ni une base utilisateur. Le lanceur passe toujours son propre `--user-data-dir` et le Manager résout le workspace depuis le profil contenu dans la livraison.

## Contenu fictif

- deux comptes clients de fixture ;
- un projet `TEST — Site RGPD croisé` et son site `Site RGPD croisé` ;
- trois devis de test ;
- 118 propositions contractuelles V3.7 en brouillon ;
- six propositions Catalogue du dernier plan en brouillon ;
- une évaluation RGPD obligatoire ;
- un accord RGPD V1 attesté envoyé et signé avec empreinte ;
- une révision V2 modifiable pour poursuivre le parcours.

Les versions publiées historiques de la fixture sont conservées pour permettre la comparaison. Aucune proposition nouvelle n'est publiée ou adoptée par la préparation de la recette.

## Contrôles réalisés

- `npm run typecheck` : réussi.
- `npm run package` : réussi sous Windows 11.
- démarrage du vrai `LANCER-RECETTE-TEST.cmd` : réussi.
- contrôle du renderer packagé : titre `RECETTE / TEST`, bandeau jaune visible et chemin de workspace strictement identique à celui de la livraison.
- réinitialisation par le vrai `.cmd` : réussie ; la modification sonde disparaît, une sauvegarde `avant-reset-*` est conservée, `integrity_check=ok`, zéro erreur de clé étrangère.
- `RECETTE_AUTO.cmd` réel : réussi avec code de sortie 0 ; 27/27 contrôles, 19 tests ciblés réussis et un test opt-in ignoré.
- campagne PDF automatique : 14 documents, 199 pages, aucune page vide détectée et 14 zones de signature ; première page de chaque document rendue en PNG.
- empreintes des clauses publiées, versions Catalogue publiées et devis acceptés identiques avant/après.

## Rapport automatique

Chaque exécution crée `Rapports-RECETTE-AUTO/<horodatage>/RAPPORT.html`, puis écrit le chemin courant dans `DERNIER-RAPPORT-AUTO.txt` et ouvre le rapport. Les journaux, résultats JSON, captures d'écrans, premières pages rendues et 14 PDF sont conservés dans le même dossier. Le `.cmd` renvoie un code non nul si un contrôle obligatoire échoue.

Le pilotage réutilise CDP/Electron, déjà employé par les bancs packagés du dépôt, au lieu d'introduire Playwright pour reproduire les mêmes primitives.

## Parcours conseillé

1. Bibliothèque contractuelle : comparer publié/proposé, consulter le journal et lancer une simulation sans écriture.
2. Offres & Tarifs : vérifier les six brouillons Catalogue, notamment mensuel/annuel et hébergement isolé.
3. Devis : ouvrir `DEV-2026-001`, `DEV-2026-002` et `DEV-2026-003`, puis contrôler lignes, conditions et prévisualisation.
4. Projets : ouvrir `TEST — Site RGPD croisé`, puis la protection des données du Site.
5. RGPD : contrôler l'évaluation, la V1 signée, sa preuve et son empreinte ; poursuivre la révision V2, l'attester envoyée, puis rattacher une preuve.
6. Fermer l'application avant d'utiliser la réinitialisation.

La recette reste une validation fonctionnelle humaine. Elle n'autorise ni publication de clause, ni fusion de PR, ni déploiement.
