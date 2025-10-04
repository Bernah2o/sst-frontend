import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
  Grid,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  HowToVote as VoteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Cancel as CancelIcon,
  Assessment as ResultsIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { votingService } from '../services/votingService';
import { committeeService } from '../services/committeeService';
import { committeePermissionService } from '../services/committeePermissionService';
import { meetingService } from '../services/meetingService';
import VotingForm from '../components/VotingForm';
import {
  Voting,
  VotingStatus,
  VotingListFilters,
  VotingCreate,
  VotingUpdate,
  Committee,
  VotingResults,
  Meeting,
  MeetingStatus,
} from '../types';

const VotingManagement: React.FC = () => {
  const { id: committeeId } = useParams<{ id: string }>();
  const [votings, setVotings] = useState<Voting[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVoting, setSelectedVoting] = useState<Voting | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [votingResults, setVotingResults] = useState<VotingResults | null>(null);
  const [permissions, setPermissions] = useState<{ [key: number]: any }>({});
  const [filters, setFilters] = useState<VotingListFilters>({
    committee_id: committeeId ? parseInt(committeeId) : undefined,
    status: undefined,
    search: '',
  });

  // Estados para el formulario de votaciones
  const [votingFormOpen, setVotingFormOpen] = useState(false);
  const [editingVoting, setEditingVoting] = useState<Voting | undefined>(undefined);

  useEffect(() => {
    loadInitialData();
  }, []);

  // useEffect moved below to avoid use-before-define warning for loadVotings

  const loadInitialData = async () => {
    try {
      // Get user's accessible committees
      const accessibleCommittees = await committeePermissionService.getUserAccessibleCommittees();
      const committeeData = await Promise.all(
        accessibleCommittees.map(async (ac) => {
          const committee = await committeeService.getCommittee(ac.committee_id);
          return committee;
        })
      );
      setCommittees(committeeData);

      // Load permissions for each committee
      const permissionsMap: { [key: number]: any } = {};
      for (const committee of committeeData) {
        const canView = await committeePermissionService.canView(committee.id);
        const canManageVotings = await committeePermissionService.canManageVotings(committee.id);

        permissionsMap[committee.id] = {
          canView,
          canManageVotings,
        };
      }
      setPermissions(permissionsMap);
    } catch (err) {
      setError('Error al cargar los datos iniciales');
      console.error('Initial data loading error:', err);
    }
  };

  const loadVotings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const committeeIds = committees.map(c => c.id);
      if (committeeIds.length === 0) {
        setVotings([]);
        setTotalCount(0);
        return;
      }

      const response = await votingService.getVotings({
        ...filters,
        page: page + 1,
        page_size: rowsPerPage,
      });

      setVotings(response.items);
      setTotalCount(response.total);
    } catch (err) {
      setError('Error al cargar las votaciones');
      console.error('Votings loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [committees, filters, page, rowsPerPage]);

  useEffect(() => {
    loadVotings();
  }, [loadVotings]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, voting: Voting) => {
    setAnchorEl(event.currentTarget);
    setSelectedVoting(voting);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVoting(null);
  };

  const handleView = () => {
    if (selectedVoting) {
      setDetailsDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedVoting) {
      setEditingVoting(selectedVoting);
      setVotingFormOpen(true);
      loadMeetings();
    }
    handleMenuClose();
  };

  const handleStartVoting = async () => {
    if (selectedVoting && committeeId) {
      try {
        await votingService.startVoting(selectedVoting.id, parseInt(committeeId));
        loadVotings();
      } catch (err) {
        setError('Error al iniciar la votación');
        console.error('Start voting error:', err);
      }
    }
    handleMenuClose();
  };

  const handleCloseVoting = async () => {
    if (selectedVoting && committeeId) {
      try {
        await votingService.closeVoting(selectedVoting.id, parseInt(committeeId));
        loadVotings();
      } catch (err) {
        setError('Error al cerrar la votación');
        console.error('Close voting error:', err);
      }
    }
    handleMenuClose();
  };

  const handleCancelVoting = async () => {
    if (selectedVoting && committeeId) {
      try {
        await votingService.cancelVoting(selectedVoting.id, parseInt(committeeId));
        loadVotings();
      } catch (err) {
        setError('Error al cancelar la votación');
        console.error('Cancel voting error:', err);
      }
    }
    handleMenuClose();
  };

  const handleViewResults = async () => {
    if (selectedVoting && committeeId) {
      try {
        const results = await votingService.getVotingResults(selectedVoting.id, parseInt(committeeId));
        setVotingResults(results);
        setResultsDialogOpen(true);
      } catch (err) {
        setError('Error al cargar los resultados');
        console.error('Results loading error:', err);
      }
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedVoting && committeeId) {
      try {
        await votingService.deleteVoting(selectedVoting.id, parseInt(committeeId));
        setDeleteDialogOpen(false);
        setSelectedVoting(null);
        loadVotings();
      } catch (err) {
        setError('Error al eliminar la votación');
        console.error('Voting deletion error:', err);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedVoting(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof VotingListFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPage(0);
  };

  const handleFilterReset = () => {
    setFilters({
      committee_id: undefined,
      status: undefined,
      search: '',
    });
    setPage(0);
  };

  // Funciones para el formulario de votaciones
  const handleCreateVoting = () => {
    setEditingVoting(undefined);
    setVotingFormOpen(true);
    loadMeetings();
  };

  const loadMeetings = async () => {
    try {
      if (committeeId) {
        const meetingsData = await meetingService.getMeetings({
          committee_id: parseInt(committeeId),
          status: MeetingStatus.SCHEDULED,
        });
        setMeetings(meetingsData);
      }
    } catch (err) {
      console.error('Error loading meetings:', err);
    }
  };

  const handleVotingFormClose = () => {
    setVotingFormOpen(false);
    setEditingVoting(undefined);
  };

  const handleVotingSubmit = async (data: VotingCreate | VotingUpdate) => {
    try {
      if (editingVoting && committeeId) {
        // Editing existing voting
        await votingService.updateVoting(editingVoting.id, data as VotingUpdate, parseInt(committeeId));
      } else if (committeeId) {
        // Creating new voting
        await votingService.createVoting(data as VotingCreate, parseInt(committeeId));
      }
      
      loadVotings();
      setVotingFormOpen(false);
      setEditingVoting(undefined);
    } catch (err) {
      console.error('Voting submit error:', err);
      throw err; // Let the form handle the error display
    }
  };

  const getStatusLabel = (status: VotingStatus): string => {
    switch (status) {
      case VotingStatus.DRAFT:
        return 'Borrador';
      case VotingStatus.ACTIVE:
        return 'Activa';
      case VotingStatus.CLOSED:
        return 'Cerrada';
      case VotingStatus.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusColor = (status: VotingStatus): 'default' | 'primary' | 'success' | 'error' => {
    switch (status) {
      case VotingStatus.DRAFT:
        return 'default';
      case VotingStatus.ACTIVE:
        return 'primary';
      case VotingStatus.CLOSED:
        return 'success';
      case VotingStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  // Allow any authenticated user to create votings
  const canCreateVoting = true;

  const getVotingProgress = (voting: Voting): number => {
    if (!voting.eligible_voters || voting.eligible_voters === 0) return 0;
    return (voting.total_votes || 0) / voting.eligible_voters * 100;
  };

  if (loading && votings.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Votaciones
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateVoting}
            disabled={!canCreateVoting}
          >
            Nueva Votación
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Comité</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fechas</TableCell>
                  <TableCell>Participación</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {votings.map((voting) => (
                  <TableRow key={voting.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <VoteIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {voting.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {voting.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {committees.find(c => c.id === voting.meeting_id)?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(voting.status)}
                        size="small"
                        color={getStatusColor(voting.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Inicio: {new Date(voting.start_time).toLocaleDateString('es-ES')}
                      </Typography>
                      <Typography variant="body2">
                        Fin: {voting.end_time ? new Date(voting.end_time).toLocaleDateString('es-ES') : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {voting.total_votes || 0} / {voting.eligible_voters || 0} votos
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getVotingProgress(voting)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {getVotingProgress(voting).toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Más opciones">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, voting)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {votings.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" py={4}>
                        No se encontraron votaciones
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        {selectedVoting && permissions[selectedVoting.meeting_id]?.canManageVotings && (
          <>
            <MenuItem
              onClick={handleEdit}
              disabled={selectedVoting.status !== VotingStatus.DRAFT}
            >
              <EditIcon sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem
              onClick={handleStartVoting}
              disabled={selectedVoting.status !== VotingStatus.DRAFT}
            >
              <StartIcon sx={{ mr: 1 }} />
              Iniciar Votación
            </MenuItem>
            <MenuItem
              onClick={handleCloseVoting}
              disabled={selectedVoting.status !== VotingStatus.ACTIVE}
            >
              <StopIcon sx={{ mr: 1 }} />
              Cerrar Votación
            </MenuItem>
            <MenuItem
              onClick={handleCancelVoting}
              disabled={selectedVoting.status === VotingStatus.CLOSED || selectedVoting.status === VotingStatus.CANCELLED}
            >
              <CancelIcon sx={{ mr: 1 }} />
              Cancelar Votación
            </MenuItem>
          </>
        )}
        <MenuItem
          onClick={handleViewResults}
          disabled={selectedVoting?.status === VotingStatus.DRAFT}
        >
          <ResultsIcon sx={{ mr: 1 }} />
          Ver Resultados
        </MenuItem>
        {selectedVoting && permissions[selectedVoting.meeting_id]?.canManageVotings && (
          <MenuItem
            onClick={handleDeleteClick}
            disabled={selectedVoting.status === VotingStatus.ACTIVE}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Eliminar
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la votación "{selectedVoting?.title}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filtros de Búsqueda</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Buscar por título"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Comité</InputLabel>
              <Select
                value={filters.committee_id || ''}
                label="Comité"
                onChange={(e) => handleFilterChange('committee_id', e.target.value || undefined)}
              >
                <MenuItem value="">Todos</MenuItem>
                {committees.map((committee) => (
                  <MenuItem key={committee.id} value={committee.id}>
                    {committee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.status || ''}
                label="Estado"
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={VotingStatus.DRAFT}>Borrador</MenuItem>
                <MenuItem value={VotingStatus.ACTIVE}>Activa</MenuItem>
                <MenuItem value={VotingStatus.CLOSED}>Cerrada</MenuItem>
                <MenuItem value={VotingStatus.CANCELLED}>Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterReset}>Limpiar Filtros</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={resultsDialogOpen} onClose={() => setResultsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Resultados de la Votación</DialogTitle>
        <DialogContent>
          {votingResults && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Votos
                  </Typography>
                  <Typography variant="h6">
                    {votingResults.summary.total_votes}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Participación
                  </Typography>
                  <Typography variant="h6">
                    {votingResults.summary.participation_rate.toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Resultados por Opción
              </Typography>
              {[
                { option: 'Sí', votes: votingResults.summary.yes_count, percentage: votingResults.summary.yes_percentage },
                { option: 'No', votes: votingResults.summary.no_count, percentage: votingResults.summary.no_percentage },
                { option: 'Abstención', votes: votingResults.summary.abstain_count, percentage: votingResults.summary.abstain_percentage }
              ].map((result, index) => (
                <Box key={index} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1">
                      {result.option}
                    </Typography>
                    <Typography variant="body2">
                      {result.votes} votos ({result.percentage.toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={result.percentage}
                    sx={{ height: 8, borderRadius: 4, mt: 1 }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultsDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Voting Details Modal */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedVoting(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <VoteIcon color="primary" />
            <Typography variant="h6">
              Detalles de la Votación
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedVoting && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedVoting.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedVoting.description}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Estado
                </Typography>
                <Chip
                  label={
                    selectedVoting.status === VotingStatus.DRAFT
                      ? 'Borrador'
                      : selectedVoting.status === VotingStatus.ACTIVE
                      ? 'Activa'
                      : selectedVoting.status === VotingStatus.CLOSED
                      ? 'Cerrada'
                      : 'Cancelada'
                  }
                  color={
                    selectedVoting.status === VotingStatus.DRAFT
                      ? 'default'
                      : selectedVoting.status === VotingStatus.ACTIVE
                      ? 'success'
                      : selectedVoting.status === VotingStatus.CLOSED
                      ? 'info'
                      : 'error'
                  }
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Reunión Asociada
                </Typography>
                <Typography variant="body2">
                  {meetings.find(m => m.id === selectedVoting.meeting_id)?.title || 'N/A'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Fecha de Inicio
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedVoting.start_time).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Fecha de Fin
                </Typography>
                <Typography variant="body2">
                  {selectedVoting.end_time 
                    ? new Date(selectedVoting.end_time).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'No definida'
                  }
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Participación
                </Typography>
                <Typography variant="body2">
                  {selectedVoting.total_votes || 0} de {selectedVoting.eligible_voters || 0} votos emitidos
                </Typography>
                <Box sx={{ width: '100%', mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={selectedVoting.eligible_voters ? (selectedVoting.total_votes || 0) / selectedVoting.eligible_voters * 100 : 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {selectedVoting.eligible_voters ? ((selectedVoting.total_votes || 0) / selectedVoting.eligible_voters * 100).toFixed(1) : 0}% de participación
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tipo de Votación
                </Typography>
                <Typography variant="body2">
                  {selectedVoting.is_anonymous ? 'Anónima' : 'Pública'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Opciones de Votación
                </Typography>
                <Box>
                  <Chip
                    label="Sí"
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    label="No"
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    label="Abstención"
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Fecha de Creación
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedVoting.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Grid>

              {selectedVoting.updated_at && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Última Actualización
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedVoting.updated_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDetailsDialogOpen(false);
              setSelectedVoting(null);
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Voting Form */}
      <VotingForm
        open={votingFormOpen}
        onClose={handleVotingFormClose}
        onSubmit={handleVotingSubmit}
        voting={editingVoting}
        meetings={meetings}
        loading={loading}
        error={error}
      />
    </Box>
  );
};

export default VotingManagement;