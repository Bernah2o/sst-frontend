import { apiService as api } from "./api";
import {
  Activity,
  ActivityCreate,
  ActivityUpdate,
  ActivityListFilters,
  ActivityStatus,
  ActivityPriority,
} from "../types";

const BASE_URL = "/activities";

export const activityService = {
  // Activity CRUD operations
  async getActivities(
    filters?: ActivityListFilters & {
      page?: number;
      limit?: number;
      committee_ids?: number[];
      overdue_only?: boolean;
    }
  ): Promise<{ activities: Activity[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.committee_id)
      params.append("committee_id", filters.committee_id.toString());
    if (filters?.committee_ids) {
      filters.committee_ids.forEach((id) =>
        params.append("committee_ids", id.toString())
      );
    }
    if (filters?.assigned_to)
      params.append("assigned_to", filters.assigned_to.toString());
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.due_date_from)
      params.append("due_date_from", filters.due_date_from);
    if (filters?.due_date_to) params.append("due_date_to", filters.due_date_to);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.overdue_only) params.append("overdue_only", "true");

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  async getActivity(id: number): Promise<Activity> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createActivity(activity: ActivityCreate): Promise<Activity> {
    const response = await api.post(BASE_URL, activity);
    return response.data;
  },

  async updateActivity(
    id: number,
    activity: ActivityUpdate
  ): Promise<Activity> {
    const response = await api.put(`${BASE_URL}/${id}`, activity);
    return response.data;
  },

  async deleteActivity(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Activity status management
  async startActivity(id: number): Promise<Activity> {
    const response = await api.patch(`${BASE_URL}/${id}/start`);
    return response.data;
  },

  async completeActivity(
    id: number,
    completionNotes?: string
  ): Promise<Activity> {
    const response = await api.patch(`${BASE_URL}/${id}/complete`, {
      completion_notes: completionNotes,
    });
    return response.data;
  },

  async cancelActivity(id: number, reason?: string): Promise<Activity> {
    const response = await api.patch(`${BASE_URL}/${id}/cancel`, { reason });
    return response.data;
  },

  async updateActivityStatus(
    id: number,
    status: ActivityStatus,
    notes?: string
  ): Promise<Activity> {
    const response = await api.patch(`${BASE_URL}/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  // Activity assignment
  async assignActivity(id: number, userId: number): Promise<Activity> {
    const response = await api.patch(`${BASE_URL}/${id}/assign`, {
      assigned_to: userId,
    });
    return response.data;
  },

  async unassignActivity(id: number): Promise<Activity> {
    const response = await api.patch(`${BASE_URL}/${id}/unassign`);
    return response.data;
  },

  // Activity priority management
  async updateActivityPriority(
    id: number,
    priority: ActivityPriority
  ): Promise<Activity> {
    const response = await api.patch(`${BASE_URL}/${id}/priority`, {
      priority,
    });
    return response.data;
  },

  // Activity statistics
  async getActivityStatistics(
    committeeId: number,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);

    const response = await api.get(
      `${BASE_URL}/statistics/${committeeId}?${params.toString()}`
    );
    return response.data;
  },

  async getUserActivityStatistics(userId: number): Promise<any> {
    const response = await api.get(`${BASE_URL}/user/${userId}/statistics`);
    return response.data;
  },

  // Activity status options
  async getActivityStatuses(): Promise<
    { value: ActivityStatus; label: string }[]
  > {
    return [
      { value: ActivityStatus.PENDING, label: "Pendiente" },
      { value: ActivityStatus.IN_PROGRESS, label: "En Progreso" },
      { value: ActivityStatus.COMPLETED, label: "Completada" },
      { value: ActivityStatus.OVERDUE, label: "Vencida" },
      { value: ActivityStatus.CANCELLED, label: "Cancelada" },
    ];
  },

  // Activity priority options
  async getActivityPriorities(): Promise<
    { value: ActivityPriority; label: string }[]
  > {
    return [
      { value: ActivityPriority.LOW, label: "Baja" },
      { value: ActivityPriority.MEDIUM, label: "Media" },
      { value: ActivityPriority.HIGH, label: "Alta" },
      { value: ActivityPriority.CRITICAL, label: "Crítica" },
    ];
  },

  // Get activities by status
  async getPendingActivities(committeeId: number): Promise<Activity[]> {
    const response = await api.get(
      `${BASE_URL}?committee_id=${committeeId}&status=pending`
    );
    return response.data;
  },

  async getOverdueActivities(committeeIds: number[]): Promise<Activity[]> {
    const params = new URLSearchParams();
    committeeIds.forEach((id) => params.append("committee_ids", id.toString()));
    params.append("overdue_only", "true");

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return response.data.activities || response.data;
  },

  async getActivitiesByStatus(
    status: ActivityStatus,
    committeeIds: number[]
  ): Promise<Activity[]> {
    const params = new URLSearchParams();
    params.append("status", status);
    committeeIds.forEach((id) => params.append("committee_ids", id.toString()));

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return response.data.activities || response.data;
  },

  async getUserActivities(userId: number): Promise<Activity[]> {
    const response = await api.get(`${BASE_URL}?assigned_to=${userId}`);
    return response.data;
  },

  // Bulk operations
  async bulkUpdateStatus(
    activityIds: number[],
    status: ActivityStatus
  ): Promise<Activity[]> {
    const response = await api.patch(`${BASE_URL}/bulk/status`, {
      activity_ids: activityIds,
      status,
    });
    return response.data;
  },

  async bulkAssign(activityIds: number[], userId: number): Promise<Activity[]> {
    const response = await api.patch(`${BASE_URL}/bulk/assign`, {
      activity_ids: activityIds,
      assigned_to: userId,
    });
    return response.data;
  },

  // Export activities
  async exportActivities(
    filters?: ActivityListFilters,
    format: "pdf" | "excel" = "excel"
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.committee_id)
      params.append("committee_id", filters.committee_id.toString());
    if (filters?.assigned_to)
      params.append("assigned_to", filters.assigned_to.toString());
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.due_date_from)
      params.append("due_date_from", filters.due_date_from);
    if (filters?.due_date_to) params.append("due_date_to", filters.due_date_to);

    const response = await api.get(
      `${BASE_URL}/export/${format}?${params.toString()}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  // Activity reminders
  async sendActivityReminders(activityId: number): Promise<void> {
    await api.post(`${BASE_URL}/${activityId}/remind`);
  },

  async scheduleActivityReminder(
    activityId: number,
    reminderDate: string
  ): Promise<void> {
    await api.post(`${BASE_URL}/${activityId}/schedule-reminder`, {
      reminder_date: reminderDate,
    });
  },
};
