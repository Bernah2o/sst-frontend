import { apiService as api } from "./api";
import {
  Committee,
  CommitteeCreate,
  CommitteeUpdate,
  CommitteeListFilters,
  CommitteeType,
} from "../types";

const BASE_URL = "/committees/";

export const committeeService = {
  // Committee CRUD operations
  async getCommittees(
    filters?: CommitteeListFilters
  ): Promise<{
    items: Committee[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.committee_type)
      params.append("committee_type", filters.committee_type);
    if (filters?.is_active !== undefined)
      params.append("is_active", filters.is_active.toString());
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page && filters?.page_size) {
      params.append("skip", ((filters.page - 1) * filters.page_size).toString());
      params.append("limit", filters.page_size.toString());
    }

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    const data = response.data;
    return {
      items: data.items || [],
      total: data.total || 0,
      page: data.page || filters?.page || 1,
      page_size: data.size || filters?.page_size || 10,
      total_pages: data.pages || 0,
    };
  },

  async getCommittee(id: number): Promise<Committee> {
    const response = await api.get(`${BASE_URL}${id}`);
    return response.data;
  },

  async createCommittee(committee: CommitteeCreate): Promise<Committee> {
    const response = await api.post(BASE_URL, committee);
    return response.data;
  },

  async updateCommittee(
    id: number,
    committee: CommitteeUpdate
  ): Promise<Committee> {
    const response = await api.put(`${BASE_URL}${id}`, committee);
    return response.data;
  },

  async deleteCommittee(id: number): Promise<void> {
    await api.delete(`${BASE_URL}${id}`);
  },

  // Committee dashboard
  async getCommitteeDashboard(id: number): Promise<any> {
    const response = await api.get(`${BASE_URL}${id}/stats`);
    return response.data;
  },

  // Committee types
  async getCommitteeTypes(): Promise<
    { value: CommitteeType; label: string }[]
  > {
    return [
      { value: CommitteeType.CONVIVENCIA, label: "Comité de Convivencia" },
      { value: CommitteeType.COPASST, label: "COPASST" },
    ];
  },

  // Get committee types from backend with IDs
  async getCommitteeTypesFromBackend(): Promise<
    { id: number; name: string; committee_type: CommitteeType }[]
  > {
    try {
      const response = await api.get(`${BASE_URL}types`);

      // Helper function to get display name
      const getDisplayName = (typeName: string): string => {
        switch (typeName.toLowerCase()) {
          case "convivencia":
            return "Comité de Convivencia";
          case "copasst":
            return "COPASST (Comité Paritario de Seguridad y Salud en el Trabajo)";
          default:
            return typeName;
        }
      };

      // Map backend response to frontend format
      return response.data.map((type: any) => {
        // Mapear el nombre del backend a los valores del enum del frontend
        let committee_type: string;
        switch (type.name.toLowerCase()) {
          case "convivencia":
            committee_type = "convivencia";
            break;
          case "copasst":
            committee_type = "copasst";
            break;
          default:
            committee_type = type.name.toLowerCase();
        }

        return {
          id: type.id,
          name: getDisplayName(type.name), // Use proper display name
          committee_type: committee_type,
        };
      });
    } catch (error) {
      console.error("Error fetching committee types from backend:", error);
      throw error;
    }
  },

  // Check user access to committee
  async checkUserAccess(committeeId: number): Promise<boolean> {
    try {
      await this.getCommittee(committeeId);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get committees accessible to current user
  async getUserCommittees(): Promise<Committee[]> {
    const { committeePermissionService } = await import('./committeePermissionService');
    const accessibleCommittees = await committeePermissionService.getUserAccessibleCommittees();

    const uniqueCommitteeIds = Array.from(
      new Set(accessibleCommittees.map((item) => item.committee_id))
    );
    const committees = await Promise.all(
      uniqueCommitteeIds.map((committeeId) => this.getCommittee(committeeId))
    );

    return committees;
  },
};
