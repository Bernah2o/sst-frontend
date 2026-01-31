/**
 * Catálogo de Normas de la Matriz Legal.
 * Permite visualizar y filtrar todas las normas importadas.
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
  Collapse,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import matrizLegalService, {
  MatrizLegalNorma,
  PaginatedResponse,
} from "../../services/matrizLegalService";

const MatrizLegalNormas: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Estados de datos
  const [normas, setNormas] = useState<MatrizLegalNorma[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [clasificacion, setClasificacion] = useState("");
  const [temaGeneral, setTemaGeneral] = useState("");
  const [anio, setAnio] = useState<number | "">("");
  const [estado, setEstado] = useState("");

  // Catálogos para filtros
  const [clasificaciones, setClasificaciones] = useState<string[]>([]);
  const [temas, setTemas] = useState<string[]>([]);
  const [anios, setAnios] = useState<number[]>([]);

  // Estados de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dialog de detalle
  const [selectedNorma, setSelectedNorma] = useState<MatrizLegalNorma | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  // Cargar catálogos
  useEffect(() => {
    loadCatalogos();
  }, []);

  // Cargar normas con filtros
  useEffect(() => {
    loadNormas();
  }, [page, rowsPerPage, clasificacion, temaGeneral, anio, estado]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        loadNormas();
      } else {
        setPage(0);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadCatalogos = async () => {
    try {
      const [clasificacionesData, temasData, aniosData] = await Promise.all([
        matrizLegalService.getCatalogosClasificaciones(),
        matrizLegalService.getCatalogosTemas(),
        matrizLegalService.getCatalogosAnios(),
      ]);
      setClasificaciones(clasificacionesData);
      setTemas(temasData);
      setAnios(aniosData);
    } catch (error) {
      console.error("Error loading catalogos:", error);
    }
  };

  const loadNormas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await matrizLegalService.listNormas({
        page: page + 1,
        size: rowsPerPage,
        q: searchTerm || undefined,
        clasificacion: clasificacion || undefined,
        tema_general: temaGeneral || undefined,
        anio: anio || undefined,
        estado: estado || undefined,
        activo: true,
      });
      setNormas(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error("Error loading normas:", error);
      enqueueSnackbar("Error al cargar normas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, clasificacion, temaGeneral, anio, estado, enqueueSnackbar]);

  const handleExport = async () => {
    try {
      const blob = await matrizLegalService.exportTodasNormas({
        clasificacion: clasificacion || undefined,
      });
      const filename = `catalogo_normas_${new Date().toISOString().split("T")[0]}.xlsx`;
      matrizLegalService.downloadBlob(blob, filename);
      enqueueSnackbar("Exportación completada", { variant: "success" });
    } catch (error) {
      console.error("Error exporting:", error);
      enqueueSnackbar("Error al exportar", { variant: "error" });
    }
  };

  const handleViewDetail = (norma: MatrizLegalNorma) => {
    setSelectedNorma(norma);
    setOpenDetail(true);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setClasificacion("");
    setTemaGeneral("");
    setAnio("");
    setEstado("");
    setPage(0);
  };

  const getEstadoColor = (estadoNorma: string): "success" | "error" | "warning" | "default" => {
    switch (estadoNorma) {
      case "vigente":
        return "success";
      case "derogada":
        return "error";
      case "modificada":
        return "warning";
      default:
        return "default";
    }
  };

  const hasActiveFilters = clasificacion || temaGeneral || anio || estado;

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
        Catálogo de Normas Legales
      </Typography>

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
                sx={{ width: { xs: "100%", sm: 300 } }}
              />
              <Button
                startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowFilters(!showFilters)}
                color={hasActiveFilters ? "primary" : "inherit"}
              >
                Filtros {hasActiveFilters && `(${[clasificacion, temaGeneral, anio, estado].filter(Boolean).length})`}
              </Button>
            </Box>
            <Box display="flex" gap={1}>
              <Button startIcon={<RefreshIcon />} onClick={loadNormas}>
                Recargar
              </Button>
              <Button startIcon={<DownloadIcon />} variant="outlined" onClick={handleExport}>
                Exportar Excel
              </Button>
            </Box>
          </Box>

          {/* Filtros expandibles */}
          <Collapse in={showFilters}>
            <Box mt={3}>
              <Grid container spacing={2}>
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
                    label="Tema General"
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
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField
                    select
                    label="Año"
                    fullWidth
                    size="small"
                    value={anio}
                    onChange={(e) => { setAnio(e.target.value as number | ""); setPage(0); }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {anios.map((a) => (
                      <MenuItem key={a} value={a}>{a}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField
                    select
                    label="Estado"
                    fullWidth
                    size="small"
                    value={estado}
                    onChange={(e) => { setEstado(e.target.value); setPage(0); }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="vigente">Vigente</MenuItem>
                    <MenuItem value="derogada">Derogada</MenuItem>
                    <MenuItem value="modificada">Modificada</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }} display="flex" alignItems="center">
                  {hasActiveFilters && (
                    <Button size="small" onClick={clearFilters}>
                      Limpiar Filtros
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Norma</TableCell>
                <TableCell>Año</TableCell>
                <TableCell>Clasificación</TableCell>
                <TableCell>Tema</TableCell>
                <TableCell>Artículo</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : normas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No se encontraron normas
                  </TableCell>
                </TableRow>
              ) : (
                normas.map((norma) => (
                  <TableRow key={norma.id} hover>
                    <TableCell>
                      <Tooltip title={norma.descripcion_norma || ""}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {norma.tipo_norma} {norma.numero_norma}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{norma.anio}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={norma.clasificacion_norma}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {norma.tema_general}
                      </Typography>
                    </TableCell>
                    <TableCell>{norma.articulo || "Todo"}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={norma.estado}
                        color={getEstadoColor(norma.estado)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver Detalle">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetail(norma)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
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

      {/* Dialog de Detalle */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedNorma?.tipo_norma} {selectedNorma?.numero_norma} de {selectedNorma?.anio}
        </DialogTitle>
        <DialogContent dividers>
          {selectedNorma && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">Ámbito de Aplicación</Typography>
                <Typography>{selectedNorma.ambito_aplicacion}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">Estado</Typography>
                <Chip size="small" label={selectedNorma.estado} color={getEstadoColor(selectedNorma.estado)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">Clasificación</Typography>
                <Typography>{selectedNorma.clasificacion_norma}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">Tema General</Typography>
                <Typography>{selectedNorma.tema_general}</Typography>
              </Grid>
              {selectedNorma.subtema_riesgo_especifico && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary">Subtema / Riesgo Específico</Typography>
                  <Typography>{selectedNorma.subtema_riesgo_especifico}</Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">Artículo</Typography>
                <Typography>{selectedNorma.articulo || "Todo"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">Expedida Por</Typography>
                <Typography>{selectedNorma.expedida_por || "-"}</Typography>
              </Grid>
              {selectedNorma.fecha_expedicion && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">Fecha de Expedición</Typography>
                  <Typography>{new Date(selectedNorma.fecha_expedicion).toLocaleDateString()}</Typography>
                </Grid>
              )}
              {selectedNorma.descripcion_norma && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary">Descripción de la Norma</Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{selectedNorma.descripcion_norma}</Typography>
                </Grid>
              )}
              {selectedNorma.descripcion_articulo_exigencias && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary">Exigencias / Descripción del Artículo</Typography>
                  <Paper sx={{ p: 2, bgcolor: "grey.50", maxHeight: 200, overflow: "auto" }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {selectedNorma.descripcion_articulo_exigencias}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              {selectedNorma.info_adicional && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary">Información Adicional</Typography>
                  <Typography variant="body2">{selectedNorma.info_adicional}</Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="textSecondary">Aplicabilidad</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                  {selectedNorma.aplica_general && <Chip size="small" label="General" color="primary" />}
                  {selectedNorma.aplica_teletrabajo && <Chip size="small" label="Teletrabajo" variant="outlined" />}
                  {selectedNorma.aplica_trabajo_alturas && <Chip size="small" label="Alturas" variant="outlined" />}
                  {selectedNorma.aplica_espacios_confinados && <Chip size="small" label="Esp. Confinados" variant="outlined" />}
                  {selectedNorma.aplica_sustancias_quimicas && <Chip size="small" label="Químicos" variant="outlined" />}
                  {selectedNorma.aplica_conductores && <Chip size="small" label="Conductores" variant="outlined" />}
                  {selectedNorma.aplica_riesgo_electrico && <Chip size="small" label="R. Eléctrico" variant="outlined" />}
                  {selectedNorma.aplica_riesgo_biologico && <Chip size="small" label="R. Biológico" variant="outlined" />}
                  {selectedNorma.aplica_trabajo_nocturno && <Chip size="small" label="Nocturno" variant="outlined" />}
                  {selectedNorma.aplica_menores_edad && <Chip size="small" label="Menores" variant="outlined" />}
                  {selectedNorma.aplica_mujeres_embarazadas && <Chip size="small" label="Embarazadas" variant="outlined" />}
                  {selectedNorma.aplica_trabajo_administrativo && <Chip size="small" label="Administrativo" variant="outlined" />}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MatrizLegalNormas;
