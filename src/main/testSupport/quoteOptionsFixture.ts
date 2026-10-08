// Synthetic records only. Caller must use an in-memory database or a temporary copy.
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import { CatalogService } from '../commercial/CatalogService';
import { ContractTermsService } from '../commercial/ContractTermsService';
import { CrmService } from '../crm/CrmService';
import { QuoteService } from '../commercial/QuoteService';

export function quoteOptionsFixture(db: DatabaseAdapter) {
  const catalog = new CatalogService(db), terms = new ContractTermsService(db), crm = new CrmService(db);
  const quotes = new QuoteService(db, crm, terms);
  const services = ['BASE', 'PAGE', 'SEO'].map((suffix, index) => {
    const item = catalog.create({ type: 'service', name: `Fixture Lot 6 ${suffix}`,
      canonicalCode: `AW-TEST-L6-${suffix}`, identityProvenance: { reference: 'Fixture synthétique Lot 6' } },
    { priceMode: 'fixed', priceCents: (index + 1) * 1000, prerequisites: [`Prérequis fixture ${suffix}`] });
    catalog.publishVersion(item.versions[0].id);
    return catalog.getItem(item.id);
  });
  const offer = catalog.create({ type: 'offer', name: 'Offre synthétique Lot 6',
    canonicalCode: 'AW-TEST-L6-OFFRE', identityProvenance: { reference: 'Fixture synthétique Lot 6' } },
  { priceMode: 'fixed', priceCents: 10000 });
  catalog.setOfferComponents(offer.versions[0].id, services.map((service, index) => ({
    serviceVersionId: service.currentVersion!.id, isOptional: index > 0, quantityMilli: 1000,
  })));
  catalog.publishVersion(offer.versions[0].id);
  const clauses = ['BASE', 'PAGE', 'SHARED'].map((suffix) => {
    const clause = terms.createTemplate({ code: `TEST-L6-${suffix}`, title: `Fixture ${suffix}`, scope: 'catalog' },
      { body: `Clause de test ${suffix}, sans usage commercial réel.` });
    terms.publishVersion(clause.versions[0].id);
    terms.setCatalogLinks(clause.id, suffix === 'BASE' ? [services[0].id] : suffix === 'PAGE'
      ? [services[1].id] : [services[1].id, services[2].id]);
    return terms.getTemplate(clause.id);
  });
  const organization = crm.createOrganization({ name: 'Organisation synthétique Lot 6' });
  const prospect = crm.createProspect({ organizationId: organization.id, primaryNeed: 'Test isolé' });
  const components = catalog.listOfferComponents(offer.versions[0].id);
  const createQuote = (subject = 'Devis synthétique Lot 6') => {
    const quote = quotes.create({ prospectId: prospect.id, subject });
    quotes.addCatalogLine(quote.id, offer.versions[0].id);
    terms.syncQuote(quote.id);
    return quotes.get(quote.id);
  };
  return { catalog, terms, crm, quotes, offer: catalog.getItem(offer.id), services, components, clauses, createQuote };
}
