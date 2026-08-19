import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify/sync";
import { JobsRepository } from "../repositories/jobs.repository";
import { RecordsRepository } from "../../records/repositories/records.repository";
import { FilesRepository } from "../../files/repositories/files.repository";
import { createJobLogger } from "../../../shared/utils/logger.util";
import { storageConfig } from "../../../config/storage";
import { storageDriver } from "../../files/storage/storage.factory";
import { CHUNK_SIZE } from "../../../shared/constants/job.constants";
import { env } from "../../../config/env";
import { JobStatus, FileType } from "@prisma/client";

const jobsRepo = new JobsRepository();
const recordsRepo = new RecordsRepository();
const filesRepo = new FilesRepository();

function writeChunk(stream: fs.WriteStream, chunk: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (stream.write(chunk)) {
      resolve();
      return;
    }
    const onDrain = () => {
      stream.removeListener("error", onError);
      resolve();
    };
    const onError = (err: Error) => {
      stream.removeListener("drain", onDrain);
      reject(err);
    };
    stream.once("drain", onDrain);
    stream.once("error", onError);
  });
}

function closeStream(stream: fs.WriteStream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.once("finish", resolve);
    stream.once("error", reject);
    stream.end();
  });
}

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
    const format = ((job?.filters as Record<string, unknown>)?.["format"] ?? "csv") as
      | "csv"
      | "json";

    const sourceJobId = (filters?.["jobId"] as string | undefined) ?? undefined;

    const totalAvailable = sourceJobId
      ? await recordsRepo.countValidByJobId(sourceJobId)
      : await recordsRepo.countByUserId(userId);
    const totalRows = Math.min(totalAvailable, env.MAX_ROWS_PER_JOB);
    await jobsRepo.updateStatus(jobId, JobStatus.RUNNING, { totalRows });

    const exportsDir = path.join(storageConfig.localPath, "exports");
    const filename = `export_${jobId}.${format}`;
    const tempFilePath = path.join(exportsDir, filename);
    const mimeType = format === "json" ? "application/json" : "text/csv";

    // Escribe el archivo por chunks (nunca carga el dataset completo en memoria)
    const writeStream = fs.createWriteStream(tempFilePath, { encoding: "utf-8" });
    let processed = 0;
    let headerWritten = false;
    if (format === "json") await writeChunk(writeStream, "[");

    for (let skip = 0; skip < totalRows; skip += CHUNK_SIZE) {
      const take = Math.min(CHUNK_SIZE, totalRows - skip);
      const page = sourceJobId
        ? await recordsRepo.findValidByJobIdPage(sourceJobId, skip, take)
        : await recordsRepo.findByUserIdPage(userId, skip, take);
      if (page.length === 0) break;

      if (format === "json") {
        const body = page.map((r) => JSON.stringify(r.data)).join(",");
        await writeChunk(writeStream, processed > 0 ? `,${body}` : body);
      } else {
        const rows = page.map((r) => r.data as Record<string, unknown>);
        const csv = stringify(rows, { header: !headerWritten });
        headerWritten = true;
        await writeChunk(writeStream, csv);
      }

      processed += page.length;
      await jobsRepo.incrementProgress(jobId, page.length, 0);
      log.info(`Export chunk written: offset=${skip}, processed=${processed}/${totalRows}`);
    }

    if (format === "json") await writeChunk(writeStream, "]");
    await closeStream(writeStream);

    const stat = fs.statSync(tempFilePath);
    const location = await storageDriver.persist(tempFilePath, `exports/${filename}`, mimeType);
    const outputFile = await filesRepo.create({
      userId,
      filename,
      path: location,
      size: stat.size,
      mimeType,
      type: FileType.EXPORT,
    });

    await jobsRepo.updateStatus(jobId, JobStatus.DONE, {
      outputFileId: outputFile.id,
      completedAt: new Date(),
    });

    log.info(`Export completed: ${processed} rows, file=${filename}`);
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
