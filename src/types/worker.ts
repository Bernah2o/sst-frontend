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
  first_name: string;
  last_name: string;
  full_name: string;
  document_number: string;
  email: string;
  position: string;
  department?: string;
  age: number;
  risk_level: string;
  fecha_de_ingreso?: string;
  is_active: boolean;
  assigned_role: string;
  is_registered: boolean;
  photo?: string;
  // Legacy fields for compatibility
  cedula: string;
  base_salary?: number;
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

// Vacation types
export interface WorkerVacation {
  id: number;
  worker_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_comments?: string;
  created_at: string;
  updated_at: string;
  approved_by?: number;
  approved_at?: string;
}

export interface VacationRequest {
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface VacationUpdate {
  start_date?: string;
  end_date?: string;
  reason?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface VacationApproval {
  status: 'approved' | 'rejected';
  admin_comments?: string;
}

export interface VacationBalance {
  worker_id: number;
  total_days: number;
  used_days: number;
  available_days: number;
  year: number;
}

export interface VacationAvailability {
  available: boolean;
  conflicts: Array<{
    id: number;
    start_date: string;
    end_date: string;
    worker_name: string;
  }>;
}

export interface VacationStats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  total_days_used: number;
}