import { env } from './env';
import path from 'path';
import fs from 'fs';

export interface StorageConfig {
  driver: 'local' | 's3';
  localPath: string;
  s3: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
}

export const storageConfig: StorageConfig = {
  driver: env.STORAGE_DRIVER,
  localPath: path.resolve(env.STORAGE_LOCAL_PATH),
  s3: {
    accessKeyId: env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
    region: env.AWS_REGION,
    bucket: env.AWS_BUCKET_NAME || '',
  },
};

// Crear directorio local si no existe
if (storageConfig.driver === 'local') {
  if (!fs.existsSync(storageConfig.localPath)) {
    fs.mkdirSync(storageConfig.localPath, { recursive: true });
  }
  const exportsDir = path.join(storageConfig.localPath, 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
}
