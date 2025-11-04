import {
  Download,
  Refresh,
  School,
  Person,
  Event,
  TrendingUp,
  ExpandMore,
  CheckCircle,
  Schedule,
} from "@mui/icons-material";
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,

  PointElement,
  LineElement,
} from "chart.js";

import React, { useState, useEffect, useCallback } from "react";
import { Bar, Line } from "react-chartjs-2";

import api from "./../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,

  PointElement,
  LineElement
);

// Interfaces que coinciden con los esquemas del backend
interface DashboardStatsResponse {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  active_enrollments: number;
  total_certificates: number;
  recent_enrollments: number;
  completion_rate: number;
  monthly_enrollments: Array<{
    month: string;
    count: number;
  }>;
}

interface CourseReportResponse {
  course_id: number;
  course_title: string;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  completion_rate: number;
  average_evaluation_score: number;
  attendance_rate: number;
}

interface UserReportResponse {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  total_enrollments: number;
  completed_enrollments: number;
  certificates_earned: number;
  average_evaluation_score: number;
  attendance_rate: number;
  created_at: string;
}

interface AttendanceReportResponse {
  attendance_id: number;
  user_id: number;
  full_name: string;
  course_title: string;
  date: string;
  status: string;
  attendance_type: string;
  check_in_time?: string;
  check_out_time?: string;
  duration_minutes?: number;
  completion_percentage?: number;
  session_code?: string;
  virtual_session_link?: string;
  connection_quality?: string;
  minimum_duration_met?: boolean;
  facilitator_confirmed?: boolean;
  notes?: string;
}

interface ReportData {
  dashboard?: DashboardStatsResponse;
  courses?: CourseReportResponse[];
  users?: UserReportResponse[];
  attendance?: AttendanceReportResponse[];
}

interface Course {
  id: number;
  title: string;
  description?: string;
  course_type: string;
  status: string;
  duration_hours?: number;
  is_mandatory: boolean;
  thumbnail?: string;
  created_at: string;
}



const ReportsManagement: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<number | "all">("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [exportLoading, setExportLoading] = useState(false);
  
  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const dashboardResponse = await api.get("/reports/dashboard", {
        params: {
          course_id: selectedCourse !== "all" ? selectedCourse : undefined,
          start_date: startDate
            ? startDate.toISOString().split("T")[0]
            : undefined,
          end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
        },
      });
      
      // Fetch course reports
      const coursesResponse = await api.get("/reports/courses", {
        params: {
          course_id: selectedCourse !== "all" ? selectedCourse : undefined,
          start_date: startDate
            ? startDate.toISOString().split("T")[0]
            : undefined,
          end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
          limit: 50,
        },
      });
      
      // Fetch user reports
      const usersResponse = await api.get("/reports/users", {
        params: {
          course_id: selectedCourse !== "all" ? selectedCourse : undefined,
          start_date: startDate
            ? startDate.toISOString().split("T")[0]
            : undefined,
          end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
          limit: 50,
        },
      });

      // Fetch attendance reports
      const attendanceResponse = await api.get("/reports/attendance", {
        params: {
          course_id: selectedCourse !== "all" ? selectedCourse : undefined,
          start_date: startDate
            ? startDate.toISOString().split("T")[0]
            : undefined,
          end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
          limit: 100,
        },
      });
      
      setReportData({
        dashboard: dashboardResponse.data,
        courses: coursesResponse.data.items || [],
        users: usersResponse.data.items || [],
        attendance: attendanceResponse.data.items || [],
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      showSnackbar("No se pudieron cargar los datos del reporte. Verifique su conexión e intente nuevamente.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, startDate, endDate]);

  useEffect(() => {
    fetchReportData();
    fetchCourses();
  }, [selectedCourse, startDate, endDate, fetchReportData]);



  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data.items);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };





  const handleExportReport = async (reportType: string) => {
    try {
      setExportLoading(true);
      const response = await api.get(`/reports/export/${reportType}`, {
        responseType: "blob",
        params: {
          curso_id: selectedCourse !== "all" ? selectedCourse : undefined,
          fecha_inicio: startDate
            ? startDate.toISOString().split("T")[0]
            : undefined,
          fecha_fin: endDate ? endDate.toISOString().split("T")[0] : undefined,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `reporte_${reportType}_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      showSnackbar("Reporte exportado exitosamente", "success");
    } catch (error) {
      console.error("Error exporting report:", error);
      showSnackbar("Error al exportar reporte", "error");
    } finally {
      setExportLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const courseCompletionChartData = {
    labels: reportData?.courses?.map((course) => course.course_title) || [],
    datasets: [
      {
        label: "Tasa de Completación (%)",
        data:
          reportData?.courses?.map((course) => course.completion_rate) || [],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const enrollmentTrendChartData = {
    labels: reportData?.dashboard?.monthly_enrollments.map((data) => data.month) || [],
    datasets: [
      {
        label: "Inscripciones por Mes",
        data:
          reportData?.dashboard?.monthly_enrollments.map((data) => data.count) ||
          [],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
    ],
  };



  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reportes y Análisis
        </Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando datos del reporte...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reportes y Análisis
        </Typography>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Curso</InputLabel>
                <Select
                  value={selectedCourse}
                  onChange={(e) =>
                    setSelectedCourse(e.target.value as number | "all")
                  }
                  label="Curso"
                >
                  <MenuItem value="all">Todos los cursos</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Fecha Inicio"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Fecha Fin"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchReportData}
                fullWidth
              >
                Actualizar
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {reportData?.dashboard && (
          <>
            {/* Estadísticas Generales */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Person color="primary" sx={{ mr: 1 }} />
                      <Typography color="text.secondary" variant="body2">
                        Usuarios
                      </Typography>
                    </Box>
                    <Typography variant="h4">
                      {reportData.dashboard.total_users}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <School color="primary" sx={{ mr: 1 }} />
                      <Typography color="text.secondary" variant="body2">
                        Cursos
                      </Typography>
                    </Box>
                    <Typography variant="h4">
                      {reportData.dashboard.total_courses}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Event color="primary" sx={{ mr: 1 }} />
                      <Typography color="text.secondary" variant="body2">
                        Inscripciones
                      </Typography>
                    </Box>
                    <Typography variant="h4">
                      {reportData.dashboard.total_enrollments}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Schedule color="primary" sx={{ mr: 1 }} />
                      <Typography color="text.secondary" variant="body2">
                        Certificados
                      </Typography>
                    </Box>
                    <Typography variant="h4">
                      {reportData.dashboard.total_certificates}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                      <Typography color="text.secondary" variant="body2">
                        Completación
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="success.main">
                      {reportData.dashboard.completion_rate.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <TrendingUp color="info" sx={{ mr: 1 }} />
                      <Typography color="text.secondary" variant="body2">
                        Activas
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="info.main">
                      {reportData.dashboard.active_enrollments}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Tasa de Completación por Curso
                  </Typography>
                  <Bar
                    data={courseCompletionChartData}
                    options={{ responsive: true }}
                  />
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Tendencia de Inscripciones
                  </Typography>
                  <Line
                    data={enrollmentTrendChartData}
                    options={{ responsive: true }}
                  />
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Estadísticas por Asistencia
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Curso</TableCell>
                          <TableCell align="right">Tasa de Asistencia</TableCell>
                          <TableCell align="right">Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(reportData?.courses || []).map((course, index) => (
                          <TableRow key={index}>
                            <TableCell>{course.course_title}</TableCell>
                            <TableCell align="right">
                              {course.attendance_rate.toFixed(1)}%
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={
                                  course.attendance_rate >= 90
                                    ? "Excelente"
                                    : course.attendance_rate >= 75
                                    ? "Buena"
                                    : course.attendance_rate >= 60
                                    ? "Regular"
                                    : "Baja"
                                }
                                color={
                                  course.attendance_rate >= 90
                                    ? "success"
                                    : course.attendance_rate >= 75
                                    ? "primary"
                                    : course.attendance_rate >= 60
                                    ? "warning"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Acciones de Exportación
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={() => handleExportReport("general")}
                        disabled={exportLoading}
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        Exportar Reporte General
                      </Button>
                    </Grid>
                    <Grid size={12}>
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleExportReport("attendance")}
                        disabled={exportLoading}
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        Exportar Reporte de Asistencia
                      </Button>
                    </Grid>

                    <Grid size={12}>
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleExportReport("courses")}
                        disabled={exportLoading}
                        fullWidth
                      >
                        Exportar Estadísticas de Cursos
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* Detalles por Acordeón */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Estadísticas por Curso</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Curso</TableCell>
                            <TableCell align="right">Inscripciones</TableCell>
                            <TableCell align="right">Completados</TableCell>
                            <TableCell align="right">Tasa</TableCell>
                            <TableCell align="right">Promedio</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(reportData.courses || []).map((course, index) => (
                            <TableRow key={index}>
                              <TableCell>{course.course_title}</TableCell>
                              <TableCell align="right">
                                {course.total_enrollments}
                              </TableCell>
                              <TableCell align="right">
                                {course.completed_enrollments}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${course.completion_rate.toFixed(
                                    1
                                  )}%`}
                                  color={
                                    course.completion_rate > 70
                                      ? "success"
                                      : course.completion_rate > 40
                                      ? "warning"
                                      : "error"
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={course.average_evaluation_score.toFixed(1)}
                                  color={
                                    course.average_evaluation_score > 80
                                      ? "success"
                                      : course.average_evaluation_score > 60
                                      ? "warning"
                                      : "error"
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Progreso de Usuarios</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {(reportData.users || [])
                        .slice(0, 10)
                        .map((user, index) => (
                          <ListItem key={index} divider>
                            <ListItemIcon>
                              <Person />
                            </ListItemIcon>
                            <ListItemText
                              primary={user.full_name}
                              secondary={
                                <Box>
                                  <Typography variant="caption">
                                    Usuario: {user.email} ({user.role})
                                  </Typography>
                                  <br />
                                  <Typography variant="caption">
                                    Cursos: {user.completed_enrollments}/
                                    {user.total_enrollments}
                                  </Typography>
                                  <br />
                                  <Typography variant="caption">
                                    Promedio: {user.average_evaluation_score.toFixed(1)}
                                  </Typography>
                                  <br />
                                  <Typography variant="caption">
                                    Certificados: {user.certificates_earned}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </>
        )}

        {/* Sección de Reportes de Asistencia Virtual */}
        {reportData?.attendance && reportData.attendance.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Reportes de Asistencia Virtual</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Usuario</TableCell>
                          <TableCell>Curso</TableCell>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Duración</TableCell>
                          <TableCell>Completitud</TableCell>
                          <TableCell>Calidad Conexión</TableCell>
                          <TableCell>Duración Mínima</TableCell>
                          <TableCell>Confirmado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.attendance
                          .filter(record => record.attendance_type === 'Virtual')
                          .map((record) => (
                            <TableRow key={record.attendance_id}>
                              <TableCell>{record.full_name}</TableCell>
                              <TableCell>{record.course_title}</TableCell>
                              <TableCell>
                                {new Date(record.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={record.attendance_type}
                                  color="info"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={record.status}
                                  color={
                                    record.status === 'Present'
                                      ? 'success'
                                      : record.status === 'Absent'
                                      ? 'error'
                                      : 'warning'
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {record.duration_minutes 
                                  ? `${record.duration_minutes} min`
                                  : 'N/A'
                                }
                              </TableCell>
                              <TableCell>
                                {record.completion_percentage !== undefined ? (
                                  <Chip
                                    label={`${record.completion_percentage}%`}
                                    color={
                                      record.completion_percentage >= 80
                                        ? 'success'
                                        : record.completion_percentage >= 60
                                        ? 'warning'
                                        : 'error'
                                    }
                                    size="small"
                                  />
                                ) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {record.connection_quality ? (
                                  <Chip
                                    label={record.connection_quality}
                                    color={
                                      record.connection_quality === 'Excellent' || record.connection_quality === 'Good'
                                        ? 'success'
                                        : record.connection_quality === 'Fair'
                                        ? 'warning'
                                        : 'error'
                                    }
                                    size="small"
                                  />
                                ) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {record.minimum_duration_met !== undefined ? (
                                  <Chip
                                    label={record.minimum_duration_met ? 'Sí' : 'No'}
                                    color={record.minimum_duration_met ? 'success' : 'error'}
                                    size="small"
                                  />
                                ) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {record.facilitator_confirmed !== undefined ? (
                                  <Chip
                                    label={record.facilitator_confirmed ? 'Sí' : 'No'}
                                    color={record.facilitator_confirmed ? 'success' : 'warning'}
                                    size="small"
                                  />
                                ) : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        )}

        {/* Sección de Reportes Médicos Ocupacionales */}




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

export default ReportsManagement;
