import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Link,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Schedule as ScheduleIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Cell,
} from 'recharts';
import {
  planTrabajoAnualService,
  PlanTrabajoAnualDetail,
  PlanTrabajoActividad,
  DashboardIndicadores,
  CicloPhva,
  CategoriaActividad,
} from '../services/planTrabajoAnualService';

// ============================================================
// Constantes de etiquetas
// ============================================================
const CICLO_LABELS: Record<CicloPhva, string> = {
  I_PLANEAR: 'I. PLANEAR',
  II_HACER: 'II. HACER',
  III_VERIFICAR: 'III. VERIFICAR',
  IV_ACTUAR: 'IV. ACTUAR',
};

const CICLO_COLORS: Record<CicloPhva, string> = {
  I_PLANEAR: '#1976d2',
  II_HACER: '#388e3c',
  III_VERIFICAR: '#f57c00',
  IV_ACTUAR: '#7b1fa2',
};

const CATEGORIA_LABELS: Record<CategoriaActividad, string> = {
  RECURSOS: 'RECURSOS',
  GESTION_INTEGRAL: 'GESTIÓN INTEGRAL DEL SISTEMA',
  GESTION_SALUD: 'GESTIÓN DE LA SALUD',
  GESTION_PELIGROS: 'GESTIÓN DE PELIGROS Y RIESGOS',
  GESTION_AMENAZAS: 'GESTIÓN DE AMENAZAS',
  VERIFICACION: 'VERIFICACIÓN DEL SG-SST',
  MEJORAMIENTO: 'MEJORAMIENTO',
};

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Orden de ciclos y categorías
const CICLOS_ORDER: CicloPhva[] = ['I_PLANEAR', 'II_HACER', 'III_VERIFICAR', 'IV_ACTUAR'];
const CATEGORIAS_BY_CICLO: Record<CicloPhva, CategoriaActividad[]> = {
  I_PLANEAR: ['RECURSOS', 'GESTION_INTEGRAL'],
  II_HACER: ['GESTION_SALUD', 'GESTION_PELIGROS', 'GESTION_AMENAZAS'],
  III_VERIFICAR: ['VERIFICACION'],
  IV_ACTUAR: ['MEJORAMIENTO'],
};

