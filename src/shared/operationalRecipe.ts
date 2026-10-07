import type {ContributionPolicy, PlannedContributionTarget, StructureContract} from './contributionTargets';
import type {OperationalActionSnapshot} from './operational';
export const RECIPE_CHANNELS = ['operational-recipe:state','operational-recipe:references','operational-recipe:scenarios','operational-recipe:preview','operational-recipe:close'] as const;
export const RECIPE_FLAG = '--operational-recipe';
export interface RecipeScenario {
  id:string; name:string; lines:{key:string;code:string;quantity:number}[];
  option?:{code:string;sourceLineKey:string;lineKey:string;selected:boolean;quantity:number};
}
export interface RecipeChoice {
  lineOrigin:string;slot:string;unitIndex:number;siteOwnerOrigin:string;siteOwnerSlot:string;
  parentPage?:{lineOrigin:string;templateNodeId:string};
}
export interface RecipeRequest {
  sessionId:string;scenarioId:string;requestId:number;
  quantities?:Record<string,number>;optionSelected?:boolean;choices?:RecipeChoice[];
}
export interface RecipeReference {
  code:string;name:string;lot:'8A'|'8B';modelVersionId:string;modelVersion:number;status:'draft';
  catalogVersionId:string|null;catalogVersion:number|null;linkId:string|null;linkStatus:'draft'|null;
  blueprintVersionId:string|null;policy:ContributionPolicy|null;estimateRequired:boolean;sourceRow:number;
}
export interface RecipeState {
  sessionId:string;sourceSHA256:string;sourceLabel:string;migrations:number;models:number;links:number;profiles:number;
  readOnly:true;canMaterialize:false;mode:'staging';
}
export interface RecipePreview {
  mode:'staging';readOnly:true;canMaterialize:false;requestId:number;scenarioId:string;sourceSHA256:string;
  lines:{key:string;origin:string;code:string;quantity:number;catalogVersionId:string;modelVersionId:string;purchasedOption:boolean;priceCents:number|null}[];
  metrics:{actions:number;referenceMinutes:number;finalEstimate:number|null;sites:number;pages:number;modules:number};
  actions:OperationalActionSnapshot[];
  structures:{origin:string;code:string;versionId:string;role:'base'|'addon';units:number;contract:StructureContract;nodes:{id:string;name:string;desiredPath?:string|null;description?:string|null}[]}[];
  targets:PlannedContributionTarget[];logicalChoices:RecipeChoice[];
  policies:{origin:string;policy:ContributionPolicy}[];
  prerequisites:{label:string}[];runtimeRefused:boolean;
}
export interface RecipeClose {sourceSHA256Before:string;sourceSHA256After:string;sourceUnchanged:boolean;copyDeleted:boolean}
export interface OperationalRecipeApi {
  state():Promise<RecipeState>;
  references():Promise<RecipeReference[]>;
  scenarios():Promise<RecipeScenario[]>;
  preview(request:RecipeRequest):Promise<RecipePreview>;
  close(sessionId:string):Promise<RecipeClose>;
}
declare global {interface Window {atoumwebOperationalRecipe?:OperationalRecipeApi}}
