import {openReadOnlyWorkspaceSnapshot} from './WorkspaceSnapshotDatabase';
/**
 * EC04 read-only audit of selected, known SQLite -> physical file references.
 * Incomplete by design: unlisted columns, paths embedded in JSON histories,
 * external project roots and secrets still require separate verification.
 * No writes, fixes or migration. Never use this alone to certify a backup.
 */
import {isAbsolute as posixAbsolute, win32} from 'node:path';
import {checkedWorkspaceRelativePath, type WorkspaceFileInventory} from './WorkspaceFileInventory';

export type Ec04ReferenceProblem = 'missing-file' | 'external-path' | 'unsafe-path' | 'unexpected-root';
export interface Ec04ReferenceIssue {
  table: string;
  recordId: string;
  column: string;
  /** Source value, not a verified or automatically relocated path. */
  originalPath: string;
  problem: Ec04ReferenceProblem;
}
export interface Ec04ReferenceAudit {
  readonly checked: number;
  readonly matchingFiles: number;
  readonly issues: Ec04ReferenceIssue[];
  readonly skippedTables: string[];
  readonly coverageComplete: false;
}

const REFS: Array<{table:string;column:string;roots:readonly string[];key?:string;prefix?:string}> = [
  {table:'crm_identity_assets', column:'relative_path', roots:['crm-identites']},
  {table:'client_documents', column:'relative_path', roots:['clients']},
  {table:'quote_document_links', column:'relative_path', roots:['clients','projets-internes']},
  {table:'expenses', column:'receipt_relative_path', roots:['clients','depenses']},
  {table:'file_assets', column:'relative_path', roots:['clients','projets-internes','projets-previsionnels']},
  {table:'atoumweb_technical_assets', column:'relative_path', roots:['bibliotheque-atoumweb']},
  {table:'bridge_assets', column:'local_path', roots:['bridge']},
  {table:'bridge_snapshots', column:'package_relative_path', roots:['bridge'], prefix:'bridge'},
  {table:'bridge_objects', column:'relative_path', roots:['bridge'], prefix:'bridge', key:'object_ref'},
  {table:'bridge_occurrence_returns', column:'package_relative_path', roots:['bridge']},
  {table:'project_page_exports', column:'package_path', roots:['exports']},
];

/** Classify rather than follow/relocate paths, retaining warnings for user review. */
function classify(input: string): {relativePath?: string; problem?: Ec04ReferenceProblem} {
  if (posixAbsolute(input) || win32.isAbsolute(input) || /^[a-zA-Z]:/.test(input)) {
    return {problem:'external-path'};
  }
  const path = input.replaceAll('\\', '/');
  const parts = path.split('/');
  try { return {relativePath: checkedWorkspaceRelativePath(parts)}; }
  catch { return {problem:'unsafe-path'}; }
}

export function auditKnownWorkspaceFileReferences(databaseFile: string, inventory: WorkspaceFileInventory): Ec04ReferenceAudit {
  const db = openReadOnlyWorkspaceSnapshot(databaseFile);
  const paths = new Set(inventory.files.map(file => file.relativePath.normalize('NFC').toLowerCase()));
  const issues: Ec04ReferenceIssue[] = [];
  const skippedTables: string[] = [];
  let checked = 0, matchingFiles = 0;
  try {
    for (const {table,column,roots,key='id',prefix=''} of REFS) {
      const present = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
      if (!present) {skippedTables.push(table);continue;}
      const columns = new Set(db.prepare('PRAGMA table_info("'+table+'")').all().map(row => String(row.name)));
      if (!columns.has(key) || !columns.has(column)) {skippedTables.push(table);continue;}
      // Stream instead of materializing every asset row in memory.
      const rows = db.prepare('SELECT "'+key+'" AS id,"'+column+'" AS file_path FROM "'+table+'" WHERE "'+column+'" IS NOT NULL').iterate();
      for (const row of rows) {
        if (typeof row.file_path !== 'string' || !row.file_path.trim()) continue;
        checked++;
        const path = row.file_path;
        const classification = classify(path);
        let problem = classification.problem;
        if (!problem && classification.relativePath) {
          const normalized = prefix ? prefix+'/'+classification.relativePath : classification.relativePath;
          const first = normalized.split('/')[0];
          if (!roots.some(root => root === first)) problem = 'unexpected-root';
          else if (!paths.has(normalized.normalize('NFC').toLowerCase())) problem = 'missing-file';
        }
        if (problem) issues.push({table,column,recordId:String(row.id),originalPath:path,problem});
        else matchingFiles++;
      }
    }
  } finally {db.close();}
  return {checked,matchingFiles,issues,skippedTables,coverageComplete:false};
}
