/**
 * Gestión de Sectores Económicos para la Matriz Legal SST.
 */

import React, { useState, useEffect } from "react";
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
  Switch,
  FormControlLabel,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import matrizLegalService, { SectorEconomico } from "../../services/matrizLegalService";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import ConfirmDialog from "../../components/ConfirmDialog";

interface SectorFormData {
  nombre: string;
  codigo: string;
  descripcion: string;
  es_todos_los_sectores: boolean;
  activo: boolean;
}

const initialFormData: SectorFormData = {
  nombre: "",
  codigo: "",
  descripcion: "",
  es_todos_los_sectores: false,
  activo: true,
};

const SectorEconomicoList: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // Estados de datos
  const [activos, setActivos] = useState<SectorEconomico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"todos" | "activo" | "inactivo">("todos");
  const { dialogState, showConfirmDialog } = useConfirmDialog();
  
  // Estados de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estados del diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SectorFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSectores();
  }, []);

  const loadSectores = async () => {
    try {
      setLoading(true);
      const data = await matrizLegalService.listSectoresEconomicos();
      setActivos(data);
    } catch (error) {
      console.error("Error loading sectors:", error);
      enqueueSnackbar("Error al cargar sectores económicos", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (sector?: SectorEconomico) => {
    if (sector) {
      setEditingId(sector.id);
      setFormData({
        nombre: sector.nombre,
        codigo: sector.codigo || "",
        descripcion: sector.descripcion || "",
        es_todos_los_sectores: sector.es_todos_los_sectores,
        activo: sector.activo,
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      enqueueSnackbar("El nombre es requerido", { variant: "warning" });
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await matrizLegalService.updateSectorEconomico(editingId, formData);
        enqueueSnackbar("Sector actualizado correctamente", { variant: "success" });
      } else {
        await matrizLegalService.createSectorEconomico(formData);
        enqueueSnackbar("Sector creado correctamente", { variant: "success" });
      }
      handleCloseDialog();
      loadSectores();
    } catch (error) {
      console.error("Error saving sector:", error);
      enqueueSnackbar("Error al guardar el sector", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const sector = activos.find(s => s.id === id);
    const confirmed = await showConfirmDialog({
      title: 'Eliminar Sector Económico',
      message: `¿Está seguro de eliminar el sector "${sector?.nombre}"? Esta acción no se puede deshacer.`,
      severity: 'error',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      await matrizLegalService.deleteSectorEconomico(id);
      enqueueSnackbar("Sector eliminado correctamente", { variant: "success" });
      loadSectores();
    } catch (error) {
      console.error("Error deleting sector:", error);
      enqueueSnackbar("Error al eliminar the sector", { variant: "error" });
    }
  };

  // Filtrado
  const filteredSectores = activos.filter((sector) => {
    // Filtro por texto (nombre, código, descripción)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" ||
      sector.nombre.toLowerCase().includes(searchLower) ||
      (sector.codigo && sector.codigo.toLowerCase().includes(searchLower)) ||
      (sector.descripcion && sector.descripcion.toLowerCase().includes(searchLower));

    // Filtro por estado
    const matchesEstado = estadoFiltro === "todos" ||
      (estadoFiltro === "activo" && sector.activo) ||
      (estadoFiltro === "inactivo" && !sector.activo);

    return matchesSearch && matchesEstado;
  });

  // Paginación logic
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedSectores = filteredSectores.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Gestión de Sectores Económicos
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <TextField
                placeholder="Buscar por nombre, código o descripción..."
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
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoFiltro}
                  label="Estado"
                  onChange={(e) => {
                    setEstadoFiltro(e.target.value as "todos" | "activo" | "inactivo");
                    setPage(0);
                  }}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="activo">Activos</MenuItem>
                  <MenuItem value="inactivo">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Button
                startIcon={<RefreshIcon />}
                onClick={() => loadSectores()}
                sx={{ mr: 1 }}
              >
                Recargar
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Nuevo Sector
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="center">Especial</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedSectores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No hay sectores registrados
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSectores.map((sector) => (
                  <TableRow key={sector.id} hover>
                    <TableCell>{sector.codigo || "-"}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{sector.nombre}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {sector.descripcion || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {sector.es_todos_los_sectores && (
                        <Tooltip title="Aplica a todas las empresas">
                            <span style={{ fontSize: '1.2rem' }}>🌐</span>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          py: 0.5,
                          px: 1,
                          borderRadius: 1,
                          bgcolor: sector.activo ? "success.light" : "error.light",
                          color: sector.activo ? "success.dark" : "error.dark",
                          display: "inline-block",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                        }}
                      >
                        {sector.activo ? "ACTIVO" : "INACTIVO"}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(sector)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {!sector.es_todos_los_sectores && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(sector.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSectores.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Dialogo de Creación/Edición */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? "Editar Sector Económico" : "Nuevo Sector Económico"}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Nombre del Sector"
              fullWidth
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <TextField
              label="Código CIUU (Opcional)"
              fullWidth
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  color="primary"
                />
              }
              label="Activo"
            />
            
            {/* Solo administradores deberían poder cambiar esto, o mejor deshabilitarlo si ya está creado */}
            {/* 
            <FormControlLabel
              control={
                <Switch
                  checked={formData.es_todos_los_sectores}
                  onChange={(e) => setFormData({ ...formData, es_todos_los_sectores: e.target.checked })}
                  color="warning"
                />
              }
              label="Es 'Todos los Sectores' (Uso especial)"
            /> 
            */}
          </Box>
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
      <ConfirmDialog {...dialogState} />
    </Box>
  );
};

export default SectorEconomicoList;
