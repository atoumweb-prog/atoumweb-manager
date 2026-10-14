'use strict';
// Combined candidate wiring checks: these are STATIC, not a substitute for native return-navigation tests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('src/renderer/App.tsx'),project=read('src/renderer/projects/ProjectsPage.tsx'),quote=read('src/renderer/commercial/QuotesPage.tsx'),confirm=read('src/renderer/ui/useSearchTargetConfirmation.ts'),sites=read('src/renderer/projects/ProjectSitesTab.tsx');
const cases=[
 ['Project to quote sends exact source ID',project.includes("entityId: detail.sourceQuoteId")],
 ['Project to quote preserves parent project ID',project.includes('parentEntityId: detail.id')],
 ['Shared navigation reads target before guard',app.includes('await readSearchTarget(window.atoumweb,result')],
 ['Shared navigation protects dirty draft',app.includes('const allowed=requestUnsavedExit(()=>')],
 ['Return Project link is set inside allowed navigation callback',app.includes('const allowed=requestUnsavedExit(()=>') && app.includes('setQuoteReturnProjectId(fromProjectQuote ? result.parentEntityId ?? null : null)')],
 ['Quote uses context passed by shell',app.includes('returnProjectId={quoteReturnProjectId}')],
 ['Direct rail navigation clears stale source Project context',/function navigateDirect\(page: PageName\): void\s*\{\s*\/\/[^\n]*\n\s*setQuoteReturnProjectId\(null\);/.test(app)],
 ['Project context travels from source button',project.includes('projectContext: { projectId: detail.id, detailTab, selectedNodeId')],
 ['Project context stores only after approved navigation',app.includes("setProjectReturnContext(previous => {") && app.includes("sourceContext?.projectId === result.parentEntityId") && app.includes("const fromProjectQuote = result.entityType === 'quote' && activePageRef.current === 'Projets'")],
 ['Project return restores matching source Project only',app.includes("projectReturnContext?.projectId === projectSearchTarget") && project.includes("returnContext?.projectId === id ? returnContext.detailTab : 'plan'")],
 ['Project navigation confirmation works outside Production tab',confirm.includes("project:'.project-production-page'") && project.includes('className={`project-production-page')],
 ['Project return only restores existing nodes',project.includes('const availableNodes = new Set(next.nodes.map(node => node.id))') && project.includes('availableNodes.has(returnContext.selectedNodeId)')],
 ['Project return retains production tree state',project.includes('returnContext?.projectId === id ? returnContext.productionTreeCollapsed : false')],
 ['Site/Page selection captured with Project return context',project.includes('sitesViewContext } } }))') && project.includes('onViewContextChange={setSitesViewContext}')],
 ['Site/Page view restores only existing Site and Page identities',sites.includes('initialViewContext?.selectedSiteId ?? null') && sites.includes('initialViewContext?.selectedPageId ?? null') && sites.includes('const siteStillExists') && sites.includes('const pageStillExists')],
 ['Site/Page and timer mutations share same-tick concurrency gate',sites.includes('if (mutationPending.current) return false;') && (sites.match(/if \(!beginMutation\(\)\) return;/g) ?? []).length === 7],
 ['Independent page events clear stale return context',app.includes('visibleEntity.current=null;setQuoteReturnProjectId(null);setProjectReturnContext(null);')],
 ['Direct rail navigation clears Project workspace snapshot',app.includes('setProjectReturnContext(null);')],
 ['Provisional source Quote not falsely marked accepted',project.includes("project.commercialState === 'provisional' ? 'Devis non accepté'")],
 ['Return action targets original project',quote.includes("entityId: returnProjectId")],
 ['Return uses shared navigate route',quote.includes("new CustomEvent('atoumweb:navigate'")],
 ['Project panel protects tab switch',project.includes('requestUnsavedExit(() => setDetailTab(tab))')],
 ['Project panel protects closing',project.includes('requestUnsavedExit(() => closeProjectDetailAllowed())')],
 ['Project overlay backdrop uses UX-01 guard',project.includes('project-production-overlay-backdrop" onClick={() => requestUnsavedExit(() => setProductionOverlay(null))}')],
 ['Project overlay close button uses UX-01 guard',project.includes('className="close-detail" onClick={() => requestUnsavedExit(() => setProductionOverlay(null))}')],
 ['Project overlay Escape uses UX-01 guard',/if \(productionOverlay\)\s*\{\s*requestUnsavedExit\(\(\) => setProductionOverlay\(null\)\);/.test(project)],
];for(const [name,condition] of cases){assert.ok(condition,name);console.log('PASS '+name)}console.log('PASS '+cases.length+' static navigation wiring checks (not Electron interactions)');
