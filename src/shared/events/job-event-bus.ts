import { EventEmitter } from "events";

export interface JobProgressEvent {
  jobId: string;
  status: string;
  processedRows: number;
  failedRows: number;
  totalRows: number;
}

class JobEventBus extends EventEmitter {
  emitProgress(event: JobProgressEvent) {
    this.emit(`job:${event.jobId}`, event);
  }

  onProgress(jobId: string, listener: (event: JobProgressEvent) => void) {
    this.on(`job:${jobId}`, listener);
  }

  offProgress(jobId: string, listener: (event: JobProgressEvent) => void) {
    this.off(`job:${jobId}`, listener);
  }
}

// Singleton compartido entre API y Worker (mismo proceso)
export const jobEventBus = new JobEventBus();
jobEventBus.setMaxListeners(100); // soporta hasta 100 clientes SSE simultáneos
