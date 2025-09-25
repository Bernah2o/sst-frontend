import { apiService as api } from './api';
import {
  CommitteePermission,
  CommitteePermissionCreate,
  CommitteePermissionUpdate,
} from '../types';

const BASE_URL = '/committee-permissions';

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
  async checkUserPermission(committeeId: number, userId: number, permission: string): Promise<boolean> {
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

  async checkCurrentUserPermission(committeeId: number, permission: string): Promise<boolean> {
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

  // Bulk permission operations
  async grantMultiplePermissions(permissions: CommitteePermissionCreate[]): Promise<CommitteePermission[]> {
    const response = await api.post(`${BASE_URL}/bulk`, { permissions });
    return response.data;
  },

  async updateMultiplePermissions(updates: { id: number; permission: CommitteePermissionUpdate }[]): Promise<CommitteePermission[]> {
    const response = await api.put(`${BASE_URL}/bulk`, { updates });
    return response.data;
  },

  async revokeMultiplePermissions(permissionIds: number[]): Promise<void> {
    await api.delete(`${BASE_URL}/bulk`, {
      data: { permission_ids: permissionIds },
    });
  },

  // Permission templates
  async applyPermissionTemplate(committeeId: number, userId: number, template: 'admin' | 'member' | 'viewer'): Promise<CommitteePermission> {
    const response = await api.post(`${BASE_URL}/apply-template`, {
      committee_id: committeeId,
      user_id: userId,
      template,
    });
    return response.data;
  },

  async getPermissionTemplates(): Promise<{ [key: string]: CommitteePermissionCreate }> {
    return {
      admin: {
        committee_id: 0, // Will be set when applying
        user_id: 0, // Will be set when applying
        can_view: true,
        can_edit: true,
        can_manage_members: true,
        can_create_meetings: true,
        can_manage_votings: true,
        can_upload_documents: true,
      },
      member: {
        committee_id: 0,
        user_id: 0,
        can_view: true,
        can_edit: false,
        can_manage_members: false,
        can_create_meetings: false,
        can_manage_votings: false,
        can_upload_documents: true,
      },
      viewer: {
        committee_id: 0,
        user_id: 0,
        can_view: true,
        can_edit: false,
        can_manage_members: false,
        can_create_meetings: false,
        can_manage_votings: false,
        can_upload_documents: false,
      },
    };
  },

  // Permission inheritance from committee membership
  async syncMembershipPermissions(committeeId: number): Promise<void> {
    await api.post(`${BASE_URL}/sync-membership`, { committee_id: committeeId });
  },

  // Permission audit
  async getPermissionAuditLog(committeeId: number): Promise<any[]> {
    const response = await api.get(`${BASE_URL}/audit/${committeeId}`);
    return response.data;
  },

  async getUserPermissionHistory(userId: number): Promise<any[]> {
    const response = await api.get(`${BASE_URL}/user/${userId}/history`);
    return response.data;
  },

  // Permission validation
  async validatePermissions(committeeId: number): Promise<{ valid: boolean; issues: string[] }> {
    const response = await api.get(`${BASE_URL}/validate/${committeeId}`);
    return response.data;
  },

  // Committee access control
  async getUserAccessibleCommittees(): Promise<{ committee_id: number; committee_name: string; permissions: string[] }[]> {
    const response = await api.get(`${BASE_URL}/accessible-committees`);
    return response.data;
  },

  async getCommitteeUsers(committeeId: number): Promise<{ user_id: number; user_name: string; permissions: string[] }[]> {
    const response = await api.get(`${BASE_URL}/committee/${committeeId}/users`);
    return response.data;
  },

  // Permission helpers
  getPermissionLabels(): { [key: string]: string } {
    return {
      can_view: 'Ver contenido del comité',
      can_edit: 'Editar información del comité',
      can_manage_members: 'Gestionar miembros',
      can_create_meetings: 'Crear reuniones',
      can_manage_votings: 'Gestionar votaciones',
      can_upload_documents: 'Subir documentos',
    };
  },

  // Quick permission checks for UI
  async canView(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canView: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, 'can_view');
  },

  async canEdit(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canEdit: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, 'can_edit');
  },

  async canManageMembers(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canManageMembers: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, 'can_manage_members');
  },

  async canCreateMeetings(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canCreateMeetings: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, 'can_create_meetings');
  },

  async canManageVotings(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canManageVotings: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, 'can_manage_votings');
  },

  async canUploadDocuments(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canUploadDocuments: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, 'can_upload_documents');
  },

  async canManageActivities(committeeId: number): Promise<boolean> {
    if (!committeeId || isNaN(committeeId) || committeeId <= 0) {
      console.warn(`canManageActivities: Invalid committee_id provided: ${committeeId}`);
      return false;
    }
    return this.checkCurrentUserPermission(committeeId, 'can_edit');
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