import React, { useState, useEffect } from 'react';
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
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import {
  Send as SendIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Assessment as StatsIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import adminNotificationsService from '../services/adminNotificationsService';
import {
  WorkerNotification,
  NotificationStatistics,
  ExamStatus,
  ExamNotificationType,
  NotificationStatus,
  BulkAction,
  NotificationAcknowledgment,
  NotificationFilters,
} from '../types/adminNotifications';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminNotifications: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<WorkerNotification[]>([]);
  const [acknowledgments, setAcknowledgments] = useState<NotificationAcknowledgment[]>([]);
  const [statistics, setStatistics] = useState<NotificationStatistics | null>(null);
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [filters, setFilters] = useState<NotificationFilters>({ limit: 25, skip: 0 });
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [totalAcknowledgments, setTotalAcknowledgments] = useState(0);
  
  // Estados para diálogos
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [suppressDialogOpen, setSuppressDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  
  // Estados para formularios
  const [notificationType, setNotificationType] = useState<ExamNotificationType>(ExamNotificationType.REMINDER);
  const [forceSend, setForceSend] = useState(false);
  const [suppressReason, setSuppressReason] = useState('');
  const [bulkAction, setBulkAction] = useState<BulkAction>(BulkAction.SEND);
  
  // Estados para mensajes
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Verificar permisos de administrador
  useEffect(() => {
    if (user?.role !== 'admin') {
      setSnackbar({
        open: true,
        message: 'No tienes permisos para acceder a esta funcionalidad',
        severity: 'error'
      });
    }
  }, [user]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user, filters, tabValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tabValue === 0) {
        // Cargar trabajadores y estadísticas
        const [workersResponse, statsResponse] = await Promise.all([
          adminNotificationsService.getExamNotifications(filters),
          adminNotificationsService.getStatistics()
        ]);
        setWorkers(workersResponse.items);
        setTotalWorkers(workersResponse.total);
        setStatistics(statsResponse);
      } else if (tabValue === 1) {
        // Cargar confirmaciones
        const acknowledgementsResponse = await adminNotificationsService.getAcknowledgments({
          skip: filters.skip,
          limit: filters.limit
        });
        setAcknowledgments(acknowledgementsResponse.items);
        setTotalAcknowledgments(acknowledgementsResponse.total);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Resetear estados en caso de error
      if (tabValue === 0) {
        setWorkers([]);
        setTotalWorkers(0);
        setStatistics(null);
      } else if (tabValue === 1) {
        setAcknowledgments([]);
        setTotalAcknowledgments(0);
      }
      setSnackbar({
        open: true,
        message: 'Error al cargar los datos',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedWorkers([]);
    setFilters({ limit: 25, skip: 0 });
  };

  const handleWorkerSelection = (workerId: number) => {
    setSelectedWorkers(prev => 
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const handleSelectAll = () => {
    if (!workers || workers.length === 0) return;
    
    if (selectedWorkers.length === workers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(workers.map(w => w.worker_id));
    }
  };

  const handleSendNotifications = async () => {
    if (selectedWorkers.length === 0) {
      setSnackbar({
        open: true,
        message: 'Selecciona al menos un trabajador',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await adminNotificationsService.sendNotifications({
        worker_ids: selectedWorkers,
        notification_type: notificationType,
        force_send: forceSend
      });

      setSnackbar({
        open: true,
        message: `Notificaciones enviadas: ${response.success_count} exitosas, ${response.failed_count} fallidas`,
        severity: response.failed_count > 0 ? 'warning' : 'success'
      });

      setSendDialogOpen(false);
      setSelectedWorkers([]);
      loadData();
    } catch (error) {
      console.error('Error sending notifications:', error);
      setSnackbar({
        open: true,
        message: 'Error al enviar notificaciones',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuppressNotifications = async () => {
    if (selectedWorkers.length === 0) {
      setSnackbar({
        open: true,
        message: 'Selecciona al menos un trabajador',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await adminNotificationsService.suppressNotifications({
        worker_ids: selectedWorkers,
        notification_type: notificationType,
        reason: suppressReason
      });

      setSnackbar({
        open: true,
        message: `Notificaciones suprimidas: ${response.success_count} exitosas, ${response.failed_count} fallidas`,
        severity: response.failed_count > 0 ? 'warning' : 'success'
      });

      setSuppressDialogOpen(false);
      setSelectedWorkers([]);
      setSuppressReason('');
      loadData();
    } catch (error) {
      console.error('Error suppressing notifications:', error);
      setSnackbar({
        open: true,
        message: 'Error al suprimir notificaciones',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAcknowledgment = async (acknowledgmentId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta confirmación?')) {
      return;
    }

    setLoading(true);
    try {
      await adminNotificationsService.deleteAcknowledgment(acknowledgmentId);
      setSnackbar({
        open: true,
        message: 'Confirmación eliminada exitosamente',
        severity: 'success'
      });
      loadData();
    } catch (error) {
      console.error('Error deleting acknowledgment:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar la confirmación',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, skip: newPage * (prev.limit || 25) }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setFilters(prev => ({ ...prev, limit: newLimit, skip: 0 }));
  };

  const getExamStatusColor = (status: ExamStatus) => {
    switch (status) {
      case ExamStatus.AL_DIA:
        return 'success';
      case ExamStatus.PROXIMO_A_VENCER:
        return 'warning';
      case ExamStatus.VENCIDO:
        return 'error';
      case ExamStatus.SIN_EXAMENES:
        return 'info';
      default:
        return 'default';
    }
  };

  const getExamStatusLabel = (status: ExamStatus) => {
    switch (status) {
      case ExamStatus.AL_DIA:
        return 'Al día';
      case ExamStatus.PROXIMO_A_VENCER:
        return 'Próximo a vencer';
      case ExamStatus.VENCIDO:
        return 'Vencido';
      case ExamStatus.SIN_EXAMENES:
        return 'Sin exámenes';
      default:
        return status;
    }
  };

  const getNotificationTypeLabel = (type: ExamNotificationType) => {
    switch (type) {
      case ExamNotificationType.FIRST_NOTIFICATION:
        return 'Primera notificación';
      case ExamNotificationType.REMINDER:
        return 'Recordatorio';
      case ExamNotificationType.OVERDUE:
        return 'Vencido';
      default:
        return type;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a esta funcionalidad.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Administración de Notificaciones
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Gestiona las notificaciones de exámenes ocupacionales de forma manual y controla el envío automático.
      </Typography>

      {/* Estadísticas */}
      {statistics && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Estadísticas de Notificaciones
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StatsIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{statistics.total_workers}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Trabajadores
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{statistics.workers_with_overdue_exams}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Exámenes Vencidos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{statistics.workers_with_upcoming_exams}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Próximos a Vencer
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon color="info" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{statistics.total_notifications_sent_today}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enviadas Hoy
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Notificaciones de Trabajadores" />
          <Tab label="Historial de Confirmaciones" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Notificaciones de Trabajadores */}
      <TabPanel value={tabValue} index={0}>
        {/* Filtros y Acciones */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Estado del Examen</InputLabel>
                <Select
                  value={filters.exam_status || ''}
                  label="Estado del Examen"
                  onChange={(e) => setFilters(prev => ({ ...prev, exam_status: e.target.value as ExamStatus || undefined }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value={ExamStatus.SIN_EXAMENES}>Sin exámenes</MenuItem>
                  <MenuItem value={ExamStatus.VENCIDO}>Vencido</MenuItem>
                  <MenuItem value={ExamStatus.PROXIMO_A_VENCER}>Próximo a vencer</MenuItem>
                  <MenuItem value={ExamStatus.AL_DIA}>Al día</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Con Email</InputLabel>
                <Select
                  value={filters.has_email?.toString() || ''}
                  label="Con Email"
                  onChange={(e) => setFilters(prev => ({ ...prev, has_email: e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Con email</MenuItem>
                  <MenuItem value="false">Sin email</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                size="small"
                label="Cargo"
                value={filters.position || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value || undefined }))}
                sx={{ minWidth: 200 }}
              />
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
              >
                Actualizar
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setSendDialogOpen(true)}
                disabled={selectedWorkers.length === 0 || loading}
                size="small"
              >
                Enviar ({selectedWorkers.length})
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<BlockIcon />}
                onClick={() => setSuppressDialogOpen(true)}
                disabled={selectedWorkers.length === 0 || loading}
                size="small"
              >
                Suprimir ({selectedWorkers.length})
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Tabla de Trabajadores */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedWorkers.length > 0 && selectedWorkers.length < (workers?.length || 0)}
                    checked={(workers?.length || 0) > 0 && selectedWorkers.length === (workers?.length || 0)}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Trabajador</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Estado Examen</TableCell>
                <TableCell>Próximo Examen</TableCell>
                <TableCell>Días</TableCell>
                <TableCell>Notificaciones</TableCell>
                <TableCell>Confirmaciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !workers || workers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No se encontraron trabajadores
                  </TableCell>
                </TableRow>
              ) : (
                workers.map((worker) => (
                  <TableRow key={worker.worker_id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedWorkers.includes(worker.worker_id)}
                        onChange={() => handleWorkerSelection(worker.worker_id)}
                      />
                    </TableCell>
                    <TableCell>{worker.worker_name}</TableCell>
                    <TableCell>{worker.worker_document}</TableCell>
                    <TableCell>{worker.worker_position}</TableCell>
                    <TableCell>
                      {worker.worker_email ? (
                        <Chip
                          icon={<EmailIcon />}
                          label={worker.worker_email}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ) : (
                        <Chip label="Sin email" size="small" color="error" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getExamStatusLabel(worker.exam_status)}
                        color={getExamStatusColor(worker.exam_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {worker.next_exam_date ? new Date(worker.next_exam_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {worker.days_until_exam !== null ? (
                        <Chip
                          label={worker.days_until_exam}
                          color={worker.days_until_exam < 0 ? 'error' : worker.days_until_exam < 30 ? 'warning' : 'success'}
                          size="small"
                        />
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {worker.notification_types_sent.map((type) => (
                          <Chip
                            key={type}
                            label={getNotificationTypeLabel(type)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={worker.acknowledgment_count}
                        color={worker.acknowledgment_count > 0 ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <TablePagination
            component="div"
            count={totalWorkers}
            page={Math.floor((filters.skip || 0) / (filters.limit || 25))}
            onPageChange={handlePageChange}
            rowsPerPage={filters.limit || 25}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </TableContainer>
      </TabPanel>

      {/* Tab Panel 1: Historial de Confirmaciones */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Trabajador</TableCell>
                <TableCell>Tipo de Notificación</TableCell>
                <TableCell>Fecha de Confirmación</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Razón</TableCell>
                <TableCell>Detiene Notificaciones</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : acknowledgments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No se encontraron confirmaciones
                  </TableCell>
                </TableRow>
              ) : (
                acknowledgments.map((ack) => (
                  <TableRow key={ack.id}>
                    <TableCell>{ack.worker_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={getNotificationTypeLabel(ack.notification_type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(ack.acknowledged_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{ack.ip_address || 'N/A'}</TableCell>
                    <TableCell>{ack.reason || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={ack.stops_notifications ? <CheckCircleIcon /> : undefined}
                        label={ack.stops_notifications ? 'Sí' : 'No'}
                        color={ack.stops_notifications ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Eliminar confirmación">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAcknowledgment(ack.id)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <TablePagination
            component="div"
            count={totalAcknowledgments}
            page={Math.floor((filters.skip || 0) / (filters.limit || 25))}
            onPageChange={handlePageChange}
            rowsPerPage={filters.limit || 25}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </TableContainer>
      </TabPanel>

      {/* Diálogo para Enviar Notificaciones */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enviar Notificaciones</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Se enviarán notificaciones a {selectedWorkers.length} trabajador(es) seleccionado(s).
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo de Notificación</InputLabel>
              <Select
                value={notificationType}
                label="Tipo de Notificación"
                onChange={(e) => setNotificationType(e.target.value as ExamNotificationType)}
              >
                <MenuItem value={ExamNotificationType.FIRST_NOTIFICATION}>Primera notificación</MenuItem>
                <MenuItem value={ExamNotificationType.REMINDER}>Recordatorio</MenuItem>
                <MenuItem value={ExamNotificationType.OVERDUE}>Vencido</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={forceSend}
                  onChange={(e) => setForceSend(e.target.checked)}
                />
              }
              label="Forzar envío (enviar aunque ya haya confirmación)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSendNotifications}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Suprimir Notificaciones */}
      <Dialog open={suppressDialogOpen} onClose={() => setSuppressDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Suprimir Notificaciones</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Se suprimirán las notificaciones para {selectedWorkers.length} trabajador(es) seleccionado(s).
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo de Notificación</InputLabel>
              <Select
                value={notificationType}
                label="Tipo de Notificación"
                onChange={(e) => setNotificationType(e.target.value as ExamNotificationType)}
              >
                <MenuItem value={ExamNotificationType.FIRST_NOTIFICATION}>Primera notificación</MenuItem>
                <MenuItem value={ExamNotificationType.REMINDER}>Recordatorio</MenuItem>
                <MenuItem value={ExamNotificationType.OVERDUE}>Vencido</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Razón (opcional)"
              value={suppressReason}
              onChange={(e) => setSuppressReason(e.target.value)}
              placeholder="Ej: Trabajador ya tiene examen programado"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuppressDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSuppressNotifications}
            variant="contained"
            color="warning"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <BlockIcon />}
          >
            Suprimir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminNotifications;