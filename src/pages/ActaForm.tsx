import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Committee,
  CommitteeMember,
  CommitteeRole,
  MeetingStatus,
  ActivityStatus,
} from '../types';

// ──────────────────────────────────────────────
// Types local al componente
// ──────────────────────────────────────────────
interface AttendeeRow {
  memberId: number;
  name: string;
  role: CommitteeRole;
  present: boolean;
}

interface PrevActivity {
  id: number;
  title: string;
  responsible: string;
  dueDate: string;
  progress: number;
  observations: string;
  status: ActivityStatus;
}

interface NewTask {
  id?: number;
  title: string;
  responsibleMemberId: string;
  commitmentDate: string;
  observations: string;
}

interface MinutesContent {
  desarrollo: string;
  invitados: string;
  proposiciones: string;
}

const roleLabel: Record<CommitteeRole, string> = {
  [CommitteeRole.PRESIDENT]: 'Presidente',
  [CommitteeRole.VICE_PRESIDENT]: 'Vicepresidente',
  [CommitteeRole.SECRETARY]: 'Secretario',
  [CommitteeRole.MEMBER]: 'Miembro',
  [CommitteeRole.ALTERNATE]: 'Suplente',
};

const emptyTask = (): NewTask => ({
  title: '',
  responsibleMemberId: '',
  commitmentDate: '',
  observations: '',
});

