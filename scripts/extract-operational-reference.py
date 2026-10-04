"""Read-only XLSX extraction. Output carries source rows and approved checklist overlays."""
import argparse, hashlib, json
from pathlib import Path
import openpyxl

def extract(file):
    p = Path(file)
    workbook = openpyxl.load_workbook(p, read_only=True, data_only=True)
    def records(sheet):
        rows = list(workbook[sheet].values)
        return [(i, dict(zip(rows[0], row))) for i, row in enumerate(rows[1:], 2) if row[0]]
    actions = {}
    keys = set()
    for row, a in records('Actions'):
        key = a['Clé action']
        if key in keys:
            raise ValueError('Duplicate action key: '+key)
        keys.add(key)
        actions.setdefault(a['Code AW'], []).append(dict(key=key, phase=a['Phase'], name=a['Action'],
            checklist=a['Checklist / périmètre'] or '', minutes=a['Temps réf. (min)'], category=a['Catégorie temps'],
            required=a['Obligatoire']=='Oui', sourceRow=row))
    models = []
    for row, r in records('References'):
        code = r['Code AW']
        aa = actions.get(code, [])
        if len(aa)!=r['Nb actions'] or sum(a['minutes'] for a in aa)!=r['Charge modèle (min)']:
            raise ValueError('Inconsistent reference '+code)
        models.append(dict(code=code, name=r['Intitulé'], lot=r['Lot cible'], model=r['Modèle opérationnel'], unit=r['Unité'],
            estimateRequired=r['Estimation obligatoire']=='Oui', quantityRule=r['Règle de quantité'], recurrence=r['Récurrence'],
            trigger=r['Déclencheur'], creditMinutes=r['Crédit temps (min)'], referenceMinutes=r['Charge modèle (min)'],
            sourceRow=row, notes=r['Notes V1'] or '', actions=aa))
    if len(models)!=112 or len({m['code'] for m in models})!=112 or len(keys)!=432:
        raise ValueError('Expected exactly 112 references / 432 actions')
    changes = {
        'AW-WEB-VITRINE-A19': 'création/vérification d’un point de restauration avant publication',
        'AW-WEB-VITRINE-A16': 'contrôle du fonctionnement technique du mécanisme de consentement ; aucune validation juridique de conformité',
    }
    decisions=[]
    for m in models:
        for a in m['actions']:
            if a['key'] in changes:
                original=a['checklist']; a['checklist']=original+' ; '+changes[a['key']]
                decisions.append(dict(key=a['key']+'-REVUE-2026-10-04', source='Décision AtoumWeb validée le 04/10/2026',
                    actionKey=a['key'], originalChecklist=original, checklist=a['checklist']))
    return dict(schemaVersion=1, source=dict(file=p.name,sha256=hashlib.sha256(p.read_bytes()).hexdigest()), models=models, decisions=decisions)

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--workbook',required=True); parser.add_argument('--output',required=True)
    args=parser.parse_args()
    result=extract(args.workbook)
    Path(args.output).parent.mkdir(parents=True,exist_ok=True)
    Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(references=len(result['models']),actions=sum(len(m['actions']) for m in result['models']),sourceSHA=result['source']['sha256'],approvedOverlays=len(result['decisions']))))
