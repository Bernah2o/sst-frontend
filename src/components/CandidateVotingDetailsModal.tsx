import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  HowToVote as VoteIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import candidateVotingService from '../services/candidateVotingService';
import {
  CandidateVotingDetailResponse,
  CandidateVotingResponse,
  CandidateVotingStatus,
} from '../types';

interface CandidateVotingDetailsModalProps {
  open: boolean;
  onClose: () => void;
  voting: CandidateVotingResponse | null;
}

const CandidateVotingDetailsModal: React.FC<CandidateVotingDetailsModalProps> = ({
  open,
  onClose,
  voting,
}) => {
  const [details, setDetails] = useState<CandidateVotingDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && voting) {
      loadVotingDetails();
    }
  }, [open, voting]);

  const loadVotingDetails = async () => {
    if (!voting) return;

    try {
      setLoading(true);
      setError(null);
      const [detailsData, , workersData] = await Promise.all([
        candidateVotingService.getVotingDetail(voting.id),
        candidateVotingService.getCommitteeTypes(),
        candidateVotingService.getActiveWorkers()
      ]);
      
      // El committee_type ya viene como string del backend
      const detailsWithCommitteeType: CandidateVotingDetailResponse = {
        ...detailsData
      };
      
      // Calcular porcentajes y tasa de participación
      const totalVotes = detailsWithCommitteeType.total_votes || 0;
      const totalVoters = detailsWithCommitteeType.total_voters || 0;
      
      // Calcular porcentajes de candidatos
      const candidatesWithPercentages = detailsWithCommitteeType.candidates?.map(candidate => ({
        ...candidate,
        vote_percentage: totalVotes > 0 ? (candidate.vote_count / totalVotes) * 100 : 0
      })) || [];
      
      // Calcular tasa de participación usando el número total de trabajadores elegibles
      const totalEligibleWorkers = workersData.length;
      const participationRate = totalEligibleWorkers > 0 ? (totalVoters / totalEligibleWorkers) * 100 : 0;
      
      const finalDetails = {
        ...detailsWithCommitteeType,
        candidates: candidatesWithPercentages,
        participation_rate: participationRate
      };
      
      setDetails(finalDetails);
    } catch (error) {
      console.error('Error loading voting details:', error);
      setError('Error al cargar los detalles de la votación');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: CandidateVotingStatus) => {
    switch (status) {
      case CandidateVotingStatus.ACTIVE:
        return 'success';
      case CandidateVotingStatus.CLOSED:
        return 'default';
      case CandidateVotingStatus.DRAFT:
        return 'warning';
      case CandidateVotingStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: CandidateVotingStatus) => {
    switch (status) {
      case CandidateVotingStatus.ACTIVE:
        return 'Activa';
      case CandidateVotingStatus.CLOSED:
        return 'Cerrada';
      case CandidateVotingStatus.DRAFT:
        return 'Borrador';
      case CandidateVotingStatus.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (!voting) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" component="div">
            {voting.title}
          </Typography>
          <Chip
            label={getStatusLabel(voting.status)}
            color={getStatusColor(voting.status)}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : details ? (
          <Box>
            {/* Información General */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Información General
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Descripción
                      </Typography>
                      <Typography variant="body1">
                        {details.description || 'Sin descripción'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tipo de Comité
                      </Typography>
                      <Typography variant="body1">
                        {details.committee_type || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de Inicio
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(details.start_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de Fin
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(details.end_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Estadísticas
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                          <VoteIcon color="primary" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="h4" color="primary">
                              {details.total_votes || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total Votos
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                          <GroupIcon color="secondary" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="h4" color="secondary">
                              {details.total_voters || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Participantes
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tasa de Participación
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={details.participation_rate || 0}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {(details.participation_rate || 0).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Resultados de Candidatos */}
            <Typography variant="h6" gutterBottom>
              Resultados de Candidatos
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Candidato</TableCell>
                    <TableCell>Posición</TableCell>
                    <TableCell>Departamento</TableCell>
                    <TableCell align="center">Votos</TableCell>
                    <TableCell align="center">Porcentaje</TableCell>
                    <TableCell align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.candidates
                    ?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                    .map((candidate, index) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {candidate.worker?.first_name} {candidate.worker?.last_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {candidate.worker?.document_number}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1">
                            {candidate.worker?.position || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1">
                            {candidate.worker?.department || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="h6" color="primary">
                            {candidate.vote_count || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {(candidate.vote_percentage || 0).toFixed(1)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={candidate.vote_percentage || 0}
                              sx={{ mt: 1, height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {index < (details.winner_count || 1) && details.status === CandidateVotingStatus.CLOSED ? (
                            <Chip
                              label="Ganador"
                              color="success"
                              size="small"
                              icon={<TrendingUpIcon />}
                            />
                          ) : (
                            <Chip
                              label="Candidato"
                              color="default"
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            {details.candidates?.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No hay candidatos registrados para esta votación
                </Typography>
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CandidateVotingDetailsModal;