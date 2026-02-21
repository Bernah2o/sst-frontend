import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Delete as DeleteIcon,
  FactCheck as FactCheckIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

import {
  AutoevaluacionEstandares,
  AutoevaluacionCreate,
  EstadoAutoevaluacion,
  GrupoEstandar,
  NivelCumplimiento,
  NivelRiesgo,
  ESTADO_LABELS,
  GRUPO_LABELS,
  GRUPO_SHORT_LABELS,
  NIVEL_COLORS,
  NIVEL_LABELS,
  determinarGrupo,
  estandaresMinimosService,
} from '../services/estandaresMinimosService';

// ─── Helpers UI ────────────────────────────────────────────────────────────

const ESTADO_COLORS: Record<EstadoAutoevaluacion, 'default' | 'info' | 'success'> = {
  borrador:   'default',
  en_proceso: 'info',
  finalizada: 'success',
};

const NIVEL_RIESGO_OPTIONS: NivelRiesgo[] = ['I', 'II', 'III', 'IV', 'V'];

// ─── Componente principal ──────────────────────────────────────────────────

export default function EstandaresMinimos() {
  const navigate = useNavigate();

  const [evaluaciones, setEvaluaciones] = useState<AutoevaluacionEstandares[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog crear
  const [dialogCrear, setDialogCrear] = useState(false);
  const [creando, setCreando] = useState(false);
  const [formData, setFormData] = useState<{
    año: number;
    num_trabajadores: string;
    nivel_riesgo: NivelRiesgo | '';
    encargado_sgsst: string;
  }>({
    año: new Date().getFullYear(),
    num_trabajadores: '',
    nivel_riesgo: '',
    encargado_sgsst: '',
  });

  // Dialog eliminar
  const [dialogEliminar, setDialogEliminar] = useState(false);
  const [evaluacionAEliminar, setEvaluacionAEliminar] = useState<AutoevaluacionEstandares | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // ─── Carga de datos ────────────────────────────────────────────────────

  const cargarEvaluaciones = useCallback(async () => {
    try {
      setLoading(true);
      const data = await estandaresMinimosService.listar();
      setEvaluaciones(data);
      setError(null);
    } catch {
      setError('Error al cargar las autoevaluaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEvaluaciones();
  }, [cargarEvaluaciones]);

  // ─── Acciones ──────────────────────────────────────────────────────────

  const handleCrear = async () => {
    if (!formData.nivel_riesgo || !formData.num_trabajadores) return;
    setCreando(true);
    try {
      const payload: AutoevaluacionCreate = {
        año: formData.año,
        num_trabajadores: parseInt(formData.num_trabajadores, 10),
        nivel_riesgo: formData.nivel_riesgo as NivelRiesgo,
        encargado_sgsst: formData.encargado_sgsst || undefined,
      };
      const nueva = await estandaresMinimosService.crear(payload);
      setDialogCrear(false);
      setSuccess(`Autoevaluación ${nueva.año} creada con ${nueva.respuestas.length} estándares`);
      navigate(`/admin/estandares-minimos/${nueva.id}`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || 'Error al crear la autoevaluación');
    } finally {
      setCreando(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!evaluacionAEliminar) return;
    setEliminando(true);
    try {
      await estandaresMinimosService.eliminar(evaluacionAEliminar.id);
      setSuccess(`Autoevaluación ${evaluacionAEliminar.año} eliminada`);
      setDialogEliminar(false);
      setEvaluacionAEliminar(null);
      await cargarEvaluaciones();
    } catch {
      setError('Error al eliminar la autoevaluación');
    } finally {
      setEliminando(false);
    }
  };

  // ─── Preview grupo en dialog ───────────────────────────────────────────

  const grupoPreview: GrupoEstandar | null =
    formData.num_trabajadores && formData.nivel_riesgo
      ? determinarGrupo(parseInt(formData.num_trabajadores, 10), formData.nivel_riesgo as NivelRiesgo)
      : null;

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FactCheckIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Estándares Mínimos SST</Typography>
            <Typography variant="body2" color="text.secondary">
              Autoevaluación — Resolución 0312 de 2019
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogCrear(true)}
        >
          Nueva Autoevaluación
        </Button>
      </Box>

      {/* Banner informativo */}
      <Alert severity="info" sx={{ mb: 3 }}>
        El sistema determina automáticamente el grupo de estándares según el número de trabajadores y el nivel de riesgo de la empresa (Res. 0312/2019).
      </Alert>

      {/* Alertas */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Contenido */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : evaluaciones.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
          <FactCheckIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6">No hay autoevaluaciones registradas</Typography>
          <Typography variant="body2">Crea la primera autoevaluación para comenzar</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {evaluaciones.map((ev) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={ev.id}>
              <EvaluacionCard
                evaluacion={ev}
                onVer={() => navigate(`/admin/estandares-minimos/${ev.id}`)}
                onEliminar={() => {
                  setEvaluacionAEliminar(ev);
                  setDialogEliminar(true);
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Crear */}
      <Dialog open={dialogCrear} onClose={() => setDialogCrear(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Autoevaluación de Estándares Mínimos</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Año"
                type="number"
                fullWidth
                value={formData.año}
                onChange={(e) => setFormData((p) => ({ ...p, año: parseInt(e.target.value, 10) || new Date().getFullYear() }))}
                inputProps={{ min: 2000, max: 2100 }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Número de trabajadores"
                type="number"
                fullWidth
                required
                value={formData.num_trabajadores}
                onChange={(e) => setFormData((p) => ({ ...p, num_trabajadores: e.target.value }))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Nivel de Riesgo</InputLabel>
                <Select
                  label="Nivel de Riesgo"
                  value={formData.nivel_riesgo}
                  onChange={(e) => setFormData((p) => ({ ...p, nivel_riesgo: e.target.value as NivelRiesgo }))}
                >
                  {NIVEL_RIESGO_OPTIONS.map((n) => (
                    <MenuItem key={n} value={n}>Riesgo {n}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Encargado SG-SST (opcional)"
                fullWidth
                value={formData.encargado_sgsst}
                onChange={(e) => setFormData((p) => ({ ...p, encargado_sgsst: e.target.value }))}
              />
            </Grid>
            {/* Preview del grupo */}
            {grupoPreview && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" icon={<CheckCircleOutlineIcon />}>
                  <Typography variant="body2">
                    <strong>Grupo aplicable:</strong> {GRUPO_LABELS[grupoPreview]}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCrear(false)} disabled={creando}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCrear}
            disabled={creando || !formData.num_trabajadores || !formData.nivel_riesgo}
            startIcon={creando ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {creando ? 'Creando...' : 'Crear Autoevaluación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={dialogEliminar} onClose={() => setDialogEliminar(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar la autoevaluación del año <strong>{evaluacionAEliminar?.año}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEliminar(false)} disabled={eliminando}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmarEliminar}
            disabled={eliminando}
            startIcon={eliminando ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Card individual ───────────────────────────────────────────────────────

interface EvaluacionCardProps {
  evaluacion: AutoevaluacionEstandares;
  onVer: () => void;
  onEliminar: () => void;
}

function EvaluacionCard({ evaluacion, onVer, onEliminar }: EvaluacionCardProps) {
  const nivelColor = evaluacion.nivel_cumplimiento
    ? NIVEL_COLORS[evaluacion.nivel_cumplimiento]
    : 'default';

  const progressColor =
    evaluacion.puntaje_total >= 85 ? 'success' :
    evaluacion.puntaje_total >= 60 ? 'warning' : 'error';

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        {/* Año */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h4" fontWeight={700} color="primary">
            {evaluacion.año}
          </Typography>
          <Chip
            label={ESTADO_LABELS[evaluacion.estado]}
            color={ESTADO_COLORS[evaluacion.estado]}
            size="small"
          />
        </Box>

        {/* Grupo */}
        <Chip
          label={GRUPO_SHORT_LABELS[evaluacion.grupo]}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mb: 1 }}
        />

        <Divider sx={{ my: 1 }} />

        {/* Info empresa */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupsIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {evaluacion.num_trabajadores} trabajadores
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Riesgo {evaluacion.nivel_riesgo}
          </Typography>
        </Box>

        {evaluacion.encargado_sgsst && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <PersonIcon fontSize="small" color="action" />
            <Tooltip title={evaluacion.encargado_sgsst}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {evaluacion.encargado_sgsst}
              </Typography>
            </Tooltip>
          </Box>
        )}

        {/* Score */}
        <Box sx={{ mt: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">Puntaje total</Typography>
            <Typography variant="body2" fontWeight={600}>
              {evaluacion.puntaje_total.toFixed(1)} / 100
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={evaluacion.puntaje_total}
            color={progressColor}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Nivel de cumplimiento */}
        {evaluacion.nivel_cumplimiento && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={NIVEL_LABELS[evaluacion.nivel_cumplimiento]}
              color={nivelColor as 'error' | 'warning' | 'success'}
              size="small"
              sx={{ width: '100%' }}
            />
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <IconButton color="error" size="small" onClick={onEliminar} title="Eliminar">
          <DeleteIcon />
        </IconButton>
        <Button
          variant="contained"
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={onVer}
        >
          Ver Evaluación
        </Button>
      </CardActions>
    </Card>
  );
}
