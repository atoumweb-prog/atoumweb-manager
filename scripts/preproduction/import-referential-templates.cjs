'use strict';
// Modèles de projet du référentiel (fiche validée par Carlos le 16/11/2026, docs/refonte/plans/2026-11-16-modeles-de-projet-design.md).
// Crée un modèle de projet par ensemble d'étapes du référentiel (scripts/referentiel/etapes.cjs) et relie chaque offre de nature
// « base » ou « complément » à son modèle. Les services récurrents ne reçoivent aucun modèle. Durées vides, étapes proposées
// marquées « Proposé, à valider ». Le modèle « AtoumWeb · Site vitrine », les modèles TEST, les devis acceptés et les projets ne changent pas.
//   Aperçu :      node scripts/preproduction/import-referential-templates.cjs --dest <préproduction> [--report <fichier.md>]
//   Application : node scripts/preproduction/import-referential-templates.cjs --dest <préproduction> --apply <planSha256> [--report <fichier.md>]
// Sauvegarde la base avant écriture ; refuse si le Manager de cette préproduction est ouvert. Rejouable (une seconde application n'écrit rien).
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 32 * 1024 * 1024});
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(r.status ?? 1);
}
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const dest = arg('--dest'), apply = arg('--apply'), reportFile = arg('--report');
const fail = m => { console.error('REFUSÉ — ' + m); process.exit(1); };
if (!dest) fail('Usage : --dest <préproduction> [--apply <planSha256>] [--report <fichier.md>]');
const target = path.resolve(dest), metaFile = path.join(target, 'PREPRODUCTION.json');
if (!fs.existsSync(metaFile) || JSON.parse(fs.readFileSync(metaFile, 'utf8')).mode !== 'PREPRODUCTION_TEST') fail('Ce dossier n’est pas une préproduction de test assemblée.');
const dbFile = path.join(target, 'Workspace', 'data', 'atoumweb-manager.sqlite');
if (/validation-msi/i.test(dbFile) || !fs.existsSync(dbFile)) fail('Base introuvable ou interdite.');
const running = spawnSync('powershell.exe', ['-NoProfile', '-Command',
  `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '*${target.replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
if (apply && running !== '0') fail('La préproduction est ouverte : ferme-la avant.');

const repo = path.resolve(__dirname, '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-referentiel-modeles-'));
const bundle = path.join(tmp, 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/database/NodeSqliteAdapter', 'src/main/projects/ProjectService', 'src/main/workspace', 'src/main/projects/ReferentialProjectTemplates', 'src/main/projects/referentialTemplatePlan']
  .map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
const {stepsFor} = require(path.join(repo, 'scripts', 'referentiel', 'etapes.cjs'));
const approved = JSON.parse(fs.readFileSync(path.join(repo, 'data', 'approved', '2026-11-08', 'CATALOGUE_V394_130_EXTRAIT_WORD.json'), 'utf8'));

// Familles affichées dans le nom des modèles partagés par plusieurs offres.
const FAMILIES = [[/^(AW-WEB-|V39-WEB-)/, 'Options de site'], [/^(AW-ECOM-|V39-ECOM-)/, 'Options de boutique'], [/^AW-LP-/, 'Landing page'],
  [/^AW-TECH-/, 'Intervention technique'], [/^AW-CONT-/, 'Contenu et rédaction'], [/^(AW-BRAND-|V39-BRAND-)/, 'Identité visuelle'],
  [/^AW-PHOTO-SHOOT/, 'Shooting photo'], [/^AW-PHOTO-/, 'Retouche photo'], [/^AW-SEO-(ESSENTIEL|AVANCE|PREMIUM|AUDIT)/, 'Pack SEO'], [/^AW-SEO-/, 'Référencement'],
  [/^AW-DATA-/, 'Statistiques'], [/^V39-NL-/, 'Newsletter'], [/^(AW-DEVWP-|AW-APP-)/, 'Développement sur mesure'], [/^AW-MARIAGE-/, 'Site de mariage']];
// Options (nature complément) : nommées par la famille qu’elles complètent.
const OPTION_FAMILIES = [[/^AW-WEB-/, 'Options de site'], [/^AW-ECOM-/, 'Options de boutique'], [/^AW-LP-/, 'Options de landing'], [/^AW-MARIAGE-/, 'Options de mariage']];
const familyOf = code => (S.natureOf(code) === 'addon' ? OPTION_FAMILIES : FAMILIES).find(([re]) => re.test(code))?.[1] ?? 'Prestation';
const offers = approved.references.map(r => { const s = stepsFor({code: r.code_source}); return {code: r.code_source, name: r.nom, steps: s.steps, provenance: s.source, family: familyOf(r.code_source)}; });

function report(plan, extra) {
  const lines = ['# Modèles de projet du référentiel : rapport ' + (extra.applique ? 'd’application' : 'de simulation'), '',
    `Base : \`${dbFile}\`  `, `Empreinte du plan : \`${plan.planSha256}\`  `, `Le : ${new Date().toISOString()}`, '',
    '## Synthèse', '', `- Modèles à créer : ${plan.templates.filter(t => !t.existingVersionId).length} (déjà présents : ${plan.templates.filter(t => t.existingVersionId).length})`,
    `- Liens offre → modèle : ${plan.links.length} (base : ${plan.links.filter(l => l.role === 'base').length}, complément : ${plan.links.filter(l => l.role === 'addon').length})`,
    `- Services récurrents sans modèle : ${plan.recurring.length}`, `- Offres retrouvées par leur nom (sans code canonique) : ${plan.matchedByName.length}`,
    `- Offres absentes du catalogue : ${plan.unmatched.length}${plan.unmatched.length ? ' (' + plan.unmatched.join(', ') + ')' : ''}`,
    `- Offres laissées telles quelles : ${plan.skipped.length}${plan.skipped.length ? ' (' + plan.skipped.map(s => s.code + ' : ' + s.reason).join(' ; ') + ')' : ''}`, ''];
  if (extra.applique) lines.push(`Application : ${extra.templatesCreated} modèles créés, ${extra.linksCreated} liens créés ; sauvegarde avant écriture : \`${extra.sauvegardeAvant}\`.`, '');
  lines.push('## Services récurrents (aucun modèle de projet)', '', plan.recurring.join(', '), '', '## Modèles', '');
  for (const t of plan.templates) {
    lines.push(`### ${t.name} (${t.nature === 'base' ? 'base' : 'complément'})`, '', `Offres : ${t.offers.join(', ')}${t.existingVersionId ? ' ; modèle déjà présent, réutilisé' : ''}`, '');
    for (const lot of ['Démarrage', 'Réalisation', 'Corrections et validation', 'Livraison']) {
      const tasks = t.tasks.filter(task => task.lot === lot); if (!tasks.length) continue;
      lines.push(`- **${lot}**`); for (const task of tasks) lines.push(`  - ${task.name}`);
    }
    const proposed = t.tasks.some(task => task.description.includes('Proposé, à valider'));
    lines.push('', proposed ? '_Étapes proposées, à valider._' : '_Étapes issues du Manuel métier (complétées si indiqué)._', '');
  }
  return lines.join('\n');
}

