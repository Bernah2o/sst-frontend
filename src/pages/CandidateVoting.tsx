import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import candidateVotingService from '../services/candidateVotingService';
import {
  CandidateVotingResponse,
  CandidateVotingDetailResponse,
  CandidateVotingCandidateResponse,
  CandidateVoteCreate,
  CandidateVotingStatus,
} from '../types';

const CandidateVoting: React.FC = () => {
  const [activeVotings, setActiveVotings] = useState<CandidateVotingResponse[]>([]);
  const [selectedVoting, setSelectedVoting] = useState<CandidateVotingDetailResponse | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    loadActiveVotings();
  }, []);

  const loadActiveVotings = async () => {
    try {
      setLoading(true);
      const votings = await candidateVotingService.getActiveVotings();
      setActiveVotings(votings);
    } catch (error) {
      console.error('Error loading active votings:', error);
      setError('Error al cargar las votaciones activas');
    } finally {
      setLoading(false);
    }
  };

  const loadVotingDetail = async (votingId: number) => {
    try {
      setLoading(true);
      const detail = await candidateVotingService.getVotingDetail(votingId);
      setSelectedVoting(detail);
      setSelectedCandidates([]);
    } catch (error) {
      console.error('Error loading voting detail:', error);
      setError('Error al cargar los detalles de la votación');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateToggle = (candidateId: number) => {
    if (!selectedVoting) return;

    const isSelected = selectedCandidates.includes(candidateId);
    
    if (isSelected) {
      setSelectedCandidates(prev => prev.filter(id => id !== candidateId));
    } else {
      if (selectedCandidates.length < selectedVoting.max_votes_per_user) {
        setSelectedCandidates(prev => [...prev, candidateId]);
      }
    }
  };

  const handleVote = async () => {
    if (!selectedVoting || selectedCandidates.length === 0) return;

    try {
      setVoting(true);
      setError(null);

      // Enviar votos para cada candidato seleccionado
      for (const candidateId of selectedCandidates) {
        const voteData: CandidateVoteCreate = {
          voting_id: selectedVoting.id,
          candidate_id: candidateId,
        };
        await candidateVotingService.vote(voteData);
      }

      setSuccess('¡Su voto ha sido registrado exitosamente!');
      setConfirmDialogOpen(false);
      
      // Recargar detalles de la votación
      await loadVotingDetail(selectedVoting.id);
    } catch (error) {
      console.error('Error voting:', error);
      setError('Error al registrar su voto');
    } finally {
      setVoting(false);
    }
  };

  const isVotingActive = (voting: CandidateVotingResponse) => {
    const now = new Date();
    const startDate = new Date(voting.start_date);
    const endDate = new Date(voting.end_date);
    return voting.status === CandidateVotingStatus.ACTIVE && 
           isAfter(now, startDate) && 
           isBefore(now, endDate);
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Finalizada';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && !selectedVoting) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Votaciones de Candidatos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {!selectedVoting ? (
        // Lista de votaciones activas
        <Grid container spacing={3}>
          {activeVotings.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box textAlign="center" py={4}>
                    <VoteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No hay votaciones activas en este momento
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            activeVotings.map((voting) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={voting.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 }
                  }}
                  onClick={() => loadVotingDetail(voting.id)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <VoteIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        {voting.title}
                      </Typography>
                    </Box>
                    
                    {voting.description && (
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {voting.description}
                      </Typography>
                    )}

                    <Box mb={2}>
                      <Chip
                        label={voting.committee_type?.name || 'N/A'}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    <Box display="flex" alignItems="center" mb={1}>
                      <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Finaliza: {format(new Date(voting.end_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Tiempo restante: {getTimeRemaining(voting.end_date)}
                      </Typography>
                      {isVotingActive(voting) && (
                        <Chip label="Activa" color="success" size="small" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      ) : (
        // Detalles de votación y candidatos
        <Box>
          <Button 
            variant="outlined" 
            onClick={() => setSelectedVoting(null)}
            sx={{ mb: 3 }}
          >
            ← Volver a votaciones
          </Button>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {selectedVoting.title}
              </Typography>
              
              {selectedVoting.description && (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {selectedVoting.description}
                </Typography>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Tipo de Comité:</strong> {selectedVoting.committee_type?.name}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Votos por usuario:</strong> {selectedVoting.max_votes_per_user}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Ganadores:</strong> {selectedVoting.winner_count}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Finaliza:</strong> {format(new Date(selectedVoting.end_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </Typography>
                </Grid>
              </Grid>

              {selectedVoting.has_voted ? (
                <Alert severity="success" icon={<CheckIcon />}>
                  Ya has emitido tu voto en esta votación
                </Alert>
              ) : selectedVoting.can_vote ? (
                <Alert severity="info">
                  Puedes votar por hasta {selectedVoting.max_votes_per_user} candidato(s).
                  Votos seleccionados: {selectedCandidates.length}/{selectedVoting.max_votes_per_user}
                </Alert>
              ) : (
                <Alert severity="warning">
                  Esta votación no está disponible para votar en este momento
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Lista de candidatos */}
          <Typography variant="h6" gutterBottom>
            Candidatos
          </Typography>

          <Grid container spacing={2}>
            {selectedVoting.candidates.map((candidate) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={candidate.id}>
                <Card 
                  sx={{ 
                    border: selectedCandidates.includes(candidate.id) ? 2 : 1,
                    borderColor: selectedCandidates.includes(candidate.id) ? 'primary.main' : 'divider',
                    cursor: selectedVoting.can_vote && !selectedVoting.has_voted ? 'pointer' : 'default',
                    opacity: selectedVoting.has_voted ? 0.7 : 1,
                  }}
                  onClick={() => {
                    if (selectedVoting.can_vote && !selectedVoting.has_voted) {
                      handleCandidateToggle(candidate.id);
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6">
                          {candidate.worker?.first_name} {candidate.worker?.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {candidate.worker?.document_number}
                        </Typography>
                      </Box>
                      {selectedVoting.can_vote && !selectedVoting.has_voted && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedCandidates.includes(candidate.id)}
                              onChange={() => handleCandidateToggle(candidate.id)}
                              disabled={
                                !selectedCandidates.includes(candidate.id) && 
                                selectedCandidates.length >= selectedVoting.max_votes_per_user
                              }
                            />
                          }
                          label=""
                        />
                      )}
                    </Box>

                    {candidate.worker?.position && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Cargo:</strong> {candidate.worker.position}
                      </Typography>
                    )}

                    {candidate.worker?.department && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Departamento:</strong> {candidate.worker.department}
                      </Typography>
                    )}

                    {selectedVoting.status === CandidateVotingStatus.CLOSED && selectedVoting.results && (
                      <Box mt={2}>
                        <Divider sx={{ mb: 1 }} />
                        <Typography variant="body2">
                          <strong>Votos:</strong> {candidate.vote_count} ({candidate.vote_percentage.toFixed(1)}%)
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={candidate.vote_percentage} 
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Botón de votar */}
          {selectedVoting.can_vote && !selectedVoting.has_voted && (
            <Box mt={3} textAlign="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<VoteIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                disabled={selectedCandidates.length === 0}
              >
                Emitir Voto ({selectedCandidates.length} candidato{selectedCandidates.length !== 1 ? 's' : ''})
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Dialog de confirmación */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirmar Voto</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            ¿Está seguro de que desea votar por los siguientes candidatos?
          </Typography>
          <Box mt={2}>
            {selectedVoting && selectedCandidates.map(candidateId => {
              const candidate = selectedVoting.candidates.find(c => c.id === candidateId);
              return candidate ? (
                <Typography key={candidateId} variant="body2">
                  • {candidate.worker?.first_name} {candidate.worker?.last_name}
                </Typography>
              ) : null;
            })}
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Una vez emitido, su voto no podrá ser modificado.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={voting}>
            Cancelar
          </Button>
          <Button onClick={handleVote} variant="contained" disabled={voting}>
            {voting ? <CircularProgress size={24} /> : 'Confirmar Voto'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateVoting;