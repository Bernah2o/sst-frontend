import api from './api';
import { User } from '../types';

interface UserFilters {
  search?: string;
  role?: string;
  is_active?: boolean;
  page_size?: number;
  skip?: number;
  limit?: number;
}

interface PaginatedUsersResponse {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export const userService = {
  async getUsers(filters: UserFilters = {}): Promise<PaginatedUsersResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.page_size) params.append('limit', filters.page_size.toString());
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/users/?${params.toString()}`);
    
    // Handle both paginated and direct array responses
    if (response.data.items) {
      return response.data;
    } else {
      // If it's a direct array, wrap it in pagination format
      const users = Array.isArray(response.data) ? response.data : [];
      return {
        items: users,
        total: users.length,
        page: 1,
        size: users.length,
        pages: 1,
        has_next: false,
        has_prev: false,
      };
    }
  },

  async getUser(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data;
  },
};