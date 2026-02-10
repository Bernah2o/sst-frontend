/**
 * Gestión de Empresas para la Matriz Legal SST.
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
  Grid,
  MenuItem,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import matrizLegalService, {
  Empresa,
  EmpresaResumen,
  SectorEconomicoSimple,
} from "../../services/matrizLegalService";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import ConfirmDialog from "../../components/ConfirmDialog";

interface EmpresaFormData {
  nombre: string;
  nit: string;
  sector_economico_id: number | "";
  activo: boolean; // Add this line
  // Características
  tiene_trabajadores_independientes: boolean;
  tiene_teletrabajo: boolean;
  tiene_trabajo_alturas: boolean;
  tiene_trabajo_espacios_confinados: boolean;
  tiene_trabajo_caliente: boolean;
  tiene_sustancias_quimicas: boolean;
  tiene_radiaciones: boolean;
  tiene_trabajo_nocturno: boolean;
  tiene_menores_edad: boolean;
  tiene_mujeres_embarazadas: boolean;
  tiene_conductores: boolean;
  tiene_manipulacion_alimentos: boolean;
  tiene_maquinaria_pesada: boolean;
  tiene_riesgo_electrico: boolean;
  tiene_riesgo_biologico: boolean;
  tiene_trabajo_excavaciones: boolean;
  tiene_trabajo_administrativo: boolean;
}

const initialFormData: EmpresaFormData = {
  nombre: "",
  nit: "",
  sector_economico_id: "",
  activo: true, // Add this line
  tiene_trabajadores_independientes: false,
  tiene_teletrabajo: false,
  tiene_trabajo_alturas: false,
  tiene_trabajo_espacios_confinados: false,
  tiene_trabajo_caliente: false,
  tiene_sustancias_quimicas: false,
  tiene_radiaciones: false,
  tiene_trabajo_nocturno: false,
  tiene_menores_edad: false,
  tiene_mujeres_embarazadas: false,
  tiene_conductores: false,
  tiene_manipulacion_alimentos: false,
  tiene_maquinaria_pesada: false,
  tiene_riesgo_electrico: false,
  tiene_riesgo_biologico: false,
  tiene_trabajo_excavaciones: false,
  tiene_trabajo_administrativo: false,
};

const caracteristicasConfig = [
  { key: "tiene_trabajadores_independientes", label: "Trabajadores Independientes" },
  { key: "tiene_teletrabajo", label: "Teletrabajo" },
  { key: "tiene_trabajo_alturas", label: "Trabajo en Alturas" },
  { key: "tiene_trabajo_espacios_confinados", label: "Espacios Confinados" },
  { key: "tiene_trabajo_caliente", label: "Trabajo Caliente" },
  { key: "tiene_sustancias_quimicas", label: "Sustancias Químicas" },
  { key: "tiene_radiaciones", label: "Radiaciones" },
  { key: "tiene_trabajo_nocturno", label: "Trabajo Nocturno" },
  { key: "tiene_menores_edad", label: "Menores de Edad" },
  { key: "tiene_mujeres_embarazadas", label: "Mujeres Embarazadas" },
  { key: "tiene_conductores", label: "Conductores" },
  { key: "tiene_manipulacion_alimentos", label: "Manipulación de Alimentos" },
  { key: "tiene_maquinaria_pesada", label: "Maquinaria Pesada" },
  { key: "tiene_riesgo_electrico", label: "Riesgo Eléctrico" },
  { key: "tiene_riesgo_biologico", label: "Riesgo Biológico" },
  { key: "tiene_trabajo_excavaciones", label: "Trabajo en Excavaciones" },
  { key: "tiene_trabajo_administrativo", label: "Trabajo Administrativo" },
];

const EmpresaList: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Estados de datos
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([]);
  const [sectores, setSectores] = useState<SectorEconomicoSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { dialogState, showConfirmDialog } = useConfirmDialog();

  // Estados de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estados del diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EmpresaFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empresasData, sectoresData] = await Promise.all([
        matrizLegalService.listEmpresas(),
        matrizLegalService.listSectoresActivos(),
      ]);
      setEmpresas(empresasData);
      setSectores(sectoresData);
    } catch (error) {
      console.error("Error loading data:", error);
      enqueueSnackbar("Error al cargar datos", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const loadEmpresas = async () => {
     try {
      const data = await matrizLegalService.listEmpresas();
      setEmpresas(data);
    } catch (error) {
       console.error("Error reloading empresas:", error);
    }
  }

  const handleOpenDialog = async (empresaResumen?: EmpresaResumen) => {
    if (empresaResumen) {
      setEditingId(empresaResumen.id);
      setLoadingDetails(true);
      setOpenDialog(true);
      try {
        const empresa = await matrizLegalService.getEmpresa(empresaResumen.id);
        setFormData({
            nombre: empresa.nombre,
            nit: empresa.nit || "",
            sector_economico_id: empresa.sector_economico_id || "",
            activo: empresa.activo,
            tiene_trabajadores_independientes: empresa.tiene_trabajadores_independientes,
            tiene_teletrabajo: empresa.tiene_teletrabajo,
            tiene_trabajo_alturas: empresa.tiene_trabajo_alturas,
            tiene_trabajo_espacios_confinados: empresa.tiene_trabajo_espacios_confinados,
            tiene_trabajo_caliente: empresa.tiene_trabajo_caliente,
            tiene_sustancias_quimicas: empresa.tiene_sustancias_quimicas,
            tiene_radiaciones: empresa.tiene_radiaciones,
            tiene_trabajo_nocturno: empresa.tiene_trabajo_nocturno,
            tiene_menores_edad: empresa.tiene_menores_edad,
            tiene_mujeres_embarazadas: empresa.tiene_mujeres_embarazadas,
            tiene_conductores: empresa.tiene_conductores,
            tiene_manipulacion_alimentos: empresa.tiene_manipulacion_alimentos,
            tiene_maquinaria_pesada: empresa.tiene_maquinaria_pesada,
            tiene_riesgo_electrico: empresa.tiene_riesgo_electrico,
            tiene_riesgo_biologico: empresa.tiene_riesgo_biologico,
            tiene_trabajo_excavaciones: empresa.tiene_trabajo_excavaciones,
            tiene_trabajo_administrativo: empresa.tiene_trabajo_administrativo,
        });
      } catch (error) {
        console.error("Error loading details:", error);
        enqueueSnackbar("Error al cargar detalles de la empresa", { variant: "error" });
        handleCloseDialog();
      } finally {
        setLoadingDetails(false);
      }
    } else {
      setEditingId(null);
      setFormData(initialFormData);
      setOpenDialog(true);
      setLoadingDetails(false);
    }
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
      const dataToSend: Partial<Empresa> = {
          ...formData,
          sector_economico_id: formData.sector_economico_id === "" ? null : Number(formData.sector_economico_id)
      };

      if (editingId) {
        await matrizLegalService.updateEmpresa(editingId, dataToSend);
        enqueueSnackbar("Empresa actualizada correctamente", { variant: "success" });
      } else {
        await matrizLegalService.createEmpresa(dataToSend);
        enqueueSnackbar("Empresa creada correctamente", { variant: "success" });
      }
      handleCloseDialog();
      loadEmpresas();
    } catch (error) {
      console.error("Error saving empresa:", error);
      enqueueSnackbar("Error al guardar la empresa", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const empresa = empresas.find(e => e.id === id);
    const confirmed = await showConfirmDialog({
      title: 'Eliminar Empresa',
      message: `¿Está seguro de eliminar la empresa "${empresa?.nombre}"? Se eliminarán también sus evaluaciones y esta acción no se puede deshacer.`,
      severity: 'error',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      await matrizLegalService.deleteEmpresa(id);
      enqueueSnackbar("Empresa eliminada correctamente", { variant: "success" });
      loadEmpresas();
    } catch (error) {
      console.error("Error deleting empresa:", error);
      enqueueSnackbar("Error al eliminar la empresa", { variant: "error" });
    }
  };

  const handleCheckChange = (key: keyof EmpresaFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [key]: event.target.checked });
  };


  // Filtrado
  const filteredEmpresas = empresas.filter((empresa) =>
    empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (empresa.nit && empresa.nit.includes(searchTerm))
  );

  // Paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedEmpresas = filteredEmpresas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Gestión de Empresas (Matriz Legal)
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <TextField
              placeholder="Buscar por nombre o NIT..."
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
             <Box>
                <Button 
                    startIcon={<RefreshIcon />} 
                    onClick={() => loadEmpresas()}
                    sx={{ mr: 1 }}
                >
                    Recargar
                </Button>
                <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                >
                Nueva Empresa
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
                <TableCell>NIT</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Sector Económico</TableCell>
                <TableCell align="center">Cumplimiento</TableCell>
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
              ) : paginatedEmpresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No hay empresas registradas
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmpresas.map((empresa) => (
                  <TableRow key={empresa.id} hover>
                    <TableCell>{empresa.nit || "-"}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{empresa.nombre}</TableCell>
                    <TableCell>
                         <Chip 
                            size="small" 
                            label={empresa.sector_economico_nombre || "Sin Asignar"} 
                            variant="outlined"
                        />
                    </TableCell>
                    <TableCell align="center">
                         <Tooltip title={`Cumple: ${empresa.normas_cumple} | No Cumple: ${empresa.normas_no_cumple} | Pendientes: ${empresa.normas_pendientes}`}>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <CircularProgress 
                                    variant="determinate" 
                                    value={empresa.total_normas_aplicables > 0 ? empresa.porcentaje_cumplimiento : 0} 
                                    color={
                                        empresa.porcentaje_cumplimiento >= 80 ? "success" :
                                        empresa.porcentaje_cumplimiento >= 50 ? "warning" : "error"
                                    }
                                    size={40}
                                />
                                <Box
                                    sx={{
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Typography variant="caption" component="div" color="text.secondary">
                                    {Math.round(empresa.porcentaje_cumplimiento)}%
                                    </Typography>
                                </Box>
                            </Box>
                        </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                         <Box
                            sx={{
                            py: 0.5,
                            px: 1,
                            borderRadius: 1,
                            bgcolor: empresa.activo ? "success.light" : "error.light",
                            color: empresa.activo ? "success.dark" : "error.dark",
                            display: "inline-block",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            }}
                        >
                            {empresa.activo ? "ACTIVO" : "INACTIVO"}
                        </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(empresa)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(empresa.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
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
          count={filteredEmpresas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Dialogo de Creación/Edición */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? "Editar Empresa" : "Nueva Empresa"}
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetails ? (
              <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
              </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={3} pt={1}>
                {/* Información General */}
                <Typography variant="h6" color="primary">Información General</Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                        label="Nombre de la Empresa"
                        fullWidth
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                        label="NIT"
                        fullWidth
                        value={formData.nit}
                        onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            label="Sector Económico"
                            fullWidth
                            value={formData.sector_economico_id}
                            onChange={(e) => setFormData({ ...formData, sector_economico_id: e.target.value as number | "" })}
                        >
                            <MenuItem value="">
                                <em>Seleccione un sector</em>
                            </MenuItem>
                            {sectores.map((sector) => (
                                <MenuItem key={sector.id} value={sector.id}>
                                    {sector.nombre}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                     <Grid size={{ xs: 12, md: 6 }}>
                         <FormControlLabel
                            control={
                                <Switch
                                checked={formData.activo}
                                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                color="primary"
                                />
                            }
                            label="Empresa Activa"
                            />
                    </Grid>
                </Grid>

                {/* Características de Riesgo */}
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6" color="primary">Características y Riesgos</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2" color="textSecondary" paragraph>
                            Seleccione las características que aplican a la empresa. Esto determinará automáticamente qué normas legales debe cumplir.
                        </Typography>
                        <Grid container spacing={1}>
                            {caracteristicasConfig.map((item) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.key}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={!!formData[item.key as keyof EmpresaFormData]}
                                                onChange={handleCheckChange(item.key as keyof EmpresaFormData)}
                                                color="secondary"
                                                size="small"
                                            />
                                        }
                                        label={<Typography variant="body2">{item.label}</Typography>}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || loadingDetails}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog {...dialogState} />
    </Box>
  );
};

export default EmpresaList;
