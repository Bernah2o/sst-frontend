import React, { useState, useEffect } from "react";
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
  IconButton,
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
  Pagination,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../utils/dateUtils";
import api from "../services/api";

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  document_number?: string;
  nombre?: string; // Legacy field
  apellido?: string; // Legacy field
  documento?: string; // Legacy field
}

interface Course {
  id: number;
  title?: string;
  description?: string;
  nombre?: string; // Legacy field
}

interface Certificate {
  id: number;
  certificate_number: string;
  title: string;
  user_id: number;
  course_id: number;
  status: "issued" | "expired" | "revoked" | "pending";
  issue_date: string;
  expiry_date?: string;
  score_achieved?: number;
  is_valid: boolean;
  is_expired: boolean;
  user?: User;
  course?: Course;
}

interface Worker {
  id: number;
  nombre?: string; // Legacy field
  apellido?: string; // Legacy field
  documento?: string; // Legacy field
  email: string;
  first_name?: string;
  last_name?: string;
  document_number?: string;
}

const CertificatePage: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [filters, setFilters] = useState({
    user_id: "",
    course_id: "",
    status: "",
    search: "",
    start_date: null as Date | null,
    end_date: null as Date | null,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [formData, setFormData] = useState({
    user_id: "",
    course_id: "",
    expiry_date: null as Date | null,
  });

  const fetchCertificates = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("size", "20");

      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.course_id) params.append("course_id", filters.course_id);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      if (filters.start_date)
        params.append("start_date", filters.start_date.toISOString());
      if (filters.end_date)
        params.append("end_date", filters.end_date.toISOString());

      const response = await api.get(`/certificates/?${params.toString()}`);
      setCertificates(response.data.items || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchCertificates();
    fetchWorkers();
    fetchCourses();
  }, [page, filters, fetchCertificates]);

  const fetchWorkers = async () => {
    try {
      const response = await api.get("/users/");
      setWorkers(response.data.items || response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses/");
      setCourses(response.data.items || response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      await api.post("/certificates/", {
        user_id: parseInt(formData.user_id),
        course_id: parseInt(formData.course_id),
        expiry_date: formData.expiry_date,
      });
      fetchCertificates();
      handleCloseDialog();
    } catch (error) {
      console.error("Error generating certificate:", error);
    }
  };

  const handleGeneratePDF = async (certificateId: number) => {
    try {
      const response = await api.get(`/certificates/${certificateId}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificate_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleDownloadCertificate = async (certificateId: number) => {
    try {
      const response = await api.get(
        `/certificates/${certificateId}/download`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificate_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading certificate:", error);
    }
  };

  const handleRevokeCertificate = async (certificateId: number) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar revocación',
      message: '¿Está seguro de que desea revocar este certificado?',
      onConfirm: async () => {
        try {
          await api.put(`/certificates/${certificateId}/revoke`);
          fetchCertificates();
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (error) {
          console.error("Error revoking certificate:", error);
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      }
    });
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      user_id: "",
      course_id: "",
      status: "",
      search: "",
      start_date: null,
      end_date: null,
    });
    setPage(1);
  };

  const handleOpenDialog = () => {
    setFormData({
      user_id: "",
      course_id: "",
      expiry_date: null,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      issued: { label: "Emitido", color: "success" },
      pending: { label: "Pendiente", color: "warning" },
      expired: { label: "Expirado", color: "warning" },
      revoked: { label: "Revocado", color: "error" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "default",
    };
    return (
      <Chip label={config.label} color={config.color as any} size="small" />
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Certificados
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Administrar certificados de cursos completados
        </Typography>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Buscar"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Número, trabajador, curso..."
                  InputProps={{
                    startAdornment: (
                      <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Usuario</InputLabel>
                  <Select
                    value={filters.user_id}
                    onChange={(e) =>
                      handleFilterChange("user_id", e.target.value)
                    }
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {workers.map((worker) => (
                      <MenuItem key={worker.id} value={worker.id.toString()}>
                        {worker.first_name || worker.nombre}{" "}
                        {worker.last_name || worker.apellido}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Curso</InputLabel>
                  <Select
                    value={filters.course_id}
                    onChange={(e) =>
                      handleFilterChange("course_id", e.target.value)
                    }
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id.toString()}>
                        {course.title || course.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="issued">Emitido</MenuItem>
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="expired">Expirado</MenuItem>
                    <MenuItem value="revoked">Revocado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <DatePicker
                  label="Fecha Inicio"
                  value={filters.start_date}
                  onChange={(date) => handleFilterChange("start_date", date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <Box display="flex" gap={1}>
                  <Tooltip title="Actualizar">
                    <IconButton onClick={fetchCertificates}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    size="small"
                  >
                    Limpiar filtros
                  </Button>
                  {user?.rol !== "employee" && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenDialog}
                      size="small"
                    >
                      Generar
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de Certificados */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Curso</TableCell>
                    <TableCell>Puntuación</TableCell>
                    <TableCell>Fecha Emisión</TableCell>
                    <TableCell>Fecha Expiración</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Cargando certificados...
                      </TableCell>
                    </TableRow>
                  ) : certificates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No se encontraron certificados
                      </TableCell>
                    </TableRow>
                  ) : (
                    certificates.map((certificate) => (
                      <TableRow key={certificate.id}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {certificate.certificate_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {certificate.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {certificate.user
                              ? `${certificate.user.first_name} ${certificate.user.last_name}`
                              : "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {certificate.course
                              ? certificate.course.title
                              : "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {certificate.score_achieved
                              ? `${certificate.score_achieved}%`
                              : "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(certificate.issue_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {certificate.expiry_date
                              ? formatDate(certificate.expiry_date)
                              : "Sin expiración"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(certificate.status)}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Generar PDF">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleGeneratePDF(certificate.id)
                                }
                                disabled={certificate.status === "revoked"}
                                color="primary"
                              >
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Descargar">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDownloadCertificate(certificate.id)
                                }
                                disabled={certificate.status === "revoked"}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            {certificate.status === "issued" &&
                              user?.rol !== "employee" && (
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleRevokeCertificate(certificate.id)
                                  }
                                >
                                  Revocar
                                </Button>
                              )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog para Generar Certificado */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Generar Nuevo Certificado</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Usuario</InputLabel>
                  <Select
                    value={formData.user_id}
                    onChange={(e) =>
                      setFormData({ ...formData, user_id: e.target.value })
                    }
                  >
                    {workers.map((worker) => (
                      <MenuItem key={worker.id} value={worker.id.toString()}>
                        {worker.first_name || worker.nombre}{" "}
                        {worker.last_name || worker.apellido} -{" "}
                        {worker.document_number || worker.documento}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Curso</InputLabel>
                  <Select
                    value={formData.course_id}
                    onChange={(e) =>
                      setFormData({ ...formData, course_id: e.target.value })
                    }
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id.toString()}>
                        {course.title || course.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <DatePicker
                  label="Fecha de Expiración (Opcional)"
                  value={formData.expiry_date}
                  onChange={(date) =>
                    setFormData({ ...formData, expiry_date: date })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleGenerateCertificate}
              variant="contained"
              disabled={!formData.user_id || !formData.course_id}
            >
              Generar Certificado
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmación */}
        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <Typography>{confirmDialog.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              color="inherit"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmDialog.onConfirm}
              variant="contained"
              color="primary"
            >
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CertificatePage;
