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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  BeachAccess as VacationIcon,
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as DownloadIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import vacationService, { VacationRequestWithWorker, VacationUpdate } from '../services/vacationService';
import { useAuth } from '../contexts/AuthContext';

const VacationsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vacationRequests, setVacationRequests] = useState<VacationRequestWithWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' 
  });
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);

  // Estados para edición y eliminación
  const [editingRequest, setEditingRequest] = useState<VacationRequestWithWorker | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<VacationRequestWithWorker | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequestForMenu, setSelectedRequestForMenu] = useState<VacationRequestWithWorker | null>(null);

  // Estados para el formulario de edición
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    comments: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected' | 'cancelled'
  });

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

  // Funciones para edición
  const handleEditRequest = (request: VacationRequestWithWorker) => {
    setEditingRequest(request);
    setEditForm({
      start_date: format(new Date(request.start_date), 'yyyy-MM-dd'),
      end_date: format(new Date(request.end_date), 'yyyy-MM-dd'),
      comments: request.comments || '',
      status: request.status
    });
    setOpenEditDialog(true);
    setAnchorEl(null);
  };

  const handleUpdateRequest = async () => {
    if (!editingRequest) return;

    try {
      const updateData: VacationUpdate = {
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        comments: editForm.comments,
        status: editForm.status
      };

      await vacationService.updateVacationRequest(editingRequest.worker_id, editingRequest.id, updateData);
      
      setSnackbar({
        open: true,
        message: 'Solicitud actualizada exitosamente',
        severity: 'success'
      });
      
      setOpenEditDialog(false);
      setEditingRequest(null);
      fetchVacationRequests();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al actualizar la solicitud',
        severity: 'error'
      });
    }
  };

  // Funciones para eliminación
  const handleDeleteRequest = (request: VacationRequestWithWorker) => {
    setRequestToDelete(request);
    setDeleteConfirmOpen(true);
    setAnchorEl(null);
  };

  const confirmDeleteRequest = async () => {
    if (!requestToDelete) return;

    try {
      await vacationService.deleteVacationRequest(requestToDelete.worker_id, requestToDelete.id);
      
      setSnackbar({
        open: true,
        message: 'Solicitud eliminada exitosamente',
        severity: 'success'
      });
      
      setDeleteConfirmOpen(false);
      setRequestToDelete(null);
      fetchVacationRequests();
    } catch (error: any) {
      let errorMessage = 'Error al eliminar la solicitud';
      
      // Extraer mensaje específico del backend si está disponible
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Funciones para el menú
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, request: VacationRequestWithWorker) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequestForMenu(request);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequestForMenu(null);
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
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'cancelled': return 'Cancelada';
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
                        <MenuItem value="cancelled">Canceladas</MenuItem>
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
                            <Tooltip title="Más opciones">
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuClick(e, request)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Tooltip>
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
          {/* Solo mostrar opciones de administrador si el usuario es admin */}
          {user?.role === 'admin' && (
            <>
              <MenuItem onClick={() => selectedRequestForMenu && handleEditRequest(selectedRequestForMenu)}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Editar solicitud</ListItemText>
              </MenuItem>
              <MenuItem 
                onClick={() => selectedRequestForMenu && handleDeleteRequest(selectedRequestForMenu)}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Eliminar solicitud</ListItemText>
              </MenuItem>
            </>
          )}
          {/* Si no hay opciones disponibles, mostrar mensaje */}
          {user?.role !== 'admin' && (
            <MenuItem disabled>
              <ListItemText>No hay acciones disponibles</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Diálogo de edición */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Solicitud de Vacaciones</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Trabajador: {editingRequest?.worker_name}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Inicio"
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Fin"
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Motivo"
                    multiline
                    rows={3}
                    value={editForm.comments}
                    onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
                  />
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={editForm.status}
                      label="Estado"
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    >
                      <MenuItem value="pending">Pendiente</MenuItem>
                       <MenuItem value="approved">Aprobada</MenuItem>
                       <MenuItem value="rejected">Rechazada</MenuItem>
                       <MenuItem value="cancelled">Cancelada</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateRequest} 
              variant="contained"
              disabled={!editForm.start_date || !editForm.end_date}
            >
              Actualizar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmación de eliminación */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas eliminar la solicitud de vacaciones de{' '}
              <strong>{requestToDelete?.worker_name}</strong> del{' '}
              {requestToDelete && format(new Date(requestToDelete.start_date), 'dd/MM/yyyy', { locale: es })}{' '}
              al {requestToDelete && format(new Date(requestToDelete.end_date), 'dd/MM/yyyy', { locale: es })}?
            </Typography>
            
            {/* Información sobre el estado actual */}
            {requestToDelete && (
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Estado actual: {requestToDelete.status === 'pending' ? 'Pendiente' : 
                                 requestToDelete.status === 'approved' ? 'Aprobada' : 
                                 requestToDelete.status === 'rejected' ? 'Rechazada' : 'Cancelada'}
                </Typography>
                <Typography variant="body2">
                  <strong>Nota:</strong> Como administrador, puedes eliminar solicitudes en cualquier estado.
                </Typography>
              </Alert>
            )}
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              La solicitud será eliminada permanentemente del sistema y no se podrá recuperar.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmDeleteRequest} 
              variant="contained" 
              color="error"
            >
              Eliminar solicitud
            </Button>
          </DialogActions>
        </Dialog>

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