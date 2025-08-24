export interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  document_number: string;
  cedula: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  fecha_de_ingreso?: string;
  base_salary?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkerList {
  id: number;
  name: string;
  cedula: string;
  first_name: string;
  last_name: string;
  document_number: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  fecha_de_ingreso?: string;
  base_salary?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkerFilters {
  search?: string;
  is_active?: boolean;
  department?: string;
  position?: string;
  skip?: number;
  limit?: number;
}

export interface WorkerCreate {
  first_name: string;
  last_name: string;
  document_number: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  fecha_de_ingreso?: string;
  is_active?: boolean;
}

export interface WorkerUpdate extends Partial<WorkerCreate> {
  id: number;
}