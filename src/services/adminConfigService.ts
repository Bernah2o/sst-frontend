import { apiService } from './api';
import { Programas } from '../types';

export interface ProgramaOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

class AdminConfigService {
  /**
   * Obtiene todos los programas activos desde el backend
   */
  async getActiveProgramas(): Promise<Programas[]> {
    try {
      const response = await apiService.get('/admin/config/programas/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active programas:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los programas (activos e inactivos) desde el backend
   */
  async fetchAllProgramas(): Promise<Programas[]> {
    try {
      const response = await apiService.get('/admin/config/programas');
      return response.data;
    } catch (error) {
      console.error('Error fetching all programas:', error);
      throw error;
    }
  }

  /**
   * Convierte los programas del backend a opciones para el frontend
   * con iconos y colores predeterminados
   */
  convertProgramasToOptions(programas: Programas[]): ProgramaOption[] {
    const colorMap: { [key: string]: string } = {
      'psv': 'primary',
      'psicosocial': 'primary',
      'osteomuscular': 'secondary',
      'auditivo': 'info',
      'respiratorio': 'warning',
      'visual': 'success',
      'cardiovascular': 'error'
    };

    return programas.map((programa, index) => {
      // Generar un valor único basado en el nombre del programa
      const value = programa.nombre_programa
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      // Asignar color basado en palabras clave o usar colores por defecto
      let color = 'default';
      for (const [keyword, assignedColor] of Object.entries(colorMap)) {
        if (programa.nombre_programa.toLowerCase().includes(keyword)) {
          color = assignedColor;
          break;
        }
      }

      // Si no se encuentra un color específico, usar colores en secuencia
      if (color === 'default') {
        const colors = ['primary', 'secondary', 'info', 'warning', 'success', 'error'];
        color = colors[index % colors.length];
      }

      return {
        value,
        label: programa.nombre_programa,
        color
      };
    });
  }

  /**
   * Obtiene los programas activos y los convierte a opciones
   */
  async getActiveProgramasAsOptions(): Promise<ProgramaOption[]> {
    try {
      const programas = await this.getActiveProgramas();
      return this.convertProgramasToOptions(programas);
    } catch (error) {
      console.error('Error getting programas as options:', error);
      // Retornar array vacío en caso de error
      return [];
    }
  }
}

export const adminConfigService = new AdminConfigService();
export default adminConfigService;