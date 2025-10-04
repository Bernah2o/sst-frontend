import {
  School as CourseIcon,
  Poll as SurveyIcon,
  Quiz as EvaluationIcon,
  WorkspacePremium as CertificateIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircleOutline as CheckIcon
} from '@mui/icons-material';
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
  AlertTitle,
  Collapse,
  IconButton,
  CircularProgress
} from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';

import api from '../services/api';
 

interface UserProgressData {
  id: number;
  user_id: number;
  user_name: string;
  user_document: string;
  user_position: string;
  user_area: string;
  course_id: number;
  course_title: string;
  course_type: string;
  enrollment_date: string;
  completion_date?: string;
  status: 'no_iniciado' | 'en_progreso' | 'completado' | 'vencido' | 'suspendido';
  progress_percentage: number;
  time_spent_minutes: number;
  modules_completed: number;
  total_modules: number;
}

interface CourseProgressDetail {
  course_id: number;
  enrollment_id: number;
  overall_progress: number;
  status: string;
  can_take_survey: boolean;
  can_take_evaluation: boolean;
  pending_surveys: Array<{
    id: number;
    title: string;
    description: string;
  }>;
  course_completed: boolean;
  evaluation_completed: boolean;
  evaluation_score?: number;
  evaluation_status: 'not_started' | 'in_progress' | 'completed';
  survey_status: 'not_started' | 'available' | 'in_progress' | 'completed';
  completed_surveys_count: number;
  total_surveys_count: number;
  passing_score: number;
}

interface Certificate {
  id: number;
  certificate_number: string;
  course_title: string;
  issued_date: string;
  status: 'active' | 'revoked';
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
  const [userProgresses, setUserProgresses] = useState<UserProgressData[]>([]);
  const [, setCourses] = useState<Course[]>([]);
  const [, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [courseDetails, setCourseDetails] = useState<Map<number, CourseProgressDetail>>(new Map());
  const [certificates, setCertificates] = useState<Map<number, Certificate[]>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());
  const [filters] = useState({
    status: '',
    course_id: '',
    user_id: '',
    search: ''
  });

  const statusConfig = {
    no_iniciado: { label: 'No Iniciado', color: 'default' },
    en_progreso: { label: 'En Progreso', color: 'info' },
    completado: { label: 'Completado', color: 'success' },
    vencido: { label: 'Vencido', color: 'error' },
    suspendido: { label: 'Suspendido', color: 'warning' }
  };

