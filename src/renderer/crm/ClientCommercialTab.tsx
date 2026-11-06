import {useMemo,useState} from 'react';
import type {QuoteStatus,QuoteSummary} from '../../shared/commercial';
import {AppButton} from '../ui/AppButton';
import {OperationIcon} from '../operations/OperationIcon';
import {openEntity} from '../workflow/DossierPanel';
import './client-commercial-v2.css';
const STATUS_LABELS:Record<QuoteStatus,string>={draft:'Brouillon',sent:'Envoyé',viewed:'Consulté',accepted:'Accepté',refused:'Refusé',expired:'Expiré',cancelled:'Annulé'};
const date=(value?:string|null)=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('fr-FR'):'—';
export function ClientCommercialTab({quotes,loading,error,onRetry}:{quotes:QuoteSummary[];loading:boolean;error?:string;onRetry:()=>void}){
 const [status,setStatus]=useState<'all'|QuoteStatus>('all'),[order,setOrder]=useState<'recent'|'oldest'>('recent');
 const visible=useMemo(()=>quotes.filter(q=>status==='all'||q.status===status).slice().sort((a,b)=>{const difference=Date.parse(b.createdAt)-Date.parse(a.createdAt);return (order==='recent'?difference:-difference)||a.id.localeCompare(b.id);}),[quotes,status,order]);
 const unavailable=loading||!!error;
 return <div className="client-commercial-tab">
 <header className="client-commercial-heading"><OperationIcon name="file-text"/><div><h3>Commercial — Devis</h3><p>Suivi des propositions commerciales et de leur état.</p></div></header>
 <div className="client-commercial-indicators" aria-label="Situation des devis">
 <div><OperationIcon name="file-text"/><strong>{unavailable?'—':quotes.length}</strong><span>Tous les devis</span></div>
 <div><OperationIcon name="edit"/><strong>{unavailable?'—':quotes.filter(q=>q.status==='draft').length}</strong><span>Brouillons</span></div>
 <div><OperationIcon name="check-circle"/><strong>{unavailable?'—':quotes.filter(q=>q.status==='accepted').length}</strong><span>Acceptés</span></div>
 <div><OperationIcon name="close"/><strong>{unavailable?'—':quotes.filter(q=>q.status==='refused').length}</strong><span>Refusés</span></div>
 </div>
 <div className="client-commercial-list-heading"><h4>Liste des devis {!unavailable&&<span>({visible.length}{status!=='all'?' / '+quotes.length:''})</span>}</h4><div><label>Statut<select aria-label="Filtrer les devis du client" value={status} onChange={e=>setStatus(e.target.value as 'all'|QuoteStatus)}><option value="all">Tous les statuts</option>{Object.entries(STATUS_LABELS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>Ordre<select aria-label="Trier les devis du client" value={order} onChange={e=>setOrder(e.target.value as 'recent'|'oldest')}><option value="recent">Plus récents</option><option value="oldest">Plus anciens</option></select></label></div></div>
 {loading?<p role="status">Chargement des devis…</p>:error?<div role="alert"><p>Impossible de charger les devis : {error}</p><AppButton variant="secondary" onAction={onRetry}>Réessayer</AppButton></div>:<>
 {!quotes.length?<p className="client-commercial-empty">Aucun devis rattaché à ce client.</p>:!visible.length?<p className="client-commercial-empty">Aucun devis avec ce statut. Choisis « Tous les statuts » pour retrouver la liste.</p>:<div className="client-commercial-cards">{visible.map(quote=><article className="client-commercial-card" key={quote.id} data-quote-id={quote.id}>
 <header><div className="client-commercial-reference"><OperationIcon name="file-text"/><div><strong>{quote.number}</strong><p>{quote.subject}</p></div></div><span className="client-commercial-status" data-status={quote.status}>{STATUS_LABELS[quote.status]}</span><AppButton variant="secondary" onAction={()=>{openEntity({entityType:'quote',entityId:quote.id,title:quote.subject});}} icon={<OperationIcon name="external-link"/>}>Ouvrir le devis</AppButton></header>
 <dl><div><dt><OperationIcon name="euro"/>Montant du devis</dt><dd>{Number.isFinite(quote.contractValueCents)?(quote.contractValueCents/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'}):'—'}</dd></div><div><dt><OperationIcon name="calendar"/>Créé le</dt><dd>{date(quote.createdAt)}</dd></div><div><dt><OperationIcon name="calendar"/>Valable jusqu’au</dt><dd>{date(quote.validUntil)}</dd></div><div><dt><OperationIcon name="external-link"/>Référence Abby</dt><dd>{quote.abbyReference||'Non renseignée'}</dd></div></dl>
 </article>)}</div>}
 </>}
 </div>;
}
