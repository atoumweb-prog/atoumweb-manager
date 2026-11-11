'use strict';
// Validation « version 1 » du pack V3.9.4 (décision de Carlos du 11/11/2026) dans une PRÉPRODUCTION de test :
//   - publie les 130 références du catalogue (y compris les 12 restreintes, par arbitrage du gérant) ;
//   - publie les 119 clauses ; la clause 033 (médiation) est nettoyée de son « À COMPLÉTER » ;
//   - enregistre les temps de référence proposés (temps-de-reference-v1.json).
// Aucun avis juridique : les réserves sont consignées à part (dossier de validation), pas dans les contrats.
//   Aperçu :      node scripts/preproduction/validate-v1.cjs --dest <préproduction>
//   Application : node scripts/preproduction/validate-v1.cjs --dest <préproduction> --apply
// Sauvegarde la base avant toute écriture ; refuse si le Manager de cette préproduction est ouvert.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 64 * 1024 * 1024});
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
  `Get-CimInstance Win32_Process -Filter "Name='electron.exe'" | Where-Object { $_.CommandLine -like '*${target.replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
if (apply && running !== '0') fail('La préproduction est ouverte : ferme-la avant.');

const repo = path.resolve(__dirname, '..', '..');
const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-v1-')), 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/commercial/CatalogService', 'src/main/commercial/ContractTermsService', 'src/main/commercial/ApprovedPackSource', 'src/main/database/NodeSqliteAdapter'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
const times = JSON.parse(fs.readFileSync(path.join(__dirname, 'temps-de-reference-v1.json'), 'utf8'));
const sales = {...JSON.parse(fs.readFileSync(path.join(__dirname, 'aide-a-la-vente-v1.json'), 'utf8')), ...JSON.parse(fs.readFileSync(path.join(__dirname, 'aide-a-la-vente-v1-detaillee-suite.json'), 'utf8')), ...JSON.parse(fs.readFileSync(path.join(__dirname, 'aide-a-la-vente-v1-detaillee.json'), 'utf8'))}; // la version détaillée (10 offres de départ, rédigée à la main) remplace la version générique
delete times['_lisez-moi'];

const OVERRIDES = JSON.parse(fs.readFileSync(path.join(__dirname, 'decisions-11-11-fiches.json'), 'utf8'));
const DELETE_CODES = ['AW-TECH-HEBERG-WP', 'AW-BRAND-IDENTITE', 'AW-BRAND-PRIORITE', 'AW-CONT-PRIORITE', 'AW-LP-URGENT']; // + 3 options « délai accéléré » (décision du 11/11) // doublons supprimés sans archivage : aucun site vendu (décision du 11/11)
const DEMOTE_CLAUSE = 'BASE-REFERENCES-AGENCE'; // clause 119 : proposée sur la fiche de livraison, pas dans chaque devis
const CGV_FIXES = JSON.parse(fs.readFileSync(path.join(__dirname, 'corrections-cgv-v1.json'), 'utf8')).corrections;
// Rattachement des offres aux clauses : cartographie proposée du 08/11 (docs/integration-v394-v15-20261108), 17 formules V39 rattachées par analogie.
const ALIASES = {'V39-NL-PONCT-SIMPLE': 'AW-WEB-NEWSLETTER', 'V39-NL-PONCT-COMPLETE': 'AW-WEB-NEWSLETTER', 'V39-NL-1-M': 'AW-WEB-NEWSLETTER', 'V39-NL-1-A': 'AW-WEB-NEWSLETTER', 'V39-NL-2-M': 'AW-WEB-NEWSLETTER', 'V39-NL-2-A': 'AW-WEB-NEWSLETTER',
  'V39-STAT-ESS-A': 'AW-DATA-SUIVI-M', 'V39-STAT-ESS-M': 'AW-DATA-SUIVI-M', 'V39-GBP-ESS-A': 'AW-SEO-GBP-M', 'V39-GBP-ESS-M': 'AW-SEO-GBP-M', 'V39-BRAND-DUO': 'AW-BRAND-LOGO', 'V39-BRAND-CHARTE': 'AW-BRAND-LOGO'};
const EXTRA_LINKS = {'AW-DATA-SUIVI-M': ['DATA-CONSENTEMENT'], 'AW-DATA-SUIVI-A': ['DATA-CONSENTEMENT'], 'V39-STAT-ESS-M': ['DATA-CONSENTEMENT'], 'V39-STAT-ESS-A': ['DATA-CONSENTEMENT'], 'V39-HOST-DOMAINE': ['TECH-HEBERGEMENT', 'WEB-HEBERGEMENT'], 'V39-HOST-LUNE': ['TECH-HEBERGEMENT', 'WEB-HEBERGEMENT']};
const NEW_CLAUSES = JSON.parse(fs.readFileSync(path.join(__dirname, 'nouvelles-clauses-v1.json'), 'utf8'));
const ARBITRAGE = 'VALIDE_ARBITRAGE_GERANT_11_11_2026';
const RESTRICTED = /^(A_VERIFIER|ANCIEN_|BASE_INTERNE)/;
const MEDIATION_CODE = 'CONS-MEDIATION';
const MEDIATION_SENTENCE = 'Le médiateur de la consommation retenu par AtoumWeb est le CM2C — Centre de la Médiation de la Consommation de Conciliateurs de Justice, 49 rue de Ponthieu, 75008 Paris ; site internet : https://www.cm2c.net/ ; saisine par e-mail : declarer-un-litige@cm2c.net ; téléphone : 01 89 47 00 14.';

(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const catalog = new S.CatalogService(db), terms = new S.ContractTermsService(db);
    const allOffers = db.all("SELECT v.id,v.item_id,v.status,json_extract(v.provenance_json,'$.recordKey') code,json_extract(v.commercial_parameters_json,'$.sourceStatus') ss FROM catalog_versions v WHERE json_extract(v.provenance_json,'$.sha256')=? AND v.status!='retired'", [S.APPROVED_PACK.catalogue.sha256_word]);
    const offers = allOffers.filter(o => !DELETE_CODES.includes(o.code));
    const clauses = db.all("SELECT v.id,v.status,v.body,COALESCE(v.code,t.code) code FROM contract_clause_versions v JOIN contract_clause_templates t ON t.id=v.clause_id WHERE json_extract(v.review_metadata_json,'$.provenance.sha256')=?", [S.APPROVED_PACK.library.sha256_word]);
    const unknownTimes = Object.keys(times).filter(c => !offers.some(o => o.code === c));
    const resume = {
      references: {total: offers.length, supprimees: DELETE_CODES, fichesPrecisees: Object.keys(OVERRIDES).length, aPublier: offers.filter(o => o.status === 'draft').length, restreintesArbitrees: offers.filter(o => o.status === 'draft' && RESTRICTED.test(o.ss ?? '')).map(o => o.code), avecTempsDeReference: offers.filter(o => times[o.code] != null).length},
      clauses: {total: clauses.length, aPublier: clauses.filter(c => c.status === 'draft').length, nettoyee: MEDIATION_CODE},
      tempsInconnus: unknownTimes,
      aideVente: {fichesCompletes: offers.filter(o=>sales[o.code]&&sales[o.code].clientNeed?.length>=20&&sales[o.code].benefits?.length>=20&&sales[o.code].qualificationQuestions?.split('\n').filter(Boolean).length>=2&&sales[o.code].commercialCautions?.length>=20).map(o=>o.code), sansAide: offers.filter(o=>!sales[o.code]).map(o=>o.code), champsInsuffisants: offers.filter(o=>sales[o.code]&&(!sales[o.code].clientNeed||sales[o.code].clientNeed.length<20||!sales[o.code].benefits||sales[o.code].benefits.length<20||sales[o.code].qualificationQuestions?.split('\n').filter(Boolean).length<2||!sales[o.code].commercialCautions||sales[o.code].commercialCautions.length<20)).map(o=>o.code), versionsFigeesNonModifiees: offers.filter(o=>o.status==='published').map(o=>o.code)},
    };
    if (!apply) { console.log(JSON.stringify({apercu: true, ...resume}, null, 1)); return; }
    if (unknownTimes.length) throw Error('Temps de référence pour des codes inconnus : ' + unknownTimes.join(', '));
    if(resume.aideVente.sansAide.length||resume.aideVente.champsInsuffisants.length)throw Error('Aide à la vente incomplète : consulter l’aperçu.');

    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-validation-v1-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);

    const errors = [], done = {references: 0, clauses: 0, temps: 0, supprimees: [], fiches: 0, corrections: 0, liens: 0, nouvellesClauses: 0, figeesMisesAJour: 0};
    // 0. Suppression des deux doublons (aucune vente : pas d'archivage).
    for (const c of DELETE_CODES) {
      const row = allOffers.find(o => o.code === c); if (!row) continue;
      try {
        db.exec('BEGIN IMMEDIATE;');
        db.run('DELETE FROM catalog_import_entries WHERE item_id=?', [row.item_id]);
        db.run('DELETE FROM catalog_commercial_rules WHERE catalog_version_id IN (SELECT id FROM catalog_versions WHERE item_id=?)', [row.item_id]);
        db.run('DELETE FROM catalog_category_audit WHERE item_id=?', [row.item_id]);
        db.run('DELETE FROM catalog_versions WHERE item_id=?', [row.item_id]);
        db.run('DELETE FROM catalog_items WHERE id=?', [row.item_id]);
        db.exec('COMMIT;'); done.supprimees.push(c);
      } catch (e) { db.exec('ROLLBACK;'); errors.push(`Suppression ${c} : ${e.message}`); }
    }
    // 1. Références : temps de référence + arbitrage du gérant, puis publication.
    for (const o of offers) {
      try {
        const minutes = times[o.code] ?? null;
        if (o.status === 'draft') {
          const v = catalog.getItem(o.item_id).versions.find(x => x.id === o.id);
          const input = {...v}; for (const k of ['id', 'itemId', 'versionNumber', 'status', 'publishedAt', 'createdAt', 'lastSavedAt', 'saveRevision', 'abandonedAt']) delete input[k];
          if (minutes != null) input.estimatedMinutes = minutes;
          if (OVERRIDES[o.code]) { Object.assign(input, OVERRIDES[o.code]); done.fiches++; }
          const {internalAdvice,...parameters}=sales[o.code];
          input.commercialParameters={...(input.commercialParameters??{}),...parameters};
          input.internalAdvice=internalAdvice;
          if (RESTRICTED.test(o.ss ?? '')) input.commercialParameters = {...(input.commercialParameters ?? {}), sourceStatusOrigine: o.ss, sourceStatus: ARBITRAGE};
          const saved = catalog.saveDraftVersion(o.id, v, input);
          catalog.publishVersion(o.id, saved); done.references++;
        }
        if (o.status === 'published') {
          const cur = db.get('SELECT commercial_parameters_json cp FROM catalog_versions WHERE id=?', [o.id]);
          let params = {}; try { params = JSON.parse(cur.cp ?? '{}') ?? {}; } catch { params = {}; }
          if (sales[o.code]) {
            const {internalAdvice, ...parameters} = sales[o.code];
            db.run('UPDATE catalog_versions SET commercial_parameters_json=?, internal_advice=? WHERE id=?', [JSON.stringify({...params, ...parameters}), internalAdvice ?? null, o.id]);
          }
          if (minutes != null) db.run('UPDATE catalog_versions SET estimated_minutes=? WHERE id=?', [minutes, o.id]);
          done.figeesMisesAJour++;
        }
        if (minutes != null) done.temps++;
      } catch (e) { errors.push(`${o.code} : ${e.message}`); }
    }
    // 2. Clauses : nettoyage de la 033, puis publication de toutes les versions brouillon.
    for (const c of clauses) {
      try {
        if (c.status === 'draft' && c.code.toUpperCase() === MEDIATION_CODE) {
          const body = c.body.replace(/À COMPLÉTER AVANT COMMERCIALISATION AUX CONSOMMATEURS[^\n]*/i, MEDIATION_SENTENCE);
          if (body === c.body || /À COMPLÉTER/i.test(body)) throw Error('Texte de la clause 033 inattendu : nettoyage impossible.');
          db.run('UPDATE contract_clause_versions SET body=? WHERE id=? AND status=\'draft\'', [body, c.id]);
        }
        let body = db.get('SELECT body FROM contract_clause_versions WHERE id=?', [c.id]).body, changed = false;
        for (const f of CGV_FIXES.filter(x => x.code.toUpperCase() === c.code.toUpperCase())) {
          if (body.split(f.de).length !== 2) throw Error(`Correction introuvable ou ambiguë : ${f.de.slice(0, 50)}`);
          body = body.replace(f.de, () => f.vers); changed = true; done.corrections++;
        }
        // Aucune vente : les clauses déjà publiées du pack sont corrigées sur place (pas d'ancienne version à conserver).
        if (changed) db.run('UPDATE contract_clause_versions SET body=? WHERE id=?', [body, c.id]);
        if (c.status === 'draft') { terms.publishVersion(c.id); done.clauses++; }
        if (c.code.toUpperCase() === DEMOTE_CLAUSE) db.run("UPDATE contract_clause_templates SET scope='catalog' WHERE code=? COLLATE NOCASE", [DEMOTE_CLAUSE]);
      } catch (e) { errors.push(`Clause ${c.code} : ${e.message}`); }
    }
    // 2b. Nouvelles clauses (glossaire, newsletters) : créées puis publiées par les services existants.
    for (const n of NEW_CLAUSES) {
      try {
        if (db.get('SELECT id FROM contract_clause_templates WHERE code=? COLLATE NOCASE', [n.code])) continue;
        const t = terms.createTemplate({code: n.code, title: n.title, scope: n.scope, audience: n.audience}, {body: n.body, title: n.title, code: n.code, audience: n.audience});
        const vid = db.get('SELECT id FROM contract_clause_versions WHERE clause_id=? ORDER BY version_number DESC LIMIT 1', [t.id]).id;
        terms.publishVersion(vid); done.nouvellesClauses++;
      } catch (e) { errors.push(`Nouvelle clause ${n.code} : ${e.message}`); }
    }
    // 3. Rattachement des offres à leurs clauses (en complétant l'existant, sans rien retirer).
    try {
      const csv = fs.readFileSync(path.join(repo, 'docs', 'integration-v394-v15-20261108', 'CARTOGRAPHIE-HISTORIQUE-PROPOSEE-409.csv'), 'utf8').replace(/^\ufeff/, '').split(/\r?\n/).slice(1).filter(Boolean).map(l => l.split(';'));
      const map = new Map(); for (const [offer, clause] of csv) { if (!map.has(offer)) map.set(offer, new Set()); map.get(offer).add(clause); }
      const wanted = new Map();
      for (const o of offers) { const set = new Set([...(map.get(o.code) ?? map.get(ALIASES[o.code]) ?? []), ...(EXTRA_LINKS[o.code] ?? [])]); set.delete(DEMOTE_CLAUSE); for (const n of NEW_CLAUSES) if ((n.offres ?? []).includes(o.code)) set.add(n.code); if (set.size) wanted.set(o, set); }
      const byOffer = new Map(); // inversion : clause -> offres
      for (const [o, set] of wanted) for (const code of set) { if (!byOffer.has(code)) byOffer.set(code, []); byOffer.get(code).push(o.item_id); }
      for (const [code, itemIds] of byOffer) {
        const t = db.get('SELECT id FROM contract_clause_templates WHERE code=? COLLATE NOCASE', [code]); if (!t) { errors.push(`Lien : clause ${code} introuvable.`); continue; }
        const existing = db.all('SELECT catalog_item_id FROM catalog_contract_clause_links WHERE clause_id=? ORDER BY sort_order', [t.id]).map(r => r.catalog_item_id);
        const all = [...new Set([...existing, ...itemIds])];
        if (all.length !== existing.length) { terms.setCatalogLinks(t.id, all); done.liens += all.length - existing.length; }
      }
    } catch (e) { errors.push('Rattachements : ' + e.message); }
    const integrity = db.all('PRAGMA integrity_check'), fk = db.all('PRAGMA foreign_key_check');
    if (integrity[0].integrity_check !== 'ok' || fk.length) throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'validation-v1', le: new Date().toISOString(), sauvegardeAvant: backup, ...done, erreurs: errors.length}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, ...done, erreurs: errors}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
