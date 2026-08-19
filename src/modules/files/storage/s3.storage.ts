import fs from "fs";
import type { Readable } from "stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { storageConfig } from "../../../config/storage";
import type { StorageDriver } from "./storage.interface";

/**
 * Sube el archivo temporal (ya escrito a disco local por multer o por
 * los processors) al bucket S3 vía stream, y borra la copia local.
 * `location` guardado en DB es el S3 key, no una ruta de filesystem.
 */
export class S3StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: storageConfig.s3.region,
      credentials: {
        accessKeyId: storageConfig.s3.accessKeyId,
        secretAccessKey: storageConfig.s3.secretAccessKey,
      },
    });
    this.bucket = storageConfig.s3.bucket;
  }

  async persist(localTempPath: string, key: string, mimeType?: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fs.createReadStream(localTempPath),
        ContentType: mimeType,
      }),
    );
    await fs.promises.unlink(localTempPath).catch(() => {});
    return key;
  }

  async getReadStream(location: string): Promise<NodeJS.ReadableStream> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: location }),
    );
    return result.Body as Readable;
  }

  async exists(location: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: location }));
      return true;
    } catch {
      return false;
    }
  }

  async delete(location: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: location }));
  }
}
