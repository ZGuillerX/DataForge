import client from './client';

export interface FolderRecord {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  _count: { files: number };
}

export const foldersApi = {
  list: async (): Promise<FolderRecord[]> => {
    const { data } = await client.get('/folders');
    return data.data;
  },
  create: async (name: string): Promise<FolderRecord> => {
    const { data } = await client.post('/folders', { name });
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await client.delete(`/folders/${id}`);
  },
};
