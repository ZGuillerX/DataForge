import { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/types/request.type';
import { FilesService } from '../services/files.service';
import { z } from 'zod';
import path from 'path';

const filesService = new FilesService();

const MoveFileSchema = z.object({
  folderId: z.string().uuid().nullable(),
});

function parseFolderIdQuery(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === 'none') return null;
  return String(raw);
}

export class FilesController {
  async upload(req: AuthenticatedRequest, res: Response): Promise<void> {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }
    const folderId = (req.body?.folderId as string | undefined) || null;
    const savedFile = await filesService.saveUploadedFile(req.user.sub, file, undefined, folderId);
    res.status(201).json({ success: true, data: savedFile });
  }

  async getFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const file = await filesService.getFile(req.params.id, req.user.sub);
    res.json({ success: true, data: file });
  }

  async listFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const folderId = parseFolderIdQuery(req.query.folderId);
    const result = await filesService.getUserFiles(req.user.sub, page, limit, folderId);
    res.json({
      success: true,
      data: result.files,
      meta: { total: result.total, page, limit },
    });
  }

  async move(req: AuthenticatedRequest, res: Response): Promise<void> {
    const dto = MoveFileSchema.parse(req.body);
    const file = await filesService.moveToFolder(req.params.id, req.user.sub, dto.folderId);
    res.json({ success: true, data: file });
  }

  async download(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { stream, file } = await filesService.getDownloadStream(req.params.id, req.user.sub);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(file.filename)}"`);
    res.setHeader('Content-Type', file.mimeType);
    stream.pipe(res);
  }
}
