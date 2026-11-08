"""Regenerate readable source columns; retain the reviewed ID mapping verbatim."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/approved/2026-11-08/CATALOGUE_V394_130_EXTRAIT_WORD.json'
DEST = ROOT / 'docs/integration-v394-v15-20261108'

def regenerate():
    records = json.loads(SOURCE.read_text(encoding='utf-8'))['references']
    target = DEST / 'RAPPROCHEMENT-CATALOGUE-130.csv'
    with target.open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f, delimiter=';')
        fields, old = reader.fieldnames, list(reader)
    by_code = {r['code_source']: r for r in old}
    assert len(old) == len(by_code) == len(records) == 130
    rows = []
    for source in records:
        r = dict(by_code[source['code_source']])
        r.update(nom_source=source['nom'], prix_source=source['prix_affiche'], statut_source=source['statut_source'])
        r['preuve'] = ('manifeste historique explicite, ID conservé' if r['id_base_reference'] else
                       'aucun équivalent identifié dans cette base ; nouvelle référence non publiée')
        rows.append(r)
    assert sum(r['statut_source'] == 'RETENU_SUR_DELEGATION_07_11_2026' for r in rows) == 47
    provisional = [r for r in rows if r['code_source'].startswith('V39-')]
    assert len(provisional) == 18
    for filename, selected in [('RAPPROCHEMENT-CATALOGUE-130.csv', rows), ('RAPPROCHEMENT-V39-18.csv', provisional)]:
        with (DEST / filename).open('w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fields, delimiter=';')
            writer.writeheader()
            writer.writerows(selected)
        with (DEST / filename).open(encoding='utf-8-sig', newline='') as f:
            assert list(csv.DictReader(f, delimiter=';')) == selected
        assert not any(token in (DEST / filename).read_text(encoding='utf-8-sig') for token in ['â‚¬', 'Ã', '\ufffd'])
    print('UTF-8 CSV: 130 references, 18 provisional, 47 delegated; source prices/names/statuses exact; IDs retained.')

if __name__ == '__main__':
    regenerate()
