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
  Tab,
  Tabs,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  Event as EventIcon,
  HowToVote as VoteIcon,
  Assignment as TaskIcon,
  Description as DocumentIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { committeeService } from '../services/committeeService';
import { committeeMemberService } from '../services/committeeMemberService';
import { meetingService } from '../services/meetingService';
import { votingService } from '../services/votingService';
import { committeeActivityService } from '../services/committeeActivityService';
import { committeeDocumentService } from '../services/committeeDocumentService';
import { committeePermissionService } from '../services/committeePermissionService';
import ActivityForm from '../components/ActivityForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  Committee,
  CommitteeMember,
  Meeting,
  Voting,
  Activity,
  ActivityCreate,
  ActivityUpdate,
  CommitteeDocument,
  CommitteeType,
  CommitteeRole,
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
      id={`committee-tabpanel-${index}`}
      aria-labelledby={`committee-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CommitteeDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [votings, setVotings] = useState<Voting[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [documents, setDocuments] = useState<CommitteeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
  const [permissions, setPermissions] = useState({
    canView: false,
    canEdit: false,
    canManageMembers: false,
    canCreateMeetings: false,
    canManageVotings: false,
    canUploadDocuments: false,
  });

  // Confirm dialog hook
  const { dialogState, showConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (id) {
      const committeeId = parseInt(id);
      // Only show error for clearly invalid IDs
      if (isNaN(committeeId) || committeeId <= 0) {
        setError('El identificador del comité no es válido. Por favor, verifica la URL e intenta nuevamente.');
        setLoading(false);
        return;
      }
      loadCommitteeData(committeeId);
    } else {
      setError('No se ha especificado qué comité mostrar. Por favor, selecciona un comité desde el listado.');
      setLoading(false);
    }
  }, [id]);

  const loadCommitteeData = async (committeeId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Check permissions first
      const canView = await committeePermissionService.canView(committeeId);
      if (!canView) {
        setError('No tienes los permisos necesarios para acceder a este comité. Contacta al administrador si necesitas acceso.');
        return;
      }

      // Load permissions
      const canEdit = await committeePermissionService.canEdit(committeeId);
      const canManageMembers = await committeePermissionService.canManageMembers(committeeId);
      const canCreateMeetings = await committeePermissionService.canCreateMeetings(committeeId);
      const canManageVotings = await committeePermissionService.canManageVotings(committeeId);
      const canUploadDocuments = await committeePermissionService.canUploadDocuments(committeeId);

      setPermissions({
        canView,
        canEdit,
        canManageMembers,
        canCreateMeetings,
        canManageVotings,
        canUploadDocuments,
      });

      // Load committee data
      const committeeData = await committeeService.getCommittee(committeeId);
      setCommittee(committeeData);

      // Load related data
      const [membersData, meetingsData, votingsData, activitiesData, documentsData] = await Promise.all([
        committeeMemberService.getCommitteeMembers(committeeId),
        meetingService.getMeetings({ committee_id: committeeId }),
        votingService.getVotings({ committee_id: committeeId, page_size: 10 }),
        committeeActivityService.getActivities(committeeId, { limit: 10 }),
        committeeDocumentService.getDocuments({ committee_id: committeeId, page_size: 10 }),
      ]);

      setMembers(membersData);
      setMeetings(meetingsData); // getMeetings returns Meeting[] directly
      setVotings(votingsData.items || []); // getVotings returns { items: Voting[], ... }
      setActivities(activitiesData.activities || []); // getActivities returns { activities: Activity[], ... }
      setDocuments(documentsData.items || []); // getDocuments returns { items: CommitteeDocument[], ... }
    } catch (err) {
      setError('Hubo un problema al cargar la información del comité. Por favor, intenta recargar la página o contacta al soporte técnico si el problema persiste.');
      console.error('Committee detail loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  const getRoleLabel = (role: CommitteeRole): string => {
    switch (role) {
      case CommitteeRole.PRESIDENT:
        return 'Presidente';
      case CommitteeRole.VICE_PRESIDENT:
        return 'Vicepresidente';
      case CommitteeRole.SECRETARY:
        return 'Secretario';
      case CommitteeRole.MEMBER:
        return 'Miembro';
      default:
        return role;
    }
  };

  const getRoleColor = (role: CommitteeRole): 'primary' | 'secondary' | 'success' | 'warning' => {
    switch (role) {
      case CommitteeRole.PRESIDENT:
        return 'primary';
      case CommitteeRole.VICE_PRESIDENT:
        return 'secondary';
      case CommitteeRole.SECRETARY:
        return 'success';
      case CommitteeRole.MEMBER:
        return 'warning';
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/committees')}
          sx={{ mt: 2 }}
        >
          Volver a Comités
        </Button>
      </Box>
    );
  }

  if (!committee) {
    return (
      <Box p={3}>
        <Alert severity="warning">Comité no encontrado</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/committees')}
          sx={{ mt: 2 }}
        >
          Volver a Comités
        </Button>
      </Box>
    );
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (committee) {
      try {
        await committeeService.deleteCommittee(committee.id);
        setDeleteDialogOpen(false);
        navigate('/admin/committees');
      } catch (err) {
        setError('Error al eliminar el comité');
        console.error('Committee deletion error:', err);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Activity management functions
  const handleCreateActivity = () => {
    setEditingActivity(undefined);
    setActivityFormOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setActivityFormOpen(true);
  };

  const handleActivityFormClose = () => {
    setActivityFormOpen(false);
    setEditingActivity(undefined);
  };

  const handleActivitySubmit = async (data: ActivityCreate | ActivityUpdate) => {
    try {
      if (editingActivity && committee) {
        // Editing existing activity
        await committeeActivityService.updateActivity(committee.id, editingActivity.id, data as ActivityUpdate);
      } else if (committee) {
        // Creating new activity
        await committeeActivityService.createActivity(committee.id, { ...data, committee_id: committee.id } as ActivityCreate);
      }
      
      if (committee) {
        loadCommitteeData(committee.id);
      }
      setActivityFormOpen(false);
      setEditingActivity(undefined);
    } catch (err) {
      console.error('Activity submit error:', err);
      throw err; // Let the form handle the error display
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!committee) return;

    try {
      const confirmed = await showConfirmDialog({
        title: "Confirmar eliminación",
        message: "¿Estás seguro de que quieres eliminar esta actividad? Esta acción no se puede deshacer.",
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        severity: "warning"
      });

      if (!confirmed) return;

      await committeeActivityService.deleteActivity(activityId, committee.id);
      loadCommitteeData(committee.id);
    } catch (err) {
      setError('Error al eliminar la actividad');
      console.error('Activity deletion error:', err);
    }
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/admin/committees')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              {committee.name}
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              <Chip
                label={getCommitteeTypeLabel(committee.committee_type)}
                size="small"
                color={getCommitteeTypeColor(committee.committee_type)}
                sx={{ mr: 1 }}
              />
              <Chip
                label={committee.is_active ? 'Activo' : 'Inactivo'}
                size="small"
                color={committee.is_active ? 'success' : 'default'}
              />
            </Box>
          </Box>
        </Box>
        <Box>
           <Button
             variant="outlined"
             startIcon={<SettingsIcon />}
             onClick={() => navigate(`/admin/committees/${committee.id}`)}
             disabled={!permissions.canManageMembers}
             sx={{ mr: 2 }}
           >
             Configuración
           </Button>
           <Button
             variant="contained"
             startIcon={<EditIcon />}
             onClick={() => navigate(`/admin/committees/${committee.id}/edit`)}
             disabled={!permissions.canEdit}
             sx={{ mr: 2 }}
           >
             Editar
           </Button>
           <Button
             variant="outlined"
             color="error"
             startIcon={<DeleteIcon />}
             onClick={handleDeleteClick}
             disabled={!permissions.canEdit}
           >
             Eliminar
           </Button>
         </Box>
      </Box>

      {/* Committee Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información del Comité
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {committee.description}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Fecha de Creación
              </Typography>
              <Typography variant="body2">
                {new Date(committee.created_at).toLocaleDateString('es-ES')}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Última Actualización
              </Typography>
              <Typography variant="body2">
                {new Date(committee.updated_at).toLocaleDateString('es-ES')}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Total de Miembros
              </Typography>
              <Typography variant="body2">
                {members.filter(m => m.is_active).length} activos
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Estado
              </Typography>
              <Typography variant="body2">
                {committee.is_active ? 'Activo' : 'Inactivo'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="committee tabs">
          <Tab label="Miembros" />
          <Tab label="Reuniones" />
          <Tab label="Votaciones" />
          <Tab label="Actividades" />
          <Tab label="Documentos" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Members Tab */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Miembros del Comité</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/admin/committees/${committee.id}/members`)}
            disabled={!permissions.canManageMembers}
          >
            Agregar Miembro
          </Button>
        </Box>
        <Card>
          <CardContent>
            <List>
              {members.filter(m => m.is_active).map((member, index) => (
                <React.Fragment key={member.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getRoleColor(member.role) }}>
                        <GroupIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.user ? `${member.user.first_name} ${member.user.last_name}` : 'Usuario no disponible'}
                      secondary={
                        <Box>
                          <Chip
                            label={getRoleLabel(member.role)}
                            size="small"
                            color={getRoleColor(member.role)}
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Desde: {member.start_date ? new Date(member.start_date).toLocaleDateString('es-ES') : 'No especificado'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < members.filter(m => m.is_active).length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {members.filter(m => m.is_active).length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  No hay miembros activos en este comité
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Meetings Tab */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Reuniones</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/admin/committees/${committee.id}/meetings/new`)}
            disabled={!permissions.canCreateMeetings}
          >
            Nueva Reunión
          </Button>
        </Box>
        <Card>
          <CardContent>
            <List>
              {meetings.map((meeting, index) => (
                <React.Fragment key={meeting.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <EventIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={meeting.title}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {new Date(meeting.meeting_date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {meeting.location}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < meetings.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {meetings.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  Aún no hay reuniones programadas para este comité. {permissions.canCreateMeetings ? 'Puedes crear una nueva reunión usando el botón "Nueva Reunión".' : 'Las reuniones aparecerán aquí cuando sean programadas.'}
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Votings Tab */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Votaciones</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/admin/committees/${committee.id}/votings/new`)}
            disabled={!permissions.canManageVotings}
          >
            Nueva Votación
          </Button>
        </Box>
        <Card>
          <CardContent>
            <List>
              {votings.map((voting, index) => (
                <React.Fragment key={voting.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <VoteIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={voting.title}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {new Date(voting.start_time).toLocaleDateString('es-ES')} - {voting.end_time ? new Date(voting.end_time).toLocaleDateString('es-ES') : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {voting.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < votings.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {votings.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  Aún no hay votaciones registradas para este comité. {permissions.canManageVotings ? 'Puedes crear una nueva votación usando el botón "Nueva Votación".' : 'Las votaciones aparecerán aquí cuando sean creadas.'}
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Activities Tab */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Actividades</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateActivity}
            disabled={!permissions.canEdit}
          >
            Nueva Actividad
          </Button>
        </Box>
        <Card>
          <CardContent>
            <List>
              {activities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem
                    secondaryAction={
                      permissions.canEdit && (
                        <Box>
                          <IconButton
                            edge="end"
                            aria-label="more"
                            onClick={(event) => {
                              const menu = document.createElement('div');
                              menu.style.position = 'absolute';
                              menu.style.zIndex = '1000';
                              menu.innerHTML = `
                                <div style="background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                                  <button id="edit-activity" style="display: block; width: 100%; padding: 8px 16px; border: none; background: none; text-align: left; cursor: pointer;">Editar</button>
                                  <button id="delete-activity" style="display: block; width: 100%; padding: 8px 16px; border: none; background: none; text-align: left; cursor: pointer; color: red;">Eliminar</button>
                                </div>
                              `;
                              document.body.appendChild(menu);
                              
                              const rect = event.currentTarget.getBoundingClientRect();
                              menu.style.left = `${rect.left}px`;
                              menu.style.top = `${rect.bottom}px`;
                              
                              const editBtn = menu.querySelector('#edit-activity');
                              const deleteBtn = menu.querySelector('#delete-activity');
                              
                              editBtn?.addEventListener('click', () => {
                                handleEditActivity(activity);
                                document.body.removeChild(menu);
                              });
                              
                              deleteBtn?.addEventListener('click', () => {
                                handleDeleteActivity(activity.id);
                                document.body.removeChild(menu);
                              });
                              
                              const closeMenu = (e: MouseEvent) => {
                                if (!menu.contains(e.target as Node)) {
                                  document.body.removeChild(menu);
                                  document.removeEventListener('click', closeMenu);
                                }
                              };
                              
                              setTimeout(() => document.addEventListener('click', closeMenu), 0);
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'info.main' }}>
                        <TaskIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Vence: {activity.due_date ? new Date(activity.due_date).toLocaleDateString('es-ES') : 'Sin fecha límite'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < activities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {activities.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  Aún no hay actividades registradas para este comité. {permissions.canEdit ? 'Puedes crear una nueva actividad usando el botón "Nueva Actividad".' : 'Las actividades aparecerán aquí cuando sean creadas.'}
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {/* Documents Tab */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Documentos</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/admin/committees/${committee.id}/documents/new`)}
            disabled={!permissions.canUploadDocuments}
          >
            Subir Documento
          </Button>
        </Box>
        <Card>
          <CardContent>
            <List>
              {documents.map((document, index) => (
                <React.Fragment key={document.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <DocumentIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={document.title}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Subido: {new Date(document.created_at).toLocaleDateString('es-ES')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {document.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < documents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {documents.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  Aún no hay documentos subidos para este comité. {permissions.canUploadDocuments ? 'Puedes subir documentos usando el botón "Subir Documento".' : 'Los documentos aparecerán aquí cuando sean subidos.'}
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el comité "{committee?.name}"?
            Esta acción eliminará también todos los miembros, reuniones, votaciones, 
            documentos y actividades asociadas. Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Form */}
      <ActivityForm
        open={activityFormOpen}
        onClose={handleActivityFormClose}
        onSubmit={handleActivitySubmit}
        activity={editingActivity}
        members={members}
        loading={loading}
      />

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        severity={dialogState.severity}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </Box>
  );
};

export default CommitteeDetail;