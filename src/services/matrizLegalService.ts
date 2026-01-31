/**
 * Servicio para la Matriz Legal SST.
 * Maneja la comunicación con la API para:
 * - Importación de archivos Excel
 * - Gestión de normas
 * - Cumplimiento por empresa
 * - Dashboard y estadísticas
 * - Exportación
 */

import api from "./api";

// ==================== TIPOS ====================

export type AmbitoAplicacion = "nacional" | "departamental" | "municipal" | "internacional";
export type EstadoNorma = "vigente" | "derogada" | "modificada";
export type EstadoCumplimiento = "pendiente" | "cumple" | "no_cumple" | "no_aplica" | "en_proceso";
export type EstadoImportacion = "en_proceso" | "completada" | "fallida" | "parcial";

export interface SectorEconomico {
  id: number;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  es_todos_los_sectores: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface SectorEconomicoSimple {
  id: number;
  nombre: string;
  es_todos_los_sectores: boolean;
}

export interface EmpresaCaracteristicas {
  tiene_trabajadores_independientes: boolean;
  tiene_teletrabajo: boolean;
  tiene_trabajo_alturas: boolean;
  tiene_trabajo_espacios_confinados: boolean;
  tiene_trabajo_caliente: boolean;
  tiene_sustancias_quimicas: boolean;
  tiene_radiaciones: boolean;
  tiene_trabajo_nocturno: boolean;
  tiene_menores_edad: boolean;
  tiene_mujeres_embarazadas: boolean;
  tiene_conductores: boolean;
  tiene_manipulacion_alimentos: boolean;
  tiene_maquinaria_pesada: boolean;
  tiene_riesgo_electrico: boolean;
  tiene_riesgo_biologico: boolean;
  tiene_trabajo_excavaciones: boolean;
  tiene_trabajo_administrativo: boolean;
}

export interface Empresa extends EmpresaCaracteristicas {
  id: number;
  nombre: string;
  nit: string | null;
  razon_social: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  sector_economico_id: number | null;
  sector_economico?: SectorEconomicoSimple;
  activo: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface EmpresaResumen {
  id: number;
  nombre: string;
  nit: string | null;
  sector_economico_nombre: string | null;
  activo: boolean;
  total_normas_aplicables: number;
  normas_cumple: number;
  normas_no_cumple: number;
  normas_pendientes: number;
  porcentaje_cumplimiento: number;
}

export interface MatrizLegalNorma {
  id: number;
  ambito_aplicacion: AmbitoAplicacion;
  sector_economico_id: number | null;
  sector_economico_texto: string | null;
  clasificacion_norma: string;
  tema_general: string;
  subtema_riesgo_especifico: string | null;
  anio: number;
  tipo_norma: string;
  numero_norma: string;
  fecha_expedicion: string | null;
  expedida_por: string | null;
  descripcion_norma: string | null;
  articulo: string | null;
  estado: EstadoNorma;
  info_adicional: string | null;
  descripcion_articulo_exigencias: string | null;
  aplica_general: boolean;
  aplica_teletrabajo: boolean;
  aplica_trabajo_alturas: boolean;
  aplica_espacios_confinados: boolean;
  aplica_sustancias_quimicas: boolean;
  aplica_conductores: boolean;
  aplica_riesgo_electrico: boolean;
  aplica_riesgo_biologico: boolean;
  aplica_trabajo_nocturno: boolean;
  aplica_menores_edad: boolean;
  aplica_mujeres_embarazadas: boolean;
  aplica_trabajo_administrativo: boolean;
  version: number;
  activo: boolean;
  created_at: string;
  updated_at: string | null;
  sector_economico_nombre?: string;
  identificador_completo?: string;
}

export interface MatrizLegalNormaConCumplimiento extends MatrizLegalNorma {
  cumplimiento_id: number | null;
  estado_cumplimiento: EstadoCumplimiento | null;
  aplica_empresa: boolean;
  evidencia_cumplimiento: string | null;
  observaciones: string | null;
  plan_accion: string | null;
  responsable: string | null;
  fecha_compromiso: string | null;
  fecha_ultima_evaluacion: string | null;
}

export interface MatrizLegalCumplimiento {
  id: number;
  empresa_id: number;
  norma_id: number;
  estado: EstadoCumplimiento;
  evidencia_cumplimiento: string | null;
  observaciones: string | null;
  plan_accion: string | null;
  responsable: string | null;
  fecha_compromiso: string | null;
  seguimiento: string | null;
  aplica_empresa: boolean;
  justificacion_no_aplica: string | null;
  fecha_ultima_evaluacion: string | null;
  fecha_proxima_revision: string | null;
  evaluado_por: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface MatrizLegalCumplimientoHistorial {
  id: number;
  cumplimiento_id: number;
  estado_anterior: string | null;
  estado_nuevo: string;
  observaciones: string | null;
  created_at: string;
  creado_por: number;
  usuario_nombre: string | null;
}

export interface MatrizLegalImportacionPreview {
  total_filas: number;
  normas_nuevas_preview: number;
  normas_existentes_preview: number;
  errores_validacion: { fila: number; error: string }[];
  columnas_detectadas: string[];
  columnas_mapeadas: Record<string, string | null>; // Original -> Mapeado (o null si no mapea)
  muestra_datos: Record<string, unknown>[];
}

export interface MatrizLegalImportacionResult {
  id: number;
  nombre_archivo: string;
  fecha_importacion: string;
  estado: EstadoImportacion;
  total_filas: number;
  normas_nuevas: number;
  normas_actualizadas: number;
  normas_sin_cambios: number;
  errores: number;
  log_errores: string | null;
  creado_por: number;
}

export interface MatrizLegalEstadisticasPorEstado {
  cumple: number;
  no_cumple: number;
  pendiente: number;
  no_aplica: number;
  en_proceso: number;
}

export interface MatrizLegalEstadisticas {
  empresa_id: number;
  empresa_nombre: string;
  total_normas_aplicables: number;
  por_estado: MatrizLegalEstadisticasPorEstado;
  porcentaje_cumplimiento: number;
  normas_con_plan_accion: number;
  normas_vencidas: number;
}

export interface MatrizLegalDashboard {
  estadisticas: MatrizLegalEstadisticas;
  ultimas_evaluaciones: { id: number; norma_id: number; estado: string; fecha: string }[];
  normas_criticas: MatrizLegalNormaConCumplimiento[];
  proximas_revisiones: unknown[];
  importaciones_recientes: MatrizLegalImportacionResult[];
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

// ==================== SERVICIO ====================

class MatrizLegalService {
  // ==================== SECTORES ECONÓMICOS ====================

