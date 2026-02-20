import api from './api';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export type CicloPhvaCAP = 'I_PLANEAR' | 'II_HACER' | 'III_VERIFICAR' | 'IV_ACTUAR';
export type TipoIndicador = 'CUMPLIMIENTO' | 'COBERTURA' | 'EFICACIA';
export type EstadoPrograma = 'borrador' | 'aprobado' | 'en_ejecucion' | 'finalizado';

export interface CapacitacionSeguimiento {
  id: number;
  actividad_id: number;
  mes: number;
  programada: boolean;
  ejecutada: boolean;
  observacion?: string;
  fecha_ejecucion?: string;
  ejecutado_por?: string;
  trabajadores_programados: number;
  trabajadores_participaron: number;
  personas_evaluadas: number;
  evaluaciones_eficaces: number;
  created_at: string;
  updated_at: string;
}

export interface CapacitacionActividad {
  id: number;
  programa_id: number;
  ciclo: CicloPhvaCAP;
  nombre: string;
  encargado?: string;
  recursos?: string;
  horas?: number;
  orden: number;
  seguimientos: CapacitacionSeguimiento[];
  created_at: string;
  updated_at: string;
}

export interface ProgramaCapacitaciones {
  id: number;
  año: number;
  empresa_id?: number;
  codigo: string;
  version: string;
  titulo: string;
  alcance?: string;
  objetivo?: string;
  recursos?: string;
  meta_cumplimiento: number;
  meta_cobertura: number;
  meta_eficacia: number;
  encargado_sgsst?: string;
  aprobado_por?: string;
  estado: EstadoPrograma;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramaCapacitacionesDetail extends ProgramaCapacitaciones {
  actividades: CapacitacionActividad[];
}

export interface IndicadorMensual {
  id: number;
  programa_id: number;
  tipo_indicador: TipoIndicador;
  mes: number;
  numerador: number;
  denominador: number;
  valor_porcentaje: number;
  meta?: number;
  analisis_trimestral?: string;
  created_at: string;
  updated_at: string;
}

export interface KpiMesData {
  mes: number;
  nombre_mes: string;
  valor: number;
  meta: number;
  numerador: number;
  denominador: number;
  cumple: boolean;
}

export interface KpiIndicador {
  tipo: TipoIndicador;
  nombre: string;
  formula: string;
  meta: number;
  frecuencia: string;
  meses: KpiMesData[];
  valor_global: number;
  cumple_global: boolean;
  analisis_t1?: string;
  analisis_t2?: string;
  analisis_t3?: string;
  analisis_t4?: string;
}

export interface DashboardCapacitaciones {
  programa_id: number;
  año: number;
  total_actividades: number;
  actividades_programadas: number;
  actividades_ejecutadas: number;
  porcentaje_cumplimiento: number;
  kpis: KpiIndicador[];
}

export interface SeguimientoUpdate {
  programada?: boolean;
  ejecutada?: boolean;
  observacion?: string;
  fecha_ejecucion?: string;
  ejecutado_por?: string;
  trabajadores_programados?: number;
  trabajadores_participaron?: number;
  personas_evaluadas?: number;
  evaluaciones_eficaces?: number;
}

export interface IndicadorUpdate {
  numerador?: number;
  denominador?: number;
  analisis_trimestral?: string;
}

export interface ActividadCreate {
  ciclo: CicloPhvaCAP;
  nombre: string;
  encargado?: string;
  recursos?: string;
  horas?: number;
  orden?: number;
}

// ── Constantes ─────────────────────────────────────────────────────────────────

export const CICLO_LABELS: Record<CicloPhvaCAP, string> = {
  I_PLANEAR: 'I. PLANEAR',
  II_HACER: 'II. HACER',
  III_VERIFICAR: 'III. VERIFICAR',
  IV_ACTUAR: 'IV. ACTUAR',
};

export const CICLO_COLORS: Record<CicloPhvaCAP, string> = {
  I_PLANEAR: '#1565C0',
  II_HACER: '#2E7D32',
  III_VERIFICAR: '#E65100',
  IV_ACTUAR: '#6A1B9A',
};

export const CICLO_LIGHT_COLORS: Record<CicloPhvaCAP, string> = {
  I_PLANEAR: '#BBDEFB',
  II_HACER: '#C8E6C9',
  III_VERIFICAR: '#FFE0B2',
  IV_ACTUAR: '#E1BEE7',
};

export const INDICADOR_LABELS: Record<TipoIndicador, string> = {
  CUMPLIMIENTO: 'Cumplimiento',
  COBERTURA: 'Cobertura',
  EFICACIA: 'Eficacia',
};

export const INDICADOR_FORMULAS: Record<TipoIndicador, string> = {
  CUMPLIMIENTO: 'Actividades ejecutadas / Actividades programadas × 100%',
  COBERTURA: 'Trabajadores participaron / Trabajadores programados × 100%',
  EFICACIA: 'Evaluaciones eficaces / Personas evaluadas × 100%',
};

export const INDICADOR_METAS: Record<TipoIndicador, number> = {
  CUMPLIMIENTO: 90,
  COBERTURA: 80,
  EFICACIA: 90,
};

export const INDICADOR_COLORS: Record<TipoIndicador, string> = {
  CUMPLIMIENTO: '#1565C0',
  COBERTURA: '#2E7D32',
  EFICACIA: '#E65100',
};

export const ESTADO_LABELS: Record<EstadoPrograma, string> = {
  borrador: 'Borrador',
  aprobado: 'Aprobado',
  en_ejecucion: 'En Ejecución',
  finalizado: 'Finalizado',
};

export const ESTADO_COLORS: Record<EstadoPrograma, 'default' | 'primary' | 'success' | 'info'> = {
  borrador: 'default',
  aprobado: 'primary',
  en_ejecucion: 'info',
  finalizado: 'success',
};

export const NOMBRE_MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const MESES_ABREV = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const CICLOS_ORDER: CicloPhvaCAP[] = [
  'I_PLANEAR',
  'II_HACER',
  'III_VERIFICAR',
  'IV_ACTUAR',
];

export const TIPOS_INDICADOR: TipoIndicador[] = ['CUMPLIMIENTO', 'COBERTURA', 'EFICACIA'];

const BASE = '/programa-capacitaciones';

// ── Servicio ───────────────────────────────────────────────────────────────────

class ProgramaCapacitacionesService {
  // Programa CRUD
  async listar(params?: { año?: number; empresa_id?: number; estado?: EstadoPrograma }): Promise<ProgramaCapacitaciones[]> {
    const r = await api.get(`${BASE}/`, { params });
    return r.data;
  }

