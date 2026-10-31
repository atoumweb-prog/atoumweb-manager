import {QuoteContractPreparationService} from './QuoteContractPreparationService';
import type {ContractAdministration} from '../../shared/quoteContractPreparation';
import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import {defaultQuoteDocumentSettings,QUOTE_DOCUMENT_SETTINGS_KEY,type QuoteDocumentSettings} from '../../shared/quoteDocumentSettings';
import {draftFingerprint} from '../../shared/draftSection';
export class QuoteDocumentSettingsService {
 constructor(private db:DatabaseAdapter){}
 get():QuoteDocumentSettings{const r=this.db.get<{value_json:string}>('SELECT value_json FROM settings WHERE key=?',[QUOTE_DOCUMENT_SETTINGS_KEY]);return r?this.validate(JSON.parse(r.value_json)):defaultQuoteDocumentSettings();}
 saveAll(value:QuoteDocumentSettings,admin:ContractAdministration,expected:{value:QuoteDocumentSettings;admin:ContractAdministration}){this.db.exec('SAVEPOINT company_quote_settings;');try{const v=this.save(value,expected.value),a=new QuoteContractPreparationService(this.db).saveAdministration(admin,expected.admin);this.db.exec('RELEASE company_quote_settings;');return{value:v,admin:a};}catch(e){this.db.exec('ROLLBACK TO company_quote_settings; RELEASE company_quote_settings;');throw e;}}
 forQuote(id:string):QuoteDocumentSettings|undefined{const r=this.db.get<{value_json:string}>('SELECT value_json FROM settings WHERE key=?',['quote-document:'+id]);return r?this.validate(JSON.parse(r.value_json)):undefined;}
 adopt(id:string):QuoteDocumentSettings{const q=this.db.get<{status:string;finalized_at:string|null;contract_snapshot_json:string|null}>("SELECT status,finalized_at,contract_snapshot_json FROM quotes WHERE id=?",[id]);if(!q||q.status!=='draft'||q.finalized_at||q.contract_snapshot_json)throw Error('Le modèle de ce devis est figé.');const v=this.get();this.db.run('INSERT INTO settings(key,value_json,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at',['quote-document:'+id,JSON.stringify(v),new Date().toISOString()]);this.db.run('UPDATE quotes SET updated_at=? WHERE id=?',[new Date().toISOString(),id]);return v;}
 validate(input:QuoteDocumentSettings):QuoteDocumentSettings{
 const defaults=defaultQuoteDocumentSettings();if(!input||Object.keys(input).some(k=>!(k in defaults))||Object.keys(defaults).some(k=>!(k in input))||input.schemaVersion!==1)throw Error('Modèle de devis invalide.');
 for(const key of ['brandName','tagline','footerText','introduction','acceptanceText','documentTitle','scopeTitle','annexTitle'] as const)if(typeof input[key]!=='string'||input[key].length>6000)throw Error('Texte du modèle invalide.');
 for(const key of ['brandName','documentTitle','scopeTitle','annexTitle','acceptanceText'] as const)if(!input[key].trim())throw Error('Complète les titres et le texte d’acceptation du modèle.');
 if(!/^#[0-9a-f]{6}$/i.test(input.accentColor)||!/^#[0-9a-f]{6}$/i.test(input.textColor)||!['Arial','Georgia','Verdana'].includes(input.fontFamily))throw Error('Style de devis invalide.');
 for(const [key,min,max] of [['fontSize',9,12],['marginMm',12,22],['logoWidthMm',12,45],['validityDays',1,365],['depositPercent',0,100]] as const)if(!Number.isInteger(input[key])||input[key]<min||input[key]>max)throw Error('Valeur hors limites : '+key);
 if(input.logoDataUrl!==null&&(typeof input.logoDataUrl!=='string'||input.logoDataUrl.length>2800000||!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(input.logoDataUrl)))throw Error('Logo PNG ou JPEG requis (2 Mo maximum).');
 return structuredClone(input);
 }
 save(input:QuoteDocumentSettings,expected:QuoteDocumentSettings):QuoteDocumentSettings{const value=this.validate(input);if(draftFingerprint(expected)!==draftFingerprint(this.get()))throw Error('Le modèle a changé dans une autre fenêtre. Recharge les valeurs enregistrées avant de réessayer.');this.db.run('INSERT INTO settings(key,value_json,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at',[QUOTE_DOCUMENT_SETTINGS_KEY,JSON.stringify(value),new Date().toISOString()]);return this.get();}
}
