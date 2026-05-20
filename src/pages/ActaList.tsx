import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Description as ActaIcon,
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Committee, Meeting, MeetingStatus } from '../types';

const statusLabel: Record<MeetingStatus, string> = {
  [MeetingStatus.SCHEDULED]: 'Programada',
  [MeetingStatus.IN_PROGRESS]: 'En Progreso',
  [MeetingStatus.COMPLETED]: 'Completada',
  [MeetingStatus.CANCELLED]: 'Cancelada',
  [MeetingStatus.POSTPONED]: 'Pospuesta',
};

const statusColor: Record<MeetingStatus, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  [MeetingStatus.SCHEDULED]: 'primary',
  [MeetingStatus.IN_PROGRESS]: 'warning',
  [MeetingStatus.COMPLETED]: 'success',
  [MeetingStatus.CANCELLED]: 'error',
  [MeetingStatus.POSTPONED]: 'default',
};

const ActaList: React.FC = () => {
  const navigate = useNavigate();
  const { id: committeeIdParam } = useParams<{ id: string }>();

  // When accessed from sidebar (no id param), allow selecting a committee
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>(committeeIdParam ?? '');
  const [allCommittees, setAllCommittees] = useState<Committee[]>([]);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Load committee list when in generic mode (no id param)
  useEffect(() => {
    if (!committeeIdParam) {
      api.get('/committees/', { params: { page_size: 100 } }).then((res) => {
        const items: Committee[] = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
        setAllCommittees(items);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [committeeIdParam]);

  const loadData = useCallback(async () => {
    const cid = selectedCommitteeId;
    if (!cid) return;
    try {
      setLoading(true);
      setError(null);
      const [committeeRes, meetingsRes] = await Promise.all([
        api.get(`/committees/${cid}`),
        api.get('/committee-meetings/', { params: { committee_id: cid, page_size: 100 } }),
      ]);
      setCommittee(committeeRes.data);
      const items: Meeting[] = Array.isArray(meetingsRes.data)
        ? meetingsRes.data
        : meetingsRes.data?.items ?? [];
      const sorted = [...items].sort(
        (a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime(),
      );
      setMeetings(sorted);
    } catch {
      setError('Error al cargar las actas. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [selectedCommitteeId]);

  useEffect(() => {
    if (selectedCommitteeId) loadData();
  }, [loadData, selectedCommitteeId]);

  const activeCommitteeId = selectedCommitteeId;

  const handleDownloadPdf = async (meeting: Meeting) => {
    setDownloadingId(meeting.id);
    try {
      const res = await api.get(`/committee-meetings/${meeting.id}/minutes/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Acta_${committee?.name ?? 'Comite'}_${new Date(meeting.meeting_date).toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      setDownloadingId(null);
    }
  };

  const committeeTypeLabel = (type: string) =>
    type?.toLowerCase() === 'copasst' ? 'COPASST' : 'Convivencia';

  if (loading && !allCommittees.length && !committeeIdParam) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          {committeeIdParam && (
            <IconButton onClick={() => navigate(`/admin/committees/${activeCommitteeId}`)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h5" component="h1">
              Actas de Reunión
            </Typography>
            {committee && (
              <Typography variant="body2" color="text.secondary">
                {committee.name} — {committeeTypeLabel(committee.committee_type)}
              </Typography>
            )}
          </Box>
        </Box>
        {activeCommitteeId && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/admin/committees/${activeCommitteeId}/actas/new`)}
          >
            Nueva Acta
          </Button>
        )}
      </Box>

      {/* Selector de comité (solo en ruta genérica sin id) */}
      {!committeeIdParam && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Seleccionar Comité</InputLabel>
          <Select
            value={selectedCommitteeId}
            onChange={(e) => setSelectedCommitteeId(e.target.value)}
            label="Seleccionar Comité"
          >
            {allCommittees.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>
                {c.name} — {committeeTypeLabel(c.committee_type)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {!activeCommitteeId ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={6}
            >
              <ActaIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Selecciona un comité para ver sus actas
              </Typography>
            </Box>
          ) : loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={6}>
              <CircularProgress />
            </Box>
          ) : meetings.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={6}
            >
              <ActaIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay actas registradas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Crea la primera acta de reunión para este comité
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/admin/committees/${activeCommitteeId}/actas/new`)}
              >
                Nueva Acta
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>N° Acta</strong></TableCell>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Título / Lugar</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Asistentes</strong></TableCell>
                    <TableCell align="right"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {meetings.map((meeting, idx) => (
                    <TableRow key={meeting.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {String(idx + 1).padStart(3, '0')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(meeting.meeting_date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{meeting.title}</Typography>
                        {meeting.location && (
                          <Typography variant="caption" color="text.secondary">
                            {meeting.location}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabel[meeting.status] ?? meeting.status}
                          size="small"
                          color={statusColor[meeting.status] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {meeting.attendees_count != null ? (
                          <Typography variant="body2">{meeting.attendees_count} presentes</Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Descargar PDF">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadPdf(meeting)}
                              disabled={downloadingId === meeting.id}
                            >
                              {downloadingId === meeting.id ? (
                                <CircularProgress size={18} />
                              ) : (
                                <PdfIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Editar acta">
                          <IconButton
                            size="small"
                            onClick={() =>
                              navigate(`/admin/committees/${activeCommitteeId}/actas/${meeting.id}/edit`)
                            }
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ActaList;
