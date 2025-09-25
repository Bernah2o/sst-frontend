import api from "./api";
import {
  CandidateVotingCreate,
  CandidateVotingUpdate,
  CandidateVotingResponse,
  CandidateVotingDetailResponse,
  CandidateVotingStatsResponse,
  CandidateVoteCreate,
  WorkerForVotingResponse,
} from "../types";

export const candidateVotingService = {
  // Estadísticas
  getStats: async (): Promise<CandidateVotingStatsResponse> => {
    const response = await api.get("/candidate-voting/stats");
    return response.data;
  },

  // Listar votaciones (para empleados - solo activas)
  getActiveVotings: async (): Promise<CandidateVotingResponse[]> => {
    const response = await api.get("/candidate-voting/active");
    // Manejar respuesta wrapeada del backend
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Si la respuesta está wrapeada, extraer el array
    return (
      response.data.items || response.data.data || response.data.votings || []
    );
  },

  // Listar todas las votaciones (para administradores)
  getAllVotings: async (params?: {
    status?: string;
    committee_type_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<CandidateVotingResponse[]> => {
    const response = await api.get("/candidate-voting/", { params });
    return response.data;
  },

  // Obtener detalles de una votación
  getVotingDetail: async (
    votingId: number
  ): Promise<CandidateVotingDetailResponse> => {
    const response = await api.get(`/candidate-voting/${votingId}`);
    return response.data;
  },

  // Crear nueva votación
  createVoting: async (
    data: CandidateVotingCreate
  ): Promise<CandidateVotingResponse> => {
    const response = await api.post("/candidate-voting/", data);
    return response.data;
  },

  // Actualizar votación
  updateVoting: async (
    votingId: number,
    data: CandidateVotingUpdate
  ): Promise<CandidateVotingResponse> => {
    const response = await api.put(`/candidate-voting/${votingId}`, data);
    return response.data;
  },

  // Activar votación
  activateVoting: async (
    votingId: number
  ): Promise<CandidateVotingResponse> => {
    const response = await api.post(`/candidate-voting/${votingId}/activate`);
    return response.data;
  },

  // Cerrar votación
  closeVoting: async (votingId: number): Promise<CandidateVotingResponse> => {
    const response = await api.post(`/candidate-voting/${votingId}/close`);
    return response.data;
  },

  // Eliminar votación
  deleteVoting: async (votingId: number): Promise<void> => {
    await api.delete(`/candidate-voting/${votingId}`);
  },

  // Emitir voto
  vote: async (data: CandidateVoteCreate): Promise<{ message: string }> => {
    const response = await api.post(
      `/candidate-voting/${data.voting_id}/vote`,
      data
    );
    return response.data;
  },

  // Obtener trabajadores activos para candidatos
  getActiveWorkers: async (): Promise<WorkerForVotingResponse[]> => {
    const response = await api.get("/workers/basic", {
      params: {
        is_active: true,
        limit: 1000,
      },
    });
    return response.data;
  },

  // Obtener tipos de comité
  getCommitteeTypes: async (): Promise<
    Array<{ id: number; name: string; description?: string }>
  > => {
    const response = await api.get("/committees/types");
    return response.data;
  },
};

export default candidateVotingService;
