import api from './api';

export type EstadoPrograma = 'borrador' | 'activo' | 'finalizado';
export type CicloInspeccion = 'planear' | 'hacer' | 'verificar' | 'actuar';
export type TipoInspeccion =
  | 'locativa' | 'equipos' | 'herramientas' | 'epp' | 'extintores'
  | 'primeros_auxilios' | 'orden_aseo' | 'electrica' | 'emergencias'
  | 'quimicos' | 'vehiculos' | 'botiquin' | 'general';
export type FrecuenciaInspeccion = 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';

export const CICLO_LABELS: Record<CicloInspeccion, string> = {
  planear: 'I. PLANEAR',
  hacer: 'II. HACER',
  verificar: 'III. VERIFICAR',
  actuar: 'IV. ACTUAR',
};

export const CICLO_COLORS: Record<CicloInspeccion, string> = {
  planear: '#1565C0',
  hacer: '#2E7D32',
  verificar: '#E65100',
  actuar: '#6A1B9A',
};

export const CICLO_LIGHT: Record<CicloInspeccion, string> = {
  planear: '#BBDEFB',
  hacer: '#C8E6C9',
  verificar: '#FFE0B2',
  actuar: '#E1BEE7',
};

export const CICLOS_ORDER: CicloInspeccion[] = ['planear', 'hacer', 'verificar', 'actuar'];

export const TIPO_INSPECCION_LABELS: Record<TipoInspeccion, string> = {
  locativa: 'Locativa',
  equipos: 'Equipos',
  herramientas: 'Herramientas',
  epp: 'EPP',
  extintores: 'Extintores',
  primeros_auxilios: 'Primeros Auxilios',
  orden_aseo: 'Orden y Aseo',
  electrica: 'Eléctrica',
  emergencias: 'Emergencias',
  quimicos: 'Productos Químicos',
  vehiculos: 'Vehículos',
  botiquin: 'Botiquín',
  general: 'General',
};

