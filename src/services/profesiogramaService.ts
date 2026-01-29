import api from "./api";

export interface ProfesiogramaEmoSuggestion {
  cargo_id: number;
  periodicidad_sugerida: number;
  periodicidad_borrador?: number;
  numero_trabajadores_expuestos: number;
  menores_21: number;
  antiguedad_menor_2_anios: number;
  sin_fecha_ingreso: number;
  justificacion_periodicidad_emo_borrador: string;
}
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}
export interface FactorRiesgo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  activo: boolean;
  nivel_accion?: string;
  unidad_medida?: string;
  simbolo_unidad?: string;
  instrumento_medida?: string;
}

export interface TipoExamen {
  id: number;
  nombre: string;
  descripcion?: string;
  periodicidad_sugerida_meses?: number;
  activo: boolean;
}

export interface CriterioExclusion {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

// Interfaces para las relaciones (Association Objects)
export interface ProfesiogramaFactor {
  factor_riesgo: FactorRiesgo;
  nivel_exposicion: "bajo" | "medio" | "alto" | "muy_alto";
  tiempo_exposicion_horas: number;
  valor_medido?: number;
  valor_limite_permisible?: number;
  unidad_medida?: string;
  proceso?: string;
  actividad?: string;
  tarea?: string;
  rutinario?: boolean;
  descripcion_peligro?: string;
  efectos_posibles?: string;
  nd?: number;
  ne?: number;
  nc?: number;
  np?: number;
  nr?: number;
  nivel_intervencion?: string;
  aceptabilidad?: string;
  eliminacion?: string;
  sustitucion?: string;
  controles_ingenieria?: string;
  controles_administrativos?: string;
  senalizacion?: string;
  epp_requerido?: string;
}

export interface ProfesiogramaExamen {
  tipo_examen: TipoExamen;
  tipo_evaluacion:
    | "ingreso"
    | "periodico"
    | "retiro"
    | "cambio_cargo"
    | "post_incapacidad"
    | "reincorporacion";
  periodicidad_meses?: number;
  obligatorio: boolean;
  orden_realizacion?: number;
  normativa_base?: string;
}

export interface ProfesiogramaInmunizacion {
  id: number;
  profesiograma_id?: number;
  inmunizacion_id: number;
  inmunizacion?: Inmunizacion;
}

export interface Inmunizacion {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Profesiograma {
  id: number;
  cargo_id: number;
  version: string;
  estado: string;
  fecha_ultima_revision: string;
  posicion_predominante?: string;
  periodicidad_emo_meses?: number;
  justificacion_periodicidad_emo?: string;

  // Cambiamos de listas simples a objetos detallados
  profesiograma_factores: ProfesiogramaFactor[];
  examenes: ProfesiogramaExamen[];
  criterios_exclusion: CriterioExclusion[];
  inmunizaciones: ProfesiogramaInmunizacion[];

  descripcion_actividades: string;
  nivel_riesgo_cargo: string;
  observaciones?: string;
  activo: boolean;
}

export interface ProfesiogramaFactorCreate {
  factor_riesgo_id: number;
  nivel_exposicion: "bajo" | "medio" | "alto" | "muy_alto";
  tiempo_exposicion_horas: number;
  valor_medido?: number;
  valor_limite_permisible?: number;
  unidad_medida?: string;
  proceso?: string;
  actividad?: string;
  tarea?: string;
  rutinario?: boolean;
  descripcion_peligro?: string;
  efectos_posibles?: string;
  nd?: number;
  ne?: number;
  nc?: number;
  eliminacion?: string;
  sustitucion?: string;
  controles_ingenieria?: string;
  controles_administrativos?: string;
  senalizacion?: string;
  epp_requerido?: string;
}

export interface ProfesiogramaExamenCreate {
  tipo_examen_id: number;
  tipo_evaluacion:
    | "ingreso"
    | "periodico"
    | "retiro"
    | "cambio_cargo"
    | "post_incapacidad"
    | "reincorporacion";
  periodicidad_meses?: number;
  obligatorio: boolean;
  orden_realizacion?: number;
  normativa_base?: string;
}

export interface ProfesiogramaInmunizacionCreate {
  inmunizacion_id: number;
}

export interface ProfesiogramaCreate {
  cargo_id: number;
  version?: string;
  estado?: string;
  posicion_predominante: string;
  descripcion_actividades: string;
  periodicidad_emo_meses: number;
  justificacion_periodicidad_emo?: string;
  fecha_ultima_revision: string;
  nivel_riesgo_cargo: string;
  factores: ProfesiogramaFactorCreate[];
  examenes: ProfesiogramaExamenCreate[];
  criterios_exclusion_ids: number[];
  inmunizaciones: ProfesiogramaInmunizacionCreate[];
  observaciones?: string;
}

export interface ProfesiogramaDuplicateRequest {
  cargo_ids: number[];
  estado?: "activo" | "inactivo" | "borrador";
}

export interface ProfesiogramaDuplicateResult {
  cargo_id: number;
  cargo_nombre: string;
  profesiograma_id: number;
  version: string;
  success: boolean;
  message: string;
}

// Admin interfaces
export interface ProfesiogramaAdminItem {
  id: number;
  cargo_id: number;
  cargo_nombre: string;
  version: string;
  estado: "activo" | "inactivo" | "borrador";
  fecha_creacion: string | null;
  fecha_ultima_revision: string | null;
  nivel_riesgo_cargo: string | null;
  trabajadores_count: number;
  factores_count: number;
}

export interface ProfesiogramaAdminListResponse {
  items: ProfesiogramaAdminItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ProfesiogramaBulkResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{ id: number; success: boolean; message: string }>;
}

export interface ProfesiogramaStats {
  total: number;
  por_estado: {
    activo: number;
    inactivo: number;
    borrador: number;
  };
  cargos: {
    total: number;
    con_profesiograma_activo: number;
    sin_profesiograma_activo: number;
  };
}

class ProfesiogramaService {
  // --- Factores de Riesgo ---
  async listFactoresRiesgo(params?: { activo?: boolean; q?: string }) {
    const res = await api.get("/profesiogramas/catalogos/factores-riesgo", {
      params,
    });
    return res.data as FactorRiesgo[];
  }

