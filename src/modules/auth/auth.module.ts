import { Router } from "express";
import { AuthController } from "./controllers/auth.controller";

const router = Router();
const controller = new AuthController();

router.post("/register", (req, res, next) =>
  controller.register(req, res).catch(next),
);
router.post("/login", (req, res, next) =>
  controller.login(req, res).catch(next),
);

export { router as authRouter };
