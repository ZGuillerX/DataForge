export interface IJob {
  id: string;
  userId: string;
  type: "IMPORT" | "EXPORT" | "DEDUP";
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errorLog?: unknown;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

export interface IQueueJobData {
  jobId: string;
  userId: string;
  type: "IMPORT" | "EXPORT" | "DEDUP";
  fileId?: string;
  filters?: Record<string, unknown>;
}
