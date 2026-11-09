import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {it,expect} from 'vitest';
import {assertConvergenceTempProfile,convergenceTempRequested} from './convergenceTempGuard';
it('leaves normal startup unchanged',()=>{expect(convergenceTempRequested([])).toBe(false);expect(()=>assertConvergenceTempProfile([],'not-a-real-profile')).not.toThrow();});
it('accepts only its exact TEMP profile/workspace and rejects redirection before opening a database',()=>{
 const root=mkdtempSync(join(tmpdir(),'atoumweb-convergence-ux-v2-guard-')),profile=join(root,'Profil-TEST'),workspace=join(root,'Workspace-TEST');
 try{mkdirSync(profile);mkdirSync(workspace);const args=['--convergence-temp-root='+root];writeFileSync(join(profile,'workspace.json'),JSON.stringify({workspaceRoot:workspace}));expect(()=>assertConvergenceTempProfile(args,profile)).not.toThrow();
 writeFileSync(join(profile,'workspace.json'),JSON.stringify({workspaceRoot:root}));expect(()=>assertConvergenceTempProfile(args,profile)).toThrow('workspace isolé');expect(()=>assertConvergenceTempProfile(args,workspace)).toThrow('profil isolé');
 }finally{rmSync(root,{recursive:true,force:true});}
});
