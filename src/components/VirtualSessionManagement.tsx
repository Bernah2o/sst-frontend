import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
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
  Tooltip,
  CircularProgress,
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
import virtualAttendanceService from '../services/virtualAttendanceService';
import { formatDate, formatDateTime, formatTime } from '../utils/dateUtils';
import { parseISO, parse, isValid as isValidDate, format as formatDateFns } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const isAdmin = user?.role === 'admin';
  const canManageSessions = user?.role === 'admin' || user?.role === 'supervisor';
  const [sessions, setSessions] = useState<VirtualSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openParticipantsDialog, setOpenParticipantsDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<VirtualSession | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [sessionCode, setSessionCode] = useState('');
  const [validatedSession, setValidatedSession] = useState<Partial<VirtualSession> | null>(null);
  const [validatedMeta, setValidatedMeta] = useState<{
    timezone?: string;
    now_colombia?: string;
    session_date_colombia?: string;
    end_date_colombia?: string;
    valid_until_colombia?: string;
    is_session_expired?: boolean;
    is_session_active?: boolean;
  } | null>(null);
  const [attendanceId, setAttendanceId] = useState<number | null>(null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [finalDurationMinutes, setFinalDurationMinutes] = useState<number | null>(null);
  const [sessionTimesCache, setSessionTimesCache] = useState<Record<string, { startIso: string; endIso?: string }>>({});
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

  // Parseo robusto de fechas provenientes del backend forzando horario Colombia (-05:00) al mostrar
  const parseToLocalDate = (input: string | null | undefined): Date | null => {
    if (!input) return null;
    const s = String(input).trim();
    try {
      // Si viene ISO con zona (incluida -05:00/Z), extraer componentes y construir en horario local
      const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|([+-]\d{2}:\d{2}))?$/);
      if (isoMatch) {
        const [, y, mo, d, h, mi, sec] = isoMatch;
        const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), sec ? Number(sec) : 0);
        return isValidDate(dt) ? dt : null;
      }
      // Preferir ISO cuando esté disponible
      if (s.includes('T')) {
        const d = parseISO(s);
        return isValidDate(d) ? d : null;
      }
      // Intentar formatos comunes sin zona horaria
      const tryFormats = [
        'yyyy-MM-dd HH:mm:ss',
        'yyyy-MM-dd HH:mm',
        'yyyy-MM-dd',
        'dd/MM/yyyy HH:mm:ss',
        'dd/MM/yyyy HH:mm',
        'dd/MM/yyyy',
        'MM/dd/yyyy HH:mm:ss',
        'MM/dd/yyyy HH:mm',
        'MM/dd/yyyy',
      ];
      for (const fmt of tryFormats) {
        const d = parse(s, fmt, new Date());
        if (isValidDate(d)) return d;
      }
      const fallback = new Date(s);
      return isNaN(fallback.getTime()) ? null : fallback;
    } catch {
      return null;
    }
  };

  // Formato con offset fijo de Colombia (-05:00) para enviar al backend
  const formatForBackend = (date: Date | null | undefined): string | null => {
    if (!date || !isValidDate(date)) return null;
    // Ejemplo: 2025-06-11T15:00:00-05:00 (siempre -05:00)
    return `${formatDateFns(date, "yyyy-MM-dd'T'HH:mm:ss")}-05:00`;
  };

  const fetchSessions = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (open && canManageSessions) {
      fetchSessions();
    } else if (open) {
      // Evitar 403 para roles sin permiso (empleados u otros)
      setSessions([]);
    }
  }, [open, fetchSessions, canManageSessions]);

  // fetchSessions definido arriba con useCallback

  const fetchParticipants = async (sessionId: number) => {
    try {
      const response = await api.get(`/attendance/virtual-sessions/${sessionId}/participants`);
      setParticipants(response.data.participants || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      showSnackbar('Error al cargar los participantes', 'error');
    }
  };

  const [generatedSessionCode, setGeneratedSessionCode] = useState<string | null>(null);
  const handleCreateSession = async () => {
    try {
      if (!isAdmin) {
        showSnackbar('No tienes permisos para crear sesiones', 'error');
        return;
      }
      if (!formData.course_name || !formData.session_date || !formData.virtual_session_link) {
        showSnackbar('Por favor complete todos los campos requeridos', 'error');
        return;
      }
      if (formData.end_date && formData.session_date && formData.end_date <= formData.session_date) {
        showSnackbar('La fecha de finalización debe ser posterior a la fecha de inicio', 'error');
        return;
      }
      const sessionData = {
        course_name: formData.course_name,
        session_date: formatForBackend(formData.session_date),
        end_date: formatForBackend(formData.end_date),
        virtual_session_link: formData.virtual_session_link,
        max_participants: formData.max_participants,
        description: formData.description,
      };
      const response = await api.post('/attendance/virtual-sessions', sessionData);
      if (response.data.success) {
        setGeneratedSessionCode(response.data.session_code);
        // Cachear horas exactas para futuras ediciones (clave: session_code)
        if (response.data.session_code && sessionData.session_date) {
          setSessionTimesCache(prev => ({
            ...prev,
            [response.data.session_code as string]: {
              startIso: sessionData.session_date as string,
              endIso: sessionData.end_date || undefined,
            },
          }));
        }
        showSnackbar('Sesión creada exitosamente', 'success');
        fetchSessions();
        resetForm();
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
      session_date: parseToLocalDate(session.session_date),
      end_date: parseToLocalDate(session.end_date),
      virtual_session_link: session.virtual_session_link,
      max_participants: session.max_participants,
      description: session.description || '',
    });
    setOpenEditDialog(true);

    // Si tenemos cache de horas exactas por session_code, usarlo de inmediato
    const cached = sessionTimesCache[session.session_code];
    if (cached) {
      const start = parseToLocalDate(cached.startIso);
      const end = parseToLocalDate(cached.endIso || session.end_date);
      setFormData(prev => ({
        ...prev,
        session_date: start ?? prev.session_date,
        end_date: end ?? prev.end_date,
      }));
    }

    // Enriquecer mediante validación de código (cuando esté disponible)
    (async () => {
      try {
        const resp = await virtualAttendanceService.validateSessionCode({
          session_code: session.session_code,
          user_id: user?.id || 0,
          course_name: '',
          session_date: '',
        });
        if (resp?.valid) {
          const start = parseToLocalDate(resp.session_date_colombia || resp.session_date || session.session_date);
          const end = parseToLocalDate(resp.end_date_colombia || session.end_date);
          setFormData(prev => ({
            ...prev,
            session_date: start ?? prev.session_date,
            end_date: end ?? prev.end_date,
          }));
          // Actualizar cache también
          setSessionTimesCache(prev => ({
            ...prev,
            [session.session_code]: {
              startIso: (resp.session_date_colombia || resp.session_date || session.session_date) as string,
              endIso: (resp.end_date_colombia || session.end_date) as string,
            },
          }));
        }
      } catch (e) {
        // Silencioso: si falla, se mantiene la fecha original del listado
        console.warn('validateSessionCode failed for edit enrichment:', e);
      }
    })();
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
        session_date: formatForBackend(formData.session_date),
        end_date: formatForBackend(formData.end_date),
        virtual_session_link: formData.virtual_session_link,
        max_participants: formData.max_participants,
        description: formData.description,
      };

      const response = await api.put(`/attendance/virtual-sessions/${selectedSession.id}`, sessionData);
      
      if (response.data.success) {
        // Refrescar cache con horas exactas que acabamos de enviar
        setSessionTimesCache(prev => ({
          ...prev,
          [selectedSession.session_code]: {
            startIso: sessionData.session_date as string,
            endIso: sessionData.end_date || undefined,
          },
        }));
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

  // Validar código de sesión para empleados
  const validateSessionCode = async () => {
    try {
      const trimmedCode = (sessionCode || '').trim();
      if (!trimmedCode || trimmedCode.length !== 8) {
        showSnackbar('Código inválido. Debe tener 8 caracteres.', 'error');
        return;
      }
      setLoading(true);
      const data = await virtualAttendanceService.validateSessionCode({
        session_code: trimmedCode,
        user_id: user?.id || 0,
        // Intencionalmente omitimos course_name y session_date
      });
      if (data?.valid) {
        setValidatedSession({
          course_name: data.course_name || '',
          session_date: data.session_date || new Date().toISOString(),
          virtual_session_link: data.virtual_session_link || '',
        });
        setValidatedMeta({
          timezone: data.timezone,
          now_colombia: data.now_colombia,
          session_date_colombia: data.session_date_colombia,
          end_date_colombia: data.end_date_colombia,
          valid_until_colombia: data.valid_until_colombia,
          is_session_active: data.is_session_active,
          is_session_expired: data.is_session_expired,
        });
        showSnackbar('Sesión encontrada', 'success');
      } else {
        setValidatedSession(null);
        setValidatedMeta(null);
        showSnackbar((data as any)?.message || 'Código inválido o sesión no encontrada', 'error');
      }
    } catch (error) {
      console.error('Error validating session code:', error);
      setValidatedSession(null);
      setValidatedMeta(null);
      // Intenta mostrar mensaje del backend si existe
      const backendMsg = (error as any)?.response?.data?.message || (error as any)?.response?.data?.detail;
      showSnackbar(backendMsg || 'Error al validar el código de sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Determinar si ya se puede unirse usando referencia de tiempo de Colombia
  const canJoinNow = useCallback(() => {
    const startIso = validatedMeta?.session_date_colombia || validatedSession?.session_date;
    const nowIso = validatedMeta?.now_colombia;
    if (!startIso) return false;
    const start = parseToLocalDate(startIso);
    const now = nowIso ? parseToLocalDate(nowIso) : new Date();
    if (!start) return false;
    return (now?.getTime() || 0) >= start.getTime();
  }, [validatedSession?.session_date, validatedMeta?.session_date_colombia, validatedMeta?.now_colombia]);

  // Formatear duración transcurrida HH:MM:SS
  const formatElapsed = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Registrar ingreso y abrir enlace
  const handleJoinSession = async () => {
    try {
      if (!validatedSession?.virtual_session_link) {
        showSnackbar('No hay enlace de sesión disponible', 'error');
        return;
      }
      if (!canJoinNow()) {
        showSnackbar('Disponible solo a partir de la Fecha/Hora Inicio', 'error');
        return;
      }
      setLoading(true);
      setFinalDurationMinutes(null);
      const checkInData = {
        user_id: user?.id || 0,
        course_name: validatedSession.course_name || 'Curso Virtual',
        session_date: validatedSession.session_date || new Date().toISOString(),
        session_code: sessionCode,
        virtual_session_link: validatedSession.virtual_session_link,
        device_fingerprint: virtualAttendanceService.getDeviceFingerprint(),
        browser_info: virtualAttendanceService.getBrowserInfo(),
        employee_system_time: new Date().toISOString(),
        employee_local_time: new Date().toLocaleString(),
        employee_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      const response = await virtualAttendanceService.checkIn(checkInData);
      setAttendanceId(response.id);
      const startTime = response.check_in_time ? new Date(response.check_in_time) : new Date();
      setCheckInTime(startTime);
      setElapsedMs(Date.now() - startTime.getTime());
      showSnackbar('Ingreso registrado. Abriendo la sesión...', 'success');
      window.open(validatedSession.virtual_session_link, '_blank', 'noopener');
    } catch (error) {
      console.error('Error en check-in de sesión virtual:', error);
      showSnackbar('No fue posible registrar el ingreso a la sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Registrar salida manual de la sesión
  const handleLeaveSession = async () => {
    try {
      if (!attendanceId) {
        showSnackbar('No hay ingreso registrado para marcar salida', 'error');
        return;
      }
      setLoading(true);
      const result = await virtualAttendanceService.checkOut({
        attendance_id: attendanceId,
        connection_quality: 'unknown',
      });
      setAttendanceId(null);
      setCheckInTime(null);
      setElapsedMs(0);
      if (typeof result?.duration_minutes === 'number') {
        setFinalDurationMinutes(result.duration_minutes);
      }
      showSnackbar('Salida de la sesión registrada', 'success');
    } catch (error) {
      console.error('Error en check-out de sesión virtual:', error);
      showSnackbar('No fue posible registrar la salida de la sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (session: VirtualSession) => {
    const now = new Date();
    const sessionDate = parseToLocalDate(session.session_date) || new Date(session.session_date);
    const endDate = parseToLocalDate(session.end_date) || new Date(session.end_date);

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

  // Cerrar el diálogo registrando salida si hay ingreso activo
  const handleCloseDialog = async () => {
    try {
      if (attendanceId) {
        const result = await virtualAttendanceService.checkOut({
          attendance_id: attendanceId,
          connection_quality: 'unknown',
        });
        setAttendanceId(null);
        setCheckInTime(null);
        setElapsedMs(0);
        if (typeof result?.duration_minutes === 'number') {
          setFinalDurationMinutes(result.duration_minutes);
        }
      }
    } catch (e) {
      console.warn('Error al registrar salida al cerrar el diálogo:', e);
    } finally {
      onClose();
    }
  };

  // Registrar salida automáticamente al cerrar/navegar con keepalive
  useEffect(() => {
    if (!open || !attendanceId) return;

    const handleUnload = () => {
      virtualAttendanceService.checkOutKeepAlive({
        attendance_id: attendanceId,
        connection_quality: 'unknown',
      });
    };

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [open, attendanceId]);

  // Intervalo para actualizar duración en tiempo real mientras está en sesión
  useEffect(() => {
    if (!attendanceId || !checkInTime) return;
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - checkInTime.getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [attendanceId, checkInTime]);

  return (
    <>
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Gestión de Sesiones Virtuales</Typography>
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
              >
                Nueva Sesión
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* NUEVO: Sección para empleados para ingresar código de sesión y acceder */}
          {user?.role === 'employee' && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Ingresar Código de Sesión Virtual
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 8, md: 8 }}>
                  <TextField
                    fullWidth
                    label="Código de Sesión"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    placeholder="Ingresa el código de 8 caracteres"
                    inputProps={{ maxLength: 8 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={validateSessionCode}
                    disabled={loading || sessionCode.length !== 8}
                  >
                    Validar Código
                  </Button>
                </Grid>
              </Grid>
              {/* Mostrar información de la sesión validada */}
              {validatedSession && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Curso:</strong> {validatedSession.course_name}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Fecha/Hora (Bogotá):</strong>{' '}
                    {validatedSession?.session_date ? (() => {
                      const iso = validatedMeta?.session_date_colombia || validatedSession.session_date!;
                      try {
                        return formatDateTime(iso);
                      } catch {
                        return iso;
                      }
                    })() : 'Sin fecha disponible'}
                  </Typography>
                  {validatedMeta?.valid_until_colombia && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Válido hasta: {formatDateTime(validatedMeta.valid_until_colombia)}
                    </Typography>
                  )}
                  {validatedMeta?.timezone && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Zona horaria: {validatedMeta.timezone}
                    </Typography>
                  )}
                  {attendanceId && checkInTime && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Duración en sesión: {formatElapsed(elapsedMs)}
                    </Typography>
                  )}
                  {!attendanceId && finalDurationMinutes !== null && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Duración registrada: {finalDurationMinutes} min
                    </Typography>
                  )}
                  {validatedSession.virtual_session_link && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<VideoCallIcon />}
                      onClick={handleJoinSession}
                      disabled={!canJoinNow() || loading}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Unirse a la Sesión Virtual
                    </Button>
                  )}
                  {!canJoinNow() && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Disponible solo a partir de la Fecha/Hora Inicio
                    </Typography>
                  )}
                  {attendanceId && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleLeaveSession}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Marcar salida de la sesión
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}
          {canManageSessions ? (
            loading ? (
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
                            {isAdmin && (
                              <>
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
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear nueva sesión */}
      <Dialog open={openCreateDialog} onClose={() => { setOpenCreateDialog(false); setGeneratedSessionCode(null); }} maxWidth="md" fullWidth>
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
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DateTimePicker
                  label="Fecha y Hora de Inicio"
                  value={formData.session_date}
                  onChange={(newValue) => setFormData({ ...formData, session_date: newValue })}
                  ampm={false}
                  format="dd/MM/yyyy HH:mm"
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
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DateTimePicker
                  label="Fecha y Hora de Finalización"
                  value={formData.end_date}
                  onChange={(newValue) => setFormData({ ...formData, end_date: newValue })}
                  minDateTime={formData.session_date || undefined}
                  ampm={false}
                  format="dd/MM/yyyy HH:mm"
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
          {generatedSessionCode && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Código de Sesión Generado:</strong> {generatedSessionCode}
              </Typography>
              <Button variant="outlined" size="small" onClick={() => navigator.clipboard.writeText(generatedSessionCode)}>
                Copiar Código
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCreateDialog(false); setGeneratedSessionCode(null); }}>Cerrar</Button>
          {!generatedSessionCode && (
            <Button variant="contained" onClick={handleCreateSession}>
              Crear Sesión
            </Button>
          )}
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
                Fecha: {formatDate(selectedSession.session_date)} | 
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
                        {participant.check_in_time ? formatTime(participant.check_in_time) : '-'}
                      </TableCell>
                      <TableCell>
                        {participant.check_out_time ? formatTime(participant.check_out_time) : '-'}
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
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DateTimePicker
                  label="Fecha y Hora de Inicio"
                  value={formData.session_date}
                  onChange={(newValue) => setFormData({ ...formData, session_date: newValue })}
                  ampm={false}
                  format="dd/MM/yyyy HH:mm"
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
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DateTimePicker
                  label="Fecha y Hora de Finalización"
                  value={formData.end_date}
                  onChange={(newValue) => setFormData({ ...formData, end_date: newValue })}
                  minDateTime={formData.session_date || undefined}
                  ampm={false}
                  format="dd/MM/yyyy HH:mm"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Opcional - Si no se especifica, se asumirán 2 horas de duración",
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
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
                <strong>Fecha:</strong> {formatDateTime(selectedSession.session_date)}
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
