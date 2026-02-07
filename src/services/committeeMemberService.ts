import { apiService as api } from "./api";
import {
  CommitteeMember,
  CommitteeMemberCreate,
  CommitteeMemberUpdate,
  CommitteeRole,
} from "../types";

const BASE_URL = "/committee-members/";

export const committeeMemberService = {
  // Committee Member CRUD operations
  async getCommitteeMembers(committeeId: number): Promise<CommitteeMember[]> {
    const response = await api.get(`${BASE_URL}?committee_id=${committeeId}`);
    return response.data;
  },

  async getCommitteeMember(id: number): Promise<CommitteeMember> {
    const response = await api.get(`${BASE_URL}${id}`);
    return response.data;
  },

  async createCommitteeMember(
    member: CommitteeMemberCreate
  ): Promise<CommitteeMember> {
    const response = await api.post(BASE_URL, member);
    return response.data;
  },

  async updateCommitteeMember(
    id: number,
    member: CommitteeMemberUpdate
  ): Promise<CommitteeMember> {
    const response = await api.put(`${BASE_URL}${id}`, member);
    return response.data;
  },

  async deleteCommitteeMember(id: number): Promise<void> {
    await api.delete(`${BASE_URL}${id}`);
  },

  // Bulk operations
  async addMultipleMembers(
    members: CommitteeMemberCreate[]
  ): Promise<CommitteeMember[]> {
    const response = await api.post(`${BASE_URL}bulk`, { members });
    return response.data;
  },

  async updateMemberRole(
    id: number,
    role: CommitteeRole
  ): Promise<CommitteeMember> {
    const roleId = await this.getRoleId(role);
    const response = await api.put(`${BASE_URL}${id}`, {
      role,
      role_id: roleId,
    });
    return response.data;
  },

  async deactivateMember(id: number, reason?: string): Promise<CommitteeMember> {
    const url = reason 
      ? `${BASE_URL}${id}/deactivate?reason=${encodeURIComponent(reason)}`
      : `${BASE_URL}${id}/deactivate`;
    const response = await api.post(url);
    return response.data;
  },

  async activateMember(id: number, reason?: string): Promise<CommitteeMember> {
    const url = reason 
      ? `${BASE_URL}${id}/activate?reason=${encodeURIComponent(reason)}` 
      : `${BASE_URL}${id}/activate`;
    const response = await api.post(url);
    return response.data;
  },

  // Committee roles
  async getCommitteeRoles(): Promise<
    { value: CommitteeRole; label: string }[]
  > {
    return [
      { value: CommitteeRole.PRESIDENT, label: "Presidente" },
      { value: CommitteeRole.VICE_PRESIDENT, label: "Vicepresidente" },
      { value: CommitteeRole.SECRETARY, label: "Secretario" },
      { value: CommitteeRole.MEMBER, label: "Vocal" },
      { value: CommitteeRole.ALTERNATE, label: "Representante Empleados" },
    ];
  },

  // Get committee roles from backend
  async getCommitteeRolesFromBackend(): Promise<any[]> {
    const response = await api.get(`${BASE_URL}roles`);
    return response.data;
  },

  // Get role_id for a given role enum
  async getRoleId(role: CommitteeRole): Promise<number> {
    const roles = await this.getCommitteeRolesFromBackend();
    
    // Mapping from Enum to possible backend names (case insensitive search recommended but we'll try exact matches first)
    const roleMapping: { [key in CommitteeRole]: string[] } = {
      [CommitteeRole.PRESIDENT]: ["Presidente", "President"],
      [CommitteeRole.VICE_PRESIDENT]: ["Vicepresidente", "Vice President"],
      [CommitteeRole.SECRETARY]: ["Secretario", "Secretary"],
      [CommitteeRole.MEMBER]: ["Miembro", "Vocal", "Member"],
      [CommitteeRole.ALTERNATE]: ["Suplente", "Representante Empleados", "Alternate"],
    };

    const targetNames = roleMapping[role];
    const foundRole = roles.find((r) => targetNames.includes(r.name));

    if (!foundRole) {
      console.error(`Role ${role} not found in backend. Available roles:`, roles.map((r: any) => r.name));
      // Fallback: try to find by ID if the role enum matches the name property loosely? 
      // Or just fail. But logging helps debugging.
      
      // Attempt blindly fast fix: if roles has "Miembro" and we looked for "Vocal", we found it now.
      // If we are here, it means NONE of the aliases matched.
      throw new Error(`Role ${role} not found in backend. Names searched: ${targetNames.join(", ")}`);
    }

    return foundRole.id;
  },

  // Get active members for a committee
  async getActiveMembers(committeeId: number): Promise<CommitteeMember[]> {
    const response = await api.get(
      `${BASE_URL}?committee_id=${committeeId}&is_active=true`
    );
    return response.data;
  },

  // Get member history
  async getMemberHistory(userId: number): Promise<CommitteeMember[]> {
    const response = await api.get(`${BASE_URL}user/${userId}/history`);
    return response.data;
  },

  // Remove member (alias for deleteCommitteeMember)
  async removeMember(memberId: number): Promise<void> {
    try {
      await api.delete(`${BASE_URL}${memberId}`);
    } catch (error) {
      console.error("Error removing committee member:", error);
      throw error;
    }
  },
};
