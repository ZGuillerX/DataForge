import { prisma } from '../../../config/database';
import { FileType } from '@prisma/client';

export class FilesRepository {
  async create(data: {
    userId: string;
    filename: string;
    path: string;
    size: number;
    mimeType: string;
    type: FileType;
  }) {
    return prisma.file.create({ data });
  }

  async findById(id: string) {
    return prisma.file.findUnique({ where: { id } });
  }

  async findByUserId(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.file.count({ where: { userId } }),
    ]);
    return { files, total };
  }

  async findByUserIdAndFilename(userId: string, filename: string) {
    return prisma.file.findFirst({
      where: { userId, filename, type: 'IMPORT' },
    });
  }

  async deleteById(id: string) {
    return prisma.file.delete({ where: { id } });
  }
}
