// Static adoption evidence, NOT a functional or visual acceptance certificate.
const fs=require('node:fs'),path=require('node:path');
const files=['App','home/HomeDashboard','crm/ProspectsPageV2','crm/ClientsPage','directory/DirectoryPage','commercial/CatalogPage','commercial/ContractLibraryPage','commercial/QuotesPage','projects/ProjectsPage','referentials/AtoumWebLibraryPage','operations/OperationsPage','time/TimePage','billing/BillingPage','expenses/ExpensesPage','documents/DocumentsPage','statistics/StatisticsPage','bridge/BridgeSitesPage','backups/BusinessBackupsPage'];
console.log('| Fichier renderer | Tables natives | AppButton directs | Tableau configurable | FieldHelp directs | Gardes directes |');
console.log('|---|---:|---:|---:|---:|---:|');
for(const name of files){const file='src/renderer/'+name+'.tsx';if(!fs.existsSync(path.resolve(__dirname,'..',file)))continue;const s=fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),n=pattern=>(s.match(pattern)||[]).length;console.log(`| \`${file}\` | ${n(/<table[\s>]/g)} | ${n(/<AppButton[\s>]/g)} | ${n(/<ConfiguredDataTable[\s<]/g)} | ${n(/<FieldHelp[\s>]/g)} | ${n(/requestUnsavedExit|useUnsavedDraft/g)} |`);}
