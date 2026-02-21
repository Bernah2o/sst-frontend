import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Link,
  Paper,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  PictureAsPdf as PdfIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  cronogramaPypService,
  CronogramaPypDetail,
  CronogramaPypActividad,
  CronogramaPypActividadCreate,
  CronogramaPypSeguimientoUpdate,
} from '../services/cronogramaPypService';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const AREA_COLOR = '#1565c0';
const PIE_COLORS = ['#4caf50', '#1976d2', '#e0e0e0'];

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────
const getSeg = (act: CronogramaPypActividad, mes: number) =>
  act.seguimientos_mensuales.find((s) => s.mes === mes);

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
const CronogramaPypDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { dialogState, showConfirmDialog } = useConfirmDialog();
  const numPlanId = Number(planId);

  const [cronograma, setCronograma] = useState<CronogramaPypDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Edit header dialog
  const [headerDialog, setHeaderDialog] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    codigo: '', version: '', encargado_sgsst: '', aprobado_por: '', objetivo: '', alcance: '',
  });
  const [savingHeader, setSavingHeader] = useState(false);

  // Add/Edit actividad dialog
  const [actDialog, setActDialog] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });
  const [actForm, setActForm] = useState<CronogramaPypActividadCreate>({
    actividad: '', poblacion_objetivo: '', responsable: '', indicador: '', recursos: '', observaciones: '', orden: 0,
  });
  const [savingAct, setSavingAct] = useState(false);

  // Seguimiento detail dialog
  const [segDialog, setSegDialog] = useState(false);
  const [segKey, setSegKey] = useState<{ actividadId: number; mes: number }>({ actividadId: 0, mes: 1 });
  const [segForm, setSegForm] = useState<CronogramaPypSeguimientoUpdate>({});
  const [savingSeg, setSavingSeg] = useState(false);

  // ── load ──
  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cronogramaPypService.obtenerCronograma(numPlanId);
      setCronograma(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error al cargar el cronograma');
    } finally {
      setLoading(false);
    }
  }, [numPlanId]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Toggle P/E ──
  const handleToggle = async (
    actividadId: number,
    mes: number,
    field: 'programada' | 'ejecutada',
    current: boolean
  ) => {
    try {
      await cronogramaPypService.actualizarSeguimiento(numPlanId, actividadId, mes, { [field]: !current });
      setCronograma((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          actividades: prev.actividades.map((a) =>
            a.id !== actividadId ? a : {
              ...a,
              seguimientos_mensuales: a.seguimientos_mensuales.map((s) =>
                s.mes !== mes ? s : { ...s, [field]: !current }
              ),
            }
          ),
        };
      });
    } catch {
      setError('Error al actualizar seguimiento');
    }
  };

  // ── Header ──
  const openHeader = () => {
    if (!cronograma) return;
    setHeaderForm({
      codigo: cronograma.codigo,
      version: cronograma.version,
      encargado_sgsst: cronograma.encargado_sgsst ?? '',
      aprobado_por: cronograma.aprobado_por ?? '',
      objetivo: cronograma.objetivo ?? '',
      alcance: cronograma.alcance ?? '',
    });
    setHeaderDialog(true);
  };
  const saveHeader = async () => {
    try { setSavingHeader(true); await cronogramaPypService.actualizarCronograma(numPlanId, headerForm); await cargar(); setHeaderDialog(false); setSuccess('Encabezado actualizado'); }
    catch { setError('Error al guardar encabezado'); }
    finally { setSavingHeader(false); }
  };

  // ── Actividad ──
  const openActDialog = (act?: CronogramaPypActividad) => {
    setActForm(act
      ? { actividad: act.actividad, poblacion_objetivo: act.poblacion_objetivo ?? '', responsable: act.responsable ?? '', indicador: act.indicador ?? '', recursos: act.recursos ?? '', observaciones: act.observaciones ?? '', orden: act.orden }
      : { actividad: '', poblacion_objetivo: '', responsable: '', indicador: '', recursos: '', observaciones: '', orden: cronograma?.actividades.length ?? 0 }
    );
    setActDialog({ open: true, editId: act?.id ?? null });
  };
  const saveAct = async () => {
    if (!actForm.actividad.trim()) return;
    try {
      setSavingAct(true);
      if (actDialog.editId) {
        await cronogramaPypService.actualizarActividad(numPlanId, actDialog.editId, actForm);
      } else {
        await cronogramaPypService.crearActividad(numPlanId, actForm);
      }
      await cargar();
      setActDialog({ open: false, editId: null });
      setSuccess('Actividad guardada');
    } catch { setError('Error al guardar actividad'); }
    finally { setSavingAct(false); }
  };

  const deleteAct = async (act: CronogramaPypActividad) => {
    const ok = await showConfirmDialog({ title: 'Eliminar Actividad', message: `¿Eliminar "${act.actividad}"?`, confirmText: 'Eliminar', severity: 'error' });
    if (!ok) return;
    try { await cronogramaPypService.eliminarActividad(numPlanId, act.id); await cargar(); setSuccess('Actividad eliminada'); }
    catch { setError('Error al eliminar actividad'); }
  };

  // ── Seguimiento detail ──
  const openSeg = (actividadId: number, mes: number) => {
    const act = cronograma?.actividades.find((a) => a.id === actividadId);
    const seg = act?.seguimientos_mensuales.find((s) => s.mes === mes);
    setSegKey({ actividadId, mes });
    setSegForm({ programada: seg?.programada ?? false, ejecutada: seg?.ejecutada ?? false, observacion: seg?.observacion ?? '', fecha_ejecucion: seg?.fecha_ejecucion ?? '', ejecutado_por: seg?.ejecutado_por ?? '' });
    setSegDialog(true);
  };
  const saveSeg = async () => {
    try { setSavingSeg(true); await cronogramaPypService.actualizarSeguimiento(numPlanId, segKey.actividadId, segKey.mes, segForm); await cargar(); setSegDialog(false); setSuccess('Seguimiento actualizado'); }
    catch { setError('Error al guardar seguimiento'); }
    finally { setSavingSeg(false); }
  };

  // ── Export PDF ──
  const handlePdf = async () => {
    if (!cronograma) return;
    try { setExporting(true); await cronogramaPypService.exportarPdf(numPlanId, cronograma.año); }
    catch { setError('Error al exportar PDF'); }
    finally { setExporting(false); }
  };

  // ── Dashboard data ──
  const dashData = useMemo(() => {
    if (!cronograma) return null;
    const meses = Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
      let prog = 0; let ejec = 0;
      cronograma.actividades.forEach((a) => {
        const s = a.seguimientos_mensuales.find((s) => s.mes === mes);
        if (s?.programada) prog++;
        if (s?.ejecutada) ejec++;
      });
      return { mes: MESES_CORTOS[mes - 1], Programadas: prog, Ejecutadas: ejec };
    });
    const totalProg = meses.reduce((a, m) => a + m.Programadas, 0);
    const totalEjec = meses.reduce((a, m) => a + m.Ejecutadas, 0);
    const pct = totalProg > 0 ? Math.round((totalEjec / totalProg) * 100) : 0;
    return { meses, totalProg, totalEjec, pct };
  }, [cronograma]);

  // ─────────────
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={500} />
      </Box>
    );
  }

  if (!cronograma) {
    return (
      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No existe un Cronograma PYP para este plan
          </Typography>
          <Button variant="contained" onClick={() => navigate('/admin/cronograma-pyp')}>
            Volver al listado
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/admin/cronograma-pyp')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ArrowBackIcon fontSize="small" />
          Cronograma PYP
        </Link>
        <Typography color="text.primary">Vigencia {cronograma.año}</Typography>
      </Breadcrumbs>

      {/* Header bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            PROGRAMA PROMOCIÓN Y PREVENCIÓN — {cronograma.año}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cronograma.codigo} · Versión {cronograma.version}
            {cronograma.encargado_sgsst && ` · Encargado: ${cronograma.encargado_sgsst}`}
            {cronograma.aprobado_por && ` · Aprobado: ${cronograma.aprobado_por}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={openHeader} size="small">Encabezado</Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={exporting ? <CircularProgress size={16} /> : <PdfIcon />}
            onClick={handlePdf}
            disabled={exporting}
            size="small"
          >
            PDF
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openActDialog()} size="small">
            Nueva Actividad
          </Button>
        </Box>
      </Box>

      {/* Meta / objetivo banner */}
      <Paper sx={{ px: 2, py: 1, mb: 2, bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Typography variant="caption">
            <strong>META:</strong> Cumplir con el 100% de las actividades programadas
          </Typography>
          <Typography variant="caption">
            <strong>INDICADOR:</strong> Nº de Actividades Ejecutadas / Nº de Actividades Programadas × 100
          </Typography>
        </Box>
      </Paper>

      {/* Alerts */}
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">Leyenda — clic para alternar:</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: '#1565c0' }} />
          <Typography variant="caption">P = Programada</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: '#2e7d32' }} />
          <Typography variant="caption">E = Ejecutada</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">(click derecho / ícono 📋 = detalle mensual)</Typography>
      </Box>

      {/* Cronograma table */}
      <CronogramaTable
        actividades={cronograma.actividades}
        onToggle={handleToggle}
        onOpenSeg={openSeg}
        onEdit={openActDialog}
        onDelete={deleteAct}
      />

      <Divider sx={{ my: 4 }} />

      {/* Monitoring section */}
      {dashData && (
        <MonitoreoSection dashData={dashData} />
      )}

      {/* ── Dialogs ── */}

      {/* Header edit */}
      <Dialog open={headerDialog} onClose={() => !savingHeader && setHeaderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Encabezado</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Código" fullWidth value={headerForm.codigo} onChange={(e) => setHeaderForm((f) => ({ ...f, codigo: e.target.value }))} />
            <TextField label="Versión" fullWidth value={headerForm.version} onChange={(e) => setHeaderForm((f) => ({ ...f, version: e.target.value }))} />
          </Box>
          <TextField label="Encargado SG-SST" fullWidth value={headerForm.encargado_sgsst} onChange={(e) => setHeaderForm((f) => ({ ...f, encargado_sgsst: e.target.value }))} />
          <TextField label="Aprobado por" fullWidth value={headerForm.aprobado_por} onChange={(e) => setHeaderForm((f) => ({ ...f, aprobado_por: e.target.value }))} />
          <TextField label="Objetivo" fullWidth multiline rows={2} value={headerForm.objetivo} onChange={(e) => setHeaderForm((f) => ({ ...f, objetivo: e.target.value }))} />
          <TextField label="Alcance" fullWidth multiline rows={2} value={headerForm.alcance} onChange={(e) => setHeaderForm((f) => ({ ...f, alcance: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHeaderDialog(false)} disabled={savingHeader}>Cancelar</Button>
          <Button variant="contained" onClick={saveHeader} disabled={savingHeader} startIcon={savingHeader ? <CircularProgress size={16} /> : <SaveIcon />}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Actividad add/edit */}
      <Dialog open={actDialog.open} onClose={() => !savingAct && setActDialog({ open: false, editId: null })} maxWidth="md" fullWidth>
        <DialogTitle>{actDialog.editId ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Actividad *" fullWidth multiline rows={2} value={actForm.actividad} onChange={(e) => setActForm((f) => ({ ...f, actividad: e.target.value }))} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Población Objetivo" fullWidth value={actForm.poblacion_objetivo ?? ''} onChange={(e) => setActForm((f) => ({ ...f, poblacion_objetivo: e.target.value }))} />
            <TextField label="Responsable" fullWidth value={actForm.responsable ?? ''} onChange={(e) => setActForm((f) => ({ ...f, responsable: e.target.value }))} />
          </Box>
          <TextField label="Indicador" fullWidth value={actForm.indicador ?? ''} onChange={(e) => setActForm((f) => ({ ...f, indicador: e.target.value }))} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Recursos" fullWidth value={actForm.recursos ?? ''} onChange={(e) => setActForm((f) => ({ ...f, recursos: e.target.value }))} />
            <TextField label="Observaciones" fullWidth value={actForm.observaciones ?? ''} onChange={(e) => setActForm((f) => ({ ...f, observaciones: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActDialog({ open: false, editId: null })} disabled={savingAct}>Cancelar</Button>
          <Button variant="contained" onClick={saveAct} disabled={savingAct || !actForm.actividad.trim()} startIcon={savingAct ? <CircularProgress size={16} /> : <SaveIcon />}>
            {savingAct ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Seguimiento detail */}
      <Dialog open={segDialog} onClose={() => !savingSeg && setSegDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Seguimiento — {MESES_CORTOS[segKey.mes - 1]}</DialogTitle>
        <Divider />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <FormControlLabel
              control={<Switch checked={segForm.programada ?? false} onChange={(e) => setSegForm((f) => ({ ...f, programada: e.target.checked }))} color="primary" />}
              label="Programada"
            />
            <FormControlLabel
              control={<Switch checked={segForm.ejecutada ?? false} onChange={(e) => setSegForm((f) => ({ ...f, ejecutada: e.target.checked }))} color="success" />}
              label="Ejecutada"
            />
          </Box>
          <TextField label="Fecha de ejecución" type="date" fullWidth InputLabelProps={{ shrink: true }} value={segForm.fecha_ejecucion ?? ''} onChange={(e) => setSegForm((f) => ({ ...f, fecha_ejecucion: e.target.value }))} />
          <TextField label="Ejecutado por" fullWidth value={segForm.ejecutado_por ?? ''} onChange={(e) => setSegForm((f) => ({ ...f, ejecutado_por: e.target.value }))} />
          <TextField label="Observación" fullWidth multiline rows={3} value={segForm.observacion ?? ''} onChange={(e) => setSegForm((f) => ({ ...f, observacion: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSegDialog(false)} disabled={savingSeg}>Cancelar</Button>
          <Button variant="contained" onClick={saveSeg} disabled={savingSeg} startIcon={savingSeg ? <CircularProgress size={16} /> : <SaveIcon />}>Guardar</Button>
        </DialogActions>
      </Dialog>

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

// ─────────────────────────────────────────────
// CronogramaTable — 12-month P/E grid
// ─────────────────────────────────────────────
interface CronogramaTableProps {
  actividades: CronogramaPypActividad[];
  onToggle: (actId: number, mes: number, field: 'programada' | 'ejecutada', current: boolean) => void;
  onOpenSeg: (actId: number, mes: number) => void;
  onEdit: (act: CronogramaPypActividad) => void;
  onDelete: (act: CronogramaPypActividad) => void;
}

const CronogramaTable: React.FC<CronogramaTableProps> = ({ actividades, onToggle, onOpenSeg, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(true);

  // Compute totals per month
  const totalesProg = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => actividades.filter((a) => getSeg(a, i + 1)?.programada).length),
    [actividades]
  );
  const totalesEjec = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => actividades.filter((a) => getSeg(a, i + 1)?.ejecutada).length),
    [actividades]
  );

  return (
    <Box sx={{ mb: 3 }}>
      {/* Area header */}
      <Paper
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1, mb: 1, bgcolor: AREA_COLOR, color: 'white',
          cursor: 'pointer', borderRadius: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          CRONOGRAMA DE ACTIVIDADES PYP — VIGENCIA {new Date().getFullYear()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={`${actividades.length} actividades`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Paper>

      <Collapse in={expanded}>
        {actividades.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No hay actividades registradas. Agrega la primera actividad.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1400 }}>
              <TableHead>
                {/* Row 1: month names spanning 2 columns each */}
                <TableRow sx={{ bgcolor: 'grey.800' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.72rem', minWidth: 260, borderRight: '1px solid rgba(255,255,255,0.2)' }} rowSpan={2}>
                    ACTIVIDADES
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.72rem', minWidth: 110, borderRight: '1px solid rgba(255,255,255,0.2)' }} rowSpan={2}>
                    Población Objetivo
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.72rem', minWidth: 110, borderRight: '1px solid rgba(255,255,255,0.2)' }} rowSpan={2}>
                    Responsable
                  </TableCell>
                  {MESES_CORTOS.map((m, i) => (
                    <TableCell
                      key={m}
                      align="center"
                      colSpan={2}
                      sx={{
                        color: 'white', fontWeight: 'bold', fontSize: '0.72rem', px: 0,
                        borderRight: i < 11 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                      }}
                    >
                      {m}
                    </TableCell>
                  ))}
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.72rem', minWidth: 80, borderLeft: '1px solid rgba(255,255,255,0.2)' }} rowSpan={2} align="center">
                    Acciones
                  </TableCell>
                </TableRow>
                {/* Row 2: P/E headers */}
                <TableRow sx={{ bgcolor: 'grey.700' }}>
                  {MESES_CORTOS.map((_, i) => (
                    <React.Fragment key={i}>
                      <TableCell align="center" sx={{ color: '#90caf9', fontSize: '0.65rem', px: 0.3, py: 0.4, fontWeight: 'bold', width: 24 }}>P</TableCell>
                      <TableCell align="center" sx={{ color: '#a5d6a7', fontSize: '0.65rem', px: 0.3, py: 0.4, fontWeight: 'bold', width: 24, borderRight: i < 11 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>E</TableCell>
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {actividades.map((act, idx) => (
                  <ActividadRow
                    key={act.id}
                    act={act}
                    idx={idx}
                    onToggle={onToggle}
                    onOpenSeg={onOpenSeg}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}

                {/* Total row */}
                <TableRow sx={{ bgcolor: '#e8f5e9', fontWeight: 'bold' }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    Total Actividades
                  </TableCell>
                  {Array.from({ length: 12 }, (_, i) => (
                    <React.Fragment key={i}>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.72rem', color: '#1565c0', bgcolor: totalesProg[i] > 0 ? '#bbdefb' : undefined }}>
                        {totalesProg[i] > 0 ? totalesProg[i] : ''}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.72rem', color: '#2e7d32', bgcolor: totalesEjec[i] > 0 ? '#c8e6c9' : undefined, borderRight: i < 11 ? '1px solid #e0e0e0' : 'none' }}>
                        {totalesEjec[i] > 0 ? totalesEjec[i] : ''}
                      </TableCell>
                    </React.Fragment>
                  ))}
                  <TableCell />
                </TableRow>

                {/* % Actividad row */}
                <TableRow sx={{ bgcolor: '#f3e5f5' }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 'bold', fontSize: '0.72rem', color: '#6a1b9a' }}>
                    % Actividad del Programa
                  </TableCell>
                  {Array.from({ length: 12 }, (_, i) => {
                    const pct = totalesProg[i] > 0 ? Math.round((totalesEjec[i] / totalesProg[i]) * 100) : 0;
                    return (
                      <React.Fragment key={i}>
                        <TableCell align="center" sx={{ fontSize: '0.65rem', color: '#6a1b9a', fontWeight: 'bold' }}>
                          {totalesProg[i] > 0 ? `${pct}%` : ''}
                        </TableCell>
                        <TableCell sx={{ borderRight: i < 11 ? '1px solid #e0e0e0' : 'none' }} />
                      </React.Fragment>
                    );
                  })}
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Collapse>
    </Box>
  );
};

// ─────────────────────────────────────────────
// Single activity row
// ─────────────────────────────────────────────
interface ActividadRowProps {
  act: CronogramaPypActividad;
  idx: number;
  onToggle: (actId: number, mes: number, field: 'programada' | 'ejecutada', current: boolean) => void;
  onOpenSeg: (actId: number, mes: number) => void;
  onEdit: (act: CronogramaPypActividad) => void;
  onDelete: (act: CronogramaPypActividad) => void;
}

const ActividadRow: React.FC<ActividadRowProps> = ({ act, idx, onToggle, onOpenSeg, onEdit, onDelete }) => (
  <TableRow sx={{ bgcolor: idx % 2 === 0 ? 'white' : 'grey.50', '&:hover': { bgcolor: '#e3f2fd' } }}>
    <TableCell sx={{ fontSize: '0.78rem', verticalAlign: 'middle', py: 0.5, maxWidth: 260 }}>
      {act.actividad}
    </TableCell>
    <TableCell sx={{ fontSize: '0.72rem', color: 'text.secondary', verticalAlign: 'middle', py: 0.5 }}>
      {act.poblacion_objetivo}
    </TableCell>
    <TableCell sx={{ fontSize: '0.72rem', color: 'text.secondary', verticalAlign: 'middle', py: 0.5 }}>
      {act.responsable}
    </TableCell>

    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
      const seg = getSeg(act, mes);
      const prog = seg?.programada ?? false;
      const ejec = seg?.ejecutada ?? false;
      return (
        <React.Fragment key={mes}>
          {/* P cell */}
          <Tooltip title={`${MESES_CORTOS[mes - 1]} Programada: ${prog ? 'Sí' : 'No'} (clic para alternar)`} placement="top">
            <TableCell
              align="center"
              sx={{
                px: 0, py: 0.3, width: 24, cursor: 'pointer',
                bgcolor: prog ? '#bbdefb' : 'transparent',
                '&:hover': { bgcolor: '#90caf9', opacity: 0.8 },
              }}
              onClick={() => onToggle(act.id, mes, 'programada', prog)}
              onContextMenu={(e) => { e.preventDefault(); onOpenSeg(act.id, mes); }}
            >
              {prog
                ? <CheckCircleIcon sx={{ fontSize: 13, color: '#1565c0' }} />
                : <UncheckedIcon sx={{ fontSize: 12, color: '#bdbdbd' }} />}
            </TableCell>
          </Tooltip>
          {/* E cell */}
          <Tooltip title={`${MESES_CORTOS[mes - 1]} Ejecutada: ${ejec ? 'Sí' : 'No'} (clic para alternar)`} placement="top">
            <TableCell
              align="center"
              sx={{
                px: 0, py: 0.3, width: 24, cursor: 'pointer',
                bgcolor: ejec ? '#c8e6c9' : 'transparent',
                borderRight: mes < 12 ? '1px solid #e0e0e0' : 'none',
                '&:hover': { bgcolor: '#a5d6a7', opacity: 0.8 },
              }}
              onClick={() => onToggle(act.id, mes, 'ejecutada', ejec)}
              onContextMenu={(e) => { e.preventDefault(); onOpenSeg(act.id, mes); }}
            >
              {ejec
                ? <CheckCircleIcon sx={{ fontSize: 13, color: '#2e7d32' }} />
                : <UncheckedIcon sx={{ fontSize: 12, color: '#bdbdbd' }} />}
            </TableCell>
          </Tooltip>
        </React.Fragment>
      );
    })}

    <TableCell align="center" sx={{ py: 0.3 }}>
      <Box sx={{ display: 'flex', gap: 0.3, justifyContent: 'center' }}>
        <Tooltip title="Editar actividad">
          <IconButton size="small" onClick={() => onEdit(act)}>
            <EditIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar actividad">
          <IconButton size="small" color="error" onClick={() => onDelete(act)}>
            <DeleteIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </TableCell>
  </TableRow>
);

// ─────────────────────────────────────────────
// Monitoreo (Dashboard) Section
// ─────────────────────────────────────────────
interface DashData {
  meses: { mes: string; Programadas: number; Ejecutadas: number }[];
  totalProg: number;
  totalEjec: number;
  pct: number;
}

const MonitoreoSection: React.FC<{ dashData: DashData }> = ({ dashData }) => {
  const { meses, totalProg, totalEjec, pct } = dashData;
  const pctColor = pct >= 80 ? '#2e7d32' : pct >= 50 ? '#e65100' : '#c62828';

  const pieData = [
    { name: 'Ejecutadas', value: totalEjec },
    { name: 'Programadas (no ejec.)', value: Math.max(0, totalProg - totalEjec) },
    { name: 'Sin programar', value: 0 },
  ].filter((d) => d.value > 0);

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: AREA_COLOR }}>
        MONITOREO DEL PROGRAMA PYP
      </Typography>

      <Grid container spacing={3}>
        {/* KPI Cards */}
        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
          <Grid container spacing={2} direction="column">
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">TOTAL PROGRAMADAS</Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary">{totalProg}</Typography>
                  <Typography variant="caption" color="text.secondary">actividades en la vigencia</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">TOTAL EJECUTADAS</Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{totalEjec}</Typography>
                  <Typography variant="caption" color="text.secondary">actividades completadas</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">CUMPLIMIENTO GLOBAL</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress
                        variant="determinate"
                        value={Math.min(pct, 100)}
                        size={56}
                        thickness={5}
                        sx={{ color: pctColor }}
                      />
                      <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: pctColor }}>{pct}%</Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: pctColor }}>{pct}%</Typography>
                      <Typography variant="caption" color="text.secondary">Meta: 100%</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Line chart - seguimiento mensual */}
        <Grid size={{ xs: 12, sm: 8, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Seguimiento al Cumplimiento del Plan de Trabajo PYP — Vigencia
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={meses} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Programadas" stroke="#1976d2" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Ejecutadas" stroke="#2e7d32" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie chart */}
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                % Cumplimiento de Ejecución del PYP
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Bar chart mensual */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Actividades Programadas vs Ejecutadas por Mes
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={meses} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend iconSize={12} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Programadas" fill="#1976d2" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                  <Bar dataKey="Ejecutadas" fill="#2e7d32" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CronogramaPypDetailPage;
