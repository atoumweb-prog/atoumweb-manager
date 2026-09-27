import { BrowserWindow } from 'electron';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { QuoteDetail, QuoteLine } from '../../shared/commercial';
import type { WorkspacePaths } from '../workspace';

export interface QuotePdfResult {
  path: string;
  fileName: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function date(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function offerComponents(line: QuoteLine): Array<Record<string, unknown>> {
  const value = line.snapshot?.offerComponents;
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : [];
}

function listHtml(values: string[]): string {
  if (values.length === 0) return '';
  return `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function lineHtml(line: QuoteLine): string {
  const components = offerComponents(line);
  const included = components.filter((component) => !component.isOptional);
  const optional = components.filter((component) => Boolean(component.isOptional));
  const inclusions = stringList(line.snapshot?.inclusions);

  return `
    <section class="line">
      <div class="line-main">
        <div>
          <h3>${escapeHtml(line.label)}</h3>
          ${line.description ? `<p>${escapeHtml(line.description)}</p>` : ''}
          ${listHtml(inclusions)}
          ${included.length ? `
            <div class="offer-block">
              <strong>Comprend</strong>
              <ul>${included.map((component) => {
                const quantityMilli = Number(component.quantityMilli ?? 1000);
                const quantity = quantityMilli !== 1000 ? ` × ${(quantityMilli / 1000).toLocaleString('fr-FR')}` : '';
                return `<li>${escapeHtml(component.serviceName)}${quantity}</li>`;
              }).join('')}</ul>
            </div>` : ''}
          ${optional.length ? `
            <div class="offer-block optional">
              <strong>Options prévues dans l’offre</strong>
              <ul>${optional.map((component) => `<li>${escapeHtml(component.serviceName)}</li>`).join('')}</ul>
            </div>` : ''}
        </div>
        <div class="line-price">
          <span>${((line.quantityMilli ?? 1000) / 1000).toLocaleString('fr-FR')} ×</span>
          <b>${escapeHtml(money(line.contractLineValueCents))}</b>
        </div>
      </div>
    </section>`;
}

function buildQuoteHtml(quote: QuoteDetail): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(quote.number)}</title>
<style>
  @page { size: A4; margin: 13mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #172330; font-size: 10pt; line-height: 1.45; }
  header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 18px; border-bottom: 2px solid #a47b3d; }
  .brand { color: #9d7538; font-size: 19pt; font-weight: 900; letter-spacing: .08em; }
  .tagline { display: block; margin-top: 4px; color: #70767c; font-size: 8pt; }
  .meta { display: grid; justify-items: end; gap: 2px; text-align: right; }
  .meta h1 { margin: 0; font-size: 22pt; }
  .recipient { padding: 20px 0 14px; }
  .recipient > span { color: #7c8288; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; }
  .recipient h2 { margin: 10px 0 4px; font-size: 18pt; }
  .recipient p { margin: 4px 0; color: #575e65; }
  .lines { display: grid; gap: 8px; }
  .line { break-inside: avoid; padding: 11px; border: 1px solid #ddd8cf; border-radius: 7px; }
  .line-main { display: grid; grid-template-columns: 1fr auto; gap: 18px; }
  .line h3 { margin: 0 0 4px; font-size: 11pt; }
  .line p { margin: 3px 0; color: #5f666d; font-size: 8.5pt; }
  .line ul { margin: 5px 0 0; padding-left: 18px; color: #4f565d; font-size: 8.5pt; }
  .line-price { display: grid; align-content: start; justify-items: end; min-width: 88px; }
  .line-price span { color: #7d8287; font-size: 8pt; }
  .line-price b { font-size: 11pt; white-space: nowrap; }
  .offer-block { margin-top: 7px; padding-top: 6px; border-top: 1px dashed #ddd6cb; }
  .offer-block strong { color: #94703a; font-size: 7.5pt; text-transform: uppercase; }
  .offer-block.optional { opacity: .78; }
  .totals { width: 290px; margin: 18px 0 18px auto; border-top: 2px solid #a47b3d; }
  .totals div { display: flex; justify-content: space-between; gap: 14px; padding: 6px 0; border-bottom: 1px solid #e2ddd5; }
  .totals span { color: #666d73; font-size: 8.5pt; }
  .totals strong { font-size: 9.5pt; }
  .totals div:first-child strong { color: #9d7538; font-size: 14pt; }
  .conditions { break-inside: avoid; margin-top: 16px; padding-top: 12px; border-top: 1px solid #ddd8cf; }
  .conditions h2 { margin: 0 0 7px; font-size: 12pt; }
  .condition { display: grid; grid-template-columns: 120px 1fr; gap: 12px; padding: 5px 0; border-bottom: 1px solid #eeeae4; }
  .condition span { color: #777d82; font-size: 8pt; }
  .condition strong, .condition p { margin: 0; font-size: 8.5pt; }
  footer { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 9px; border-top: 1px solid #ddd8cf; color: #777d82; font-size: 8pt; }
  footer strong { color: #9d7538; }
</style>
</head>
<body>
  <header>
    <div><div class="brand">ATOUMWEB</div><span class="tagline">À chacun son site. Parlez-nous du vôtre.</span></div>
    <div class="meta"><h1>DEVIS</h1><strong>${escapeHtml(quote.number)}</strong><span>Créé le ${escapeHtml(date(quote.createdAt))}</span><span>Valable jusqu’au ${escapeHtml(date(quote.validUntil))}</span></div>
  </header>
  <section class="recipient">
    <span>Destinataire</span><br /><strong>${escapeHtml(quote.ownerLabel)}</strong>
    <h2>${escapeHtml(quote.subject)}</h2>
    ${quote.needSummary ? `<p>${escapeHtml(quote.needSummary)}</p>` : ''}
  </section>
  <main class="lines">${quote.lines.map(lineHtml).join('')}</main>
  <section class="totals">
    <div><span>Total</span><strong>${escapeHtml(money(quote.contractValueCents))}</strong></div>
    <div><span>Acompte (${quote.depositPercent ?? 0} %)</span><strong>${escapeHtml(money(quote.depositCents))}</strong></div>
    <div><span>Solde</span><strong>${escapeHtml(money(quote.balanceCents))}</strong></div>
  </section>
  <section class="conditions">
    <h2>Conditions</h2>
    <div class="condition"><span>Délai estimé</span><strong>${escapeHtml(quote.estimatedDelay || 'À définir ensemble')}</strong></div>
    ${quote.prerequisitesText ? `<div class="condition"><span>Prérequis</span><p>${escapeHtml(quote.prerequisitesText)}</p></div>` : ''}
    ${quote.contractTextSnapshot ? `<div class="condition"><span>CGV</span><p>${escapeHtml(quote.contractTextSnapshot).replace(/\n/g, '<br />')}</p></div>` : quote.specialTerms ? `<div class="condition"><span>Conditions particulières</span><p>${escapeHtml(quote.specialTerms)}</p></div>` : ''}
  </section>
  <footer><strong>AtoumWeb</strong><span>www.atoumweb.fr</span></footer>
</body>
</html>`;
}

export async function generateQuotePdf(quote: QuoteDetail, workspace: WorkspacePaths): Promise<QuotePdfResult> {
  if (quote.lines.length === 0) throw new Error('Impossible de générer le PDF d’un devis vide.');

  const directory = join(workspace.exportsDirectory, 'devis');
  mkdirSync(directory, { recursive: true });
  const fileName = `${quote.number}.pdf`;
  const destination = join(directory, fileName);

  const window = new BrowserWindow({
    show: false,
    width: 900,
    height: 1200,
    webPreferences: { sandbox: true },
  });

  try {
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buildQuoteHtml(quote))}`);
    const pdf = await window.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });
    writeFileSync(destination, pdf);
    return { path: destination, fileName };
  } finally {
    if (!window.isDestroyed()) window.destroy();
  }
}
