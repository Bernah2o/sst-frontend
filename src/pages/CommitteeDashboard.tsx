import React, { useState, useEffect } from 'react';
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
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { committeeService } from '../services/committeeService';
import { meetingService } from '../services/meetingService';
import { votingService } from '../services/votingService';
import { committeeActivityService } from '../services/committeeActivityService';
import { committeePermissionService } from '../services/committeePermissionService';
import {
  Committee,
  CommitteeDashboard as DashboardData,
  Meeting,
  Voting,
  Activity,
  CommitteeType,
  ActivityStatus,
  MeetingStatus,
  VotingStatus,
} from '../types';

const CommitteeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userCommittees, setUserCommittees] = useState<Committee[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [activeVotings, setActiveVotings] = useState<Voting[]>([]);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [permissions, setPermissions] = useState<{ [key: number]: any }>({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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
        // Load upcoming meetings
        const meetings = await meetingService.getMeetings({ status: MeetingStatus.SCHEDULED });
        setUpcomingMeetings(meetings.slice(0, 5)); // Show only first 5

        // Load active votings
        const votingsData = await votingService.getVotings({ status: VotingStatus.ACTIVE });
        setActiveVotings(votingsData.items.slice(0, 5)); // Show only first 5

        // Load pending activities
        const committeeIds = committees.map(committee => committee.id);
        const activities = await committeeActivityService.getActivitiesByStatus(ActivityStatus.PENDING, committeeIds);
        setPendingActivities(activities.slice(0, 5)); // Show only first 5
      }
    } catch (err) {
      setError('Hubo un problema al cargar la información del dashboard. Por favor, intenta recargar la página o contacta al soporte técnico si el problema persiste.');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
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
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard de Comités
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/committees/new')}
        >
          Nuevo Comité
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Comités
                  </Typography>
                  <Typography variant="h4">
                    {userCommittees.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <GroupIcon />
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
                    Próximas Reuniones
                  </Typography>
                  <Typography variant="h4">
                    {upcomingMeetings.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <EventIcon />
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
                    Votaciones Activas
                  </Typography>
                  <Typography variant="h4">
                    {activeVotings.length}
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
                    {pendingActivities.length}
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

      <Grid container spacing={3}>
        {/* User's Committees */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mis Comités
              </Typography>
              <List>
                {userCommittees.map((committee, index) => (
                  <React.Fragment key={committee.id}>
                    <ListItem
                      secondaryAction={
                        <Box>
                          <Tooltip title="Ver comité">
                            <IconButton
                              edge="end"
                              onClick={() => navigate(`/admin/committees/${committee.id}`)}
                              disabled={!permissions[committee.id]?.canView}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar comité">
                            <IconButton
                              edge="end"
                              onClick={() => navigate(`/admin/committees/${committee.id}/edit`)}
                              disabled={!permissions[committee.id]?.canEdit}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Configuración">
                            <IconButton
                              edge="end"
                              onClick={() => navigate(`/admin/committees/${committee.id}`)}
                              disabled={!permissions[committee.id]?.canManageMembers}
                            >
                              <SettingsIcon />
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
                        primary={committee.name}
                        secondary={
                          <Box>
                            <Chip
                              label={getCommitteeTypeLabel(committee.committee_type)}
                              size="small"
                              color={getCommitteeTypeColor(committee.committee_type)}
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {committee.description}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < userCommittees.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Meetings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Próximas Reuniones
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/committees')}
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
                  upcomingMeetings.map((meeting) => (
                    <ListItem key={meeting.id}>
                      <ListItemIcon>
                        <EventIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={meeting.title}
                        secondary={`${new Date(meeting.meeting_date).toLocaleDateString()} - ${meeting.duration_minutes} min`}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Votings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Votaciones Activas
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/committees/votings')}
                >
                  Ver todas
                </Button>
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
                        <HowToVoteIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={voting.title}
                        secondary={`Termina: ${voting.end_time ? new Date(voting.end_time).toLocaleDateString() : 'Sin fecha límite'}`}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Activities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Actividades Pendientes
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/activities')}
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
                  pendingActivities.map((activity) => (
                    <ListItem key={activity.id}>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={`Vence: ${activity.due_date ? new Date(activity.due_date).toLocaleDateString() : 'Sin fecha límite'}`}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CommitteeDashboard;