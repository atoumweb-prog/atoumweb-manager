"""Permanent isolated regression checks for the opt-in recovery tool."""
import sqlite3
import unittest
from prepare_reference_workspace_loader import recovery


class ReferenceRecoveryTests(unittest.TestCase):
    def databases(self):
        result = []
        for _ in range(2):
            db = sqlite3.connect(':memory:')
            db.row_factory = sqlite3.Row
            db.executescript('''
                CREATE TABLE parents(id TEXT PRIMARY KEY);
                CREATE TABLE sessions(id TEXT PRIMARY KEY, parent_id TEXT REFERENCES parents(id), seconds INTEGER);
                CREATE TABLE events(id INTEGER PRIMARY KEY, text TEXT);
                CREATE TABLE number_sequences(sequence_key TEXT, sequence_year INTEGER, current_value INTEGER, updated_at TEXT, PRIMARY KEY(sequence_key,sequence_year));
                CREATE TRIGGER on_session AFTER INSERT ON sessions BEGIN INSERT INTO events(text) VALUES ('new runtime action'); END;
            ''')
            result.append(db)
            self.addCleanup(db.close)
        return result

    def test_restores_exact_ids_without_replaying_runtime_side_effects(self):
        target, source = self.databases()
        source.executescript("INSERT INTO parents VALUES ('project-original'); INSERT INTO sessions VALUES ('session-original','project-original',1879);")
        source.execute('DELETE FROM events')
        source.commit()
        recovery.merge_rows(target, source)
        self.assertEqual(tuple(target.execute('SELECT * FROM sessions').fetchone()), ('session-original', 'project-original', 1879))
        self.assertEqual(target.execute('SELECT COUNT(*) FROM events').fetchone()[0], 0)
        recovery.merge_rows(target, source)
        self.assertEqual(target.execute('SELECT COUNT(*) FROM sessions').fetchone()[0], 1)
        target.execute("INSERT INTO sessions VALUES ('later','project-original',1)")
        self.assertEqual(target.execute('SELECT COUNT(*) FROM events').fetchone()[0], 1)

    def test_conflict_rolls_back_and_restores_triggers(self):
        target, source = self.databases()
        target.executescript("INSERT INTO parents VALUES ('same'); INSERT INTO sessions VALUES ('same','same',1);")
        source.executescript("INSERT INTO parents VALUES ('new'); INSERT INTO parents VALUES ('same'); INSERT INTO sessions VALUES ('same','same',2);")
        with self.assertRaisesRegex(AssertionError, 'Conflicting identity'):
            recovery.merge_rows(target, source)
        self.assertEqual(target.execute('SELECT COUNT(*) FROM parents').fetchone()[0], 1)
        self.assertEqual(target.execute('SELECT seconds FROM sessions').fetchone()[0], 1)
        self.assertIsNotNone(target.execute("SELECT name FROM sqlite_master WHERE name='on_session'").fetchone())

    def test_missing_parent_rolls_back(self):
        target, source = self.databases()
        source.execute("INSERT INTO sessions VALUES ('orphan','absent',12)")
        source.commit()
        with self.assertRaisesRegex(AssertionError, 'Broken historical relationship'):
            recovery.merge_rows(target, source)
        self.assertEqual(target.execute('SELECT COUNT(*) FROM sessions').fetchone()[0], 0)

    def test_counter_retains_greatest_issued_number(self):
        target, source = self.databases()
        target.execute("INSERT INTO number_sequences VALUES ('quote',2026,1,'current')")
        source.execute("INSERT INTO number_sequences VALUES ('quote',2026,467,'history')")
        target.commit()
        source.commit()
        recovery.merge_rows(target, source)
        self.assertEqual(tuple(target.execute('SELECT current_value,updated_at FROM number_sequences').fetchone()), (467, 'history'))
        recovery.merge_rows(target, source)
        self.assertEqual(target.execute('SELECT current_value FROM number_sequences').fetchone()[0], 467)


if __name__ == '__main__':
    unittest.main()