(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const plan = S.planReferentialTemplates(db, offers);
    const resume = {modelesACreer: plan.templates.filter(t => !t.existingVersionId).length, liens: plan.links.length, recurrents: plan.recurring.length,
      retrouvesParNom: plan.matchedByName.length, absents: plan.unmatched, laisses: plan.skipped, planSha256: plan.planSha256};
    if (!apply) { if (reportFile) fs.writeFileSync(reportFile, report(plan, {})); console.log(JSON.stringify({apercu: true, ...resume}, null, 1)); return; }
    if (apply !== plan.planSha256) throw Error('Empreinte différente de l’aperçu : relancer l’aperçu.');
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-modeles-referentiel-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    const projects = new S.ProjectService(db, S.createWorkspacePaths(path.join(tmp, 'ws')));
    const done = S.applyReferentialTemplates(db, projects, offers, apply);
    const integrity = db.all('PRAGMA integrity_check'), fk = db.all('PRAGMA foreign_key_check');
    if (integrity[0].integrity_check !== 'ok' || fk.length) throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'modeles-projet-referentiel', le: new Date().toISOString(), sauvegardeAvant: backup, ...done, planSha256: apply}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    if (reportFile) fs.writeFileSync(reportFile, report(plan, {applique: true, sauvegardeAvant: backup, ...done}));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, ...done}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
