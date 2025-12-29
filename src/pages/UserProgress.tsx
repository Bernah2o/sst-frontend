import {
  Email as EmailIcon,
  School as CourseIcon,
  Poll as SurveyIcon,
  Quiz as EvaluationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircleOutline as CheckIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Pagination,
  LinearProgress,
  Alert,
  Collapse,
  IconButton,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";

import api from "../services/api";

interface UserProgressData {
  id: number;
  user_id: number;
  user_name: string;
  user_document: string;
  user_position: string;
  user_area: string;
  course_id: number;
  course_name: string;
  course_type: string;
  enrolled_at: string;
  completed_at?: string;
  status: "not_started" | "in_progress" | "completed" | "expired" | "blocked";
  progress_percentage: number;
  time_spent_minutes: number;
  modules_completed: number;
  total_modules: number;
}

interface PendingItem {
  id?: number;
  title: string;
}

interface PendingItemsResponse {
  surveys: PendingItem[];
  evaluations: PendingItem[];
  modules: PendingItem[];
  materials: PendingItem[];
  is_pending: boolean;
}

interface Course {
  id: number;
  titulo: string;
  tipo: string;
  duracion_horas: number;
  descripcion: string;
}

interface User {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  cargo: string;
  area: string;
}

const UserProgress: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [userProgresses, setUserProgresses] = useState<UserProgressData[]>([]);
  const [, setCourses] = useState<Course[]>([]);
  const [, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Replaced courseDetails with pendingItemsMap since the old detail view was for "my progress"
  const [pendingItemsMap, setPendingItemsMap] = useState<
    Map<number, PendingItemsResponse>
  >(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());
  const [sendingReminder, setSendingReminder] = useState<Set<number>>(
    new Set()
  );

  const [filters] = useState({
    status: "",
    course_id: "",
    user_id: "",
    search: "",
  });

  const statusConfig = {
    not_started: { label: "No Iniciado", color: "default" },
    in_progress: { label: "En Progreso", color: "info" },
    completed: { label: "Completado", color: "success" },
    expired: { label: "Vencido", color: "error" },
    blocked: { label: "Suspendido", color: "warning" },
  };

  const fetchUserProgresses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");

      if (filters.status) params.append("status", filters.status);
      if (filters.course_id) params.append("course_id", filters.course_id);
      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/user-progress/?${params.toString()}`);
      setUserProgresses(response.data.items || []);
      setTotalPages(
        response.data.pages || Math.ceil((response.data.total || 0) / 20)
      );
    } catch (error) {
      console.error("Error fetching user progresses:", error);
      enqueueSnackbar("Error al cargar el progreso de usuarios", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [page, filters, enqueueSnackbar]);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await api.get("/courses/");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/users/");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserProgresses();
    fetchCourses();
    fetchUsers();
  }, [page, filters, fetchUserProgresses, fetchCourses, fetchUsers]);

  const fetchPendingItems = async (enrollmentId: number) => {
    if (loadingDetails.has(enrollmentId)) return;

    setLoadingDetails((prev) => new Set(prev).add(enrollmentId));
    try {
      const response = await api.get(`/user-progress/${enrollmentId}/details`);
      setPendingItemsMap((prev) =>
        new Map(prev).set(enrollmentId, response.data)
      );
    } catch (error) {
      console.error("Error fetching pending items:", error);
      enqueueSnackbar("Error al cargar detalles pendientes", {
        variant: "error",
      });
    } finally {
      setLoadingDetails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(enrollmentId);
        return newSet;
      });
    }
  };

  const handleRowExpand = async (progressId: number) => {
    const newExpandedRows = new Set(expandedRows);

    if (expandedRows.has(progressId)) {
      newExpandedRows.delete(progressId);
    } else {
      newExpandedRows.add(progressId);
      if (!pendingItemsMap.has(progressId)) {
        await fetchPendingItems(progressId);
      }
    }

    setExpandedRows(newExpandedRows);
  };

  const handleSendReminder = async (enrollmentId: number) => {
    setSendingReminder((prev) => new Set(prev).add(enrollmentId));
    try {
      await api.post(`/user-progress/remind/${enrollmentId}`);
      enqueueSnackbar("Recordatorio enviado exitosamente", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      enqueueSnackbar("Error al enviar el recordatorio", { variant: "error" });
    } finally {
      setSendingReminder((prev) => {
        const newSet = new Set(prev);
        newSet.delete(enrollmentId);
        return newSet;
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "warning";
    return "error";
  };

  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? config.color : "default";
  };

  const renderPendingItems = (enrollmentId: number) => {
    const details = pendingItemsMap.get(enrollmentId);
    const isLoading = loadingDetails.has(enrollmentId);

    if (isLoading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2 }}>Cargando detalles...</Typography>
        </Box>
      );
    }

    if (!details) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          No se pudieron cargar los detalles.
        </Alert>
      );
    }

    const hasPending = details.is_pending;

    return (
      <Box sx={{ p: 2, bgcolor: "#f8f9fa" }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h6" gutterBottom>
              Detalle de Actividades Pendientes
            </Typography>

            {!hasPending ? (
              <Alert severity="success" icon={<CheckIcon fontSize="inherit" />}>
                ¡El usuario está al día con todas las actividades!
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {/* Pending Modules */}
                {details.modules.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          color="primary"
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <CourseIcon sx={{ mr: 1 }} /> Contenido / Módulos
                        </Typography>
                        <List dense>
                          {details.modules.map((item, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <WarningIcon color="warning" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={item.title} />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Pending Surveys */}
                {details.surveys.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          color="secondary"
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <SurveyIcon sx={{ mr: 1 }} /> Encuestas Pendientes
                        </Typography>
                        <List dense>
                          {details.surveys.map((item, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <WarningIcon color="warning" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={item.title} />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Pending Evaluations */}
                {details.evaluations.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          color="error"
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <EvaluationIcon sx={{ mr: 1 }} /> Evaluaciones
                          Pendientes
                        </Typography>
                        <List dense>
                          {details.evaluations.map((item, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <WarningIcon color="warning" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={item.title} />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
              }}
            >
              <EmailIcon
                sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" align="center" gutterBottom>
                Acciones
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                paragraph
              >
                Si el usuario tiene actividades pendientes, puedes enviarle un
                recordatorio por correo electrónico.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  sendingReminder.has(enrollmentId) ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <EmailIcon />
                  )
                }
                onClick={() => handleSendReminder(enrollmentId)}
                disabled={!hasPending || sendingReminder.has(enrollmentId)}
                fullWidth
              >
                {sendingReminder.has(enrollmentId)
                  ? "Enviando..."
                  : "Enviar Recordatorio"}
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Progreso de Usuarios
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Seguimiento del progreso de capacitación y desarrollo
      </Typography>

      {/* Tabla de Progreso */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="50"></TableCell>
              <TableCell>Trabajador</TableCell>
              <TableCell>Curso</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Progreso</TableCell>
              <TableCell>Tiempo</TableCell>
              <TableCell>Módulos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Cargando progreso de usuarios...
                </TableCell>
              </TableRow>
            ) : userProgresses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron registros de progreso
                </TableCell>
              </TableRow>
            ) : (
              userProgresses.map((progress) => (
                <React.Fragment key={progress.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleRowExpand(progress.id)}
                      >
                        {expandedRows.has(progress.id) ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {progress.user_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {progress.user_document} • {progress.user_position}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {progress.user_area}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {progress.course_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Inscrito:{" "}
                          {new Date(progress.enrolled_at).toLocaleDateString()}
                        </Typography>
                        {progress.completed_at && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Completado:{" "}
                            {new Date(
                              progress.completed_at
                            ).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={progress.course_type}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          statusConfig[progress.status]?.label ||
                          progress.status
                        }
                        color={
                          getStatusColor(progress.status) as
                            | "default"
                            | "primary"
                            | "secondary"
                            | "error"
                            | "info"
                            | "success"
                            | "warning"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={progress.progress_percentage}
                          sx={{
                            width: 100,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#f0f0f0",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: getProgressColor(
                                progress.progress_percentage
                              ),
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {progress.progress_percentage}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(progress.time_spent_minutes)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {progress.modules_completed}/{progress.total_modules}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  {/* Fila expandida con detalles del progreso */}
                  {expandedRows.has(progress.id) && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 0 }}>
                        <Collapse
                          in={expandedRows.has(progress.id)}
                          timeout="auto"
                          unmountOnExit
                        >
                          {renderPendingItems(progress.id)}
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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
    </Box>
  );
};

export default UserProgress;
