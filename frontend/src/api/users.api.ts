import client from './client';
import type { User } from '../types/user';

export interface UserProfile extends User {
  createdAt: string;
}

export const usersApi = {
  getMe: async (): Promise<UserProfile> => {
    const { data } = await client.get('/users/me');
    return data.data;
  },
  updateProfile: async (name: string): Promise<UserProfile> => {
    const { data } = await client.patch('/users/me', { name });
    return data.data;
  },
};
