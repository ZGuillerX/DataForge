import client from './client';
import type { Job } from '../types/job';

export interface PaginatedJobs {
  data: Job[];
  meta: { total: number; page: number; limit: number };
}

export const jobsApi = {
  list: async (page = 1, limit = 20): Promise<PaginatedJobs> => {
    const { data } = await client.get('/jobs', { params: { page, limit } });
    return data;
  },
  get: async (id: string): Promise<Job> => {
    const { data } = await client.get(`/jobs/${id}`);
    return data.data;
  },
  createImport: async (fileId: string): Promise<Job> => {
    const { data } = await client.post('/jobs/import', { fileId });
    return data.data;
  },
  createDedup: async (jobId: string): Promise<Job> => {
    const { data } = await client.post('/jobs/dedup', { jobId });
    return data.data;
  },
  createExport: async (format: 'csv' | 'json' = 'csv'): Promise<Job> => {
    const { data } = await client.post('/jobs/export', { format });
    return data.data;
  },
  getResults: async (id: string, page = 1) => {
    const { data } = await client.get(`/jobs/${id}/results`, { params: { page } });
    return data;
  },
};
