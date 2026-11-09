import type { DatabaseAdapter } from '../database/DatabaseAdapter';

export const ARCHIVED_SITE_READ_ONLY = 'Ce site est archivé et consultable en lecture seule. Réactive le site pour effectuer des modifications.';

/** Protect a Page and its children, including indirect Production commands. */
export function assertSiteNodeWritable(database: DatabaseAdapter, nodeId: string, includeDescendants = false): void {
  const locked = database.get(`
    WITH RECURSIVE ancestors(id,parent_id) AS (
      SELECT id,parent_id FROM project_nodes WHERE id=?
      UNION SELECT n.id,n.parent_id FROM project_nodes n JOIN ancestors a ON n.id=a.parent_id
    ), descendants(id) AS (
      SELECT id FROM project_nodes WHERE id=?
      UNION SELECT n.id FROM project_nodes n JOIN descendants d ON n.parent_id=d.id
    )
    SELECT s.id FROM project_site_pages p JOIN project_sites s ON s.id=p.project_site_id
    WHERE s.archived_at IS NOT NULL AND
      (p.project_node_id IN (SELECT id FROM ancestors) OR (?=1 AND p.project_node_id IN (SELECT id FROM descendants)))
    LIMIT 1`, [nodeId, nodeId, includeDescendants ? 1 : 0]);
  if (locked) throw new Error(ARCHIVED_SITE_READ_ONLY);
}

export function assertSiteCompositionWritable(database: DatabaseAdapter, compositionId: string): void {
  const pages = database.all<{ project_node_id: string }>('SELECT project_node_id FROM project_page_compositions WHERE composition_id=?', [compositionId]);
  for (const page of pages) assertSiteNodeWritable(database, page.project_node_id);
}