  async createFactorRiesgo(data: Partial<FactorRiesgo>) {
    const res = await api.post(
      "/profesiogramas/catalogos/factores-riesgo",
      data,
    );
    return res.data as FactorRiesgo;
  }

  async updateFactorRiesgo(id: number, data: Partial<FactorRiesgo>) {
    const res = await api.put(
      `/profesiogramas/catalogos/factores-riesgo/${id}`,
      data,
    );
    return res.data as FactorRiesgo;
  }

  async deleteFactorRiesgo(id: number) {
    const res = await api.delete(
      `/profesiogramas/catalogos/factores-riesgo/${id}`,
    );
    return res.data;
  }

  // --- Tipos de Examen ---
  async listTiposExamen(params?: { activo?: boolean; q?: string }) {
    const res = await api.get("/profesiogramas/catalogos/tipos-examen", {
      params,
    });
    return res.data as TipoExamen[];
  }

  async createTipoExamen(data: Partial<TipoExamen>) {
    const res = await api.post("/profesiogramas/catalogos/tipos-examen", data);
    return res.data as TipoExamen;
  }

  async updateTipoExamen(id: number, data: Partial<TipoExamen>) {
    const res = await api.put(
      `/profesiogramas/catalogos/tipos-examen/${id}`,
      data,
    );
    return res.data as TipoExamen;
  }

  async deleteTipoExamen(id: number) {
    const res = await api.delete(
      `/profesiogramas/catalogos/tipos-examen/${id}`,
    );
    return res.data;
  }

  // --- Criterios de Exclusión ---
  async listCriteriosExclusion(params?: { activo?: boolean; q?: string }) {
    const res = await api.get("/profesiogramas/catalogos/criterios-exclusion", {
      params,
    });
    return res.data as CriterioExclusion[];
  }

  async createCriterioExclusion(data: Partial<CriterioExclusion>) {
    const res = await api.post(
      "/profesiogramas/catalogos/criterios-exclusion",
      data,
    );
    return res.data as CriterioExclusion;
  }

  async updateCriterioExclusion(id: number, data: Partial<CriterioExclusion>) {
    const res = await api.put(
      `/profesiogramas/catalogos/criterios-exclusion/${id}`,
      data,
    );
    return res.data as CriterioExclusion;
  }

  async deleteCriterioExclusion(id: number) {
    const res = await api.delete(
      `/profesiogramas/catalogos/criterios-exclusion/${id}`,
    );
    return res.data;
  }

  // --- Inmunizaciones ---
  async listInmunizaciones(params?: { activo?: boolean; q?: string }) {
    const res = await api.get("/profesiogramas/catalogos/inmunizaciones", {
      params,
    });
    return res.data as Inmunizacion[];
  }

  async createInmunizacion(data: Partial<Inmunizacion>) {
    const res = await api.post(
      "/profesiogramas/catalogos/inmunizaciones",
      data,
    );
    return res.data as Inmunizacion;
  }

  async updateInmunizacion(id: number, data: Partial<Inmunizacion>) {
    const res = await api.put(
      `/profesiogramas/catalogos/inmunizaciones/${id}`,
      data,
    );
    return res.data as Inmunizacion;
  }

  async deleteInmunizacion(id: number) {
    const res = await api.delete(
      `/profesiogramas/catalogos/inmunizaciones/${id}`,
    );
    return res.data;
  }

  // --- Profesiograma ---
  async listProfesiogramasByCargo(
    cargoId: number,
    params?: { estado?: string },
  ) {
    const res = await api.get(`/profesiogramas/cargos/${cargoId}`, { params });
    return res.data as Profesiograma[];
  }

