import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
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

const activityStatusLabel: Record<ActivityStatus, string> = {
  [ActivityStatus.PENDING]: 'Pendiente',
  [ActivityStatus.IN_PROGRESS]: 'En progreso',
  [ActivityStatus.COMPLETED]: 'Completada',
  [ActivityStatus.CANCELLED]: 'Cancelada',
  [ActivityStatus.OVERDUE]: 'Vencida',
};

// Fecha local en formato YYYY-MM-DD (toISOString usa UTC y corre el día en Colombia)
const toLocalDateInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Muestra una fecha YYYY-MM-DD sin conversión de zona horaria
const formatDateOnly = (value: string) => {
  const [y, m, d] = value.split('-');
  return y && m && d ? `${d}/${m}/${y}` : value;
};

// ──────────────────────────────────────────────
// Piezas de presentación
// ──────────────────────────────────────────────
const ActaHeader: React.FC<{ page: number; total: number }> = ({ page, total }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 2fr 1fr' },
      borderBottom: 2,
      borderColor: 'text.primary',
      '& > *': { borderColor: 'divider' },
    }}
  >
    <Box
      sx={{
        p: 1.5,
        borderRight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography fontWeight={700} fontSize={18} letterSpacing={1}>
        ROWL
      </Typography>
    </Box>
    <Box
      sx={{
        p: 1.5,
        borderRight: { xs: 0, sm: 1 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        order: { xs: -1, sm: 0 },
        gridColumn: { xs: '1 / -1', sm: 'auto' },
        borderBottom: { xs: 1, sm: 0 },
      }}
    >
      <Typography component="h2" fontWeight={700} fontSize={16} textAlign="center">
        ACTA DE REUNIÓN
      </Typography>
    </Box>
    <Box sx={{ px: 1.5, py: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {[`Código: RES-SST-01`, `Versión: 001`, `Página: ${page} de ${total}`].map((line) => (
        <Typography key={line} variant="caption" display="block" lineHeight={1.6}>
          {line}
        </Typography>
      ))}
    </Box>
  </Box>
);

const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({
  children,
  action,
}) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mt={3} mb={1.25}>
    <Typography component="h3" variant="subtitle2" fontWeight={700} letterSpacing={0.3}>
      {children}
    </Typography>
    {action}
  </Box>
);

const headCellSx = { fontWeight: 700, bgcolor: 'action.hover', whiteSpace: 'nowrap' } as const;

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
  const today = toLocalDateInput(new Date());

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
  const [activeAction, setActiveAction] = useState<'save' | 'saveAndPdf' | 'pdf' | null>(null);
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
        setMeetingDate(toLocalDateInput(dateObj));
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
          // Igual que el PDF: llegar tarde cuenta como presente
          attendanceMap[a.member_id] = ['PRESENT', 'LATE'].includes(a.status?.toUpperCase());
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

    setActiveAction(downloadPdf ? 'saveAndPdf' : 'save');
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

      // Si el acta ya se guardó en esta sesión, actualizarla en vez de crear otra
      const existingId = actaId ? parseInt(actaId) : savedMeetingId;
      let meetingId: number;

      if (existingId) {
        await api.put(`/committee-meetings/${existingId}`, meetingPayload);
        meetingId = existingId;
      } else {
        const res = await api.post('/committee-meetings/', meetingPayload);
        meetingId = res.data.id;
        setSavedMeetingId(meetingId);
      }

      const failures: string[] = [];

      // Registrar asistencia: al crear el acta el backend ya genera un registro
      // por miembro, así que se actualiza; si no existe (404) se crea.
      let attendanceFailed = 0;
      for (const att of attendees) {
        const attendanceStatus = att.present ? 'PRESENT' : 'ABSENT';
        try {
          await api.put(`/committee-meetings/${meetingId}/attendance/${att.memberId}`, {
            status: attendanceStatus,
          });
        } catch (err: any) {
          if (err?.response?.status !== 404) {
            attendanceFailed += 1;
            continue;
          }
          try {
            await api.post(`/committee-meetings/${meetingId}/attendance`, {
              member_id: att.memberId,
              status: attendanceStatus,
            });
          } catch {
            attendanceFailed += 1;
          }
        }
      }
      if (attendanceFailed > 0) {
        failures.push(`${attendanceFailed} registro(s) de asistencia`);
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

      // Guardar tareas: actualizar las existentes, crear las nuevas.
      // Se guardan los ids creados para que un segundo "Guardar" no las duplique.
      let tasksFailed = 0;
      const savedTasks: NewTask[] = [];
      for (const task of newTasks) {
        if (!task.title.trim()) {
          savedTasks.push(task);
          continue;
        }
        try {
          if (task.id) {
            await api.put(`/committee-activities/${task.id}`, {
              title: task.title,
              assigned_to: task.responsibleMemberId ? parseInt(task.responsibleMemberId) : undefined,
              due_date: task.commitmentDate || undefined,
              notes: task.observations,
            });
            savedTasks.push(task);
          } else {
            const res = await api.post('/committee-activities/', {
              committee_id: parseInt(committeeId),
              meeting_id: meetingId,
              title: task.title,
              assigned_to: task.responsibleMemberId ? parseInt(task.responsibleMemberId) : undefined,
              due_date: task.commitmentDate || undefined,
              notes: task.observations,
              status: ActivityStatus.PENDING,
              priority: 'MEDIUM',
            });
            savedTasks.push({ ...task, id: res.data?.id });
          }
        } catch {
          tasksFailed += 1;
          savedTasks.push(task);
        }
      }
      setNewTasks(savedTasks);
      if (tasksFailed > 0) failures.push(`${tasksFailed} tarea(s)`);

      if (failures.length > 0) {
        setError(
          `El acta se guardó, pero no se pudieron guardar ${failures.join(' y ')}. Vuelve a pulsar Guardar.`,
        );
      } else {
        setSuccessMsg('Acta guardada correctamente.');
      }

      if (downloadPdf) {
        await handleDownloadPdf(meetingId);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? 'Error al guardar el acta. Por favor intenta nuevamente.',
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleDownloadPdf = async (meetingId?: number) => {
    const mid = meetingId ?? savedMeetingId;
    if (!mid) {
      setError('Guarda el acta primero para poder descargar el PDF.');
      return;
    }
    const isSaveAndPdf = activeAction === 'saveAndPdf';
    if (!isSaveAndPdf) setActiveAction('pdf');
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
      if (!isSaveAndPdf) setActiveAction(null);
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
    <Box px={{ xs: 2, sm: 3 }} pt={3} maxWidth={960} mx="auto">
      {/* ── Navegación ── */}
      <Box display="flex" alignItems="center" gap={1} mb={2.5}>
        <Tooltip title="Volver a las actas">
          <IconButton
            aria-label="Volver a las actas"
            onClick={() => navigate(`/admin/committees/${committeeId}/actas`)}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box minWidth={0}>
          <Typography variant="h5" component="h1" fontWeight={600}>
            {isEdit ? 'Editar acta' : 'Nueva acta de reunión'}
          </Typography>
          {committee && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {committee.name} · Acta No. {String(actaNumber).padStart(3, '0')}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════════ */}
      {/* PÁGINA 1                                        */}
      {/* ═══════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
        <ActaHeader page={1} total={2} />

        <Box p={{ xs: 2, sm: 3 }}>
          {/* Tipo de comité + Acta No */}
          <Grid container spacing={2} alignItems="center" mb={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Tipo de comité
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
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  p: 1,
                  textAlign: 'center',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Acta No.
                </Typography>
                <Typography fontWeight={700} fontSize={20} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {String(actaNumber).padStart(3, '0')}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2.5 }} />

          {/* Fecha y lugar */}
          <Grid container spacing={2} mb={3}>
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

          <Divider />

          {/* Asistentes */}
          <SectionTitle
            action={
              <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {presentCount} de {totalMembers} presentes
              </Typography>
            }
          >
            Asistentes
          </SectionTitle>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small" aria-label="Asistencia de los miembros del comité">
              <TableHead>
                <TableRow>
                  <TableCell sx={headCellSx}>Nombres</TableCell>
                  <TableCell sx={headCellSx}>Cargo</TableCell>
                  <TableCell sx={headCellSx} align="center" width={64}>Sí</TableCell>
                  <TableCell sx={headCellSx} align="center" width={64}>No</TableCell>
                  <TableCell sx={headCellSx}>Firma</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      El comité no tiene miembros activos.
                    </TableCell>
                  </TableRow>
                )}
                {attendees.map((att, idx) => {
                  const name = att.name || `Miembro ${idx + 1}`;
                  const setPresent = (present: boolean) =>
                    setAttendees((prev) =>
                      prev.map((a, i) => (i === idx ? { ...a, present } : a)),
                    );
                  return (
                    <TableRow
                      key={att.memberId}
                      sx={{ bgcolor: att.present ? undefined : 'action.hover' }}
                    >
                      <TableCell sx={{ color: att.present ? 'text.primary' : 'text.secondary' }}>
                        {name}
                      </TableCell>
                      <TableCell>
                        <Chip label={roleLabel[att.role] ?? att.role} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center" padding="none">
                        <Radio
                          size="small"
                          name={`asistencia-${att.memberId}`}
                          checked={att.present}
                          onChange={() => setPresent(true)}
                          inputProps={{ 'aria-label': `${name}: asistió` }}
                        />
                      </TableCell>
                      <TableCell align="center" padding="none">
                        <Radio
                          size="small"
                          name={`asistencia-${att.memberId}`}
                          checked={!att.present}
                          onChange={() => setPresent(false)}
                          inputProps={{ 'aria-label': `${name}: no asistió` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          aria-hidden
                          sx={{ borderBottom: 1, borderColor: 'divider', borderBottomStyle: 'dashed', minWidth: 120, height: 24 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Invitados */}
          <SectionTitle>Invitados</SectionTitle>
          <TextField
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            size="small"
            placeholder="Nombres de invitados a la reunión"
            inputProps={{ 'aria-label': 'Invitados' }}
          />

          <Divider sx={{ mt: 3 }} />

          {/* Sección Actividades */}
          <SectionTitle>Actividades</SectionTitle>

          {/* 1. Llamada a lista */}
          <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight={700} gutterBottom>
              1. LLAMADA A LISTA Y VERIFICACIÓN DE QUÓRUM
            </Typography>
            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                Presentes: <strong>{presentCount}</strong> de <strong>{totalMembers}</strong> (
                {attendancePct.toFixed(0)}%)
              </Typography>
              <Chip
                label={quorumAchieved ? `Quórum alcanzado (${quorumPct}%)` : `Sin quórum (req. ${quorumPct}%)`}
                size="small"
                color={quorumAchieved ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* 2. Lectura del acta anterior */}
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight={700} gutterBottom>
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
          <Box>
            <Typography
              component="label"
              htmlFor="acta-desarrollo"
              variant="body2"
              fontWeight={700}
              display="block"
              gutterBottom
            >
              3. DESARROLLO DE LA REUNIÓN
            </Typography>
            <TextField
              id="acta-desarrollo"
              value={desarrollo}
              onChange={(e) => setDesarrollo(e.target.value)}
              multiline
              minRows={6}
              fullWidth
              size="small"
              placeholder="Describe el desarrollo de la reunión…"
            />
          </Box>
        </Box>
      </Paper>

      {/* ═══════════════════════════════════════════════ */}
      {/* PÁGINA 2                                        */}
      {/* ═══════════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
        <ActaHeader page={2} total={2} />

        <Box p={{ xs: 2, sm: 3 }} pt={{ xs: 0, sm: 0 }}>
          {/* 4. Revisión de tareas anteriores */}
          <SectionTitle>4. REVISIÓN DE TAREAS COMITÉ O REUNIÓN ANTERIOR</SectionTitle>

          {previousActivities.length === 0 ? (
            <Box
              sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}
            >
              <Typography variant="body2" color="text.secondary">
                {prevMeetingId
                  ? 'No hay actividades registradas en la reunión anterior.'
                  : 'No hay reuniones anteriores.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" aria-label="Tareas de la reunión anterior">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Actividad</TableCell>
                    <TableCell sx={headCellSx}>Responsable</TableCell>
                    <TableCell sx={headCellSx} width={140} align="center">% Cumpl.</TableCell>
                    <TableCell sx={headCellSx} width={110}>Fecha</TableCell>
                    <TableCell sx={headCellSx}>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previousActivities.map((act, idx) => (
                    <TableRow key={act.id}>
                      <TableCell>
                        <Typography variant="body2">{act.title}</Typography>
                        <Chip
                          label={activityStatusLabel[act.status] ?? act.status}
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
                        <Typography variant="body2" color={act.responsible ? 'text.primary' : 'text.secondary'}>
                          {act.responsible || 'Sin asignar'}
                        </Typography>
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
                            aria-label={`Porcentaje de cumplimiento: ${act.title}`}
                          />
                          <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {act.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {act.dueDate ? formatDateOnly(act.dueDate) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={act.observations}
                          onChange={(e) => updatePrevActivity(idx, 'observations', e.target.value)}
                          size="small"
                          multiline
                          minRows={1}
                          fullWidth
                          placeholder="Observaciones"
                          inputProps={{ 'aria-label': `Observaciones: ${act.title}` }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* 5. Asignación de tareas */}
          <SectionTitle
            action={
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setNewTasks((prev) => [...prev, emptyTask()])}
              >
                Agregar tarea
              </Button>
            }
          >
            5. ASIGNACIÓN DE TAREAS
          </SectionTitle>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Tareas asignadas en esta reunión">
              <TableHead>
                <TableRow>
                  <TableCell sx={headCellSx}>Actividad</TableCell>
                  <TableCell sx={headCellSx} width={200}>Responsable</TableCell>
                  <TableCell sx={headCellSx} width={150}>Fecha compromiso</TableCell>
                  <TableCell sx={headCellSx}>Observaciones</TableCell>
                  <TableCell sx={headCellSx} width={48} />
                </TableRow>
              </TableHead>
              <TableBody>
                {newTasks.map((task, idx) => (
                  <TableRow key={task.id ?? `new-${idx}`}>
                    <TableCell sx={{ minWidth: 200 }}>
                      <TextField
                        value={task.title}
                        onChange={(e) => updateNewTask(idx, 'title', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Descripción de la tarea"
                        inputProps={{ 'aria-label': `Tarea ${idx + 1}: descripción` }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel id={`responsable-${idx}`}>Responsable</InputLabel>
                        <Select
                          labelId={`responsable-${idx}`}
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
                    <TableCell sx={{ minWidth: 150 }}>
                      <TextField
                        type="date"
                        value={task.commitmentDate}
                        onChange={(e) => updateNewTask(idx, 'commitmentDate', e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ 'aria-label': `Tarea ${idx + 1}: fecha compromiso` }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <TextField
                        value={task.observations}
                        onChange={(e) => updateNewTask(idx, 'observations', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Observaciones"
                        inputProps={{ 'aria-label': `Tarea ${idx + 1}: observaciones` }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={newTasks.length === 1 ? 'Debe quedar al menos una fila' : 'Eliminar tarea'}>
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Eliminar tarea ${idx + 1}`}
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
          <SectionTitle>6. PROPOSICIONES Y VARIOS</SectionTitle>
          <TextField
            value={proposiciones}
            onChange={(e) => setProposiciones(e.target.value)}
            multiline
            minRows={4}
            fullWidth
            size="small"
            placeholder="Proposiciones y varios…"
            inputProps={{ 'aria-label': 'Proposiciones y varios' }}
          />

          {/* Firmas */}
          <Grid container spacing={4} justifyContent="center" mt={5}>
            {[
              { label: 'SECRETARIO', role: CommitteeRole.SECRETARY },
              { label: 'PRESIDENTE', role: CommitteeRole.PRESIDENT },
            ].map(({ label, role }) => {
              const found = attendees.find((a) => a.role === role);
              return (
                <Grid key={label} size={{ xs: 12, sm: 5 }}>
                  <Box textAlign="center">
                    <Box
                      aria-hidden
                      sx={{ borderBottom: 1, borderColor: 'text.primary', mb: 0.75, height: 48 }}
                    />
                    <Typography variant="body2" fontWeight={700}>
                      {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {found?.name || 'Cargo sin asignar en el comité'}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Paper>

      {/* ── Acciones (fijas abajo para que guardar siempre esté a mano) ── */}
      <Paper
        variant="outlined"
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: (theme) => theme.zIndex.appBar - 1,
          mx: { xs: -2, sm: 0 },
          mb: { xs: 0, sm: 2 },
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          borderRadius: { xs: 0, sm: 1 },
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        {(error || successMsg) && (
          <Alert
            severity={error ? 'error' : 'success'}
            onClose={() => (error ? setError(null) : setSuccessMsg(null))}
            sx={{ mb: 1.5 }}
            role={error ? 'alert' : 'status'}
          >
            {error || successMsg}
          </Alert>
        )}
        <Box
          display="flex"
          justifyContent="flex-end"
          gap={1.5}
          flexWrap="wrap"
          alignItems="center"
          sx={{ '& > *': { flex: { xs: '1 1 auto', sm: '0 0 auto' } }, '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } } }}
        >
            <Button
              variant="outlined"
              onClick={() => navigate(`/admin/committees/${committeeId}/actas`)}
              disabled={activeAction !== null}
            >
              Cancelar
            </Button>
            <Button
              variant="outlined"
              startIcon={activeAction === 'save' ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={() => handleSave(false)}
              disabled={activeAction !== null}
            >
              {activeAction === 'save' ? 'Guardando…' : 'Guardar'}
            </Button>
            <Tooltip title={!savedMeetingId && !isEdit ? 'Guarda el acta primero' : 'Descargar la última versión guardada'}>
              <span>
                <Button
                  variant="outlined"
                  startIcon={activeAction === 'pdf' ? <CircularProgress size={16} /> : <PdfIcon />}
                  onClick={() => handleDownloadPdf()}
                  disabled={activeAction !== null || (!savedMeetingId && !isEdit)}
                >
                  {activeAction === 'pdf' ? 'Descargando…' : 'Descargar PDF'}
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={activeAction === 'saveAndPdf' ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
              onClick={() => handleSave(true)}
              disabled={activeAction !== null}
            >
              {activeAction === 'saveAndPdf' ? 'Guardando…' : 'Guardar y descargar PDF'}
            </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ActaForm;
