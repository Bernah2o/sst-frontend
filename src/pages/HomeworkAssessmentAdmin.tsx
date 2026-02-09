import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import {
  Visibility,
  Email,
  CheckCircle,
  Pending,
  Refresh,
  Add,
  AssignmentInd,
  Delete,
  PictureAsPdf,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  document_number: string;
  email: string;
}

interface Assessment {
  id: number;
  worker_id: number;
  evaluation_date: string;
  status: string;
  worker?: {
    first_name: string;
    last_name: string;
    document_number: string;
    email: string;
  };
}

const HomeworkAssessmentAdmin: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog para confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Control de descarga de PDF
  const [downloadingPdf, setDownloadingPdf] = useState<number | null>(null);

  // Dialog para asignación masiva
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([]);
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split("T")[0]);
  const [assigning, setAssigning] = useState(false);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/assessments/homework");
      console.log("Assessments response:", response.data);
      setAssessments(response.data);
      setFilteredAssessments(response.data);
    } catch (error: any) {
      console.error("Error loading assessments:", error);
      const errorMsg = error.response?.data?.detail || "Error al cargar las evaluaciones";
      enqueueSnackbar(errorMsg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const fetchWorkers = useCallback(async () => {
    try {
      const response = await api.get("/workers");
      setWorkers(response.data);
    } catch (error) {
      console.error("Error loading workers:", error);
      enqueueSnackbar("Error al cargar trabajadores", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchAssessments();
    fetchWorkers();
  }, [fetchAssessments, fetchWorkers]);

  // Filtrar evaluaciones por estado y búsqueda
  useEffect(() => {
    let filtered = assessments;

    // Filtrar por estado
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    // Filtrar por búsqueda (nombre o documento)
    if (searchQuery) {
      filtered = filtered.filter((a) => {
        const fullName = a.worker
          ? `${a.worker.first_name} ${a.worker.last_name}`.toLowerCase()
          : "";
        const docNumber = a.worker?.document_number || "";
        return (
          fullName.includes(searchQuery.toLowerCase()) ||
          docNumber.includes(searchQuery)
        );
      });
    }

    setFilteredAssessments(filtered);
  }, [statusFilter, searchQuery, assessments]);

  const handleSendReminder = async (id: number) => {
    setSendingEmail(id);
    try {
      await api.post(`/assessments/homework/${id}/remind`);
      enqueueSnackbar("Recordatorio enviado exitosamente", { variant: "success" });
    } catch (error: any) {
      console.error("Error sending reminder:", error);
      const errorMsg = error.response?.data?.detail || "Error al enviar el recordatorio";
      enqueueSnackbar(errorMsg, { variant: "error" });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedWorkers.length === 0) {
      enqueueSnackbar("Seleccione al menos un trabajador", { variant: "warning" });
      return;
    }

    setAssigning(true);
    try {
      const payload = {
        worker_ids: selectedWorkers.map((w) => w.id),
        evaluation_date: assignDate,
      };

      const response = await api.post("/assessments/homework/bulk-assign", payload);

      enqueueSnackbar(
        `Asignadas ${response.data.successful_count} evaluaciones. ${
          response.data.skipped_count > 0
            ? `${response.data.skipped_count} trabajadores ya tenían evaluación pendiente.`
            : ""
        }`,
        { variant: "success" }
      );

      setOpenAssignDialog(false);
      setSelectedWorkers([]);
      fetchAssessments();
    } catch (error: any) {
      console.error("Error bulk assigning:", error);
      const errorMsg = error.response?.data?.detail || "Error al asignar evaluaciones";
      enqueueSnackbar(errorMsg, { variant: "error" });
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteClick = (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/assessments/homework/${assessmentToDelete.id}`);
      enqueueSnackbar("Evaluación eliminada exitosamente", { variant: "success" });
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
      fetchAssessments();
    } catch (error: any) {
      console.error("Error deleting assessment:", error);
      const errorMsg = error.response?.data?.detail || "Error al eliminar la evaluación";
      enqueueSnackbar(errorMsg, { variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAssessmentToDelete(null);
  };

  const handleDownloadPdf = async (assessmentId: number, workerName: string) => {
    setDownloadingPdf(assessmentId);
    try {
      const response = await api.get(`/assessments/homework/${assessmentId}/pdf`, {
        responseType: "blob",
      });

      // Crear un blob y descargarlo
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Autoevaluacion_${workerName}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      enqueueSnackbar("PDF descargado exitosamente", { variant: "success" });
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      const errorMsg = error.response?.data?.detail || "Error al descargar el PDF";
      enqueueSnackbar(errorMsg, { variant: "error" });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const getStatusChip = (status: string) => {
    if (status === "COMPLETED") {
      return <Chip icon={<CheckCircle />} label="Completado" color="success" size="small" />;
    }
    return <Chip icon={<Pending />} label="Pendiente" color="warning" size="small" />;
  };

  // Estadísticas
  const stats = {
    total: assessments.length,
    completed: assessments.filter((a) => a.status === "COMPLETED").length,
    pending: assessments.filter((a) => a.status === "PENDING").length,
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="primary">
          Gestión de Autoevaluaciones
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<AssessmentIcon />}
            onClick={() => navigate("/admin/homework-assessments/dashboard")}
            variant="contained"
            color="info"
          >
            Dashboard de Análisis
          </Button>
          <Button
            startIcon={<Add />}
            onClick={() => setOpenAssignDialog(true)}
            variant="contained"
            color="primary"
          >
            Asignar Evaluaciones
          </Button>
          <Button startIcon={<Refresh />} onClick={fetchAssessments} variant="outlined">
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Evaluaciones
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completadas
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pendientes
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar por nombre o documento"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">Todos</MenuItem>
                <MenuItem value="PENDING">Pendientes</MenuItem>
                <MenuItem value="COMPLETED">Completados</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de evaluaciones */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Trabajador</strong></TableCell>
                <TableCell><strong>Documento</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Fecha Asignada</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredAssessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      {searchQuery || statusFilter !== "ALL"
                        ? "No se encontraron evaluaciones con los filtros aplicados."
                        : "No hay evaluaciones registradas. Haga clic en 'Asignar Evaluaciones' para comenzar."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssessments.map((assessment) => (
                  <TableRow hover key={assessment.id}>
                    <TableCell>
                      {assessment.worker
                        ? `${assessment.worker.first_name} ${assessment.worker.last_name}`
                        : `Worker ID: ${assessment.worker_id}`}
                    </TableCell>
                    <TableCell>{assessment.worker?.document_number || "-"}</TableCell>
                    <TableCell>{assessment.worker?.email || "-"}</TableCell>
                    <TableCell>
                      {new Date(assessment.evaluation_date).toLocaleDateString("es-CO")}
                    </TableCell>
                    <TableCell align="center">{getStatusChip(assessment.status)}</TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1}>
                        <Tooltip title="Ver Detalles">
                          <IconButton
                            color="primary"
                            onClick={() =>
                              navigate(`/admin/homework-assessments/${assessment.id}`)
                            }
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>

                        {assessment.status !== "COMPLETED" && (
                          <Tooltip title="Enviar Recordatorio">
                            <IconButton
                              color="secondary"
                              onClick={() => handleSendReminder(assessment.id)}
                              disabled={sendingEmail === assessment.id}
                            >
                              {sendingEmail === assessment.id ? (
                                <CircularProgress size={24} />
                              ) : (
                                <Email />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}

                        {assessment.status === "COMPLETED" && (
                          <Tooltip title="Descargar PDF">
                            <IconButton
                              color="info"
                              onClick={() =>
                                handleDownloadPdf(
                                  assessment.id,
                                  assessment.worker
                                    ? `${assessment.worker.first_name}_${assessment.worker.last_name}`
                                    : `Worker_${assessment.worker_id}`
                                )
                              }
                              disabled={downloadingPdf === assessment.id}
                            >
                              {downloadingPdf === assessment.id ? (
                                <CircularProgress size={24} />
                              ) : (
                                <PictureAsPdf />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Eliminar Evaluación">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteClick(assessment)}
                          >
                            <Delete />
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
      </Paper>

      {/* Dialog para Asignación Masiva */}
      <Dialog
        open={openAssignDialog}
        onClose={() => !assigning && setOpenAssignDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AssignmentInd color="primary" />
            <Typography variant="h6">Asignar Autoevaluaciones</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Seleccione los trabajadores que deben completar la autoevaluación de trabajo en
              casa. Los trabajadores que ya tengan una evaluación pendiente serán omitidos.
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  options={workers}
                  value={selectedWorkers}
                  onChange={(_, newValue) => setSelectedWorkers(newValue)}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.last_name} - ${option.document_number}`
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Seleccionar Trabajadores" fullWidth />
                  )}
                  disabled={assigning}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Evaluación"
                  value={assignDate}
                  onChange={(e) => setAssignDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={assigning}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)} disabled={assigning}>
            Cancelar
          </Button>
          <Button
            onClick={handleBulkAssign}
            variant="contained"
            color="primary"
            disabled={assigning || selectedWorkers.length === 0}
            startIcon={assigning && <CircularProgress size={20} />}
          >
            {assigning ? "Asignando..." : "Asignar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && handleDeleteCancel()}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Delete color="error" />
            <Typography variant="h6">Confirmar Eliminación</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {assessmentToDelete && (
            <Box mt={2}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Esta acción no se puede deshacer. Se eliminará permanentemente la evaluación.
              </Alert>
              <Typography variant="body1">
                ¿Está seguro que desea eliminar la evaluación de:
              </Typography>
              <Box mt={2} p={2} sx={{ bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="body1">
                  <strong>Trabajador:</strong>{" "}
                  {assessmentToDelete.worker
                    ? `${assessmentToDelete.worker.first_name} ${assessmentToDelete.worker.last_name}`
                    : `ID: ${assessmentToDelete.worker_id}`}
                </Typography>
                <Typography variant="body1">
                  <strong>Documento:</strong> {assessmentToDelete.worker?.document_number || "-"}
                </Typography>
                <Typography variant="body1">
                  <strong>Fecha:</strong>{" "}
                  {new Date(assessmentToDelete.evaluation_date).toLocaleDateString("es-CO")}
                </Typography>
                <Typography variant="body1">
                  <strong>Estado:</strong> {assessmentToDelete.status === "COMPLETED" ? "Completado" : "Pendiente"}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <Delete />}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomeworkAssessmentAdmin;
