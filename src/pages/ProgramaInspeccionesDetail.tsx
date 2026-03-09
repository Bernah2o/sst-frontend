import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography, Tab, Tabs,
} from '@mui/material';
import {
  Add as AddIcon, ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon, CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon, Edit as EditIcon,
  RadioButtonUnchecked as UncheckedIcon, Save as SaveIcon,
  BarChart as BarChartIcon, TableChart as TableChartIcon,
} from '@mui/icons-material';
import {
  programaInspeccionesService,
  ProgramaInspeccionesDetail,
  InspeccionProgramada,
  InspeccionSeguimiento,
  TipoInspeccion, FrecuenciaInspeccion, EstadoPrograma, CicloInspeccion,
  IndicadoresPrograma,
  TIPO_INSPECCION_LABELS, FRECUENCIA_LABELS, ESTADO_LABELS, ESTADO_COLORS,
  CICLO_LABELS, CICLO_COLORS, CICLO_LIGHT, CICLOS_ORDER,
} from '../services/programaInspeccionesService';

const MESES_ABREV = ['', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// ---- Helpers ----
const getSeguimiento = (insp: InspeccionProgramada, mes: number): InspeccionSeguimiento | null =>
  insp.seguimientos.find((s) => s.mes === mes) || null;

const consolidado = (insp: InspeccionProgramada) => {
  const totalP = insp.seguimientos.filter((s) => s.programada).length;
  const totalE = insp.seguimientos.filter((s) => s.ejecutada).length;
  const pct = totalP > 0 ? Math.round((totalE / totalP) * 100) : 0;
  return { totalP, totalE, pct };
};

export default function ProgramaInspeccionesDetailPage() {
  const { programaId } = useParams<{ programaId: string }>();
  const navigate = useNavigate();

  const [programa, setPrograma] = useState<ProgramaInspeccionesDetail | null>(null);
  const [indicadores, setIndicadores] = useState<IndicadoresPrograma | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  // Dialog nueva/editar inspección
  const [dialogInsp, setDialogInsp] = useState(false);
  const [guardandoInsp, setGuardandoInsp] = useState(false);
  const [editInsp, setEditInsp] = useState<InspeccionProgramada | null>(null);
  const [formInsp, setFormInsp] = useState({
    ciclo: 'hacer' as CicloInspeccion,
    tipo_inspeccion: 'locativa' as TipoInspeccion,
    area: '',
    descripcion: '',
    responsable: '',
    frecuencia: 'mensual' as FrecuenciaInspeccion,
    lista_chequeo: '',
    observaciones: '',
  });

  // Dialog editar programa
  const [dialogProg, setDialogProg] = useState(false);
  const [guardandoProg, setGuardandoProg] = useState(false);
  const [formProg, setFormProg] = useState({
    encargado_sgsst: '', aprobado_por: '', estado: 'borrador' as EstadoPrograma,
    codigo: '', version: '', alcance: '', objetivo: '', recursos: '', legislacion_aplicable: '',
  });

  // Dialog seguimiento
  const [dialogSeg, setDialogSeg] = useState(false);
  const [segActual, setSegActual] = useState<{ insp: InspeccionProgramada; mes: number; seg: InspeccionSeguimiento | null } | null>(null);
  const [formSeg, setFormSeg] = useState({
    programada: false, ejecutada: false, fecha_ejecucion: '', ejecutado_por: '',
    hallazgos: '', accion_correctiva: '', observacion: '',
    condiciones_peligrosas_reportadas: 0, condiciones_peligrosas_intervenidas: 0,
  });
  const [guardandoSeg, setGuardandoSeg] = useState(false);

  // Dialog eliminar
  const [dialogElim, setDialogElim] = useState(false);
  const [inspElim, setInspElim] = useState<InspeccionProgramada | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    if (!programaId) return;
    setLoading(true);
    setError(null);
    try {
      const [prog, ind] = await Promise.all([
        programaInspeccionesService.obtenerPrograma(Number(programaId)),
        programaInspeccionesService.obtenerIndicadores(Number(programaId)),
      ]);
      setPrograma(prog);
      setIndicadores(ind);
    } catch {
      setError('Error al cargar el programa.');
    } finally {
      setLoading(false);
    }
  }, [programaId]);

  useEffect(() => { cargar(); }, [cargar]);

  // ---- Inspección ----
  const abrirInsp = (insp?: InspeccionProgramada) => {
    setEditInsp(insp || null);
    setFormInsp(insp ? {
      ciclo: insp.ciclo, tipo_inspeccion: insp.tipo_inspeccion,
      area: insp.area, descripcion: insp.descripcion, responsable: insp.responsable || '',
      frecuencia: insp.frecuencia, lista_chequeo: insp.lista_chequeo || '',
      observaciones: insp.observaciones || '',
    } : {
      ciclo: 'hacer', tipo_inspeccion: 'locativa', area: '', descripcion: '',
      responsable: '', frecuencia: 'mensual', lista_chequeo: '', observaciones: '',
    });
    setDialogInsp(true);
  };

  const guardarInsp = async () => {
    if (!programa) return;
    setGuardandoInsp(true);
    try {
      const payload = {
        ciclo: formInsp.ciclo, tipo_inspeccion: formInsp.tipo_inspeccion,
        area: formInsp.area, descripcion: formInsp.descripcion,
        responsable: formInsp.responsable || undefined,
        frecuencia: formInsp.frecuencia,
        lista_chequeo: formInsp.lista_chequeo || undefined,
        observaciones: formInsp.observaciones || undefined,
      };
      if (editInsp) {
        await programaInspeccionesService.actualizarInspeccion(editInsp.id, payload);
        setSuccess('Inspección actualizada.');
      } else {
        await programaInspeccionesService.crearInspeccion(programa.id, payload);
        setSuccess('Inspección agregada.');
      }
      setDialogInsp(false);
      cargar();
    } catch { setError('Error al guardar.'); }
    finally { setGuardandoInsp(false); }
  };

  const eliminarInsp = async () => {
    if (!inspElim) return;
    setEliminando(true);
    try {
      await programaInspeccionesService.eliminarInspeccion(inspElim.id);
      setSuccess('Inspección eliminada.');
      setDialogElim(false);
      cargar();
    } catch { setError('Error al eliminar.'); }
    finally { setEliminando(false); }
  };

  // ---- Programa ----
  const abrirProg = () => {
    if (!programa) return;
    setFormProg({
      encargado_sgsst: programa.encargado_sgsst || '', aprobado_por: programa.aprobado_por || '',
      estado: programa.estado, codigo: programa.codigo, version: programa.version,
      alcance: programa.alcance || '', objetivo: programa.objetivo || '',
      recursos: programa.recursos || '', legislacion_aplicable: programa.legislacion_aplicable || '',
    });
    setDialogProg(true);
  };

  const guardarProg = async () => {
    if (!programa) return;
    setGuardandoProg(true);
    try {
      await programaInspeccionesService.actualizarPrograma(programa.id, {
        ...formProg,
        encargado_sgsst: formProg.encargado_sgsst || undefined,
        aprobado_por: formProg.aprobado_por || undefined,
        legislacion_aplicable: formProg.legislacion_aplicable || undefined,
      });
      setSuccess('Programa actualizado.');
      setDialogProg(false);
      cargar();
    } catch { setError('Error al actualizar.'); }
    finally { setGuardandoProg(false); }
  };

  // ---- Seguimiento ----
  const abrirSeg = (insp: InspeccionProgramada, mes: number) => {
    const seg = getSeguimiento(insp, mes);
    setSegActual({ insp, mes, seg });
    setFormSeg({
      programada: seg?.programada || false, ejecutada: seg?.ejecutada || false,
      fecha_ejecucion: seg?.fecha_ejecucion || '', ejecutado_por: seg?.ejecutado_por || '',
      hallazgos: seg?.hallazgos || '', accion_correctiva: seg?.accion_correctiva || '',
      observacion: seg?.observacion || '',
      condiciones_peligrosas_reportadas: seg?.condiciones_peligrosas_reportadas || 0,
      condiciones_peligrosas_intervenidas: seg?.condiciones_peligrosas_intervenidas || 0,
    });
    setDialogSeg(true);
  };

  const guardarSeg = async () => {
    if (!segActual) return;
    setGuardandoSeg(true);
    try {
      await programaInspeccionesService.actualizarSeguimiento(segActual.insp.id, segActual.mes, {
        programada: formSeg.programada, ejecutada: formSeg.ejecutada,
        fecha_ejecucion: formSeg.fecha_ejecucion || undefined,
        ejecutado_por: formSeg.ejecutado_por || undefined,
        hallazgos: formSeg.hallazgos || undefined,
        accion_correctiva: formSeg.accion_correctiva || undefined,
        observacion: formSeg.observacion || undefined,
        condiciones_peligrosas_reportadas: formSeg.condiciones_peligrosas_reportadas,
        condiciones_peligrosas_intervenidas: formSeg.condiciones_peligrosas_intervenidas,
      });
      setSuccess('Seguimiento actualizado.');
      setDialogSeg(false);
      cargar();
    } catch { setError('Error al actualizar seguimiento.'); }
    finally { setGuardandoSeg(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!programa) return <Box sx={{ p: 3 }}><Alert severity="error">No se pudo cargar el programa.</Alert></Box>;

  // Agrupar por ciclo
  const byciClo: Record<CicloInspeccion, InspeccionProgramada[]> = {
    planear: [], hacer: [], verificar: [], actuar: [],
  };
  programa.inspecciones.forEach((i) => {
    const c = (i.ciclo || 'hacer') as CicloInspeccion;
    byciClo[c].push(i);
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/admin/programa-inspecciones')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <AssignmentIcon sx={{ color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Programa de Inspecciones — {programa.año}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Código: {programa.codigo} · v{programa.version}
          </Typography>
        </Box>
        <Chip label={ESTADO_LABELS[programa.estado]} color={ESTADO_COLORS[programa.estado]} sx={{ mr: 1 }} />
        <Button size="small" startIcon={<EditIcon />} variant="outlined" onClick={abrirProg}>Editar</Button>
        <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => abrirInsp()}>
          Agregar Inspección
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Metadata */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {programa.encargado_sgsst && (
            <Box><Typography variant="caption" color="text.secondary">Encargado SG-SST</Typography>
              <Typography variant="body2" fontWeight={600}>{programa.encargado_sgsst}</Typography></Box>
          )}
          {programa.aprobado_por && (
            <Box><Typography variant="caption" color="text.secondary">Aprobado por</Typography>
              <Typography variant="body2" fontWeight={600}>{programa.aprobado_por}</Typography></Box>
          )}
          {programa.recursos && (
            <Box><Typography variant="caption" color="text.secondary">Recursos</Typography>
              <Typography variant="body2">{programa.recursos}</Typography></Box>
          )}
          {programa.objetivo && (
            <Box sx={{ flexBasis: '100%' }}>
              <Typography variant="caption" color="text.secondary">Objetivo</Typography>
              <Typography variant="body2">{programa.objetivo}</Typography>
            </Box>
          )}
          {programa.alcance && (
            <Box sx={{ flexBasis: '100%' }}>
              <Typography variant="caption" color="text.secondary">Alcance</Typography>
              <Typography variant="body2">{programa.alcance}</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Cronograma de Actividades" icon={<TableChartIcon />} iconPosition="start" />
        <Tab label="Indicadores" icon={<BarChartIcon />} iconPosition="start" />
      </Tabs>

      {/* ===== TAB 0: CRONOGRAMA ===== */}
      {tab === 0 && (
        <>
          {programa.inspecciones.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary" gutterBottom>Sin inspecciones registradas.</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrirInsp()}>
                Agregar primera inspección
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1300 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#37474F' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 700, width: 90 }}>Ciclo</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actividad / Descripción</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>Responsable</TableCell>
                      {MESES_ABREV.slice(1).map((m) => (
                        <TableCell key={m} align="center" sx={{ color: 'white', fontWeight: 700, p: 0.5, minWidth: 44 }}>
                          {m}
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        Consolidado
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Acc.</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#455A64' }}>
                      <TableCell colSpan={3} />
                      {MESES_ABREV.slice(1).map((m) => (
                        <TableCell key={m} align="center" sx={{ p: 0.25 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                            <Typography variant="caption" sx={{ color: 'grey.300', fontSize: 9, fontWeight: 700 }}>P</Typography>
                            <Typography variant="caption" sx={{ color: 'grey.300', fontSize: 9, fontWeight: 700 }}>E</Typography>
                          </Box>
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'grey.300', fontSize: 9, fontWeight: 700 }}>P</Typography>
                          <Typography variant="caption" sx={{ color: 'grey.300', fontSize: 9, fontWeight: 700 }}>E</Typography>
                          <Typography variant="caption" sx={{ color: 'grey.300', fontSize: 9, fontWeight: 700 }}>%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {CICLOS_ORDER.map((ciclo) => {
                      const insps = byciClo[ciclo];
                      if (insps.length === 0) return null;
                      return (
                        <React.Fragment key={ciclo}>
                          {/* Fila encabezado de ciclo */}
                          <TableRow>
                            <TableCell
                              colSpan={16}
                              sx={{
                                bgcolor: CICLO_COLORS[ciclo],
                                color: 'white',
                                fontWeight: 700,
                                fontSize: 12,
                                py: 0.75,
                                textAlign: 'center',
                              }}
                            >
                              {CICLO_LABELS[ciclo]}
                            </TableCell>
                          </TableRow>
                          {/* Filas de inspecciones */}
                          {insps.map((insp, idx) => {
                            const { totalP, totalE, pct } = consolidado(insp);
                            return (
                              <TableRow
                                key={insp.id}
                                sx={{ bgcolor: idx % 2 === 0 ? 'white' : CICLO_LIGHT[ciclo] + '44', '&:hover': { bgcolor: 'primary.50' } }}
                              >
                                <TableCell sx={{ fontSize: 10 }}>
                                  <Chip
                                    label={TIPO_INSPECCION_LABELS[insp.tipo_inspeccion]}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: 9, height: 20 }}
                                  />
                                </TableCell>
                                <TableCell sx={{ maxWidth: 220 }}>
                                  <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 500 }}>{insp.descripcion}</Typography>
                                  <Typography variant="caption" color="text.secondary">{insp.area} · {FRECUENCIA_LABELS[insp.frecuencia]}</Typography>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                                  {insp.responsable || '—'}
                                </TableCell>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
                                  const seg = getSeguimiento(insp, mes);
                                  return (
                                    <TableCell key={mes} align="center" sx={{ p: 0.25 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                                        {(['P', 'E'] as const).map((tipo) => {
                                          const active = tipo === 'P' ? seg?.programada : seg?.ejecutada;
                                          const bg = tipo === 'P'
                                            ? (seg?.programada && seg?.ejecutada ? '#A5D6A7' : seg?.programada ? '#FFF9C4' : 'transparent')
                                            : (seg?.ejecutada ? '#C8E6C9' : 'transparent');
                                          const borderColor = tipo === 'P'
                                            ? (seg?.programada ? '#F9A825' : '#e0e0e0')
                                            : (seg?.ejecutada ? '#388E3C' : '#e0e0e0');
                                          return (
                                            <Tooltip key={tipo} title={`${MESES_ABREV[mes]} — ${tipo === 'P' ? 'Programada' : 'Ejecutada'}`} arrow>
                                              <Box
                                                onClick={() => abrirSeg(insp, mes)}
                                                sx={{
                                                  width: 18, height: 18, display: 'flex',
                                                  alignItems: 'center', justifyContent: 'center',
                                                  cursor: 'pointer', bgcolor: bg, borderRadius: 0.5,
                                                  border: '1px solid', borderColor,
                                                  '&:hover': { opacity: 0.7 },
                                                }}
                                              >
                                                {active
                                                  ? <CheckCircleIcon sx={{ fontSize: 11, color: tipo === 'P' ? 'warning.dark' : 'success.dark' }} />
                                                  : <UncheckedIcon sx={{ fontSize: 11, color: 'grey.400' }} />}
                                              </Box>
                                            </Tooltip>
                                          );
                                        })}
                                      </Box>
                                    </TableCell>
                                  );
                                })}
                                {/* Consolidado */}
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, alignItems: 'center' }}>
                                    <Typography variant="caption" fontWeight={700}>{totalP}</Typography>
                                    <Typography variant="caption" fontWeight={700}>{totalE}</Typography>
                                    <Chip
                                      label={`${pct}%`}
                                      size="small"
                                      color={pct >= 100 ? 'success' : pct >= 50 ? 'warning' : 'error'}
                                      sx={{ height: 18, fontSize: 9, fontWeight: 700 }}
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                                    <Tooltip title="Editar">
                                      <IconButton size="small" onClick={() => abrirInsp(insp)}>
                                        <EditIcon sx={{ fontSize: 13 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                      <IconButton size="small" color="error" onClick={() => { setInspElim(insp); setDialogElim(true); }}>
                                        <DeleteIcon sx={{ fontSize: 13 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Leyenda */}
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                {[
                  { bg: '#FFF9C4', border: '#F9A825', label: 'P = Programada' },
                  { bg: '#C8E6C9', border: '#388E3C', label: 'E = Ejecutada' },
                  { bg: '#A5D6A7', border: '#2E7D32', label: 'P+E = Programada y Ejecutada' },
                ].map((l) => (
                  <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: l.bg, border: `1px solid ${l.border}`, borderRadius: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">{l.label}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </>
      )}

      {/* ===== TAB 1: INDICADORES ===== */}
      {tab === 1 && indicadores && (
        <Box>
          {/* Resumen global */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {[
              {
                titulo: 'Indicador 1 — Cumplimiento',
                subtitulo: 'N° Actividades Ejecutadas / N° Actividades Programadas × 100',
                valor: `${indicadores.pct_cumplimiento_global}%`,
                detalle: `${indicadores.total_ejecutadas} ejecutadas de ${indicadores.total_programadas} programadas`,
                meta: '100% de las actividades programadas',
                color: indicadores.pct_cumplimiento_global >= 100 ? '#2E7D32' : indicadores.pct_cumplimiento_global >= 70 ? '#E65100' : '#C62828',
              },
              {
                titulo: 'Indicador 2 — Eficacia',
                subtitulo: 'N° Condiciones Intervenidas / N° Condiciones Reportadas × 100',
                valor: `${indicadores.pct_eficacia_global}%`,
                detalle: `${indicadores.total_condiciones_intervenidas} intervenidas de ${indicadores.total_condiciones_reportadas} reportadas`,
                meta: 'Cerrar el 100% de las condiciones peligrosas encontradas',
                color: indicadores.pct_eficacia_global >= 100 ? '#2E7D32' : indicadores.pct_eficacia_global >= 70 ? '#E65100' : '#C62828',
              },
            ].map((ind) => (
              <Paper key={ind.titulo} variant="outlined" sx={{ p: 2.5, flex: 1, minWidth: 280 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>{ind.titulo}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Fórmula: {ind.subtitulo}
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ color: ind.color, mb: 0.5 }}>
                  {ind.valor}
                </Typography>
                <Typography variant="body2" color="text.secondary">{ind.detalle}</Typography>
                <Typography variant="caption" color="text.secondary">Meta: {ind.meta}</Typography>
              </Paper>
            ))}
          </Box>

          {/* Tabla por mes */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Valores por Período</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#37474F' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Indicador</TableCell>
                  {indicadores.meses.map((m) => (
                    <TableCell key={m.mes} align="center" sx={{ color: 'white', fontWeight: 700, fontSize: 11 }}>
                      {MESES_ABREV[m.mes]}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Cumplimiento */}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>N° Programadas</TableCell>
                  {indicadores.meses.map((m) => (
                    <TableCell key={m.mes} align="center" sx={{ fontSize: 11 }}>{m.programadas}</TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>{indicadores.total_programadas}</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>N° Ejecutadas</TableCell>
                  {indicadores.meses.map((m) => (
                    <TableCell key={m.mes} align="center" sx={{ fontSize: 11 }}>{m.ejecutadas}</TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>{indicadores.total_ejecutadas}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>% Cumplimiento</TableCell>
                  {indicadores.meses.map((m) => (
                    <TableCell key={m.mes} align="center">
                      <Chip
                        label={`${m.pct_cumplimiento}%`}
                        size="small"
                        color={m.pct_cumplimiento >= 100 ? 'success' : m.pct_cumplimiento > 0 ? 'warning' : 'default'}
                        sx={{ fontSize: 9, height: 18 }}
                      />
                    </TableCell>
                  ))}
                  <TableCell align="center">
                    <Chip
                      label={`${indicadores.pct_cumplimiento_global}%`}
                      size="small"
                      color={indicadores.pct_cumplimiento_global >= 100 ? 'success' : 'warning'}
                      sx={{ fontSize: 9, height: 18, fontWeight: 700 }}
                    />
                  </TableCell>
                </TableRow>
                {/* Separador */}
                <TableRow>
                  <TableCell colSpan={14} sx={{ bgcolor: '#1565C0', py: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>EFICACIA — Condiciones Peligrosas</Typography>
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>Condiciones Reportadas</TableCell>
                  {indicadores.meses.map((m) => (
                    <TableCell key={m.mes} align="center" sx={{ fontSize: 11 }}>{m.condiciones_reportadas}</TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>{indicadores.total_condiciones_reportadas}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>Condiciones Intervenidas</TableCell>
                  {indicadores.meses.map((m) => (
                    <TableCell key={m.mes} align="center" sx={{ fontSize: 11 }}>{m.condiciones_intervenidas}</TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>{indicadores.total_condiciones_intervenidas}</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>% Eficacia</TableCell>
                  {indicadores.meses.map((m) => (
                    <TableCell key={m.mes} align="center">
                      <Chip
                        label={`${m.pct_eficacia}%`}
                        size="small"
                        color={m.pct_eficacia >= 100 ? 'success' : m.pct_eficacia > 0 ? 'warning' : 'default'}
                        sx={{ fontSize: 9, height: 18 }}
                      />
                    </TableCell>
                  ))}
                  <TableCell align="center">
                    <Chip
                      label={`${indicadores.pct_eficacia_global}%`}
                      size="small"
                      color={indicadores.pct_eficacia_global >= 100 ? 'success' : 'warning'}
                      sx={{ fontSize: 9, height: 18, fontWeight: 700 }}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Ficha técnica */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
            {[
              {
                num: 1, nombre: 'Cumplimiento', interpretacion: 'Cumplimiento de Actividades en el programa',
                factor: 'Cumplimiento', formula: 'No. de Actividades Ejecutadas / No. de Actividades Programadas × 100',
                meta: '100% de las actividades programadas', frecuencia: 'Semestral',
              },
              {
                num: 2, nombre: 'Eficacia', interpretacion: 'Reporte de los planes de acción propuestos',
                factor: 'Eficacia', formula: 'No. de condiciones peligrosas intervenidas / No. de condiciones peligrosas reportadas × 100',
                meta: 'Cerradas el 100% de las condiciones peligrosas encontradas', frecuencia: 'Semestral',
              },
            ].map((ficha) => (
              <Paper key={ficha.num} variant="outlined" sx={{ p: 2, flex: 1, minWidth: 280 }}>
                <Box sx={{ bgcolor: '#1565C0', color: 'white', p: 1, mb: 1.5, borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={700}>
                    PROGRAMA DE INSPECCIONES — FICHA TÉCNICA INDICADORES
                  </Typography>
                  <br />
                  <Typography variant="caption">Indicador {ficha.num}</Typography>
                </Box>
                {[
                  ['Nombre', ficha.nombre],
                  ['Interpretación', ficha.interpretacion],
                  ['Factor que mide', ficha.factor],
                  ['Fórmula', ficha.formula],
                  ['Meta', ficha.meta],
                  ['Periodicidad', ficha.frecuencia],
                  ['Responsable', programa.encargado_sgsst || 'Encargado SG-SST'],
                ].map(([label, val]) => (
                  <Box key={label} sx={{ display: 'flex', borderBottom: '1px solid #eee', py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 110, color: 'text.secondary' }}>{label}</Typography>
                    <Typography variant="caption">{val}</Typography>
                  </Box>
                ))}
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* ======================== DIALOGS ======================== */}

      {/* Dialog Inspección */}
      <Dialog open={dialogInsp} onClose={() => setDialogInsp(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editInsp ? 'Editar Inspección' : 'Nueva Inspección'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Ciclo PHVA *</InputLabel>
            <Select label="Ciclo PHVA *" value={formInsp.ciclo}
              onChange={(e) => setFormInsp((f) => ({ ...f, ciclo: e.target.value as CicloInspeccion }))}>
              {(['planear', 'hacer', 'verificar', 'actuar'] as CicloInspeccion[]).map((c) => (
                <MenuItem key={c} value={c}>{CICLO_LABELS[c]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo de Inspección *</InputLabel>
            <Select label="Tipo de Inspección *" value={formInsp.tipo_inspeccion}
              onChange={(e) => setFormInsp((f) => ({ ...f, tipo_inspeccion: e.target.value as TipoInspeccion }))}>
              {Object.entries(TIPO_INSPECCION_LABELS).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Área *" size="small" fullWidth value={formInsp.area}
            onChange={(e) => setFormInsp((f) => ({ ...f, area: e.target.value }))} />
          <TextField label="Descripción *" size="small" fullWidth multiline rows={2}
            value={formInsp.descripcion}
            onChange={(e) => setFormInsp((f) => ({ ...f, descripcion: e.target.value }))} />
          <TextField label="Responsable" size="small" fullWidth value={formInsp.responsable}
            onChange={(e) => setFormInsp((f) => ({ ...f, responsable: e.target.value }))} />
          <FormControl fullWidth size="small">
            <InputLabel>Frecuencia</InputLabel>
            <Select label="Frecuencia" value={formInsp.frecuencia}
              onChange={(e) => setFormInsp((f) => ({ ...f, frecuencia: e.target.value as FrecuenciaInspeccion }))}>
              {Object.entries(FRECUENCIA_LABELS).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Lista de Chequeo (referencia)" size="small" fullWidth
            value={formInsp.lista_chequeo}
            onChange={(e) => setFormInsp((f) => ({ ...f, lista_chequeo: e.target.value }))} />
          <TextField label="Observaciones" size="small" fullWidth multiline rows={2}
            value={formInsp.observaciones}
            onChange={(e) => setFormInsp((f) => ({ ...f, observaciones: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogInsp(false)} disabled={guardandoInsp}>Cancelar</Button>
          <Button variant="contained" onClick={guardarInsp}
            disabled={guardandoInsp || !formInsp.area || !formInsp.descripcion}
            startIcon={guardandoInsp ? <CircularProgress size={16} /> : <SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Editar Programa */}
      <Dialog open={dialogProg} onClose={() => setDialogProg(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Programa</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField label="Código" size="small" value={formProg.codigo}
              onChange={(e) => setFormProg((f) => ({ ...f, codigo: e.target.value }))} sx={{ flex: 1 }} />
            <TextField label="Versión" size="small" value={formProg.version}
              onChange={(e) => setFormProg((f) => ({ ...f, version: e.target.value }))} sx={{ width: 80 }} />
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel>Estado</InputLabel>
            <Select label="Estado" value={formProg.estado}
              onChange={(e) => setFormProg((f) => ({ ...f, estado: e.target.value as EstadoPrograma }))}>
              <MenuItem value="borrador">Borrador</MenuItem>
              <MenuItem value="activo">Activo</MenuItem>
              <MenuItem value="finalizado">Finalizado</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Encargado SG-SST" size="small" fullWidth value={formProg.encargado_sgsst}
            onChange={(e) => setFormProg((f) => ({ ...f, encargado_sgsst: e.target.value }))} />
          <TextField label="Aprobado por" size="small" fullWidth value={formProg.aprobado_por}
            onChange={(e) => setFormProg((f) => ({ ...f, aprobado_por: e.target.value }))} />
          <TextField label="Objetivo" size="small" fullWidth multiline rows={2} value={formProg.objetivo}
            onChange={(e) => setFormProg((f) => ({ ...f, objetivo: e.target.value }))} />
          <TextField label="Alcance" size="small" fullWidth multiline rows={2} value={formProg.alcance}
            onChange={(e) => setFormProg((f) => ({ ...f, alcance: e.target.value }))} />
          <TextField label="Recursos" size="small" fullWidth value={formProg.recursos}
            onChange={(e) => setFormProg((f) => ({ ...f, recursos: e.target.value }))} />
          <TextField label="Legislación Aplicable" size="small" fullWidth multiline rows={2}
            value={formProg.legislacion_aplicable}
            onChange={(e) => setFormProg((f) => ({ ...f, legislacion_aplicable: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogProg(false)} disabled={guardandoProg}>Cancelar</Button>
          <Button variant="contained" onClick={guardarProg} disabled={guardandoProg}
            startIcon={guardandoProg ? <CircularProgress size={16} /> : <SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Seguimiento */}
      <Dialog open={dialogSeg} onClose={() => setDialogSeg(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Seguimiento — {segActual ? MESES_ABREV[segActual.mes] : ''}
          {segActual && (
            <Typography variant="body2" color="text.secondary">
              {segActual.insp.area} · {TIPO_INSPECCION_LABELS[segActual.insp.tipo_inspeccion]}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input type="checkbox" id="prog" checked={formSeg.programada}
                onChange={(e) => setFormSeg((f) => ({ ...f, programada: e.target.checked }))} />
              <label htmlFor="prog" style={{ cursor: 'pointer' }}>Programada (P)</label>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input type="checkbox" id="ejec" checked={formSeg.ejecutada}
                onChange={(e) => setFormSeg((f) => ({ ...f, ejecutada: e.target.checked }))} />
              <label htmlFor="ejec" style={{ cursor: 'pointer' }}>Ejecutada (E)</label>
            </Box>
          </Box>
          <Divider />
          <TextField label="Fecha de ejecución" type="date" size="small" fullWidth
            InputLabelProps={{ shrink: true }} value={formSeg.fecha_ejecucion}
            onChange={(e) => setFormSeg((f) => ({ ...f, fecha_ejecucion: e.target.value }))} />
          <TextField label="Ejecutado por" size="small" fullWidth value={formSeg.ejecutado_por}
            onChange={(e) => setFormSeg((f) => ({ ...f, ejecutado_por: e.target.value }))} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField label="Condiciones peligrosas reportadas" type="number" size="small"
              value={formSeg.condiciones_peligrosas_reportadas} sx={{ flex: 1 }}
              onChange={(e) => setFormSeg((f) => ({ ...f, condiciones_peligrosas_reportadas: Number(e.target.value) }))} />
            <TextField label="Condiciones intervenidas" type="number" size="small"
              value={formSeg.condiciones_peligrosas_intervenidas} sx={{ flex: 1 }}
              onChange={(e) => setFormSeg((f) => ({ ...f, condiciones_peligrosas_intervenidas: Number(e.target.value) }))} />
          </Box>
          <TextField label="Hallazgos" size="small" fullWidth multiline rows={2}
            value={formSeg.hallazgos}
            onChange={(e) => setFormSeg((f) => ({ ...f, hallazgos: e.target.value }))}
            placeholder="Condiciones o actos inseguros identificados" />
          <TextField label="Acción correctiva" size="small" fullWidth multiline rows={2}
            value={formSeg.accion_correctiva}
            onChange={(e) => setFormSeg((f) => ({ ...f, accion_correctiva: e.target.value }))} />
          <TextField label="Observaciones" size="small" fullWidth value={formSeg.observacion}
            onChange={(e) => setFormSeg((f) => ({ ...f, observacion: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogSeg(false)} disabled={guardandoSeg}>Cancelar</Button>
          <Button variant="contained" onClick={guardarSeg} disabled={guardandoSeg}
            startIcon={guardandoSeg ? <CircularProgress size={16} /> : <SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={dialogElim} onClose={() => setDialogElim(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar Inspección</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar la inspección <strong>{inspElim?.area}</strong>? Se perderá todo el seguimiento asociado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogElim(false)} disabled={eliminando}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={eliminarInsp} disabled={eliminando}
            startIcon={eliminando ? <CircularProgress size={16} /> : <DeleteIcon />}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
