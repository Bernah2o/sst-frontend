import api from './api';

// Note: API endpoints use /api/v1 prefix as configured in the api module

export interface Supplier {
  id: number;
  name: string;
  nit: string;
  supplier_type: 'medical_center' | 'laboratory' | 'clinic' | 'hospital' | 'other';
  status?: 'active' | 'inactive' | 'suspended';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  website?: string;
  description?: string;
  observations?: string;
  health_registration?: string;
  accreditation?: string;
  contact_person?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  doctors?: Doctor[];
}

export interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  document_number?: string;
  medical_license: string;
  specialty?: string;
  sub_specialty?: string;
  email?: string;
  phone?: string;
  years_experience?: number;
  observations?: string;
  supplier_id: number;
  supplier?: Supplier;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SupplierFilters {
  supplier_type?: string;
  status?: string;
  search?: string;
  is_active?: boolean;
}

export interface DoctorFilters {
  supplier_id?: number;
  specialty?: string;
  is_active?: boolean;
  search?: string;
}

class SuppliersService {
  // Suppliers endpoints
  async getSuppliers(filters?: SupplierFilters): Promise<Supplier[]> {
    const params = new URLSearchParams();
    
    if (filters?.supplier_type) params.append('supplier_type', filters.supplier_type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    
    const response = await api.get(`/suppliers/?${params.toString()}`);
    return response.data;
  }

  async getSupplier(id: number): Promise<Supplier> {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  }

  async getSupplierWithDoctors(id: number): Promise<Supplier> {
    const response = await api.get(`/suppliers/${id}/with-doctors`);
    return response.data;
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    const response = await api.get('/suppliers/active');
    return response.data;
  }

  async getSupplierTypes(): Promise<string[]> {
    const response = await api.get('/suppliers/types');
    return response.data.types.map((type: any) => type.value);
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'doctors'>): Promise<Supplier> {
    const response = await api.post('/suppliers/', supplier);
    return response.data;
  }

  async updateSupplier(id: number, supplier: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'doctors'>>): Promise<Supplier> {
    const response = await api.put(`/suppliers/${id}`, supplier);
    return response.data;
  }

  async deleteSupplier(id: number): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  }

  // Doctors endpoints
  async getDoctors(filters?: DoctorFilters): Promise<Doctor[]> {
    const params = new URLSearchParams();
    
    if (filters?.supplier_id) params.append('supplier_id', filters.supplier_id.toString());
    if (filters?.specialty) params.append('specialty', filters.specialty);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/suppliers/doctors/?${params.toString()}`);
    return response.data;
  }

  async getDoctor(id: number): Promise<Doctor> {
    const response = await api.get(`/suppliers/doctors/${id}`);
    return response.data;
  }

  async getDoctorsBySupplier(supplierId: number): Promise<Doctor[]> {
    const response = await api.get(`/suppliers/${supplierId}/doctors`);
    return response.data;
  }

  async getActiveDoctors(): Promise<Doctor[]> {
    const response = await api.get('/suppliers/doctors/active');
    return response.data;
  }

  async createDoctor(doctor: Omit<Doctor, 'id' | 'created_at' | 'updated_at' | 'supplier' | 'full_name'>): Promise<Doctor> {
    const response = await api.post('/suppliers/doctors/', doctor);
    return response.data;
  }

  async updateDoctor(id: number, doctor: Partial<Omit<Doctor, 'id' | 'created_at' | 'updated_at' | 'supplier' | 'full_name'>>): Promise<Doctor> {
    const response = await api.put(`/suppliers/doctors/${id}`, doctor);
    return response.data;
  }

  async deleteDoctor(id: number): Promise<void> {
    await api.delete(`/suppliers/doctors/${id}`);
  }

  // Helper methods
  getSupplierTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'medical_center': 'Centro Médico',
      'laboratory': 'Laboratorio',
      'clinic': 'Clínica',
      'hospital': 'Hospital',
      'other': 'Otro'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'suspended': 'Suspendido'
    };
    return labels[status] || status;
  }

  formatDoctorName(doctor: Doctor): string {
    return doctor.full_name || `Dr. ${doctor.first_name} ${doctor.last_name}`;
  }
}

export const suppliersService = new SuppliersService();
export default suppliersService;