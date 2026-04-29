import { apiService as api } from './api';
import {
  CommitteePermission,
  CommitteePermissionCreate,
  CommitteePermissionUpdate,
} from '../types';

const BASE_URL = '/committee-permissions';
type BackendPermissionType = 'view' | 'edit' | 'manage_members' | 'delete';

const PERMISSION_MAP = {
  view: 'view' as BackendPermissionType,
  edit: 'edit' as BackendPermissionType,
  manageMembers: 'manage_members' as BackendPermissionType,
  delete: 'delete' as BackendPermissionType,
} as const;

export const committeePermissionService = {
  // Permission CRUD operations
  async getCommitteePermissions(committeeId: number): Promise<CommitteePermission[]> {
    const response = await api.get(`${BASE_URL}?committee_id=${committeeId}`);
    return response.data;
  },

  async getUserPermissions(userId: number): Promise<CommitteePermission[]> {
    const response = await api.get(`${BASE_URL}?user_id=${userId}`);
    return response.data;
  },

  async getPermission(id: number): Promise<CommitteePermission> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createPermission(permission: CommitteePermissionCreate): Promise<CommitteePermission> {
    const response = await api.post(BASE_URL, permission);
    return response.data;
  },

  async updatePermission(id: number, permission: CommitteePermissionUpdate): Promise<CommitteePermission> {
    const response = await api.put(`${BASE_URL}/${id}`, permission);
    return response.data;
  },

  async deletePermission(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Permission checking
  async checkUserPermission(
    committeeId: number,
    userId: number,
    permission: BackendPermissionType
  ): Promise<boolean> {
    try {
      const response = await api.get(`${BASE_URL}/check`, {
        params: {
          committee_id: committeeId,
          user_id: userId,
          permission,
        },
      });
      return response.data.has_permission;
    } catch (error) {
      return false;
    }
  },

  async checkCurrentUserPermission(
    committeeId: number,
    permission: BackendPermissionType
  ): Promise<boolean> {
    try {
      // Validate committee_id to prevent NaN errors
      if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
        console.warn(`Invalid committee_id provided: ${committeeId}`);
        return false;
      }

      const response = await api.get(`${BASE_URL}/check-current`, {
        params: {
          committee_id: committeeId,
          permission,
        },
      });
      return response.data.has_permission;
    } catch (error) {
      console.error(`Error checking permission ${permission} for committee ${committeeId}:`, error);
      return false;
    }
  },

  // Permission templates aligned to backend `permission_type`
  getPermissionTemplates(): { [key: string]: Omit<CommitteePermissionCreate, 'committee_id' | 'user_id'>[] } {
    return {
      admin: [
        { permission_type: PERMISSION_MAP.view, is_active: true },
        { permission_type: PERMISSION_MAP.edit, is_active: true },
        { permission_type: PERMISSION_MAP.manageMembers, is_active: true },
        { permission_type: PERMISSION_MAP.delete, is_active: true },
      ],
      member: [
        { permission_type: PERMISSION_MAP.view, is_active: true },
        { permission_type: PERMISSION_MAP.edit, is_active: true },
      ],
      viewer: [{ permission_type: PERMISSION_MAP.view, is_active: true }],
    };
  },

  async applyPermissionTemplate(
    committeeId: number,
    userId: number,
    template: 'admin' | 'member' | 'viewer'
  ): Promise<CommitteePermission[]> {
    const templatePermissions = this.getPermissionTemplates()[template];
    const createdPermissions = await Promise.all(
      templatePermissions.map((permission) =>
        this.createPermission({
          committee_id: committeeId,
          user_id: userId,
          permission_type: permission.permission_type,
          is_active: true,
        })
      )
    );
    return createdPermissions;
  },

  // Committee access control
  async getUserAccessibleCommittees(): Promise<{ committee_id: number; committee_name: string; permissions: string[] }[]> {
    try {
      const response = await api.get(`${BASE_URL}/accessible-committees`);
      return response.data;
    } catch (error) {
      console.error('Error en getUserAccessibleCommittees:', error);
      throw error;
    }
  },

  async getCommitteeUsers(committeeId: number): Promise<{ user_id: number; user_name: string; permissions: string[] }[]> {
    const response = await api.get(`${BASE_URL}/committee/${committeeId}/users`);
    return response.data;
  },

  // Permission helpers
  getPermissionLabels(): { [key: string]: string } {
    return {
      [PERMISSION_MAP.view]: 'Ver contenido del comité',
      [PERMISSION_MAP.edit]: 'Editar comité y recursos',
      [PERMISSION_MAP.manageMembers]: 'Gestionar miembros',
      [PERMISSION_MAP.delete]: 'Eliminar comité y recursos',
    };
  },

  // Quick permission checks for UI
  async canView(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canView: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, PERMISSION_MAP.view);
  },

  async canEdit(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canEdit: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, PERMISSION_MAP.edit);
  },

  async canManageMembers(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canManageMembers: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, PERMISSION_MAP.manageMembers);
  },

  async canCreateMeetings(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canCreateMeetings: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    // Backend no expone permiso específico para reuniones; "edit" cubre gestión operativa.
    return this.checkCurrentUserPermission(committeeId, PERMISSION_MAP.edit);
  },

  async canManageVotings(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canManageVotings: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    // Backend no expone permiso específico para votaciones; "edit" cubre gestión operativa.
    return this.checkCurrentUserPermission(committeeId, PERMISSION_MAP.edit);
  },

  async canUploadDocuments(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canUploadDocuments: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    // Backend no expone permiso específico para documentos; "edit" cubre gestión operativa.
    return this.checkCurrentUserPermission(committeeId, PERMISSION_MAP.edit);
  },

  async canManageActivities(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canManageActivities: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, PERMISSION_MAP.edit);
  },

  async hasAnyCommitteePermissions(): Promise<boolean> {
    try {
      const response = await api.get(`${BASE_URL}/accessible-committees`);
      const accessibleCommittees = response.data;
      
      // Si el usuario tiene acceso a algún comité, puede crear reuniones
      return Array.isArray(accessibleCommittees) && accessibleCommittees.length > 0;
    } catch (error) {
      console.error('Error checking committee permissions:', error);
      return false;
    }
  },
};
