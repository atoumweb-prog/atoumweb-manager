import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { AtoumPackService } from './AtoumPackService';

describe('AtoumPackService V0.2', () => {
  it('importe les trois packs de référence de manière idempotente et extrait leurs contrats', () => {
    const root = mkdtempSync(join(tmpdir(), 'atoum-pack-v02-'));
    const workspace = createWorkspacePaths(root);
    mkdirSync(workspace.packagesDirectory, { recursive: true });
    mkdirSync(workspace.contractTemplatesDirectory, { recursive: true });
    const database = new NodeSqliteAdapter(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    try {
      applyPendingMigrations(database);
      const service = new AtoumPackService(database, workspace, process.cwd());
      const first = service.bootstrapBuiltins();
      expect(first).toHaveLength(3);
      expect(service.list()).toHaveLength(3);

      const second = service.bootstrapBuiltins();
      expect(second).toHaveLength(3);
      expect(service.list()).toHaveLength(3);
      expect(database.get<{ count: number }>('SELECT COUNT(*) AS count FROM atoum_packages')?.count).toBe(3);

      const vitrine = database.get<Record<string, unknown>>(
        `SELECT v.price_mode,v.price_cents FROM atoum_portable_refs r
         JOIN catalog_versions v ON v.id=r.local_version_id
         WHERE r.portable_ref='catalog.offer.site-vitrine' LIMIT 1`,
      );
      expect(vitrine).toMatchObject({ price_mode: 'starting_from', price_cents: 69900 });

      const ecommerce = database.get<Record<string, unknown>>(
        `SELECT v.price_mode,v.price_cents FROM atoum_portable_refs r
         JOIN catalog_versions v ON v.id=r.local_version_id
         WHERE r.portable_ref='catalog.offer.ecommerce' LIMIT 1`,
      );
      expect(ecommerce).toMatchObject({ price_mode: 'starting_from', price_cents: 149000 });

      const maintenance = database.all<Record<string, unknown>>(
        `SELECT r.portable_ref,v.price_mode,v.price_cents FROM atoum_portable_refs r
         JOIN catalog_versions v ON v.id=r.local_version_id
         WHERE r.portable_ref IN ('catalog.offer.maintenance.wordpress','catalog.offer.maintenance.woocommerce')
         ORDER BY v.price_cents`,
      );
      expect(maintenance).toEqual([
        { portable_ref: 'catalog.offer.maintenance.wordpress', price_mode: 'monthly', price_cents: 4900 },
        { portable_ref: 'catalog.offer.maintenance.woocommerce', price_mode: 'monthly', price_cents: 9900 },
      ]);

      const documents = database.all<{ relative_path: string } & Record<string, unknown>>('SELECT relative_path FROM atoum_package_documents ORDER BY document_ref');
      expect(documents).toHaveLength(3);
      for (const document of documents) expect(existsSync(join(workspace.root, document.relative_path))).toBe(true);

      const requirements = database.all<Record<string, unknown>>(
        `SELECT portable_ref,local_id FROM atoum_portable_refs
         WHERE portable_ref IN ('catalog.service.hosting.annual','catalog.service.domain.annual')`,
      );
      expect(requirements.length).toBeGreaterThanOrEqual(2);
      expect(requirements.every((item) => Boolean(item.local_id))).toBe(true);

      const legacy = database.all<{ id: string; status: string } & Record<string, unknown>>(
        `SELECT id,status FROM catalog_items WHERE id IN ('atoumweb-produits11','atoumweb-produits21','atoumweb-produits51','atoumweb-produits100') ORDER BY id`,
      );
      expect(legacy.every((item) => item.status === 'archived')).toBe(true);

      expect(service.list().every((pack) => pack.state === 'staged' && pack.capabilityGaps.length > 0)).toBe(true);
      expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
    } finally {
      database.close();
      rmSync(root, { recursive: true, force: true });
    }
  });
});
