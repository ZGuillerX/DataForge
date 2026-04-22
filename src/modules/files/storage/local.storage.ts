import multer from "multer";
import path from "path";
import { env } from "../../../config/env";
import { storageConfig } from "../../../config/storage";
import { generateUniqueFilename } from "../../../shared/utils/file.util";
import { ValidationError } from "../../../shared/errors/app-error";

const ALLOWED_MIMETYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

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
    const allowed = [".csv", ".xlsx", ".xls"];
    if (!allowed.includes(ext)) {
      return cb(new ValidationError("Only CSV and Excel files are allowed"));
    }
    cb(null, true);
  },
});
