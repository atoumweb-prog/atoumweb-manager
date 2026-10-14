'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const report = JSON.parse(fs.readFileSync(path.join(root, 'docs/ux-v2/LOT-10E-RECETTE-102.json'), 'utf8'));
const expected = { A: 17, B: 17, C: 20, D: 18, E: 30 };
if (report.schemaVersion !== 1 || !Array.isArray(report.cases) || report.cases.length !== 102) throw Error('La matrice doit contenir 102 cas.');
const ids = new Set();
const counts = Object.fromEntries(Object.keys(expected).map(key => [key, 0]));
const statuses = { trace_automatisable: 0, couverture_partielle: 0, validation_humaine_ou_integration: 0 };
for (const entry of report.cases) {
  if (!/^R10[A-E]-\d{2}$/.test(entry.id) || ids.has(entry.id)) throw Error('ID invalide ou dupliqué : '+entry.id);
  if (entry.lot !== entry.id.slice(1, 4)) throw Error('Lot incohérent : '+entry.id);
  if (typeof entry.scenario !== 'string' || !entry.scenario.trim() || typeof entry.expected !== 'string' || !entry.expected.trim()) throw Error('Cas incomplet : '+entry.id);
  if (!Object.hasOwn(statuses, entry.status)) throw Error('Statut inconnu : '+entry.id);
  ids.add(entry.id);
  counts[entry.id[3]]++;
  statuses[entry.status]++;
  if (entry.status === 'trace_automatisable') {
    if (!entry.evidence || !/^(src|scripts)\//.test(entry.evidence)) throw Error('Trace de test requise : '+entry.id);
    if (!fs.existsSync(path.join(root, entry.evidence))) throw Error('Trace source introuvable : '+entry.id+' => '+entry.evidence);
  }
  if (entry.status !== 'trace_automatisable' && entry.evidence != null) throw Error('Certificat fictif : '+entry.id);
}
for (const [key, value] of Object.entries(expected)) if (counts[key] !== value) throw Error('Total du lot '+key+' : '+counts[key]+' au lieu de '+value);
process.stdout.write('LOT10_COVERAGE '+JSON.stringify({total:ids.size,byLot:counts,byStatus:statuses,note:'Traces identifiées ≠ 102 scénarios certifiés sur MSI'})+'\n');
