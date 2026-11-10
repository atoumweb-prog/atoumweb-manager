'use strict';
// Prépare la COPIE PROPRE de mise en service V3.9.4 à partir d'une sauvegarde (étape A).
// Ne touche jamais la base en service. Usage :
//   node scripts/prepare-v394-activation-copy.cjs --snapshot-report <SAUVEGARDE-RESTAURATION.json> --output <dossier NOUVEAU>
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 16 * 1024 * 1024});
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(r.status ?? 1);
}
const arg = key => { const i = process.argv.indexOf(key); return i < 0 ? null : process.argv[i + 1]; };
const snapshot = arg('--snapshot-report'), output = arg('--output');
if (!snapshot || !output) { console.error('Usage : --snapshot-report <SAUVEGARDE-RESTAURATION.json> --output <dossier nouveau>'); process.exit(2); }

const repo = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-activation-tool-')), bundle = path.join(temp, 'services.cjs');
require('esbuild').buildSync({
  stdin: {contents: ['src/main/commercial/ApprovedPackActivationCopy', 'src/main/database/DatabaseService', 'src/main/database/migrations', 'src/main/database/NodeSqliteAdapter', 'src/main/workspace']
    .map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent',
  banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`},
});
const S = require(bundle);

const fmt = n => String(n);
function markdown(r) {
  const c = r.counts, s = r.stages, p = r.preservation;
  return `# Copie de mise en service V3.9.4 — PRÊTE

**Préparée le :** ${r.preparedAt}
**Statut :** prête, **non mise en service**. Le remplacement de la base est un geste manuel, sur votre accord (mode opératoire, étape C).

## Fichiers
- Copie prête : \`${r.output.path}\`
  - SHA-256 : \`${r.output.sha256}\`
- Sauvegarde d'origine : \`${r.backup.path}\`
  - SHA-256 : \`${r.backup.sha256}\`
- Base en service concernée : \`${r.source}\` — **inchangée depuis la sauvegarde** (empreinte vérifiée), jamais ouverte par l'outil.

## Ce qui a été fait sur la copie
1. Migration 81 (brouillons du catalogue) : ${s.migration81}.
2. Import du pack V3.9.4 : ${fmt(c.tarifsV394)} tarifs et ${fmt(c.clausesV394)} clauses, **tous en brouillon** (publiés : ${fmt(c.tarifsV394Publies)} tarif, ${fmt(c.clausesV394Publiees)} clause).
3. Noms et familles : ${fmt(s.nomsEtFamilles.renames)} fiches renommées, ${fmt(s.nomsEtFamilles.recategorized)} fiches rattachées, ${fmt(s.nomsEtFamilles.categoriesCreated)} catégories créées.
4. Rejeu de l'import : sans effet (vérifié).

## Contrôles
- Aucune ligne existante perdue ; aucune modification hors des fiches du pack (nom, famille, code) : ${p.violations.length ? 'NON' : 'conforme'}.
- Lignes existantes modifiées : ${JSON.stringify(p.changedExistingRows)}.
- Lignes ajoutées par table : ${JSON.stringify(p.newRows)}.
- Fiches « TEST » : ${fmt(c.fichesTest)} (identique à la sauvegarde si non nul).
- Intégrité SQLite et clés étrangères : conformes.
- Démarrage du moteur du Manager sur une copie séparée : ${r.runtime.ok ? 'réussi' : 'ÉCHEC'} (migrations en attente : ${r.runtime.pendingBefore}).

## Suite
Rien n'est publié : les nouvelles offres ne peuvent pas encore entrer dans un devis. Voir le mode opératoire, étapes C (mise en service) et D (publication).
`;
}

(async () => {
  try {
    const result = await S.prepareApprovedActivationCopy(snapshot, output);
    // Démarrage réel du moteur (DatabaseService) sur une copie séparée, jamais sur le fichier livré.
    const workspace = S.ensureWorkspace(path.join(temp, 'workspace'));
    fs.copyFileSync(result.output.path, workspace.databaseFile);
    const probe = new S.NodeSqliteAdapter(workspace.databaseFile);
    let pendingBefore;
    try { pendingBefore = S.getPendingMigrations(probe).map(m => m.id); } finally { probe.close(); }
    const service = new S.DatabaseService(workspace);
    let runtime;
    try { await service.initialize(); runtime = {ok: pendingBefore.length === 0, pendingBefore: pendingBefore.length ? pendingBefore.join(', ') : 'aucune', persistence: service.catalog.persistenceAvailable()}; }
    finally { service.close(); }
    if (!runtime.ok || !runtime.persistence) throw Error('Le moteur du Manager n’accepte pas la copie : ' + JSON.stringify(runtime));
    const full = {...result, runtime};
    fs.writeFileSync(path.join(output, 'RAPPORT-ACTIVATION.json'), JSON.stringify(full, null, 2));
    fs.writeFileSync(path.join(output, 'RAPPORT-ACTIVATION.md'), markdown(full));
    console.log(JSON.stringify({status: result.status, output: result.output, counts: result.counts, stages: {migration81: result.stages.migration81, nomsEtFamilles: result.stages.nomsEtFamilles}, preservation: result.preservation, runtime}, null, 1));
  } catch (error) {
    if (fs.existsSync(output) && !fs.existsSync(path.join(output, 'RAPPORT-ACTIVATION.json'))) fs.rmSync(output, {recursive: true, force: true});
    console.error('REFUSÉ — ' + (error && error.message || error));
    process.exitCode = 1;
  } finally { fs.rmSync(temp, {recursive: true, force: true}); }
})();