// ============================================================
// Componente principal
// ============================================================
const PlanTrabajoAnualDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<PlanTrabajoAnualDetail | null>(null);
  const [dashboard, setDashboard] = useState<DashboardIndicadores | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingCell, setUpdatingCell] = useState<string | null>(null); // "actividadId-mes"
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const cargarDatos = useCallback(async () => {
    if (!planId) return;
    try {
      setLoadingPlan(true);
      const planData = await planTrabajoAnualService.obtenerPlan(parseInt(planId));
      setPlan(planData);
    } catch {
      setError('Error al cargar el plan de trabajo');
    } finally {
      setLoadingPlan(false);
    }
  }, [planId]);

  const cargarDashboard = useCallback(async () => {
    if (!planId) return;
    try {
      setLoadingDashboard(true);
      const dash = await planTrabajoAnualService.obtenerDashboard(parseInt(planId));
      setDashboard(dash);
    } catch {
      // Dashboard no crítico
    } finally {
      setLoadingDashboard(false);
    }
  }, [planId]);

  useEffect(() => {
    cargarDatos();
    cargarDashboard();
  }, [cargarDatos, cargarDashboard]);

  const handleTogglePE = async (
    actividadId: number,
    mes: number,
    campo: 'programada' | 'ejecutada',
    valorActual: boolean
  ) => {
    const key = `${actividadId}-${mes}-${campo}`;
    if (updatingCell === key) return;
    setUpdatingCell(key);

    try {
      await planTrabajoAnualService.actualizarSeguimiento(actividadId, mes, {
        [campo]: !valorActual,
      });

      // Actualizar estado local optimistamente
      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          actividades: prev.actividades.map((act) => {
            if (act.id !== actividadId) return act;
            return {
              ...act,
              seguimientos_mensuales: act.seguimientos_mensuales.map((s) =>
                s.mes === mes ? { ...s, [campo]: !valorActual } : s
              ),
            };
          }),
        };
      });

      // Refrescar dashboard en background
      cargarDashboard();
    } catch {
      setError('Error al actualizar el seguimiento');
    } finally {
      setUpdatingCell(null);
    }
  };

  const handleUpdateActividad = useCallback(async (actividadId: number, data: { frecuencia?: string; responsable?: string }) => {
    try {
      await planTrabajoAnualService.actualizarActividad(actividadId, data);
      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          actividades: prev.actividades.map((act) =>
            act.id === actividadId ? { ...act, ...data } : act
          ),
        };
      });
    } catch {
      setError('Error al guardar el cambio');
    }
  }, []);

  const handleExportarExcel = async () => {
    if (!plan) return;
    setExportingExcel(true);
    try {
      await planTrabajoAnualService.exportarExcel(plan.id, plan.año);
    } catch {
      setError('Error al exportar a Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportarPdf = async () => {
    if (!plan) return;
    setExportingPdf(true);
    try {
      await planTrabajoAnualService.exportarPdf(plan.id, plan.año);
    } catch {
      setError('Error al exportar a PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loadingPlan) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (!plan) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Plan no encontrado</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/admin/plan-trabajo-anual')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowBackIcon fontSize="small" />
          Planes de Trabajo
        </Link>
        <Typography color="text.primary">Plan {plan.año}</Typography>
      </Breadcrumbs>

      {/* Título */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Plan de Trabajo Anual SG-SST — {plan.año}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {plan.codigo} • v{plan.version} {plan.encargado_sgsst && `• Encargado: ${plan.encargado_sgsst}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            variant="outlined"
            color="success"
            startIcon={exportingExcel ? <CircularProgress size={16} /> : <FileDownloadIcon />}
            onClick={handleExportarExcel}
            disabled={exportingExcel || exportingPdf}
            size="small"
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={exportingPdf ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
            onClick={handleExportarPdf}
            disabled={exportingExcel || exportingPdf}
            size="small"
          >
            PDF
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard */}
      <DashboardSection
        dashboard={dashboard}
        loading={loadingDashboard}
        metaPorcentaje={plan.meta_porcentaje}
        actividades={plan.actividades}
      />

      <Divider sx={{ my: 3 }} />

      {/* Leyenda */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 18 }} />
          <Typography variant="caption">P = Programada</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
          <Typography variant="caption">E = Ejecutada</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Haga clic en las celdas para marcar P (programado) o E (ejecutado)
        </Typography>
      </Box>

      {/* Matriz de actividades agrupada por PHVA */}
      {CICLOS_ORDER.map((ciclo) => (
        <CicloSection
          key={ciclo}
          ciclo={ciclo}
          actividades={plan.actividades}
          updatingCell={updatingCell}
          onToggle={handleTogglePE}
          onUpdateActividad={handleUpdateActividad}
        />
      ))}
    </Box>
  );
};

// ============================================================
// Dashboard Section
// ============================================================
interface DashboardSectionProps {
  dashboard: DashboardIndicadores | null;
  loading: boolean;
  metaPorcentaje: number;
  actividades: PlanTrabajoActividad[];
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ dashboard, loading, metaPorcentaje, actividades }) => {
  const chartData = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.meses.map((m) => ({
      mes: MESES_CORTOS[m.mes - 1],
      Programadas: m.programadas,
      Ejecutadas: m.ejecutadas,
      porcentaje: m.porcentaje,
    }));
  }, [dashboard]);

  // Datos por ciclo PHVA calculados desde las actividades
  const cicloData = useMemo(() => {
    return CICLOS_ORDER.map((ciclo) => {
      const acts = actividades.filter((a) => a.ciclo === ciclo);
      let prog = 0, ejec = 0;
      acts.forEach((act) => {
        act.seguimientos_mensuales.forEach((s) => {
          if (s.programada) prog++;
          if (s.ejecutada) ejec++;
        });
      });
      const pct = prog > 0 ? Math.round((ejec / prog) * 1000) / 10 : 0;
      return {
        ciclo: CICLO_LABELS[ciclo],
        Programadas: prog,
        Ejecutadas: ejec,
        Cumplimiento: pct,
        color: CICLO_COLORS[ciclo],
      };
    });
  }, [actividades]);

  if (loading) {
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[1, 2, 3].map((i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={i}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!dashboard) return null;

  const pct = dashboard.porcentaje_global;
  const pctColor = pct >= metaPorcentaje ? 'success.main' : pct >= metaPorcentaje * 0.7 ? 'warning.main' : 'error.main';

  return (
    <Grid container spacing={3}>
      {/* KPI Cards */}
      <Grid size={{ xs: 12, sm: 4, md: 3 }}>
        <Grid container spacing={2} direction="column">
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  TOTAL PROGRAMADAS
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {dashboard.total_programadas}
                </Typography>
                <Typography variant="caption" color="text.secondary">actividades en el año</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  TOTAL EJECUTADAS
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {dashboard.total_ejecutadas}
                </Typography>
                <Typography variant="caption" color="text.secondary">actividades completadas</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  CUMPLIMIENTO GLOBAL
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={Math.min(pct, 100)}
                      size={60}
                      thickness={5}
                      sx={{ color: pctColor }}
                    />
                    <Box
                      sx={{
                        top: 0, left: 0, bottom: 0, right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" fontWeight="bold" sx={{ color: pctColor }}>
                        {pct}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: pctColor }}>
                      {pct}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Meta: {metaPorcentaje}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Gráfico de barras mensual */}
      <Grid size={{ xs: 12, sm: 8, md: 9 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Cumplimiento del Plan de Trabajo — Actividades por Mes
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  formatter={(value: number, name: string) => [value, name]}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Legend />
                <ReferenceLine
                  y={metaPorcentaje / 100}
                  stroke="#f44336"
                  strokeDasharray="5 5"
                  label={{ value: `Meta ${metaPorcentaje}%`, position: 'insideTopRight', fontSize: 11, fill: '#f44336' }}
                />
                <Bar dataKey="Programadas" fill="#1976d2" radius={[4, 4, 0, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell key={index} fill="#1976d2" fillOpacity={0.7} />
                  ))}
                </Bar>
                <Bar dataKey="Ejecutadas" fill="#388e3c" radius={[4, 4, 0, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell key={index} fill="#388e3c" fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Gráfico cumplimiento por ciclo PHVA */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Cumplimiento por Ciclo PHVA
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={cicloData}
                margin={{ top: 8, right: 30, left: 0, bottom: 5 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="ciclo" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11 }}
                  label={{ value: '% Cumplimiento', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#757575' }}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const pctColor = d.Cumplimiento >= metaPorcentaje ? '#2e7d32' : d.Cumplimiento >= metaPorcentaje * 0.7 ? '#e65100' : '#c62828';
                    return (
                      <Paper elevation={3} sx={{ p: 1.5, minWidth: 160 }}>
                        <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                          {d.ciclo}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Programadas: <b>{d.Programadas}</b>
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Ejecutadas: <b>{d.Ejecutadas}</b>
                        </Typography>
                        <Typography variant="caption" display="block" fontWeight="bold" sx={{ color: pctColor, mt: 0.5 }}>
                          Cumplimiento: {d.Cumplimiento}%
                        </Typography>
                      </Paper>
                    );
                  }}
                />
                <ReferenceLine
                  y={metaPorcentaje}
                  stroke="#f44336"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{ value: `Meta ${metaPorcentaje}%`, position: 'insideTopRight', fontSize: 10, fill: '#f44336' }}
                />
                <Bar dataKey="Cumplimiento" radius={[6, 6, 0, 0]} maxBarSize={100} label={{ position: 'top', formatter: (v: any) => `${v}%`, fontSize: 11, fontWeight: 700 }}>
                  {cicloData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                      fillOpacity={entry.Cumplimiento >= metaPorcentaje ? 0.95 : 0.65}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ============================================================
// Sección por Ciclo PHVA
// ============================================================
interface CicloSectionProps {
  ciclo: CicloPhva;
  actividades: PlanTrabajoActividad[];
  updatingCell: string | null;
  onToggle: (actividadId: number, mes: number, campo: 'programada' | 'ejecutada', valorActual: boolean) => void;
  onUpdateActividad: (id: number, data: { frecuencia?: string; responsable?: string }) => Promise<void>;
}

const CicloSection: React.FC<CicloSectionProps> = ({ ciclo, actividades, updatingCell, onToggle, onUpdateActividad }) => {
  const [expanded, setExpanded] = useState(true);
  const categorias = CATEGORIAS_BY_CICLO[ciclo];
  const color = CICLO_COLORS[ciclo];

  const actividadesDelCiclo = actividades.filter((a) => a.ciclo === ciclo);
  if (actividadesDelCiclo.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      {/* Header del ciclo */}
      <Paper
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          mb: 1,
          bgcolor: color,
          color: 'white',
          cursor: 'pointer',
          borderRadius: 1,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="h6" fontWeight="bold">
          {CICLO_LABELS[ciclo]}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${actividadesDelCiclo.length} actividades`}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Paper>

      <Collapse in={expanded}>
        {categorias.map((cat) => {
          const actsCat = actividadesDelCiclo.filter((a) => a.categoria === cat);
          if (actsCat.length === 0) return null;
          return (
            <CategoriaTable
              key={cat}
              categoria={cat}
              cicloColor={color}
              actividades={actsCat}
              updatingCell={updatingCell}
              onToggle={onToggle}
              onUpdateActividad={onUpdateActividad}
            />
          );
        })}
      </Collapse>
    </Box>
  );
};

// ============================================================
// Tabla por Categoría
// ============================================================
interface CategoriaTableProps {
  categoria: CategoriaActividad;
  cicloColor: string;
  actividades: PlanTrabajoActividad[];
  updatingCell: string | null;
  onToggle: (actividadId: number, mes: number, campo: 'programada' | 'ejecutada', valorActual: boolean) => void;
  onUpdateActividad: (id: number, data: { frecuencia?: string; responsable?: string }) => Promise<void>;
}

const CategoriaTable: React.FC<CategoriaTableProps> = ({ categoria, cicloColor, actividades, updatingCell, onToggle, onUpdateActividad }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          px: 2,
          py: 0.75,
          bgcolor: `${cicloColor}22`,
          borderLeft: `4px solid ${cicloColor}`,
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
          {CATEGORIA_LABELS[categoria]}
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 80, fontSize: '0.7rem' }}>Estándar</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 280, fontSize: '0.7rem' }}>Descripción</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 110, fontSize: '0.7rem' }}>
                Frecuencia
                <Typography component="span" sx={{ fontSize: '0.6rem', color: 'primary.main', ml: 0.5 }}>✎</Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 150, fontSize: '0.7rem' }}>
                Responsable
                <Typography component="span" sx={{ fontSize: '0.6rem', color: 'primary.main', ml: 0.5 }}>✎</Typography>
              </TableCell>
              {MESES_CORTOS.map((mes) => (
                <TableCell
                  key={mes}
                  align="center"
                  sx={{ fontWeight: 'bold', minWidth: 54, fontSize: '0.7rem', px: 0.5 }}
                >
                  {mes}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {actividades.map((act) => (
              <ActividadRow
                key={act.id}
                actividad={act}
                updatingCell={updatingCell}
                onToggle={onToggle}
                onUpdateActividad={onUpdateActividad}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ============================================================
// Celda inline editable (Frecuencia / Responsable)
// ============================================================
interface InlineEditCellProps {
  value: string | undefined;
  placeholder: string;
  onSave: (newValue: string) => Promise<void>;
  icon?: React.ReactNode;
}

const InlineEditCell: React.FC<InlineEditCellProps> = ({ value, placeholder, onSave, icon }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === (value || '')) return;
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); }
  };

  if (editing) {
    return (
      <TextField
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        variant="standard"
        size="small"
        fullWidth
        inputProps={{ style: { fontSize: '0.72rem' } }}
      />
    );
  }

  return (
    <Tooltip title="Clic para editar" placement="top">
      <Box
        onClick={() => { setDraft(value || ''); setEditing(true); }}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          cursor: 'text', borderRadius: 0.5, px: 0.5, py: 0.25,
          minHeight: 24,
          '&:hover': { bgcolor: 'action.hover', outline: '1px dashed', outlineColor: 'primary.light' },
        }}
      >
        {icon}
        {saving ? (
          <Typography variant="caption" color="text.disabled">Guardando…</Typography>
        ) : value ? (
          <Typography sx={{ fontSize: '0.72rem' }}>{value}</Typography>
        ) : (
          <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>{placeholder}</Typography>
        )}
      </Box>
    </Tooltip>
  );
};

