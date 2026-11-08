"""Semantic checks for the 14 simulation exports (bundled Python + pypdf)."""
import csv
import hashlib
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from pypdf import PdfReader

repo = Path(__file__).resolve().parents[1]
root = Path(sys.argv[1]).resolve()
source_root = repo / 'data/approved/2026-11-08'
sources = json.loads((source_root / 'CATALOGUE_V394_130_EXTRAIT_WORD.json').read_text(encoding='utf-8'))['references']
by_code = {r['code_source']: r for r in sources}
manifest = json.loads((source_root / 'MANIFESTE-SOURCES.json').read_text(encoding='utf-8'))
for file, digest in manifest.items():
    assert hashlib.sha256((source_root / file).read_bytes()).hexdigest() == digest, file

def compact(s):
    return re.sub(r'\s+', '', s)

def money(cents):
    return f'{cents // 100},{cents % 100:02d}€'

sim = json.loads((root / 'simulations-documents/SIMULATIONS.json').read_text(encoding='utf-8'))
assert sim['tempOnly'] and not sim['automaticPublication']
assert len(sim['results']) == 14
assert len(list((root / 'simulations-documents').glob('*.pdf'))) == 14
assert len(list((root / 'simulations-documents').glob('*.docx'))) == 14
assert sim['foreignKeys'] == [] and str(sim['integrity']).count('ok') == 1
checks = []
for result in sim['results']:
    key, total = result['key'], result['totalCents']
    assert type(total) is int and total >= 0
    source_price = by_code[result['sourceCode']]['prix_affiche'].split('€')[0]
    assert total == round(float(re.sub(r'\s+', '', source_price).replace(',', '.')) * 100)
    rows = result['paymentSummary']['rows']
    assert sum(r['amountCents'] for r in rows) == total
    assert sum(r['percent'] for r in rows) == 100
    assert all(type(r['amountCents']) is int for r in rows)
    assert result['normalManagerVerified'] and not result['finalized']
    pdf = PdfReader(root / 'simulations-documents' / result['pdf'])
    pages = [p.extract_text() for p in pdf.pages]
    with zipfile.ZipFile(root / 'simulations-documents' / result['docx']) as z:
        xml = ET.fromstring(z.read('word/document.xml'))
        doc = '\n'.join(t.text or '' for t in xml.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'))
    word_pdf = PdfReader(root / 'rendu-word' / (key + '.pdf'))
    word_text = '\n'.join(p.extract_text() for p in word_pdf.pages)
    for name, text in [('PDF', '\n'.join(pages)), ('DOCX', doc), ('Word PDF', word_text)]:
        assert not re.search(r'NaN|undefined|Infinity|\ufffd|â‚¬|Ã', text), (key, name)
        assert money(total) in compact(text), (key, name, 'total')
        for row in rows:
            assert money(row['amountCents']) in compact(text), (key, name, row)
            assert compact(row['event']) in compact(text), (key, name, 'event')
    # Independently verify both commercial summary and annex, not just a matching number somewhere.
    assert money(total) in compact(pages[0])
    annex = compact('\n'.join(pages[1:]))
    assert 'Montantconvenu' + ':' + money(total) in annex, (key, 'annex total')
    for row in rows:
        assert money(row['amountCents']) in compact(pages[0])
        assert money(row['amountCents']) in annex
        assert compact(row['event']) in compact(pages[0])
    expected = [40, 60] if key in ['01-vitrine', '10-mariage'] else [30, 40, 30] if key.startswith(('02-', '03-', '04-')) else [100]
    assert [r['percent'] for r in rows] == expected
    checks.append({'scenario': key, 'totalCents': total, 'schedule': expected, 'sourceRule': result['paymentReference'], 'unresolved': result['paymentUnresolved'], 'pdfPages': len(pages), 'wordPages': len(word_pdf.pages), 'passed': True})

csv_report = []
for filename, count in [('RAPPROCHEMENT-CATALOGUE-130.csv', 130), ('RAPPROCHEMENT-V39-18.csv', 18)]:
    relative = 'docs/integration-v394-v15-20261108/' + filename
    data = (repo / relative).read_text(encoding='utf-8-sig')
    assert not re.search('â‚¬|Ã|\ufffd', data)
    rows = list(csv.DictReader(data.splitlines(), delimiter=';'))
    assert len(rows) == count and len({r['code_source'] for r in rows}) == count
    baseline = subprocess.check_output(['git', 'show', 'f73c187169ead502c1e242bd62ca85a9196a5e2f:' + relative], cwd=repo).decode('utf-8-sig')
    old = {r['code_source']: r for r in csv.DictReader(baseline.splitlines(), delimiter=';')}
    for r in rows:
        source = by_code[r['code_source']]
        assert (r['nom_source'], r['prix_source'], r['statut_source']) == (source['nom'], source['prix_affiche'], source['statut_source'])
        for field in ['id_base_reference', 'id_copie_TEMP', 'code_canonique_copie', 'action', 'statut_source']:
            assert r[field] == old[r['code_source']][field]
    if count == 130:
        assert sum(r['statut_source'] == 'RETENU_SUR_DELEGATION_07_11_2026' for r in rows) == 47
    else:
        assert all(r['code_source'].startswith('V39-') for r in rows)
    csv_report.append({'file': filename, 'rows': count, 'exactSourceValues': True, 'mappingIdsUnchanged': True})
report = {'passed': True, 'documents': checks, 'csv': csv_report, 'sourceManifestUnchanged': True, 'integrity': sim['integrity'], 'foreignKeys': sim['foreignKeys']}
(root / 'CONTROLES-SEMANTIQUES.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'passed': True, 'scenarios': len(checks), 'pdf': 14, 'docx': 14, 'wordRenders': 14, 'csv': csv_report}, ensure_ascii=False))
