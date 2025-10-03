import api from './api';

export interface SeguridadSocial {
  id: number;
  tipo: string; // "eps" | "afp" | "arl"
  nombre: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeguridadSocialOption {
  value: number;
  label: string;
}

class SeguridadSocialService {
  /**
   * Obtiene todos los registros de seguridad social activos
   */
  async getActiveSeguridadSocial(): Promise<SeguridadSocial[]> {
    try {
      const response = await api.get('/admin/config/seguridad-social/');
      let data = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          data = response.data.items;
        }
      }
      // Filtrar solo los registros activos
      return data.filter((item: SeguridadSocial) => item.is_active);
    } catch (error) {
      console.error('Error fetching seguridad social:', error);
      return [];
    }
  }

  /**
   * Obtiene EPS activas usando endpoint específico
   */
  async getActiveEPS(): Promise<SeguridadSocial[]> {
    try {
      const response = await api.get('/admin/config/seguridad-social/tipo/eps');
      let data = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          data = response.data.items;
        }
      }
      return data.filter((item: SeguridadSocial) => item.is_active);
    } catch (error) {
      console.error('Error fetching EPS:', error);
      return [];
    }
  }

  /**
   * Obtiene ARL activas usando endpoint específico
   */
  async getActiveARL(): Promise<SeguridadSocial[]> {
    try {
      const response = await api.get('/admin/config/seguridad-social/tipo/arl');
      let data = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          data = response.data.items;
        }
      }
      return data.filter((item: SeguridadSocial) => item.is_active);
    } catch (error) {
      console.error('Error fetching ARL:', error);
      return [];
    }
  }

  /**
   * Obtiene AFP activas usando endpoint específico
   */
  async getActiveAFP(): Promise<SeguridadSocial[]> {
    try {
      const response = await api.get('/admin/config/seguridad-social/tipo/afp');
      let data = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          data = response.data.items;
        }
      }
      return data.filter((item: SeguridadSocial) => item.is_active);
    } catch (error) {
      console.error('Error fetching AFP:', error);
      return [];
    }
  }

  /**
   * Convierte registros de seguridad social a opciones para select
   */
  convertToOptions(items: SeguridadSocial[]): SeguridadSocialOption[] {
    return items.map((item) => ({
      value: item.id,
      label: item.nombre,
    }));
  }

  /**
   * Obtiene EPS activas como opciones
   */
  async getActiveEPSAsOptions(): Promise<SeguridadSocialOption[]> {
    try {
      const eps = await this.getActiveEPS();
      return this.convertToOptions(eps);
    } catch (error) {
      console.error('Error getting EPS as options:', error);
      return [];
    }
  }

  /**
   * Obtiene ARL activas como opciones
   */
  async getActiveARLAsOptions(): Promise<SeguridadSocialOption[]> {
    try {
      const arl = await this.getActiveARL();
      return this.convertToOptions(arl);
    } catch (error) {
      console.error('Error getting ARL as options:', error);
      return [];
    }
  }

  /**
   * Obtiene AFP activas como opciones
   */
  async getActiveAFPAsOptions(): Promise<SeguridadSocialOption[]> {
    try {
      const afp = await this.getActiveAFP();
      return this.convertToOptions(afp);
    } catch (error) {
      console.error('Error getting AFP as options:', error);
      return [];
    }
  }
}

export const seguridadSocialService = new SeguridadSocialService();
export default seguridadSocialService;