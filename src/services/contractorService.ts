import api from "./api";
import {
  ContractorCreate,
  ContractorUpdate,
  ContractorResponse,
  ContractorList,
  ContractorDocumentResponse,
  ContractorDocumentUpdate,
  ContractorContractCreate,
  ContractorContractUpdate,
  ContractorContractResponse,
} from "../types/contractor";

export interface ContractorFilters {
  search?: string;
  tipo_documento?: string;
  genero?: string;

  nivel_educativo?: string;
  cargo?: string;
  area_trabajo?: string;
  tipo_contrato?: string;
  eps?: string;
  arl?: string;
  afp?: string;
  activo?: boolean;
  page?: number;
  size?: number;
}

class ContractorService {
  private baseUrl = "/contractors";

  // CRUD operations for contractors
  async getContractors(
    filters: ContractorFilters = {}
  ): Promise<ContractorList> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  async getContractor(id: number): Promise<ContractorResponse> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createContractor(
    contractor: ContractorCreate
  ): Promise<ContractorResponse> {
    const response = await api.post(this.baseUrl, contractor);
    return response.data;
  }

  async updateContractor(
    id: number,
    contractor: ContractorUpdate
  ): Promise<ContractorResponse> {
    const response = await api.put(`${this.baseUrl}/${id}`, contractor);
    return response.data;
  }

  async deleteContractor(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  // Document management
  async getContractorDocuments(
    filters: {
      contractor_id?: number;
      document_type?: string;
      search?: string;
      page?: number;
      size?: number;
    } = {}
  ): Promise<{
    documents: ContractorDocumentResponse[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(
      `${this.baseUrl}/documents?${params.toString()}`
    );
    return response.data;
  }

  async uploadContractorDocument(
    contractorId: number,
    file: File,
    documentType: string,
    nombre?: string,
    descripcion?: string
  ): Promise<ContractorDocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipo_documento", documentType);
    if (nombre) formData.append("nombre", nombre);
    if (descripcion) formData.append("descripcion", descripcion);

    const response = await api.post(
      `${this.baseUrl}/${contractorId}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  async updateContractorDocument(
    documentId: number,
    update: ContractorDocumentUpdate
  ): Promise<ContractorDocumentResponse> {
    const response = await api.put(
      `${this.baseUrl}/documents/${documentId}`,
      update
    );
    return response.data;
  }

  async deleteContractorDocument(contractorId: number, documentId: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${contractorId}/documents/${documentId}`);
  }

  async downloadContractorDocument(contractorId: number, documentId: number): Promise<Blob> {
    const response = await api.get(
      `${this.baseUrl}/${contractorId}/documents/${documentId}/download`,
      { responseType: "blob" }
    );
    return response.data;
  }

  // Specific document type uploads
  async uploadARL(
    contractorId: number,
    file: File
  ): Promise<ContractorDocumentResponse> {
    return this.uploadContractorDocument(contractorId, file, "arl");
  }

  async uploadEPS(
    contractorId: number,
    file: File
  ): Promise<ContractorDocumentResponse> {
    return this.uploadContractorDocument(contractorId, file, "eps");
  }

  async uploadAFP(
    contractorId: number,
    file: File
  ): Promise<ContractorDocumentResponse> {
    return this.uploadContractorDocument(contractorId, file, "pension");
  }

  async uploadOtherDocument(
    contractorId: number,
    file: File
  ): Promise<ContractorDocumentResponse> {
    return this.uploadContractorDocument(contractorId, file, "otro");
  }

  // Contract management
  async getContractorContracts(
    contractorId: number
  ): Promise<ContractorContractResponse[]> {
    const response = await api.get(`${this.baseUrl}/${contractorId}/contracts`);
    return response.data;
  }

  async getContract(
    contractorId: number,
    contractId: number
  ): Promise<ContractorContractResponse> {
    const response = await api.get(
      `${this.baseUrl}/${contractorId}/contracts/${contractId}`
    );
    return response.data;
  }

  async createContract(
    contractorId: number,
    contract: ContractorContractCreate
  ): Promise<ContractorContractResponse> {
    const response = await api.post(
      `${this.baseUrl}/${contractorId}/contracts`,
      contract
    );
    return response.data;
  }

  async updateContract(
    contractorId: number,
    contractId: number,
    contract: ContractorContractUpdate
  ): Promise<ContractorContractResponse> {
    const response = await api.put(
      `${this.baseUrl}/${contractorId}/contracts/${contractId}`,
      contract
    );
    return response.data;
  }

  async deleteContract(
    contractorId: number,
    contractId: number
  ): Promise<void> {
    await api.delete(`${this.baseUrl}/${contractorId}/contracts/${contractId}`);
  }

  // Utility methods
  async searchContractors(query: string): Promise<ContractorResponse[]> {
    const response = await api.get(
      `${this.baseUrl}/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  async getContractorStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    by_contract_type: Record<string, number>;
    by_area: Record<string, number>;
  }> {
    const response = await api.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  async exportContractors(filters: ContractorFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(
      `${this.baseUrl}/export?${params.toString()}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  }

  async importContractors(file: File): Promise<{
    success: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`${this.baseUrl}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
}

const contractorService = new ContractorService();
export default contractorService;
