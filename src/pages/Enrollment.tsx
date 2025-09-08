import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  CheckCircle,
  Cancel,
  School,
  Person,
  Warning,
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
  Card,
  CardContent,

  Grid,
} from "@mui/material";
import React, { useState, useEffect } from "react";


import { formatDate, formatDateTime } from '../utils/dateUtils';

import api from "./../services/api";
import { Inscripcion } from "./../types";

// Enums del backend
enum EnrollmentStatus {
  PENDING = "pending",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  SUSPENDED = "suspended"
}

// Interfaces actualizadas
interface Enrollment {
  id: number;
  user_id?: number;  // Opcional para compatibilidad
  worker_id?: number;  // Para inscripciones de trabajadores
  course_id: number;
  status: EnrollmentStatus;
  progress: number;
  grade?: number;
  notes?: string;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Objetos anidados
  user?: User;
  worker?: Worker;
  course?: Course;
  evaluation?: {
    score?: number;
    percentage?: number;
    total_points?: number;
    max_points?: number;
    status?: string;
  };
  // Campos legacy para compatibilidad
  usuario?: User;
  curso?: Course;
  usuario_id?: number;
  curso_id?: number;
  estado?: string;
  fecha_inscripcion?: string | Date;
  completado?: boolean;
  calificacion?: number;
}

interface EnrollmentFormData {
  user_id?: number;  // Opcional para compatibilidad
  worker_id?: number;  // Para inscripciones de trabajadores
  course_id: number;
  status: EnrollmentStatus;
  progress: number;
  grade?: number;
  notes?: string;
  // Campos legacy
  usuario_id?: number;
  curso_id: number;
}

interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  full_name?: string;
  // Campos legacy
  nombre: string;
  apellido: string;
}

interface Worker {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  full_name?: string;
  position?: string;
  profession?: string;
  is_active: boolean;
  is_registered: boolean;
  // Campos legacy
  nombre?: string;
  apellido?: string;
}

interface Course {
  id: number;
  title: string;
  description?: string;
  course_type?: string;
  status?: string;
  duration_hours?: number;
  // Campos legacy
  titulo: string;
}

const EnrollmentsManagement: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [workerSearchTerm, setWorkerSearchTerm] = useState("");
  const [formData, setFormData] = useState<EnrollmentFormData>({
    worker_id: 0,
    course_id: 0,
    status: EnrollmentStatus.PENDING,
    progress: 0,
    grade: undefined,
    notes: "",
    // Campos legacy
    usuario_id: 0,
    curso_id: 0,
  });
  const [bulkFormData, setBulkFormData] = useState({
    course_id: 0,
    status: EnrollmentStatus.PENDING,
    notes: ""
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
  });
  
  // Estados para diálogo de confirmación de eliminación
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState<Enrollment | null>(null);
  

  
  // Estados para diálogo de edición
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [enrollmentToEdit, setEnrollmentToEdit] = useState<Enrollment | null>(null);
  const [editFormData, setEditFormData] = useState<EnrollmentFormData>({
    worker_id: 0,
    course_id: 0,
    status: EnrollmentStatus.PENDING,
    progress: 0,
    grade: undefined,
    notes: "",
    usuario_id: 0,
    curso_id: 0,
  });

  useEffect(() => {
    fetchEnrollments();
    fetchUsers();
    fetchCourses();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  // Cargar trabajadores disponibles cuando se selecciona un curso para inscripción masiva
  useEffect(() => {
    if (bulkFormData.course_id && openBulkDialog) {
      fetchAvailableWorkersForCourse(bulkFormData.course_id);
    }
  }, [bulkFormData.course_id, openBulkDialog]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/enrollments", {
        params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: searchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });
      // Mapear campos del backend a campos legacy del frontend
      const mappedEnrollments = (response.data.items || []).map((enrollment: any) => ({
        ...enrollment,
        // Campos del nuevo schema
        id: enrollment.id,
        user_id: enrollment.user_id,
        worker_id: enrollment.worker_id,
        course_id: enrollment.course_id,
        status: enrollment.status,
        progress: enrollment.progress || 0,
        grade: enrollment.grade,
        notes: enrollment.notes,
        enrolled_at: enrollment.enrolled_at,
        started_at: enrollment.started_at,
        completed_at: enrollment.completed_at,
        created_at: enrollment.created_at,
        updated_at: enrollment.updated_at,
        user: enrollment.user,
        // Crear objetos con los datos del backend para compatibilidad
        worker: enrollment.worker || {
          full_name: enrollment.full_name,
          first_name: enrollment.full_name?.split(' ')[0] || '',
          last_name: enrollment.full_name?.split(' ').slice(1).join(' ') || ''
        },
        course: enrollment.course || {
          title: enrollment.course_title,
          titulo: enrollment.course_title
        },
        evaluation: enrollment.evaluation,
        // Campos legacy para compatibilidad
        usuario_id: enrollment.user_id || enrollment.worker_id,
        curso_id: enrollment.course_id,
        estado: enrollment.status,
        fecha_inscripcion: enrollment.enrolled_at,
      }));
      setEnrollments(mappedEnrollments);
      setTotalEnrollments(response.data.total);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      showSnackbar("No se pudieron cargar las inscripciones. Verifique su conexión e intente nuevamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/workers/", {
          params: { is_active: true },
        });
        // Filter only workers that are registered
        const registeredWorkers = (response.data || []).filter((worker: any) => worker.is_registered);
      // Mapear campos del backend a campos legacy del frontend
      const mappedUsers = registeredWorkers.map((worker: any) => ({
        ...worker,
        // Campos del nuevo schema - usar id del worker
        id: worker.id,
        first_name: worker.first_name,
        last_name: worker.last_name,
        email: worker.email,
        full_name: worker.full_name || `${worker.first_name} ${worker.last_name}`,
        // Campos legacy para compatibilidad
        nombre: worker.first_name || worker.nombre || '',
        apellido: worker.last_name || worker.apellido || '',
      }));
        setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses", {
        params: {
          status: "published",
        },
      });
      // Mapear campos del backend a campos legacy del frontend
      const mappedCourses = (response.data.items || []).map((course: any) => ({
        ...course,
        // Campos del nuevo schema
        id: course.id,
        title: course.title,
        description: course.description,
        course_type: course.course_type,
        status: course.status,
        duration_hours: course.duration_hours,
        // Campos legacy para compatibilidad
        titulo: course.title || course.titulo || '',
      }));
       setCourses(mappedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/enrollments/stats");
      // Mapear campos del backend a campos del frontend
      setStats({
        total: response.data.total_enrollments || 0,
        completed: response.data.completed_enrollments || 0,
        in_progress: response.data.active_enrollments || 0,
        pending: response.data.pending_enrollments || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // En caso de error, mantener valores por defecto
      setStats({
        total: 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
      });
    }
  };

  const fetchWorkers = async () => {
    try {
      setLoadingWorkers(true);
      const response = await api.get("/workers/basic", {
        params: {
          search: workerSearchTerm || undefined,
          limit: 100,
          is_active: true
        },
      });
      setWorkers(response.data || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
      showSnackbar("No se pudieron cargar los trabajadores. Verifique su conexión e intente nuevamente.", "error");
    } finally {
      setLoadingWorkers(false);
    }
  };

  const fetchAvailableWorkersForCourse = async (courseId: number) => {
    try {
      setLoadingWorkers(true);
      
      // Obtener todos los trabajadores activos
      const workersResponse = await api.get("/workers/basic", {
        params: {
          search: workerSearchTerm || undefined,
          limit: 100,
          is_active: true
        },
      });
      
      // Obtener trabajadores ya inscritos en el curso
      const enrolledResponse = await api.get(`/enrollments/course/${courseId}/workers`);
      const enrolledWorkerIds = (enrolledResponse.data.enrolled_workers || []).map((worker: any) => worker.worker_id || worker.user_id);
      
      // Filtrar trabajadores disponibles (no inscritos)
      const availableWorkers = (workersResponse.data || []).filter((worker: any) => 
        !enrolledWorkerIds.includes(worker.id)
      );
      
      setWorkers(availableWorkers);
    } catch (error) {
      console.error("Error fetching available workers for course:", error);
      // Si falla, cargar todos los trabajadores como fallback
      fetchWorkers();
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleCreateEnrollment = () => {
    setFormData({
      worker_id: 0,
      course_id: 0,
      status: EnrollmentStatus.PENDING,
      progress: 0,
      grade: undefined,
      notes: '',
      // Legacy fields for compatibility
      usuario_id: 0,
      curso_id: 0,
    });
    setOpenDialog(true);
  };

  const handleCreateBulkEnrollment = () => {
    setBulkFormData({
      course_id: 0,
      status: EnrollmentStatus.PENDING,
      notes: ""
    });
    setSelectedWorkers([]);
    fetchWorkers();
    setOpenBulkDialog(true);
  };

  const handleWorkerSelection = (workerId: number) => {
    setSelectedWorkers(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const handleSelectAllWorkers = () => {
    if (selectedWorkers.length === workers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(workers.map(worker => worker.id));
    }
  };

  const handleSaveEnrollment = async () => {
    try {
      const enrollmentData = {
        worker_id: formData.worker_id || formData.usuario_id,
        course_id: formData.course_id || formData.curso_id,
        status: formData.status || EnrollmentStatus.PENDING,
        progress: formData.progress || 0,
        grade: formData.grade,
        notes: formData.notes || '',
      };
      await api.post("/enrollments", enrollmentData);
      showSnackbar("Inscripción creada exitosamente", "success");
      setOpenDialog(false);
      fetchEnrollments();
      fetchStats();
    } catch (error: any) {
      console.error("Error saving enrollment:", error);
      const errorMessage = error.response?.data?.detail || "Error al crear inscripción";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleSaveBulkEnrollment = async () => {
    if (selectedWorkers.length === 0) {
      showSnackbar("Debe seleccionar al menos un trabajador", "error");
      return;
    }
    
    if (!bulkFormData.course_id) {
      showSnackbar("Debe seleccionar un curso", "error");
      return;
    }

    try {
      const bulkData = {
        user_ids: selectedWorkers,
        course_id: bulkFormData.course_id,
        status: bulkFormData.status,
        notes: bulkFormData.notes
      };
      
      const response = await api.post("/enrollments/bulk-assign-workers", bulkData);
      
      const { successful_count, failed_count } = response.data;
      
      if (failed_count > 0) {
        showSnackbar(
          `Inscripción completada: ${successful_count} exitosas, ${failed_count} fallidas`,
          "error"
        );
      } else {
        showSnackbar(
          `${successful_count} trabajadores inscritos exitosamente`,
          "success"
        );
      }
      
      setOpenBulkDialog(false);
      fetchEnrollments();
      fetchStats();
    } catch (error: any) {
      console.error("Error saving bulk enrollment:", error);
      const errorMessage = error.response?.data?.detail || "Error al crear inscripciones masivas";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleDeleteEnrollment = (enrollment: Enrollment) => {
    setEnrollmentToDelete(enrollment);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteEnrollment = async () => {
    if (!enrollmentToDelete) return;
    
    try {
      await api.delete(`/enrollments/${enrollmentToDelete.id}`);
      showSnackbar("Inscripción eliminada exitosamente", "success");
      fetchEnrollments();
      fetchStats();
    } catch (error: any) {
      console.error("Error deleting enrollment:", error);
      const errorMessage = error.response?.data?.detail || "Error al eliminar inscripción";
      showSnackbar(errorMessage, "error");
    } finally {
      setOpenDeleteDialog(false);
      setEnrollmentToDelete(null);
    }
  };

  const cancelDeleteEnrollment = () => {
    setOpenDeleteDialog(false);
    setEnrollmentToDelete(null);
  };



  const handleEditEnrollment = (enrollment: Enrollment) => {
    setEnrollmentToEdit(enrollment);
    setEditFormData({
      worker_id: enrollment.worker_id || enrollment.user_id || enrollment.usuario_id || 0,
      course_id: enrollment.course_id || enrollment.curso_id || 0,
      status: enrollment.status || EnrollmentStatus.PENDING,
      progress: enrollment.progress || 0,
      grade: enrollment.grade || enrollment.calificacion,
      notes: enrollment.notes || "",
      usuario_id: enrollment.worker_id || enrollment.user_id || enrollment.usuario_id || 0,
      curso_id: enrollment.course_id || enrollment.curso_id || 0,
    });
    setOpenEditDialog(true);
  };

  const handleSaveEditEnrollment = async () => {
    if (!enrollmentToEdit) return;
    
    try {
      const enrollmentData = {
        worker_id: editFormData.worker_id || editFormData.usuario_id,
        course_id: editFormData.course_id || editFormData.curso_id,
        status: editFormData.status,
        progress: editFormData.progress || 0,
        grade: editFormData.grade,
        notes: editFormData.notes || '',
      };
      
      await api.put(`/enrollments/${enrollmentToEdit.id}`, enrollmentData);
      showSnackbar("Inscripción actualizada exitosamente", "success");
      setOpenEditDialog(false);
      setEnrollmentToEdit(null);
      fetchEnrollments();
      fetchStats();
    } catch (error: any) {
      console.error("Error updating enrollment:", error);
      const errorMessage = error.response?.data?.detail || "Error al actualizar inscripción";
      showSnackbar(errorMessage, "error");
    }
  };

  const cancelEditEnrollment = () => {
    setOpenEditDialog(false);
    setEnrollmentToEdit(null);
  };

  const handleToggleCompletion = async (
    enrollmentId: number,
    currentStatus: EnrollmentStatus
  ) => {
    try {
      const newStatus = currentStatus === EnrollmentStatus.COMPLETED 
        ? EnrollmentStatus.ACTIVE 
        : EnrollmentStatus.COMPLETED;
      
      await api.put(`/enrollments/${enrollmentId}`, { 
        status: newStatus,
        progress: newStatus === EnrollmentStatus.COMPLETED ? 100 : undefined
      });
      
      showSnackbar(
        `Inscripción ${newStatus === EnrollmentStatus.COMPLETED ? "completada" : "marcada como activa"}`,
        "success"
      );
      fetchEnrollments();
      fetchStats();
    } catch (error: any) {
      console.error("Error updating enrollment:", error);
      const errorMessage = error.response?.data?.detail || "Error al actualizar inscripción";
      showSnackbar(errorMessage, "error");
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status: EnrollmentStatus) => {
    switch (status) {
      case EnrollmentStatus.COMPLETED:
        return "success";
      case EnrollmentStatus.ACTIVE:
        return "info";
      case EnrollmentStatus.PENDING:
        return "warning";
      case EnrollmentStatus.CANCELLED:
        return "error";
      case EnrollmentStatus.SUSPENDED:
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: EnrollmentStatus) => {
    switch (status) {
      case EnrollmentStatus.COMPLETED:
        return "Completado";
      case EnrollmentStatus.ACTIVE:
        return "Activo";
      case EnrollmentStatus.PENDING:
        return "Pendiente";
      case EnrollmentStatus.CANCELLED:
        return "Cancelado";
      case EnrollmentStatus.SUSPENDED:
        return "Suspendido";
      default:
        return "Desconocido";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Inscripciones
      </Typography>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Inscripciones
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completadas
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                En Progreso
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.in_progress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pendientes
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barra de herramientas */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <TextField
          placeholder="Buscar inscripciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
          sx={{ minWidth: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Estado"
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="completed">Completados</MenuItem>
            <MenuItem value="pending">Pendientes</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateEnrollment}
        >
          Nueva Inscripción
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Person />}
          onClick={handleCreateBulkEnrollment}
        >
          Inscripción Masiva
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchEnrollments}
        >
          Actualizar
        </Button>
      </Box>

      {/* Tabla de inscripciones */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Empleado</TableCell>
              <TableCell>Curso</TableCell>
              <TableCell>Fecha Inscripción</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Calificación</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Cargando inscripciones...
                </TableCell>
              </TableRow>
            ) : enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron inscripciones
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>{enrollment.id}</TableCell>
                  <TableCell>
                    {enrollment.worker
                      ? enrollment.worker.full_name || `${enrollment.worker.first_name || enrollment.worker.nombre || ''} ${enrollment.worker.last_name || enrollment.worker.apellido || ''}`
                      : enrollment.user
                      ? enrollment.user.full_name || `${enrollment.user.first_name || enrollment.user.nombre || ''} ${enrollment.user.last_name || enrollment.user.apellido || ''}`
                      : enrollment.usuario
                      ? `${enrollment.usuario.nombre} ${enrollment.usuario.apellido}`
                      : "Trabajador no encontrado"}
                  </TableCell>
                  <TableCell>
                    {enrollment.course
                      ? enrollment.course.title || enrollment.course.titulo
                      : enrollment.curso
                      ? enrollment.curso.titulo
                      : "Curso no encontrado"}
                  </TableCell>
                  <TableCell>
                    {enrollment.enrolled_at || enrollment.fecha_inscripcion
                      ? formatDate(
                          enrollment.enrolled_at || enrollment.fecha_inscripcion!
                        )
                      : "Sin fecha"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(enrollment.status || (enrollment.completado ? EnrollmentStatus.COMPLETED : EnrollmentStatus.PENDING))}
                      color={getStatusColor(enrollment.status || (enrollment.completado ? EnrollmentStatus.COMPLETED : EnrollmentStatus.PENDING)) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {enrollment.evaluation && enrollment.evaluation.score !== null
                      ? `${enrollment.evaluation.score}/100`
                      : enrollment.evaluation && enrollment.evaluation.percentage !== null
                      ? `${enrollment.evaluation.percentage}%`
                      : enrollment.grade || enrollment.calificacion
                      ? `${enrollment.grade || enrollment.calificacion}/100`
                      : "Sin calificar"}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color={(enrollment.status || (enrollment.completado ? EnrollmentStatus.COMPLETED : EnrollmentStatus.PENDING)) === EnrollmentStatus.COMPLETED ? "warning" : "success"}
                      onClick={() =>
                        handleToggleCompletion(
                          enrollment.id,
                          enrollment.status || (enrollment.completado ? EnrollmentStatus.COMPLETED : EnrollmentStatus.PENDING)
                        )
                      }
                      size="small"
                      title={
                        (enrollment.status || (enrollment.completado ? EnrollmentStatus.COMPLETED : EnrollmentStatus.PENDING)) === EnrollmentStatus.COMPLETED
                          ? "Marcar como activo"
                          : "Marcar como completado"
                      }
                    >
                      {(enrollment.status || (enrollment.completado ? EnrollmentStatus.COMPLETED : EnrollmentStatus.PENDING)) === EnrollmentStatus.COMPLETED ? <Cancel /> : <CheckCircle />}
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditEnrollment(enrollment)}
                      size="small"
                      title="Editar inscripción"
                      sx={{ ml: 0.5 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteEnrollment(enrollment)}
                      size="small"
                      title="Cancelar inscripción"
                      sx={{ ml: 0.5 }}
                    >
                      <Delete />
                    </IconButton>

                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalEnrollments}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
        />
      </TableContainer>

      {/* Dialog para crear inscripción */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear Nueva Inscripción</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Empleado</InputLabel>
                <Select
                  value={formData.worker_id || formData.usuario_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      worker_id: e.target.value as number,
                      usuario_id: e.target.value as number,
                    })
                  }
                  label="Empleado"
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.full_name || `${user.first_name || user.nombre || ''} ${user.last_name || user.apellido || ''}`} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Curso</InputLabel>
                <Select
                  value={formData.course_id || formData.curso_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_id: e.target.value as number,
                      curso_id: e.target.value as number,
                    })
                  }
                  label="Curso"
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.title || course.titulo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status || EnrollmentStatus.PENDING}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as EnrollmentStatus,
                    })
                  }
                  label="Estado"
                >
                  <MenuItem value={EnrollmentStatus.PENDING}>Pendiente</MenuItem>
                  <MenuItem value={EnrollmentStatus.ACTIVE}>Activo</MenuItem>
                  <MenuItem value={EnrollmentStatus.COMPLETED}>Completado</MenuItem>
                  <MenuItem value={EnrollmentStatus.CANCELLED}>Cancelado</MenuItem>
                  <MenuItem value={EnrollmentStatus.SUSPENDED}>Suspendido</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label="Progreso (%)"
                type="number"
                value={formData.progress || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                  })
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label="Calificación"
                type="number"
                value={formData.grade || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    grade: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Notas"
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notes: e.target.value,
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveEnrollment} variant="contained">
            Crear Inscripción
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para inscripción masiva */}
      <Dialog
        open={openBulkDialog}
        onClose={() => setOpenBulkDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Inscripción Masiva de Trabajadores</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Curso</InputLabel>
                <Select
                  value={bulkFormData.course_id}
                  onChange={(e) =>
                    setBulkFormData({
                      ...bulkFormData,
                      course_id: e.target.value as number,
                    })
                  }
                  label="Curso"
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.title || course.titulo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={bulkFormData.status}
                  onChange={(e) =>
                    setBulkFormData({
                      ...bulkFormData,
                      status: e.target.value as EnrollmentStatus,
                    })
                  }
                  label="Estado"
                >
                  <MenuItem value={EnrollmentStatus.PENDING}>Pendiente</MenuItem>
                  <MenuItem value={EnrollmentStatus.ACTIVE}>Activo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                placeholder="Buscar trabajadores..."
                value={workerSearchTerm}
                onChange={(e) => setWorkerSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchWorkers()}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Notas"
                multiline
                rows={2}
                value={bulkFormData.notes}
                onChange={(e) =>
                  setBulkFormData({
                    ...bulkFormData,
                    notes: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Seleccionar Trabajadores ({selectedWorkers.length} seleccionados)
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSelectAllWorkers}
                >
                  {selectedWorkers.length === workers.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </Button>
              </Box>
              <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">Seleccionar</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Documento</TableCell>
                      <TableCell>Departamento</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingWorkers ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Cargando trabajadores...
                        </TableCell>
                      </TableRow>
                    ) : workers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No se encontraron trabajadores
                        </TableCell>
                      </TableRow>
                    ) : (
                      workers.map((worker) => (
                        <TableRow key={worker.id}>
                          <TableCell padding="checkbox">
                            <input
                              type="checkbox"
                              checked={selectedWorkers.includes(worker.id)}
                              onChange={() => handleWorkerSelection(worker.id)}
                            />
                          </TableCell>
                          <TableCell>{worker.full_name}</TableCell>
                          <TableCell>{worker.document_number}</TableCell>
                          <TableCell>{worker.department}</TableCell>
                          <TableCell>
                            <Chip
                              label={worker.is_registered ? "Registrado" : "No Registrado"}
                              color={worker.is_registered ? "success" : "warning"}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDialog(false)}>Cancelar</Button>
          <Button onClick={fetchWorkers} disabled={loadingWorkers}>
            Buscar
          </Button>
          <Button 
            onClick={handleSaveBulkEnrollment} 
            variant="contained"
            disabled={selectedWorkers.length === 0 || !bulkFormData.course_id}
          >
            Inscribir Trabajadores ({selectedWorkers.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar inscripción */}
      <Dialog
        open={openDeleteDialog}
        onClose={cancelDeleteEnrollment}
        aria-labelledby="delete-enrollment-dialog-title"
        aria-describedby="delete-enrollment-dialog-description"
      >
        <DialogTitle id="delete-enrollment-dialog-title">
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            Confirmar Eliminación
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-enrollment-dialog-description">
            ¿Estás seguro de que deseas eliminar esta inscripción? Esta acción no se puede deshacer.
            {enrollmentToDelete && (
              <Box mt={2}>
                <strong>Usuario:</strong> {enrollmentToDelete.user?.full_name || enrollmentToDelete.usuario?.nombre || 'N/A'}<br />
                <strong>Curso:</strong> {enrollmentToDelete.course?.title || enrollmentToDelete.curso?.titulo || 'N/A'}
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteEnrollment} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmDeleteEnrollment} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>



      {/* Diálogo para editar inscripción */}
      <Dialog
        open={openEditDialog}
        onClose={cancelEditEnrollment}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Inscripción</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Empleado</InputLabel>
                <Select
                  value={editFormData.worker_id || editFormData.usuario_id}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      worker_id: e.target.value as number,
                      usuario_id: e.target.value as number,
                    })
                  }
                  label="Empleado"
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.full_name || `${user.first_name || user.nombre || ''} ${user.last_name || user.apellido || ''}`} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Curso</InputLabel>
                <Select
                  value={editFormData.course_id || editFormData.curso_id}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      course_id: e.target.value as number,
                      curso_id: e.target.value as number,
                    })
                  }
                  label="Curso"
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.title || course.titulo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      status: e.target.value as EnrollmentStatus,
                    })
                  }
                  label="Estado"
                >
                  <MenuItem value={EnrollmentStatus.PENDING}>Pendiente</MenuItem>
                  <MenuItem value={EnrollmentStatus.ACTIVE}>Activo</MenuItem>
                  <MenuItem value={EnrollmentStatus.COMPLETED}>Completado</MenuItem>
                  <MenuItem value={EnrollmentStatus.SUSPENDED}>Suspendido</MenuItem>
                  <MenuItem value={EnrollmentStatus.CANCELLED}>Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Progreso (%)"
                type="number"
                value={editFormData.progress}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Calificación"
                type="number"
                value={editFormData.grade || ''}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    grade: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Notas"
                multiline
                rows={3}
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    notes: e.target.value,
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelEditEnrollment}>Cancelar</Button>
          <Button
            onClick={handleSaveEditEnrollment}
            variant="contained"
            disabled={!editFormData.worker_id || !editFormData.course_id}
          >
            Guardar Cambios
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
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnrollmentsManagement;
