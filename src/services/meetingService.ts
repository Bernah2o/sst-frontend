import { apiService as api } from './api';
import {
  Meeting,
  MeetingCreate,
  MeetingUpdate,
  MeetingListFilters,
  MeetingAttendance,
  MeetingAttendanceCreate,
  MeetingAttendanceUpdate,
  MeetingMinutes,
  MeetingStatus,
} from '../types';

const BASE_URL = '/committee-meetings';

export const meetingService = {
  // Meeting CRUD operations
  async getMeetings(filters?: MeetingListFilters): Promise<Meeting[]> {
    if (!filters?.committee_id) {
      throw new Error('committee_id is required for getMeetings');
    }
    
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`${BASE_URL}/committee/${filters.committee_id}${queryString}`);
    return response.data;
  },

  async getAllMeetings(filters?: Omit<MeetingListFilters, 'committee_id'>): Promise<Meeting[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`${BASE_URL}${queryString}`);
    return response.data;
  },

  async getMeeting(id: number, committeeId: number): Promise<Meeting> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createMeeting(meeting: MeetingCreate): Promise<Meeting> {
    if (!meeting.committee_id) {
      throw new Error('committee_id is required for createMeeting');
    }
    const response = await api.post(`${BASE_URL}`, meeting);
    return response.data;
  },

  async updateMeeting(id: number, meeting: MeetingUpdate, committeeId: number): Promise<Meeting> {
    const response = await api.put(`${BASE_URL}/${id}`, meeting);
    return response.data;
  },

  async deleteMeeting(id: number, committeeId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Meeting status management
  async startMeeting(id: number, committeeId: number): Promise<Meeting> {
    const response = await api.post(`${BASE_URL}/${id}/start`);
    return response.data;
  },

  async completeMeeting(id: number, committeeId: number): Promise<Meeting> {
    const response = await api.post(`${BASE_URL}/${id}/complete`);
    return response.data;
  },

  async cancelMeeting(id: number, committeeId: number, reason?: string): Promise<Meeting> {
    const response = await api.post(`${BASE_URL}/${id}/cancel`, { reason });
    return response.data;
  },

  async postponeMeeting(id: number, committeeId: number, newDate: string, newTime: string): Promise<Meeting> {
    // Note: postpone endpoint may not be available in backend, using update instead
    const response = await api.put(`${BASE_URL}/${id}`, {
      meeting_date: newDate,
      start_time: newTime,
    });
    return response.data;
  },

  // Meeting attendance management
  async getMeetingAttendance(meetingId: number, committeeId: number): Promise<MeetingAttendance[]> {
    const response = await api.get(`${BASE_URL}/${meetingId}/attendance`);
    return response.data;
  },

  async recordAttendance(attendance: MeetingAttendanceCreate, committeeId: number): Promise<MeetingAttendance> {
    const response = await api.post(`${BASE_URL}/${attendance.meeting_id}/attendance`, attendance);
    return response.data;
  },

  async updateAttendance(id: number, attendance: MeetingAttendanceUpdate, committeeId: number, meetingId: number): Promise<MeetingAttendance> {
    const response = await api.put(`${BASE_URL}/${meetingId}/attendance/${id}`, attendance);
    return response.data;
  },

  async bulkRecordAttendance(meetingId: number, committeeId: number, attendanceList: MeetingAttendanceCreate[]): Promise<MeetingAttendance[]> {
    // Note: bulk attendance endpoint may not be available, implementing individual calls
    const results = await Promise.all(
      attendanceList.map(attendance => this.recordAttendance(attendance, committeeId))
    );
    return results;
  },

  // Meeting minutes management
  async getMeetingMinutes(meetingId: number, committeeId: number): Promise<MeetingMinutes> {
    // Note: Minutes may be stored in the meeting notes field
    const meeting = await this.getMeeting(meetingId, committeeId);
    const attendance = await this.getMeetingAttendance(meetingId, committeeId);
    
    return {
      meeting: meeting,
      attendance: attendance,
      votings: [], // Empty array as votings are not implemented yet
      activities: [], // Empty array as activities are not implemented yet
      documents: [], // Empty array as documents are not implemented yet
      minutes_content: meeting.notes || '',
    };
  },

  async updateMeetingMinutes(meetingId: number, committeeId: number, minutesContent: string): Promise<void> {
    // Note: Updating minutes through the meeting notes field
    await api.put(`${BASE_URL}/${meetingId}`, { notes: minutesContent });
  },

  // Meeting statistics and reports
  async getMeetingStatistics(committeeId: number, dateFrom?: string, dateTo?: string): Promise<any> {
    // Note: Using the committee meetings endpoint with filters for statistics
    const params = new URLSearchParams();
    params.append('committee_id', committeeId.toString());
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`${BASE_URL}/committee/${committeeId}${queryString}`);
    return {
      total_meetings: response.data.length,
      meetings: response.data,
    };
  },

  // Meeting status options
  async getMeetingStatuses(): Promise<{ value: MeetingStatus; label: string }[]> {
    return [
      { value: MeetingStatus.SCHEDULED, label: 'Programada' },
      { value: MeetingStatus.IN_PROGRESS, label: 'En Progreso' },
      { value: MeetingStatus.COMPLETED, label: 'Completada' },
      { value: MeetingStatus.CANCELLED, label: 'Cancelada' },
      { value: MeetingStatus.POSTPONED, label: 'Pospuesta' },
    ];
  },

  // Get upcoming meetings for a committee
  async getUpcomingMeetings(committeeId: number): Promise<Meeting[]> {
    const response = await api.get(`${BASE_URL}/committee/${committeeId}?status=scheduled&upcoming_only=true`);
    return response.data;
  },

  // Export meeting data
  async exportMeetingData(meetingId: number, committeeId: number, format: 'pdf' | 'excel'): Promise<Blob> {
    // Note: Export functionality may not be available in backend, returning empty blob
    console.warn('Export functionality not implemented in backend');
    return new Blob();
  },
};