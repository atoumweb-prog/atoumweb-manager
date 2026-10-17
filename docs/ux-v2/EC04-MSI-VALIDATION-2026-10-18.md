# EC04 - finalisation technique MSI, 18 octobre 2026

## References et perimetre

Worktree `C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ec04-validation`, branche `feature/ec04-workspace-file-inventory-v1`, depart990d850e4f2246ba2af49a54f37fdc14344f23bd. Base main376eef943e741e2967465b0016c05fc1977a97ea, CI1807 verte (run38971508732). Aucun changement de main, aucune reprise des lots precedents, aucun workspace reel consulte/copied/migre. Installation npm ci des dependances du checkout seulement ; aucun package Manager ou installateur fabrique.

## Anomalies reproduites puis corrigees

1. **Bail invalide du coordinateur** : finally appelait release sur un objet invalide, masquant le refus original. Validation avant affectation du bail ; null/undefined/objet vide/release non fonctionnel couverts. Capture jamais appelee apres refus.
2. **Fixtures Windows** : deux tests de liens fichier echouaient EPERM avant toute assertion. Sous Windows, jonctions reelles (dont cassée) sans privilege ; Linux conserve les symlinks fichier. Aucun test ignore, aucune assertion de refus retiree. Les symlinks fichier Windows necessitant un privilege restent une limite d'environnement explicite.
3. **Voie synchrone non protegee** : settings:shell-visual ne passait pas par la barriere ; refus explicite de set/remove pendant drain/pause, get pur autorise, aucun broadcast apres refus. Meme gate, aucun deuxieme systeme UX-01.
4. **Consultations documentaires legacy** : QuoteContractPreparationService.get/openLinked -> fingerprint peut remplir client_documents.sha256. Les trois frontieres sont desormais encadrees sans changer les clauses ni les transitions EC03. Le test source qui assimilait absence de gate a purete a ete corrige sur ce point, avec invariants explicites interdisant save/finalize/envoi/acceptation. Preuve native : lecture IPC suspendue conserve NULL puis complete l'empreinte apres release.
5. **Configuration corrompue** : JSON invalide, objet sans racine ou chemin relatif pouvait ouvrir silencieusement un workspace de secours. Refus WorkspaceAccessError, configuration conservee, aucun dossier par defaut cree. Seule une configuration absente ENOENT garde l'initialisation normale du premier lancement.
6. **Lecture SQLite WAL a effets de bord** : readOnly n'empeche pas la creation de WAL/SHM. Sur le vrai schema Manager, une restauration pouvait reussir puis echouer a sa verification suivante. Le snapshot PRIVE genere par backup est normalise DELETE avant calcul SHA/manifeste. Sa source demeure WAL, bytes et metier inchanges. Refus des liens physiques/symboliques avant cette operation. Tous les diagnostics EC04 utilisent un lecteur qui refuse un header WAL avant SQLite. Anciens B1 WAL non autonomes refuses, jamais reconstruits silencieusement.
7. **References Bridge** : packages et objets manquaient au controle. Ajout des snapshots (base bridge/), objets (object_ref et base bridge/) et retours d'occurrence (base workspace). Aucune nouvelle interpretation de code metier, de prix ou de contenu.
8. **Suivi Git** : le motif backups/ masquait de nouveaux fichiers TS d'implementation. Exceptions strictement limitees au code src/main/backups/*.ts ; les sauvegardes utilisateur restent ignorees.

## Preuves de preparation

