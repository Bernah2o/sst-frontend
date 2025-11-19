import {
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  GetApp as ExportIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
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
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Stack,
  Grid,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React, { useState, useEffect, useCallback } from "react";
// import { useParams } from "react-router-dom"; // eliminado por no uso

import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirmDialog } from "../hooks/useConfirmDialog";

interface WorkerNovedad {
  id: number;
  worker_id: number;
  tipo: string;
  titulo: string;
  descripcion?: string;
  status: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  dias_calculados?: number;
  salario_anterior?: number;
  salario_nuevo?: number;
  monto_aumento?: number;
  cantidad_horas?: number;
  valor_hora?: number;
  valor_total?: number;
  observaciones?: string;
  documento_soporte?: string;
  registrado_por: number;
  registrado_por_name?: string;
  aprobado_por?: number;
  aprobado_por_name?: string;
  fecha_aprobacion?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface WorkerNovedadCreate {
  worker_id?: number;
  tipo: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  salario_anterior?: number;
  monto_aumento?: number;
  cantidad_horas?: number;
  valor_hora?: number;
  observaciones?: string;
}

interface WorkerNovedadStats {
  total_novedades: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  procesadas: number;
  por_tipo: { [key: string]: number };
}

const NOVEDAD_TYPES = {
  permiso_dia_familia: "Permiso Día de la Familia",
  licencia_paternidad: "Licencia de Paternidad",
  incapacidad_medica: "Incapacidad Médica",
  permiso_dia_no_remunerado: "Permiso Día No Remunerado",
  aumento_salario: "Aumento de Salario",
  licencia_maternidad: "Licencia de Maternidad",
  horas_extras: "Horas Extras",
  recargos: "Recargos",
  capacitacion: "Capacitación",
  trabajo_en_casa: "Trabajo en casa",
};

const NOVEDAD_STATUS = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  procesada: "Procesada",
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pendiente":
      return "warning";
    case "aprobada":
      return "success";
    case "rechazada":
      return "error";
    case "procesada":
      return "info";
    default:
      return "default";
  }
};

const formatCurrency = (amount?: number) => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("es-CO");
};

interface WorkerNovedadesProps {
  workerId: string;
}

