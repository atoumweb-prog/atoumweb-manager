import { createHash, randomUUID } from 'node:crypto';

/**
 * Pure review boundary for a future DOCX adapter. This module DOES NOT parse
 * Word files, modify contract data, or certify document formatting.
 */
export interface ClauseDraftSource {
  kind: 'contract_clause';
  clauseId: string;
  versionId: string;
  status: 'draft' | 'published' | 'retired' | 'frozen' | 'historical_missing';
  body: string;
}
export interface WordDraftManifest {
  schema: 1;
  sourceKind: 'contract_clause_draft';
  clauseId: string;
  versionId: string;
  sourceSha256: string;
  exportId: string;
  createdAt: string;
  textFormat: 'paragraphs-v1';
}
export interface ParagraphDiff {
  kind: 'unchanged' | 'added' | 'removed';
  text: string;
  beforeIndex: number | null;
  afterIndex: number | null;
}
export interface WordDraftReview {
  changed: boolean;
  paragraphs: ParagraphDiff[];
  warnings: string[];
}

const MAX_CHARS = 250_000;
const MAX_PARAGRAPHS = 300;
const hash = (source: ClauseDraftSource) =>
  createHash('sha256').update(JSON.stringify([
    source.kind, source.clauseId, source.versionId, source.body,
  ])).digest('hex');

function requireEditable(source: ClauseDraftSource): void {
  if (source.kind !== 'contract_clause' || !source.clauseId?.trim() || !source.versionId?.trim())
    throw new Error('La source contractuelle exacte est obligatoire pour un export Word.');
  if (source.status !== 'draft')
    throw new Error('Seule une version brouillon peut être soumise à une révision Word. Les textes publiés et preuves gelées restent intacts.');
  if (typeof source.body !== 'string' || source.body.length > MAX_CHARS)
    throw new Error('Texte de brouillon invalide ou trop volumineux pour la comparaison.');
}

export function prepareWordDraftManifest(source: ClauseDraftSource): WordDraftManifest {
  requireEditable(source);
  return {
    schema: 1,
    sourceKind: 'contract_clause_draft',
    clauseId: source.clauseId,
    versionId: source.versionId,
    sourceSha256: hash(source),
    exportId: randomUUID(),
    createdAt: new Date().toISOString(),
    textFormat: 'paragraphs-v1',
  };
}

function paragraphs(text: string): string[] {
  if (typeof text !== 'string' || text.length > MAX_CHARS)
    throw new Error('Texte Word extrait invalide ou trop volumineux.');
  const blocks = text.replace(/\r\n?/g, '\n').split('\n');
  if (blocks.length > MAX_PARAGRAPHS)
    throw new Error('Trop de paragraphes pour la comparaison sûre.');
  return blocks;
}

/**
 * Review-only, no DB writes. Must be invoked AFTER a separate, validated DOCX
 * parser has extracted the text; styling and OOXML structures are not covered.
 */
export function compareWordDraftText(
  manifest: WordDraftManifest,
  current: ClauseDraftSource,
  importedPlainText: string,
): WordDraftReview {
  requireEditable(current);
  if (manifest.schema !== 1 || manifest.sourceKind !== 'contract_clause_draft'
    || manifest.textFormat !== 'paragraphs-v1'
    || manifest.clauseId !== current.clauseId || manifest.versionId !== current.versionId
    || manifest.sourceSha256 !== hash(current))
    throw new Error('Conflit de version : le brouillon a changé depuis l’export. Aucun écrasement automatique autorisé.');
  const oldBlocks = paragraphs(current.body);
  const newBlocks = paragraphs(importedPlainText);
  const n = oldBlocks.length, m = newBlocks.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = oldBlocks[i] === newBlocks[j] ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const result: ParagraphDiff[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && oldBlocks[i] === newBlocks[j]) {
      result.push({ kind: 'unchanged', text: oldBlocks[i], beforeIndex: i++, afterIndex: j++ });
    } else if (j < m && (i === n || lcs[i][j + 1] >= lcs[i + 1][j])) {
      result.push({ kind: 'added', text: newBlocks[j], beforeIndex: null, afterIndex: j++ });
    } else {
      result.push({ kind: 'removed', text: oldBlocks[i], beforeIndex: i++, afterIndex: null });
    }
  }
  return {
    changed: result.some(row => row.kind !== 'unchanged'),
    paragraphs: result,
    warnings: [
      'Comparaison de texte brut uniquement : styles, listes automatiques, tableaux, champs Word et images non validés.',
      'Aucune clause, version contractuelle ou preuve officielle n’a été modifiée.',
    ],
  };
}
