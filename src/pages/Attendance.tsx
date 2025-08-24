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
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Download,
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker as MUIDatePicker } from "@mui/x-date-pickers/DatePicker";
import { formatDate } from "../utils/dateUtils";
import api from "./../services/api";
import { useAuth } from "../contexts/AuthContext";

import { AttendanceStatus, AttendanceType, AttendanceStats } from "./../types";

interface Attendance {
  id: number;
  user_id: number;
  course_id: number;
  session_date: string;
  status: AttendanceStatus;
  attendance_type: AttendanceType;
  check_in_time?: string;
  check_out_time?: string;
  duration_minutes?: number;
  scheduled_duration_minutes?: number;
  completion_percentage: number;
  notes?: string;
  verified_by?: number;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  // Información del usuario y curso (del backend)
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    full_name: string;
  };
  course?: {
    id: number;
    title: string;
    type?: string;
  };
}

interface AttendanceFormData {
  user_id: number;
  course_id: number;
  session_date: string;
  status: AttendanceStatus;
  attendance_type: AttendanceType;
  check_in_time?: string;
  check_out_time?: string;
  duration_minutes?: number;
  duration_hours?: number;
  scheduled_duration_minutes?: number;
  completion_percentage: number;
  notes?: string;
  verified_by?: number;
  verified_at?: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
}

interface Course {
  id: number;
  title: string;
  description?: string;
  duration_hours?: number;
  course_type?: string;
  status?: string;
}

