import { prisma } from '../../../config/database';

export class FoldersRepository {
  async create(userId: string, name: string) {
    return prisma.folder.create({ data: { userId, name } });
  }

  async findByUserId(userId: string) {
    return prisma.folder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { files: true } } },
    });
  }

  async findById(id: string) {
    return prisma.folder.findUnique({ where: { id } });
  }

  async findByUserIdAndName(userId: string, name: string) {
    return prisma.folder.findFirst({ where: { userId, name } });
  }

  async delete(id: string) {
    return prisma.folder.delete({ where: { id } });
  }
}
