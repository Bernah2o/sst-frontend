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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  HelpOutline as ExcusedIcon,
  HelpOutline,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { committeeMemberService } from '../services/committeeMemberService';
import {
  Meeting,
  MeetingAttendance,
  MeetingAttendanceCreate,
  MeetingAttendanceUpdate,
  MeetingAttendanceStatus,
  CommitteeMember,
} from '../types';

const MeetingAttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { meetingId } = useParams<{ meetingId: string }>();
  
  // Estados principales
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [attendances, setAttendances] = useState<MeetingAttendance[]>([]);
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<MeetingAttendance | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState<MeetingAttendance | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    member_id: '',
    status: MeetingAttendanceStatus.PRESENT,
    check_in_time: '',
    check_out_time: '',
    notes: '',
  });

  const loadAttendances = useCallback(async () => {
    if (!meetingId || !meeting) return;
    
    try {
      const attendancesData = await meetingService.getMeetingAttendance(
        parseInt(meetingId), 
        meeting.committee_id
      );
      setAttendances(attendancesData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las asistencias');
    }
  }, [meetingId, meeting]);

  const loadMeetingData = useCallback(async () => {
    if (!meetingId) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Primero necesitamos obtener la reunión para conocer el committee_id
      // Como no tenemos el committee_id inicialmente, usaremos getAllMeetings para encontrar la reunión
      const allMeetings = await meetingService.getAllMeetings();
      const meetingData = allMeetings.find(m => m.id === parseInt(meetingId));
      
      if (!meetingData) {
        throw new Error('Reunión no encontrada');
      }
      
      setMeeting(meetingData);
      
      // Cargar asistencias
      await loadAttendances();
      
      // Cargar miembros del comité
      const membersData = await committeeMemberService.getCommitteeMembers(meetingData.committee_id);
      setMembers(membersData);
      
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de la reunión');
    } finally {
      setLoading(false);
    }
  }, [meetingId, loadAttendances]);

  useEffect(() => {
    if (meetingId) {
      loadMeetingData();
    }
  }, [meetingId, loadMeetingData]);

  const handleCreateAttendance = () => {
    setEditingAttendance(null);
    setFormData({
      member_id: '',
      status: MeetingAttendanceStatus.PRESENT,
      check_in_time: '',
      check_out_time: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleEditAttendance = (attendance: MeetingAttendance) => {
    setEditingAttendance(attendance);
    setFormData({
      member_id: attendance.member_id.toString(),
      status: attendance.status,
      check_in_time: attendance.check_in_time || '',
      check_out_time: attendance.check_out_time || '',
      notes: attendance.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSaveAttendance = async () => {
    if (!meetingId || !meeting) return;
    
    setLoading(true);
    setError('');
    
    try {
      const attendanceData = {
        meeting_id: parseInt(meetingId),
        member_id: parseInt(formData.member_id),
        status: formData.status,
        check_in_time: formData.check_in_time || undefined,
        check_out_time: formData.check_out_time || undefined,
        notes: formData.notes || undefined,
      };

      if (editingAttendance) {
        await meetingService.updateAttendance(
          editingAttendance.id,
          attendanceData as MeetingAttendanceUpdate,
          meeting.committee_id,
          parseInt(meetingId)
        );
      } else {
        await meetingService.recordAttendance(
          attendanceData as MeetingAttendanceCreate,
          meeting.committee_id
        );
      }

      setDialogOpen(false);
      await loadAttendances();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttendance = (attendance: MeetingAttendance) => {
    setAttendanceToDelete(attendance);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAttendance = async () => {
    if (!attendanceToDelete || !meetingId || !meeting) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Nota: Necesitaríamos implementar deleteAttendance en el servicio
      // await meetingService.deleteAttendance(attendanceToDelete.id, meeting.committee_id, parseInt(meetingId));
      
      setDeleteDialogOpen(false);
      setAttendanceToDelete(null);
      await loadAttendances();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: MeetingAttendanceStatus) => {
    switch (status) {
      case MeetingAttendanceStatus.PRESENT:
        return <PresentIcon color="success" />;
      case MeetingAttendanceStatus.ABSENT:
        return <AbsentIcon color="error" />;
      case MeetingAttendanceStatus.LATE:
        return <LateIcon color="warning" />;
      case MeetingAttendanceStatus.EXCUSED:
        return <ExcusedIcon color="info" />;
      default:
        return <HelpOutline color="disabled" />;
    }
  };

  const getStatusColor = (status: MeetingAttendanceStatus) => {
    switch (status) {
      case MeetingAttendanceStatus.PRESENT:
        return 'success';
      case MeetingAttendanceStatus.ABSENT:
        return 'error';
      case MeetingAttendanceStatus.LATE:
        return 'warning';
      case MeetingAttendanceStatus.EXCUSED:
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: MeetingAttendanceStatus) => {
    switch (status) {
      case MeetingAttendanceStatus.PRESENT:
        return 'Presente';
      case MeetingAttendanceStatus.ABSENT:
        return 'Ausente';
      case MeetingAttendanceStatus.LATE:
        return 'Tardío';
      case MeetingAttendanceStatus.EXCUSED:
        return 'Justificado';
      default:
        return status;
    }
  };

  const getMemberName = (memberId: number) => {
    const member = members.find(m => m.id === memberId);
    return member && member.user ? `${member.user.first_name} ${member.user.last_name}` : `Miembro ${memberId}`;
  };

  if (loading && !meeting) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4">
            Gestión de Asistencia
          </Typography>
          {meeting && (
            <Typography variant="subtitle1" color="text.secondary">
              {meeting.title} - {new Date(meeting.meeting_date).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {attendances.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Asistencias
                </Typography>
                <Typography variant="h4">
                  {attendances.length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Presentes
                </Typography>
                <Typography variant="h4" color="success.main">
                  {attendances.filter(a => a.status === MeetingAttendanceStatus.PRESENT).length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Ausentes
                </Typography>
                <Typography variant="h4" color="error.main">
                  {attendances.filter(a => a.status === MeetingAttendanceStatus.ABSENT).length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Tardíos
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {attendances.filter(a => a.status === MeetingAttendanceStatus.LATE).length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Acciones */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateAttendance}
          disabled={loading}
        >
          Registrar Asistencia
        </Button>
      </Box>

      {/* Tabla de asistencias */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Miembro</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Hora de Entrada</TableCell>
                <TableCell>Hora de Salida</TableCell>
                <TableCell>Notas</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay registros de asistencia
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                attendances.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>{getMemberName(attendance.member_id)}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(attendance.status)}
                        label={getStatusLabel(attendance.status)}
                        color={getStatusColor(attendance.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{attendance.check_in_time || 'N/A'}</TableCell>
                    <TableCell>{attendance.check_out_time || 'N/A'}</TableCell>
                    <TableCell>{attendance.notes || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEditAttendance(attendance)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAttendance(attendance)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo de crear/editar asistencia */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAttendance ? 'Editar Asistencia' : 'Registrar Asistencia'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Miembro</InputLabel>
              <Select
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                label="Miembro"
                disabled={!!editingAttendance}
              >
                {members.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.user ? `${member.user.first_name} ${member.user.last_name}` : `Miembro ${member.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MeetingAttendanceStatus })}
                label="Estado"
              >
                <MenuItem value={MeetingAttendanceStatus.PRESENT}>Presente</MenuItem>
                <MenuItem value={MeetingAttendanceStatus.ABSENT}>Ausente</MenuItem>
                <MenuItem value={MeetingAttendanceStatus.LATE}>Tardío</MenuItem>
                <MenuItem value={MeetingAttendanceStatus.EXCUSED}>Justificado</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Hora de Entrada"
              type="time"
              value={formData.check_in_time}
              onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Hora de Salida"
              type="time"
              value={formData.check_out_time}
              onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Notas"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveAttendance} 
            variant="contained"
            disabled={loading || !formData.member_id}
          >
            {loading ? 'Guardando...' : (editingAttendance ? 'Actualizar' : 'Registrar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar el registro de asistencia de{' '}
            {attendanceToDelete && getMemberName(attendanceToDelete.member_id)}?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmDeleteAttendance} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingAttendancePage;