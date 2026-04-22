import { JobsRepository } from "../repositories/jobs.repository";
import { FilesRepository } from "../../files/repositories/files.repository";
import { jobsQueue } from "../queues/jobs.queue";
import {
  NotFoundError,
  ForbiddenError,
} from "../../../shared/errors/app-error";
import { JobType } from "@prisma/client";
import type {
  CreateImportJobDto,
  CreateExportJobDto,
  CreateDedupJobDto,
} from "../dto/create-job.dto";
import { PAGINATION } from "../../../shared/constants/pagination";

export class JobsService {
  private jobsRepo: JobsRepository;
  private filesRepo: FilesRepository;

  constructor() {
    this.jobsRepo = new JobsRepository();
    this.filesRepo = new FilesRepository();
  }

  async createImportJob(userId: string, dto: CreateImportJobDto) {
    const file = await this.filesRepo.findById(dto.fileId);
    if (!file) throw new NotFoundError("File");
    if (file.userId !== userId) throw new ForbiddenError();

    const job = await this.jobsRepo.create({
      userId,
      type: JobType.IMPORT,
      inputFileId: dto.fileId,
    });

    await jobsQueue.add(
      `${JobType.IMPORT}:${job.id}`,
      { jobId: job.id, userId, type: JobType.IMPORT, fileId: dto.fileId },
      { jobId: job.id },
    );

    return job;
  }

  async createExportJob(userId: string, dto: CreateExportJobDto) {
    const job = await this.jobsRepo.create({
      userId,
      type: JobType.EXPORT,
      filters: { ...dto.filters, format: dto.format } as Record<
        string,
        unknown
      >,
    });

    await jobsQueue.add(
      `${JobType.EXPORT}:${job.id}`,
      { jobId: job.id, userId, type: JobType.EXPORT, filters: dto.filters },
      { jobId: job.id },
    );

    return job;
  }

  async createDedupJob(userId: string, dto: CreateDedupJobDto) {
    const sourceJob = await this.jobsRepo.findById(dto.jobId);
    if (!sourceJob) throw new NotFoundError("Job");
    if (sourceJob.userId !== userId) throw new ForbiddenError();

    const job = await this.jobsRepo.create({
      userId,
      type: JobType.DEDUP,
      filters: { sourceJobId: dto.jobId, rules: dto.rules },
    });

    await jobsQueue.add(
      `${JobType.DEDUP}:${job.id}`,
      {
        jobId: job.id,
        userId,
        type: JobType.DEDUP,
        filters: { sourceJobId: dto.jobId, rules: dto.rules },
      },
      { jobId: job.id },
    );

    return job;
  }

  async getJob(jobId: string, userId: string) {
    const job = await this.jobsRepo.findById(jobId);
    if (!job) throw new NotFoundError("Job");
    if (job.userId !== userId) throw new ForbiddenError();
    return job;
  }

  async listJobs(
    userId: string,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  ) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    return this.jobsRepo.findByUserId(userId, page, safeLimit);
  }
}
