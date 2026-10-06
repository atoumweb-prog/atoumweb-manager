import {describe,it,expect,vi} from 'vitest';
import type {WebContents,IpcMain} from 'electron';
import {RECIPE_CHANNELS} from '../../shared/operationalRecipe';
import {registerOperationalRecipeIpc} from './operationalRecipeIpc';
import type {OperationalRecipeService} from './OperationalRecipeService';
describe('Recipe IPC ownership and allowlist',()=>{
  function fixture(){
    const handlers=new Map<string,(event:unknown,...args:unknown[])=>unknown>();
    const ipc={handle:(c:string,f:never)=>handlers.set(c,f),removeHandler:vi.fn((c:string)=>handlers.delete(c))};
    const frame={},owner={mainFrame:frame,isDestroyed:()=>false};
    const session={sessionId:'test',state:vi.fn(),references:vi.fn(),scenarios:vi.fn(),preview:vi.fn(),close:vi.fn()};
    const remove=registerOperationalRecipeIpc(ipc as unknown as IpcMain,owner as WebContents,session as unknown as OperationalRecipeService);
    return {handlers,owner,frame,session,remove,event:{sender:owner,senderFrame:frame}};
  }
  it('registers five channels only and removes them at native window closure',()=>{
    const f=fixture();expect([...f.handlers.keys()]).toEqual([...RECIPE_CHANNELS]);
    f.handlers.get(RECIPE_CHANNELS[0])!(f.event);expect(f.session.state).toHaveBeenCalledOnce();
    f.handlers.get(RECIPE_CHANNELS[3])!(f.event,{scenarioId:'case-1'});expect(f.session.preview).toHaveBeenCalledOnce();
    f.remove();expect(f.handlers.size).toBe(0);
  });
  it.each(['other-window','child-frame','arguments','close-session'])('rejects %s before touching session',kind=>{
    const f=fixture();const event=kind==='other-window'?{...f.event,sender:{}}:kind==='child-frame'?{...f.event,senderFrame:{}}:f.event;
    expect(()=>f.handlers.get(RECIPE_CHANNELS[kind==='close-session'?4:0])!(event,...(kind==='arguments'?['arbitrary']:kind==='close-session'?['wrong']:[]))).toThrow();
    expect(f.session.state).not.toHaveBeenCalled();expect(f.session.close).not.toHaveBeenCalled();
  });
});
