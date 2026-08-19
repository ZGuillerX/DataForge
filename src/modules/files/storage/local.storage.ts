import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { env } from '../../../config/env';
import { storageConfig } from '../../../config/storage';
import { generateUniqueFilename } from '../../../shared/utils/file.util';
import { ValidationError } from '../../../shared/errors/app-error';
import type { StorageDriver } from './storage.interface';

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, storageConfig.localPath);
    },
    filename: (_req, file, cb) => {
      cb(null, generateUniqueFilename(file.originalname));
    },
  }),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.csv', '.xlsx', '.xls'];
    if (!allowed.includes(ext)) {
      return cb(new ValidationError('Only CSV and Excel files are allowed'));
    }
    cb(null, true);
  },
});

/**
 * El archivo ya queda en su ubicación final al escribirlo (multer o
 * fs.writeFileSync ya usan storageConfig.localPath), así que `persist`
 * es un no-op: solo confirma y devuelve la misma ruta.
 */
export class LocalStorageDriver implements StorageDriver {
  async persist(localTempPath: string): Promise<string> {
    return localTempPath;
  }

  async getReadStream(location: string): Promise<NodeJS.ReadableStream> {
    return fs.createReadStream(location);
  }

  async exists(location: string): Promise<boolean> {
    return fs.existsSync(location);
  }

  async delete(location: string): Promise<void> {
    await fs.promises.unlink(location).catch(() => {});
  }
}
