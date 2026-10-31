import type { Migration } from './migrations';

// Preserve the originals and the decision for every legacy value. Existing active
// or archived methods always take precedence; migration never revives a method.
const coordinates = (['organization','contact'] as const).flatMap(owner=>
  (['email','phone'] as const).map(type=>{
    const table=owner==='organization'?'organizations':'contacts';
    const normalized=type==='email'?`lower(trim(${type}))`:`replace(replace(replace(replace(replace(trim(${type}),' ',''),'.',''),'-',''),'(',''),')','')`;
    const valid=type==='email'?`normalized_value LIKE '%_@_%.__%' AND length(normalized_value)-length(replace(normalized_value,'@',''))=1 AND normalized_value NOT GLOB '*[ \t\n]*'`:`((substr(normalized_value,1,1)='+' AND length(normalized_value) BETWEEN 9 AND 16) OR (substr(normalized_value,1,1)='0' AND length(normalized_value)=10)) AND replace(normalized_value,'+','') NOT GLOB '*[^0-9]*' AND (instr(normalized_value,'+')=0 OR (substr(normalized_value,1,1)='+' AND instr(substr(normalized_value,2),'+')=0))`;
    return `
      INSERT INTO crm_reconciliation(id,owner_type,owner_id,field,legacy_value,normalized_value,disposition,methods_json,created_at)
      SELECT 'legacy-${owner}-${type}-'||id,'${owner}',id,'${type}',${type},${normalized},'review','[]',strftime('%Y-%m-%dT%H:%M:%fZ','now')
      FROM ${table} WHERE nullif(trim(${type}),'') IS NOT NULL;
      UPDATE crm_reconciliation SET methods_json=coalesce((SELECT json_group_array(json_object('id',cm.id,'value',cm.value,'archivedAt',cm.archived_at)) FROM contact_methods cm WHERE cm.${owner}_id=owner_id AND cm.method_type='${type}'),'[]'),
        disposition=CASE
          WHEN EXISTS(SELECT 1 FROM contact_methods cm WHERE cm.${owner}_id=owner_id AND cm.method_type='${type}' AND cm.archived_at IS NOT NULL AND lower(trim(cm.value))=normalized_value) THEN 'archived'
          WHEN EXISTS(SELECT 1 FROM contact_methods cm WHERE cm.${owner}_id=owner_id AND cm.method_type='${type}' AND cm.archived_at IS NULL AND lower(trim(cm.value))=normalized_value) THEN 'already_shared'
          WHEN EXISTS(SELECT 1 FROM contact_methods cm WHERE cm.${owner}_id=owner_id AND cm.method_type='${type}') THEN 'conflict'
          WHEN ${valid} THEN 'imported' ELSE 'invalid' END
      WHERE owner_type='${owner}' AND field='${type}';
      INSERT INTO contact_methods(id,${owner}_id,method_type,value,label,is_primary,notes,created_at,updated_at)
      SELECT id,owner_id,field,normalized_value,'Reprise historique',1,'Provenance : crm_reconciliation/'||id,created_at,created_at
      FROM crm_reconciliation WHERE owner_type='${owner}' AND field='${type}' AND disposition='imported';
    `;
  })).join('\n');

export const CRM_RECONCILIATION_MIGRATION:Migration={id:72,name:'crm_single_source_reconciliation',sql:`
  CREATE TABLE crm_reconciliation(
    id TEXT PRIMARY KEY,owner_type TEXT NOT NULL,owner_id TEXT NOT NULL,field TEXT NOT NULL,
    legacy_value TEXT NOT NULL,normalized_value TEXT,disposition TEXT NOT NULL,methods_json TEXT NOT NULL,created_at TEXT NOT NULL,
    UNIQUE(owner_type,owner_id,field)
  ) STRICT;
  ${coordinates}
  INSERT INTO crm_reconciliation
  SELECT 'legacy-client-action-'||ca.id,'client',ca.id,'next_action',json_object('at',ca.next_action_at,'text',ca.next_action_text),NULL,
    CASE WHEN EXISTS(SELECT 1 FROM crm_actions a WHERE a.client_account_id=ca.id) THEN 'review_existing_actions'
      WHEN ca.archived_at IS NULL AND ca.status<>'archived' AND julianday(ca.next_action_at)>julianday('now') AND nullif(trim(ca.next_action_text),'') IS NOT NULL THEN 'imported'
      ELSE 'review_past_or_incomplete' END,'[]',strftime('%Y-%m-%dT%H:%M:%fZ','now')
  FROM client_accounts ca WHERE ca.next_action_at IS NOT NULL OR ca.next_action_text IS NOT NULL;
  INSERT INTO crm_actions(id,owner_type,client_account_id,action_type,title,due_at,notes,status,created_at,updated_at)
  SELECT r.id,'client',ca.id,'action',ca.next_action_text,ca.next_action_at,'Reprise historique : crm_reconciliation/'||r.id,'open',r.created_at,r.created_at
  FROM crm_reconciliation r JOIN client_accounts ca ON ca.id=r.owner_id WHERE r.owner_type='client' AND r.disposition='imported';
`};
