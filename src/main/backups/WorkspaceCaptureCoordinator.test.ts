import {describe, expect, it} from 'vitest';
import {Ec04CaptureCoordinator} from './WorkspaceCaptureCoordinator';
import type {Ec04ArchiveManifest, Ec04CreateInput} from './WorkspacePortableArchive';

const dummy: Ec04CreateInput = {
  workspaceRoot: '/temp/only', destinationPath:'/temp/only.awbackup',
  snapshotDatabase: async () => {},
};
const sample = {format:'atoum-ec04-b1',version:1,files:[],id:'fixture',createdAt:'fixture',
  migrations:[],referencesVerified:false,consistencyCertified:false} as Ec04ArchiveManifest;

describe('EC04 write-pause coordinator (fake writer port only)', () => {
  it('enters the pause before capture and releases after success', async () => {
    const actions: string[] = [];
    const coordinator = new Ec04CaptureCoordinator({acquire:async () => {
      actions.push('pause');return {release:async () => {actions.push('resume');}};
    }}, async () => {actions.push('snapshot');return sample;});
    expect(await coordinator.create(dummy)).toBe(sample);
    expect(actions).toEqual(['pause','snapshot','resume']);
    expect(coordinator.busy).toBe(false);
  });
  it('releases writers on failed snapshot and permits another attempt', async () => {
    let releases = 0;
    const coordinator = new Ec04CaptureCoordinator({acquire:async () => ({release:async () => {releases++;}})},
      async () => {throw Error('simulated disk full');});
    await expect(coordinator.create(dummy)).rejects.toThrow(/disk full/);
    expect(releases).toBe(1);
    expect(coordinator.busy).toBe(false);
  });
  it('does not overlap snapshots waiting for the initial write pause', async () => {
    let unblock!: () => void;
    const held = new Promise<void>(resolve => {unblock = resolve;});
    const coordinator = new Ec04CaptureCoordinator({acquire:async () => {
      await held; return {release:async()=>{}};
    }}, async () => sample);
    const first = coordinator.create(dummy);
    expect(coordinator.busy).toBe(true);
    await expect(coordinator.create(dummy)).rejects.toThrow(/déjà en cours/);
    unblock();await first;
    expect(coordinator.busy).toBe(false);
  });
  it('fails closed if the pause provider returns an invalid lease', async () => {
    let called = false;
    const coordinator = new Ec04CaptureCoordinator({acquire:async()=>({} as never)},
      async()=>{called=true;return sample;});
    await expect(coordinator.create(dummy)).rejects.toThrow(/suspension des écritures/);
    expect(called).toBe(false);
    expect(coordinator.busy).toBe(false);
  });
});
