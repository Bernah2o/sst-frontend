import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompleteIcon,
  CheckCircle,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
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
  TablePagination,
  Tooltip,
  Avatar,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Menu,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import React, { useState, useEffect, useCallback } from 'react';

import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { logger } from '../utils/logger';

interface Reinduction {
  id: number;
  worker_id: number;
  year: number;
  due_date: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'exempted';
  assigned_course_id?: number;
  enrollment_id?: number;
  scheduled_date?: string;
  completed_date?: string;
  first_notification_sent?: string;
  reminder_notification_sent?: string;
  overdue_notification_sent?: string;
  notes?: string;
  exemption_reason?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  is_overdue: boolean;
  days_until_due: number;
  needs_notification: boolean;
  worker_name: string;
  course_title?: string;
  enrollment_status?: string;
}

interface Worker {
  id: number;
  // Campos nuevos
  first_name: string;
  last_name: string;
  document_number: string;
  // Campos legacy para compatibilidad
  nombre: string;
  apellido: string;
  documento: string;
  cedula: string;
  cargo: string;
  area: string;
}





const Reinduction: React.FC = () => {
  const { user } = useAuth();
  const [reinductions, setReinductions] = useState<Reinduction[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReinduction, setEditingReinduction] = useState<Reinduction | null>(null);
  const [viewingReinduction, setViewingReinduction] = useState<Reinduction | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    worker: '',
    year: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    worker_id: '',
    year: new Date().getFullYear(),
    due_date: null as Date | null,
    status: 'pending' as string,
    assigned_course_id: '',
    scheduled_date: null as Date | null,
    notes: '',
    exemption_reason: ''
  });
  const [enrollConfirmDialog, setEnrollConfirmDialog] = useState({ open: false, reinductionId: null as number | null });
  const [notificationConfirmDialog, setNotificationConfirmDialog] = useState({ open: false, workerId: null as number | null });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReinduction, setSelectedReinduction] = useState<Reinduction | null>(null);

  const statusConfig = {
    pending: { label: 'Pendiente', color: 'default', icon: <PendingIcon /> },
    scheduled: { label: 'Programada', color: 'info', icon: <ScheduleIcon /> },
    in_progress: { label: 'En Progreso', color: 'warning', icon: <ScheduleIcon /> },
    completed: { label: 'Completada', color: 'success', icon: <CompleteIcon /> },
    overdue: { label: 'Vencida', color: 'error', icon: <CancelIcon /> },
    exempted: { label: 'Exenta', color: 'secondary', icon: <CheckCircle /> }
  };



  const fetchReinductions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const skip = page * rowsPerPage;
      params.append('skip', skip.toString());
      params.append('limit', rowsPerPage.toString());
      
      if (filters.status) params.append('status', filters.status);
      if (filters.worker) params.append('worker_id', filters.worker);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/reinduction/records?${params.toString()}`);
      setReinductions(response.data || []);
      
      // Get total count for pagination
      if (page === 0 && !filters.status && !filters.worker && !filters.search) {
        // For first page without filters, try to get a larger sample to estimate total
        const countParams = new URLSearchParams();
        countParams.append('skip', '0');
        countParams.append('limit', '1000');
        try {
          const countResponse = await api.get(`/reinduction/records?${countParams.toString()}`);
          setTotalCount(countResponse.data.length);
        } catch {
          // Fallback: estimate based on current page
          setTotalCount(response.data.length < rowsPerPage ? response.data.length : (page + 1) * rowsPerPage + 1);
        }
      } else {
        // Estimate total count based on current page results
        setTotalCount(response.data.length < rowsPerPage ? page * rowsPerPage + response.data.length : (page + 1) * rowsPerPage + 1);
      }
    } catch (error) {
      logger.error('Error fetching reinductions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters.status, filters.worker, filters.search]);

  useEffect(() => {
    fetchReinductions();
    fetchWorkers();
  }, [page, rowsPerPage]);

  // Debounce effect for search filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReinductions();
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [filters, fetchReinductions]);

  // Effect for non-search filters (immediate)
  useEffect(() => {
    if (filters.status || filters.worker || filters.year) {
      fetchReinductions();
    }
  }, [filters.status, filters.worker, filters.year, fetchReinductions]);

  // Auto-refresh when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchReinductions();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchReinductions]);

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/workers/');
      setWorkers(response.data);
    } catch (error) {
      logger.error('Error fetching workers:', error);
    }
  };





  const handleSaveReinduction = async () => {
    try {
      const payload = {
        ...formData,
        worker_id: parseInt(formData.worker_id),
        assigned_course_id: formData.assigned_course_id ? parseInt(formData.assigned_course_id) : null,
        due_date: formData.due_date?.toISOString().split('T')[0],
        scheduled_date: formData.scheduled_date?.toISOString().split('T')[0]
      };

      if (editingReinduction) {
        await api.put(`/reinduction/records/${editingReinduction.id}`, payload);
      } else {
        await api.post('/reinduction/records', payload);
      }
      fetchReinductions();
      handleCloseDialog();
    } catch (error) {
      logger.error('Error saving reinduction:', error);
    }
  };

  const handleEnrollWorker = (id: number) => {
    setEnrollConfirmDialog({ open: true, reinductionId: id });
  };

  const handleConfirmEnroll = async () => {
    if (enrollConfirmDialog.reinductionId) {
      try {
        await api.post(`/reinduction/records/${enrollConfirmDialog.reinductionId}/enroll`);
        fetchReinductions();
      } catch (error) {
        logger.error('Error enrolling worker:', error);
      }
    }
    setEnrollConfirmDialog({ open: false, reinductionId: null });
  };

  const handleCancelEnroll = () => {
    setEnrollConfirmDialog({ open: false, reinductionId: null });
  };

  const handleSendNotification = (workerId: number) => {
    setNotificationConfirmDialog({ open: true, workerId });
  };

  const handleConfirmSendNotification = async () => {
    if (notificationConfirmDialog.workerId) {
      try {
        await api.post(`/reinduction/send-anniversary-notification/${notificationConfirmDialog.workerId}`);
        fetchReinductions();
      } catch (error) {
        logger.error('Error sending notification:', error);
      }
    }
    setNotificationConfirmDialog({ open: false, workerId: null });
  };

  const handleCancelSendNotification = () => {
    setNotificationConfirmDialog({ open: false, workerId: null });
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (reinduction?: Reinduction) => {
    if (reinduction) {
      setEditingReinduction(reinduction);
      setFormData({
        worker_id: reinduction.worker_id.toString(),
        year: reinduction.year,
        due_date: new Date(reinduction.due_date),
        status: reinduction.status,
        assigned_course_id: reinduction.assigned_course_id?.toString() || '',
        scheduled_date: reinduction.scheduled_date ? new Date(reinduction.scheduled_date) : null,
        notes: reinduction.notes || '',
        exemption_reason: reinduction.exemption_reason || ''
      });
    } else {
      setEditingReinduction(null);
      setFormData({
        worker_id: '',
        year: new Date().getFullYear(),
        due_date: null,
        status: 'pending',
        assigned_course_id: '',
        scheduled_date: null,
        notes: '',
        exemption_reason: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingReinduction(null);
  };

  const handleViewReinduction = (reinduction: Reinduction) => {
    setViewingReinduction(reinduction);
    setOpenViewDialog(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reinduction: Reinduction) => {
    setAnchorEl(event.currentTarget);
    setSelectedReinduction(reinduction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReinduction(null);
  };

  const handleMenuAction = (action: string) => {
    if (!selectedReinduction) return;
    
    switch (action) {
      case 'view':
        handleViewReinduction(selectedReinduction);
        break;
      case 'edit':
        handleOpenDialog(selectedReinduction);
        break;
      case 'enroll':
        handleEnrollWorker(selectedReinduction.id);
        break;
      case 'notify':
        handleSendNotification(selectedReinduction.worker_id);
        break;
    }
    handleMenuClose();
  };

  const getDaysUntilDueColor = (days: number): 'default' | 'warning' | 'error' | 'success' => {
    if (days < 0) return 'error'; // Vencida
    if (days <= 30) return 'warning'; // Próxima a vencer
    return 'success'; // A tiempo
  };



  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reinducción SST
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Gestión de procesos de reinducción en seguridad y salud en el trabajo
        </Typography>

        {/* Alertas de Reinduciones Vencidas */}
        {reinductions.some(r => r.is_overdue) && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Hay {reinductions.filter(r => r.is_overdue).length} reinducción(es) vencida(s) que requieren atención.
            </Typography>
          </Alert>
        )}

        {/* Resumen Estadístico */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {reinductions.filter(r => r.status === 'completed').length}
              </Typography>
              <Typography variant="body2">
                Completadas
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {reinductions.filter(r => r.status === 'pending').length}
              </Typography>
              <Typography variant="body2">
                Pendientes
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {reinductions.filter(r => r.is_overdue).length}
              </Typography>
              <Typography variant="body2">
                Vencidas
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {reinductions.length}
              </Typography>
              <Typography variant="body2">
                Total
              </Typography>
            </Card>
          </Grid>
        </Grid>
        
        {/* Alertas de Notificaciones Pendientes */}
        {reinductions.some(r => r.needs_notification) && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Hay {reinductions.filter(r => r.needs_notification).length} trabajador(es) que requieren notificación.
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
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Buscar trabajador"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Nombre completo o número de documento"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  helperText="Busca por nombre completo o documento"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Año</InputLabel>
                  <Select
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="2024">2024</MenuItem>
                    <MenuItem value="2025">2025</MenuItem>
                    <MenuItem value="2026">2026</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
                  <Tooltip title="Actualizar">
                    <IconButton size="small" onClick={fetchReinductions}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Completados">
                    <IconButton
                      size="small"
                      color={filters.status === 'completed' ? 'success' : 'default'}
                      onClick={() => handleFilterChange('status', filters.status === 'completed' ? '' : 'completed')}
                    >
                      <CompleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Pendientes">
                    <IconButton
                      size="small"
                      color={filters.status === 'pending' ? 'warning' : 'default'}
                      onClick={() => handleFilterChange('status', filters.status === 'pending' ? '' : 'pending')}
                    >
                      <PendingIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ ml: 1 }}
                  >
                    Nueva
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de Reinduciones */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Trabajador</TableCell>
                    <TableCell>Año</TableCell>
                    <TableCell>Fecha Vencimiento</TableCell>
                    <TableCell>Curso Asignado</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Días Restantes</TableCell>
                    <TableCell>Notificaciones</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Cargando reinduciones...
                      </TableCell>
                    </TableRow>
                  ) : reinductions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No se encontraron reinduciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    reinductions.map((reinduction) => (
                      <TableRow 
                        key={reinduction.id}
                        sx={{
                          backgroundColor: reinduction.status === 'completed' 
                            ? 'success.light' 
                            : reinduction.is_overdue 
                            ? 'error.light' 
                            : 'inherit',
                          '&:hover': {
                            backgroundColor: reinduction.status === 'completed' 
                              ? 'success.main' 
                              : reinduction.is_overdue 
                              ? 'error.main' 
                              : 'action.hover',
                          },
                          opacity: reinduction.status === 'completed' ? 0.9 : 1
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box position="relative">
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {reinduction.worker_name.charAt(0)}
                              </Avatar>
                              {reinduction.status === 'completed' && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    backgroundColor: 'success.main',
                                    borderRadius: '50%',
                                    width: 16,
                                    height: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <CompleteIcon sx={{ fontSize: 10, color: 'white' }} />
                                </Box>
                              )}
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {reinduction.worker_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {reinduction.worker_id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {reinduction.year}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2"
                            color={reinduction.is_overdue ? 'error' : 'text.primary'}
                          >
                            {formatDate(reinduction.due_date)}
                          </Typography>
                          {reinduction.scheduled_date && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Programada: {formatDate(reinduction.scheduled_date)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {reinduction.course_title || 'No asignado'}
                          </Typography>
                          {reinduction.enrollment_status && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Estado: {reinduction.enrollment_status}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {statusConfig[reinduction.status as keyof typeof statusConfig]?.icon}
                            <Chip
                              label={statusConfig[reinduction.status as keyof typeof statusConfig]?.label}
                              color={statusConfig[reinduction.status as keyof typeof statusConfig]?.color as any}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${reinduction.days_until_due} días`}
                            color={getDaysUntilDueColor(reinduction.days_until_due)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            {reinduction.needs_notification && (
                              <Chip
                                label="Requiere notificación"
                                color="warning"
                                size="small"
                              />
                            )}
                            {reinduction.first_notification_sent && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Primera: {formatDate(reinduction.first_notification_sent)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1} alignItems="center">
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                onClick={() => handleViewReinduction(reinduction)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Más acciones">
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, reinduction)}
                              >
                                <MoreVertIcon />
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
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
            />
          </CardContent>
        </Card>

        {/* Menú de acciones */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleMenuAction('view')}>
            <ViewIcon sx={{ mr: 1 }} />
            Ver detalles
          </MenuItem>
          <MenuItem onClick={() => handleMenuAction('edit')}>
            <EditIcon sx={{ mr: 1 }} />
            Editar
          </MenuItem>
          {selectedReinduction?.status === 'pending' && (
            <MenuItem onClick={() => handleMenuAction('enroll')}>
              <AssignmentIcon sx={{ mr: 1 }} />
              Inscribir trabajador
            </MenuItem>
          )}
          {selectedReinduction?.needs_notification && (
            <MenuItem onClick={() => handleMenuAction('notify')}>
              <RefreshIcon sx={{ mr: 1 }} />
              Enviar notificación
            </MenuItem>
          )}
        </Menu>

        {/* Dialog para Crear/Editar Reinducción */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingReinduction ? 'Editar Reinducción' : 'Nueva Reinducción'}
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
                        {worker.first_name || worker.nombre} {worker.last_name || worker.apellido} - {worker.document_number || worker.cedula}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Año"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  inputProps={{ min: 2020, max: 2030 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Fecha de Vencimiento"
                  value={formData.due_date}
                  onChange={(date) => setFormData({ ...formData, due_date: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Fecha Programada"
                  value={formData.scheduled_date}
                  onChange={(date) => setFormData({ ...formData, scheduled_date: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Estado"
                  >
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="scheduled">Programada</MenuItem>
                    <MenuItem value="in_progress">En Progreso</MenuItem>
                    <MenuItem value="completed">Completada</MenuItem>
                    <MenuItem value="overdue">Vencida</MenuItem>
                    <MenuItem value="exempted">Exenta</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="ID del Curso Asignado"
                  value={formData.assigned_course_id}
                  onChange={(e) => setFormData({ ...formData, assigned_course_id: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Razón de Exención"
                  value={formData.exemption_reason}
                  onChange={(e) => setFormData({ ...formData, exemption_reason: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button 
              onClick={handleSaveReinduction} 
              variant="contained"
              disabled={!formData.worker_id || !formData.due_date}
            >
              {editingReinduction ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Ver Detalles de la Reinducción */}
        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Detalles de la Reinducción
          </DialogTitle>
          <DialogContent>
            {viewingReinduction && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Información del Trabajador
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary="Nombre" 
                              secondary={viewingReinduction.worker_name} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="ID del Trabajador" 
                              secondary={viewingReinduction.worker_id} 
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Información de la Reinducción
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary="Año" 
                              secondary={viewingReinduction.year} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Fecha de Vencimiento" 
                              secondary={formatDate(viewingReinduction.due_date)} 
                            />
                          </ListItem>
                          {viewingReinduction.scheduled_date && (
                            <ListItem>
                              <ListItemText 
                                primary="Fecha Programada" 
                                secondary={formatDate(viewingReinduction.scheduled_date)} 
                              />
                            </ListItem>
                          )}
                          {viewingReinduction.completed_date && (
                            <ListItem>
                              <ListItemText 
                                primary="Fecha de Finalización" 
                                secondary={formatDate(viewingReinduction.completed_date)} 
                              />
                            </ListItem>
                          )}
                          {viewingReinduction.course_title && (
                            <ListItem>
                              <ListItemText 
                                primary="Curso Asignado" 
                                secondary={viewingReinduction.course_title} 
                              />
                            </ListItem>
                          )}
                          {viewingReinduction.enrollment_status && (
                            <ListItem>
                              <ListItemText 
                                primary="Estado del Enrollment" 
                                secondary={viewingReinduction.enrollment_status} 
                              />
                            </ListItem>
                          )}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Progreso y Estado
                        </Typography>
                        <Box display="flex" gap={2} mb={2}>
                          <Chip
                            label={statusConfig[viewingReinduction.status as keyof typeof statusConfig]?.label}
                            color={statusConfig[viewingReinduction.status as keyof typeof statusConfig]?.color as any}
                            icon={statusConfig[viewingReinduction.status as keyof typeof statusConfig]?.icon}
                          />
                          {viewingReinduction.is_overdue && (
                            <Chip
                              label="Vencida"
                              color="error"
                              size="small"
                            />
                          )}
                        </Box>
                        
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary="Días hasta vencimiento" 
                              secondary={viewingReinduction.days_until_due > 0 ? 
                                `${viewingReinduction.days_until_due} días` : 
                                viewingReinduction.days_until_due === 0 ? 'Vence hoy' : 
                                `Vencida hace ${Math.abs(viewingReinduction.days_until_due)} días`
                              } 
                            />
                          </ListItem>
                          {viewingReinduction.needs_notification && (
                            <ListItem>
                              <ListItemText 
                                primary="Notificación" 
                                secondary="Requiere notificación" 
                              />
                            </ListItem>
                          )}
                          <ListItem>
                            <ListItemText 
                              primary="Creado" 
                              secondary={formatDate(viewingReinduction.created_at)} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Última actualización" 
                              secondary={formatDate(viewingReinduction.updated_at)} 
                            />
                          </ListItem>
                        </List>

                      </CardContent>
                    </Card>
                  </Grid>

                  {viewingReinduction.notes && (
                    <Grid size={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Observaciones
                          </Typography>

                          {viewingReinduction.notes && (
                            <Box>
                              <Typography variant="subtitle2">
                                Notas:
                              </Typography>
                              <Typography variant="body2">
                                {viewingReinduction.notes}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Confirmación para Inscribir Trabajador */}
        <Dialog
          open={enrollConfirmDialog.open}
          onClose={handleCancelEnroll}
          aria-labelledby="enroll-confirm-dialog-title"
          aria-describedby="enroll-confirm-dialog-description"
        >
          <DialogTitle id="enroll-confirm-dialog-title">
            Confirmar Inscripción
          </DialogTitle>
          <DialogContent>
            <Typography id="enroll-confirm-dialog-description">
              ¿Está seguro de que desea inscribir al trabajador en el curso de reinducción? Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelEnroll} color="primary">
              Cancelar
            </Button>
            <Button onClick={handleConfirmEnroll} color="primary" variant="contained">
              Inscribir
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Confirmación para Enviar Notificación */}
        <Dialog
          open={notificationConfirmDialog.open}
          onClose={handleCancelSendNotification}
          aria-labelledby="notification-confirm-dialog-title"
          aria-describedby="notification-confirm-dialog-description"
        >
          <DialogTitle id="notification-confirm-dialog-title">
            Confirmar Envío de Notificación
          </DialogTitle>
          <DialogContent>
            <Typography id="notification-confirm-dialog-description">
              ¿Está seguro de que desea enviar la notificación de aniversario? Esta acción enviará un correo electrónico al trabajador.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelSendNotification} color="primary">
              Cancelar
            </Button>
            <Button onClick={handleConfirmSendNotification} color="primary" variant="contained">
              Enviar Notificación
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Reinduction;