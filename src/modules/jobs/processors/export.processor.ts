import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify/sync";
import { JobsRepository } from "../repositories/jobs.repository";
import { RecordsRepository } from "../../records/repositories/records.repository";
import { FilesRepository } from "../../files/repositories/files.repository";
import { createJobLogger } from "../../../shared/utils/logger.util";
import { storageConfig } from "../../../config/storage";
import { JobStatus, FileType } from "@prisma/client";
import { prisma } from "../../../config/database";

const jobsRepo = new JobsRepository();
const recordsRepo = new RecordsRepository();
const filesRepo = new FilesRepository();

export async function runExportProcessor(
  jobId: string,
  userId: string,
  filters?: Record<string, unknown>,
): Promise<void> {
  const log = createJobLogger(jobId);

  await jobsRepo.updateStatus(jobId, JobStatus.RUNNING, {
    startedAt: new Date(),
  });
  log.info("Export job started");

  try {
    const job = await jobsRepo.findById(jobId);
    const format =
      (job?.filters as Record<string, unknown>)?.["format"] ?? "csv";

    const sourceJobId = (filters?.["jobId"] as string | undefined) ?? undefined;

    let records;
    if (sourceJobId) {
      records = await recordsRepo.findValidByJobId(sourceJobId);
    } else {
      // Exportar todos los registros del usuario
      records = await prisma.record.findMany({
        where: { job: { userId } },
        orderBy: { createdAt: "asc" },
        take: 100_000, // límite de seguridad
      });
    }

    const totalRows = records.length;
    await jobsRepo.updateStatus(jobId, JobStatus.RUNNING, { totalRows });

    const exportsDir = path.join(storageConfig.localPath, "exports");
    const filename = `export_${jobId}.${format}`;
    const filePath = path.join(exportsDir, filename);

    if (format === "json") {
      const jsonData = records.map((r) => r.data);
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
    } else {
      const rows = records.map((r) => r.data as Record<string, unknown>);
      if (rows.length === 0) {
        fs.writeFileSync(filePath, "", "utf-8");
      } else {
        const csv = stringify(rows, { header: true });
        fs.writeFileSync(filePath, csv, "utf-8");
      }
    }

    const stat = fs.statSync(filePath);
    const outputFile = await filesRepo.create({
      userId,
      filename,
      path: filePath,
      size: stat.size,
      mimeType: format === "json" ? "application/json" : "text/csv",
      type: FileType.EXPORT,
    });

    await jobsRepo.updateStatus(jobId, JobStatus.DONE, {
      processedRows: totalRows,
      outputFileId: outputFile.id,
      completedAt: new Date(),
    });

    log.info(`Export completed: ${totalRows} rows, file=${filename}`);
  } catch (error) {
    const err = error as Error;
    log.error("Export job failed", { error: err.message });
    await jobsRepo.updateStatus(jobId, JobStatus.FAILED, {
      errorLog: { message: err.message },
      completedAt: new Date(),
    });
    throw error;
  }
}
