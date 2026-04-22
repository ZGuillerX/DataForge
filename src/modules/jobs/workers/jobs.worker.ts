import { Worker, Job } from "bullmq";
import { redisConnection } from "../../../config/redis";
import { JOB_QUEUE_NAME } from "../../../shared/constants/job.constants";
import { IQueueJobData } from "../../../shared/interfaces/job.interface";
import { runImportProcessor } from "../processors/import.processor";
import { runExportProcessor } from "../processors/export.processor";
import { runDedupProcessor } from "../processors/dedup.processor";
import { logger } from "../../../shared/utils/logger.util";
import { env } from "../../../config/env";

export function createJobsWorker() {
  const worker = new Worker<IQueueJobData>(
    JOB_QUEUE_NAME,
    async (job: Job<IQueueJobData>) => {
      const { jobId, userId, type, fileId, filters } = job.data;
      logger.info(`Processing job: type=${type} jobId=${jobId}`);

      switch (type) {
        case "IMPORT":
          if (!fileId) throw new Error("fileId is required for IMPORT jobs");
          await runImportProcessor(jobId, fileId);
          break;
        case "EXPORT":
          await runExportProcessor(jobId, userId, filters);
          break;
        case "DEDUP":
          if (!filters) throw new Error("filters are required for DEDUP jobs");
          await runDedupProcessor(jobId, filters);
          break;
        default:
          throw new Error(`Unknown job type: ${type}`);
      }
    },
    {
      connection: redisConnection,
      concurrency: env.QUEUE_CONCURRENCY,
    },
  );

  worker.on("completed", (job) => {
    logger.info(`Job completed: jobId=${job.data.jobId} type=${job.data.type}`);
  });

  worker.on("failed", (job, err) => {
    logger.error(
      `Job failed: jobId=${job?.data.jobId} type=${job?.data.type}`,
      {
        error: err.message,
        attemptsMade: job?.attemptsMade,
      },
    );
  });

  worker.on("active", (job) => {
    logger.debug(
      `Job active: jobId=${job.data.jobId} attempt=${job.attemptsMade + 1}`,
    );
  });

  return worker;
}
