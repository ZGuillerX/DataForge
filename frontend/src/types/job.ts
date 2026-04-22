export type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
export type JobType = 'IMPORT' | 'EXPORT' | 'DEDUP';

export interface FileRecord {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  type: string;
  createdAt: string;
}

export interface Job {
  id: string;
  userId: string;
  type: JobType;
  status: JobStatus;
  inputFileId: string | null;
  outputFileId: string | null;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errorLog: Record<string, unknown> | null;
  filters: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  inputFile?: FileRecord | null;
  outputFile?: FileRecord | null;
}

export interface JobRecord {
  id: string;
  jobId: string;
  rowIndex: number;
  data: Record<string, unknown>;
  isValid: boolean;
  errorMessage: string | null;
  isDuplicate: boolean;
  createdAt: string;
}
