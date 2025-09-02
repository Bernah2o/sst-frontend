import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as TaskIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Flag as FlagIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip,
  Avatar,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { adminConfigService, ProgramaOption } from '../services/adminConfigService';
import api from '../services/api';
import { workerService } from '../services/workerService';
import { User } from '../types';
import { WorkerList } from '../types/worker';
import { formatDate, formatDateTime } from '../utils/dateUtils';

interface Seguimiento {
  id: number;
  worker_id: number;
  programa: string;
  nombre_trabajador: string;
  cedula: string;
  cargo: string;
  fecha_ingreso?: string;
  estado: 'iniciado' | 'terminado';
  valoracion_riesgo?: 'bajo' | 'medio' | 'alto' | 'muy_alto';
  fecha_inicio?: string;
  fecha_final?: string;
  observacion?: string;
  motivo_inclusion?: string;
  conclusiones_ocupacionales?: string;
  conductas_ocupacionales_prevenir?: string;
  recomendaciones_generales?: string;
  observaciones_examen?: string;
  comentario?: string;
  created_at: string;
  updated_at: string;
}

// Interfaz para acciones de seguimiento (si se necesita en el futuro)
interface SeguimientoAction {
  id: number;
  action_date: string;
  action_type: 'evaluacion' | 'tratamiento' | 'seguimiento' | 'capacitacion' | 'otro';
  description: string;
  responsible: string;
  result?: string;
  next_action?: string;
}

