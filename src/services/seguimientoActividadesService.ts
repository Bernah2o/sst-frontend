import api from './api';

export interface SeguimientoActividad {
  id: number;
  seguimiento_id: number;
  titulo: string;
  descripcion?: string;
  tipo_fecha: 'rango' | 'unica';
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_unica?: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  archivo_soporte_url?: string;
  archivo_soporte_nombre?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface SeguimientoActividadCreate {
  seguimiento_id: number;
  titulo: string;
  descripcion?: string;
  tipo_fecha: 'rango' | 'unica';
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_unica?: string;
  estado?: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  prioridad?: 'baja' | 'media' | 'alta' | 'critica';
  observaciones?: string;
}

export interface SeguimientoActividadUpdate {
  titulo?: string;
  descripcion?: string;
  tipo_fecha?: 'rango' | 'unica';
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_unica?: string;
  estado?: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  prioridad?: 'baja' | 'media' | 'alta' | 'critica';
  observaciones?: string;
}

export interface ArchivoSoporteResponse {
  url: string;
  nombre_archivo: string;
  mensaje: string;
}

class SeguimientoActividadesService {
  private baseUrl = '/seguimiento-actividades';

  // Obtener todas las actividades de un seguimiento
  async getActividadesBySeguimiento(seguimientoId: number): Promise<SeguimientoActividad[]> {
    const response = await api.get(`${this.baseUrl}/seguimiento/${seguimientoId}/actividades`);
    return response.data;
  }

  // Obtener una actividad por ID
  async getActividad(id: number): Promise<SeguimientoActividad> {
    const response = await api.get(`${this.baseUrl}/actividades/${id}`);
    return response.data;
  }

  // Crear una nueva actividad
  async createActividad(actividad: SeguimientoActividadCreate): Promise<SeguimientoActividad> {
    const response = await api.post(`${this.baseUrl}/actividades`, actividad);
    return response.data;
  }

  // Actualizar una actividad
  async updateActividad(id: number, actividad: SeguimientoActividadUpdate): Promise<SeguimientoActividad> {
    const response = await api.put(`${this.baseUrl}/actividades/${id}`, actividad);
    return response.data;
  }

  // Eliminar una actividad
  async deleteActividad(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/actividades/${id}`);
  }

  // Subir archivo de soporte
  async uploadArchivoSoporte(actividadId: number, file: File): Promise<ArchivoSoporteResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(
      `${this.baseUrl}/actividades/${actividadId}/upload-soporte`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // Eliminar archivo de soporte
  async deleteArchivoSoporte(actividadId: number): Promise<void> {
    await api.delete(`${this.baseUrl}/actividades/${actividadId}/soporte`);
  }

  // Filtrar actividades
  async getActividadesFiltradas(params: {
    seguimiento_id?: number;
    estado?: string;
    prioridad?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    limit?: number;
  }): Promise<SeguimientoActividad[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseUrl}/actividades/filtrar?${queryParams.toString()}`);
    return response.data;
  }
}

export const seguimientoActividadesService = new SeguimientoActividadesService();
export default seguimientoActividadesService;