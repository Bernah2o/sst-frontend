import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  WorkspacePremium as CertificateIcon,
  PersonAdd as PersonAddIcon,
  Timeline as TimelineIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
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
  Avatar,
  Chip,
  Stack,
} from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
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
  created_at: string;
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

interface WorkerStats {
  total_workers: number;
  active_workers: number;
  inactive_workers: number;
  by_modality: Record<string, number>;
  percent_by_modality: Record<string, number>;
}

const MODALITY_LABELS: Record<string, string> = {
  ON_SITE: 'Presencial',
  REMOTE: 'Remoto',
  TELEWORK: 'Teletrabajo',
  HOME_OFFICE: 'Home Office',
  MOBILE: 'Móvil/Itinerante',
  UNKNOWN: 'Desconocida'
};

const MODALITY_COLORS: Record<string, string> = {
  ON_SITE: '#4caf50',
  REMOTE: '#2196f3',
  TELEWORK: '#9c27b0',
  HOME_OFFICE: '#ff9800',
  MOBILE: '#f44336',
  UNKNOWN: '#9e9e9e'
};

const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
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
  const [workerStats, setWorkerStats] = useState<WorkerStats | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardResponse = await api.get('/reports/dashboard');
      setStats(dashboardResponse.data);

      const auditResponse = await api.get('/audit/?limit=8');
      setRecentActivities(auditResponse.data.items || []);

      generateAlerts(dashboardResponse.data);

      try {
        const workerStatsResponse = await api.get('/workers/stats');
        setWorkerStats(workerStatsResponse.data);
      } catch (wsErr) {
        logger.warn('No se pudieron cargar estadísticas de trabajadores:', wsErr);
      }
    } catch (error: any) {
      logger.error('Error fetching dashboard data:', error);
      setError('No se pudieron cargar los datos del dashboard. Verifique su conexión e intente nuevamente.');
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
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 0);

      return () => clearTimeout(timer);
    }

    fetchDashboardData();
  }, [user, authLoading, isAuthenticated, navigate, fetchDashboardData]);

  const generateAlerts = (dashboardData: DashboardStats) => {
    const newAlerts: AlertItem[] = [];

    if (dashboardData.completion_rate < 50) {
      newAlerts.push({
        id: 1,
        type: 'warning',
        title: 'Tasa de Completación Baja',
        description: `La tasa de completación actual es del ${dashboardData.completion_rate.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }

    if (dashboardData.active_enrollments > dashboardData.total_enrollments * 0.7) {
      newAlerts.push({
        id: 2,
        type: 'info',
        title: 'Muchas Inscripciones Activas',
        description: `Hay ${dashboardData.active_enrollments} inscripciones activas que requieren seguimiento`,
        timestamp: new Date().toISOString()
      });
    }

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
        return <PersonAddIcon sx={{ color: '#4caf50' }} />;
      case 'UPDATE':
        return <NotificationsIcon sx={{ color: '#2196f3' }} />;
      case 'DELETE':
        return <WarningIcon sx={{ color: '#f44336' }} />;
      case 'LOGIN':
        return <CheckCircleIcon sx={{ color: '#9c27b0' }} />;
      case 'LOGOUT':
        return <PeopleIcon sx={{ color: '#ff9800' }} />;
      default:
        return <TimelineIcon sx={{ color: '#607d8b' }} />;
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

  const getActionChipColor = (action: string): "success" | "info" | "error" | "warning" | "default" => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      case 'LOGIN': return 'default';
      case 'LOGOUT': return 'warning';
      default: return 'default';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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

  const StatCard = ({
    icon,
    title,
    value,
    subtitle,
    color,
    trend,
    trendValue
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }) => (
    <Card sx={{
      height: '100%',
      borderRadius: 3,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
        transform: 'translateY(-2px)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{
            bgcolor: `${color}15`,
            width: 56,
            height: 56,
            '& .MuiSvgIcon-root': { color: color, fontSize: 28 }
          }}>
            {icon}
          </Avatar>
          {trend && trendValue && (
            <Chip
              size="small"
              icon={trend === 'up' ? <ArrowUpIcon sx={{ fontSize: 16 }} /> : <ArrowDownIcon sx={{ fontSize: 16 }} />}
              label={trendValue}
              sx={{
                bgcolor: trend === 'up' ? '#e8f5e9' : '#ffebee',
                color: trend === 'up' ? '#2e7d32' : '#c62828',
                fontWeight: 600,
                '& .MuiChip-icon': { color: 'inherit' }
              }}
            />
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: '#9ca3af', mt: 1, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 1 }}>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" sx={{ color: '#6b7280' }}>
            Bienvenido, {user?.first_name} {user?.last_name}
          </Typography>
          <Chip
            icon={<CalendarIcon sx={{ fontSize: 16 }} />}
            label={new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            size="small"
            sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 500, textTransform: 'capitalize' }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Alertas importantes */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            {alerts.map((alert) => (
              <Grid size={{ xs: 12, md: 4 }} key={alert.id}>
                <Alert
                  severity={alert.type}
                  sx={{
                    borderRadius: 2,
                    '& .MuiAlert-message': { width: '100%' }
                  }}
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
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<PeopleIcon />}
            title="Total Usuarios"
            value={stats.total_users}
            color="#6366f1"
            trend="up"
            trendValue="+12%"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<SchoolIcon />}
            title="Total Cursos"
            value={stats.total_courses}
            color="#ec4899"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<AssignmentIcon />}
            title="Inscripciones"
            value={stats.total_enrollments}
            subtitle={`${stats.active_enrollments} activas`}
            color="#14b8a6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<CertificateIcon />}
            title="Certificados"
            value={stats.total_certificates}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* Segunda fila de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<TrendingUpIcon />}
            title="Tasa Completación"
            value={`${stats.completion_rate}%`}
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<PersonAddIcon />}
            title="Inscripciones Recientes"
            value={stats.recent_enrollments}
            subtitle="Últimos 30 días"
            color="#8b5cf6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<CheckCircleIcon />}
            title="Trabajadores Activos"
            value={workerStats?.active_workers ?? 0}
            color="#22c55e"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<WarningIcon />}
            title="Trabajadores Inactivos"
            value={workerStats?.inactive_workers ?? 0}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      {/* Contenido principal */}
      <Grid container spacing={3}>
        {/* Modalidad de Trabajo */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BusinessIcon sx={{ color: '#6366f1' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                  Modalidad de Trabajo
                </Typography>
              </Box>

              {workerStats?.by_modality && Object.keys(workerStats.by_modality).length > 0 ? (
                <Stack spacing={2.5}>
                  {Object.entries(workerStats.by_modality).map(([key, count]) => {
                    const label = MODALITY_LABELS[key] || key;
                    const color = MODALITY_COLORS[key] || '#9e9e9e';
                    const percent = workerStats?.percent_by_modality?.[key] ?? 0;
                    return (
                      <Box key={key}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                              {label}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                              {count}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                              ({percent}%)
                            </Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#f3f4f6',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: color
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  bgcolor: '#f9fafb',
                  borderRadius: 2
                }}>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    No hay datos de modalidades disponibles
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Actividad reciente */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon sx={{ color: '#6366f1' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                    Actividad Reciente
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/audit')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    color: '#6366f1'
                  }}
                >
                  Ver todo
                </Button>
              </Box>

              {recentActivities.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem sx={{
                        px: 0,
                        py: 1.5,
                        '&:hover': { bgcolor: '#f9fafb', borderRadius: 2 }
                      }}>
                        <ListItemIcon sx={{ minWidth: 44 }}>
                          <Avatar sx={{
                            width: 36,
                            height: 36,
                            bgcolor: '#f3f4f6'
                          }}>
                            {getActivityIcon(activity.action)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a2e' }}>
                                {activity.user_email || 'Usuario'}
                              </Typography>
                              <Chip
                                label={activity.action}
                                size="small"
                                color={getActionChipColor(activity.action)}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              {getActivityDescription(activity)}
                            </Typography>
                          }
                        />
                        <Typography variant="caption" sx={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {formatTimeAgo(activity.created_at)}
                        </Typography>
                      </ListItem>
                      {index < recentActivities.length - 1 && (
                        <Divider sx={{ my: 0.5 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  bgcolor: '#f9fafb',
                  borderRadius: 2
                }}>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    No hay actividad reciente
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
