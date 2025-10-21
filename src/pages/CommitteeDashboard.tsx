import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  ListItemIcon,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  Event as EventIcon,
  HowToVote as HowToVoteIcon,
  Assignment as AssignmentIcon,
  Description as DocumentIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { committeeService } from '../services/committeeService';
import { meetingService } from '../services/meetingService';
import { votingService } from '../services/votingService';
import { committeeActivityService } from '../services/committeeActivityService';
import { committeePermissionService } from '../services/committeePermissionService';
import {
  Committee,
  Meeting,
  Voting,
  Activity,
  CommitteeType,
  ActivityStatus,
  MeetingStatus,
  VotingStatus,
} from '../types';

interface DashboardFilters {
  committee_type?: CommitteeType;
  is_active?: boolean;
  search: string;
}

const CommitteeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCommittees, setUserCommittees] = useState<Committee[]>([]);
  const [filteredCommittees, setFilteredCommittees] = useState<Committee[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [activeVotings, setActiveVotings] = useState<Voting[]>([]);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [permissions, setPermissions] = useState<{ [key: number]: any }>({});
  
  // Filter states
  const [filters, setFilters] = useState<DashboardFilters>({
    search: '',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // Statistics states
  const [statistics, setStatistics] = useState({
    totalCommittees: 0,
    activeCommittees: 0,
    upcomingMeetingsCount: 0,
    activeVotingsCount: 0,
    pendingActivitiesCount: 0,
    overdueMeetings: 0,
    completedActivitiesThisMonth: 0,
  });



  const applyFilters = useCallback(() => {
    let filtered = [...userCommittees];

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(committee => 
        committee.name.toLowerCase().includes(searchLower) ||
        committee.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by committee type
    if (filters.committee_type) {
      filtered = filtered.filter(committee => committee.committee_type === filters.committee_type);
    }

    // Filter by active status
    if (filters.is_active !== undefined) {
      filtered = filtered.filter(committee => committee.is_active === filters.is_active);
    }

    setFilteredCommittees(filtered);
  }, [userCommittees, filters]);

  const calculateStatistics = useCallback((
    committees: Committee[],
    meetings: Meeting[],
    votings: Voting[],
    activities: Activity[]
  ) => {
    const activeCommittees = committees.filter(c => c.is_active).length;

    setStatistics({
      totalCommittees: committees.length,
      activeCommittees,
      upcomingMeetingsCount: meetings.length,
      activeVotingsCount: votings.length,
      pendingActivitiesCount: activities.length,
      overdueMeetings: meetings.filter(m => new Date(m.meeting_date) < new Date()).length,
      completedActivitiesThisMonth: 0,
    });
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user's accessible committees
      const accessibleCommittees = await committeePermissionService.getUserAccessibleCommittees();
      const committees = await Promise.all(
        accessibleCommittees.map(async (ac) => {
          const committee = await committeeService.getCommittee(ac.committee_id);
          return committee;
        })
      );
      setUserCommittees(committees);

      // Load permissions for each committee
      const permissionsMap: { [key: number]: any } = {};
      for (const committee of committees) {
        const canView = await committeePermissionService.canView(committee.id);
        const canEdit = await committeePermissionService.canEdit(committee.id);
        const canManageMembers = await committeePermissionService.canManageMembers(committee.id);
        const canCreateMeetings = await committeePermissionService.canCreateMeetings(committee.id);
        const canManageVotings = await committeePermissionService.canManageVotings(committee.id);
        const canUploadDocuments = await committeePermissionService.canUploadDocuments(committee.id);

        permissionsMap[committee.id] = {
          canView,
          canEdit,
          canManageMembers,
          canCreateMeetings,
          canManageVotings,
          canUploadDocuments,
        };
      }
      setPermissions(permissionsMap);

      // Load dashboard data if user has committees
      if (committees.length > 0) {
        const { meetings, votings, activities } = await loadDashboardMetrics(committees);
        setUpcomingMeetings(meetings);
        setActiveVotings(votings);
        setPendingActivities(activities);
        // Calculate statistics based on freshly fetched metrics
        calculateStatistics(committees, meetings, votings, activities);
      } else {
        // Reset statistics if no committees
        calculateStatistics([], [], [], []);
      }
    } catch (err) {
      setError('Hubo un problema al cargar la información del dashboard. Por favor, intenta recargar la página o contacta al soporte técnico si el problema persiste.');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [calculateStatistics]);

  const loadDashboardMetrics = async (committees: Committee[]) => {
    try {
      // Load upcoming meetings for all committees
      const allMeetings: Meeting[] = [];
      const allVotings: Voting[] = [];
      const allActivities: Activity[] = [];

      for (const committee of committees) {
        try {
          // Load meetings
          const meetings = await meetingService.getMeetings({ 
            committee_id: committee.id,
            status: MeetingStatus.SCHEDULED 
          });
          allMeetings.push(...meetings);

          // Load votings
          const votingsData = await votingService.getVotings({ 
            committee_id: committee.id,
            status: VotingStatus.ACTIVE 
          });
          // Handle different response formats
          if (votingsData && Array.isArray(votingsData.items)) {
            allVotings.push(...votingsData.items);
          } else if (Array.isArray(votingsData)) {
            allVotings.push(...votingsData);
          }

          // Load activities
          const activitiesData = await committeeActivityService.getActivities(committee.id, { 
            status: ActivityStatus.PENDING,
            limit: 10 
          });
          allActivities.push(...activitiesData.activities);
        } catch (err) {
          console.warn(`Error loading data for committee ${committee.id}:`, err);
        }
      }

      // Sort and limit results, return to caller
      const meetings = allMeetings.slice(0, 5);
      const votings = allVotings.slice(0, 5);
      const activities = allActivities.slice(0, 5);
      return { meetings, votings, activities };
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
      return { meetings: [], votings: [], activities: [] };
    }
  };



  const handleFilterChange = (field: keyof DashboardFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFilterReset = () => {
    setFilters({
      search: '',
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    applyFilters();
  }, [filters, userCommittees, applyFilters]);

  const handleQuickAction = (action: string, committeeId?: number) => {
    switch (action) {
      case 'create-meeting':
        if (committeeId) {
          navigate(`/admin/committees/${committeeId}/meetings/new`);
        } else {
          navigate('/admin/committees/meetings/new');
        }
        break;
      case 'create-voting':
        if (committeeId) {
          navigate(`/admin/committees/${committeeId}`);
        } else {
          navigate('/admin/committees');
        }
        break;
      case 'manage-members':
        if (committeeId) {
          navigate(`/admin/committees/${committeeId}/members`);
        }
        break;
      case 'create-committee':
        navigate('/admin/committees/new');
        break;
      default:
        break;
    }
  };

  const getCommitteeTypeLabel = (type: CommitteeType): string => {
    switch (type) {
      case CommitteeType.CONVIVENCIA:
        return 'Convivencia';
      case CommitteeType.COPASST:
        return 'COPASST';
      default:
        return type;
    }
  };

  const getCommitteeTypeColor = (type: CommitteeType): 'primary' | 'secondary' => {
    switch (type) {
      case CommitteeType.CONVIVENCIA:
        return 'primary';
      case CommitteeType.COPASST:
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const getActivityPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (userCommittees.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info">
          No tienes acceso a ningún comité. Contacta al administrador para obtener permisos.
        </Alert>
        <Box mt={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleQuickAction('create-committee')}
          >
            Crear Primer Comité
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header with Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard de Comités
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filtros
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleQuickAction('create-committee')}
          >
            Nuevo Comité
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Buscar comités por nombre o descripción..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          InputProps={{
            startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* Enhanced Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Comités
                  </Typography>
                  <Typography variant="h4">
                    {statistics.totalCommittees}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {statistics.activeCommittees} activos
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <GroupIcon />
                </Avatar>
              </Box>
              <Box mt={1}>
                <LinearProgress 
                  variant="determinate" 
                  value={(statistics.activeCommittees / statistics.totalCommittees) * 100} 
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Próximas Reuniones
                  </Typography>
                  <Typography variant="h4">
                    {statistics.upcomingMeetingsCount}
                  </Typography>
                  {statistics.overdueMeetings > 0 && (
                    <Typography variant="caption" color="error.main">
                      {statistics.overdueMeetings} vencidas
                    </Typography>
                  )}
                </Box>
                <Badge badgeContent={statistics.overdueMeetings} color="error">
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <EventIcon />
                  </Avatar>
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Votaciones Activas
                  </Typography>
                  <Typography variant="h4">
                    {statistics.activeVotingsCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    En curso
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <HowToVoteIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Actividades Pendientes
                  </Typography>
                  <Typography variant="h4">
                    {statistics.pendingActivitiesCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Por completar
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Acciones Rápidas
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<EventIcon />}
            onClick={() => handleQuickAction('create-meeting')}
            size="small"
          >
            Nueva Reunión
          </Button>
          <Button
            variant="outlined"
            startIcon={<HowToVoteIcon />}
            onClick={() => handleQuickAction('create-voting')}
            size="small"
          >
            Nueva Votación
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUpIcon />}
            onClick={() => navigate('/admin/committees')}
            size="small"
          >
            Ver Estadísticas
          </Button>
          <Button
            variant="outlined"
            startIcon={<DocumentIcon />}
            onClick={() => navigate('/admin/committees/documents')}
            size="small"
          >
            Documentos
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* User's Committees with Enhanced Features */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Mis Comités ({filteredCommittees.length})
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/committees')}
                >
                  Ver todos
                </Button>
              </Box>
              <List>
                {filteredCommittees.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    {filters.search || filters.committee_type || filters.is_active !== undefined
                      ? 'No se encontraron comités con los filtros aplicados'
                      : 'No hay comités disponibles'
                    }
                  </Typography>
                ) : (
                  filteredCommittees.map((committee, index) => (
                    <React.Fragment key={committee.id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Tooltip title="Ver comité">
                              <IconButton
                                edge="end"
                                onClick={() => navigate(`/admin/committees/${committee.id}`)}
                                disabled={!permissions[committee.id]?.canView}
                                size="small"
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar comité">
                              <IconButton
                                edge="end"
                                onClick={() => navigate(`/admin/committees/${committee.id}/edit`)}
                                disabled={!permissions[committee.id]?.canEdit}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Gestionar miembros">
                              <IconButton
                                edge="end"
                                onClick={() => handleQuickAction('manage-members', committee.id)}
                                disabled={!permissions[committee.id]?.canManageMembers}
                                size="small"
                              >
                                <PersonAddIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Nueva reunión">
                              <IconButton
                                edge="end"
                                onClick={() => handleQuickAction('create-meeting', committee.id)}
                                disabled={!permissions[committee.id]?.canCreateMeetings}
                                size="small"
                              >
                                <ScheduleIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getCommitteeTypeColor(committee.committee_type) }}>
                            <GroupIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              {committee.name}
                              {!committee.is_active && (
                                <Chip label="Inactivo" size="small" color="default" />
                              )}
                            </Box>
                          }
                          secondary={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <Chip
                                label={getCommitteeTypeLabel(committee.committee_type)}
                                size="small"
                                color={getCommitteeTypeColor(committee.committee_type)}
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary" component="span">
                                {committee.description}
                              </Typography>
                            </span>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                      {index < filteredCommittees.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Meetings with Enhanced Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Próximas Reuniones
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/committees/meetings')}
                >
                  Ver todas
                </Button>
              </Box>
              <List>
                {upcomingMeetings.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No hay reuniones próximas
                  </Typography>
                ) : (
                  upcomingMeetings.map((meeting) => {
                    const isOverdue = new Date(meeting.meeting_date) < new Date();
                    return (
                      <ListItem key={meeting.id}>
                        <ListItemIcon>
                          {isOverdue ? (
                            <WarningIcon color="error" />
                          ) : (
                            <EventIcon color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              {meeting.title}
                              {isOverdue && (
                                <Chip label="Vencida" size="small" color="error" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {new Date(meeting.meeting_date).toLocaleDateString()} - {meeting.duration_minutes} min
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {meeting.location || 'Ubicación no especificada'}
                              </Typography>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    );
                  })
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Votings with Enhanced Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Votaciones Activas
                </Typography>

              </Box>
              <List>
                {activeVotings.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No hay votaciones activas
                  </Typography>
                ) : (
                  activeVotings.map((voting) => (
                    <ListItem key={voting.id}>
                      <ListItemIcon>
                        <HowToVoteIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={voting.title}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Termina: {voting.end_time ? new Date(voting.end_time).toLocaleDateString() : 'Sin fecha límite'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {voting.description || 'Sin descripción'}
                            </Typography>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Activities with Priority */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Actividades Pendientes
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/committees/activities')}
                >
                  Ver todas
                </Button>
              </Box>
              <List>
                {pendingActivities.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No hay actividades pendientes
                  </Typography>
                ) : (
                  pendingActivities.map((activity) => {
                    const isOverdue = activity.due_date && new Date(activity.due_date) < new Date();
                    return (
                      <ListItem key={activity.id}>
                        <ListItemIcon>
                          {isOverdue ? (
                            <WarningIcon color="error" />
                          ) : (
                            <AssignmentIcon color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              {activity.title}
                              {activity.priority && (
                                <Chip 
                                  label={activity.priority} 
                                  size="small" 
                                  color={getActivityPriorityColor(activity.priority)}
                                />
                              )}
                              {isOverdue && (
                                <Chip label="Vencida" size="small" color="error" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Vence: {activity.due_date ? new Date(activity.due_date).toLocaleDateString() : 'Sin fecha límite'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.description || 'Sin descripción'}
                              </Typography>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    );
                  })
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filtros de Comités</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tipo de Comité</InputLabel>
              <Select
                value={filters.committee_type || ''}
                label="Tipo de Comité"
                onChange={(e) => handleFilterChange('committee_type', e.target.value || undefined)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={CommitteeType.CONVIVENCIA}>Convivencia</MenuItem>
                <MenuItem value={CommitteeType.COPASST}>COPASST</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.is_active !== undefined ? filters.is_active.toString() : ''}
                label="Estado"
                onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Activo</MenuItem>
                <MenuItem value="false">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterReset}>Limpiar Filtros</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Committee Creation */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleQuickAction('create-committee')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default CommitteeDashboard;