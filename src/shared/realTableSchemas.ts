import {PROSPECT_DIRECTORY_COLUMNS,PROSPECT_DIRECTORY_VIEW} from './prospectTablePresentation';
import type {TableColumnSchema} from './tableViewPreference';
export const CATALOG_ADMIN_VIEW='catalog-administration';
export const QUOTE_LIST_VIEW='quotes-list';
export const CLIENT_DIRECTORY_VIEW='clients-directory';
export const DIRECTORY_ORGANIZATIONS_VIEW='directory-organizations';
export const DIRECTORY_CONTACTS_VIEW='directory-contacts';
/** Explicit presentation domains; no arbitrary renderer key or business field. */
export const REAL_TABLE_SCHEMAS:Readonly<Record<string,TableColumnSchema>>={
 'time-sessions':[{id:'identity',required:true},{id:'context'},{id:'category'},{id:'duration'},{id:'billable'},{id:'source'},{id:'actions',required:true}],
 'billing-list':[{id:'identity',required:true},{id:'source'},{id:'description'},{id:'project'},{id:'amount'},{id:'status'},{id:'invoice'},{id:'open',required:true}],
 'expenses-list':[{id:'date'},{id:'identity',required:true},{id:'category'},{id:'context'},{id:'amount'},{id:'status'},{id:'receipt'},{id:'open',required:true}],
 'documents-list':[{id:'identity',required:true},{id:'client'},{id:'category'},{id:'file'},{id:'updated'},{id:'status'},{id:'open',required:true}],
 'projects-list':[{id:'identity',required:true},{id:'client'},{id:'name'},{id:'commercial'},{id:'status'},{id:'progress'},{id:'estimated'},{id:'target'},{id:'open',required:true}],
 'requests-list':[{id:'received'},{id:'client'},{id:'identity',required:true},{id:'priority'},{id:'status'},{id:'open',required:true}],
 'interventions-list':[{id:'identity',required:true},{id:'client'},{id:'subject'},{id:'coverage'},{id:'time'},{id:'status'},{id:'open',required:true}],

 [PROSPECT_DIRECTORY_VIEW]:PROSPECT_DIRECTORY_COLUMNS,
 [CATALOG_ADMIN_VIEW]:[{id:'category'},{id:'identity',required:true},{id:'type'},{id:'price'},{id:'recommendedPrice'},{id:'priceMode'},{id:'status'},{id:'public'},{id:'version'},{id:'open',required:true}],
 [QUOTE_LIST_VIEW]:[{id:'identity',required:true},{id:'owner'},{id:'subject'},{id:'status'},{id:'amount'},{id:'decision',required:true},{id:'created'},{id:'open',required:true}],
 [CLIENT_DIRECTORY_VIEW]:[{id:'identity',required:true},{id:'status'},{id:'contact'},{id:'coordinates'},{id:'nextAction'},{id:'open',required:true}],
 [DIRECTORY_ORGANIZATIONS_VIEW]:[{id:'identity',required:true},{id:'industry'},{id:'city'},{id:'coordinates'},{id:'contacts'},{id:'relation'},{id:'open',required:true}],
 [DIRECTORY_CONTACTS_VIEW]:[{id:'identity',required:true},{id:'organization'},{id:'jobTitle'},{id:'coordinates'},{id:'relation'},{id:'open',required:true}],
};
