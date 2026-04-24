import React, { useCallback, useEffect, useState } from "react";
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
  Warning as WarningIcon,
  ArrowBack as BackIcon,
  Info as InfoIcon,
  Assignment as ActionIcon,
  PictureAsPdf as PdfIcon,
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

const ErgonomicSelfInspectionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await api.get("/assessments/ergonomic/stats/pdf", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `informe_autoinspeccion_ergonomica_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      enqueueSnackbar("Error al generar el informe PDF", { variant: "error" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/assessments/ergonomic/stats");
      setStats(response.data);
    } catch (error: any) {
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
      "Mi silla":
        "Ajustar altura y soporte lumbar. Verificar estado de la silla. Gestionar reposapiés o reposabrazos si aplica.",
      "Mi escritorio / mesa":
        "Ajustar altura para codos a 90°. Garantizar espacio para piernas y evitar bordes que presionen antebrazos.",
      "Mi monitor / pantalla":
        "Ubicar borde superior a nivel de ojos. Mantener distancia 50–70 cm. Evitar reflejos. Para laptop: soporte + teclado/mouse externos.",
      "Mi teclado y mouse":
        "Mantener teclado y mouse cerca y al mismo nivel. Usar reposamuñecas. Mantener muñecas neutras.",
      "Mi postura e iluminación":
        "Mejorar iluminación sin reflejos. Evitar cruzar piernas. Realizar pausas activas. Reportar y gestionar molestias persistentes.",
    };
    return (
      recommendations[category] ||
      "Realizar inspección detallada y capacitación."
    );
  };

  const getStatusChip = (percentage: number) => {
    if (percentage >= 85)
      return <Chip label="Aprobado" color="success" size="small" />;
    if (percentage >= 60)
      return <Chip label="Atención" color="warning" size="small" />;
    return <Chip label="Crítico" color="error" size="small" />;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) return null;

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate("/admin/ergonomic-self-inspections")}
          >
            Volver
          </Button>
          <Typography variant="h4" color="primary">
            Análisis de Autoinspección (Puesto Ergonómico)
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            startIcon={
              downloadingPdf ? <CircularProgress size={16} /> : <PdfIcon />
            }
            onClick={handleDownloadPdf}
            variant="contained"
            color="error"
            disabled={downloadingPdf}
          >
            Informe PDF Gerencial
          </Button>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchStats}
            variant="outlined"
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ bgcolor: "#f5f5f5" }}>
            <CardContent sx={{ py: 2 }}>
              <Typography color="textSecondary" variant="subtitle2">
                Total Asignadas
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ bgcolor: "#e8f5e9" }}>
            <CardContent sx={{ py: 2 }}>
              <Typography color="textSecondary" variant="subtitle2">
                Completadas
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderLeft: 6, borderLeftColor: "info.main" }}>
            <CardContent sx={{ py: 1 }}>
              <Typography
                color="textSecondary"
                variant="subtitle2"
                gutterBottom
              >
                Estado de Seguimiento de Hallazgos
              </Typography>
              <Box display="flex" justifyContent="space-around">
                <Box textAlign="center">
                  <Typography variant="h5" color="error.main">
                    {stats.action_stats?.OPEN || 0}
                  </Typography>
                  <Typography variant="caption">Abiertos</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5" color="warning.main">
                    {stats.action_stats?.IN_PROGRESS || 0}
                  </Typography>
                  <Typography variant="caption">En Gestión</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5" color="success.main">
                    {stats.action_stats?.CLOSED || 0}
                  </Typography>
                  <Typography variant="caption">Cerrados</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {stats.completed > 0 ? (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper sx={{ p: 3, height: "500px" }}>
              <Typography variant="h6" gutterBottom>
                Cumplimiento por Categoría
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                  data={stats.compliance_by_category}
                  margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="category"
                    angle={-30}
                    textAnchor="end"
                    height={70}
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="percentage" name="% Cumplimiento">
                    {stats.compliance_by_category.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.percentage >= 85
                            ? "#4caf50"
                            : entry.percentage >= 60
                              ? "#ff9800"
                              : "#f44336"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{ p: 3, height: "500px", overflow: "auto" }}>
              <Typography variant="h6" gutterBottom>
                Oportunidades de Mejora
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {stats.top_issues.length > 0 ? (
                stats.top_issues.map((issue) => (
                  <Box
                    key={issue.category}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#f9f9f9",
                      borderLeft: 5,
                      borderLeftColor:
                        issue.percentage >= 85
                          ? "success.main"
                          : issue.percentage >= 60
                            ? "warning.main"
                            : "error.main",
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography fontWeight="bold">
                        {issue.category}
                      </Typography>
                      {getStatusChip(issue.percentage)}
                    </Box>
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      Cumplimiento: {issue.percentage}%
                    </Typography>
                    <Typography variant="body2">
                      <ActionIcon
                        fontSize="small"
                        sx={{ verticalAlign: "middle", mr: 1 }}
                      />
                      {getActionRecommendation(issue.category)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Alert severity="success">Sin hallazgos críticos.</Alert>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detalle de Cumplimiento
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoría</TableCell>
                      <TableCell align="center">Conformes</TableCell>
                      <TableCell align="center">No Conformes</TableCell>
                      <TableCell align="center">%</TableCell>
                      <TableCell align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.compliance_by_category.map((row) => (
                      <TableRow key={row.category}>
                        <TableCell>{row.category}</TableCell>
                        <TableCell align="center">
                          {row.compliant_count}
                        </TableCell>
                        <TableCell align="center">
                          {row.non_compliant_count}
                        </TableCell>
                        <TableCell align="center">{row.percentage}%</TableCell>
                        <TableCell align="center">
                          {getStatusChip(row.percentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Interpretación
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Alert icon={<InfoIcon />} severity="info">
                El análisis agrupa los 18 ítems en 5 categorías. Las categorías
                con menor cumplimiento se priorizan como oportunidades de
                mejora.
              </Alert>
              <Box display="flex" gap={2} mt={2} flexWrap="wrap">
                <Chip
                  icon={<AssessmentIcon />}
                  label="≥85%: Aprobado"
                  color="success"
                />
                <Chip
                  icon={<WarningIcon />}
                  label="60–84%: Atención"
                  color="warning"
                />
                <Chip
                  icon={<WarningIcon />}
                  label="<60%: Crítico"
                  color="error"
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="warning">
          No hay autoinspecciones completadas para generar análisis.
        </Alert>
      )}
    </Box>
  );
};

export default ErgonomicSelfInspectionDashboard;
