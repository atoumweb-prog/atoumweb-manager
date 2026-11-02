'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { DatabaseSync, backup } = require('node:sqlite');

const repo = path.resolve(__dirname, '..');
const application = path.join(repo, 'out', 'AtoumWeb Manager-win32-x64');
const sourceDatabase = path.join(repo, 'output', 'convergence-final-20261102', 'recette-croisee.sqlite');
const proofSource = path.join(repo, 'output', 'contract-functional-validation-20261031', 'PDF-BROUILLONS', 'DEV-TEST-01-BROUILLONS.pdf');
const deliveryBase = path.resolve(process.argv[2] || 'C:/DEV/03_LIVRAISONS/AtoumWeb');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const readHead = () => cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
const readBranch = () => cp.execFileSync('git', ['branch', '--show-current'], { cwd: repo, encoding: 'utf8' }).trim();
const exe = path.join(application, 'atoumweb-manager.exe');
const asar = path.join(application, 'resources', 'app.asar');

function assertRecipeDatabase(db) {
  const ledger = db.prepare('SELECT id FROM schema_migrations ORDER BY id').all().map(row => row.id);
  if (ledger.length !== 80 || ledger.some((id, index) => id !== index + 1)) throw new Error('La graine de recette ne contient pas exactement les migrations 1 a 80.');
  if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('Integrite SQLite invalide.');
  if (db.prepare('PRAGMA foreign_key_check').all().length !== 0) throw new Error('Cle etrangere invalide.');
  const v37 = db.prepare("SELECT id FROM contract_editorial_import_runs WHERE source_reference LIKE '%V3.7%' ORDER BY created_at DESC LIMIT 1").get();
  if (!v37) throw new Error('Import V3.7 absent.');
  if (db.prepare('SELECT COUNT(*) AS n FROM contract_editorial_import_entries WHERE run_id=?').get(v37.id).n !== 118) throw new Error('Les 118 propositions V3.7 ne sont pas presentes.');
  if (db.prepare('SELECT COUNT(*) AS n FROM contract_editorial_import_entries e JOIN contract_clause_versions v ON v.id=e.draft_version_id WHERE e.run_id=? AND v.status<>\'draft\'').get(v37.id).n !== 0) throw new Error('Une proposition V3.7 ne se trouve plus en brouillon.');
  const latestCatalogDrafts = db.prepare("SELECT COUNT(*) AS n FROM catalog_versions WHERE status='draft' AND created_at >= '2026-11-02T04:00:54.888Z'").get().n;
  if (latestCatalogDrafts !== 6) throw new Error('Les six propositions Catalogue attendues ne sont pas toutes en brouillon.');
  for (const [table, minimum] of [['client_accounts', 1], ['projects', 1], ['project_sites', 1], ['quotes', 3], ['data_processing_site_assessments', 1], ['data_processing_agreements', 2]]) {
    if (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n < minimum) throw new Error(`Donnees fictives insuffisantes dans ${table}.`);
  }
}

const psLiteral = value => `'${value.replaceAll("'", "''")}'`;

