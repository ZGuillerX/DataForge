import { Router } from 'express';
import { JobsController } from './controllers/jobs.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { AuthenticatedRequest } from '../../shared/types/request.type';

const router = Router();
const controller = new JobsController();

router.use(authMiddleware);

router.post('/import', (req, res, next) =>
  controller.createImportJob(req as AuthenticatedRequest, res).catch(next),
);
router.post('/export', (req, res, next) =>
  controller.createExportJob(req as AuthenticatedRequest, res).catch(next),
);
router.post('/dedup', (req, res, next) =>
  controller.createDedupJob(req as AuthenticatedRequest, res).catch(next),
);
router.get('/', (req, res, next) =>
  controller.listJobs(req as AuthenticatedRequest, res).catch(next),
);
router.get('/:id', (req, res, next) =>
  controller.getJob(req as unknown as AuthenticatedRequest, res).catch(next),
);
router.get('/:id/results', (req, res, next) =>
  controller.getJobResults(req as unknown as AuthenticatedRequest, res).catch(next),
);
router.get('/:id/events', (req, res, next) =>
  controller.streamJobEvents(req as unknown as AuthenticatedRequest, res).catch(next),
);

export { router as jobsRouter };
