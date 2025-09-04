import axios, { AxiosInstance, AxiosResponse } from "axios";
import { getApiUrl } from "../config/env";
import {
  WorkerNotification,
  SendNotificationRequest,
  SendNotificationResponse,
  SuppressNotificationRequest,
  SuppressNotificationResponse,
  NotificationAcknowledgment,
  NotificationStatistics,
  NotificationFilters,
  AcknowledgmentFilters,
  BulkActionRequest,
  BulkActionResponse,
  PaginatedNotifications,
  PaginatedAcknowledgments,
  ExamStatus,
} from "../types/adminNotifications";

class AdminNotificationsService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: getApiUrl(),
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptor para agregar el token de autenticación
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
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
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtiene la lista de trabajadores con el estado de sus notificaciones
   */
  async getExamNotifications(
    filters?: NotificationFilters
  ): Promise<PaginatedNotifications> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response: AxiosResponse<PaginatedNotifications> = await this.api.get(
      `/admin/notifications/exam-notifications?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Envía notificaciones manuales a trabajadores específicos
   */
  async sendNotifications(
    request: SendNotificationRequest
  ): Promise<SendNotificationResponse> {
    const response: AxiosResponse<SendNotificationResponse> =
      await this.api.post("/admin/notifications/send-notifications", request);
    return response.data;
  }

  /**
   * Suprime notificaciones para trabajadores específicos
   */
  async suppressNotifications(
    request: SuppressNotificationRequest
  ): Promise<SuppressNotificationResponse> {
    const response: AxiosResponse<SuppressNotificationResponse> =
      await this.api.post(
        "/admin/notifications/suppress-notifications",
        request
      );
    return response.data;
  }

  /**
   * Obtiene la lista de confirmaciones de notificaciones
   */
  async getAcknowledgments(
    filters?: AcknowledgmentFilters
  ): Promise<PaginatedAcknowledgments> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response: AxiosResponse<PaginatedAcknowledgments> =
      await this.api.get(
        `/admin/notifications/acknowledgments?${params.toString()}`
      );
    return response.data;
  }

  /**
   * Obtiene estadísticas generales de notificaciones
   */
  async getStatistics(): Promise<NotificationStatistics> {
    const response: AxiosResponse<NotificationStatistics> = await this.api.get(
      "/admin/notifications/statistics"
    );
    return response.data;
  }

  /**
   * Elimina una confirmación específica
   */
  async deleteAcknowledgment(acknowledgmentId: number): Promise<void> {
    await this.api.delete(
      `/admin/notifications/acknowledgments/${acknowledgmentId}`
    );
  }

  /**
   * Ejecuta acciones en lote sobre notificaciones
   */
  async bulkAction(request: BulkActionRequest): Promise<BulkActionResponse> {
    const response: AxiosResponse<BulkActionResponse> = await this.api.post(
      "/admin/notifications/bulk-action",
      request
    );
    return response.data;
  }

  /**
   * Obtiene trabajadores filtrados para selección
   */
  async getWorkersForSelection(
    filters: {
      exam_status?: string;
      position?: string;
      has_email?: boolean;
      search?: string;
    } = {}
  ): Promise<WorkerNotification[]> {
    const notificationFilters: NotificationFilters = {
      limit: 1000,
    };

    if (filters.exam_status) {
      notificationFilters.exam_status = filters.exam_status as ExamStatus;
    }
    if (filters.position) {
      notificationFilters.position = filters.position;
    }
    if (filters.has_email !== undefined) {
      notificationFilters.has_email = filters.has_email;
    }

    const response = await this.getExamNotifications(notificationFilters);
    return response.items;
  }
}

// Exportar una instancia singleton
export const adminNotificationsService = new AdminNotificationsService();
export default adminNotificationsService;
