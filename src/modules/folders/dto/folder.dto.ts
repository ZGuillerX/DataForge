import { z } from 'zod';

export const CreateFolderSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(60, 'Máximo 60 caracteres'),
});

export type CreateFolderDto = z.infer<typeof CreateFolderSchema>;
