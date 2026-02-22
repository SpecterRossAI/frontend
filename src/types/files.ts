export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  path: string;
  /** Name used on disk; used to build preview URL when present. */
  storedName?: string;
  /** Document ID from backend (e.g. Databricks RAG). */
  doc_id?: string;
  /** Source URI from backend (e.g. volume path). */
  source_uri?: string;
}
