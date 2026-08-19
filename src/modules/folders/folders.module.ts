import { Router } from 'express';
import { FoldersController } from './controllers/folders.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { AuthenticatedRequest } from '../../shared/types/request.type';

const router = Router();
const controller = new FoldersController();

router.use(authMiddleware);

router.get('/', (req, res, next) => controller.list(req as AuthenticatedRequest, res).catch(next));
router.post('/', (req, res, next) =>
  controller.create(req as AuthenticatedRequest, res).catch(next),
);
router.delete('/:id', (req, res, next) =>
  controller.remove(req as unknown as AuthenticatedRequest, res).catch(next),
);

export { router as foldersRouter };
