import {BrowserWindow,ipcMain} from 'electron';
import {windowBrandIcon} from '../windowBranding';
import {RECIPE_FLAG} from '../../shared/operationalRecipe';
import {OperationalRecipeService} from './OperationalRecipeService';
import {registerOperationalRecipeIpc} from './operationalRecipeIpc';
export function createOperationalRecipeWindow(preload:string,load:(window:BrowserWindow)=>void,show=true,fixtureOptions?:{source?:string;expectedSHA?:string;tempParent?:string}){
  const session=new OperationalRecipeService(fixtureOptions?.source,fixtureOptions?.expectedSHA,fixtureOptions?.tempParent);
  let window:BrowserWindow|undefined;let removeHandlers:(()=>void)|undefined;let disposed=false;
  const dispose=()=>{if(disposed)return;disposed=true;removeHandlers?.();console.info('Contrôle fermeture recette',session.close());};
  try{
    window=new BrowserWindow({icon:windowBrandIcon(),show,width:1440,height:960,minWidth:760,minHeight:560,title:'AtoumWeb Manager — Recette BROUILLON',
      webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true,offscreen:!show,backgroundThrottling:false,additionalArguments:[RECIPE_FLAG]}});
    removeHandlers=registerOperationalRecipeIpc(ipcMain,window.webContents,session);
    window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    window.webContents.on('will-navigate',event=>event.preventDefault());
    window.webContents.on('did-fail-load',()=>window?.close());
    window.webContents.on('render-process-gone',()=>window?.close());
    window.on('closed',dispose);load(window);
    return {window,session,dispose};
  }catch(error){try{dispose();}finally{window?.destroy();}throw error;}
}

