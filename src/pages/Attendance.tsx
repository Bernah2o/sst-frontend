import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Download,
  GroupAdd,
  PictureAsPdf,
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
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker as MUIDatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import React, { useState, useEffect } from "react";

import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../utils/dateUtils";
import { logger } from "../utils/logger";
import BulkAttendanceDialog from "../components/BulkAttendanceDialog";

import api from "./../services/api";
import { AttendanceStatus, AttendanceType, AttendanceStats } from "./../types";

interface Attendance {
  id: number;
  user_id: number;
  course_name: string;
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
    first_name?: string;
    last_name?: string;
    email: string;
    full_name?: string;
    // Campos legacy para compatibilidad
    nombre?: string;
    apellido?: string;
  };
  course?: {
    id: number;
    title: string;
    type?: string;
  };
}

interface AttendanceFormData {
  user_id: number;
  course_name: string;
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
  first_name?: string;
  last_name?: string;
  email: string;
  full_name?: string;
  // Campos legacy para compatibilidad
  nombre?: string;
  apellido?: string;
}

const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  // const [courses, setCourses] = useState<Course[]>([]);
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
    course_name: "",
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
    total_attendance: 0,
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
  const [openBulkDialog, setOpenBulkDialog] = useState(false);

  // (Move this useEffect below the function declarations)

  // useEffect para cargar datos iniciales
  useEffect(() => {
    fetchUsers();
    // fetchSessions();
    // eslint-disable-next-line
  }, []);

  // useEffect para actualizar asistencias cuando cambien filtros o paginación
  useEffect(() => {
    fetchAttendances();
    // eslint-disable-next-line
  }, [page, rowsPerPage, statusFilter, dateFilter]);

  // useEffect para actualizar estadísticas cuando cambien solo los filtros relevantes
  // Para empleados, evitamos llamar al endpoint de stats (retorna 403) y
  // computamos estadísticas locales basadas en los registros cargados.
  useEffect(() => {
    if (user?.role !== "employee") {
      fetchStats();
    }
    // eslint-disable-next-line
  }, [statusFilter, dateFilter, user?.role]);

  // Recalcular estadísticas locales para empleados cuando cambien sus asistencias
  useEffect(() => {
    if (user?.role === "employee") {
      const computed = computeEmployeeStats(attendances || []);
      setStats(computed);
    }
    // eslint-disable-next-line
  }, [attendances, user?.role]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        include_user: true,
        status: statusFilter !== "all" ? statusFilter : undefined,
        session_date: dateFilter
          ? dateFilter.toISOString().split("T")[0]
          : undefined,
      };

      // Para empleados, solo mostrar sus propios registros
      if (user?.role === "employee") {
        params.user_id = user.id;
      } else {
        // Para administradores, permitir búsqueda por empleado
        if (searchTerm) {
          params.search = searchTerm;
        }
      }

      const response = await api.get("/attendance/", { params });
      setAttendances(response.data.items || []);
      setTotalAttendances(response.data.total || 0);
    } catch (error) {
      logger.error("Error fetching attendances:", error);
      showSnackbar(
        "📊 No se pudo cargar la información de asistencia. Puede intentar actualizar la página o contactar al administrador si el problema persiste.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    // Solo cargar usuarios para administradores
    if (user?.role === "employee") {
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
      logger.error("Error fetching users:", error);
      showSnackbar(
        "👥 No se pudo cargar la lista de usuarios. Intente actualizar la página.",
        "error"
      );
    }
  };
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();

      // Agregar filtros si están activos
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (dateFilter) {
        const formattedDate = dateFilter.toISOString().split("T")[0];
        params.append("date", formattedDate);
      }

      const queryString = params.toString();
      const url = queryString
        ? `/attendance/stats?${queryString}`
        : "/attendance/stats";

      const response = await api.get(url);
      setStats(response.data);
    } catch (error) {
      logger.error("Error fetching stats:", error);
    }
  };

  // Calcula estadísticas locales para el rol empleado usando los registros visibles
  const computeEmployeeStats = (items: Attendance[]): AttendanceStats => {
    const total = items.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let partial = 0;

    for (const a of items) {
      switch (a.status) {
        case AttendanceStatus.PRESENT:
          present++;
          break;
        case AttendanceStatus.ABSENT:
          absent++;
          break;
        case AttendanceStatus.LATE:
          late++;
          break;
        case AttendanceStatus.EXCUSED:
          excused++;
          break;
        case AttendanceStatus.PARTIAL:
          partial++;
          break;
        default:
          break;
      }
    }

    const totalAttendance = present + late + excused + partial;
    const attendance_rate = total ? (totalAttendance / total) * 100 : 0;

    return {
      total,
      total_attendance: totalAttendance,
      present,
      absent,
      late,
      excused,
      partial,
      attendance_rate,
    };
  };

  const handleCreateAttendance = () => {
    setEditingAttendance(null);
    setFormData({
      user_id: 0,
      course_name: "",
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
    // Extraer solo la fecha (YYYY-MM-DD) de session_date
    const sessionDateOnly = attendance.session_date
      ? attendance.session_date.split("T")[0]
      : "";
    setFormData({
      user_id: attendance.user_id,
      course_name: attendance.course?.title || attendance.course_name || "",
      session_date: sessionDateOnly,
      status: attendance.status,
      attendance_type: attendance.attendance_type,
      check_in_time: attendance.check_in_time
        ? attendance.check_in_time.split("T")[1]?.slice(0, 5)
        : "",
      check_out_time: attendance.check_out_time
        ? attendance.check_out_time.split("T")[1]?.slice(0, 5)
        : "",
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
        await api.put(`/attendance/${editingAttendance.id}/`, dataToSend);
        showSnackbar("Asistencia actualizada exitosamente", "success");
      } else {
        await api.post("/attendance/", dataToSend);
        showSnackbar("Asistencia registrada exitosamente", "success");
      }

      setOpenDialog(false);
      fetchAttendances();
      fetchStats();
    } catch (error) {
      logger.error("Error saving attendance:", error);
      showSnackbar(
        "💾 No se pudo guardar el registro de asistencia. Verifique los datos ingresados e intente nuevamente.",
        "error"
      );
    }
  };

  const handleDeleteAttendance = (attendance: Attendance) => {
    setDeletingAttendance(attendance);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteAttendance = async () => {
    if (deletingAttendance) {
      try {
        await api.delete(`/attendance/${deletingAttendance.id}/`);
        showSnackbar(
          "Registro de asistencia eliminado exitosamente",
          "success"
        );
        fetchAttendances();
        fetchStats();
        setOpenDeleteDialog(false);
        setDeletingAttendance(null);
      } catch (error) {
        logger.error("Error deleting attendance:", error);
        showSnackbar(
          "🗑️ No se pudo eliminar el registro de asistencia. Puede que no tenga permisos o que el registro esté siendo utilizado.",
          "error"
        );
      }
    }
  };

  const handleExportAttendance = async () => {
    try {
      const response = await api.get("/attendance/export/", {
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
      logger.error("Error exporting attendance:", error);
      showSnackbar(
        "📊 No se pudo exportar el reporte de asistencia. Verifique que haya datos disponibles e intente nuevamente.",
        "error"
      );
    }
  };

  const handleGenerateCertificate = async (attendance: Attendance) => {
    try {
      const response = await api.get(
        `/attendance/${attendance.id}/certificate`,
        {
          responseType: "blob",
          timeout: 180000, // 3 minutos para certificados individuales
          params: {
            download: true,
          },
        }
      );

      // Validar que la respuesta sea un blob válido
      if (!response.data || response.data.size === 0) {
        showSnackbar(
          "📄 El certificado no pudo generarse correctamente. Intente nuevamente o contacte al administrador.",
          "error"
        );
        return;
      }

      // Crear nombre de archivo seguro
      const userName = getUserDisplayName(attendance).replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      const courseName = (attendance.course_name || "curso")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 20);
      const fileName = `certificado_asistencia_${userName}_${courseName}.pdf`;

      // Crear blob con tipo MIME específico para PDF
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      link.style.display = "none";
      document.body.appendChild(link);

      // Forzar la descarga
      link.click();

      // Limpiar después de un breve delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      showSnackbar(
        "Certificado de asistencia generado exitosamente",
        "success"
      );
    } catch (error: any) {
      logger.error("Error generating attendance certificate:", error);
      if (error.response?.status === 500) {
        showSnackbar(
          "🔧 Error del servidor al generar el certificado. Contacte al administrador del sistema.",
          "error"
        );
      } else {
        showSnackbar(
          "📜 No se pudo generar el certificado de asistencia. Verifique que el registro esté completo e intente nuevamente.",
          "error"
        );
      }
    }
  };

  const handleGenerateAttendanceList = async () => {
    if (!dateFilter) {
      showSnackbar(
        "📅 Por favor seleccione una fecha específica para generar la lista de asistencia.",
        "error"
      );
      return;
    }

    // Obtener el curso más común en la fecha seleccionada
    const filteredAttendances = attendances.filter((attendance) => {
      const attendanceDate = new Date(attendance.session_date);
      return attendanceDate.toDateString() === dateFilter.toDateString();
    });

    if (filteredAttendances.length === 0) {
      showSnackbar(
        "📋 No hay registros de asistencia para la fecha seleccionada. Intente con otra fecha o verifique que existan datos.",
        "error"
      );
      return;
    }

    // Obtener el curso más frecuente
    const courseCount: { [key: string]: number } = {};
    filteredAttendances.forEach((attendance) => {
      const courseName =
        attendance.course_name || attendance.course?.title || "";
      courseCount[courseName] = (courseCount[courseName] || 0) + 1;
    });

    const mostFrequentCourse = Object.keys(courseCount).reduce((a, b) =>
      courseCount[a] > courseCount[b] ? a : b
    );

    try {
      const sessionDate = dateFilter.toISOString().split("T")[0]; // YYYY-MM-DD format

      const response = await api.get("/attendance/attendance-list", {
        responseType: "blob",
        timeout: 300000, // 5 minutos para PDFs grandes
        params: {
          course_name: mostFrequentCourse,
          session_date: sessionDate,
          download: true,
        },
      });

      // Validar que la respuesta sea un blob válido
      if (!response.data || response.data.size === 0) {
        showSnackbar(
          "📄 La lista de asistencia no pudo generarse correctamente. Intente nuevamente o contacte al administrador.",
          "error"
        );
        return;
      }

      // Crear nombre de archivo seguro
      const safeCourse = mostFrequentCourse
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 20);
      const fileName = `lista_asistencia_${safeCourse}_${sessionDate}.pdf`;

      // Crear blob con tipo MIME específico para PDF
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      link.style.display = "none";
      document.body.appendChild(link);

      // Forzar la descarga
      link.click();

      // Limpiar después de un breve delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      showSnackbar("Lista de asistencia generada exitosamente", "success");
    } catch (error: any) {
      logger.error("Error generating attendance list:", error);
      if (error.response?.status === 404) {
        showSnackbar(
          "🔍 No se encontraron registros suficientes para generar la lista. Verifique que existan datos de asistencia para la fecha seleccionada.",
          "error"
        );
      } else if (error.response?.status === 500) {
        showSnackbar(
          "🔧 Error del servidor al generar la lista. Contacte al administrador del sistema.",
          "error"
        );
      } else {
        showSnackbar(
          "📋 No se pudo generar la lista de asistencia. Verifique los datos e intente nuevamente.",
          "error"
        );
      }
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const getUserDisplayName = (attendance: Attendance) => {
    // Si el backend devuelve la información del usuario, usarla
    if (attendance.user) {
      // Intentar diferentes formatos de nombre
      if (attendance.user.full_name) {
        return attendance.user.full_name;
      }
      if (attendance.user.first_name && attendance.user.last_name) {
        return `${attendance.user.first_name} ${attendance.user.last_name}`;
      }
      // Campos legacy
      if (
        (attendance.user as any).nombre &&
        (attendance.user as any).apellido
      ) {
        return `${(attendance.user as any).nombre} ${
          (attendance.user as any).apellido
        }`;
      }
      if (attendance.user.email) {
        return attendance.user.email;
      }
    }

    // Si no, buscar en la lista de usuarios cargados
    const user = users.find((u) => u.id === attendance.user_id);
    if (user) {
      if (user.full_name) {
        return user.full_name;
      }
      if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
      }
      // Campos legacy
      if ((user as any).nombre && (user as any).apellido) {
        return `${(user as any).nombre} ${(user as any).apellido}`;
      }
      if (user.email) {
        return user.email;
      }
    }

    return `Usuario ID: ${attendance.user_id}`;
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
                <Typography variant="h4">
                  {stats.total_attendance || stats.total || 0}
                </Typography>
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
                  {stats.attendance_rate
                    ? stats.attendance_rate.toFixed(1)
                    : "0.0"}
                  %
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
          {user?.role !== "employee" && (
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
              <MenuItem value="late">Tardío</MenuItem>
              <MenuItem value="excused">Excusado</MenuItem>
              <MenuItem value="partial">Parcial</MenuItem>
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
          {user?.role !== "employee" && (
            <>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateAttendance}
              >
                Registrar Asistencia
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<GroupAdd />}
                onClick={() => setOpenBulkDialog(true)}
              >
                Registro Masivo
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExportAttendance}
              >
                Exportar
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Download />}
                onClick={handleGenerateAttendanceList}
                disabled={!dateFilter}
              >
                Lista de Asistencia
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
                {user?.role !== "employee" && <TableCell>Usuario</TableCell>}
                <TableCell>Curso</TableCell>
                <TableCell>Fecha Sesión</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Entrada</TableCell>
                <TableCell>Salida</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell>% Completado</TableCell>
                <TableCell>Notas</TableCell>
                {user?.role !== "employee" && (
                  <TableCell align="center">Acciones</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={user?.role === "employee" ? 11 : 13}
                    align="center"
                  >
                    Cargando registros de asistencia...
                  </TableCell>
                </TableRow>
              ) : !attendances || attendances.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={user?.role === "employee" ? 11 : 13}
                    align="center"
                  >
                    No se encontraron registros de asistencia
                  </TableCell>
                </TableRow>
              ) : (
                (attendances || []).map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>{attendance.id}</TableCell>
                    {user?.role !== "employee" && (
                      <TableCell>{getUserDisplayName(attendance)}</TableCell>
                    )}
                    <TableCell>
                      {attendance.course?.title ||
                        attendance.course_name ||
                        "N/A"}
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
                            : attendance.status === AttendanceStatus.EXCUSED
                            ? "Excusado"
                            : attendance.status === AttendanceStatus.PARTIAL
                            ? "Parcial"
                            : "Desconocido"
                        }
                        color={
                          attendance.status === AttendanceStatus.PRESENT
                            ? "success"
                            : attendance.status === AttendanceStatus.LATE
                            ? "warning"
                            : attendance.status === AttendanceStatus.PARTIAL
                            ? "info"
                            : attendance.status === AttendanceStatus.EXCUSED
                            ? "default"
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
                    {user?.role !== "employee" && (
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
                          color="secondary"
                          onClick={() => handleGenerateCertificate(attendance)}
                          size="small"
                          title="Generar Certificado PDF"
                        >
                          <PictureAsPdf />
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
                <TextField
                  fullWidth
                  label="Nombre del Curso"
                  value={formData.course_name}
                  onChange={(e) =>
                    setFormData({ ...formData, course_name: e.target.value })
                  }
                  required
                  disabled={!!editingAttendance}
                />
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
                    <MenuItem value={AttendanceStatus.PARTIAL}>
                      Parcial
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
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      check_in_time: e.target.value,
                    };
                    // Calcular duración automáticamente si ambas horas están presentes
                    if (e.target.value && formData.check_out_time) {
                      const checkIn = new Date(
                        `2000-01-01T${e.target.value}:00`
                      );
                      const checkOut = new Date(
                        `2000-01-01T${formData.check_out_time}:00`
                      );
                      const durationMs = checkOut.getTime() - checkIn.getTime();
                      const durationMinutes = Math.max(
                        0,
                        Math.round(durationMs / (1000 * 60))
                      );
                      newFormData.duration_minutes = durationMinutes;
                      newFormData.scheduled_duration_minutes = durationMinutes;
                      newFormData.completion_percentage = 100;
                    }
                    setFormData(newFormData);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Hora de Salida"
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => {
                    const newFormData = {
                      ...formData,
                      check_out_time: e.target.value,
                    };
                    // Calcular duración automáticamente si ambas horas están presentes
                    if (formData.check_in_time && e.target.value) {
                      const checkIn = new Date(
                        `2000-01-01T${formData.check_in_time}:00`
                      );
                      const checkOut = new Date(
                        `2000-01-01T${e.target.value}:00`
                      );
                      const durationMs = checkOut.getTime() - checkIn.getTime();
                      const durationMinutes = Math.max(
                        0,
                        Math.round(durationMs / (1000 * 60))
                      );
                      newFormData.duration_minutes = durationMinutes;
                      newFormData.scheduled_duration_minutes = durationMinutes;
                      newFormData.completion_percentage = 100;
                    }
                    setFormData(newFormData);
                  }}
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
                  InputProps={{
                    readOnly: !!(
                      formData.check_in_time && formData.check_out_time
                    ),
                  }}
                  helperText={
                    formData.check_in_time && formData.check_out_time
                      ? "Calculado automáticamente"
                      : ""
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
                  InputProps={{
                    readOnly: !!(
                      formData.check_in_time && formData.check_out_time
                    ),
                  }}
                  helperText={
                    formData.check_in_time && formData.check_out_time
                      ? "Calculado automáticamente"
                      : ""
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
                  InputProps={{
                    readOnly: !!(
                      formData.check_in_time && formData.check_out_time
                    ),
                  }}
                  helperText={
                    formData.check_in_time && formData.check_out_time
                      ? "Calculado automáticamente"
                      : ""
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

        {/* Diálogo de registro masivo */}
        <BulkAttendanceDialog
          open={openBulkDialog}
          onClose={() => setOpenBulkDialog(false)}
          onSuccess={(message) => {
            setSnackbar({
              open: true,
              message,
              severity: "success",
            });
            fetchAttendances();
            fetchStats();
          }}
          onError={(message) => {
            setSnackbar({
              open: true,
              message,
              severity: "error",
            });
          }}
        />

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
