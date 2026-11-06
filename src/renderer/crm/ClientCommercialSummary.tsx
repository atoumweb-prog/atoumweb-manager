import type {QuoteSummary} from '../../shared/commercial';
import type {MaintenanceSubscription} from '../../shared/operations';
import type {ClientTab} from '../../shared/clientPresentation';
import {AppButton} from '../ui/AppButton';
import {OperationIcon} from '../operations/OperationIcon';
import {openEntity} from '../workflow/DossierPanel';

/** Only existing, explicit situations: no inferred sale, amount or contract state. */
export function ClientCommercialSummary({quotes,subscriptions,loading,errors,onTab}:{quotes:QuoteSummary[];subscriptions:MaintenanceSubscription[];loading:boolean;errors:Record<string,string>;onTab:(tab:ClientTab)=>void}) {
 const proposals=quotes.filter(item=>['draft','sent','viewed'].includes(item.status)),accepted=quotes.filter(item=>item.status==='accepted'),active=subscriptions.filter(item=>item.status==='active'&&!item.archivedAt);
 return <div className="client-commercial-summary">
  <div><h4><OperationIcon name="file-text"/>Propositions commerciales</h4>{loading?<p>Chargement…</p>:errors.quotes?<p role="alert">Lecture des devis indisponible.</p>:<><p>{proposals.length} devis en préparation, envoyé(s) ou consulté(s).</p><AppButton onAction={()=>onTab('commercial')}>Suivi des devis du client</AppButton></>}</div>
  <div><h4><OperationIcon name="file-check"/>Prestations acceptées</h4>{loading?<p>Chargement…</p>:errors.quotes?<p role="alert">Lecture des devis indisponible.</p>:<><p>{accepted.length} devis accepté(s). Détail des prestations dans Contrats.</p><AppButton onAction={()=>onTab('contracts')}>Engagements et prestations</AppButton></>}</div>
  <div><h4><OperationIcon name="wrench"/>Maintenances actives</h4>{loading?<p>Chargement…</p>:errors.subscriptions?<p role="alert">Lecture des maintenances indisponible.</p>:<><p>{active.length} souscription(s) au statut Actif.</p>{active.slice(0,2).map(item=><AppButton key={item.id} variant="quiet" onAction={()=>{openEntity({entityType:'maintenance',entityId:item.id,title:item.planName});}}>{item.planName}</AppButton>)}</>}</div>
 </div>;
}
