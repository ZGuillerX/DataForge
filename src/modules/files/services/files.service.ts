import fs from 'fs';
import { FilesRepository } from '../repositories/files.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../shared/errors/app-error';
import { FileType } from '@prisma/client';
import { isSupportedImportFormat } from '../../../shared/utils/file.util';
import { storageDriver } from '../storage/storage.factory';

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
      throw new Error('Unsupported file format');
    }

    // Evitar subir el mismo archivo dos veces
    const existing = await this.filesRepo.findByUserIdAndFilename(userId, file.originalname);
    if (existing) {
      // Eliminar el archivo temporal que multer ya guardó
      fs.unlink(file.path, () => {});
      throw new ConflictError(
        `Ya existe un archivo con el nombre "${file.originalname}". Renómbralo antes de subirlo.`,
      );
    }

    const key = `uploads/${file.filename}`;
    const location = await storageDriver.persist(file.path, key, file.mimetype);

    return this.filesRepo.create({
      userId,
      filename: file.originalname,
      path: location,
      size: file.size,
      mimeType: file.mimetype,
      type,
    });
  }

  async getFile(fileId: string, userId: string) {
    const file = await this.filesRepo.findById(fileId);
    if (!file) throw new NotFoundError('File');
    if (file.userId !== userId) throw new ForbiddenError();
    return file;
  }

  async getUserFiles(userId: string) {
    return this.filesRepo.findByUserId(userId);
  }

  async getDownloadStream(fileId: string, userId: string) {
    const file = await this.getFile(fileId, userId);
    if (!(await storageDriver.exists(file.path))) {
      throw new NotFoundError('File on disk');
    }
    return { stream: await storageDriver.getReadStream(file.path), file };
  }
}
