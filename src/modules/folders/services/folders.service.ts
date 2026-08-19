import { FoldersRepository } from '../repositories/folders.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../shared/errors/app-error';

export class FoldersService {
  private foldersRepo: FoldersRepository;

  constructor() {
    this.foldersRepo = new FoldersRepository();
  }

  async create(userId: string, name: string) {
    const existing = await this.foldersRepo.findByUserIdAndName(userId, name);
    if (existing) {
      throw new ConflictError(`Ya existe una carpeta llamada "${name}"`);
    }
    return this.foldersRepo.create(userId, name);
  }

  async list(userId: string) {
    return this.foldersRepo.findByUserId(userId);
  }

  async delete(folderId: string, userId: string): Promise<void> {
    const folder = await this.foldersRepo.findById(folderId);
    if (!folder) throw new NotFoundError('Folder');
    if (folder.userId !== userId) throw new ForbiddenError();
    await this.foldersRepo.delete(folderId);
  }
}
