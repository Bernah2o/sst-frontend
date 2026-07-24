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
  FactCheck as FactCheckIcon,
} from '@mui/icons-material';
import {
  auditoriaSSTService,
  AuditoriaSST,
  TipoAuditoria,
  EstadoAuditoria,
  TIPO_AUDITORIA_LABELS,
  ESTADO_AUDITORIA_LABELS,
  ESTADO_AUDITORIA_COLORS,
} from '../services/auditoriaSSTService';
import {
  GrupoEstandar,
  GRUPO_SHORT_LABELS,
  determinarGrupo,
} from '../services/estandaresMinimosService';
import api from '../services/api';

const CURRENT_YEAR = new Date().getFullYear();

export default function AuditoriaSSTList() {
  const navigate = useNavigate();
  const [auditorias, setAuditorias] = useState<AuditoriaSST[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filtroAño, setFiltroAño] = useState<number | ''>('');
  const [filtroTipo, setFiltroTipo] = useState<TipoAuditoria | ''>('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoAuditoria | ''>('');
  const [grupoEmpresa, setGrupoEmpresa] = useState<GrupoEstandar | null>(null);

  // Dialog crear
  const [dialogCrear, setDialogCrear] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nuevoAño, setNuevoAño] = useState<number>(CURRENT_YEAR);
  const [nuevaFecha, setNuevaFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [nuevoTipo, setNuevoTipo] = useState<TipoAuditoria>('interna');
  const [nuevoAuditorLider, setNuevoAuditorLider] = useState('');

  // Dialog eliminar
  const [dialogEliminar, setDialogEliminar] = useState(false);
  const [auditoriaEliminar, setAuditoriaEliminar] = useState<AuditoriaSST | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarAuditorias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {};
      if (filtroAño) params.año = filtroAño;
      if (filtroTipo) params.tipo_auditoria = filtroTipo;
      if (filtroEstado) params.estado = filtroEstado;
      const data = await auditoriaSSTService.listar(params as never);
      setAuditorias(data);
    } catch {
      setError('Error al cargar las auditorías.');
    } finally {
      setLoading(false);
    }
  }, [filtroAño, filtroTipo, filtroEstado]);

  useEffect(() => {
    cargarAuditorias();
  }, [cargarAuditorias]);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/empresas/mi-empresa');
        const emp = r.data;
        if (emp?.num_trabajadores && emp?.nivel_riesgo) {
          setGrupoEmpresa(determinarGrupo(emp.num_trabajadores, emp.nivel_riesgo));
        }
      } catch {
        // Sin empresa asociada o sin datos configurados: no se muestra el aviso de grupo.
      }
    })();
  }, []);

  const handleCrear = async () => {
    setCreando(true);
    try {
      const nueva = await auditoriaSSTService.crear({
        año: nuevoAño,
        fecha_auditoria: nuevaFecha,
        tipo_auditoria: nuevoTipo,
        auditor_lider: nuevoAuditorLider || undefined,
      });
      setSuccess(`Auditoría ${nuevoAño} creada exitosamente.`);
      setDialogCrear(false);
      setNuevoAuditorLider('');
      navigate(`/admin/auditoria-sst/${nueva.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Error al crear la auditoría.';
      setError(msg);
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async () => {
    if (!auditoriaEliminar) return;
    setEliminando(true);
    try {
      await auditoriaSSTService.eliminar(auditoriaEliminar.id);
      setSuccess('Auditoría eliminada correctamente.');
      setDialogEliminar(false);
      setAuditoriaEliminar(null);
      cargarAuditorias();
    } catch {
      setError('Error al eliminar la auditoría.');
    } finally {
      setEliminando(false);
    }
  };

  const years = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FactCheckIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Auditoría Interna SG-SST
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Código: FT-SST-08 | Auditoría anual (Art. 16 Res. 0312/2019, Art. 2.2.4.6.30 Decreto 1072/2015)
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogCrear(true)}
        >
          Nueva Auditoría
        </Button>
      </Box>

      {/* Aviso de grupo (Resolución 0312/2019): la auditoría anual (estándar 6.1.2)
          solo es un ítem obligatorio de calificación para Grupo 60 */}
      {grupoEmpresa && grupoEmpresa !== 'GRUPO_60' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tu empresa está clasificada en <strong>{GRUPO_SHORT_LABELS[grupoEmpresa]}</strong> según
          la Resolución 0312 de 2019. La auditoría anual (estándar 6.1.2) no es un ítem obligatorio
          de calificación de los Estándares Mínimos para tu grupo, pero sigue siendo una buena
          práctica recomendada para el mejoramiento continuo del SG-SST.
        </Alert>
      )}

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
          <InputLabel>Tipo</InputLabel>
          <Select
            label="Tipo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoAuditoria | '')}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(TIPO_AUDITORIA_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            label="Estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoAuditoria | '')}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(ESTADO_AUDITORIA_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<SearchIcon />} onClick={cargarAuditorias} size="small">
          Buscar
        </Button>
      </Box>

      {/* Lista de auditorías */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : auditorias.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FactCheckIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay auditorías registradas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crea la primera auditoría interna del SG-SST para comenzar.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogCrear(true)}>
            Crear Auditoría
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {auditorias.map((auditoria) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={auditoria.id}>
              <AuditoriaCard
                auditoria={auditoria}
                onVer={() => navigate(`/admin/auditoria-sst/${auditoria.id}`)}
                onEliminar={() => { setAuditoriaEliminar(auditoria); setDialogEliminar(true); }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Crear */}
      <Dialog open={dialogCrear} onClose={() => setDialogCrear(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nueva Auditoría Interna SG-SST</DialogTitle>
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
            label="Fecha de auditoría *"
            type="date"
            size="small"
            fullWidth
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Tipo de auditoría</InputLabel>
            <Select
              label="Tipo de auditoría"
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value as TipoAuditoria)}
            >
              {Object.entries(TIPO_AUDITORIA_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Auditor líder"
            size="small"
            fullWidth
            value={nuevoAuditorLider}
            onChange={(e) => setNuevoAuditorLider(e.target.value)}
            placeholder="Nombre del auditor líder"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCrear(false)} disabled={creando}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCrear}
            disabled={creando || !nuevaFecha}
            startIcon={creando ? <CircularProgress size={16} /> : <AddIcon />}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={dialogEliminar} onClose={() => setDialogEliminar(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar Auditoría</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de eliminar la Auditoría <strong>{auditoriaEliminar?.año}</strong>{' '}
            ({auditoriaEliminar && TIPO_AUDITORIA_LABELS[auditoriaEliminar.tipo_auditoria]})? Esta acción no se puede deshacer.
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

interface AuditoriaCardProps {
  auditoria: AuditoriaSST;
  onVer: () => void;
  onEliminar: () => void;
}

function AuditoriaCard({ auditoria, onVer, onEliminar }: AuditoriaCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            {auditoria.año}
          </Typography>
          <Chip
            label={ESTADO_AUDITORIA_LABELS[auditoria.estado]}
            color={ESTADO_AUDITORIA_COLORS[auditoria.estado]}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {TIPO_AUDITORIA_LABELS[auditoria.tipo_auditoria]} · {auditoria.fecha_auditoria}
        </Typography>
        {auditoria.auditor_lider && (
          <Typography variant="body2" color="text.secondary">
            Auditor líder: {auditoria.auditor_lider}
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
