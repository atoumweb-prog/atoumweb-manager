import { BrowserWindow } from 'electron';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { QuoteDetail } from '../../shared/commercial';
import type { ContractPresentation } from '../../shared/contractPresentation';
import { buildQuoteHtml, quotePageHeader, quotePageFooter } from '../../shared/quoteDocumentHtml';
import type { WorkspacePaths } from '../workspace';
export { buildQuoteHtml } from '../../shared/quoteDocumentHtml';

export interface QuotePdfResult { path: string; fileName: string }

export async function renderQuotePdfBuffer(quote:QuoteDetail,presentation?:ContractPresentation):Promise<Buffer>{
 if(!quote.lines.length)throw Error('Impossible de générer le PDF d’un devis vide.');
 const window=new BrowserWindow({show:false,width:900,height:1200,webPreferences:{sandbox:true}});
 try{await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buildQuoteHtml(quote,presentation))}`);
 await window.webContents.executeJavaScript('Promise.all([document.fonts.ready,...Array.from(document.images,i=>i.decode())])');
 return await window.webContents.printToPDF({pageSize:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:quotePageHeader(quote,presentation),footerTemplate:quotePageFooter(quote,presentation)});
 }finally{if(!window.isDestroyed())window.destroy();}
}
export async function generateQuotePdf(quote: QuoteDetail, workspace: WorkspacePaths, presentation?: ContractPresentation): Promise<QuotePdfResult> {
 const directory=join(workspace.exportsDirectory,'devis');mkdirSync(directory,{recursive:true});
 const fileName=`${quote.number}.pdf`,destination=join(directory,fileName);
 writeFileSync(destination,await renderQuotePdfBuffer(quote,presentation));return {path:destination,fileName};
}
