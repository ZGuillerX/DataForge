import fs from "fs";
import path from "path";
import { FilesRepository } from "../repositories/files.repository";
import {
  NotFoundError,
  ForbiddenError,
} from "../../../shared/errors/app-error";
import { FileType } from "@prisma/client";
import { isSupportedImportFormat } from "../../../shared/utils/file.util";

export class FilesService {
  private filesRepo: FilesRepository;

  constructor() {
    this.filesRepo = new FilesRepository();
  }

  async saveUploadedFile(
    userId: string,
    file: Express.Multer.File,
    type: FileType = FileType.IMPORT,
  ) {
    if (!isSupportedImportFormat(file.originalname)) {
      throw new Error("Unsupported file format");
    }

    return this.filesRepo.create({
      userId,
      filename: file.originalname,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      type,
    });
  }

  async getFile(fileId: string, userId: string) {
    const file = await this.filesRepo.findById(fileId);
    if (!file) throw new NotFoundError("File");
    if (file.userId !== userId) throw new ForbiddenError();
    return file;
  }

  async getUserFiles(userId: string) {
    return this.filesRepo.findByUserId(userId);
  }

  async getDownloadStream(fileId: string, userId: string) {
    const file = await this.getFile(fileId, userId);
    if (!fs.existsSync(file.path)) {
      throw new NotFoundError("File on disk");
    }
    return { stream: fs.createReadStream(file.path), file };
  }
}
