"""Read-only extraction of the approved workbook's commercial columns. Never edits XLSX or SQLite."""
import argparse
import hashlib
import json
import re
from pathlib import Path
import openpyxl

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
if args.output.resolve() == args.source.resolve() or args.output.suffix.lower() != '.json':
    raise ValueError('La destination doit être un fichier JSON distinct du classeur source.')
source_hash = hashlib.sha256(args.source.read_bytes()).hexdigest()
workbook = openpyxl.load_workbook(args.source, read_only=True, data_only=True)
rows = list(workbook['Catalogue'].values)
expected = ['Code AtoumWeb/Abby', 'Famille', 'Type', 'Prestation', 'Libellé Abby', 'Tarif', 'Mode tarifaire', 'Unité', 'Besoin client', 'Inclus', 'À faire par AtoumWeb', 'Prérequis client', 'Exclusions', 'Options / compléments', 'Sur devis si…', 'Livrables', 'Délai', 'Corrections / recette', 'Garantie', 'Coûts tiers']
assert list(rows[0][:20]) == expected, 'Structure commerciale du classeur inattendue'
kind = {'Offre': 'offer', 'Service': 'service', 'Option': 'option', 'Pack': 'pack', 'Abonnement': 'subscription'}
mode = {'Fixe': 'fixed', 'À partir de': 'starting_from', 'Sur devis': 'quote_only', 'Coût tiers': 'quote_only'}
split = lambda value: [part.strip() for part in (value or '').split(';') if part.strip()]
records = []
for row_number, row in enumerate(rows[1:], 2):
    code, family, nature, name, abby, price_label, price_mode, unit = row[:8]
    assert re.fullmatch(r'AW-[A-Z0-9]+(?:-[A-Z0-9]+)*', code)
    if price_mode in ('Sur devis', 'Coût tiers'):
        assert price_label == ('Sur devis' if price_mode == 'Sur devis' else 'Coût réel'), (code, price_label)
        price = None
    else:
        assert re.fullmatch(r'[0-9 ]+(?:,[0-9]{1,2})? €', price_label), (code, price_label)
        from decimal import Decimal
        price = int(Decimal(price_label.replace(' €', '').replace(' ', '').replace(',', '.')) * 100)
    parameters = dict(zip(['clientNeed','work','options','quoteRequiredWhen','deliverables','deliveryTerms','reviewTerms','correctiveWarranty','thirdPartyCosts'], [row[i] for i in [8,10,13,14,15,16,17,18,19]]))
    parameters['sourcePriceLabel'] = price_label
    records.append({'canonicalCode': code, 'name': name, 'type': 'offer' if nature == 'Offre' else 'service', 'category': family,
        'version': {'commercialKind': kind[nature], 'familyCode': family, 'abbyLabel': abby, 'unit': unit,
            'periodicity': 'mensuelle' if unit == 'mois' else 'annuelle' if unit == 'an' else 'ponctuelle',
            'priceMode': mode[price_mode], 'priceCents': price, 'priceBasis': 'actual_cost' if price_mode == 'Coût tiers' else 'listed',
            'nature': name, 'description': row[8], 'inclusions': split(row[9]), 'exclusions': split(row[12]), 'prerequisites': split(row[11]),
            'specialTerms': None, 'commercialParameters': parameters,
            'provenance': {'reference': args.source.name, 'sha256': source_hash, 'recordKey': f'Catalogue!A{row_number}:T{row_number}'}}})
workbook.close()
assert len(records) == 112 and len({r['canonicalCode'] for r in records}) == 112
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps({'schemaVersion': 1, 'source': {'reference': args.source.name, 'sha256': source_hash, 'sheet': 'Catalogue'}, 'records': records}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'records': len(records), 'sourceSha256': source_hash, 'output': str(args.output)}, ensure_ascii=False))
