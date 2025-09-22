import axios, { AxiosInstance } from 'axios';

import { getApiUrl } from '../config/env';

export interface VacationRequest {
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface VacationUpdate {
  start_date?: string;
  end_date?: string;
  reason?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface VacationApproval {
  status: 'approved' | 'rejected';
  admin_comments?: string;
}

export interface WorkerVacation {
  id: number;
  worker_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_comments?: string;
  created_at: string;
  updated_at: string;
  approved_by?: number;
  approved_at?: string;
}

export interface VacationRequestWithWorker extends WorkerVacation {
  worker_name: string;
}

export interface VacationBalance {
  worker_id: number;
  total_days: number;
  used_days: number;
  available_days: number;
  year: number;
}

export interface VacationAvailability {
  available: boolean;
  conflicts: Array<{
    id: number;
    start_date: string;
    end_date: string;
    worker_name: string;
  }>;
}

export interface VacationStats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  total_days_used: number;
}

export interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  document_number: string;
  position: string;
  user_id: number;
}

class VacationService {
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

  // Obtener vacaciones de un trabajador
  async getWorkerVacations(workerId: number): Promise<WorkerVacation[]> {
    const response = await this.api.get(`/workers/${workerId}/vacations`);
    return response.data;
  }

  // Crear solicitud de vacaciones
  async createVacationRequest(workerId: number, data: VacationRequest): Promise<WorkerVacation> {
    const response = await this.api.post(`/workers/${workerId}/vacations`, data);
    return response.data;
  }

  // Actualizar solicitud de vacaciones
  async updateVacationRequest(workerId: number, vacationId: number, data: VacationUpdate): Promise<WorkerVacation> {
    const response = await this.api.put(`/workers/${workerId}/vacations/${vacationId}`, data);
    return response.data;
  }

  // Aprobar/rechazar solicitud de vacaciones
  async approveVacationRequest(workerId: number, vacationId: number, data: VacationApproval): Promise<WorkerVacation> {
    const response = await this.api.put(`/workers/vacations/${vacationId}/approve`, data);
    return response.data;
  }

  // Eliminar solicitud de vacaciones
  async deleteVacationRequest(workerId: number, vacationId: number): Promise<void> {
    await this.api.delete(`/workers/${workerId}/vacations/${vacationId}`);
  }

  // Verificar disponibilidad de fechas
  async checkAvailability(workerId: number, startDate: string, endDate: string): Promise<VacationAvailability> {
    const response = await this.api.get(`/workers/${workerId}/vacations/availability`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  }

  // Obtener balance de vacaciones
  async getVacationBalance(workerId: number): Promise<VacationBalance> {
    const response = await this.api.get(`/workers/${workerId}/vacation-balance`);
    return response.data;
  }

  // Obtener estadísticas de vacaciones
  async getVacationStats(workerId: number): Promise<VacationStats> {
    const response = await this.api.get(`/workers/vacations/stats`);
    return response.data;
  }

  // Obtener todas las solicitudes de vacaciones (para administradores)
  async getAllVacationRequests(status?: string): Promise<VacationRequestWithWorker[]> {
    const params = status ? { status } : {};
    const response = await this.api.get('/workers/vacations/all', { params });
    return response.data;
  }

  // Método para obtener información del worker del usuario autenticado
  async getCurrentWorker(): Promise<Worker> {
    const response = await this.api.get('/workers/me');
    return response.data;
  }

  // Métodos específicos para empleados (usan el worker_id del usuario autenticado)
  async getEmployeeVacationRequests(): Promise<WorkerVacation[]> {
    const worker = await this.getCurrentWorker();
    const response = await this.api.get(`/workers/${worker.id}/vacations`);
    return response.data;
  }

  async getEmployeeVacationBalance(): Promise<VacationBalance> {
    const worker = await this.getCurrentWorker();
    const response = await this.api.get(`/workers/${worker.id}/vacation-balance`);
    return response.data;
  }

  async createEmployeeVacationRequest(data: VacationRequest & { working_days: number }): Promise<WorkerVacation> {
    const worker = await this.getCurrentWorker();
    const response = await this.api.post(`/workers/${worker.id}/vacations`, data);
    return response.data;
  }

  // Métodos simplificados para administración
  async approveVacation(workerId: number, vacationId: number, comments?: string): Promise<WorkerVacation> {
    const approvalData: VacationApproval = {
      status: 'approved',
      admin_comments: comments || 'Aprobado por administrador'
    };
    return this.approveVacationRequest(workerId, vacationId, approvalData);
  }

  async rejectVacation(workerId: number, vacationId: number, comments?: string): Promise<WorkerVacation> {
    const rejectionData: VacationApproval = {
      status: 'rejected',
      admin_comments: comments || 'Rechazado por administrador'
    };
    return this.approveVacationRequest(workerId, vacationId, rejectionData);
  }

  // Exportar vacaciones a Excel
  async exportVacationsToExcel(params: {
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<Blob> {
    const response = await this.api.get('/workers/vacations/export/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new VacationService();