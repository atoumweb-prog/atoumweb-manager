'use strict';
// Applique une correction de texte à un corps de clause (paragraphes séparés par une ligne vide).
//   {code, de, vers}                        remplace une phrase exacte (doit apparaître une seule fois)
//   {code, paragrapheCommencePar, vers}     remplace le paragraphe qui commence par ce texte ('' le supprime)
// Retourne {body, applied}. applied=false si la correction est déjà en place. Lève une erreur si la cible est introuvable ou ambiguë.
function applyFix(body, fix) {
  if (fix.paragrapheCommencePar !== undefined) {
    const parts = body.split(/\n\s*\n/);
    const hits = parts.map((p, i) => p.startsWith(fix.paragrapheCommencePar) ? i : -1).filter(i => i >= 0);
    if (hits.length === 1) {
      if (fix.vers === '') parts.splice(hits[0], 1); else parts[hits[0]] = fix.vers;
      return {body: parts.join('\n\n'), applied: true};
    }
    if (hits.length === 0 && fix.vers && body.includes(fix.vers)) return {body, applied: false};
    if (hits.length === 0 && fix.vers === '') return {body, applied: false};
    throw Error('Paragraphe introuvable ou ambigu : ' + fix.paragrapheCommencePar.slice(0, 50));
  }
  const n = body.split(fix.de).length - 1;
  if (n === 1) return {body: body.replace(fix.de, () => fix.vers), applied: true};
  if (n === 0 && body.includes(fix.vers)) return {body, applied: false};
  throw Error('Correction introuvable ou ambiguë : ' + fix.de.slice(0, 50));
}
module.exports = {applyFix};
