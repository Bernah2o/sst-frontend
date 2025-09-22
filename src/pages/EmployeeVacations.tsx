import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  BeachAccess,
  Add,
  CalendarToday,
  CheckCircle,
  Pending,
  Cancel,
  Event,
  Warning,
  Person,
  DateRange,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format, differenceInDays, isWeekend, eachDayOfInterval } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import vacationService from '../services/vacationService';
import type { WorkerVacation, VacationBalance, VacationAvailability } from '../services/vacationService';

interface VacationRequest extends WorkerVacation {
  // Using the WorkerVacation interface from the service
}

interface VacationBalanceDisplay {
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
}

interface Notification {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const EmployeeVacations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Estados
  const [vacationRequests, setVacationRequests] = useState<WorkerVacation[]>([]);
  const [vacationBalance, setVacationBalance] = useState<VacationBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Estados del formulario
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estados para diálogo de conflictos
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{
    conflicts: Array<{
      worker_name: string;
      start_date: string;
      end_date: string;
    }>;
    requestedDates: {
      start: string;
      end: string;
    };
  } | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchVacationData();
  }, []);

  const fetchVacationData = async () => {
    try {
      setLoading(true);
      const [requests, balance] = await Promise.all([
        vacationService.getEmployeeVacationRequests(),
        vacationService.getEmployeeVacationBalance()
      ]);
      setVacationRequests(requests);
      setVacationBalance(balance);
    } catch (error) {
      console.error('Error fetching vacation data:', error);
      showNotification('Error al cargar los datos de vacaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateBusinessDays = (start: Date, end: Date): number => {
    const days = eachDayOfInterval({ start, end });
    return days.filter(day => !isWeekend(day)).length;
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setStartDate(null);
    setEndDate(null);
    setReason('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setStartDate(null);
    setEndDate(null);
    setReason('');
  };

  const handleSubmitRequest = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      showNotification('Por favor complete todos los campos', 'warning');
      return;
    }

    if (startDate >= endDate) {
      showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'warning');
      return;
    }

    const workingDays = calculateBusinessDays(startDate, endDate);
    
    if (vacationBalance && workingDays > vacationBalance.available_days) {
      showNotification(`No tiene suficientes días disponibles. Días solicitados: ${workingDays}, Días disponibles: ${vacationBalance.available_days}`, 'warning');
      return;
    }

    try {
      setSubmitting(true);
      
      // Verificar disponibilidad de fechas
      const currentWorker = await vacationService.getCurrentWorker();
      const availability: VacationAvailability = await vacationService.checkAvailability(
        currentWorker.id,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );

      if (!availability.available) {
        // Configurar datos del conflicto para el diálogo
        setConflictData({
          conflicts: availability.conflicts,
          requestedDates: {
            start: format(startDate, 'yyyy-MM-dd'),
            end: format(endDate, 'yyyy-MM-dd')
          }
        });
        
        // Mostrar diálogo de conflictos
        setConflictDialogOpen(true);
        return;
      }

      await vacationService.createEmployeeVacationRequest({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        working_days: workingDays,
        reason: reason.trim()
      });

      showNotification('Solicitud de vacaciones enviada exitosamente', 'success');
      handleCloseDialog();
      fetchVacationData(); // Recargar datos
    } catch (error) {
      console.error('Error creating vacation request:', error);
      showNotification('Error al enviar la solicitud de vacaciones', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'pending': return <Pending />;
      default: return <Event />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'pending': return 'Pendiente';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <BeachAccess sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Mis Vacaciones
          </Typography>
        </Box>

        {/* Balance de Vacaciones */}
        {vacationBalance && (
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday />
                Balance de Vacaciones {vacationBalance.year}
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {vacationBalance.total_days}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Días Totales
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {vacationBalance.used_days}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Días Utilizados
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {vacationBalance.available_days}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Días Disponibles
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Botón Nueva Solicitud */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            sx={{
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
            }}
          >
            Nueva Solicitud
          </Button>
        </Box>

        {/* Tabla de Solicitudes */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Historial de Solicitudes
            </Typography>
            {vacationRequests.length === 0 ? (
              <Alert severity="info">
                No tienes solicitudes de vacaciones registradas.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha Inicio</TableCell>
                      <TableCell>Fecha Fin</TableCell>
                      <TableCell>Días Hábiles</TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha Solicitud</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vacationRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {format(new Date(request.start_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.end_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          {calculateBusinessDays(new Date(request.start_date), new Date(request.end_date))}
                        </TableCell>
                        <TableCell>{request.reason}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(request.status)}
                            label={getStatusText(request.status)}
                            color={getStatusColor(request.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Dialog Nueva Solicitud */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            Nueva Solicitud de Vacaciones
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Fecha de Inicio"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                    minDate={new Date()}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Fecha de Fin"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                    minDate={startDate || new Date()}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Motivo de la Solicitud"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    required
                    placeholder="Describe el motivo de tu solicitud de vacaciones..."
                  />
                </Grid>
                {startDate && endDate && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info">
                      Días hábiles solicitados: {calculateBusinessDays(startDate, endDate)}
                      {vacationBalance && (
                        <br />
                      )}
                      Días disponibles: {vacationBalance?.available_days || 0}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitRequest}
              variant="contained"
              disabled={submitting || !startDate || !endDate || !reason.trim()}
            >
              {submitting ? <CircularProgress size={20} /> : 'Enviar Solicitud'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Conflictos de Fechas */}
        <Dialog
          open={conflictDialogOpen}
          onClose={() => setConflictDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            backgroundColor: 'warning.light',
            color: 'warning.contrastText'
          }}>
            <Warning />
            Conflicto de Fechas Detectado
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {conflictData && (
              <Box>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    Las fechas que has seleccionado no están disponibles debido a conflictos con otras solicitudes de vacaciones ya aprobadas o pendientes.
                  </Typography>
                </Alert>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DateRange color="primary" />
                    Fechas Solicitadas
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="body1">
                      <strong>Desde:</strong> {format(new Date(conflictData.requestedDates.start), 'dd/MM/yyyy')}
                      {' '}
                      <strong>Hasta:</strong> {format(new Date(conflictData.requestedDates.end), 'dd/MM/yyyy')}
                    </Typography>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="error" />
                    Conflictos Detectados
                  </Typography>
                  {conflictData.conflicts.map((conflict, index) => (
                    <Paper 
                      key={index} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        border: '1px solid',
                        borderColor: 'error.light',
                        backgroundColor: 'error.lighter'
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="subtitle2" color="error.main">
                            <Person sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                            {conflict.worker_name}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <Typography variant="body2">
                            <strong>Período:</strong> {format(new Date(conflict.start_date), 'dd/MM/yyyy')} - {format(new Date(conflict.end_date), 'dd/MM/yyyy')}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Sugerencia:</strong> Por favor, selecciona fechas diferentes que no se solapen con las solicitudes existentes. 
                    Puedes consultar con tu supervisor o recursos humanos para conocer la disponibilidad de fechas.
                  </Typography>
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setConflictDialogOpen(false)}
              variant="contained"
              color="primary"
              fullWidth={isMobile}
            >
              Entendido
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notificaciones */}
        {notification && (
          <Snackbar
            open={notification.open}
            autoHideDuration={6000}
            onClose={() => setNotification({ ...notification, open: false })}
          >
            <Alert 
              onClose={() => setNotification({ ...notification, open: false })} 
              severity={notification.severity}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default EmployeeVacations;