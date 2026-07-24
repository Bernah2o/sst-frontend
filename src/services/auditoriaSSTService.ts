import api from './api';

export type TipoAuditoria = 'interna' | 'seguimiento' | 'externa';
export type EstadoAuditoria = 'planificada' | 'en_ejecucion' | 'finalizada';
export type ResultadoItemAuditoria = 'pendiente' | 'conforme' | 'no_conforme' | 'no_aplica';
export type EstadoPlanMejora = 'abierto' | 'en_proceso' | 'cerrado' | 'vencido';

export const TIPO_AUDITORIA_LABELS: Record<TipoAuditoria, string> = {
  interna: 'Interna',
  seguimiento: 'Seguimiento',
  externa: 'Externa',
};

export const ESTADO_AUDITORIA_LABELS: Record<EstadoAuditoria, string> = {
  planificada: 'Planificada',
  en_ejecucion: 'En Ejecución',
  finalizada: 'Finalizada',
};

export const ESTADO_AUDITORIA_COLORS: Record<EstadoAuditoria, 'default' | 'warning' | 'success' | 'info'> = {
  planificada: 'default',
  en_ejecucion: 'warning',
  finalizada: 'success',
};

export const RESULTADO_ITEM_LABELS: Record<ResultadoItemAuditoria, string> = {
  pendiente: 'Pendiente',
  conforme: 'Conforme',
  no_conforme: 'No Conforme',
  no_aplica: 'No Aplica',
};

export const RESULTADO_ITEM_COLORS: Record<ResultadoItemAuditoria, 'default' | 'error' | 'success' | 'info'> = {
  pendiente: 'default',
  conforme: 'success',
  no_conforme: 'error',
  no_aplica: 'info',
};

export const ESTADO_PLAN_LABELS: Record<EstadoPlanMejora, string> = {
  abierto: 'Abierto',
  en_proceso: 'En Proceso',
  cerrado: 'Cerrado',
  vencido: 'Vencido',
};

export const ESTADO_PLAN_COLORS: Record<EstadoPlanMejora, 'warning' | 'info' | 'success' | 'error'> = {
  abierto: 'warning',
  en_proceso: 'info',
  cerrado: 'success',
  vencido: 'error',
};

export interface PlanMejoramiento {
  id: number;
  item_id: number;
  hallazgo: string;
  accion_correctiva?: string;
  responsable?: string;
  fecha_compromiso?: string;
  fecha_cierre?: string;
  estado: EstadoPlanMejora;
  evidencia_cierre_file_key?: string;
  evidencia_cierre_nombre?: string;
  observaciones_cierre?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanMejoramientoCreate {
  hallazgo: string;
  accion_correctiva?: string;
  responsable?: string;
  fecha_compromiso?: string;
  fecha_cierre?: string;
  estado?: EstadoPlanMejora;
  observaciones_cierre?: string;
}

export interface PlanMejoramientoUpdate {
  hallazgo?: string;
  accion_correctiva?: string;
  responsable?: string;
  fecha_compromiso?: string;
  fecha_cierre?: string;
  estado?: EstadoPlanMejora;
  observaciones_cierre?: string;
}

export interface ItemAuditoria {
  id: number;
  auditoria_id: number;
  numeral: string;
  descripcion: string;
  resultado: ResultadoItemAuditoria;
  observaciones?: string;
  evidencia_file_key?: string;
  evidencia_nombre?: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface ItemAuditoriaDetail extends ItemAuditoria {
  planes_mejoramiento: PlanMejoramiento[];
}

export interface ItemAuditoriaUpdate {
  descripcion?: string;
  resultado?: ResultadoItemAuditoria;
  observaciones?: string;
}

export interface AuditoriaSST {
  id: number;
  año: number;
  empresa_id?: number;
  fecha_auditoria: string;
  tipo_auditoria: TipoAuditoria;
  codigo: string;
  alcance?: string;
  objetivo?: string;
  auditor_lider?: string;
  equipo_auditor?: string;
  participantes_copasst?: string;
  estado: EstadoAuditoria;
  conclusiones_generales?: string;
  fecha_proxima_auditoria?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface AuditoriaSSTDetail extends AuditoriaSST {
  items: ItemAuditoriaDetail[];
}

export interface AuditoriaSSTCreate {
  año: number;
  empresa_id?: number;
  fecha_auditoria: string;
  tipo_auditoria?: TipoAuditoria;
  codigo?: string;
  alcance?: string;
  objetivo?: string;
  auditor_lider?: string;
  equipo_auditor?: string;
  participantes_copasst?: string;
  estado?: EstadoAuditoria;
  conclusiones_generales?: string;
  fecha_proxima_auditoria?: string;
}

export interface AuditoriaSSTUpdate {
  año?: number;
  fecha_auditoria?: string;
  tipo_auditoria?: TipoAuditoria;
  codigo?: string;
  alcance?: string;
  objetivo?: string;
  auditor_lider?: string;
  equipo_auditor?: string;
  participantes_copasst?: string;
  estado?: EstadoAuditoria;
  conclusiones_generales?: string;
  fecha_proxima_auditoria?: string;
}

export interface IndicadoresAuditoria {
  total_items: number;
  items_conformes: number;
  items_no_conformes: number;
  items_no_aplica: number;
  items_pendientes: number;
  pct_cumplimiento: number;
  total_hallazgos: number;
  hallazgos_abiertos: number;
  hallazgos_cerrados: number;
  hallazgos_vencidos: number;
  pct_cierre_hallazgos: number;
}

export interface EvidenciaResponse {
  url: string;
  nombre_archivo?: string;
  mensaje: string;
}

const BASE_URL = '/auditoria-sst';

class AuditoriaSSTService {
  async listar(params?: { año?: number; empresa_id?: number; tipo_auditoria?: TipoAuditoria; estado?: EstadoAuditoria }): Promise<AuditoriaSST[]> {
    const response = await api.get(BASE_URL + '/', { params });
    return response.data;
  }

