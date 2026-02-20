import api from "./api";

// ─────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────

export type CategoriaPresupuesto =
  | "MEDICINA_PREVENTIVA"
  | "HIGIENE_INDUSTRIAL"
  | "SEGURIDAD_INDUSTRIAL"
  | "CAPACITACION"
  | "INFRAESTRUCTURA";

export const CATEGORIA_LABELS: Record<CategoriaPresupuesto, string> = {
  MEDICINA_PREVENTIVA: "Medicina Preventiva, del Trabajo y Otros",
  HIGIENE_INDUSTRIAL: "Higiene Industrial y Manejo Ambiental",
  SEGURIDAD_INDUSTRIAL: "Seguridad Industrial",
  CAPACITACION: "Capacitación - Asesorías - Auditorías",
  INFRAESTRUCTURA: "Infraestructura y Aseguramiento de la Operación",
};

export const CATEGORIAS_ORDER: CategoriaPresupuesto[] = [
  "MEDICINA_PREVENTIVA",
  "HIGIENE_INDUSTRIAL",
  "SEGURIDAD_INDUSTRIAL",
  "CAPACITACION",
  "INFRAESTRUCTURA",
];

export const CAT_COLORS: Record<CategoriaPresupuesto, string> = {
  MEDICINA_PREVENTIVA: "#1565C0",
  HIGIENE_INDUSTRIAL: "#2E7D32",
  SEGURIDAD_INDUSTRIAL: "#E65100",
  CAPACITACION: "#6A1B9A",
  INFRAESTRUCTURA: "#37474F",
};

export const CAT_LIGHT_COLORS: Record<CategoriaPresupuesto, string> = {
  MEDICINA_PREVENTIVA: "#E3F2FD",
  HIGIENE_INDUSTRIAL: "#E8F5E9",
  SEGURIDAD_INDUSTRIAL: "#FFF3E0",
  CAPACITACION: "#F3E5F5",
  INFRAESTRUCTURA: "#ECEFF1",
};

export interface PresupuestoMensual {
  id: number;
  item_id: number;
  mes: number;
  proyectado: number;
  ejecutado: number;
}

export interface PresupuestoItem {
  id: number;
  categoria_id: number;
  actividad: string;
  es_default: boolean;
  orden: number;
  montos_mensuales: PresupuestoMensual[];
}

export interface PresupuestoCategoria {
  id: number;
  presupuesto_id: number;
  categoria: CategoriaPresupuesto;
  orden: number;
  items: PresupuestoItem[];
}

export interface PresupuestoSST {
  id: number;
  año: number;
  empresa_id?: number;
  codigo: string;
  version: string;
  titulo?: string;
  encargado_sgsst?: string;
  aprobado_por?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface PresupuestoSSTDetail extends PresupuestoSST {
  categorias: PresupuestoCategoria[];
}

export interface MensualUpdate {
  proyectado?: number;
  ejecutado?: number;
}

// ─────────────────────────────────────────────
// Helper: calcular totales por ítem (client-side)
// ─────────────────────────────────────────────

export function computeItemTotals(item: PresupuestoItem) {
  const totalProy = item.montos_mensuales.reduce(
    (s, m) => s + Number(m.proyectado),
    0
  );
  const totalEjec = item.montos_mensuales.reduce(
    (s, m) => s + Number(m.ejecutado),
    0
  );
  const pctEjec = totalProy > 0 ? (totalEjec / totalProy) * 100 : 0;
  const porEjecutar = totalProy - totalEjec;
  const pctPorEj = totalProy > 0 ? (porEjecutar / totalProy) * 100 : 0;
  return { totalProy, totalEjec, pctEjec, porEjecutar, pctPorEj };
}

export function formatMoney(val: number): string {
  if (val === 0) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

const BASE = "/presupuesto-sst";

class PresupuestoSSTService {
  async listar(params?: {
    año?: number;
    empresa_id?: number;
  }): Promise<PresupuestoSST[]> {
    const r = await api.get(`${BASE}/`, { params });
    return r.data;
  }

  async crearDesdePlantilla(
    año: number,
    empresa_id?: number,
    encargado_sgsst?: string
  ): Promise<PresupuestoSSTDetail> {
    const r = await api.post(`${BASE}/crear-desde-plantilla`, null, {
      params: { año, empresa_id, encargado_sgsst },
    });
    return r.data;
  }

  async obtener(id: number): Promise<PresupuestoSSTDetail> {
    const r = await api.get(`${BASE}/${id}`);
    return r.data;
  }

  async actualizar(
    id: number,
    data: Partial<Pick<PresupuestoSST, "codigo" | "version" | "titulo" | "encargado_sgsst" | "aprobado_por">>
  ): Promise<PresupuestoSST> {
    const r = await api.put(`${BASE}/${id}`, data);
    return r.data;
  }

  async eliminar(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  }

  async agregarItem(
    presupuestoId: number,
    categoria: CategoriaPresupuesto,
    actividad: string,
    orden?: number
  ): Promise<PresupuestoItem> {
    const r = await api.post(
      `${BASE}/${presupuestoId}/categorias/${categoria}/items`,
      { actividad, orden: orden ?? 999 }
    );
    return r.data;
  }

  async eliminarItem(itemId: number): Promise<void> {
    await api.delete(`${BASE}/items/${itemId}`);
  }

  async actualizarMensual(
    itemId: number,
    mes: number,
    data: MensualUpdate
  ): Promise<PresupuestoMensual> {
    const r = await api.put(`${BASE}/items/${itemId}/mensual/${mes}`, data);
    return r.data;
  }

  async exportarExcel(id: number, año: number): Promise<void> {
    const r = await api.get(`${BASE}/${id}/exportar/excel`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presupuesto_sst_${año}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportarPdf(id: number, año: number): Promise<void> {
    const r = await api.get(`${BASE}/${id}/exportar/pdf`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presupuesto_sst_${año}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const presupuestoSSTService = new PresupuestoSSTService();
