import { apiService as api } from './api';
import {
  Activity,
  ActivityCreate,
  ActivityUpdate,
  ActivityListFilters,
  ActivityStatus,
  ActivityPriority,
} from '../types';

const BASE_URL = '/committee-activities';

export const committeeActivityService = {
  // Committee Activity CRUD operations
  async getActivities(committeeId: number, filters?: ActivityListFilters & { page?: number; limit?: number; overdue_only?: boolean }): Promise<{ activities: Activity[]; total: number }> {
    const params = new URLSearchParams();
    params.append('committee_id', committeeId.toString());
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.due_date_from) params.append('due_date_from', filters.due_date_from);
    if (filters?.due_date_to) params.append('due_date_to', filters.due_date_to);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('skip', ((filters.page - 1) * (filters.limit || 10)).toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.overdue_only) params.append('overdue_only', filters.overdue_only.toString());

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return { activities: response.data || [], total: response.data?.length || 0 };
  },

  async getActivity(committeeId: number, activityId: number): Promise<Activity> {
    const response = await api.get(`${BASE_URL}/${activityId}`);
    return response.data;
  },

  async createActivity(committeeId: number, activity: ActivityCreate): Promise<Activity> {
    const activityData = { ...activity, committee_id: committeeId };
    const response = await api.post(`${BASE_URL}`, activityData);
    return response.data;
  },

  async updateActivity(committeeId: number, activityId: number, activity: ActivityUpdate): Promise<Activity> {
    const response = await api.put(`${BASE_URL}/${activityId}`, activity);
    return response.data;
  },

  async deleteActivity(committeeId: number, activityId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${activityId}`);
  },

  // Activity status management
  async completeActivity(committeeId: number, activityId: number, completionNotes?: string): Promise<Activity> {
    const params = new URLSearchParams();
    if (completionNotes) {
      params.append('completion_notes', completionNotes);
    }
    const response = await api.post(`${BASE_URL}/${activityId}/complete?${params.toString()}`);
    return response.data;
  },

  // For status changes not supported by backend, we'll use the update endpoint
  async startActivity(committeeId: number, activityId: number): Promise<Activity> {
    const response = await api.put(`${BASE_URL}/${activityId}`, {
      status: 'in_progress'
    });
    return response.data;
  },

  async pauseActivity(committeeId: number, activityId: number, reason?: string): Promise<Activity> {
    const response = await api.put(`${BASE_URL}/${activityId}`, {
      status: 'paused',
      notes: reason ? `Pausada: ${reason}` : 'Pausada'
    });
    return response.data;
  },

  async resumeActivity(committeeId: number, activityId: number): Promise<Activity> {
    const response = await api.put(`${BASE_URL}/${activityId}`, {
      status: 'in_progress'
    });
    return response.data;
  },

  async cancelActivity(committeeId: number, activityId: number, reason?: string): Promise<Activity> {
    const response = await api.put(`${BASE_URL}/${activityId}`, {
      status: 'cancelled',
      notes: reason ? `Cancelada: ${reason}` : 'Cancelada'
    });
    return response.data;
  },

  // Activity assignment
  async assignActivity(committeeId: number, activityId: number, assignedTo: number): Promise<Activity> {
    const response = await api.put(`${BASE_URL}/${activityId}`, {
      assigned_to: assignedTo
    });
    return response.data;
  },

  async unassignActivity(committeeId: number, activityId: number): Promise<Activity> {
    const response = await api.put(`${BASE_URL}/${activityId}`, {
      assigned_to: null
    });
    return response.data;
  },

  // Activity queries for dashboard - these need to be adapted since backend doesn't have cross-committee endpoints
  async getActivitiesByStatus(status: ActivityStatus, committeeIds: number[]): Promise<Activity[]> {
    // Since backend doesn't have cross-committee endpoints, we'll need to call each committee separately
    const allActivities: Activity[] = [];
    
    for (const committeeId of committeeIds) {
      try {
        const result = await this.getActivities(committeeId, { status });
        allActivities.push(...result.activities);
      } catch (error) {
        console.warn(`Failed to fetch activities for committee ${committeeId}:`, error);
      }
    }
    
    return allActivities;
  },

  async getActivitiesByCommittee(committeeId: number, status?: ActivityStatus): Promise<Activity[]> {
    const result = await this.getActivities(committeeId, { status });
    return result.activities;
  },

  async getOverdueActivities(committeeIds?: number[]): Promise<Activity[]> {
    // Use the specific backend endpoint for overdue activities
    const response = await api.get(`${BASE_URL}/activities/overdue`);
    return response.data;
  },

  async getUserActivities(userId: number, committeeId?: number): Promise<Activity[]> {
    // Use the specific backend endpoint for user activities
    const response = await api.get(`${BASE_URL}/activities/user/${userId}`);
    return response.data;
  },

  // Activity statistics
  async getActivityStatistics(committeeId: number, dateFrom?: string, dateTo?: string): Promise<any> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    
    const response = await api.get(`${BASE_URL}/${committeeId}/activities/statistics?${params.toString()}`);
    return response.data;
  },
};