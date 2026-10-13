import { OperationalSalesTargetService } from '../operations/OperationalSalesTargetService';
import { OperationalSalesService } from '../operations/OperationalSalesService';
import { CommercialRulesService } from './CommercialRulesService';
import type { CommercialVersionRules } from '../../shared/commercialRules';
import { emptyContractParameters, withContractAudience } from '../../shared/quoteContractPreparation';
import { QuoteContractPreparationService } from './QuoteContractPreparationService';
import type { ProjectCommercialService } from '../projects/ProjectCommercialService';
import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import type { CrmService } from '../crm/CrmService';
import { ContractTermsService } from './ContractTermsService';
import {
  QUOTE_ADJUSTMENT_MODES,
  QUOTE_DISCOUNT_REASONS,
  QUOTE_STATUSES,
  type QuoteDetail,
  type QuoteFilters,
  type QuoteInput,
  type QuoteLine,
  type QuoteLineInput,
  type QuoteStatus,
  type QuoteSummary,
} from '../../shared/commercial';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface QuoteRow extends Record<string, unknown> {
  id: string;
  quote_number: string;
  prospect_id: string | null;
  client_account_id: string | null;
  accepted_client_account_id: string | null;
  subject: string;
  need_summary: string | null;
  status: QuoteStatus;
  validity_days: number | null;
  valid_until: string | null;
  estimated_delay: string | null;
  prerequisites_text: string | null;
  special_terms: string | null;
  contract_type: string | null;
  deposit_percent: number | null;
  catalog_value_cents: number;
  discount_value_cents: number;
  contract_value_cents: number;
  deposit_cents: number;
  balance_cents: number;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  refused_at: string | null;
  expired_at: string | null;
  snapshot_locked_at: string | null;
  project_ready_at: string | null;
  finalized_at: string | null;
  last_extended_at: string | null;
  contract_text_snapshot: string | null;
  contract_snapshot_json: string | null;
  contract_compiled_at: string | null;
  contract_audience: 'professional' | 'consumer' | null;
  contract_document_id: string | null;
  contract_document_attached_at: string | null;
  abby_reference: string | null;
  created_at: string;
  updated_at: string;
}

interface QuoteLineRow extends Record<string, unknown> {
  id: string;
  quote_id: string;
  sort_order: number;
  source: 'catalog' | 'custom';
  catalog_item_id: string | null;
  catalog_version_id: string | null;
  label: string;
  description: string | null;
  quantity_milli: number;
  catalog_unit_price_cents: number | null;
  proposed_unit_price_cents: number | null;
  adjustment_mode: QuoteLine['adjustmentMode'];
  adjustment_value: number | null;
  discount_reason_code: QuoteLine['discountReasonCode'] | null;
  discount_reason_text: string | null;
  catalog_line_value_cents: number;
  contract_line_value_cents: number;
  snapshot_json: string | null;
  created_at: string;
  updated_at: string;
}

interface CatalogIdentitySnapshotRow extends Record<string, unknown> {
  canonical_code: string | null;
  identity_provenance_json: string | null;
  commercial_kind: string | null;
  family_code: string | null;
  abby_label: string | null;
  unit: string | null;
  periodicity: string | null;
  price_basis: string;
  provenance_json: string | null;
}

interface CatalogSnapshotRow extends CatalogIdentitySnapshotRow {
  commercial_parameters_json: string | null;
  version_id: string;
  item_id: string;
  item_name: string;
  item_type: string;
  version_number: number;
  version_status: string;
  item_status: string;
  description: string | null;
  inclusions_json: string;
  exclusions_json: string;
  prerequisites_json: string;
  price_mode: string;
  price_cents: number | null;
  special_terms: string | null;
  default_deposit_percent: number | null;
  contract_type: string | null;
}

interface OfferComponentSnapshotRow extends CatalogIdentitySnapshotRow {
  commercial_parameters_json: string|null;
  component_id: string;
  service_version_id: string;
  service_item_id: string;
  service_name: string;
  service_version_number: number;
  description: string | null;
  inclusions_json: string;
  exclusions_json: string;
  prerequisites_json: string;
  price_mode: string;
  price_cents: number | null;
  special_terms: string | null;
  contract_type: string | null;
  is_optional: number;
  quantity_milli: number;
  sort_order: number;
}

