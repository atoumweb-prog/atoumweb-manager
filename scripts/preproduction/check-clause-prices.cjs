'use strict';
// Garde-fou : vérifie que chaque montant en euros écrit dans une clause publiée correspond au catalogue.
// Source unique des prix = catalogue ; seuls les montants listés ci-dessous peuvent figurer dans une clause.
//   node scripts/preproduction/check-clause-prices.cjs --dest <préproduction>
// Lecture seule (travaille sur une copie de la base). Code de sortie 1 si un écart ou un montant non rattaché est trouvé.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 16 * 1024 * 1024});
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(r.status ?? 1);
}
// Prix de catalogue volontairement écrits dans une clause : code de clause -> {montant: code d'offre dont le prix doit être identique}
const PRIX_LIES = {'MARIAGE-DUREE': {59: 'AW-MARIAGE-RENOUV'}};
// Montants qui ne sont pas des prix de catalogue : règle de paiement (seuil) ou montant fixé par la loi
const MONTANTS_AUTORISES = {'BASE-PAIEMENT': [300], 'PRO-RETARD': [40]};

const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const dest = arg('--dest');
if (!dest) { console.error('Usage : --dest <préproduction>'); process.exit(2); }
const dbSrc = path.join(path.resolve(dest), 'Workspace', 'data', 'atoumweb-manager.sqlite');
if (!fs.existsSync(dbSrc)) { console.error('Base introuvable.'); process.exit(2); }
const repo = path.resolve(__dirname, '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-prix-'));
const dbFile = path.join(tmp, 'copie.sqlite'); fs.copyFileSync(dbSrc, dbFile);
for (const ext of ['-wal', '-shm']) if (fs.existsSync(dbSrc + ext)) fs.copyFileSync(dbSrc + ext, dbFile + ext);
const bundle = path.join(tmp, 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/commercial/ApprovedPackSource', 'src/main/database/NodeSqliteAdapter'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
const db = new S.NodeSqliteAdapter(dbFile);
try {
  const prix = new Map(db.all("SELECT json_extract(provenance_json,'$.recordKey') code, price_cents c FROM catalog_versions WHERE status='published' AND json_extract(provenance_json,'$.sha256')=?", [S.APPROVED_PACK.catalogue.sha256_word]).map(r => [r.code, r.c == null ? null : r.c / 100]));
  const clauses = db.all("SELECT t.code, v.body FROM contract_clause_templates t JOIN contract_clause_versions v ON v.id=t.current_version_id WHERE v.status='published' ORDER BY t.code");
  const erreurs = [], ok = [];
  for (const c of clauses) {
    for (const m of c.body.matchAll(/(\d[\d  ]*(?:,\d+)?)\s*€/g)) {
      const montant = Number(m[1].replace(/[\s ]/g, '').replace(',', '.'));
      const lie = PRIX_LIES[c.code]?.[montant];
      if (lie) { if (prix.get(lie) === montant) ok.push(`${c.code} : ${montant} € = prix de ${lie}`); else erreurs.push(`${c.code} : ${montant} € dans la clause, mais ${lie} vaut ${prix.get(lie)} € au catalogue`); continue; }
      if ((MONTANTS_AUTORISES[c.code] ?? []).includes(montant)) { ok.push(`${c.code} : ${montant} € (montant autorisé)`); continue; }
      erreurs.push(`${c.code} : ${montant} € n'est rattaché à aucun prix du catalogue (retirer le prix ou le déclarer dans PRIX_LIES)`);
    }
  }
  console.log(JSON.stringify({clauses: clauses.length, montantsControles: ok.length, ok, erreurs}, null, 1));
  process.exitCode = erreurs.length ? 1 : 0;
} finally { db.close(); }
