# UX/UI V2 — Lot 10D : recherche et précautions des réglages

**État :** incrément d'interface sur branche isolée depuis `main@cc0bc679`, **pas 10D achevé**.

## Étude de l'existant
- `SettingsPage` existe dans `src/renderer/App.tsx`, avec les trois thèmes et trois densités persistés via le service settings.
- Le chemin du workspace n'emporte pas de migration des données ; la restauration SQLite est distincte de `BusinessBackupsPage` et du workspace complet.
- L'aide `?` reste accessible même si le survol est désactivé ; l'ancien message « aides masquées » était trompeur.
- Moteurs IPC settings/workspace/backups, sauvegarde/restauration, données clients et migration inchangés.

## Implémenté (non certifié avant CI)
1. Recherche sans effet sur les données : normalisation accents/casse, affichage des rubriques correspondantes ou état vide, champ labellisé.
2. Rubriques apparence, aide, workspace et sécurité avec descriptions exactes. Aucun réglage inexistant inventé.
3. Actions asynchrones de préférence et sauvegarde/restore protégées contre les doubles clics : verrou synchrone + boutons désactivés. Les erreurs remontent dans une alerte locale au lieu d'une Promise non traitée.
4. Thèmes et densités signalés par `aria-pressed`; aide au survol différenciée de l'aide obligatoire.
5. Changement de workspace expliqué sans transfert automatique ; sauvegarde SQLite explicitement distincte du registre des sauvegardes métier et des documents/media.
6. Tests unitaires de la recherche (requête vide, accents, termes multiples, résultat absent).

## À valider
- Typecheck, Vitest et recette Electron 3 thèmes × 3 densités sur SHA exact.
- Sur vrai IPC : échec de setTheme/setDisplayDensity sans modification de sélection, focus et scroll conservés, permissions workspace et annulation, UX-01 formulaire dirty, moteur UX-16 restaurer sans rebâtir ses gardes.
- Recherche fine et préférences Navigation/vues non développées par cet incrément ; ne pas inventer d'API ni de migration.
- Aucun déplacement/restore ou intervention Validation-MSI exécuté, aucune fusion main.
