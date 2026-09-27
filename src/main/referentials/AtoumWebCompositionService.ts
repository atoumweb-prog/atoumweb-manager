import { randomUUID } from 'node:crypto';
import type {
  AtoumWebCompositionAddItemInput,
  AtoumWebCompositionDetail,
  AtoumWebCompositionInput,
  AtoumWebCompositionItem,
  AtoumWebCompositionMoveItemInput,
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
  created_at: string;
}

export class AtoumWebCompositionService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly library: AtoumWebTechnicalLibraryService,
  ) {}

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

  private optionalText(value: string | null | undefined): string | null {
    const text = String(value ?? '').trim();
    return text || null;
  }

  private optionalSlug(value: string | null | undefined): string | null {
    const text = String(value ?? '').trim().toLocaleLowerCase('fr-FR');
    return text ? text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null;
  }
}
