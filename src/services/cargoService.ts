import api from './api';

export interface Cargo {
  id: number;
  nombre_cargo: string;
  periodicidad_emo?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CargoOption {
  value: number;
  label: string;
}

class CargoService {
  /**
   * Obtiene todos los cargos activos
   */
  async getActiveCargos(): Promise<Cargo[]> {
    try {
      const response = await api.get('/admin/config/cargos');
      const data = Array.isArray(response.data) ? response.data : [];
      // Filtrar solo los cargos activos
      return data.filter((cargo: Cargo) => cargo.activo);
    } catch (error) {
      console.error('Error fetching cargos:', error);
      return [];
    }
  }

  /**
   * Convierte los cargos a opciones para select
   */
  convertCargosToOptions(cargos: Cargo[]): CargoOption[] {
    return cargos.map((cargo) => ({
      value: cargo.id,
      label: cargo.nombre_cargo,
    }));
  }

  /**
   * Obtiene los cargos activos y los convierte a opciones
   */
  async getActiveCargosAsOptions(): Promise<CargoOption[]> {
    try {
      const cargos = await this.getActiveCargos();
      return this.convertCargosToOptions(cargos);
    } catch (error) {
      console.error('Error getting cargos as options:', error);
      return [];
    }
  }
}

export const cargoService = new CargoService();
export default cargoService;