# UX-01 × UX-16 — Recette native isolée de fermeture/restauration

Statut au 10/10/2026 : **harness créé, syntaxe JavaScript contrôlée, exécution réelle Windows en attente du nouveau script diagnostique**. La première version utilisait `spawnSync`, qui n'affichait pas la sortie Electron tant que le sous-processus n'était pas terminé : un utilisateur a observé une console silencieuse. La version actuelle lance les étapes en streaming et affiche des traces explicites.

Commande depuis la branche `prep/ux01-restore-quit-gate-v2` (après `npm ci`) :

```powershell
node scripts/check-restore-quit-roundtrip.cjs
```

**Diagnostic pendant le test :** les cinq étapes sont désormais affichées au démarrage, avec les messages intermédiaires Electron. Chaque étape a une limite de 90 secondes ; en cas d'échec, le numéro d'étape et sa sortie sont conservés. Pour interrompre volontairement, **Ctrl+C**, qui arrête le sous-processus de recette ciblé et tente de nettoyer uniquement sa fixture temporaire. Ne jamais tuer tous les processus Electron du PC : d'autres instances pourraient être légitimes.

Ce script est indépendant de Codex, des crédits Codex et de GitHub Actions. **Ne pas lancer directement le sous-processus Electron avec `--stage`** ; le parent Node gère les dossiers temporaires, les contrôles et la suppression.

## Périmètre des opérations

- Crée un répertoire à préfixe fixe `atoumweb-ux01-restore-roundtrip-` avec `mkdtemp` dans le dossier TEMP système, avec deux profils `accepted` et `refused`.
- Dans chaque profil, initialise via le **vrai DatabaseService** une base indépendante avec les migrations actuelles ; marque la valeur `before`, crée une véritable sauvegarde manuelle SQLite, puis marque la base courante `after`.
- **Acceptation** : ouvre un processus Electron natif ; `registerGuardedShutdown` laisse réellement passer `app.quit()` ; `RestoreQuitGate` écrit `pending-database-restore.json` uniquement lors de `will-quit` via `scheduleDatabaseRestore`. Le parent vérifie le marqueur et son workspace. Un **second processus Electron distinct** applique `applyPendingDatabaseRestore`, vérifie la valeur `before`, les 66 migrations, l'intégrité SQLite et la sauvegarde `pre-restore` contenant `after`. Un troisième processus vérifie l'absence de rejeu.
- **Refus** : un enregistrement `pending` force le refus de `app.quit()`, sans dialogue bloquant. Le script vérifie que SQLite est restée ouverte, qu'aucun marqueur n'est apparu et que l'intention `RestoreQuitGate` est annulée. Un nouveau processus vérifie l'absence de restauration tardive et la conservation de `after`.
- Supprime **uniquement** son propre dossier créé dans TEMP, après vérification de son emplacement et préfixe ; ne lit ni ne modifie `Validation-MSI`, le profil ordinaire du Manager ou une autre base utilisateur.
- Échec = code de sortie non nul ; aucune sortie `PASS` ne doit être interprétée comme validation si l'exécution complète se termine en erreur.

## Incident Windows du 10/10/2026 — acceptation Electron

Sur `5c0cf423`, l'exécution réelle a initialisé la base, créé la sauvegarde puis affiché le **rapport `accepted-quit` avant `app.quit()`** ; le processus n'a pas terminé et le parent a atteint la limite de 90 secondes. Le dossier temporaire a été nettoyé. **Ce rapport ne prouvait pas `will-quit` : la restauration et le redémarrage n'ont pas été validés.**

Correctif de la **recette seulement**, sans modifier `src/main` :
- ouverture d'une vraie `BrowserWindow` masquée dans la fixture et raccordement des protections de sortie UX-01 ;
- instrumentation des événements natifs `before-quit` / `will-quit` ; pour l'acceptation, le rapport de succès n'est émis **qu'après `will-quit`**, la fermeture du service SQLite et la vérification du marqueur ;
- si `will-quit` est absent, erreur explicite après 12 secondes de fermeture sollicitée (avant le timeout parent de 90 s) ; `app.exit(0)` utilisé uniquement dans la fixture après preuves observées ;
- distinction entre sortie effective du **PID Electron** et flux stdout/stderr éventuellement retenus par des processus enfants sous Windows ;
- en cas de refus, vérification de `before-quit`, absence de `will-quit`, fenêtre conservée, état SQLite inchangé et marqueur absent.

**Hypothèses non encore départagées :** fermeture sans aucune fenêtre dans l'ancienne fixture et/ou handles de sortie Windows encore ouverts. Aucun défaut de la fermeture réelle du Manager n'est établi à ce stade. Exécution réelle de ce nouveau correctif **encore en attente**.

## Ce que cette recette ne prouve pas

**Il s'agit de cinq processus Electron natifs exerçant les services réels, mais pas de l'exécutable packagé installé.** Elle ne prétend donc pas confirmer le vrai `app.relaunch()` du MSI, la fenêtre graphique complète, ni le chemin `app.isPackaged` de l'IPC en conditions de distribution. Les 183 contrôles natifs 3 thèmes réalisés séparément couvrent les interactions React/Electron, sans constituer cette preuve packagée.

La validation totale du parcours packagé exige encore un test isolé sur un exécutable généré dans un environnement temporaire, sans démarrer la distribution de production ni lire les données réelles. Ne pas fusionner #83 sur ce seul harness.

## Historique des résultats

- Sur `88efb788`, AtoumWeb a exécuté sur Windows : typecheck OK ; **31/31** ciblés ; **801/801** complets, 87 fichiers ; **183/183** UI native trois thèmes ; fixtures supprimées.
- Le présent script ajouté après ces résultats **n'est pas inclus dans leur périmètre**.
- Vérification dans l'environnement de préparation : **syntaxe CJS par `node --check` OK**. Ici, l'exécutable Electron et les dépendances `esbuild` du projet ne sont pas installés : aucune exécution bout-en-bout ne peut être annoncée comme réussie.

Pas de CI GitHub déclenchée ; pas de changement de `main`, #82, de la branche PR officielle #83 ou de `Validation-MSI`.
