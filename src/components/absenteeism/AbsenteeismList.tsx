import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TablePagination,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePermissions } from '../../hooks/usePermissions';
import { absenteeismService } from '../../services/absenteeismService';
import {
  AbsenteeismListResponse,
  AbsenteeismFilters,
  EventTypeEnum,
  MonthEnum,
  EVENT_TYPE_OPTIONS,
  MONTH_OPTIONS
} from '../../types/absenteeism';
import { PaginatedResponse } from '../../types/common';

const AbsenteeismList: React.FC = () => {
  const navigate = useNavigate();
  const { canUpdateWorkers, canViewWorkersPage } = usePermissions();
  
  const [absenteeisms, setAbsenteeisms] = useState<AbsenteeismListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAbsenteeism, setSelectedAbsenteeism] = useState<AbsenteeismListResponse | null>(null);
  
  const [filters, setFilters] = useState<AbsenteeismFilters>({
    worker_id: undefined,
    event_type: undefined,
    event_month: undefined,
    start_date_from: undefined,
    start_date_to: undefined,
    year: new Date().getFullYear()
  });

  const loadAbsenteeisms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: PaginatedResponse<AbsenteeismListResponse> = await absenteeismService.getAbsenteeisms(
        page + 1,
        rowsPerPage,
        filters
      );
      
      setAbsenteeisms(response.items);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudieron cargar los registros de ausentismo. Verifique su conexión e intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewWorkersPage()) {
      loadAbsenteeisms();
    }
  }, [page, rowsPerPage, filters, canViewWorkersPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof AbsenteeismFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      worker_id: undefined,
      event_type: undefined,
      event_month: undefined,
      start_date_from: undefined,
      start_date_to: undefined,
      year: new Date().getFullYear()
    });
    setPage(0);
  };

  const handleDelete = async () => {
    if (!selectedAbsenteeism) return;
    
    try {
      await absenteeismService.deleteAbsenteeism(selectedAbsenteeism.id);
      setDeleteDialogOpen(false);
      setSelectedAbsenteeism(null);
      loadAbsenteeisms();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar el registro');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await absenteeismService.exportAbsenteeisms(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `absenteeism_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError('Error al exportar los datos');
    }
  };

  const getEventTypeColor = (eventType: EventTypeEnum) => {
    switch (eventType) {
      case EventTypeEnum.ACCIDENTE_TRABAJO:
        return 'error';
      case EventTypeEnum.ENFERMEDAD_LABORAL:
        return 'warning';
      case EventTypeEnum.ACCIDENTE_COMUN:
        return 'info';
      case EventTypeEnum.ENFERMEDAD_GENERAL:
        return 'default';
      default:
        return 'default';
    }
  };

  if (!canViewWorkersPage()) {
    return (
      <Alert severity="error">
        No tienes permisos para ver los registros de absenteeism.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Absenteeism
        </Typography>
        <Box>
          <Button
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
          >
            Filtros
          </Button>
          <Button
            startIcon={<ExportIcon />}
            onClick={handleExport}
            sx={{ mr: 1 }}
          >
            Exportar
          </Button>
          {canUpdateWorkers() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/absenteeism/new')}
            >
              Nuevo Registro
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Evento</InputLabel>
                  <Select
                    value={filters.event_type || ''}
                    onChange={(e) => handleFilterChange('event_type', e.target.value || undefined)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {EVENT_TYPE_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Mes del Evento</InputLabel>
                  <Select
                    value={filters.event_month || ''}
                    onChange={(e) => handleFilterChange('event_month', e.target.value || undefined)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {MONTH_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  label="Año"
                  type="number"
                  value={filters.year || ''}
                  onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  label="Fecha Desde"
                  type="date"
                  value={filters.start_date_from || ''}
                  onChange={(e) => handleFilterChange('start_date_from', e.target.value || undefined)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  label="Fecha Hasta"
                  type="date"
                  value={filters.start_date_to || ''}
                  onChange={(e) => handleFilterChange('start_date_to', e.target.value || undefined)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Box mt={2}>
              <Button onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Trabajador</TableCell>
                      <TableCell>Cédula</TableCell>
                      <TableCell>Cargo</TableCell>
                      <TableCell>Tipo de Evento</TableCell>
                      <TableCell>Mes</TableCell>
                      <TableCell>Período</TableCell>
                      <TableCell>Días Totales</TableCell>
                      <TableCell>Salario Base</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {absenteeisms.map((absenteeism) => (
                      <TableRow key={absenteeism.id}>
                        <TableCell>{absenteeism.worker_name}</TableCell>
                        <TableCell>{absenteeism.cedula}</TableCell>
                        <TableCell>{absenteeism.position}</TableCell>
                        <TableCell>
                          <Chip
                            label={absenteeism.event_type}
                            color={getEventTypeColor(absenteeism.event_type) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{absenteeism.event_month}</TableCell>
                        <TableCell>
                          {format(new Date(absenteeism.start_date), 'dd/MM/yyyy', { locale: es })} - 
                          {format(new Date(absenteeism.end_date), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>{absenteeism.total_disability_days}</TableCell>
                        <TableCell>
                          ${absenteeism.base_salary.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/absenteeism/${absenteeism.id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                          {canUpdateWorkers() && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/admin/absenteeism/${absenteeism.id}/edit`)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedAbsenteeism(absenteeism);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar este registro de absenteeism?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AbsenteeismList;