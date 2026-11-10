import {readFileSync,realpathSync} from 'node:fs';
import {basename,join,relative,isAbsolute,resolve} from 'node:path';
import {tmpdir} from 'node:os';
const flag='--convergence-temp-root=';
export const convergenceTempRequested=(args:string[])=>args.some(a=>a.startsWith(flag));
/** Opt-in delivery guard; normal Manager profiles are unaffected. Check before workspace initialization. */
export function assertConvergenceTempProfile(args:string[],profile:string):void {
 const arg=args.find(a=>a.startsWith(flag));if(!arg)return;
 const root=realpathSync(arg.slice(flag.length)),rel=relative(realpathSync(tmpdir()),root);
 if(rel.startsWith('..')||isAbsolute(rel)||!basename(root).startsWith('atoumweb-convergence-ux-v2-'))throw Error('Convergence : racine TEMP refusée.');
 if(realpathSync(profile)!==realpathSync(join(root,'Profil-TEST')))throw Error('Convergence : profil isolé requis.');
 const config=JSON.parse(readFileSync(join(profile,'workspace.json'),'utf8')) as {workspaceRoot:string};
 if(resolve(config.workspaceRoot)!==resolve(join(root,'Workspace-TEST'))||realpathSync(config.workspaceRoot)!==resolve(join(root,'Workspace-TEST')))throw Error('Convergence : workspace isolé requis.');
}
