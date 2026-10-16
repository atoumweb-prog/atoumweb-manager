import {app} from 'electron';
import {join} from 'node:path';

/** Same approved symbol for visible windows and packaged Windows resources. */
export function windowBrandIcon():string {
  return app.isPackaged
    ? join(process.resourcesPath,'atoum-manager.ico')
    : join(app.getAppPath(),'assets/brand/candidate/atoum-manager.ico');
}
