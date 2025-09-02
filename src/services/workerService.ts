import axios, { AxiosInstance } from 'axios';

import { getApiUrl } from '../config/env';
import { PaginatedResponse } from '../types/common';
import { Worker, WorkerList, WorkerFilters } from '../types/worker';



class WorkerService {
  private api: AxiosInstance;

  constructor() {
    const getBaseURL = () => {
       return getApiUrl();
     };

    this.api = axios.create({
      baseURL: getBaseURL(),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar el token de autenticación
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar respuestas
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getWorkers(page: number = 1, size: number = 20, filters: WorkerFilters = {}): Promise<PaginatedResponse<WorkerList>> {
    const params = new URLSearchParams();
    
    params.append('skip', ((page - 1) * size).toString());
    params.append('limit', size.toString());
    
    if (filters.search) params.append('search', filters.search);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    const response = await this.api.get(`/workers?${params.toString()}`);
    
    // The backend returns a direct array of workers, not a paginated object
    const workers = response.data || [];
    
    // Transform the response to match the expected format
    const transformedData = workers.map((worker: any) => ({
      ...worker,
      name: `${worker.first_name} ${worker.last_name}`,
      cedula: worker.document_number,
      created_at: worker.created_at || new Date().toISOString(),
      updated_at: worker.updated_at || new Date().toISOString()
    }));

    // Calculate pagination info since backend doesn't provide it
    const total = transformedData.length;
    const pages = Math.ceil(total / size);
    
    return {
      items: transformedData,
      total: total,
      page: page,
      size: size,
      pages: pages,
      has_next: page < pages,
      has_prev: page > 1
    };
  }

  async getWorker(id: number): Promise<Worker> {
    const response = await this.api.get(`/workers/${id}`);
    return response.data;
  }

  async searchWorkers(search: string): Promise<WorkerList[]> {
    const response = await this.getWorkers(1, 50, { search });
    return response.items;
  }
}

export const workerService = new WorkerService();
export default workerService;