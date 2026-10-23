import { BrowserWindow } from 'electron';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { QuoteDetail } from '../../shared/commercial';
import type { ContractPresentation } from '../../shared/contractPresentation';
import { buildQuoteHtml, quotePageHeader, quotePageFooter } from '../../shared/quoteDocumentHtml';
import type { WorkspacePaths } from '../workspace';
export { buildQuoteHtml } from '../../shared/quoteDocumentHtml';

export interface QuotePdfResult { path: string; fileName: string }

export async function generateQuotePdf(quote: QuoteDetail, workspace: WorkspacePaths, presentation?: ContractPresentation): Promise<QuotePdfResult> {
  if (!quote.lines.length) throw new Error('Impossible de générer le PDF d’un devis vide.');
  const directory = join(workspace.exportsDirectory, 'devis');
  mkdirSync(directory, {recursive: true});
  const fileName = `${quote.number}.pdf`, destination = join(directory, fileName);
  const window = new BrowserWindow({show: false, width: 900, height: 1200, webPreferences: {sandbox: true}});
  try {
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buildQuoteHtml(quote, presentation))}`);
    await window.webContents.executeJavaScript('Promise.all([document.fonts.ready,...Array.from(document.images,i=>i.decode())])');
    const pdf = await window.webContents.printToPDF({pageSize: 'A4', printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true, headerTemplate: quotePageHeader(quote), footerTemplate: quotePageFooter(quote, presentation)});
    writeFileSync(destination, pdf);
    return {path: destination, fileName};
  } finally { if (!window.isDestroyed()) window.destroy(); }
}
