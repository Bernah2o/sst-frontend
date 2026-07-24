import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Accordion, AccordionDetails, AccordionSummary,
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography, Tab, Tabs,
} from '@mui/material';
import {
  Add as AddIcon, ArrowBack as ArrowBackIcon,
  FactCheck as FactCheckIcon, Delete as DeleteIcon, Edit as EditIcon,
  Save as SaveIcon, BarChart as BarChartIcon, ChecklistRtl as ChecklistIcon,
  ExpandMore as ExpandMoreIcon, UploadFile as UploadFileIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import {
  auditoriaSSTService,
  AuditoriaSSTDetail,
  ItemAuditoriaDetail,
  PlanMejoramiento,
  TipoAuditoria, EstadoAuditoria, ResultadoItemAuditoria, EstadoPlanMejora,
  IndicadoresAuditoria,
  TIPO_AUDITORIA_LABELS, ESTADO_AUDITORIA_LABELS, ESTADO_AUDITORIA_COLORS,
  RESULTADO_ITEM_LABELS, RESULTADO_ITEM_COLORS,
  ESTADO_PLAN_LABELS, ESTADO_PLAN_COLORS,
} from '../services/auditoriaSSTService';

export default function AuditoriaSSTDetailPage() {
  const { auditoriaId } = useParams<{ auditoriaId: string }>();
  const navigate = useNavigate();

  const [auditoria, setAuditoria] = useState<AuditoriaSSTDetail | null>(null);
  const [indicadores, setIndicadores] = useState<IndicadoresAuditoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  // Edición local de texto de items (para no perder foco en cada tecla)
  const [itemEdits, setItemEdits] = useState<Record<number, { descripcion: string; observaciones: string }>>({});

  // Dialog editar auditoría
  const [dialogAud, setDialogAud] = useState(false);
  const [guardandoAud, setGuardandoAud] = useState(false);
  const [formAud, setFormAud] = useState({
    tipo_auditoria: 'interna' as TipoAuditoria,
    estado: 'planificada' as EstadoAuditoria,
    auditor_lider: '', equipo_auditor: '', participantes_copasst: '',
    alcance: '', objetivo: '', conclusiones_generales: '', fecha_proxima_auditoria: '',
  });

  // Dialog plan de mejoramiento
  const [dialogPlan, setDialogPlan] = useState(false);
  const [guardandoPlan, setGuardandoPlan] = useState(false);
  const [itemPlanActual, setItemPlanActual] = useState<ItemAuditoriaDetail | null>(null);
  const [planEditar, setPlanEditar] = useState<PlanMejoramiento | null>(null);
  const [formPlan, setFormPlan] = useState({
    hallazgo: '', accion_correctiva: '', responsable: '', fecha_compromiso: '',
  });

  // Dialog eliminar plan
  const [dialogElimPlan, setDialogElimPlan] = useState(false);
  const [planEliminar, setPlanEliminar] = useState<PlanMejoramiento | null>(null);
  const [eliminandoPlan, setEliminandoPlan] = useState(false);

  const cargar = useCallback(async () => {
    if (!auditoriaId) return;
    setLoading(true);
    setError(null);
    try {
      const [aud, ind] = await Promise.all([
        auditoriaSSTService.obtener(Number(auditoriaId)),
        auditoriaSSTService.obtenerIndicadores(Number(auditoriaId)),
      ]);
      setAuditoria(aud);
      setIndicadores(ind);
      const edits: Record<number, { descripcion: string; observaciones: string }> = {};
      aud.items.forEach((it) => {
        edits[it.id] = { descripcion: it.descripcion, observaciones: it.observaciones || '' };
      });
      setItemEdits(edits);
    } catch {
      setError('Error al cargar la auditoría.');
    } finally {
      setLoading(false);
    }
  }, [auditoriaId]);

  useEffect(() => { cargar(); }, [cargar]);

  // ---- Auditoría ----
  const abrirEditarAud = () => {
    if (!auditoria) return;
    setFormAud({
      tipo_auditoria: auditoria.tipo_auditoria, estado: auditoria.estado,
      auditor_lider: auditoria.auditor_lider || '', equipo_auditor: auditoria.equipo_auditor || '',
      participantes_copasst: auditoria.participantes_copasst || '',
      alcance: auditoria.alcance || '', objetivo: auditoria.objetivo || '',
      conclusiones_generales: auditoria.conclusiones_generales || '',
      fecha_proxima_auditoria: auditoria.fecha_proxima_auditoria || '',
    });
    setDialogAud(true);
  };

  const guardarAud = async () => {
    if (!auditoria) return;
    setGuardandoAud(true);
    try {
      await auditoriaSSTService.actualizar(auditoria.id, {
        ...formAud,
        auditor_lider: formAud.auditor_lider || undefined,
        equipo_auditor: formAud.equipo_auditor || undefined,
        participantes_copasst: formAud.participantes_copasst || undefined,
        alcance: formAud.alcance || undefined,
        objetivo: formAud.objetivo || undefined,
        conclusiones_generales: formAud.conclusiones_generales || undefined,
        fecha_proxima_auditoria: formAud.fecha_proxima_auditoria || undefined,
      });
      setSuccess('Auditoría actualizada.');
      setDialogAud(false);
      cargar();
    } catch { setError('Error al actualizar la auditoría.'); }
    finally { setGuardandoAud(false); }
  };

  // ---- Ítems del checklist ----
  const guardarTextoItem = async (itemId: number) => {
    const edit = itemEdits[itemId];
    const original = auditoria?.items.find((i) => i.id === itemId);
    if (!edit || !original) return;
    if (edit.descripcion === original.descripcion && edit.observaciones === (original.observaciones || '')) return;
    try {
      await auditoriaSSTService.actualizarItem(itemId, {
        descripcion: edit.descripcion,
        observaciones: edit.observaciones || undefined,
      });
      cargar();
    } catch { setError('Error al guardar el ítem.'); }
  };

  const cambiarResultado = async (itemId: number, resultado: ResultadoItemAuditoria) => {
    try {
      await auditoriaSSTService.actualizarItem(itemId, { resultado });
      setSuccess('Resultado actualizado.');
      cargar();
    } catch { setError('Error al actualizar el resultado.'); }
  };

  const subirEvidenciaItem = async (itemId: number, file: File) => {
    try {
      await auditoriaSSTService.subirEvidenciaItem(itemId, file);
      setSuccess('Evidencia subida.');
      cargar();
    } catch { setError('Error al subir la evidencia.'); }
  };

  const eliminarEvidenciaItem = async (itemId: number) => {
    try {
      await auditoriaSSTService.eliminarEvidenciaItem(itemId);
      cargar();
    } catch { setError('Error al eliminar la evidencia.'); }
  };

  // ---- Plan de mejoramiento ----
  const abrirNuevoPlan = (item: ItemAuditoriaDetail) => {
    setItemPlanActual(item);
    setPlanEditar(null);
    setFormPlan({ hallazgo: '', accion_correctiva: '', responsable: '', fecha_compromiso: '' });
    setDialogPlan(true);
  };

  const abrirEditarPlan = (item: ItemAuditoriaDetail, plan: PlanMejoramiento) => {
    setItemPlanActual(item);
    setPlanEditar(plan);
    setFormPlan({
      hallazgo: plan.hallazgo, accion_correctiva: plan.accion_correctiva || '',
      responsable: plan.responsable || '', fecha_compromiso: plan.fecha_compromiso || '',
    });
    setDialogPlan(true);
  };

  const guardarPlan = async () => {
    if (!itemPlanActual) return;
    setGuardandoPlan(true);
    try {
      const payload = {
        hallazgo: formPlan.hallazgo,
        accion_correctiva: formPlan.accion_correctiva || undefined,
        responsable: formPlan.responsable || undefined,
        fecha_compromiso: formPlan.fecha_compromiso || undefined,
      };
      if (planEditar) {
        await auditoriaSSTService.actualizarPlan(planEditar.id, payload);
        setSuccess('Plan de mejoramiento actualizado.');
      } else {
        await auditoriaSSTService.crearPlan(itemPlanActual.id, payload);
        setSuccess('Plan de mejoramiento creado.');
      }
      setDialogPlan(false);
      cargar();
    } catch { setError('Error al guardar el plan de mejoramiento.'); }
    finally { setGuardandoPlan(false); }
  };

  const cambiarEstadoPlan = async (plan: PlanMejoramiento, estado: EstadoPlanMejora) => {
    try {
      await auditoriaSSTService.actualizarPlan(plan.id, { estado });
      setSuccess('Estado del hallazgo actualizado.');
      cargar();
    } catch { setError('Error al actualizar el estado.'); }
  };

  const subirEvidenciaCierre = async (planId: number, file: File) => {
    try {
      await auditoriaSSTService.subirEvidenciaCierre(planId, file);
      setSuccess('Evidencia de cierre subida.');
      cargar();
    } catch { setError('Error al subir la evidencia de cierre.'); }
  };

  const eliminarPlan = async () => {
    if (!planEliminar) return;
    setEliminandoPlan(true);
    try {
      await auditoriaSSTService.eliminarPlan(planEliminar.id);
      setSuccess('Plan de mejoramiento eliminado.');
      setDialogElimPlan(false);
      setPlanEliminar(null);
      cargar();
    } catch { setError('Error al eliminar el plan de mejoramiento.'); }
    finally { setEliminandoPlan(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!auditoria) return <Box sx={{ p: 3 }}><Alert severity="error">No se pudo cargar la auditoría.</Alert></Box>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/admin/auditoria-sst')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <FactCheckIcon sx={{ color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Auditoría SG-SST — {auditoria.año} ({TIPO_AUDITORIA_LABELS[auditoria.tipo_auditoria]})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Código: {auditoria.codigo} · Fecha: {auditoria.fecha_auditoria}
          </Typography>
        </Box>
        <Chip label={ESTADO_AUDITORIA_LABELS[auditoria.estado]} color={ESTADO_AUDITORIA_COLORS[auditoria.estado]} sx={{ mr: 1 }} />
        <Button size="small" startIcon={<EditIcon />} variant="outlined" onClick={abrirEditarAud}>Editar</Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Metadata */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {auditoria.auditor_lider && (
            <Box><Typography variant="caption" color="text.secondary">Auditor líder</Typography>
              <Typography variant="body2" fontWeight={600}>{auditoria.auditor_lider}</Typography></Box>
          )}
          {auditoria.equipo_auditor && (
            <Box><Typography variant="caption" color="text.secondary">Equipo auditor</Typography>
              <Typography variant="body2">{auditoria.equipo_auditor}</Typography></Box>
          )}
          {auditoria.participantes_copasst && (
            <Box><Typography variant="caption" color="text.secondary">Participantes COPASST/Vigía</Typography>
              <Typography variant="body2">{auditoria.participantes_copasst}</Typography></Box>
          )}
          {auditoria.objetivo && (
            <Box sx={{ flexBasis: '100%' }}>
              <Typography variant="caption" color="text.secondary">Objetivo</Typography>
              <Typography variant="body2">{auditoria.objetivo}</Typography>
            </Box>
          )}
          {auditoria.alcance && (
            <Box sx={{ flexBasis: '100%' }}>
              <Typography variant="caption" color="text.secondary">Alcance</Typography>
              <Typography variant="body2">{auditoria.alcance}</Typography>
            </Box>
          )}
          {auditoria.conclusiones_generales && (
            <Box sx={{ flexBasis: '100%' }}>
              <Typography variant="caption" color="text.secondary">Conclusiones generales</Typography>
              <Typography variant="body2">{auditoria.conclusiones_generales}</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Checklist Art. 2.2.4.6.30" icon={<ChecklistIcon />} iconPosition="start" />
        <Tab label="Indicadores" icon={<BarChartIcon />} iconPosition="start" />
      </Tabs>

      {/* ===== TAB 0: CHECKLIST ===== */}
      {tab === 0 && (
        <Box>
          {auditoria.items.map((item) => {
            const edit = itemEdits[item.id] || { descripcion: item.descripcion, observaciones: item.observaciones || '' };
            const inputId = `evidencia-item-${item.id}`;
            return (
              <Accordion key={item.id} variant="outlined" sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 1 }}>
                    <Chip label={item.numeral} size="small" color="primary" sx={{ fontWeight: 700, minWidth: 32 }} />
                    <Typography sx={{ flexGrow: 1 }} noWrap>{item.descripcion}</Typography>
                    <Chip
                      label={RESULTADO_ITEM_LABELS[item.resultado]}
                      color={RESULTADO_ITEM_COLORS[item.resultado]}
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Descripción del aspecto auditado"
                      size="small"
                      fullWidth
                      multiline
                      value={edit.descripcion}
                      onChange={(e) => setItemEdits((s) => ({ ...s, [item.id]: { ...edit, descripcion: e.target.value } }))}
                      onBlur={() => guardarTextoItem(item.id)}
                    />
                    <FormControl size="small" sx={{ maxWidth: 260 }}>
                      <InputLabel>Resultado</InputLabel>
                      <Select
                        label="Resultado"
                        value={item.resultado}
                        onChange={(e) => cambiarResultado(item.id, e.target.value as ResultadoItemAuditoria)}
                      >
                        {Object.entries(RESULTADO_ITEM_LABELS).map(([value, label]) => (
                          <MenuItem key={value} value={value}>{label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Observaciones"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      value={edit.observaciones}
                      onChange={(e) => setItemEdits((s) => ({ ...s, [item.id]: { ...edit, observaciones: e.target.value } }))}
                      onBlur={() => guardarTextoItem(item.id)}
                    />

                    {/* Evidencia */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="file"
                        style={{ display: 'none' }}
                        id={inputId}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) subirEvidenciaItem(item.id, file);
                          e.target.value = '';
                        }}
                      />
                      <label htmlFor={inputId}>
                        <Button variant="outlined" size="small" component="span" startIcon={<UploadFileIcon />}>
                          {item.evidencia_file_key ? 'Reemplazar evidencia' : 'Adjuntar evidencia'}
                        </Button>
                      </label>
                      {item.evidencia_file_key && (
                        <Chip
                          icon={<AttachFileIcon />}
                          label={item.evidencia_nombre || 'evidencia'}
                          size="small"
                          onDelete={() => eliminarEvidenciaItem(item.id)}
                          component="a"
                          href={item.evidencia_file_key}
                          target="_blank"
                          clickable
                        />
                      )}
                    </Box>

                    {/* Plan de mejoramiento — solo si No Conforme */}
                    {item.resultado === 'no_conforme' && (
                      <Box sx={{ mt: 1 }}>
                        <Divider sx={{ mb: 1.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            Plan de Mejoramiento ({item.planes_mejoramiento.length})
                          </Typography>
                          <Button size="small" startIcon={<AddIcon />} onClick={() => abrirNuevoPlan(item)}>
                            Agregar hallazgo
                          </Button>
                        </Box>
                        {item.planes_mejoramiento.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            Sin hallazgos registrados para este ítem.
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {item.planes_mejoramiento.map((plan) => {
                              const cierreInputId = `evidencia-cierre-${plan.id}`;
                              return (
                                <Paper key={plan.id} variant="outlined" sx={{ p: 1.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography variant="body2" fontWeight={600}>{plan.hallazgo}</Typography>
                                      {plan.accion_correctiva && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          Acción correctiva: {plan.accion_correctiva}
                                        </Typography>
                                      )}
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Responsable: {plan.responsable || '—'} · Compromiso: {plan.fecha_compromiso || '—'}
                                        {plan.fecha_cierre ? ` · Cierre: ${plan.fecha_cierre}` : ''}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                      <FormControl size="small" sx={{ minWidth: 130 }}>
                                        <Select
                                          value={plan.estado}
                                          onChange={(e) => cambiarEstadoPlan(plan, e.target.value as EstadoPlanMejora)}
                                        >
                                          {Object.entries(ESTADO_PLAN_LABELS).map(([value, label]) => (
                                            <MenuItem key={value} value={value}>
                                              <Chip label={label} color={ESTADO_PLAN_COLORS[value as EstadoPlanMejora]} size="small" />
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                      <Tooltip title="Editar">
                                        <IconButton size="small" onClick={() => abrirEditarPlan(item, plan)}>
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Eliminar">
                                        <IconButton size="small" color="error" onClick={() => { setPlanEliminar(plan); setDialogElimPlan(true); }}>
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                    <input
                                      type="file"
                                      style={{ display: 'none' }}
                                      id={cierreInputId}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) subirEvidenciaCierre(plan.id, file);
                                        e.target.value = '';
                                      }}
                                    />
                                    <label htmlFor={cierreInputId}>
                                      <Button variant="text" size="small" component="span" startIcon={<UploadFileIcon />}>
                                        {plan.evidencia_cierre_file_key ? 'Reemplazar evidencia de cierre' : 'Adjuntar evidencia de cierre'}
                                      </Button>
                                    </label>
                                    {plan.evidencia_cierre_file_key && (
                                      <Chip
                                        icon={<AttachFileIcon />}
                                        label={plan.evidencia_cierre_nombre || 'evidencia'}
                                        size="small"
                                        component="a"
                                        href={plan.evidencia_cierre_file_key}
                                        target="_blank"
                                        clickable
                                      />
                                    )}
                                  </Box>
                                </Paper>
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* ===== TAB 1: INDICADORES ===== */}
      {tab === 1 && indicadores && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Paper variant="outlined" sx={{ p: 2.5, flex: 1, minWidth: 280 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>% Cumplimiento del Checklist</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                (Conformes + No Aplica) / Total de Ítems × 100
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ color: indicadores.pct_cumplimiento >= 100 ? '#2E7D32' : indicadores.pct_cumplimiento >= 70 ? '#E65100' : '#C62828', mb: 0.5 }}>
                {indicadores.pct_cumplimiento}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {indicadores.items_conformes} conformes, {indicadores.items_no_aplica} no aplica de {indicadores.total_items} ítems
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2.5, flex: 1, minWidth: 280 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>% Cierre de Hallazgos</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Hallazgos Cerrados / Total de Hallazgos × 100
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ color: indicadores.pct_cierre_hallazgos >= 100 ? '#2E7D32' : indicadores.pct_cierre_hallazgos >= 70 ? '#E65100' : '#C62828', mb: 0.5 }}>
                {indicadores.pct_cierre_hallazgos}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {indicadores.hallazgos_cerrados} cerrados de {indicadores.total_hallazgos} hallazgos
              </Typography>
            </Paper>
          </Box>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Resumen del Checklist</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#37474F' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Conformes</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>No Conformes</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>No Aplica</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Pendientes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{indicadores.items_conformes}</TableCell>
                  <TableCell>{indicadores.items_no_conformes}</TableCell>
                  <TableCell>{indicadores.items_no_aplica}</TableCell>
                  <TableCell>{indicadores.items_pendientes}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Estado de Hallazgos</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#37474F' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Abiertos / En Proceso</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Cerrados</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Vencidos</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{indicadores.hallazgos_abiertos}</TableCell>
                  <TableCell>{indicadores.hallazgos_cerrados}</TableCell>
                  <TableCell>{indicadores.hallazgos_vencidos}</TableCell>
                  <TableCell>{indicadores.total_hallazgos}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ======================== DIALOGS ======================== */}

      {/* Dialog Editar Auditoría */}
      <Dialog open={dialogAud} onClose={() => setDialogAud(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Auditoría</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo de auditoría</InputLabel>
            <Select label="Tipo de auditoría" value={formAud.tipo_auditoria}
              onChange={(e) => setFormAud((f) => ({ ...f, tipo_auditoria: e.target.value as TipoAuditoria }))}>
              {Object.entries(TIPO_AUDITORIA_LABELS).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Estado</InputLabel>
            <Select label="Estado" value={formAud.estado}
              onChange={(e) => setFormAud((f) => ({ ...f, estado: e.target.value as EstadoAuditoria }))}>
              {Object.entries(ESTADO_AUDITORIA_LABELS).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Auditor líder" size="small" fullWidth value={formAud.auditor_lider}
            onChange={(e) => setFormAud((f) => ({ ...f, auditor_lider: e.target.value }))} />
          <TextField label="Equipo auditor" size="small" fullWidth value={formAud.equipo_auditor}
            onChange={(e) => setFormAud((f) => ({ ...f, equipo_auditor: e.target.value }))} />
          <TextField label="Participantes COPASST/Vigía" size="small" fullWidth value={formAud.participantes_copasst}
            onChange={(e) => setFormAud((f) => ({ ...f, participantes_copasst: e.target.value }))} />
          <TextField label="Objetivo" size="small" fullWidth multiline rows={2} value={formAud.objetivo}
            onChange={(e) => setFormAud((f) => ({ ...f, objetivo: e.target.value }))} />
          <TextField label="Alcance" size="small" fullWidth multiline rows={2} value={formAud.alcance}
            onChange={(e) => setFormAud((f) => ({ ...f, alcance: e.target.value }))} />
          <TextField label="Conclusiones generales" size="small" fullWidth multiline rows={2}
            value={formAud.conclusiones_generales}
            onChange={(e) => setFormAud((f) => ({ ...f, conclusiones_generales: e.target.value }))} />
          <TextField label="Fecha próxima auditoría" type="date" size="small" fullWidth
            InputLabelProps={{ shrink: true }} value={formAud.fecha_proxima_auditoria}
            onChange={(e) => setFormAud((f) => ({ ...f, fecha_proxima_auditoria: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAud(false)} disabled={guardandoAud}>Cancelar</Button>
          <Button variant="contained" onClick={guardarAud} disabled={guardandoAud}
            startIcon={guardandoAud ? <CircularProgress size={16} /> : <SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Plan de Mejoramiento */}
      <Dialog open={dialogPlan} onClose={() => setDialogPlan(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {planEditar ? 'Editar Hallazgo' : 'Nuevo Hallazgo'}
          {itemPlanActual && (
            <Typography variant="body2" color="text.secondary">
              Ítem {itemPlanActual.numeral}: {itemPlanActual.descripcion}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Hallazgo / No conformidad *" size="small" fullWidth multiline rows={2}
            value={formPlan.hallazgo}
            onChange={(e) => setFormPlan((f) => ({ ...f, hallazgo: e.target.value }))} />
          <TextField label="Acción correctiva" size="small" fullWidth multiline rows={2}
            value={formPlan.accion_correctiva}
            onChange={(e) => setFormPlan((f) => ({ ...f, accion_correctiva: e.target.value }))} />
          <TextField label="Responsable" size="small" fullWidth value={formPlan.responsable}
            onChange={(e) => setFormPlan((f) => ({ ...f, responsable: e.target.value }))} />
          <TextField label="Fecha de compromiso" type="date" size="small" fullWidth
            InputLabelProps={{ shrink: true }} value={formPlan.fecha_compromiso}
            onChange={(e) => setFormPlan((f) => ({ ...f, fecha_compromiso: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogPlan(false)} disabled={guardandoPlan}>Cancelar</Button>
          <Button variant="contained" onClick={guardarPlan} disabled={guardandoPlan || !formPlan.hallazgo}
            startIcon={guardandoPlan ? <CircularProgress size={16} /> : <SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Eliminar Plan */}
      <Dialog open={dialogElimPlan} onClose={() => setDialogElimPlan(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar Hallazgo</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar el hallazgo <strong>{planEliminar?.hallazgo}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogElimPlan(false)} disabled={eliminandoPlan}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={eliminarPlan} disabled={eliminandoPlan}
            startIcon={eliminandoPlan ? <CircularProgress size={16} /> : <DeleteIcon />}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