(async () => {
  if (readBranch() !== 'codex/rgpd-v3-site-agreements-20261101') throw new Error('Branche consolidee attendue non active.');
  for (const required of [exe, asar, sourceDatabase, proofSource]) if (!fs.existsSync(required)) throw new Error(`Fichier requis absent : ${required}`);
  const exeSHA256 = hash(exe);
  const asarSHA256 = hash(asar);
  const root = path.join(deliveryBase, `Manager-RECETTE-PR161-PR164-20261102-${asarSHA256.slice(0, 8)}`);
  if (fs.existsSync(root)) throw new Error(`Livraison deja presente, aucune reecriture automatique : ${root}`);

  const applicationTarget = path.join(root, 'Application');
  const profile = path.join(root, 'Profil-RECETTE');
  const workspace = path.join(root, 'Workspace-RECETTE');
  const database = path.join(workspace, 'data', 'atoumweb-manager.sqlite');
  const seed = path.join(root, 'Graine-RECETTE', 'atoumweb-manager.sqlite');
  fs.mkdirSync(root, { recursive: true });
  fs.cpSync(application, applicationTarget, { recursive: true });
  for (const directory of [profile, path.dirname(database), path.dirname(seed), path.join(workspace, 'backups'), path.join(workspace, 'clients', 'recette')]) fs.mkdirSync(directory, { recursive: true });

  const source = new DatabaseSync(sourceDatabase, { readOnly: true });
  try {
    assertRecipeDatabase(source);
    await backup(source, database);
    await backup(source, seed);
  } finally {
    source.close();
  }
  fs.copyFileSync(proofSource, path.join(workspace, 'clients', 'recette', 'accord-rgpd-signe.pdf'));

  for (const file of [database, seed]) {
    const copy = new DatabaseSync(file);
    try {
      assertRecipeDatabase(copy);
      copy.prepare("UPDATE projects SET resource_root_path=? WHERE name='TEST — Site RGPD croisé'").run(path.join(workspace, 'projets-internes', 'PRO-2026-001 - TEST - Site RGPD croise', 'Ressources'));
    } finally {
      copy.close();
    }
  }

  const marker = {
    environment: 'RECETTE / TEST', onlySynthetic: true, branch: readBranch(), commit: readHead(),
    workspace, database, sourceDatabaseSHA256: hash(sourceDatabase), asarSHA256,
  };
  fs.writeFileSync(path.join(root, 'RECETTE-TEST.json'), JSON.stringify(marker, null, 2));
  fs.writeFileSync(path.join(workspace, 'RECETTE-TEST.json'), JSON.stringify(marker, null, 2));
  fs.writeFileSync(path.join(profile, 'workspace.json'), JSON.stringify({ workspaceRoot: workspace }, null, 2));

  const starter = `$ErrorActionPreference = 'Stop'\r\n`+
    `$root = Split-Path -Parent $MyInvocation.MyCommand.Path\r\n`+
    `$marker = Get-Content -Raw -LiteralPath (Join-Path $root 'RECETTE-TEST.json') | ConvertFrom-Json\r\n`+
    `$profile = [IO.Path]::GetFullPath((Join-Path $root 'Profil-RECETTE'))\r\n`+
    `$workspace = [IO.Path]::GetFullPath((Join-Path $root 'Workspace-RECETTE'))\r\n`+
    `$exe = [IO.Path]::GetFullPath((Join-Path $root 'Application\\atoumweb-manager.exe'))\r\n`+
    `if (-not $marker.onlySynthetic -or $marker.environment -ne 'RECETTE / TEST') { throw 'Marqueur de recette invalide.' }\r\n`+
    `if ([IO.Path]::GetFullPath([string]$marker.workspace) -ne $workspace) { throw 'Workspace refuse.' }\r\n`+
    `$configured = Get-Content -Raw -LiteralPath (Join-Path $profile 'workspace.json') | ConvertFrom-Json\r\n`+
    `if ([IO.Path]::GetFullPath([string]$configured.workspaceRoot) -ne $workspace) { throw 'Profil de recette invalide.' }\r\n`+
    `if (-not (Test-Path -LiteralPath $exe)) { throw 'Executable de recette absent.' }\r\n`+
    `Start-Process -FilePath $exe -ArgumentList @('--user-data-dir=' + $profile, '--functional-recipe', '--remote-debugging-port=0') -WorkingDirectory (Split-Path -Parent $exe)\r\n`;
  fs.writeFileSync(path.join(root, 'Demarrer-RECETTE.ps1'), starter);
  fs.writeFileSync(path.join(root, 'LANCER-RECETTE-TEST.cmd'), "@echo off\r\nsetlocal\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File \"%~dp0Demarrer-RECETTE.ps1\"\r\nif errorlevel 1 (echo. & echo ECHEC DU LANCEMENT - aucune base utilisateur n'a ete ouverte. & pause)\r\n");

  const reset = `$ErrorActionPreference = 'Stop'\r\n`+
    `$root = [IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))\r\n`+
    `$marker = Get-Content -Raw -LiteralPath (Join-Path $root 'RECETTE-TEST.json') | ConvertFrom-Json\r\n`+
    `$workspace = [IO.Path]::GetFullPath((Join-Path $root 'Workspace-RECETTE'))\r\n`+
    `$database = [IO.Path]::GetFullPath((Join-Path $workspace 'data\\atoumweb-manager.sqlite'))\r\n`+
    `$seed = [IO.Path]::GetFullPath((Join-Path $root 'Graine-RECETTE\\atoumweb-manager.sqlite'))\r\n`+
    `if (-not $marker.onlySynthetic -or $marker.environment -ne 'RECETTE / TEST' -or [IO.Path]::GetFullPath([string]$marker.workspace) -ne $workspace) { throw 'Recette non reconnue : reinitialisation refusee.' }\r\n`+
    `foreach ($candidate in @($database, $seed)) { if (-not $candidate.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Chemin exterieur refuse.' } }\r\n`+
    `$running = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'atoumweb-manager.exe' -and $_.CommandLine -like ('*' + [WildcardPattern]::Escape((Join-Path $root 'Profil-RECETTE')) + '*') }\r\n`+
    `if ($running) { throw 'Fermez d''abord le Manager RECETTE / TEST.' }\r\n`+
    `$backupDir = Join-Path $workspace 'backups'\r\n`+
    `New-Item -ItemType Directory -Force -Path $backupDir | Out-Null\r\n`+
    `if (Test-Path -LiteralPath $database) { Copy-Item -LiteralPath $database -Destination (Join-Path $backupDir ('avant-reset-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.sqlite')) }\r\n`+
    `Copy-Item -LiteralPath $seed -Destination $database -Force\r\n`+
    `foreach ($suffix in @('-wal','-shm')) { $sidecar = $database + $suffix; if (Test-Path -LiteralPath $sidecar) { Remove-Item -LiteralPath $sidecar -Force } }\r\n`+
    `Write-Host 'Donnees fictives reinitialisees. Vos donnees utilisateur n''ont pas ete ouvertes.' -ForegroundColor Green\r\n`;
  fs.writeFileSync(path.join(root, 'Reinitialiser-RECETTE.ps1'), reset);
  fs.writeFileSync(path.join(root, 'REINITIALISER-LES-DONNEES-TEST.cmd'), '@echo off\r\nsetlocal\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Reinitialiser-RECETTE.ps1"\r\necho.\r\npause\r\n');
  fs.writeFileSync(path.join(root, 'RECETTE_AUTO.cmd'), `@echo off\r\nsetlocal\r\ntitle AtoumWeb Manager - RECETTE AUTO\r\nnode ${JSON.stringify(path.join(repo, 'scripts', 'run-functional-recipe-auto.cjs'))} "%~dp0."\r\nset CODE=%ERRORLEVEL%\r\necho.\r\nif exist "%~dp0DERNIER-RAPPORT-AUTO.txt" (set /p REPORT=<"%~dp0DERNIER-RAPPORT-AUTO.txt" & start "" "%REPORT%")\r\nif not "%CODE%"=="0" echo RECETTE EN ECHEC - consultez le rapport.\r\nif "%CODE%"=="0" echo RECETTE REUSSIE - rapport ouvert.\r\necho.\r\npause\r\nexit /b %CODE%\r\n`);

  fs.writeFileSync(path.join(root, 'LIRE-MOI-RECETTE.txt'), [
    'ATOUMWEB MANAGER - RECETTE / TEST PR #161 + PR #164', '',
    'Double-cliquez sur LANCER-RECETTE-TEST.cmd.',
    'Le bandeau jaune RECETTE / TEST doit rester visible dans l application.', '',
    'Donnees fictives : 2 clients, 1 projet TEST, 1 site RGPD, 3 devis, 118 propositions V3.7 et 6 propositions Catalogue en brouillon.',
    'RGPD : le site "Site RGPD croise" possede une version signee et une revision modifiable.',
    'Bibliotheque : comparer les versions publiees aux brouillons, simuler, puis ne preparer que sur action explicite.',
    'Catalogue : verifier les six propositions sans les publier.',
    'Devis : ouvrir DEV-2026-001 a DEV-2026-003 et controler le parcours et les contrats.', '',
    'Recette automatique : double-cliquez sur RECETTE_AUTO.cmd. Le rapport HTML s ouvre a la fin.',
    'Pour repartir de zero manuellement : fermez la recette puis double-cliquez sur REINITIALISER-LES-DONNEES-TEST.cmd.',
    'Une sauvegarde locale de la recette est conservee avant chaque reinitialisation.', '',
    'Cette livraison utilise exclusivement Profil-RECETTE et Workspace-RECETTE. Elle ne connait pas le profil habituel du Manager.',
  ].join('\r\n'));

  const version = { ...marker, exeSHA256, generatedAt: new Date().toISOString(), migrations: 80, v37Drafts: 118, catalogDrafts: 6, installer: false };
  fs.writeFileSync(path.join(root, 'VERSION-RECETTE.json'), JSON.stringify(version, null, 2));
  if (hash(path.join(applicationTarget, 'atoumweb-manager.exe')) !== exeSHA256 || hash(path.join(applicationTarget, 'resources', 'app.asar')) !== asarSHA256) throw new Error('Empreinte de l application copiee invalide.');
  console.log(root);
})().catch(error => { console.error(error); process.exitCode = 1; });
