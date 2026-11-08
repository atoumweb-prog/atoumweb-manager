"""Explicit read-only source snapshot; never migrate or initialize a source database."""
import argparse, hashlib, json, os, pathlib, sqlite3, tempfile

parser=argparse.ArgumentParser()
parser.add_argument('--source', required=True)
parser.add_argument('--profile', required=True)
parser.add_argument('--output', required=True)
args=parser.parse_args()
source=pathlib.Path(args.source).resolve(strict=True)
profile=pathlib.Path(args.profile).resolve(strict=True)
output=pathlib.Path(args.output).resolve()
assert 'validation-msi' not in str(source).lower(), 'Validation-MSI excluded from this preparation'
config=json.loads((profile/'workspace.json').read_text(encoding='utf-8-sig'))
assert (pathlib.Path(config['workspaceRoot'])/'data/atoumweb-manager.sqlite').resolve()==source, 'Source/profile mismatch'
assert output!=source.parent and not source.is_relative_to(output), 'Unsafe output'
output.mkdir(parents=True, exist_ok=False)
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
def fingerprints(): return {str(p):digest(p) for p in [source,pathlib.Path(str(source)+'-wal')]}
def connection(p, readonly=False, immutable=False):
    return sqlite3.connect(p.as_uri()+'?mode=ro'+('&immutable=1' if immutable else ''), uri=True) if readonly else sqlite3.connect(p)
def integrity(db):
    result={'integrity':db.execute('PRAGMA integrity_check').fetchall(), 'foreign_keys':db.execute('PRAGMA foreign_key_check').fetchall()}
    assert result=={'integrity':[('ok',)],'foreign_keys':[]}, result
    return result
before=fingerprints()
# A quiescent file with no WAL frames can be opened without creating SHM/WAL.
# A nonempty WAL MUST use the ordinary backup API view, never immutable mode.
wal=pathlib.Path(str(source)+'-wal')
no_wal_frames=not wal.exists() or wal.stat().st_size==0
src=connection(source,True,immutable=no_wal_frames)
backup_file=output/'backup-coherent.sqlite'
backup=connection(backup_file)
try:
    src.backup(backup)
    original_integrity=integrity(backup)
finally:
    backup.close();src.close()
assert fingerprints()==before, 'Source changed during snapshot; review required'
assert not no_wal_frames or not wal.exists() or wal.stat().st_size==0, 'Concurrent WAL write: snapshot refused'
# Restoration is another independent SQLite backup operation, not an opening of the active workspace.
restored_dir=pathlib.Path(tempfile.mkdtemp(prefix='atoumweb-catalog-activation-'))
restored_file=restored_dir/'restored.sqlite'
a=connection(backup_file,True);b=connection(restored_file)
try:
    a.backup(b)
    restored_integrity=integrity(b)
    assert list(a.iterdump())==list(b.iterdump()), 'Restoration logical mismatch'
finally: a.close();b.close()
report={'source':str(source),'profile':str(profile),'sourceMode':'read-only SQLite backup API, WAL-aware','immutableWithoutWalFrames':no_wal_frames,
    'sourceFingerprintsBefore':before,'sourceFingerprintsAfter':fingerprints(),'backup':str(backup_file),
    'backupSha256':digest(backup_file),'restoredCopy':str(restored_file),'backupIntegrity':original_integrity,
    'restoredIntegrity':restored_integrity,'restorationLogicalEquality':True,'migrationExecutedOnSource':False}
(output/'SAUVEGARDE-RESTAURATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
