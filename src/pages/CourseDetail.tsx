import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  ExpandMore,
  PlayArrow,
  CheckCircle,
  Lock,
  PictureAsPdf,
  VideoLibrary,
  Link as LinkIcon,
  Quiz,
  Description,
  ArrowBack,
  Close,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  course_type: string;
  status: string;
  duration_hours: number;
  is_mandatory: boolean;
  thumbnail: string;
  created_at: string;
  published_at: string;
  modules: CourseModule[];
  progress: number;
  enrolled_at: string;
  completed: boolean;
}

interface CourseModule {
  id: number;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number;
  is_required: boolean;
  materials: CourseMaterial[];
  progress?: number;
  completed?: boolean;
}

interface CourseMaterial {
  id: number;
  title: string;
  description: string;
  material_type: string;
  file_path: string;
  file_url: string;
  duration_seconds: number;
  order_index: number;
  is_required: boolean;
  is_downloadable: boolean;
  progress?: number;
  completed?: boolean;
}

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | false>(false);
  const [openMaterialDialog, setOpenMaterialDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<CourseMaterial | null>(null);
  const [materialContent, setMaterialContent] = useState<string>("");
  const [progressInfo, setProgressInfo] = useState<any | null>(null);
  const [evaluationId, setEvaluationId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchCourseDetail();
    }
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data);
      // Cargar estado de progreso/encuestas/evaluación
      const progressResp = await api.get(`/progress/course/${id}`);
      setProgressInfo(progressResp.data);
    } catch (error: any) {
      console.error("Error fetching course detail:", error);
      setError("Error al cargar el curso");
    } finally {
      setLoading(false);
    }
  };

  const handleModuleAccordionChange = (moduleId: number) => {
    setExpandedModule(expandedModule === moduleId ? false : moduleId);
  };

  const handleMaterialClick = async (material: CourseMaterial) => {
    try {
      setSelectedMaterial(material);

      // Mark material as started/viewed
      await api.post(`/progress/material/${material.id}/start`);

      // Get material content based on type
      if (material.material_type === "link") {
        setMaterialContent(material.file_url);
      } else {
        const response = await api.get(
          `/files/course-material/${material.id}/view`
        );
        setMaterialContent(response.data.url || response.data.content);
      }

      setOpenMaterialDialog(true);
    } catch (error: any) {
      console.error("Error loading material:", error);
      setError("Error al cargar el material");
    }
  };

  const handleMaterialComplete = async (material: CourseMaterial) => {
    try {
      await api.post(`/progress/material/${material.id}/complete`);
      // Refresh course data to update progress
      fetchCourseDetail();
      setOpenMaterialDialog(false);
    } catch (error: any) {
      console.error("Error completing material:", error);
    }
  };

  const goToSurveys = () => {
    navigate(`/employee/courses/${id}/surveys`);
  };

  const goToEvaluation = async () => {
    try {
      // Obtener las evaluaciones del curso
      const response = await api.get(`/evaluations/?course_id=${id}`);
      const evaluations = response.data.items;
      
      if (evaluations && evaluations.length > 0) {
        // Tomar la primera evaluación publicada
        const evaluation = evaluations.find((evaluation: any) => evaluation.status === 'published') || evaluations[0];
        
        // Verificar si la evaluación está bloqueada para el usuario
        try {
          const statusResponse = await api.get(`/evaluations/${evaluation.id}/user-status`);
          const userStatus = statusResponse.data;
          
          if (userStatus.status === 'BLOCKED') {
            setError('Esta evaluación está bloqueada. Has agotado todos los intentos disponibles sin superar la puntuación mínima requerida. Contacta al administrador para rehabilitar la evaluación.');
            return;
          }
        } catch (statusError) {
          console.warn('No se pudo verificar el estado de la evaluación:', statusError);
        }
        
        navigate(`/employee/courses/${id}/evaluation?evaluation_id=${evaluation.id}`);
      } else {
        console.error('No se encontraron evaluaciones para este curso');
      }
    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      // Fallback a la ruta original
      navigate(`/employee/courses/${id}/evaluation`);
    }
  };

  // Detectar y convertir URLs de YouTube para embeber
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url?.match(youtubeRegex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <PictureAsPdf />;
      case "video":
        return <VideoLibrary />;
      case "link":
        return <LinkIcon />;
      case "quiz":
        return <Quiz />;
      default:
        return <Description />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "success";
    if (progress > 0) return "primary";
    return "inherit";
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Curso no encontrado"}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/employee/courses")}
          sx={{ mt: 2 }}
        >
          Volver a Mis Cursos
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/employee/courses")}
          sx={{ mb: 2 }}
        >
          Volver a Mis Cursos
        </Button>

        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              {course.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {course.description}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Chip
                  label={course.is_mandatory ? "Obligatorio" : "Opcional"}
                  color={course.is_mandatory ? "error" : "default"}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Chip
                  label={`${course.duration_hours}h`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Chip
                  label={course.course_type}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Progreso del curso: {Math.round(course.progress)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={course.progress}
                color={getProgressColor(course.progress)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {course.completed && (
              <Alert severity="success" sx={{ mt: 2 }}>
                ¡Felicitaciones! Has completado este curso.
              </Alert>
            )}

            {/* Flujo curso → encuestas → evaluación */}
            {progressInfo && (
              <Box sx={{ mt: 2 }}>
                {progressInfo.overall_progress >= 100 &&
                  progressInfo.pending_surveys &&
                  progressInfo.pending_surveys.length > 0 && (
                    <Alert
                      severity="warning"
                      sx={{ mb: 2 }}
                      action={
                        <Button
                          color="inherit"
                          size="small"
                          onClick={goToSurveys}
                        >
                          Realizar Encuestas
                        </Button>
                      }
                    >
                      Ya puedes realizar la encuesta del curso.
                    </Alert>
                  )}

                {progressInfo.can_take_evaluation && (
                    <Alert
                      severity="info"
                      sx={{ mb: 2 }}
                      action={
                        <Button
                          color="inherit"
                          size="small"
                          onClick={goToEvaluation}
                        >
                          Realizar Evaluación
                        </Button>
                      }
                    >
                      Ya puedes realizar la evaluación del curso.
                    </Alert>
                  )}

                {progressInfo.overall_progress >= 100 &&
                  progressInfo.evaluation_status === "blocked" && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      La evaluación está bloqueada. Has agotado todos los intentos disponibles sin superar la puntuación mínima requerida. Contacta al administrador para rehabilitar la evaluación.
                    </Alert>
                  )}

                {progressInfo.overall_progress >= 100 &&
                  progressInfo.evaluation_status === "completed" && (
                    <>
                      {progressInfo.evaluation_completed ? (
                        <Alert severity="success">
                          ¡Excelente! Completaste la evaluación exitosamente con {progressInfo.evaluation_score}%. Tu certificado
                          estará disponible en la sección de certificados.
                        </Alert>
                      ) : (
                        <Alert severity="error">
                          Has completado la evaluación pero no alcanzaste la puntuación mínima requerida ({progressInfo.passing_score}%). 
                          Tu puntuación fue {progressInfo.evaluation_score}%. {progressInfo.evaluation_status === "blocked" ? "Has agotado todos los intentos disponibles." : "Puedes intentar nuevamente."}
                        </Alert>
                      )}
                    </>
                  )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Course Modules */}
      <Typography variant="h5" gutterBottom>
        Módulos del Curso
      </Typography>

      {course.modules.length === 0 ? (
        <Alert severity="info">
          Este curso aún no tiene módulos configurados.
        </Alert>
      ) : (
        course.modules
          .sort((a, b) => a.order_index - b.order_index)
          .map((module) => (
            <Accordion
              key={module.id}
              expanded={expandedModule === module.id}
              onChange={() => handleModuleAccordionChange(module.id)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "100%" }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {module.title}
                      {module.is_required && (
                        <Chip
                          label="Requerido"
                          size="small"
                          color="error"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {module.description}
                    </Typography>
                    {module.duration_minutes && (
                      <Typography variant="caption" color="text.secondary">
                        Duración: {module.duration_minutes} minutos
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ ml: 2, minWidth: 100 }}>
                    <Typography variant="body2" gutterBottom>
                      {Math.round(module.progress || 0)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={module.progress || 0}
                      color={getProgressColor(module.progress || 0)}
                    />
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                {module.materials.length === 0 ? (
                  <Alert severity="info">
                    Este módulo aún no tiene materiales configurados.
                  </Alert>
                ) : (
                  <List>
                    {module.materials
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((material) => (
                        <ListItem key={material.id} disablePadding>
                          <ListItemButton
                            onClick={() => handleMaterialClick(material)}
                            disabled={material.completed}
                          >
                            <ListItemIcon>
                              {material.completed ? (
                                <CheckCircle color="success" />
                              ) : (
                                getMaterialIcon(material.material_type)
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={material.title}
                              secondary={
                                <Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {material.description}
                                  </Typography>
                                  {material.duration_seconds > 0 && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Duración:{" "}
                                      {Math.ceil(
                                        material.duration_seconds / 60
                                      )}{" "}
                                      min
                                    </Typography>
                                  )}
                                  {material.is_required && (
                                    <Chip
                                      label="Requerido"
                                      size="small"
                                      color="error"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                              }
                            />
                            <Box sx={{ ml: 2 }}>
                              {material.completed ? (
                                <Chip
                                  label="Completado"
                                  color="success"
                                  size="small"
                                />
                              ) : (
                                <Button
                                  size="small"
                                  startIcon={<PlayArrow />}
                                  variant="outlined"
                                >
                                  {material.progress ? "Continuar" : "Iniciar"}
                                </Button>
                              )}
                            </Box>
                          </ListItemButton>
                        </ListItem>
                      ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          ))
      )}

      {/* Material Viewer Dialog */}
      <Dialog
        open={openMaterialDialog}
        onClose={() => setOpenMaterialDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">{selectedMaterial?.title}</Typography>
            <IconButton onClick={() => setOpenMaterialDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedMaterial && (
            <Box>
              {selectedMaterial.material_type === "pdf" && (
                <iframe
                  src={materialContent}
                  width="100%"
                  height="600px"
                  style={{ border: "none" }}
                  title={selectedMaterial.title}
                />
              )}

              {selectedMaterial.material_type === "video" && (
                <video
                  controls
                  width="100%"
                  height="400px"
                  src={materialContent}
                >
                  Tu navegador no soporta el elemento de video.
                </video>
              )}

              {selectedMaterial.material_type === "link" &&
                (() => {
                  const youtubeEmbed = getYouTubeEmbedUrl(materialContent);
                  return youtubeEmbed ? (
                    <Box>
                      <iframe
                        src={youtubeEmbed}
                        width="100%"
                        height="600px"
                        style={{ border: "none" }}
                        title={selectedMaterial.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </Box>
                  ) : (
                    <Box>
                      <iframe
                        src={materialContent}
                        width="100%"
                        height="600px"
                        style={{ border: "none" }}
                        title={selectedMaterial.title}
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    </Box>
                  );
                })()}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenMaterialDialog(false)}>Cerrar</Button>
          {selectedMaterial && !selectedMaterial.completed && (
            <Button
              variant="contained"
              onClick={() => handleMaterialComplete(selectedMaterial)}
              startIcon={<CheckCircle />}
            >
              Marcar como Completado
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseDetail;
