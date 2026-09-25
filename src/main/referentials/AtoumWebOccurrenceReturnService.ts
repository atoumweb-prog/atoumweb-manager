import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type {
  AtoumWebOccurrenceReturnDecision,
  AtoumWebOccurrenceReturnDetail,
  AtoumWebOccurrenceReturnInspection,
  AtoumWebOccurrenceReturnSummary,
} from '../../shared/referentials';
import {
  type AtoumWebOccurrenceReturnManifestV1,
  type AtoumWebSiteOccurrenceV1,
  validateOccurrenceReturnManifestV1,
  validateSiteOccurrenceV1,
} from '../../shared/siteOccurrence';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import { readZipArchive, type ZipEntryOutput } from './ZipArchive';

interface ReturnRow extends Record<string, unknown> {
  id: string;
  package_fingerprint: string;
  site_occurrence_id: string;
  technical_item_id: string;
  technical_item_version_id: string;
  source_version_number: number;
  returned_at: string;
  occurrence_state: string;
  decision: AtoumWebOccurrenceReturnDecision | null;
  decided_at: string | null;
  changes_json: string;
  occurrence_json: string;
  assets_json: string;
  provenance_json: string;
  html_text: string;
  css_text: string | null;
  javascript_text: string | null;
  package_relative_path: string;
  created_at: string;
}

interface InspectedReturn {
  public: AtoumWebOccurrenceReturnInspection;
  manifest: AtoumWebOccurrenceReturnManifestV1;
  occurrence: AtoumWebSiteOccurrenceV1;
  html: string;
  css: string | null;
  javascript: string | null;
  assets: Record<string, unknown>;
  provenance: Record<string, unknown>;
}

const nowIso = (): string => new Date().toISOString();

