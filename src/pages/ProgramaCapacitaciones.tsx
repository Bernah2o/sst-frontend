import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Menu,
  MenuItem,
  TextField,
  Typography,
  Alert,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  AutoAwesome as AutoAwesomeIcon,
  School as SchoolIcon,
  ArrowForward as ArrowForwardIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  FactCheck as FactCheckIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  programaCapacitacionesService,
  ProgramaCapacitaciones,
  EstadoPrograma,
  ESTADO_LABELS,
  ESTADO_COLORS,
  INDICADOR_METAS,
} from '../services/programaCapacitacionesService';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';


const ProgramaCapacitacionesPage: React.FC = () => {
  const navigate = useNavigate();
  const [programas, setProgramas] = useState<ProgramaCapacitaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Diálogo crear desde plantilla
  const [openDialog, setOpenDialog] = useState(false);
  const [creando, setCreando] = useState(false);
  const [formAño, setFormAño] = useState<number>(new Date().getFullYear());
  const [formEncargado, setFormEncargado] = useState('');

  // Menú de cambio de estado por tarjeta
  const [estadoMenu, setEstadoMenu] = useState<{ progId: number; anchor: HTMLElement } | null>(null);
  const [savingEstado, setSavingEstado] = useState<number | null>(null); // id del programa que está guardando

  const { dialogState, showConfirmDialog } = useConfirmDialog();

  const cargarProgramas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await programaCapacitacionesService.listar();
      setProgramas(data);
    } catch {
      setError('Error al cargar los programas de capacitaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProgramas();
  }, [cargarProgramas]);

  const handleCrearDesdePlantilla = async () => {
    if (!formAño || formAño < 2000 || formAño > 2100) {
      setError('Ingrese un año válido');
      return;
    }
    setCreando(true);
    setError(null);
    try {
      await programaCapacitacionesService.crearDesdePlantilla(
        formAño,
        undefined,
        formEncargado || undefined
      );
      setSuccess(`Programa de Capacitaciones ${formAño} creado exitosamente con las actividades estándar PR-SST-01`);
      setOpenDialog(false);
      setFormAño(new Date().getFullYear());
      setFormEncargado('');
      cargarProgramas();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { data: { detail: string } } }).response?.data?.detail
        : null;
      setError(msg || 'Error al crear el programa de capacitaciones');
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (programa: ProgramaCapacitaciones) => {
    const confirmed = await showConfirmDialog({
      title: 'Eliminar Programa de Capacitaciones',
      message: `¿Está seguro de eliminar el Programa de Capacitaciones ${programa.año}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      severity: 'error',
    });
    if (confirmed) {
      try {
        await programaCapacitacionesService.eliminar(programa.id);
        setSuccess(`Programa ${programa.año} eliminado`);
        cargarProgramas();
      } catch {
        setError('Error al eliminar el programa');
      }
    }
  };

  const handleChangeEstado = async (prog: ProgramaCapacitaciones, nuevoEstado: EstadoPrograma) => {
    setEstadoMenu(null);
    setSavingEstado(prog.id);
    try {
      const updated = await programaCapacitacionesService.actualizar(prog.id, { estado: nuevoEstado });
      setProgramas((prev) => prev.map((p) => p.id === prog.id ? { ...p, estado: updated.estado } : p));
      setSuccess(`Estado actualizado a "${ESTADO_LABELS[nuevoEstado]}"`);
    } catch {
      setError('Error al cambiar el estado');
    } finally {
      setSavingEstado(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabecera */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            Programa de Capacitaciones SG-SST
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Código PR-SST-01 — Gestión del cronograma anual de formación y capacitación
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setOpenDialog(true)}
          size="large"
        >
          Crear desde Plantilla
        </Button>
      </Box>

      {/* Alertas */}
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Info indicadores */}
      <Alert severity="info" icon={<SchoolIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>Indicadores de Gestión del Programa:</Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mt: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircleIcon sx={{ fontSize: 16, color: '#1565C0' }} />
            <Typography variant="body2">Cumplimiento: meta ≥ {INDICADOR_METAS.CUMPLIMIENTO}%</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupIcon sx={{ fontSize: 16, color: '#2E7D32' }} />
            <Typography variant="body2">Cobertura: meta ≥ {INDICADOR_METAS.COBERTURA}%</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FactCheckIcon sx={{ fontSize: 16, color: '#E65100' }} />
            <Typography variant="body2">Eficacia: meta ≥ {INDICADOR_METAS.EFICACIA}%</Typography>
          </Box>
        </Box>
      </Alert>

      {/* Lista de programas */}
      {programas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay programas de capacitaciones registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Cree el primer programa desde la plantilla estándar PR-SST-01
          </Typography>
          <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setOpenDialog(true)}>
            Crear Programa desde Plantilla
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {programas.map((prog) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={prog.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Año y estado */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {prog.año}
                    </Typography>
                    <Tooltip title="Cambiar estado">
                      <Chip
                        label={ESTADO_LABELS[prog.estado]}
                        color={ESTADO_COLORS[prog.estado]}
                        size="small"
                        onClick={(e) => setEstadoMenu({ progId: prog.id, anchor: e.currentTarget })}
                        onDelete={(e) => setEstadoMenu({ progId: prog.id, anchor: e.currentTarget })}
                        deleteIcon={
                          savingEstado === prog.id
                            ? <CircularProgress size={12} sx={{ color: 'inherit' }} />
                            : <ExpandMoreIcon />
                        }
                        sx={{ cursor: 'pointer' }}
                      />
                    </Tooltip>
                    <Menu
                      anchorEl={estadoMenu?.progId === prog.id ? estadoMenu.anchor : null}
                      open={estadoMenu?.progId === prog.id}
                      onClose={() => setEstadoMenu(null)}
                    >
                      {(Object.keys(ESTADO_LABELS) as EstadoPrograma[]).map((est) => (
                        <MenuItem
                          key={est}
                          selected={est === prog.estado}
                          onClick={() => handleChangeEstado(prog, est)}
                          dense
                        >
                          <Chip
                            label={ESTADO_LABELS[est]}
                            color={ESTADO_COLORS[est]}
                            size="small"
                            sx={{ pointerEvents: 'none' }}
                          />
                        </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {prog.codigo} — v{prog.version}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Encargado */}
                  {prog.encargado_sgsst && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <b>Encargado:</b> {prog.encargado_sgsst}
                    </Typography>
                  )}

                  {/* Metas */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Meta Cumplimiento</Typography>
                      <Typography variant="caption" fontWeight="bold" color="#1565C0">{prog.meta_cumplimiento}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Meta Cobertura</Typography>
                      <Typography variant="caption" fontWeight="bold" color="#2E7D32">{prog.meta_cobertura}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Meta Eficacia</Typography>
                      <Typography variant="caption" fontWeight="bold" color="#E65100">{prog.meta_eficacia}%</Typography>
                    </Box>
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                  <Tooltip title="Eliminar programa">
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleEliminar(prog)}
                    >
                      Eliminar
                    </Button>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(`/admin/programa-capacitaciones/${prog.id}`)}
                    sx={{ ml: 'auto' }}
                  >
                    Ver Programa
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo crear desde plantilla */}
      <Dialog open={openDialog} onClose={() => !creando && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            Crear Programa desde Plantilla PR-SST-01
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Se crearán automáticamente las <b>~35 actividades estándar</b> del Programa de Capacitaciones (PR-SST-01)
            con los meses programados predeterminados y los 3 indicadores de gestión.
          </Alert>
          <TextField
            label="Año del programa"
            type="number"
            value={formAño}
            onChange={(e) => setFormAño(parseInt(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
            slotProps={{ htmlInput: { min: 2020, max: 2100 } }}
            required
          />
          <TextField
            label="Encargado SG-SST"
            value={formEncargado}
            onChange={(e) => setFormEncargado(e.target.value)}
            fullWidth
            placeholder="Nombre del responsable del SG-SST"
            helperText="Opcional"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={creando}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCrearDesdePlantilla}
            disabled={creando}
            startIcon={creando ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {creando ? 'Creando...' : 'Crear Programa'}
          </Button>
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

export default ProgramaCapacitacionesPage;
