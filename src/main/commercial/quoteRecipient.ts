import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import type {QuoteRecipient} from '../../shared/commercial';

/** CRM is the master; the returned value is frozen only when the quote is prepared. */
export function quoteRecipient(db:DatabaseAdapter,id:string):QuoteRecipient|null {
  const q=db.get<{prospect_id:string|null;client_account_id:string|null;contract_audience:string|null}>('SELECT prospect_id,client_account_id,contract_audience FROM quotes WHERE id=?',[id]);
  if(!q)return null;
  const owner=q.client_account_id?db.get<{organization_id:string|null;contact_id:string|null}>('SELECT organization_id,primary_contact_id AS contact_id FROM client_accounts WHERE id=?',[q.client_account_id]):db.get<{organization_id:string|null;contact_id:string|null}>('SELECT organization_id,contact_id FROM prospects WHERE id=?',[q.prospect_id]);
  if(!owner)return null;
  const c=owner.contact_id?db.get<Record<string,unknown>>('SELECT * FROM contacts WHERE id=?',[owner.contact_id]):null;
  const o=owner.organization_id&&q.contract_audience!=='consumer'?db.get<Record<string,unknown>>('SELECT * FROM organizations WHERE id=?',[owner.organization_id]):null;
  const party=o??c;if(!party)return null;
  const name=o?String(o.legal_name||o.name):[c?.first_name,c?.last_name].filter(Boolean).join(' ');
  const method=(type:string,kind:'organization'|'contact',entity:string|null)=>entity?db.get<{value:string}>(`SELECT value FROM contact_methods WHERE ${kind}_id=? AND method_type=? AND archived_at IS NULL ORDER BY is_primary DESC,created_at LIMIT 1`,[entity,type])?.value??null:null;
  return {kind:o?'organization':'person',organizationId:o?owner.organization_id:null,contactId:owner.contact_id,name,
    addressLine1:party.address_line1 as string|null,addressLine2:party.address_line2 as string|null,postalCode:party.postal_code as string|null,city:party.city as string|null,country:party.country as string|null,
    identification:o?.siret?`SIRET : ${o.siret}`:null,
    contactName:o&&c?[c.first_name,c.last_name].filter(Boolean).join(' '):null,
    email:method('email',o?'organization':'contact',o?owner.organization_id:owner.contact_id),phone:method('phone',o?'organization':'contact',o?owner.organization_id:owner.contact_id),
    contactEmail:o?method('email','contact',owner.contact_id):null,contactPhone:o?method('phone','contact',owner.contact_id):null};
}
