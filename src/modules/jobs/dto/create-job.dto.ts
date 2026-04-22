import { z } from "zod";

export const CreateImportJobSchema = z.object({
  fileId: z.string().uuid("Invalid file ID"),
});

export const CreateExportJobSchema = z.object({
  filters: z
    .object({
      jobId: z.string().uuid().optional(),
      isValid: z.boolean().optional(),
      isDuplicate: z.boolean().optional(),
    })
    .optional(),
  format: z.enum(["csv", "json"]).default("csv"),
});

export const CreateDedupJobSchema = z.object({
  jobId: z.string().uuid("Job ID is required for deduplication"),
  rules: z.array(z.enum(["email", "phone", "fuzzy"])).default(["email"]),
});

export type CreateImportJobDto = z.infer<typeof CreateImportJobSchema>;
export type CreateExportJobDto = z.infer<typeof CreateExportJobSchema>;
export type CreateDedupJobDto = z.infer<typeof CreateDedupJobSchema>;