  async crear(data: AuditoriaSSTCreate): Promise<AuditoriaSST> {
    const response = await api.post(BASE_URL + '/', data);
    return response.data;
  }

  async obtener(auditoriaId: number): Promise<AuditoriaSSTDetail> {
    const response = await api.get(`${BASE_URL}/${auditoriaId}`);
    return response.data;
  }

  async actualizar(auditoriaId: number, data: AuditoriaSSTUpdate): Promise<AuditoriaSST> {
    const response = await api.put(`${BASE_URL}/${auditoriaId}`, data);
    return response.data;
  }

  async eliminar(auditoriaId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${auditoriaId}`);
  }

  async listarItems(auditoriaId: number): Promise<ItemAuditoria[]> {
    const response = await api.get(`${BASE_URL}/${auditoriaId}/items`);
    return response.data;
  }

  async actualizarItem(itemId: number, data: ItemAuditoriaUpdate): Promise<ItemAuditoria> {
    const response = await api.put(`${BASE_URL}/items/${itemId}`, data);
    return response.data;
  }

  async subirEvidenciaItem(itemId: number, file: File): Promise<EvidenciaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`${BASE_URL}/items/${itemId}/evidencia`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async eliminarEvidenciaItem(itemId: number): Promise<void> {
    await api.delete(`${BASE_URL}/items/${itemId}/evidencia`);
  }

  async listarPlanes(itemId: number): Promise<PlanMejoramiento[]> {
    const response = await api.get(`${BASE_URL}/items/${itemId}/planes`);
    return response.data;
  }

  async crearPlan(itemId: number, data: PlanMejoramientoCreate): Promise<PlanMejoramiento> {
    const response = await api.post(`${BASE_URL}/items/${itemId}/planes`, data);
    return response.data;
  }

  async actualizarPlan(planId: number, data: PlanMejoramientoUpdate): Promise<PlanMejoramiento> {
    const response = await api.put(`${BASE_URL}/planes/${planId}`, data);
    return response.data;
  }

  async eliminarPlan(planId: number): Promise<void> {
    await api.delete(`${BASE_URL}/planes/${planId}`);
  }

  async subirEvidenciaCierre(planId: number, file: File): Promise<EvidenciaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`${BASE_URL}/planes/${planId}/evidencia`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async eliminarEvidenciaCierre(planId: number): Promise<void> {
    await api.delete(`${BASE_URL}/planes/${planId}/evidencia`);
  }

  async obtenerIndicadores(auditoriaId: number): Promise<IndicadoresAuditoria> {
    const response = await api.get(`${BASE_URL}/${auditoriaId}/indicadores`);
    return response.data;
  }
}

export const auditoriaSSTService = new AuditoriaSSTService();
