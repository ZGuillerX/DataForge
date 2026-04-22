import { prisma } from "../../../config/database";
import { JobStatus, JobType, Prisma } from "@prisma/client";
import { jobEventBus } from "../../../shared/events/job-event-bus";

export class JobsRepository {
  async create(data: {
    userId: string;
    type: JobType;
    inputFileId?: string;
    filters?: Record<string, unknown>;
  }) {
    return prisma.job.create({
      data: {
        userId: data.userId,
        type: data.type,
        status: JobStatus.PENDING,
        inputFileId: data.inputFileId,
        filters:
          data.filters !== undefined
            ? (data.filters as Prisma.InputJsonValue)
            : undefined,
      },
    });
  }

  async findById(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: { inputFile: true, outputFile: true },
    });
  }

  async findByUserId(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { inputFile: true, outputFile: true },
      }),
      prisma.job.count({ where: { userId } }),
    ]);
    return { jobs, total };
  }

  async updateStatus(
    id: string,
    status: JobStatus,
    extra?: {
      processedRows?: number;
      failedRows?: number;
      totalRows?: number;
      errorLog?: unknown;
      outputFileId?: string;
      startedAt?: Date;
      completedAt?: Date;
    },
  ) {
    const { errorLog, outputFileId, ...rest } = extra ?? {};
    const job = await prisma.job.update({
      where: { id },
      data: {
        status,
        ...rest,
        ...(errorLog !== undefined
          ? {
              errorLog:
                errorLog as import("@prisma/client").Prisma.InputJsonValue,
            }
          : {}),
        ...(outputFileId !== undefined
          ? { outputFile: { connect: { id: outputFileId } } }
          : {}),
      },
    });
    jobEventBus.emitProgress({
      jobId: id,
      status: job.status,
      processedRows: job.processedRows,
      failedRows: job.failedRows,
      totalRows: job.totalRows,
    });
    return job;
  }

  async incrementProgress(id: string, processed: number, failed: number) {
    const job = await prisma.job.update({
      where: { id },
      data: {
        processedRows: { increment: processed },
        failedRows: { increment: failed },
      },
    });
    jobEventBus.emitProgress({
      jobId: id,
      status: job.status,
      processedRows: job.processedRows,
      failedRows: job.failedRows,
      totalRows: job.totalRows,
    });
    return job;
  }
}
