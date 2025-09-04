import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  WorkspacePremium as CertificateIcon,
  PersonAdd as PersonAddIcon,
  Timeline as TimelineIcon
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
  LinearProgress,
  Divider,
  Alert,
  Chip,
  Paper
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { logger } from '../utils/logger';

interface DashboardStats {
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

interface AuditActivity {
  id: number;
  action: string;
  resource_type: string;
  resource_name?: string;
  timestamp: string;
  user_email?: string;
  user_name?: string;
}

interface AlertItem {
  id: number;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_courses: 0,
    total_enrollments: 0,
    active_enrollments: 0,
    total_certificates: 0,
    recent_enrollments: 0,
    completion_rate: 0,
    monthly_enrollments: []
  });
  const [recentActivities, setRecentActivities] = useState<AuditActivity[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('token');
    
    if (token && user) {
      fetchDashboardData();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener estadísticas del dashboard
      const dashboardResponse = await api.get('/reports/dashboard');
      setStats(dashboardResponse.data);
      
      // Obtener actividad reciente de auditoría
      const auditResponse = await api.get('/audit/?limit=10');
      setRecentActivities(auditResponse.data.items || []);
      
      // Generar alertas basadas en los datos
      generateAlerts(dashboardResponse.data);
      
    } catch (error: any) {
      logger.error('Error fetching dashboard data:', error);
      setError('No se pudieron cargar los datos del dashboard. Verifique su conexión e intente nuevamente.');
      
      // Datos de fallback en caso de error
      setStats({
        total_users: 0,
        total_courses: 0,
        total_enrollments: 0,
        active_enrollments: 0,
        total_certificates: 0,
        recent_enrollments: 0,
        completion_rate: 0,
        monthly_enrollments: []
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateAlerts = (dashboardData: DashboardStats) => {
    const newAlerts: AlertItem[] = [];
    
    // Alerta si la tasa de completación es baja
    if (dashboardData.completion_rate < 50) {
      newAlerts.push({
        id: 1,
        type: 'warning',
        title: 'Tasa de Completación Baja',
        description: `La tasa de completación actual es del ${dashboardData.completion_rate.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Alerta si hay muchas inscripciones activas
    if (dashboardData.active_enrollments > dashboardData.total_enrollments * 0.7) {
      newAlerts.push({
        id: 2,
        type: 'info',
        title: 'Muchas Inscripciones Activas',
        description: `Hay ${dashboardData.active_enrollments} inscripciones activas que requieren seguimiento`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Alerta si hay pocas inscripciones recientes
    if (dashboardData.recent_enrollments < 5) {
      newAlerts.push({
        id: 3,
        type: 'warning',
        title: 'Pocas Inscripciones Recientes',
        description: `Solo ${dashboardData.recent_enrollments} inscripciones en los últimos 30 días`,
        timestamp: new Date().toISOString()
      });
    }
    
    setAlerts(newAlerts);
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <PersonAddIcon color="success" />;
      case 'UPDATE':
        return <NotificationsIcon color="info" />;
      case 'DELETE':
        return <WarningIcon color="error" />;
      case 'LOGIN':
        return <CheckCircleIcon color="primary" />;
      case 'LOGOUT':
        return <PeopleIcon color="secondary" />;
      default:
        return <TimelineIcon color="action" />;
    }
  };
  
  const getActivityDescription = (activity: AuditActivity) => {
    const resourceName = activity.resource_name || activity.resource_type;
    switch (activity.action) {
      case 'CREATE':
        return `Creó ${resourceName}`;
      case 'UPDATE':
        return `Actualizó ${resourceName}`;
      case 'DELETE':
        return `Eliminó ${resourceName}`;
      case 'LOGIN':
        return 'Inició sesión';
      case 'LOGOUT':
        return 'Cerró sesión';
      default:
        return `${activity.action} en ${resourceName}`;
    }
  };
  
  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return <WarningIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <NotificationsIcon />;
      case 'success':
        return <CheckCircleIcon />;
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
        Dashboard Administrativo
      </Typography>
      
      <Typography variant="h6" color="textSecondary" gutterBottom>
        Bienvenido, {user?.first_name} {user?.last_name || 'Administrador'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Alertas importantes */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Alertas Importantes
          </Typography>
          <Grid container spacing={2}>
            {alerts.map((alert) => (
              <Grid size={{ xs: 12, md: 4 }} key={alert.id}>
                <Alert 
                  severity={alert.type} 
                  icon={getAlertIcon(alert.type)}
                  sx={{ height: '100%' }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {alert.title}
                  </Typography>
                  <Typography variant="body2">
                    {alert.description}
                  </Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Estadísticas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            },
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <PeopleIcon sx={{ fontSize: 40, color: 'white', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
              {stats.total_users}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Total Usuarios
            </Typography>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            },
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <SchoolIcon sx={{ fontSize: 40, color: 'white', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
              {stats.total_courses}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Total Cursos
            </Typography>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            },
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <AssignmentIcon sx={{ fontSize: 40, color: 'white', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
              {stats.total_enrollments}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Total Inscripciones
            </Typography>
          </Card>
        </Grid>
      </Grid>
      
      {/* Segunda fila de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            },
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white'
          }}>
            <EventIcon sx={{ fontSize: 40, color: 'white', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
              {stats.active_enrollments}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Inscripciones Activas
            </Typography>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            },
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            color: 'white'
          }}>
            <CertificateIcon sx={{ fontSize: 40, color: 'white', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
              {stats.total_certificates}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Certificados Emitidos
            </Typography>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            },
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            color: 'white'
          }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: 'white', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
              {stats.completion_rate}%
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Tasa de Completación
            </Typography>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            p: 2, 
            textAlign: 'center', 
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            },
            background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            color: 'white'
          }}>
            <PersonAddIcon sx={{ fontSize: 40, color: 'white', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
              {stats.recent_enrollments}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Inscripciones Recientes
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Accesos rápidos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                Accesos Rápidos
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate('/admin/users')}
                    sx={{ 
                      height: 60, 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    Gestión de Usuarios
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SchoolIcon />}
                    onClick={() => navigate('/admin/courses')}
                    sx={{ 
                      height: 60, 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    Gestión de Cursos
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate('/admin/evaluations')}
                    sx={{ 
                      height: 60, 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    Evaluaciones
                  </Button>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/admin/reports')}
                    sx={{ 
                      height: 60, 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    Reportes
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SettingsIcon />}
                    onClick={() => navigate('/admin/config')}
                    sx={{ 
                      height: 60, 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    Configuración
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>

        {/* Actividad reciente */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actividad Reciente
              </Typography>
              {recentActivities.length > 0 ? (
                   <List>
                     {recentActivities.map((activity: AuditActivity, index: number) => (
                       <React.Fragment key={activity.id}>
                         <ListItem>
                           <ListItemIcon>
                             {getActivityIcon(activity.action)}
                           </ListItemIcon>
                           <ListItemText
                             primary={`${activity.user_email || 'Usuario'} - ${getActivityDescription(activity)}`}
                             secondary={new Date(activity.timestamp).toLocaleString('es-ES', {
                               year: 'numeric',
                               month: 'short',
                               day: 'numeric',
                               hour: '2-digit',
                               minute: '2-digit'
                             })}
                           />
                         </ListItem>
                         {index < recentActivities.length - 1 && <Divider />}
                       </React.Fragment>
                     ))}
                   </List>
                 ) : (
                   <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                     No hay actividad reciente
                   </Typography>
                 )}
              <Button
                fullWidth
                variant="text"
                sx={{ mt: 2 }}
                onClick={() => navigate('/admin/audit')}
              >
                Ver toda la actividad
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;