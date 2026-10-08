import { backup, DatabaseSync } from 'node:sqlite';
import type { DatabaseAdapter, DatabaseRunResult, SqlValue } from './DatabaseAdapter';

export class NodeSqliteAdapter implements DatabaseAdapter {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    this.database = new DatabaseSync(databasePath);
  }

  exec(sql: string): void {
    this.database.exec(sql);
  }

  get<T extends Record<string, unknown>>(sql: string, parameters: SqlValue[] = []): T | undefined {
    return this.database.prepare(sql).get(...parameters) as T | undefined;
  }

  all<T extends Record<string, unknown>>(sql: string, parameters: SqlValue[] = []): T[] {
    return this.database.prepare(sql).all(...parameters) as T[];
  }

  run(sql: string, parameters: SqlValue[] = []): DatabaseRunResult {
    return this.database.prepare(sql).run(...parameters) as DatabaseRunResult;
  }

  backupTo(destinationPath: string): Promise<number> {
    return backup(this.database, destinationPath);
  }

  close(): void {
    this.database.close();
  }
}
