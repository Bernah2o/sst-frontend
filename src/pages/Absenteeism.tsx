import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Autocomplete,
  Tooltip,
  Fab,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Visibility,
  Assessment,
  FilterList,
  Clear,
  GetApp,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import api from "../services/api";
import { formatDate } from '../utils/dateUtils';
import {
  AbsenteeismResponse,
  AbsenteeismCreate,
  AbsenteeismUpdate,
  AbsenteeismListResponse,
  AbsenteeismStats,
  AbsenteeismFilters,
  MonthEnum,
  EventTypeEnum,
  MONTH_OPTIONS,
  EVENT_TYPE_OPTIONS,
  WorkerBasicInfo,
} from "../types/absenteeism";

interface AbsenteeismFormData {
  event_month: MonthEnum;
  worker_id: number | null;
  event_type: EventTypeEnum;
  start_date: Date | null;
  end_date: Date | null;
  disability_days: number;
  extension: number;
  charged_days: number;
  diagnostic_code: string;
  health_condition_description: string;
  observations: string;
  insured_costs_at: number;
  insured_costs_ac_eg: number;
  assumed_costs_at: number;
  assumed_costs_ac_eg: number;
}

const AbsenteeismManagement: React.FC = () => {
  const [absenteeismRecords, setAbsenteeismRecords] = useState<AbsenteeismListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AbsenteeismResponse | null>(null);
  const [stats, setStats] = useState<AbsenteeismStats | null>(null);
  const [filters, setFilters] = useState<AbsenteeismFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para trabajadores
  const [workers, setWorkers] = useState<WorkerBasicInfo[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerBasicInfo | null>(null);
  const [workerSearchTerm, setWorkerSearchTerm] = useState("");
  
  const [formData, setFormData] = useState<AbsenteeismFormData>({
    event_month: MonthEnum.ENERO,
    worker_id: null,
    event_type: EventTypeEnum.ENFERMEDAD_GENERAL,
    start_date: null,
    end_date: null,
    disability_days: 0,
    extension: 0,
    charged_days: 0,
    diagnostic_code: "",
    health_condition_description: "",
    observations: "",
    insured_costs_at: 0,
    insured_costs_ac_eg: 0,
    assumed_costs_at: 0,
    assumed_costs_ac_eg: 0,
  });

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AbsenteeismListResponse | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    fetchAbsenteeismRecords();
    fetchWorkers();
  }, [page, rowsPerPage, searchTerm, filters]);

  const fetchAbsenteeismRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        skip: (page * rowsPerPage).toString(),
        limit: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== "")
        ),
      });

      const response = await api.get(`/absenteeism?${params}`);
      setAbsenteeismRecords(response.data.items);
      setTotalRecords(response.data.total);
    } catch (error) {
      console.error("Error fetching absenteeism records:", error);
      showSnackbar("Error al cargar los registros", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get("/workers/basic");
      setWorkers(response.data);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/absenteeism/stats");
      setStats(response.data);
      setOpenStatsDialog(true);
    } catch (error) {
      console.error("Error fetching stats:", error);
      showSnackbar("Error al cargar las estadísticas", "error");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.worker_id || !formData.start_date || !formData.end_date) {
        showSnackbar("Por favor complete todos los campos requeridos", "error");
        return;
      }

      const submitData = {
        event_month: formData.event_month,
        worker_id: formData.worker_id,
        event_type: formData.event_type,
        start_date: format(formData.start_date, "yyyy-MM-dd"),
        end_date: format(formData.end_date, "yyyy-MM-dd"),
        disability_days: formData.disability_days,
        extension: formData.extension,
        charged_days: formData.charged_days,
        diagnostic_code: formData.diagnostic_code,
        health_condition_description: formData.health_condition_description,
        observations: formData.observations,
        insured_costs_at: formData.insured_costs_at,
        insured_costs_ac_eg: formData.insured_costs_ac_eg,
        assumed_costs_at: formData.assumed_costs_at,
        assumed_costs_ac_eg: formData.assumed_costs_ac_eg,
      };

      if (editingRecord) {
        await api.put(`/absenteeism/${editingRecord.id}`, submitData);
        showSnackbar("Registro actualizado exitosamente", "success");
      } else {
        await api.post("/absenteeism", submitData);
        showSnackbar("Registro creado exitosamente", "success");
      }

      setOpenDialog(false);
      resetForm();
      fetchAbsenteeismRecords();
    } catch (error: any) {
      console.error("Error saving absenteeism record:", error);
      const errorMessage = error.response?.data?.detail || "Error al guardar el registro";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleEdit = async (record: AbsenteeismListResponse) => {
    try {
      const response = await api.get(`/absenteeism/${record.id}`);
      const fullRecord: AbsenteeismResponse = response.data;
      
      setEditingRecord(fullRecord);
      setFormData({
        event_month: fullRecord.event_month,
        worker_id: fullRecord.worker_id,
        event_type: fullRecord.event_type,
        start_date: parseISO(fullRecord.start_date),
        end_date: parseISO(fullRecord.end_date),
        disability_days: fullRecord.disability_days,
        extension: fullRecord.extension,
        charged_days: fullRecord.charged_days,
        diagnostic_code: fullRecord.diagnostic_code,
        health_condition_description: fullRecord.health_condition_description,
        observations: fullRecord.observations || "",
        insured_costs_at: fullRecord.insured_costs_at,
        insured_costs_ac_eg: fullRecord.insured_costs_ac_eg,
        assumed_costs_at: fullRecord.assumed_costs_at,
        assumed_costs_ac_eg: fullRecord.assumed_costs_ac_eg,
      });
      
      const worker = workers.find(w => w.id === fullRecord.worker_id);
      setSelectedWorker(worker || null);
      
      setOpenDialog(true);
    } catch (error) {
      console.error("Error fetching absenteeism record:", error);
      showSnackbar("Error al cargar el registro", "error");
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    try {
      await api.delete(`/absenteeism/${recordToDelete.id}`);
      showSnackbar("Registro eliminado exitosamente", "success");
      setOpenDeleteDialog(false);
      setRecordToDelete(null);
      fetchAbsenteeismRecords();
    } catch (error) {
      console.error("Error deleting absenteeism record:", error);
      showSnackbar("Error al eliminar el registro", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      event_month: MonthEnum.ENERO,
      worker_id: null,
      event_type: EventTypeEnum.ENFERMEDAD_GENERAL,
      start_date: null,
      end_date: null,
      disability_days: 0,
      extension: 0,
      charged_days: 0,
      diagnostic_code: "",
      health_condition_description: "",
      observations: "",
      insured_costs_at: 0,
      insured_costs_ac_eg: 0,
      assumed_costs_at: 0,
      assumed_costs_ac_eg: 0,
    });
    setSelectedWorker(null);
    setEditingRecord(null);
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const getEventTypeColor = (eventType: EventTypeEnum) => {
    switch (eventType) {
      case EventTypeEnum.ACCIDENTE_TRABAJO:
        return "error";
      case EventTypeEnum.ENFERMEDAD_LABORAL:
        return "warning";
      case EventTypeEnum.ACCIDENTE_COMUN:
        return "info";
      case EventTypeEnum.ENFERMEDAD_GENERAL:
        return "default";
      default:
        return "default";
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Ausentismo
        </Typography>

        {/* Estadísticas rápidas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Registros
                </Typography>
                <Typography variant="h4">
                  {totalRecords}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Este Mes
                </Typography>
                <Typography variant="h4">
                  {absenteeismRecords.filter(record => 
                    new Date(record.start_date).getMonth() === new Date().getMonth()
                  ).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controles superiores */}
        <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Buscar por trabajador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: "action.active" }} />,
            }}
            sx={{ minWidth: 250 }}
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={fetchStats}
          >
            Estadísticas
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAbsenteeismRecords}
          >
            Actualizar
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
          >
            Nuevo Registro
          </Button>
        </Box>

        {/* Panel de filtros */}
        {showFilters && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mes del Evento</InputLabel>
                  <Select
                    value={filters.event_month || ""}
                    label="Mes del Evento"
                    onChange={(e) => setFilters({ ...filters, event_month: e.target.value as MonthEnum })}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {MONTH_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Evento</InputLabel>
                  <Select
                    value={filters.event_type || ""}
                    label="Tipo de Evento"
                    onChange={(e) => setFilters({ ...filters, event_type: e.target.value as EventTypeEnum })}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {EVENT_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="Fecha Desde"
                  value={filters.start_date_from ? parseISO(filters.start_date_from) : null}
                   onChange={(date) => 
                     setFilters({ 
                       ...filters, 
                       start_date_from: date ? format(date, "yyyy-MM-dd") : undefined 
                     })
                   }
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="Fecha Hasta"
                  value={filters.start_date_to ? parseISO(filters.start_date_to) : null}
                   onChange={(date) => 
                     setFilters({ 
                       ...filters, 
                       start_date_to: date ? format(date, "yyyy-MM-dd") : undefined 
                     })
                   }
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Tabla de registros */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Trabajador</TableCell>
                <TableCell>Mes del Evento</TableCell>
                <TableCell>Tipo de Evento</TableCell>
                <TableCell>Fecha Inicio</TableCell>
                <TableCell>Fecha Fin</TableCell>
                <TableCell>Días de Incapacidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : absenteeismRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              ) : (
                absenteeismRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.worker_name}</TableCell>
                    <TableCell>{MONTH_OPTIONS.find(m => m.value === record.event_month)?.label}</TableCell>
                    <TableCell>
                      <Chip
                        label={EVENT_TYPE_OPTIONS.find(e => e.value === record.event_type)?.label}
                        color={getEventTypeColor(record.event_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(record.start_date)}</TableCell>
                    <TableCell>{formatDate(record.end_date)}</TableCell>
                    <TableCell>{record.total_disability_days}</TableCell>
                    <TableCell>
                       <Chip
                         label="Activo"
                         color="success"
                         size="small"
                       />
                     </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(record)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setRecordToDelete(record);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          <Delete />
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
            count={totalRecords}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </TableContainer>

        {/* Dialog para crear/editar */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingRecord ? "Editar Registro de Ausentismo" : "Nuevo Registro de Ausentismo"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Información del trabajador */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Información del Trabajador
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={workers}
                  getOptionLabel={(option) => `${option.first_name} ${option.last_name} - ${option.document_number}`}
                  value={selectedWorker}
                  onChange={(_, newValue) => {
                    setSelectedWorker(newValue);
                    setFormData({ ...formData, worker_id: newValue?.id || null });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Trabajador *"
                      placeholder="Buscar trabajador..."
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">
                          {option.first_name} {option.last_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {option.document_number} - {option.position}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              </Grid>

              {/* Información del evento */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Información del Evento
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Mes del Evento *</InputLabel>
                  <Select
                    value={formData.event_month}
                    label="Mes del Evento *"
                    onChange={(e) => setFormData({ ...formData, event_month: e.target.value as MonthEnum })}
                  >
                    {MONTH_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Evento *</InputLabel>
                  <Select
                    value={formData.event_type}
                    label="Tipo de Evento *"
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventTypeEnum })}
                  >
                    {EVENT_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Fecha de Inicio *"
                  value={formData.start_date}
                  onChange={(date) => setFormData({ ...formData, start_date: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Fecha de Fin *"
                  value={formData.end_date}
                  onChange={(date) => setFormData({ ...formData, end_date: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              {/* Información médica */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Información Médica
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Días de Incapacidad *"
                  type="number"
                  fullWidth
                  value={formData.disability_days}
                  onChange={(e) => setFormData({ ...formData, disability_days: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Extensión"
                  type="number"
                  fullWidth
                  value={formData.extension}
                  onChange={(e) => setFormData({ ...formData, extension: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Días Cargados"
                  type="number"
                  fullWidth
                  value={formData.charged_days}
                  onChange={(e) => setFormData({ ...formData, charged_days: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Código Diagnóstico *"
                  fullWidth
                  value={formData.diagnostic_code}
                  onChange={(e) => setFormData({ ...formData, diagnostic_code: e.target.value })}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Descripción Condición de Salud *"
                  fullWidth
                  value={formData.health_condition_description}
                  onChange={(e) => setFormData({ ...formData, health_condition_description: e.target.value })}
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Observaciones"
                  multiline
                  rows={3}
                  fullWidth
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                />
              </Grid>

              {/* Costos */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Costos
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Costos Asegurados AT"
                  type="number"
                  fullWidth
                  value={formData.insured_costs_at}
                  onChange={(e) => setFormData({ ...formData, insured_costs_at: parseFloat(e.target.value) || 0 })}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Costos Asegurados AC/EG"
                  type="number"
                  fullWidth
                  value={formData.insured_costs_ac_eg}
                  onChange={(e) => setFormData({ ...formData, insured_costs_ac_eg: parseFloat(e.target.value) || 0 })}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Costos Asumidos AT"
                  type="number"
                  fullWidth
                  value={formData.assumed_costs_at}
                  onChange={(e) => setFormData({ ...formData, assumed_costs_at: parseFloat(e.target.value) || 0 })}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Costos Asumidos AC/EG"
                  type="number"
                  fullWidth
                  value={formData.assumed_costs_ac_eg}
                  onChange={(e) => setFormData({ ...formData, assumed_costs_ac_eg: parseFloat(e.target.value) || 0 })}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingRecord ? "Actualizar" : "Crear"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de estadísticas */}
        <Dialog
          open={openStatsDialog}
          onClose={() => setOpenStatsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Estadísticas de Ausentismo</DialogTitle>
          <DialogContent>
            {stats && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Registros
                      </Typography>
                      <Typography variant="h4">
                        {stats.total_records}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Días Totales
                      </Typography>
                      <Typography variant="h4">
                        {stats.total_disability_days}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Costos Totales
                        </Typography>
                        <Typography variant="h4">
                          ${stats.total_costs?.toLocaleString() || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Por Tipo de Evento
                      </Typography>
                      {Object.entries(stats.by_event_type).map(([type, count]) => (
                        <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>{type}</Typography>
                          <Typography fontWeight="bold">{count}</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Por Mes
                      </Typography>
                      {Object.entries(stats.by_month).map(([month, count]) => (
                        <Box key={month} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>{month}</Typography>
                          <Typography fontWeight="bold">{count}</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenStatsDialog(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de confirmación de eliminación */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Está seguro de que desea eliminar el registro de ausentismo de{" "}
              <strong>{recordToDelete?.worker_name}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AbsenteeismManagement;