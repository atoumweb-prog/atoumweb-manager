import { describe, expect, it } from 'vitest';
import { workspaceDisplayFolder } from './workspacePresentation';
describe('chemins Documents présentés, sans système de fichiers', () => {
  it('n’invente pas une migration de workspace et préserve le format du système', () => {
    expect(workspaceDisplayFolder('C:\\DEV\\AtoumWeb\\', 'clients')).toBe('C:\\DEV\\AtoumWeb\\clients');
    expect(workspaceDisplayFolder('/tmp/workspace/', 'exports')).toBe('/tmp/workspace/exports');
    expect(workspaceDisplayFolder('D:\\Dossiers', 'exports')).toBe('D:\\Dossiers\\exports');
  });
});
