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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
  const [activeStep, setActiveStep] = useState<number>(0);
  const [hasSurveys, setHasSurveys] = useState<boolean>(false);
  const [hasEvaluation, setHasEvaluation] = useState<boolean>(false);
  const [hasCertificate, setHasCertificate] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchCourseDetail();
    }
  }, [id]);

  // Determinar el paso activo en el flujo de progresión
  useEffect(() => {
    if (course && progressInfo) {
      // Paso 1: Curso en progreso
      if (progressInfo.overall_progress < 100) {
        setActiveStep(0);
        return;
      }
      
      // Paso 2: Curso completado, verificar encuestas
      setActiveStep(1);
      
      // Verificar si hay encuestas disponibles
      const checkSurveys = async () => {
        if (!id) return;
        
        try {
          const surveysResponse = await api.get(`/surveys/?course_id=${id}`);
          const availableSurveys = surveysResponse.data.items || [];
          setHasSurveys(availableSurveys.length > 0);
          
          if (availableSurveys.length > 0) {
            // Verificar si el usuario ya completó todas las encuestas
            const userSurveysResponse = await api.get(`/surveys/user-responses?course_id=${id}`);
            const userSurveys = userSurveysResponse.data.items || [];
            
            if (userSurveys.length >= availableSurveys.length) {
              setActiveStep(2); // Encuestas completadas
            }
          } else {
            setActiveStep(2); // No hay encuestas, pasar a evaluación
          }
        } catch (error) {
          console.error("Error verificando encuestas:", error);
        }
      };
      
      // Verificar si hay evaluación disponible
      const checkEvaluation = async () => {
        if (!id) return;
        
        try {
          const evaluationResponse = await api.get(`/evaluations/?course_id=${id}`);
          const availableEvaluations = evaluationResponse.data.items || [];
          
          if (availableEvaluations.length > 0) {
            setHasEvaluation(true);
            setEvaluationId(availableEvaluations[0].id);
            
            // Verificar si el usuario ya completó la evaluación
            const userEvalResponse = await api.get(`/evaluations/${availableEvaluations[0].id}/results`);
            if (userEvalResponse.data && userEvalResponse.data.completed) {
              setActiveStep(3); // Evaluación completada
              
              // Verificar si hay certificado disponible
              const certificateResponse = await api.get(`/certificates/course/${id}/check`);
              if (certificateResponse.data && certificateResponse.data.available) {
                setHasCertificate(true);
                setActiveStep(4); // Certificado disponible
              }
            }
          } else {
            // No hay evaluación, verificar certificado directamente
            const certificateResponse = await api.get(`/certificates/course/${id}/check`);
            if (certificateResponse.data && certificateResponse.data.available) {
              setHasCertificate(true);
              setActiveStep(4); // Certificado disponible
            }
          }
        } catch (error) {
          console.error("Error verificando evaluación:", error);
        }
      };
      
      checkSurveys();
      checkEvaluation();
    }
  }, [course, progressInfo, id]);

  const fetchCourseDetail = async () => {
    if (!id) {
      setError("ID del curso no válido");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data);
      // Cargar estado de progreso/encuestas/evaluación
      const progressResp = await api.get(`/progress/course/${id}`);
      setProgressInfo(progressResp.data);
    } catch (error: any) {
      console.error("Error fetching course detail:", error);
      setError("No se pudo cargar el curso. Verifique su conexión e intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a material is completed
  const isMaterialCompleted = (materialId: number): boolean => {
    if (!progressInfo || !progressInfo.modules) return false;
    
    for (const moduleProgress of progressInfo.modules) {
      const materialProgress = moduleProgress.materials?.find(
        (m: any) => m.material_id === materialId
      );
      if (materialProgress && materialProgress.status === 'completed') {
        return true;
      }
    }
    return false;
  };

  // Helper function to get material progress percentage
  const getMaterialProgress = (materialId: number): number => {
    if (!progressInfo || !progressInfo.modules) return 0;
    
    for (const moduleProgress of progressInfo.modules) {
      const materialProgress = moduleProgress.materials?.find(
        (m: any) => m.material_id === materialId
      );
      if (materialProgress) {
        return materialProgress.progress_percentage || 0;
      }
    }
    return 0;
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
      setError("No se pudo cargar el material. Verifique su conexión e intente nuevamente.");
    }
  };

  const handleMaterialComplete = async (material: CourseMaterial) => {
    try {
      await api.post(`/progress/material/${material.id}/complete`);
      // Refresh course data to update progress
      await fetchCourseDetail();
      setOpenMaterialDialog(false);
    } catch (error: any) {
      console.error("Error completing material:", error);
      setError("Error al completar el material");
    }
  };

  const goToSurveys = () => {
    if (!id) {
      setError("ID del curso no válido");
      return;
    }
    navigate(`/employee/courses/${id}/surveys`);
  };

  const goToEvaluation = async () => {
    if (!id) {
      setError("ID del curso no válido");
      return;
    }
    
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

            {/* Flujo de progresión del curso */}
            <Paper elevation={3} sx={{ mt: 3, p: 3, mb: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Progreso del Curso
              </Typography>
              <Stepper activeStep={activeStep} orientation="vertical">
                <Step>
                  <StepLabel>
                    <Typography variant="subtitle1">Completar Materiales del Curso</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography>
                      Completa todos los materiales del curso para avanzar al siguiente paso.
                      Progreso actual: {progressInfo?.overall_progress || 0}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={progressInfo?.overall_progress || 0} 
                      sx={{ mt: 1, mb: 1 }}
                    />
                  </StepContent>
                </Step>
                
                <Step>
                  <StepLabel>
                    <Typography variant="subtitle1">Encuestas de Satisfacción</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography>
                      {hasSurveys 
                        ? "Completa las encuestas de satisfacción para evaluar el curso." 
                        : "No hay encuestas disponibles para este curso."}
                    </Typography>
                    {hasSurveys && (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={goToSurveys} 
                        sx={{ mt: 2 }}
                      >
                        Ir a Encuestas
                      </Button>
                    )}
                  </StepContent>
                </Step>
                
                <Step>
                  <StepLabel>
                    <Typography variant="subtitle1">Evaluación Final</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography>
                      {hasEvaluation 
                        ? "Completa la evaluación final para demostrar tus conocimientos." 
                        : "No hay evaluación disponible para este curso."}
                    </Typography>
                    {hasEvaluation && evaluationId && (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={goToEvaluation} 
                        sx={{ mt: 2 }}
                      >
                        Ir a Evaluación
                      </Button>
                    )}
                    {progressInfo?.evaluation_status === "blocked" && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        La evaluación está bloqueada. Has agotado todos los intentos disponibles sin superar la puntuación mínima requerida.
                      </Alert>
                    )}
                    {progressInfo?.evaluation_status === "completed" && !progressInfo?.evaluation_completed && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Has completado la evaluación pero no alcanzaste la puntuación mínima requerida ({progressInfo.passing_score}%).
                        Tu puntuación fue {progressInfo.evaluation_score}%.
                      </Alert>
                    )}
                  </StepContent>
                </Step>
                
                <Step>
                  <StepLabel>
                    <Typography variant="subtitle1">Certificado</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography>
                      {hasCertificate 
                        ? "¡Felicidades! Has completado el curso y puedes descargar tu certificado." 
                        : "El certificado estará disponible cuando completes todos los requisitos."}
                    </Typography>
                    {hasCertificate && (
                      <Button 
                        variant="contained" 
                        color="success" 
                        onClick={() => {
                          if (id) {
                            navigate(`/employee/certificates/${id}`);
                          } else {
                            setError("ID del curso no válido");
                          }
                        }} 
                        sx={{ mt: 2 }}
                      >
                        Ver Certificado
                      </Button>
                    )}
                  </StepContent>
                </Step>
              </Stepper>
            </Paper>
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
                            disabled={isMaterialCompleted(material.id)}
                          >
                            <ListItemIcon>
                              {isMaterialCompleted(material.id) ? (
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
                              {isMaterialCompleted(material.id) ? (
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
                                  {getMaterialProgress(material.id) > 0 ? "Continuar" : "Iniciar"}
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
          {selectedMaterial && !isMaterialCompleted(selectedMaterial.id) && (
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
