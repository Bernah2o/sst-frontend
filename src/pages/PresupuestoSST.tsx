import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
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
} from '@mui/material';
import {
  Add as AddIcon,
  AutoAwesome as AutoAwesomeIcon,
  AccountBalance as AccountBalanceIcon,
  ArrowForward as ArrowForwardIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  presupuestoSSTService,
  PresupuestoSST,
} from '../services/presupuestoSSTService';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const PresupuestoSSTPage: React.FC = () => {
  const navigate = useNavigate();
  const { dialogState, showConfirmDialog } = useConfirmDialog();
  const [presupuestos, setPresupuestos] = useState<PresupuestoSST[]>([]);
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

  const cargarPresupuestos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await presupuestoSSTService.listar();
      setPresupuestos(data);
    } catch {
      setError('Error al cargar los presupuestos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPresupuestos();
  }, [cargarPresupuestos]);

  const handleCrearDesdePlantilla = async () => {
    try {
      setCreando(true);
      setError(null);
      const p = await presupuestoSSTService.crearDesdePlantilla(
        formPlantilla.año,
        undefined,
        formPlantilla.encargado_sgsst || undefined
      );
      setSuccess(`Presupuesto SST ${p.año} creado con las actividades estándar AN-SST-03`);
      setDialogPlantilla(false);
      await cargarPresupuestos();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Error al crear el presupuesto';
      setError(msg);
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (p: PresupuestoSST) => {
    const confirmed = await showConfirmDialog({
      title: 'Eliminar Presupuesto SST',
      message: `¿Está seguro de eliminar el Presupuesto SST ${p.año}? Esta acción eliminará todos los ítems y montos registrados.`,
      confirmText: 'Eliminar',
      severity: 'error',
    });
    if (!confirmed) return;

    try {
      await presupuestoSSTService.eliminar(p.id);
      setSuccess(`Presupuesto ${p.año} eliminado`);
      await cargarPresupuestos();
    } catch {
      setError('Error al eliminar el presupuesto');
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
            Presupuesto SST
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consolidado General de Presupuesto para el SG-SST (Código: AN-SST-03)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setDialogPlantilla(true)}
          size="large"
        >
          Crear Presupuesto desde Plantilla
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
      <Alert severity="info" sx={{ mb: 3 }} icon={<AccountBalanceIcon />}>
        <Typography variant="body2">
          Registre el presupuesto proyectado y ejecutado por categoría de actividad SST.
          El admin puede agregar nuevos ítems en cada categoría. Exporte a{' '}
          <strong>Excel</strong> o <strong>PDF</strong> desde el detalle.
        </Typography>
      </Alert>

      {/* Lista de presupuestos */}
      {presupuestos.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay presupuestos registrados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Cree el presupuesto SST desde la plantilla estándar AN-SST-03 con las 5 categorías
              y actividades de referencia.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setDialogPlantilla(true)}
            >
              Crear Presupuesto {new Date().getFullYear()} desde Plantilla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {presupuestos.map((p) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
              <PresupuestoCard
                presupuesto={p}
                onVerDetalle={() => navigate(`/admin/presupuesto-sst/${p.id}`)}
                onEliminar={() => handleEliminar(p)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Crear desde Plantilla */}
      <Dialog
        open={dialogPlantilla}
        onClose={() => !creando && setDialogPlantilla(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            Crear Presupuesto SST desde Plantilla
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Se crearán automáticamente las <strong>5 categorías</strong> y los{' '}
            <strong>ítems de actividad</strong> del AN-SST-03. Los montos mensuales
            inician en cero y se completan en el detalle.
          </Alert>
          <TextField
            label="Año del presupuesto"
            type="number"
            fullWidth
            value={formPlantilla.año}
            onChange={(e) =>
              setFormPlantilla((f) => ({ ...f, año: parseInt(e.target.value) }))
            }
            inputProps={{ min: 2024, max: 2035 }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Encargado del SG-SST"
            fullWidth
            value={formPlantilla.encargado_sgsst}
            onChange={(e) =>
              setFormPlantilla((f) => ({ ...f, encargado_sgsst: e.target.value }))
            }
            placeholder="Ej: Coordinador SST"
            helperText="Opcional — puede editarse después"
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
            {creando ? 'Creando...' : 'Crear Presupuesto'}
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

// ── Card individual ──
interface PresupuestoCardProps {
  presupuesto: PresupuestoSST;
  onVerDetalle: () => void;
  onEliminar: () => void;
}

const PresupuestoCard: React.FC<PresupuestoCardProps> = ({
  presupuesto,
  onVerDetalle,
  onEliminar,
}) => {
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {presupuesto.año}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {presupuesto.codigo} • v{presupuesto.version}
            </Typography>
          </Box>
          <AccountBalanceIcon color="primary" sx={{ fontSize: 32 }} />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {presupuesto.encargado_sgsst && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Encargado:</strong> {presupuesto.encargado_sgsst}
          </Typography>
        )}

        {presupuesto.aprobado_por && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Aprobado por:</strong> {presupuesto.aprobado_por}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary">
          {presupuesto.titulo || 'Consolidado General Presupuesto'}
        </Typography>
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
          Ver Presupuesto
        </Button>
      </CardActions>
    </Card>
  );
};

export default PresupuestoSSTPage;
