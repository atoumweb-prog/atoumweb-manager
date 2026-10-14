/** Chemins d'affichage uniquement, sans accès disque ni vérification d'existence. */
export function workspaceDisplayFolder(workspaceRoot: string, relative: 'clients' | 'exports'): string {
  const separator = workspaceRoot.includes('\\') ? '\\' : '/';
  const base = workspaceRoot.replace(/[\\/]+$/, '');
  return base + separator + relative;
}
