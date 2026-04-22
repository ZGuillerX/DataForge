import { Queue } from "bullmq";
import { redisConnection } from "../../../config/redis";
import { JOB_QUEUE_NAME } from "../../../shared/constants/job.constants";
import { IQueueJobData } from "../../../shared/interfaces/job.interface";
import { env } from "../../../config/env";

export const jobsQueue = new Queue<IQueueJobData>(JOB_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: env.JOB_RETRY_ATTEMPTS,
    backoff: {
      type: "exponential",
      delay: env.JOB_RETRY_DELAY_MS,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});
