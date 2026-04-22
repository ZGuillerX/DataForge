import { Response } from "express";
import { AuthenticatedRequest } from "../../../shared/types/request.type";
import { JobsService } from "../services/jobs.service";
import {
  CreateImportJobSchema,
  CreateExportJobSchema,
  CreateDedupJobSchema,
} from "../dto/create-job.dto";
import { RecordsRepository } from "../../records/repositories/records.repository";

const jobsService = new JobsService();
const recordsRepo = new RecordsRepository();

export class JobsController {
  async createImportJob(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const dto = CreateImportJobSchema.parse(req.body);
    const job = await jobsService.createImportJob(req.user.sub, dto);
    res.status(202).json({ success: true, data: job });
  }

  async createExportJob(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const dto = CreateExportJobSchema.parse(req.body);
    const job = await jobsService.createExportJob(req.user.sub, dto);
    res.status(202).json({ success: true, data: job });
  }

  async createDedupJob(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
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
    await jobsService.getJob(req.params.id, req.user.sub); // verifica ownership
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const result = await recordsRepo.findByJobId(req.params.id, page, limit);
    res.json({
      success: true,
      data: result.records,
      meta: { total: result.total, page, limit },
    });
  }
}
