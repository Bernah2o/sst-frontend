import api from "./api";

export interface MasterDocument {
  id: number;
  empresa_id: number;
  tipo_documento: string;
  nombre_documento: string;
  version: string;
  codigo: string;
  fecha: string; // ISO Date string
  ubicacion: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterDocumentCreate {
  empresa_id?: number;
  tipo_documento: string;
  nombre_documento: string;
  version?: string;
  codigo: string;
  fecha?: string;
  ubicacion?: string;
}

export interface MasterDocumentUpdate {
  empresa_id?: number;
  tipo_documento?: string;
  nombre_documento?: string;
  version?: string;
  codigo?: string;
  fecha?: string;
  ubicacion?: string;
  is_active?: boolean;
}

export interface MasterDocumentFilters {
  empresa_id?: number;
  tipo_documento?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export const masterDocumentService = {
  async getDocuments(
    filters: MasterDocumentFilters = {},
  ): Promise<MasterDocument[]> {
    const params = new URLSearchParams();
    if (filters.empresa_id)
      params.append("empresa_id", filters.empresa_id.toString());
    if (filters.tipo_documento)
      params.append("tipo_documento", filters.tipo_documento);
    if (filters.search) params.append("search", filters.search);
    if (filters.skip) params.append("skip", filters.skip.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await api.get(`/master-documents/?${params.toString()}`);
    return response.data;
  },

  async getDocument(id: number): Promise<MasterDocument> {
    const response = await api.get(`/master-documents/${id}`);
    return response.data;
  },

  async createDocument(data: MasterDocumentCreate): Promise<MasterDocument> {
    const response = await api.post("/master-documents/", data);
    return response.data;
  },

  async updateDocument(
    id: number,
    data: MasterDocumentUpdate,
  ): Promise<MasterDocument> {
    const response = await api.put(`/master-documents/${id}`, data);
    return response.data;
  },

  async deleteDocument(id: number): Promise<void> {
    await api.delete(`/master-documents/${id}`);
  },
};
