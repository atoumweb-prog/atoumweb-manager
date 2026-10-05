import type {ContributionPolicy, StructureContract} from '../../shared/contributionTargets';
import type {OperationalModel} from '../../shared/operational';
import type {DatabaseAdapter} from '../database/DatabaseAdapter';

export function readPolicy(provenance: string): ContributionPolicy | undefined {
  const source=JSON.parse(provenance),value=source.configuration;
  if (value===undefined) {if(source.governance==='lot8a1')throw Error('Version déclarée Lot 8A.1 sans politique explicite.');return;}
  if (!value || value.schemaVersion!==1) throw Error('Politique structurelle absente ou de version inconnue.');
  return value as ContributionPolicy;
}
export function validatePolicy(p: ContributionPolicy, model: OperationalModel, blueprint: string | null, db: DatabaseAdapter): void {
  if (!['A','B','C','D'].includes(p.structureClass) || !['base','addon','none'].includes(p.structuralRole) ||
      p.originPolicy!=='direct_sold_line' || !p.policySource?.trim() || !Array.isArray(p.requires) || p.requires.some(x=>typeof x!=='string'||!x.trim()) ||
      !Array.isArray(p.destinationSlots) || !p.actionRequirements || !p.quantity || p.quantity.integerOnly!==true ||
      p.quantity.actionMode!=='per_sold_unit' || !['once','per_unit','none'].includes(p.quantity.structureMode) ||
      !Number.isInteger(p.quantity.minUnits) || p.quantity.minUnits<1 ||
      (p.quantity.maxUnits!==null && (!Number.isInteger(p.quantity.maxUnits)||p.quantity.maxUnits<p.quantity.minUnits)))
    throw Error('Politique de contribution invalide.');
  if (p.structureClass==='A' && (p.structuralRole!=='base'||!p.blueprintRequired||p.quantity.maxUnits!==1||p.quantity.structureMode!=='once')) throw Error('A : base structurelle obligatoire, une structure et quantité maximale 1.');
  if (p.structureClass==='B' && (p.structuralRole!=='addon'||!p.blueprintRequired||!p.destinationSlots.length||p.quantity.structureMode==='none')) throw Error('B : structure et destination explicites requises.');
  if (p.structureClass==='C' && (blueprint||p.blueprintRequired||p.structuralRole!=='none'||p.destinationSlots.length||p.requires.length||p.quantity.structureMode!=='none')) throw Error('C : aucune structure Site/Page ni destination.');
  if (p.structureClass==='D' && (blueprint||p.blueprintRequired||p.structuralRole!=='none'||p.quantity.structureMode!=='none')) throw Error('D : aucune création structurelle automatique.');
  if (p.blueprintRequired && !blueprint) throw Error('Structure compatible obligatoire absente.');
  if (!blueprint && p.quantity.structureMode!=='none') throw Error('Dimensionnement structurel sans blueprint.');
  if(p.structureClass==='D'&&(!p.actionRequirementsReview?.reference.trim()||!(p.actionRequirementsReview.status==='approved'||p.actionRequirementsReview.status==='fixture'&&model.code.startsWith('AW-TEST'))))throw Error('D : mapping métier actionKey non validé ; aucune activation.');
  if(p.allowedBaseSiteModes&&(p.allowedBaseSiteModes.some(m=>!['create','existing'].includes(m))||!p.allowedBaseSiteModes.length))throw Error('Modes Site de base invalides.');
  const slots=new Map(p.destinationSlots.map(s=>[s.key,s]));
  if(slots.size!==p.destinationSlots.length) throw Error('Slot de destination dupliqué.');
  for(const s of slots.values()) if(!s.key?.trim()||!['site','page','context'].includes(s.kind)||!['preparation','integration'].includes(s.requiredAt)||
    !['unique_compatible','never'].includes(s.autoSite)||!['explicit','none'].includes(s.parentPageChoice)||
    (s.kind!=='site'&&s.autoSite!=='never')||(s.kind==='page'&&s.parentPageChoice!=='explicit')) throw Error('Destination invalide : Page parente explicitement choisie.');
  if (p.targetLimit && (p.targetLimit.maxPerSite!==1||!p.targetLimit.key||p.quantity.maxUnits!==1)) throw Error('Limite par Site invalide.');
  const keys=new Set(model.actions.map(a=>a.key));
  if(Object.keys(p.actionRequirements).length!==keys.size || Object.keys(p.actionRequirements).some(k=>!keys.has(k))) throw Error('Mapping actionKey exhaustif requis, sans déduction de libellé.');
  for(const r of Object.values(p.actionRequirements)) {
    const s=r.slot?slots.get(r.slot):undefined;
    if(!r.justification?.trim()||!['none','site','page','context'].includes(r.target)||!['preparation','integration'].includes(r.requiredAt)||
      (r.target==='none'?Boolean(r.slot):!s||s.kind!==r.target)) throw Error('Exigence de cible action invalide.');
  }
  if (blueprint) {
    const contract=readStructure(db,blueprint);
    if(contract.sites.length!==1)throw Error('V1 : un seul slot Site par contribution structurelle.');
    if(p.structureClass==='B'&&contract.sites.some(s=>s.provides.length))throw Error('Addon : aucune capacité Site indépendante, utiliser celle de la base cible.');
    if(p.structureClass==='A'&&(!p.destinationSlots.some(s=>s.key===contract.sites[0].slotKey&&s.kind==='site'&&s.requiredAt==='preparation')))throw Error('A : destination Site obligatoire dès la préparation.');
    for(const m of contract.modules)if(!slots.has(m.parentTargetSlot)||slots.get(m.parentTargetSlot)!.kind!=='page')throw Error('Module : slot Page parente explicite absent de la politique.');
  }
}
export function checkQuantity(p: ContributionPolicy, quantityMilli: number): void {
  const n=quantityMilli/1000;
  if(!Number.isSafeInteger(quantityMilli)||!Number.isInteger(n)||n<p.quantity.minUnits||n>500||(p.quantity.maxUnits!==null&&n>p.quantity.maxUnits))
    throw Error('Quantité commerciale incompatible avec la politique actions/structure (maximum '+(p.quantity.maxUnits??500)+').');
}
export function readStructure(db: DatabaseAdapter, version: string): StructureContract {
  const row=db.get<{provenance_json:string;mode:string}>('SELECT provenance_json,mode FROM blueprint_operational_profiles WHERE template_version_id=?',[version]);
  const c=row?JSON.parse(row.provenance_json).structureContract as StructureContract:undefined;
  if(row?.mode!=='structural'||c?.schemaVersion!==1||!Array.isArray(c.sites)||!Array.isArray(c.pages)||!Array.isArray(c.modules)) throw Error('Contrat structurel versionné requis.');
  const sites=db.all<{blueprint_key:string}>('SELECT blueprint_key FROM project_template_sites WHERE template_version_id=?',[version]);
  if(new Set(c.sites.map(s=>s.slotKey)).size!==c.sites.length||sites.length!==c.sites.length||sites.some(s=>!c.sites.some(x=>x.slotKey===s.blueprint_key))) throw Error('Slots Site non conformes au blueprint exact.');
  for(const s of c.sites) if(!Array.isArray(s.provides)||s.provides.some(x=>typeof x!=='string'||!x.trim())||!s.modes.length||s.modes.some(x=>!['create','existing'].includes(x))) throw Error('Capacités/modes Site invalides.');
  const pages=db.all<{template_node_id:string;blueprint_key:string}>(`SELECT p.template_node_id,s.blueprint_key FROM project_template_site_pages p JOIN project_template_sites s ON s.id=p.template_site_id WHERE s.template_version_id=?`,[version]);
  if(pages.length!==c.pages.length||new Set(c.pages.map(p=>p.slotKey)).size!==c.pages.length||pages.some(p=>!c.pages.some(x=>x.templateNodeId===p.template_node_id&&x.siteSlotKey===p.blueprint_key))) throw Error('Slots Page non conformes au blueprint exact.');
  for(const p of c.pages)if(!['content','auxiliary'].includes(p.quota))throw Error('Quota Page non défini explicitement.');
  for(const m of c.modules) if(!db.get("SELECT id FROM project_template_nodes WHERE id=? AND template_version_id=? AND node_type='module' AND coalesce(display_subtype,'')<>'page'",[m.templateNodeId,version])||!m.parentTargetSlot) throw Error('Module structurel sans Page parente explicite.');
  return c;
}