export class QuoteService {
  private projectLifecycle?: ProjectCommercialService;
  setProjectLifecycle(lifecycle: ProjectCommercialService): void { this.projectLifecycle = lifecycle; }
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly crm: CrmService,
    private readonly contractTerms: ContractTermsService = new ContractTermsService(database),
    private readonly preparation: QuoteContractPreparationService = new QuoteContractPreparationService(database),
  ) {}

  setLineParameters(lineId:string,parameters:import('../../shared/commercialRules').QuoteLineParameters):QuoteDetail {
    new CommercialRulesService(this.database).setParameters(lineId,parameters);
    const row=this.database.get<{quote_id:string}>('SELECT quote_id FROM quote_lines WHERE id=?',[lineId])!;
    return this.get(row.quote_id);
  }
  preparationIssues(id:string):string[] {
    const quote=this.get(id);
    return [...new CommercialRulesService(this.database).issues(quote),...new OperationalSalesService(this.database).issues(quote)];
  }
  assignOperationalTarget(id:string,input:{projectId:string;siteId?:string|null;contextNodeId?:string|null;author:string}):void {new OperationalSalesTargetService(this.database).assign(id,input);}
  operationalSalesForClient(clientId:string):Record<string,unknown>[] {return this.database.all(`SELECT s.*,i.canonical_code,l.label FROM operational_sales s JOIN quote_lines l ON l.id=s.quote_line_id JOIN catalog_versions v ON v.id=s.catalog_version_id JOIN catalog_items i ON i.id=v.item_id WHERE s.client_account_id=?`,[clientId]);}
  operationalSales(id:string):Record<string,unknown>[] {return new OperationalSalesService(this.database).list(id);}

  list(filters: QuoteFilters = {}): QuoteSummary[] {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (filters.status) { where.push('status=?'); params.push(filters.status); }
    if (clean(filters.prospectId)) { where.push('prospect_id=?'); params.push(clean(filters.prospectId) as string); }
    if (clean(filters.clientAccountId)) {
      where.push('(client_account_id=? OR accepted_client_account_id=?)');
      params.push(clean(filters.clientAccountId) as string, clean(filters.clientAccountId) as string);
    }

    let rows = this.database.all<QuoteRow>(
      `SELECT * FROM quotes ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC`,
      params,
    ).map((row) => this.mapSummary(row));

    const search = clean(filters.search)?.toLocaleLowerCase('fr-FR');
    if (search) {
      rows = rows.filter((quote) => [quote.number, quote.subject, quote.ownerLabel]
        .some((value) => value.toLocaleLowerCase('fr-FR').includes(search)));
    }
    return rows;
  }

  get(id: string): QuoteDetail {
    const row = this.database.get<QuoteRow>('SELECT * FROM quotes WHERE id=?', [id]);
    if (!row) throw new Error('Devis introuvable.');
    const lines = this.database
      .all<QuoteLineRow>('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY sort_order, created_at', [id])
      .map((line) => ({...this.mapLine(line), parameters:new CommercialRulesService(this.database).parameters(line.id)}));
    return {
      ...this.mapSummary(row),
      needSummary: row.need_summary,
      estimatedDelay: row.estimated_delay,
      prerequisitesText: row.prerequisites_text,
      specialTerms: row.special_terms,
      contractType: row.contract_type,
      contractAudience: row.contract_audience,
      contractTextSnapshot: row.contract_text_snapshot,
      contractSnapshotJson: row.contract_snapshot_json,
      initialPaymentQualification: this.preparation.parameters(id)?.initialPayment.qualification ?? null,
      lines,
    };
  }

  create(input: QuoteInput, withinTransaction = false): QuoteDetail {
    this.validateOwner(input.prospectId, input.clientAccountId);
    const subject = clean(input.subject);
    if (!subject) throw new Error('L’objet du devis est requis.');
    const validityDays = input.validityDays ?? 30;
    if (!Number.isInteger(validityDays) || validityDays <= 0) throw new Error('Durée de validité invalide.');
    const depositPercent = input.depositPercent ?? 30;
    if (!Number.isInteger(depositPercent) || depositPercent < 0 || depositPercent > 100) throw new Error('Acompte invalide.');
    const contractAudience = input.contractAudience ?? this.inferContractAudience(input.prospectId, input.clientAccountId);
    if (!['professional', 'consumer'].includes(contractAudience)) throw new Error('Type de client contractuel invalide.');

    const id = randomUUID();
    const now = new Date();
    const nowString = now.toISOString();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + validityDays);

    if (!withinTransaction) this.database.exec('BEGIN IMMEDIATE;');
    try {
      const number = this.nextQuoteNumber(now.getFullYear(), nowString);
      this.database.run(
        `INSERT INTO quotes (
          id, quote_number, prospect_id, client_account_id, accepted_client_account_id,
          subject, need_summary, status, validity_days, valid_until, estimated_delay,
          prerequisites_text, special_terms, contract_type, contract_audience, deposit_percent,
          catalog_value_cents, discount_value_cents, contract_value_cents, deposit_cents, balance_cents,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, NULL, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, ?)`,
        [
          id,
          number,
          clean(input.prospectId),
          clean(input.clientAccountId),
          subject,
          clean(input.needSummary),
          validityDays,
          validUntil.toISOString(),
          clean(input.estimatedDelay),
          clean(input.prerequisitesText),
          clean(input.specialTerms),
          clean(input.contractType),
          contractAudience,
          depositPercent,
          nowString,
          nowString,
        ],
      );
      this.database.run('UPDATE quotes SET contract_parameters_json=? WHERE id=?',[JSON.stringify(emptyContractParameters(contractAudience,depositPercent)),id]);
      this.writeActivity(id, 'quote_created', `Devis ${number} créé`);
      if (input.prospectId) this.database.run("UPDATE prospects SET stage='quote_to_prepare',updated_at=? WHERE id=? AND stage NOT IN ('new','won','lost')", [nowString, input.prospectId]);
      if (!withinTransaction) this.database.exec('COMMIT;');
    } catch (error) {
      if (!withinTransaction) this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.get(id);
  }

  createWithLines(input: QuoteInput, lines: Array<{ catalogVersionId?: string; input: QuoteLineInput }>): QuoteDetail {
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const quote = this.create(input, true);
      for (const line of lines) {
        if (line.catalogVersionId) this.addCatalogLine(quote.id, line.catalogVersionId, line.input);
        else this.addCustomLine(quote.id, line.input);
      }
      this.database.exec('COMMIT;');
      return this.get(quote.id);
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
  }

  addCatalogLine(quoteId: string, catalogVersionId: string, input: Partial<QuoteLineInput> = {}): QuoteDetail {
    this.assertEditable(quoteId);
    const source = this.database.get<CatalogSnapshotRow>(
      `SELECT v.id AS version_id, v.status AS version_status, i.status AS item_status, i.id AS item_id, i.name AS item_name, i.item_type,
              v.version_number, v.description, v.inclusions_json, v.exclusions_json,
              v.prerequisites_json, v.price_mode, v.price_cents, v.default_deposit_percent,
              v.contract_type, v.special_terms, v.commercial_parameters_json, i.canonical_code, i.identity_provenance_json,
              v.commercial_kind, v.family_code, v.abby_label, v.unit, v.periodicity, v.price_basis, v.provenance_json
       FROM catalog_versions v
       JOIN catalog_items i ON i.id=v.item_id
       WHERE v.id=?`,
      [catalogVersionId],
    );
    if (!source) throw new Error('Version catalogue introuvable.');
    if(source.version_status!=='published'||source.item_status!=='active')throw Error('Seule une version publiée d’une prestation active peut être ajoutée au devis.');

    const proposed = input.proposedUnitPriceCents ?? source.price_cents;
    if (proposed == null && source.price_mode !== 'free') throw new Error('Renseigne un prix proposé pour cette prestation sur devis.');

    const offerComponents = source.item_type === 'offer'
      ? this.database.all<OfferComponentSnapshotRow>(
        `SELECT
          sv.id AS service_version_id,
          si.id AS service_item_id,
          si.name AS service_name,
          sv.version_number AS service_version_number,
          sv.description,
          sv.inclusions_json,
          sv.exclusions_json,
          sv.prerequisites_json,
          sv.price_mode,
          sv.price_cents,
          sv.special_terms,
          sv.contract_type,
          sv.commercial_parameters_json,
          si.canonical_code, si.identity_provenance_json,
          sv.commercial_kind, sv.family_code, sv.abby_label, sv.unit, sv.periodicity, sv.price_basis, sv.provenance_json,
          oc.id AS component_id,
          oc.is_optional,
          oc.quantity_milli,
          oc.sort_order
         FROM offer_components oc
         JOIN catalog_versions sv ON sv.id=oc.service_version_id
         JOIN catalog_items si ON si.id=sv.item_id
         WHERE oc.offer_version_id=?
         ORDER BY oc.sort_order, si.name COLLATE NOCASE`,
        [catalogVersionId],
      ).map((component) => ({
        ...this.catalogIdentitySnapshot(component),
        componentId: component.component_id,
        serviceItemId: component.service_item_id,
        serviceVersionId: component.service_version_id,
        serviceName: component.service_name,
        serviceVersionNumber: Number(component.service_version_number),
        description: component.description,
        inclusions: this.parseJsonList(component.inclusions_json),
        exclusions: this.parseJsonList(component.exclusions_json),
        prerequisites: this.parseJsonList(component.prerequisites_json),
        priceMode: component.price_mode,
        priceCents: component.price_cents,
        specialTerms: component.special_terms,
        contractType: component.contract_type,
        commercialParameters:component.commercial_parameters_json?JSON.parse(component.commercial_parameters_json):null,
        isOptional: Boolean(component.is_optional),
        quantityMilli: Number(component.quantity_milli),
        sortOrder: Number(component.sort_order),
      }))
      : [];

    const operationalLink = this.database.get<Record<string,unknown>>(`SELECT l.id,l.model_version_id,l.provenance_json,m.model_json
      FROM catalog_operational_links l JOIN operational_model_versions m ON m.id=l.model_version_id
      WHERE l.catalog_version_id=? AND l.status='ready' AND m.status='ready' ORDER BY l.revision DESC LIMIT 1`,[source.version_id]);
    const operationalModel = operationalLink ? JSON.parse(String(operationalLink.model_json)) : null;
    const operationsPolicy = operationalLink ? JSON.parse(String(operationalLink.provenance_json)).operations : null;
    const snapshot = {
      ...this.catalogIdentitySnapshot(source),
      itemId: source.item_id,
      itemName: source.item_name,
      itemType: source.item_type,
      versionId: source.version_id,
      versionNumber: source.version_number,
      description: source.description,
      inclusions: this.parseJsonList(source.inclusions_json),
      exclusions: this.parseJsonList(source.exclusions_json),
      prerequisites: this.parseJsonList(source.prerequisites_json),
      priceMode: source.price_mode,
      priceCents: source.price_cents,
      defaultDepositPercent: source.default_deposit_percent,
      contractType: source.contract_type,
      specialTerms: source.special_terms,
      commercialRules: new CommercialRulesService(this.database).rules(source.version_id),
      operational: operationalLink ? {linkId:operationalLink.id,modelVersionId:operationalLink.model_version_id,lot:operationalModel.lot,estimateRequired:operationalModel.estimateRequired,setupEstimateRequired:operationsPolicy?.setupEstimateRequired||false,parentCodes:operationsPolicy?.parentCodes||[],periodAlignment:operationsPolicy?.periodAlignment||null} : null,
      commercialParameters: source.commercial_parameters_json ? JSON.parse(source.commercial_parameters_json) : null,
      offerComponents,
    };

    const current = this.get(quoteId);
    const firstOffer = source.item_type === 'offer' && !current.lines.some((line) => line.snapshot?.itemType === 'offer');
    this.insertLine(quoteId, 'catalog', {
      ...input,
      label: clean(input.label) ?? source.item_name,
      description: input.description ?? source.description,
      catalogUnitPriceCents: source.price_cents ?? proposed ?? 0,
      proposedUnitPriceCents: proposed ?? 0,
    }, source.item_id, source.version_id, snapshot);
    if (firstOffer) {
      this.updateConditions(quoteId, {
        prerequisitesText: current.prerequisitesText,
        contractType: current.contractType || source.contract_type,
      });
    }
    this.recalculate(quoteId);
    return this.get(quoteId);
  }

  selectOfferOption(offerLineId: string, componentId: string, input: Partial<QuoteLineInput> = {}): QuoteDetail {
    const offer = this.getOfferLine(offerLineId);
    this.assertEditable(offer.quoteId);
    const components = offer.snapshot?.offerComponents;
    const component = Array.isArray(components)
      ? components.find((c) => c && c.componentId === componentId && c.isOptional === true)
      : null;
    if (!component || typeof component.serviceVersionId !== 'string') {
      throw Error('Option absente de la composition figée de cette offre. Aucune déduction historique.');
    }
    // Identity is the exact offer line + component, never name or position.
    const existing = this.database.get<{line_id:string}>(
      'SELECT line_id FROM quote_option_purchases WHERE source_offer_line_id=? AND source_component_id=?',
      [offerLineId, componentId],
    );
    if (existing) return this.get(offer.quoteId);
    this.database.exec('SAVEPOINT purchase_option;');
    try {
      const previousIds = new Set(this.get(offer.quoteId).lines.map((line) => line.id));
      const quote = this.addCatalogLine(offer.quoteId, component.serviceVersionId, {
        ...input, quantityMilli: input.quantityMilli ?? Number(component.quantityMilli ?? 1000),
      });
      const line = quote.lines.find((row) => !previousIds.has(row.id))!;
      this.database.run(
        `INSERT INTO quote_option_purchases
        (line_id,source_offer_line_id,source_offer_item_id,source_offer_version_id,source_component_id,state,purchased_at)
        VALUES (?,?,?,?,?,'purchased',?)`,
        [line.id, offer.id, offer.catalogItemId!, offer.catalogVersionId!, componentId, nowIso()],
      );
      this.contractTerms.syncQuote(offer.quoteId);
      this.writeActivity(offer.quoteId, 'quote_option_purchased', `Option achetée : ${line.label}`);
      this.database.exec('RELEASE purchase_option;');
      return this.get(offer.quoteId);
    } catch (error) {
      this.database.exec('ROLLBACK TO purchase_option; RELEASE purchase_option;');
      throw error;
    }
  }

  deselectOfferOption(offerLineId: string, componentId: string): QuoteDetail {
    const offer = this.getOfferLine(offerLineId);
    this.assertEditable(offer.quoteId);
    const row = this.database.get<{line_id:string}>(
      'SELECT line_id FROM quote_option_purchases WHERE source_offer_line_id=? AND source_component_id=?',
      [offerLineId, componentId],
    );
    return row ? this.removeLine(row.line_id) : this.get(offer.quoteId);
  }

  private getOfferLine(id: string): QuoteLine {
    const row = this.database.get<QuoteLineRow>('SELECT * FROM quote_lines WHERE id=?', [id]);
    if (!row) throw Error('Ligne d’offre introuvable.');
    const line = this.mapLine(row);
    if (line.snapshot?.itemType !== 'offer') throw Error('Cette ligne ne correspond pas à une offre.');
    return line;
  }

  private catalogIdentitySnapshot(source: CatalogIdentitySnapshotRow): Record<string, unknown> {
    return {
      canonicalCode: source.canonical_code,
      identityProvenance: source.identity_provenance_json ? JSON.parse(source.identity_provenance_json) : null,
      commercialKind: source.commercial_kind,
      familyCode: source.family_code,
      abbyLabel: source.abby_label,
      unit: source.unit,
      periodicity: source.periodicity,
      priceBasis: source.price_basis,
      provenance: source.provenance_json ? JSON.parse(source.provenance_json) : null,
    };
  }

  addCustomLine(quoteId: string, input: QuoteLineInput): QuoteDetail {
    this.assertEditable(quoteId);
    if (!clean(input.label)) throw new Error('Le libellé de la ligne est requis.');
    this.insertLine(quoteId, 'custom', input, null, null, null);
    this.recalculate(quoteId);
    return this.get(quoteId);
  }

  updateLine(lineId: string, input: QuoteLineInput): QuoteDetail {
    const existing = this.database.get<QuoteLineRow>('SELECT * FROM quote_lines WHERE id=?', [lineId]);
    if (!existing) throw new Error('Ligne de devis introuvable.');
    this.assertEditable(existing.quote_id);
    if (this.mapLine(existing).optionPurchase && input.catalogUnitPriceCents != null
      && input.catalogUnitPriceCents !== existing.catalog_unit_price_cents) {
      throw Error('Le prix catalogue de l’option vendue est figé ; modifie le prix proposé ou la remise.');
    }
    const values = this.calculateLine(this.mapLine(existing).optionPurchase ? { ...input, catalogUnitPriceCents: existing.catalog_unit_price_cents } : input, this.mapLine(existing).snapshot);
    this.database.run(
      `UPDATE quote_lines SET label=?, description=?, quantity_milli=?, catalog_unit_price_cents=?,
       proposed_unit_price_cents=?, adjustment_mode=?, adjustment_value=?, discount_reason_code=?,
       discount_reason_text=?, catalog_line_value_cents=?, contract_line_value_cents=?, updated_at=? WHERE id=?`,
      [
        clean(input.label), clean(input.description), values.quantityMilli, values.catalogUnitPriceCents,
        values.proposedUnitPriceCents, values.adjustmentMode, values.adjustmentValue,
        input.discountReasonCode ?? null, clean(input.discountReasonText), values.catalogLineValueCents,
        values.contractLineValueCents, nowIso(), lineId,
      ],
    );
    this.recalculate(existing.quote_id);
    return this.get(existing.quote_id);
  }

  removeLine(lineId: string): QuoteDetail {
    const existing = this.database.get<{ quote_id: string }>('SELECT quote_id FROM quote_lines WHERE id=?', [lineId]);
    if (!existing) throw new Error('Ligne de devis introuvable.');
    this.assertEditable(existing.quote_id);
    this.database.exec('SAVEPOINT remove_quote_line;');
    try {
      const children = this.database.all<{line_id:string}>(
        'SELECT line_id FROM quote_option_purchases WHERE source_offer_line_id=?', [lineId],
      );
      const removedIds = [...children.map((row) => row.line_id), lineId];
      for (const id of removedIds) {
        this.database.run('DELETE FROM quote_option_purchases WHERE line_id=?', [id]);
        this.database.run('DELETE FROM quote_lines WHERE id=?', [id]);
      }
      const parameters = this.preparation.parameters(existing.quote_id);
      if (parameters) {
        parameters.warranties = parameters.warranties.filter((row) => !removedIds.includes(row.lineId));
        this.database.run('UPDATE quotes SET contract_parameters_json=? WHERE id=?', [JSON.stringify(parameters), existing.quote_id]);
      }
      this.recalculate(existing.quote_id);
      this.contractTerms.syncQuote(existing.quote_id);
      this.writeActivity(existing.quote_id, 'quote_line_removed', 'Ligne et options associées retirées du brouillon');
      this.database.exec('RELEASE remove_quote_line;');
      return this.get(existing.quote_id);
    } catch (error) {
      this.database.exec('ROLLBACK TO remove_quote_line; RELEASE remove_quote_line;');
      throw error;
    }
  }

  updateConditions(quoteId: string, input: Partial<QuoteInput>): QuoteDetail {
    const current = this.get(quoteId);
    this.assertEditable(quoteId);
    const subject = clean(input.subject ?? current.subject);
    if (!subject) throw new Error('L’objet du devis est requis.');
    const depositPercent = input.depositPercent ?? current.depositPercent ?? 30;
    if (!Number.isInteger(depositPercent) || depositPercent < 0 || depositPercent > 100) throw new Error('Acompte invalide.');
    const validityDays = input.validityDays ?? this.daysUntil(current.validUntil) ?? 30;
    const contractAudience = input.contractAudience ?? current.contractAudience ?? this.inferContractAudience(current.prospectId, current.clientAccountId ?? current.acceptedClientAccountId);
    if (!['professional', 'consumer'].includes(contractAudience)) throw new Error('Type de client contractuel invalide.');
    const storedParameters=this.preparation.get(quoteId).parameters;
    if(storedParameters&&input.depositPercent!==undefined&&input.depositPercent!==storedParameters.payment.milestones[0]?.percent) throw Error('Modifie l’échéancier dans la préparation contractuelle ; pas d’acompte divergent.');
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    this.database.run(
      `UPDATE quotes SET subject=?, need_summary=?, validity_days=?, valid_until=?, estimated_delay=?,
       prerequisites_text=?, special_terms=?, contract_type=?, contract_audience=?, deposit_percent=?, updated_at=? WHERE id=?`,
      [subject, clean(input.needSummary ?? current.needSummary), validityDays, validUntil.toISOString(),
        clean(input.estimatedDelay ?? current.estimatedDelay), clean(input.prerequisitesText ?? current.prerequisitesText),
        clean(input.specialTerms ?? current.specialTerms), clean(input.contractType ?? current.contractType),
        contractAudience, depositPercent, nowIso(), quoteId],
    );
    if(storedParameters) this.preparation.save(quoteId,withContractAudience(storedParameters,contractAudience));
    this.recalculate(quoteId);
    return this.get(quoteId);
  }

  markSent(id: string): QuoteDetail {
    const quote = this.get(id);
    if (quote.status !== 'draft') throw new Error('Seul un devis brouillon peut être marqué envoyé.');
    if (!quote.finalizedAt) throw new Error('Finalise le devis avant d’enregistrer son envoi.');
    const result = this.transition(id, 'sent', 'sent_at', 'Devis marqué envoyé');
    if (result.prospectId) this.database.run("UPDATE prospects SET stage='quote_sent',updated_at=? WHERE id=? AND stage NOT IN ('won','lost')", [nowIso(), result.prospectId]);
    return result;
  }

  finalize(id: string): QuoteDetail {
    const quote = this.get(id);
    if (quote.status !== 'draft') throw new Error('Seul un devis brouillon peut être finalisé.');
    if (quote.finalizedAt) return quote;
    if (quote.lines.length === 0) throw new Error('Ajoute au moins une ligne avant de finaliser le devis.');
    this.database.exec('SAVEPOINT quote_finalization;');
    try {
    const lineIssues = [...new CommercialRulesService(this.database).issues(quote), ...new OperationalSalesService(this.database).issues(quote)];
    if (lineIssues.length) throw Error(lineIssues.join('\n'));
    this.contractTerms.freezeQuote(id);
    const now = this.get(id).contractCompiledAt ?? nowIso();
    this.database.run('UPDATE quotes SET finalized_at=?,updated_at=? WHERE id=?', [now, now, id]);
    if (quote.prospectId) this.database.run("UPDATE prospects SET stage='quote_to_send',updated_at=? WHERE id=? AND stage NOT IN ('won','lost')", [now, quote.prospectId]);
    this.writeActivity(id, 'quote_finalized', `Devis ${quote.number} finalisé et prêt à envoyer`);
    this.database.exec('RELEASE quote_finalization;');
    return this.get(id);
    } catch(error) {this.database.exec('ROLLBACK TO quote_finalization; RELEASE quote_finalization;');throw error;}
  }

  /** E73 : seule la révision commerciale courante peut porter un accord actif. */
  private assertCurrentAgreementRevision(quoteId: string): number | null {
    const row = this.database.get<{ current_quote_id: string; revision_number: number }>(
      `SELECT d.current_quote_id, r.revision_number
       FROM commercial_quote_revisions r
       JOIN commercial_project_dossiers d ON d.id=r.dossier_id
       WHERE r.quote_id=?`, [quoteId],
    );
    if (row && row.current_quote_id !== quoteId) {
      throw new Error('Une révision plus récente du devis existe : utiliser le devis commercial courant.');
    }
    return row?.revision_number ?? null;
  }

  private activePrincipleAgreementAt(quoteId: string): string | null {
    const current = this.database.get<{current_quote_id:string}>(
      `SELECT d.current_quote_id FROM commercial_quote_revisions r
       JOIN commercial_project_dossiers d ON d.id=r.dossier_id WHERE r.quote_id=?`, [quoteId],
    );
    if (current && current.current_quote_id !== quoteId) return null;
    const event = this.database.get<{ action: string; created_at: string }>(
      `SELECT action,created_at FROM activity_events
       WHERE entity_type='quote' AND entity_id=?
         AND action IN ('principle_agreement_confirmed','principle_agreement_revoked')
       ORDER BY rowid DESC LIMIT 1`, [quoteId],
    );
    return event?.action === 'principle_agreement_confirmed' ? event.created_at : null;
  }

  private recordPrincipleAgreement(quoteId: string, prospectId: string, action: 'principle_agreement_confirmed' | 'principle_agreement_revoked', revision: number | null): void {
    this.database.run(
      `INSERT INTO activity_events
       (id,entity_type,entity_id,action,summary,metadata_json,prospect_id,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [randomUUID(),'quote',quoteId,action,
        action === 'principle_agreement_confirmed' ? 'Accord de principe confirmé ; signature en attente' : 'Accord de principe annulé',
        JSON.stringify({ quoteId, commercialRevision: revision, kind: 'pre_signature', signatureConfirmed: false }),
        prospectId,nowIso()],
    );
  }

  confirmPrincipleAgreement(id: string): QuoteDetail {
    const quote = this.get(id);
    const revision = this.assertCurrentAgreementRevision(id);
    if (!quote.prospectId || quote.clientAccountId || quote.acceptedClientAccountId) throw new Error('Accord de principe réservé à un Prospect non converti.');
    if (!['sent','viewed'].includes(quote.status)) throw new Error('Le devis doit avoir été envoyé avant de confirmer un accord de principe.');
    if (!quote.lines.length) throw new Error('Un devis vide ne peut pas recevoir d’accord de principe.');
    const prospect = this.database.get<{stage:string;archived_at:string|null;client_account_id:string|null}>(
      'SELECT stage,archived_at,client_account_id FROM prospects WHERE id=?',[quote.prospectId],
    );
    if (!prospect || prospect.archived_at || prospect.client_account_id || ['new','won','lost'].includes(prospect.stage)) {
      throw new Error('Le Prospect doit être actif et non converti pour enregistrer son accord.');
    }
    if (quote.principleAgreementAt) return quote;
    this.recordPrincipleAgreement(id,quote.prospectId,'principle_agreement_confirmed',revision);
    return this.get(id);
  }

  revokePrincipleAgreement(id: string): QuoteDetail {
    const quote = this.get(id);
    const revision = this.assertCurrentAgreementRevision(id);
    if (!quote.prospectId) throw new Error('Le devis n’est pas lié à un Prospect.');
    if (!quote.principleAgreementAt) return quote;
    if (!['sent','viewed'].includes(quote.status)) throw new Error('Un accord déjà signé ou clôturé ne peut plus être annulé ici.');
    this.recordPrincipleAgreement(id,quote.prospectId,'principle_agreement_revoked',revision);
    return this.get(id);
  }

  extendValidity(id: string, validUntil: string): QuoteDetail {
    const quote = this.get(id);
    const date = new Date(validUntil);
    if (!['draft', 'sent', 'viewed'].includes(quote.status)) throw new Error('La validité de ce devis ne peut plus être prolongée.');
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) throw new Error('Choisis une nouvelle date de validité future.');
    const now = nowIso();
    this.database.run('UPDATE quotes SET valid_until=?,last_extended_at=?,updated_at=? WHERE id=?', [date.toISOString(), now, now, id]);
    this.writeActivity(id, 'quote_validity_extended', `Validité du devis ${quote.number} prolongée au ${date.toLocaleDateString('fr-FR')}`);
    return this.get(id);
  }

  markViewed(id: string): QuoteDetail {
    const quote = this.get(id);
    if (!['sent', 'viewed'].includes(quote.status)) throw new Error('Le devis doit être envoyé avant d’être marqué vu.');
    return this.transition(id, 'viewed', 'viewed_at', 'Devis marqué vu');
  }

  accept(id: string): QuoteDetail {
    const quote = this.get(id);
    if (quote.status === 'accepted') return quote;
    if (!['sent', 'viewed'].includes(quote.status)) throw new Error('Le devis doit être envoyé avant acceptation.');
    if (quote.lines.length === 0) throw new Error('Impossible d’accepter un devis vide.');
    this.projectLifecycle?.assertAcceptance(id);
    if (!this.projectLifecycle && this.database.get('SELECT quote_id FROM commercial_quote_revisions WHERE quote_id=?',[id])) throw new Error('Cycle Projet prévisionnel non raccordé.');
    this.database.exec('SAVEPOINT quote_acceptance;');
    try {
    this.preparation.assertAcceptance(id);
    const contract = this.contractTerms.freezeQuote(id);

    let clientId = quote.clientAccountId ?? quote.acceptedClientAccountId ?? null;
    if (!clientId && quote.prospectId) {
      clientId = this.crm.convertProspectToClient(quote.prospectId).clientId;
    }
    if (!clientId) throw new Error('Client introuvable pour ce devis.');

    const now = nowIso();
    this.database.run(
      `UPDATE quotes SET status='accepted', client_account_id=?, accepted_client_account_id=?,
       accepted_at=?, snapshot_locked_at=?, project_ready_at=?, updated_at=? WHERE id=?`,
      [clientId, clientId, now, now, now, now, id],
    );
    if (contract.snapshotState === 'historical_missing') {
      this.writeActivity(id, 'quote_accepted_without_contract_snapshot', `Devis historique ${quote.number} accepté sans snapshot contractuel ; absence conservée, aucune clause reconstruite`);
    }
    this.writeActivity(id, 'quote_accepted', `Devis ${quote.number} accepté`);
    this.projectLifecycle?.accept(id,clientId);
    new OperationalSalesService(this.database).provision(this.get(id));
    this.database.exec('RELEASE quote_acceptance;');
    return this.get(id);
    } catch(error) { this.database.exec('ROLLBACK TO quote_acceptance; RELEASE quote_acceptance;'); throw error; }
  }

  attachContractDocument(id: string, documentId: string, abbyReference?: string | null, replacementReason?: string): QuoteDetail {
    const quote = this.get(id);
    if (quote.status !== 'accepted') throw new Error('Le devis doit être accepté avant de rattacher son document contractuel.');
    const clientId = quote.acceptedClientAccountId ?? quote.clientAccountId;
    if (!clientId) throw new Error('Client introuvable pour ce devis.');
    const document = this.database.get<{ id: string; client_account_id: string; category: string }>(
      'SELECT id,client_account_id,category FROM client_documents WHERE id=?',
      [documentId],
    );
    if (!document || document.client_account_id !== clientId) throw new Error('Le document sélectionné n’appartient pas au client du devis.');
    if (!['contract', 'quote'].includes(document.category)) throw new Error('Le document doit être classé comme contrat ou devis.');

    this.database.exec('SAVEPOINT quote_pdf_attachment');
    try {
      this.preparation.attach(id,{documentId,role:'accepted_pdf',provenance:'PDF accepté rattaché explicitement au devis',replacementReason});
    const now = nowIso();
    this.database.run(
      'UPDATE quotes SET contract_document_id=?,contract_document_attached_at=?,abby_reference=?,updated_at=? WHERE id=?',
      [documentId, now, clean(abbyReference) ?? quote.abbyReference ?? null, now, id],
    );
    this.writeActivity(id, 'quote_contract_document_attached', `Document contractuel rattaché au devis ${quote.number}`);
    this.database.exec('RELEASE quote_pdf_attachment');
    return this.get(id);
    } catch(error) { this.database.exec('ROLLBACK TO quote_pdf_attachment; RELEASE quote_pdf_attachment;'); throw error; }
  }

  updateAbbyReference(id: string, abbyReference?: string | null): QuoteDetail {
    const quote = this.get(id);
    if (quote.status !== 'accepted') throw new Error('La référence Abby est disponible après acceptation du devis.');
    const now = nowIso();
    this.database.run('UPDATE quotes SET abby_reference=?,updated_at=? WHERE id=?', [clean(abbyReference), now, id]);
    this.writeActivity(id, 'quote_abby_reference_updated', `Référence Abby mise à jour pour ${quote.number}`);
    return this.get(id);
  }

  refuse(id: string): QuoteDetail {
    const quote = this.get(id);
    if (!['sent', 'viewed'].includes(quote.status)) throw new Error('Le devis doit être envoyé avant refus.');
    return this.transition(id, 'refused', 'refused_at', 'Devis refusé');
  }

  expire(id: string): QuoteDetail {
    const quote = this.get(id);
    if (!['sent', 'viewed'].includes(quote.status)) throw new Error('Seul un devis envoyé peut expirer.');
    return this.transition(id, 'expired', 'expired_at', 'Devis expiré');
  }

  duplicate(id: string, asCommercialRevision = false): QuoteDetail {
    const source = this.get(id);
    if (!['draft', 'sent', 'viewed', 'refused', 'expired', 'cancelled'].includes(source.status)) throw new Error('Ce devis ne peut pas être dupliqué.');
    this.database.exec('SAVEPOINT duplicate_quote;');
    try {
      const copy = this.create({
        prospectId: source.prospectId,
        clientAccountId: source.clientAccountId ?? source.acceptedClientAccountId,
        subject: `${source.subject} — copie`,
        needSummary: source.needSummary,
        validityDays: 30,
        estimatedDelay: source.estimatedDelay,
        prerequisitesText: source.prerequisitesText,
        specialTerms: source.specialTerms,
        contractType: source.contractType,
        contractAudience: source.contractAudience,
        depositPercent: source.depositPercent,
      }, true);
      const now = nowIso();
      const lineIds = new Map(source.lines.map((line) => [line.id, randomUUID()]));
      for (const line of source.lines) {
        this.database.run(
          `INSERT INTO quote_lines (
            id, quote_id, sort_order, source, catalog_item_id, catalog_version_id, label, description,
            quantity_milli, catalog_unit_price_cents, proposed_unit_price_cents, adjustment_mode,
            adjustment_value, discount_reason_code, discount_reason_text, catalog_line_value_cents,
            contract_line_value_cents, snapshot_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [lineIds.get(line.id)!, copy.id, line.sortOrder, line.source, line.catalogItemId ?? null, line.catalogVersionId ?? null,
            line.label, clean(line.description), line.quantityMilli ?? 1000, line.catalogUnitPriceCents ?? null,
            line.proposedUnitPriceCents ?? null, line.adjustmentMode ?? 'none', line.adjustmentValue ?? null,
            line.discountReasonCode ?? null, clean(line.discountReasonText), line.catalogLineValueCents,
            line.contractLineValueCents, line.snapshot ? JSON.stringify(line.snapshot) : null, now, now],
        );
      }
      for (const line of source.lines) {
        const origin = line.optionPurchase;
        if (!origin) continue;
        this.database.run(
          `INSERT INTO quote_option_purchases
          (line_id,source_offer_line_id,source_offer_item_id,source_offer_version_id,source_component_id,state,purchased_at)
          VALUES (?,?,?,?,?,'purchased',?)`,
          [lineIds.get(line.id)!, lineIds.get(origin.sourceOfferLineId)!, origin.sourceOfferItemId,
            origin.sourceOfferVersionId, origin.sourceComponentId, origin.purchasedAt],
        );
      }
      new CommercialRulesService(this.database).copyParameters(lineIds);
      this.recalculate(copy.id);
      this.contractTerms.copyQuoteCustomizations(id, copy.id, lineIds);
      if (asCommercialRevision) {
        if (!this.projectLifecycle) throw new Error('Cycle Projet prévisionnel non raccordé.');
        this.projectLifecycle.linkRevision(id,copy.id,lineIds);
      }
      this.database.exec('RELEASE duplicate_quote;');
      return this.get(copy.id);
    } catch (error) {
      this.database.exec('ROLLBACK TO duplicate_quote; RELEASE duplicate_quote;');
      throw error;
    }
  }

  private insertLine(
    quoteId: string,
    source: 'catalog' | 'custom',
    input: QuoteLineInput,
    catalogItemId: string | null,
    catalogVersionId: string | null,
    snapshot: Record<string, unknown> | null,
  ): void {
    const label = clean(input.label);
    if (!label) throw new Error('Le libellé de la ligne est requis.');
    if (input.discountReasonCode && !QUOTE_DISCOUNT_REASONS.includes(input.discountReasonCode)) throw new Error('Raison commerciale invalide.');
    const values = this.calculateLine(input, snapshot);
    const order = this.database.get<{ next_order: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM quote_lines WHERE quote_id=?', [quoteId]);
    const now = nowIso();
    this.database.run(
      `INSERT INTO quote_lines (
        id, quote_id, sort_order, source, catalog_item_id, catalog_version_id, label, description,
        quantity_milli, catalog_unit_price_cents, proposed_unit_price_cents, adjustment_mode,
        adjustment_value, discount_reason_code, discount_reason_text, catalog_line_value_cents,
        contract_line_value_cents, snapshot_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), quoteId, Number(order?.next_order ?? 0), source, catalogItemId, catalogVersionId,
        label, clean(input.description), values.quantityMilli, values.catalogUnitPriceCents,
        values.proposedUnitPriceCents, values.adjustmentMode, values.adjustmentValue,
        input.discountReasonCode ?? null, clean(input.discountReasonText), values.catalogLineValueCents,
        values.contractLineValueCents, snapshot ? JSON.stringify(snapshot) : null, now, now],
    );
  }

  private calculateLine(input: QuoteLineInput, snapshot?: Record<string, unknown> | null): {
    quantityMilli: number;
    catalogUnitPriceCents: number;
    proposedUnitPriceCents: number;
    adjustmentMode: QuoteLine['adjustmentMode'];
    adjustmentValue: number | null;
    catalogLineValueCents: number;
    contractLineValueCents: number;
  } {
    const quantityMilli = input.quantityMilli ?? 1000;
    if (!Number.isInteger(quantityMilli) || quantityMilli <= 0) throw new Error('Quantité invalide.');
    const catalogUnit = input.catalogUnitPriceCents ?? input.proposedUnitPriceCents ?? 0;
    const proposedUnit = input.proposedUnitPriceCents ?? catalogUnit;
    if (!Number.isInteger(catalogUnit) || catalogUnit < 0 || !Number.isInteger(proposedUnit) || proposedUnit < 0) throw new Error('Prix invalide.');
    const mode = input.adjustmentMode ?? 'none';
    if (!QUOTE_ADJUSTMENT_MODES.includes(mode)) throw new Error('Mode de remise invalide.');
    const adjustment = input.adjustmentValue ?? null;
    const minimum = (snapshot?.commercialRules as CommercialVersionRules | undefined)?.minimumLineCents ?? 0;
    const catalogTotal = Math.max(minimum, Math.round((catalogUnit * Math.max(quantityMilli,(snapshot?.commercialRules as CommercialVersionRules | undefined)?.minimumBilledQuantityMilli??quantityMilli)) / 1000));
    const proposedTotal = Math.max(minimum, Math.round((proposedUnit * Math.max(quantityMilli,(snapshot?.commercialRules as CommercialVersionRules | undefined)?.minimumBilledQuantityMilli??quantityMilli)) / 1000));
    let contractTotal = proposedTotal;

    if (mode === 'percent') {
      const basisPoints = adjustment ?? 0;
      if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) throw new Error('Pourcentage de remise invalide.');
      contractTotal = Math.max(0, Math.round(proposedTotal * (10000 - basisPoints) / 10000));
    } else if (mode === 'fixed_amount') {
      const amount = adjustment ?? 0;
      if (!Number.isInteger(amount) || amount < 0) throw new Error('Montant de remise invalide.');
      contractTotal = Math.max(0, proposedTotal - amount);
    } else if (mode === 'override_price') {
      if (adjustment == null || !Number.isInteger(adjustment) || adjustment < 0) throw new Error('Prix imposé invalide.');
      contractTotal = adjustment;
    } else if (mode === 'free') {
      contractTotal = 0;
    }

    return {
      quantityMilli,
      catalogUnitPriceCents: catalogUnit,
      proposedUnitPriceCents: proposedUnit,
      adjustmentMode: mode,
      adjustmentValue: adjustment,
      catalogLineValueCents: catalogTotal,
      contractLineValueCents: contractTotal,
    };
  }

  private recalculate(quoteId: string): void {
    const quote = this.database.get<QuoteRow>('SELECT * FROM quotes WHERE id=?', [quoteId]);
    if (!quote) throw new Error('Devis introuvable.');
    const totals = this.database.get<{ catalog_total: number; contract_total: number }>(
      `SELECT COALESCE(SUM(catalog_line_value_cents), 0) AS catalog_total,
              COALESCE(SUM(contract_line_value_cents), 0) AS contract_total
       FROM quote_lines WHERE quote_id=?`,
      [quoteId],
    );
    const catalog = Number(totals?.catalog_total ?? 0);
    const contract = Number(totals?.contract_total ?? 0);
    const discount = Math.max(0, catalog - contract);
    const depositPercent = quote.deposit_percent ?? 0;
    const deposit = Math.round(contract * depositPercent / 100);
    const balance = Math.max(0, contract - deposit);
    this.database.run(
      `UPDATE quotes SET catalog_value_cents=?, discount_value_cents=?, contract_value_cents=?,
       deposit_cents=?, balance_cents=?, updated_at=? WHERE id=?`,
      [catalog, discount, contract, deposit, balance, nowIso(), quoteId],
    );
  }

  private assertEditable(quoteId: string): void {
    const quote = this.get(quoteId);
    if (quote.snapshotLockedAt || quote.status === 'accepted') throw new Error('Ce devis est accepté et figé.');
    if (quote.status !== 'draft') throw new Error('Repasse par une copie du devis pour modifier son contenu après envoi.');
    if (quote.finalizedAt || quote.contractCompiledAt || quote.contractTextSnapshot != null || quote.contractSnapshotJson != null) throw new Error('Ce devis est finalisé et figé. Duplique-le pour modifier son contenu.');
  }

  private transition(id: string, status: QuoteStatus, timestampColumn: 'sent_at' | 'viewed_at' | 'refused_at' | 'expired_at', summary: string): QuoteDetail {
    if (!QUOTE_STATUSES.includes(status)) throw new Error('Statut devis invalide.');
    const now = nowIso();
    this.database.run(`UPDATE quotes SET status=?, ${timestampColumn}=?, updated_at=? WHERE id=?`, [status, now, now, id]);
    this.writeActivity(id, `quote_${status}`, summary);
    return this.get(id);
  }

  private inferContractAudience(prospectId?: string | null, clientId?: string | null): 'professional' | 'consumer' {
    const client = clean(clientId);
    if (client) {
      const row = this.database.get<{ organization_id: string | null }>('SELECT organization_id FROM client_accounts WHERE id=?', [client]);
      return row?.organization_id ? 'professional' : 'consumer';
    }
    const prospect = clean(prospectId);
    if (prospect) {
      const row = this.database.get<{ organization_id: string | null }>('SELECT organization_id FROM prospects WHERE id=?', [prospect]);
      return row?.organization_id ? 'professional' : 'consumer';
    }
    return 'consumer';
  }

  private validateOwner(prospectId?: string | null, clientId?: string | null): void {
    const prospect = clean(prospectId);
    const client = clean(clientId);
    if (!prospect && !client) throw new Error('Choisis un Prospect ou un Client.');
    if (prospect && !this.database.get<{ id: string }>('SELECT id FROM prospects WHERE id=?', [prospect])) throw new Error('Prospect introuvable.');
    if (client && !this.database.get<{ id: string }>('SELECT id FROM client_accounts WHERE id=?', [client])) throw new Error('Client introuvable.');
  }

  private nextQuoteNumber(year: number, now: string): string {
    const row = this.database.get<{ current_value: number }>('SELECT current_value FROM number_sequences WHERE sequence_key=? AND sequence_year=?', ['quote', year]);
    const next = Number(row?.current_value ?? 0) + 1;
    this.database.run(
      `INSERT INTO number_sequences (sequence_key, sequence_year, current_value, updated_at)
       VALUES ('quote', ?, ?, ?)
       ON CONFLICT(sequence_key, sequence_year) DO UPDATE SET current_value=excluded.current_value, updated_at=excluded.updated_at`,
      [year, next, now],
    );
    return `DEV-${year}-${String(next).padStart(3, '0')}`;
  }

  private mapSummary(row: QuoteRow): QuoteSummary {
    return {
      projectId: this.projectLifecycle?.findProject(row.id) ?? row.project_id as string | null,
      principleAgreementAt: ['sent', 'viewed'].includes(row.status) ? this.activePrincipleAgreementAt(row.id) : null,
      id: row.id,
      number: row.quote_number,
      prospectId: row.prospect_id,
      clientAccountId: row.client_account_id,
      acceptedClientAccountId: row.accepted_client_account_id,
      ownerLabel: this.ownerLabel(row.prospect_id, row.client_account_id ?? row.accepted_client_account_id),
      subject: row.subject,
      status: row.status,
      catalogValueCents: Number(row.catalog_value_cents),
      discountValueCents: Number(row.discount_value_cents),
      contractValueCents: Number(row.contract_value_cents),
      depositPercent: row.deposit_percent,
      depositCents: Number(row.deposit_cents),
      balanceCents: Number(row.balance_cents),
      validUntil: row.valid_until,
      sentAt: row.sent_at,
      viewedAt: row.viewed_at,
      acceptedAt: row.accepted_at,
      refusedAt: row.refused_at,
      expiredAt: row.expired_at,
      snapshotLockedAt: row.snapshot_locked_at,
      projectReadyAt: row.project_ready_at,
      finalizedAt: row.finalized_at,
      lastExtendedAt: row.last_extended_at,
      contractCompiledAt: row.contract_compiled_at,
      contractDocumentId: row.contract_document_id,
      contractDocumentAttachedAt: row.contract_document_attached_at,
      abbyReference: row.abby_reference,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapLine(row: QuoteLineRow): QuoteLine {
    let snapshot: Record<string, unknown> | null = null;
    if (row.snapshot_json) {
      try { snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>; } catch { snapshot = null; }
    }
    const purchase = this.database.get<{
      source_offer_line_id:string;source_offer_item_id:string;source_offer_version_id:string;
      source_component_id:string;purchased_at:string;
    }>('SELECT * FROM quote_option_purchases WHERE line_id=?', [row.id]);
    return {
      optionPurchase: purchase ? {
        state: 'purchased', sourceOfferLineId: purchase.source_offer_line_id,
        sourceOfferItemId: purchase.source_offer_item_id, sourceOfferVersionId: purchase.source_offer_version_id,
        sourceComponentId: purchase.source_component_id, purchasedAt: purchase.purchased_at,
      } : null,
      id: row.id,
      quoteId: row.quote_id,
      sortOrder: Number(row.sort_order),
      source: row.source,
      catalogItemId: row.catalog_item_id,
      catalogVersionId: row.catalog_version_id,
      label: row.label,
      description: row.description,
      quantityMilli: Number(row.quantity_milli),
      catalogUnitPriceCents: row.catalog_unit_price_cents,
      proposedUnitPriceCents: row.proposed_unit_price_cents,
      adjustmentMode: row.adjustment_mode,
      adjustmentValue: row.adjustment_value,
      discountReasonCode: row.discount_reason_code,
      discountReasonText: row.discount_reason_text,
      catalogLineValueCents: Number(row.catalog_line_value_cents),
      contractLineValueCents: Number(row.contract_line_value_cents),
      snapshot,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private ownerLabel(prospectId: string | null, clientId: string | null): string {
    if (clientId) {
      const row = this.database.get<{ label: string }>(
        `SELECT COALESCE(o.name, trim(c.first_name || ' ' || c.last_name), 'Client') AS label
         FROM client_accounts ca
         LEFT JOIN organizations o ON o.id=ca.organization_id
         LEFT JOIN contacts c ON c.id=ca.primary_contact_id
         WHERE ca.id=?`, [clientId]);
      if (row?.label) return row.label;
    }
    if (prospectId) {
      const row = this.database.get<{ label: string }>(
        `SELECT COALESCE(o.name, trim(c.first_name || ' ' || c.last_name), 'Prospect') AS label
         FROM prospects p
         LEFT JOIN organizations o ON o.id=p.organization_id
         LEFT JOIN contacts c ON c.id=p.contact_id
         WHERE p.id=?`, [prospectId]);
      if (row?.label) return row.label;
    }
    return 'Sans destinataire';
  }

  private parseJsonList(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch { return []; }
  }

  private daysUntil(value?: string | null): number | null {
    if (!value) return null;
    const target = new Date(value).getTime();
    if (!Number.isFinite(target)) return null;
    return Math.max(1, Math.ceil((target - Date.now()) / 86400000));
  }

  private writeActivity(quoteId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type, entity_id, action, summary, metadata_json, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
      ['quote', quoteId, action, summary, nowIso()],
    );
  }
}
