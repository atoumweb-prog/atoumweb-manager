const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=require(path.join(root,'docs/ux-v2/bibliotheque-humaine-118-20261025/PROPOSITIONS.json'));
const blockers={
  'CONS-MEDIATION':'Confirmer l’adhésion CM2C effective et le champ couvert.',
  'MAINT-SAUVEGARDE':'Confirmer le périmètre réel de restauration et la responsabilité de l’hébergeur.',
  'MAINT-RENOUVELLEMENT':'Confirmer le parcours opérationnel de fin et de renouvellement.',
  'MAINT-INTERVENTIONS':'Valider définitivement la formulation de non-cumul et non-report.',
  'TECH-HEBERGEMENT':'Décider les modalités de remise de l’accès cPanel propre à la Lune.',
};
const quote=value=>'"'+String(value??'').replaceAll('"','""').replaceAll(/\r?\n/g,' ')+'"';
const header=['code','titre','famille','vigilance','proposition_redactionnelle','controle_technique','decision_humaine','blocage_reel_documente'];
const rows=source.clauses.map(c=>[c.code,c.proposedTitle||c.origin.title,c.family,c.risk,'examinée et préparée pour brouillon','origine, intégrité et assemblages contrôlés',c.approval||c.humanDecision||'à enregistrer dans le Manager',blockers[c.code]||'']);
const output=[header,...rows].map(row=>row.map(quote).join(',')).join('\n')+'\n';
fs.writeFileSync(path.join(root,'docs/ux-v2/SUIVI-FINAL-118-CLAUSES-2026-10-31.csv'),output,'utf8');
console.log(`Suivi écrit : ${rows.length} clauses.`);
