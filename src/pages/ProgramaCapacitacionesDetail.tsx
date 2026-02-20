import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Grid,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Menu,
  MenuItem,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  FactCheck as FactCheckIcon,
  School as SchoolIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  programaCapacitacionesService,
  ProgramaCapacitacionesDetail,
  CapacitacionActividad,
  CapacitacionSeguimiento,
  IndicadorMensual,
  DashboardCapacitaciones,
  CICLO_LABELS,
  CICLO_COLORS,
  CICLO_LIGHT_COLORS,
  CICLOS_ORDER,
  TIPOS_INDICADOR,
  INDICADOR_LABELS,
  INDICADOR_COLORS,
  NOMBRE_MESES,
  MESES_ABREV,
  ESTADO_LABELS,
  ESTADO_COLORS,
  TipoIndicador,
  CicloPhvaCAP,
  EstadoPrograma,
  ESTADO_LABELS as ESTADO_LABELS_ALL,
} from '../services/programaCapacitacionesService';

// ── Tipos locales ──────────────────────────────────────────────────────────────

interface SeguimientoEditState {
  actividadId: number;
  mes: number;
  ejecutado_por: string;
  fecha_ejecucion: string;
  trabajadores_programados: number;
  trabajadores_participaron: number;
  personas_evaluadas: number;
  evaluaciones_eficaces: number;
  observacion: string;
}

// ── Componente Principal ───────────────────────────────────────────────────────

const ProgramaCapacitacionesDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { programaId } = useParams<{ programaId: string }>();
  const id = parseInt(programaId || '0', 10);

  const [programa, setPrograma] = useState<ProgramaCapacitacionesDetail | null>(null);
  const [indicadores, setIndicadores] = useState<IndicadorMensual[]>([]);
  const [dashboard, setDashboard] = useState<DashboardCapacitaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Estado para la fila expandida de detalle de seguimiento
  const [expandedRow, setExpandedRow] = useState<string | null>(null); // "actId-mes"
  const [editSeg, setEditSeg] = useState<SeguimientoEditState | null>(null);
  const [savingSeg, setSavingSeg] = useState(false);

  // Estado para secciones PHVA colapsables
  const [collapsedCiclos, setCollapsedCiclos] = useState<Set<string>>(new Set());
  const toggleCiclo = (ciclo: string) =>
    setCollapsedCiclos((prev) => {
      const next = new Set(prev);
      next.has(ciclo) ? next.delete(ciclo) : next.add(ciclo);
      return next;
    });

  // Estado para menú de cambio de estado
  const [estadoMenuAnchor, setEstadoMenuAnchor] = useState<null | HTMLElement>(null);
  const [savingEstado, setSavingEstado] = useState(false);
  const handleChangeEstado = async (nuevoEstado: EstadoPrograma) => {
    setEstadoMenuAnchor(null);
    setSavingEstado(true);
    try {
      const updated = await programaCapacitacionesService.actualizar(id, { estado: nuevoEstado });
      setPrograma((prev) => prev ? { ...prev, estado: updated.estado } : prev);
      setSnackMsg('Estado actualizado');
    } catch {
      setSnackMsg('Error al cambiar el estado');
    } finally {
      setSavingEstado(false);
    }
  };

  // Estado para edición inline de actividad (nombre / encargado)
  const [editingAct, setEditingAct] = useState<{ id: number; nombre: string; encargado: string } | null>(null);
  const [savingAct, setSavingAct] = useState(false);

  // Estado para edición de indicadores (numerador/denominador)
  const [editingInd, setEditingInd] = useState<{ tipo: TipoIndicador; mes: number; num: string; den: string } | null>(null);
  const [savingInd, setSavingInd] = useState(false);
  const [editingAnalisis, setEditingAnalisis] = useState<{ tipo: TipoIndicador; mes: number; texto: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [prog, inds, dash] = await Promise.all([
        programaCapacitacionesService.obtener(id),
        programaCapacitacionesService.obtenerIndicadores(id),
        programaCapacitacionesService.obtenerDashboard(id),
      ]);
      setPrograma(prog);
      setIndicadores(inds);
      setDashboard(dash);
    } catch {
      setError('Error al cargar el programa de capacitaciones');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Toggle P/E rápido ────────────────────────────────────────────────────────

  const handleToggleProgramada = async (act: CapacitacionActividad, mes: number, value: boolean) => {
    const seg = act.seguimientos.find((s) => s.mes === mes);
    if (!seg) return;
    try {
      await programaCapacitacionesService.actualizarSeguimiento(act.id, mes, { programada: value });
      setPrograma((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          actividades: prev.actividades.map((a) =>
            a.id === act.id
              ? { ...a, seguimientos: a.seguimientos.map((s) => s.mes === mes ? { ...s, programada: value } : s) }
              : a
          ),
        };
      });
    } catch {
      setSnackMsg('Error al actualizar programada');
    }
  };

  const handleToggleEjecutada = async (act: CapacitacionActividad, mes: number, value: boolean) => {
    const seg = act.seguimientos.find((s) => s.mes === mes);
    if (!seg) return;
    const rowKey = `${act.id}-${mes}`;
    if (value) {
      // Abrir fila expandida para datos de ejecución
      setExpandedRow(expandedRow === rowKey ? null : rowKey);
      setEditSeg({
        actividadId: act.id,
        mes,
        ejecutado_por: seg.ejecutado_por || '',
        fecha_ejecucion: seg.fecha_ejecucion || '',
        trabajadores_programados: seg.trabajadores_programados || 0,
        trabajadores_participaron: seg.trabajadores_participaron || 0,
        personas_evaluadas: seg.personas_evaluadas || 0,
        evaluaciones_eficaces: seg.evaluaciones_eficaces || 0,
        observacion: seg.observacion || '',
      });
    } else {
      try {
        await programaCapacitacionesService.actualizarSeguimiento(act.id, mes, { ejecutada: false });
        setPrograma((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            actividades: prev.actividades.map((a) =>
              a.id === act.id
                ? { ...a, seguimientos: a.seguimientos.map((s) => s.mes === mes ? { ...s, ejecutada: false } : s) }
                : a
            ),
          };
        });
        setExpandedRow(null);
      } catch {
        setSnackMsg('Error al actualizar ejecutada');
      }
    }
  };

  const handleSaveActividad = async () => {
    if (!editingAct) return;
    setSavingAct(true);
    try {
      await programaCapacitacionesService.actualizarActividad(editingAct.id, {
        nombre: editingAct.nombre,
        encargado: editingAct.encargado || undefined,
      });
      setPrograma((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          actividades: prev.actividades.map((a) =>
            a.id === editingAct.id
              ? { ...a, nombre: editingAct.nombre, encargado: editingAct.encargado }
              : a
          ),
        };
      });
      setEditingAct(null);
      setSnackMsg('Actividad actualizada');
    } catch {
      setSnackMsg('Error al guardar actividad');
    } finally {
      setSavingAct(false);
    }
  };

  const handleSaveSeguimiento = async () => {
    if (!editSeg) return;
    setSavingSeg(true);
    try {
      await programaCapacitacionesService.actualizarSeguimiento(editSeg.actividadId, editSeg.mes, {
        ejecutada: true,
        ejecutado_por: editSeg.ejecutado_por || undefined,
        fecha_ejecucion: editSeg.fecha_ejecucion || undefined,
        trabajadores_programados: editSeg.trabajadores_programados,
        trabajadores_participaron: editSeg.trabajadores_participaron,
        personas_evaluadas: editSeg.personas_evaluadas,
        evaluaciones_eficaces: editSeg.evaluaciones_eficaces,
        observacion: editSeg.observacion || undefined,
      });
      setPrograma((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          actividades: prev.actividades.map((a) =>
            a.id === editSeg.actividadId
              ? {
                  ...a,
                  seguimientos: a.seguimientos.map((s) =>
                    s.mes === editSeg.mes
                      ? {
                          ...s,
                          ejecutada: true,
                          ejecutado_por: editSeg.ejecutado_por,
                          fecha_ejecucion: editSeg.fecha_ejecucion,
                          trabajadores_programados: editSeg.trabajadores_programados,
                          trabajadores_participaron: editSeg.trabajadores_participaron,
                          personas_evaluadas: editSeg.personas_evaluadas,
                          evaluaciones_eficaces: editSeg.evaluaciones_eficaces,
                          observacion: editSeg.observacion,
                        }
                      : s
                  ),
                }
              : a
          ),
        };
      });
      setSnackMsg('Seguimiento guardado correctamente');
      setExpandedRow(null);
      setEditSeg(null);
      // Refrescar dashboard
      const dash = await programaCapacitacionesService.obtenerDashboard(id);
      setDashboard(dash);
    } catch {
      setSnackMsg('Error al guardar seguimiento');
    } finally {
      setSavingSeg(false);
    }
  };

  // ── Indicadores ──────────────────────────────────────────────────────────────

  const getIndicador = (tipo: TipoIndicador, mes: number): IndicadorMensual | undefined =>
    indicadores.find((i) => i.tipo_indicador === tipo && i.mes === mes);

  const handleSaveIndicador = async (tipo: TipoIndicador, mes: number, num: number, den: number) => {
    setSavingInd(true);
    try {
      const updated = await programaCapacitacionesService.actualizarIndicador(id, tipo, mes, {
        numerador: num,
        denominador: den,
      });
      setIndicadores((prev) =>
        prev.map((i) => (i.tipo_indicador === tipo && i.mes === mes ? updated : i))
      );
      setEditingInd(null);
      // Refrescar dashboard
      const dash = await programaCapacitacionesService.obtenerDashboard(id);
      setDashboard(dash);
    } catch {
      setSnackMsg('Error al guardar indicador');
    } finally {
      setSavingInd(false);
    }
  };

  const handleSaveAnalisis = async (tipo: TipoIndicador, mes: number, texto: string) => {
    try {
      const updated = await programaCapacitacionesService.actualizarIndicador(id, tipo, mes, {
        analisis_trimestral: texto,
      });
      setIndicadores((prev) =>
        prev.map((i) => (i.tipo_indicador === tipo && i.mes === mes ? updated : i))
      );
      setEditingAnalisis(null);
      setSnackMsg('Análisis guardado');
    } catch {
      setSnackMsg('Error al guardar análisis');
    }
  };

  // ── Exports ──────────────────────────────────────────────────────────────────

  const handleExportExcel = async () => {
    if (!programa || exportingExcel || exportingPdf) return;
    setExportingExcel(true);
    try {
      await programaCapacitacionesService.exportarExcel(programa.id, programa.año);
    } catch {
      setSnackMsg('Error al exportar a Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    if (!programa || exportingExcel || exportingPdf) return;
    setExportingPdf(true);
    try {
      await programaCapacitacionesService.exportarPdf(programa.id, programa.año);
    } catch {
      setSnackMsg('Error al exportar a PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !programa) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Programa no encontrado'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/programa-capacitaciones')} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  // Agrupar actividades por ciclo
  const actsByCiclo: Record<string, CapacitacionActividad[]> = {};
  for (const act of programa.actividades) {
    if (!actsByCiclo[act.ciclo]) actsByCiclo[act.ciclo] = [];
    actsByCiclo[act.ciclo].push(act);
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/admin/programa-capacitaciones')}
          sx={{ cursor: 'pointer' }}
        >
          Programa de Capacitaciones
        </Link>
        <Typography variant="body2" color="text.primary">
          {programa.año}
        </Typography>
      </Breadcrumbs>

      {/* Cabecera */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/admin/programa-capacitaciones')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon color="primary" />
              <Typography variant="h5" fontWeight="bold">
                Programa de Capacitaciones — {programa.año}
              </Typography>
              <Tooltip title="Cambiar estado">
                <Chip
                  label={ESTADO_LABELS[programa.estado]}
                  color={ESTADO_COLORS[programa.estado]}
                  size="small"
                  onClick={(e) => setEstadoMenuAnchor(e.currentTarget)}
                  onDelete={(e) => setEstadoMenuAnchor(e.currentTarget)}
                  deleteIcon={savingEstado ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <ExpandMoreIcon />}
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
              <Menu
                anchorEl={estadoMenuAnchor}
                open={Boolean(estadoMenuAnchor)}
                onClose={() => setEstadoMenuAnchor(null)}
              >
                {(Object.keys(ESTADO_LABELS_ALL) as EstadoPrograma[]).map((est) => (
                  <MenuItem
                    key={est}
                    selected={est === programa.estado}
                    onClick={() => handleChangeEstado(est)}
                    dense
                  >
                    <Chip
                      label={ESTADO_LABELS_ALL[est]}
                      color={ESTADO_COLORS[est]}
                      size="small"
                      sx={{ pointerEvents: 'none' }}
                    />
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {programa.codigo} v{programa.version}
              {programa.encargado_sgsst && ` · Encargado: ${programa.encargado_sgsst}`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={exportingExcel ? <CircularProgress size={16} /> : <FileDownloadIcon />}
            onClick={handleExportExcel}
            disabled={exportingExcel || exportingPdf}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={exportingPdf ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
            onClick={handleExportPdf}
            disabled={exportingExcel || exportingPdf}
          >
            PDF
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Cronograma" />
          <Tab label="Indicadores" />
          <Tab label="Dashboard" />
        </Tabs>
      </Box>

      {/* ─── Tab 0: Cronograma ─────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <TableContainer component={Paper} elevation={1} sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1600 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#37474F' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 40, position: 'sticky', left: 0, bgcolor: '#37474F', zIndex: 3 }}>N°</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 280, position: 'sticky', left: 40, bgcolor: '#37474F', zIndex: 3 }}>Actividad</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Encargado</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 50 }}>Hrs</TableCell>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <TableCell key={m} align="center" colSpan={2} sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem', width: 60 }}>
                    {MESES_ABREV[m]}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', width: 40 }}>P</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', width: 40 }}>E</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', width: 50 }}>%</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#546E7A' }}>
                <TableCell sx={{ color: 'white', fontSize: '0.65rem', position: 'sticky', left: 0, bgcolor: '#546E7A', zIndex: 3 }}></TableCell>
                <TableCell sx={{ color: 'white', fontSize: '0.65rem', position: 'sticky', left: 40, bgcolor: '#546E7A', zIndex: 3 }}></TableCell>
                <TableCell sx={{ color: 'white', fontSize: '0.65rem' }}></TableCell>
                <TableCell sx={{ color: 'white', fontSize: '0.65rem' }}></TableCell>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <React.Fragment key={m}>
                    <TableCell align="center" sx={{ color: '#FFF9C4', fontWeight: 'bold', fontSize: '0.65rem', p: '2px' }}>P</TableCell>
                    <TableCell align="center" sx={{ color: '#C8E6C9', fontWeight: 'bold', fontSize: '0.65rem', p: '2px' }}>E</TableCell>
                  </React.Fragment>
                ))}
                <TableCell /><TableCell /><TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {CICLOS_ORDER.map((ciclo) => {
                const acts = actsByCiclo[ciclo as CicloPhvaCAP] || [];
                if (acts.length === 0) return null;
                let rowNum = 0;
                const offset = CICLOS_ORDER.slice(0, CICLOS_ORDER.indexOf(ciclo as CicloPhvaCAP)).reduce(
                  (acc, c) => acc + (actsByCiclo[c] || []).length, 0
                );

                return (
                  <React.Fragment key={ciclo}>
                    {/* Fila separadora de ciclo (colapsable) */}
                    <TableRow
                      onClick={() => toggleCiclo(ciclo)}
                      sx={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <TableCell
                        colSpan={31}
                        sx={{
                          bgcolor: CICLO_COLORS[ciclo as CicloPhvaCAP],
                          color: 'white',
                          fontWeight: 'bold',
                          py: 0.75,
                          fontSize: '0.85rem',
                          position: 'sticky',
                          left: 0,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {collapsedCiclos.has(ciclo)
                              ? <ExpandMoreIcon sx={{ fontSize: 18 }} />
                              : <ExpandLessIcon sx={{ fontSize: 18 }} />}
                            {CICLO_LABELS[ciclo as CicloPhvaCAP]}
                          </Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', mr: 1 }}>
                            {acts.length} actividad{acts.length !== 1 ? 'es' : ''}
                            {collapsedCiclos.has(ciclo) ? ' — clic para expandir' : ' — clic para contraer'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {!collapsedCiclos.has(ciclo) && acts.map((act) => {
                      rowNum++;
                      const nro = offset + rowNum;
                      const segMap: Record<number, CapacitacionSeguimiento> = {};
                      act.seguimientos.forEach((s) => { segMap[s.mes] = s; });
                      const totalP = act.seguimientos.filter((s) => s.programada).length;
                      const totalE = act.seguimientos.filter((s) => s.ejecutada).length;
                      const pct = totalP > 0 ? Math.round((totalE / totalP) * 100) : 0;
                      const lightBg = CICLO_LIGHT_COLORS[ciclo as CicloPhvaCAP] + '40';

                      return (
                        <React.Fragment key={act.id}>
                          <TableRow
                            sx={{ bgcolor: lightBg, '&:hover': { bgcolor: CICLO_LIGHT_COLORS[ciclo as CicloPhvaCAP] + '60' } }}
                          >
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', position: 'sticky', left: 0, bgcolor: lightBg, zIndex: 2 }}>{nro}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', position: 'sticky', left: 40, bgcolor: lightBg, zIndex: 2 }}>
                              {editingAct?.id === act.id ? (
                                <TextField
                                  value={editingAct.nombre}
                                  onChange={(e) => setEditingAct((p) => p ? { ...p, nombre: e.target.value } : p)}
                                  size="small"
                                  fullWidth
                                  autoFocus
                                  inputProps={{ style: { fontSize: '0.75rem', padding: '2px 6px' } }}
                                  sx={{ minWidth: 220 }}
                                />
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.3, flex: 1 }}>{act.nombre}</Typography>
                                  <Tooltip title="Editar actividad">
                                    <IconButton
                                      size="small"
                                      sx={{ p: 0.25, opacity: 0.4, '&:hover': { opacity: 1 } }}
                                      onClick={() => setEditingAct({ id: act.id, nombre: act.nombre, encargado: act.encargado || '' })}
                                    >
                                      <EditIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.7rem' }}>
                              {editingAct?.id === act.id ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <TextField
                                    value={editingAct.encargado}
                                    onChange={(e) => setEditingAct((p) => p ? { ...p, encargado: e.target.value } : p)}
                                    size="small"
                                    fullWidth
                                    placeholder="Encargado"
                                    inputProps={{ style: { fontSize: '0.7rem', padding: '2px 6px' } }}
                                    sx={{ minWidth: 100 }}
                                  />
                                  <Tooltip title="Guardar">
                                    <IconButton size="small" color="success" onClick={handleSaveActividad} disabled={savingAct}>
                                      {savingAct ? <CircularProgress size={12} /> : <SaveIcon sx={{ fontSize: 14 }} />}
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancelar">
                                    <IconButton size="small" onClick={() => setEditingAct(null)}>
                                      <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">{act.encargado || '—'}</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.7rem' }}>{act.horas || 0}</TableCell>

                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                              const seg = segMap[m];
                              const prog = seg?.programada || false;
                              const ejec = seg?.ejecutada || false;
                              return (
                                <React.Fragment key={m}>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      p: '2px',
                                      bgcolor: prog && ejec ? '#A5D6A7' : prog ? '#FFF9C4' : 'transparent',
                                    }}
                                  >
                                    <Checkbox
                                      size="small"
                                      checked={prog}
                                      onChange={(e) => handleToggleProgramada(act, m, e.target.checked)}
                                      sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 14 }, color: '#1565C0' }}
                                    />
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      p: '2px',
                                      bgcolor: ejec ? '#C8E6C9' : 'transparent',
                                    }}
                                  >
                                    <Checkbox
                                      size="small"
                                      checked={ejec}
                                      onChange={(e) => handleToggleEjecutada(act, m, e.target.checked)}
                                      sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 14 }, color: '#2E7D32' }}
                                      disabled={!prog}
                                    />
                                  </TableCell>
                                </React.Fragment>
                              );
                            })}

                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#1565C0' }}>{totalP}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#2E7D32' }}>{totalE}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: pct >= 90 ? '#2E7D32' : pct >= 50 ? '#E65100' : '#C62828' }}>
                              {pct}%
                            </TableCell>
                          </TableRow>

                          {/* Fila expandible para datos de ejecución */}
                          {editSeg && editSeg.actividadId === act.id && expandedRow && expandedRow.startsWith(`${act.id}-`) && (
                            <TableRow>
                              <TableCell colSpan={31} sx={{ p: 0 }}>
                                <Collapse in={true} unmountOnExit>
                                  <Box sx={{ p: 2, bgcolor: '#F1F8E9', borderLeft: `4px solid ${CICLO_COLORS[ciclo as CicloPhvaCAP]}` }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                      Datos de ejecución — {act.nombre} / {NOMBRE_MESES[editSeg.mes]}
                                    </Typography>
                                    <Grid container spacing={2}>
                                      <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                          label="Ejecutado por"
                                          value={editSeg.ejecutado_por}
                                          onChange={(e) => setEditSeg((p) => p ? { ...p, ejecutado_por: e.target.value } : p)}
                                          size="small"
                                          fullWidth
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                          label="Fecha de ejecución"
                                          type="date"
                                          value={editSeg.fecha_ejecucion}
                                          onChange={(e) => setEditSeg((p) => p ? { ...p, fecha_ejecucion: e.target.value } : p)}
                                          size="small"
                                          fullWidth
                                          InputLabelProps={{ shrink: true }}
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                          label="Observación"
                                          value={editSeg.observacion}
                                          onChange={(e) => setEditSeg((p) => p ? { ...p, observacion: e.target.value } : p)}
                                          size="small"
                                          fullWidth
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 6, sm: 3 }}>
                                        <TextField
                                          label="Trabajadores programados"
                                          type="number"
                                          value={editSeg.trabajadores_programados}
                                          onChange={(e) => setEditSeg((p) => p ? { ...p, trabajadores_programados: parseInt(e.target.value) || 0 } : p)}
                                          size="small"
                                          fullWidth
                                          inputProps={{ min: 0 }}
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 6, sm: 3 }}>
                                        <TextField
                                          label="Trabajadores participaron"
                                          type="number"
                                          value={editSeg.trabajadores_participaron}
                                          onChange={(e) => setEditSeg((p) => p ? { ...p, trabajadores_participaron: parseInt(e.target.value) || 0 } : p)}
                                          size="small"
                                          fullWidth
                                          inputProps={{ min: 0 }}
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 6, sm: 3 }}>
                                        <TextField
                                          label="Personas evaluadas"
                                          type="number"
                                          value={editSeg.personas_evaluadas}
                                          onChange={(e) => setEditSeg((p) => p ? { ...p, personas_evaluadas: parseInt(e.target.value) || 0 } : p)}
                                          size="small"
                                          fullWidth
                                          inputProps={{ min: 0 }}
                                        />
                                      </Grid>
                                      <Grid size={{ xs: 6, sm: 3 }}>
                                        <TextField
                                          label="Evaluaciones eficaces"
                                          type="number"
                                          value={editSeg.evaluaciones_eficaces}
                                          onChange={(e) => setEditSeg((p) => p ? { ...p, evaluaciones_eficaces: parseInt(e.target.value) || 0 } : p)}
                                          size="small"
                                          fullWidth
                                          inputProps={{ min: 0 }}
                                        />
                                      </Grid>
                                    </Grid>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={savingSeg ? <CircularProgress size={14} /> : <SaveIcon />}
                                        onClick={handleSaveSeguimiento}
                                        disabled={savingSeg}
                                        color="success"
                                      >
                                        Guardar
                                      </Button>
                                      <Button size="small" onClick={() => { setExpandedRow(null); setEditSeg(null); }}>
                                        Cancelar
                                      </Button>
                                    </Box>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ─── Tab 1: Indicadores ────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {TIPOS_INDICADOR.map((tipo) => {
            const info = { CUMPLIMIENTO: 'Cumplimiento', COBERTURA: 'Cobertura', EFICACIA: 'Eficacia' }[tipo];
            const meta = tipo === 'COBERTURA' ? programa.meta_cobertura
              : tipo === 'CUMPLIMIENTO' ? programa.meta_cumplimiento
              : programa.meta_eficacia;
            const color = INDICADOR_COLORS[tipo];
            const trimMeses = [3, 6, 9, 12];
            const trimLabels = ['T1 — Enero a Marzo', 'T2 — Abril a Junio', 'T3 — Julio a Septiembre', 'T4 — Octubre a Diciembre'];

            return (
              <Card key={tipo} elevation={2}>
                <CardHeader
                  avatar={
                    tipo === 'CUMPLIMIENTO' ? <CheckCircleIcon sx={{ color }} /> :
                    tipo === 'COBERTURA' ? <GroupIcon sx={{ color }} /> :
                    <FactCheckIcon sx={{ color }} />
                  }
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color }}>
                        {info}
                      </Typography>
                      <Chip label={`Meta: ${meta}%`} size="small" sx={{ bgcolor: color, color: 'white' }} />
                    </Box>
                  }
                  subheader={INDICADOR_LABELS[tipo] === tipo ? undefined : `Frecuencia: Trimestral · Responsable: SST · Audiencia: Alta Gerencia - RRHH`}
                  sx={{ borderBottom: `3px solid ${color}`, pb: 1 }}
                />
                <CardContent>
                  {/* Tabla mensual */}
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#ECEFF1' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Mes</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Numerador</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Denominador</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>% Obtenido</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Meta</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cumple</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', width: 60 }}>Acción</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
                          const ind = getIndicador(tipo, mes);
                          const num = ind?.numerador ?? 0;
                          const den = ind?.denominador ?? 0;
                          const val = ind?.valor_porcentaje ?? 0;
                          const cumple = val >= meta;
                          const isEditing = editingInd?.tipo === tipo && editingInd?.mes === mes;

                          return (
                            <TableRow key={mes} sx={{ bgcolor: cumple && val > 0 ? '#F1F8E9' : val > 0 ? '#FFF3E0' : 'transparent' }}>
                              <TableCell sx={{ fontSize: '0.8rem' }}>{NOMBRE_MESES[mes]}</TableCell>
                              <TableCell align="center">
                                {isEditing ? (
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={editingInd!.num}
                                    onChange={(e) => setEditingInd((p) => p ? { ...p, num: e.target.value } : p)}
                                    sx={{ width: 80 }}
                                    inputProps={{ min: 0 }}
                                  />
                                ) : (
                                  <Typography variant="body2">{num.toFixed(0)}</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {isEditing ? (
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={editingInd!.den}
                                    onChange={(e) => setEditingInd((p) => p ? { ...p, den: e.target.value } : p)}
                                    sx={{ width: 80 }}
                                    inputProps={{ min: 0 }}
                                  />
                                ) : (
                                  <Typography variant="body2">{den.toFixed(0)}</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${val.toFixed(1)}%`}
                                  size="small"
                                  sx={{
                                    bgcolor: cumple && val > 0 ? '#C8E6C9' : val > 0 ? '#FFCDD2' : '#ECEFF1',
                                    color: cumple && val > 0 ? '#1B5E20' : val > 0 ? '#B71C1C' : '#546E7A',
                                    fontWeight: 'bold',
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" color="text.secondary">{meta.toFixed(0)}%</Typography>
                              </TableCell>
                              <TableCell align="center">
                                {val > 0 ? (
                                  cumple ? '🟢' : '🔴'
                                ) : '—'}
                              </TableCell>
                              <TableCell align="center">
                                {isEditing ? (
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      color="success"
                                      disabled={savingInd}
                                      onClick={() => handleSaveIndicador(tipo, mes, parseFloat(editingInd!.num) || 0, parseFloat(editingInd!.den) || 0)}
                                    >
                                      {savingInd ? <CircularProgress size={14} /> : <SaveIcon fontSize="small" />}
                                    </IconButton>
                                    <IconButton size="small" onClick={() => setEditingInd(null)}>
                                      <ExpandLessIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <IconButton
                                    size="small"
                                    onClick={() => setEditingInd({ tipo, mes, num: num.toString(), den: den.toString() })}
                                  >
                                    <ExpandMoreIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Análisis trimestrales */}
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color }}>
                    Análisis Tendencial por Trimestre
                  </Typography>
                  <Grid container spacing={2}>
                    {trimMeses.map((mes, idx) => {
                      const ind = getIndicador(tipo, mes);
                      const isEditing = editingAnalisis?.tipo === tipo && editingAnalisis?.mes === mes;
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={mes}>
                          <Box
                            sx={{
                              border: `1px solid ${color}40`,
                              borderRadius: 1,
                              p: 1.5,
                              bgcolor: '#FAFAFA',
                            }}
                          >
                            <Typography variant="caption" fontWeight="bold" color="text.secondary">
                              {trimLabels[idx]}
                            </Typography>
                            {isEditing ? (
                              <Box sx={{ mt: 1 }}>
                                <TextField
                                  multiline
                                  rows={3}
                                  fullWidth
                                  size="small"
                                  value={editingAnalisis!.texto}
                                  onChange={(e) => setEditingAnalisis((p) => p ? { ...p, texto: e.target.value } : p)}
                                  placeholder="Análisis del trimestre..."
                                />
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Button size="small" variant="contained" color="success" onClick={() => handleSaveAnalisis(tipo, mes, editingAnalisis!.texto)}>
                                    Guardar
                                  </Button>
                                  <Button size="small" onClick={() => setEditingAnalisis(null)}>Cancelar</Button>
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minHeight: 32 }}>
                                  {ind?.analisis_trimestral || 'Sin análisis registrado'}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => setEditingAnalisis({ tipo, mes, texto: ind?.analisis_trimestral || '' })}
                                >
                                  <ExpandMoreIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* ─── Tab 2: Dashboard ──────────────────────────────────────────────── */}
      {activeTab === 2 && dashboard && (
        <Box>
          {/* KPI summary cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card elevation={1} sx={{ borderTop: '4px solid #1565C0' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Actividades Programadas</Typography>
                  <Typography variant="h4" fontWeight="bold" color="#1565C0">{dashboard.actividades_programadas}</Typography>
                  <Typography variant="caption" color="text.secondary">de {dashboard.total_actividades} actividades totales</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card elevation={1} sx={{ borderTop: '4px solid #2E7D32' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Actividades Ejecutadas</Typography>
                  <Typography variant="h4" fontWeight="bold" color="#2E7D32">{dashboard.actividades_ejecutadas}</Typography>
                  <Typography variant="caption" color="text.secondary">de {dashboard.actividades_programadas} programadas</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card elevation={1} sx={{ borderTop: `4px solid ${dashboard.porcentaje_cumplimiento >= programa.meta_cumplimiento ? '#2E7D32' : '#E65100'}` }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>% Cumplimiento Cronograma</Typography>
                  <Typography variant="h4" fontWeight="bold" color={dashboard.porcentaje_cumplimiento >= programa.meta_cumplimiento ? '#2E7D32' : '#E65100'}>
                    {dashboard.porcentaje_cumplimiento.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(dashboard.porcentaje_cumplimiento, 100)}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    color={dashboard.porcentaje_cumplimiento >= programa.meta_cumplimiento ? 'success' : 'warning'}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* KPI cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {dashboard.kpis.map((kpi) => (
              <Grid size={{ xs: 12, sm: 4 }} key={kpi.tipo}>
                <Card elevation={1} sx={{ borderLeft: `5px solid ${INDICADOR_COLORS[kpi.tipo]}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: INDICADOR_COLORS[kpi.tipo] }}>
                        {kpi.nombre}
                      </Typography>
                      <Chip
                        label={kpi.cumple_global ? '✓ Cumple' : '✗ No cumple'}
                        size="small"
                        color={kpi.cumple_global ? 'success' : 'error'}
                      />
                    </Box>
                    <Typography variant="h5" fontWeight="bold">
                      {kpi.valor_global.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(kpi.valor_global, 100)}
                      sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: '#ECEFF1' }}
                      color={kpi.cumple_global ? 'success' : 'warning'}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">0%</Typography>
                      <Typography variant="caption" color="text.secondary">Meta: {kpi.meta}%</Typography>
                      <Typography variant="caption" color="text.secondary">100%</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Gráfico de barras */}
          <Card elevation={1} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Evolución Mensual de Indicadores
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Array.from({ length: 12 }, (_, i) => {
                    const mes = i + 1;
                    const row: Record<string, unknown> = { mes: MESES_ABREV[mes] };
                    dashboard.kpis.forEach((kpi) => {
                      const m = kpi.meses.find((md) => md.mes === mes);
                      row[kpi.nombre] = m ? m.valor : 0;
                    });
                    return row;
                  })}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <RechartsTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <ReferenceLine y={80} stroke="#FF9800" strokeDasharray="5 5" label={{ value: 'Meta Cobertura 80%', position: 'right', fontSize: 9, fill: '#FF9800' }} />
                  <ReferenceLine y={90} stroke="#F44336" strokeDasharray="5 5" label={{ value: 'Meta 90%', position: 'right', fontSize: 9, fill: '#F44336' }} />
                  <Bar dataKey="Cumplimiento" fill={INDICADOR_COLORS.CUMPLIMIENTO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Cobertura" fill={INDICADOR_COLORS.COBERTURA} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Eficacia" fill={INDICADOR_COLORS.EFICACIA} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Botones de exportación */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={exportingExcel ? <CircularProgress size={18} /> : <FileDownloadIcon />}
              onClick={handleExportExcel}
              disabled={exportingExcel || exportingPdf}
              sx={{ minWidth: 180 }}
            >
              Exportar Excel
            </Button>
            <Button
              variant="contained"
              size="large"
              color="error"
              startIcon={exportingPdf ? <CircularProgress size={18} /> : <PictureAsPdfIcon />}
              onClick={handleExportPdf}
              disabled={exportingExcel || exportingPdf}
              sx={{ minWidth: 180 }}
            >
              Exportar PDF
            </Button>
          </Box>
        </Box>
      )}

      <Snackbar
        open={!!snackMsg}
        autoHideDuration={3000}
        onClose={() => setSnackMsg(null)}
        message={snackMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
};

export default ProgramaCapacitacionesDetailPage;
