"""Opt-in recovery into a NEW workspace only; never opens an original SQLite file.

Inputs are previously verified owned copies under outputs/. File trees are read only.
Existing destinations, conflicting identities/content, symlinks and FK errors fail closed.
No source database, bootstrap/profile or launcher is modified.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import sys


def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def quote(name):
    return '"' + name.replace('"', '""') + '"'


def readonly(path):
    db = sqlite3.connect(Path(path).resolve().as_uri() + '?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA query_only=ON')
    return db


def tables(db):
    return [row[1] for row in db.execute('PRAGMA table_list')
            if row[2] == 'table' and not row[1].startswith('sqlite_')]


def rows(db, table):
    return [dict(row) for row in db.execute('SELECT * FROM ' + quote(table))]


def merge_rows(target, source):
    """Restore a verified snapshot, with identical triggers restored before commit.

    Triggers are suspended ONLY inside this new database's transaction: replaying
    historical immutable/frozen records must not generate fresh demo/audit rows.
    Full row comparison and FK validation follow; normal runtime guards remain intact.
    """
    triggers = target.execute("SELECT name,sql FROM sqlite_master WHERE type='trigger' ORDER BY name").fetchall()
    target.execute('PRAGMA foreign_keys=OFF')
    target.execute('BEGIN IMMEDIATE')
    inserted, counters = {}, []
    try:
        for name, _ in triggers:
            target.execute('DROP TRIGGER ' + quote(name))
        for table in tables(source):
            if table == 'search_documents':
                # Derived search projection: rebuilt by actual DatabaseService startup.
                continue
            if table == 'schema_migrations':
                expected = {r['id']: r for r in rows(target, table)}
                assert all(expected.get(r['id']) == r for r in rows(source, table)), 'Migration history conflict'
                continue
            info = target.execute('PRAGMA table_info(' + quote(table) + ')').fetchall()
            columns = [r[1] for r in info]
            pk = [r[1] for r in sorted(info, key=lambda r: r[5]) if r[5]]
            assert pk, 'No stable primary key: ' + table
            existing = {tuple(r[k] for k in pk): r for r in rows(target, table)}
            inserted[table] = 0
            for row in rows(source, table):
                assert set(row).issubset(columns), 'Schema mismatch: ' + table
                key = tuple(row[k] for k in pk)
                previous = existing.get(key)
                if previous is not None:
                    if table == 'number_sequences':
                        # Never reuse an already issued number; keep the complete winning row.
                        if row['current_value'] > previous['current_value']:
                            target.execute('UPDATE number_sequences SET current_value=?,updated_at=? WHERE sequence_key=? AND sequence_year=?',
                                           (row['current_value'], row['updated_at'], *key))
                            counters.append({'key': list(key), 'value': row['current_value']})
                    else:
                        assert all(previous[k] == v for k, v in row.items()), 'Conflicting identity: ' + table + ' ' + str(key)
                    continue
                names = list(row)
                target.execute('INSERT INTO ' + quote(table) + ' (' + ','.join(map(quote, names)) + ') VALUES (' + ','.join('?' for _ in names) + ')', list(row.values()))
                existing[key] = row
                inserted[table] += 1
        for _, sql in triggers:
            target.execute(sql)
        assert [tuple(r) for r in target.execute("SELECT name,sql FROM sqlite_master WHERE type='trigger' ORDER BY name")] == [tuple(r) for r in triggers], 'Trigger definitions changed'
        assert not target.execute('PRAGMA foreign_key_check').fetchall(), 'Broken historical relationship'
        target.commit()
        target.execute('PRAGMA foreign_keys=ON')
        return inserted, counters
    except BaseException:
        target.rollback()
        raise


def verify_source(target, source, original_root, destination):
    proof = {}
    for table in tables(source):
        if table in ('schema_migrations', 'number_sequences', 'search_documents'):
            continue
        info = source.execute('PRAGMA table_info(' + quote(table) + ')').fetchall()
        pk = [r[1] for r in sorted(info, key=lambda r: r[5]) if r[5]]
        actual = {tuple(r[k] for k in pk): r for r in rows(target, table)}
        expected = rows(source, table)
        for row in expected:
            for column in ('resource_root_path', 'package_path'):
                value = row.get(column)
                if isinstance(value, str) and value.lower().startswith(str(original_root).lower() + '\\'):
                    row[column] = str(destination / value[len(str(original_root)) + 1:])
            assert all(actual[tuple(row[k] for k in pk)][k] == v for k, v in row.items()), 'Source row changed: ' + table
        proof[table] = len(expected)
    return proof


def prepare(config):
    output = Path(config['destination']).resolve()
    assert not output.exists(), 'Refusing existing destination'
    copies = [Path(config[k]).resolve() for k in ('currentCopy', 'historyCopy')]
    assert all('outputs' in p.parts and p.is_file() for p in copies), 'Only owned SQLite copies accepted'
    for root in map(lambda p: Path(p).resolve(), config['fileRoots']):
        assert not output.is_relative_to(root) and not root.is_relative_to(output), 'Destination overlaps a source tree'
    inputs = [(p, digest(p)) for p in copies]
    current, history = map(readonly, copies)
    output.mkdir(parents=True)
    report = {'destination': str(output), 'sources': [{'copy': str(p), 'sha256': h} for p, h in inputs], 'filesCopied': 0, 'identicalFiles': 0}
    target = None
    try:
        (output / 'data').mkdir()
        target = sqlite3.connect(output / 'data/atoumweb-manager.sqlite')
        target.row_factory = sqlite3.Row
        current.backup(target)
        report['inserted'], report['counters'] = merge_rows(target, history)
        old_root = Path(config['originalRoot'])
        # Deliberately narrow whitelist: legal text, URLs and provenance are never rewritten.
        report['rebasedPaths'] = 0
        for table, column in [('projects', 'resource_root_path'), ('project_page_exports', 'package_path')]:
            for row in rows(target, table):
                value = row[column]
                if value and value.lower().startswith(str(old_root).lower() + '\\'):
                    replacement = str(output / value[len(str(old_root)) + 1:])
                    target.execute('UPDATE ' + quote(table) + ' SET ' + quote(column) + '=? WHERE id=?', (replacement, row['id']))
                    report['rebasedPaths'] += 1
        target.commit()
        report['currentPreserved'] = verify_source(target, current, old_root, output)
        report['historicalPreserved'] = verify_source(target, history, old_root, output)
        assert target.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        assert not target.execute('PRAGMA foreign_key_check').fetchall()
        for root in map(Path, config['fileRoots']):
            for folder, dirs, files in os.walk(root):
                if Path(folder) == root:
                    dirs[:] = [d for d in dirs if d not in ('data', 'backups')]
                assert all(not (Path(folder) / d).is_symlink() for d in dirs), 'Linked source directory refused'
                assert not Path(folder).is_symlink(), 'Linked source directory refused'
                for name in files:
                    source = Path(folder) / name
                    assert not source.is_symlink(), 'Linked source file refused'
                    relative = source.relative_to(root)
                    # Source backup provenance retained separately, never overwrite another source.
                    if relative.name == 'SAUVEGARDE_PROVENANCE.json':
                        relative = Path('reference-provenance') / (root.name + '.json')
                    destination = output / relative
                    before = digest(source)
                    if destination.exists():
                        assert digest(destination) == before, 'File content conflict: ' + str(relative)
                        report['identicalFiles'] += 1
                    else:
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(source, destination)
                        assert digest(destination) == before
                        report['filesCopied'] += 1
                    assert digest(source) == before, 'Source changed during copy'
        assert all(digest(p) == h for p, h in inputs), 'Input copy changed'
        report['integrity'] = True
        report['foreignKeys'] = True
        report['validated'] = True
        (output / 'REFERENCE-PREPARATION.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
        return report
    finally:
        current.close()
        history.close()
        if target:
            target.close()


if __name__ == '__main__':
    assert len(sys.argv) == 2, 'Usage: python prepare-reference-workspace.py CONFIG.json'
    print(json.dumps(prepare(json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))), indent=2))
