import { prisma } from '../../../config/database';

export class UsersRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  async update(id: string, data: { name?: string; email?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findPasswordHash(id: string) {
    return prisma.user.findUnique({ where: { id }, select: { passwordHash: true } });
  }

  async updatePassword(id: string, passwordHash: string) {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  }
}
