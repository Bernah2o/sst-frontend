import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Visibility,
  Warning,
  Error,
  Link,
  LinkOff,
  PersonAdd,
  CheckCircle,
  Cancel,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Grid,
  CircularProgress,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import AutocompleteField, { AutocompleteOption } from '../components/AutocompleteField';
import UppercaseTextField from '../components/UppercaseTextField';
import { getCitiesByDepartment } from '../data/colombianCities';
import { COLOMBIAN_DEPARTMENTS } from '../data/colombianDepartments';
import { useCargoAutocompleteOptimized } from '../hooks/useCargoAutocompleteOptimized';
import { 
  Worker, 
  WorkerCreate, 
  WorkerUpdate,
  WorkerList,
  Gender, 
  DocumentType, 
  ContractType, 
  WorkModality, 
  RiskLevel, 
  BloodType, 
  UserRole
} from "../types";
import { formatDate } from '../utils/dateUtils';
import { logger } from '../utils/logger';

import api from "./../services/api";

interface WorkerFormData {
  photo?: string;
  gender: Gender;
  document_type: DocumentType;
  document_number: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  email: string;
  phone?: string;
  contract_type: ContractType;
  work_modality?: WorkModality;
  profession?: string;
  risk_level: RiskLevel;
  position: string;
  occupation?: string;
  salary_ibc?: number;
  fecha_de_ingreso: string;
  fecha_de_retiro?: string;
  eps_id?: number;
  afp_id?: number;
  arl_id?: number;
  country: string;
  department?: string;
  city?: string;
  direccion?: string;
  blood_type?: BloodType;
  observations?: string;
  is_active: boolean;
  assigned_role: UserRole;
}

// Interfaces para las configuraciones administrativas
interface AdminConfig {
  id: number;
  category: string;
  display_name: string;
  emo_periodicity?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para cargos
interface Cargo {
  id: number;
  nombre_cargo: string;
  periodicidad_emo: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

const WorkersManagement: React.FC = () => {
  // Debug: Contar renders del componente principal

  
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  
  // Estados para las configuraciones administrativas
  const [adminConfigs, setAdminConfigs] = useState<AdminConfig[]>([]);
  const [epsOptions, setEpsOptions] = useState<AdminConfig[]>([]);
  const [afpOptions, setAfpOptions] = useState<AdminConfig[]>([]);
  const [arlOptions, setArlOptions] = useState<AdminConfig[]>([]);
  const [cargoOptions, setCargos] = useState<Cargo[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [formData, setFormData] = useState<WorkerFormData>({
    photo: "",
    gender: Gender.MALE,
    document_type: DocumentType.CEDULA,
    document_number: "",
    first_name: "",
    last_name: "",
    birth_date: "",
    email: "",
    phone: "",
    contract_type: ContractType.INDEFINITE,
    work_modality: WorkModality.ON_SITE,
    profession: "",
    risk_level: RiskLevel.LEVEL_I,
    position: "",
    occupation: "",
    salary_ibc: 0,
    fecha_de_ingreso: new Date().toISOString().split("T")[0],
    fecha_de_retiro: "",
    eps_id: undefined,
    afp_id: undefined,
    arl_id: undefined,
    country: "Colombia",
    department: "",
    city: "",
    direccion: "",
    blood_type: BloodType.O_POSITIVE,
    observations: "",
    is_active: true,
    assigned_role: UserRole.EMPLOYEE,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Estados para funcionalidades administrativas
  const [linkUserDialog, setLinkUserDialog] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerList | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<WorkerList | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [userDataFound, setUserDataFound] = useState(false);
  
  // Estados para modal de previsualización
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewWorker, setPreviewWorker] = useState<Worker | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchWorkers();
    fetchAdminConfigs();
    fetchCargos();
  }, [page, rowsPerPage, searchTerm]);

  const fetchAdminConfigs = async () => {
    try {
      // Usar los nuevos endpoints de seguridad social
        const [epsResponse, afpResponse, arlResponse] = await Promise.all([
           api.get('/admin/config/seguridad-social/tipo/eps'),
           api.get('/admin/config/seguridad-social/tipo/afp'),
           api.get('/admin/config/seguridad-social/tipo/arl')
      ]);
      
      // Mapear los datos al formato esperado por el frontend
      const eps = epsResponse.data.map((item: any) => ({
        id: item.id,
        category: 'eps',
        display_name: item.nombre,
        is_active: item.is_active
      }));
      
      const afp = afpResponse.data.map((item: any) => ({
        id: item.id,
        category: 'afp',
        display_name: item.nombre,
        is_active: item.is_active
      }));
      
      const arl = arlResponse.data.map((item: any) => ({
        id: item.id,
        category: 'arl',
        display_name: item.nombre,
        is_active: item.is_active
      }));
      
      setEpsOptions(eps);
      setAfpOptions(afp);
      setArlOptions(arl);
      
      // Mantener compatibilidad con adminConfigs si se necesita
      setAdminConfigs([...eps, ...afp, ...arl]);
    } catch (error) {
      logger.error('Error fetching seguridad social configs:', error);
      // Fallback al endpoint anterior si falla
      try {
        const response = await api.get('/admin/config/');
        const configs = response.data || [];
        setAdminConfigs(configs);
        
        const epsConfigs = configs.filter((config: AdminConfig) => config.category.toLowerCase() === 'eps' && config.is_active);
        const afpConfigs = configs.filter((config: AdminConfig) => config.category.toLowerCase() === 'afp' && config.is_active);
        const arlConfigs = configs.filter((config: AdminConfig) => config.category.toLowerCase() === 'arl' && config.is_active);
        
        setEpsOptions(epsConfigs);
        setAfpOptions(afpConfigs);
        setArlOptions(arlConfigs);
      } catch (fallbackError) {
        logger.error('Error fetching admin configs fallback:', fallbackError);
      }
    }
  };

  const fetchCargos = async () => {
    try {
      const response = await api.get('/admin/config/cargos/active');
      const cargos = response.data || [];
      setCargos(cargos.filter((cargo: Cargo) => cargo.activo));
    } catch (error) {
      logger.error('Error fetching cargos:', error);
    }
  };

  const searchUserByDocument = async (documentNumber: string) => {
    if (!documentNumber || documentNumber.length < 3) {
      setUserDataFound(false);
      return;
    }

    try {
      setLoadingUserData(true);
      const user = await api.getUserByDocument(documentNumber);
      
      // Autocompletar los campos con los datos del usuario encontrado
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || prev.first_name,
        last_name: user.last_name || prev.last_name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        department: user.department || prev.department,
        position: user.position || prev.position,
        document_type: (user.document_type as DocumentType) || prev.document_type,
      }));
      
