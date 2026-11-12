import { BrowserWindow } from 'electron';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dataAgreementModelDocument, type DataAgreementModelContext } from '../../shared/dataAgreementModel';
import type { QuotePdfResult } from './quotePdf';
import type { WorkspacePaths } from '../workspace';

/** PDF autonome du modèle d'accord RGPD (pour information, non signable) : même texte que l'annexe du devis. */
export async function renderDataAgreementModelPdfBuffer(context: DataAgreementModelContext): Promise<Buffer> {
  const window = new BrowserWindow({ show: false, width: 900, height: 1200, webPreferences: { sandbox: true } });
  try {
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(dataAgreementModelDocument(context))}`);
    return await window.webContents.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally { if (!window.isDestroyed()) window.destroy(); }
}

export async function generateDataAgreementModelPdf(context: DataAgreementModelContext, workspace: WorkspacePaths): Promise<QuotePdfResult> {
  const directory = join(workspace.exportsDirectory, 'devis'); mkdirSync(directory, { recursive: true });
  const fileName = `${context.quoteNumber ?? 'Modele'}-modele-accord-rgpd.pdf`, destination = join(directory, fileName);
  writeFileSync(destination, await renderDataAgreementModelPdfBuffer(context));
  return { path: destination, fileName };
}
