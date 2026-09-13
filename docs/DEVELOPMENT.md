# Développement local — AtoumWeb Manager

## Prérequis

- Windows 10/11
- Node.js 24 LTS
- npm fourni avec Node.js
- Git

## Premier démarrage

```powershell
git clone https://github.com/atoumweb-prog/atoumweb-manager.git
cd atoumweb-manager
git switch foundation/electron-react-sqlite
npm install
npm run typecheck
npm test
npm start
```

## Commandes

- `npm start` : démarre Electron Forge en développement.
- `npm run typecheck` : vérifie TypeScript sans générer de fichiers.
- `npm test` : exécute les tests Vitest.
- `npm run package` : construit une application non installée.
- `npm run make` : construit l'installateur Windows.

## Données locales

Par défaut, AtoumWeb Manager crée un workspace dans `Documents/AtoumWeb Manager`.

Structure de fondation :

- `data/atoumweb-manager.sqlite`
- `backups/automatic/`
- `backups/manual/`
- `backups/pre-migration/`
- `backups/pre-restore/`
- `clients/`
- `exports/`

Le workspace pourra être déplacé depuis Réglages, par exemple vers `D:\AtoumWeb\`.

## Sécurité

Le renderer React n'accède jamais directement à Node.js, SQLite ou au système de fichiers. Toute opération privilégiée passe par le preload et une liste explicite de commandes IPC.

## Sauvegarde et restauration

- Une sauvegarde quotidienne est créée automatiquement au premier démarrage de la journée.
- Une sauvegarde manuelle peut être créée depuis Réglages.
- Avant une migration de schéma, la base existante est sauvegardée.
- Une restauration est programmée depuis Réglages puis appliquée au redémarrage, avant l'ouverture de SQLite.
- Avant remplacement, la base courante est sauvegardée dans `backups/pre-restore/`.

## Branche de fondation

Le développement initial se fait sur `foundation/electron-react-sqlite`. `main` doit rester stable jusqu'à validation de la PR.
