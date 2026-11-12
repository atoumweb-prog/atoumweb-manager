'use strict';
// Clause 119 : propose l'autorisation de référence commerciale à la LIVRAISON (décision de Carlos, 11/11/2026).
// Crée la version 2 du modèle de projet « AtoumWeb · Site vitrine » : la tâche « Formation & livraison » gagne trois champs
// (autorisation demandée / accordée / refusée, éléments et supports autorisés, preuve) et un conseil rappelant que la demande est
// facultative, jamais précochée et sans effet sur le prix ni sur la commande. La version 1 reste en place, retirée : les projets déjà créés
// ne changent pas. Les liens catalogue → modèle des NOUVELLES ventes pointent vers la version 2.
//   Aperçu :      node scripts/preproduction/add-reference-consent-v2.cjs --dest <préproduction>
//   Application : node scripts/preproduction/add-reference-consent-v2.cjs --dest <préproduction> --apply
// Sauvegarde la base avant écriture ; refuse si le Manager de cette préproduction est ouvert. Rejouable.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 16 * 1024 * 1024});
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(r.status ?? 1);
}
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const dest = arg('--dest'), apply = process.argv.includes('--apply');
const fail = m => { console.error('REFUSÉ — ' + m); process.exit(1); };
if (!dest) fail('Usage : --dest <préproduction> [--apply]');
const target = path.resolve(dest), metaFile = path.join(target, 'PREPRODUCTION.json');
if (!fs.existsSync(metaFile) || JSON.parse(fs.readFileSync(metaFile, 'utf8')).mode !== 'PREPRODUCTION_TEST') fail('Ce dossier n’est pas une préproduction de test assemblée.');
const dbFile = path.join(target, 'Workspace', 'data', 'atoumweb-manager.sqlite');
if (/validation-msi/i.test(dbFile) || !fs.existsSync(dbFile)) fail('Base introuvable ou interdite.');
const running = spawnSync('powershell.exe', ['-NoProfile', '-Command',
  `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '*${target.replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
if (apply && running !== '0') fail('La préproduction est ouverte : ferme-la avant.');
const repo = path.resolve(__dirname, '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-consent-'));
const bundle = path.join(tmp, 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/database/NodeSqliteAdapter', 'src/main/projects/ProjectService', 'src/main/workspace'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);

const TEMPLATE_ID = 'atoumweb-project-template-vitrine', HANDOVER_KEY = 'launch.handover';
const FIELDS = [
  {key: 'reference_consent', label: 'Autorisation de référence commerciale (clause 119)', type: 'select', options: ['Pas encore demandée', 'Accordée', 'Refusée'], help: 'Facultative, jamais précochée. Un refus n’a aucune conséquence sur le prix ni sur la commande.'},
  {key: 'reference_scope', label: 'Éléments et supports autorisés', type: 'textarea', help: 'Seulement si accordée : nom, logo, captures, lien, supports (site, réseaux, documents commerciaux).'},
  {key: 'reference_proof', label: 'Preuve de l’accord', type: 'text', help: 'Date et nature de l’écrit (e-mail, signature). Le client peut retirer l’autorisation pour l’avenir par simple demande écrite.'},
];
const ADVICE = {kind: 'warning', title: 'Clause 119 : références commerciales', body: 'Proposer à la livraison l’autorisation de citer le client en référence. Elle est facultative, distincte de la commande, jamais précochée et révocable pour l’avenir. Sans accord écrit, ne pas utiliser son nom, son logo ni des captures de son site.'};

(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const versions = db.all('SELECT id,version_number n,status FROM project_template_versions WHERE template_id=? ORDER BY version_number', [TEMPLATE_ID]);
    if (!versions.length) throw Error('Modèle « AtoumWeb · Site vitrine » introuvable.');
    const already = versions.find(v => v.n >= 2 && v.status === 'published');
    const current = versions.find(v => v.status === 'published');
    if (already) { console.log(JSON.stringify({dejaFait: true, version: already.n})); return; }
    if (!current || current.n !== 1) throw Error('Version publiée inattendue : ' + JSON.stringify(versions));
    const node = db.get('SELECT id,work_card_json,advice_json FROM project_template_nodes WHERE template_version_id=? AND semantic_key=?', [current.id, HANDOVER_KEY]);
    if (!node) throw Error('Tâche « Formation & livraison » introuvable dans la version 1.');
    const links = db.all('SELECT id FROM catalog_project_blueprints WHERE template_version_id=?', [current.id]);
    if (!apply) { console.log(JSON.stringify({apercu: true, depuis: 'v1', versNouvelleVersion: 2, champsAjoutes: FIELDS.map(f => f.key), liensCatalogueRedirigés: links.length}, null, 1)); return; }
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-consentement-reference-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    const projects = new S.ProjectService(db, S.createWorkspacePaths(path.join(tmp, 'ws')));
    const draft = projects.createTemplateVersion(TEMPLATE_ID, 'Version 2 : autorisation de référence commerciale proposée à la livraison (clause 119).');
    const copied = db.get('SELECT id,work_card_json,advice_json FROM project_template_nodes WHERE template_version_id=? AND semantic_key=?', [draft.id, HANDOVER_KEY]);
    if (!copied) throw Error('Tâche de livraison absente de la version copiée.');
    const card = JSON.parse(copied.work_card_json ?? '{"fields":[]}');
    card.fields = [...card.fields.filter(f => !FIELDS.some(n => n.key === f.key)), ...FIELDS];
    const advice = [...JSON.parse(copied.advice_json ?? '[]').filter(a => a.title !== ADVICE.title), ADVICE];
    db.run('UPDATE project_template_nodes SET work_card_json=?, advice_json=? WHERE id=?', [JSON.stringify(card), JSON.stringify(advice), copied.id]);
    projects.publishTemplateVersion(draft.id);
    db.run('UPDATE catalog_project_blueprints SET template_version_id=? WHERE template_version_id=?', [draft.id, current.id]);
    const integrity = db.all('PRAGMA integrity_check'), fk = db.all('PRAGMA foreign_key_check');
    if (integrity[0].integrity_check !== 'ok' || fk.length) throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'consentement-reference-v2', le: new Date().toISOString(), sauvegardeAvant: backup, modele: TEMPLATE_ID, versionPubliee: 2, liensRedirigés: links.length}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, version: 2, champs: FIELDS.map(f => f.key), liensRedirigés: links.length}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
