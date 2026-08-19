import { prisma } from '../../../config/database';

export class AuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: { email: string; passwordHash: string; name?: string }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async setResetToken(userId: string, tokenHash: string, expiry: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: { resetTokenHash: tokenHash, resetTokenExpiry: expiry },
    });
  }

  async findByValidResetTokenHash(tokenHash: string) {
    return prisma.user.findFirst({
      where: { resetTokenHash: tokenHash, resetTokenExpiry: { gt: new Date() } },
    });
  }

  async resetPassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash, resetTokenHash: null, resetTokenExpiry: null },
    });
  }
}
