import api from './api';
import {
  VirtualAttendanceCheckIn,
  VirtualAttendanceCheckOut,
  SessionCodeGenerate,
  SessionCodeValidate,
  VirtualAttendanceResponse,
} from '../types';

export const virtualAttendanceService = {
  // Generate session code for facilitators/admins
  generateSessionCode: async (data: SessionCodeGenerate): Promise<{ session_code: string; expires_at: string }> => {
    const response = await api.post('/attendance/virtual/generate-code', data);
    return response.data;
  },

  // Validate session code
  validateSessionCode: async (data: SessionCodeValidate): Promise<{ valid: boolean; course_id?: number; session_date?: string; course_name?: string; virtual_session_link?: string }> => {
    const response = await api.post('/attendance/virtual/validate-code', data);
    return response.data;
  },

  // Virtual check-in
  checkIn: async (data: VirtualAttendanceCheckIn): Promise<VirtualAttendanceResponse> => {
    const response = await api.post('/attendance/virtual/check-in', data);
    return response.data;
  },

  // Virtual check-out
  checkOut: async (data: VirtualAttendanceCheckOut): Promise<VirtualAttendanceResponse> => {
    const response = await api.post('/attendance/virtual/check-out', data);
    return response.data;
  },

  // Get virtual attendance status
  getStatus: async (userId: number, sessionDate: string): Promise<VirtualAttendanceResponse | null> => {
    try {
      const response = await api.get(`/attendance/virtual/status/${userId}/${sessionDate}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get device fingerprint (simple implementation)
  getDeviceFingerprint: (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      window.screen.width + 'x' + window.screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 'unknown',
      (navigator as any).deviceMemory || 'unknown'
    ].join('|');
    
    return btoa(fingerprint).substring(0, 32);
  },

  // Get browser info
  getBrowserInfo: (): string => {
    const browserInfo = JSON.stringify({
      userAgent: navigator.userAgent.substring(0, 100), // Limit userAgent to 100 chars
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    });
    
    // Ensure the total length doesn't exceed 255 characters
    return browserInfo.length > 255 ? browserInfo.substring(0, 255) : browserInfo;
  }
};

export default virtualAttendanceService;