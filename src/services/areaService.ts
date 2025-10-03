import api from './api';

export interface Area {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AreaOption {
  value: number;
  label: string;
}

class AreaService {
  /**
   * Obtiene todas las áreas activas
   */
  async getActiveAreas(): Promise<Area[]> {
    try {
      const response = await api.get('/areas/?limit=100');
      const data = response.data.items || [];
      // Filtrar solo las áreas activas
      return data.filter((area: Area) => area.is_active);
    } catch (error) {
      console.error('Error fetching areas:', error);
      return [];
    }
  }

  /**
   * Convierte las áreas a opciones para select
   */
  convertAreasToOptions(areas: Area[]): AreaOption[] {
    return areas.map((area) => ({
      value: area.id,
      label: area.name,
    }));
  }

  /**
   * Obtiene las áreas activas y las convierte a opciones
   */
  async getActiveAreasAsOptions(): Promise<AreaOption[]> {
    try {
      const areas = await this.getActiveAreas();
      return this.convertAreasToOptions(areas);
    } catch (error) {
      console.error('Error getting areas as options:', error);
      return [];
    }
  }
}

export const areaService = new AreaService();
export default areaService;