// ============================================================
// Fila de actividad con celdas P/E por mes
// ============================================================
interface ActividadRowProps {
  actividad: PlanTrabajoActividad;
  updatingCell: string | null;
  onToggle: (actividadId: number, mes: number, campo: 'programada' | 'ejecutada', valorActual: boolean) => void;
  onUpdateActividad: (id: number, data: { frecuencia?: string; responsable?: string }) => Promise<void>;
}

const ActividadRow: React.FC<ActividadRowProps> = ({ actividad, updatingCell, onToggle, onUpdateActividad }) => {
  // Crear mapa mes→seguimiento para acceso rápido
  const seguimientoMap = useMemo(() => {
    const map: Record<number, { programada: boolean; ejecutada: boolean }> = {};
    actividad.seguimientos_mensuales.forEach((s) => {
      map[s.mes] = { programada: s.programada, ejecutada: s.ejecutada };
    });
    return map;
  }, [actividad.seguimientos_mensuales]);

  return (
    <TableRow hover>
      <TableCell sx={{ fontSize: '0.7rem', color: 'text.secondary', verticalAlign: 'top', pt: 1 }}>
        {actividad.estandar}
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', verticalAlign: 'top', pt: 1 }}>
        {actividad.descripcion}
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top', pt: 0.5 }}>
        <InlineEditCell
          value={actividad.frecuencia}
          placeholder="— agregar frecuencia"
          icon={<ScheduleIcon sx={{ fontSize: 11, color: 'text.disabled', flexShrink: 0 }} />}
          onSave={(v) => onUpdateActividad(actividad.id, { frecuencia: v })}
        />
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top', pt: 0.5 }}>
        <InlineEditCell
          value={actividad.responsable}
          placeholder="— agregar responsable"
          onSave={(v) => onUpdateActividad(actividad.id, { responsable: v })}
        />
      </TableCell>

      {/* Celdas de meses (1-12) */}
      {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
        const seg = seguimientoMap[mes] || { programada: false, ejecutada: false };
        const keyP = `${actividad.id}-${mes}-programada`;
        const keyE = `${actividad.id}-${mes}-ejecutada`;
        const loadingP = updatingCell === keyP;
        const loadingE = updatingCell === keyE;

        return (
          <TableCell
            key={mes}
            align="center"
            sx={{
              px: 0.25,
              py: 0.5,
              bgcolor: seg.ejecutada ? 'success.50' : seg.programada ? 'primary.50' : 'transparent',
              transition: 'background-color 0.2s',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
              {/* P - Programada */}
              <Tooltip title={`${seg.programada ? 'Quitar de' : 'Marcar como'} Programada en ${MESES_CORTOS[mes - 1]}`}>
                <span>
                  {loadingP ? (
                    <CircularProgress size={14} />
                  ) : (
                    <IconButton
                      size="small"
                      onClick={() => onToggle(actividad.id, mes, 'programada', seg.programada)}
                      sx={{ p: 0.25 }}
                    >
                      {seg.programada ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      ) : (
                        <UncheckedIcon sx={{ fontSize: 16, color: 'grey.300' }} />
                      )}
                    </IconButton>
                  )}
                </span>
              </Tooltip>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'primary.main', lineHeight: 1 }}>P</Typography>

              {/* E - Ejecutada */}
              <Tooltip title={`${seg.ejecutada ? 'Quitar de' : 'Marcar como'} Ejecutada en ${MESES_CORTOS[mes - 1]}`}>
                <span>
                  {loadingE ? (
                    <CircularProgress size={14} />
                  ) : (
                    <IconButton
                      size="small"
                      onClick={() => onToggle(actividad.id, mes, 'ejecutada', seg.ejecutada)}
                      sx={{ p: 0.25 }}
                      disabled={!seg.programada}
                    >
                      {seg.ejecutada ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      ) : (
                        <UncheckedIcon sx={{ fontSize: 16, color: seg.programada ? 'grey.400' : 'grey.200' }} />
                      )}
                    </IconButton>
                  )}
                </span>
              </Tooltip>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'success.main', lineHeight: 1 }}>E</Typography>
            </Box>
          </TableCell>
        );
      })}
    </TableRow>
  );
};

export default PlanTrabajoAnualDetailPage;