const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  // const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalAttendances, setTotalAttendances] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(
    null
  );
  const [formData, setFormData] = useState<AttendanceFormData>({
    user_id: 0,
    course_id: 0,
    session_date: "",
    status: AttendanceStatus.PRESENT,
    attendance_type: AttendanceType.IN_PERSON,
    check_in_time: "",
    check_out_time: "",
    duration_minutes: 0,
    scheduled_duration_minutes: 0,
    completion_percentage: 100,
    notes: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    partial: 0,
    attendance_rate: 0,
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingAttendance, setDeletingAttendance] =
    useState<Attendance | null>(null);

  // (Move this useEffect below the function declarations)

  useEffect(() => {
    fetchAttendances();
    fetchStats();
    fetchCourses();
    fetchUsers();
    // fetchSessions();
    // eslint-disable-next-line
  }, [page, rowsPerPage, statusFilter, dateFilter]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        presente:
          statusFilter === "present"
            ? true
            : statusFilter === "absent"
            ? false
            : undefined,
        session_date: dateFilter
          ? dateFilter.toISOString().split("T")[0]
          : undefined,
      };

      // Para empleados, solo mostrar sus propios registros
      if (user?.rol === "employee") {
        params.user_id = user.id;
      } else {
        // Para administradores, permitir búsqueda por empleado
        if (searchTerm) {
          params.search = searchTerm;
        }
      }

      const response = await api.get("/attendance", { params });
      setAttendances(response.data.items || []);
      setTotalAttendances(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching attendances:", error);
      showSnackbar("Error al cargar asistencias", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    // Solo cargar usuarios para administradores
    if (user?.rol === "employee") {
      return;
    }

    try {
      const response = await api.get("/users", {
        params: {
          rol: "employee",
          activo: true,
        },
      });
      setUsers(response.data.items || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses", {
        params: {
          status: "published",
        },
      });
      setCourses(response.data.items || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  // const fetchSessions = async () => {
  //   try {
  //     const response = await api.get('/sessions', {
  //       params: {
  //         activo: true
  //       }
  //     });
  //     setSessions(response.data.items || []);
  //   } catch (error) {
  //     console.error('Error fetching sessions:', error);
  //   }
  // };

  const fetchStats = async () => {
    try {
      const response = await api.get("/attendance/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCreateAttendance = () => {
    setEditingAttendance(null);
    setFormData({
      user_id: 0,
      course_id: 0,
      session_date: "",
      status: AttendanceStatus.PRESENT,
      attendance_type: AttendanceType.IN_PERSON,
      check_in_time: "",
      check_out_time: "",
      duration_minutes: 0,
      scheduled_duration_minutes: 0,
      completion_percentage: 100,
      notes: "",
      verified_by: undefined,
      verified_at: undefined,
    });
    setOpenDialog(true);
  };

  const handleEditAttendance = (attendance: Attendance) => {
    setEditingAttendance(attendance);
    setFormData({
      user_id: attendance.user_id,
      course_id: attendance.course_id,
      session_date: attendance.session_date,
      status: attendance.status,
      attendance_type: attendance.attendance_type,
      check_in_time: attendance.check_in_time || "",
      check_out_time: attendance.check_out_time || "",
      duration_minutes: attendance.duration_minutes || 0,
      scheduled_duration_minutes: attendance.scheduled_duration_minutes || 0,
      completion_percentage: attendance.completion_percentage,
      notes: attendance.notes || "",
      verified_by: attendance.verified_by,
      verified_at: attendance.verified_at,
    });
    setOpenDialog(true);
  };

  const handleSaveAttendance = async () => {
    try {
      // Convertir la fecha a formato datetime ISO si solo es una fecha
      const sessionDate = formData.session_date.includes("T")
        ? formData.session_date
        : `${formData.session_date}T00:00:00`;

      // Convertir tiempos a datetime completos usando la fecha de sesión
      const convertTimeToDateTime = (time: string, baseDate: string) => {
        if (!time) return null;
        const date = baseDate.split("T")[0]; // Obtener solo la parte de fecha
        return `${date}T${time}:00`;
      };

      const dataToSend = {
        ...formData,
        session_date: sessionDate,
        check_in_time: convertTimeToDateTime(
          formData.check_in_time || "",
          sessionDate
        ),
        check_out_time: convertTimeToDateTime(
          formData.check_out_time || "",
          sessionDate
        ),
      };

      if (editingAttendance) {
        await api.put(`/attendance/${editingAttendance.id}`, dataToSend);
        showSnackbar("Asistencia actualizada exitosamente", "success");
      } else {
        await api.post("/attendance", dataToSend);
        showSnackbar("Asistencia registrada exitosamente", "success");
      }

      setOpenDialog(false);
      fetchAttendances();
      fetchStats();
    } catch (error) {
      console.error("Error saving attendance:", error);
      showSnackbar("Error al guardar asistencia", "error");
    }
  };

  const handleDeleteAttendance = (attendance: Attendance) => {
    setDeletingAttendance(attendance);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteAttendance = async () => {
    if (deletingAttendance) {
      try {
        await api.delete(`/attendance/${deletingAttendance.id}`);
        showSnackbar(
          "Registro de asistencia eliminado exitosamente",
          "success"
        );
        fetchAttendances();
        fetchStats();
        setOpenDeleteDialog(false);
        setDeletingAttendance(null);
      } catch (error) {
        console.error("Error deleting attendance:", error);
        showSnackbar("Error al eliminar registro de asistencia", "error");
      }
    }
  };

  const handleExportAttendance = async () => {
    try {
      const response = await api.get("/attendance/export", {
        responseType: "blob",
        params: {
          session_date: dateFilter
            ? dateFilter.toISOString().split("T")[0]
            : undefined,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `asistencia_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      showSnackbar("Reporte de asistencia exportado exitosamente", "success");
    } catch (error) {
      console.error("Error exporting attendance:", error);
      showSnackbar("Error al exportar reporte de asistencia", "error");
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Asistencia
        </Typography>

        {/* Estadísticas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Registros
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Presentes
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.present}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Ausentes
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.absent}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Tarde
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.late}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Excusados
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.excused}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Tasa de Asistencia
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.attendance_rate.toFixed(1)}%
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
          {user?.rol !== "employee" && (
            <TextField
              placeholder="Buscar por empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{ minWidth: 300 }}
            />
          )}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Estado"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="present">Presentes</MenuItem>
              <MenuItem value="absent">Ausentes</MenuItem>
            </Select>
          </FormControl>
          <MUIDatePicker
            label="Filtrar por fecha"
            value={dateFilter}
            onChange={(newValue) => setDateFilter(newValue)}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: 150 },
              },
            }}
          />
          {user?.rol !== "employee" && (
            <>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateAttendance}
              >
                Registrar Asistencia
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExportAttendance}
              >
                Exportar
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAttendances}
          >
            Actualizar
          </Button>
        </Box>

        {/* Tabla de asistencias */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                {user?.rol !== "employee" && <TableCell>Usuario</TableCell>}
                <TableCell>Curso</TableCell>
                <TableCell>Fecha Sesión</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Entrada</TableCell>
                <TableCell>Salida</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell>% Completado</TableCell>
                <TableCell>Notas</TableCell>
                {user?.rol !== "employee" && (
                  <TableCell align="center">Acciones</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={user?.rol === "employee" ? 11 : 13}
                    align="center"
                  >
                    Cargando registros de asistencia...
                  </TableCell>
                </TableRow>
              ) : !attendances || attendances.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={user?.rol === "employee" ? 11 : 13}
                    align="center"
                  >
                    No se encontraron registros de asistencia
                  </TableCell>
                </TableRow>
              ) : (
                (attendances || []).map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>{attendance.id}</TableCell>
                    {user?.rol !== "employee" && (
                      <TableCell>
                        {attendance.user
                          ? attendance.user.full_name
                          : "Usuario no encontrado"}
                      </TableCell>
                    )}
                    <TableCell>
                      {attendance.course
                        ? attendance.course.title
                        : `Curso ${attendance.course_id}`}
                    </TableCell>
                    <TableCell>{formatDate(attendance.session_date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          attendance.status === AttendanceStatus.PRESENT
                            ? "Presente"
                            : attendance.status === AttendanceStatus.ABSENT
                            ? "Ausente"
                            : attendance.status === AttendanceStatus.LATE
                            ? "Tardío"
                            : "Excusado"
                        }
                        color={
                          attendance.status === AttendanceStatus.PRESENT
                            ? "success"
                            : attendance.status === AttendanceStatus.LATE
                            ? "warning"
                            : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          attendance.attendance_type ===
                          AttendanceType.IN_PERSON
                            ? "Presencial"
                            : "Virtual"
                        }
                        color={
                          attendance.attendance_type ===
                          AttendanceType.IN_PERSON
                            ? "primary"
                            : "secondary"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{attendance.check_in_time || "N/A"}</TableCell>
                    <TableCell>{attendance.check_out_time || "N/A"}</TableCell>
                    <TableCell>
                      {attendance.duration_minutes
                        ? `${attendance.duration_minutes} min`
                        : "N/A"}
                    </TableCell>
                    <TableCell>{attendance.completion_percentage}%</TableCell>
                    <TableCell>{attendance.notes || "N/A"}</TableCell>
                    {user?.rol !== "employee" && (
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditAttendance(attendance)}
                          size="small"
                          title="Editar"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteAttendance(attendance)}
                          size="small"
                          title="Eliminar"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalAttendances}
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

        {/* Dialog para crear/editar asistencia */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingAttendance
              ? "Editar Asistencia"
              : "Registrar Nueva Asistencia"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={12}>
                <FormControl fullWidth required>
                  <InputLabel>Empleado</InputLabel>
                  <Select
                    value={formData.user_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        user_id: e.target.value as number,
                      })
                    }
                    label="Empleado"
                    disabled={!!editingAttendance}
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.full_name ||
                          `${user.first_name} ${user.last_name}`}{" "}
                        ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth required>
                  <InputLabel>Curso</InputLabel>
                  <Select
                    value={formData.course_id}
                    onChange={(e) => {
                      const courseId = e.target.value as number;
                      const selectedCourse = courses.find(
                        (course) => course.id === courseId
                      );
                      setFormData({
                        ...formData,
                        course_id: courseId,
                        duration_hours: selectedCourse?.duration_hours || 0,
                      });
                    }}
                    label="Curso"
                    disabled={!!editingAttendance}
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Fecha de Sesión"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) =>
                    setFormData({ ...formData, session_date: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={!!editingAttendance}
                />
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as AttendanceStatus,
                      })
                    }
                    label="Estado"
                  >
                    <MenuItem value={AttendanceStatus.PRESENT}>
                      Presente
                    </MenuItem>
                    <MenuItem value={AttendanceStatus.ABSENT}>Ausente</MenuItem>
                    <MenuItem value={AttendanceStatus.LATE}>Tardío</MenuItem>
                    <MenuItem value={AttendanceStatus.EXCUSED}>
                      Excusado
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Asistencia</InputLabel>
                  <Select
                    value={formData.attendance_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attendance_type: e.target.value as AttendanceType,
                      })
                    }
                    label="Tipo de Asistencia"
                  >
                    <MenuItem value={AttendanceType.IN_PERSON}>
                      Presencial
                    </MenuItem>
                    <MenuItem value={AttendanceType.VIRTUAL}>Virtual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Hora de Entrada"
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) =>
                    setFormData({ ...formData, check_in_time: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Hora de Salida"
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) =>
                    setFormData({ ...formData, check_out_time: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Duración (minutos)"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_minutes: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Duración Programada (minutos)"
                  type="number"
                  value={formData.scheduled_duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduled_duration_minutes: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Porcentaje de Completado"
                  type="number"
                  inputProps={{ min: 0, max: 100 }}
                  value={formData.completion_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      completion_percentage: Number(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  multiline
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveAttendance} variant="contained">
              {editingAttendance ? "Actualizar" : "Registrar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Attendance Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">
            Confirmar Eliminación
          </DialogTitle>
          <DialogContent>
            <Typography id="delete-dialog-description">
              ¿Está seguro de que desea eliminar este registro de asistencia
              para {deletingAttendance?.user?.full_name}? Esta acción no se
              puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteAttendance}
              color="error"
              variant="contained"
            >
              Eliminar
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
    </LocalizationProvider>
  );
};

export default AttendanceManagement;
