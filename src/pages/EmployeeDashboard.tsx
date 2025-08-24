import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Divider,
  CardActions,
  Container,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  PlayArrow as PlayArrowIcon,
  WorkspacePremium as CertificateIcon,
  Notifications as NotificationsIcon,
  Event as EventIcon,
  Assessment as AssessmentIcon,
  BookmarkBorder as BookmarkIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import api from '../services/api';

interface EmployeeStats {
  enrolled_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  pending_evaluations: number;
  certificates_earned: number;
  total_study_hours: number;
}

interface MyCourse {
  id: number;
  title: string;
  progress: number;
  status: string;
  due_date?: string;
  last_activity?: string;
}

interface UpcomingEvent {
  id: number;
  type: string;
  title: string;
  date: string;
  time: string;
  location?: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
}

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<EmployeeStats>({
    enrolled_courses: 0,
    completed_courses: 0,
    in_progress_courses: 0,
    pending_evaluations: 0,
    certificates_earned: 0,
    total_study_hours: 0
  });
  const [myCourses, setMyCourses] = useState<MyCourse[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Obtener inscripciones del empleado
      const enrollmentsResponse = await api.get('/enrollments/my-enrollments?limit=10');
      const enrollments = enrollmentsResponse.data.items || [];
      
      // Obtener certificados del empleado
      const certificatesResponse = await api.get('/certificates/my-certificates?limit=10');
      const certificates = certificatesResponse.data.items || [];
      
      // Obtener resultados de evaluaciones
      const evaluationsResponse = await api.get('/evaluations/my-results');
      const evaluations = evaluationsResponse.data.data || [];
      
      // Calcular estadísticas basadas en datos reales
      const completedCourses = enrollments.filter((e: any) => e.status === 'completed').length;
      const inProgressCourses = enrollments.filter((e: any) => e.status === 'in_progress').length;
      const pendingEvaluations = evaluations.filter((e: any) => e.status === 'pending' || e.status === 'in_progress').length;
      
      setStats({
        enrolled_courses: enrollments.length,
        completed_courses: completedCourses,
        in_progress_courses: inProgressCourses,
        pending_evaluations: pendingEvaluations,
        certificates_earned: certificates.length,
        total_study_hours: enrollments.reduce((total: number, enrollment: any) => {
          // Estimar horas basado en progreso (asumiendo 10 horas por curso completo)
          return total + Math.round((enrollment.progress || 0) * 10 / 100);
        }, 0)
      });
      
      // Mapear cursos con datos reales
      const mappedCourses = enrollments.slice(0, 3).map((enrollment: any) => {
        const progress = enrollment.progress || 0;
        // Determinar status basado en progreso
        let status = enrollment.status;
        if (progress >= 100) {
          status = 'completed';
        } else if (progress > 0) {
          status = 'in_progress';
        } else {
          status = 'pending';
        }
        
        return {
          id: enrollment.id,
          title: enrollment.course?.title || 'Curso sin título',
          progress: progress,
          status: status,
          due_date: null, // No disponible en el modelo actual
          last_activity: enrollment.updated_at
        };
      });
      
      setMyCourses(mappedCourses);
      
      // Crear eventos próximos basados en evaluaciones pendientes
      const upcomingEvals = evaluations
        .filter((e: any) => e.status === 'pending' || e.status === 'in_progress')
        .slice(0, 3)
        .map((evaluation: any) => ({
          id: evaluation.id,
          type: 'evaluation',
          title: `Evaluación: ${evaluation.evaluation_title}`,
          date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Fecha aleatoria en los próximos 7 días
          time: '14:00',
          location: 'Online'
        }));
      
      setUpcomingEvents(upcomingEvals);
      
      // Crear logros basados en certificados
      const recentCertificates = certificates.slice(0, 2).map((cert: any) => ({
        id: cert.id,
        title: cert.title || cert.course_title || 'Certificado Obtenido',
        description: `Certificado completado`,
        date: cert.issued_at || cert.created_at,
        type: 'certificate'
      }));
      
      setAchievements(recentCertificates);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback a datos básicos en caso de error
      setStats({
        enrolled_courses: 0,
        completed_courses: 0,
        in_progress_courses: 0,
        pending_evaluations: 0,
        certificates_earned: 0,
        total_study_hours: 0
      });
      setMyCourses([]);
      setUpcomingEvents([]);
      setAchievements([]);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <EventIcon color="primary" />;
      case 'evaluation':
        return <AssessmentIcon color="warning" />;
      case 'deadline':
        return <AccessTimeIcon color="error" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'certificate':
        return <CertificateIcon color="success" />;
      case 'milestone':
        return <StarIcon color="warning" />;
      default:
        return <CheckCircleIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Cargando Dashboard...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        py: 4
      }}
    >
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 1,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Dashboard de Capacitaciones
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 300,
              mb: 2
            }}
          >
            Bienvenido, {user?.nombre || 'Empleado'}
          </Typography>
          <Box 
            sx={{ 
              height: 4, 
              width: 80, 
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: 2
            }} 
          />
        </Box>

        {/* Estadísticas principales */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box 
                    sx={{ 
                      p: 1.5,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      color: 'white'
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Cursos Inscritos
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700,
                        color: theme.palette.primary.main
                      }}
                    >
                      {stats.enrolled_courses}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.15)}`
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box 
                    sx={{ 
                      p: 1.5,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                      color: 'white'
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Completados
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700,
                        color: theme.palette.success.main
                      }}
                    >
                      {stats.completed_courses}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.info.main, 0.15)}`
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box 
                    sx={{ 
                      p: 1.5,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                      color: 'white'
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      En Progreso
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700,
                        color: theme.palette.info.main
                      }}
                    >
                      {stats.in_progress_courses}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.warning.main, 0.15)}`
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box 
                    sx={{ 
                      p: 1.5,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                      color: 'white'
                    }}
                  >
                    <AssessmentIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Evaluaciones Pendientes
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700,
                        color: theme.palette.warning.main
                      }}
                    >
                      {stats.pending_evaluations}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha('#FFD700', 0.1)} 0%, ${alpha('#FFA500', 0.05)} 100%)`,
                border: `1px solid ${alpha('#FFD700', 0.2)}`,
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 25px ${alpha('#FFD700', 0.2)}`
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box 
                    sx={{ 
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      color: 'white'
                    }}
                  >
                    <CertificateIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Certificados
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#FF8C00'
                      }}
                    >
                      {stats.certificates_earned}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha('#9C27B0', 0.1)} 0%, ${alpha('#673AB7', 0.05)} 100%)`,
                border: `1px solid ${alpha('#9C27B0', 0.1)}`,
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 25px ${alpha('#9C27B0', 0.15)}`
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box 
                    sx={{ 
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #9C27B0, #673AB7)',
                      color: 'white'
                    }}
                  >
                    <AccessTimeIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Horas de Estudio
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#9C27B0'
                      }}
                    >
                      {stats.total_study_hours}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* Mis cursos */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card 
              sx={{ 
                borderRadius: 3,
                boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 3
                  }}
                >
                  Mis Cursos
                </Typography>
                <Stack spacing={3}>
                  {myCourses.map((course) => (
                    <Card 
                      key={course.id}
                      sx={{ 
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        background: alpha(theme.palette.background.paper, 0.8),
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, 0.1)}`
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                          <Box>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                                mb: 0.5
                              }}
                            >
                              {course.title}
                            </Typography>
                          </Box>
                          <Chip
                            label={course.status === 'completed' ? 'Completado' : 
                                   course.status === 'in_progress' ? 'En Progreso' : 
                                   course.status === 'pending' ? 'Pendiente' : 
                                   course.status === 'expired' ? 'Vencido' : course.status}
                            color={getStatusColor(course.status) as any}
                            sx={{ 
                              fontWeight: 500,
                              borderRadius: 2
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 500,
                                color: theme.palette.text.secondary
                              }}
                            >
                              Progreso
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600,
                                color: theme.palette.primary.main
                              }}
                            >
                              {course.progress}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={course.progress} 
                            sx={{ 
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                              }
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontStyle: 'italic'
                            }}
                          >
                            {course.due_date && `Fecha límite: ${new Date(course.due_date).toLocaleDateString()}`}
                          </Typography>
                          {course.status === 'completed' ? (
                            <Button
                              variant="outlined"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              disabled
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 500
                              }}
                            >
                              Completado
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => navigate(`/employee/courses/${course.id}`)}
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 500,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                '&:hover': {
                                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                                }
                              }}
                            >
                              Continuar
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
                <Button
                  fullWidth
                  variant="text"
                  sx={{ 
                    mt: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                  onClick={() => navigate('/employee/courses')}
                >
                  Ver todos mis cursos
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Panel lateral */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={4}>
              {/* Próximos eventos */}
              <Card 
                sx={{ 
                  borderRadius: 3,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 3
                    }}
                  >
                    Próximos Eventos
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {upcomingEvents.map((event, index) => (
                      <React.Fragment key={event.id}>
                        <ListItem 
                          sx={{ 
                            px: 0,
                            py: 2,
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {getEventIcon(event.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 500,
                                  color: theme.palette.text.primary
                                }}
                              >
                                {event.title}
                              </Typography>
                            }
                            secondary={
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: theme.palette.text.secondary,
                                  mt: 0.5
                                }}
                              >
                                {`${new Date(event.date).toLocaleDateString()} - ${event.time}${event.location ? ` - ${event.location}` : ''}`}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < upcomingEvents.length - 1 && 
                          <Divider sx={{ my: 1, opacity: 0.3 }} />
                        }
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>

              {/* Logros recientes */}
              <Card 
                sx={{ 
                  borderRadius: 3,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 3
                    }}
                  >
                    Logros Recientes
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {achievements.map((achievement, index) => (
                      <React.Fragment key={achievement.id}>
                        <ListItem 
                          sx={{ 
                            px: 0,
                            py: 2,
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.success.main, 0.05)
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {getAchievementIcon(achievement.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 500,
                                  color: theme.palette.text.primary
                                }}
                              >
                                {achievement.title}
                              </Typography>
                            }
                            secondary={
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: theme.palette.text.secondary,
                                  mt: 0.5
                                }}
                              >
                                {`${achievement.description} - ${new Date(achievement.date).toLocaleDateString()}`}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < achievements.length - 1 && 
                          <Divider sx={{ my: 1, opacity: 0.3 }} />
                        }
                      </React.Fragment>
                    ))}
                  </List>
                  <Button
                    fullWidth
                    variant="text"
                    sx={{ 
                      mt: 3,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      }
                    }}
                    onClick={() => navigate('/employee/certificates')}
                  >
                    Ver mis certificados
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default EmployeeDashboard;