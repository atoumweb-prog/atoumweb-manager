# Lot 10C — Sauvegardes métier, sauvegarde SQLite et restauration contrôlée

**Statut : spécification UX/UI V2, aucune sauvegarde/restauration/exécution réalisée.**  
Audit de `BusinessBackupService.ts`, `BusinessBackupAlertService.ts`, `BusinessBackupsPage.tsx`, `App.tsx`, `restore.ts` sur `manager/main`, 09/10/2026. **IMPORTANT : #81 (restauration UX-16/UX-03) est encore une PR distincte non fusionnée lors de l'audit; ne pas considérer le `restore.ts` de main comme le moteur final.**
Références : [10A indicateurs](LOT-10A-AUDIT-INDICATEURS.md), [Lot 07 projets/Bridge](LOT-07-PROJETS-BRIDGE.md), [08B intervention](LOT-08B-INTERVENTIONS-DEMANDES.md), [09D documents](LOT-09D-DOCUMENTS-ARCHIVES-PREUVES.md), [01E garde UX-01](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Trois catégories très différentes
| Catégorie | Service réel | Ce que l'action signifie |
|---|---|---|
| **Registre de sauvegardes métier** | `BusinessBackupService` / `BusinessBackupsPage` | **Déclaration et suivi** de sauvegardes Client/Projet : type, date, emplacements serveur/local/externe/autre, vérifications, version « stable ». **Créer un enregistrement ≠ copier des fichiers ni créer une sauvegarde WordPress.** |
| **Alertes et règles métier de backup** | `BusinessBackupAlertService` | Politique Client/Projet héritée ou personnalisée, âge des copies, serveur seul, avant intervention/après changement majeur. **Alerte ≠ preuve d'une restauration testée.** |
| **Sauvegarde/restauration technique du Manager** | `App.tsx` → `window.atoumweb.backups.createManual/restore`, `main/restore.ts` | **Action technique sur la base SQLite du workspace**, avec sélection de sauvegarde, planification de restauration et éventuelle copie de sécurité, redémarrage selon état. **Ne signifie pas restaurer tout le dossier Clients, photos, pièces et Bridge.** |

## 2. Registre métier : état réel
- Types : `complete/database/files_code/config_export/pre_intervention/post_validation/other`.
- Emplacements : `server/local/external/other` avec chemins ou références, dates `verifiedAt/lastCheckedAt/missingAt`, suivi des copies manquantes.
- `create` enregistre **une fiche**, sans lancer un backup réel; `addLocation` indique un chemin ou une référence.
- `verifyLocation` sur **local** teste essentiellement **l'existence du chemin**; **ne calcule pas l'empreinte SHA/ouvre pas le contenu pour prouver qu'il est restaurable**. Sur serveur/externe, action = **confirmation humaine**, sans contrôle de serveur distant prouvé.
- `markStable` marque une **référence stable** unique selon Projet/Client ; **ne certifie pas** l'intégrité, la complétude ou la restaurabilité des fichiers.
- `overview` calcule nombres d'enregistrements/copies locales/absentes et dernier connu/local/stable; ce n'est pas un état de vérification cryptographique.
- Alertes avant/après intervention utilisent les âges des sauvegardes connus/locales, plus politiques héritées ou dédiées; décision opérationnelle à consigner en cas d'alerte.

## 3. Interface cible de la page Sauvegardes
- **Liste gauche / fiche droite agrandissable** avec filtres Client/Projet, type de backup, lieu, date, manquants, dernier contrôle.
- **Fiche** : source (Client/Projet), sauvegarde déclarée, emplacements multiples, référence locale/serveur, date déclarée, état `connue/local trouvée/manquante/stable` et badge de vérification **détaillant sa portée**.
- **Actions réelles** : `Déclarer une sauvegarde`, `Ajouter emplacement`, `Vérifier emplacement` (local existence / confirmation manuelle externe), `Relocaliser une copie locale`, `Marquer version stable`, `Ouvrir emplacement`; aucune action « Restaurer WordPress » si aucun moteur connecté ne la prend en charge.
- **Alertes** : avant Intervention et après modification majeure, âge maximum connu/local, « Serveur uniquement », sauvegarde introuvable ; chemin direct vers fiche Projet/Intervention/backup réel. Une alerte non résolue n'autorise pas automatiquement l'intervention si le service métier exige davantage.
- **Badges et aide `?`** : « Emplacement présent » ≠ « Sauvegarde intègre » ≠ « restauration testée ». Le niveau le plus élevé n'est affiché qu'après procédure technique correspondante réellement exécutée.

## 4. Restauration technique SQLite — séquence à sécuriser
1. Depuis Réglages > Sécurité, séparer **Sauvegarder maintenant la base Manager** et **Restaurer une sauvegarde de base Manager** du registre des sauvegardes métier.
2. Afficher en amont **workspace actif**, chemin de la base cible, fichier de sauvegarde sélectionné, date, empreinte/validité et effets de remplacement. **Validation-MSI** est un vrai espace de développement local et **ne doit jamais être utilisé comme fixture automatique**.
3. **UX-16 / #81** : avant autoriser la restauration, exiger la validation des sources (véritable SQLite, intégrité, version/migrations, pas une autre destination, contexte Windows et alias de chemins), sauvegarde de sécurité récupérable du fichier remplacé, gestion du WAL/SHM et exclusion des écritures concurrentes **selon le service effectivement fusionné**.
4. **UX-01** : toute fenêtre/éditeur dirty ou écriture en cours bloque/interrompt la procédure avant un redémarrage; confirmation humaine sur base réellement active.
5. Après accord, restaurer atomiquement autant que le moteur le garantit; tout refus/échec doit laisser **la base originale lisible**, les fichiers non écrasés et permettre d'ouvrir la copie de sécurité. **L'atomicité au SHAs réellement validés est à démontrer, non présumer du run #84.**
6. L'interface doit préciser si l'application **redémarre** elle-même ou si, en mode développeur, l'utilisateur doit la relancer; éviter message « Restauré » si restauration encore seulement **programmée**.
7. La copie de sécurité SQLite **n'est pas une sauvegarde complète de workspace** : documents Clients, médias, packages Bridge et exports doivent disposer d'un protocole de protection/restauration séparé.
8. Si la PR #81 n'est pas fusionnée, conserver le comportement existant et **ne pas fabriquer une seconde implémentation** des garde-fous dans ce lot V2; adapter la future interface au vrai moteur lors de son intégration.

## 5. Matrice de conditions de validation
| Avant action | Vérification | Si insuffisant |
|---|---|---|
| Sauvegarde métier déclarée | ID/Client/Projet/type, lieu connu | Afficher seulement « déclarée » |
| Vérifier chemin local | Existence vérifiée maintenant | « Présent », **pas « SHA valide »** |
| Marquer stable | État de référence choisi | Pas de preuve de succès d'un test de restauration |
| Restaurer SQLite | Fichier admissible, workspace exact, sécurité, droits et absence d'écritures | **Refus et diagnostic**, aucune copie partielle |
| Restaurer documents / WordPress | Moteur et périmètre réels prouvés | Action indisponible, instructions humaines séparées |

## 6. Recette future (20 scénarios, non exécutés)
| ID | Scénario | Attendu |
|---|---|---|
| R10C-01 | Déclarer backup sans fichier | Registre créé, aucun fichier fictif |
| R10C-02 | Rattacher Projet/Client incompatible | Refus service |
| R10C-03 | Ajouter emplacement local existant | Existence contrôlée, pas intégrité supposée |
| R10C-04 | Emplacement local disparu | Alerte manquant |
| R10C-05 | Vérifier référence serveur externe | Confirmation humaine, pas vérification à distance |
| R10C-06 | Marquer version stable | Un seul stable par portée selon service |
| R10C-07 | Restaurer sauvegarde métier dans WP | Action indisponible tant que moteur absent |
| R10C-08 | Alerte avant intervention technique | Politique et source affichées |
| R10C-09 | Alerte après changement majeur | Liste contextuelle correcte |
| R10C-10 | Sauvegarder base SQLite manuellement | Chemin réel distinct du registre Client |
| R10C-11 | Choisir SQLite invalide | Refus avant remplacement |
| R10C-12 | Choisir source égale cible via alias Windows | Refus après normalisation |
| R10C-13 | Restauration avec WAL/SHM | Garde/continuité selon moteur #81 validé |
| R10C-14 | Échec injecté en remplacement | Ancienne base et backup de sécurité conservés |
| R10C-15 | Écriture concurrente pendant restauration | Refus / coordination explicite |
| R10C-16 | Restaurer ancien historique de migrations | Chemin de migration testé et sans perte |
| R10C-17 | Source backup présente mais SHA inconnu | Pas de fausse certification |
| R10C-18 | Dossier Clients non restauré par SQLite seul | Message explicite |
| R10C-19 | Formulaire dirty pendant demande de restauration | Garde UX-01, aucun redémarrage forcé |
| R10C-20 | Recette Windows locale et runner avec accord, SQL fictif | Aucun accès Validation-MSI réel |

## 7. Questions techniques ouvertes
**E303** matrice de catégories des backups et capacité de restauration réelle; **E304** statut de vérification existence/intégrité/test de restore; **E305** portée du workspace complet vs SQLite; **E306** état exact de #81 au SHA fusionné; **E307** comportement des copies de sécurité/WAL et reprises; **E308** alertes/permissions et procédure de validation humaine, sans interrompre Codex MSI.

**Le chantier UX n'autorise aucune restauration réelle ni fusion de PR.**
