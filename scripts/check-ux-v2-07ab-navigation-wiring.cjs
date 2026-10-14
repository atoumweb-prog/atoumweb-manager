'use strict';
// Combined candidate wiring checks: these are STATIC, not a substitute for native return-navigation tests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('src/renderer/App.tsx'),project=read('src/renderer/projects/ProjectsPage.tsx'),quote=read('src/renderer/commercial/QuotesPage.tsx');
const cases=[
 ['Project to quote sends exact source ID',project.includes("entityId: detail.sourceQuoteId")],
 ['Project to quote preserves parent project ID',project.includes('parentEntityId: detail.id')],
 ['Shared navigation reads target before guard',app.includes('await readSearchTarget(window.atoumweb,result')],
 ['Shared navigation protects dirty draft',app.includes('const allowed=requestUnsavedExit(()=>')],
 ['Return project context set only after allowed navigation',app.includes("setQuoteReturnProjectId(result.entityType === 'quote' && activePageRef.current === 'Projets'")],
 ['Quote uses context passed by shell',app.includes('returnProjectId={quoteReturnProjectId}')],
 ['Direct rail navigation clears stale source Project context',/function navigateDirect\(page: PageName\): void\s*\{\s*\/\/[^\n]*\n\s*setQuoteReturnProjectId\(null\);/.test(app)],
 ['Return action targets original project',quote.includes("entityId: returnProjectId")],
 ['Return uses shared navigate route',quote.includes("new CustomEvent('atoumweb:navigate'")],
 ['Project panel protects tab switch',project.includes('requestUnsavedExit(() => setDetailTab(tab))')],
 ['Project panel protects closing',project.includes('requestUnsavedExit(() => closeProjectDetailAllowed())')],
 ['Project overlay backdrop uses UX-01 guard',project.includes('project-production-overlay-backdrop" onClick={() => requestUnsavedExit(() => setProductionOverlay(null))}')],
 ['Project overlay close button uses UX-01 guard',project.includes('className="close-detail" onClick={() => requestUnsavedExit(() => setProductionOverlay(null))}')],
 ['Project overlay Escape uses UX-01 guard',/if \(productionOverlay\)\s*\{\s*requestUnsavedExit\(\(\) => setProductionOverlay\(null\)\);/.test(project)],
];for(const [name,condition] of cases){assert.ok(condition,name);console.log('PASS '+name)}console.log('PASS '+cases.length+' static navigation wiring checks (not Electron interactions)');
