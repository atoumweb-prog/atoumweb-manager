import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
import type { AtoumWebCompositionPackageExportResult } from '../../shared/referentials';
import { buildComponentIdentityV1 } from '../../shared/componentIdentity';
import pagePackageSchema from '../../../docs/ATOUMWEB_PAGE_PACKAGE_V2.schema.json';
import { validateContractSchemaV1 } from '../../shared/contractSchemaV1';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import { AtoumWebCompositionService } from './AtoumWebCompositionService';
import { AtoumWebPackageService } from './AtoumWebPackageService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';
import { readZipArchive, writeZipArchive, type ZipEntryInput } from './ZipArchive';

interface ComponentPackageManifest {
  schemaVersion: number;
  purpose: string;
  item?: Record<string, unknown>;
  version?: Record<string, unknown>;
  assets?: Array<Record<string, unknown>>;
  bridgeWorkbench?: {
    contract?: string;
    schemaVersion?: number;
    componentPackageContractVersion?: number;
    fieldsContractVersion?: number;
    identityContractVersion?: number;
    flow?: string;
    workbenchRequired?: boolean;
    directProductionInjection?: boolean;
    component?: Record<string, unknown>;
    files?: Record<string, { path?: string; sha256?: string } | null>;
    provenance?: Record<string, unknown>;
  };
}

interface PageExportContext {
  exportId: string;
  projectId: string;
  siteId: string;
  pageId: string;
}

