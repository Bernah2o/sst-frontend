import api from './api';

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type GrupoEstandar = 'GRUPO_7' | 'GRUPO_21' | 'GRUPO_60';
export type NivelRiesgo = 'I' | 'II' | 'III' | 'IV' | 'V';
export type EstadoAutoevaluacion = 'borrador' | 'en_proceso' | 'finalizada';
export type NivelCumplimiento = 'critico' | 'moderadamente_aceptable' | 'aceptable';
export type CicloPHVA = 'PLANEAR' | 'HACER' | 'VERIFICAR' | 'ACTUAR';
export type ValorCumplimiento = 'cumple_totalmente' | 'no_cumple' | 'no_aplica';

export interface AutoevaluacionRespuesta {
  id: number;
  autoevaluacion_id: number;
  estandar_codigo: string;
  ciclo: CicloPHVA;
  descripcion: string;
  valor_maximo: number;
  valor_maximo_ajustado: number;
  cumplimiento: ValorCumplimiento;
  valor_obtenido: number;
  justificacion_no_aplica?: string;
  observaciones?: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface AutoevaluacionEstandares {
  id: number;
  año: number;
  empresa_id?: number;
  num_trabajadores: number;
  nivel_riesgo: NivelRiesgo;
  grupo: GrupoEstandar;
  estado: EstadoAutoevaluacion;
  puntaje_total: number;
  puntaje_planear: number;
  puntaje_hacer: number;
  puntaje_verificar: number;
  puntaje_actuar: number;
  nivel_cumplimiento?: NivelCumplimiento;
  encargado_sgsst?: string;
  observaciones_generales?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface AutoevaluacionEstandaresDetail extends AutoevaluacionEstandares {
  respuestas: AutoevaluacionRespuesta[];
}

export interface AutoevaluacionCreate {
  año: number;
  empresa_id?: number;
  num_trabajadores: number;
  nivel_riesgo: NivelRiesgo;
  encargado_sgsst?: string;
  observaciones_generales?: string;
}

export interface AutoevaluacionUpdate {
  estado?: EstadoAutoevaluacion;
  encargado_sgsst?: string;
  observaciones_generales?: string;
}

export interface RespuestaUpdate {
  cumplimiento: ValorCumplimiento;
  justificacion_no_aplica?: string;
  observaciones?: string;
}

export interface CicloResumen {
  ciclo: CicloPHVA;
  label: string;
  puntaje_maximo: number;
  puntaje_obtenido: number;
  porcentaje: number;
  total_estandares: number;
  cumplen: number;
  no_cumplen: number;
  no_aplican: number;
}

export interface DashboardEstandaresMinimos {
  autoevaluacion_id: number;
  año: number;
  grupo: GrupoEstandar;
  num_trabajadores: number;
  nivel_riesgo: NivelRiesgo;
  puntaje_total: number;
  nivel_cumplimiento?: NivelCumplimiento;
  ciclos: CicloResumen[];
  total_estandares: number;
  total_cumplen: number;
  total_no_cumplen: number;
  total_no_aplican: number;
  estandares_criticos: string[];
}

// ─── Helpers de presentación (usados también en las páginas) ───────────────

export const GRUPO_LABELS: Record<GrupoEstandar, string> = {
  GRUPO_7:  '7 Estándares (< 10 trabajadores, Riesgo I-III)',
  GRUPO_21: '21 Estándares (11-50 trabajadores, Riesgo I-III)',
  GRUPO_60: '60 Estándares (> 50 trabajadores o Riesgo IV-V)',
};

export const GRUPO_SHORT_LABELS: Record<GrupoEstandar, string> = {
  GRUPO_7:  '7 Estándares',
  GRUPO_21: '21 Estándares',
  GRUPO_60: '60 Estándares',
};

export const ESTADO_LABELS: Record<EstadoAutoevaluacion, string> = {
  borrador:   'Borrador',
  en_proceso: 'En Proceso',
  finalizada: 'Finalizada',
};

export const NIVEL_LABELS: Record<NivelCumplimiento, string> = {
  critico:                 'Crítico (< 60%)',
  moderadamente_aceptable: 'Moderadamente Aceptable (60-85%)',
  aceptable:               'Aceptable (> 85%)',
};

export const NIVEL_COLORS: Record<NivelCumplimiento, 'error' | 'warning' | 'success'> = {
  critico:                 'error',
  moderadamente_aceptable: 'warning',
  aceptable:               'success',
};

export const CICLO_COLORS: Record<CicloPHVA, string> = {
  PLANEAR:   '#1976d2',
  HACER:     '#388e3c',
  VERIFICAR: '#f57c00',
  ACTUAR:    '#7b1fa2',
};

/** Lógica de determinación de grupo (espejo del servidor, para preview en UI) */
export function determinarGrupo(numTrabajadores: number, nivelRiesgo: NivelRiesgo): GrupoEstandar {
  if (nivelRiesgo === 'IV' || nivelRiesgo === 'V') return 'GRUPO_60';
  if (numTrabajadores <= 10) return 'GRUPO_7';
  if (numTrabajadores <= 50) return 'GRUPO_21';
  return 'GRUPO_60';
}

// ─── Servicio ──────────────────────────────────────────────────────────────

const BASE = '/estandares-minimos';

class EstandaresMinimosService {
  async listar(params?: {
    año?: number;
    empresa_id?: number;
    estado?: EstadoAutoevaluacion;
    grupo?: GrupoEstandar;
  }): Promise<AutoevaluacionEstandares[]> {
    const response = await api.get(`${BASE}/`, { params });
    return response.data;
  }

  async crear(data: AutoevaluacionCreate): Promise<AutoevaluacionEstandaresDetail> {
    const response = await api.post(`${BASE}/`, data);
    return response.data;
  }

  async obtener(evalId: number): Promise<AutoevaluacionEstandaresDetail> {
    const response = await api.get(`${BASE}/${evalId}`);
    return response.data;
  }

  async actualizar(evalId: number, data: AutoevaluacionUpdate): Promise<AutoevaluacionEstandares> {
    const response = await api.put(`${BASE}/${evalId}`, data);
    return response.data;
  }

  async eliminar(evalId: number): Promise<void> {
    await api.delete(`${BASE}/${evalId}`);
  }

  async actualizarRespuesta(
    evalId: number,
    respuestaId: number,
    data: RespuestaUpdate
  ): Promise<AutoevaluacionRespuesta> {
    const response = await api.put(`${BASE}/${evalId}/respuestas/${respuestaId}`, data);
    return response.data;
  }

  async obtenerDashboard(evalId: number): Promise<DashboardEstandaresMinimos> {
    const response = await api.get(`${BASE}/${evalId}/dashboard`);
    return response.data;
  }
}

export const estandaresMinimosService = new EstandaresMinimosService();
