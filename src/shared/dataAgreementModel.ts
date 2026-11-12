import model from '../../data/contracts/atoumweb-rgpd-v3.json';

/**
 * Modèle d'accord de protection des données (version retenue par AtoumWeb, V3, 1er novembre 2026), remis au client avec le devis
 * pour information. Ce n'est PAS l'accord du site : il n'est jamais rattaché à un site à ce stade, n'est pas signable, et le texte source
 * reste celui du fichier `data/contracts/atoumweb-rgpd-v3.json` (empreinte conservée, aucune modification).
 * L'accord réel se prépare pour chaque site (fiches A et B) et se signe avant la première opération sur des données personnelles.
 */
export const DATA_AGREEMENT_MODEL_NOTICE = 'Modèle pour information, non signable à ce stade. L’accord se complète pour chaque site (fiches A et B) et se signe avant la première opération sur des données personnelles.';

type Block = { type: 'paragraph'; style: string; text: string } | { type: 'table'; rows: string[][] };
export interface DataAgreementModelContext { clientName?: string | null; quoteNumber?: string | null }

const h = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Remplit seulement ce que le devis connaît avec certitude : le client et la référence. Le reste (site, date) reste à renseigner. */
function fill(text: string, ctx: DataAgreementModelContext): string {
  let out = text;
  if (ctx.clientName?.trim()) out = out.replace('[Nom / raison sociale]', ctx.clientName.trim());
  if (ctx.quoteNumber?.trim()) out = out.replace('[référence]', ctx.quoteNumber.trim());
  return out;
}

function blockHtml(block: Block, ctx: DataAgreementModelContext): string {
  if (block.type === 'table') {
    return `<table>${block.rows.map(([label, value]) => `<tr><th>${h(fill(label ?? '', ctx))}</th><td>${h(fill(value ?? '', ctx)).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;
  }
  const text = h(fill(block.text, ctx)).replace(/\n/g, '<br>');
  if (block.style === 'Title') return `<h1>${text}</h1>`;
  if (block.style === 'Heading1') return `<h2>${text}</h2>`;
  if (block.style === 'SmallNote') return `<p class="small">${text}</p>`;
  return `<p>${text}</p>`;
}

const STYLES = `.dpa{font-size:9.5pt;line-height:1.45}.dpa h1{font-size:19pt;margin:0 0 4px}.dpa h2{font-size:11.5pt;margin:14px 0 4px;break-after:avoid;page-break-after:avoid}
  .dpa p{margin:0 0 6px}.dpa .small{font-size:8pt;color:#555e67}.dpa table{width:100%;border-collapse:collapse;margin:8px 0 10px;font-size:9pt}
  .dpa th{width:26%;text-align:left;vertical-align:top;background:#f3f4f6;padding:6px 8px;border:1px solid #d8dde1}.dpa td{padding:6px 8px;border:1px solid #d8dde1;vertical-align:top}
  .dpa tr{break-inside:avoid;page-break-inside:avoid}.dpa-notice{background:#fff8cf;border-left:4px solid #d4ae00;padding:8px 12px;margin:0 0 14px;font-size:9pt}`;

/** Corps du modèle : titre, notice « pour information », les onze articles et les fiches A et B vierges. */
export function dataAgreementModelBodyHtml(ctx: DataAgreementModelContext = {}): string {
  return `<div class="dpa"><div class="dpa-notice"><strong>MODÈLE POUR INFORMATION</strong> · ${h(DATA_AGREEMENT_MODEL_NOTICE)}</div>${(model.blocks as Block[]).map(b => blockHtml(b, ctx)).join('')}</div>`;
}

/** Annexe jointe au PDF du devis (nouvelle page). */
export function dataAgreementModelAnnexHtml(ctx: DataAgreementModelContext = {}): string {
  return `<section class="dpa-annex" style="break-before:page;page-break-before:always"><style>${STYLES}</style>${ctx.quoteNumber ? `<span style="font-size:8pt;color:#5d656f;text-transform:uppercase;letter-spacing:1px">Annexe au devis ${h(ctx.quoteNumber)}</span>` : ''}${dataAgreementModelBodyHtml(ctx)}</section>`;
}

/** Document autonome (bouton « Éditer le modèle d'accord RGPD »). */
export function dataAgreementModelDocument(ctx: DataAgreementModelContext = {}): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Modèle d’accord RGPD</title><style>@page{size:A4;margin:16mm 14mm 18mm}body{margin:0;color:#171b20;font-family:Arial,Helvetica,sans-serif}${STYLES}</style></head><body>${dataAgreementModelBodyHtml(ctx)}</body></html>`;
}
