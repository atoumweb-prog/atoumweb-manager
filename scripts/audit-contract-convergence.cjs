const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const duplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const countBy = (values) => values.reduce((result, value) => {
  result[value] = (result[value] ?? 0) + 1;
  return result;
}, {});

function auditContractConvergence() {
  const proposalsPath = 'docs/ux-v2/bibliotheque-humaine-118-20261025/PROPOSITIONS.json';
  const contractsPath = 'data/handoff/2026-10-27/contrats-publies.json';
  const catalogPath = 'data/handoff/2026-10-27/catalogue.json';
  const canonicalCatalogPath = 'data/catalogue/atoumweb-catalogue-v1.json';
  const proposalsDocument = readJson(proposalsPath);
  const proposals = proposalsDocument.clauses;
  const contracts = readJson(contractsPath).tables;
  const catalog = readJson(catalogPath).tables;
  const canonicalCatalog = readJson(canonicalCatalogPath);
  const canonicalByCode = new Map(canonicalCatalog.records.map((record) => [record.canonicalCode, record]));

  const templatesByCode = new Map(contracts.contract_clause_templates.map((template) => [template.code, template]));
  const versionsById = new Map(contracts.contract_clause_versions.map((version) => [version.id, version]));
  const proposalByCode = new Map(proposals.map((proposal) => [proposal.code, proposal]));
  const catalogItemsById = new Map(catalog.catalog_items.map((item) => [item.id, item]));

  const originMismatches = [];
  for (const proposal of proposals) {
    const template = templatesByCode.get(proposal.code);
    const version = template ? versionsById.get(template.current_version_id) : null;
    if (!template || !version) {
      originMismatches.push({ code: proposal.code, fields: ['missingPublishedOrigin'] });
      continue;
    }
    const comparisons = {
      templateId: [proposal.origin.templateId, template.id],
      versionId: [proposal.origin.versionId, version.id],
      currentVersionId: [proposal.origin.currentVersionId, template.current_version_id],
      version: [proposal.origin.version, version.version_number],
      versionStatus: [proposal.origin.versionStatus, version.status],
      templateStatus: [proposal.origin.templateStatus, template.status],
      title: [proposal.origin.title, template.title],
      scope: [proposal.origin.scope, template.scope],
      audience: [proposal.origin.audience, template.audience],
      body: [proposal.origin.body, version.body],
      sourceBodySHA256: [proposal.sourceBodySHA256, sha256(version.body)],
    };
    const fields = Object.entries(comparisons)
      .filter(([, [expected, actual]]) => expected !== actual)
      .map(([field]) => field);
    if (fields.length) originMismatches.push({ code: proposal.code, fields });
  }

  const dependencyEdges = proposals.flatMap((proposal) =>
    (proposal.dependenciesToReview ?? []).map((dependency) => ({ code: proposal.code, dependency })),
  );
  const catalogRows = catalog.catalog_versions.map((version) => ({
    ...version,
    item: catalogItemsById.get(version.item_id),
  }));
  const publishedByCanonicalCode = new Map(
    catalogRows
      .filter((row) => row.status === 'published' && row.item?.canonical_code)
      .map((row) => [row.item.canonical_code, row]),
  );
  const legacyPublished = catalogRows.filter((row) => row.status === 'published' && !row.item?.canonical_code);
  const legacyByName = new Map(legacyPublished.map((row) => [row.item?.name, row]));

  const commercialConflicts = [];
  const monthlyWp = canonicalByCode.get('AW-MAINT-WP-M');
  const monthlyWoo = canonicalByCode.get('AW-MAINT-WC-M');
  const isolatedHosting = publishedByCanonicalCode.get('AW-TECH-HEBERG-WP');
  const migration = publishedByCanonicalCode.get('AW-TECH-MIGRATION-AW');
  if (!monthlyWp || monthlyWp.version.priceCents !== 4900 || !monthlyWoo || monthlyWoo.version.priceCents !== 9900) {
    commercialConflicts.push({
      code: 'MAINTENANCE-MONTHLY-MISSING',
      severity: 'blocking',
      detail: 'Les références canoniques mensuelles 49 €/99 € ne sont pas retrouvées avec leurs montants attendus.',
    });
  } else if (monthlyWp.version.unit !== 'mois' || monthlyWp.version.periodicity !== 'mensuelle'
    || monthlyWoo.version.unit !== 'mois' || monthlyWoo.version.periodicity !== 'mensuelle') {
    commercialConflicts.push({
      code: 'MAINTENANCE-MONTHLY-STRUCTURE',
      severity: 'blocking',
      detail: 'Les références mensuelles existent, mais leur unité ou leur périodicité canonique est incohérente.',
      references: ['AW-MAINT-WP-M', 'AW-MAINT-WC-M'],
    });
  }
  if (isolatedHosting?.price_cents !== 14900) {
    commercialConflicts.push({
      code: 'HOSTING-LUNE-PRICE',
      severity: 'blocking',
      detail: `L’hébergement WordPress publié vaut ${isolatedHosting?.price_cents == null ? 'inconnu' : isolatedHosting.price_cents / 100 + ' €'} au lieu de la formule décidée à 149 €/an (99 € + 50 € de Lune).`,
      references: ['AW-TECH-HEBERG-WP'],
    });
  }
  if (migration?.price_cents === 9900) {
    commercialConflicts.push({
      code: 'MIGRATION-INTERNAL-EXTERNAL',
      severity: 'blocking',
      detail: 'La ligne publiée « Migration vers hébergement AtoumWeb » à 99 € ne distingue pas le transfert interne AtoumWeb gratuit de la migration depuis un hébergeur externe sur devis.',
      references: ['AW-TECH-MIGRATION-AW'],
    });
  }

  const structural = {
    proposals: proposals.length,
    uniqueProposalCodes: new Set(proposals.map((proposal) => proposal.code)).size,
    duplicateProposalCodes: duplicates(proposals.map((proposal) => proposal.code)),
    publishedTemplates: contracts.contract_clause_templates.length,
    uniquePublishedCodes: new Set(contracts.contract_clause_templates.map((template) => template.code)).size,
    duplicatePublishedCodes: duplicates(contracts.contract_clause_templates.map((template) => template.code)),
    missingInPublishedExport: proposals.filter((proposal) => !templatesByCode.has(proposal.code)).map((proposal) => proposal.code),
    missingInProposals: contracts.contract_clause_templates.filter((template) => !proposalByCode.has(template.code)).map((template) => template.code),
    originMismatches,
    dependencyEdges: dependencyEdges.length,
    missingDependencies: dependencyEdges.filter(({ dependency }) => !proposalByCode.has(dependency)),
    selfDependencies: dependencyEdges.filter(({ code, dependency }) => code === dependency),
    titleChanges: proposals
      .filter((proposal) => proposal.proposedTitle && proposal.proposedTitle !== proposal.origin.title)
      .map((proposal) => ({ code: proposal.code, from: proposal.origin.title, to: proposal.proposedTitle })),
    publicationFlags: {
      approved: proposals.filter((proposal) => proposal.approval).length,
      published: proposals.filter((proposal) => proposal.publication).length,
      adopted: proposals.filter((proposal) => proposal.adoption).length,
    },
    distributions: {
      scope: countBy(proposals.map((proposal) => proposal.origin.scope)),
      audience: countBy(proposals.map((proposal) => proposal.origin.audience)),
      family: countBy(proposals.map((proposal) => proposal.family)),
    },
  };
  const structuralErrors = [
    structural.proposals !== 118 && 'Le registre ne contient pas 118 propositions.',
    structural.uniqueProposalCodes !== 118 && 'Les codes des propositions ne sont pas uniques.',
    structural.publishedTemplates !== 118 && 'L’export ne contient pas 118 clauses publiées.',
    structural.uniquePublishedCodes !== 118 && 'Les codes publiés ne sont pas uniques.',
    structural.missingInPublishedExport.length && 'Des propositions ne correspondent à aucune clause publiée.',
    structural.missingInProposals.length && 'Des clauses publiées ne possèdent aucune proposition.',
    structural.originMismatches.length && 'Les origines figées des propositions ne correspondent plus à l’export publié.',
    structural.missingDependencies.length && 'Des dépendances désignent des clauses absentes.',
    structural.selfDependencies.length && 'Des clauses dépendent d’elles-mêmes.',
    Object.values(structural.publicationFlags).some(Boolean) && 'Une proposition documentaire est marquée approuvée, publiée ou adoptée.',
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    sources: { proposalsPath, contractsPath, catalogPath, canonicalCatalogPath },
    structural,
    structuralErrors,
    commercialConflicts,
    draftPreparationBlockers: [
      ...commercialConflicts.map((conflict) => conflict.code),
      ...structural.titleChanges.map((change) => `VERSIONED-TITLE:${change.code}`),
    ],
    safeToPrepareAllDrafts: structuralErrors.length === 0 && commercialConflicts.length === 0 && structural.titleChanges.length === 0,
  };
}

if (require.main === module) {
  const result = auditContractConvergence();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.structuralErrors.length) process.exitCode = 1;
}

module.exports = { auditContractConvergence };
