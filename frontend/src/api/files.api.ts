import client from './client';

export interface UploadedFile {
  id: string;
  userId: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  type: string;
  createdAt: string;
}

export const filesApi = {
  upload: async (file: File, onProgress?: (pct: number) => void): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await client.post('/files/upload', formData, {
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return data.data;
  },
  list: async (page = 1) => {
    const { data } = await client.get('/files', { params: { page } });
    return data;
  },
  download: async (id: string, filename: string) => {
    const { data } = await client.get(`/files/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
