import React, { useState, useEffect } from 'react';
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
  Avatar,
  Tabs,
  Tab,
  Badge,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Event as MeetingIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  People as AttendanceIcon,
  FilterList as FilterIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { committeeService } from '../services/committeeService';
import { committeePermissionService } from '../services/committeePermissionService';
import { logger } from '../utils/logger';
import {
  Meeting,
  MeetingStatus,
  MeetingListFilters,
  Committee,
} from '../types';

const MeetingManagement: React.FC = () => {
  const navigate = useNavigate();
  const { id: committeeId } = useParams<{ id: string }>();
  
  // Estados principales
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados de UI
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    committee_id: committeeId ? parseInt(committeeId) : '',
    title: '',
    description: '',
    meeting_date: '',
    duration_minutes: 60,
    location: '',
    meeting_type: 'presencial',
    agenda: '',
    is_virtual: false,
    meeting_link: '',
    notes: ''
  });
  
  // Estados de permisos
  const [permissions, setPermissions] = useState({
    canCreateMeetings: false,
    canEditMeetings: false,
    canDeleteMeetings: false,
    canManageMeetings: false,
  });
  
  // Estados de filtros y pestañas
  const [tabValue, setTabValue] = useState(0);
  const [meetingCounts, setMeetingCounts] = useState({
    all: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });
  
  const [filters, setFilters] = useState<MeetingListFilters>({
    committee_id: committeeId ? parseInt(committeeId) : undefined,
    status: undefined,
    search: '',
    date_from: undefined,
    date_to: undefined,
  });





  // Cargar datos iniciales
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar comités si no hay committee_id específico
      if (!committeeId) {
        const committeesData = await committeeService.getCommittees({});
        setCommittees(committeesData.items);
      }
      
      // Cargar permisos
      if (committeeId) {
        const canCreateMeetings = await committeePermissionService.canCreateMeetings(parseInt(committeeId));
        const canEdit = await committeePermissionService.canEdit(parseInt(committeeId));
        const newPermissions = {
          canCreateMeetings: canCreateMeetings,
          canEditMeetings: canEdit,
          canDeleteMeetings: canEdit,
          canManageMeetings: canCreateMeetings,
        };
        logger.debug('Permissions loaded for committee', committeeId, ':', newPermissions);
        setPermissions(newPermissions);
      } else {
        // Si no hay committeeId específico, verificar permisos generales
        // Para usuarios admin/supervisor, permitir crear reuniones
        const hasGeneralPermissions = await committeePermissionService.hasAnyCommitteePermissions();
        const newPermissions = {
          canCreateMeetings: hasGeneralPermissions,
          canEditMeetings: hasGeneralPermissions,
          canDeleteMeetings: hasGeneralPermissions,
          canManageMeetings: hasGeneralPermissions,
        };
        logger.debug('General permissions loaded:', newPermissions);
        setPermissions(newPermissions);
      }
      
      await loadMeetings();
    } catch (err) {
      logger.error('Error loading initial data:', err);
      setError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  // Cargar reuniones
  const loadMeetings = async () => {
    try {
      const currentFilters = getFiltersForTab(tabValue);
      let response: Meeting[];
      
      // Si hay committee_id, usar getMeetings, sino usar getAllMeetings
      if (currentFilters.committee_id) {
        response = await meetingService.getMeetings(currentFilters);
      } else {
        // Usar getAllMeetings para obtener todas las reuniones sin filtro de comité
        const { committee_id, ...filtersWithoutCommittee } = currentFilters;
        response = await meetingService.getAllMeetings(filtersWithoutCommittee);
      }

      // Simular paginación en el frontend ya que el servicio no la maneja
      const startIndex = page * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const paginatedMeetings = response.slice(startIndex, endIndex);

      setMeetings(paginatedMeetings);
      setTotalCount(response.length);
      
      // Cargar conteos para las pestañas
      await loadMeetingCounts();
    } catch (err) {
      setError('Error al cargar las reuniones');
    }
  };

  // Cargar conteos para pestañas
  const loadMeetingCounts = async () => {
    try {
      const baseFilters = { committee_id: filters.committee_id };
      
      let allCount, scheduledCount, inProgressCount, completedCount, cancelledCount;
      
      if (filters.committee_id) {
        // Si hay committee_id, usar getMeetings
        [allCount, scheduledCount, inProgressCount, completedCount, cancelledCount] = await Promise.all([
          meetingService.getMeetings({ ...baseFilters }).then(r => r.length),
          meetingService.getMeetings({ ...baseFilters, status: MeetingStatus.SCHEDULED }).then(r => r.length),
          meetingService.getMeetings({ ...baseFilters, status: MeetingStatus.IN_PROGRESS }).then(r => r.length),
          meetingService.getMeetings({ ...baseFilters, status: MeetingStatus.COMPLETED }).then(r => r.length),
          meetingService.getMeetings({ ...baseFilters, status: MeetingStatus.CANCELLED }).then(r => r.length),
        ]);
      } else {
        // Si no hay committee_id, usar getAllMeetings
        [allCount, scheduledCount, inProgressCount, completedCount, cancelledCount] = await Promise.all([
          meetingService.getAllMeetings({}).then(r => r.length),
          meetingService.getAllMeetings({ status: MeetingStatus.SCHEDULED }).then(r => r.length),
          meetingService.getAllMeetings({ status: MeetingStatus.IN_PROGRESS }).then(r => r.length),
          meetingService.getAllMeetings({ status: MeetingStatus.COMPLETED }).then(r => r.length),
          meetingService.getAllMeetings({ status: MeetingStatus.CANCELLED }).then(r => r.length),
        ]);
      }
      
      setMeetingCounts({
        all: allCount,
        scheduled: scheduledCount,
        inProgress: inProgressCount,
        completed: completedCount,
        cancelled: cancelledCount,
      });
    } catch (err) {
      // Error loading meeting counts - silently fail
    }
  };

  // Obtener filtros según la pestaña
  const getFiltersForTab = (tab: number) => {
    const baseFilters = { ...filters };
    
    switch (tab) {
      case 0: // Todas
        delete baseFilters.status;
        break;
      case 1: // Programadas
        baseFilters.status = MeetingStatus.SCHEDULED;
        break;
      case 2: // En progreso
        baseFilters.status = MeetingStatus.IN_PROGRESS;
        break;
      case 3: // Completadas
        baseFilters.status = MeetingStatus.COMPLETED;
        break;
      case 4: // Canceladas
        baseFilters.status = MeetingStatus.CANCELLED;
        break;
      default:
        delete baseFilters.status;
    }
    
    return baseFilters;
  };

  // Efectos
  useEffect(() => {
    loadInitialData();
  }, [committeeId]);

  useEffect(() => {
    if (!loading) {
      loadMeetings();
    }
  }, [page, rowsPerPage, tabValue, filters]);

  // Manejadores de eventos
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, meeting: Meeting) => {
    setAnchorEl(event.currentTarget);
    setSelectedMeeting(meeting);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMeeting(null);
  };

  const handleCreateMeeting = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setIsEditMode(false);
    setFormData({
      committee_id: committeeId ? parseInt(committeeId) : '',
      title: '',
      description: '',
      meeting_date: '',
      duration_minutes: 60,
      location: '',
      meeting_type: 'presencial',
      agenda: '',
      is_virtual: false,
      meeting_link: '',
      notes: ''
    });
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitMeeting = async () => {
    try {
      setLoading(true);
      
      const selectedCommitteeId = committeeId ? parseInt(committeeId) : (typeof formData.committee_id === 'string' ? parseInt(formData.committee_id) : formData.committee_id);
      
      if (!selectedCommitteeId) {
        setError('Debe seleccionar un comité');
        return;
      }

      // Convert date to ISO string for backend
      const meetingDateTime = new Date(formData.meeting_date);
      const meetingDateISO = meetingDateTime.toISOString();

      const meetingData = {
        committee_id: selectedCommitteeId,
        title: formData.title,
        description: formData.description,
        meeting_date: meetingDateISO,
        duration_minutes: formData.duration_minutes,
        location: formData.location,
        meeting_type: formData.meeting_type,
        agenda: formData.agenda,
        status: isEditMode ? (selectedMeeting?.status || MeetingStatus.SCHEDULED) : MeetingStatus.SCHEDULED,
        is_virtual: formData.is_virtual,
        meeting_link: formData.meeting_link,
        notes: formData.notes
      };

      if (isEditMode && selectedMeeting) {
        await meetingService.updateMeeting(selectedMeeting.id, meetingData, selectedCommitteeId);
      } else {
        await meetingService.createMeeting(meetingData);
      }
      
      handleCloseCreateDialog();
      loadMeetings(); // Recargar la lista de reuniones
    } catch (err: any) {
      setError(err.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} la reunión`);
    } finally {
      setLoading(false);
    }
  };

  // Utility function to format time for HTML time input (HH:MM format)


  const handleEditMeeting = (meeting: Meeting) => {
    // Extract date and time from meeting_date
    const meetingDateTime = new Date(meeting.meeting_date);
    const meetingDateOnly = meetingDateTime.toISOString().split('T')[0];
    
    const newFormData = {
      committee_id: meeting.committee_id,
      title: meeting.title,
      description: meeting.description || '',
      meeting_date: meetingDateOnly,
      duration_minutes: meeting.duration_minutes ?? 60,
      location: meeting.location || '',
      meeting_type: meeting.meeting_type || 'presencial',
      agenda: meeting.agenda || '',
      is_virtual: meeting.is_virtual || false,
      meeting_link: meeting.meeting_link || '',
      notes: meeting.notes || ''
    };
    
    setFormData(newFormData);
    setSelectedMeeting(meeting);
    setIsEditMode(true);
    setCreateDialogOpen(true);
  };

  const handleViewMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDetailsDialogOpen(true);
    // Close menu without clearing selectedMeeting
    setAnchorEl(null);
  };

  const handleDeleteMeeting = (meeting: Meeting) => {
    logger.debug('handleDeleteMeeting called with meeting:', meeting);
    logger.debug('Current permissions:', permissions);
    setSelectedMeeting(meeting);
    setDeleteDialogOpen(true);
    // No llamamos a handleMenuClose() aquí para evitar limpiar selectedMeeting
    // Solo cerramos el menú sin limpiar selectedMeeting
    setAnchorEl(null);
  };

  const confirmDeleteMeeting = async () => {
    logger.debug('confirmDeleteMeeting called');
    logger.debug('selectedMeeting:', selectedMeeting);
    if (!selectedMeeting) return;
    
    setLoading(true);
    setError('');
    
    try {
      logger.debug('Calling deleteMeeting service...');
      await meetingService.deleteMeeting(selectedMeeting.id, selectedMeeting.committee_id);
      logger.debug('Delete successful');
      setDeleteDialogOpen(false);
      setSelectedMeeting(null);
      await loadMeetings();
    } catch (err: any) {
      logger.error('Delete error:', err);
      setError(err.message || 'Error al eliminar la reunión');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMeeting = async (meeting: Meeting) => {
    try {
      await meetingService.startMeeting(meeting.id, meeting.committee_id);
      await loadMeetings();
      handleMenuClose();
    } catch (err) {
      setError('Error al iniciar la reunión');
    }
  };

  const handleCompleteMeeting = async (meeting: Meeting) => {
    try {
      await meetingService.completeMeeting(meeting.id, meeting.committee_id);
      await loadMeetings();
      handleMenuClose();
    } catch (err) {
      setError('Error al completar la reunión');
    }
  };

  // Funciones de utilidad
  const getStatusColor = (status: MeetingStatus) => {
    switch (status) {
      case MeetingStatus.SCHEDULED:
        return 'info';
      case MeetingStatus.IN_PROGRESS:
        return 'warning';
      case MeetingStatus.COMPLETED:
        return 'success';
      case MeetingStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: MeetingStatus) => {
    switch (status) {
      case MeetingStatus.SCHEDULED:
        return 'Programada';
      case MeetingStatus.IN_PROGRESS:
        return 'En Progreso';
      case MeetingStatus.COMPLETED:
        return 'Completada';
      case MeetingStatus.CANCELLED:
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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Reuniones
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateMeeting}
          disabled={!permissions.canCreateMeetings}
        >
          Nueva Reunión
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label={
              <Badge badgeContent={meetingCounts.all} color="primary">
                Todas
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={meetingCounts.scheduled} color="info">
                Programadas
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={meetingCounts.inProgress} color="warning">
                En Progreso
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={meetingCounts.completed} color="success">
                Completadas
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={meetingCounts.cancelled} color="error">
                Canceladas
              </Badge>
            }
          />
        </Tabs>
      </Card>

      {/* Tabla de reuniones */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Comité</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <MeetingIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {meeting.title}
                          </Typography>
                          {meeting.description && (
                            <Typography variant="caption" color="text.secondary">
                              {meeting.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {committees.find(c => c.id === meeting.committee_id)?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <ScheduleIcon sx={{ mr: 1, fontSize: 16 }} />
                        {new Date(meeting.meeting_date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {meeting.duration_minutes && (
                          <Typography variant="caption" sx={{ ml: 1 }}>
                            ({meeting.duration_minutes} min)
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                        {meeting.location || 'No especificada'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(meeting.status)}
                        color={getStatusColor(meeting.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, meeting)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </CardContent>
      </Card>

      {/* Menu de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedMeeting && handleViewMeeting(selectedMeeting)}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        {permissions.canEditMeetings && (
          <MenuItem onClick={() => {
            if (selectedMeeting) {
              const meetingToEdit = selectedMeeting;
              handleMenuClose();
              handleEditMeeting(meetingToEdit);
            }
          }}>
            <EditIcon sx={{ mr: 1 }} />
            Editar
          </MenuItem>
        )}
        {selectedMeeting?.status === MeetingStatus.SCHEDULED && permissions.canManageMeetings && (
          <MenuItem onClick={() => selectedMeeting && handleStartMeeting(selectedMeeting)}>
            <StartIcon sx={{ mr: 1 }} />
            Iniciar Reunión
          </MenuItem>
        )}
        {selectedMeeting?.status === MeetingStatus.IN_PROGRESS && permissions.canManageMeetings && (
          <MenuItem onClick={() => selectedMeeting && handleCompleteMeeting(selectedMeeting)}>
            <CompleteIcon sx={{ mr: 1 }} />
            Completar Reunión
          </MenuItem>
        )}
        <MenuItem onClick={() => navigate(`/meetings/${selectedMeeting?.id}/attendance`)}>
          <AttendanceIcon sx={{ mr: 1 }} />
          Gestionar Asistencia
        </MenuItem>
        {permissions.canDeleteMeetings && (
          <MenuItem 
            onClick={() => {
              logger.debug('Delete button clicked');
              logger.debug('selectedMeeting:', selectedMeeting);
              logger.debug('permissions.canDeleteMeetings:', permissions.canDeleteMeetings);
              if (selectedMeeting) {
                const meetingToDelete = selectedMeeting;
                handleDeleteMeeting(meetingToDelete);
              }
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Eliminar
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de creación de reunión */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditMode ? 'Editar Reunión' : 'Crear Nueva Reunión'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {/* Selector de comité solo si no hay committeeId específico */}
              {!committeeId && (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Comité</InputLabel>
                    <Select
                      value={formData.committee_id}
                      onChange={(e) => handleFormChange('committee_id', e.target.value)}
                      label="Comité"
                    >
                      {committees.map((committee) => (
                        <MenuItem key={committee.id} value={committee.id}>
                          {committee.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Título"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha de Reunión"
                  type="date"
                  value={formData.meeting_date}
                  onChange={(e) => handleFormChange('meeting_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Duración (minutos)"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => handleFormChange('duration_minutes', parseInt(e.target.value) || 60)}
                  inputProps={{ min: 15, max: 480, step: 15 }}
                  helperText="Duración de la reunión en minutos (15-480)"
                  required
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Reunión</InputLabel>
                  <Select
                    value={formData.meeting_type}
                    onChange={(e) => handleFormChange('meeting_type', e.target.value)}
                    label="Tipo de Reunión"
                  >
                    <MenuItem value="presencial">Presencial</MenuItem>
                    <MenuItem value="virtual">Virtual</MenuItem>
                    <MenuItem value="hibrida">Híbrida</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Ubicación"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                />
              </Grid>
              
              {(formData.meeting_type === 'virtual' || formData.meeting_type === 'hibrida') && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Enlace de Reunión"
                    value={formData.meeting_link}
                    onChange={(e) => handleFormChange('meeting_link', e.target.value)}
                    placeholder="https://..."
                  />
                </Grid>
              )}
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Agenda"
                  value={formData.agenda}
                  onChange={(e) => handleFormChange('agenda', e.target.value)}
                  multiline
                  rows={4}
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notas"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitMeeting} 
            variant="contained"
            disabled={
              !formData.title || 
              !formData.meeting_date || 
              !formData.duration_minutes ||
              (!committeeId && !formData.committee_id)
            }
          >
            {isEditMode ? 'Actualizar Reunión' : 'Crear Reunión'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => !loading && setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar la reunión "{selectedMeeting?.title}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmDeleteMeeting} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Meeting Details Modal */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedMeeting(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <MeetingIcon color="primary" />
            <Typography variant="h6">
              Detalles de la Reunión
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMeeting ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedMeeting.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedMeeting.description}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Estado
                </Typography>
                <Chip
                  label={
                    selectedMeeting.status === MeetingStatus.SCHEDULED
                      ? 'Programada'
                      : selectedMeeting.status === MeetingStatus.IN_PROGRESS
                      ? 'En Progreso'
                      : selectedMeeting.status === MeetingStatus.COMPLETED
                      ? 'Completada'
                      : 'Cancelada'
                  }
                  color={
                    selectedMeeting.status === MeetingStatus.SCHEDULED
                      ? 'warning'
                      : selectedMeeting.status === MeetingStatus.IN_PROGRESS
                      ? 'info'
                      : selectedMeeting.status === MeetingStatus.COMPLETED
                      ? 'success'
                      : 'error'
                  }
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Comité
                </Typography>
                <Typography variant="body2">
                  {committees.find(c => c.id === selectedMeeting.committee_id)?.name || 'N/A'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Fecha y Hora
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedMeeting.meeting_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duración: {selectedMeeting.duration_minutes} minutos
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tipo de Reunión
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {selectedMeeting.is_virtual ? (
                    <VideoCallIcon color="primary" fontSize="small" />
                  ) : (
                    <LocationIcon color="primary" fontSize="small" />
                  )}
                  <Typography variant="body2">
                    {selectedMeeting.is_virtual ? 'Virtual' : 'Presencial'}
                  </Typography>
                </Box>
              </Grid>

              {selectedMeeting.location && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Ubicación
                  </Typography>
                  <Typography variant="body2">
                    {selectedMeeting.location}
                  </Typography>
                </Grid>
              )}

              {selectedMeeting.meeting_link && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Enlace de la Reunión
                  </Typography>
                  <Typography variant="body2">
                    <a 
                      href={selectedMeeting.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'inherit', textDecoration: 'underline' }}
                    >
                      {selectedMeeting.meeting_link}
                    </a>
                  </Typography>
                </Grid>
              )}

              {selectedMeeting.agenda && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Agenda
                  </Typography>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedMeeting.agenda}
                  </Typography>
                </Grid>
              )}

              {selectedMeeting.notes && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Notas
                  </Typography>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedMeeting.notes}
                  </Typography>
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Fecha de Creación
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedMeeting.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography>No hay datos de reunión disponibles</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDetailsDialogOpen(false);
              setSelectedMeeting(null);
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingManagement;