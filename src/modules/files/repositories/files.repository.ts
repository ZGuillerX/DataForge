import { prisma } from "../../../config/database";
import { FileType } from "@prisma/client";

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

  async findByUserId(userId: string) {
    return prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteById(id: string) {
    return prisma.file.delete({ where: { id } });
  }
}
