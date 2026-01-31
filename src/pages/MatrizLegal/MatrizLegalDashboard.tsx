/**
 * Dashboard de Matriz Legal SST.
 * Página principal que muestra:
 * - Selector de empresa
 * - Estadísticas de cumplimiento
 * - Accesos rápidos a importación y gestión
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import matrizLegalService, {
  EmpresaResumen,
  MatrizLegalEstadisticas,
} from "../../services/matrizLegalService";

const MatrizLegalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<number | null>(null);
  const [estadisticas, setEstadisticas] = useState<MatrizLegalEstadisticas | null>(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const loadEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await matrizLegalService.listEmpresas({ activo: true });
      setEmpresas(data);

      // Seleccionar la primera empresa si hay alguna
      if (data.length > 0) {
        setEmpresaSeleccionada(data[0].id);
      }
    } catch (error) {
      console.error("Error cargando empresas:", error);
      enqueueSnackbar("Error al cargar las empresas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Cargar empresas al montar
  useEffect(() => {
    loadEmpresas();
  }, [loadEmpresas]);

  const loadEstadisticas = useCallback(async (empresaId: number) => {
    try {
      setLoadingEstadisticas(true);
      const data = await matrizLegalService.getEstadisticasEmpresa(empresaId);
      setEstadisticas(data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      enqueueSnackbar("Error al cargar las estadísticas", { variant: "error" });
    } finally {
      setLoadingEstadisticas(false);
    }
  }, [enqueueSnackbar]);

  // Cargar estadísticas cuando cambia la empresa seleccionada
  useEffect(() => {
    if (empresaSeleccionada) {
      loadEstadisticas(empresaSeleccionada);
    } else {
      setEstadisticas(null);
    }
  }, [empresaSeleccionada, loadEstadisticas]);

  const handleSincronizar = async () => {
    if (!empresaSeleccionada) return;

    try {
      setSincronizando(true);
      const result = await matrizLegalService.sincronizarNormasEmpresa(empresaSeleccionada);
      enqueueSnackbar(result.message, { variant: "success" });
      loadEstadisticas(empresaSeleccionada);
    } catch (error) {
      console.error("Error sincronizando:", error);
      enqueueSnackbar("Error al sincronizar normas", { variant: "error" });
    } finally {
      setSincronizando(false);
    }
  };

  const handleExportar = async () => {
    if (!empresaSeleccionada) return;

    try {
      const blob = await matrizLegalService.exportMatrizEmpresa(empresaSeleccionada);
      const empresa = empresas.find(e => e.id === empresaSeleccionada);
      const filename = `matriz_legal_${empresa?.nombre.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      matrizLegalService.downloadBlob(blob, filename);
      enqueueSnackbar("Exportación completada", { variant: "success" });
    } catch (error) {
      console.error("Error exportando:", error);
      enqueueSnackbar("Error al exportar", { variant: "error" });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Matriz Legal de Seguridad y Salud en el Trabajo
      </Typography>

      {empresas.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No hay empresas configuradas.
          <Button
            color="inherit"
            size="small"
            onClick={() => navigate("/admin/empresas")}
            sx={{ ml: 2 }}
          >
            Crear Empresa
          </Button>
        </Alert>
      ) : (
        <>
          {/* Selector de Empresa */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Seleccionar Empresa</InputLabel>
                  <Select
                    value={empresaSeleccionada || ""}
                    onChange={(e) => setEmpresaSeleccionada(Number(e.target.value))}
                    label="Seleccionar Empresa"
                  >
                    {empresas.map((empresa) => (
                      <MenuItem key={empresa.id} value={empresa.id}>
                        {empresa.nombre} {empresa.nit && `(${empresa.nit})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleSincronizar}
                    disabled={!empresaSeleccionada || sincronizando}
                  >
                    {sincronizando ? "Sincronizando..." : "Sincronizar Normas"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportar}
                    disabled={!empresaSeleccionada}
                  >
                    Exportar Excel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => navigate("/admin/matriz-legal/importar")}
                  >
                    Importar Excel ARL
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Estadísticas */}
          {loadingEstadisticas ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : estadisticas ? (
            <>
              {/* Cards de Estadísticas */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Total Normas Aplicables
                          </Typography>
                          <Typography variant="h4">
                            {estadisticas.total_normas_aplicables}
                          </Typography>
                        </Box>
                        <GavelIcon sx={{ fontSize: 48, color: "primary.main", opacity: 0.5 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Card sx={{ bgcolor: "#e8f5e9" }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Cumple
                          </Typography>
                          <Typography variant="h4" color="success.main">
                            {estadisticas.por_estado.cumple}
                          </Typography>
                        </Box>
                        <CheckIcon sx={{ fontSize: 48, color: "success.main", opacity: 0.5 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Card sx={{ bgcolor: "#ffebee" }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            No Cumple
                          </Typography>
                          <Typography variant="h4" color="error.main">
                            {estadisticas.por_estado.no_cumple}
                          </Typography>
                        </Box>
                        <CancelIcon sx={{ fontSize: 48, color: "error.main", opacity: 0.5 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Card sx={{ bgcolor: "#fff3e0" }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            Pendiente
                          </Typography>
                          <Typography variant="h4" color="warning.main">
                            {estadisticas.por_estado.pendiente}
                          </Typography>
                        </Box>
                        <PendingIcon sx={{ fontSize: 48, color: "warning.main", opacity: 0.5 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Barra de Progreso de Cumplimiento */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Porcentaje de Cumplimiento
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box flexGrow={1}>
                    <LinearProgress
                      variant="determinate"
                      value={estadisticas.porcentaje_cumplimiento}
                      sx={{
                        height: 20,
                        borderRadius: 10,
                        bgcolor: "#e0e0e0",
                        "& .MuiLinearProgress-bar": {
                          bgcolor:
                            estadisticas.porcentaje_cumplimiento >= 80
                              ? "success.main"
                              : estadisticas.porcentaje_cumplimiento >= 50
                              ? "warning.main"
                              : "error.main",
                        },
                      }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ minWidth: 60 }}>
                    {estadisticas.porcentaje_cumplimiento.toFixed(1)}%
                  </Typography>
                </Box>
                <Box mt={2} display="flex" gap={2}>
                  <Chip
                    label={`${estadisticas.normas_con_plan_accion} con plan de acción`}
                    color="info"
                    variant="outlined"
                  />
                  {estadisticas.normas_vencidas > 0 && (
                    <Chip
                      label={`${estadisticas.normas_vencidas} vencidas`}
                      color="error"
                      variant="filled"
                    />
                  )}
                </Box>
              </Paper>

              {/* Accesos Rápidos */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => navigate(`/admin/matriz-legal/empresas/${empresaSeleccionada}`)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <AssessmentIcon sx={{ fontSize: 40, color: "primary.main" }} />
                        <Box>
                          <Typography variant="h6">Gestionar Cumplimiento</Typography>
                          <Typography color="textSecondary">
                            Evaluar y documentar el cumplimiento de normas
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => navigate("/admin/matriz-legal/normas")}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <GavelIcon sx={{ fontSize: 40, color: "secondary.main" }} />
                        <Box>
                          <Typography variant="h6">Catálogo de Normas</Typography>
                          <Typography color="textSecondary">
                            Ver todas las normas importadas
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => navigate("/admin/matriz-legal/empresas")}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <BusinessIcon sx={{ fontSize: 40, color: "success.main" }} />
                        <Box>
                          <Typography variant="h6">Gestionar Empresas</Typography>
                          <Typography color="textSecondary">
                            Configurar empresas y características
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          ) : (
            <Alert severity="info">
              Seleccione una empresa para ver las estadísticas de cumplimiento.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default MatrizLegalDashboard;
