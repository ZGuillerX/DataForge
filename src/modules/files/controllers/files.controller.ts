import { Response } from "express";
import { AuthenticatedRequest } from "../../../shared/types/request.type";
import { FilesService } from "../services/files.service";
import path from "path";

const filesService = new FilesService();

export class FilesController {
  async upload(req: AuthenticatedRequest, res: Response): Promise<void> {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: "No file provided" });
      return;
    }
    const savedFile = await filesService.saveUploadedFile(req.user.sub, file);
    res.status(201).json({ success: true, data: savedFile });
  }

  async getFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const file = await filesService.getFile(req.params.id, req.user.sub);
    res.json({ success: true, data: file });
  }

  async listFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    const files = await filesService.getUserFiles(req.user.sub);
    res.json({ success: true, data: files });
  }

  async download(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { stream, file } = await filesService.getDownloadStream(
      req.params.id,
      req.user.sub,
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(file.filename)}"`,
    );
    res.setHeader("Content-Type", file.mimeType);
    stream.pipe(res);
  }
}
