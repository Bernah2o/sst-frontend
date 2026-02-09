import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Divider,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  ArrowBack as BackIcon,
  Info as InfoIcon,
  Assignment as ActionIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import api from "../services/api";

interface ComplianceData {
  category: string;
  compliant_count: number;
  non_compliant_count: number;
  percentage: number;
}

interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  compliance_by_category: ComplianceData[];
  top_issues: ComplianceData[];
  action_stats: Record<string, number>;
}

const COLORS = ["#4caf50", "#ff9800", "#f44336", "#2196f3", "#9c27b0"];

const HomeworkAssessmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/assessments/homework/stats");
      setStats(response.data);
    } catch (error: any) {
      console.error("Error loading stats:", error);
      enqueueSnackbar("Error al cargar las estadísticas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getActionRecommendation = (category: string) => {
    const recommendations: Record<string, string> = {
      "Iluminación": "Asegurar luz natural o lámparas de escritorio adecuadas. Evitar reflejos.",
      "Ventilación": "Mantener flujo de aire constante o ventilación mecánica si es necesario.",
      "Mesa de Trabajo": "Asegurar altura adecuada y espacio para las piernas.",
      "Silla Ergonómica": "Proveer silla con soporte lumbar y ajuste de altura.",
      "Posición Pantalla": "Ajustar el borde superior a la altura de los ojos.",
      "Teclado y Ratón": "Uso de apoyamuñecas y espacio suficiente para los antebrazos.",
      "Espacio Disponible": "Reorganizar el mobiliario para evitar hacinamiento.",
      "Estado del Piso": "Retirar cables sueltos o alfombras que causen tropiezos.",
      "Ruido Ambiental": "Uso de auriculares con cancelación o aislamiento acústico.",
      "Conectividad": "Mejorar ancho de banda o ubicación del router.",
      "Seguridad Equipos": "Inspección de cables eléctricos y tomas de corriente.",
      "Confidencialidad": "Capacitación en manejo de información y bloqueo de pantalla.",
      "Pausas Activas": "Implementar alarmas o rutinas guiadas cada 2 horas.",
      "Riesgo Psicosocial": "Programar sesiones de seguimiento con bienestar o psicología."
    };
    return recommendations[category] || "Realizar inspección detallada y capacitación.";
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) return null;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<BackIcon />} onClick={() => navigate("/admin/homework-assessments")}>
            Volver
          </Button>
          <Typography variant="h4" color="primary">
            Análisis de Autoevaluaciones (Trabajo en Casa)
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={fetchStats} variant="outlined">
          Actualizar
        </Button>
      </Box>

      {/* Resumen General */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ bgcolor: "#f5f5f5" }}>
            <CardContent sx={{ py: 2 }}>
              <Typography color="textSecondary" variant="subtitle2">Total Asignadas</Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ bgcolor: "#e8f5e9" }}>
            <CardContent sx={{ py: 2 }}>
              <Typography color="textSecondary" variant="subtitle2">Completadas</Typography>
              <Typography variant="h4" color="success.main">{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderLeft: 6, borderLeftColor: "info.main" }}>
            <CardContent sx={{ py: 1 }}>
              <Typography color="textSecondary" variant="subtitle2" gutterBottom>Estado de Seguimiento de Hallazgos</Typography>
              <Box display="flex" justifyContent="space-around">
                <Box textAlign="center">
                  <Typography variant="h5" color="error.main">{stats.action_stats?.OPEN || 0}</Typography>
                  <Typography variant="caption">Abiertos</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5" color="warning.main">{stats.action_stats?.IN_PROGRESS || 0}</Typography>
                  <Typography variant="caption">En Gestión</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5" color="success.main">{stats.action_stats?.CLOSED || 0}</Typography>
                  <Typography variant="caption">Cerrados</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {stats.completed > 0 ? (
        <Grid container spacing={4}>
          {/* Gráfico de Cumplimiento */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper sx={{ p: 3, height: "500px" }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <AssessmentIcon color="primary" /> Cumplimiento por Categoría (%)
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={stats.compliance_by_category}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="category" width={100} style={{ fontSize: '12px' }} />
                  <RechartsTooltip formatter={(value: number) => [`${value}%`, 'Cumplimiento']} />
                  <Legend />
                  <Bar dataKey="percentage" name="Cumplimiento %" radius={[0, 4, 4, 0]}>
                    {stats.compliance_by_category.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.percentage > 85 ? "#4caf50" : entry.percentage > 60 ? "#ff9800" : "#f44336"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Áreas de Mayor Riesgo */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{ p: 3, height: "500px", overflow: "auto" }}>
              <Typography variant="h6" gutterBottom color="error" display="flex" alignItems="center" gap={1}>
                <WarningIcon /> Oportunidades de Mejora
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Las siguientes categorías presentan los niveles más bajos de cumplimiento:
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {stats.top_issues.map((issue, index) => (
                  <Card key={index} variant="outlined" sx={{ borderLeft: 6, borderLeftColor: "#f44336" }}>
                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight="bold">{issue.category}</Typography>
                        <Chip size="small" label={`${issue.percentage}%`} color="error" />
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        No conformes: {issue.non_compliant_count} trabajadores
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Plan de Acción Sugerido */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <ActionIcon color="info" /> Análisis y Acciones Recomendadas
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell><strong>Categoría Crítica</strong></TableCell>
                      <TableCell align="center"><strong>Cumplimiento</strong></TableCell>
                      <TableCell><strong>Acción de Mejora Sugerida</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.top_issues.map((issue, index) => (
                      <TableRow key={index}>
                        <TableCell>{issue.category}</TableCell>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                            <Box sx={{ width: 100 }}>
                              <Divider sx={{ borderBottomWidth: 4, borderColor: issue.percentage > 60 ? "warning.main" : "error.main", width: `${issue.percentage}%` }} />
                            </Box>
                            <Typography variant="body2">{issue.percentage}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{getActionRecommendation(issue.category)}</TableCell>
                        <TableCell>
                          <Chip label="Pendiente de Análisis" size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info" icon={<InfoIcon />}>
          Aún no hay evaluaciones completadas para generar gráficos de análisis. 
          Los datos aparecerán tan pronto los trabajadores completen sus autoevaluaciones con estatus "COMPLETED".
        </Alert>
      )}
    </Box>
  );
};

export default HomeworkAssessmentDashboard;
