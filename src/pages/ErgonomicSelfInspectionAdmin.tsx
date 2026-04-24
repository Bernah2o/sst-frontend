import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Autocomplete,
} from "@mui/material";
import {
  Add,
  Assessment as AssessmentIcon,
  Delete,
  Email,
  Pending,
  PictureAsPdf,
  Refresh,
  Visibility,
  CheckCircle,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  document_number: string;
  email: string;
}

interface Inspection {
  id: number;
  worker_id: number;
  evaluation_date: string;
  status: string;
  month_year?: string;
  modality?: string;
  worker?: {
    first_name: string;
    last_name: string;
    document_number: string;
    email: string;
  };
}

const ErgonomicSelfInspectionAdmin: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<number | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] =
    useState<Inspection | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([]);
  const [assignDate, setAssignDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [assigning, setAssigning] = useState(false);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/assessments/ergonomic");
      setInspections(response.data);
    } catch (error: any) {
      const msg =
        error.response?.data?.detail || "Error al cargar las autoinspecciones";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await api.get("/workers");
      setWorkers(res.data);
    } catch (error: any) {
      const msg =
        error.response?.data?.detail || "Error al cargar trabajadores";
      enqueueSnackbar(msg, { variant: "error" });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchInspections();
    fetchWorkers();
  }, [fetchInspections, fetchWorkers]);

  const filteredInspections = useMemo(() => {
    return inspections
      .filter((i) =>
        statusFilter === "ALL" ? true : i.status === statusFilter,
      )
      .filter((i) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const w = i.worker;
        return (
          String(i.id).includes(q) ||
          (w?.first_name || "").toLowerCase().includes(q) ||
          (w?.last_name || "").toLowerCase().includes(q) ||
          (w?.document_number || "").toLowerCase().includes(q)
        );
      });
  }, [inspections, searchQuery, statusFilter]);

  const handleRemind = async (inspectionId: number) => {
    setSendingEmail(inspectionId);
    try {
      await api.post(`/assessments/ergonomic/${inspectionId}/remind`);
      enqueueSnackbar("Recordatorio enviado", { variant: "success" });
    } catch (error: any) {
      const msg =
        error.response?.data?.detail || "Error al enviar recordatorio";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleDownloadPdf = async (inspectionId: number) => {
    setDownloadingPdf(inspectionId);
    try {
      const response = await api.get(
        `/assessments/ergonomic/${inspectionId}/pdf`,
        {
          responseType: "blob",
        },
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `autoinspeccion_ergonomica_${inspectionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Error al descargar PDF";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const openDeleteDialog = (inspection: Inspection) => {
    setInspectionToDelete(inspection);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!inspectionToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/assessments/ergonomic/${inspectionToDelete.id}`);
      enqueueSnackbar("Autoinspección eliminada", { variant: "success" });
      setDeleteDialogOpen(false);
      setInspectionToDelete(null);
      await fetchInspections();
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Error al eliminar";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedWorkers.length === 0) {
      enqueueSnackbar("Seleccione al menos un trabajador", {
        variant: "warning",
      });
      return;
    }
    setAssigning(true);
    try {
      await api.post("/assessments/ergonomic/bulk-assign", {
        worker_ids: selectedWorkers.map((w) => w.id),
        evaluation_date: assignDate,
      });
      enqueueSnackbar("Asignación masiva completada", { variant: "success" });
      setOpenAssignDialog(false);
      setSelectedWorkers([]);
      await fetchInspections();
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Error al asignar";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Box p={3}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h5" fontWeight="bold">
          Autoinspección – Puesto Ergonómico
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<AssessmentIcon />}
            variant="contained"
            color="info"
            onClick={() =>
              navigate("/admin/ergonomic-self-inspections/dashboard")
            }
          >
            Dashboard de Análisis
          </Button>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => setOpenAssignDialog(true)}
          >
            Asignar
          </Button>
          <Button
            startIcon={<Refresh />}
            variant="outlined"
            onClick={fetchInspections}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <Box sx={{ flex: "1 1 360px", minWidth: 280 }}>
            <TextField
              label="Buscar (nombre, documento, id)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
          </Box>
          <Box sx={{ flex: "0 1 220px", minWidth: 220 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(String(e.target.value))}
              fullWidth
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="PENDING">Pendientes</MenuItem>
              <MenuItem value="COMPLETED">Completadas</MenuItem>
            </Select>
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredInspections.length === 0 ? (
          <Alert severity="info">No hay autoinspecciones para mostrar.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Trabajador</TableCell>
                  <TableCell>Documento</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInspections.map((ins) => (
                  <TableRow key={ins.id}>
                    <TableCell>{ins.id}</TableCell>
                    <TableCell>
                      {ins.worker
                        ? `${ins.worker.first_name} ${ins.worker.last_name}`
                        : ins.worker_id}
                    </TableCell>
                    <TableCell>{ins.worker?.document_number || "-"}</TableCell>
                    <TableCell>{ins.evaluation_date}</TableCell>
                    <TableCell>
                      {ins.status === "COMPLETED" ? (
                        <Chip
                          icon={<CheckCircle />}
                          label="Completada"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<Pending />}
                          label="Pendiente"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver">
                        <IconButton
                          onClick={() =>
                            navigate(
                              `/admin/ergonomic-self-inspections/${ins.id}`,
                            )
                          }
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Recordatorio">
                        <span>
                          <IconButton
                            onClick={() => handleRemind(ins.id)}
                            disabled={sendingEmail === ins.id}
                          >
                            <Email />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="PDF">
                        <span>
                          <IconButton
                            onClick={() => handleDownloadPdf(ins.id)}
                            disabled={downloadingPdf === ins.id}
                          >
                            <PictureAsPdf />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          color="error"
                          onClick={() => openDeleteDialog(ins)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={openAssignDialog}
        onClose={() => setOpenAssignDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Asignación masiva</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
            <Box sx={{ flex: "1 1 520px", minWidth: 320 }}>
              <Autocomplete
                multiple
                options={workers}
                value={selectedWorkers}
                onChange={(_, value) => setSelectedWorkers(value)}
                getOptionLabel={(w) =>
                  `${w.first_name} ${w.last_name} (${w.document_number})`
                }
                renderInput={(params) => (
                  <TextField {...params} label="Trabajadores" />
                )}
              />
            </Box>
            <Box sx={{ flex: "0 1 220px", minWidth: 220 }}>
              <TextField
                label="Fecha"
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenAssignDialog(false)}
            disabled={assigning}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkAssign}
            disabled={assigning}
          >
            {assigning ? <CircularProgress size={18} /> : "Asignar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Deseas eliminar la autoinspección #{inspectionToDelete?.id}? Esta
            acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={18} /> : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ErgonomicSelfInspectionAdmin;
