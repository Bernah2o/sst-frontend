import api from './api';
import {
  AbsenteeismCreate,
  AbsenteeismUpdate,
  AbsenteeismResponse,
  AbsenteeismListResponse,
  AbsenteeismStats,
  AbsenteeismFilters
} from '../types/absenteeism';
import { PaginatedResponse } from '../types/common';

export const absenteeismService = {
  // Obtener lista de absenteeism con filtros y paginación
  getAbsenteeisms: async (
    page: number = 1,
    limit: number = 10,
    filters?: AbsenteeismFilters
  ): Promise<PaginatedResponse<AbsenteeismListResponse>> => {
    const params = new URLSearchParams({
      skip: ((page - 1) * limit).toString(),
      limit: limit.toString()
    });

    if (filters) {
      if (filters.worker_id) params.append('worker_id', filters.worker_id.toString());
      if (filters.event_type) params.append('event_type', filters.event_type);
      if (filters.event_month) params.append('event_month', filters.event_month);
      if (filters.start_date_from) params.append('start_date_from', filters.start_date_from);
      if (filters.start_date_to) params.append('start_date_to', filters.start_date_to);
      if (filters.year) params.append('year', filters.year.toString());
    }

    const response = await api.get(`/absenteeism?${params.toString()}`);
    
    // Asegurar que la respuesta tenga todas las propiedades requeridas
    return {
      items: response.data.items || [],
      total: response.data.total || 0,
      page: response.data.page || page,
      size: response.data.size || limit,
      pages: response.data.pages || 1,
      has_next: response.data.has_next || false,
      has_prev: response.data.has_prev || false
    };
  },

  // Obtener un absenteeism específico
  getAbsenteeism: async (id: number): Promise<AbsenteeismResponse> => {
    const response = await api.get(`/absenteeism/${id}`);
    return response.data;
  },

  // Crear nuevo absenteeism
  createAbsenteeism: async (data: AbsenteeismCreate): Promise<AbsenteeismResponse> => {
    const response = await api.post('/absenteeism', data);
    return response.data;
  },

  // Actualizar absenteeism
  updateAbsenteeism: async (id: number, data: AbsenteeismUpdate): Promise<AbsenteeismResponse> => {
    const response = await api.put(`/absenteeism/${id}`, data);
    return response.data;
  },

  // Eliminar absenteeism
  deleteAbsenteeism: async (id: number): Promise<void> => {
    await api.delete(`/absenteeism/${id}`);
  },

  // Obtener estadísticas
  getStats: async (year?: number, workerId?: number): Promise<AbsenteeismStats> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (workerId) params.append('worker_id', workerId.toString());

    const response = await api.get(`/absenteeism/stats/summary?${params.toString()}`);
    return response.data;
  },

  // Obtener absenteeism de un trabajador específico
  getWorkerAbsenteeisms: async (workerId: number): Promise<AbsenteeismListResponse[]> => {
    const response = await api.get(`/absenteeism/workers/${workerId}`);
    return response.data;
  },

  // Exportar datos (si se implementa en el backend)
  exportAbsenteeisms: async (filters?: AbsenteeismFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.worker_id) params.append('worker_id', filters.worker_id.toString());
      if (filters.event_type) params.append('event_type', filters.event_type);
      if (filters.event_month) params.append('event_month', filters.event_month);
      if (filters.start_date_from) params.append('start_date_from', filters.start_date_from);
      if (filters.start_date_to) params.append('start_date_to', filters.start_date_to);
      if (filters.year) params.append('year', filters.year.toString());
    }

    const response = await api.get(`/absenteeism/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default absenteeismService;