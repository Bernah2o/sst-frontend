import React, { useState, useEffect } from 'react';
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
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  Report as ReportIcon,
  Notifications as NotificationsIcon,
  Star as StarIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  WorkspacePremium as CertificateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import api from '../services/api';

interface SupervisorStats {
  total_employees: number;
  employees_in_training: number;
  completed_trainings: number;
  pending_evaluations: number;
  compliance_rate: number;
  overdue_trainings: number;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  position: string;
  active_courses: number;
  completed_courses: number;
  compliance_status: string;
  last_activity: string;
}

interface TrainingAlert {
  id: number;
  type: string;
  message: string;
  employee: string;
  priority: string;
  date: string;
}

interface ComplianceData {
  course_name: string;
  total_employees: number;
  completed: number;
  in_progress: number;
  overdue: number;
  compliance_percentage: number;
}

const SupervisorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SupervisorStats>({
    total_employees: 0,
    employees_in_training: 0,
    completed_trainings: 0,
    pending_evaluations: 0,
    compliance_rate: 0,
    overdue_trainings: 0
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [alerts, setAlerts] = useState<TrainingAlert[]>([]);
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([]);
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
          total_employees: 25,
          employees_in_training: 18,
          completed_trainings: 45,
          pending_evaluations: 8,
          compliance_rate: 85,
          overdue_trainings: 3
        });
        
        setTeamMembers([
          {
            id: 1,
            name: 'Juan Pérez',
            email: 'juan.perez@empresa.com',
            position: 'Operario',
            active_courses: 2,
            completed_courses: 3,
            compliance_status: 'compliant',
            last_activity: '2024-01-10'
          },
          {
            id: 2,
            name: 'María González',
            email: 'maria.gonzalez@empresa.com',
            position: 'Técnico',
            active_courses: 1,
            completed_courses: 5,
            compliance_status: 'compliant',
            last_activity: '2024-01-09'
          },
          {
            id: 3,
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@empresa.com',
            position: 'Operario',
            active_courses: 0,
            completed_courses: 2,
            compliance_status: 'overdue',
            last_activity: '2024-01-05'
          },
          {
            id: 4,
            name: 'Ana López',
            email: 'ana.lopez@empresa.com',
            position: 'Supervisor Jr.',
            active_courses: 3,
            completed_courses: 4,
            compliance_status: 'in_progress',
            last_activity: '2024-01-11'
          }
        ]);
        
        setAlerts([
          {
            id: 1,
            type: 'overdue',
            message: 'Capacitación vencida en Seguridad Industrial',
            employee: 'Carlos Rodríguez',
            priority: 'high',
            date: '2024-01-12'
          },
          {
            id: 2,
            type: 'evaluation',
            message: 'Evaluación pendiente de Primeros Auxilios',
            employee: 'Juan Pérez',
            priority: 'medium',
            date: '2024-01-11'
          },
          {
            id: 3,
            type: 'deadline',
            message: 'Fecha límite próxima para Manejo de Químicos',
            employee: 'María González',
            priority: 'low',
            date: '2024-01-10'
          }
        ]);
        
        setComplianceData([
          {
            course_name: 'Seguridad Industrial Básica',
            total_employees: 25,
            completed: 20,
            in_progress: 3,
            overdue: 2,
            compliance_percentage: 80
          },
          {
            course_name: 'Primeros Auxilios',
            total_employees: 25,
            completed: 22,
            in_progress: 2,
            overdue: 1,
            compliance_percentage: 88
          },
          {
            course_name: 'Manejo de Químicos',
            total_employees: 15,
            completed: 12,
            in_progress: 3,
            overdue: 0,
            compliance_percentage: 80
          },
          {
            course_name: 'Uso de EPP',
            total_employees: 25,
            completed: 25,
            in_progress: 0,
            overdue: 0,
            compliance_percentage: 100
          }
        ]);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <WarningIcon color="error" />;
      case 'evaluation':
        return <AssessmentIcon color="warning" />;
      case 'deadline':
        return <ScheduleIcon color="info" />;
      default:
        return <NotificationsIcon />;
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
        Dashboard de Supervisión
      </Typography>
      
      <Typography variant="h6" color="textSecondary" gutterBottom>
        Bienvenido, {user?.nombre || 'Supervisor'}
      </Typography>

      {/* Estadísticas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="primary" sx={{ mr: 2 }} />
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
                <SchoolIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    En Capacitación
                  </Typography>
                  <Typography variant="h5">
                    {stats.employees_in_training}
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
                    Capacitaciones Completadas
                  </Typography>
                  <Typography variant="h5">
                    {stats.completed_trainings}
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
                <AssessmentIcon color="warning" sx={{ mr: 2 }} />
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
                    Tasa de Cumplimiento
                  </Typography>
                  <Typography variant="h5">
                    {stats.compliance_rate}%
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
                <WarningIcon color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Capacitaciones Vencidas
                  </Typography>
                  <Typography variant="h5">
                    {stats.overdue_trainings}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Estado del equipo */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado del Equipo
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Empleado</TableCell>
                      <TableCell>Posición</TableCell>
                      <TableCell align="center">Cursos Activos</TableCell>
                      <TableCell align="center">Completados</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Última Actividad</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                              {member.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {member.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {member.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{member.position}</TableCell>
                        <TableCell align="center">{member.active_courses}</TableCell>
                        <TableCell align="center">{member.completed_courses}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={member.compliance_status.replace('_', ' ')}
                            color={getComplianceColor(member.compliance_status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {formatDate(member.last_activity)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/supervisor/employees/${member.id}`)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button
                fullWidth
                variant="text"
                sx={{ mt: 2 }}
                onClick={() => navigate('/supervisor/team')}
              >
                Ver todo el equipo
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel lateral */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Alertas y notificaciones */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alertas y Notificaciones
              </Typography>
              <List>
                {alerts.map((alert, index) => (
                  <React.Fragment key={alert.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getAlertIcon(alert.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {alert.message}
                            </Typography>
                            <Chip
                              label={alert.priority}
                              color={getAlertColor(alert.priority) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={`${alert.employee} - ${formatDate(alert.date)}`}
                      />
                    </ListItem>
                    {index < alerts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              <Button
                fullWidth
                variant="text"
                sx={{ mt: 2 }}
                onClick={() => navigate('/supervisor/alerts')}
              >
                Ver todas las alertas
              </Button>
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Acciones Rápidas
              </Typography>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ReportIcon />}
                    onClick={() => navigate('/supervisor/reports')}
                  >
                    Generar Reporte
                  </Button>
                </Grid>
                <Grid size={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GroupIcon />}
                    onClick={() => navigate('/supervisor/team')}
                  >
                    Gestionar Equipo
                  </Button>
                </Grid>
                <Grid size={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TimelineIcon />}
                    onClick={() => navigate('/supervisor/progress')}
                  >
                    Ver Progreso
                  </Button>
                </Grid>
                <Grid size={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CertificateIcon />}
                    onClick={() => navigate('/supervisor/compliance')}
                  >
                    Cumplimiento
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de cumplimiento por curso */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cumplimiento por Curso
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Curso</TableCell>
                      <TableCell align="center">Total Empleados</TableCell>
                      <TableCell align="center">Completados</TableCell>
                      <TableCell align="center">En Progreso</TableCell>
                      <TableCell align="center">Vencidos</TableCell>
                      <TableCell align="center">% Cumplimiento</TableCell>
                      <TableCell align="center">Progreso</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {complianceData.map((course, index) => (
                      <TableRow key={index}>
                        <TableCell>{course.course_name}</TableCell>
                        <TableCell align="center">{course.total_employees}</TableCell>
                        <TableCell align="center">{course.completed}</TableCell>
                        <TableCell align="center">{course.in_progress}</TableCell>
                        <TableCell align="center">{course.overdue}</TableCell>
                        <TableCell align="center">{course.compliance_percentage}%</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={course.compliance_percentage}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                              color={course.compliance_percentage >= 80 ? 'success' : course.compliance_percentage >= 60 ? 'warning' : 'error'}
                            />
                            <Typography variant="caption">
                              {course.compliance_percentage}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SupervisorDashboard;