const WorkerNovedades: React.FC<WorkerNovedadesProps> = ({ workerId }) => {
  const { user } = useAuth();

  const [novedades, setNovedades] = useState<WorkerNovedad[]>([]);
  const [stats, setStats] = useState<WorkerNovedadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openApprovalDialog, setOpenApprovalDialog] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState<WorkerNovedad | null>(
    null
  );

  // Form states
  const [formData, setFormData] = useState<WorkerNovedadCreate>({
    tipo: "",
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    salario_anterior: undefined,
    monto_aumento: undefined,
    cantidad_horas: undefined,
    valor_hora: undefined,
    observaciones: "",
  });

  const [approvalData, setApprovalData] = useState({
    status: "aprobada" as "aprobada" | "rechazada",
    observaciones: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);

  // Confirm dialog hook
  const { dialogState, showConfirmDialog } = useConfirmDialog();

  const fetchNovedades = useCallback(async () => {
    if (!workerId || workerId === "undefined" || workerId.trim() === "") {
      setNovedades([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/workers/${workerId}/novedades`, {
        params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage,
        },
      });

      // Asegurar que siempre tenemos un array
      const items = response.data?.items || response.data || [];
      const total =
        response.data?.total || (Array.isArray(items) ? items.length : 0);

      setNovedades(Array.isArray(items) ? items : []);
      setTotalCount(total);
    } catch (error: any) {
      console.error("Error fetching novedades:", error);
      setError(error.response?.data?.detail || "Error al cargar las novedades");
      // En caso de error, limpiar los datos
      setNovedades([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [workerId, page, rowsPerPage]);

  const fetchStats = useCallback(async () => {
    if (!workerId || workerId === "undefined" || workerId.trim() === "") {
      setStats(null);
      return;
    }

    try {
      const response = await api.get(`/workers/${workerId}/novedades/stats`);
      setStats(response.data || null);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      setStats(null);
    }
  }, [workerId]);

  useEffect(() => {
    if (workerId && workerId !== "undefined" && workerId.trim() !== "") {
      fetchNovedades();
      fetchStats();
    } else {
      // Limpiar datos si no hay workerId válido
      setNovedades([]);
      setStats(null);
      setTotalCount(0);
      setLoading(false);
    }
  }, [fetchNovedades, fetchStats, workerId]);

  const handleCreateNovedad = async () => {
    try {
      setSubmitting(true);

      // Filtrar campos vacíos según el tipo de novedad
      const dataToSend: any = {
        worker_id: parseInt(workerId),
        tipo: formData.tipo,
        titulo: formData.titulo,
      };

      // Agregar campos opcionales solo si no están vacíos
      if (formData.descripcion) dataToSend.descripcion = formData.descripcion;
      if (formData.observaciones)
        dataToSend.observaciones = formData.observaciones;

      // Campos de fecha (solo para tipos específicos)
      if (
        requiresDateRange(formData.tipo) ||
        requiresSingleDate(formData.tipo)
      ) {
        if (formData.fecha_inicio)
          dataToSend.fecha_inicio = formData.fecha_inicio;
        if (requiresDateRange(formData.tipo) && formData.fecha_fin) {
          dataToSend.fecha_fin = formData.fecha_fin;
        }
      }

      // Campos de salario (solo para aumentos)
      if (requiresSalaryFields(formData.tipo)) {
        if (formData.salario_anterior)
          dataToSend.salario_anterior = formData.salario_anterior;
        if (formData.monto_aumento)
          dataToSend.monto_aumento = formData.monto_aumento;
      }

      // Campos de horas (solo para horas extras y recargos)
      if (requiresHourFields(formData.tipo)) {
        if (formData.cantidad_horas)
          dataToSend.cantidad_horas = formData.cantidad_horas;
        if (formData.valor_hora) dataToSend.valor_hora = formData.valor_hora;
      }

      await api.post(`/workers/${workerId}/novedades`, dataToSend);
      setSuccess("Novedad creada exitosamente");
      setOpenCreateDialog(false);
      resetForm();
      fetchNovedades();
      fetchStats();
    } catch (error: any) {
      console.error("Error creating novedad:", error);
      setError(error.response?.data?.detail || "Error al crear la novedad");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNovedad = async () => {
    if (!selectedNovedad) return;

    try {
      setSubmitting(true);

      // Filtrar campos vacíos según el tipo de novedad
      const dataToSend: any = {
        worker_id: parseInt(workerId),
        tipo: formData.tipo,
        titulo: formData.titulo,
      };

      // Agregar campos opcionales solo si no están vacíos
      if (formData.descripcion) dataToSend.descripcion = formData.descripcion;
      if (formData.observaciones)
        dataToSend.observaciones = formData.observaciones;

      // Campos de fecha (solo para tipos específicos)
      if (
        requiresDateRange(formData.tipo) ||
        requiresSingleDate(formData.tipo)
      ) {
        if (formData.fecha_inicio)
          dataToSend.fecha_inicio = formData.fecha_inicio;
        if (requiresDateRange(formData.tipo) && formData.fecha_fin) {
          dataToSend.fecha_fin = formData.fecha_fin;
        }
      }

      // Campos de salario (solo para aumentos)
      if (requiresSalaryFields(formData.tipo)) {
        if (formData.salario_anterior)
          dataToSend.salario_anterior = formData.salario_anterior;
        if (formData.monto_aumento)
          dataToSend.monto_aumento = formData.monto_aumento;
      }

      // Campos de horas (solo para horas extras y recargos)
      if (requiresHourFields(formData.tipo)) {
        if (formData.cantidad_horas)
          dataToSend.cantidad_horas = formData.cantidad_horas;
        if (formData.valor_hora) dataToSend.valor_hora = formData.valor_hora;
      }

      await api.put(`/workers/novedades/${selectedNovedad.id}`, dataToSend);
      setSuccess("Novedad actualizada exitosamente");
      setOpenEditDialog(false);
      resetForm();
      fetchNovedades();
    } catch (error: any) {
      console.error("Error updating novedad:", error);
      setError(
        error.response?.data?.detail || "Error al actualizar la novedad"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveNovedad = async () => {
    if (!selectedNovedad) return;

    try {
      setSubmitting(true);
      await api.post(
        `/workers/novedades/${selectedNovedad.id}/approve`,
        approvalData
      );
      setSuccess(
        `Novedad ${
          approvalData.status === "aprobada" ? "aprobada" : "rechazada"
        } exitosamente`
      );
      setOpenApprovalDialog(false);
      setApprovalData({ status: "aprobada", observaciones: "" });
      fetchNovedades();
      fetchStats();
    } catch (error: any) {
      console.error("Error approving novedad:", error);
      setError(
        error.response?.data?.detail || "Error al procesar la aprobación"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNovedad = async (novedadId: number) => {
    try {
      const confirmed = await showConfirmDialog({
        title: "Confirmar eliminación",
        message: "¿Está seguro de que desea eliminar esta novedad? Esta acción no se puede deshacer.",
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        severity: "warning"
      });

      if (!confirmed) return;

      await api.delete(`/workers/novedades/${novedadId}`);
      setSuccess("Novedad eliminada exitosamente");
      fetchNovedades();
      fetchStats();
    } catch (error: any) {
      console.error("Error deleting novedad:", error);
      setError(error.response?.data?.detail || "Error al eliminar la novedad");
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: "",
      titulo: "",
      descripcion: "",
      fecha_inicio: "",
      fecha_fin: "",
      salario_anterior: undefined,
      monto_aumento: undefined,
      cantidad_horas: undefined,
      valor_hora: undefined,
      observaciones: "",
    });
    setSelectedNovedad(null);
  };

  const handleExportToExcel = async () => {
    try {
      setExporting(true);

      // Construir parámetros de filtro
      const params: any = {};
      if (startDateFilter) {
        params.start_date = format(startDateFilter, "yyyy-MM-dd");
      }
      if (endDateFilter) {
        params.end_date = format(endDateFilter, "yyyy-MM-dd");
      }

      const response = await api.get(`/workers/${workerId}/novedades/export`, {
        params,
        responseType: "blob",
      });

      // Crear un blob con el archivo Excel
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Obtener el nombre del archivo desde los headers o usar uno por defecto
      const contentDisposition = response.headers["content-disposition"];
      let filename = "novedades_trabajador.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess("Archivo Excel exportado exitosamente");
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      setError(error.response?.data?.detail || "Error al exportar a Excel");
    } finally {
      setExporting(false);
    }
  };

  const openCreateForm = () => {
    resetForm();
    setOpenCreateDialog(true);
  };

  const openEditForm = (novedad: WorkerNovedad) => {
    setSelectedNovedad(novedad);
    setFormData({
      tipo: novedad.tipo,
      titulo: novedad.titulo,
      descripcion: novedad.descripcion || "",
      fecha_inicio: novedad.fecha_inicio || "",
      fecha_fin: novedad.fecha_fin || "",
      salario_anterior: novedad.salario_anterior,
      monto_aumento: novedad.monto_aumento,
      cantidad_horas: novedad.cantidad_horas,
      valor_hora: novedad.valor_hora,
      observaciones: novedad.observaciones || "",
    });
    setOpenEditDialog(true);
  };

  const openViewForm = (novedad: WorkerNovedad) => {
    setSelectedNovedad(novedad);
    setOpenViewDialog(true);
  };

  const openApprovalForm = (novedad: WorkerNovedad) => {
    setSelectedNovedad(novedad);
    setApprovalData({ status: "aprobada", observaciones: "" });
    setOpenApprovalDialog(true);
  };

  const requiresDateRange = (tipo: string) => {
    return [
      "licencia_paternidad",
      "incapacidad_medica",
      "permiso_dia_no_remunerado",
      "licencia_maternidad",
      "capacitacion",
      "trabajo_en_casa",
    ].includes(tipo);
  };

  const requiresSingleDate = (tipo: string) => {
    return tipo === "permiso_dia_familia";
  };

  const requiresSalaryFields = (tipo: string) => {
    return tipo === "aumento_salario";
  };

  const requiresHourFields = (tipo: string) => {
    return ["horas_extras", "recargos"].includes(tipo);
  };

  const canEdit = (novedad: WorkerNovedad) => {
    return (
      novedad.status === "pendiente" &&
      (user?.role === "admin" || user?.role === "supervisor")
    );
  };

  const canApprove = (novedad: WorkerNovedad) => {
    return (
      novedad.status === "pendiente" &&
      (user?.role === "admin" || user?.role === "supervisor")
    );
  };

  const canDelete = (novedad: WorkerNovedad) => {
    return (
      novedad.status === "pendiente" &&
      (user?.role === "admin" || user?.role === "supervisor")
    );
  };

  // Validación de workerId
  if (!workerId || workerId === "undefined" || workerId.trim() === "") {
    return (
      <Box>
        <Alert severity="warning">
          No se ha especificado un trabajador válido para mostrar las novedades.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Novedades
                </Typography>
                <Typography variant="h4">{stats.total_novedades}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pendientes
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pendientes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Aprobadas
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.aprobadas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Rechazadas
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.rechazadas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros y Exportación */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Filtros y Exportación
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Fecha de inicio"
                value={startDateFilter}
                onChange={setStartDateFilter}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Fecha de fin"
                value={endDateFilter}
                onChange={setEndDateFilter}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setStartDateFilter(null);
                  setEndDateFilter(null);
                }}
                fullWidth
              >
                Limpiar Filtros
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={handleExportToExcel}
                disabled={exporting || !novedades.length}
                fullWidth
              >
                {exporting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  "Excel"
                )}
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Novedades del Trabajador</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportToExcel}
            disabled={exporting || !novedades.length}
          >
            Exportar a Excel
          </Button>
          {(user?.role === "admin" || user?.role === "supervisor") && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateForm}
            >
              Nueva Novedad
            </Button>
          )}
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Fin</TableCell>
              <TableCell>Días</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Registrado por</TableCell>
              <TableCell>Aprobado por</TableCell>
              <TableCell>Fecha Registro</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !Array.isArray(novedades) || novedades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  No hay novedades registradas
                </TableCell>
              </TableRow>
            ) : (
              novedades.map((novedad) => (
                <TableRow key={novedad.id}>
                  <TableCell>
                    <Chip
                      label={
                        NOVEDAD_TYPES[
                          novedad.tipo as keyof typeof NOVEDAD_TYPES
                        ]
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{novedad.titulo}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        NOVEDAD_STATUS[
                          novedad.status as keyof typeof NOVEDAD_STATUS
                        ]
                      }
                      color={getStatusColor(novedad.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(novedad.fecha_inicio)}</TableCell>
                  <TableCell>{formatDate(novedad.fecha_fin)}</TableCell>
                  <TableCell>{novedad.dias_calculados || "N/A"}</TableCell>
                  <TableCell>
                    {novedad.valor_total
                      ? formatCurrency(novedad.valor_total)
                      : novedad.monto_aumento
                      ? formatCurrency(novedad.monto_aumento)
                      : "N/A"}
                  </TableCell>
                  <TableCell>{novedad.registrado_por_name}</TableCell>
                  <TableCell>{novedad.aprobado_por_name || "N/A"}</TableCell>
                  <TableCell>{formatDate(novedad.created_at)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => openViewForm(novedad)}
                        title="Ver detalles"
                      >
                        <Visibility />
                      </IconButton>
                      {canEdit(novedad) && (
                        <IconButton
                          size="small"
                          onClick={() => openEditForm(novedad)}
                          title="Editar"
                        >
                          <Edit />
                        </IconButton>
                      )}
                      {canApprove(novedad) && (
                        <IconButton
                          size="small"
                          onClick={() => openApprovalForm(novedad)}
                          title="Aprobar/Rechazar"
                          color="primary"
                        >
                          <CheckCircle />
                        </IconButton>
                      )}
                      {canDelete(novedad) && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNovedad(novedad.id)}
                          title="Eliminar"
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count}`
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog
        open={openCreateDialog || openEditDialog}
        onClose={() => {
          setOpenCreateDialog(false);
          setOpenEditDialog(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {openCreateDialog ? "Nueva Novedad" : "Editar Novedad"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Novedad</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value })
                  }
                  label="Tipo de Novedad"
                >
                  {Object.entries(NOVEDAD_TYPES).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Título"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                multiline
                rows={3}
              />
            </Grid>

            {/* Date fields for certain types */}
            {requiresDateRange(formData.tipo) && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Fecha Inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_inicio: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Fecha Fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_fin: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </>
            )}

            {/* Single date field for family day */}
            {requiresSingleDate(formData.tipo) && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_inicio: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            )}

            {/* Salary fields for salary increase */}
            {requiresSalaryFields(formData.tipo) && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Salario Anterior"
                    type="number"
                    value={formData.salario_anterior || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salario_anterior:
                          parseFloat(e.target.value) || undefined,
                      })
                    }
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Monto del Aumento"
                    type="number"
                    value={formData.monto_aumento || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monto_aumento: parseFloat(e.target.value) || undefined,
                      })
                    }
                    required
                    helperText="Valor a aumentar al salario actual"
                  />
                </Grid>
              </>
            )}

            {/* Hour fields for overtime and surcharges */}
            {requiresHourFields(formData.tipo) && (
              <>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Cantidad de Horas"
                    type="number"
                    value={formData.cantidad_horas || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cantidad_horas: parseFloat(e.target.value) || undefined,
                      })
                    }
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Valor por Hora"
                    type="number"
                    value={formData.valor_hora || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valor_hora: parseFloat(e.target.value) || undefined,
                      })
                    }
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Valor Total"
                    type="number"
                    value={
                      formData.cantidad_horas && formData.valor_hora
                        ? (
                            formData.cantidad_horas * formData.valor_hora
                          ).toFixed(2)
                        : ""
                    }
                    InputProps={{ readOnly: true }}
                    helperText="Calculado automáticamente"
                  />
                </Grid>
              </>
            )}

            <Grid size={12}>
              <TextField
                fullWidth
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenCreateDialog(false);
              setOpenEditDialog(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={openCreateDialog ? handleCreateNovedad : handleEditNovedad}
            variant="contained"
            disabled={submitting || !formData.tipo || !formData.titulo}
          >
            {submitting ? (
              <CircularProgress size={20} />
            ) : openCreateDialog ? (
              "Crear"
            ) : (
              "Actualizar"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalles de la Novedad</DialogTitle>
        <DialogContent>
          {selectedNovedad && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Tipo
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {
                    NOVEDAD_TYPES[
                      selectedNovedad.tipo as keyof typeof NOVEDAD_TYPES
                    ]
                  }
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Estado
                </Typography>
                <Chip
                  label={
                    NOVEDAD_STATUS[
                      selectedNovedad.status as keyof typeof NOVEDAD_STATUS
                    ]
                  }
                  color={getStatusColor(selectedNovedad.status) as any}
                  size="small"
                />
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Título
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedNovedad.titulo}
                </Typography>
              </Grid>
              {selectedNovedad.descripcion && (
                <Grid size={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Descripción
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedNovedad.descripcion}
                  </Typography>
                </Grid>
              )}
              {selectedNovedad.fecha_inicio && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha Inicio
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedNovedad.fecha_inicio)}
                  </Typography>
                </Grid>
              )}
              {selectedNovedad.fecha_fin && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha Fin
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedNovedad.fecha_fin)}
                  </Typography>
                </Grid>
              )}
              {selectedNovedad.dias_calculados && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Días Calculados
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedNovedad.dias_calculados} días
                  </Typography>
                </Grid>
              )}
              {selectedNovedad.salario_anterior && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Salario Anterior
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(selectedNovedad.salario_anterior)}
                  </Typography>
                </Grid>
              )}
              {selectedNovedad.salario_nuevo && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Salario Nuevo
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(selectedNovedad.salario_nuevo)}
                  </Typography>
                </Grid>
              )}
              {selectedNovedad.monto_aumento && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Monto Aumento
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(selectedNovedad.monto_aumento)}
                  </Typography>
                </Grid>
              )}
              {selectedNovedad.cantidad_horas && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Cantidad Horas
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedNovedad.cantidad_horas} horas
                  </Typography>
                </Grid>
              )}
              {selectedNovedad.valor_hora && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Valor por Hora
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(selectedNovedad.valor_hora)}
                  </Typography>
                </Grid>
              )}
              {selectedNovedad.valor_total && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Valor Total
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatCurrency(selectedNovedad.valor_total)}
                  </Typography>
                </Grid>
              )}
              {selectedNovedad.observaciones && (
                <Grid size={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedNovedad.observaciones}
                  </Typography>
                </Grid>
              )}
              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="textSecondary">
                  Información de Registro
                </Typography>
                <Typography variant="body2">
                  Registrado por: {selectedNovedad.registrado_por_name}
                </Typography>
                <Typography variant="body2">
                  Fecha de registro: {formatDate(selectedNovedad.created_at)}
                </Typography>
                {selectedNovedad.aprobado_por_name && (
                  <>
                    <Typography variant="body2">
                      Aprobado por: {selectedNovedad.aprobado_por_name}
                    </Typography>
                    <Typography variant="body2">
                      Fecha de aprobación:{" "}
                      {formatDate(selectedNovedad.fecha_aprobacion)}
                    </Typography>
                  </>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog
        open={openApprovalDialog}
        onClose={() => setOpenApprovalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {approvalData.status === "aprobada" ? "Aprobar" : "Rechazar"} Novedad
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Acción</InputLabel>
                <Select
                  value={
                    approvalData.status === "aprobada" ? "approve" : "reject"
                  }
                  onChange={(e) =>
                    setApprovalData({
                      ...approvalData,
                      status:
                        e.target.value === "approve" ? "aprobada" : "rechazada",
                    })
                  }
                  label="Acción"
                >
                  <MenuItem value="approve">Aprobar</MenuItem>
                  <MenuItem value="reject">Rechazar</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Observaciones"
                value={approvalData.observaciones}
                onChange={(e) =>
                  setApprovalData({
                    ...approvalData,
                    observaciones: e.target.value,
                  })
                }
                multiline
                rows={3}
                placeholder="Ingrese observaciones sobre la decisión..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApprovalDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleApproveNovedad}
            variant="contained"
            color={approvalData.status === "aprobada" ? "success" : "error"}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={20} />
            ) : approvalData.status === "aprobada" ? (
              "Aprobar"
            ) : (
              "Rechazar"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        severity={dialogState.severity}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </Box>
  );
};

export default WorkerNovedades;
