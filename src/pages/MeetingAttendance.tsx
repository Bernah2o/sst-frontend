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
  Menu,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  HelpOutline as ExcusedIcon,
  HelpOutline,
  GroupAdd as MarkAllIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { committeeMemberService } from '../services/committeeMemberService';
import {
  Meeting,
  MeetingAttendance,
  MeetingAttendanceUpdate,
  MeetingAttendanceStatus,
  CommitteeMember,
  CommitteeRole,
} from '../types';

const MeetingAttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { meetingId } = useParams<{ meetingId: string }>();

  // Estados principales
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [attendances, setAttendances] = useState<MeetingAttendance[]>([]);
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null); // member_id currently saving
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de UI - menú inline de estado
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusMenuAttendance, setStatusMenuAttendance] = useState<MeetingAttendance | null>(null);

  // Estado del diálogo de edición detallada (hora entrada/salida, notas)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<MeetingAttendance | null>(null);
  const [editFormData, setEditFormData] = useState({
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
      const allMeetings = await meetingService.getAllMeetings();
      const meetingData = allMeetings.find(m => m.id === parseInt(meetingId));

      if (!meetingData) {
        throw new Error('Reunión no encontrada');
      }

      setMeeting(meetingData);

      // Cargar asistencias y miembros en paralelo
      const [attendancesData, membersData] = await Promise.all([
        meetingService.getMeetingAttendance(parseInt(meetingId), meetingData.committee_id),
        committeeMemberService.getCommitteeMembers(meetingData.committee_id),
      ]);

      setAttendances(attendancesData);
      setMembers(membersData);

    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de la reunión');
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    if (meetingId) {
      loadMeetingData();
    }
  }, [meetingId, loadMeetingData]);

  // --- Cambio de estado inline (click en chip) ---
  const handleStatusChipClick = (event: React.MouseEvent<HTMLElement>, attendance: MeetingAttendance) => {
    setStatusMenuAnchor(event.currentTarget);
    setStatusMenuAttendance(attendance);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setStatusMenuAttendance(null);
  };

  const handleInlineStatusChange = async (newStatus: MeetingAttendanceStatus) => {
    if (!statusMenuAttendance || !meetingId || !meeting) return;

    const memberId = statusMenuAttendance.member_id;
    handleStatusMenuClose();
    setSaving(memberId);

    try {
      await meetingService.updateAttendance(
        memberId,
        { status: newStatus } as MeetingAttendanceUpdate,
        meeting.committee_id,
        parseInt(meetingId)
      );
      // Actualizar localmente sin recargar todo
      setAttendances(prev => prev.map(a =>
        a.member_id === memberId ? { ...a, status: newStatus } : a
      ));
      setSuccessMsg(`Estado actualizado a ${getStatusLabel(newStatus)}`);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el estado');
    } finally {
      setSaving(null);
    }
  };

  // --- Marcar todos como presentes ---
  const handleMarkAllPresent = async () => {
    if (!meetingId || !meeting) return;

    const absentMembers = attendances.filter(a => a.status !== MeetingAttendanceStatus.PRESENT);
    if (absentMembers.length === 0) {
      setSuccessMsg('Todos los miembros ya están marcados como presentes');
      return;
    }

    setSaving(-1); // -1 indica operación masiva
    try {
      await Promise.all(
        absentMembers.map(a =>
          meetingService.updateAttendance(
            a.member_id,
            { status: MeetingAttendanceStatus.PRESENT } as MeetingAttendanceUpdate,
            meeting.committee_id,
            parseInt(meetingId)
          )
        )
      );
      // Actualizar localmente
      setAttendances(prev => prev.map(a => ({ ...a, status: MeetingAttendanceStatus.PRESENT })));
      setSuccessMsg(`${absentMembers.length} miembro(s) marcados como presentes`);
    } catch (err: any) {
      setError(err.message || 'Error al marcar asistencia masiva');
      await loadAttendances(); // Recargar en caso de error parcial
    } finally {
      setSaving(null);
    }
  };

  // --- Edición detallada (diálogo con hora entrada/salida y notas) ---
  const extractTimeFromDateTime = (dateTimeStr?: string | null): string => {
    if (!dateTimeStr) return '';
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  const formatTimeDisplay = (dateTimeStr?: string | null): string => {
    if (!dateTimeStr) return '—';
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '—';
    }
  };

  const handleEditDetails = (attendance: MeetingAttendance) => {
    setEditingAttendance(attendance);
    setEditFormData({
      status: attendance.status,
      check_in_time: extractTimeFromDateTime((attendance as any).arrival_time || attendance.check_in_time),
      check_out_time: extractTimeFromDateTime((attendance as any).departure_time || attendance.check_out_time),
      notes: attendance.notes || '',
    });
    setEditDialogOpen(true);
  };

  const buildDateTimeFromTime = (timeStr: string): string | undefined => {
    if (!timeStr || !meeting) return undefined;
    // Combinar la fecha de la reunión con la hora ingresada para crear un ISO datetime
    const meetingDate = new Date(meeting.meeting_date).toISOString().split('T')[0];
    return `${meetingDate}T${timeStr}:00`;
  };

  const handleSaveDetails = async () => {
    if (!editingAttendance || !meetingId || !meeting) return;

    setSaving(editingAttendance.member_id);

    try {
      // El backend espera arrival_time/departure_time como datetime ISO
      const updateData: Record<string, any> = {
        status: editFormData.status,
        notes: editFormData.notes || undefined,
      };

      const arrivalDateTime = buildDateTimeFromTime(editFormData.check_in_time);
      const departureDateTime = buildDateTimeFromTime(editFormData.check_out_time);

      if (arrivalDateTime) updateData.arrival_time = arrivalDateTime;
      if (departureDateTime) updateData.departure_time = departureDateTime;

      await meetingService.updateAttendance(
        editingAttendance.member_id,
        updateData as MeetingAttendanceUpdate,
        meeting.committee_id,
        parseInt(meetingId)
      );

      setEditDialogOpen(false);
      setEditingAttendance(null);
      await loadAttendances();
      setSuccessMsg('Asistencia actualizada correctamente');
    } catch (err: any) {
      setError(err.message || 'Error al guardar la asistencia');
    } finally {
      setSaving(null);
    }
  };

  // --- Utilidades de presentación ---
  const getStatusIcon = (status: MeetingAttendanceStatus) => {
    switch (status) {
      case MeetingAttendanceStatus.PRESENT:
        return <PresentIcon fontSize="small" />;
      case MeetingAttendanceStatus.ABSENT:
        return <AbsentIcon fontSize="small" />;
      case MeetingAttendanceStatus.LATE:
        return <LateIcon fontSize="small" />;
      case MeetingAttendanceStatus.EXCUSED:
        return <ExcusedIcon fontSize="small" />;
      default:
        return <HelpOutline fontSize="small" />;
    }
  };

  const getStatusColor = (status: MeetingAttendanceStatus): 'success' | 'error' | 'warning' | 'info' | 'default' => {
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

  const getRoleLabel = (role: CommitteeRole): string => {
    switch (role) {
      case CommitteeRole.PRESIDENT:
        return 'Presidente';
      case CommitteeRole.VICE_PRESIDENT:
        return 'Vicepresidente';
      case CommitteeRole.SECRETARY:
        return 'Secretario(a)';
      case CommitteeRole.MEMBER:
        return 'Miembro';
      case CommitteeRole.ALTERNATE:
        return 'Suplente';
      default:
        return role;
    }
  };

  const getMemberInfo = (memberId: number) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return { name: `Miembro ${memberId}`, role: '' };
    const name = member.user ? `${member.user.first_name} ${member.user.last_name}` : `Miembro ${memberId}`;
    const role = getRoleLabel(member.role);
    return { name, role };
  };

  // Estadísticas
  const stats = {
    total: attendances.length,
    present: attendances.filter(a => a.status === MeetingAttendanceStatus.PRESENT).length,
    absent: attendances.filter(a => a.status === MeetingAttendanceStatus.ABSENT).length,
    late: attendances.filter(a => a.status === MeetingAttendanceStatus.LATE).length,
    excused: attendances.filter(a => a.status === MeetingAttendanceStatus.EXCUSED).length,
  };
  const quorumReached = stats.total > 0 && (stats.present + stats.late) > stats.total / 2;

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
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">
            Gestión de Asistencia
          </Typography>
          {meeting && (
            <Typography variant="subtitle1" color="text.secondary">
              {meeting.title} - {new Date(meeting.meeting_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas y Quórum */}
      {attendances.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography color="text.secondary" variant="body2">Total</Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography color="text.secondary" variant="body2">Presentes</Typography>
                <Typography variant="h4" color="success.main">{stats.present}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography color="text.secondary" variant="body2">Ausentes</Typography>
                <Typography variant="h4" color="error.main">{stats.absent}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography color="text.secondary" variant="body2">Tardíos</Typography>
                <Typography variant="h4" color="warning.main">{stats.late}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <Card sx={{ bgcolor: quorumReached ? 'success.50' : 'warning.50' }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography color="text.secondary" variant="body2">Quórum</Typography>
                <Typography variant="h6" color={quorumReached ? 'success.main' : 'warning.main'}>
                  {quorumReached ? 'Alcanzado' : 'No alcanzado'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Acciones */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={saving === -1 ? <CircularProgress size={18} color="inherit" /> : <MarkAllIcon />}
          onClick={handleMarkAllPresent}
          disabled={saving !== null || attendances.length === 0}
        >
          Marcar Todos Presentes
        </Button>
        <Typography variant="body2" color="text.secondary">
          Haz clic en el estado de cada miembro para cambiarlo directamente
        </Typography>
      </Box>

      {/* Tabla de asistencias */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Miembro</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell>Hora Entrada</TableCell>
                <TableCell>Hora Salida</TableCell>
                <TableCell>Notas</TableCell>
                <TableCell align="center">Detalles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No hay registros de asistencia para esta reunión
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                attendances.map((attendance) => {
                  const memberInfo = getMemberInfo(attendance.member_id);
                  const isSaving = saving === attendance.member_id;
                  return (
                    <TableRow key={attendance.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {memberInfo.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {memberInfo.role}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {isSaving ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Tooltip title="Click para cambiar estado">
                            <Chip
                              icon={getStatusIcon(attendance.status)}
                              label={getStatusLabel(attendance.status)}
                              color={getStatusColor(attendance.status)}
                              size="small"
                              onClick={(e) => handleStatusChipClick(e, attendance)}
                              sx={{ cursor: 'pointer' }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatTimeDisplay((attendance as any).arrival_time || attendance.check_in_time)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatTimeDisplay((attendance as any).departure_time || attendance.check_out_time)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {attendance.notes || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar detalles (hora, notas)">
                          <IconButton
                            size="small"
                            onClick={() => handleEditDetails(attendance)}
                            disabled={saving !== null}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Menú inline de cambio de estado */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem
          onClick={() => handleInlineStatusChange(MeetingAttendanceStatus.PRESENT)}
          selected={statusMenuAttendance?.status === MeetingAttendanceStatus.PRESENT}
        >
          <PresentIcon color="success" sx={{ mr: 1 }} fontSize="small" /> Presente
        </MenuItem>
        <MenuItem
          onClick={() => handleInlineStatusChange(MeetingAttendanceStatus.ABSENT)}
          selected={statusMenuAttendance?.status === MeetingAttendanceStatus.ABSENT}
        >
          <AbsentIcon color="error" sx={{ mr: 1 }} fontSize="small" /> Ausente
        </MenuItem>
        <MenuItem
          onClick={() => handleInlineStatusChange(MeetingAttendanceStatus.LATE)}
          selected={statusMenuAttendance?.status === MeetingAttendanceStatus.LATE}
        >
          <LateIcon color="warning" sx={{ mr: 1 }} fontSize="small" /> Tardío
        </MenuItem>
        <MenuItem
          onClick={() => handleInlineStatusChange(MeetingAttendanceStatus.EXCUSED)}
          selected={statusMenuAttendance?.status === MeetingAttendanceStatus.EXCUSED}
        >
          <ExcusedIcon color="info" sx={{ mr: 1 }} fontSize="small" /> Justificado
        </MenuItem>
      </Menu>

      {/* Diálogo de edición detallada */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Editar Asistencia — {editingAttendance && getMemberInfo(editingAttendance.member_id).name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as MeetingAttendanceStatus })}
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
              value={editFormData.check_in_time}
              onChange={(e) => setEditFormData({ ...editFormData, check_in_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Hora de Salida"
              type="time"
              value={editFormData.check_out_time}
              onChange={(e) => setEditFormData({ ...editFormData, check_out_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Notas"
              multiline
              rows={3}
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveDetails}
            variant="contained"
            disabled={saving !== null}
          >
            {saving !== null ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de éxito */}
      <Snackbar
        open={Boolean(successMsg)}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg(null)} variant="filled">
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MeetingAttendancePage;
