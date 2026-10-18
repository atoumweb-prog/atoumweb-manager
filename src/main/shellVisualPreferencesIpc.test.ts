import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HEADER_PREFERENCE_KEY } from '../shared/headerPresentation';
import {HOME_WIDGET_PREFERENCE_KEY,defaultHomeWidgets} from '../shared/homeWidgetPreference';
import { NAVIGATION_PREFERENCE_KEY } from '../shared/navigationRail';
import { VISUAL_SETTINGS_KEY } from '../shared/workspaceVisualPreferences';
const mocks = vi.hoisted(() => ({ handlers: new Map<string, (...args: any[]) => void>(), send: vi.fn(), choice: vi.fn((_window: unknown, _options: unknown) => 0) }));
vi.mock('electron', () => ({
  ipcMain: {removeAllListeners: (key: string) => mocks.handlers.delete(key), on: (key: string, handler: (...args: any[]) => void) => mocks.handlers.set(key,handler)},
  BrowserWindow: {fromWebContents: () => ({id:1}), getAllWindows: () => [{isDestroyed: () => false, webContents: {send: mocks.send}}]},
  dialog: {showMessageBoxSync: mocks.choice},
}));
import { WorkspaceMutationGate } from './backups/WorkspaceMutationGate';
import { registerShellVisualPreferences } from './shellVisualPreferencesIpc';
let values: Map<string, unknown>, writes: string[], refuse: boolean;
beforeEach(() => {
  values=new Map(); writes=[]; refuse=false; mocks.send.mockClear(); mocks.choice.mockReset().mockReturnValue(0);
  registerShellVisualPreferences({getSetting<T>(key:string,fallback:T):T{return values.has(key)?values.get(key) as T:fallback;},setSetting(key,value){if(refuse)throw Error('write refused');writes.push(key);values.set(key,value);}});
});
function call(op:string,key:unknown='',raw?:unknown,child=false) {
  const frame={}, event={sender:{mainFrame:frame},senderFrame:child?{}:frame,returnValue:null as any};
  mocks.handlers.get('settings:shell-visual')!(event,op,key,raw); return event.returnValue;
}
describe('workspace-owned shell presentation IPC', () => {
  it('stores normalized Home layout using only the visual settings owner',()=>{expect(call('set',HOME_WIDGET_PREFERENCE_KEY,JSON.stringify({...defaultHomeWidgets(),hidden:['watch'],note:'private'})).ok).toBe(true);expect(JSON.parse(call('get',HOME_WIDGET_PREFERENCE_KEY).value)).toEqual({...defaultHomeWidgets(),hidden:['watch']});expect(writes).toEqual([VISUAL_SETTINGS_KEY]);expect(mocks.send).toHaveBeenLastCalledWith('settings:visual-changed',HOME_WIDGET_PREFERENCE_KEY);});
  it('reads absent preference without mutation or notification',()=>{expect(call('get',HEADER_PREFERENCE_KEY)).toEqual({ok:true,value:null});expect(writes).toEqual([]);expect(mocks.send).not.toHaveBeenCalled();});
  it('preserves adjacent preferences and broadcasts only confirmed writes',()=>{
    expect(call('set',NAVIGATION_PREFERENCE_KEY,JSON.stringify({version:1,railCollapsed:true,favoriteModuleKeys:['Clients']})).ok).toBe(true);
    expect(call('set',HEADER_PREFERENCE_KEY,JSON.stringify({version:1,compact:true,session:'forbidden'})).ok).toBe(true);
    expect(JSON.parse(call('get',NAVIGATION_PREFERENCE_KEY).value).favoriteModuleKeys).toEqual(['Clients']);
    expect(JSON.parse(call('get',HEADER_PREFERENCE_KEY).value)).toEqual({version:1,compact:true});
    expect(writes).toEqual([VISUAL_SETTINGS_KEY,VISUAL_SETTINGS_KEY]);expect(mocks.send).toHaveBeenLastCalledWith('settings:visual-changed',HEADER_PREFERENCE_KEY);
  });
  it('refuses child frames before any settings access',()=>{expect(call('set',HEADER_PREFERENCE_KEY,'{}',true).ok).toBe(false);expect(writes).toEqual([]);expect(mocks.send).not.toHaveBeenCalled();});
  it('refuses arbitrary setting keys and unsupported operations',()=>{expect(call('set','theme','"noir"').ok).toBe(false);expect(call('restore',HEADER_PREFERENCE_KEY).ok).toBe(false);expect(writes).toEqual([]);});
  it('reports failed write without publishing a success notification',()=>{refuse=true;expect(call('set',HEADER_PREFERENCE_KEY,'{"version":1,"compact":true}')).toEqual({ok:false,error:'write refused'});expect(mocks.send).not.toHaveBeenCalled();expect(writes).toEqual([]);});
  it('refuses invalid preference schemas without changing neighbors',()=>{expect(call('set',HEADER_PREFERENCE_KEY,'{"version":99}').ok).toBe(false);expect(writes).toEqual([]);});
  it('reset confirmation defaults to cancel and itself mutates nothing',()=>{expect(call('confirm-reset')).toEqual({ok:true,value:false});expect(mocks.choice.mock.calls[0][1]).toMatchObject({defaultId:0,cancelId:0});expect(writes).toEqual([]);});
});

 it('refuses sync writes during capture without broadcasting and resumes after release',async()=>{
   const gate=new WorkspaceMutationGate();
   registerShellVisualPreferences({getSetting<T>(_key:string,fallback:T){return fallback;},setSetting(key){writes.push(key);}},gate);
   const lease=await gate.acquire();
   expect(call('set',HEADER_PREFERENCE_KEY,'{"version":1,"compact":true}')).toMatchObject({ok:false});
   expect(call('remove',HEADER_PREFERENCE_KEY)).toMatchObject({ok:false});
   expect(call('get',HEADER_PREFERENCE_KEY)).toEqual({ok:true,value:null});
   expect(writes).toEqual([]);expect(mocks.send).not.toHaveBeenCalled();
   await lease.release();
   expect(call('set',HEADER_PREFERENCE_KEY,'{"version":1,"compact":true}').ok).toBe(true);
   expect(writes).toEqual([VISUAL_SETTINGS_KEY]);expect(gate.activeMutations).toBe(0);
 });