  async listSectoresEconomicos(params?: { activo?: boolean; q?: string }) {
    const res = await api.get("/sectores-economicos/", { params });
    return res.data as SectorEconomico[];
  }

  async listSectoresActivos() {
    const res = await api.get("/sectores-economicos/activos");
    return res.data as SectorEconomicoSimple[];
  }

  async getSectorEconomico(id: number) {
    const res = await api.get(`/sectores-economicos/${id}`);
    return res.data as SectorEconomico;
  }

  async createSectorEconomico(data: Partial<SectorEconomico>) {
    const res = await api.post("/sectores-economicos/", data);
    return res.data as SectorEconomico;
  }

  async updateSectorEconomico(id: number, data: Partial<SectorEconomico>) {
    const res = await api.put(`/sectores-economicos/${id}`, data);
    return res.data as SectorEconomico;
  }

  async deleteSectorEconomico(id: number) {
    await api.delete(`/sectores-economicos/${id}`);
  }

  // ==================== EMPRESAS ====================

  async listEmpresas(params?: { activo?: boolean; q?: string }) {
    const res = await api.get("/empresas/", { params });
    return res.data as EmpresaResumen[];
  }

  async listEmpresasActivas() {
    const res = await api.get("/empresas/activas");
    return res.data as { id: number; nombre: string; nit: string | null }[];
  }

  async getEmpresa(id: number) {
    const res = await api.get(`/empresas/${id}`);
    return res.data as Empresa;
  }

  async createEmpresa(data: Partial<Empresa>) {
    const res = await api.post("/empresas/", data);
    return res.data as Empresa;
  }

  async updateEmpresa(id: number, data: Partial<Empresa>) {
    const res = await api.put(`/empresas/${id}`, data);
    return res.data as Empresa;
  }

  async deleteEmpresa(id: number) {
    await api.delete(`/empresas/${id}`);
  }

  async sincronizarNormasEmpresa(empresaId: number) {
    const res = await api.post(`/empresas/${empresaId}/sincronizar-normas`);
    return res.data as { message: string };
  }

  async getCaracteristicasEmpresa(empresaId: number) {
    const res = await api.get(`/empresas/${empresaId}/caracteristicas`);
    return res.data as string[];
  }

  // ==================== IMPORTACIÓN ====================

  async previewImport(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/matriz-legal/importar/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as MatrizLegalImportacionPreview;
  }

