import { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/types/request.type';
import { JobsService } from '../services/jobs.service';
import {
  CreateImportJobSchema,
  CreateExportJobSchema,
  CreateDedupJobSchema,
} from '../dto/create-job.dto';
import { RecordsRepository } from '../../records/repositories/records.repository';
import { jobEventBus } from '../../../shared/events/job-event-bus';

const jobsService = new JobsService();
const recordsRepo = new RecordsRepository();

export class JobsController {
  async createImportJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const dto = CreateImportJobSchema.parse(req.body);
    const job = await jobsService.createImportJob(req.user.sub, dto);
    res.status(202).json({ success: true, data: job });
  }

  async createExportJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const dto = CreateExportJobSchema.parse(req.body);
    const job = await jobsService.createExportJob(req.user.sub, dto);
    res.status(202).json({ success: true, data: job });
  }

  async createDedupJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const dto = CreateDedupJobSchema.parse(req.body);
    const job = await jobsService.createDedupJob(req.user.sub, dto);
    res.status(202).json({ success: true, data: job });
  }

  async getJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const job = await jobsService.getJob(req.params.id, req.user.sub);
    res.json({ success: true, data: job });
  }

  async listJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await jobsService.listJobs(req.user.sub, page, limit);
    res.json({
      success: true,
      data: result.jobs,
      meta: { total: result.total, page, limit },
    });
  }

  async getJobResults(req: AuthenticatedRequest, res: Response): Promise<void> {
    const job = await jobsService.getJob(req.params.id, req.user.sub); // verifica ownership
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    // Filtros opcionales desde query params
    const filters: { isValid?: boolean; isDuplicate?: boolean } = {};
    if (req.query.isValid === 'true') filters.isValid = true;
    if (req.query.isValid === 'false') filters.isValid = false;
    if (req.query.isDuplicate === 'true') filters.isDuplicate = true;

    // Para jobs DEDUP: los records pertenecen al job fuente
    let queryJobId = req.params.id;
    if (job.type === 'DEDUP') {
      const jobFilters = job.filters as Record<string, unknown> | null;
      const sourceJobId = jobFilters?.sourceJobId as string | undefined;
      if (sourceJobId) {
        queryJobId = sourceJobId;
        // Si no hay filtro explícito de isDuplicate, mostrar solo duplicados por defecto
        if (req.query.isDuplicate === undefined && req.query.isValid === undefined) {
          filters.isDuplicate = true;
        }
      }
    }

    const result = await recordsRepo.findByJobId(queryJobId, page, limit, filters);
    res.json({
      success: true,
      data: result.records,
      meta: { total: result.total, page, limit },
    });
  }

  async retryJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    const job = await jobsService.retryJob(req.params.id, req.user.sub);
    res.json({ success: true, data: job });
  }

  async streamJobEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    const jobId = req.params.id;

    // Verifica ownership antes de abrir el stream
    await jobsService.getJob(jobId, req.user.sub);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // compatibilidad con nginx
    res.flushHeaders();

    const send = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Envía ping inicial para confirmar conexión
    send({ type: 'connected', jobId });

    const onProgress = (event: object) => {
      send({ type: 'progress', ...event });
    };

    jobEventBus.onProgress(jobId, onProgress);

    // Limpia al desconectar el cliente
    req.on('close', () => {
      jobEventBus.offProgress(jobId, onProgress);
    });
  }
}