      setUserDataFound(true);
      showSnackbar(`Datos del usuario ${user.first_name} ${user.last_name} cargados automáticamente`, "success");
    } catch (error: any) {
      setUserDataFound(false);
      // No mostrar error si el usuario no existe, es normal
      if (error.response?.status !== 404) {
        logger.error('Error searching user by document:', error);
      }
    } finally {
      setLoadingUserData(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      
      // Si estamos en la primera página y no hay búsqueda, obtener más registros para calcular el total
      const isFirstPageNoSearch = page === 0 && !searchTerm;
      const limitForTotal = isFirstPageNoSearch ? 1000 : rowsPerPage;
      
      const response = await api.get("/workers", {
        params: {
          skip: page * rowsPerPage,
          limit: limitForTotal,
          search: searchTerm || undefined,
        },
      });
      
      const allWorkers = response.data || [];
      
      if (isFirstPageNoSearch) {
        // Si obtuvimos todos los registros, usar esa información
        setWorkers(allWorkers.slice(0, rowsPerPage));
        setTotalWorkers(allWorkers.length);
      } else {
        // Para otras páginas o con búsqueda, usar los datos tal como vienen
        setWorkers(allWorkers);
        // Estimar el total basado en si hay más registros
        if (allWorkers.length === rowsPerPage) {
          // Probablemente hay más registros
          setTotalWorkers((page + 1) * rowsPerPage + 1);
        } else {
          // Esta es probablemente la última página
          setTotalWorkers(page * rowsPerPage + allWorkers.length);
        }
      }
    } catch (error) {
      logger.error("Error fetching workers:", error);
      showSnackbar("No se pudieron cargar los trabajadores. Verifique su conexión e intente nuevamente.", "error");
      // Reset to empty array on error
      setWorkers([]);
      setTotalWorkers(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorker = async () => {
    setEditingWorker(null);
    
    // Resetear estados de búsqueda de usuario
    setLoadingUserData(false);
    setUserDataFound(false);
    
    // Asegurar que las configuraciones administrativas estén cargadas
    await fetchAdminConfigs();
    await fetchCargos();
    
    setFormData({
      photo: "",
      gender: Gender.MALE,
      document_type: DocumentType.CEDULA,
      document_number: "",
      first_name: "",
      last_name: "",
      birth_date: "",
      email: "",
      phone: "",
      contract_type: ContractType.INDEFINITE,
      work_modality: WorkModality.ON_SITE,
      profession: "",
      risk_level: RiskLevel.LEVEL_I,
      position: "",
      occupation: "",
      salary_ibc: 0,
      fecha_de_ingreso: new Date().toISOString().split("T")[0],
      fecha_de_retiro: "",
      eps_id: undefined,
      afp_id: undefined,
      arl_id: undefined,
      country: "Colombia",
      department: "",
      city: "",
      direccion: "",
      blood_type: BloodType.O_POSITIVE,
      observations: "",
      is_active: true,
      assigned_role: UserRole.EMPLOYEE,
    });
    setAvailableCities([]);
    setOpenDialog(true);
  };

  const handleEditWorker = async (worker: Worker) => {
    try {
      // Obtener los datos completos del trabajador desde la API
      const response = await api.get(`/workers/${worker.id}`);
      const fullWorker = response.data;
      
      setEditingWorker(fullWorker);
      
      // Asegurar que las configuraciones administrativas estén cargadas
      await fetchAdminConfigs();
      await fetchCargos();
    
      setFormData({
        photo: fullWorker.photo || "",
        gender: fullWorker.gender,
        document_type: fullWorker.document_type,
        document_number: fullWorker.document_number,
        first_name: fullWorker.first_name,
        last_name: fullWorker.last_name,
        birth_date: fullWorker.birth_date ? fullWorker.birth_date.split("T")[0] : "",
        email: fullWorker.email,
        phone: fullWorker.phone || "",
        contract_type: fullWorker.contract_type,
        work_modality: fullWorker.work_modality,
        profession: fullWorker.profession || "",
        risk_level: fullWorker.risk_level,
        position: fullWorker.position,
        occupation: fullWorker.occupation || "",
        salary_ibc: fullWorker.salary_ibc || 0,
        fecha_de_ingreso: fullWorker.fecha_de_ingreso ? fullWorker.fecha_de_ingreso.split("T")[0] : "",
        fecha_de_retiro: fullWorker.fecha_de_retiro ? fullWorker.fecha_de_retiro.split("T")[0] : "",
        eps_id: fullWorker.eps ? epsOptions.find(eps => eps.display_name === fullWorker.eps)?.id : undefined,
        afp_id: fullWorker.afp ? afpOptions.find(afp => afp.display_name === fullWorker.afp)?.id : undefined,
        arl_id: fullWorker.arl ? arlOptions.find(arl => arl.display_name === fullWorker.arl)?.id : undefined,
        country: fullWorker.country || "Colombia",
        department: fullWorker.department || "",
        city: fullWorker.city || "",
        direccion: fullWorker.direccion || "",
        blood_type: fullWorker.blood_type,
        observations: fullWorker.observations || "",
        is_active: fullWorker.is_active ?? true,
        assigned_role: fullWorker.assigned_role || UserRole.EMPLOYEE,
      });
      
      // Cargar ciudades disponibles si hay departamento seleccionado
      if (fullWorker.department) {
        setAvailableCities(getCitiesByDepartment(fullWorker.department));
      }
      setOpenDialog(true);
    } catch (error) {
      logger.error('Error fetching worker details:', error);
      showSnackbar('No se pudieron cargar los detalles del trabajador. Verifique su conexión e intente nuevamente.', 'error');
    }
  };

  const handleSaveWorker = async () => {
    try {
      // Validate required fields
      if (!formData.birth_date) {
        showSnackbar("La fecha de nacimiento es requerida", "error");
        return;
      }
      
      // Prepare data for backend API using only new schema fields
      const workerData = {
        photo: formData.photo,
        gender: formData.gender,
        document_type: formData.document_type,
        document_number: formData.document_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_date: formData.birth_date,
        email: formData.email,
        phone: formData.phone || undefined,
        contract_type: formData.contract_type,
        work_modality: formData.work_modality,
        profession: formData.profession || undefined,
        risk_level: formData.risk_level,
        position: formData.position,
        occupation: formData.occupation || undefined,
        salary_ibc: formData.salary_ibc,
        fecha_de_ingreso: formData.fecha_de_ingreso || undefined,
        fecha_de_retiro: formData.fecha_de_retiro || undefined,
        eps: formData.eps_id ? epsOptions.find(eps => eps.id === formData.eps_id)?.display_name : undefined,
        afp: formData.afp_id ? afpOptions.find(afp => afp.id === formData.afp_id)?.display_name : undefined,
        arl: formData.arl_id ? arlOptions.find(arl => arl.id === formData.arl_id)?.display_name : undefined,
        country: formData.country,
        department: formData.department || undefined,
        city: formData.city || undefined,
        direccion: formData.direccion || undefined,
        blood_type: formData.blood_type,
        observations: formData.observations || undefined,
        is_active: formData.is_active,
        assigned_role: formData.assigned_role,
      };
      
      // Remove undefined values to avoid sending them to the backend
      const cleanedWorkerData = Object.fromEntries(
        Object.entries(workerData).filter(([_, value]) => value !== undefined)
      );

      if (editingWorker) {
        // Actualizar trabajador existente
        await api.put(`/workers/${editingWorker.id}`, cleanedWorkerData);
        showSnackbar("Trabajador actualizado exitosamente", "success");
      } else {
        // Crear nuevo trabajador
        await api.post("/workers", cleanedWorkerData);
        showSnackbar("Trabajador creado exitosamente", "success");
      }
      handleCloseDialog();
      fetchWorkers();
    } catch (error) {
      logger.error("Error saving worker:", error);
      showSnackbar("Error al guardar trabajador", "error");
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setLoadingUserData(false);
    setUserDataFound(false);
    setAvailableCities([]);
  };

  const handleDepartmentChange = (department: string) => {
    setFormData(prev => ({
      ...prev,
      department,
      city: "" // Limpiar ciudad cuando cambia el departamento
    }));
    setAvailableCities(getCitiesByDepartment(department));
  };

  const handleDeleteWorker = (worker: WorkerList) => {
    setWorkerToDelete(worker);
    setOpenDeleteDialog(true);
  };

  const handlePreviewWorker = async (worker: WorkerList) => {
    try {
      setLoadingPreview(true);
      setPreviewDialog(true);
      
      // Obtener los datos completos del trabajador
      const response = await api.get(`/workers/${worker.id}`);
      setPreviewWorker(response.data);
    } catch (error) {
      logger.error('Error fetching worker preview:', error);
      showSnackbar('No se pudo cargar la previsualización del trabajador. Verifique su conexión e intente nuevamente.', 'error');
      setPreviewDialog(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Funciones para gestión administrativa de usuarios
  const handleLinkUser = async (worker: WorkerList) => {
    setSelectedWorker(worker);
    setLinkUserDialog(true);
    await searchAvailableUsers();
  };

  const handleUnlinkUser = async (worker: WorkerList) => {
    try {
      await api.post(`/workers/${worker.id}/unlink-user`);
      setSnackbar({
        open: true,
        message: "Usuario desvinculado exitosamente",
        severity: "success",
      });
      fetchWorkers();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Error al desvincular usuario",
        severity: "error",
      });
    }
  };

  const handleToggleRegistration = async (worker: WorkerList) => {
    try {
      await api.post(`/workers/${worker.id}/toggle-registration`);
      setSnackbar({
        open: true,
        message: `Estado de registro ${worker.is_registered ? 'desactivado' : 'activado'} exitosamente`,
        severity: "success",
      });
      fetchWorkers();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Error al cambiar estado de registro",
        severity: "error",
      });
    }
  };

  const searchAvailableUsers = async (searchTerm: string = "") => {
    try {
      const response = await api.get(`/workers/search-users?search=${searchTerm}`);
      setAvailableUsers(response.data);
    } catch (error: any) {
      logger.error("Error searching users:", error);
      setAvailableUsers([]);
    }
  };

  const confirmLinkUser = async () => {
    if (!selectedWorker || !selectedUserId) return;
    
    try {
      await api.post(`/workers/${selectedWorker.id}/link-user`, {
        user_id: selectedUserId
      });
      setSnackbar({
        open: true,
        message: "Usuario vinculado exitosamente",
        severity: "success",
      });
      setLinkUserDialog(false);
      setSelectedWorker(null);
      setSelectedUserId(null);
      setUserSearchTerm("");
      fetchWorkers();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Error al vincular usuario",
        severity: "error",
      });
    }
  };

  const confirmDeleteWorker = async () => {
    if (workerToDelete) {
      try {
        await api.delete(`/workers/${workerToDelete.id}`);
        showSnackbar("Trabajador eliminado exitosamente", "success");
        fetchWorkers();
      } catch (error) {
        logger.error("Error deleting worker:", error);
        showSnackbar("Error al eliminar trabajador", "error");
      }
    }
    setOpenDeleteDialog(false);
    setWorkerToDelete(null);
  };

  const cancelDeleteWorker = () => {
    setOpenDeleteDialog(false);
    setWorkerToDelete(null);
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Trabajadores
      </Typography>

      {/* Barra de herramientas */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
        className="action-buttons"
      >
        <TextField
          placeholder="Buscar trabajadores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
          sx={{ minWidth: 300 }}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateWorker}
        >
          Nuevo Trabajador
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchWorkers}
        >
          Actualizar
        </Button>
      </Box>

      {/* Tabla de trabajadores */}
      <TableContainer component={Paper} className="responsive-table-container">
        <Table className="responsive-table">
          <TableHead>
            <TableRow>
              <TableCell>Documento</TableCell>
              <TableCell>Nombre Completo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Posición</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Nivel de Riesgo</TableCell>
              <TableCell>Fecha Ingreso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Registro</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Cargando trabajadores...
                </TableCell>
              </TableRow>
            ) : !workers || workers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No se encontraron trabajadores
                </TableCell>
              </TableRow>
            ) : (
              workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>{worker.document_number}</TableCell>
                  <TableCell>{worker.full_name}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                  <TableCell>{worker.position}</TableCell>
                  <TableCell>{worker.department || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={worker.risk_level}
                      color="info"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                  {worker.fecha_de_ingreso ? formatDate(worker.fecha_de_ingreso) : 'N/A'}
                </TableCell>
                  <TableCell>
                    <Chip
                      label={worker.is_active ? "Activo" : "Inactivo"}
                      color={worker.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={worker.is_registered ? "Registrado" : "No Registrado"}
                      color={worker.is_registered ? "success" : "warning"}
                      size="small"
                      icon={worker.is_registered ? <CheckCircle /> : <Cancel />}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="info"
                      onClick={() => handlePreviewWorker(worker)}
                      size="small"
                      title="Ver previsualización del trabajador"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditWorker(worker)}
                      size="small"
                      title="Editar trabajador"
                    >
                      <Edit />
                    </IconButton>
                    
                    {/* Botón para vincular usuario */}
                    {!worker.is_registered && (
                      <IconButton
                        color="info"
                        onClick={() => handleLinkUser(worker)}
                        size="small"
                        title="Vincular usuario"
                      >
                        <Link />
                      </IconButton>
                    )}
                    
                    {/* Botón para desvincular usuario */}
                    {worker.is_registered && (
                      <IconButton
                        color="warning"
                        onClick={() => handleUnlinkUser(worker)}
                        size="small"
                        title="Desvincular usuario"
                      >
                        <LinkOff />
                      </IconButton>
                    )}
                    
                    {/* Botón para cambiar estado de registro */}
                    <IconButton
                      color={worker.is_registered ? "warning" : "success"}
                      onClick={() => handleToggleRegistration(worker)}
                      size="small"
                      title={worker.is_registered ? "Marcar como no registrado" : "Marcar como registrado"}
                    >
                      {worker.is_registered ? <Cancel /> : <CheckCircle />}
                    </IconButton>
                    
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteWorker(worker)}
                      size="small"
                      title="Eliminar trabajador"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalWorkers}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
        />
      </TableContainer>

      {/* Dialog para crear/editar trabajador */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        className="responsive-dialog large"
      >
        <DialogTitle>
          {editingWorker ? "Editar Trabajador" : "Crear Nuevo Trabajador"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }} className="responsive-form">
            {/* Personal Information */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Foto (URL)"
                value={formData.photo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, photo: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Género</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value as Gender })
                  }
                >
                  <MenuItem value={Gender.MALE}>Masculino</MenuItem>
                  <MenuItem value={Gender.FEMALE}>Femenino</MenuItem>
                  <MenuItem value={Gender.OTHER}>Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  value={formData.document_type}
                  onChange={(e) =>
                    setFormData({ ...formData, document_type: e.target.value as DocumentType })
                  }
                >
                  <MenuItem value={DocumentType.CEDULA}>Cédula</MenuItem>
                  <MenuItem value={DocumentType.PASSPORT}>Pasaporte</MenuItem>
                  <MenuItem value={DocumentType.SPECIAL_PERMIT}>Permiso Especial</MenuItem>
                  <MenuItem value={DocumentType.OTHER}>Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <UppercaseTextField
                label="Número de Documento"
                value={formData.document_number}
                onChange={(e) => {
                  const documentNumber = e.target.value;
                  setFormData({ 
                    ...formData, 
                    document_number: documentNumber
                  });
                  
                  // Buscar usuario por documento si no estamos editando
                  if (!editingWorker && documentNumber.length >= 3) {
                    searchUserByDocument(documentNumber);
                  }
                }}
                fullWidth
                required
                helperText={
                  loadingUserData ? "Buscando datos del usuario..." :
                  userDataFound ? "✓ Datos del usuario cargados automáticamente" :
                  !editingWorker ? "Ingrese la cédula para cargar datos del usuario" : ""
                }
                InputProps={{
                  endAdornment: loadingUserData ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ mr: 1 }}>Cargando...</Typography>
                    </Box>
                  ) : userDataFound ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" color="success.main">✓</Typography>
                    </Box>
                  ) : null
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <UppercaseTextField
                label="Nombres"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    first_name: e.target.value
                  })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <UppercaseTextField
                label="Apellidos"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    last_name: e.target.value
                  })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Fecha de Nacimiento"
                type="date"
                value={formData.birth_date}
                onChange={(e) =>
                  setFormData({ ...formData, birth_date: e.target.value })
                }
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            {/* Contact Information */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Teléfono"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    phone: e.target.value
                  })
                }
                fullWidth
              />
            </Grid>
            
            {/* Work Information */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Contrato</InputLabel>
                <Select
                  value={formData.contract_type}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_type: e.target.value as ContractType })
                  }
                >
                  <MenuItem value={ContractType.INDEFINITE}>Indefinido</MenuItem>
                  <MenuItem value={ContractType.FIXED}>Fijo</MenuItem>
                  <MenuItem value={ContractType.SERVICES}>Prestación de Servicios</MenuItem>
                  <MenuItem value={ContractType.WORK_LABOR}>Obra Labor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Modalidad de Trabajo</InputLabel>
                <Select
                  value={formData.work_modality}
                  onChange={(e) =>
                    setFormData({ ...formData, work_modality: e.target.value as WorkModality })
                  }
                >
                  <MenuItem value={WorkModality.ON_SITE}>Presencial</MenuItem>
                  <MenuItem value={WorkModality.REMOTE}>Remoto</MenuItem>
                  <MenuItem value={WorkModality.TELEWORK}>Teletrabajo</MenuItem>
                  <MenuItem value={WorkModality.HOME_OFFICE}>Home Office</MenuItem>
                  <MenuItem value={WorkModality.MOBILE}>Móvil/Itinerante</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CargoAutocompleteField
                value={formData.position}
                onChange={(selectedCargo) => {
                  setFormData({ 
                    ...formData, 
                    position: selectedCargo?.value?.nombre_cargo || selectedCargo?.label || ''
                  });
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Profesión"
                value={formData.profession}
                onChange={(e) =>
                  setFormData({ ...formData, profession: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Nivel de Riesgo</InputLabel>
                <Select
                  value={formData.risk_level}
                  onChange={(e) =>
                    setFormData({ ...formData, risk_level: e.target.value as RiskLevel })
                  }
                >
                  <MenuItem value={RiskLevel.LEVEL_I}>Nivel I</MenuItem>
                  <MenuItem value={RiskLevel.LEVEL_II}>Nivel II</MenuItem>
                  <MenuItem value={RiskLevel.LEVEL_III}>Nivel III</MenuItem>
                  <MenuItem value={RiskLevel.LEVEL_IV}>Nivel IV</MenuItem>
                  <MenuItem value={RiskLevel.LEVEL_V}>Nivel V</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={formData.department || ''}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  label="Departamento"
                >
                  <MenuItem value="">
                    <em>Seleccionar departamento</em>
                  </MenuItem>
                  {COLOMBIAN_DEPARTMENTS.map((department) => (
                    <MenuItem key={department} value={department}>
                      {department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Fecha de Ingreso"
                type="date"
                value={formData.fecha_de_ingreso}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    fecha_de_ingreso: e.target.value
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Fecha de Retiro"
                type="date"
                value={formData.fecha_de_retiro}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_de_retiro: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Salario IBC"
                type="number"
                value={formData.salary_ibc}
                onChange={(e) =>
                  setFormData({ ...formData, salary_ibc: parseFloat(e.target.value) || undefined })
                }
                fullWidth
              />
            </Grid>
            
            {/* Additional Information */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Ocupación"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData({ ...formData, occupation: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="País"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Ciudad</InputLabel>
                <Select
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  label="Ciudad"
                  disabled={!formData.department || availableCities.length === 0}
                >
                  <MenuItem value="">
                    <em>Seleccionar ciudad</em>
                  </MenuItem>
                  {availableCities.map((city) => (
                    <MenuItem key={city} value={city}>
                      {city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Dirección"
                value={formData.direccion || ""}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
                fullWidth
                placeholder="Ingrese la dirección completa"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Sangre</InputLabel>
                <Select
                  value={formData.blood_type || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, blood_type: e.target.value as BloodType })
                  }
                >
                  <MenuItem value={BloodType.A_POSITIVE}>A+</MenuItem>
                  <MenuItem value={BloodType.A_NEGATIVE}>A-</MenuItem>
                  <MenuItem value={BloodType.B_POSITIVE}>B+</MenuItem>
                  <MenuItem value={BloodType.B_NEGATIVE}>B-</MenuItem>
                  <MenuItem value={BloodType.AB_POSITIVE}>AB+</MenuItem>
                  <MenuItem value={BloodType.AB_NEGATIVE}>AB-</MenuItem>
                  <MenuItem value={BloodType.O_POSITIVE}>O+</MenuItem>
                  <MenuItem value={BloodType.O_NEGATIVE}>O-</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>EPS</InputLabel>
                <Select
                  value={formData.eps_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, eps_id: e.target.value ? Number(e.target.value) : undefined })
                  }
                >
                  <MenuItem value="">
                    <em>Seleccionar EPS</em>
                  </MenuItem>
                  {epsOptions.map((eps) => (
                    <MenuItem key={eps.id} value={eps.id}>
                      {eps.display_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>AFP</InputLabel>
                <Select
                  value={formData.afp_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, afp_id: e.target.value ? Number(e.target.value) : undefined })
                  }
                >
                  <MenuItem value="">
                    <em>Seleccionar AFP</em>
                  </MenuItem>
                  {afpOptions.map((afp) => (
                    <MenuItem key={afp.id} value={afp.id}>
                      {afp.display_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>ARL</InputLabel>
                <Select
                  value={formData.arl_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, arl_id: e.target.value ? Number(e.target.value) : undefined })
                  }
                >
                  <MenuItem value="">
                    <em>Seleccionar ARL</em>
                  </MenuItem>
                  {arlOptions.map((arl) => (
                    <MenuItem key={arl.id} value={arl.id}>
                      {arl.display_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Rol Asignado</InputLabel>
                <Select
                  value={formData.assigned_role || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, assigned_role: e.target.value as UserRole })
                  }
                >
                  <MenuItem value={UserRole.EMPLOYEE}>Empleado</MenuItem>
                  <MenuItem value={UserRole.TRAINER}>Entrenador</MenuItem>
                  <MenuItem value={UserRole.SUPERVISOR}>Supervisor</MenuItem>
                  <MenuItem value={UserRole.ADMIN}>Administrador</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                label="Observaciones"
                value={formData.observations}
                onChange={(e) =>
                  setFormData({ ...formData, observations: e.target.value })
                }
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ 
                        ...formData, 
                        is_active: e.target.checked
                      })
                    }
                  />
                }
                label="Trabajador activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveWorker} variant="contained">
            {editingWorker ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar trabajador */}
      <Dialog
        open={openDeleteDialog}
        onClose={cancelDeleteWorker}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              ¿Está seguro de que desea eliminar al trabajador {workerToDelete?.first_name} {workerToDelete?.last_name}?
            </Typography>
            
            <Alert severity="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Error />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Esta acción es irreversible y eliminará:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
                  <li>Toda la información personal del trabajador</li>
                  <li>Historial de cursos y certificaciones</li>
                  <li>Evaluaciones y exámenes médicos</li>
                  <li>Registros de capacitaciones</li>
                  <li>Documentos asociados</li>
                  <li>Historial laboral en el sistema</li>
                </Typography>
              </Box>
            </Alert>
            
            <Typography variant="body2" color="text.secondary">
              Si solo desea desactivar temporalmente al trabajador, considere usar la opción "Trabajador activo" en lugar de eliminar.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteWorker} variant="outlined">
            Cancelar
          </Button>
          <Button 
            onClick={confirmDeleteWorker} 
            variant="contained" 
            color="error"
            startIcon={<Delete />}
          >
            Eliminar trabajador
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para vincular usuario */}
      <Dialog
        open={linkUserDialog}
        onClose={() => {
          setLinkUserDialog(false);
          setSelectedWorker(null);
          setSelectedUserId(null);
          setUserSearchTerm("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Vincular Usuario a {selectedWorker?.full_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Buscar usuario"
              placeholder="Buscar por nombre, email o documento..."
              value={userSearchTerm}
              onChange={(e) => {
                setUserSearchTerm(e.target.value);
                searchAvailableUsers(e.target.value);
              }}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Seleccionar Usuario</InputLabel>
              <Select
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                label="Seleccionar Usuario"
              >
                <MenuItem value="">
                  <em>Seleccionar usuario...</em>
                </MenuItem>
                {availableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {user.first_name} {user.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email} - {user.document_number}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {availableUsers.length === 0 && userSearchTerm && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No se encontraron usuarios disponibles para vincular.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setLinkUserDialog(false);
              setSelectedWorker(null);
              setSelectedUserId(null);
              setUserSearchTerm("");
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmLinkUser}
            variant="contained"
            disabled={!selectedUserId}
          >
            Vincular Usuario
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de previsualización del trabajador */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Previsualización del Trabajador
          <IconButton
            aria-label="close"
            onClick={() => setPreviewDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingPreview ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : previewWorker ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Información Personal */}
              <Box>
                <Typography variant="h6" gutterBottom color="primary">
                  Información Personal
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <TextField
                    label="Nombres"
                    value={previewWorker.first_name || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Apellidos"
                    value={previewWorker.last_name || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Tipo de Documento"
                    value={previewWorker.document_type || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Número de Documento"
                    value={previewWorker.document_number || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Género"
                    value={previewWorker.gender || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Fecha de Nacimiento"
                    value={previewWorker.birth_date || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Email"
                    value={previewWorker.email || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Teléfono"
                    value={previewWorker.phone || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              {/* Información Laboral */}
              <Box>
                <Typography variant="h6" gutterBottom color="primary">
                  Información Laboral
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <TextField
                    label="Tipo de Contrato"
                    value={previewWorker.contract_type || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Modalidad de Trabajo"
                    value={previewWorker.work_modality || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Cargo"
                    value={previewWorker.position || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Ocupación"
                    value={previewWorker.occupation || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Box>
              </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
                  <TextField
                    label="Profesión"
                    value={previewWorker.profession || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Nivel de Riesgo"
                    value={previewWorker.risk_level || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Salario IBC"
                    value={previewWorker.salary_ibc ? `$${previewWorker.salary_ibc.toLocaleString()}` : ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Fecha de Ingreso"
                    value={previewWorker.fecha_de_ingreso || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Box>
              
              {/* Información de Seguridad Social */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Seguridad Social
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  <TextField
                    label="EPS"
                    value={previewWorker.eps || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="AFP"
                    value={previewWorker.afp || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="ARL"
                    value={previewWorker.arl || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              {/* Información de Ubicación */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Ubicación
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  <TextField
                    label="País"
                    value={previewWorker.country || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Departamento"
                    value={previewWorker.department || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    label="Ciudad"
                    value={previewWorker.city || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              {/* Estado de Registro */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Estado
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <TextField
                    label="Estado de Registro"
                    value={previewWorker.is_registered ? 'Registrado' : 'No Registrado'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  {previewWorker.fecha_de_retiro && (
                     <TextField
                       label="Fecha de Retiro"
                       value={previewWorker.fecha_de_retiro}
                       fullWidth
                       InputProps={{ readOnly: true }}
                       variant="outlined"
                     />
                   )}
                 </Box>
               </Box>
            </Box>
          ) : (
            <Typography>No se pudieron cargar los datos del trabajador.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Componente auxiliar para autocompletado de cargos
const CargoAutocompleteField: React.FC<{
  value: string;
  onChange: (selectedCargo: AutocompleteOption | null) => void;
}> = ({ value, onChange }) => {
  // Debug: Contar renders del componente de cargo
  
  
  const { options, loading, error } = useCargoAutocompleteOptimized();
  
  // Log para debugging

  
  const handleChange = (value: AutocompleteOption | AutocompleteOption[] | null) => {
    // Asegurar que solo manejamos selección única
    if (Array.isArray(value)) {
      onChange(value[0] || null);
    } else {
      onChange(value);
    }
  };
  
  // Encontrar la opción correspondiente al valor actual
  const selectedOption = value ? options.find(option => option.label === value) || null : null;
  
  return (
    <AutocompleteField
      label="Cargo/Posición"
      placeholder="Buscar cargo..."
      value={selectedOption}
      onChange={handleChange}
      required
      autocompleteOptions={{
        staticOptions: options,
        minSearchLength: 1,
      }}
      helperText={error || "Selecciona o busca un cargo"}
    />
  );
};

export default WorkersManagement;