- Code cf59ca432ec97df8e77f989344a839a1d1da0622 : typecheck OK ; **1660/1660 Vitest,194 fichiers,116 s**, runtime Electron44.3/Node24.20 via scripts/run-tests.cjs, deux workers. L'etape CI native preparee etait le seul changement non commite pendant la preparation ; sources applicatives identiques a cf59ca43.
- **36 controles Electron natifs** :23 capture/incidents,13 reprise dans un second processus ; deux fenetres reelles avec App/preload/IPC, aucun mock des services metier, SQLite et profils exclusivement TEMP. Le compteur est celui des assertions du banc EC04, pas une reprise de la campagne graphique46.
- Registre natif exact **1-71**,133 tables ; integrations des migrations historiques,35 restaurations et6 equivalences binaires dans la suite complete. `[1,3,71]`, doublons/noms/ordre invalides dans les tests du ledger.
- Les premiers echecs sont preserves dans outputs/ec04-msi :111 cibles dont3 echecs initiaux ; corrections puis cibles vertes. Deux erreurs de preparation du nouveau banc (champ d'API et image fictive vide) ont ete corrigees dans le banc, sans modifier les services.
- L'inventaire AST parcourt170 fichiers et1032 sites candidats, sans execution des services. **Ce n'est pas une preuve exhaustive de pause globale.** Voir audit distinct.

## Recette native effectivement effectuee

Capture avec operation longue drainee et heartbeat en attente ; archive B1, lecture/verifications repetees, restauration neuve, comparaison des fichiers et references connues, copie relocalisee,14 sous-dossiers ressources pour2 projets. Au second processus : configuration choisit exactement la nouvelle racine, memes identifiants et comptages Client/2 Devis/2 Projets/Temps/Pauses/Documents/Depenses/logos/ressources ; integrite/FK, fichiers et chrono unique pause conserve. Consultation depuis deux vraies fenetres, pause/reprise du heartbeat sans doublon.

Incidents : destination existante, archive tronquee/alteree, SQLite corrompue, interruption injectee au deplacement final et conservation du marqueur, marqueurs RESTORE/RELOCATION refuses avant initialisation, chemin fichier au lieu de dossier, configuration corrompue sans fallback, jonction vers exterieur refusee. Changement de chemin avec espaces/accents reel. DPAPI natif : encrypt/decrypt du seul secret fictif sous cet utilisateur, detection du ciphertext comme non portable ; aucun secret reel ni export clair.

Limites : changement C vers D simule dans les tests de plans, **pas un essai sur deux disques physiques** ; refus NTFS ACL non provoque sur le poste ; interruptions par injection deterministe, pas coupure secteur ; Word/Bridge distants non executes ; pas d'installateur. Ces limites ne sont pas des controles verts.

## References encore non garanties

L'inventaire des133 tables identifie17 colonnes nommees path/folder/file. Les11 definitions du controle ne garantissent pas tous les chemins (ni le JSON). bridge_assets.local_path a une cle composite et une semantique issue de l'archive distante ; skippedTables demeure explicite. Les packages Page/Composition peuvent stocker un chemin absolu : leur capture peut etre refusee comme external-path, meme si les octets sont localement sous exports. Il faut un arbitrage de relocalisation/offline et une recette metier de ce cas avant de le declarer portable ; aucune reecriture n'a ete inventee. backup_locations.path_or_reference peut designer un emplacement externe/serveur, non copie ; desired_path est une cible web, pas un fichier local ; projects.resource_root_path est traite par le plan de relocalisation. Provenances importees, JSON et chemins externes restent a qualifier. **referencesVerified=false, consistencyCertified=false, fullReferenceCoverage=false conserves.**

## Validation finale et publication

Apres le commit documentaire final : npm run typecheck, npm test -- --maxWorkers=2, node scripts/check-ec04-workspace-native.cjs et inventaire statique sur le MEME HEAD propre. Preuves locales outputs/ec04-msi/{typecheck-final.log,full-final.log,native-final.log,final-validation.json}; ne pas reutiliser le compteur1659 du commit9398386d comme preuve du candidat final. Le compte rendu de publication indique le SHA reel et les resultats finaux.

Aucune PR ni CI hebergee ouverte. Les filtres push des deux workflows ne correspondent pas a cette branche : publication normale de celle-ci seulement, sans CI. Etape native preparee dans ci.yml pour une future PR EC04 (et push main apres autorisation de fusion), aucun workflow_dispatch ou rerun. Etat CI de ce nouveau candidat : **non execute**, a ne pas confondre avec main/CI1807.

## Verdicts et operations restantes

**GO technique local pour proposer a revue la convergence du socle experimental non expose**, conditionne au succes de la campagne finale au HEAD publie, puis a une CI candidate autorisee avant fusion. **NO-GO production / activation d'une sauvegarde globale quotidienne.** Aucun merge effectue.

Avant activation : references/chemins absolus et JSON complets ; verrou couvrant les appels directs, initialisation/arret et autres processus ; politique des editions externes ; capacite disque/limites ; chiffrement/authentification et confidentialite ; protocole DPAPI de reconfiguration inter-PC ; vrais transferts sur autre disque et controles de reprise ; accord humain distinct pour IPC/UI, fusion et toute installation. La synchronisation Wi-Fi et les exports Word/Excel restent hors scope. Ne pas reconstruire ou reinjecter contrats/temps historiques.
