import {
  HowToVote as VoteIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Container,
  Grid,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import candidateVotingService from '../services/candidateVotingService';
import { logger } from '../utils/logger';
import { CandidateVotingStatus } from '../types';

interface VotingCandidate {
  id: number;
  worker_id: number;
  vote_count: number;
  vote_percentage: number;
  worker?: {
    id: number;
    first_name: string;
    last_name: string;
    document_number: string;
    position?: string;
    department?: string;
  };
  // Información de la votación
  voting_id: number;
  voting_title: string;
  voting_description?: string;
  committee_type: string;
  start_date: string;
  end_date: string;
  max_votes_per_user: number;
  winner_count: number;
  is_anonymous: boolean;
  status: string;
  can_vote: boolean;
  has_voted: boolean;
  remaining_votes: number;
}

const EmployeeVotings: React.FC = () => {
  const theme = useTheme();
  
  const [candidates, setCandidates] = useState<VotingCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<VotingCandidate | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchVotings();
  }, []);

  const fetchVotings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Obtener votaciones activas de candidatos
      const votingsResponse = await candidateVotingService.getActiveVotings();
      
      if (!votingsResponse || votingsResponse.length === 0) {
        setCandidates([]);
        return;
      }
      
      const allCandidates: VotingCandidate[] = [];
      
      // Procesar directamente las votaciones activas sin llamadas adicionales
      votingsResponse.forEach((voting: any) => {
        // Verificar si la votación tiene candidatos
        const candidates = voting.candidates || [];
        if (candidates.length === 0) {
          return;
        }
        
        // Crear un candidato por cada candidato en la votación
        candidates.forEach((candidate: any) => {
          allCandidates.push({
            id: candidate.id,
            worker_id: candidate.worker_id,
            vote_count: candidate.vote_count || 0,
            vote_percentage: candidate.vote_percentage || 0,
            worker: candidate.worker,
            // Información de la votación
            voting_id: voting.id,
            voting_title: voting.title,
            voting_description: voting.description,
            committee_type: voting.committee_type || 'Sin especificar',
            start_date: voting.start_date,
            end_date: voting.end_date,
            max_votes_per_user: voting.max_votes_per_user,
            winner_count: voting.winner_count || 1,
            is_anonymous: voting.is_anonymous || false,
            status: CandidateVotingStatus.ACTIVE, // Las votaciones activas siempre tienen status 'active'
            can_vote: !voting.user_has_voted,
            has_voted: voting.user_has_voted || false,
            remaining_votes: voting.user_has_voted ? 0 : voting.max_votes_per_user,
          });
        });
      });
      
      setCandidates(allCandidates);
    } catch (error) {
      console.error('Error fetching votings:', error);
      logger.error('Error fetching votings:', error);
      setError(`Error al cargar las votaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClick = (candidate: VotingCandidate) => {
    setSelectedCandidate(candidate);
    setConfirmDialogOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;

    try {
      setVoting(true);
      setError(null);

      await candidateVotingService.vote({
        voting_id: selectedCandidate.voting_id,
        candidate_id: selectedCandidate.id,
      });

      setSuccess(`¡Has votado exitosamente por ${selectedCandidate.worker?.first_name} ${selectedCandidate.worker?.last_name}!`);
      setConfirmDialogOpen(false);
      setSelectedCandidate(null);
      
      // Recargar los datos para actualizar el estado
      await fetchVotings();
    } catch (error) {
      console.error('Error voting:', error);
      setError('Error al registrar tu voto. Por favor, intenta nuevamente.');
    } finally {
      setVoting(false);
    }
  };

  const handleCancelVote = () => {
    setConfirmDialogOpen(false);
    setSelectedCandidate(null);
  };

  const getStatusColor = (candidate: VotingCandidate): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    if (candidate.has_voted) return "success";
    if (!candidate.can_vote) return "error";
    if (candidate.status !== CandidateVotingStatus.ACTIVE) return "warning";
    return "primary";
  };

  const getStatusText = (candidate: VotingCandidate): string => {
    if (candidate.has_voted) return "Ya Votaste";
    if (!candidate.can_vote) return "No Disponible";
    if (candidate.status !== CandidateVotingStatus.ACTIVE) return "Inactiva";
    return "Disponible";
  };

  const getButtonText = (candidate: VotingCandidate): string => {
    if (candidate.has_voted) return "Ya Votaste";
    if (!candidate.can_vote) return "No Disponible";
    if (candidate.status !== CandidateVotingStatus.ACTIVE) return "Inactiva";
    return "Votar";
  };

  const canVoteForCandidate = (candidate: VotingCandidate): boolean => {
    return candidate.can_vote && !candidate.has_voted && candidate.status === CandidateVotingStatus.ACTIVE;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            color: theme.palette.primary.main,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <VoteIcon sx={{ fontSize: 48 }} />
          Mis Votaciones
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: theme.palette.text.secondary,
            mb: 3
          }}
        >
          Participa en las votaciones activas para elegir representantes
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}



      {candidates.length > 0 ? (
          <Grid container spacing={3}>
            {candidates.map((candidate) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${candidate.voting_id}-${candidate.id}`}>
                <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                  border: candidate.has_voted ? '2px solid' : 'none',
                  borderColor: candidate.has_voted ? 'success.main' : 'transparent',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Header con estado */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {candidate.voting_title}
                    </Typography>
                    <Chip
                      label={getStatusText(candidate)}
                      color={getStatusColor(candidate)}
                      size="small"
                    />
                  </Box>

                  {/* Información del candidato */}
                  <Box display="flex" alignItems="center" mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {candidate.worker?.first_name} {candidate.worker?.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.worker?.position || 'Candidato'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Información de la votación */}
                  <Box display="flex" alignItems="center" mb={1}>
                    <BusinessIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {candidate.committee_type}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <AccessTimeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Hasta: {formatDate(candidate.end_date)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={2}>
                    <VoteIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Votos restantes: {candidate.remaining_votes}
                    </Typography>
                  </Box>

                  {candidate.voting_description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {candidate.voting_description}
                    </Typography>
                  )}
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant={canVoteForCandidate(candidate) ? "contained" : "outlined"}
                    color={candidate.has_voted ? "success" : "primary"}
                    fullWidth
                    onClick={() => handleVoteClick(candidate)}
                    disabled={!canVoteForCandidate(candidate)}
                    startIcon={candidate.has_voted ? <CheckCircleIcon /> : <VoteIcon />}
                  >
                    {getButtonText(candidate)}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card 
          sx={{ 
            borderRadius: 3,
            border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
            background: alpha(theme.palette.primary.main, 0.02)
          }}
        >
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <VoteIcon 
              sx={{ 
                fontSize: 80, 
                color: alpha(theme.palette.primary.main, 0.3),
                mb: 2 
              }} 
            />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1
              }}
            >
              No hay candidatos disponibles
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: theme.palette.text.secondary,
                maxWidth: 400,
                mx: 'auto'
              }}
            >
              Actualmente no hay candidatos disponibles para votar.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmación */}
      <Dialog open={confirmDialogOpen} onClose={handleCancelVote}>
        <DialogTitle>
          Confirmar Voto
        </DialogTitle>
        <DialogContent>
          {selectedCandidate && (
            <Box>
              <Typography variant="body1" gutterBottom>
                ¿Estás seguro de que quieres votar por:
              </Typography>
              <Box display="flex" alignItems="center" mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedCandidate.worker?.first_name} {selectedCandidate.worker?.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCandidate.worker?.position || 'Candidato'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Para: {selectedCandidate.voting_title}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" mt={2}>
                Esta acción no se puede deshacer.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelVote} disabled={voting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmVote} 
            variant="contained" 
            disabled={voting}
            startIcon={voting ? <CircularProgress size={20} /> : <VoteIcon />}
          >
            {voting ? 'Votando...' : 'Confirmar Voto'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployeeVotings;