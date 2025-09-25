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
  LinearProgress,
  Avatar,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Assignment as ActivityIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Person as AssignIcon,
  FilterList as FilterIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  TrendingUp as ProgressIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import ActivityForm from '../components/ActivityForm';
import { committeeActivityService } from '../services/committeeActivityService';
import { committeeService } from '../services/committeeService';
import { committeePermissionService } from '../services/committeePermissionService';
import { committeeMemberService } from '../services/committeeMemberService';
import {
  Activity,
  ActivityStatus,
  ActivityPriority,
  ActivityListFilters,
  ActivityUpdate,
  Committee,
  CommitteeMember,
} from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`activity-tabpanel-${index}`}
      aria-labelledby={`activity-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ActivityManagement: React.FC = () => {
  const navigate = useNavigate();
  const { id: committeeId } = useParams<{ id: string }>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState<{ [key: number]: any }>({});
  const [tabValue, setTabValue] = useState(0);
  const [activityCounts, setActivityCounts] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  });
  const [filters, setFilters] = useState<ActivityListFilters>({
    committee_id: committeeId ? parseInt(committeeId) : undefined,
    status: undefined,
    priority: undefined,
    assigned_to: undefined,
    search: '',
  });
  const [formData, setFormData] = useState({
    committee_id: 0,
    title: '',
    description: '',
    assigned_to: undefined as number | undefined,
    due_date: '',
    priority: ActivityPriority.MEDIUM,
    status: ActivityStatus.PENDING,
    estimated_hours: undefined as number | undefined,
    tags: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (committees.length > 0) {
      loadActivities();
      loadActivityCounts();
    }
  }, [page, rowsPerPage, filters, tabValue, committees]);

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
        const canManageActivities = await committeePermissionService.canManageActivities(committee.id);

        permissionsMap[committee.id] = {
          canView,
          canManageActivities,
        };
      }
      setPermissions(permissionsMap);
    } catch (err) {
      setError('Error al cargar los datos iniciales');
      console.error('Initial data loading error:', err);
    }
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const committeeIds = committees.map(c => c.id);
      if (committeeIds.length === 0) {
        setActivities([]);
        setTotalCount(0);
        return;
      }

      // Apply tab-based filtering
      let statusFilter = filters.status;
      switch (tabValue) {
        case 1:
          statusFilter = ActivityStatus.PENDING;
          break;
        case 2:
          statusFilter = ActivityStatus.IN_PROGRESS;
          break;
        case 3:
          statusFilter = ActivityStatus.COMPLETED;
          break;
        case 4:
          // Overdue activities
          statusFilter = undefined;
          break;
      }

      // Get activities from all committees
      const allActivitiesPromises = committeeIds.map(async (committeeId) => {
        return await committeeActivityService.getActivities(committeeId, {
          ...filters,
          status: statusFilter,
          page: 1, // Get all pages for each committee
          limit: 1000, // Large limit to get all activities
          overdue_only: tabValue === 4,
        });
      });

      const allResponses = await Promise.all(allActivitiesPromises);
      
      // Combine all activities
      const allActivities = allResponses.flatMap(response => response.activities);
      const totalActivities = allActivities.length;
      
      // Apply pagination to combined results
      const startIndex = page * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const paginatedActivities = allActivities.slice(startIndex, endIndex);

      setActivities(paginatedActivities);
      setTotalCount(totalActivities);
    } catch (err) {
      setError('Error al cargar las actividades');
      console.error('Activities loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityCounts = async () => {
    try {
      const committeeIds = committees.map(c => c.id);
      if (committeeIds.length === 0) return;

      // Get activities for all committees
      const allActivitiesPromises = committeeIds.map(async (committeeId) => {
        const [pending, inProgress, completed, overdue] = await Promise.all([
          committeeActivityService.getActivitiesByStatus(ActivityStatus.PENDING, [committeeId]),
          committeeActivityService.getActivitiesByStatus(ActivityStatus.IN_PROGRESS, [committeeId]),
          committeeActivityService.getActivitiesByStatus(ActivityStatus.COMPLETED, [committeeId]),
          committeeActivityService.getOverdueActivities([committeeId]),
        ]);
        return { pending, inProgress, completed, overdue };
      });

      const allActivities = await Promise.all(allActivitiesPromises);
      
      // Combine results from all committees
      const combinedCounts = allActivities.reduce(
        (acc, curr) => ({
          pending: acc.pending + curr.pending.length,
          in_progress: acc.in_progress + curr.inProgress.length,
          completed: acc.completed + curr.completed.length,
          overdue: acc.overdue + curr.overdue.length,
        }),
        { pending: 0, in_progress: 0, completed: 0, overdue: 0 }
      );

      setActivityCounts(combinedCounts);
    } catch (err) {
      console.error('Activity counts loading error:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, activity: Activity) => {
    setAnchorEl(event.currentTarget);
    setSelectedActivity(activity);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedActivity(null);
  };

  const handleView = () => {
    if (selectedActivity) {
      setDetailsDialogOpen(true);
    }
    handleMenuClose();
  };

  const loadCommitteeMembers = async (committeeId: number) => {
    try {
      const membersData = await committeeMemberService.getCommitteeMembers(committeeId);
      setMembers(membersData.filter(m => m.is_active));
    } catch (err) {
      console.error('Error loading committee members:', err);
      setMembers([]);
    }
  };

  const handleEdit = async () => {
    if (selectedActivity) {
      await loadCommitteeMembers(selectedActivity.committee_id);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleStartActivity = async () => {
    if (selectedActivity) {
      try {
        await committeeActivityService.startActivity(selectedActivity.committee_id, selectedActivity.id);
        loadActivities();
        loadActivityCounts();
      } catch (err) {
        setError('Error al iniciar la actividad');
        console.error('Start activity error:', err);
      }
    }
    handleMenuClose();
  };

  const handlePauseActivity = async () => {
    if (selectedActivity) {
      try {
        await committeeActivityService.pauseActivity(selectedActivity.committee_id, selectedActivity.id);
        loadActivities();
        loadActivityCounts();
      } catch (err) {
        setError('Error al pausar la actividad');
        console.error('Pause activity error:', err);
      }
    }
    handleMenuClose();
  };

  const handleCompleteActivity = async () => {
    if (selectedActivity) {
      try {
        await committeeActivityService.completeActivity(selectedActivity.committee_id, selectedActivity.id);
        loadActivities();
        loadActivityCounts();
      } catch (err) {
        setError('Error al completar la actividad');
        console.error('Complete activity error:', err);
      }
    }
    handleMenuClose();
  };

  const handleCancelActivity = async () => {
    if (selectedActivity) {
      try {
        await committeeActivityService.cancelActivity(selectedActivity.committee_id, selectedActivity.id);
        loadActivities();
        loadActivityCounts();
      } catch (err) {
        setError('Error al cancelar la actividad');
        console.error('Cancel activity error:', err);
      }
    }
    handleMenuClose();
  };

  const handleAssignClick = () => {
    setAssignDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedActivity) {
      try {
        await committeeActivityService.deleteActivity(selectedActivity.committee_id, selectedActivity.id);
        setDeleteDialogOpen(false);
        setSelectedActivity(null);
        loadActivities();
        loadActivityCounts();
      } catch (err) {
        setError('Error al eliminar la actividad');
        console.error('Activity deletion error:', err);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedActivity(null);
  };

  const handleUpdateActivity = async (data: ActivityUpdate) => {
    if (selectedActivity) {
      try {
        await committeeActivityService.updateActivity(selectedActivity.committee_id, selectedActivity.id, data);
        setEditDialogOpen(false);
        setSelectedActivity(null);
        loadActivities();
        loadActivityCounts();
      } catch (err) {
        setError('Error al actualizar la actividad');
        console.error('Activity update error:', err);
        throw err;
      }
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof ActivityListFilters, value: any) => {
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
      priority: undefined,
      assigned_to: undefined,
      search: '',
    });
    setPage(0);
  };

  const handleCreateActivity = () => {
    setCreateDialogOpen(true);
    // Reset form data
    setFormData({
      committee_id: committees.length > 0 ? committees[0].id : 0,
      title: '',
      description: '',
      assigned_to: undefined,
      due_date: '',
      priority: ActivityPriority.MEDIUM,
      status: ActivityStatus.PENDING,
      estimated_hours: undefined,
      tags: '',
      notes: '',
    });
    setFormErrors({});
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setFormData({
      committee_id: 0,
      title: '',
      description: '',
      assigned_to: undefined,
      due_date: '',
      priority: ActivityPriority.MEDIUM,
      status: ActivityStatus.PENDING,
      estimated_hours: undefined,
      tags: '',
      notes: '',
    });
    setFormErrors({});
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      errors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      errors.description = 'La descripción es requerida';
    }

    if (!formData.committee_id) {
      errors.committee_id = 'Debe seleccionar un comité';
    }

    if (formData.estimated_hours && formData.estimated_hours <= 0) {
      errors.estimated_hours = 'Las horas estimadas deben ser mayor a 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitActivity = async () => {
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const activityData = {
        ...formData,
        tags: formData.tags || undefined,
        due_date: formData.due_date || undefined,
        estimated_hours: formData.estimated_hours || undefined,
        assigned_to: formData.assigned_to || undefined,
      };

      await committeeActivityService.createActivity(formData.committee_id, activityData);
      
      handleCreateDialogClose();
      loadActivities();
      loadActivityCounts();
      
      // Show success message
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear la actividad');
      console.error('Create activity error:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusLabel = (status: ActivityStatus): string => {
    switch (status) {
      case ActivityStatus.PENDING:
        return 'Pendiente';
      case ActivityStatus.IN_PROGRESS:
        return 'En Progreso';
      case ActivityStatus.COMPLETED:
        return 'Completada';
      case ActivityStatus.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusColor = (status: ActivityStatus): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case ActivityStatus.PENDING:
        return 'default';
      case ActivityStatus.IN_PROGRESS:
        return 'primary';
      case ActivityStatus.COMPLETED:
        return 'success';
      case ActivityStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: ActivityPriority): string => {
    switch (priority) {
      case ActivityPriority.LOW:
        return 'Baja';
      case ActivityPriority.MEDIUM:
        return 'Media';
      case ActivityPriority.HIGH:
        return 'Alta';
      case ActivityPriority.CRITICAL:
        return 'Crítica';
      default:
        return priority;
    }
  };

  const getPriorityColor = (priority: ActivityPriority): 'default' | 'primary' | 'warning' | 'error' => {
    switch (priority) {
      case ActivityPriority.LOW:
        return 'default';
      case ActivityPriority.MEDIUM:
        return 'primary';
      case ActivityPriority.HIGH:
        return 'warning';
      case ActivityPriority.CRITICAL:
        return 'error';
      default:
        return 'default';
    }
  };

  const isOverdue = (activity: Activity): boolean => {
    if (!activity.due_date) return false;
    return new Date(activity.due_date) < new Date() && activity.status !== ActivityStatus.COMPLETED;
  };

  // Allow any authenticated user to create activities
  const canCreateActivity = true;

  const getActivityProgress = (activity: Activity): number => {
    // Since progress is not in the Activity interface, calculate based on status
    switch (activity.status) {
      case ActivityStatus.COMPLETED:
        return 100;
      case ActivityStatus.IN_PROGRESS:
        return 50;
      case ActivityStatus.PENDING:
        return 0;
      case ActivityStatus.CANCELLED:
        return 0;
      default:
        return 0;
    }
  };

  if (loading && activities.length === 0) {
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
          Gestión de Actividades
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
            onClick={handleCreateActivity}
            disabled={!canCreateActivity}
          >
            Nueva Actividad
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="activity tabs">
            <Tab label="Todas" />
            <Tab
              label={
                <Badge badgeContent={activityCounts.pending} color="default">
                  Pendientes
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={activityCounts.in_progress} color="primary">
                  En Progreso
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={activityCounts.completed} color="success">
                  Completadas
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={activityCounts.overdue} color="error">
                  Vencidas
                </Badge>
              }
            />
          </Tabs>
        </Box>

        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Actividad</TableCell>
                  <TableCell>Comité</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Prioridad</TableCell>
                  <TableCell>Asignado a</TableCell>
                  <TableCell>Fecha Límite</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <ActivityIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {activity.title}
                            {isOverdue(activity) && (
                              <Tooltip title="Actividad vencida">
                                <WarningIcon color="error" sx={{ ml: 1, fontSize: 16 }} />
                              </Tooltip>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {committees.find(c => c.id === activity.committee_id)?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(activity.status)}
                        size="small"
                        color={getStatusColor(activity.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityLabel(activity.priority)}
                        size="small"
                        color={getPriorityColor(activity.priority)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {activity.assigned_user ? `${activity.assigned_user.first_name} ${activity.assigned_user.last_name}` : 'Sin asignar'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {activity.due_date
                          ? new Date(activity.due_date).toLocaleDateString('es-ES')
                          : 'Sin fecha límite'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getActivityProgress(activity)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {getActivityProgress(activity)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Más opciones">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, activity)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {activities.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" py={4}>
                        No se encontraron actividades
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
        {selectedActivity && permissions[selectedActivity.committee_id]?.canManageActivities && (
          <>
            <MenuItem onClick={handleEdit}>
              <EditIcon sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem onClick={handleAssignClick}>
              <AssignIcon sx={{ mr: 1 }} />
              Asignar
            </MenuItem>
            <MenuItem
              onClick={handleStartActivity}
              disabled={selectedActivity.status !== ActivityStatus.PENDING}
            >
              <StartIcon sx={{ mr: 1 }} />
              Iniciar
            </MenuItem>
            <MenuItem
              onClick={handlePauseActivity}
              disabled={selectedActivity.status !== ActivityStatus.IN_PROGRESS}
            >
              <PauseIcon sx={{ mr: 1 }} />
              Pausar
            </MenuItem>
            <MenuItem
              onClick={handleCompleteActivity}
              disabled={selectedActivity.status === ActivityStatus.COMPLETED}
            >
              <CompleteIcon sx={{ mr: 1 }} />
              Completar
            </MenuItem>
            <MenuItem
              onClick={handleCancelActivity}
              disabled={selectedActivity.status === ActivityStatus.COMPLETED || selectedActivity.status === ActivityStatus.CANCELLED}
            >
              <CancelIcon sx={{ mr: 1 }} />
              Cancelar
            </MenuItem>
            <MenuItem
              onClick={handleDeleteClick}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              Eliminar
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la actividad "{selectedActivity?.title}"?
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
              <InputLabel>Prioridad</InputLabel>
              <Select
                value={filters.priority || ''}
                label="Prioridad"
                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value={ActivityPriority.LOW}>Baja</MenuItem>
                <MenuItem value={ActivityPriority.MEDIUM}>Media</MenuItem>
                <MenuItem value={ActivityPriority.HIGH}>Alta</MenuItem>
                <MenuItem value={ActivityPriority.CRITICAL}>Crítica</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterReset}>Limpiar Filtros</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Create Activity Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nueva Actividad</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!formErrors.committee_id}>
                  <InputLabel>Comité *</InputLabel>
                  <Select
                    value={formData.committee_id || ''}
                    label="Comité *"
                    onChange={(e) => handleFormChange('committee_id', e.target.value)}
                  >
                    {committees.map((committee) => (
                      <MenuItem key={committee.id} value={committee.id}>
                        {committee.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.committee_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {formErrors.committee_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Título *"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Descripción *"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  multiline
                  rows={3}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha Límite"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleFormChange('due_date', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Horas Estimadas"
                  type="number"
                  value={formData.estimated_hours || ''}
                  onChange={(e) => handleFormChange('estimated_hours', e.target.value ? parseInt(e.target.value) : undefined)}
                  error={!!formErrors.estimated_hours}
                  helperText={formErrors.estimated_hours}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Etiquetas (separadas por comas)"
                  value={formData.tags}
                  onChange={(e) => handleFormChange('tags', e.target.value)}
                  placeholder="etiqueta1, etiqueta2, etiqueta3"
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
            <Button onClick={handleCreateDialogClose} disabled={submitLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitActivity} 
              variant="contained" 
              disabled={submitLoading}
              startIcon={submitLoading ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {submitLoading ? 'Creando...' : 'Crear Actividad'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Activity Modal */}
        <ActivityForm
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedActivity(null);
            setMembers([]);
          }}
          onSubmit={handleUpdateActivity}
          activity={selectedActivity || undefined}
          members={members}
          loading={submitLoading}
          error={error}
        />

        {/* Activity Details Modal */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setSelectedActivity(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <ActivityIcon color="primary" />
              <Typography variant="h6">
                Detalles de la Actividad
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedActivity && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedActivity.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedActivity.description}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Estado
                  </Typography>
                  <Chip
                    label={
                      selectedActivity.status === ActivityStatus.PENDING
                        ? 'Pendiente'
                        : selectedActivity.status === ActivityStatus.IN_PROGRESS
                        ? 'En Progreso'
                        : selectedActivity.status === ActivityStatus.COMPLETED
                        ? 'Completada'
                        : selectedActivity.status === ActivityStatus.CANCELLED
                        ? 'Cancelada'
                        : 'Pausada'
                    }
                    color={
                      selectedActivity.status === ActivityStatus.PENDING
                        ? 'warning'
                        : selectedActivity.status === ActivityStatus.IN_PROGRESS
                        ? 'info'
                        : selectedActivity.status === ActivityStatus.COMPLETED
                        ? 'success'
                        : 'error'
                    }
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Prioridad
                  </Typography>
                  <Chip
                    label={
                      selectedActivity.priority === ActivityPriority.LOW
                        ? 'Baja'
                        : selectedActivity.priority === ActivityPriority.MEDIUM
                        ? 'Media'
                        : selectedActivity.priority === ActivityPriority.HIGH
                        ? 'Alta'
                        : 'Crítica'
                    }
                    color={
                      selectedActivity.priority === ActivityPriority.LOW
                        ? 'default'
                        : selectedActivity.priority === ActivityPriority.MEDIUM
                        ? 'info'
                        : selectedActivity.priority === ActivityPriority.HIGH
                        ? 'warning'
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
                    {committees.find(c => c.id === selectedActivity.committee_id)?.name || 'N/A'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Asignado a
                  </Typography>
                  <Typography variant="body2">
                    {selectedActivity.assigned_user 
                      ? `${selectedActivity.assigned_user.first_name} ${selectedActivity.assigned_user.last_name}`
                      : 'Sin asignar'}
                  </Typography>
                </Grid>

                {selectedActivity.due_date && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Fecha Límite
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedActivity.due_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Grid>
                )}

                {selectedActivity.estimated_hours && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Horas Estimadas
                    </Typography>
                    <Typography variant="body2">
                      {selectedActivity.estimated_hours} horas
                    </Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Progreso
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                      variant="determinate"
                      value={selectedActivity.progress_percentage || 0}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {selectedActivity.progress_percentage || 0}%
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Fecha de Creación
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedActivity.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Grid>

                {selectedActivity.tags && selectedActivity.tags.trim().length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Etiquetas
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {selectedActivity.tags.split(',').map((tag: string, index: number) => (
                        <Chip
                          key={index}
                          label={tag.trim()}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDetailsDialogOpen(false);
                setSelectedActivity(null);
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default ActivityManagement;