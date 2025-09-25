import { apiService as api } from './api';
import {
  CommitteeMember,
  CommitteeMemberCreate,
  CommitteeMemberUpdate,
  CommitteeRole,
} from '../types';

const BASE_URL = '/committee-members';

export const committeeMemberService = {
  // Committee Member CRUD operations
  async getCommitteeMembers(committeeId: number): Promise<CommitteeMember[]> {
    const response = await api.get(`${BASE_URL}?committee_id=${committeeId}`);
    return response.data;
  },

  async getCommitteeMember(id: number): Promise<CommitteeMember> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createCommitteeMember(member: CommitteeMemberCreate): Promise<CommitteeMember> {
    const response = await api.post(BASE_URL, member);
    return response.data;
  },

  async updateCommitteeMember(id: number, member: CommitteeMemberUpdate): Promise<CommitteeMember> {
    const response = await api.put(`${BASE_URL}/${id}`, member);
    return response.data;
  },

  async deleteCommitteeMember(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Bulk operations
  async addMultipleMembers(members: CommitteeMemberCreate[]): Promise<CommitteeMember[]> {
    const response = await api.post(`${BASE_URL}/bulk`, { members });
    return response.data;
  },

  async updateMemberRole(id: number, role: CommitteeRole): Promise<CommitteeMember> {
    const roleId = await this.getRoleId(role);
    const response = await api.patch(`${BASE_URL}/${id}/role`, { role, role_id: roleId });
    return response.data;
  },

  async deactivateMember(id: number): Promise<CommitteeMember> {
    const response = await api.patch(`${BASE_URL}/${id}/deactivate`);
    return response.data;
  },

  async activateMember(id: number): Promise<CommitteeMember> {
    const response = await api.patch(`${BASE_URL}/${id}/activate`);
    return response.data;
  },

  // Committee roles
  async getCommitteeRoles(): Promise<{ value: CommitteeRole; label: string }[]> {
    return [
      { value: CommitteeRole.PRESIDENT, label: 'Presidente' },
      { value: CommitteeRole.VICE_PRESIDENT, label: 'Vicepresidente' },
      { value: CommitteeRole.SECRETARY, label: 'Secretario' },
      { value: CommitteeRole.MEMBER, label: 'Vocal' },
      { value: CommitteeRole.ALTERNATE, label: 'Representante Empleados' },
    ];
  },

  // Get committee roles from backend
  async getCommitteeRolesFromBackend(): Promise<any[]> {
    const response = await api.get(`${BASE_URL}/roles`);
    return response.data;
  },

  // Get role_id for a given role enum
  async getRoleId(role: CommitteeRole): Promise<number> {
    const roles = await this.getCommitteeRolesFromBackend();
    const roleMapping: { [key in CommitteeRole]: string } = {
      [CommitteeRole.PRESIDENT]: 'Presidente',
      [CommitteeRole.VICE_PRESIDENT]: 'Vicepresidente', 
      [CommitteeRole.SECRETARY]: 'Secretario',
      [CommitteeRole.MEMBER]: 'Vocal',
      [CommitteeRole.ALTERNATE]: 'Representante Empleados',
    };
    
    const backendRoleName = roleMapping[role];
    const foundRole = roles.find(r => r.name === backendRoleName);
    
    if (!foundRole) {
      throw new Error(`Role ${role} not found in backend`);
    }
    
    return foundRole.id;
  },

  // Get active members for a committee
  async getActiveMembers(committeeId: number): Promise<CommitteeMember[]> {
    const response = await api.get(`${BASE_URL}?committee_id=${committeeId}&is_active=true`);
    return response.data;
  },

  // Get member history
  async getMemberHistory(userId: number): Promise<CommitteeMember[]> {
    const response = await api.get(`${BASE_URL}/user/${userId}/history`);
    return response.data;
  },

  // Remove member (alias for deleteCommitteeMember)
  async removeMember(memberId: number): Promise<void> {
    try {
      await api.delete(`${BASE_URL}/${memberId}`);
    } catch (error) {
      console.error('Error removing committee member:', error);
      throw error;
    }
  },
};