export class AtoumWebOccurrenceReturnService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly workspace: WorkspacePaths,
  ) {}

  list(): AtoumWebOccurrenceReturnSummary[] {
    return this.database.all<ReturnRow>(
      'SELECT * FROM bridge_occurrence_returns ORDER BY returned_at DESC, created_at DESC',
    ).map((row) => this.mapSummary(row));
  }

  get(id: string): AtoumWebOccurrenceReturnDetail {
    const row = this.database.get<ReturnRow>('SELECT * FROM bridge_occurrence_returns WHERE id=?', [id]);
    if (!row) throw new Error('Retour Bridge introuvable.');
    return this.mapDetail(row);
  }

  inspectPackage(packagePath: string): AtoumWebOccurrenceReturnInspection {
    return this.inspect(packagePath).public;
  }

  importReturn(packagePath: string): AtoumWebOccurrenceReturnDetail {
    const inspection = this.inspect(packagePath);
    if (inspection.public.existingReturnId) return this.get(inspection.public.existingReturnId);

    const directory = join(this.workspace.bridgeDirectory, 'occurrence-returns');
    mkdirSync(directory, { recursive: true });
    const safeOccurrence = inspection.public.siteOccurrenceId.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'occurrence';
    const fileName = `${safeOccurrence}-${inspection.public.packageFingerprint.slice(0, 16)}.zip`;
    const destination = join(directory, fileName);
    let createdFile = false;
    if (!existsSync(destination)) {
      copyFileSync(resolve(packagePath), destination);
      createdFile = true;
    }
    if (this.sha256(readFileSync(destination)) !== inspection.public.packageFingerprint) {
      if (createdFile) rmSync(destination, { force: true });
      throw new Error('La copie locale du retour Bridge ne correspond pas au package inspecté.');
    }

    const id = randomUUID();
    const createdAt = nowIso();
    const packageRelativePath = relative(this.workspace.root, destination).replace(/\\/g, '/');
    this.database.exec('SAVEPOINT bridge_occurrence_return_import;');
    try {
      this.database.run(
        `INSERT INTO bridge_occurrence_returns (
          id, package_fingerprint, site_occurrence_id, technical_item_id, technical_item_version_id,
          source_version_number, returned_at, occurrence_state, decision, decided_at,
          changes_json, occurrence_json, assets_json, provenance_json,
          html_text, css_text, javascript_text, package_relative_path, created_at
        ) VALUES (?,?,?,?,?,?,?,?,NULL,NULL,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          inspection.public.packageFingerprint,
          inspection.public.siteOccurrenceId,
          inspection.public.libraryItemId,
          inspection.public.libraryVersionId,
          inspection.public.libraryVersionNumber,
          inspection.public.returnedAt,
          inspection.public.occurrenceState,
          JSON.stringify(inspection.public.changes),
          JSON.stringify(inspection.occurrence),
          JSON.stringify(inspection.assets),
          JSON.stringify(inspection.provenance),
          inspection.html,
          inspection.css,
          inspection.javascript,
          packageRelativePath,
          createdAt,
        ],
      );
      this.writeActivity(id, 'bridge_occurrence_return_imported', `Retour Bridge importé : ${inspection.public.siteOccurrenceId}`, {
        libraryItemId: inspection.public.libraryItemId,
        libraryVersionId: inspection.public.libraryVersionId,
        packageFingerprint: inspection.public.packageFingerprint,
      });
      this.database.exec('RELEASE SAVEPOINT bridge_occurrence_return_import;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT bridge_occurrence_return_import; RELEASE SAVEPOINT bridge_occurrence_return_import;');
      if (createdFile) rmSync(destination, { force: true });
      throw error;
    }
    return this.get(id);
  }

  keepOccurrence(id: string): AtoumWebOccurrenceReturnDetail {
    const current = this.get(id);
    if (current.decision && current.decision !== 'keep_occurrence') {
      throw new Error('Une autre décision a déjà été enregistrée pour ce retour.');
    }
    if (current.decision === 'keep_occurrence') return current;
    const decidedAt = nowIso();
    this.database.exec('SAVEPOINT bridge_occurrence_return_decision;');
    try {
      this.database.run(
        "UPDATE bridge_occurrence_returns SET decision='keep_occurrence', decided_at=? WHERE id=?",
        [decidedAt, id],
      );
      this.writeActivity(id, 'bridge_occurrence_return_decided', 'Retour Bridge conservé comme occurrence uniquement.', {
        decision: 'keep_occurrence',
        siteOccurrenceId: current.siteOccurrenceId,
      });
      this.database.exec('RELEASE SAVEPOINT bridge_occurrence_return_decision;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT bridge_occurrence_return_decision; RELEASE SAVEPOINT bridge_occurrence_return_decision;');
      throw error;
    }
    return this.get(id);
  }

  private inspect(packagePath: string): InspectedReturn {
    const absolute = resolve(packagePath);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) throw new Error('Package de retour Bridge introuvable.');
    if (extname(absolute).toLowerCase() !== '.zip') throw new Error('Le retour Bridge doit être un fichier ZIP.');
    if (statSync(absolute).size > 220 * 1024 * 1024) throw new Error('Le package de retour Bridge est trop volumineux.');

    const packageFingerprint = this.sha256(readFileSync(absolute));
    const entries = new Map<string, ZipEntryOutput>(readZipArchive(absolute).map((entry) => [entry.name, entry]));
    const manifestEntry = entries.get('manifest.json');
    if (!manifestEntry) throw new Error('manifest.json absent du retour Bridge.');

    const manifest = this.parseJson<AtoumWebOccurrenceReturnManifestV1>(manifestEntry.data, 'manifest.json');
    const manifestErrors = validateOccurrenceReturnManifestV1(manifest);
    if (manifestErrors.length) throw new Error('Manifest Occurrence Return V1 invalide : ' + manifestErrors.join(' '));

    const declared = [
      manifest.files.occurrence,
      manifest.files.html,
      manifest.files.css,
      manifest.files.javascript,
      manifest.files.assets,
      manifest.files.provenance,
    ].filter((file): file is NonNullable<typeof file> => Boolean(file));
    for (const file of declared) {
      const entry = entries.get(file.path);
      if (!entry) throw new Error(`Fichier déclaré absent du retour Bridge : ${file.path}`);
      if (this.sha256(entry.data) !== file.sha256.toLowerCase()) {
        throw new Error(`Checksum SHA-256 invalide dans le retour Bridge : ${file.path}`);
      }
    }

    const occurrence = this.parseJson<AtoumWebSiteOccurrenceV1>(
      entries.get(manifest.files.occurrence.path)!.data,
      manifest.files.occurrence.path,
    );
    const occurrenceErrors = validateSiteOccurrenceV1(occurrence);
    if (occurrenceErrors.length) throw new Error('Site Occurrence V1 invalide : ' + occurrenceErrors.join(' '));
    if (occurrence.siteOccurrenceId !== manifest.siteOccurrenceId) {
      throw new Error('siteOccurrenceId incohérent entre le manifest et occurrence.json.');
    }
    if (!isDeepStrictEqual(occurrence.changes, manifest.changes)) {
      throw new Error('Résumé des changements incohérent entre le manifest et occurrence.json.');
    }
    if (occurrence.source.componentPackageContractVersion !== manifest.sourceComponentPackageContractVersion) {
      throw new Error('Version du Component Package source incohérente.');
    }

    const item = this.database.get<{ id: string; name: string }>(
      "SELECT id, name FROM technical_items WHERE id=? AND scope='atoumweb'",
      [occurrence.source.libraryItemId],
    );
    if (!item) throw new Error('Le composant Bibliothèque source du retour Bridge est introuvable.');
    const version = this.database.get<{ id: string; version_number: number; technical_item_id: string }>(
      'SELECT id, version_number, technical_item_id FROM technical_item_versions WHERE id=?',
      [occurrence.source.libraryVersionId],
    );
    if (!version || version.technical_item_id !== item.id) {
      throw new Error('La version Bibliothèque source du retour Bridge est introuvable ou incohérente.');
    }
    if (Number(version.version_number) !== occurrence.source.libraryVersionNumber) {
      throw new Error('Le numéro de version Bibliothèque source du retour Bridge est incohérent.');
    }

    const assets = this.parseObject(entries.get(manifest.files.assets.path)!.data, manifest.files.assets.path);
    const provenance = this.parseObject(entries.get(manifest.files.provenance.path)!.data, manifest.files.provenance.path);
    const html = entries.get(manifest.files.html.path)!.data.toString('utf8');
    const css = manifest.files.css ? entries.get(manifest.files.css.path)!.data.toString('utf8') : null;
    const javascript = manifest.files.javascript ? entries.get(manifest.files.javascript.path)!.data.toString('utf8') : null;
    const existing = this.database.get<{ id: string }>(
      'SELECT id FROM bridge_occurrence_returns WHERE package_fingerprint=?',
      [packageFingerprint],
    );

    return {
      public: {
        packagePath: absolute,
        packageFingerprint,
        siteOccurrenceId: manifest.siteOccurrenceId,
        libraryItemId: item.id,
        libraryVersionId: version.id,
        libraryVersionNumber: Number(version.version_number),
        libraryItemName: item.name,
        returnedAt: manifest.returnedAt,
        occurrenceState: occurrence.state,
        changes: manifest.changes,
        alreadyImported: Boolean(existing),
        existingReturnId: existing?.id ?? null,
      },
      manifest,
      occurrence,
      html,
      css,
      javascript,
      assets,
      provenance,
    };
  }

  private mapSummary(row: ReturnRow): AtoumWebOccurrenceReturnSummary {
    const item = this.database.get<{ name: string }>('SELECT name FROM technical_items WHERE id=?', [row.technical_item_id]);
    return {
      id: row.id,
      packageFingerprint: row.package_fingerprint,
      siteOccurrenceId: row.site_occurrence_id,
      libraryItemId: row.technical_item_id,
      libraryVersionId: row.technical_item_version_id,
      libraryVersionNumber: Number(row.source_version_number),
      libraryItemName: item?.name ?? 'Composant introuvable',
      returnedAt: row.returned_at,
      occurrenceState: row.occurrence_state,
      changes: JSON.parse(row.changes_json),
      decision: row.decision,
      decidedAt: row.decided_at,
      createdAt: row.created_at,
    };
  }

  private mapDetail(row: ReturnRow): AtoumWebOccurrenceReturnDetail {
    return {
      ...this.mapSummary(row),
      occurrence: JSON.parse(row.occurrence_json),
      html: row.html_text,
      css: row.css_text,
      javascript: row.javascript_text,
      assets: JSON.parse(row.assets_json),
      provenance: JSON.parse(row.provenance_json),
      packageRelativePath: row.package_relative_path,
    };
  }

  private parseJson<T>(data: Buffer, label: string): T {
    try {
      return JSON.parse(data.toString('utf8')) as T;
    } catch {
      throw new Error(`JSON invalide dans ${label}.`);
    }
  }

  private parseObject(data: Buffer, label: string): Record<string, unknown> {
    const value = this.parseJson<unknown>(data, label);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} doit contenir un objet JSON.`);
    return value as Record<string, unknown>;
  }

  private sha256(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private writeActivity(entityId: string, action: string, summary: string, metadata: Record<string, unknown>): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type, entity_id, action, summary, metadata_json, created_at) VALUES (?,?,?,?,?,?)',
      ['bridge_occurrence_return', entityId, action, summary, JSON.stringify(metadata), nowIso()],
    );
  }
}
