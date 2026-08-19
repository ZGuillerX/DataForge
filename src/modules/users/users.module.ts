import { Router } from 'express';
import { UsersController } from './controllers/users.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { AuthenticatedRequest } from '../../shared/types/request.type';

const router = Router();
const controller = new UsersController();

router.use(authMiddleware);

router.get('/me', (req, res, next) =>
  controller.getProfile(req as AuthenticatedRequest, res).catch(next),
);
router.patch('/me', (req, res, next) =>
  controller.updateProfile(req as AuthenticatedRequest, res).catch(next),
);

export { router as usersRouter };
