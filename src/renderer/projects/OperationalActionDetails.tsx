import type { ProjectNode, ProjectNodeInput } from '../../shared/projects';
import { BUSINESS_TIME_CATEGORIES, type BusinessTimeCategory } from '../../shared/operational';

export function OperationalActionDetails({node,onUpdate}: {node:ProjectNode;onUpdate:(id:string,input:Partial<ProjectNodeInput>)=>Promise<void>}) {
  const s=node.operational;
  if (!s?.action) return null;
  return <section className="project-tab-content operational-action-details" aria-label="Référence opérationnelle">
    <strong>Référence opérationnelle — {s.code}</strong>
    <p>Référence initiale : {s.referenceMinutes} min {s.estimateRequired?'(socle indicatif, estimation complète obligatoire)':''}</p>
    <p>Estimation courante : {node.estimatedMinutes==null?'À établir':`${node.estimatedMinutes} min`} · Temps réel : {Math.floor(s.actualSeconds/60)} min</p>
    <label>Catégorie métier du temps <select value={node.businessCategory ?? ''} onChange={e=>void onUpdate(node.id,{businessCategory:e.target.value as BusinessTimeCategory})}>
      {BUSINESS_TIME_CATEGORIES.map(c=><option key={c}>{c}</option>)}
    </select></label>
    <small>Modèle v{s.modelVersion} · {s.action.key} · unité {s.unitIndex} · quantité vendue {s.quantityMilli/1000}</small>
    <details><summary>Provenance de vente</summary><p>Version catalogue : {s.catalogVersionId}</p><p>Ligne : {s.quoteLineId}</p><p>Origine commerciale : {s.lineOrigin}</p><p>Version opérationnelle : {s.modelVersionId}</p><p>{s.optionPurchase?'Option explicitement achetée':'Ligne vendue directe'}</p></details>
    <p className="muted">La référence initiale reste figée. Une catégorie modifiée ne reclasse pas les sessions passées. Aucun supplément n’est facturé automatiquement.</p>
  </section>;
}
