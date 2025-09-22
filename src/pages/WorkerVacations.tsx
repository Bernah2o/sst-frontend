import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,

  Chip,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CalendarToday as Calendar,
  Event as EventIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Pending as PendingIcon,
  Info as InfoIcon,
  DateRange as DateRangeIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format, differenceInDays, isWeekend, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useParams } from 'react-router-dom';

// Services and types
import vacationService from '../services/vacationService';
import {
  WorkerVacation,
  VacationRequest,
  VacationApproval,
  VacationBalance,
  VacationStats,
  VacationAvailability
} from '../types/worker';

// Interfaces
interface WorkerVacationsProps {
  workerId?: string;
  isAdmin?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isOccupied: boolean;
  isPending: boolean;
  isSelected: boolean;
  occupiedBy?: string;
}

const WorkerVacations: React.FC<WorkerVacationsProps> = ({ workerId: propWorkerId, isAdmin = false }) => {
  const { workerId: paramWorkerId } = useParams<{ workerId: string }>();
  const workerId = propWorkerId || paramWorkerId;
  
  // Estados principales
  const [vacationRequests, setVacationRequests] = useState<WorkerVacation[]>([]);
  const [vacationBalance, setVacationBalance] = useState<VacationBalance | null>(null);
  const [vacationStats, setVacationStats] = useState<VacationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estados para el diálogo de nueva solicitud
  const [openDialog, setOpenDialog] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  
  // Estados para el calendario
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Cargar datos iniciales
  useEffect(() => {
    fetchVacationData();
    generateCalendarDays();
  }, [workerId, currentDate]);

  const fetchVacationData = async () => {
    if (!workerId) return;
    
    try {
      setLoading(true);
      
      const workerIdNum = parseInt(workerId);
      const [requests, balance, stats] = await Promise.all([
        vacationService.getWorkerVacations(workerIdNum),
        vacationService.getVacationBalance(workerIdNum),
        vacationService.getVacationStats(workerIdNum)
      ]);
      
      setVacationRequests(requests);
      setVacationBalance(balance);
      setVacationStats(stats);
    } catch (error) {
      console.error('Error fetching vacation data:', error);
      showSnackbar('Error al cargar los datos de vacaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    const calendarDays: CalendarDay[] = days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const occupiedRequest = vacationRequests.find(req => 
        req.status === 'approved' && 
        dateStr >= req.start_date && 
        dateStr <= req.end_date
      );
      const pendingRequest = vacationRequests.find(req => 
        req.status === 'pending' && 
        dateStr >= req.start_date && 
        dateStr <= req.end_date
      );
      
      return {
        date,
        isCurrentMonth: true,
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
        isWeekend: isWeekend(date),
        isOccupied: !!occupiedRequest,
        isPending: !!pendingRequest,
        isSelected: selectedRange.start && selectedRange.end ? 
          date >= selectedRange.start && date <= selectedRange.end : false,
        occupiedBy: occupiedRequest ? `Worker ${occupiedRequest.worker_id}` : undefined
      };
    });
    
    setCalendarDays(calendarDays);
  };

  const handleDateClick = (date: Date) => {
    if (isWeekend(date) || date < new Date()) return;
    
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date, end: null });
    } else if (selectedRange.start && !selectedRange.end) {
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start });
      } else {
        setSelectedRange({ start: selectedRange.start, end: date });
      }
    }
  };

  const handleNewRequest = () => {
    if (selectedRange.start && selectedRange.end) {
      setStartDate(selectedRange.start);
      setEndDate(selectedRange.end);
    }
    setOpenDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!startDate || !endDate || !reason.trim() || !workerId) {
      showSnackbar('Por favor completa todos los campos', 'warning');
      return;
    }
    
    const days = differenceInDays(endDate, startDate) + 1;
    const weekendDays = eachDayOfInterval({ start: startDate, end: endDate })
      .filter(date => isWeekend(date)).length;
    const workingDays = days - weekendDays;
    
    if (vacationBalance && workingDays > vacationBalance.available_days) {
      showSnackbar('No tienes suficientes días de vacaciones disponibles', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const requestData: VacationRequest = {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        reason
      };
      
      const newRequest = await vacationService.createVacationRequest(parseInt(workerId), requestData);
      
      setVacationRequests(prev => [...prev, newRequest]);
      setOpenDialog(false);
      setStartDate(null);
      setEndDate(null);
      setReason('');
      setSelectedRange({ start: null, end: null });
      
      // Actualizar balance después de crear la solicitud
      await fetchVacationData();
      
      showSnackbar('Solicitud de vacaciones enviada correctamente', 'success');
      
    } catch (error) {
      console.error('Error creating vacation request:', error);
      showSnackbar('Error al enviar la solicitud', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    if (!workerId) return;
    
    try {
      const approvalData: VacationApproval = {
        status: 'approved',
        admin_comments: 'Aprobado por administrador'
      };
      
      await vacationService.approveVacationRequest(parseInt(workerId), requestId, approvalData);
      
      // Actualizar la lista local
      setVacationRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved', admin_comments: approvalData.admin_comments }
            : req
        )
      );
      
      // Actualizar balance después de la aprobación
      await fetchVacationData();
      
      showSnackbar('Solicitud aprobada correctamente', 'success');
    } catch (error) {
      console.error('Error approving vacation request:', error);
      showSnackbar('Error al aprobar la solicitud', 'error');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!workerId) return;
    
    try {
      const rejectionData: VacationApproval = {
        status: 'rejected',
        admin_comments: 'No aprobado por administración'
      };
      
      await vacationService.approveVacationRequest(parseInt(workerId), requestId, rejectionData);
      
      // Actualizar la lista local
      setVacationRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected', admin_comments: rejectionData.admin_comments }
            : req
        )
      );
      
      // Actualizar balance después del rechazo
      await fetchVacationData();
      
      showSnackbar('Solicitud rechazada', 'warning');
    } catch (error) {
      console.error('Error rejecting vacation request:', error);
      showSnackbar('Error al rechazar la solicitud', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning') => {
    setSnackbar({ open: true, message, severity });
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
      case 'approved': return <CheckIcon />;
      case 'rejected': return <CloseIcon />;
      case 'pending': return <PendingIcon />;
      default: return <InfoIcon />;
    }
  };

  const filteredRequests = vacationRequests.filter(req => 
    statusFilter === 'all' || req.status === statusFilter
  );

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
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Gestión de Vacaciones
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewRequest}
            disabled={!vacationBalance || vacationBalance.available_days <= 0}
            sx={{ borderRadius: 2 }}
          >
            Nueva Solicitud
          </Button>
        </Box>

        {/* Balance de Vacaciones */}
        {vacationBalance && (
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Balance de Vacaciones
              </Typography>
              <Box display="flex" gap={2} justifyContent="space-around">
                <Box textAlign="center" flex={1}>
                  <Typography variant="h3" fontWeight="bold">{vacationBalance.total_days}</Typography>
                  <Typography variant="body2">Total</Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h3" fontWeight="bold" color="error.light">{vacationBalance.used_days}</Typography>
                  <Typography variant="body2">Usados</Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h3" fontWeight="bold" color="success.light">{vacationBalance.available_days}</Typography>
                  <Typography variant="body2">Disponibles</Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h3" fontWeight="bold" color="info.light">{vacationBalance.year}</Typography>
                  <Typography variant="body2">Año</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
          {/* Calendario */}
          <Box flex={{ xs: 1, md: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    <Calendar sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Calendario de Vacaciones
                  </Typography>
                  <Box>
                    <Button onClick={() => setCurrentDate(addDays(currentDate, -30))}>‹</Button>
                    <Typography variant="h6" component="span" sx={{ mx: 2 }}>
                      {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </Typography>
                    <Button onClick={() => setCurrentDate(addDays(currentDate, 30))}>›</Button>
                  </Box>
                </Box>
                
                {/* Leyenda */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Chip size="small" label="Disponible" sx={{ bgcolor: 'success.light', color: 'white' }} />
                  <Chip size="small" label="Ocupado" sx={{ bgcolor: 'error.light', color: 'white' }} />
                  <Chip size="small" label="Pendiente" sx={{ bgcolor: 'warning.light', color: 'white' }} />
                  <Chip size="small" label="Seleccionado" sx={{ bgcolor: 'primary.light', color: 'white' }} />
                  <Chip size="small" label="Fin de semana" sx={{ bgcolor: 'grey.400', color: 'white' }} />
                </Box>

                {/* Grid del calendario */}
                <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <Box key={day}>
                      <Typography variant="body2" textAlign="center" fontWeight="bold" color="text.secondary">
                        {day}
                      </Typography>
                    </Box>
                  ))}
                  {calendarDays.map((day, index) => (
                    <Box key={index}>
                      <Paper
                        sx={{
                          p: 1,
                          textAlign: 'center',
                          cursor: day.isWeekend || day.date < new Date() ? 'not-allowed' : 'pointer',
                          bgcolor: day.isSelected ? 'primary.light' :
                                  day.isOccupied ? 'error.light' :
                                  day.isPending ? 'warning.light' :
                                  day.isWeekend ? 'grey.300' : 'background.paper',
                          color: day.isSelected || day.isOccupied || day.isPending ? 'white' : 'text.primary',
                          border: day.isToday ? '2px solid' : '1px solid',
                          borderColor: day.isToday ? 'primary.main' : 'divider',
                          '&:hover': {
                            bgcolor: day.isWeekend || day.date < new Date() ? undefined : 'action.hover'
                          }
                        }}
                        onClick={() => handleDateClick(day.date)}
                      >
                        <Typography variant="body2">
                          {format(day.date, 'd')}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Lista de Solicitudes */}
          <Box flex={{ xs: 1, md: 1 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Solicitudes
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Estado"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="pending">Pendientes</MenuItem>
                      <MenuItem value="approved">Aprobadas</MenuItem>
                      <MenuItem value="rejected">Rechazadas</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <List>
                  {filteredRequests.map((request, index) => (
                    <React.Fragment key={request.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Badge
                            badgeContent={request.days_requested}
                            color="primary"
                            sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                          >
                            {getStatusIcon(request.status)}
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="bold">
                                {format(new Date(request.start_date), 'dd/MM')} - {format(new Date(request.end_date), 'dd/MM')}
                              </Typography>
                              <Chip
                                size="small"
                                label={request.status}
                                color={getStatusColor(request.status) as any}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {request.reason}
                              </Typography>
                              {isAdmin && request.status === 'pending' && (
                                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleApproveRequest(request.id)}
                                  >
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleRejectRequest(request.id)}
                                  >
                                    Rechazar
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < filteredRequests.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {filteredRequests.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No hay solicitudes"
                        secondary="No se encontraron solicitudes con los filtros aplicados"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Diálogo para nueva solicitud */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <DateRangeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Nueva Solicitud de Vacaciones
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" gap={2}>
                  <DatePicker
                    label="Fecha de inicio"
                    value={startDate}
                    onChange={setStartDate}
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true
                      }
                    }}
                  />
                  <DatePicker
                    label="Fecha de fin"
                    value={endDate}
                    onChange={setEndDate}
                    minDate={startDate || new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true
                      }
                    }}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Motivo de la solicitud"
                  multiline
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe el motivo de tu solicitud de vacaciones..."
                />
                {startDate && endDate && (
                  <Alert severity="info">
                    <Typography variant="body2">
                      Días solicitados: {differenceInDays(endDate, startDate) + 1} 
                      (excluyendo fines de semana: {differenceInDays(endDate, startDate) + 1 - 
                      eachDayOfInterval({ start: startDate, end: endDate }).filter(date => isWeekend(date)).length})
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmitRequest}
              variant="contained"
              disabled={submitting || !startDate || !endDate || !reason.trim()}
            >
              {submitting ? <CircularProgress size={20} /> : 'Enviar Solicitud'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificaciones */}
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
    </LocalizationProvider>
  );
};

export default WorkerVacations;