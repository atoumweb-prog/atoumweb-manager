"""Deterministic read-only extraction of the synchronized contractual workbook. No XLSX/DB writes."""
import argparse, hashlib, json, re
from pathlib import Path
from collections import Counter
import openpyxl
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('documents',type=Path);p.add_argument('output',type=Path);p.add_argument('manifest',type=Path);a=p.parse_args()
assert a.output.suffix==a.manifest.suffix=='.json' and a.output.resolve()!=a.manifest.resolve()
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
expected='6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8'
assert sha(a.source)==expected,'Source contractuelle différente du XLSX synchronisé validé du 03/10'
w=openpyxl.load_workbook(a.source,read_only=True,data_only=False)
def sheet(name,headers):
 rows=list(w[name].values);assert list(rows[0])==headers,(name,'En-têtes inattendus')
 return [(i,r) for i,r in enumerate(rows[1:],2) if r[0] is not None]
refs=sheet('Référentiel clauses',['Code','Intitulé','Origine','Scope','Audience','Prestations AW-* déclenchantes','Dépendances documentaires','Paramètres du devis','Statut juridique','Statut rédactionnel'])
bodies=dict((r[0],(i,r)) for i,r in sheet('Textes brouillons',['Code','Texte brouillon','Paramètres du devis','Dépendances','Réserve juridique','Statut rédactionnel','Source']))
reviews=dict((r[0],(i,r)) for i,r in sheet('C Revue juridique',['Code','Audience','Réserve juridique','Publication','Niveau de revue','Risque documenté','Mesure de prudence','Appui externe','URL officielles','Dernière vérification connue','Revue finale','Décisions métier']))
decisions=dict((r[0],(i,r)) for i,r in sheet('Décisions juridiques',['Code','Décision validée','Application au texte','État de suivi','Motif','Actions hors clauses','Réserve avant publication']))
carto=sheet('Cartographie AW',['Code AtoumWeb/Abby','Prestation','Famille','Type','Socle automatique','Clauses spécifiques déclenchées','État cartographie','Note'])
records=[]
for i,r in refs:
 code,title,origin,scope,audience,aws,deps,params,legal,editorial=r
 bi,b=bodies[code];ri,v=reviews[code];di,d=decisions[code]
 assert isinstance(b[1],str) and b[1].strip() and not b[1].startswith('=') and '\ufffd' not in b[1],(code,'Texte absent/formule/encodage')
 assert scope in ['base','catalog'] and audience in ['all','professional','consumer'] and v[1]==audience
 assert 'BROUILLON' in b[5] and 'BROUILLON' in editorial and v[11]=='Aucun arbitrage métier ouvert'
 assert b[2]==params and b[3]==deps and b[4]==legal and v[2]==legal,(code,'Copies de métadonnées divergentes')
 assert re.fullmatch(r'[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*',code)
 review={'level':v[4],'sources':v[8],'verifiedAt':v[9],'reserve':legal,'risk':v[5],'prudence':v[6],'externalSupport':v[7],'finalReview':v[10],'businessDecisions':v[11],
 'editorialDecision':d[1],'decisionReason':d[4],'outsideActions':d[5],'editorialStatus':editorial,'origin':origin,'parameters':params,'dependencies':deps,'textSource':b[6],
 'provenance':{'reference':a.source.name,'sha256':expected,'referenceCell':f"Référentiel clauses!A{i}:J{i}",'bodyCell':f"Textes brouillons!B{bi}",'reviewCell':f"C Revue juridique!A{ri}:L{ri}",'decisionCell':f"Décisions juridiques!A{di}:G{di}"}}
 records.append({'code':code,'title':title,'scope':scope,'audience':audience,'sortOrder':(i-2)*10,'body':b[1],'review':review})
links=[]
for i,r in carto:
 assert re.fullmatch(r'AW-[A-Z0-9]+(?:-[A-Z0-9]+)*',r[0])
 for index,c in enumerate((r[5] or '').split(';')):
  if c.strip():links.append({'awCode':r[0],'clauseCode':c.strip(),'sortOrder':index*10,'sourceCell':f'Cartographie AW!F{i}'})
assert len(records)==len({r['code'] for r in records})==118 and set(bodies)==set(reviews)==set(decisions)=={r['code'] for r in records}
assert Counter(r['scope'] for r in records)=={'base':19,'catalog':99}
assert Counter(r['audience'] for r in records)=={'all':105,'professional':3,'consumer':10}
assert Counter(r['review']['editorialDecision'] for r in records)=={'modifier':42,'inchangé':52,'compléter hors clause':22,'qualification préalable':2}
assert len(links)==len({(l['awCode'],l['clauseCode']) for l in links})==409
pairs={(l['awCode'],l['clauseCode']) for l in links}
assert pairs=={(aw.strip(),r[0]) for i,r in refs for aw in (r[5] or '').split(';') if aw.strip().startswith('AW-')},'Cartographies divergentes'
assert not any(next(r for r in records if r['code']==l['clauseCode'])['scope']=='base' for l in links)
assert {r['code'] for r in records if r['scope']=='catalog' and not any(l['clauseCode']==r['code'] for l in links)}=={'LANDING-GESTION'}
archives=[r[0] for r in list(w['Archives 27'].values)[1:] if r[0]];aliases=[r[0] for r in list(w['Alias historiques'].values)[1:] if r[0]]
assert len(archives)==27 and not (set(archives+aliases+['CONS-RETRACTATION-EN-LIGNE']) & {r['code'] for r in records})
documents=[{'reference':f.name,'sha256':sha(f)} for f in sorted(a.documents.glob('*.md'))]
assert len(documents)==8 and expected in (a.documents/'README.md').read_text(encoding='utf-8-sig')
source={'schemaVersion':1,'source':{'reference':a.source.name,'sha256':expected,'doctrineDate':'2026-10-03','documents':documents},'records':records,'links':links}
# Freeze this exact extraction and all explicit canonical IDs; no aliases are executable mappings.
serialized=json.dumps(source,ensure_ascii=False,indent=2)+'\n'
manifest={'schemaVersion':1,'reference':'AtoumWeb bibliothèque contractuelle V1 synchronisée 03/10, Lot 4 BROUILLON','sourceSha256':expected,'extractionSha256':hashlib.sha256(serialized.encode('utf-8')).hexdigest(),
 'canonicalCodes':[r['code'] for r in records],'awCodes':[r[0] for i,r in carto],'excludedCodes':sorted(set(archives+aliases+['CONS-RETRACTATION-EN-LIGNE'])),'dormantCodes':['LANDING-GESTION'],
 'expected':{'clauses':118,'versions':118,'links':409,'scope':{'base':19,'catalog':99},'audience':{'all':105,'professional':3,'consumer':10},'editorial':{'modifier':42,'inchangé':52,'compléter hors clause':22,'qualification préalable':2},'review':{'Vérifié sur sources officielles':22,'Vérifié avec réserve':81,'Incertitude résiduelle':7,'Validation externe recommandée mais non prévue':7,'Fonctionnalité à ne pas activer sans nouvelle vérification':1}}}
w.close();assert sha(a.source)==expected
for f in [a.output,a.manifest]:f.parent.mkdir(parents=True,exist_ok=True)
a.output.write_bytes(serialized.encode('utf-8'));a.manifest.write_bytes((json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
print(json.dumps({'clauses':118,'links':409,'aw':len(carto),'sourceSha256':expected,'extractionSha256':manifest['extractionSha256']},ensure_ascii=False))