const Seguimiento: React.FC = () => {
  const { user } = useAuth();
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [workers, setWorkers] = useState<WorkerList[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [programas, setProgramas] = useState<ProgramaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSeguimiento, setEditingSeguimiento] = useState<Seguimiento | null>(null);
  const [viewingSeguimiento, setViewingSeguimiento] = useState<Seguimiento | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  // const [openActionDialog, setOpenActionDialog] = useState(false); // Comentado - funcionalidad de acciones no incluida
  const [confirmDialog, setConfirmDialog] = useState({ open: false, seguimientoId: null as number | null });
  const [filters, setFilters] = useState({
    programa: '',
    estado: '',
    valoracion_riesgo: '',
    worker: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    worker_id: '',
    programa: '',
    estado: 'iniciado' as 'iniciado' | 'terminado',
    valoracion_riesgo: 'bajo' as 'bajo' | 'medio' | 'alto' | 'muy_alto',
    fecha_inicio: null as Date | null,
    fecha_final: null as Date | null,
    observacion: '',
    motivo_inclusion: '',
    conclusiones_ocupacionales: '',
    conductas_ocupacionales_prevenir: '',
    recomendaciones_generales: '',
    observaciones_examen: '',
    comentario: ''
  });
  // const [actionFormData, setActionFormData] = useState({
  //   action_type: 'seguimiento' as 'evaluacion' | 'tratamiento' | 'seguimiento' | 'capacitacion' | 'otro',
  //   description: '',
  //   responsible: '',
  //   result: '',
  //   next_action: ''
  // }); // Comentado - funcionalidad de acciones no incluida

  // Los programas ahora se cargan dinámicamente desde el backend

  const valoracionesRiesgo = [
    { value: 'bajo', label: 'Bajo', color: 'success' },
    { value: 'medio', label: 'Medio', color: 'warning' },
    { value: 'alto', label: 'Alto', color: 'error' },
    { value: 'muy_alto', label: 'Muy Alto', color: 'error' }
  ];

  const estadosConfig = {
    iniciado: { label: 'Iniciado', color: 'default', icon: <FlagIcon /> },
    terminado: { label: 'Terminado', color: 'success', icon: <CompleteIcon /> }
  };

  const actionTypes = [
    { value: 'evaluacion', label: 'Evaluación' },
    { value: 'tratamiento', label: 'Tratamiento' },
    { value: 'seguimiento', label: 'Seguimiento' },
    { value: 'capacitacion', label: 'Capacitación' },
    { value: 'otro', label: 'Otro' }
  ];

  useEffect(() => {
    fetchSeguimientos();
    fetchWorkers();
    fetchUsers();
  }, [page, filters]);

  useEffect(() => {
    // Cargar programas solo una vez al montar el componente
    fetchProgramas();
  }, []);

  const fetchSeguimientos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      
      if (filters.programa) params.append('programa', filters.programa);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.valoracion_riesgo) params.append('valoracion_riesgo', filters.valoracion_riesgo);
      if (filters.worker) params.append('worker_id', filters.worker);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/seguimientos?${params.toString()}`);
      setSeguimientos(response.data || []);
      // Calculate total pages based on response length (assuming pagination is handled by backend)
      setTotalPages(Math.ceil((response.data?.length || 0) / 20));
    } catch (error) {
      console.error('Error fetching seguimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await workerService.getWorkers(1, 1000); // Get all workers
      setWorkers(response.items);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProgramas = async () => {
    try {
      const programasOptions = await adminConfigService.getActiveProgramasAsOptions();
      setProgramas(programasOptions);
    } catch (error) {
      console.error('Error fetching programas:', error);
      // En caso de error, usar array vacío
      setProgramas([]);
    }
  };

  const handleSaveSeguimiento = async () => {
    try {
      // Obtener información completa del trabajador seleccionado
      const selectedWorker = workers.find(w => w.id === parseInt(formData.worker_id));
      if (!selectedWorker) {
        console.error('Trabajador no encontrado');
        return;
      }

      const payload = {
        ...formData,
        worker_id: parseInt(formData.worker_id),
        nombre_trabajador: `${selectedWorker.first_name} ${selectedWorker.last_name}`,
        cedula: selectedWorker.document_number,
        cargo: selectedWorker.position,
        fecha_inicio: formData.fecha_inicio?.toISOString().split('T')[0],
        fecha_final: formData.fecha_final?.toISOString().split('T')[0]
      };

      if (editingSeguimiento) {
        await api.put(`/seguimientos/${editingSeguimiento.id}`, payload);
      } else {
        await api.post('/seguimientos/', payload);
      }
      fetchSeguimientos();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving seguimiento:', error);
    }
  };

  // const handleAddAction = async () => {
  //   if (!viewingSeguimiento) return;
  //   
  //   try {
  //     const payload = {
  //       ...actionFormData,
  //       action_date: new Date().toISOString()
  //     };

  //     await api.post(`/seguimientos/${viewingSeguimiento.id}/actions`, payload);
  //     
  //     // Refresh the seguimiento data
  //     const response = await api.get(`/seguimientos/${viewingSeguimiento.id}`);
  //     setViewingSeguimiento(response.data);
  //     
  //     setOpenActionDialog(false);
  //     setActionFormData({
  //       action_type: 'seguimiento',
  //       description: '',
  //       responsible: '',
  //       result: '',
  //       next_action: ''
  //     });
  //   } catch (error) {
  //     console.error('Error adding action:', error);
  //   }
  // }; // Comentado - funcionalidad de acciones no incluida

  const handleDeleteSeguimiento = (id: number) => {
    setConfirmDialog({ open: true, seguimientoId: id });
  };

  const handleConfirmDelete = async () => {
    if (confirmDialog.seguimientoId) {
      try {
        await api.delete(`/seguimientos/${confirmDialog.seguimientoId}`);
        fetchSeguimientos();
      } catch (error) {
        console.error('Error deleting seguimiento:', error);
      }
    }
    setConfirmDialog({ open: false, seguimientoId: null });
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, seguimientoId: null });
  };

  const handleUpdateStatus = async (id: number, newEstado: string) => {
    try {
      await api.patch(`/seguimientos/${id}`, { estado: newEstado });
      fetchSeguimientos();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleOpenDialog = (seguimiento?: Seguimiento) => {
    if (seguimiento) {
      setEditingSeguimiento(seguimiento);
      setFormData({
        worker_id: seguimiento.worker_id.toString(),
        programa: seguimiento.programa,
        estado: seguimiento.estado,
        valoracion_riesgo: seguimiento.valoracion_riesgo || 'bajo',
        fecha_inicio: seguimiento.fecha_inicio ? new Date(seguimiento.fecha_inicio) : null,
        fecha_final: seguimiento.fecha_final ? new Date(seguimiento.fecha_final) : null,
        observacion: seguimiento.observacion || '',
        motivo_inclusion: seguimiento.motivo_inclusion || '',
        conclusiones_ocupacionales: seguimiento.conclusiones_ocupacionales || '',
        conductas_ocupacionales_prevenir: seguimiento.conductas_ocupacionales_prevenir || '',
        recomendaciones_generales: seguimiento.recomendaciones_generales || '',
        observaciones_examen: seguimiento.observaciones_examen || '',
        comentario: seguimiento.comentario || ''
      });
    } else {
      setEditingSeguimiento(null);
      setFormData({
        worker_id: '',
        programa: '',
        estado: 'iniciado',
        valoracion_riesgo: 'bajo',
        fecha_inicio: null,
        fecha_final: null,
        observacion: '',
        motivo_inclusion: '',
        conclusiones_ocupacionales: '',
        conductas_ocupacionales_prevenir: '',
        recomendaciones_generales: '',
        observaciones_examen: '',
        comentario: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSeguimiento(null);
  };

  const handleViewSeguimiento = async (seguimiento: Seguimiento) => {
    try {
      const response = await api.get(`/seguimientos/${seguimiento.id}`);
      setViewingSeguimiento(response.data);
      setOpenViewDialog(true);
    } catch (error) {
      console.error('Error fetching seguimiento details:', error);
    }
  };



  const getProgressColor = (estado: string) => {
    switch (estado) {
      case 'terminado': return 'success';
      case 'iniciado': return 'info';
      default: return 'info';
    }
  };

  const isOverdue = (seguimiento: Seguimiento) => {
    if (!seguimiento.fecha_final || seguimiento.estado === 'terminado') return false;
    return new Date(seguimiento.fecha_final) < new Date();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Seguimiento SST
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Gestión y seguimiento de casos de seguridad y salud en el trabajo
        </Typography>

        {/* Alertas de Seguimientos Vencidos */}
        {seguimientos.some(s => isOverdue(s)) && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Hay {seguimientos.filter(s => isOverdue(s)).length} seguimiento(s) vencido(s) que requieren atención.
            </Typography>
          </Alert>
        )}

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Buscar"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Trabajador, programa..."
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Programa</InputLabel>
                  <Select
                    value={filters.programa}
                    onChange={(e) => handleFilterChange('programa', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {programas.map((programa) => (
                      <MenuItem key={programa.value} value={programa.value}>
                        {programa.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.estado}
                    onChange={(e) => handleFilterChange('estado', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Object.entries(estadosConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Valoración de Riesgo</InputLabel>
                  <Select
                    value={filters.valoracion_riesgo}
                    onChange={(e) => handleFilterChange('valoracion_riesgo', e.target.value)}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {valoracionesRiesgo.map((valoracion) => (
                      <MenuItem key={valoracion.value} value={valoracion.value}>
                        {valoracion.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Trabajador</InputLabel>
                  <Select
                    value={filters.worker}
                    onChange={(e) => handleFilterChange('worker', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {workers.map((worker) => (
                      <MenuItem key={worker.id} value={worker.id.toString()}>
                        {worker.first_name} {worker.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Box display="flex" gap={1}>
                  <Tooltip title="Actualizar">
                    <IconButton onClick={fetchSeguimientos}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Nuevo Seguimiento
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de Seguimientos */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Trabajador</TableCell>
                    <TableCell>Programa</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell>Valoración Riesgo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Inicio</TableCell>
                    <TableCell>Fecha Final</TableCell>
                    <TableCell>Observación</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        Cargando seguimientos...
                      </TableCell>
                    </TableRow>
                  ) : seguimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No se encontraron seguimientos
                      </TableCell>
                    </TableRow>
                  ) : (
                    seguimientos.map((seguimiento) => (
                      <TableRow 
                        key={seguimiento.id}
                        sx={{
                          backgroundColor: isOverdue(seguimiento) ? 'error.light' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {seguimiento.nombre_trabajador}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {seguimiento.cedula}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {programas.find(p => p.value === seguimiento.programa)?.icon}
                            <Chip
                              label={programas.find(p => p.value === seguimiento.programa)?.label || seguimiento.programa}
                              color={programas.find(p => p.value === seguimiento.programa)?.color as any || 'default'}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {seguimiento.cargo}
                          </Typography>
                          {seguimiento.fecha_ingreso && (
                            <Typography variant="caption" color="text.secondary">
                              Ingreso: {formatDate(seguimiento.fecha_ingreso)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={valoracionesRiesgo.find(v => v.value === seguimiento.valoracion_riesgo)?.label || seguimiento.valoracion_riesgo}
                            color={valoracionesRiesgo.find(v => v.value === seguimiento.valoracion_riesgo)?.color as any || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {estadosConfig[seguimiento.estado as keyof typeof estadosConfig]?.icon}
                            <Chip
                              label={estadosConfig[seguimiento.estado as keyof typeof estadosConfig]?.label}
                              color={estadosConfig[seguimiento.estado as keyof typeof estadosConfig]?.color as any}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {seguimiento.fecha_inicio ? formatDate(seguimiento.fecha_inicio) : 'No definida'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {seguimiento.fecha_final ? formatDate(seguimiento.fecha_final) : 'No definida'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {seguimiento.observacion ? 
                              (seguimiento.observacion.length > 50 ? 
                                seguimiento.observacion.substring(0, 50) + '...' : 
                                seguimiento.observacion
                              ) : 'Sin observaciones'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                onClick={() => handleViewSeguimiento(seguimiento)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(seguimiento)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSeguimiento(seguimiento.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog para Crear/Editar Seguimiento */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingSeguimiento ? 'Editar Seguimiento' : 'Nuevo Seguimiento'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Trabajador</InputLabel>
                  <Select
                    value={formData.worker_id}
                    onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                  >
                    {workers.map((worker) => (
                      <MenuItem key={worker.id} value={worker.id.toString()}>
                        {worker.first_name} {worker.last_name} - {worker.document_number}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Programa</InputLabel>
                  <Select
                    value={formData.programa}
                    onChange={(e) => setFormData({ ...formData, programa: e.target.value as any })}
                  >
                    {programas.map((programa) => (
                      <MenuItem key={programa.value} value={programa.value}>
                        {programa.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  >
                    {Object.entries(estadosConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Valoración de Riesgo</InputLabel>
                  <Select
                    value={formData.valoracion_riesgo}
                    onChange={(e) => setFormData({ ...formData, valoracion_riesgo: e.target.value as any })}
                  >
                    {valoracionesRiesgo.map((valoracion) => (
                      <MenuItem key={valoracion.value} value={valoracion.value}>
                        {valoracion.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Fecha de Inicio"
                  value={formData.fecha_inicio}
                  onChange={(date) => setFormData({ ...formData, fecha_inicio: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Fecha Final"
                  value={formData.fecha_final}
                  onChange={(date) => setFormData({ ...formData, fecha_final: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Motivo de Inclusión"
                  multiline
                  rows={2}
                  value={formData.motivo_inclusion}
                  onChange={(e) => setFormData({ ...formData, motivo_inclusion: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Observación"
                  multiline
                  rows={3}
                  value={formData.observacion}
                  onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Conclusiones Ocupacionales"
                  multiline
                  rows={3}
                  value={formData.conclusiones_ocupacionales}
                  onChange={(e) => setFormData({ ...formData, conclusiones_ocupacionales: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Conductas Ocupacionales a Prevenir"
                  multiline
                  rows={3}
                  value={formData.conductas_ocupacionales_prevenir}
                  onChange={(e) => setFormData({ ...formData, conductas_ocupacionales_prevenir: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Recomendaciones Generales"
                  multiline
                  rows={3}
                  value={formData.recomendaciones_generales}
                  onChange={(e) => setFormData({ ...formData, recomendaciones_generales: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Observaciones del Examen"
                  multiline
                  rows={3}
                  value={formData.observaciones_examen}
                  onChange={(e) => setFormData({ ...formData, observaciones_examen: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Comentario"
                  multiline
                  rows={2}
                  value={formData.comentario}
                  onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button 
              onClick={handleSaveSeguimiento} 
              variant="contained"
              disabled={!formData.worker_id || !formData.programa || !formData.estado}
            >
              {editingSeguimiento ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Ver Detalles del Seguimiento */}
        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Detalles del Seguimiento
          </DialogTitle>
          <DialogContent>
            {viewingSeguimiento && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Información General
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2">Trabajador:</Typography>
                            <Typography variant="body2">{viewingSeguimiento.nombre_trabajador}</Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2">Cédula:</Typography>
                            <Typography variant="body2">{viewingSeguimiento.cedula}</Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2">Cargo:</Typography>
                            <Typography variant="body2">{viewingSeguimiento.cargo}</Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2">Programa:</Typography>
                            <Typography variant="body2">{viewingSeguimiento.programa}</Typography>
                          </Grid>
                          {viewingSeguimiento.fecha_ingreso && (
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="subtitle2">Fecha de Ingreso:</Typography>
                              <Typography variant="body2">{formatDate(viewingSeguimiento.fecha_ingreso)}</Typography>
                            </Grid>
                          )}
                          {viewingSeguimiento.motivo_inclusion && (
                            <Grid size={12}>
                              <Typography variant="subtitle2">Motivo de Inclusión:</Typography>
                              <Typography variant="body2">{viewingSeguimiento.motivo_inclusion}</Typography>
                            </Grid>
                          )}
                          {viewingSeguimiento.observacion && (
                            <Grid size={12}>
                              <Typography variant="subtitle2">Observación:</Typography>
                              <Typography variant="body2">{viewingSeguimiento.observacion}</Typography>
                            </Grid>
                          )}
                          {viewingSeguimiento.conclusiones_ocupacionales && (
                            <Grid size={12}>
                              <Typography variant="subtitle2">Conclusiones Ocupacionales:</Typography>
                              <Typography variant="body2">{viewingSeguimiento.conclusiones_ocupacionales}</Typography>
                            </Grid>
                          )}
                          {viewingSeguimiento.conductas_ocupacionales_prevenir && (
                            <Grid size={12}>
                              <Typography variant="subtitle2">Conductas Ocupacionales a Prevenir:</Typography>
                              <Typography variant="body2">{viewingSeguimiento.conductas_ocupacionales_prevenir}</Typography>
                            </Grid>
                          )}
                          {viewingSeguimiento.recomendaciones_generales && (
                            <Grid size={12}>
                              <Typography variant="subtitle2">Recomendaciones Generales:</Typography>
                              <Typography variant="body2">{viewingSeguimiento.recomendaciones_generales}</Typography>
                            </Grid>
                          )}
                          {viewingSeguimiento.observaciones_examen && (
                            <Grid size={12}>
                              <Typography variant="subtitle2">Observaciones del Examen:</Typography>
                              <Typography variant="body2">{viewingSeguimiento.observaciones_examen}</Typography>
                            </Grid>
                          )}
                          {viewingSeguimiento.comentario && (
                            <Grid size={12}>
                              <Typography variant="subtitle2">Comentario:</Typography>
                              <Typography variant="body2">{viewingSeguimiento.comentario}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Estado y Progreso
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={2}>
                          <Box display="flex" gap={1}>
                            <Chip
                              label={programas.find(p => p.value === viewingSeguimiento.programa)?.label || viewingSeguimiento.programa}
                              color={programas.find(p => p.value === viewingSeguimiento.programa)?.color as any || 'default'}
                            />
                          </Box>
                          {viewingSeguimiento.valoracion_riesgo && (
                            <Box display="flex" gap={1}>
                              <Chip
                                label={valoracionesRiesgo.find(v => v.value === viewingSeguimiento.valoracion_riesgo)?.label || viewingSeguimiento.valoracion_riesgo}
                                color={valoracionesRiesgo.find(v => v.value === viewingSeguimiento.valoracion_riesgo)?.color as any || 'default'}
                              />
                            </Box>
                          )}
                          <Box display="flex" gap={1}>
                            <Chip
                              label={estadosConfig[viewingSeguimiento.estado as keyof typeof estadosConfig]?.label}
                              color={estadosConfig[viewingSeguimiento.estado as keyof typeof estadosConfig]?.color as any}
                              icon={estadosConfig[viewingSeguimiento.estado as keyof typeof estadosConfig]?.icon}
                            />
                          </Box>
                          {viewingSeguimiento.fecha_inicio && (
                            <Box>
                              <Typography variant="subtitle2">Fecha de Inicio:</Typography>
                              <Typography variant="body2">{formatDate(viewingSeguimiento.fecha_inicio)}</Typography>
                            </Box>
                          )}
                          {viewingSeguimiento.fecha_final && (
                            <Box>
                              <Typography variant="subtitle2">Fecha Final:</Typography>
                              <Typography variant="body2">{formatDate(viewingSeguimiento.fecha_final)}</Typography>
                            </Box>
                          )}
                          <Box>
                            <Typography variant="subtitle2">Creado:</Typography>
                            <Typography variant="body2">{formatDateTime(viewingSeguimiento.created_at)}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2">Última Actualización:</Typography>
                            <Typography variant="body2">{formatDateTime(viewingSeguimiento.updated_at)}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  {/* Sección de historial de acciones comentada temporalmente - no incluida en la nueva estructura de datos */}
                  {/* 
                  <Grid size={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6">
                            Historial de Acciones
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenActionDialog(true)}
                          >
                            Agregar Acción
                          </Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary" align="center">
                          Funcionalidad de acciones pendiente de implementación
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  */}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Agregar Acción - Comentado temporalmente, no incluido en la nueva estructura de datos */}
        {/*
        <Dialog open={openActionDialog} onClose={() => setOpenActionDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Agregar Acción
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Acción</InputLabel>
                  <Select
                    value={actionFormData.action_type}
                    onChange={(e) => setActionFormData({ ...actionFormData, action_type: e.target.value as any })}
                  >
                    {actionTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  multiline
                  rows={3}
                  value={actionFormData.description}
                  onChange={(e) => setActionFormData({ ...actionFormData, description: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Responsable"
                  value={actionFormData.responsible}
                  onChange={(e) => setActionFormData({ ...actionFormData, responsible: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Resultado"
                  multiline
                  rows={2}
                  value={actionFormData.result}
                  onChange={(e) => setActionFormData({ ...actionFormData, result: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Próxima Acción"
                  multiline
                  rows={2}
                  value={actionFormData.next_action}
                  onChange={(e) => setActionFormData({ ...actionFormData, next_action: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenActionDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleAddAction} 
              variant="contained"
              disabled={!actionFormData.description || !actionFormData.responsible}
            >
              Agregar
            </Button>
          </DialogActions>
        </Dialog>
        */}

        {/* Diálogo de Confirmación para Eliminar */}
        <Dialog
          open={confirmDialog.open}
          onClose={handleCancelDelete}
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
        >
          <DialogTitle id="confirm-dialog-title">
            Confirmar Eliminación
          </DialogTitle>
          <DialogContent>
            <Typography id="confirm-dialog-description">
              ¿Está seguro de que desea eliminar este seguimiento? Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="primary">
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Seguimiento;