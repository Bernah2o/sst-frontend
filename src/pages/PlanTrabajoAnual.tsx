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
  TextField,
  Typography,
  Alert,
  Divider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  AutoAwesome as AutoAwesomeIcon,
  CalendarMonth as CalendarMonthIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { planTrabajoAnualService, PlanTrabajoAnual, EstadoPlan } from '../services/planTrabajoAnualService';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const ESTADO_LABELS: Record<EstadoPlan, string> = {
  borrador: 'Borrador',
  aprobado: 'Aprobado',
  en_ejecucion: 'En Ejecución',
  finalizado: 'Finalizado',
};

const ESTADO_COLORS: Record<EstadoPlan, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  borrador: 'default',
  aprobado: 'primary',
  en_ejecucion: 'warning',
  finalizado: 'success',
};

const PlanTrabajoAnualPage: React.FC = () => {
  const navigate = useNavigate();
  const { dialogState, showConfirmDialog } = useConfirmDialog();
  const [planes, setPlanes] = useState<PlanTrabajoAnual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog crear desde plantilla
  const [dialogPlantilla, setDialogPlantilla] = useState(false);
  const [creando, setCreando] = useState(false);
  const [formPlantilla, setFormPlantilla] = useState({
    año: new Date().getFullYear(),
    encargado_sgsst: '',
  });

  const cargarPlanes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await planTrabajoAnualService.listarPlanes();
      setPlanes(data);
    } catch {
      setError('Error al cargar los planes de trabajo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPlanes();
  }, [cargarPlanes]);

  const handleCrearDesdePlantilla = async () => {
    try {
      setCreando(true);
      setError(null);
      const plan = await planTrabajoAnualService.crearDesdePlantilla(
        formPlantilla.año,
        undefined,
        formPlantilla.encargado_sgsst || undefined
      );
      setSuccess(`Plan de Trabajo ${plan.año} creado con ${plan.actividades.length} actividades estándar`);
      setDialogPlantilla(false);
      await cargarPlanes();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Error al crear el plan';
      setError(msg);
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (plan: PlanTrabajoAnual) => {
    const confirmed = await showConfirmDialog({
      title: 'Eliminar Plan de Trabajo',
      message: `¿Está seguro de eliminar el Plan de Trabajo Anual ${plan.año}? Esta acción eliminará todas las actividades y su seguimiento mensual.`,
      confirmText: 'Eliminar',
      severity: 'error',
    });
    if (!confirmed) return;

    try {
      await planTrabajoAnualService.eliminarPlan(plan.id);
      setSuccess(`Plan ${plan.año} eliminado`);
      await cargarPlanes();
    } catch {
      setError('Error al eliminar el plan');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Plan de Trabajo Anual SG-SST
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Planear y controlar la ejecución de actividades de Seguridad y Salud en el Trabajo (Código: PL-SST-02)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setDialogPlantilla(true)}
          size="large"
        >
          Crear Plan desde Plantilla
        </Button>
      </Box>

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

      {/* Info banner */}
      <Alert severity="info" sx={{ mb: 3 }} icon={<AssignmentIcon />}>
        <Typography variant="body2">
          <strong>Meta:</strong> Garantizar el cumplimiento del 95% de las actividades programadas anualmente. &nbsp;|&nbsp;
          <strong>Indicador:</strong> (Actividades ejecutadas / Actividades programadas) × 100
        </Typography>
      </Alert>

      {/* Lista de planes */}
      {planes.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <CalendarMonthIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay planes de trabajo registrados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Cree un plan desde la plantilla estándar del SG-SST (incluye las 72 actividades del cronograma anual)
            </Typography>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setDialogPlantilla(true)}
            >
              Crear Plan {new Date().getFullYear()} desde Plantilla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {planes.map((plan) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.id}>
              <PlanCard
                plan={plan}
                onVerDetalle={() => navigate(`/admin/plan-trabajo-anual/${plan.id}`)}
                onEliminar={() => handleEliminar(plan)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Crear desde Plantilla */}
      <Dialog open={dialogPlantilla} onClose={() => !creando && setDialogPlantilla(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            Crear Plan de Trabajo desde Plantilla
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Se crearán automáticamente las <strong>72 actividades estándar</strong> del Plan de Trabajo Anual SG-SST
            (PL-SST-02), con los meses programados según el cronograma oficial.
          </Alert>
          <TextField
            label="Año del plan"
            type="number"
            fullWidth
            value={formPlantilla.año}
            onChange={(e) => setFormPlantilla((f) => ({ ...f, año: parseInt(e.target.value) }))}
            inputProps={{ min: 2024, max: 2030 }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Encargado del SG SST"
            fullWidth
            value={formPlantilla.encargado_sgsst}
            onChange={(e) => setFormPlantilla((f) => ({ ...f, encargado_sgsst: e.target.value }))}
            placeholder="Ej: Bernardino de Aguas"
            helperText="Opcional - puede editarse después"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogPlantilla(false)} disabled={creando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCrearDesdePlantilla}
            disabled={creando || !formPlantilla.año}
            startIcon={creando ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {creando ? 'Creando...' : 'Crear Plan'}
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

// ---- Card individual de plan ----
interface PlanCardProps {
  plan: PlanTrabajoAnual;
  onVerDetalle: () => void;
  onEliminar: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onVerDetalle, onEliminar }) => {
  const añoActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1; // meses transcurridos como indicador
  const progresionEsperada = Math.round((mesActual / 12) * 100);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {plan.año}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {plan.codigo} • v{plan.version}
            </Typography>
          </Box>
          <Chip
            label={ESTADO_LABELS[plan.estado]}
            color={ESTADO_COLORS[plan.estado]}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {plan.encargado_sgsst && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Encargado:</strong> {plan.encargado_sgsst}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          <strong>Meta:</strong> {plan.meta_porcentaje}% de cumplimiento mensual
        </Typography>

        {plan.año === añoActual && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progresión esperada del año
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {progresionEsperada}%
              </Typography>
            </Box>
            <Tooltip title={`Mes ${mesActual} de 12`}>
              <LinearProgress
                variant="determinate"
                value={progresionEsperada}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Tooltip>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onEliminar}
        >
          Eliminar
        </Button>
        <Button
          variant="contained"
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={onVerDetalle}
        >
          Ver Cronograma
        </Button>
      </CardActions>
    </Card>
  );
};

export default PlanTrabajoAnualPage;