export class AtoumWebCompositionPackageService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly workspace: WorkspacePaths,
    private readonly compositions: AtoumWebCompositionService,
    private readonly packages: AtoumWebPackageService,
    private readonly library: AtoumWebTechnicalLibraryService,
  ) {}

  exportPackage(compositionId: string): AtoumWebCompositionPackageExportResult {
    return this.buildPackage(compositionId, null);
  }

  exportPagePackage(projectNodeId: string): AtoumWebCompositionPackageExportResult {
    const destination = this.database.get<{
      composition_id: string; project_id: string; project_site_id: string; project_node_id: string;
    }>(
      `SELECT ppc.composition_id,pn.project_id,psp.project_site_id,pn.id project_node_id
       FROM project_page_compositions ppc
       JOIN project_nodes pn ON pn.id=ppc.project_node_id
       JOIN project_site_pages psp ON psp.project_node_id=pn.id
       JOIN project_sites ps ON ps.id=psp.project_site_id AND ps.project_id=pn.project_id
       WHERE pn.id=? AND pn.node_type='module' AND pn.display_subtype='page' AND ps.archived_at IS NULL`,
      [projectNodeId],
    );
    if (!destination) {
      throw new Error('La Page doit être rattachée à un Site actif et posséder une composition avant son export.');
    }
    const context: PageExportContext = {
      exportId: `awexp:${randomUUID()}`,
      projectId: destination.project_id,
      siteId: destination.project_site_id,
      pageId: destination.project_node_id,
    };
    const exported = this.buildPackage(destination.composition_id, context);
    const fingerprint = this.sha256(readFileSync(exported.path));
    this.database.run(
      `INSERT INTO project_page_exports
       (id,composition_id,project_id,project_site_id,project_node_id,package_fingerprint,package_path,component_count,created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        context.exportId, destination.composition_id, context.projectId, context.siteId, context.pageId,
        fingerprint, exported.path, exported.componentCount, exported.createdAt,
      ],
    );
    return { ...exported, exportId: context.exportId, projectId: context.projectId, siteId: context.siteId, pageId: context.pageId };
  }

  private buildPackage(compositionId: string, page: PageExportContext | null): AtoumWebCompositionPackageExportResult {
    const composition = this.compositions.get(compositionId);
    if (composition.status === 'archived') throw new Error('Réactive la composition avant de préparer un package.');
    if (composition.items.length === 0) throw new Error('Ajoute au moins un composant avant de préparer le package.');

    const createdAt = new Date().toISOString();
    const entries: ZipEntryInput[] = [];
    const manifestComponents: Array<Record<string, unknown>> = [];

    composition.items.forEach((compositionItem, index) => {
      const exported = this.packages.exportItem(compositionItem.sourceItemId, compositionItem.sourceVersionId);
      const componentEntries = readZipArchive(exported.path);
      const byName = new Map(componentEntries.map((entry) => [entry.name, entry] as const));
      const manifestEntry = byName.get('manifest.json');
      if (!manifestEntry) throw new Error(`Manifest composant absent : ${compositionItem.displayName}.`);

      let componentManifest: ComponentPackageManifest;
      try {
        componentManifest = JSON.parse(manifestEntry.data.toString('utf8')) as ComponentPackageManifest;
      } catch {
        throw new Error(`Manifest composant invalide : ${compositionItem.displayName}.`);
      }

      const bridge = componentManifest.bridgeWorkbench;
      const prefix = `components/${String(index + 1).padStart(3, '0')}`;
      if (!bridge
        || bridge.contract !== 'atoumweb_bridge_component_package'
        || bridge.schemaVersion !== 1
        || bridge.componentPackageContractVersion !== 1
        || bridge.fieldsContractVersion !== 1
        || bridge.identityContractVersion !== 1
        || bridge.flow !== 'workbench_first'
        || bridge.workbenchRequired !== true
        || bridge.directProductionInjection !== false) {
        const item = this.library.get(compositionItem.sourceItemId);
        const version = item.versions.find((candidate) => candidate.id === compositionItem.sourceVersionId);
        const language = (version?.language ?? '').trim().toLowerCase();
        if (!version || version.contentType !== 'code' || language !== 'html' || !version.contentText?.trim()) {
          throw new Error(`Le composant « ${compositionItem.displayName} » n’a pas de package Workbench V1 ni de source HTML réutilisable.`);
        }

        const addText = (relativePath: string, value: string): { path: string; sha256: string } => {
          const data = Buffer.from(value, 'utf8');
          const path = `${prefix}/${relativePath}`;
          entries.push({ name: path, data });
          return { path, sha256: this.sha256(data) };
        };
        const identityValue = buildComponentIdentityV1({
          libraryDisplayName: item.name,
          libraryItemId: item.id,
          libraryVersionId: version.id,
          libraryVersionNumber: version.versionNumber,
          tags: item.tags ?? [],
          componentFamilyId: item.componentFamilyId ?? null,
          componentKey: item.componentKey ?? null,
          libraryVariantId: item.libraryVariantId ?? null,
          variantKey: item.variantKey ?? null,
          variantOf: item.componentKey ?? null,
          variantMode: item.variantMode ?? null,
          vertical: item.vertical ?? null,
          reusabilityScope: item.reusabilityScope ?? 'unclassified',
        });
        const fieldsValue = { contract: 'atoumweb_component_fields', schemaVersion: 1, fields: [] };
        const provenanceValue = {
          source: 'manager_plain_html',
          libraryItemId: item.id,
          libraryVersionId: version.id,
          libraryVersionNumber: version.versionNumber,
        };
        const copiedFiles = {
          html: addText('component/component.html', compositionItem.localHtml ?? version.contentText),
          css: compositionItem.hasLocalChanges && compositionItem.localCss
            ? addText('component/component.css', compositionItem.localCss)
            : null,
          javascript: compositionItem.hasLocalChanges && compositionItem.localJavascript
            ? addText('component/component.js', compositionItem.localJavascript)
            : null,
          fields: addText('component/fields.json', `${JSON.stringify(fieldsValue, null, 2)}\n`),
          identity: addText('component/identity.json', `${JSON.stringify(identityValue, null, 2)}\n`),
          dependencies: addText('component/dependencies.json', '[]\n'),
          sourceAssets: addText('component/source-assets.json', '[]\n'),
          provenance: addText('component/provenance.json', `${JSON.stringify(provenanceValue, null, 2)}\n`),
        };

        manifestComponents.push({
          compositionItemId: compositionItem.id,
          sortOrder: compositionItem.sortOrder,
          displayName: compositionItem.displayName,
          category: compositionItem.category,
          vertical: compositionItem.vertical,
          source: {
            libraryItemId: compositionItem.sourceItemId,
            libraryVersionId: compositionItem.sourceVersionId,
            libraryVersionNumber: compositionItem.sourceVersionNumber,
            componentFamilyId: compositionItem.componentFamilyId,
            componentKey: compositionItem.componentKey,
            libraryVariantId: compositionItem.libraryVariantId,
            variantKey: compositionItem.variantKey,
            variantMode: compositionItem.variantMode,
          },
          component: {
            libraryItemId: item.id,
            libraryVersionId: version.id,
            libraryVersionNumber: version.versionNumber,
            name: item.name,
            category: item.category,
            rootClasses: [],
            generalized: false,
            method: 'divi-code',
            identity: identityValue,
          },
          files: copiedFiles,
          transportAssets: [],
          provenance: provenanceValue,
        });
        return;
      }
      const copiedFiles: Record<string, { path: string; sha256: string } | null> = {};
      for (const [key, descriptor] of Object.entries(bridge.files ?? {})) {
        if (!descriptor?.path) {
          copiedFiles[key] = null;
          continue;
        }
        const sourceEntry = byName.get(descriptor.path);
        if (!sourceEntry) throw new Error(`Fichier ${descriptor.path} absent pour « ${compositionItem.displayName} ».`);
        const expected = String(descriptor.sha256 ?? '').replace(/^sha256:/i, '').toLowerCase();
        const actual = this.sha256(sourceEntry.data);
        if (!/^[0-9a-f]{64}$/.test(expected) || expected !== actual) {
          throw new Error(`Checksum invalide pour « ${compositionItem.displayName} » : ${descriptor.path}.`);
        }
        const targetPath = `${prefix}/${descriptor.path}`;
        entries.push({ name: targetPath, data: sourceEntry.data });
        copiedFiles[key] = { path: targetPath, sha256: actual };
      }

      if (compositionItem.hasLocalChanges && compositionItem.localHtml) {
        const replacePreparedFile = (key: 'html' | 'css' | 'javascript', fallbackPath: string, value: string | null): void => {
          const current = copiedFiles[key];
          if (current?.path) {
            const existingIndex = entries.findIndex((entry) => entry.name === current.path);
            if (existingIndex >= 0) entries.splice(existingIndex, 1);
          }
          if (!value) {
            copiedFiles[key] = null;
            return;
          }
          const data = Buffer.from(value, 'utf8');
          const path = current?.path ?? `${prefix}/${fallbackPath}`;
          entries.push({ name: path, data });
          copiedFiles[key] = { path, sha256: this.sha256(data) };
        };
        replacePreparedFile('html', 'component/component.html', compositionItem.localHtml);
        replacePreparedFile('css', 'component/component.css', compositionItem.localCss);
        replacePreparedFile('javascript', 'component/component.js', compositionItem.localJavascript);
      }

      const copiedAssets: Array<Record<string, unknown>> = [];
      for (const asset of componentManifest.assets ?? []) {
        const archivePath = typeof asset.archivePath === 'string' ? asset.archivePath : null;
        if (!archivePath) {
          copiedAssets.push({ ...asset });
          continue;
        }
        const sourceEntry = byName.get(archivePath);
        if (!sourceEntry) throw new Error(`Asset déclaré absent pour « ${compositionItem.displayName} » : ${archivePath}.`);
        const targetPath = `${prefix}/${archivePath}`;
        entries.push({ name: targetPath, data: sourceEntry.data });
        copiedAssets.push({ ...asset, archivePath: targetPath });
      }

      manifestComponents.push({
        compositionItemId: compositionItem.id,
        sortOrder: compositionItem.sortOrder,
        displayName: compositionItem.displayName,
        category: compositionItem.category,
        vertical: compositionItem.vertical,
        source: {
          libraryItemId: compositionItem.sourceItemId,
          libraryVersionId: compositionItem.sourceVersionId,
          libraryVersionNumber: compositionItem.sourceVersionNumber,
          componentFamilyId: compositionItem.componentFamilyId,
          componentKey: compositionItem.componentKey,
          libraryVariantId: compositionItem.libraryVariantId,
          variantKey: compositionItem.variantKey,
          variantMode: compositionItem.variantMode,
        },
        component: bridge.component ?? {},
        files: copiedFiles,
        transportAssets: copiedAssets,
        provenance: bridge.provenance ?? {},
      });
    });

    const manifest = {
      contract: 'atoumweb_bridge_project_package',
      schemaVersion: page ? 2 : 1,
      ...(page ? {
        scope: 'page',
        exportId: page.exportId,
        destination: {
          projectId: page.projectId,
          siteId: page.siteId,
          pageId: page.pageId,
        },
      } : {}),
      exportedAt: createdAt,
      safety: {
        flow: 'workbench_first',
        workbenchRequired: true,
        directProductionInjection: false,
        sourceLibraryMutation: false,
      },
      composition: {
        id: composition.id,
        name: composition.name,
        targetVertical: composition.targetVertical,
        notes: composition.notes,
      },
      components: manifestComponents,
    };
    if (page) {
      const errors = validateContractSchemaV1(manifest, pagePackageSchema);
      if (errors.length) throw new Error(`Package Page V2 invalide : ${errors.join(' ')}`);
    }

    entries.unshift({
      name: 'manifest.json',
      data: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
    });

    const directory = join(this.workspace.exportsDirectory, 'compositions-atoumweb');
    mkdirSync(directory, { recursive: true });
    const fileName = `${this.safeSegment(composition.name)} - ${createdAt.replace(/[:.]/g, '-')}.zip`;
    const destination = join(directory, fileName);
    writeZipArchive(destination, this.deduplicateEntries(entries));

    this.database.run(
      `INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at)
       VALUES (?,?,?,?,?,?)`,
      [
        'atoumweb_composition',
        composition.id,
        'atoumweb_composition_package_exported',
        `Package projet préparé : ${composition.name}`,
        JSON.stringify({
          path: destination,
          componentCount: composition.items.length,
          ...(page ? { exportId: page.exportId, projectId: page.projectId, siteId: page.siteId, pageId: page.pageId } : {}),
        }),
        createdAt,
      ],
    );

    return {
      compositionId: composition.id,
      exportId: page?.exportId ?? null,
      projectId: page?.projectId ?? null,
      siteId: page?.siteId ?? null,
      pageId: page?.pageId ?? null,
      path: destination,
      fileName,
      componentCount: composition.items.length,
      createdAt,
    };
  }

  assertExportPath(path: string): string {
    const root = resolve(this.workspace.exportsDirectory, 'compositions-atoumweb');
    const candidate = resolve(path);
    if (candidate !== root && !candidate.startsWith(root + sep)) {
      throw new Error('Ce chemin ne correspond pas à un export de composition AtoumWeb.');
    }
    if (basename(candidate) === candidate) throw new Error('Chemin de package de composition invalide.');
    return candidate;
  }

  private deduplicateEntries(entries: ZipEntryInput[]): ZipEntryInput[] {
    const seen = new Set<string>();
    return entries.filter((entry) => {
      if (seen.has(entry.name)) return false;
      seen.add(entry.name);
      return true;
    });
  }

  private safeSegment(value: string): string {
    const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return normalized.replace(/[^a-zA-Z0-9._ -]+/g, '').trim().replace(/\s+/g, ' ') || 'composition';
  }

  private sha256(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }
}
