import { prisma } from '../../../config/database';

export class RecordsRepository {
  async bulkCreate(
    records: Array<{
      jobId: string;
      rowIndex: number;
      data: Record<string, unknown>;
      isValid: boolean;
      errorMessage?: string;
    }>,
  ) {
    return prisma.record.createMany({
      data: records.map((r) => ({
        ...r,
        data: r.data as import('@prisma/client').Prisma.InputJsonValue,
      })),
    });
  }

  async findByJobId(
    jobId: string,
    page: number,
    limit: number,
    filters?: { isValid?: boolean; isDuplicate?: boolean },
  ) {
    const skip = (page - 1) * limit;
    const where: import('@prisma/client').Prisma.RecordWhereInput = { jobId };
    if (filters?.isValid !== undefined) where.isValid = filters.isValid;
    if (filters?.isDuplicate !== undefined) where.isDuplicate = filters.isDuplicate;
    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rowIndex: 'asc' },
      }),
      prisma.record.count({ where }),
    ]);
    return { records, total };
  }

  async findValidByJobId(jobId: string) {
    return prisma.record.findMany({
      where: { jobId, isValid: true },
      orderBy: { rowIndex: 'asc' },
    });
  }

  async markAsDuplicate(recordId: string) {
    return prisma.record.update({
      where: { id: recordId },
      data: { isDuplicate: true },
    });
  }

  async countByJobId(jobId: string) {
    return prisma.record.count({ where: { jobId } });
  }
}
