# EC04 — contrôle expérimental des références SQLite ↔ fichiers

Module : `src/main/backups/WorkspaceFileReferenceAudit.ts`. Lecture seule d'un instantané SQLite fourni explicitement et comparaison avec l'inventaire des fichiers physiques établi en EC04-01.

Le contrôleur cible initialement huit tables et leurs champs de chemins : identités CRM, documents Client, preuves Devis, justificatifs Dépenses, ressources Projet, bibliothèque technique, Bridge et paquets de composition. Il signale quatre problèmes : fichier introuvable, chemin externe, chemin dangereux, racine métier inattendue. Il ne lit ni n'écrit une base réelle et ne change aucune référence. Les absences de tables/colonnes sont rendues dans `skippedTables`.

**Ce n'est pas une certification complète :** `coverageComplete=false` reste obligatoire. Les ressources liées via JSON d'historique, les racines projet absolues/customisées, les métadonnées de fichiers anciennement conservées, les ressources externes et les secrets Windows n'ont pas encore de traitement exhaustif. Les cas de chemins absolus exigent un arbitrage humain avant portabilité sur un autre PC.

Validation isolée : TypeScript et simulation Node/sqlite sur base fictive (correspondance, chemin Windows, fichier absent, chemin externe, traversée, racine inattendue), OK. Deux tests Vitest ajoutés au dépôt mais pas exécutés sous Windows/CI. Aucune intégration UI/IPC.