  async crearDesdePlantilla(año: number, empresa_id?: number, encargado_sgsst?: string): Promise<ProgramaCapacitacionesDetail> {
    const r = await api.post(`${BASE}/crear-desde-plantilla`, null, {
      params: { año, empresa_id, encargado_sgsst },
    });
    return r.data;
  }

  async crear(data: Partial<ProgramaCapacitaciones>): Promise<ProgramaCapacitaciones> {
    const r = await api.post(`${BASE}/`, data);
    return r.data;
  }

  async obtener(id: number): Promise<ProgramaCapacitacionesDetail> {
    const r = await api.get(`${BASE}/${id}`);
    return r.data;
  }

  async actualizar(id: number, data: Partial<ProgramaCapacitaciones>): Promise<ProgramaCapacitaciones> {
    const r = await api.put(`${BASE}/${id}`, data);
    return r.data;
  }

  async eliminar(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  }

  // Actividades
  async crearActividad(programaId: number, data: ActividadCreate): Promise<CapacitacionActividad> {
    const r = await api.post(`${BASE}/${programaId}/actividades`, data);
    return r.data;
  }

  async actualizarActividad(actividadId: number, data: { nombre?: string; encargado?: string; horas?: number }): Promise<CapacitacionActividad> {
    const r = await api.put(`${BASE}/actividades/${actividadId}`, data);
    return r.data;
  }

  async eliminarActividad(actividadId: number): Promise<void> {
    await api.delete(`${BASE}/actividades/${actividadId}`);
  }

  // Seguimiento mensual
  async actualizarSeguimiento(actividadId: number, mes: number, data: SeguimientoUpdate): Promise<CapacitacionSeguimiento> {
    const r = await api.put(`${BASE}/actividades/${actividadId}/seguimiento/${mes}`, data);
    return r.data;
  }

  // Indicadores KPI
  async obtenerIndicadores(id: number, tipo?: TipoIndicador): Promise<IndicadorMensual[]> {
    const r = await api.get(`${BASE}/${id}/indicadores`, { params: tipo ? { tipo_indicador: tipo } : undefined });
    return r.data;
  }

  async actualizarIndicador(id: number, tipo: TipoIndicador, mes: number, data: IndicadorUpdate): Promise<IndicadorMensual> {
    const r = await api.put(`${BASE}/${id}/indicadores/${tipo}/${mes}`, data);
    return r.data;
  }

  // Dashboard
  async obtenerDashboard(id: number): Promise<DashboardCapacitaciones> {
    const r = await api.get(`${BASE}/${id}/dashboard`);
    return r.data;
  }

  // Exports
  async exportarExcel(id: number, año: number): Promise<void> {
    const r = await api.get(`${BASE}/${id}/exportar/excel`, { responseType: 'blob' });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `programa_capacitaciones_${año}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportarPdf(id: number, año: number): Promise<void> {
    const r = await api.get(`${BASE}/${id}/exportar/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `programa_capacitaciones_${año}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const programaCapacitacionesService = new ProgramaCapacitacionesService();
