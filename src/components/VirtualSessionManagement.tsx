import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  VideoCall as VideoCallIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';

interface VirtualSession {
  id: number;
  course_name: string;
  session_date: string;
  end_date: string;
  virtual_session_link: string;
  session_code: string;
  valid_until: string;
  max_participants?: number;
  description?: string;
  is_active: boolean;
  creator_id: number;
  creator_name: string;
  participants_count: number;
  duration_minutes?: number;
  is_session_active?: boolean;
  is_session_expired?: boolean;
  created_at: string;
  updated_at: string;
}

interface VirtualSessionFormData {
  course_name: string;
  session_date: Date | null;
  end_date: Date | null;
  virtual_session_link: string;
  max_participants?: number;
  description?: string;
}

interface VirtualSessionManagementProps {
  open: boolean;
  onClose: () => void;
}

const VirtualSessionManagement: React.FC<VirtualSessionManagementProps> = ({
  open,
  onClose,
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<VirtualSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openParticipantsDialog, setOpenParticipantsDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<VirtualSession | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [formData, setFormData] = useState<VirtualSessionFormData>({
    course_name: '',
    session_date: null,
    end_date: null,
    virtual_session_link: '',
    max_participants: undefined,
    description: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance/virtual-sessions');
      setSessions(response.data.items || []);
    } catch (error) {
      console.error('Error fetching virtual sessions:', error);
      showSnackbar('Error al cargar las sesiones virtuales', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (sessionId: number) => {
    try {
      const response = await api.get(`/attendance/virtual-sessions/${sessionId}/participants`);
      setParticipants(response.data.participants || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      showSnackbar('Error al cargar los participantes', 'error');
    }
  };

  const handleCreateSession = async () => {
    try {
      if (!formData.course_name || !formData.session_date || !formData.virtual_session_link) {
        showSnackbar('Por favor complete todos los campos requeridos', 'error');
        return;
      }

      // Validar que end_date sea posterior a session_date si se proporciona
      if (formData.end_date && formData.session_date && formData.end_date <= formData.session_date) {
        showSnackbar('La fecha de finalización debe ser posterior a la fecha de inicio', 'error');
        return;
      }

      const sessionData = {
        course_name: formData.course_name,
        session_date: formData.session_date?.toISOString(),
        end_date: formData.end_date?.toISOString(),
        virtual_session_link: formData.virtual_session_link,
        max_participants: formData.max_participants,
        description: formData.description,
      };

      const response = await api.post('/attendance/virtual-sessions', sessionData);
      
      if (response.data.success) {
        showSnackbar(`Sesión creada exitosamente. Código: ${response.data.session_code}`, 'success');
        setOpenCreateDialog(false);
        resetForm();
        fetchSessions();
      }
    } catch (error) {
      console.error('Error creating virtual session:', error);
      showSnackbar('Error al crear la sesión virtual', 'error');
    }
  };

  const handleEditSession = (session: VirtualSession) => {
    setSelectedSession(session);
    setFormData({
      course_name: session.course_name,
      session_date: new Date(session.session_date),
      end_date: new Date(session.end_date),
      virtual_session_link: session.virtual_session_link,
      max_participants: session.max_participants,
      description: session.description || '',
    });
    setOpenEditDialog(true);
  };

  const handleUpdateSession = async () => {
    try {
      if (!selectedSession || !formData.course_name || !formData.session_date || !formData.virtual_session_link) {
        showSnackbar('Por favor complete todos los campos requeridos', 'error');
        return;
      }

      // Validar que end_date sea posterior a session_date si se proporciona
      if (formData.end_date && formData.session_date && formData.end_date <= formData.session_date) {
        showSnackbar('La fecha de finalización debe ser posterior a la fecha de inicio', 'error');
        return;
      }

      const sessionData = {
        course_name: formData.course_name,
        session_date: formData.session_date?.toISOString(),
        end_date: formData.end_date?.toISOString(),
        virtual_session_link: formData.virtual_session_link,
        max_participants: formData.max_participants,
        description: formData.description,
      };

      const response = await api.put(`/attendance/virtual-sessions/${selectedSession.id}`, sessionData);
      
      if (response.data.success) {
        showSnackbar('Sesión actualizada exitosamente', 'success');
        setOpenEditDialog(false);
        resetForm();
        setSelectedSession(null);
        fetchSessions();
      }
    } catch (error) {
      console.error('Error updating virtual session:', error);
      showSnackbar('Error al actualizar la sesión virtual', 'error');
    }
  };

  const handleDeleteSession = (session: VirtualSession) => {
    setSelectedSession(session);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteSession = async () => {
    try {
      if (!selectedSession) return;

      const response = await api.delete(`/attendance/virtual-sessions/${selectedSession.id}`);
      
      if (response.data.success) {
        showSnackbar('Sesión eliminada exitosamente', 'success');
        setOpenDeleteDialog(false);
        setSelectedSession(null);
        fetchSessions();
      }
    } catch (error) {
      console.error('Error deleting virtual session:', error);
      showSnackbar('Error al eliminar la sesión virtual', 'error');
    }
  };

  const handleViewParticipants = async (session: VirtualSession) => {
    setSelectedSession(session);
    await fetchParticipants(session.id);
    setOpenParticipantsDialog(true);
  };

  const handleCopySessionCode = (sessionCode: string) => {
    navigator.clipboard.writeText(sessionCode);
    showSnackbar('Código copiado al portapapeles', 'success');
  };

  const handleCopySessionLink = (sessionLink: string) => {
    navigator.clipboard.writeText(sessionLink);
    showSnackbar('Enlace copiado al portapapeles', 'success');
  };

  const resetForm = () => {
    setFormData({
      course_name: '',
      session_date: null,
      end_date: null,
      virtual_session_link: '',
      max_participants: 50,
      description: '',
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusChip = (session: VirtualSession) => {
    const now = new Date();
    const sessionDate = new Date(session.session_date);
    const endDate = new Date(session.end_date);

    if (!session.is_active) {
      return <Chip label="Inactiva" color="default" size="small" />;
    } else if (now < sessionDate) {
      return <Chip label="Programada" color="info" size="small" />;
    } else if (now >= sessionDate && now <= endDate) {
      return <Chip label="En Curso" color="success" size="small" />;
    } else {
      return <Chip label="Finalizada" color="warning" size="small" />;
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Gestión de Sesiones Virtuales</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              Nueva Sesión
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Curso</TableCell>
                    <TableCell>Fecha/Hora Inicio</TableCell>
                    <TableCell>Duración</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Participantes</TableCell>
                    <TableCell>Creado por</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No hay sesiones virtuales creadas
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{session.course_name}</TableCell>
                        <TableCell>{formatDate(session.session_date)}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <ScheduleIcon fontSize="small" />
                            <Typography variant="body2">
                              {session.duration_minutes ? `${session.duration_minutes} min` : '2h (por defecto)'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontFamily="monospace">
                              {session.session_code}
                            </Typography>
                            <Tooltip title="Copiar código">
                              <IconButton
                                size="small"
                                onClick={() => handleCopySessionCode(session.session_code)}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell>{getStatusChip(session)}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PeopleIcon fontSize="small" />
                            <Typography variant="body2">
                              {session.participants_count}
                              {session.max_participants && ` / ${session.max_participants}`}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{session.creator_name}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver participantes">
                            <IconButton
                              size="small"
                              onClick={() => handleViewParticipants(session)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copiar enlace">
                            <IconButton
                              size="small"
                              onClick={() => handleCopySessionLink(session.virtual_session_link)}
                            >
                              <VideoCallIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar sesión">
                            <IconButton
                              size="small"
                              onClick={() => handleEditSession(session)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar sesión">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSession(session)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear nueva sesión */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nueva Sesión Virtual</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nombre del Curso"
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Fecha y Hora de Inicio"
                  value={formData.session_date}
                  onChange={(newValue) => setFormData({ ...formData, session_date: newValue })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Fecha y Hora de Finalización"
                  value={formData.end_date}
                  onChange={(newValue) => setFormData({ ...formData, end_date: newValue })}
                  minDateTime={formData.session_date || undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Opcional - Si no se especifica, se asumirán 2 horas de duración",
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Máximo de Participantes"
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Enlace de la Sesión Virtual"
                value={formData.virtual_session_link}
                onChange={(e) => setFormData({ ...formData, virtual_session_link: e.target.value })}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción (Opcional)"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateSession}>
            Crear Sesión
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para ver participantes */}
      <Dialog open={openParticipantsDialog} onClose={() => setOpenParticipantsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Participantes de la Sesión Virtual
          <IconButton
            aria-label="close"
            onClick={() => setOpenParticipantsDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedSession.course_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Código de Sesión: {selectedSession.session_code} | 
                Fecha: {new Date(selectedSession.session_date).toLocaleDateString('es-ES')} | 
                Participantes: {participants.length} / {selectedSession.max_participants}
              </Typography>
            </Box>
          )}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Participante</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Entrada</TableCell>
                  <TableCell>Salida</TableCell>
                  <TableCell>Duración</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay participantes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((participant, index) => (
                    <TableRow key={index}>
                      <TableCell>{participant.user_name}</TableCell>
                      <TableCell>{participant.user_email}</TableCell>
                      <TableCell>
                        {participant.check_in_time 
                          ? new Date(participant.check_in_time).toLocaleTimeString('es-ES')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {participant.check_out_time 
                          ? new Date(participant.check_out_time).toLocaleTimeString('es-ES')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {participant.duration_minutes 
                          ? `${participant.duration_minutes} min`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={participant.status === 'checked_in' ? 'En línea' : 'Desconectado'}
                          color={participant.status === 'checked_in' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar sesión virtual */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Editar Sesión Virtual
          <IconButton
            aria-label="close"
            onClick={() => setOpenEditDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nombre del Curso"
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Fecha y Hora de Inicio"
                  value={formData.session_date}
                  onChange={(newValue) => setFormData({ ...formData, session_date: newValue })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Fecha y Hora de Finalización"
                  value={formData.end_date}
                  onChange={(newValue) => setFormData({ ...formData, end_date: newValue })}
                  minDateTime={formData.session_date || undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Opcional - Si no se especifica, se asumirán 2 horas de duración",
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Máximo de Participantes"
                type="number"
                value={formData.max_participants || ''}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || undefined })}
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Enlace de la Sesión Virtual"
                value={formData.virtual_session_link}
                onChange={(e) => setFormData({ ...formData, virtual_session_link: e.target.value })}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción (Opcional)"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateSession}
            variant="contained"
            disabled={!formData.course_name || !formData.session_date || !formData.virtual_session_link}
          >
            Actualizar Sesión
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar sesión */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm">
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar esta sesión virtual?
          </Typography>
          {selectedSession && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Curso:</strong> {selectedSession.course_name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Fecha:</strong> {new Date(selectedSession.session_date).toLocaleString('es-ES')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Código:</strong> {selectedSession.session_code}
              </Typography>
              <Typography variant="body2" color="error">
                <strong>Advertencia:</strong> Esta acción no se puede deshacer y eliminará todos los registros de asistencia asociados.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmDeleteSession}
            variant="contained"
            color="error"
          >
            Eliminar Sesión
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default VirtualSessionManagement;