import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import type {ProjectSiteService} from './ProjectSiteService';
import {ProjectOperationalService} from './ProjectOperationalService';
import {ProjectBlueprintCompositionService} from './ProjectBlueprintCompositionService';
import {ProjectContributionTargetService} from './ProjectContributionTargetService';

export interface StagingTargetChoice {
  lineOrigin:string; slot:string; unitIndex:number;
  siteOwnerOrigin:string; siteOwnerSlot:string;
  parentPage?:{lineOrigin:string;templateNodeId:string};
}

/** Read-only preview through the persisted associations and persisted sold quote lines. */
export class OperationalStagingService {
  constructor(private readonly db:DatabaseAdapter){}
  previewQuote(quoteId:string,choices:StagingTargetChoice[]=[]) {
    const origins=new Map(this.db.all<{id:string}>('SELECT id FROM quote_lines WHERE quote_id=?',[quoteId]).map(l=>[l.id,l.id]));
    const operational=new ProjectOperationalService(this.db),composition=new ProjectBlueprintCompositionService(this.db,{} as ProjectSiteService);
    const operations=operational.stageQuote(quoteId,origins);
    const blueprint=composition.stageQuote(quoteId,origins,operations);
    operational.checkBlueprint(operations,blueprint);
    const targets=new ProjectContributionTargetService(this.db).plan(null,operations,blueprint);
    const selected=new Set<string>();
    for(const choice of choices) {
      const key=JSON.stringify([choice.lineOrigin,choice.slot,choice.unitIndex]);
      if(selected.has(key))throw Error('Choix staging dupliqué.');selected.add(key);
      const target=targets.find(t=>t.lineOrigin===choice.lineOrigin&&t.slot===choice.slot&&t.unitIndex===choice.unitIndex);
      const association=operations.links.find(l=>l.lineOrigin===choice.lineOrigin);
      const base=blueprint.bases?.find(b=>b.lineOrigin===choice.siteOwnerOrigin);
      const site=base?.structureContract?.sites.find(s=>s.slotKey===choice.siteOwnerSlot);
      if(!target||!site||target.kind==='context')throw Error('Destination staging absente ou non structurelle.');
      if(!association?.configuration?.requires.every(c=>site.provides.includes(c)))throw Error('Capacité staging non fournie explicitement.');
      if(association.configuration.structureClass==='A'&&choice.lineOrigin!==choice.siteOwnerOrigin)throw Error('Occurrence de base différente.');
      if(target.kind==='page') {
        const pageContribution=blueprint.contributions.find(c=>c.lineOrigin===choice.parentPage?.lineOrigin);
        const page=pageContribution?.structureContract?.pages.find(p=>p.templateNodeId===choice.parentPage?.templateNodeId);
        if(!page||pageContribution?.lineOrigin!==choice.siteOwnerOrigin||page.siteSlotKey!==choice.siteOwnerSlot)throw Error('Page parente staging explicite de la base cible requise.');
      }else if(choice.parentPage)throw Error('Page parente incompatible avec le slot Site.');
      Object.assign(target,{state:'active',selectionMode:'explicit',siteOwnerOrigin:choice.siteOwnerOrigin,siteOwnerSlot:choice.siteOwnerSlot});
    }
    const limits=new Set<string>();
    for(const l of operations.links)if(l.configuration?.targetLimit) {
      const t=targets.find(t=>t.lineOrigin===l.lineOrigin&&t.kind==='site'&&t.state==='active');
      if(!t)continue;
      const key=JSON.stringify([l.configuration.targetLimit.key,t.siteOwnerOrigin,t.siteOwnerSlot]);
      if(limits.has(key))throw Error('Blog maximum 1 par Site cible en V1.');limits.add(key);
    }
    // Logical template/origin selections only, never IDs pretending to be materialized Site/Page rows.
    return {mode:'staging' as const,operations,blueprint,targets,logicalChoices:choices};
  }
}
