/** A packaged restore is not persisted until Electron reaches will-quit. */
export class RestoreQuitGate {
  private nextToken = 0;
  private staged: { token: number; commit: () => void } | null = null;

  arm(commit: () => void): number {
    if (this.staged) throw new Error('Une restauration attend déjà la fermeture du Manager.');
    const token = ++this.nextToken;
    this.staged = { token, commit };
    return token;
  }

  isActive(token: number): boolean {
    return this.staged?.token === token;
  }

  cancel(): void {
    this.staged = null;
  }

  commitOnQuit(): boolean {
    const staged = this.staged;
    this.staged = null;
    if (!staged) return false;
    staged.commit();
    return true;
  }
}

export const restoreQuitGate = new RestoreQuitGate();
