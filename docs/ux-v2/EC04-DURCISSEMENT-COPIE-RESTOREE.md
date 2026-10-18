# EC04 — Durcissement de la copie relocalisée avant recette Windows

Commit préparatoire après `91a6976`. Le workspace d'origine reste inchangé.

## Défauts traités

1. **Échec de création du marqueur** : après `mkdirSync` exclusif du nouveau workspace, la création `wx` du fichier `.EC04-RELOCATION-INCOMPLETE` est indispensable. Si elle échoue, seule la nouvelle destination encore vide est retirée avec `rmdirSync`. Si son retrait échoue aussi, un `AggregateError` explicite signale un répertoire qui doit rester considéré comme suspect, et la migration est refusée.
2. **Liens symboliques dans les répertoires parents** : chaque composant du chemin des fichiers copiés, y compris le dossier `data`, est vérifié par `lstatSync` pour refuser une substitution de répertoire. Le test sur le fichier terminal était auparavant insuffisant si son parent était devenu un lien symbolique.
3. **Échec au moment de recréer les sept dossiers de projet** : un nouveau cas de test place un fichier ordinaire à l'emplacement attendu d'un sous-dossier `Ressources`. La copie doit refuser ce dossier, garder le marqueur d'inachèvement et laisser la source d'origine lisible et intacte.

## Limites maintenues

Le contrôle `lstatSync` reste sujet à une petite fenêtre de concurrence entre la vérification et l'ouverture effective d'un fichier. La copie est réservée à un workspace **déjà restauré et inactif** ; elle n'est ni un outil de migration d'un workspace actif ni une défense complète contre un processus hostile sur le disque.

Tests Vitest ajoutés mais non exécutés dans l'application faute de clone complet du dépôt et de ses dépendances. Des scripts isolés Node/SQLite ont été exécutés sur le noyau EC04 local, mais ne valent pas une CI projet. Pas de fusion, ni de MSI, ni d'activation IPC.