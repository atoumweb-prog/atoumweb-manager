import { randomUUID } from 'node:crypto';
import type {
  AtoumWebCompositionAddItemInput,
  AtoumWebCompositionDetail,
  AtoumWebCompositionInput,
  AtoumWebCompositionItem,
  AtoumWebCompositionItemLocalCodeInput,
  AtoumWebCompositionMoveItemInput,
  AtoumWebCompositionPromoteVariantInput,
  AtoumWebCompositionStatus,
  AtoumWebCompositionSummary,
  AtoumWebLibraryCategory,
} from '../../shared/referentials';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';

interface CompositionRow extends Record<string, unknown> {
  id: string;
  name: string;
  target_vertical: string | null;
  notes: string | null;
  status: AtoumWebCompositionStatus;
  item_count: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface CompositionItemRow extends Record<string, unknown> {
  id: string;
  composition_id: string;
  sort_order: number;
  source_item_id: string;
  source_version_id: string;
  source_version_number: number;
  display_name: string;
  category: AtoumWebLibraryCategory;
  vertical: string | null;
  component_family_id: string | null;
  component_key: string | null;
  library_variant_id: string | null;
  variant_key: string | null;
  variant_mode: 'base' | 'inherit' | 'forked' | null;
  local_html_text: string | null;
  local_css_text: string | null;
  local_javascript_text: string | null;
  local_settings_json: string;
  local_updated_at: string | null;
  created_at: string;
}

export class AtoumWebCompositionService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly library: AtoumWebTechnicalLibraryService,
  ) {}

  getForProjectPage(projectNodeId: string): AtoumWebCompositionDetail | null {
    this.assertProjectPage(projectNodeId);
    const link = this.database.get<{ composition_id: string }>(
      'SELECT composition_id FROM project_page_compositions WHERE project_node_id=?',
      [projectNodeId],
    );
    return link ? this.get(link.composition_id) : null;
  }

  ensureForProjectPage(projectNodeId: string): AtoumWebCompositionDetail {
    const page = this.assertProjectPage(projectNodeId);
    const existing = this.getForProjectPage(projectNodeId);
    if (existing) return existing;

    this.database.exec('SAVEPOINT page_composition_create;');
    try {
      const composition = this.create({ name: `${page.name} — composition` });
      const now = new Date().toISOString();
      this.database.run(
        'INSERT INTO project_page_compositions (project_node_id,composition_id,created_at,updated_at) VALUES (?,?,?,?)',
        [projectNodeId, composition.id, now, now],
      );
      this.logProject(page.project_id, 'project_page_composition_created', `Composition créée pour la Page : ${page.name}`, {
        pageNodeId: projectNodeId,
        compositionId: composition.id,
      });
      this.database.exec('RELEASE SAVEPOINT page_composition_create;');
      return composition;
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT page_composition_create; RELEASE SAVEPOINT page_composition_create;');
      throw error;
    }
  }

  attachToProjectPage(projectNodeId: string, compositionId: string): AtoumWebCompositionDetail {
    const page = this.assertProjectPage(projectNodeId);
    const composition = this.get(compositionId);
    if (composition.status === 'archived') throw new Error('Réactive la composition avant de la rattacher à une Page.');

    const usedBy = this.database.get<{ project_node_id: string }>(
      'SELECT project_node_id FROM project_page_compositions WHERE composition_id=? AND project_node_id<>?',
      [compositionId, projectNodeId],
    );
    if (usedBy) throw new Error('Cette composition est déjà rattachée à une autre Page.');

    const now = new Date().toISOString();
    this.database.run(
      `INSERT INTO project_page_compositions (project_node_id,composition_id,created_at,updated_at)
       VALUES (?,?,?,?)
       ON CONFLICT(project_node_id) DO UPDATE SET composition_id=excluded.composition_id,updated_at=excluded.updated_at`,
      [projectNodeId, compositionId, now, now],
    );
    this.logProject(page.project_id, 'project_page_composition_attached', `Composition rattachée à la Page : ${page.name}`, {
      pageNodeId: projectNodeId,
      compositionId,
    });
    return this.get(compositionId);
  }

  detachFromProjectPage(projectNodeId: string): void {
    const page = this.assertProjectPage(projectNodeId);
    const link = this.database.get<{ composition_id: string }>(
      'SELECT composition_id FROM project_page_compositions WHERE project_node_id=?',
      [projectNodeId],
    );
    if (!link) return;
    this.database.run('DELETE FROM project_page_compositions WHERE project_node_id=?', [projectNodeId]);
    this.logProject(page.project_id, 'project_page_composition_detached', `Composition détachée de la Page : ${page.name}`, {
      pageNodeId: projectNodeId,
      compositionId: link.composition_id,
    });
  }

  list(includeArchived = false): AtoumWebCompositionSummary[] {
    return this.database.all<CompositionRow>(
      `SELECT c.*,
       (SELECT COUNT(*) FROM atoumweb_composition_items i WHERE i.composition_id=c.id) item_count
       FROM atoumweb_compositions c
       ${includeArchived ? '' : "WHERE c.status <> 'archived'"}
       ORDER BY c.updated_at DESC, c.name COLLATE NOCASE`,
    ).map((row) => this.mapSummary(row));
  }

  get(id: string): AtoumWebCompositionDetail {
    const row = this.database.get<CompositionRow>(
      `SELECT c.*,
       (SELECT COUNT(*) FROM atoumweb_composition_items i WHERE i.composition_id=c.id) item_count
       FROM atoumweb_compositions c WHERE c.id=?`,
      [id],
    );
    if (!row) throw new Error('Composition AtoumWeb introuvable.');

    const items = this.database.all<CompositionItemRow>(
      'SELECT * FROM atoumweb_composition_items WHERE composition_id=? ORDER BY sort_order,id',
      [id],
    ).map((item) => this.mapItem(item));

    return { ...this.mapSummary(row), items };
  }

  create(input: AtoumWebCompositionInput): AtoumWebCompositionDetail {
    const name = this.requiredName(input.name);
    const now = new Date().toISOString();
    const id = `awcomp:${randomUUID()}`;
    this.database.run(
      `INSERT INTO atoumweb_compositions
       (id,name,target_vertical,notes,status,created_at,updated_at,archived_at)
       VALUES (?,?,?,?, 'draft', ?, ?, NULL)`,
      [id, name, this.optionalSlug(input.targetVertical), this.optionalText(input.notes), now, now],
    );
    this.log(id, 'atoumweb_composition_created', `Composition créée : ${name}`, {});
    return this.get(id);
  }

  update(id: string, input: Partial<AtoumWebCompositionInput>): AtoumWebCompositionDetail {
    const current = this.get(id);
    if (current.status === 'archived') throw new Error('Réactive la composition avant de la modifier.');
    const name = input.name === undefined ? current.name : this.requiredName(input.name);
    const targetVertical = input.targetVertical === undefined ? current.targetVertical : this.optionalSlug(input.targetVertical);
    const notes = input.notes === undefined ? current.notes : this.optionalText(input.notes);
    const now = new Date().toISOString();
    this.database.run(
      'UPDATE atoumweb_compositions SET name=?,target_vertical=?,notes=?,updated_at=? WHERE id=?',
      [name, targetVertical, notes, now, id],
    );
    return this.get(id);
  }

  addItem(id: string, input: AtoumWebCompositionAddItemInput): AtoumWebCompositionDetail {
    const composition = this.get(id);
    if (composition.status !== 'draft') throw new Error('Seule une composition en brouillon peut être modifiée.');

    const item = this.library.get(input.libraryItemId);
    if (item.archivedAt) throw new Error('Un composant archivé ne peut pas être ajouté à une composition.');
    if (!this.isReadyForComposition(item)) throw new Error('Seuls les composants réellement « Prêt à réutiliser » peuvent être ajoutés à une composition.');

    const version = input.versionId
      ? item.versions.find((candidate) => candidate.id === input.versionId)
      : item.stableVersion ?? item.currentVersion;
    if (!version) throw new Error('Aucune version du composant n’est disponible.');
    if (version.itemId !== item.id) throw new Error('La version choisie n’appartient pas au composant.');

    const nextOrder = Number(this.database.get<{ next_order: number }>(
      'SELECT COALESCE(MAX(sort_order),-1)+1 next_order FROM atoumweb_composition_items WHERE composition_id=?',
      [id],
    )?.next_order ?? 0);
    const now = new Date().toISOString();
    const rowId = `awci:${randomUUID()}`;

    this.database.run(
      `INSERT INTO atoumweb_composition_items
       (id,composition_id,sort_order,source_item_id,source_version_id,source_version_number,display_name,category,vertical,
        component_family_id,component_key,library_variant_id,variant_key,variant_mode,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        rowId,
        id,
        nextOrder,
        item.id,
        version.id,
        version.versionNumber,
        item.name,
        item.category,
        item.vertical ?? null,
        item.componentFamilyId ?? null,
        item.componentKey ?? null,
        item.libraryVariantId ?? null,
        item.variantKey ?? null,
        item.variantMode ?? null,
        now,
      ],
    );
    this.touch(id);
    this.log(id, 'atoumweb_composition_item_added', `Composant ajouté : ${item.name}`, {
      compositionItemId: rowId,
      libraryItemId: item.id,
      libraryVersionId: version.id,
      libraryVersionNumber: version.versionNumber,
    });
    return this.get(id);
  }

  updateItemLocalCode(id: string, itemId: string, input: AtoumWebCompositionItemLocalCodeInput): AtoumWebCompositionDetail {
    const composition = this.get(id);
    if (composition.status !== 'draft') throw new Error('Seule une composition en brouillon peut être modifiée.');
    const item = composition.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error('Élément de composition introuvable.');

    const html = String(input.html ?? '').trim();
    if (!html) throw new Error('Le HTML préparé du bloc est requis.');
    const now = new Date().toISOString();
    this.database.run(
      `UPDATE atoumweb_composition_items
       SET local_html_text=?,local_css_text=?,local_javascript_text=?,local_settings_json=?,local_updated_at=?
       WHERE id=? AND composition_id=?`,
      [
        html,
        this.optionalRaw(input.css),
        this.optionalRaw(input.javascript),
        JSON.stringify(input.settings ?? {}),
        now,
        itemId,
        id,
      ],
    );
    this.touch(id);
    this.log(id, 'atoumweb_composition_item_local_settings_saved', `Réglages locaux enregistrés : ${item.displayName}`, {
      compositionItemId: itemId,
      sourceItemId: item.sourceItemId,
      sourceVersionId: item.sourceVersionId,
    });
    return this.get(id);
  }

  resetItemLocalCode(id: string, itemId: string): AtoumWebCompositionDetail {
    const composition = this.get(id);
    if (composition.status !== 'draft') throw new Error('Seule une composition en brouillon peut être modifiée.');
    const item = composition.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error('Élément de composition introuvable.');

    this.database.run(
      `UPDATE atoumweb_composition_items
       SET local_html_text=NULL,local_css_text=NULL,local_javascript_text=NULL,local_settings_json='{}',local_updated_at=NULL
       WHERE id=? AND composition_id=?`,
      [itemId, id],
    );
    this.touch(id);
    this.log(id, 'atoumweb_composition_item_local_settings_reset', `Réglages locaux réinitialisés : ${item.displayName}`, {
      compositionItemId: itemId,
      sourceItemId: item.sourceItemId,
      sourceVersionId: item.sourceVersionId,
    });
    return this.get(id);
  }

  promoteItemVariant(id: string, itemId: string, input: AtoumWebCompositionPromoteVariantInput) {
    const composition = this.get(id);
    const item = composition.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error('Élément de composition introuvable.');
    if (!item.hasLocalChanges || !item.localHtml) {
      throw new Error('Prépare d’abord ce bloc localement avant de l’envoyer comme variante.');
    }
    const name = this.requiredName(input.name);
    const page = this.database.get<{ project_id: string; page_name: string }>(
      `SELECT pn.project_id, pn.name page_name
       FROM project_page_compositions ppc
       JOIN project_nodes pn ON pn.id=ppc.project_node_id
       WHERE ppc.composition_id=?`,
      [id],
    );
    const promoted = this.library.createVariantCode({
      sourceItemId: item.sourceItemId,
      name,
      variantKey: input.variantKey,
      description: input.description ?? `Variante proposée depuis la composition « ${composition.name} ».`,
      vertical: item.vertical,
      tags: [
        'composition-promotion',
        `source-composition-${id}`,
        `source-composition-item-${itemId}`,
        ...(page ? [`source-project-${page.project_id}`] : []),
      ],
      html: item.localHtml,
      css: item.localCss,
      javascript: item.localJavascript,
      reuseStatus: 'adapt',
      markStable: false,
      provenanceNote: page
        ? `Promue depuis la Page « ${page.page_name} » du Projet ${page.project_id}, occurrence ${itemId}.`
        : `Promue depuis la composition ${id}, occurrence ${itemId}.`,
    });
    this.log(id, 'atoumweb_composition_item_promoted_variant', `Adaptation envoyée vers la Bibliothèque : ${promoted.name}`, {
      compositionItemId: itemId,
      sourceItemId: item.sourceItemId,
      resultItemId: promoted.id,
      resultVariantId: promoted.libraryVariantId,
      resultReuseStatus: promoted.reuseStatus,
    });
    return promoted;
  }

    removeItem(id: string, itemId: string): AtoumWebCompositionDetail {
    const composition = this.get(id);
    if (composition.status !== 'draft') throw new Error('Seule une composition en brouillon peut être modifiée.');
    const existing = this.database.get<{ id: string }>(
      'SELECT id FROM atoumweb_composition_items WHERE id=? AND composition_id=?',
      [itemId, id],
    );
    if (!existing) throw new Error('Élément de composition introuvable.');

    this.database.exec('SAVEPOINT composition_remove;');
    try {
      this.database.run('DELETE FROM atoumweb_composition_items WHERE id=? AND composition_id=?', [itemId, id]);
      this.resequence(id);
      this.touch(id);
      this.database.exec('RELEASE SAVEPOINT composition_remove;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT composition_remove; RELEASE SAVEPOINT composition_remove;');
      throw error;
    }
    return this.get(id);
  }

  moveItem(id: string, itemId: string, input: AtoumWebCompositionMoveItemInput): AtoumWebCompositionDetail {
    const composition = this.get(id);
    if (composition.status !== 'draft') throw new Error('Seule une composition en brouillon peut être modifiée.');
    const items = composition.items;
    const currentIndex = items.findIndex((item) => item.id === itemId);
    if (currentIndex < 0) throw new Error('Élément de composition introuvable.');
    if (!Number.isInteger(input.targetIndex)) throw new Error('Position cible invalide.');

    const targetIndex = Math.max(0, Math.min(items.length - 1, input.targetIndex));
    if (targetIndex === currentIndex) return composition;

    const reordered = items.slice();
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    this.database.exec('SAVEPOINT composition_move;');
    try {
      // Décale temporairement les positions pour éviter la contrainte UNIQUE pendant la réorganisation.
      reordered.forEach((entry, index) => {
        this.database.run('UPDATE atoumweb_composition_items SET sort_order=? WHERE id=?', [100000 + index, entry.id]);
      });
      reordered.forEach((entry, index) => {
        this.database.run('UPDATE atoumweb_composition_items SET sort_order=? WHERE id=?', [index, entry.id]);
      });
      this.touch(id);
      this.database.exec('RELEASE SAVEPOINT composition_move;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT composition_move; RELEASE SAVEPOINT composition_move;');
      throw error;
    }
    return this.get(id);
  }

  /**
   * Undo/redo of a component reordering, without deleting or recreating any
   * occurrence. An optimistic expected order prevents overwriting concurrent
   * edits, other windows or a newer Page state.
   */
  restoreOrder(id: string, expectedIds: string[], targetIds: string[]): AtoumWebCompositionDetail {
    const composition=this.get(id);
    if (composition.status!=='draft') throw new Error('Seule une composition en brouillon peut être réorganisée.');
    const current=composition.items.map(item=>item.id);
    if (!Array.isArray(expectedIds) || !Array.isArray(targetIds)
      || JSON.stringify(current)!==JSON.stringify(expectedIds)) {
      throw new Error('Composition modifiée depuis la dernière opération : actualise la Page avant d’annuler.');
    }
    const target=new Set(targetIds);
    if (targetIds.length!==current.length || target.size!==current.length
      || current.some(itemId=>!target.has(itemId))) {
      throw new Error('Historique de composition invalide : aucun composant ne doit être créé ni supprimé.');
    }
    if (JSON.stringify(current)===JSON.stringify(targetIds)) return composition;
    this.database.exec('SAVEPOINT composition_restore_order;');
    try {
      // Two-phase positions avoid UNIQUE(composition_id,sort_order) collisions.
      targetIds.forEach((itemId,index)=>{
        this.database.run('UPDATE atoumweb_composition_items SET sort_order=? WHERE id=? AND composition_id=?',
          [100000+index,itemId,id]);
      });
      targetIds.forEach((itemId,index)=>{
        this.database.run('UPDATE atoumweb_composition_items SET sort_order=? WHERE id=? AND composition_id=?',
          [index,itemId,id]);
      });
      this.touch(id);
      this.log(id,'atoumweb_composition_order_restored','Ordre de composition restauré sans recréer de composant',
        {expectedIds,targetIds});
      this.database.exec('RELEASE SAVEPOINT composition_restore_order;');
    } catch(error) {
      this.database.exec('ROLLBACK TO SAVEPOINT composition_restore_order; RELEASE SAVEPOINT composition_restore_order;');
      throw error;
    }
    return this.get(id);
  }

  archive(id: string): AtoumWebCompositionDetail {
    this.get(id);
    const now = new Date().toISOString();
    this.database.run("UPDATE atoumweb_compositions SET status='archived',archived_at=?,updated_at=? WHERE id=?", [now, now, id]);
    return this.get(id);
  }

  reactivate(id: string): AtoumWebCompositionDetail {
    this.get(id);
    const now = new Date().toISOString();
    this.database.run("UPDATE atoumweb_compositions SET status='draft',archived_at=NULL,updated_at=? WHERE id=?", [now, id]);
    return this.get(id);
  }

  private assertProjectPage(projectNodeId: string): { id: string; project_id: string; name: string } {
    const page = this.database.get<{ id: string; project_id: string; node_type: string; display_subtype: string | null; name: string }>(
      'SELECT id,project_id,node_type,display_subtype,name FROM project_nodes WHERE id=?',
      [projectNodeId],
    );
    if (!page) throw new Error('Page projet introuvable.');
    if (page.node_type !== 'module' || page.display_subtype !== 'page') {
      throw new Error('Seul un nœud Projet de type Page peut recevoir une composition.');
    }
    return { id: page.id, project_id: page.project_id, name: page.name };
  }

  private logProject(projectId: string, action: string, summary: string, metadata: Record<string, unknown>): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
      ['project', projectId, action, summary, JSON.stringify(metadata), new Date().toISOString()],
    );
  }

  private resequence(compositionId: string): void {
    const ids = this.database.all<{ id: string }>(
      'SELECT id FROM atoumweb_composition_items WHERE composition_id=? ORDER BY sort_order,id',
      [compositionId],
    );
    ids.forEach((entry, index) => {
      this.database.run('UPDATE atoumweb_composition_items SET sort_order=? WHERE id=?', [index, entry.id]);
    });
  }

  private touch(id: string): void {
    this.database.run('UPDATE atoumweb_compositions SET updated_at=? WHERE id=?', [new Date().toISOString(), id]);
  }

  private log(id: string, action: string, summary: string, metadata: Record<string, unknown>): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
      ['atoumweb_composition', id, action, summary, JSON.stringify(metadata), new Date().toISOString()],
    );
  }

  private mapSummary(row: CompositionRow): AtoumWebCompositionSummary {
    return {
      id: row.id,
      name: row.name,
      targetVertical: row.target_vertical,
      notes: row.notes,
      status: row.status,
      itemCount: Number(row.item_count ?? 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
    };
  }

  private mapItem(row: CompositionItemRow): AtoumWebCompositionItem {
    return {
      id: row.id,
      compositionId: row.composition_id,
      sortOrder: Number(row.sort_order),
      sourceItemId: row.source_item_id,
      sourceVersionId: row.source_version_id,
      sourceVersionNumber: Number(row.source_version_number),
      displayName: row.display_name,
      category: row.category,
      vertical: row.vertical,
      componentFamilyId: row.component_family_id,
      componentKey: row.component_key,
      libraryVariantId: row.library_variant_id,
      variantKey: row.variant_key,
      variantMode: row.variant_mode,
      localHtml: row.local_html_text,
      localCss: row.local_css_text,
      localJavascript: row.local_javascript_text,
      localSettings: this.parseLocalSettings(row.local_settings_json),
      localUpdatedAt: row.local_updated_at,
      hasLocalChanges: Boolean(row.local_updated_at),
      createdAt: row.created_at,
    };
  }

  private isReadyForComposition(item: ReturnType<AtoumWebTechnicalLibraryService['get']>): boolean {
    if (item.reuseStatus !== 'ready') return false;
    const tags = new Set(item.tags ?? []);
    const content = item.currentVersion?.contentText ?? '';
    const looksBridgeReusable = tags.has('bridge')
      || content.includes('"kind":"atoumweb-library-reusable-component"')
      || content.includes('"kind": "atoumweb-library-reusable-component"');
    return !looksBridgeReusable || tags.has('bridge-human-validated');
  }

  private requiredName(value: string): string {
    const name = String(value ?? '').trim();
    if (!name) throw new Error('Donne un nom à la composition.');
    return name;
  }

  private parseLocalSettings(value: string | null | undefined): AtoumWebCompositionItem['localSettings'] {
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  private optionalRaw(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    return String(value);
  }

    private optionalText(value: string | null | undefined): string | null {
    const text = String(value ?? '').trim();
    return text || null;
  }

  private optionalSlug(value: string | null | undefined): string | null {
    const text = String(value ?? '').trim().toLocaleLowerCase('fr-FR');
    return text ? text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null;
  }
}
