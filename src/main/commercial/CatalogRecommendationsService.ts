import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';

interface VersionRow extends Record<string, unknown> {
  id: string;
  item_id: string;
  item_type: 'offer' | 'service';
  status: 'draft' | 'published' | 'retired';
  item_status: 'active' | 'inactive' | 'archived';
}
export interface CatalogRecommendationDetails { targetVersionId: string; reason: string; status: 'active' | 'paused'; conditions: string; provenance: string; }
export interface CatalogRecommendationRow {
  id: string;
  sourceVersionId: string;
  targetVersionId: string;
  targetItemId: string;
  targetName: string;
  targetVersionNumber: number;
  targetVersionStatus: 'draft' | 'published' | 'retired';
  targetItemStatus: 'active' | 'inactive' | 'archived';
  sortOrder: number;
  reason: string;
  status: 'active' | 'paused';
  conditions: string;
  provenance: string;
}
export class CatalogRecommendationsService {
  constructor(private readonly database: DatabaseAdapter) {}

  list(sourceVersionId: string): CatalogRecommendationRow[] {
    return this.database.all<{
      id:string;source_version_id:string;target_version_id:string;sort_order:number;
      reason:string;rule_status:'active'|'paused';conditions:string;provenance:string;
      target_item_id:string;target_name:string;target_version_number:number;target_version_status:CatalogRecommendationRow['targetVersionStatus'];target_item_status:CatalogRecommendationRow['targetItemStatus'];
    }>(`SELECT r.id,r.source_version_id,r.target_version_id,r.sort_order,
              r.reason,r.rule_status,r.conditions,r.provenance,
              i.id AS target_item_id,i.name AS target_name,v.version_number AS target_version_number,v.status AS target_version_status,
              i.status AS target_item_status
       FROM catalog_version_recommendations r
       JOIN catalog_versions v ON v.id=r.target_version_id
       JOIN catalog_items i ON i.id=v.item_id
       WHERE r.source_version_id=?
       ORDER BY r.sort_order,r.id`, [sourceVersionId],
    ).map(x=>({
      id:x.id,sourceVersionId:x.source_version_id,targetVersionId:x.target_version_id,
      targetItemId:x.target_item_id,targetName:x.target_name,targetVersionNumber:Number(x.target_version_number),
      targetVersionStatus:x.target_version_status,
      targetItemStatus:x.target_item_status,sortOrder:x.sort_order,
      reason:x.reason,status:x.rule_status,conditions:x.conditions,provenance:x.provenance,
    }));
  }

  /** Atomic replace; references use immutable published targets. No quote is changed. */
  replace(sourceVersionId: string, targetVersionIds: readonly string[], expectedTargetVersionIds?: readonly string[], details?: readonly CatalogRecommendationDetails[]): CatalogRecommendationRow[] {
    if(typeof sourceVersionId!=='string'||!sourceVersionId.trim()||
       !Array.isArray(targetVersionIds)||targetVersionIds.some(id=>typeof id!=='string'||!id.trim())||
       (expectedTargetVersionIds!==undefined&&(!Array.isArray(expectedTargetVersionIds)||
        expectedTargetVersionIds.some(id=>typeof id!=='string'||!id.trim())))) {
      throw new Error('Identifiants de recommandation invalides.');
    }
    if(details!==undefined && (!Array.isArray(details) || details.length!==targetVersionIds.length ||
      details.some((d,index)=>!d||d.targetVersionId!==targetVersionIds[index]||
        typeof d.reason!=='string'||d.reason.length>1000||typeof d.conditions!=='string'||d.conditions.length>3000||
        typeof d.provenance!=='string'||d.provenance.length>200|| !['active','paused'].includes(d.status))))
      throw new Error('Motif, état ou conditions de recommandation invalides.');
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const version = (id:string) => this.database.get<VersionRow>(
        `SELECT v.id,v.item_id,v.status,i.item_type,i.status AS item_status FROM catalog_versions v
        JOIN catalog_items i ON i.id=v.item_id WHERE v.id=?`,[id]);
      const source=version(sourceVersionId);
      if (!source || source.status !== 'draft') throw new Error('Seul un brouillon Catalogue peut modifier ses recommandations.');
      if (expectedTargetVersionIds) {
        const persisted = this.list(sourceVersionId).map(link => link.targetVersionId);
        if (JSON.stringify(persisted) !== JSON.stringify(expectedTargetVersionIds))
          throw new Error('Conflit : les recommandations ont été modifiées dans une autre fenêtre. Recharge la fiche avant de sauvegarder.');
      }
      const seen=new Set<string>();
      for (const id of targetVersionIds) {
        const target=version(id);
        if (!target || target.status !== 'published' || target.item_status !== 'active' || target.item_type !== 'service') {
          throw new Error('La recommandation doit cibler un Service actif avec une version publiée.');
        }
        if (source.item_id === target.item_id) throw new Error('Une prestation ne peut se recommander elle-même.');
        if (seen.has(target.item_id)) throw new Error('Une même prestation ne peut être recommandée deux fois.');
        seen.add(target.item_id);
        const included=this.database.get<{n:number}>(`SELECT count(*) AS n FROM offer_components c
          JOIN catalog_versions v ON v.id=c.service_version_id
          WHERE c.offer_version_id=? AND v.item_id=?`,[sourceVersionId,target.item_id]);
        if ((included?.n ?? 0)>0) throw new Error('Ce service est déjà inclus dans la composition de l’offre.');
      }
      // Replaying the same intent must not rotate association IDs or reorder history.
      const existingLinks = this.list(sourceVersionId);
      const sameTargets=JSON.stringify(existingLinks.map(link => link.targetVersionId)) === JSON.stringify(targetVersionIds);
      const sameDetails=details===undefined || existingLinks.every((link,index)=>
        link.reason===details[index].reason && link.status===details[index].status &&
        link.conditions===details[index].conditions && link.provenance===details[index].provenance);
      if (sameTargets && sameDetails) {
        this.database.exec('COMMIT;');
        return existingLinks;
      }
      this.database.run('DELETE FROM catalog_version_recommendations WHERE source_version_id=?',[sourceVersionId]);
      const createdAt=new Date().toISOString();
      for (const [sortOrder,targetVersionId] of targetVersionIds.entries()) {
        const previous=existingLinks.find(link=>link.targetVersionId===targetVersionId);
        const info=details?.[sortOrder]??previous??{reason:'',status:'active' as const,conditions:'',provenance:'manual'};
        this.database.run(`INSERT INTO catalog_version_recommendations
          (id,source_version_id,target_version_id,sort_order,created_at,reason,rule_status,conditions,provenance)
          VALUES (?,?,?,?,?,?,?,?,?)`,
          [previous?.id??randomUUID(),sourceVersionId,targetVersionId,sortOrder,createdAt,
            info.reason,info.status,info.conditions,info.provenance]);
      }
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.list(sourceVersionId);
  }
}