  async getProfesiogramaByCargo(cargoId: number) {
    try {
      const res = await api.get(`/profesiogramas/cargos/${cargoId}`);
      // El backend devuelve una lista ordenada por fecha desc, tomamos el primero (más reciente)
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data[0] as Profesiograma;
      }
      return null;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createOrUpdateForCargo(data: ProfesiogramaCreate) {
    const res = await api.post(`/profesiogramas/cargos/${data.cargo_id}`, data);
    return res.data as Profesiograma;
  }

  async updateProfesiograma(
    profesiogramaId: number,
    data: Partial<ProfesiogramaCreate> & { estado?: string; version?: string },
  ) {
    const res = await api.put(`/profesiogramas/${profesiogramaId}`, data);
    return res.data as Profesiograma;
  }

  async deleteProfesiograma(profesiogramaId: number) {
    const res = await api.delete(`/profesiogramas/${profesiogramaId}`);
    return res.data;
  }

  async duplicateProfesiograma(
    profesiogramaId: number,
    data: ProfesiogramaDuplicateRequest
  ): Promise<ProfesiogramaDuplicateResult[]> {
    const res = await api.post(
      `/profesiogramas/${profesiogramaId}/duplicate`,
      data
    );
    return res.data as ProfesiogramaDuplicateResult[];
  }

  // --- Admin Panel Methods ---
  async getAdminList(params?: {
    page?: number;
    size?: number;
    estado?: string;
    cargo_id?: number;
    search?: string;
  }): Promise<ProfesiogramaAdminListResponse> {
    const res = await api.get("/profesiogramas/admin/list", { params });
    return res.data as ProfesiogramaAdminListResponse;
  }

  async updateStatus(
    profesiogramaId: number,
    estado: "activo" | "inactivo" | "borrador"
  ): Promise<{ message: string }> {
    const res = await api.patch(`/profesiogramas/admin/${profesiogramaId}/status`, {
      estado,
    });
    return res.data;
  }

  async bulkAction(
    action: "activar" | "inactivar" | "eliminar",
    profesiogramaIds: number[]
  ): Promise<ProfesiogramaBulkResult> {
    const res = await api.post("/profesiogramas/admin/bulk-action", {
      action,
      profesiograma_ids: profesiogramaIds,
    });
    return res.data as ProfesiogramaBulkResult;
  }

  async getStats(): Promise<ProfesiogramaStats> {
    const res = await api.get("/profesiogramas/admin/stats");
    return res.data as ProfesiogramaStats;
  }

  async exportAdminList(params?: {
    estado?: string;
    cargo_id?: number;
  }): Promise<Blob> {
    const res = await api.get("/profesiogramas/admin/export", {
      params,
      responseType: "blob",
    });
    return res.data as Blob;
  }

  async exportMatrizExcel(profesiogramaId: number) {
    const res = await api.get(
      `/profesiogramas/${profesiogramaId}/export/matriz.xlsx`,
      {
        responseType: "blob",
      },
    );
    return res.data as Blob;
  }

  async exportProfesiogramaPdfByCargo(
    cargoId: number,
    download: boolean = true,
  ) {
    const res = await api.get(
      `/profesiogramas/cargos/${cargoId}/export/profesiograma.pdf`,
      {
        params: { download },
        responseType: "blob",
      },
    );
    return res.data as Blob;
  }

  // --- Vista Trabajador ---
  async getWorkerProfesiograma(workerId: number) {
    const res = await api.get(`/workers/${workerId}/profesiograma`);
    return res.data as Profesiograma;
  }
  async searchFactoresRiesgo(params?: {
    q?: string;
    activo?: boolean;
    categoria?: string;
    page?: number;
    size?: number;
  }) {
    const res = await api.get(
      "/profesiogramas/catalogos/factores-riesgo/search",
      { params },
    );
    return res.data as PaginatedResponse<FactorRiesgo>;
  }

  async searchTiposExamen(params?: {
    q?: string;
    activo?: boolean;
    page?: number;
    size?: number;
  }) {
    const res = await api.get("/profesiogramas/catalogos/tipos-examen/search", {
      params,
    });
    return res.data as PaginatedResponse<TipoExamen>;
  }

  async searchCriteriosExclusion(params?: {
    q?: string;
    page?: number;
    size?: number;
  }) {
    const res = await api.get(
      "/profesiogramas/catalogos/criterios-exclusion/search",
      { params },
    );
    return res.data as PaginatedResponse<CriterioExclusion>;
  }

  async searchInmunizaciones(params?: {
    q?: string;
    activo?: boolean;
    page?: number;
    size?: number;
  }) {
    const res = await api.get(
      "/profesiogramas/catalogos/inmunizaciones/search",
      { params },
    );
    return res.data as PaginatedResponse<Inmunizacion>;
  }
  async buildEmoJustificacion(
    cargoId: number,
    data: {
      periodicidad_emo_meses: number;
      factores: Array<{
        factor_riesgo_id: number;
        nd?: number;
        ne?: number;
        nc?: number;
      }>;
    },
  ) {
    const res = await api.post(
      `/profesiogramas/cargos/${cargoId}/emo/justificacion`,
      data,
    );
    return res.data as ProfesiogramaEmoSuggestion;
  }
}

export const profesiogramaService = new ProfesiogramaService();
export default profesiogramaService;
