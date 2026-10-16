import { createHash } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';

export const contractHash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export interface PreparedContract extends Record<string, unknown> {
  id:string; quote_id:string; text_snapshot:string; snapshot_json:string; content_hash:string; source_hash:string; prepared_at:string;
}
export function activePreparation(db:DatabaseAdapter,quoteId:string):PreparedContract|undefined {
  if(!db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='quote_contract_preparations'"))return undefined;
  return db.get<PreparedContract>('SELECT p.* FROM quote_contract_preparations p JOIN quotes q ON q.contract_preparation_id=p.id AND q.id=p.quote_id WHERE q.id=?',[quoteId]);
}

/** Only local contractual inputs. Publishing a new library version cannot invalidate a pinned preparation. */
export function contractSourceHash(db:DatabaseAdapter,id:string):string {
  const quote=db.get<Record<string,unknown>>('SELECT * FROM quotes WHERE id=?',[id]);
  if(!quote)throw Error('Devis introuvable.');
  const ignored=new Set(['status','finalized_at','updated_at','contract_preparation_id','contract_text_snapshot','contract_snapshot_json','contract_compiled_at','sent_at','viewed_at','accepted_at','refused_at','expired_at','snapshot_locked_at','project_ready_at','contract_document_id','contract_document_attached_at','abby_reference','last_extended_at']);
  return contractHash({quote:Object.fromEntries(Object.entries(quote).filter(([key])=>!ignored.has(key))),
    lines:db.all('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY id',[id]),
    clauses:db.all('SELECT * FROM quote_contract_clauses WHERE quote_id=? ORDER BY id',[id]),
    parameters:db.all('SELECT p.* FROM quote_line_parameters p JOIN quote_lines l ON l.id=p.line_id WHERE l.quote_id=? ORDER BY p.line_id',[id]),
    options:db.all('SELECT p.* FROM quote_option_purchases p JOIN quote_lines l ON l.id=p.line_id WHERE l.quote_id=? ORDER BY p.line_id',[id]),
  });
}

export function assertPreparedContent(prepared:PreparedContract):void {
  if(contractHash([prepared.text_snapshot,prepared.snapshot_json])!==prepared.content_hash)throw Error('Intégrité de la préparation contractuelle invalide.');
}
