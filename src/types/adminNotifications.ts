// Enums para notificaciones administrativas
export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  ACKNOWLEDGED = "acknowledged"
}

export enum ExamNotificationType {
  FIRST_NOTIFICATION = "first_notification",
  REMINDER = "reminder",
  OVERDUE = "overdue"
}

export enum ExamStatus {
  SIN_EXAMENES = "sin_examenes",
  VENCIDO = "vencido",
  PROXIMO_A_VENCER = "proximo_a_vencer",
  AL_DIA = "al_dia"
}

export enum BulkAction {
  SEND = "send",
  SUPPRESS = "suppress"
}

// Interfaces para notificaciones administrativas
export interface WorkerNotification {
  worker_id: number;
  worker_name: string;
  worker_document: string;
  worker_position: string;
  worker_email: string | null;
  last_exam_date: string | null;
  next_exam_date: string | null;
  days_until_exam: number | null;
  exam_status: ExamStatus;
  periodicidad: string;
  notification_status: NotificationStatus;
  acknowledgment_count: number;
  can_send_notification: boolean;
  notification_types_sent: ExamNotificationType[];
  last_acknowledgment_date: string | null;
}

export interface SendNotificationRequest {
  worker_ids: number[];
  notification_type: ExamNotificationType;
  force_send?: boolean;
}

export interface SuppressNotificationRequest {
  worker_ids: number[];
  notification_type?: ExamNotificationType;
  reason?: string;
}

export interface NotificationAcknowledgment {
  id: number;
  worker_id: number;
  worker_name: string;
  occupational_exam_id: number | null;
  notification_type: ExamNotificationType;
  acknowledged_at: string;
  ip_address: string | null;
  user_agent: string | null;
  stops_notifications: boolean;
  reason: string | null;
}

export interface NotificationStatistics {
  total_workers: number;
  workers_without_exams: number;
  workers_with_overdue_exams: number;
  workers_with_upcoming_exams: number;
  total_notifications_sent_today: number;
  total_acknowledgments_today: number;
  suppressed_notifications: number;
}

export interface NotificationFilters {
  exam_status?: ExamStatus;
  notification_status?: NotificationStatus;
  position?: string;
  has_email?: boolean;
  acknowledged?: boolean;
  skip?: number;
  limit?: number;
}

export interface BulkActionRequest {
  action: BulkAction;
  worker_ids: number[];
  notification_type?: ExamNotificationType;
  force?: boolean;
  reason?: string;
}

export interface BulkActionResponse {
  success_count: number;
  failed_count: number;
  errors: string[];
  processed_workers: number[];
}

export interface SendNotificationResponse {
  success_count: number;
  failed_count: number;
  sent_notifications: {
    worker_id: number;
    worker_name: string;
    notification_type: ExamNotificationType;
    sent_at: string;
  }[];
  errors: string[];
}

export interface SuppressNotificationResponse {
  success_count: number;
  failed_count: number;
  suppressed_notifications: {
    worker_id: number;
    worker_name: string;
    notification_type: ExamNotificationType;
    suppressed_at: string;
  }[];
  errors: string[];
}

// Filtros para confirmaciones
export interface AcknowledgmentFilters {
  worker_id?: number;
  notification_type?: ExamNotificationType;
  skip?: number;
  limit?: number;
}

// Respuesta paginada para notificaciones
export interface PaginatedNotifications {
  items: WorkerNotification[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Respuesta paginada para confirmaciones
export interface PaginatedAcknowledgments {
  items: NotificationAcknowledgment[];
  total: number;
  page: number;
  size: number;
  pages: number;
}