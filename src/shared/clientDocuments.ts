export const CLIENT_DOCUMENT_CATEGORIES=['contract','quote','invoice','brief','content','technical','legal','other'] as const;
export type ClientDocumentCategory=(typeof CLIENT_DOCUMENT_CATEGORIES)[number];
export interface ClientDocumentInput { category:ClientDocumentCategory; title:string; retentionCode?:string|null; retentionReason?:string|null; retentionUntil?:string|null; notes?:string|null; }
export interface ClientDocument extends ClientDocumentInput { id:string;clientAccountId:string;fileName:string;relativePath:string;mimeType?:string|null;sizeBytes:number;archivedAt?:string|null;createdAt:string;updatedAt:string;missing:boolean; }
export interface ClientDocumentsApi {
  list(clientId:string,includeArchived?:boolean):Promise<ClientDocument[]>;
  importFiles(clientId:string,input:ClientDocumentInput):Promise<ClientDocument[]>;
  update(id:string,input:ClientDocumentInput):Promise<ClientDocument>;
  archive(id:string,archived?:boolean):Promise<ClientDocument>;
  deletePermanently(id:string):Promise<{cancelled:boolean}>;
  openFile(id:string):Promise<void>; openFolder(clientId:string):Promise<void>;
}
