export type SqlValue = string | number | bigint | null | Uint8Array;

export interface DatabaseRunResult {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
}

export interface DatabaseAdapter {
  exec(sql: string): void;
  get<T extends Record<string, unknown>>(sql: string, parameters?: SqlValue[]): T | undefined;
  all<T extends Record<string, unknown>>(sql: string, parameters?: SqlValue[]): T[];
  run(sql: string, parameters?: SqlValue[]): DatabaseRunResult;
  backupTo(destinationPath: string): Promise<number>;
  close(): void;
}
