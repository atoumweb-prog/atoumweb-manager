import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('frontière explicite de la revue de convergence',()=>{
  it('expose une simulation seule et protège séparément les deux préparations',()=>{
    const ipc=readFileSync('src/main/ipc.ts','utf8');
    const preload=readFileSync('src/preload/preload.ts','utf8');
    const panel=readFileSync('src/renderer/commercial/ConvergenceReviewPanel.tsx','utf8');
    expect(ipc).toContain("ipcMain.handle('convergence-review:simulate', () => database.convergenceReview.simulate())");
    for(const channel of ['prepare-contract-drafts','prepare-catalog-drafts']){
      const start=ipc.indexOf(`ipcMain.handle('convergence-review:${channel}'`),end=ipc.indexOf('\n  });',start);
      const handler=ipc.slice(start,end);
      expect(handler).toContain('dialog.showMessageBox');
      expect(handler.indexOf('dialog.showMessageBox')).toBeLessThan(handler.indexOf('guardedMutation'));
      expect(handler).toContain('confirmation.response!==1');
    }
    expect(preload).toContain("ipcRenderer.invoke('convergence-review:simulate')");
    expect(panel).toContain('La simulation est sans écriture.');
    expect(panel).toContain('Préparer les brouillons Catalogue');
    expect(panel).toContain('Préparer {review.contract.counts.draftsToCreate} brouillons contractuels');
    const decisionStart=ipc.indexOf("ipcMain.handle('convergence-review:decide-contract-drafts'");
    const decisionHandler=ipc.slice(decisionStart,ipc.indexOf('\n  });',decisionStart));
    expect(decisionHandler).toContain('dialog.showMessageBox');
    expect(decisionHandler).toContain('ne publie aucune clause');
    expect(preload).toContain("ipcRenderer.invoke('convergence-review:decide-contract-drafts'");
    expect(panel).toContain('Marquer prêtes à soumettre');
    expect(panel).toContain('Note de décision obligatoire');
    expect(panel).toContain('!note.trim()');
    expect(panel).toContain('Historique des décisions');
    const service=readFileSync('src/main/commercial/ConvergenceReviewService.ts','utf8');
    expect(service).toContain('Une note de décision est obligatoire.');
    expect(service).toContain('INSERT INTO contract_convergence_decision_events');
    expect(service).toContain('SELECT decision,reviewer,note,created_at FROM contract_convergence_decision_events');
    const migration=readFileSync('src/main/database/contractConvergenceDecisionHistoryMigration.ts','utf8');
    expect(migration).toContain('id: 78');
    expect(migration).toContain('CREATE TABLE contract_convergence_decision_events');
  });
});
