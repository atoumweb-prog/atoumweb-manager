import type { Migration } from './migrations';

const literal = (value: unknown): string => value == null ? 'NULL' : typeof value === 'number' ? String(value) : `'${String(value).replace(/'/g, "''")}'`;
const ecommerceTerms = '30 % à la commande ; 40 % après validation structure/design ; 30 % avant mise en ligne. Hébergement et nom de domaine offerts pendant 1 an. Les options contenu fourni (+39 €) et rédaction AtoumWeb (+99 €) sont alternatives pour une même page.';
const simpleProduct = 'Une référence, un prix principal, sans déclinaison obligatoire ni configuration complexe. Nom, description, prix, image principale, petite galerie, catégorie, SKU, stock simple, poids et dimensions fournis par le commerçant.';
type Seed = [string, string, 'offer' | 'service', string, number | null, string?, string[]?, string?];
const seeds: Seed[] = [
  ['vitrine', 'Site vitrine', 'offer', 'Web', 69900],
  ['landing', 'Landing page', 'offer', 'Web', 49900],
  ['ecommerce', 'E-commerce', 'offer', 'E-commerce', 149000, 'starting_from', ['Hébergement offert 1 an', 'Nom de domaine offert 1 an', '3 pages commerciales dont Accueil obligatoire', 'Pages techniques WooCommerce et pages légales hors quota', 'CGV fournies par le commerçant puis intégrées', 'Jusqu’à 10 produits simples inclus', simpleProduct, 'Jusqu’à 2 moyens de paiement standards : Stripe, PayPal, virement, chèque ou paiement à la livraison si pertinent', 'Livraison simple : tarif fixe, gratuité au seuil, retrait sur place, zones simples'], ecommerceTerms],
  ['mariage-essentiel', 'Mariage Essentiel', 'offer', 'Mariage', 39900],
  ['mariage-grand-jour', 'Mariage Grand Jour', 'offer', 'Mariage', 64900],
  ['mariage-histoire', 'Mariage Histoire', 'offer', 'Mariage', 89900],
  ['applications', 'Applications & outils métier sur mesure', 'offer', 'Applications', 149000, 'starting_from'],
  ['wordpress', 'Gestion WordPress', 'service', 'Maintenance', 4900, 'monthly'],
  ['woocommerce', 'Gestion WooCommerce', 'service', 'Maintenance', 9900, 'monthly'],
  ['audit', 'Audit / reprise site tiers', 'service', 'Maintenance', 14900],
  ['pack10', 'Forfait 10 h', 'offer', 'Maintenance', 69000],
  ['pack20', 'Forfait 20 h', 'offer', 'Maintenance', 129000],
  ['pack30', 'Forfait 30 h', 'offer', 'Maintenance', 189000],
  ['migration', 'Migration', 'service', 'Maintenance', null],
  ['remise', 'Remise en état', 'service', 'Maintenance', null, 'quote_only', [], 'Forfait d’heures ou devis selon diagnostic.'],
  ['page', 'Création d’une page', 'service', 'Contenu', 9900],
  ['reecriture', 'Réécriture', 'service', 'Contenu', 7900],
  ['article', 'Article essentiel', 'service', 'Contenu', 9900],
  ['article-seo', 'Article SEO', 'service', 'Contenu', 14900],
  ['articles4', 'Pack 4 articles SEO', 'offer', 'Contenu', 54900],
  ['livre-blanc', 'Livre blanc', 'service', 'Contenu', null],
  ['produits11', 'Produits simples supplémentaires — 11 à 20', 'service', 'E-commerce', 1900, 'fixed', [simpleProduct]],
  ['produits21', 'Produits simples supplémentaires — 21 à 50', 'service', 'E-commerce', 1700, 'fixed', [simpleProduct]],
  ['produits51', 'Produits simples supplémentaires — 51 à 100', 'service', 'E-commerce', 1500, 'fixed', [simpleProduct]],
  ['produits100', 'Plus de 100 produits', 'service', 'E-commerce', null],
  ['variable-simple', 'Produit variable simple', 'service', 'E-commerce', 2900],
  ['variable-inter', 'Produit variable intermédiaire', 'service', 'E-commerce', 4900],
  ['variable-complexe', 'Produit variable complexe', 'service', 'E-commerce', null],
  ['page-eco', 'Page e-commerce supplémentaire', 'service', 'E-commerce', 7900],
  ['contenu-client', 'Intégration texte/images fournis par le client', 'service', 'E-commerce', 3900, 'fixed', [], 'Alternative à la rédaction AtoumWeb pour une même page.'],
  ['redaction', 'Rédaction AtoumWeb par page', 'service', 'E-commerce', 9900, 'fixed', [], 'Alternative à l’intégration du contenu fourni pour une même page.'],
  ['images', 'Recherche d’images', 'service', 'E-commerce', 2900],
  ['paiement', 'Paiement avancé', 'service', 'E-commerce', null],
  ['livraison', 'Livraison avancée', 'service', 'E-commerce', null, 'quote_only', ['Transporteur connecté, point relais, API, étiquettes, calcul dynamique et règles complexes : sur devis']],
  ['import', 'Import / automatisation gros catalogue CSV ou XLSX', 'service', 'E-commerce', null, 'quote_only', ['Nettoyage des données, mapping des colonnes, produits, images si possible, catégories, stocks et synchronisation éventuelle : sur devis']],
  ['seo', 'SEO / visibilité', 'service', 'Visibilité', null],
  ['identite', 'Identité visuelle', 'service', 'Création', null],
  ['photos', 'Retouche photos', 'service', 'Création', null],
  ['contenu', 'Création de contenu', 'service', 'Contenu', null],
  ['dev', 'Développement sur mesure', 'service', 'Applications', null],
  ['mariage', 'Création de site mariage', 'service', 'Mariage', null],
  ['boutique', 'Création de boutique WooCommerce', 'service', 'E-commerce', null],
  ['web', 'Conception et réalisation web', 'service', 'Web', null],
  ['support', 'Support et maintenance', 'service', 'Maintenance', null],
];
const stamp = "'2026-09-14T00:00:00.000Z'";
const seedSql = seeds.map(([key, name, type, category, price, mode, inclusions, terms]) => `
  INSERT INTO catalog_items (id,item_type,name,category,status,visible_public,created_at,updated_at)
  VALUES (${literal('atoumweb-' + key)},${literal(type)},${literal(name)},${literal(category)},'active',0,${stamp},${stamp});
  INSERT INTO catalog_versions (id,item_id,version_number,status,description,inclusions_json,price_mode,price_cents,default_deposit_percent,special_terms,published_at,created_at)
  VALUES (${literal('atoumweb-' + key + '-v1')},${literal('atoumweb-' + key)},1,'published',${literal(name)},${literal(JSON.stringify(inclusions ?? []))},${literal(mode ?? (price == null ? 'quote_only' : 'fixed'))},${literal(price)},${key === 'ecommerce' ? 30 : 'NULL'},${literal(terms)},${stamp},${stamp});
`).join('\n');
const components: Array<[string, string, number]> = [['vitrine','web',1000],['landing','web',1000],['ecommerce','boutique',1000],['mariage-essentiel','mariage',1000],['mariage-grand-jour','mariage',1000],['mariage-histoire','mariage',1000],['applications','dev',1000],['pack10','support',10000],['pack20','support',20000],['pack30','support',30000],['articles4','article-seo',4000]];