  async importExcel(file: File, sobrescribir: boolean = false) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(
      `/matriz-legal/importar?sobrescribir_existentes=${sobrescribir}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data as MatrizLegalImportacionResult;
  }

  async listImportaciones(params?: { page?: number; size?: number }) {
    const res = await api.get("/matriz-legal/importaciones", { params });
    return res.data as PaginatedResponse<MatrizLegalImportacionResult>;
  }

  // ==================== NORMAS ====================

  async listNormas(params?: {
    page?: number;
    size?: number;
    q?: string;
    sector_economico_id?: number;
    clasificacion?: string;
    tema_general?: string;
    anio?: number;
    estado?: string;
    activo?: boolean;
  }) {
    const res = await api.get("/matriz-legal/normas", { params });
    return res.data as PaginatedResponse<MatrizLegalNorma>;
  }

  async getNorma(normaId: number) {
    const res = await api.get(`/matriz-legal/normas/${normaId}`);
    return res.data as MatrizLegalNorma;
  }

  async updateNorma(normaId: number, data: Partial<MatrizLegalNorma>) {
    const res = await api.put(`/matriz-legal/normas/${normaId}`, data);
    return res.data as MatrizLegalNorma;
  }

  async getCatalogosClasificaciones() {
    const res = await api.get("/matriz-legal/normas/catalogos/clasificaciones");
    return res.data as string[];
  }

  async getCatalogosTemas(clasificacion?: string) {
    const res = await api.get("/matriz-legal/normas/catalogos/temas", {
      params: { clasificacion },
    });
    return res.data as string[];
  }

  async getCatalogosAnios() {
    const res = await api.get("/matriz-legal/normas/catalogos/anios");
    return res.data as number[];
  }

  // ==================== CUMPLIMIENTO POR EMPRESA ====================

  async getNormasEmpresa(
    empresaId: number,
    params?: {
      page?: number;
      size?: number;
      estado_cumplimiento?: string;
      clasificacion?: string;
      tema_general?: string;
      q?: string;
      solo_aplicables?: boolean;
    }
  ) {
    const res = await api.get(`/matriz-legal/empresas/${empresaId}/normas`, {
      params,
    });
    return res.data as PaginatedResponse<MatrizLegalNormaConCumplimiento>;
  }

  async getDashboardEmpresa(empresaId: number) {
    const res = await api.get(`/matriz-legal/empresas/${empresaId}/dashboard`);
    return res.data as MatrizLegalDashboard;
  }

  async getEstadisticasEmpresa(empresaId: number) {
    const res = await api.get(`/matriz-legal/empresas/${empresaId}/estadisticas`);
    return res.data as MatrizLegalEstadisticas;
  }

  async updateCumplimiento(
    empresaId: number,
    normaId: number,
    data: Partial<MatrizLegalCumplimiento>
  ) {
    const res = await api.put(
      `/matriz-legal/empresas/${empresaId}/cumplimiento/${normaId}`,
      data
    );
    return res.data as MatrizLegalCumplimiento;
  }

  async bulkUpdateCumplimiento(
    empresaId: number,
    cumplimientoIds: number[],
    estado: EstadoCumplimiento
  ) {
    const res = await api.post(
      `/matriz-legal/empresas/${empresaId}/cumplimiento/bulk`,
      { cumplimiento_ids: cumplimientoIds, estado }
    );
    return res.data as { message: string };
  }

  async getHistorialCumplimiento(empresaId: number, cumplimientoId: number) {
    const res = await api.get(
      `/matriz-legal/empresas/${empresaId}/cumplimiento/${cumplimientoId}/historial`
    );
    return res.data as MatrizLegalCumplimientoHistorial[];
  }

  // ==================== EXPORTACIÓN ====================

  async exportMatrizEmpresa(empresaId: number, incluirNoAplicables: boolean = false) {
    const res = await api.get(
      `/matriz-legal/empresas/${empresaId}/export/excel`,
      {
        params: { incluir_no_aplicables: incluirNoAplicables },
        responseType: "blob",
      }
    );
    return res.data as Blob;
  }

  async exportTodasNormas(params?: {
    clasificacion?: string;
    sector_economico_id?: number;
  }) {
    const res = await api.get("/matriz-legal/normas/export/excel", {
      params,
      responseType: "blob",
    });
    return res.data as Blob;
  }

  // ==================== HELPERS ====================

  /**
   * Descarga un blob como archivo.
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Obtiene el color para un estado de cumplimiento.
   */
  getColorEstadoCumplimiento(estado: EstadoCumplimiento | null): string {
    switch (estado) {
      case "cumple":
        return "#4caf50"; // Verde
      case "no_cumple":
        return "#f44336"; // Rojo
      case "pendiente":
        return "#ff9800"; // Naranja
      case "en_proceso":
        return "#2196f3"; // Azul
      case "no_aplica":
        return "#9e9e9e"; // Gris
      default:
        return "#ff9800"; // Naranja por defecto (pendiente)
    }
  }

  /**
   * Obtiene la etiqueta para un estado de cumplimiento.
   */
  getLabelEstadoCumplimiento(estado: EstadoCumplimiento | null): string {
    switch (estado) {
      case "cumple":
        return "Cumple";
      case "no_cumple":
        return "No Cumple";
      case "pendiente":
        return "Pendiente";
      case "en_proceso":
        return "En Proceso";
      case "no_aplica":
        return "No Aplica";
      default:
        return "Pendiente";
    }
  }
}

export const matrizLegalService = new MatrizLegalService();
export default matrizLegalService;
