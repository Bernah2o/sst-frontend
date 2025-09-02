import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginRequest, LoginResponse, User, Curso, CursoCreate, Inscripcion, ApiResponse, PaginatedResponse } from '../types';
import { getApiUrl } from '../config/env';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    const getBaseURL = () => {
       return getApiUrl();
     };

    this.api = axios.create({
      baseURL: getBaseURL(),
      timeout: 30000,
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
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticación
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password
    });
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/users/me');
    return response.data;
  }

  async forgotPassword(email: string): Promise<void> {
    await this.api.post('/auth/forgot-password', { email });
  }

  async resetPassword(data: { token: string; new_password: string }): Promise<void> {
    await this.api.post('/auth/reset-password', data);
  }

  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    await this.api.put('/auth/change-password', data);
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  // Métodos para usuarios
  async getUsers(): Promise<PaginatedResponse<User>> {
    const response: AxiosResponse<PaginatedResponse<User>> = await this.api.get('/users/');
    return response.data;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post('/users/', userData);
    return response.data;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/users/${id}`);
  }

  async getUserByDocument(documentNumber: string): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/users/by-document/${documentNumber}`);
    return response.data;
  }

  // Métodos para cursos
  async getCursos(): Promise<PaginatedResponse<Curso>> {
    const response: AxiosResponse<PaginatedResponse<Curso>> = await this.api.get('/cursos/');
    return response.data;
  }

  async getCurso(id: number): Promise<Curso> {
    const response: AxiosResponse<Curso> = await this.api.get(`/cursos/${id}`);
    return response.data;
  }

  async createCurso(cursoData: CursoCreate): Promise<Curso> {
    const response: AxiosResponse<Curso> = await this.api.post('/cursos/', cursoData);
    return response.data;
  }

  async updateCurso(id: number, cursoData: Partial<CursoCreate>): Promise<Curso> {
    const response: AxiosResponse<Curso> = await this.api.put(`/cursos/${id}`, cursoData);
    return response.data;
  }

  async deleteCurso(id: number): Promise<void> {
    await this.api.delete(`/cursos/${id}`);
  }

  // Métodos para inscripciones
  async getInscripciones(): Promise<PaginatedResponse<Inscripcion>> {
    const response: AxiosResponse<PaginatedResponse<Inscripcion>> = await this.api.get('/inscripciones/');
    return response.data;
  }

  async inscribirseEnCurso(cursoId: number): Promise<Inscripcion> {
    const response: AxiosResponse<Inscripcion> = await this.api.post(`/cursos/${cursoId}/inscribirse`);
    return response.data;
  }

  async completarCurso(inscripcionId: number, calificacion?: number): Promise<Inscripcion> {
    const response: AxiosResponse<Inscripcion> = await this.api.put(`/inscripciones/${inscripcionId}/completar`, {
      calificacion,
    });
    return response.data;
  }

  async getMisInscripciones(): Promise<PaginatedResponse<Inscripcion>> {
    const response: AxiosResponse<PaginatedResponse<Inscripcion>> = await this.api.get('/enrollments/my');
    return response.data;
  }

  // Generic HTTP methods for direct API access
  async get(url: string, config?: any): Promise<AxiosResponse<any>> {
    return this.api.get(url, config);
  }

  async post(url: string, data?: any, config?: any): Promise<AxiosResponse<any>> {
    return this.api.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any): Promise<AxiosResponse<any>> {
    return this.api.put(url, data, config);
  }

  async delete(url: string, config?: any): Promise<AxiosResponse<any>> {
    return this.api.delete(url, config);
  }

  async patch(url: string, data?: any, config?: any): Promise<AxiosResponse<any>> {
    return this.api.patch(url, data, config);
  }

  // Métodos específicos para ausentismo
  async getAbsenteeismRecords(params?: any): Promise<any> {
    const response = await this.api.get('/absenteeism', { params });
    return response.data;
  }

  async getAbsenteeismRecord(id: number): Promise<any> {
    const response = await this.api.get(`/absenteeism/${id}`);
    return response.data;
  }

  async createAbsenteeismRecord(data: any): Promise<any> {
    const response = await this.api.post('/absenteeism', data);
    return response.data;
  }

  async updateAbsenteeismRecord(id: number, data: any): Promise<any> {
    const response = await this.api.put(`/absenteeism/${id}`, data);
    return response.data;
  }

  async deleteAbsenteeismRecord(id: number): Promise<void> {
    await this.api.delete(`/absenteeism/${id}`);
  }

  async getAbsenteeismStats(params?: any): Promise<any> {
    const response = await this.api.get('/absenteeism/stats/summary', { params });
    return response.data;
  }

  async searchWorkersForAbsenteeism(query: string, limit: number = 10): Promise<any> {
    const response = await this.api.get('/absenteeism/workers/search', {
      params: { q: query, limit }
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;