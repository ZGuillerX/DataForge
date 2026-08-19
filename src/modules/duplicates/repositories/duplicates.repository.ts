import { prisma } from '../../../config/database';

export class DuplicatesRepository {
  async bulkCreate(
    duplicates: Array<{
      recordId: string;
      duplicateOfId: string;
      ruleTriggered: string;
      score?: number;
    }>,
  ) {
    return prisma.duplicate.createMany({ data: duplicates });
  }

  async findByJobId(jobId: string) {
    return prisma.duplicate.findMany({
      where: { record: { jobId } },
      include: { record: true, originalRecord: true },
    });
  }
}
