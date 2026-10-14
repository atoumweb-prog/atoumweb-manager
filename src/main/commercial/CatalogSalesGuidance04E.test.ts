import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';
import { salesGuidanceFromCatalogVersion } from '../../shared/catalogSalesGuidance';

let db: NodeSqliteAdapter;
let catalog: CatalogService;
beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(db);
  catalog = new CatalogService(db);
});
afterEach(() => db.close());

describe('04E — objections humaines versionnées dans le Catalogue SQLite', () => {
  it('conserve les objections publiées quand une nouvelle version est préparée', () => {
    const item = catalog.create({type:'service',name:'Site vitrine'},{
      priceMode:'fixed',priceCents:69900,
      commercialParameters:{clientNeed:'Présence web', benefits:'Être trouvé', objections:'Budget : expliquer le périmètre'},
      internalAdvice:'Demander les contenus au client',
    });
    const previousId = item.versions[0].id;
    catalog.publishVersion(previousId);
    const next = catalog.createVersion(item.id,{
      priceMode:'fixed',priceCents:79900,
      commercialParameters:{clientNeed:'Présence web', benefits:'Être trouvé', objections:'Budget : proposer un phasage'},
    });
    const detail = catalog.getItem(item.id);
    const previous = detail.versions.find(v=>v.id===previousId)!;
    expect(salesGuidanceFromCatalogVersion(previous).objections).toBe('Budget : expliquer le périmètre');
    expect(salesGuidanceFromCatalogVersion(next).objections).toBe('Budget : proposer un phasage');
    expect(detail.currentVersion?.id).toBe(previousId);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });
  it('refuse un brouillon obsolète sans supprimer les objections plus récentes', () => {
    const item=catalog.create({type:'service',name:'Maintenance WP'},{
      priceMode:'monthly',priceCents:4900,commercialParameters:{objections:'Pourquoi un abonnement ?'},
    });
    const initial=item.versions[0];
    catalog.saveDraftVersion(initial.id,initial,{
      priceMode:'monthly',priceCents:4900,commercialParameters:{objections:'Expliquer les mises à jour'},
    });
    expect(()=>catalog.saveDraftVersion(initial.id,initial,{
      priceMode:'monthly',priceCents:4900,commercialParameters:{objections:'Texte périmé'},
    })).toThrow(/Conflit/);
    expect(catalog.getItem(item.id).versions[0].commercialParameters?.objections).toBe('Expliquer les mises à jour');
  });
});
