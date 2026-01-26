import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../services/api';

type TipoRestriccion = 'temporal' | 'permanente' | 'condicional';
type EstadoImplementacion = 'pendiente' | 'en_proceso' | 'implementada' | 'vencida';

type RestriccionMedica = {
  id: number;
  worker_id: number;
  occupational_exam_id?: number | null;
  tipo_restriccion: TipoRestriccion;
  descripcion: string;
  actividades_restringidas?: string | null;
  recomendaciones?: string | null;
  fecha_inicio: string;
  fecha_fin?: string | null;
  activa: boolean;
  fecha_limite_implementacion: string;
  fecha_implementacion?: string | null;
  estado_implementacion: EstadoImplementacion;
  implementada: boolean;
  responsable_implementacion_id?: number | null;
  observaciones_implementacion?: string | null;
  dias_para_implementar: number;
  esta_vencida: boolean;
};

const RestriccionesMedicas: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [workerIdFilter, setWorkerIdFilter] = useState<string>('');
  const [items, setItems] = useState<RestriccionMedica[]>([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [createData, setCreateData] = useState({
    worker_id: '',
    occupational_exam_id: '',
    tipo_restriccion: 'temporal' as TipoRestriccion,
    descripcion: '',
    actividades_restringidas: '',
    recomendaciones: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    responsable_implementacion_id: ''
  });

  const [openImplement, setOpenImplement] = useState(false);
  const [implementId, setImplementId] = useState<number | null>(null);
  const [implementObs, setImplementObs] = useState('');

  const params = useMemo(() => {
    const p: any = {};
    if (workerIdFilter.trim()) p.worker_id = Number(workerIdFilter);
    return p;
  }, [workerIdFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/restricciones-medicas', { params });
      setItems(res.data || []);
    } catch (e) {
      enqueueSnackbar('Error al cargar restricciones médicas', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    const workerId = Number(createData.worker_id);
    if (!workerId) {
      enqueueSnackbar('worker_id es obligatorio', { variant: 'error' });
      return;
    }
    if (!createData.descripcion.trim()) {
      enqueueSnackbar('La descripción es obligatoria', { variant: 'error' });
      return;
    }
    if (createData.tipo_restriccion !== 'permanente' && createData.fecha_fin && createData.fecha_fin < createData.fecha_inicio) {
      enqueueSnackbar('fecha_fin no puede ser menor que fecha_inicio', { variant: 'error' });
      return;
    }

    try {
      await api.post('/restricciones-medicas', {
        worker_id: workerId,
        occupational_exam_id: createData.occupational_exam_id ? Number(createData.occupational_exam_id) : undefined,
        tipo_restriccion: createData.tipo_restriccion,
        descripcion: createData.descripcion,
        actividades_restringidas: createData.actividades_restringidas || undefined,
        recomendaciones: createData.recomendaciones || undefined,
        fecha_inicio: createData.fecha_inicio,
        fecha_fin: createData.tipo_restriccion === 'permanente' ? undefined : (createData.fecha_fin || undefined),
        responsable_implementacion_id: createData.responsable_implementacion_id ? Number(createData.responsable_implementacion_id) : undefined
      });
      enqueueSnackbar('Restricción creada', { variant: 'success' });
      setOpenCreate(false);
      await loadData();
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.detail || 'Error al crear restricción', { variant: 'error' });
    }
  };

  const handleOpenImplement = (id: number) => {
    setImplementId(id);
    setImplementObs('');
    setOpenImplement(true);
  };

  const handleImplement = async () => {
    if (!implementId) return;
    try {
      await api.put(`/restricciones-medicas/${implementId}/implementar`, {
        observaciones_implementacion: implementObs || undefined
      });
      enqueueSnackbar('Restricción marcada como implementada', { variant: 'success' });
      setOpenImplement(false);
      setImplementId(null);
      await loadData();
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.detail || 'Error al implementar restricción', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Restricciones Médicas
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Filtrar por Worker ID"
            value={workerIdFilter}
            onChange={(e) => setWorkerIdFilter(e.target.value)}
            type="number"
            size="small"
          />
          <Button variant="contained" onClick={loadData} disabled={loading}>
            {loading ? 'Cargando...' : 'Cargar'}
          </Button>
          <Button variant="outlined" onClick={() => setOpenCreate(true)}>
            Nueva Restricción
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Worker</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Límite (20 días)</TableCell>
              <TableCell>Días</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.worker_id}</TableCell>
                <TableCell>{r.tipo_restriccion}</TableCell>
                <TableCell>{r.estado_implementacion}</TableCell>
                <TableCell>{r.fecha_inicio}</TableCell>
                <TableCell>{r.fecha_limite_implementacion}</TableCell>
                <TableCell>{r.dias_para_implementar}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={r.implementada}
                    onClick={() => handleOpenImplement(r.id)}
                  >
                    Implementar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Sin datos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nueva Restricción</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Worker ID *"
              type="number"
              value={createData.worker_id}
              onChange={(e) => setCreateData({ ...createData, worker_id: e.target.value })}
            />
            <TextField
              label="Occupational Exam ID"
              type="number"
              value={createData.occupational_exam_id}
              onChange={(e) => setCreateData({ ...createData, occupational_exam_id: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de Restricción</InputLabel>
              <Select
                value={createData.tipo_restriccion}
                label="Tipo de Restricción"
                onChange={(e) => setCreateData({ ...createData, tipo_restriccion: e.target.value as TipoRestriccion })}
              >
                <MenuItem value="temporal">Temporal</MenuItem>
                <MenuItem value="condicional">Condicional</MenuItem>
                <MenuItem value="permanente">Permanente</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Responsable (User ID)"
              type="number"
              value={createData.responsable_implementacion_id}
              onChange={(e) => setCreateData({ ...createData, responsable_implementacion_id: e.target.value })}
            />
            <TextField
              label="Fecha inicio"
              type="date"
              value={createData.fecha_inicio}
              onChange={(e) => setCreateData({ ...createData, fecha_inicio: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha fin"
              type="date"
              value={createData.fecha_fin}
              onChange={(e) => setCreateData({ ...createData, fecha_fin: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={createData.tipo_restriccion === 'permanente'}
            />
            <TextField
              label="Descripción *"
              multiline
              minRows={3}
              value={createData.descripcion}
              onChange={(e) => setCreateData({ ...createData, descripcion: e.target.value })}
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="Actividades restringidas"
              multiline
              minRows={2}
              value={createData.actividades_restringidas}
              onChange={(e) => setCreateData({ ...createData, actividades_restringidas: e.target.value })}
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="Recomendaciones"
              multiline
              minRows={2}
              value={createData.recomendaciones}
              onChange={(e) => setCreateData({ ...createData, recomendaciones: e.target.value })}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openImplement} onClose={() => setOpenImplement(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Implementar Restricción</DialogTitle>
        <DialogContent>
          <TextField
            label="Observaciones"
            multiline
            minRows={3}
            fullWidth
            sx={{ mt: 1 }}
            value={implementObs}
            onChange={(e) => setImplementObs(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImplement(false)}>Cancelar</Button>
          <Button onClick={handleImplement} variant="contained" color="primary">Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RestriccionesMedicas;
