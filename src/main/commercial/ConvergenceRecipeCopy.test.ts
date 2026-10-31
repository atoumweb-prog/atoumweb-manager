import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ContractEditorialDraftService, type ContractEditorialProposalDocument } from './ContractEditorialDraftService';
import { CatalogCommercialConvergenceService, type CatalogCommercialConvergenceSource } from './CatalogCommercialConvergenceService';

const sourcePath=process.env.ATOUMWEB_RECIPE_SOURCE_DB;
const copyPath=process.env.ATOUMWEB_RECIPE_COPY_DB;
const root=resolve(__dirname,'../../..');
const editorial=JSON.parse(readFileSync(resolve(root,'docs/ux-v2/bibliotheque-humaine-118-20261025/PROPOSITIONS.json'),'utf8')) as ContractEditorialProposalDocument;
const catalog=JSON.parse(readFileSync(resolve(root,'data/catalogue/atoumweb-commercial-convergence-20261031.json'),'utf8')) as CatalogCommercialConvergenceSource;
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

describe.skipIf(!sourcePath||!copyPath)('recette de convergence sur copie isolée',()=>{
  it('migre, prépare, rejoue et contrôle la conservation historique',()=>{
    mkdirSync(dirname(copyPath!),{recursive:true});copyFileSync(sourcePath!,copyPath!);
    const db=new NodeSqliteAdapter(copyPath!);
    try{
      applyPendingMigrations(db);
      const before={
        quotes:db.all('SELECT * FROM quotes ORDER BY id'),
        quoteClauses:db.all('SELECT id,quote_id,source_clause_version_id,title,body,enabled,sort_order FROM quote_contract_clauses ORDER BY id'),
        publishedClauses:db.all("SELECT id,clause_id,version_number,title,body,status FROM contract_clause_versions WHERE status='published' ORDER BY id"),
        publishedCatalog:db.all("SELECT id,item_id,version_number,price_cents,price_mode,status FROM catalog_versions WHERE status='published' ORDER BY id"),
      };
      const contractService=new ContractEditorialDraftService(db),catalogService=new CatalogCommercialConvergenceService(db);
      const contractPlan=contractService.simulate(editorial,'Recette isolée 2026-10-31');
      expect(contractPlan.anomalies).toEqual([]);expect(contractPlan.counts.draftsToCreate).toBe(118);
      const catalogPlan=catalogService.simulate(catalog);expect(catalogPlan).toHaveLength(6);
      expect(db.get('SELECT canonical_code FROM catalog_items WHERE id=\'atoumweb-wordpress\'')).toEqual({canonical_code:null});
      contractService.apply(editorial,'Recette isolée 2026-10-31',contractPlan.planSha256);
      catalogService.apply(catalog,catalogPlan);
      expect(db.get('SELECT canonical_code FROM catalog_items WHERE id=\'atoumweb-wordpress\'')).toEqual({canonical_code:'AW-MAINT-WP-M'});
      expect(db.get<{n:number}>("SELECT COUNT(*) n FROM catalog_items WHERE canonical_code IN ('AW-MAINT-WP-M','AW-MAINT-WC-M')")).toEqual({n:2});
      const replayContract=contractService.simulate(editorial,'Recette isolée 2026-10-31');
      expect(replayContract.counts).toEqual({draftsToCreate:0,draftsKept:118,conflicts:0});
      expect(()=>catalogService.apply(catalog,catalogPlan.map((row,index)=>index?row:{...row,nextVersionNumber:999}))).toThrow(/plan Catalogue a changé/);
      catalogService.apply(catalog,catalogPlan);
      const after={
        quotes:db.all('SELECT * FROM quotes ORDER BY id'),
        quoteClauses:db.all('SELECT id,quote_id,source_clause_version_id,title,body,enabled,sort_order FROM quote_contract_clauses ORDER BY id'),
        publishedClauses:db.all("SELECT id,clause_id,version_number,title,body,status FROM contract_clause_versions WHERE status='published' ORDER BY id"),
        publishedCatalog:db.all("SELECT id,item_id,version_number,price_cents,price_mode,status FROM catalog_versions WHERE status='published' ORDER BY id"),
      };
      expect(after).toEqual(before);
      const report={sourcePath,copyPath,createdAt:new Date().toISOString(),reconciledLegacyItems:['atoumweb-wordpress','atoumweb-woocommerce'],duplicates:0,beforeHashes:{quotes:hash(before.quotes),quoteClauses:hash(before.quoteClauses),publishedClauses:hash(before.publishedClauses),publishedCatalog:hash(before.publishedCatalog)},afterHashes:{quotes:hash(after.quotes),quoteClauses:hash(after.quoteClauses),publishedClauses:hash(after.publishedClauses),publishedCatalog:hash(after.publishedCatalog)},prepared:{contractDrafts:118,catalogDrafts:6},idempotence:'ok',rollback:'ok',historicalPreservation:'ok'};
      writeFileSync(resolve(dirname(copyPath!),'RECETTE-CONVERGENCE.json'),JSON.stringify(report,null,2)+'\n');
    }finally{db.close();}
  });
});
