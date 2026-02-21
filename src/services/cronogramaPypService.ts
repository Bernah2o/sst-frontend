import api from './api';

// ---- Types ----

export interface CronogramaPypSeguimiento {
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

export interface CronogramaPypActividad {
  id: number;
  cronograma_id: number;
  actividad: string;
  poblacion_objetivo?: string;
  responsable?: string;
  indicador?: string;
  recursos?: string;
  observaciones?: string;
  orden: number;
  seguimientos_mensuales: CronogramaPypSeguimiento[];
  created_at: string;
  updated_at: string;
}

export interface CronogramaPyp {
  id: number;
  plan_trabajo_anual_id: number;
  año: number;
  empresa_id?: number;
  codigo: string;
  version: string;
  objetivo?: string;
  alcance?: string;
  encargado_sgsst?: string;
  aprobado_por?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CronogramaPypDetail extends CronogramaPyp {
  actividades: CronogramaPypActividad[];
}

export interface CronogramaPypCreate {
  codigo?: string;
  version?: string;
  objetivo?: string;
  alcance?: string;
  encargado_sgsst?: string;
  aprobado_por?: string;
}

export interface CronogramaPypUpdate {
  codigo?: string;
  version?: string;
  objetivo?: string;
  alcance?: string;
  encargado_sgsst?: string;
  aprobado_por?: string;
}

export interface CronogramaPypActividadCreate {
  actividad: string;
  poblacion_objetivo?: string;
  responsable?: string;
  indicador?: string;
  recursos?: string;
  observaciones?: string;
  orden?: number;
}

export interface CronogramaPypActividadUpdate {
  actividad?: string;
  poblacion_objetivo?: string;
  responsable?: string;
  indicador?: string;
  recursos?: string;
  observaciones?: string;
  orden?: number;
}

export interface CronogramaPypSeguimientoUpdate {
  programada?: boolean;
  ejecutada?: boolean;
  observacion?: string;
  fecha_ejecucion?: string;
  ejecutado_por?: string;
}

const BASE = '/plan-trabajo-anual';

class CronogramaPypService {
  // ---- Cronograma principal ----
  async obtenerCronograma(planId: number): Promise<CronogramaPypDetail> {
    const res = await api.get(`${BASE}/${planId}/cronograma-pyp`);
    return res.data;
  }

  async crearCronograma(planId: number, data: CronogramaPypCreate): Promise<CronogramaPyp> {
    const res = await api.post(`${BASE}/${planId}/cronograma-pyp`, data);
    return res.data;
  }

  async actualizarCronograma(planId: number, data: CronogramaPypUpdate): Promise<CronogramaPyp> {
    const res = await api.put(`${BASE}/${planId}/cronograma-pyp`, data);
    return res.data;
  }

  async eliminarCronograma(planId: number): Promise<void> {
    await api.delete(`${BASE}/${planId}/cronograma-pyp`);
  }

  // ---- Actividades ----
  async listarActividades(planId: number): Promise<CronogramaPypActividad[]> {
    const res = await api.get(`${BASE}/${planId}/cronograma-pyp/actividades`);
    return res.data;
  }

  async crearActividad(planId: number, data: CronogramaPypActividadCreate): Promise<CronogramaPypActividad> {
    const res = await api.post(`${BASE}/${planId}/cronograma-pyp/actividades`, data);
    return res.data;
  }

  async actualizarActividad(
    planId: number,
    actividadId: number,
    data: CronogramaPypActividadUpdate
  ): Promise<CronogramaPypActividad> {
    const res = await api.put(`${BASE}/${planId}/cronograma-pyp/actividades/${actividadId}`, data);
    return res.data;
  }

  async eliminarActividad(planId: number, actividadId: number): Promise<void> {
    await api.delete(`${BASE}/${planId}/cronograma-pyp/actividades/${actividadId}`);
  }

  // ---- Seguimiento mensual ----
  async actualizarSeguimiento(
    planId: number,
    actividadId: number,
    mes: number,
    data: CronogramaPypSeguimientoUpdate
  ): Promise<CronogramaPypSeguimiento> {
    const res = await api.put(
      `${BASE}/${planId}/cronograma-pyp/actividades/${actividadId}/seguimiento/${mes}`,
      data
    );
    return res.data;
  }

  // ---- Exportar PDF ----
  async exportarPdf(planId: number, año: number): Promise<void> {
    const res = await api.get(`${BASE}/${planId}/cronograma-pyp/exportar/pdf`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cronograma_pyp_${año}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const cronogramaPypService = new CronogramaPypService();