  const fetchUserProgresses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      
      if (filters.status) params.append('status', filters.status);
      if (filters.course_id) params.append('course_id', filters.course_id);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/user-progress/?${params.toString()}`);
      setUserProgresses(response.data.items || []);
      // Use the 'pages' field directly from API response instead of calculating
      setTotalPages(response.data.pages || Math.ceil((response.data.total || 0) / 20));
    } catch (error) {
      console.error('Error fetching user progresses:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await api.get('/courses/');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserProgresses();
    fetchCourses();
    fetchUsers();
  }, [page, filters, fetchUserProgresses, fetchCourses, fetchUsers]);

  const fetchCourseDetails = async (courseId: number, userId: number) => {
    if (loadingDetails.has(courseId)) return;
    
    setLoadingDetails(prev => new Set(prev).add(courseId));
    try {
      const response = await api.get(`/progress/course/${courseId}`);
      setCourseDetails(prev => new Map(prev).set(courseId, response.data));
      
      // Fetch certificates for this user and course
      await fetchUserCertificates(userId, courseId);
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  const fetchUserCertificates = async (userId: number, courseId: number) => {
    try {
      const response = await api.get(`/certificates/user/${userId}?course_id=${courseId}`);
      setCertificates(prev => new Map(prev).set(courseId, response.data || []));
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates(prev => new Map(prev).set(courseId, []));
    }
  };

  const handleRowExpand = async (progressId: number, courseId: number, userId: number) => {
    const newExpandedRows = new Set(expandedRows);
    
    if (expandedRows.has(progressId)) {
      newExpandedRows.delete(progressId);
    } else {
      newExpandedRows.add(progressId);
      if (!courseDetails.has(courseId)) {
        await fetchCourseDetails(courseId, userId);
      }
    }
    
    setExpandedRows(newExpandedRows);
  };

  



  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? config.color : 'default';
  };

  

  const renderProgressStep = (icon: React.ReactNode, title: string, status: 'completed' | 'current' | 'pending', description?: string) => {
    const getStepColor = () => {
      switch (status) {
        case 'completed': return '#4caf50';
        case 'current': return '#2196f3';
        case 'pending': return '#9e9e9e';
        default: return '#9e9e9e';
      }
    };

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: getStepColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            mr: 2
          }}
        >
          {status === 'completed' ? <CheckIcon /> : icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: getStepColor(), fontWeight: 'bold' }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const renderSurveyProgress = (detail: CourseProgressDetail) => {
    const getSurveyStatus = () => {
      if (detail.survey_status === 'completed') return 'completed';
      if (detail.can_take_survey || detail.survey_status === 'available') return 'current';
      return 'pending';
    };

    const description = detail.survey_status === 'completed' 
      ? `Completadas: ${detail.completed_surveys_count}/${detail.total_surveys_count}`
      : detail.can_take_survey 
        ? 'Encuestas disponibles para completar'
        : 'Completa el curso para habilitar las encuestas';

    return renderProgressStep(
      <SurveyIcon />,
      'Encuestas',
      getSurveyStatus(),
      description
    );
  };

  const renderEvaluationProgress = (detail: CourseProgressDetail, courseTitle?: string) => {
    const getEvaluationStatus = () => {
      if (detail.evaluation_completed) return 'completed';
      if (detail.can_take_evaluation) return 'current';
      return 'pending';
    };

    const description = detail.evaluation_completed
      ? `Completada - ${courseTitle ? `Curso: ${courseTitle} - ` : ''}Puntuación: ${detail.evaluation_score}/${detail.passing_score}`
      : detail.can_take_evaluation
        ? 'Evaluación disponible'
        : 'Completa las encuestas para habilitar la evaluación';

    const title = detail.evaluation_completed ? 'Evaluación Completada' : 'Evaluación';

    return renderProgressStep(
      <EvaluationIcon />,
      title,
      getEvaluationStatus(),
      description
    );
  };

  const renderCertificateProgress = (courseId: number, detail: CourseProgressDetail) => {
    const courseCertificates = certificates.get(courseId) || [];
    const hasCertificate = courseCertificates.length > 0;
    
    const getCertificateStatus = () => {
      if (hasCertificate) return 'completed';
      if (detail.evaluation_completed) return 'current';
      return 'pending';
    };

    const description = hasCertificate
      ? `Certificado generado: ${courseCertificates[0]?.certificate_number}`
      : detail.evaluation_completed
        ? 'Certificado en proceso de generación'
        : 'Completa la evaluación para generar el certificado';

    return renderProgressStep(
      <CertificateIcon />,
      'Certificado',
      getCertificateStatus(),
      description
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
              <TableCell>Usuario</TableCell>
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
                        onClick={() => handleRowExpand(progress.id, progress.course_id, progress.user_id)}
                      >
                        {expandedRows.has(progress.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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
                        <Typography variant="caption" color="text.secondary" display="block">
                          {progress.user_area}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {progress.course_title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Inscrito: {new Date(progress.enrollment_date).toLocaleDateString()}
                        </Typography>
                        {progress.completion_date && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Completado: {new Date(progress.completion_date).toLocaleDateString()}
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
                        label={statusConfig[progress.status]?.label || progress.status}
                        color={getStatusColor(progress.status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progress.progress_percentage}
                          sx={{
                            width: 100,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getProgressColor(progress.progress_percentage),
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
                        <Collapse in={expandedRows.has(progress.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 1, m: 1 }}>
                            {loadingDetails.has(progress.course_id) ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={40} />
                              </Box>
                            ) : (
                              <>
                                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
                                  Progreso del Flujo de Certificación
                                </Typography>
                                
                                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                                    <Box sx={{ flex: 1 }}>
                                      <Paper sx={{ p: 2, height: '100%' }}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                                          Estado del Curso
                                        </Typography>
                                        {renderProgressStep(
                                          <CourseIcon />,
                                          'Curso',
                                          progress.progress_percentage === 100 ? 'completed' : 'current',
                                          `Progreso: ${progress.progress_percentage}% - ${progress.modules_completed}/${progress.total_modules} módulos`
                                        )}
                                        
                                        {courseDetails.has(progress.course_id) && (
                                          <>
                                            {renderSurveyProgress(courseDetails.get(progress.course_id)!)}
                                            {renderEvaluationProgress(courseDetails.get(progress.course_id)!, progress.course_title)}
                                            {renderCertificateProgress(progress.course_id, courseDetails.get(progress.course_id)!)}
                                          </>
                                        )}
                                      </Paper>
                                    </Box>
                                    
                                    <Box sx={{ flex: 1 }}>
                                      <Paper sx={{ p: 2, height: '100%' }}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                                          Información Adicional
                                        </Typography>
                                      
                                      {courseDetails.has(progress.course_id) && (
                                        <>
                                          {courseDetails.get(progress.course_id)!.pending_surveys.length > 0 && (
                                            <Alert severity="info" sx={{ mb: 2 }}>
                                              <AlertTitle>Encuestas Pendientes</AlertTitle>
                                              {courseDetails.get(progress.course_id)!.pending_surveys.map((survey) => (
                                                <Typography key={survey.id} variant="body2">
                                                  • {survey.title}
                                                </Typography>
                                              ))}
                                            </Alert>
                                          )}
                                          
                                          {courseDetails.get(progress.course_id)!.can_take_survey && (
                                            <Alert severity="success" sx={{ mb: 2 }}>
                                              <AlertTitle>¡Encuesta Habilitada!</AlertTitle>
                                              Has completado el curso. Ahora puedes realizar las encuestas disponibles.
                                            </Alert>
                                          )}
                                          
                                          {courseDetails.get(progress.course_id)!.can_take_evaluation && (
                                            <Alert severity="warning" sx={{ mb: 2 }}>
                                              <AlertTitle>¡Evaluación Disponible!</AlertTitle>
                                              Has completado las encuestas. Ahora puedes realizar la evaluación.
                                            </Alert>
                                          )}
                                          
                                          {certificates.has(progress.course_id) && certificates.get(progress.course_id)!.length > 0 && (
                                            <Alert severity="success" sx={{ mb: 2 }}>
                                              <AlertTitle>¡Certificado Generado!</AlertTitle>
                                              Tu certificado ha sido generado automáticamente tras completar la evaluación.
                                            </Alert>
                                          )}
                                        </>
                                       )}
                                     </Paper>
                                   </Box>
                                 </Box>
                              </>
                            )}
                          </Box>
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