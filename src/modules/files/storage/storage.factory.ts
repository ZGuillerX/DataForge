import { storageConfig } from "../../../config/storage";
import type { StorageDriver } from "./storage.interface";
import { LocalStorageDriver } from "./local.storage";
import { S3StorageDriver } from "./s3.storage";

export const storageDriver: StorageDriver =
  storageConfig.driver === "s3" ? new S3StorageDriver() : new LocalStorageDriver();
