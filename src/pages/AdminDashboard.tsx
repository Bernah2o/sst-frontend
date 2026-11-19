import {
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { brand, condensed } from '../theme';
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

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
};

const ACTION_COLORS: Record<string, 'success' | 'info' | 'error' | 'default'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
};

const nf = new Intl.NumberFormat('es-CO');
const pf = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

const formatMonth = (raw: string) => {
  const m = /^(\d{4})-(\d{2})/.exec(raw);
  if (!m) return raw;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '').slice(0, 3);
};

const capsSx = {
  fontFamily: condensed,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
};

const visuallyHidden = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  border: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap' as const,
};

/** Encabezado de un cupón: título en mayúsculas condensadas y acción opcional */
const CouponHead: React.FC<{ title: string; meta?: React.ReactNode }> = ({ title, meta }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      px: 2.5,
      minHeight: 48,
      borderBottom: `1px solid ${brand.ruleSoft}`,
    }}
  >
    <Typography component="h2" sx={{ ...capsSx, fontSize: '1rem', color: 'text.primary' }}>
      {title}
    </Typography>
    {meta}
  </Box>
);

/** Celda de la libreta de indicadores */
const Figure: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <Box sx={{ px: 2.5, py: 2, minWidth: 0 }}>
    <Typography sx={{ ...capsSx, fontSize: '0.78rem', color: 'text.secondary' }} noWrap>
      {label}
    </Typography>
    <Typography
      sx={{
        fontFamily: condensed,
        fontWeight: 700,
        fontSize: '2.1rem',
        lineHeight: 1.1,
        mt: 0.5,
        color: brand.carbon,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', minHeight: 18 }} noWrap>
      {note ?? ''}
    </Typography>
  </Box>
);

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

  const monthly = (stats.monthly_enrollments ?? []).slice(-12);
  const monthlyMax = Math.max(0, ...monthly.map((m) => m.count));
  const modalities = workerStats?.by_modality
    ? Object.entries(workerStats.by_modality).sort((a, b) => b[1] - a[1])
    : [];
  const modalityMax = Math.max(0, ...modalities.map(([, c]) => c));
  const totalWorkers =
    workerStats?.total_workers ?? (workerStats ? workerStats.active_workers + workerStats.inactive_workers : 0);
  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <Box aria-busy="true" aria-label="Cargando panel administrativo">
        <Skeleton variant="text" width={320} height={48} />
        <Skeleton variant="text" width={260} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={132} sx={{ mb: 3, borderRadius: 1 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1440, mx: 'auto' }}>
      {/* ── Encabezado ── */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1" sx={{ textTransform: 'uppercase', lineHeight: 1.05 }}>
            Panel administrativo
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {user?.first_name ? `Bienvenido, ${user.first_name} ${user.last_name ?? ''} · ` : ''}
            <Box component="span" sx={{ '&::first-letter': { textTransform: 'uppercase' }, display: 'inline-block' }}>
              {today}
            </Box>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchDashboardData}>
            Actualizar
          </Button>
          <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/admin/audit')}>
            Auditoría
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ── Libreta de indicadores ── */}
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '5fr 2fr' },
          }}
        >
          <Box>
            <Box sx={{ px: 2.5, py: 1, backgroundColor: brand.shell, color: '#fff' }}>
              <Typography sx={{ ...capsSx, fontSize: '0.85rem' }}>Capacitación</Typography>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' },
                '& > *': { borderRight: `1px solid ${brand.ruleSoft}`, borderBottom: { xs: `1px solid ${brand.ruleSoft}`, md: 0 } },
              }}
            >
              <Figure label="Cursos" value={nf.format(stats.total_courses)} />
              <Figure
                label="Inscripciones"
                value={nf.format(stats.total_enrollments)}
                note={`${nf.format(stats.active_enrollments)} activas`}
              />
              <Figure label="Completación" value={`${pf.format(stats.completion_rate ?? 0)} %`} note="de las inscripciones" />
              <Figure label="Últimos 30 días" value={nf.format(stats.recent_enrollments)} note="inscripciones nuevas" />
              <Figure label="Certificados" value={nf.format(stats.total_certificates)} note="emitidos" />
            </Box>
          </Box>
          <Box sx={{ borderLeft: { lg: `2px dashed ${brand.rule}` }, borderTop: { xs: `2px dashed ${brand.rule}`, lg: 0 } }}>
            <Box sx={{ px: 2.5, py: 1, backgroundColor: brand.shell, color: '#fff' }}>
              <Typography sx={{ ...capsSx, fontSize: '0.85rem' }}>Trabajadores</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', '& > *:first-of-type': { borderRight: `1px solid ${brand.ruleSoft}` } }}>
              <Figure
                label="Activos"
                value={workerStats ? nf.format(workerStats.active_workers) : '—'}
                note={workerStats ? `de ${nf.format(totalWorkers)} registrados` : 'Sin datos'}
              />
              <Figure
                label="Inactivos"
                value={workerStats ? nf.format(workerStats.inactive_workers) : '—'}
                note={workerStats ? undefined : 'Sin datos'}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* ── Inscripciones por mes ── */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ height: '100%' }}>
            <CouponHead
              title="Inscripciones por mes"
              meta={
                monthly.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Últimos {monthly.length} meses
                  </Typography>
                )
              }
            />
            {monthly.length > 0 && monthlyMax > 0 ? (
              <Box sx={{ px: 2.5, pt: 3, pb: 2, position: 'relative' }}>
                <Box
                  role="img"
                  aria-label={`Inscripciones por mes. Máximo ${nf.format(monthlyMax)}. Último mes: ${nf.format(monthly[monthly.length - 1].count)}.`}
                  sx={{ position: 'relative', height: 200, borderBottom: `1px solid ${brand.ink}` }}
                >
                  {/* Líneas de referencia recesivas */}
                  {[0.5, 1].map((f) => (
                    <Box
                      key={f}
                      aria-hidden
                      sx={{ position: 'absolute', left: 0, right: 0, bottom: `${f * 100}%`, borderTop: `1px dashed ${brand.ruleSoft}` }}
                    >
                      <Typography variant="caption" sx={{ position: 'absolute', right: 0, top: -18, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                        {nf.format(Math.round(monthlyMax * f))}
                      </Typography>
                    </Box>
                  ))}
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: '2px', pr: 5 }}>
                    {monthly.map((m, i) => {
                      const isLast = i === monthly.length - 1;
                      return (
                        <Tooltip key={m.month} title={`${formatMonth(m.month)}: ${nf.format(m.count)} inscripciones`} placement="top" arrow>
                          <Box sx={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', cursor: 'default', '&:hover > span': { opacity: 1 } }}>
                            <Box
                              component="span"
                              sx={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: 34,
                                height: `${(m.count / monthlyMax) * 100}%`,
                                minHeight: m.count > 0 ? 2 : 0,
                                backgroundColor: brand.chart,
                                borderRadius: '4px 4px 0 0',
                                opacity: isLast ? 1 : 0.82,
                                transition: 'opacity 120ms ease-out',
                              }}
                            >
                              {isLast && (
                                <Typography
                                  component="span"
                                  sx={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontWeight: 700, fontSize: '0.85rem', color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}
                                >
                                  {nf.format(m.count)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
                <Box aria-hidden sx={{ display: 'flex', gap: '2px', pr: 5, mt: 0.75 }}>
                  {monthly.map((m) => (
                    <Typography key={m.month} variant="caption" sx={{ flex: 1, textAlign: 'center', color: 'text.secondary', textTransform: 'capitalize' }} noWrap>
                      {formatMonth(m.month)}
                    </Typography>
                  ))}
                </Box>
                {/* Vista de tabla para lectores de pantalla */}
                <Table size="small" sx={visuallyHidden}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mes</TableCell>
                      <TableCell>Inscripciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthly.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell>{formatMonth(m.month)}</TableCell>
                        <TableCell>{m.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">Aún no hay inscripciones registradas por mes.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* ── Modalidad de trabajo ── */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ height: '100%' }}>
            <CouponHead
              title="Trabajadores por modalidad"
              meta={
                workerStats && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {nf.format(totalWorkers)} en total
                  </Typography>
                )
              }
            />
            {modalities.length > 0 && modalityMax > 0 ? (
              <Box component="ul" sx={{ listStyle: 'none', m: 0, px: 2.5, py: 2 }}>
                {modalities.map(([key, count]) => {
                  const percent = workerStats?.percent_by_modality?.[key] ?? 0;
                  return (
                    <Box component="li" key={key} sx={{ py: 1.1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.6, gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                          {MODALITY_LABELS[key] || key}
                        </Typography>
                        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          <Box component="strong">{nf.format(count)}</Box>
                          <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                            {pf.format(percent)} %
                          </Box>
                        </Typography>
                      </Box>
                      <Box sx={{ height: 8, backgroundColor: brand.ruleSoft, borderRadius: '1px' }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: `${(count / modalityMax) * 100}%`,
                            minWidth: count > 0 ? 2 : 0,
                            backgroundColor: brand.chart,
                            borderRadius: '0 4px 4px 0',
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No hay datos de modalidad de trabajo.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ── Requiere atención ── */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ height: '100%' }}>
            <CouponHead
              title="Requiere atención"
              meta={alerts.length > 0 && <Chip size="small" color="warning" label={alerts.length} />}
            />
            {alerts.length > 0 ? (
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {alerts.map((alert) => (
                  <Box component="li" key={alert.id} sx={{ px: 2.5, py: 1.75, borderBottom: `1px dashed ${brand.ruleSoft}`, '&:last-of-type': { borderBottom: 0 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start' }}>
                      <Typography sx={{ fontWeight: 700 }}>{alert.title}</Typography>
                      <Chip
                        size="small"
                        color={alert.type === 'info' ? 'info' : alert.type === 'error' ? 'error' : 'warning'}
                        label={alert.type === 'info' ? 'Seguimiento' : 'Revisar'}
                        sx={{ flex: 'none' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {alert.description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ px: 2.5, py: 3 }}>
                <Typography color="text.secondary">Sin alertas activas en capacitación.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* ── Actividad reciente ── */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ height: '100%', overflow: 'hidden' }}>
            <CouponHead
              title="Actividad reciente"
              meta={
                <Button size="small" endIcon={<ArrowForwardIcon fontSize="small" />} onClick={() => navigate('/admin/audit')}>
                  Ver todo
                </Button>
              }
            />
            {recentActivities.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" aria-label="Actividad reciente">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cuándo</TableCell>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Acción</TableCell>
                      <TableCell>Detalle</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivities.map((activity) => (
                      <TableRow key={activity.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                          <Tooltip title={new Date(activity.created_at).toLocaleString('es-CO')}>
                            <span>{formatTimeAgo(activity.created_at)}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {activity.user_name || activity.user_email || 'Usuario'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={ACTION_LABELS[activity.action] ?? activity.action}
                            color={ACTION_COLORS[activity.action] ?? 'default'}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', maxWidth: 280 }}>
                          <Typography variant="body2" noWrap>{getActivityDescription(activity)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Box sx={{ px: 2.5, py: 3 }}>
                <Typography color="text.secondary">No hay actividad reciente.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
