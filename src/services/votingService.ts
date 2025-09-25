import { apiService as api } from './api';
import {
  Voting,
  VotingCreate,
  VotingUpdate,
  VotingListFilters,
  Vote,
  VoteCreate,
  VoteUpdate,
  VotingResults,
  VotingStatus,
  VoteChoice,
} from '../types';

const BASE_URL = '/committee-votings';

export const votingService = {
  // Voting CRUD operations
  async getVotings(filters?: VotingListFilters): Promise<{ items: Voting[]; total: number; page: number; page_size: number; total_pages: number }> {
    if (!filters?.committee_id) {
      throw new Error('committee_id is required for getVotings');
    }
    
    const params = new URLSearchParams();
    if (filters?.meeting_id) params.append('meeting_id', filters.meeting_id.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`${BASE_URL}/committee/${filters.committee_id}${queryString}`);
    return response.data;
  },

  async getVoting(id: number, committeeId: number): Promise<Voting> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createVoting(voting: VotingCreate, committeeId: number): Promise<Voting> {
    const response = await api.post(`${BASE_URL}`, voting);
    return response.data;
  },

  async updateVoting(id: number, voting: VotingUpdate, committeeId: number): Promise<Voting> {
    const response = await api.put(`${BASE_URL}/${id}`, voting);
    return response.data;
  },

  async deleteVoting(id: number, committeeId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Voting status operations
  async startVoting(id: number, committeeId: number): Promise<Voting> {
    const response = await api.post(`${BASE_URL}/${id}/start`);
    return response.data;
  },

  async closeVoting(id: number, committeeId: number): Promise<Voting> {
    const response = await api.post(`${BASE_URL}/${id}/complete`);
    return response.data;
  },

  async cancelVoting(id: number, committeeId: number, reason?: string): Promise<Voting> {
    const response = await api.post(`${BASE_URL}/${id}/cancel`, { reason });
    return response.data;
  },

  // Vote operations
  async getVotes(votingId: number, committeeId: number): Promise<Vote[]> {
    const response = await api.get(`${BASE_URL}/${votingId}/votes`);
    return response.data;
  },

  async castVote(vote: VoteCreate, committeeId: number): Promise<Vote> {
    const response = await api.post(`${BASE_URL}/${vote.voting_id}/votes`, vote);
    return response.data;
  },

  async updateVote(id: number, vote: VoteUpdate, committeeId: number, votingId: number): Promise<Vote> {
    const response = await api.put(`${BASE_URL}/${votingId}/votes/${id}`, vote);
    return response.data;
  },

  async deleteVote(id: number, committeeId: number, votingId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${votingId}/votes/${id}`);
  },

  // Results and statistics
  async getVotingResults(votingId: number, committeeId: number): Promise<VotingResults> {
    const response = await api.get(`${BASE_URL}/${votingId}/results`);
    return response.data;
  },

  async getVotingStatistics(votingId: number, committeeId: number): Promise<any> {
    const response = await api.get(`${BASE_URL}/${votingId}/statistics`);
    return response.data;
  },

  // User voting permissions and status
  async canUserVote(votingId: number, committeeId: number): Promise<boolean> {
    try {
      const response = await api.get(`${BASE_URL}/${votingId}/can-vote`);
      return response.data.can_vote;
    } catch (error) {
      console.error('Error checking if user can vote:', error);
      return false;
    }
  },

  async hasUserVoted(votingId: number, committeeId: number): Promise<boolean> {
    try {
      const response = await api.get(`${BASE_URL}/${votingId}/has-voted`);
      return response.data.has_voted;
    } catch (error) {
      console.error('Error checking if user has voted:', error);
      return false;
    }
  },

  async getUserVote(votingId: number, committeeId: number): Promise<Vote | null> {
    try {
      const response = await api.get(`${BASE_URL}/${votingId}/user-vote`);
      return response.data;
    } catch (error) {
      console.error('Error getting user vote:', error);
      return null;
    }
  },

  // Voting status options
  async getVotingStatuses(): Promise<{ value: VotingStatus; label: string }[]> {
    return [
      { value: VotingStatus.DRAFT, label: 'Borrador' },
      { value: VotingStatus.ACTIVE, label: 'Activa' },
      { value: VotingStatus.CLOSED, label: 'Cerrada' },
      { value: VotingStatus.CANCELLED, label: 'Cancelada' },
    ];
  },

  // Vote choice options
  async getVoteChoices(): Promise<{ value: VoteChoice; label: string }[]> {
    return [
      { value: VoteChoice.YES, label: 'Sí' },
      { value: VoteChoice.NO, label: 'No' },
      { value: VoteChoice.ABSTAIN, label: 'Abstención' },
    ];
  },

  // Get active votings for a committee
  async getActiveVotings(committeeId: number): Promise<Voting[]> {
    const response = await api.get(`${BASE_URL}/committee/${committeeId}?status=active`);
    return response.data;
  },

  // Export voting results
  async exportVotingResults(votingId: number, committeeId: number, format: 'pdf' | 'excel'): Promise<Blob> {
    const response = await api.get(`${BASE_URL}/${votingId}/export/${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Validate quorum for voting
  async validateQuorum(votingId: number, committeeId: number): Promise<{ has_quorum: boolean; current_votes: number; required_votes: number }> {
    const response = await api.get(`${BASE_URL}/${votingId}/quorum`);
    return response.data;
  },

  // Send voting notifications
  async sendVotingNotifications(votingId: number, committeeId: number): Promise<void> {
    await api.post(`${BASE_URL}/${votingId}/notify`);
  },
};