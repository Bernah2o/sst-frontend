import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { adminConfigService } from "../services/adminConfigService";
import UppercaseTextField from '../components/UppercaseTextField';

// Constantes para periodicidad EMO
const PERIODICIDAD_EMO_OPTIONS = [
  { value: "anual", label: "Anual" },
  { value: "semestral", label: "Semestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "bianual", label: "Bianual" },
  { value: "mensual", label: "Mensual" },
  { value: "quincenal", label: "Quincenal" },
  { value: "semanal", label: "Semanal" },
];

// Interfaces para Seguridad Social (nueva estructura)
interface SeguridadSocialBase {
  tipo: string; // "eps" | "afp" | "arl"
  nombre: string;
  is_active: boolean;
}

interface SeguridadSocial extends SeguridadSocialBase {
  id: number;
  created_at: string;
  updated_at: string;
}

interface SeguridadSocialCreate extends SeguridadSocialBase {}

interface SeguridadSocialUpdate {
  nombre?: string;
  is_active?: boolean;
}

// Interfaces que coinciden exactamente con los esquemas de Pydantic del backend (para cargos)
interface AdminConfigBase {
  category: string; // "position"
  display_name: string;
  emo_periodicity?: string | null;
  is_active: boolean;
}

interface AdminConfig extends AdminConfigBase {
  id: number;
  created_at: string;
  updated_at: string;
}

interface AdminConfigCreate extends AdminConfigBase {}

interface AdminConfigUpdate {
  display_name?: string;
  emo_periodicity?: string | null;
  is_active?: boolean;
}

// Tipo para periodicidad EMO
type PeriodicidadEMO =
  | "anual"
  | "semestral"
  | "trimestral"
  | "bianual"
  | "mensual"
  | "quincenal"
  | "semanal";

// Interfaces específicas para Cargos
interface CargoBase {
  nombre_cargo: string;
  periodicidad_emo?: PeriodicidadEMO | null;
  activo: boolean;
}

interface Cargo extends CargoBase {
  id: number;
  created_at: string;
  updated_at: string;
}

interface CargoCreate extends CargoBase {}

interface CargoUpdate {
  nombre_cargo?: string;
  periodicidad_emo?: PeriodicidadEMO | null;
  activo?: boolean;
}

interface ProgramasBase {
  nombre_programa: string;
  activo: boolean;
}

interface Programa extends ProgramasBase {
  id: number;
  created_at: string;
  updated_at: string;
}

interface ProgramasCreate extends ProgramasBase {}

interface ProgramasUpdate {
  nombre_programa?: string;
  activo?: boolean;
}

const AdminConfigPage: React.FC = () => {
  const { user } = useAuth();
  // const [configs, setConfigs] = useState<AdminConfig[]>([]);
  const [seguridadSocial, setSeguridadSocial] = useState<SeguridadSocial[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSeguridadSocialDialog, setOpenSeguridadSocialDialog] =
    useState(false);
  const [openProgramDialog, setOpenProgramDialog] = useState(false);

  const [openCargoDialog, setOpenCargoDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDeleteSeguridadSocialDialog, setOpenDeleteSeguridadSocialDialog] =
    useState(false);
  const [openDeleteProgramDialog, setOpenDeleteProgramDialog] = useState(false);

  const [openDeleteCargoDialog, setOpenDeleteCargoDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AdminConfig | null>(null);
  const [editingSeguridadSocial, setEditingSeguridadSocial] =
    useState<SeguridadSocial | null>(null);
  const [editingProgram, setEditingProgram] = useState<Programa | null>(null);

  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<AdminConfig | null>(
    null
  );
  const [deletingSeguridadSocial, setDeletingSeguridadSocial] =
    useState<SeguridadSocial | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<Programa | null>(null);

  const [deletingCargo, setDeletingCargo] = useState<Cargo | null>(null);
  const [formData, setFormData] = useState<AdminConfigCreate>({
    category: "",
    display_name: "",
    emo_periodicity: null,
    is_active: true,
  });
  const [seguridadSocialFormData, setSeguridadSocialFormData] =
    useState<SeguridadSocialCreate>({
      tipo: "",
      nombre: "",
      is_active: true,
    });
  const [programFormData, setProgramFormData] = useState<ProgramasCreate>({
    nombre_programa: "",
    activo: true,
  });
  const [cargoFormData, setCargoFormData] = useState<CargoCreate>({
    nombre_cargo: "",
    periodicidad_emo: null,
    activo: true,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [seguridadSocialResponse, programasResponse, cargosResponse] =
        await Promise.all([
          api.get("/admin/config/seguridad-social/"),
          api.get("/admin/config/programas"),
          api.get("/admin/config/cargos"),
        ]);

      // Filtrar solo configuraciones que no sean de seguridad social
      // const filteredConfigs = Array.isArray(configsResponse.data) ?
      //   configsResponse.data.filter((config: AdminConfig) =>
      //     !['eps', 'afp', 'arl'].includes(config.category.toLowerCase())
      //   ) : [];
      // setConfigs(filteredConfigs);

      // Verificar la estructura de la respuesta de seguridad social
      let seguridadSocialData = [];
      if (seguridadSocialResponse.data) {
        if (Array.isArray(seguridadSocialResponse.data)) {
          seguridadSocialData = seguridadSocialResponse.data;
        } else if (
          seguridadSocialResponse.data.items &&
          Array.isArray(seguridadSocialResponse.data.items)
        ) {
          seguridadSocialData = seguridadSocialResponse.data.items;
        }
      }

      // Asegurar que todos los datos sean arrays
      const programasData = Array.isArray(programasResponse.data)
        ? programasResponse.data
        : [];
      const cargosData = Array.isArray(cargosResponse.data)
        ? cargosResponse.data
        : [];

      setSeguridadSocial(seguridadSocialData);
      setProgramas(programasData);
      setCargos(cargosData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSeguridadSocial([]);
    } finally {
      setLoading(false);
    }
  };

  // const fetchConfigs = async () => {
  //   try {
  //     const response = await api.get('/admin/config/');
  //     const filteredConfigs = response.data.filter((config: AdminConfig) =>
  //       !['eps', 'afp', 'arl'].includes(config.category.toLowerCase())
  //     );
  //     // setConfigs(filteredConfigs);
  //   } catch (error) {
  //     console.error('Error fetching configs:', error);
  //   }
  // };

  const fetchSeguridadSocial = async () => {
    try {
      const response = await api.get("/admin/config/seguridad-social/");
      // La API devuelve un objeto con estructura { items: [], total: number, ... }
      let data = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          data = response.data.items;
        }
      }
      setSeguridadSocial(data);
    } catch (error) {
      console.error("Error fetching seguridad social:", error);
      // En caso de error, mantener un array vacío
      setSeguridadSocial([]);
    }
  };

  const fetchProgramas = async () => {
    try {
      const programas = await adminConfigService.fetchAllProgramas();
      setProgramas(programas);
    } catch (error) {
      console.error("Error fetching programas:", error);
      setProgramas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCargos = async () => {
    try {
      const response = await api.get("/admin/config/cargos");
      setCargos(response.data);
    } catch (error) {
      console.error("Error fetching cargos:", error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      // Preparar datos para envío
      const dataToSend = {
        category: formData.category,
        display_name: formData.display_name,
        is_active: formData.is_active,
      };

      if (editingConfig) {
        // Para actualización, solo enviar campos que han cambiado
        const updateData: AdminConfigUpdate = {};
        if (dataToSend.display_name !== editingConfig.display_name) {
          updateData.display_name = dataToSend.display_name;
        }
        if (dataToSend.is_active !== editingConfig.is_active) {
          updateData.is_active = dataToSend.is_active;
        }
        await api.put(`/admin/config/${editingConfig.id}`, updateData);
      } else {
        await api.post("/admin/config/", dataToSend);
      }
      // fetchConfigs();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving config:", error);
    }
  };

  const handleSaveSeguridadSocial = async () => {
    try {
      const dataToSend = {
        tipo: seguridadSocialFormData.tipo,
        nombre: seguridadSocialFormData.nombre,
        is_active: seguridadSocialFormData.is_active,
      };

      if (editingSeguridadSocial) {
        const updateData: SeguridadSocialUpdate = {};
        if (dataToSend.nombre !== editingSeguridadSocial.nombre) {
          updateData.nombre = dataToSend.nombre;
        }
        if (dataToSend.is_active !== editingSeguridadSocial.is_active) {
          updateData.is_active = dataToSend.is_active;
        }
        await api.put(
          `/admin/config/seguridad-social/${editingSeguridadSocial.id}`,
          updateData
        );
      } else {
        await api.post("/admin/config/seguridad-social/", dataToSend);
      }
      fetchSeguridadSocial();
      handleCloseSeguridadSocialDialog();
    } catch (error) {
      console.error("Error saving seguridad social:", error);
    }
  };

  const handleSaveProgram = async () => {
    try {
      if (editingProgram) {
        // Para actualización, solo enviar campos que han cambiado
        const updateData: ProgramasUpdate = {};
        if (
          programFormData.nombre_programa !== editingProgram.nombre_programa
        ) {
          updateData.nombre_programa = programFormData.nombre_programa;
        }
        if (programFormData.activo !== editingProgram.activo) {
          updateData.activo = programFormData.activo;
        }
        await api.put(
          `/admin/config/programas/${editingProgram.id}`,
          updateData
        );
      } else {
        await api.post("/admin/config/programas", programFormData);
      }
      fetchProgramas();
      handleCloseProgramDialog();
    } catch (error) {
      console.error("Error saving program:", error);
    }
  };

  // Removed unused handleDeleteConfig function

  const confirmDeleteConfig = async () => {
    if (deletingConfig) {
      try {
        await api.delete(`/admin/config/${deletingConfig.id}`);
        // fetchConfigs();
        setOpenDeleteDialog(false);
        setDeletingConfig(null);
      } catch (error) {
        console.error("Error deleting config:", error);
      }
    }
  };

  const handleDeleteProgram = (program: Programa) => {
    setDeletingProgram(program);
    setOpenDeleteProgramDialog(true);
  };

  const confirmDeleteProgram = async () => {
    if (deletingProgram) {
      try {
        await api.delete(`/admin/config/programas/${deletingProgram.id}`);
        fetchProgramas();
        setOpenDeleteProgramDialog(false);
        setDeletingProgram(null);
      } catch (error) {
        console.error("Error deleting program:", error);
      }
    }
  };

  const handleOpenCargoDialog = (cargo?: Cargo) => {
    if (cargo) {
      setEditingCargo(cargo);
      setCargoFormData({
        nombre_cargo: cargo.nombre_cargo,
        periodicidad_emo: cargo.periodicidad_emo,
        activo: cargo.activo,
      });
    } else {
      setEditingCargo(null);
      setCargoFormData({
        nombre_cargo: "",
        periodicidad_emo: null,
        activo: true,
      });
    }
    setOpenCargoDialog(true);
  };

  const handleCloseCargoDialog = () => {
    setOpenCargoDialog(false);
    setEditingCargo(null);
    setCargoFormData({
      nombre_cargo: "",
      periodicidad_emo: null,
      activo: true,
    });
  };

  const handleSaveCargo = async () => {
    try {
      if (editingCargo) {
        const updateData: CargoUpdate = {};
        if (cargoFormData.nombre_cargo !== editingCargo.nombre_cargo) {
          updateData.nombre_cargo = cargoFormData.nombre_cargo;
        }
        if (cargoFormData.periodicidad_emo !== editingCargo.periodicidad_emo) {
          updateData.periodicidad_emo = cargoFormData.periodicidad_emo;
        }
        if (cargoFormData.activo !== editingCargo.activo) {
          updateData.activo = cargoFormData.activo;
        }
        await api.put(`/admin/config/cargos/${editingCargo.id}`, updateData);
      } else {
        await api.post("/admin/config/cargos", cargoFormData);
      }
      fetchCargos();
      handleCloseCargoDialog();
    } catch (error) {
      console.error("Error saving cargo:", error);
    }
  };

  const handleDeleteCargo = (cargo: Cargo) => {
    setDeletingCargo(cargo);
    setOpenDeleteCargoDialog(true);
  };

  const confirmDeleteCargo = async () => {
    if (deletingCargo) {
      try {
        await api.delete(`/admin/config/cargos/${deletingCargo.id}`);
        fetchCargos();
        setOpenDeleteCargoDialog(false);
        setDeletingCargo(null);
      } catch (error) {
        console.error("Error deleting cargo:", error);
      }
    }
  };

  const handleOpenProgramDialog = (program?: Programa) => {
    if (program) {
      setEditingProgram(program);
      setProgramFormData({
        nombre_programa: program.nombre_programa,
        activo: program.activo,
      });
    } else {
      setEditingProgram(null);
      setProgramFormData({
        nombre_programa: "",
        activo: true,
      });
    }
    setOpenProgramDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingConfig(null);
  };

  const handleCloseSeguridadSocialDialog = () => {
    setOpenSeguridadSocialDialog(false);
    setEditingSeguridadSocial(null);
    setSeguridadSocialFormData({
      tipo: "",
      nombre: "",
      is_active: true,
    });
  };

  const handleCloseProgramDialog = () => {
    setOpenProgramDialog(false);
    setEditingProgram(null);
  };

  const handleOpenSeguridadSocialDialog = (
    seguridadSocial?: SeguridadSocial
  ) => {
    if (seguridadSocial) {
      setEditingSeguridadSocial(seguridadSocial);
      setSeguridadSocialFormData({
        tipo: seguridadSocial.tipo,
        nombre: seguridadSocial.nombre,
        is_active: seguridadSocial.is_active,
      });
    } else {
      setEditingSeguridadSocial(null);
      setSeguridadSocialFormData({
        tipo: "",
        nombre: "",
        is_active: true,
      });
    }
    setOpenSeguridadSocialDialog(true);
  };

  const handleDeleteSeguridadSocial = (seguridadSocial: SeguridadSocial) => {
    setDeletingSeguridadSocial(seguridadSocial);
    setOpenDeleteSeguridadSocialDialog(true);
  };

  const confirmDeleteSeguridadSocial = async () => {
    if (deletingSeguridadSocial) {
      try {
        await api.delete(`/admin/config/seguridad-social/${deletingSeguridadSocial.id}`);
        fetchSeguridadSocial();
        setOpenDeleteSeguridadSocialDialog(false);
        setDeletingSeguridadSocial(null);
      } catch (error) {
        console.error("Error deleting seguridad social:", error);
      }
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>Cargando configuración...</Typography>
      </Box>
    );
  }

  // Filtrar configuraciones por categoría (ya no incluye seguridad social)

  const renderSeguridadSocialTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "grey.50" }}>
            <TableCell sx={{ fontWeight: "bold" }}>Tipo</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Nombre</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {seguridadSocial.map((entity) => (
            <TableRow key={entity.id} hover>
              <TableCell sx={{ fontWeight: "medium" }}>
                {entity.tipo.toUpperCase()}
              </TableCell>
              <TableCell>{entity.nombre}</TableCell>
              <TableCell>
                <Chip
                  label={entity.is_active ? "Activo" : "Inactivo"}
                  color={entity.is_active ? "success" : "default"}
                  size="small"
                  sx={{ fontWeight: "bold" }}
                />
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => handleOpenSeguridadSocialDialog(entity)}
                  sx={{ mr: 1, color: "primary.main" }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteSeguridadSocial(entity)}
                  sx={{ color: "error.main" }}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Configuración Administrativa
      </Typography>

      {/* Sección: Gestión de Personal */}
      <Typography
        variant="h5"
        sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}
      >
        Gestión de Personal
      </Typography>

      {/* Cargos */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <SettingsIcon color="primary" />
              Cargos
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenCargoDialog()}
              sx={{ borderRadius: 2 }}
            >
              Nuevo Cargo
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Nombre del Cargo
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Periodicidad EMO
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cargos.map((cargo) => (
                  <TableRow key={cargo.id} hover>
                    <TableCell sx={{ fontWeight: "medium" }}>
                      {cargo.nombre_cargo}
                    </TableCell>
                    <TableCell>
                      {cargo.periodicidad_emo || "No especificada"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cargo.activo ? "Activo" : "Inactivo"}
                        color={cargo.activo ? "success" : "default"}
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenCargoDialog(cargo)}
                        sx={{ mr: 1, color: "primary.main" }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCargo(cargo)}
                        sx={{ color: "error.main" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Sección: Programas y Categorías */}
      <Typography
        variant="h5"
        sx={{ mb: 3, mt: 4, color: "primary.main", fontWeight: "bold" }}
      >
        Programas y Categorías
      </Typography>

      {/* Programas */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <SettingsIcon color="primary" />
              Programas
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenProgramDialog()}
              sx={{ borderRadius: 2 }}
            >
              Nuevo Programa
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Nombre del Programa
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {programas.map((programa) => (
                  <TableRow key={programa.id} hover>
                    <TableCell sx={{ fontWeight: "medium" }}>
                      {programa.nombre_programa}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={programa.activo ? "Activo" : "Inactivo"}
                        color={programa.activo ? "success" : "default"}
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenProgramDialog(programa)}
                        sx={{ mr: 1, color: "primary.main" }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteProgram(programa)}
                        sx={{ color: "error.main" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Sección: Seguridad Social */}
      <Typography
        variant="h5"
        sx={{ mb: 3, mt: 4, color: "primary.main", fontWeight: "bold" }}
      >
        Seguridad Social
      </Typography>

      {/* Seguridad Social */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <SettingsIcon color="primary" />
              Configuraciones de Seguridad Social
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenSeguridadSocialDialog()}
              sx={{ borderRadius: 2 }}
            >
              Nueva Configuración
            </Button>
          </Box>
          {renderSeguridadSocialTable()}
        </CardContent>
      </Card>

      {/* Dialog para Configuraciones */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingConfig ? "Editar Configuración" : "Nueva Configuración"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  disabled={!!editingConfig} // Deshabilitar si estamos editando
                >
                  <MenuItem value="position">Cargos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <UppercaseTextField
                fullWidth
                label="Nombre"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
              />
            </Grid>

            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveConfig} variant="contained">
            {editingConfig ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Seguridad Social */}
      <Dialog
        open={openSeguridadSocialDialog}
        onClose={handleCloseSeguridadSocialDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSeguridadSocial
            ? "Editar Seguridad Social"
            : "Nueva Seguridad Social"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={seguridadSocialFormData.tipo}
                  onChange={(e) =>
                    setSeguridadSocialFormData({
                      ...seguridadSocialFormData,
                      tipo: e.target.value,
                    })
                  }
                  disabled={!!editingSeguridadSocial}
                >
                  <MenuItem value="eps">EPS</MenuItem>
                  <MenuItem value="afp">AFP</MenuItem>
                  <MenuItem value="arl">ARL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <UppercaseTextField
                fullWidth
                label="Nombre"
                value={seguridadSocialFormData.nombre}
                onChange={(e) =>
                  setSeguridadSocialFormData({
                    ...seguridadSocialFormData,
                    nombre: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={seguridadSocialFormData.is_active}
                    onChange={(e) =>
                      setSeguridadSocialFormData({
                        ...seguridadSocialFormData,
                        is_active: e.target.checked,
                      })
                    }
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSeguridadSocialDialog}>Cancelar</Button>
          <Button onClick={handleSaveSeguridadSocial} variant="contained">
            {editingSeguridadSocial ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar seguridad social */}
      <Dialog
        open={openDeleteSeguridadSocialDialog}
        onClose={() => setOpenDeleteSeguridadSocialDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar la configuración de seguridad
            social "{deletingSeguridadSocial?.nombre}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteSeguridadSocialDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteSeguridadSocial}
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Programas */}
      <Dialog
        open={openProgramDialog}
        onClose={handleCloseProgramDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingProgram ? "Editar Programa" : "Nuevo Programa"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <UppercaseTextField
                fullWidth
                label="Nombre del Programa"
                value={programFormData.nombre_programa}
                onChange={(e) =>
                  setProgramFormData({
                    ...programFormData,
                    nombre_programa: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={programFormData.activo}
                    onChange={(e) =>
                      setProgramFormData({
                        ...programFormData,
                        activo: e.target.checked,
                      })
                    }
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProgramDialog}>Cancelar</Button>
          <Button onClick={handleSaveProgram} variant="contained">
            {editingProgram ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar configuración */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar la configuración "
            {deletingConfig?.display_name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button
            onClick={confirmDeleteConfig}
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar programa */}
      <Dialog
        open={openDeleteProgramDialog}
        onClose={() => setOpenDeleteProgramDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar el programa "
            {deletingProgram?.nombre_programa}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteProgramDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteProgram}
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Cargos */}
      <Dialog
        open={openCargoDialog}
        onClose={handleCloseCargoDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCargo ? "Editar Cargo" : "Nuevo Cargo"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <UppercaseTextField
                fullWidth
                label="Nombre del Cargo"
                value={cargoFormData.nombre_cargo}
                onChange={(e) =>
                  setCargoFormData({
                    ...cargoFormData,
                    nombre_cargo: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Periodicidad EMO</InputLabel>
                <Select
                  value={cargoFormData.periodicidad_emo || ""}
                  onChange={(e) =>
                    setCargoFormData({
                      ...cargoFormData,
                      periodicidad_emo: e.target.value || null,
                    })
                  }
                  label="Periodicidad EMO"
                >
                  <MenuItem value="">Sin especificar</MenuItem>
                  {PERIODICIDAD_EMO_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={cargoFormData.activo}
                    onChange={(e) =>
                      setCargoFormData({
                        ...cargoFormData,
                        activo: e.target.checked,
                      })
                    }
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCargoDialog}>Cancelar</Button>
          <Button onClick={handleSaveCargo} variant="contained">
            {editingCargo ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar cargo */}
      <Dialog
        open={openDeleteCargoDialog}
        onClose={() => setOpenDeleteCargoDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar el cargo "
            {deletingCargo?.nombre_cargo}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteCargoDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteCargo}
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminConfigPage;