export const FRECUENCIA_LABELS: Record<FrecuenciaInspeccion, string> = {
  mensual: 'Mensual',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

export const ESTADO_LABELS: Record<EstadoPrograma, string> = {
  borrador: 'Borrador',
  activo: 'Activo',
  finalizado: 'Finalizado',
};

export const ESTADO_COLORS: Record<EstadoPrograma, 'default' | 'warning' | 'success' | 'info'> = {
  borrador: 'default',
  activo: 'success',
  finalizado: 'info',
};

export interface InspeccionSeguimiento {
  id: number;
  inspeccion_id: number;
  mes: number;
  programada: boolean;
  ejecutada: boolean;
  condiciones_peligrosas_reportadas: number;
  condiciones_peligrosas_intervenidas: number;
  fecha_ejecucion?: string;
  ejecutado_por?: string;
  hallazgos?: string;
  accion_correctiva?: string;
  observacion?: string;
  created_at: string;
  updated_at: string;
}

export interface InspeccionProgramada {
  id: number;
  programa_id: number;
  ciclo: CicloInspeccion;
  tipo_inspeccion: TipoInspeccion;
  area: string;
  descripcion: string;
  responsable?: string;
  frecuencia: FrecuenciaInspeccion;
  lista_chequeo?: string;
  observaciones?: string;
  orden: number;
  seguimientos: InspeccionSeguimiento[];
  created_at: string;
  updated_at: string;
}

export interface ProgramaInspecciones {
  id: number;
  año: number;
  empresa_id?: number;
  codigo: string;
  version: string;
  objetivo?: string;
  alcance?: string;
  recursos?: string;
  legislacion_aplicable?: string;
  encargado_sgsst?: string;
  aprobado_por?: string;
  estado: EstadoPrograma;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramaInspeccionesDetail extends ProgramaInspecciones {
  inspecciones: InspeccionProgramada[];
}

export interface ProgramaInspeccionesCreate {
  año: number;
  empresa_id?: number;
  codigo?: string;
  version?: string;
  objetivo?: string;
  alcance?: string;
  recursos?: string;
  legislacion_aplicable?: string;
  encargado_sgsst?: string;
  aprobado_por?: string;
  estado?: EstadoPrograma;
}

export interface InspeccionProgramadaCreate {
  ciclo: CicloInspeccion;
  tipo_inspeccion: TipoInspeccion;
  area: string;
  descripcion: string;
  responsable?: string;
  frecuencia?: FrecuenciaInspeccion;
  lista_chequeo?: string;
  observaciones?: string;
  orden?: number;
}

export interface InspeccionProgramadaUpdate {
  ciclo?: CicloInspeccion;
  tipo_inspeccion?: TipoInspeccion;
  area?: string;
  descripcion?: string;
  responsable?: string;
  frecuencia?: FrecuenciaInspeccion;
  lista_chequeo?: string;
  observaciones?: string;
  orden?: number;
}

export interface InspeccionSeguimientoUpdate {
  programada?: boolean;
  ejecutada?: boolean;
  condiciones_peligrosas_reportadas?: number;
  condiciones_peligrosas_intervenidas?: number;
  fecha_ejecucion?: string;
  ejecutado_por?: string;
  hallazgos?: string;
  accion_correctiva?: string;
  observacion?: string;
}

export interface IndicadorMes {
  mes: number;
  nombre_mes: string;
  programadas: number;
  ejecutadas: number;
  pct_cumplimiento: number;
  condiciones_reportadas: number;
  condiciones_intervenidas: number;
  pct_eficacia: number;
}

export interface IndicadoresPrograma {
  total_programadas: number;
  total_ejecutadas: number;
  pct_cumplimiento_global: number;
  total_condiciones_reportadas: number;
  total_condiciones_intervenidas: number;
  pct_eficacia_global: number;
  meses: IndicadorMes[];
}

const BASE_URL = '/programa-inspecciones';

class ProgramaInspeccionesService {
  async listarProgramas(params?: { año?: number; empresa_id?: number; estado?: EstadoPrograma }): Promise<ProgramaInspecciones[]> {
    const response = await api.get(BASE_URL + '/', { params });
    return response.data;
  }

  async crearPrograma(data: ProgramaInspeccionesCreate): Promise<ProgramaInspecciones> {
    const response = await api.post(BASE_URL + '/', data);
    return response.data;
  }

  async obtenerPrograma(programaId: number): Promise<ProgramaInspeccionesDetail> {
    const response = await api.get(`${BASE_URL}/${programaId}`);
    return response.data;
  }

  async actualizarPrograma(programaId: number, data: Partial<ProgramaInspeccionesCreate>): Promise<ProgramaInspecciones> {
    const response = await api.put(`${BASE_URL}/${programaId}`, data);
    return response.data;
  }

  async eliminarPrograma(programaId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${programaId}`);
  }

  async crearInspeccion(programaId: number, data: InspeccionProgramadaCreate): Promise<InspeccionProgramada> {
    const response = await api.post(`${BASE_URL}/${programaId}/inspecciones`, data);
    return response.data;
  }

  async actualizarInspeccion(inspeccionId: number, data: InspeccionProgramadaUpdate): Promise<InspeccionProgramada> {
    const response = await api.put(`${BASE_URL}/inspecciones/${inspeccionId}`, data);
    return response.data;
  }

  async eliminarInspeccion(inspeccionId: number): Promise<void> {
    await api.delete(`${BASE_URL}/inspecciones/${inspeccionId}`);
  }

  async actualizarSeguimiento(
    inspeccionId: number,
    mes: number,
    data: InspeccionSeguimientoUpdate,
  ): Promise<InspeccionSeguimiento> {
    const response = await api.put(`${BASE_URL}/inspecciones/${inspeccionId}/seguimiento/${mes}`, data);
    return response.data;
  }

  async obtenerIndicadores(programaId: number): Promise<IndicadoresPrograma> {
    const response = await api.get(`${BASE_URL}/${programaId}/indicadores`);
    return response.data;
  }
}

export const programaInspeccionesService = new ProgramaInspeccionesService();
