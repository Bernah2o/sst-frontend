import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import {
  Box,
  Grid,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { logger } from '../utils/logger';

interface TrainerStats {
  my_courses: number;
  active_sessions: number;
  total_employees: number;
  completed_sessions: number;
  pending_evaluations: number;
  average_attendance: number;
}

interface UpcomingSession {
  id: number;
  course_title: string;
  date: string;
  time: string;
  location: string;
  enrolled_count: number;
  status: string;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  date: string;
  course?: string;
}

const TrainerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TrainerStats>({
    my_courses: 0,
    active_sessions: 0,
    total_employees: 0,
    completed_sessions: 0,
    pending_evaluations: 0,
    average_attendance: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simular datos del dashboard hasta que se implementen los endpoints
      setTimeout(() => {
        setStats({
          my_courses: 8,
          active_sessions: 3,
          total_employees: 45,
          completed_sessions: 12,
          pending_evaluations: 7,
          average_attendance: 85.2
        });
        
        setUpcomingSessions([
          {
            id: 1,
            course_title: 'Seguridad Industrial Básica',
            date: '2024-01-15',
            time: '09:00',
            location: 'Aula 101',
            enrolled_count: 15,
            status: 'programada'
          },
          {
            id: 2,
            course_title: 'Primeros Auxilios',
            date: '2024-01-16',
            time: '14:00',
            location: 'Laboratorio A',
            enrolled_count: 12,
            status: 'programada'
          },
          {
            id: 3,
            course_title: 'Manejo de Químicos',
            date: '2024-01-17',
            time: '10:30',
            location: 'Aula 203',
            enrolled_count: 18,
            status: 'programada'
          }
        ]);
        
        setRecentActivities([
          {
            id: 1,
            type: 'session_completed',
            description: 'Sesión completada exitosamente',
            date: new Date().toISOString(),
            course: 'Seguridad en Alturas'
          },
          {
            id: 2,
            type: 'evaluation_graded',
            description: 'Evaluaciones calificadas',
            date: new Date(Date.now() - 3600000).toISOString(),
            course: 'Uso de EPP'
          },
          {
            id: 3,
            type: 'attendance_recorded',
            description: 'Asistencia registrada',
            date: new Date(Date.now() - 7200000).toISOString(),
            course: 'Prevención de Riesgos'
          }
        ]);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session_completed':
        return <CheckCircleIcon color="success" />;
      case 'evaluation_graded':
        return <AssessmentIcon color="info" />;
      case 'attendance_recorded':
        return <PeopleIcon color="primary" />;
      default:
        return <EventIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'programada':
        return 'primary';
      case 'en_curso':
        return 'warning';
      case 'completada':
        return 'success';
      default:
        return 'default';
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard del Entrenador
      </Typography>
      
      <Typography variant="h6" color="textSecondary" gutterBottom>
        Bienvenido, {user?.nombre || 'Entrenador'}
      </Typography>

      {/* Estadísticas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Mis Cursos
                  </Typography>
                  <Typography variant="h5">
                    {stats.my_courses}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Sesiones Activas
                  </Typography>
                  <Typography variant="h5">
                    {stats.active_sessions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Empleados
                  </Typography>
                  <Typography variant="h5">
                    {stats.total_employees}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Sesiones Completadas
                  </Typography>
                  <Typography variant="h5">
                    {stats.completed_sessions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Evaluaciones Pendientes
                  </Typography>
                  <Typography variant="h5">
                    {stats.pending_evaluations}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Asistencia Promedio
                  </Typography>
                  <Typography variant="h5">
                    {stats.average_attendance}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Próximas sesiones */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Próximas Sesiones
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Curso</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Hora</TableCell>
                      <TableCell>Ubicación</TableCell>
                      <TableCell>Inscritos</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{session.course_title}</TableCell>
                        <TableCell>{formatDate(session.date)}</TableCell>
                        <TableCell>{session.time}</TableCell>
                        <TableCell>{session.location}</TableCell>
                        <TableCell>{session.enrolled_count}</TableCell>
                        <TableCell>
                          <Chip
                            label={session.status}
                            color={getStatusColor(session.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {/* Navegación a sesiones eliminada - funcionalidad removida */}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Botón de sesiones eliminado - funcionalidad removida del sistema */}
            </CardContent>
          </Card>
        </Grid>

        {/* Panel lateral */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Accesos rápidos */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accesos Rápidos
              </Typography>
              <Grid container spacing={2}>
                {/* Botón de gestión de sesiones eliminado - funcionalidad removida del sistema */}
                <Grid size={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate('/trainer/evaluations')}
                  >
                    Evaluaciones
                  </Button>
                </Grid>
                <Grid size={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/trainer/progress')}
                  >
                    Progreso Empleados
                  </Button>
                </Grid>
                <Grid size={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate('/trainer/attendance')}
                  >
                    Asistencia
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Actividad reciente */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actividad Reciente
              </Typography>
              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={`${activity.course} - ${new Date(activity.date).toLocaleString()}`}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrainerDashboard;