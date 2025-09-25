import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as ActivateIcon,
  Stop as CloseIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  HowToVote as VoteIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import candidateVotingService from '../services/candidateVotingService';
import CandidateVotingDetailsModal from '../components/CandidateVotingDetailsModal';
import {
  CandidateVotingResponse,
  CandidateVotingStatsResponse,
  CandidateVotingStatus,
} from '../types';

const CandidateVotingAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [votings, setVotings] = useState<CandidateVotingResponse[]>([]);
  const [stats, setStats] = useState<CandidateVotingStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedVoting, setSelectedVoting] = useState<CandidateVotingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CandidateVotingStatus | 'all'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [votingsData, statsData, committeeTypesData] = await Promise.all([
        candidateVotingService.getAllVotings(),
        candidateVotingService.getStats(),
        candidateVotingService.getCommitteeTypes(),
      ]);
      
      // Mapear los tipos de comité a las votaciones
      const votingsWithCommitteeTypes: CandidateVotingResponse[] = votingsData.map(voting => ({
        ...voting,
        committee_type: voting.committee_type_id 
          ? committeeTypesData.find(type => type.id === voting.committee_type_id) || undefined
          : undefined
      }));
      
      setVotings(votingsWithCommitteeTypes);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateVoting = async (voting: CandidateVotingResponse) => {
    try {
      await candidateVotingService.activateVoting(voting.id);
      await loadData();
    } catch (error) {
      console.error('Error activating voting:', error);
      setError('Error al activar la votación');
    }
  };

  const handleCloseVoting = async (voting: CandidateVotingResponse) => {
    try {
      await candidateVotingService.closeVoting(voting.id);
      await loadData();
    } catch (error) {
      console.error('Error closing voting:', error);
      setError('Error al cerrar la votación');
    }
  };

  const handleDeleteVoting = async () => {
    if (!selectedVoting) return;

    try {
      await candidateVotingService.deleteVoting(selectedVoting.id);
      await loadData();
      setDeleteDialogOpen(false);
      setSelectedVoting(null);
    } catch (error) {
      console.error('Error deleting voting:', error);
      setError('Error al eliminar la votación');
    }
  };

  const handleViewDetails = (voting: CandidateVotingResponse) => {
    setSelectedVoting(voting);
    setDetailsModalOpen(true);
  };

  const handleCardClick = (filter: CandidateVotingStatus | 'all') => {
    setStatusFilter(filter);
  };

  const getFilteredVotings = () => {
    if (statusFilter === 'all') {
      return votings;
    }
    return votings.filter(voting => voting.status === statusFilter);
  };

  const getStatusColor = (status: CandidateVotingStatus) => {
    switch (status) {
      case CandidateVotingStatus.DRAFT:
        return 'default';
      case CandidateVotingStatus.ACTIVE:
        return 'success';
      case CandidateVotingStatus.CLOSED:
        return 'info';
      case CandidateVotingStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: CandidateVotingStatus) => {
    switch (status) {
      case CandidateVotingStatus.DRAFT:
        return 'Borrador';
      case CandidateVotingStatus.ACTIVE:
        return 'Activa';
      case CandidateVotingStatus.CLOSED:
        return 'Cerrada';
      case CandidateVotingStatus.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Administración de Votaciones de Candidatos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/candidate-votings/new')}
        >
          Nueva Votación
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: statusFilter === 'all' ? 2 : 1,
                borderColor: statusFilter === 'all' ? 'primary.main' : 'divider',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: 3 
                }
              }}
              onClick={() => handleCardClick('all')}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <VoteIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.total_votings}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Votaciones
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: statusFilter === CandidateVotingStatus.ACTIVE ? 2 : 1,
                borderColor: statusFilter === CandidateVotingStatus.ACTIVE ? 'success.main' : 'divider',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: 3 
                }
              }}
              onClick={() => handleCardClick(CandidateVotingStatus.ACTIVE)}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ScheduleIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.active_votings}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Votaciones Activas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: statusFilter === CandidateVotingStatus.CLOSED ? 2 : 1,
                borderColor: statusFilter === CandidateVotingStatus.CLOSED ? 'info.main' : 'divider',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: 3 
                }
              }}
              onClick={() => handleCardClick(CandidateVotingStatus.CLOSED)}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PeopleIcon color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.closed_votings}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Votaciones Cerradas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: statusFilter === CandidateVotingStatus.DRAFT ? 2 : 1,
                borderColor: statusFilter === CandidateVotingStatus.DRAFT ? 'warning.main' : 'divider',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: 3 
                }
              }}
              onClick={() => handleCardClick(CandidateVotingStatus.DRAFT)}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUpIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.draft_votings}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Votaciones en Borrador
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabla de votaciones */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">
              Lista de Votaciones
              {statusFilter !== 'all' && (
                <Chip
                  label={`Filtro: ${getStatusLabel(statusFilter as CandidateVotingStatus)}`}
                  size="small"
                  color="primary"
                  sx={{ ml: 2 }}
                  onDelete={() => setStatusFilter('all')}
                />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getFilteredVotings().length} de {votings.length} votaciones
            </Typography>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Tipo de Comité</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Participación</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredVotings().map((voting) => (
                  <TableRow key={voting.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{voting.title}</Typography>
                      {voting.description && (
                        <Typography variant="body2" color="text.secondary">
                          {voting.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {voting.committee_type?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(voting.status)}
                        color={getStatusColor(voting.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(voting.start_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(voting.end_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {voting.participation_rate ? `${voting.participation_rate.toFixed(1)}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(voting)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {voting.status === CandidateVotingStatus.DRAFT && (
                          <>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/candidate-voting/edit/${voting.id}`)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Activar">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleActivateVoting(voting)}
                              >
                                <ActivateIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {voting.status === CandidateVotingStatus.ACTIVE && (
                          <Tooltip title="Cerrar votación">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleCloseVoting(voting)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {voting.status === CandidateVotingStatus.DRAFT && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedVoting(voting);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar la votación "{selectedVoting?.title}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteVoting} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de detalles de votación */}
      <CandidateVotingDetailsModal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedVoting(null);
        }}
        voting={selectedVoting}
      />
    </Box>
  );
};

export default CandidateVotingAdmin;