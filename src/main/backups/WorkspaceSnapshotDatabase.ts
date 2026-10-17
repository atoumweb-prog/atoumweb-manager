import {closeSync, openSync, readSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

/** SQLite readOnly still creates WAL/SHM for WAL databases. EC04 diagnostics
 * only accept standalone DELETE-mode snapshots, never an active WAL file. */
export function openReadOnlyWorkspaceSnapshot(file:string):DatabaseSync {
  const header=Buffer.alloc(100),fd=openSync(file,'r');let length:number;
  try { length=readSync(fd,header,0,header.length,0); } finally {closeSync(fd);}
  if(length!==100||header.subarray(0,16).toString('binary')!=='SQLite format 3\0'||header[18]!==1||header[19]!==1){
    throw Error('EC04 : instantané SQLite autonome en mode DELETE requis, lecture WAL refusée.');
  }
  return new DatabaseSync(file,{readOnly:true});
}
