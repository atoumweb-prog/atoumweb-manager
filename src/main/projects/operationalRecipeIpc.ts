import type {IpcMain,WebContents} from 'electron';
import {RECIPE_CHANNELS} from '../../shared/operationalRecipe';
import type {RecipeRequest} from '../../shared/operationalRecipe';
import {OperationalRecipeService} from './OperationalRecipeService';
/** Dedicated bootstrap registers only these handlers; even another frame cannot use them. */
export function registerOperationalRecipeIpc(ipc:Pick<IpcMain,'handle'|'removeHandler'>,owner:WebContents,session:OperationalRecipeService):()=>void {
  const functions=[()=>session.state(),()=>session.references(),()=>session.scenarios(),(v:unknown)=>session.preview(v as RecipeRequest),(v:unknown)=>{
    if(v!==session.sessionId)throw Error('Session de recette incorrecte.');return session.close();
  }];
  RECIPE_CHANNELS.forEach((channel,index)=>ipc.handle(channel,(event,...args:unknown[])=>{
    if(event.sender!==owner||event.senderFrame!==owner.mainFrame||owner.isDestroyed())throw Error('Fenêtre de recette non autorisée.');
    if(args.length!==(index>=3?1:0))throw Error('Arguments de recette non autorisés.');
    return functions[index](args[0]);
  }));
  return ()=>RECIPE_CHANNELS.forEach(c=>ipc.removeHandler(c));
}
