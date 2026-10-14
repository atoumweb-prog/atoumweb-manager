import { describe, expect, it } from 'vitest';
import { MIGRATIONS } from './migrations';

/**
 * 04F — Safety gate for stacked lot integrations.
 * A duplicate migration ID can silently skip a distinct schema change because
 * schema_migrations is keyed by ID. Verify the final registry, not just MAX(id).
 */
describe('04F — migration registry convergence guard', () => {
  it('keeps every migration ID and name unique, in strictly ascending order', () => {
    const ids = MIGRATIONS.map(migration => migration.id);
    const names = MIGRATIONS.map(migration => migration.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    expect(ids.every((id, index) => Number.isSafeInteger(id) && id > 0 &&
      (index === 0 || id > ids[index - 1]))).toBe(true);
  });

  it('keeps catalogue categories before version recommendations with stable identities', () => {
    const categories = MIGRATIONS.find(migration => migration.name === 'catalog_category_registry_v1');
    const recommendations = MIGRATIONS.find(migration => migration.name === 'catalog_version_recommendations_v1');
    expect(categories?.id).toBe(67);
    expect(recommendations?.id).toBe(68);
    expect(categories!.id).toBeLessThan(recommendations!.id);
    expect(categories!.sql).toContain('CREATE TABLE catalog_categories');
    expect(recommendations!.sql).toContain('CREATE TABLE catalog_version_recommendations');
  });
});
