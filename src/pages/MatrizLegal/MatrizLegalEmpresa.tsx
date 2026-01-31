/**
 * Gestión de Cumplimiento de Matriz Legal por Empresa.
 * Permite evaluar y gestionar el cumplimiento de normas legales.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Grid,
  MenuItem,
  Chip,
  Checkbox,
  FormControlLabel,
  Collapse,
  Alert,
  LinearProgress,
  Divider,
  Autocomplete,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  HourglassEmpty as ProcessIcon,
  Block as BlockIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import matrizLegalService, {
  MatrizLegalNormaConCumplimiento,
  MatrizLegalEstadisticas,
  EmpresaResumen,
  EstadoCumplimiento,
} from "../../services/matrizLegalService";

interface CumplimientoFormData {
  estado: EstadoCumplimiento;
  evidencia_cumplimiento: string;
  observaciones: string;
  plan_accion: string;
  responsable: string;
  fecha_compromiso: string | null;
  aplica_empresa: boolean;
  justificacion_no_aplica: string;
}

const initialFormData: CumplimientoFormData = {
  estado: "pendiente",
  evidencia_cumplimiento: "",
  observaciones: "",
  plan_accion: "",
  responsable: "",
  fecha_compromiso: null,
  aplica_empresa: true,
  justificacion_no_aplica: "",
};

// Sugerencias predefinidas para evidencias de cumplimiento
const sugerenciasEvidencia = [
  "Procedimiento documentado y socializado",
  "Registro de capacitaciones realizadas",
  "Actas de reunión del COPASST",
  "Informe de inspecciones de seguridad",
  "Matriz de EPP actualizada",
  "Certificados de aptitud médica vigentes",
  "Programa de vigilancia epidemiológica",
  "Plan de emergencias documentado",
  "Registro de entrega de EPP",
  "Matriz de identificación de peligros y valoración de riesgos",
  "Política de SST firmada y divulgada",
  "Reglamento de higiene y seguridad industrial",
  "Investigación de accidentes e incidentes",
  "Indicadores de gestión SST",
  "Auditorías internas realizadas",
];

// Sugerencias predefinidas para observaciones
const sugerenciasObservaciones = [
  "Pendiente actualización del documento",
  "Requiere capacitación adicional al personal",
  "En proceso de implementación",
  "Se evidencia cumplimiento parcial",
  "Documento vencido, requiere renovación",
  "Falta socialización con trabajadores",
  "Requiere asignación de recursos",
  "Pendiente aprobación de gerencia",
  "En revisión por parte del COPASST",
  "Se recomienda seguimiento mensual",
  "Cumplimiento verificado en auditoría",
  "Sin hallazgos en la última inspección",
];

// Sugerencias predefinidas para plan de acción
const sugerenciasPlanAccion = [
  "Elaborar procedimiento documentado",
  "Programar capacitación para el personal",
  "Actualizar matriz de peligros y riesgos",
  "Realizar inspección de seguridad",
  "Gestionar compra de EPP requeridos",
  "Programar exámenes médicos ocupacionales",
  "Actualizar plan de emergencias",
  "Socializar política de SST",
  "Conformar/renovar COPASST",
  "Realizar simulacro de emergencias",
  "Implementar programa de vigilancia epidemiológica",
  "Contratar asesoría externa especializada",
  "Asignar presupuesto para implementación",
  "Revisar y actualizar indicadores de gestión",
];

// Sugerencias predefinidas para responsables
const sugerenciasResponsables = [
  "Responsable del SG-SST",
  "Coordinador de SST",
  "Jefe de Talento Humano",
  "Gerente General",
  "Jefe de Operaciones",
  "Médico Ocupacional",
  "COPASST",
  "Vigía de SST",
  "Jefe de Mantenimiento",
  "Coordinador de Calidad",
  "ARL",
  "Asesor Externo SST",
  "Brigada de Emergencias",
  "Jefe de Producción",
  "Jefe de Almacén",
  "Supervisor de Área",
];

const MatrizLegalEmpresa: React.FC = () => {
  const navigate = useNavigate();
  const { empresaId } = useParams<{ empresaId: string }>();
  const { enqueueSnackbar } = useSnackbar();

  // Estados de datos
  const [normas, setNormas] = useState<MatrizLegalNormaConCumplimiento[]>([]);
  const [estadisticas, setEstadisticas] = useState<MatrizLegalEstadisticas | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [estadoCumplimiento, setEstadoCumplimiento] = useState("");
  const [clasificacion, setClasificacion] = useState("");
  const [temaGeneral, setTemaGeneral] = useState("");
  const [soloAplicables, setSoloAplicables] = useState(true);

  // Catálogos
  const [clasificaciones, setClasificaciones] = useState<string[]>([]);
  const [temas, setTemas] = useState<string[]>([]);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Selección múltiple
  const [selected, setSelected] = useState<number[]>([]);

  // Dialog de edición
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNorma, setEditingNorma] = useState<MatrizLegalNormaConCumplimiento | null>(null);
  const [formData, setFormData] = useState<CumplimientoFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const numEmpresaId = Number(empresaId);

  const loadInitialData = useCallback(async () => {
    try {
      const [empresasData, clasificacionesData, temasData] = await Promise.all([
        matrizLegalService.listEmpresas(),
        matrizLegalService.getCatalogosClasificaciones(),
        matrizLegalService.getCatalogosTemas(),
      ]);

      const empresaData = empresasData.find(e => e.id === numEmpresaId);
      setEmpresa(empresaData || null);
      setClasificaciones(clasificacionesData);
      setTemas(temasData);

      // Cargar estadísticas
      const stats = await matrizLegalService.getEstadisticasEmpresa(numEmpresaId);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error loading initial data:", error);
      enqueueSnackbar("Error al cargar datos", { variant: "error" });
    }
  }, [numEmpresaId, enqueueSnackbar]);

  const loadNormas = useCallback(async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      const data = await matrizLegalService.getNormasEmpresa(numEmpresaId, {
        page: page + 1,
        size: rowsPerPage,
        q: searchTerm || undefined,
        estado_cumplimiento: estadoCumplimiento || undefined,
        clasificacion: clasificacion || undefined,
        tema_general: temaGeneral || undefined,
        solo_aplicables: soloAplicables,
      });
      setNormas(data.items);
      setTotal(data.total);
      setSelected([]);
    } catch (error) {
      console.error("Error loading normas:", error);
      enqueueSnackbar("Error al cargar normas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [empresaId, numEmpresaId, page, rowsPerPage, searchTerm, estadoCumplimiento, clasificacion, temaGeneral, soloAplicables, enqueueSnackbar]);

  // Cargar datos iniciales
  useEffect(() => {
    if (empresaId) {
      loadInitialData();
    }
  }, [empresaId, loadInitialData]);

  // Cargar normas con filtros
  useEffect(() => {
    if (empresaId) {
      loadNormas();
    }
  }, [empresaId, loadNormas]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (empresaId && searchTerm !== undefined) {
        if (page === 0) {
          loadNormas();
        } else {
          setPage(0);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      const result = await matrizLegalService.sincronizarNormasEmpresa(numEmpresaId);
      enqueueSnackbar(result.message, { variant: "success" });
      loadNormas();
      const stats = await matrizLegalService.getEstadisticasEmpresa(numEmpresaId);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error sincronizando:", error);
      enqueueSnackbar("Error al sincronizar normas", { variant: "error" });
    } finally {
      setSincronizando(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await matrizLegalService.exportMatrizEmpresa(numEmpresaId);
      const filename = `matriz_legal_${empresa?.nombre.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      matrizLegalService.downloadBlob(blob, filename);
      enqueueSnackbar("Exportación completada", { variant: "success" });
    } catch (error) {
      console.error("Error exporting:", error);
      enqueueSnackbar("Error al exportar", { variant: "error" });
    }
  };

  const handleOpenDialog = (norma: MatrizLegalNormaConCumplimiento) => {
    setEditingNorma(norma);
    setFormData({
      estado: norma.estado_cumplimiento || "pendiente",
      evidencia_cumplimiento: norma.evidencia_cumplimiento || "",
      observaciones: norma.observaciones || "",
      plan_accion: norma.plan_accion || "",
      responsable: norma.responsable || "",
      fecha_compromiso: norma.fecha_compromiso || null,
      aplica_empresa: norma.aplica_empresa,
      justificacion_no_aplica: "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNorma(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    if (!editingNorma) return;

    try {
      setSaving(true);
      await matrizLegalService.updateCumplimiento(numEmpresaId, editingNorma.id, {
        estado: formData.estado,
        evidencia_cumplimiento: formData.evidencia_cumplimiento || null,
        observaciones: formData.observaciones || null,
        plan_accion: formData.plan_accion || null,
        responsable: formData.responsable || null,
        fecha_compromiso: formData.fecha_compromiso || null,
        aplica_empresa: formData.aplica_empresa,
        justificacion_no_aplica: formData.justificacion_no_aplica || null,
      });
      enqueueSnackbar("Cumplimiento actualizado", { variant: "success" });
      handleCloseDialog();
      loadNormas();
      // Actualizar estadísticas
      const stats = await matrizLegalService.getEstadisticasEmpresa(numEmpresaId);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error saving:", error);
      enqueueSnackbar("Error al guardar", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async (nuevoEstado: EstadoCumplimiento) => {
    if (selected.length === 0) return;

    try {
      await matrizLegalService.bulkUpdateCumplimiento(numEmpresaId, selected, nuevoEstado);
      enqueueSnackbar(`${selected.length} normas actualizadas`, { variant: "success" });
      setSelected([]);
      loadNormas();
      const stats = await matrizLegalService.getEstadisticasEmpresa(numEmpresaId);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error bulk update:", error);
      enqueueSnackbar("Error al actualizar", { variant: "error" });
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = normas
        .filter(n => n.cumplimiento_id)
        .map(n => n.cumplimiento_id!);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (cumplimientoId: number | null) => {
    if (!cumplimientoId) return;

    const selectedIndex = selected.indexOf(cumplimientoId);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, cumplimientoId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (cumplimientoId: number | null) => cumplimientoId ? selected.indexOf(cumplimientoId) !== -1 : false;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getEstadoIcon = (estado: EstadoCumplimiento | null) => {
    switch (estado) {
      case "cumple":
        return <CheckIcon fontSize="small" sx={{ color: "success.main" }} />;
      case "no_cumple":
        return <CancelIcon fontSize="small" sx={{ color: "error.main" }} />;
      case "pendiente":
        return <PendingIcon fontSize="small" sx={{ color: "warning.main" }} />;
      case "en_proceso":
        return <ProcessIcon fontSize="small" sx={{ color: "info.main" }} />;
      case "no_aplica":
        return <BlockIcon fontSize="small" sx={{ color: "grey.500" }} />;
      default:
        return <PendingIcon fontSize="small" sx={{ color: "warning.main" }} />;
    }
  };

  const getEstadoColor = (estado: EstadoCumplimiento | null): string => {
    return matrizLegalService.getColorEstadoCumplimiento(estado);
  };

  const hasActiveFilters = estadoCumplimiento || clasificacion || temaGeneral;

  if (!empresaId) {
    return (
      <Box p={3}>
        <Alert severity="error">ID de empresa no especificado</Alert>
      </Box>
    );
  }

  return (
      <Box p={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/admin/matriz-legal")}
          sx={{ mb: 2 }}
        >
          Volver al Dashboard
        </Button>

        <Typography variant="h4" gutterBottom>
          Cumplimiento de Matriz Legal
        </Typography>

        {empresa && (
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {empresa.nombre}
          </Typography>
        )}

        {/* Estadísticas */}
        {estadisticas && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Porcentaje de Cumplimiento
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box flexGrow={1}>
                      <LinearProgress
                        variant="determinate"
                        value={estadisticas.porcentaje_cumplimiento}
                        sx={{
                          height: 12,
                          borderRadius: 6,
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
                    <Typography variant="h6" sx={{ minWidth: 60 }}>
                      {estadisticas.porcentaje_cumplimiento.toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <Typography variant="subtitle2" color="textSecondary">Cumple</Typography>
                  <Typography variant="h5" color="success.main">{estadisticas.por_estado.cumple}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <Typography variant="subtitle2" color="textSecondary">No Cumple</Typography>
                  <Typography variant="h5" color="error.main">{estadisticas.por_estado.no_cumple}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <Typography variant="subtitle2" color="textSecondary">Pendiente</Typography>
                  <Typography variant="h5" color="warning.main">{estadisticas.por_estado.pendiente}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <Typography variant="subtitle2" color="textSecondary">En Proceso</Typography>
                  <Typography variant="h5" color="info.main">{estadisticas.por_estado.en_proceso}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Barra de herramientas */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <TextField
                  placeholder="Buscar norma..."
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: "100%", sm: 250 } }}
                />
                <Button
                  startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  color={hasActiveFilters ? "primary" : "inherit"}
                >
                  Filtros
                </Button>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  startIcon={<SyncIcon />}
                  onClick={handleSincronizar}
                  disabled={sincronizando}
                >
                  {sincronizando ? "Sincronizando..." : "Sincronizar"}
                </Button>
                <Button startIcon={<RefreshIcon />} onClick={loadNormas}>
                  Recargar
                </Button>
                <Button startIcon={<DownloadIcon />} variant="outlined" onClick={handleExport}>
                  Exportar
                </Button>
              </Box>
            </Box>

            {/* Acciones bulk */}
            {selected.length > 0 && (
              <Box mt={2} p={2} bgcolor="primary.light" borderRadius={1}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {selected.length} norma(s) seleccionada(s)
                </Typography>
                <Box display="flex" gap={1}>
                  <Button size="small" variant="contained" color="success" onClick={() => handleBulkUpdate("cumple")}>
                    Marcar Cumple
                  </Button>
                  <Button size="small" variant="contained" color="error" onClick={() => handleBulkUpdate("no_cumple")}>
                    Marcar No Cumple
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => setSelected([])}>
                    Cancelar
                  </Button>
                </Box>
              </Box>
            )}

            {/* Filtros */}
            <Collapse in={showFilters}>
              <Box mt={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      label="Estado Cumplimiento"
                      fullWidth
                      size="small"
                      value={estadoCumplimiento}
                      onChange={(e) => { setEstadoCumplimiento(e.target.value); setPage(0); }}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="cumple">Cumple</MenuItem>
                      <MenuItem value="no_cumple">No Cumple</MenuItem>
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="en_proceso">En Proceso</MenuItem>
                      <MenuItem value="no_aplica">No Aplica</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      label="Clasificación"
                      fullWidth
                      size="small"
                      value={clasificacion}
                      onChange={(e) => { setClasificacion(e.target.value); setPage(0); }}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {clasificaciones.map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      label="Tema"
                      fullWidth
                      size="small"
                      value={temaGeneral}
                      onChange={(e) => { setTemaGeneral(e.target.value); setPage(0); }}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {temas.map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={soloAplicables}
                          onChange={(e) => { setSoloAplicables(e.target.checked); setPage(0); }}
                        />
                      }
                      label="Solo aplicables"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* Tabla de normas */}
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < normas.filter(n => n.cumplimiento_id).length}
                      checked={normas.length > 0 && selected.length === normas.filter(n => n.cumplimiento_id).length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Norma</TableCell>
                  <TableCell>Clasificación</TableCell>
                  <TableCell>Tema</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell>Responsable</TableCell>
                  <TableCell>F. Compromiso</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : normas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      No se encontraron normas
                    </TableCell>
                  </TableRow>
                ) : (
                  normas.map((norma) => {
                    const isItemSelected = isSelected(norma.cumplimiento_id);
                    return (
                      <TableRow
                        key={norma.id}
                        hover
                        selected={isItemSelected}
                        sx={{
                          bgcolor: !norma.aplica_empresa ? "grey.100" : "inherit",
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isItemSelected}
                            onChange={() => handleSelect(norma.cumplimiento_id)}
                            disabled={!norma.cumplimiento_id}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={norma.descripcion_norma || ""}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {norma.tipo_norma} {norma.numero_norma}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {norma.articulo || "Todo"} - {norma.anio}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={norma.clasificacion_norma} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {norma.tema_general}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={matrizLegalService.getLabelEstadoCumplimiento(norma.estado_cumplimiento)}>
                            <Chip
                              size="small"
                              icon={getEstadoIcon(norma.estado_cumplimiento)}
                              label={matrizLegalService.getLabelEstadoCumplimiento(norma.estado_cumplimiento)}
                              sx={{
                                bgcolor: getEstadoColor(norma.estado_cumplimiento),
                                color: "white",
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{norma.responsable || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          {norma.fecha_compromiso
                            ? new Date(norma.fecha_compromiso).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Evaluar Cumplimiento">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(norma)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
          />
        </Paper>

        {/* Dialog de edición de cumplimiento */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Evaluar Cumplimiento
            {editingNorma && (
              <Typography variant="subtitle2" color="textSecondary">
                {editingNorma.tipo_norma} {editingNorma.numero_norma} - {editingNorma.articulo || "Todo"}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent dividers>
            {editingNorma && (
              <Box display="flex" flexDirection="column" gap={3}>
                {/* Info de la norma */}
                <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Typography variant="subtitle2" color="textSecondary">Descripción</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {editingNorma.descripcion_norma || "Sin descripción"}
                  </Typography>
                  {editingNorma.descripcion_articulo_exigencias && (
                    <>
                      <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>Exigencias</Typography>
                      <Typography variant="body2">
                        {editingNorma.descripcion_articulo_exigencias}
                      </Typography>
                    </>
                  )}
                </Paper>

                <Divider />

                {/* Formulario */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      label="Estado de Cumplimiento"
                      fullWidth
                      required
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoCumplimiento })}
                    >
                      <MenuItem value="cumple">Cumple</MenuItem>
                      <MenuItem value="no_cumple">No Cumple</MenuItem>
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="en_proceso">En Proceso</MenuItem>
                      <MenuItem value="no_aplica">No Aplica</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.aplica_empresa}
                          onChange={(e) => setFormData({ ...formData, aplica_empresa: e.target.checked })}
                        />
                      }
                      label="Esta norma aplica a la empresa"
                    />
                  </Grid>

                  {!formData.aplica_empresa && (
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Justificación (por qué no aplica)"
                        fullWidth
                        multiline
                        rows={2}
                        value={formData.justificacion_no_aplica}
                        onChange={(e) => setFormData({ ...formData, justificacion_no_aplica: e.target.value })}
                      />
                    </Grid>
                  )}

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Evidencia de Cumplimiento"
                      fullWidth
                      multiline
                      rows={3}
                      value={formData.evidencia_cumplimiento}
                      onChange={(e) => setFormData({ ...formData, evidencia_cumplimiento: e.target.value })}
                      helperText="Describa las evidencias que demuestran el cumplimiento"
                    />
                    <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ width: "100%", mb: 0.5 }}>
                        Sugerencias (clic para agregar):
                      </Typography>
                      {sugerenciasEvidencia.map((sugerencia, idx) => (
                        <Chip
                          key={idx}
                          label={sugerencia}
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            const currentText = formData.evidencia_cumplimiento;
                            const separator = currentText && !currentText.endsWith("\n") && !currentText.endsWith(" ") ? ". " : "";
                            setFormData({
                              ...formData,
                              evidencia_cumplimiento: currentText + separator + sugerencia,
                            });
                          }}
                          sx={{ cursor: "pointer", "&:hover": { bgcolor: "primary.light", color: "white" } }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Observaciones"
                      fullWidth
                      multiline
                      rows={2}
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    />
                    <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ width: "100%", mb: 0.5 }}>
                        Sugerencias (clic para agregar):
                      </Typography>
                      {sugerenciasObservaciones.map((sugerencia, idx) => (
                        <Chip
                          key={idx}
                          label={sugerencia}
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            const currentText = formData.observaciones;
                            const separator = currentText && !currentText.endsWith("\n") && !currentText.endsWith(" ") ? ". " : "";
                            setFormData({
                              ...formData,
                              observaciones: currentText + separator + sugerencia,
                            });
                          }}
                          sx={{ cursor: "pointer", "&:hover": { bgcolor: "secondary.light", color: "white" } }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  {(formData.estado === "no_cumple" || formData.estado === "en_proceso") && (
                    <>
                      <Grid size={{ xs: 12 }}>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Complete el plan de acción para las normas que no cumplen
                        </Alert>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Plan de Acción"
                          fullWidth
                          multiline
                          rows={3}
                          value={formData.plan_accion}
                          onChange={(e) => setFormData({ ...formData, plan_accion: e.target.value })}
                          helperText="Describa las acciones a implementar para lograr el cumplimiento"
                        />
                        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          <Typography variant="caption" color="textSecondary" sx={{ width: "100%", mb: 0.5 }}>
                            Sugerencias (clic para agregar):
                          </Typography>
                          {sugerenciasPlanAccion.map((sugerencia, idx) => (
                            <Chip
                              key={idx}
                              label={sugerencia}
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                const currentText = formData.plan_accion;
                                const separator = currentText && !currentText.endsWith("\n") && !currentText.endsWith(" ") ? ". " : "";
                                setFormData({
                                  ...formData,
                                  plan_accion: currentText + separator + sugerencia,
                                });
                              }}
                              sx={{ cursor: "pointer", "&:hover": { bgcolor: "warning.light", color: "white" } }}
                            />
                          ))}
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Autocomplete
                          freeSolo
                          options={sugerenciasResponsables}
                          value={formData.responsable}
                          onChange={(_event, newValue) => {
                            setFormData({ ...formData, responsable: newValue || "" });
                          }}
                          onInputChange={(_event, newInputValue) => {
                            setFormData({ ...formData, responsable: newInputValue });
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Responsable"
                              fullWidth
                              placeholder="Seleccione o escriba el responsable"
                              helperText="Puede seleccionar de la lista o escribir un nombre"
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          label="Fecha Compromiso"
                          type="date"
                          fullWidth
                          value={formData.fecha_compromiso || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fecha_compromiso: e.target.value || null,
                            })
                          }
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default MatrizLegalEmpresa;
