import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import ExcelJS from "exceljs";
import { JobsRepository } from "../repositories/jobs.repository";
import { RecordsRepository } from "../../records/repositories/records.repository";
import { processInChunks } from "../../../shared/utils/chunk.util";
import { createJobLogger } from "../../../shared/utils/logger.util";
import { CHUNK_SIZE } from "../../../shared/constants/job.constants";
import { JobStatus } from "@prisma/client";

const jobsRepo = new JobsRepository();
const recordsRepo = new RecordsRepository();

interface RawRow {
  [key: string]: string | number | boolean | null;
}

function validateRow(row: RawRow): { isValid: boolean; errorMessage?: string } {
  if (Object.keys(row).length === 0) {
    return { isValid: false, errorMessage: "Empty row" };
  }
  // Aquí se pueden agregar más reglas de validación
  return { isValid: true };
}

async function parseCSV(filePath: string): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const rows: RawRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row: RawRow) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function parseExcel(filePath: string): Promise<RawRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  const rows: RawRow[] = [];
  let headers: string[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      headers = (row.values as (string | null)[]).slice(1).map(String);
    } else {
      const rowData: RawRow = {};
      (row.values as unknown[]).slice(1).forEach((val, i) => {
        rowData[headers[i]] = val as string | number | boolean | null;
      });
      rows.push(rowData);
    }
  });

  return rows;
}

export async function runImportProcessor(
  jobId: string,
  fileId: string,
): Promise<void> {
  const log = createJobLogger(jobId);

  await jobsRepo.updateStatus(jobId, JobStatus.RUNNING, {
    startedAt: new Date(),
  });
  log.info("Import job started");

  try {
    const { prisma } = await import("../../../config/database");
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new Error(`File ${fileId} not found`);

    const ext = path.extname(file.filename).toLowerCase();
    let rows: RawRow[];

    if (ext === ".csv") {
      rows = await parseCSV(file.path);
    } else {
      rows = await parseExcel(file.path);
    }

    const totalRows = rows.length;
    await jobsRepo.updateStatus(jobId, JobStatus.RUNNING, { totalRows });
    log.info(`Parsed ${totalRows} rows`);

    await processInChunks(rows, CHUNK_SIZE, async (chunk, offset) => {
      const mapped = chunk.map((row, i) => {
        const { isValid, errorMessage } = validateRow(row);
        return {
          jobId,
          rowIndex: offset + i,
          data: row as Record<string, unknown>,
          isValid,
          errorMessage,
        };
      });

      await recordsRepo.bulkCreate(mapped);

      const processed = mapped.filter((r) => r.isValid).length;
      const failed = mapped.filter((r) => !r.isValid).length;
      await jobsRepo.incrementProgress(jobId, processed, failed);

      log.info(
        `Chunk processed: offset=${offset}, processed=${processed}, failed=${failed}`,
      );
    });

    await jobsRepo.updateStatus(jobId, JobStatus.DONE, {
      completedAt: new Date(),
    });
    log.info("Import job completed");
  } catch (error) {
    const err = error as Error;
    log.error("Import job failed", { error: err.message });
    await jobsRepo.updateStatus(jobId, JobStatus.FAILED, {
      errorLog: { message: err.message },
      completedAt: new Date(),
    });
    throw error;
  }
}
