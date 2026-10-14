/** Verrou synchrone anti-double action, pris avant tout await et libéré même en cas d'erreur. */
export function createSingleFlightGate() {
  let active = false;
  return {
    get active() { return active; },
    async run(action: () => Promise<void>): Promise<boolean> {
      if (active) return false;
      active = true;
      try { await action(); return true; }
      finally { active = false; }
    },
  };
}
