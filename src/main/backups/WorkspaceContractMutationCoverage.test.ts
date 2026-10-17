import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';

// This test audits handler registration text. It is NOT a functional Electron
// integration test or a complete inventory of mutating routes.
const source = readFileSync(join(process.cwd(), 'src/main/ipc.ts'), 'utf8');
const starts = [...source.matchAll(/ipcMain\.handle\('([^']+)'/g)].map(match => ({
  route: match[1], at: match.index!,
}));
function handler(name: string): string {
  const matches = starts.filter(item => item.route === name);
  if(matches.length !== 1) throw Error('EC04: missing/duplicate IPC route '+name);
  const start=matches[0].at;
  const next=starts.find(item => item.at > start);
  return source.slice(start, next?.at ?? source.length);
}

const guardedQuoteWrites = [
  'contract-types:create','contract-types:create-version','contract-types:update-draft',
  'contract-types:publish','contract-types:status','contract-types:set-catalog',
  'contract-types:initialize','contract-terms:section:propose','contract-terms:section:approve',
  'contract-terms:library:create','contract-terms:library:create-version','contract-terms:library:publish-version',
  'contract-terms:library:set-status','contract-terms:library:set-audience','contract-terms:library:set-catalog-links',
  'contract-terms:quotes:propose-update','contract-terms:quotes:sync','contract-terms:quotes:add-custom',
  'contract-terms:quotes:update-clause','contract-terms:quotes:reset-clause',
  'contract-terms:quotes:remove-custom','contract-terms:quotes:reorder',
  'quote-preparation:save','quote-preparation:save-administration','quote-preparation:record-acceptance',
  'quotes:set-line-parameters','quotes:assign-operational-target','quotes:create-with-lines','quotes:create',
  'quotes:add-catalog-line','quotes:select-offer-option','quotes:deselect-offer-option',
  'quotes:add-custom-line','quotes:update-line','quotes:remove-line','quotes:update-conditions',
  'quotes:resume-draft','quotes:mark-sent','quotes:principle-agreement:confirm',
  'quotes:principle-agreement:revoke','quotes:finalize','quotes:extend-validity',
  'quotes:mark-viewed','quotes:accept','quotes:refuse','quotes:expire','quotes:duplicate',
  'quotes:commercial-revision','quotes:update-abby-reference',
  'billing:change-status','billing:update-invoice-metadata',
  'quote-preparation:attach','quote-preparation:import-document',
  'quotes:import-contract-document','quotes:generate-pdf','contract-terms:word:approve',
];

describe('EC04 source guard: quote and contract IPC mutations', () => {
  it('requires an EC04 mutation boundary on each explicitly enumerated writer', () => {
    for (const name of guardedQuoteWrites) {
      expect(handler(name), name).toContain('guardedMutation(');
    }
  });
  it('keeps EC03 viewing and preparation reads separate from writes', () => {
    for (const name of ['contract-terms:quotes:get','contract-terms:preview-reference',
      'contract-terms:quotes:presentation','quote-preparation:get',
      'quotes:preparation-issues','quotes:transmission-state','quotes:get']) {
      // The contract presentation route is named contract-terms:quotes:presentation,
      // which must remain a read-only API; no implicit attestation here.
      // Preparation may backfill a legacy DOCUMENT hash via openLinked;
      // gating that auxiliary write never authorizes a contract transition.
      if(name==='quote-preparation:get')expect(handler(name),name).toContain('guardedMutation(');
      else expect(handler(name), name).not.toContain('guardedMutation(');
      expect(handler(name),name).not.toMatch(/\.(markSent|accept|finalize|save)\(/);
    }
  });
  it('keeps attested sending, acceptance and PDF export as distinct routes', () => {
    const sent=handler('quotes:mark-sent'), accepted=handler('quotes:accept');
    const exported=handler('quotes:generate-pdf');
    expect(sent).toContain('database.quotes.markSent(id,input)');
    expect(accepted).toContain('database.quotes.accept(id)');
    expect(exported).toContain('generateQuotePdf(');
    expect(exported).not.toContain('database.quotes.markSent(');
    expect(exported).not.toContain('database.quotes.accept(');
  });
  it('revalidates the current accepted PDF identity after the chooser', () => {
    const source = handler('quotes:import-contract-document');
    expect(source).toContain('current.contractDocumentId !== quote.contractDocumentId');
    expect(source).toContain('currentClientId !== clientId');
    expect(source.indexOf('return guardedMutation(')).toBeLessThan(source.indexOf('clientDocuments.importPaths('));
  });
  it('validates a Word review after EC04 pause before modifying the clause draft', () => {
    const source = handler('contract-terms:word:approve');
    expect(source.indexOf('guardedMutation(')).toBeLessThan(source.indexOf('wordSessions.get(sessionId)'));
    expect(source).toContain('database.contractTerms.createReviewedWordDraft(');
  });
});
