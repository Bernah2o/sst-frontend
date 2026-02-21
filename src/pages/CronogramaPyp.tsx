import React, { useState, useEffect, useCallback } from 'react';
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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  HealthAndSafety as HealthIcon,
} from '@mui/icons-material';
import { planTrabajoAnualService, PlanTrabajoAnual, EstadoPlan } from '../services/planTrabajoAnualService';
import { cronogramaPypService } from '../services/cronogramaPypService';
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

type CronStatus = 'loading' | 'exists' | 'missing';

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const CronogramaPypPage: React.FC = () => {
  const navigate = useNavigate();
  const { dialogState, showConfirmDialog } = useConfirmDialog();

  const [planes, setPlanes] = useState<PlanTrabajoAnual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cronStatus, setCronStatus] = useState<Record<number, CronStatus>>({});

  // Crear cronograma dialog
  const [crearDialog, setCrearDialog] = useState(false);
  const [crearPlanId, setCrearPlanId] = useState<number | null>(null);
  const [crearForm, setCrearForm] = useState({ encargado_sgsst: '', aprobado_por: '' });
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await planTrabajoAnualService.listarPlanes();
      setPlanes(data);

      const statuses: Record<number, CronStatus> = {};
      data.forEach((p) => { statuses[p.id] = 'loading'; });
      setCronStatus({ ...statuses });

      await Promise.all(
        data.map(async (p) => {
          try {
            await cronogramaPypService.obtenerCronograma(p.id);
            setCronStatus((prev) => ({ ...prev, [p.id]: 'exists' }));
          } catch {
            setCronStatus((prev) => ({ ...prev, [p.id]: 'missing' }));
          }
        })
      );
    } catch {
      setError('Error al cargar los planes de trabajo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCambiarEstado = async (planId: number, nuevoEstado: EstadoPlan) => {
    try {
      await planTrabajoAnualService.actualizarPlan(planId, { estado: nuevoEstado });
      setPlanes((prev) => prev.map((p) => p.id === planId ? { ...p, estado: nuevoEstado } : p));
      setSuccess(`Estado actualizado a "${ESTADO_LABELS[nuevoEstado]}"`);
    } catch {
      setError('Error al cambiar el estado del plan');
    }
  };

  const openCrear = (planId: number) => {
    setCrearPlanId(planId);
    setCrearForm({ encargado_sgsst: '', aprobado_por: '' });
    setCrearDialog(true);
  };

  const handleCrear = async () => {
    if (!crearPlanId) return;
    try {
      setCreando(true);
      await cronogramaPypService.crearCronograma(crearPlanId, crearForm);
      setCrearDialog(false);
      setSuccess('Cronograma PYP creado exitosamente');
      navigate(`/admin/cronograma-pyp/${crearPlanId}`);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error al crear el cronograma');
    } finally {
      setCreando(false);
    }
  };

  const handleEliminarCronograma = async (planId: number, año: number) => {
    const ok = await showConfirmDialog({
      title: 'Eliminar Cronograma PYP',
      message: `¿Eliminar el Cronograma PYP ${año}? Se perderán todas las actividades y su seguimiento mensual.`,
      confirmText: 'Eliminar',
      severity: 'error',
    });
    if (!ok) return;
    try {
      await cronogramaPypService.eliminarCronograma(planId);
      setSuccess('Cronograma PYP eliminado');
      setCronStatus((prev) => ({ ...prev, [planId]: 'missing' }));
    } catch {
      setError('Error al eliminar el cronograma');
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Programa de Promoción y Prevención (PYP)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Planifica y controla las actividades de PYP. Cada vigencia tiene su propio cronograma (CR-PYP-01).
        </Typography>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      <Alert severity="info" sx={{ mb: 3 }} icon={<HealthIcon />}>
        <Typography variant="body2">
          <strong>Meta:</strong> Cumplir el 100% de las actividades programadas en cada vigencia.&nbsp;
          <strong>Indicador:</strong> (Nº Actividades Ejecutadas / Nº Actividades Programadas) × 100
        </Typography>
      </Alert>

      {planes.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <HealthIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay Planes de Trabajo registrados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Primero crea un Plan de Trabajo Anual para poder asociarle un Cronograma PYP.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/admin/plan-trabajo-anual')}>
              Ir a Planes de Trabajo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {planes.map((plan) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.id}>
              <PlanCronCard
                plan={plan}
                cronStatus={cronStatus[plan.id] ?? 'loading'}
                onVerCronograma={() => navigate(`/admin/cronograma-pyp/${plan.id}`)}
                onCrear={() => openCrear(plan.id)}
                onEliminar={() => handleEliminarCronograma(plan.id, plan.año)}
                onCambiarEstado={(estado) => handleCambiarEstado(plan.id, estado)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog crear cronograma */}
      <Dialog open={crearDialog} onClose={() => !creando && setCrearDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HealthIcon color="primary" />
            Crear Cronograma PYP
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Alert severity="info">
            Se creará el Cronograma PYP para la vigencia seleccionada. Podrás agregar actividades después.
          </Alert>
          <TextField
            label="Encargado SG-SST"
            fullWidth
            value={crearForm.encargado_sgsst}
            onChange={(e) => setCrearForm((f) => ({ ...f, encargado_sgsst: e.target.value }))}
            placeholder="Ej: Nombre del responsable"
            helperText="Opcional – puede editarse después"
          />
          <TextField
            label="Aprobado por"
            fullWidth
            value={crearForm.aprobado_por}
            onChange={(e) => setCrearForm((f) => ({ ...f, aprobado_por: e.target.value }))}
            placeholder="Ej: Gerente General"
            helperText="Opcional – puede editarse después"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCrearDialog(false)} disabled={creando}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCrear}
            disabled={creando}
            startIcon={creando ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {creando ? 'Creando...' : 'Crear Cronograma'}
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

// ─────────────────────────────────────────────
// PlanCronCard — single plan card with status selector
// ─────────────────────────────────────────────
interface PlanCronCardProps {
  plan: PlanTrabajoAnual;
  cronStatus: CronStatus;
  onVerCronograma: () => void;
  onCrear: () => void;
  onEliminar: () => void;
  onCambiarEstado: (estado: EstadoPlan) => void;
}

const PlanCronCard: React.FC<PlanCronCardProps> = ({
  plan, cronStatus, onVerCronograma, onCrear, onEliminar, onCambiarEstado,
}) => {
  const [cambiando, setCambiando] = useState(false);

  const handleEstado = async (nuevoEstado: EstadoPlan) => {
    setCambiando(true);
    await onCambiarEstado(nuevoEstado);
    setCambiando(false);
  };

  return (
    <Card
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Top row: year + cronograma status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">{plan.año}</Typography>
            <Typography variant="caption" color="text.secondary">
              CR-PYP-01 · Plan {plan.codigo}
            </Typography>
          </Box>
          {cronStatus === 'loading' ? (
            <CircularProgress size={20} />
          ) : cronStatus === 'exists' ? (
            <Chip label="Cronograma activo" color="success" size="small" />
          ) : (
            <Chip label="Sin cronograma" color="default" size="small" variant="outlined" />
          )}
        </Box>

        {plan.encargado_sgsst && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Encargado SG-SST:</strong> {plan.encargado_sgsst}
          </Typography>
        )}

        {/* Estado selector */}
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>Estado del plan</InputLabel>
          <Select
            label="Estado del plan"
            value={plan.estado}
            onChange={(e) => handleEstado(e.target.value as EstadoPlan)}
            disabled={cambiando}
            endAdornment={cambiando ? <CircularProgress size={14} sx={{ mr: 2 }} /> : null}
          >
            {(Object.keys(ESTADO_LABELS) as EstadoPlan[]).map((key) => (
              <MenuItem key={key} value={key}>
                <Chip
                  label={ESTADO_LABELS[key]}
                  size="small"
                  color={ESTADO_COLORS[key]}
                  sx={{ fontSize: '0.72rem', height: 20 }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        {cronStatus === 'exists' ? (
          <>
            <Button size="small" color="error" onClick={onEliminar}>
              Eliminar cronograma
            </Button>
            <Button variant="contained" size="small" endIcon={<ArrowForwardIcon />} onClick={onVerCronograma}>
              Ver Cronograma
            </Button>
          </>
        ) : cronStatus === 'missing' ? (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={onCrear} fullWidth>
            Crear Cronograma PYP {plan.año}
          </Button>
        ) : null}
      </CardActions>
    </Card>
  );
};

export default CronogramaPypPage;
