import path from "path";
import { v4 as uuidv4 } from "uuid";

export function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  return `${Date.now()}_${uuidv4().slice(0, 8)}_${base}${ext}`;
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().replace(".", "");
}

export function isSupportedImportFormat(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["csv", "xlsx", "xls"].includes(ext);
}

export function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}
