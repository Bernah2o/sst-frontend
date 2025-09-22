import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  BeachAccess as VacationIcon,
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import vacationService, { VacationRequestWithWorker } from '../services/vacationService';

const VacationsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [vacationRequests, setVacationRequests] = useState<VacationRequestWithWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<VacationRequestWithWorker | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' 
  });
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchVacationRequests();
  }, []);

  const fetchVacationRequests = async () => {
    try {
      setLoading(true);
      const requests = await vacationService.getAllVacationRequests();
      setVacationRequests(requests);
    } catch (error) {
      console.error('Error fetching vacation requests:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar las solicitudes de vacaciones',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewWorker = (workerId: number) => {
    navigate(`/admin/workers/${workerId}/vacations`);
  };

  const handleApprove = async (request: VacationRequestWithWorker) => {
    try {
      await vacationService.approveVacation(request.worker_id, request.id);
      setSnackbar({
        open: true,
        message: 'Solicitud aprobada exitosamente',
        severity: 'success'
      });
      fetchVacationRequests();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al aprobar la solicitud',
        severity: 'error'
      });
    }
  };

  const handleReject = async (request: VacationRequestWithWorker) => {
    try {
      await vacationService.rejectVacation(request.worker_id, request.id);
      setSnackbar({
        open: true,
        message: 'Solicitud rechazada exitosamente',
        severity: 'success'
      });
      fetchVacationRequests();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al rechazar la solicitud',
        severity: 'error'
      });
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      const params: any = {};
      
      if (startDateFilter) {
        params.start_date = format(startDateFilter, 'yyyy-MM-dd');
      }
      if (endDateFilter) {
        params.end_date = format(endDateFilter, 'yyyy-MM-dd');
      }
      if (filter !== 'all') {
        params.status = filter;
      }

      const blob = await vacationService.exportVacationsToExcel(params);
      
      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generar nombre del archivo con fecha actual
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      link.download = `vacaciones_${currentDate}.xlsx`;
      
      // Simular click para descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
      
      setSnackbar({
        open: true,
        message: 'Archivo Excel exportado exitosamente',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al exportar el archivo Excel',
        severity: 'error'
      });
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return status;
    }
  };

  const filteredRequests = vacationRequests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = request.worker_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VacationIcon />
          Gestión de Vacaciones
        </Typography>

        <Grid container spacing={3}>
          {/* Filtros y búsqueda */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Filtros y Exportación
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Buscar trabajador"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Estado</InputLabel>
                      <Select
                        value={filter}
                        label="Estado"
                        onChange={(e) => setFilter(e.target.value as any)}
                      >
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="pending">Pendientes</MenuItem>
                        <MenuItem value="approved">Aprobadas</MenuItem>
                        <MenuItem value="rejected">Rechazadas</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <DatePicker
                      label="Fecha Inicio"
                      value={startDateFilter}
                      onChange={setStartDateFilter}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small'
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <DatePicker
                      label="Fecha Fin"
                      value={endDateFilter}
                      onChange={setEndDateFilter}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small'
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 1.5 }}>
                    <Button
                      variant="outlined"
                      startIcon={<FilterIcon />}
                      onClick={fetchVacationRequests}
                      fullWidth
                      size="small"
                    >
                      Actualizar
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, md: 1.5 }}>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportToExcel}
                      disabled={exporting}
                      fullWidth
                      size="small"
                      sx={{
                        background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1B5E20 30%, #388E3C 90%)',
                        }
                      }}
                    >
                      {exporting ? <CircularProgress size={16} color="inherit" /> : 'Excel'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

        {/* Tabla de solicitudes */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Solicitudes de Vacaciones
              </Typography>
              
              {filteredRequests.length === 0 ? (
                <Alert severity="info">
                  No hay solicitudes de vacaciones para mostrar.
                </Alert>
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Trabajador</TableCell>
                        <TableCell>Fecha Inicio</TableCell>
                        <TableCell>Fecha Fin</TableCell>
                        <TableCell>Días</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Fecha Solicitud</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.worker_name}</TableCell>
                          <TableCell>
                            {format(new Date(request.start_date), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(request.end_date), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                          <TableCell>{request.days_requested}</TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(request.status)}
                              color={getStatusColor(request.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Ver detalles del trabajador">
                              <IconButton
                                size="small"
                                onClick={() => handleViewWorker(request.worker_id)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {request.status === 'pending' && (
                              <>
                                <Tooltip title="Aprobar">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleApprove(request)}
                                  >
                                    <ApproveIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Rechazar">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleReject(request)}
                                  >
                                    <RejectIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
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

export default VacationsManagement;