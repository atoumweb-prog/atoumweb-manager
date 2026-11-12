'use strict';
// Scinde deux clauses du socle devenues trop denses, SANS changer aucune règle (les paragraphes sont déplacés tels quels) :
//   BASE-PAIEMENT    -> « Modalités générales de paiement » (reste)   + « Impayés et relances » (BASE-RETARDS-PAIEMENT, nouvelle)
//   BASE-COOPERATION -> « Obligations et coopération du client » (reste) + « Blocage du projet et fin du contrat » (BASE-BLOCAGE-PROJET, nouvelle)
// Les quatre renvois « procédure de relance » pointent désormais vers la clause qui décrit réellement cette procédure.
// À lancer APRÈS validate-v1 et update-clause-texts (il s'appuie sur leurs textes). Rejouable : sans effet si le découpage existe déjà.
//   Aperçu :      node scripts/preproduction/split-base-clauses.cjs --dest <préproduction>
//   Application : node scripts/preproduction/split-base-clauses.cjs --dest <préproduction> --apply
// Sauvegarde la base avant écriture ; refuse si le Manager de cette préproduction est ouvert.
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
const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-split-')), 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/database/NodeSqliteAdapter', 'src/main/commercial/ContractTermsService'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);

const OLD_REF = '« Obligations et coopération du client »', NEW_REF = '« Blocage du projet et fin du contrat »';
const REF_CLAUSES = ['APP-RECETTE', 'BASE-VALIDATION', 'DEVWP-RECETTE', 'WEB-VALIDATION'];
const NEW = {
  pay: {code: 'BASE-RETARDS-PAIEMENT', title: 'Impayés et relances', after: 'BASE-PAIEMENT', sort: 195},
  block: {code: 'BASE-BLOCAGE-PROJET', title: 'Blocage du projet et fin du contrat', after: 'BASE-COOPERATION', sort: 145},
};
const paras = body => body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
const expect = (list, starts, label) => {
  if (list.length !== starts.length) throw Error(`${label} : ${list.length} paragraphes trouvés, ${starts.length} attendus.`);
  starts.forEach((s, i) => { if (!list[i].startsWith(s)) throw Error(`${label} : le paragraphe ${i + 1} ne commence pas par « ${s} ».`); });
};

(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const current = code => db.get("SELECT t.id tid, v.id vid, v.body body FROM contract_clause_templates t JOIN contract_clause_versions v ON v.id=t.current_version_id WHERE t.code=? COLLATE NOCASE AND v.status='published'", [code]);
    const done = db.get('SELECT id,title FROM contract_clause_templates WHERE code=? COLLATE NOCASE', [NEW.pay.code]);
    if (done) {
      // Découpage déjà fait : seulement aligner le titre (il portait un nom proche de « Retard de paiement » des clients professionnels).
      const stale = done.title !== NEW.pay.title;
      if (stale && apply) { db.run('UPDATE contract_clause_templates SET title=? WHERE code=? COLLATE NOCASE', [NEW.pay.title, NEW.pay.code]); db.run('UPDATE contract_clause_versions SET title=? WHERE clause_id=?', [NEW.pay.title, done.id]); }
      console.log(JSON.stringify({dejaFait: true, titreAligne: stale && apply})); return;
    }
    const pay = current('BASE-PAIEMENT'), coop = current('BASE-COOPERATION');
    if (!pay || !coop) throw Error('BASE-PAIEMENT ou BASE-COOPERATION introuvable.');
    const P = paras(pay.body), C = paras(coop.body);
    expect(P, ['Le prix, les échéances', 'Si un acompte', 'En cas d’impayé, nous', 'Nous ne retenons pas', 'Sous réserve des règles impératives', 'Le prélèvement SEPA', 'Pour les abonnements mensuels', 'Si un abonnement reste impayé', 'Pour une prestation ponctuelle'], 'BASE-PAIEMENT');
    expect(C, ['Pour avancer dans votre projet', 'Si l’absence d’un élément', 'Si le blocage imputable', 'En l’absence de régularisation', 'La restitution et le sort', 'Pour les maquettes'], 'BASE-COOPERATION');
    const mockup = C[5].replace('la procédure de blocage de 60 puis 15 jours demeure distincte.', `la procédure de blocage de 60 puis 15 jours, décrite à la clause ${NEW_REF}, demeure distincte.`);
    if (mockup === C[5]) throw Error('BASE-COOPERATION : phrase sur la procédure de blocage introuvable.');
    const plan = {
      'BASE-PAIEMENT': [P[0], P[1], P[4], P[5], P[6]].join('\n\n'),
      [NEW.pay.code]: [P[2], P[7], P[8], P[3]].join('\n\n'),
      'BASE-COOPERATION': [C[0], C[1], mockup].join('\n\n'),
      [NEW.block.code]: [C[2], C[3], C[4]].join('\n\n'),
    };
    const refs = REF_CLAUSES.map(code => { const c = current(code); if (!c) throw Error(code + ' introuvable.'); if (!c.body.includes(OLD_REF)) throw Error(`${code} : renvoi ${OLD_REF} introuvable.`); return {code, vid: c.vid, body: c.body.split(OLD_REF).join(NEW_REF)}; });
    // aucune règle perdue : chaque paragraphe d'origine se retrouve exactement une fois
    const before = [...P, ...C].sort(), after = Object.values(plan).flatMap(paras).sort();
    const changed = (a, b) => a.filter(x => !b.includes(x));
    const lost = changed(before, after), added = changed(after, before);
    if (lost.length !== 1 || added.length !== 1 || !lost[0].startsWith('Pour les maquettes')) throw Error('Contrôle de conservation des paragraphes : écart inattendu.');
    const report = Object.fromEntries(Object.entries(plan).map(([k, v]) => [k, paras(v).length + ' paragraphes']));
    if (!apply) { console.log(JSON.stringify({apercu: true, clauses: report, renvoisModifies: refs.map(r => r.code)}, null, 1)); return; }
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-decoupage-clauses-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    const terms = new S.ContractTermsService(db);
    db.run('UPDATE contract_clause_versions SET body=? WHERE id=?', [plan['BASE-PAIEMENT'], pay.vid]);
    db.run('UPDATE contract_clause_versions SET body=? WHERE id=?', [plan['BASE-COOPERATION'], coop.vid]);
    for (const n of [NEW.pay, NEW.block]) {
      const t = terms.createTemplate({code: n.code, title: n.title, scope: 'base', audience: 'all'}, {body: plan[n.code], title: n.title, code: n.code, audience: 'all'});
      const vid = db.get('SELECT id FROM contract_clause_versions WHERE clause_id=? ORDER BY version_number DESC LIMIT 1', [t.id]).id;
      terms.publishVersion(vid);
      db.run('UPDATE contract_clause_templates SET sort_order=? WHERE id=?', [n.sort, t.id]);
    }
    for (const r of refs) db.run('UPDATE contract_clause_versions SET body=? WHERE id=?', [r.body, r.vid]);
    const integrity = db.all('PRAGMA integrity_check'), fk = db.all('PRAGMA foreign_key_check');
    if (integrity[0].integrity_check !== 'ok' || fk.length) throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'decoupage-clauses-base', le: new Date().toISOString(), sauvegardeAvant: backup, clausesCreees: [NEW.pay.code, NEW.block.code], renvoisModifies: refs.map(r => r.code)}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, clauses: report, renvoisModifies: refs.map(r => r.code)}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
