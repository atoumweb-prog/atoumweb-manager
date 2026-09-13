# Développement local — AtoumWeb Manager

## Prérequis

- Windows 10/11
- Node.js **20.19 ou supérieur**
- npm fourni avec Node.js
- Git

> Node 20.19.3, déjà installé sur le poste AtoumWeb, convient pour installer, vérifier, tester et packager ce socle. Electron embarque sa propre version de Node pour l’exécution de l’application.

## Premier démarrage

```powershell
git clone https://github.com/atoumweb-prog/atoumweb-manager.git
cd atoumweb-manager
git switch foundation/electron-react-sqlite
```

## Validation automatique Gate 0

Le script Windows `scripts/gate0-windows.ps1` vérifie les prérequis, installe les dépendances, lance le typecheck, les tests et le packaging Electron, puis écrit un journal `gate0-output.txt` à la racine du dépôt.

Depuis PowerShell ouvert dans le dossier `atoumweb-manager` :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gate0-windows.ps1
```

Le script vérifie notamment :

- Node.js 20.19 minimum ;
- npm et Git disponibles ;
- branche `foundation/electron-react-sqlite` ;
- `npm install` ou `npm ci` ;
- `npm run typecheck` ;
- `npm test` ;
- `npm run package`.

S'il échoue, conserver `gate0-output.txt` : ce fichier sert au diagnostic.

Après un Gate 0 automatique réussi, lancer séparément :

```powershell
npm start
```

Puis vérifier visuellement : démarrage de l'application, navigation, thèmes AtoumWeb/Noir/Blanc, Réglages, création du workspace et sauvegarde/restauration de test.

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
