import api from './api';

export type EstadoPlan = 'borrador' | 'aprobado' | 'en_ejecucion' | 'finalizado';
export type CicloPhva = 'I_PLANEAR' | 'II_HACER' | 'III_VERIFICAR' | 'IV_ACTUAR';
export type CategoriaActividad =
  | 'RECURSOS'
  | 'GESTION_INTEGRAL'
  | 'GESTION_SALUD'
  | 'GESTION_PELIGROS'
  | 'GESTION_AMENAZAS'
  | 'VERIFICACION'
  | 'MEJORAMIENTO';

export interface PlanTrabajoSeguimiento {
  id: number;
  actividad_id: number;
  mes: number;
  programada: boolean;
  ejecutada: boolean;
  observacion?: string;
  fecha_ejecucion?: string;
  ejecutado_por?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanTrabajoActividad {
  id: number;
  plan_id: number;
  ciclo: CicloPhva;
  categoria: CategoriaActividad;
  estandar?: string;
  descripcion: string;
  frecuencia?: string;
  responsable?: string;
  recurso_financiero: boolean;
  recurso_tecnico: boolean;
  costo?: number;
  observaciones?: string;
  orden: number;
  seguimientos_mensuales: PlanTrabajoSeguimiento[];
  created_at: string;
  updated_at: string;
}

export interface PlanTrabajoAnual {
  id: number;
  año: number;
  empresa_id?: number;
  codigo: string;
  version: string;
  objetivo?: string;
  alcance?: string;
  meta?: string;
  meta_porcentaje: number;
  indicador?: string;
  formula?: string;
  encargado_sgsst?: string;
  aprobado_por?: string;
  estado: EstadoPlan;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface PlanTrabajoAnualDetail extends PlanTrabajoAnual {
  actividades: PlanTrabajoActividad[];
}

export interface MesIndicador {
  mes: number;
  nombre_mes: string;
  programadas: number;
  ejecutadas: number;
  porcentaje: number;
}

export interface DashboardIndicadores {
  plan_id: number;
  año: number;
  meta_porcentaje: number;
  total_programadas: number;
  total_ejecutadas: number;
  porcentaje_global: number;
  meses: MesIndicador[];
  analisis_t1?: string;
  analisis_t2?: string;
  analisis_t3?: string;
  analisis_t4?: string;
}

export interface PlanTrabajoAnualCreate {
  año: number;
  empresa_id?: number;
  codigo?: string;
  version?: string;
  objetivo?: string;
  alcance?: string;
  meta?: string;
  meta_porcentaje?: number;
  encargado_sgsst?: string;
  aprobado_por?: string;
  estado?: EstadoPlan;
}

export interface SeguimientoUpdate {
  programada?: boolean;
  ejecutada?: boolean;
  observacion?: string;
  fecha_ejecucion?: string;
  ejecutado_por?: string;
}

export interface ActividadUpdate {
  estandar?: string;
  descripcion?: string;
  frecuencia?: string;
  responsable?: string;
  recurso_financiero?: boolean;
  recurso_tecnico?: boolean;
  costo?: number;
  observaciones?: string;
}

const BASE_URL = '/plan-trabajo-anual';

class PlanTrabajoAnualService {
  // ---- Planes ----
  async listarPlanes(params?: { año?: number; empresa_id?: number; estado?: EstadoPlan }): Promise<PlanTrabajoAnual[]> {
    const response = await api.get(BASE_URL + '/', { params });
    return response.data;
  }

  async crearPlan(data: PlanTrabajoAnualCreate): Promise<PlanTrabajoAnual> {
    const response = await api.post(BASE_URL + '/', data);
    return response.data;
  }

  async crearDesdePlantilla(
    año: number,
    empresa_id?: number,
    encargado_sgsst?: string
  ): Promise<PlanTrabajoAnualDetail> {
    const response = await api.post(BASE_URL + '/crear-desde-plantilla', null, {
      params: { año, empresa_id, encargado_sgsst },
    });
    return response.data;
  }

  async obtenerPlan(planId: number): Promise<PlanTrabajoAnualDetail> {
    const response = await api.get(`${BASE_URL}/${planId}`);
    return response.data;
  }

  async actualizarPlan(planId: number, data: Partial<PlanTrabajoAnualCreate>): Promise<PlanTrabajoAnual> {
    const response = await api.put(`${BASE_URL}/${planId}`, data);
    return response.data;
  }

  async eliminarPlan(planId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${planId}`);
  }

  // ---- Actividades ----
  async listarActividades(planId: number, filtros?: { ciclo?: CicloPhva; categoria?: CategoriaActividad }): Promise<PlanTrabajoActividad[]> {
    const response = await api.get(`${BASE_URL}/${planId}/actividades`, { params: filtros });
    return response.data;
  }

  async actualizarActividad(actividadId: number, data: ActividadUpdate): Promise<PlanTrabajoActividad> {
    const response = await api.put(`${BASE_URL}/actividades/${actividadId}`, data);
    return response.data;
  }

  async eliminarActividad(actividadId: number): Promise<void> {
    await api.delete(`${BASE_URL}/actividades/${actividadId}`);
  }

  // ---- Seguimiento mensual (P/E) ----
  async actualizarSeguimiento(
    actividadId: number,
    mes: number,
    data: SeguimientoUpdate
  ): Promise<PlanTrabajoSeguimiento> {
    const response = await api.put(`${BASE_URL}/actividades/${actividadId}/seguimiento/${mes}`, data);
    return response.data;
  }

  // ---- Dashboard ----
  async obtenerDashboard(planId: number): Promise<DashboardIndicadores> {
    const response = await api.get(`${BASE_URL}/${planId}/dashboard`);
    return response.data;
  }

  // ---- Exportar ----
  async exportarExcel(planId: number, año: number): Promise<void> {
    const response = await api.get(`${BASE_URL}/${planId}/exportar/excel`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan_trabajo_anual_${año}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async exportarPdf(planId: number, año: number): Promise<void> {
    const response = await api.get(`${BASE_URL}/${planId}/exportar/pdf`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan_trabajo_anual_${año}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const planTrabajoAnualService = new PlanTrabajoAnualService();
