import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import {
  programaInspeccionesService,
  ProgramaInspecciones,
  EstadoPrograma,
  ESTADO_LABELS,
  ESTADO_COLORS,
} from '../services/programaInspeccionesService';

const CURRENT_YEAR = new Date().getFullYear();

export default function ProgramaInspeccionesList() {
  const navigate = useNavigate();
  const [programas, setProgramas] = useState<ProgramaInspecciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filtroAño, setFiltroAño] = useState<number | ''>('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoPrograma | ''>('');

  // Dialog crear
  const [dialogCrear, setDialogCrear] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nuevoAño, setNuevoAño] = useState<number>(CURRENT_YEAR);
  const [nuevoEncargado, setNuevoEncargado] = useState('');

  // Dialog eliminar
  const [dialogEliminar, setDialogEliminar] = useState(false);
  const [programaEliminar, setProgramaEliminar] = useState<ProgramaInspecciones | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarProgramas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {};
      if (filtroAño) params.año = filtroAño;
      if (filtroEstado) params.estado = filtroEstado;
      const data = await programaInspeccionesService.listarProgramas(params as never);
      setProgramas(data);
    } catch {
      setError('Error al cargar los programas de inspecciones.');
    } finally {
      setLoading(false);
    }
  }, [filtroAño, filtroEstado]);

  useEffect(() => {
    cargarProgramas();
  }, [cargarProgramas]);

  const handleCrear = async () => {
    setCreando(true);
    try {
      const nuevo = await programaInspeccionesService.crearPrograma({
        año: nuevoAño,
        encargado_sgsst: nuevoEncargado || undefined,
      });
      setSuccess(`Programa de Inspecciones ${nuevoAño} creado exitosamente.`);
      setDialogCrear(false);
      setNuevoEncargado('');
      navigate(`/admin/programa-inspecciones/${nuevo.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Error al crear el programa.';
      setError(msg);
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async () => {
    if (!programaEliminar) return;
    setEliminando(true);
    try {
      await programaInspeccionesService.eliminarPrograma(programaEliminar.id);
      setSuccess('Programa eliminado correctamente.');
      setDialogEliminar(false);
      setProgramaEliminar(null);
      cargarProgramas();
    } catch {
      setError('Error al eliminar el programa.');
    } finally {
      setEliminando(false);
    }
  };

  const years = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Programa de Inspecciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Código: PI-SST-01 | Gestión y seguimiento de inspecciones periódicas
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogCrear(true)}
        >
          Nuevo Programa
        </Button>
      </Box>

      {/* Alerts */}
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

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Año</InputLabel>
          <Select
            label="Año"
            value={filtroAño}
            onChange={(e) => setFiltroAño(e.target.value as number | '')}
          >
            <MenuItem value="">Todos</MenuItem>
            {years.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            label="Estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoPrograma | '')}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="borrador">Borrador</MenuItem>
            <MenuItem value="activo">Activo</MenuItem>
            <MenuItem value="finalizado">Finalizado</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<SearchIcon />} onClick={cargarProgramas} size="small">
          Buscar
        </Button>
      </Box>

      {/* Lista de programas */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : programas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay programas de inspecciones registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crea el primer programa para comenzar la gestión de inspecciones.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogCrear(true)}>
            Crear Programa
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {programas.map((programa) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={programa.id}>
              <ProgramaCard
                programa={programa}
                onVer={() => navigate(`/admin/programa-inspecciones/${programa.id}`)}
                onEliminar={() => { setProgramaEliminar(programa); setDialogEliminar(true); }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Crear */}
      <Dialog open={dialogCrear} onClose={() => setDialogCrear(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo Programa de Inspecciones</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Año *</InputLabel>
            <Select
              label="Año *"
              value={nuevoAño}
              onChange={(e) => setNuevoAño(e.target.value as number)}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Encargado SG-SST"
            size="small"
            fullWidth
            value={nuevoEncargado}
            onChange={(e) => setNuevoEncargado(e.target.value)}
            placeholder="Nombre del responsable"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCrear(false)} disabled={creando}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCrear}
            disabled={creando}
            startIcon={creando ? <CircularProgress size={16} /> : <AddIcon />}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={dialogEliminar} onClose={() => setDialogEliminar(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar Programa</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de eliminar el Programa de Inspecciones{' '}
            <strong>{programaEliminar?.año}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEliminar(false)} disabled={eliminando}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleEliminar}
            disabled={eliminando}
            startIcon={eliminando ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

interface ProgramaCardProps {
  programa: ProgramaInspecciones;
  onVer: () => void;
  onEliminar: () => void;
}

function ProgramaCard({ programa, onVer, onEliminar }: ProgramaCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            {programa.año}
          </Typography>
          <Chip
            label={ESTADO_LABELS[programa.estado]}
            color={ESTADO_COLORS[programa.estado]}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Código: {programa.codigo} · v{programa.version}
        </Typography>
        {programa.encargado_sgsst && (
          <Typography variant="body2" color="text.secondary">
            Encargado: {programa.encargado_sgsst}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <Tooltip title="Ver detalle">
          <IconButton size="small" color="primary" onClick={onVer}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton size="small" color="error" onClick={onEliminar}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
