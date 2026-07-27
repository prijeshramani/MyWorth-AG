export interface DocumentRecord {
  documentId: string;
  familyId: number;
  fileName: string;
  fileType: string;
  category: 'POLICY' | 'PROPERTY' | 'TAX' | 'IDENTITY' | 'ESTATE';
  storagePath: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface DocumentStorageProvider {
  uploadDocument(fileBuffer: Buffer, fileName: string): Promise<string>;
  getDocumentStream(documentId: string): Promise<Buffer>;
  deleteDocument(documentId: string): Promise<boolean>;
}

export interface IDocumentRepository {
  findById(documentId: string): Promise<DocumentRecord | null>;
  findByFamilyId(familyId: number): Promise<DocumentRecord[]>;
  save(document: DocumentRecord): Promise<void>;
}