// Parse minutes_content JSON safely
function parseMinutes(raw: string | undefined): MinutesContent {
  if (!raw) return { desarrollo: '', invitados: '', proposiciones: '' };
  try {
    const parsed = JSON.parse(raw);
    return {
      desarrollo: parsed.desarrollo ?? '',
      invitados: parsed.invitados ?? '',
      proposiciones: parsed.proposiciones ?? '',
    };
  } catch {
    return { desarrollo: raw, invitados: '', proposiciones: '' };
  }
}

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────
const ActaForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: committeeId, actaId } = useParams<{ id: string; actaId: string }>();
  const isEdit = Boolean(actaId);
  const isAdmin = (user?.role || user?.rol) === 'admin';
  const today = new Date().toISOString().split('T')[0];

  // ── Datos del comité y acta
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [actaNumber, setActaNumber] = useState(1);
  const [prevMeetingId, setPrevMeetingId] = useState<number | null>(null);

  // ── Metadatos del formulario
  const [meetingDate, setMeetingDate] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horasCierre, setHoraCierre] = useState('');
  const [location, setLocation] = useState('');

  // ── Secciones del acta
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [guests, setGuests] = useState('');
  const [desarrollo, setDesarrollo] = useState('');
  const [previousActivities, setPreviousActivities] = useState<PrevActivity[]>([]);
  const [newTasks, setNewTasks] = useState<NewTask[]>([emptyTask()]);
  const [proposiciones, setProposiciones] = useState('');

  // ── IDs de tareas eliminadas pendientes de borrar en backend
  const [deletedTaskIds, setDeletedTaskIds] = useState<number[]>([]);

  // ── Miembros disponibles para asignación
  const [members, setMembers] = useState<CommitteeMember[]>([]);

  // ── UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [savedMeetingId, setSavedMeetingId] = useState<number | null>(null);

  // ──────────────────────────────────────────
  // Carga inicial
  // ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!committeeId) return;
    try {
      setLoading(true);
      setError(null);
      setDeletedTaskIds([]);

      const [committeeRes, membersRes, meetingsRes] = await Promise.all([
        api.get(`/committees/${committeeId}`),
        api.get(`/committee-members/committee/${committeeId}`),
        api.get('/committee-meetings/', {
          params: { committee_id: committeeId, page_size: 100 },
        }),
      ]);

      setCommittee(committeeRes.data);

      const activeMembers: CommitteeMember[] = (membersRes.data ?? []).filter(
        (m: CommitteeMember) => m.is_active,
      );
      setMembers(activeMembers);

      const allMeetings: any[] = Array.isArray(meetingsRes.data)
        ? meetingsRes.data
        : meetingsRes.data?.items ?? [];

      const sorted = [...allMeetings].sort(
        (a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime(),
      );

      if (isEdit && actaId) {
        // Modo edición: cargar datos del acta existente
        const meetingRes = await api.get(`/committee-meetings/${actaId}`);
        const m = meetingRes.data;
        const parsed = parseMinutes(m.minutes_content);

        const idx = sorted.findIndex((x) => x.id === m.id);
        setActaNumber(idx >= 0 ? idx + 1 : sorted.length);

        const dateObj = new Date(m.meeting_date);
        setMeetingDate(dateObj.toISOString().split('T')[0]);
        setHoraInicio(
          dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
        );
        if (m.duration_minutes) {
          const end = new Date(dateObj.getTime() + m.duration_minutes * 60000);
          setHoraCierre(
            end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
          );
        }
        setLocation(m.location ?? '');
        setGuests(parsed.invitados);
        setDesarrollo(parsed.desarrollo);
        setProposiciones(parsed.proposiciones || m.notes || '');
        setSavedMeetingId(m.id);

        // Cargar asistencia existente
        const attendanceRes = await api.get(`/committee-meetings/${actaId}/attendance`);
        const attendanceMap: Record<number, boolean> = {};
        (attendanceRes.data ?? []).forEach((a: any) => {
          attendanceMap[a.member_id] = a.status?.toUpperCase() === 'PRESENT';
        });

        setAttendees(
          activeMembers.map((mem) => ({
            memberId: mem.id,
            name: `${mem.user?.first_name ?? ''} ${mem.user?.last_name ?? ''}`.trim(),
            role: mem.role,
            present: attendanceMap[mem.id] ?? true,
          })),
        );

        // Cargar actividades de esta reunión (section 5 existente) y de la anterior (section 4)
        const prevIdx = idx > 0 ? idx - 1 : -1;
        if (prevIdx >= 0) {
          setPrevMeetingId(sorted[prevIdx].id);
          await loadPreviousActivities(sorted[prevIdx].id, parseInt(committeeId));
        }

        const currentActivitiesRes = await api.get('/committee-activities/', {
          params: { committee_id: committeeId, meeting_id: actaId, page_size: 50 },
        });
        const currentActs = currentActivitiesRes.data?.activities ?? currentActivitiesRes.data ?? [];
        if (currentActs.length > 0) {
          setNewTasks(
            currentActs.map((a: any) => ({
              id: a.id,
              title: a.title ?? '',
              responsibleMemberId: a.assigned_to ? String(a.assigned_to) : '',
              commitmentDate: a.due_date ? a.due_date.split('T')[0] : '',
              observations: a.notes ?? '',
            })),
          );
        }
      } else {
        // Modo creación
        setActaNumber(sorted.length + 1);

        setAttendees(
          activeMembers.map((mem) => ({
            memberId: mem.id,
            name: `${mem.user?.first_name ?? ''} ${mem.user?.last_name ?? ''}`.trim(),
            role: mem.role,
            present: true,
          })),
        );

        // Cargar actividades de la reunión anterior
        if (sorted.length > 0) {
          const lastMeeting = sorted[sorted.length - 1];
          setPrevMeetingId(lastMeeting.id);
          await loadPreviousActivities(lastMeeting.id, parseInt(committeeId));
        }
      }
    } catch {
      setError('Error al cargar los datos. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [committeeId, actaId, isEdit]);

  const loadPreviousActivities = async (meetingId: number, cId: number) => {
    try {
      const res = await api.get('/committee-activities/', {
        params: { committee_id: cId, meeting_id: meetingId, page_size: 50 },
      });
      const acts = res.data?.activities ?? res.data ?? [];
      setPreviousActivities(
        acts.map((a: any) => ({
          id: a.id,
          title: a.title ?? '',
          responsible:
            a.assigned_user
              ? `${a.assigned_user.first_name ?? ''} ${a.assigned_user.last_name ?? ''}`.trim()
              : '',
          dueDate: a.due_date ? a.due_date.split('T')[0] : '',
          progress: a.progress_percentage ?? 0,
          observations: a.notes ?? '',
          status: a.status ?? ActivityStatus.PENDING,
        })),
      );
    } catch {
      // Actividades anteriores no críticas
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ──────────────────────────────────────────
  // Guardar acta
  // ──────────────────────────────────────────
  const handleSave = async (downloadPdf = false) => {
    if (!committeeId) return;
    if (!meetingDate) {
      setError('La fecha de la reunión es obligatoria.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Calcular duration_minutes desde horaInicio y horaCierre
      let durationMinutes: number | undefined;
      let meetingDatetime = `${meetingDate}T${horaInicio || '08:00'}:00`;
      if (horaInicio && horasCierre) {
        const [sh, sm] = horaInicio.split(':').map(Number);
        const [eh, em] = horasCierre.split(':').map(Number);
        durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
        if (durationMinutes < 0) durationMinutes = undefined;
      }

      const minutesContent = JSON.stringify({ desarrollo, invitados: guests, proposiciones });

      const meetingPayload = {
        committee_id: parseInt(committeeId),
        title: `Acta No. ${String(actaNumber).padStart(3, '0')} - ${
          committee?.name ?? 'Comité'
        }`,
        meeting_date: meetingDatetime,
        duration_minutes: durationMinutes,
        location,
        meeting_type: 'regular',
        status: MeetingStatus.COMPLETED,
        minutes_content: minutesContent,
        notes: proposiciones,
        attendees_count: attendees.filter((a) => a.present).length,
      };

      let meetingId: number;

      if (isEdit && actaId) {
        await api.put(`/committee-meetings/${actaId}`, meetingPayload);
        meetingId = parseInt(actaId);
      } else {
        const res = await api.post('/committee-meetings/', meetingPayload);
        meetingId = res.data.id;
        setSavedMeetingId(meetingId);
      }

      // Registrar asistencia
      for (const att of attendees) {
        const attendancePayload = {
          member_id: att.memberId,
          status: att.present ? 'PRESENT' : 'ABSENT',
        };
        try {
          await api.post(`/committee-meetings/${meetingId}/attendance`, attendancePayload);
        } catch {
          // Si ya existe, actualizar
          try {
            await api.put(
              `/committee-meetings/${meetingId}/attendance/${att.memberId}`,
              { status: att.present ? 'PRESENT' : 'ABSENT' },
            );
          } catch {
            // Ignorar errores individuales de asistencia
          }
        }
      }

      // Actualizar actividades previas (% cumplimiento y observaciones)
      for (const act of previousActivities) {
        try {
          await api.put(`/committee-activities/${act.id}`, {
            progress_percentage: act.progress,
            notes: act.observations,
            status:
              act.progress >= 100
                ? ActivityStatus.COMPLETED
                : act.progress > 0
                ? ActivityStatus.IN_PROGRESS
                : act.status,
          });
        } catch {
          // Continuar aunque falle una actualización
        }
      }

      // Eliminar tareas que el usuario borró del formulario
      for (const id of deletedTaskIds) {
        try {
          await api.delete(`/committee-activities/${id}`);
        } catch {
          // Continuar aunque falle un borrado individual
        }
      }
      setDeletedTaskIds([]);

      // Guardar tareas: actualizar las existentes, crear las nuevas
      for (const task of newTasks) {
        if (!task.title.trim()) continue;
        try {
          if (task.id) {
            await api.put(`/committee-activities/${task.id}`, {
              title: task.title,
              assigned_to: task.responsibleMemberId ? parseInt(task.responsibleMemberId) : undefined,
              due_date: task.commitmentDate || undefined,
              notes: task.observations,
            });
          } else {
            await api.post('/committee-activities/', {
              committee_id: parseInt(committeeId),
              meeting_id: meetingId,
              title: task.title,
              assigned_to: task.responsibleMemberId ? parseInt(task.responsibleMemberId) : undefined,
              due_date: task.commitmentDate || undefined,
              notes: task.observations,
              status: ActivityStatus.PENDING,
              priority: 'MEDIUM',
            });
          }
        } catch {
          // Continuar aunque falle una tarea
        }
      }

      setSuccessMsg('Acta guardada correctamente.');

      if (downloadPdf) {
        await handleDownloadPdf(meetingId);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? 'Error al guardar el acta. Por favor intenta nuevamente.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async (meetingId?: number) => {
    const mid = meetingId ?? savedMeetingId;
    if (!mid) {
      setError('Guarda el acta primero para poder descargar el PDF.');
      return;
    }
    setDownloading(true);
    try {
      const res = await api.get(`/committee-meetings/${mid}/minutes/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Acta_${String(actaNumber).padStart(3, '0')}_${committee?.name ?? 'Comite'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo generar el PDF.');
    } finally {
      setDownloading(false);
    }
  };

  // ──────────────────────────────────────────
  // Helpers de UI
  // ──────────────────────────────────────────
  const presentCount = attendees.filter((a) => a.present).length;
  const quorumPct = committee?.quorum_percentage ?? 50;
  const totalMembers = attendees.length;
  const attendancePct = totalMembers > 0 ? (presentCount / totalMembers) * 100 : 0;
  const quorumAchieved = attendancePct >= quorumPct;

  const committeeTypeLabel = (type: string) =>
    type?.toLowerCase() === 'copasst' ? 'COPASST' : 'Convivencia';

  const updatePrevActivity = (idx: number, field: keyof PrevActivity, value: any) => {
    setPreviousActivities((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)),
    );
  };

  const updateNewTask = (idx: number, field: keyof NewTask, value: string) => {
    setNewTasks((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────
  return (
    <Box p={3} maxWidth={900} mx="auto">
      {/* ── Navegación ── */}
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(`/admin/committees/${committeeId}/actas`)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">
          {isEdit ? 'Editar Acta' : 'Nueva Acta de Reunión'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* PÁGINA 1                                        */}
      {/* ═══════════════════════════════════════════════ */}
      <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
        {/* Encabezado del acta */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr',
            borderBottom: '2px solid #333',
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRight: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography fontWeight="bold" fontSize={18} letterSpacing={1}>
              ROWL
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRight: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography fontWeight="bold" fontSize={16} textAlign="center">
              ACTA DE REUNIÓN
            </Typography>
          </Box>
          <Box sx={{ p: 1, fontSize: 11, lineHeight: 1.6 }}>
            <Typography variant="caption" display="block">
              Código: RES-SST-01
            </Typography>
            <Typography variant="caption" display="block">
              Versión: 001
            </Typography>
            <Typography variant="caption" display="block">
              Página: 1 de 2
            </Typography>
          </Box>
        </Box>

        <Box p={3}>
          {/* Tipo de comité + Acta No */}
          <Grid container spacing={2} alignItems="center" mb={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Tipo de comité:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {['COPASST', 'Convivencia', 'Gerencial', 'Otro'].map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    variant={
                      committee && committeeTypeLabel(committee.committee_type) === t
                        ? 'filled'
                        : 'outlined'
                    }
                    color={
                      committee && committeeTypeLabel(committee.committee_type) === t
                        ? 'primary'
                        : 'default'
                    }
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box
                sx={{ border: '1px solid #333', p: 1, textAlign: 'center', borderRadius: 1 }}
              >
                <Typography variant="caption" color="text.secondary">
                  ACTA No.
                </Typography>
                <Typography fontWeight="bold" fontSize={20}>
                  {String(actaNumber).padStart(3, '0')}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* Fecha y lugar */}
          <Grid container spacing={2} mb={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Fecha de Reunión"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: isAdmin ? undefined : today }}
                helperText={!isAdmin ? 'Solo el administrador puede registrar fechas anteriores' : undefined}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Hora Inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Hora Cierre"
                type="time"
                value={horasCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Se reunieron en"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
                size="small"
                placeholder="Lugar de la reunión"
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* Asistentes */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Asistentes:
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Nombres</strong></TableCell>
                  <TableCell><strong>Cargo</strong></TableCell>
                  <TableCell align="center" width={60}><strong>SI</strong></TableCell>
                  <TableCell align="center" width={60}><strong>NO</strong></TableCell>
                  <TableCell><strong>Firma</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendees.map((att, idx) => (
                  <TableRow key={att.memberId}>
                    <TableCell>{att.name || `Miembro ${idx + 1}`}</TableCell>
                    <TableCell>
                      <Chip label={roleLabel[att.role] ?? att.role} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <RadioGroup
                        row
                        value={att.present ? 'si' : 'no'}
                        onChange={(e) =>
                          setAttendees((prev) =>
                            prev.map((a, i) =>
                              i === idx ? { ...a, present: e.target.value === 'si' } : a,
                            ),
                          )
                        }
                      >
                        <FormControlLabel value="si" control={<Radio size="small" />} label="" />
                      </RadioGroup>
                    </TableCell>
                    <TableCell align="center">
                      <RadioGroup
                        row
                        value={att.present ? 'si' : 'no'}
                        onChange={(e) =>
                          setAttendees((prev) =>
                            prev.map((a, i) =>
                              i === idx ? { ...a, present: e.target.value === 'si' } : a,
                            ),
                          )
                        }
                      >
                        <FormControlLabel value="no" control={<Radio size="small" />} label="" />
                      </RadioGroup>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ borderBottom: '1px dashed #aaa', minWidth: 120, height: 24 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Invitados */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Invitados:
          </Typography>
          <TextField
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            multiline
            rows={2}
            fullWidth
            size="small"
            placeholder="Nombres de invitados a la reunión"
            sx={{ mb: 3 }}
          />

          <Divider sx={{ mb: 2 }} />

          {/* Sección Actividades */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            ACTIVIDADES:
          </Typography>

          {/* 1. Llamada a lista */}
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              1. LLAMADA A LISTA Y VERIFICACIÓN DE QUÓRUM
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2">
                Presentes: <strong>{presentCount}</strong> de <strong>{totalMembers}</strong> (
                {attendancePct.toFixed(0)}%)
              </Typography>
              <Chip
                label={quorumAchieved ? `Quórum alcanzado (${quorumPct}%)` : `Sin quórum (req. ${quorumPct}%)`}
                size="small"
                color={quorumAchieved ? 'success' : 'error'}
              />
            </Box>
          </Box>

          {/* 2. Lectura del acta anterior */}
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              2. LECTURA DEL ACTA ANTERIOR
            </Typography>
            {prevMeetingId ? (
              <Typography variant="body2" color="text.secondary">
                Se da lectura al acta anterior (Reunión #{prevMeetingId}).{' '}
                {previousActivities.length > 0
                  ? `${previousActivities.length} actividades pendientes de revisión.`
                  : 'Sin actividades pendientes.'}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Primera reunión del comité. No hay acta anterior.
              </Typography>
            )}
          </Box>

          {/* 3. Desarrollo */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              3. DESARROLLO DE LA REUNIÓN
            </Typography>
            <TextField
              value={desarrollo}
              onChange={(e) => setDesarrollo(e.target.value)}
              multiline
              rows={6}
              fullWidth
              size="small"
              placeholder="Describe el desarrollo de la reunión..."
            />
          </Box>
        </Box>
      </Paper>

      {/* ═══════════════════════════════════════════════ */}
      {/* PÁGINA 2                                        */}
      {/* ═══════════════════════════════════════════════ */}
      <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
        {/* Encabezado p2 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr',
            borderBottom: '2px solid #333',
          }}
        >
          <Box sx={{ p: 1.5, borderRight: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography fontWeight="bold" fontSize={18} letterSpacing={1}>ROWL</Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRight: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography fontWeight="bold" fontSize={16} textAlign="center">ACTA DE REUNIÓN</Typography>
          </Box>
          <Box sx={{ p: 1, fontSize: 11, lineHeight: 1.6 }}>
            <Typography variant="caption" display="block">Código: RES-SST-01</Typography>
            <Typography variant="caption" display="block">Versión: 001</Typography>
            <Typography variant="caption" display="block">Página: 2 de 2</Typography>
          </Box>
        </Box>

        <Box p={3}>
          {/* 4. Revisión de tareas anteriores */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            4. REVISIÓN DE TAREAS COMITÉ O REUNIÓN ANTERIOR
          </Typography>

          {previousActivities.length === 0 ? (
            <Box
              sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3, textAlign: 'center' }}
            >
              <Typography variant="body2" color="text.secondary">
                {prevMeetingId
                  ? 'No hay actividades registradas en la reunión anterior.'
                  : 'No hay reuniones anteriores.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>Actividad</strong></TableCell>
                    <TableCell><strong>Responsable</strong></TableCell>
                    <TableCell width={130} align="center"><strong>% Cumpl.</strong></TableCell>
                    <TableCell width={110}><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Observaciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previousActivities.map((act, idx) => (
                    <TableRow key={act.id}>
                      <TableCell>
                        <Typography variant="body2">{act.title}</Typography>
                        <Chip
                          label={act.status}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                          color={
                            act.status === ActivityStatus.COMPLETED
                              ? 'success'
                              : act.status === ActivityStatus.OVERDUE
                              ? 'error'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{act.responsible}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box px={1}>
                          <Slider
                            value={act.progress}
                            onChange={(_, v) => updatePrevActivity(idx, 'progress', v)}
                            min={0}
                            max={100}
                            step={5}
                            size="small"
                            valueLabelDisplay="auto"
                            valueLabelFormat={(v) => `${v}%`}
                          />
                          <Typography variant="caption">{act.progress}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {act.dueDate
                            ? new Date(act.dueDate).toLocaleDateString('es-ES')
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={act.observations}
                          onChange={(e) => updatePrevActivity(idx, 'observations', e.target.value)}
                          size="small"
                          multiline
                          rows={1}
                          fullWidth
                          placeholder="Observaciones"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* 5. Asignación de tareas */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              5. ASIGNACIÓN DE TAREAS
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setNewTasks((prev) => [...prev, emptyTask()])}
            >
              Agregar tarea
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Actividad</strong></TableCell>
                  <TableCell width={200}><strong>Responsable</strong></TableCell>
                  <TableCell width={140}><strong>Fecha Compromiso</strong></TableCell>
                  <TableCell><strong>Observaciones</strong></TableCell>
                  <TableCell width={48} />
                </TableRow>
              </TableHead>
              <TableBody>
                {newTasks.map((task, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        value={task.title}
                        onChange={(e) => updateNewTask(idx, 'title', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Descripción de la tarea"
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Responsable</InputLabel>
                        <Select
                          value={task.responsibleMemberId}
                          onChange={(e) =>
                            updateNewTask(idx, 'responsibleMemberId', e.target.value)
                          }
                          label="Responsable"
                        >
                          <MenuItem value="">— Sin asignar —</MenuItem>
                          {members.map((m) => (
                            <MenuItem key={m.id} value={String(m.id)}>
                              {m.user?.first_name} {m.user?.last_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        value={task.commitmentDate}
                        onChange={(e) => updateNewTask(idx, 'commitmentDate', e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={task.observations}
                        onChange={(e) => updateNewTask(idx, 'observations', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Observaciones"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Eliminar fila">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => {
                              const task = newTasks[idx];
                              if (task.id) setDeletedTaskIds((prev) => [...prev, task.id!]);
                              setNewTasks((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            disabled={newTasks.length === 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 6. Proposiciones */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            6. PROPOSICIONES Y VARIOS
          </Typography>
          <TextField
            value={proposiciones}
            onChange={(e) => setProposiciones(e.target.value)}
            multiline
            rows={4}
            fullWidth
            size="small"
            placeholder="Proposiciones y varios..."
            sx={{ mb: 3 }}
          />

          {/* Firmas */}
          <Grid container spacing={4} justifyContent="center">
            {[
              { label: 'SECRETARIO', role: CommitteeRole.SECRETARY },
              { label: 'PRESIDENTE', role: CommitteeRole.PRESIDENT },
            ].map(({ label, role }) => {
              const found = attendees.find((a) => a.role === role);
              return (
                <Grid key={label} size={{ xs: 12, sm: 5 }}>
                  <Box textAlign="center">
                    <Box
                      sx={{
                        borderBottom: '1px solid #333',
                        mb: 0.5,
                        height: 48,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                      }}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {label}
                    </Typography>
                    {found && (
                      <Typography variant="caption" color="text.secondary">
                        {found.name}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Paper>

      {/* ── Acciones ── */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="flex-end" gap={2} flexWrap="wrap" alignItems="center">
            <Button
              variant="outlined"
              onClick={() => navigate(`/admin/committees/${committeeId}/actas`)}
              disabled={saving || downloading}
            >
              Cancelar
            </Button>
            <Button
              variant="outlined"
              startIcon={saving && !downloading ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={() => handleSave(false)}
              disabled={saving || downloading}
            >
              Guardar
            </Button>
            <Tooltip title={!savedMeetingId && !isEdit ? 'Guarda el acta primero' : ''}>
              <span>
                <Button
                  variant="outlined"
                  startIcon={downloading && !saving ? <CircularProgress size={16} /> : <PdfIcon />}
                  onClick={() => handleDownloadPdf()}
                  disabled={saving || downloading || (!savedMeetingId && !isEdit)}
                >
                  {downloading && !saving ? 'Descargando…' : 'Descargar PDF'}
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
              onClick={() => handleSave(true)}
              disabled={saving || downloading}
            >
              {saving ? 'Guardando…' : 'Guardar y Descargar PDF'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ActaForm;
