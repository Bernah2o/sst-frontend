import {
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
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
import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface SupervisorStats {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  employees_in_training: number;
  completed_trainings: number;
  pending_evaluations: number;
  compliance_rate: number;
  expired_trainings: number;
}

interface TeamMember {
  id: number;
  name: string;
  position: string;
  active_courses: number;
  completed_courses: number;
  status: 'En Capacitación' | 'Completado' | 'Sin Asignar';
  last_activity: string;
}

interface TrainingAlert {
  id: number;
  employee_name: string;
  training_name: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  days_overdue: number;
}

interface ComplianceData {
  course_id: number;
  course_name: string;
  total_enrolled: number;
  completed: number;
  in_progress: number;
  overdue: number;
  compliance_percentage: number;
}

interface DashboardData {
  stats: SupervisorStats;
  team_members: TeamMember[];
  training_alerts: TrainingAlert[];
  compliance_data: ComplianceData[];
}

const SupervisorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/supervisor/dashboard');
      setDashboardData(response.data);
      
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
      setError('Hubo un problema al cargar la información del dashboard. Por favor, intenta recargar la página o contacta al soporte técnico si el problema persiste.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completado':
        return 'success';
      case 'en capacitación':
        return 'warning';
      case 'pendiente':
        return 'default';
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

  const getAlertIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
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

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          No hay datos disponibles
        </Typography>
      </Box>
    );
  }

  const { stats, team_members: teamMembers, training_alerts: alerts, compliance_data: complianceData } = dashboardData;

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
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Empleados Activos
                  </Typography>
                  <Typography variant="h5">
                     {stats.active_employees}
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
                <ErrorIcon color="disabled" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Empleados Inactivos
                  </Typography>
                  <Typography variant="h5">
                     {stats.inactive_employees}
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
                     {stats.expired_trainings}
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
                            <Typography variant="body2" fontWeight="medium">
                              {member.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{member.position}</TableCell>
                        <TableCell align="center">{member.active_courses}</TableCell>
                        <TableCell align="center">{member.completed_courses}</TableCell>
                        <TableCell align="center">
                          <Chip
                             label={member.status}
                             color={getStatusColor(member.status) as any}
                             size="small"
                           />
                        </TableCell>
                        <TableCell align="center">
                          {member.last_activity}
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
                         {getAlertIcon(alert.priority)}
                       </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {alert.employee_name} - {alert.training_name}
                            </Typography>
                            <Chip
                              label={alert.priority}
                              color={getAlertColor(alert.priority) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={alert.due_date ? `Vence: ${alert.due_date}` : ''}
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
                         <TableCell align="center">{course.total_enrolled}</TableCell>
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