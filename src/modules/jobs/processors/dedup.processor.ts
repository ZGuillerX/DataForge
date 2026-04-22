import { JobsRepository } from "../repositories/jobs.repository";
import { DuplicateService } from "../../duplicates/services/duplicate.service";
import { createJobLogger } from "../../../shared/utils/logger.util";
import { JobStatus } from "@prisma/client";

const jobsRepo = new JobsRepository();
const dupService = new DuplicateService();

type RuleName = "email" | "phone" | "fuzzy";

export async function runDedupProcessor(
  jobId: string,
  filters: Record<string, unknown>,
): Promise<void> {
  const log = createJobLogger(jobId);

  await jobsRepo.updateStatus(jobId, JobStatus.RUNNING, {
    startedAt: new Date(),
  });
  log.info("Dedup job started");

  try {
    const sourceJobId = filters["sourceJobId"] as string;
    const rules = (filters["rules"] as RuleName[]) ?? ["email"];

    log.info(
      `Running dedup on job=${sourceJobId} with rules=${rules.join(",")}`,
    );

    const duplicatesFound = await dupService.detectAndSave(sourceJobId, rules);

    await jobsRepo.updateStatus(jobId, JobStatus.DONE, {
      processedRows: duplicatesFound,
      completedAt: new Date(),
    });

    log.info(`Dedup completed: ${duplicatesFound} duplicates found`);
  } catch (error) {
    const err = error as Error;
    log.error("Dedup job failed", { error: err.message });
    await jobsRepo.updateStatus(jobId, JobStatus.FAILED, {
      errorLog: { message: err.message },
      completedAt: new Date(),
    });
    throw error;
  }
}
