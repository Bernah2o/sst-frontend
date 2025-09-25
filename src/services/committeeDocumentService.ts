import { apiService as api } from './api';
import {
  CommitteeDocument,
  CommitteeDocumentCreate,
  CommitteeDocumentUpdate,
  CommitteeDocumentType,
} from '../types';

const BASE_URL = '/committee-activities/documents';

export const committeeDocumentService = {
  // Document CRUD operations
  async getDocuments(filters?: {
    committee_id?: number;
    meeting_id?: number;
    voting_id?: number;
    activity_id?: number;
    document_type?: CommitteeDocumentType;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: CommitteeDocument[]; total: number; page: number; page_size: number; total_pages: number }> {
    if (!filters?.committee_id) {
      throw new Error('committee_id is required for getDocuments');
    }

    const params = new URLSearchParams();
    if (filters?.meeting_id) params.append('meeting_id', filters.meeting_id.toString());
    if (filters?.voting_id) params.append('voting_id', filters.voting_id.toString());
    if (filters?.activity_id) params.append('activity_id', filters.activity_id.toString());
    if (filters?.document_type) params.append('document_type', filters.document_type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('skip', ((filters.page - 1) * (filters.page_size || 10)).toString());
    if (filters?.page_size) params.append('limit', filters.page_size.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`${BASE_URL}/committee/${filters.committee_id}${queryString}`);
    
    // Transform backend response to match expected frontend format
    const documents = response.data || [];
    return {
      items: documents,
      total: documents.length,
      page: filters.page || 1,
      page_size: filters.page_size || 10,
      total_pages: Math.ceil(documents.length / (filters.page_size || 10))
    };
  },

  async getDocument(id: number): Promise<CommitteeDocument> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createDocument(documentData: CommitteeDocumentCreate, file: File): Promise<CommitteeDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('committee_id', documentData.committee_id.toString());
    if (documentData.meeting_id) formData.append('meeting_id', documentData.meeting_id.toString());
    if (documentData.voting_id) formData.append('voting_id', documentData.voting_id.toString());
    if (documentData.activity_id) formData.append('activity_id', documentData.activity_id.toString());
    formData.append('title', documentData.title);
    if (documentData.description) formData.append('description', documentData.description);
    formData.append('document_type', documentData.document_type);
    if (documentData.version) formData.append('version', documentData.version);
    if (documentData.tags) formData.append('tags', documentData.tags);
    if (documentData.expiry_date) formData.append('expiry_date', documentData.expiry_date);
    if (documentData.notes) formData.append('notes', documentData.notes);

    const response = await api.post(`${BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadDocument(file: File, documentData: Omit<CommitteeDocumentCreate, 'file_path' | 'file_name' | 'file_size' | 'mime_type'>): Promise<CommitteeDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('committee_id', documentData.committee_id.toString());
    if (documentData.meeting_id) formData.append('meeting_id', documentData.meeting_id.toString());
    if (documentData.voting_id) formData.append('voting_id', documentData.voting_id.toString());
    if (documentData.activity_id) formData.append('activity_id', documentData.activity_id.toString());
    formData.append('title', documentData.title);
    if (documentData.description) formData.append('description', documentData.description);
    formData.append('document_type', documentData.document_type);

    const response = await api.post(`${BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateDocument(id: number, document: CommitteeDocumentUpdate, file?: File): Promise<CommitteeDocument> {
    if (file) {
      // If file is provided, use FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      if (document.title) formData.append('title', document.title);
      if (document.description) formData.append('description', document.description);
      if (document.document_type) formData.append('document_type', document.document_type);
      if (document.version) formData.append('version', document.version);
      if (document.tags) formData.append('tags', document.tags);
      if (document.expiry_date) formData.append('expiry_date', document.expiry_date);
      if (document.notes) formData.append('notes', document.notes);

      const response = await api.put(`${BASE_URL}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // If no file, just update metadata
      const response = await api.put(`${BASE_URL}/${id}`, document);
      return response.data;
    }
  },

  async deleteDocument(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Document download and access
  async downloadDocument(id: number): Promise<Blob> {
    const response = await api.get(`${BASE_URL}/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async getDocumentUrl(id: number): Promise<string> {
    const response = await api.get(`${BASE_URL}/${id}/url`);
    return response.data.url;
  },

  async previewDocument(id: number): Promise<Blob> {
    const response = await api.get(`${BASE_URL}/${id}/preview`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Document statistics
  async incrementDownloadCount(id: number): Promise<void> {
    await api.post(`${BASE_URL}/${id}/download-count`);
  },

  async getDocumentStatistics(committeeId: number): Promise<any> {
    const response = await api.get(`${BASE_URL}/statistics/${committeeId}`);
    return response.data;
  },

  // Document types
  async getDocumentTypes(): Promise<{ value: CommitteeDocumentType; label: string }[]> {
    return [
      { value: CommitteeDocumentType.MEETING_MINUTES, label: 'Acta de Reunión' },
      { value: CommitteeDocumentType.VOTING_RECORD, label: 'Registro de Votación' },
      { value: CommitteeDocumentType.ACTIVITY_REPORT, label: 'Reporte de Actividad' },
      { value: CommitteeDocumentType.PRESENTATION, label: 'Presentación' },
      { value: CommitteeDocumentType.AGREEMENT, label: 'Acuerdo' },
      { value: CommitteeDocumentType.OTHER, label: 'Otro' },
    ];
  },

  // Bulk operations
  async bulkUpload(files: File[], documentData: Omit<CommitteeDocumentCreate, 'file_path' | 'file_name' | 'file_size' | 'mime_type' | 'title'>): Promise<CommitteeDocument[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    formData.append('committee_id', documentData.committee_id.toString());
    if (documentData.meeting_id) formData.append('meeting_id', documentData.meeting_id.toString());
    if (documentData.voting_id) formData.append('voting_id', documentData.voting_id.toString());
    if (documentData.activity_id) formData.append('activity_id', documentData.activity_id.toString());
    if (documentData.description) formData.append('description', documentData.description);
    formData.append('document_type', documentData.document_type);

    const response = await api.post(`${BASE_URL}/bulk-upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async bulkDelete(documentIds: number[]): Promise<void> {
    await api.delete(`${BASE_URL}/bulk`, {
      data: { document_ids: documentIds },
    });
  },

  // Document search and filtering
  async searchDocuments(query: string, committeeId?: number): Promise<CommitteeDocument[]> {
    const params = new URLSearchParams();
    params.append('search', query);
    if (committeeId) params.append('committee_id', committeeId.toString());

    const response = await api.get(`${BASE_URL}/search?${params.toString()}`);
    return response.data;
  },

  async getRecentDocuments(committeeId: number, limit: number = 10): Promise<CommitteeDocument[]> {
    const response = await api.get(`${BASE_URL}/recent?committee_id=${committeeId}&limit=${limit}`);
    return response.data;
  },

  // Document validation
  async validateDocument(file: File): Promise<{ valid: boolean; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`${BASE_URL}/validate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Document sharing
  async shareDocument(id: number, userIds: number[], message?: string): Promise<void> {
    await api.post(`${BASE_URL}/${id}/share`, {
      user_ids: userIds,
      message,
    });
  },

  async getSharedDocuments(): Promise<CommitteeDocument[]> {
    const response = await api.get(`${BASE_URL}/shared`);
    return response.data;
  },

  // Document versioning
  async getDocumentVersions(id: number): Promise<CommitteeDocument[]> {
    const response = await api.get(`${BASE_URL}/${id}/versions`);
    return response.data;
  },

  async uploadNewVersion(id: number, file: File, versionNotes?: string): Promise<CommitteeDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (versionNotes) formData.append('version_notes', versionNotes);

    const response = await api.post(`${BASE_URL}/${id}/new-version`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};