import client from './client';
import type { AuthResponse } from '../types/user';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await client.post('/auth/login', { email, password });
    return data.data;
  },
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const { data } = await client.post('/auth/register', { email, password, name });
    return data.data;
  },
  forgotPassword: async (email: string): Promise<{ message: string; devToken?: string }> => {
    const { data } = await client.post('/auth/forgot-password', { email });
    return data;
  },
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const { data } = await client.post('/auth/reset-password', { token, password });
    return data;
  },
};
