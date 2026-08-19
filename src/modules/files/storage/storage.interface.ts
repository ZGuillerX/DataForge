/**
 * Abstrae el backend de almacenamiento (local o S3) detrás de una
 * interfaz común. Los archivos siempre se escriben primero a disco
 * local vía multer/fs; `persist` los mueve (o no, según el driver)
 * a su ubicación final y devuelve el `path`/`key` que se guarda en DB.
 */
export interface StorageDriver {
  persist(localTempPath: string, key: string, mimeType?: string): Promise<string>;
  getReadStream(location: string): Promise<NodeJS.ReadableStream>;
  exists(location: string): Promise<boolean>;
  delete(location: string): Promise<void>;
}