export const STABILISATION_MIGRATION: Migration = {
  id: 18, name: 'stabilisation_catalogue_besoins_demo', sql: `
    ALTER TABLE catalog_versions ADD COLUMN special_terms TEXT;
    CREATE TABLE crm_needs (
      id TEXT PRIMARY KEY, prospect_id TEXT REFERENCES prospects(id), client_account_id TEXT REFERENCES client_accounts(id),
      catalog_item_id TEXT REFERENCES catalog_items(id), other_text TEXT, created_at TEXT NOT NULL,
      CHECK (prospect_id IS NOT NULL OR client_account_id IS NOT NULL),
      CHECK ((catalog_item_id IS NOT NULL AND other_text IS NULL) OR (catalog_item_id IS NULL AND length(trim(other_text))>0))
    ) STRICT;
    CREATE INDEX idx_crm_needs_prospect ON crm_needs(prospect_id);
    CREATE INDEX idx_crm_needs_client ON crm_needs(client_account_id);
    CREATE TRIGGER link_prospect_needs AFTER UPDATE OF client_account_id ON prospects
    WHEN NEW.client_account_id IS NOT NULL BEGIN
      UPDATE crm_needs SET client_account_id=NEW.client_account_id WHERE prospect_id=NEW.id;
    END;
    CREATE TABLE demo_batches (id TEXT PRIMARY KEY, label TEXT NOT NULL, created_at TEXT NOT NULL) STRICT;
    CREATE TABLE demo_records (table_name TEXT NOT NULL, record_id TEXT NOT NULL, batch_id TEXT NOT NULL REFERENCES demo_batches(id), PRIMARY KEY(table_name,record_id)) STRICT;
    CREATE TABLE demo_context (id INTEGER PRIMARY KEY CHECK(id=1), batch_id TEXT REFERENCES demo_batches(id)) STRICT;
    INSERT INTO demo_context VALUES (1,NULL);
    ${seedSql}
    ${components.map(([offer, service, quantity]) => `INSERT INTO offer_components (id,offer_version_id,service_version_id,is_optional,quantity_milli,sort_order,created_at) VALUES (${literal('atoumweb-component-' + offer)},${literal('atoumweb-' + offer + '-v1')},${literal('atoumweb-' + service + '-v1')},0,${quantity},0,${stamp});`).join('\n')}
  `,
};
