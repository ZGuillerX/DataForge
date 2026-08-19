import { prisma } from '../../../config/database';
import { FileType, Prisma } from '@prisma/client';

export class FilesRepository {
  async create(data: {
    userId: string;
    folderId?: string | null;
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

  /**
   * folderId: undefined = todas las carpetas, null = solo sin carpeta,
   * string = solo esa carpeta.
   */
  async findByUserId(userId: string, page: number, limit: number, folderId?: string | null) {
    const skip = (page - 1) * limit;
    const where: Prisma.FileWhereInput = { userId };
    if (folderId !== undefined) where.folderId = folderId;
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.file.count({ where }),
    ]);
    return { files, total };
  }

  async updateFolder(fileId: string, folderId: string | null) {
    return prisma.file.update({ where: { id: fileId }, data: { folderId } });
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
