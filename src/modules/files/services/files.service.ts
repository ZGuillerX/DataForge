import fs from 'fs';
import { FilesRepository } from '../repositories/files.repository';
import { FoldersRepository } from '../../folders/repositories/folders.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../shared/errors/app-error';
import { FileType } from '@prisma/client';
import { isSupportedImportFormat } from '../../../shared/utils/file.util';
import { storageDriver } from '../storage/storage.factory';
import { PAGINATION } from '../../../shared/constants/pagination';

export class FilesService {
  private filesRepo: FilesRepository;
  private foldersRepo: FoldersRepository;

  constructor() {
    this.filesRepo = new FilesRepository();
    this.foldersRepo = new FoldersRepository();
  }

  private async assertFolderOwnership(userId: string, folderId: string | null | undefined) {
    if (!folderId) return;
    const folder = await this.foldersRepo.findById(folderId);
    if (!folder) throw new NotFoundError('Folder');
    if (folder.userId !== userId) throw new ForbiddenError();
  }

  async saveUploadedFile(
    userId: string,
    file: Express.Multer.File,
    type: FileType = FileType.IMPORT,
    folderId?: string | null,
  ) {
    if (!isSupportedImportFormat(file.originalname)) {
      throw new Error('Unsupported file format');
    }

    await this.assertFolderOwnership(userId, folderId);

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
      folderId: folderId ?? null,
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

  async getUserFiles(
    userId: string,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    folderId?: string | null,
  ) {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    return this.filesRepo.findByUserId(userId, page, safeLimit, folderId);
  }

  async moveToFolder(fileId: string, userId: string, folderId: string | null) {
    const file = await this.getFile(fileId, userId);
    await this.assertFolderOwnership(userId, folderId);
    await this.filesRepo.updateFolder(file.id, folderId);
    return this.filesRepo.findById(file.id);
  }

  async getDownloadStream(fileId: string, userId: string) {
    const file = await this.getFile(fileId, userId);
    if (!(await storageDriver.exists(file.path))) {
      throw new NotFoundError('File on disk');
    }
    return { stream: await storageDriver.getReadStream(file.path), file };
  }
}
