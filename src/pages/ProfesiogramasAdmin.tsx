import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Refresh,
  Download,
  CheckCircle,
  Cancel,
  Delete,
  PlayArrow,
  Pause,
  Search,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import profesiogramaService, {
  ProfesiogramaAdminItem,
  ProfesiogramaStats,
} from "../services/profesiogramaService";
import cargoService, { CargoOption } from "../services/cargoService";

const ProfesiogramasAdmin: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Data state
  const [profesiogramas, setProfesiogramas] = useState<ProfesiogramaAdminItem[]>([]);
  const [stats, setStats] = useState<ProfesiogramaStats | null>(null);
  const [cargos, setCargos] = useState<CargoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [filterCargoId, setFilterCargoId] = useState<number | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  // Selection
  const [selected, setSelected] = useState<number[]>([]);

  // Dialogs
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "activar" | "inactivar" | "eliminar" | null;
    ids: number[];
  }>({ open: false, action: null, ids: [] });
  const [processing, setProcessing] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [listResponse, statsResponse, cargosResponse] = await Promise.all([
        profesiogramaService.getAdminList({
          page: page + 1,
          size: rowsPerPage,
          estado: filterEstado || undefined,
          cargo_id: filterCargoId || undefined,
          search: searchTerm || undefined,
        }),
        profesiogramaService.getStats(),
        cargoService.getActiveCargosAsOptions(),
      ]);

      setProfesiogramas(listResponse.items);
      setTotal(listResponse.total);
      setStats(statsResponse);
      setCargos(cargosResponse);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al cargar datos", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filterEstado, filterCargoId, searchTerm, enqueueSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(profesiogramas.map((p) => p.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAction = async () => {
    if (!actionDialog.action || actionDialog.ids.length === 0) return;

    setProcessing(true);
    try {
      const result = await profesiogramaService.bulkAction(
        actionDialog.action,
        actionDialog.ids
      );

      if (result.success > 0) {
        enqueueSnackbar(
          `${result.success} profesiograma(s) ${actionDialog.action === "eliminar" ? "eliminado(s)" : actionDialog.action === "activar" ? "activado(s)" : "inactivado(s)"}`,
          { variant: "success" }
        );
      }
      if (result.failed > 0) {
        enqueueSnackbar(`${result.failed} fallaron`, { variant: "warning" });
      }

      setSelected([]);
      setActionDialog({ open: false, action: null, ids: [] });
      loadData();
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al ejecutar la acción", { variant: "error" });
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await profesiogramaService.exportAdminList({
        estado: filterEstado || undefined,
        cargo_id: filterCargoId || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profesiogramas_admin_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al exportar", { variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  const getEstadoChip = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Chip label="Activo" color="success" size="small" />;
      case "inactivo":
        return <Chip label="Inactivo" color="default" size="small" />;
      case "borrador":
        return <Chip label="Borrador" color="warning" size="small" />;
      default:
        return <Chip label={estado} size="small" />;
    }
  };

  const getRiesgoChip = (nivel: string | null) => {
    if (!nivel) return null;
    const colors: Record<string, "success" | "warning" | "error" | "info"> = {
      bajo: "success",
      medio: "warning",
      alto: "error",
      muy_alto: "error",
    };
    return (
      <Chip
        label={nivel.replace("_", " ").toUpperCase()}
        color={colors[nivel] || "default"}
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Administrar Profesiogramas
      </Typography>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Profesiogramas
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: "4px solid #4caf50" }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Activos
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.por_estado.activo}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: "4px solid #ff9800" }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Borradores
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.por_estado.borrador}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderLeft: "4px solid #f44336" }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cargos sin Profesiograma
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.cargos.sin_profesiograma_activo}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar por cargo"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              InputProps={{
                endAdornment: <Search color="action" />,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterEstado}
                onChange={(e) => {
                  setFilterEstado(e.target.value);
                  setPage(0);
                }}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
                <MenuItem value="borrador">Borrador</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Cargo</InputLabel>
              <Select
                value={filterCargoId}
                onChange={(e) => {
                  setFilterCargoId(e.target.value as number | "");
                  setPage(0);
                }}
                label="Cargo"
              >
                <MenuItem value="">Todos</MenuItem>
                {cargos.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadData}
                disabled={loading}
              >
                Actualizar
              </Button>
              <Button
                variant="outlined"
                startIcon={exporting ? <CircularProgress size={20} /> : <Download />}
                onClick={handleExport}
                disabled={exporting}
              >
                Exportar
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Bulk Actions */}
        {selected.length > 0 && (
          <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {selected.length} seleccionado(s)
            </Typography>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<PlayArrow />}
              onClick={() =>
                setActionDialog({ open: true, action: "activar", ids: selected })
              }
            >
              Activar
            </Button>
            <Button
              size="small"
              variant="contained"
              color="warning"
              startIcon={<Pause />}
              onClick={() =>
                setActionDialog({ open: true, action: "inactivar", ids: selected })
              }
            >
              Inactivar
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={() =>
                setActionDialog({ open: true, action: "eliminar", ids: selected })
              }
            >
              Eliminar
            </Button>
          </Box>
        )}
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selected.length > 0 && selected.length < profesiogramas.length
                  }
                  checked={
                    profesiogramas.length > 0 &&
                    selected.length === profesiogramas.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Versión</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Nivel Riesgo</TableCell>
              <TableCell align="center">Trabajadores</TableCell>
              <TableCell align="center">Factores</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : profesiogramas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    No se encontraron profesiogramas
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              profesiogramas.map((p) => (
                <TableRow
                  key={p.id}
                  hover
                  selected={selected.includes(p.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onChange={() => handleSelectOne(p.id)}
                    />
                  </TableCell>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {p.cargo_nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>{p.version}</TableCell>
                  <TableCell>{getEstadoChip(p.estado)}</TableCell>
                  <TableCell>{getRiesgoChip(p.nivel_riesgo_cargo)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={p.trabajadores_count}
                      size="small"
                      variant="outlined"
                      color={p.trabajadores_count > 0 ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell align="center">{p.factores_count}</TableCell>
                  <TableCell>
                    {p.fecha_creacion
                      ? new Date(p.fecha_creacion).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      {p.estado !== "activo" && (
                        <Tooltip title="Activar">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                action: "activar",
                                ids: [p.id],
                              })
                            }
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {p.estado === "activo" && (
                        <Tooltip title="Inactivar">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                action: "inactivar",
                                ids: [p.id],
                              })
                            }
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              action: "eliminar",
                              ids: [p.id],
                            })
                          }
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count}`
          }
        />
      </TableContainer>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={() =>
          !processing && setActionDialog({ open: false, action: null, ids: [] })
        }
      >
        <DialogTitle>
          {actionDialog.action === "eliminar"
            ? "Eliminar Profesiograma(s)"
            : actionDialog.action === "activar"
              ? "Activar Profesiograma(s)"
              : "Inactivar Profesiograma(s)"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionDialog.action === "eliminar" ? (
              <>
                ¿Estás seguro de eliminar {actionDialog.ids.length}{" "}
                profesiograma(s)? Esta acción no se puede deshacer.
              </>
            ) : actionDialog.action === "activar" ? (
              <>
                ¿Deseas activar {actionDialog.ids.length} profesiograma(s)?
                <Alert severity="info" sx={{ mt: 2 }}>
                  Al activar un profesiograma, los demás profesiogramas activos
                  del mismo cargo se inactivarán automáticamente.
                </Alert>
              </>
            ) : (
              <>
                ¿Deseas inactivar {actionDialog.ids.length} profesiograma(s)?
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Los trabajadores de los cargos afectados no verán estos
                  profesiogramas hasta que se vuelvan a activar.
                </Alert>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, action: null, ids: [] })
            }
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAction}
            color={actionDialog.action === "eliminar" ? "error" : "primary"}
            variant="contained"
            disabled={processing}
          >
            {processing ? (
              <CircularProgress size={24} />
            ) : actionDialog.action === "eliminar" ? (
              "Eliminar"
            ) : actionDialog.action === "activar" ? (
              "Activar"
            ) : (
              "Inactivar"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfesiogramasAdmin;
