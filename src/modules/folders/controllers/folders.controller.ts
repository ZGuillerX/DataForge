import { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/types/request.type';
import { FoldersService } from '../services/folders.service';
import { CreateFolderSchema } from '../dto/folder.dto';

const foldersService = new FoldersService();

export class FoldersController {
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const folders = await foldersService.list(req.user.sub);
    res.json({ success: true, data: folders });
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const dto = CreateFolderSchema.parse(req.body);
    const folder = await foldersService.create(req.user.sub, dto.name);
    res.status(201).json({ success: true, data: folder });
  }

  async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
    await foldersService.delete(req.params.id, req.user.sub);
    res.status(204).send();
  }
}
