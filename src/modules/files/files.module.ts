import { Router } from "express";
import { FilesController } from "./controllers/files.controller";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { AuthenticatedRequest } from "../../shared/types/request.type";
import { upload } from "./storage/local.storage";

const router = Router();
const controller = new FilesController();

router.use(authMiddleware);

router.post("/upload", upload.single("file"), (req, res, next) =>
  controller.upload(req as AuthenticatedRequest, res).catch(next),
);
router.get("/", (req, res, next) =>
  controller.listFiles(req as AuthenticatedRequest, res).catch(next),
);
router.get("/:id", (req, res, next) =>
  controller.getFile(req as unknown as AuthenticatedRequest, res).catch(next),
);
router.get("/:id/download", (req, res, next) =>
  controller.download(req as unknown as AuthenticatedRequest, res).catch(next),
);

export { router as filesRouter };
