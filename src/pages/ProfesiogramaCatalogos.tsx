import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  TablePagination
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import profesiogramaService, { FactorRiesgo, TipoExamen, CriterioExclusion, Inmunizacion } from '../services/profesiogramaService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Union type for all catalog items
type CatalogItem = FactorRiesgo | TipoExamen | CriterioExclusion | Inmunizacion;

const ProfesiogramaCatalogos: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { enqueueSnackbar } = useSnackbar();

  // Data states
  const [factores, setFactores] = useState<FactorRiesgo[]>([]);
  const [examenes, setExamenes] = useState<TipoExamen[]>([]);
  const [criterios, setCriterios] = useState<CriterioExclusion[]>([]);
  const [inmunizaciones, setInmunizaciones] = useState<Inmunizacion[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [currentType, setCurrentType] = useState<'factor' | 'examen' | 'criterio' | 'inmunizacion'>('factor');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    type: 'factor' | 'examen' | 'criterio' | 'inmunizacion' | null;
    id: number | null;
  }>({ open: false, type: null, id: null });

  // Form states
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: 'fisico',
    activo: true,
    nivel_accion: '',
    unidad_medida: '',
    simbolo_unidad: '',
    instrumento_medida: ''
  });

  const [factorQ, setFactorQ] = useState('');
  const [factorCategoria, setFactorCategoria] = useState('');
  const [factorPage, setFactorPage] = useState(0);
  const [factorRowsPerPage, setFactorRowsPerPage] = useState(10);
  const [factorTotal, setFactorTotal] = useState(0);

  const [examenQ, setExamenQ] = useState('');
  const [examenPage, setExamenPage] = useState(0);
  const [examenRowsPerPage, setExamenRowsPerPage] = useState(10);
  const [examenTotal, setExamenTotal] = useState(0);

  const [criterioQ, setCriterioQ] = useState('');
  const [criterioPage, setCriterioPage] = useState(0);
  const [criterioRowsPerPage, setCriterioRowsPerPage] = useState(10);
  const [criterioTotal, setCriterioTotal] = useState(0);

  const [inmunQ, setInmunQ] = useState('');
  const [inmunPage, setInmunPage] = useState(0);
  const [inmunRowsPerPage, setInmunRowsPerPage] = useState(10);
  const [inmunTotal, setInmunTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [f, e, c, i] = await Promise.all([
        profesiogramaService.searchFactoresRiesgo({
          q: factorQ || undefined,
          categoria: factorCategoria || undefined,
          page: factorPage + 1,
          size: factorRowsPerPage,
        }),
        profesiogramaService.searchTiposExamen({
          q: examenQ || undefined,
          page: examenPage + 1,
          size: examenRowsPerPage,
        }),
        profesiogramaService.searchCriteriosExclusion({
          q: criterioQ || undefined,
          page: criterioPage + 1,
          size: criterioRowsPerPage,
        }),
        profesiogramaService.searchInmunizaciones({
          q: inmunQ || undefined,
          page: inmunPage + 1,
          size: inmunRowsPerPage,
        }),
      ]);

      setFactores(f.items);
      setFactorTotal(f.total);

      setExamenes(e.items);
      setExamenTotal(e.total);

      setCriterios(c.items);
      setCriterioTotal(c.total);

      setInmunizaciones(i.items);
      setInmunTotal(i.total);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error al cargar catálogos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [
    enqueueSnackbar,
    factorQ,
    factorCategoria,
    factorPage,
    factorRowsPerPage,
    examenQ,
    examenPage,
    examenRowsPerPage,
    criterioQ,
    criterioPage,
    criterioRowsPerPage,
    inmunQ,
    inmunPage,
    inmunRowsPerPage,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenModal = (type: 'factor' | 'examen' | 'criterio' | 'inmunizacion', item?: CatalogItem) => {
    setCurrentType(type);
    setEditingItem(item || null);
    
    if (item) {
      // Cast to specific types to access properties safely if needed, 
      // but using 'any' for temporary access is easier for mixed types
      const anyItem = item as any;
      setFormData({
        codigo: anyItem.codigo || '',
        nombre: anyItem.nombre || '',
        descripcion: anyItem.descripcion || '',
        categoria: anyItem.categoria || 'fisico',
        activo: anyItem.activo !== undefined ? anyItem.activo : true,
        nivel_accion: anyItem.nivel_accion || '',
        unidad_medida: anyItem.unidad_medida || '',
        simbolo_unidad: anyItem.simbolo_unidad || '',
        instrumento_medida: anyItem.instrumento_medida || ''
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria: 'fisico',
        activo: true,
        nivel_accion: '',
        unidad_medida: '',
        simbolo_unidad: '',
        instrumento_medida: ''
      });
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      if (currentType === 'factor') {
        const payload = {
            codigo: formData.codigo,
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            categoria: formData.categoria,
            activo: formData.activo,
            nivel_accion: formData.nivel_accion,
            unidad_medida: formData.unidad_medida,
            simbolo_unidad: formData.simbolo_unidad,
            instrumento_medida: formData.instrumento_medida
        };
        if (editingItem) {
          await profesiogramaService.updateFactorRiesgo(editingItem.id, payload);
        } else {
          await profesiogramaService.createFactorRiesgo(payload);
        }
      } else if (currentType === 'examen') {
        const payload = {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            activo: formData.activo
        };
        if (editingItem) {
          await profesiogramaService.updateTipoExamen(editingItem.id, payload);
        } else {
          await profesiogramaService.createTipoExamen(payload);
        }
      } else if (currentType === 'criterio') {
        const payload = {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            activo: formData.activo
        };
        if (editingItem) {
          await profesiogramaService.updateCriterioExclusion(editingItem.id, payload);
        } else {
          await profesiogramaService.createCriterioExclusion(payload);
        }
      } else if (currentType === 'inmunizacion') {
        const payload = {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            activo: formData.activo
        };
        if (editingItem) {
          await profesiogramaService.updateInmunizacion(editingItem.id, payload);
        } else {
          await profesiogramaService.createInmunizacion(payload);
        }
      }
      enqueueSnackbar('Guardado exitosamente', { variant: 'success' });
      setOpenModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error al guardar', { variant: 'error' });
    }
  };

  const handleDeleteClick = (type: 'factor' | 'examen' | 'criterio' | 'inmunizacion', id: number) => {
    setDeleteConfirmation({ open: true, type, id });
  };

  const handleConfirmDelete = async () => {
    const { type, id } = deleteConfirmation;
    if (!type || !id) return;

    try {
      if (type === 'factor') await profesiogramaService.deleteFactorRiesgo(id);
      if (type === 'examen') await profesiogramaService.deleteTipoExamen(id);
      if (type === 'criterio') await profesiogramaService.deleteCriterioExclusion(id);
      if (type === 'inmunizacion') await profesiogramaService.deleteInmunizacion(id);
      enqueueSnackbar('Eliminado exitosamente', { variant: 'success' });
      fetchData();
    } catch (error) {
      enqueueSnackbar('Error al eliminar', { variant: 'error' });
    } finally {
      setDeleteConfirmation({ open: false, type: null, id: null });
    }
  };

  const renderTable = (data: CatalogItem[], type: 'factor' | 'examen' | 'criterio' | 'inmunizacion') => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            {type === 'factor' && <TableCell>Código</TableCell>}
            <TableCell>Nombre</TableCell>
            {type === 'factor' && <TableCell>Categoría</TableCell>}
            <TableCell>Descripción</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => {
            // Safe access using casting for properties that might not exist on all types
            const anyRow = row as any;
            return (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                {type === 'factor' && <TableCell>{anyRow.codigo}</TableCell>}
                <TableCell>{row.nombre}</TableCell>
                {type === 'factor' && <TableCell>{anyRow.categoria}</TableCell>}
                <TableCell>{row.descripcion}</TableCell>
                <TableCell>{row.activo ? 'Activo' : 'Inactivo'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenModal(type, row)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(type, row.id)} color="secondary">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const getModalTitle = () => {
    const action = editingItem ? 'Editar' : 'Crear';
    switch (currentType) {
        case 'factor': return `${action} Factor de Riesgo`;
        case 'examen': return `${action} Tipo de Examen`;
        case 'criterio': return `${action} Criterio de Exclusión`;
        case 'inmunizacion': return `${action} Inmunización`;
        default: return action;
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Catálogos de Profesiograma
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="catalogos tabs"
        >
          <Tab label="Factores de Riesgo" />
          <Tab label="Tipos de Examen" />
          <Tab label="Criterios de Exclusión" />
          <Tab label="Inmunizaciones" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Buscar por nombre (o código)"
              fullWidth
              value={factorQ}
              onChange={(e) => {
                setFactorQ(e.target.value);
                setFactorPage(0);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={factorCategoria}
                label="Categoría"
                onChange={(e: SelectChangeEvent) => {
                  setFactorCategoria(e.target.value);
                  setFactorPage(0);
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="fisico">Físico</MenuItem>
                <MenuItem value="quimico">Químico</MenuItem>
                <MenuItem value="biologico">Biológico</MenuItem>
                <MenuItem value="ergonomico">Ergonómico</MenuItem>
                <MenuItem value="psicosocial">Psicosocial</MenuItem>
                <MenuItem value="seguridad">Seguridad</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal("factor")}
          sx={{ mb: 2 }}
        >
          Nuevo Factor
        </Button>
        {loading ? <CircularProgress /> : renderTable(factores, "factor")}
        <TablePagination
          component="div"
          count={factorTotal}
          page={factorPage}
          onPageChange={(_, newPage) => setFactorPage(newPage)}
          rowsPerPage={factorRowsPerPage}
          onRowsPerPageChange={(e) => {
            setFactorRowsPerPage(parseInt(e.target.value, 10));
            setFactorPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Buscar por nombre"
              fullWidth
              value={examenQ}
              onChange={(e) => {
                setExamenQ(e.target.value);
                setExamenPage(0);
              }}
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal("examen")}
          sx={{ mb: 2 }}
        >
          Nuevo Examen
        </Button>
        {loading ? <CircularProgress /> : renderTable(examenes, "examen")}
        <TablePagination
          component="div"
          count={examenTotal}
          page={examenPage}
          onPageChange={(_, newPage) => setExamenPage(newPage)}
          rowsPerPage={examenRowsPerPage}
          onRowsPerPageChange={(e) => {
            setExamenRowsPerPage(parseInt(e.target.value, 10));
            setExamenPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Buscar por nombre"
              fullWidth
              value={criterioQ}
              onChange={(e) => {
                setCriterioQ(e.target.value);
                setCriterioPage(0);
              }}
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal("criterio")}
          sx={{ mb: 2 }}
        >
          Nuevo Criterio
        </Button>
        {loading ? <CircularProgress /> : renderTable(criterios, "criterio")}
        <TablePagination
          component="div"
          count={criterioTotal}
          page={criterioPage}
          onPageChange={(_, newPage) => setCriterioPage(newPage)}
          rowsPerPage={criterioRowsPerPage}
          onRowsPerPageChange={(e) => {
            setCriterioRowsPerPage(parseInt(e.target.value, 10));
            setCriterioPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Buscar por nombre"
              fullWidth
              value={inmunQ}
              onChange={(e) => {
                setInmunQ(e.target.value);
                setInmunPage(0);
              }}
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal("inmunizacion")}
          sx={{ mb: 2 }}
        >
          Nueva Inmunización
        </Button>
        {loading ? (
          <CircularProgress />
        ) : (
          renderTable(inmunizaciones, "inmunizacion")
        )}
        <TablePagination
          component="div"
          count={inmunTotal}
          page={inmunPage}
          onPageChange={(_, newPage) => setInmunPage(newPage)}
          rowsPerPage={inmunRowsPerPage}
          onRowsPerPageChange={(e) => {
            setInmunRowsPerPage(parseInt(e.target.value, 10));
            setInmunPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TabPanel>

      {/* Edit/Create Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>{getModalTitle()}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {currentType === "factor" && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Código"
                  fullWidth
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField
                margin="dense"
                label="Nombre"
                fullWidth
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </Grid>

            {currentType === "factor" && (
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={formData.categoria}
                    label="Categoría"
                    onChange={(e: SelectChangeEvent) =>
                      setFormData({ ...formData, categoria: e.target.value })
                    }
                  >
                    <MenuItem value="fisico">Físico</MenuItem>
                    <MenuItem value="quimico">Químico</MenuItem>
                    <MenuItem value="biologico">Biológico</MenuItem>
                    <MenuItem value="ergonomico">Ergonómico</MenuItem>
                    <MenuItem value="psicosocial">Psicosocial</MenuItem>
                    <MenuItem value="seguridad">Seguridad</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {currentType === "factor" && (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    margin="dense"
                    label="Nivel de Acción"
                    fullWidth
                    value={formData.nivel_accion}
                    onChange={(e) =>
                      setFormData({ ...formData, nivel_accion: e.target.value })
                    }
                    helperText="Ej: >= 80 dB"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    margin="dense"
                    label="Unidad de Medida"
                    fullWidth
                    value={formData.unidad_medida}
                    onChange={(e) =>
                      setFormData({ ...formData, unidad_medida: e.target.value })
                    }
                    helperText="Ej: Decibelios, Lux, Grados Celsius"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    margin="dense"
                    label="Símbolo"
                    fullWidth
                    value={formData.simbolo_unidad}
                    onChange={(e) =>
                      setFormData({ ...formData, simbolo_unidad: e.target.value })
                    }
                    helperText="Ej: dB, lx, °C"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    margin="dense"
                    label="Instrumento de Medida"
                    fullWidth
                    value={formData.instrumento_medida}
                    onChange={(e) =>
                      setFormData({ ...formData, instrumento_medida: e.target.value })
                    }
                    helperText="Ej: Sonómetro, Luxómetro"
                  />
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField
                margin="dense"
                label="Descripción"
                fullWidth
                multiline
                rows={2}
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.checked })
                    }
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={() =>
          setDeleteConfirmation({ ...deleteConfirmation, open: false })
        }
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de eliminar este elemento? Esta acción no se puede
            deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteConfirmation({ ...deleteConfirmation, open: false })
            }
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            autoFocus
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfesiogramaCatalogos;