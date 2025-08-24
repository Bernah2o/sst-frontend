import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Add, Edit, Delete, Search, Refresh } from "@mui/icons-material";
import { User, UserRole, DocumentType } from "./../types";
import { formatDate } from "./../utils/dateUtils";
import api from "./../services/api";

// Interfaces para el sistema de permisos
interface CustomRole {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  is_active: boolean;
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

interface UserFormData {
  email: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  phone?: string;
  department?: string;
  position?: string;
  role: UserRole;
  custom_role_id?: number;
  is_active: boolean;
  hire_date?: string;
  notes?: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    first_name: "",
    last_name: "",
    document_type: DocumentType.CEDULA,
    document_number: "",
    phone: "",
    department: "",
    position: "",
    role: UserRole.EMPLOYEE,
    custom_role_id: undefined,
    is_active: true,
    hire_date: "",
    notes: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    fetchUsers();
    fetchCustomRoles();
    fetchCargos();
  }, [page, rowsPerPage, searchTerm]);

  const fetchCustomRoles = async () => {
    try {
      const response = await api.get("/permissions/roles/");
      setCustomRoles(response.data || []);
    } catch (error) {
      console.error("Error fetching custom roles:", error);
    }
  };

  const fetchCargos = async () => {
    try {
      const response = await api.get('/admin/config/cargos/active');
      setCargos(response.data || []);
    } catch (error) {
      console.error('Error fetching cargos:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/", {
        params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: searchTerm || undefined,
        },
      });
      setUsers(response.data.items || []);
      setTotalUsers(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setTotalUsers(0);
      showSnackbar("Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      first_name: "",
      last_name: "",
      document_type: DocumentType.CEDULA,
      document_number: "",
      phone: "",
      department: "",
      position: "",
      role: UserRole.EMPLOYEE,
      custom_role_id: undefined,
      is_active: true,
      hire_date: "",
      notes: "",
    });
    setOpenDialog(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      document_type: user.document_type || DocumentType.CEDULA,
      document_number: user.document_number || "",
      phone: user.phone || "",
      department: user.department || "",
      position: user.position || "",
      role: user.role,
      custom_role_id: (user as any).custom_role_id || undefined,
      is_active: user.is_active,
      hire_date: user.hire_date ? new Date(user.hire_date).toISOString().split('T')[0] : "",
      notes: user.notes || "",
    });
    setOpenDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      // Validaciones básicas
      if (!formData.email || !formData.first_name || !formData.last_name || !formData.position) {
        showSnackbar("Por favor complete todos los campos obligatorios (incluyendo el cargo)", "error");
        return;
      }

      // Removed password validation - users will register themselves later

      // Preparar datos según el schema del backend
      const userData: any = {
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        document_type: formData.document_type,
        document_number: formData.document_number.trim(),
        phone: formData.phone?.trim() || null,
        department: formData.department?.trim() || null,
        position: formData.position?.trim() || null,
        role: formData.role,
        custom_role_id: formData.custom_role_id || null,
        notes: formData.notes?.trim() || null,
        hire_date: formData.hire_date ? new Date(formData.hire_date).toISOString() : null,
      };

      if (editingUser) {
        // Para actualización, incluir is_active
        userData.is_active = formData.is_active;
      }

      if (editingUser) {
        // Actualizar usuario existente
        await api.put(`/users/${editingUser.id}`, userData);
        showSnackbar("Usuario actualizado exitosamente", "success");
      } else {
        // Crear nuevo usuario
        await api.post("/users/", userData);
        showSnackbar("Usuario creado exitosamente", "success");
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error saving user:", error);
      let errorMessage = "Error al guardar usuario";
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg || err.message).join(", ");
        } else {
          errorMessage = error.response.data.detail;
        }
      }
      
      showSnackbar(errorMessage, "error");
    }
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (deletingUser) {
      try {
        await api.delete(`/users/${deletingUser.id}`);
        showSnackbar("Usuario eliminado exitosamente", "success");
        fetchUsers();
        setOpenDeleteDialog(false);
        setDeletingUser(null);
      } catch (error) {
        console.error("Error deleting user:", error);
        showSnackbar("Error al eliminar usuario", "error");
      }
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "error";
      case UserRole.TRAINER:
        return "warning";
      case UserRole.EMPLOYEE:
        return "primary";
      case UserRole.SUPERVISOR:
        return "info";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Administrador";
      case UserRole.TRAINER:
        return "Entrenador";
      case UserRole.EMPLOYEE:
        return "Empleado";
      case UserRole.SUPERVISOR:
        return "Supervisor";
      default:
        return role;
    }
  };

  const getDocumentTypeLabel = (documentType: string) => {
    switch (documentType) {
      case DocumentType.CEDULA:
        return "CC";
      case DocumentType.PASSPORT:
        return "PP";
      case DocumentType.OTHER:
        return "Otro";
      case DocumentType.SPECIAL_PERMIT:
        return "PEP";
      default:
        return documentType?.toUpperCase() || "CC";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Usuarios
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
      >
        <TextField
          placeholder="Buscar usuarios..."
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
          onClick={handleCreateUser}
        >
          Nuevo Usuario
        </Button>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchUsers}>
          Actualizar
        </Button>
      </Box>

      {/* Tabla de usuarios */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Rol Personalizado</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : !users || users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    {user.full_name || `${user.first_name} ${user.last_name}`}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {getDocumentTypeLabel(user.document_type)} {user.document_number || 'N/A'}
                  </TableCell>
                  <TableCell>{user.department || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleLabel(user.role)}
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {(user as any).custom_role ? (
                      <Chip
                        label={(user as any).custom_role.display_name}
                        color="secondary"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin rol personalizado
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? "Activo" : "Inactivo"}
                      color={user.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => handleEditUser(user)}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteUser(user)}
                      size="small"
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
          count={totalUsers}
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

      {/* Dialog para crear/editar usuario */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {/* Información de identificación */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Información de Identificación</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Tipo Documento</InputLabel>
                <Select
                  value={formData.document_type}
                  onChange={(e) =>
                    setFormData({ ...formData, document_type: e.target.value })
                  }
                  label="Tipo Documento"
                >
                  <MenuItem value={DocumentType.CEDULA}>Cédula de Ciudadanía</MenuItem>
                  <MenuItem value={DocumentType.PASSPORT}>Pasaporte</MenuItem>
                  <MenuItem value={DocumentType.OTHER}>Otro</MenuItem>
                  <MenuItem value={DocumentType.SPECIAL_PERMIT}>Permiso Especial de Permanencia</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Número de Documento"
                value={formData.document_number}
                onChange={(e) =>
                  setFormData({ ...formData, document_number: e.target.value })
                }
                fullWidth
                required
              />
            </Box>
            
            {/* Información básica */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Información Básica</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Nombre"
                value={formData.first_name}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    first_name: e.target.value
                  });
                }}
                fullWidth
                required
              />
              <TextField
                label="Apellido"
                value={formData.last_name}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    last_name: e.target.value
                  });
                }}
                fullWidth
                required
              />
            </Box>
            
            {/* Información de contacto */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Información de Contacto</Typography>
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
            <TextField
              label="Teléfono"
              value={formData.phone || ''}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              fullWidth
            />
            
            {/* Información laboral */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Información Laboral</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Departamento"
                value={formData.department || ''}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel>Cargo</InputLabel>
                <Select
                  value={formData.position || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  label="Cargo"
                >
                  {cargos.map((cargo) => (
                    <MenuItem key={cargo.id} value={cargo.nombre_cargo}>
                      {cargo.nombre_cargo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Fecha de Contratación"
              type="date"
              value={formData.hire_date || ''}
              onChange={(e) =>
                setFormData({ ...formData, hire_date: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            
            {/* Configuración del sistema */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Configuración del Sistema</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Rol del Sistema</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      role: e.target.value as UserRole
                    });
                  }}
                  label="Rol del Sistema"
                >
                  <MenuItem value={UserRole.EMPLOYEE}>Empleado</MenuItem>
                  <MenuItem value={UserRole.TRAINER}>Entrenador</MenuItem>
                  <MenuItem value={UserRole.SUPERVISOR}>Supervisor</MenuItem>
                  <MenuItem value={UserRole.ADMIN}>Administrador</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Rol Personalizado</InputLabel>
                <Select
                  value={formData.custom_role_id || ""}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      custom_role_id: e.target.value ? Number(e.target.value) : undefined
                    });
                  }}
                  label="Rol Personalizado"
                >
                  <MenuItem value="">
                    <em>Sin rol personalizado</em>
                  </MenuItem>
                  {customRoles
                    .filter(role => role.is_active)
                    .map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.display_name}
                        {role.is_system_role && " (Sistema)"}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
            
            <Alert severity="info" sx={{ mt: 1 }}>
              El rol personalizado tiene prioridad sobre el rol del sistema para los permisos específicos.
            </Alert>
            

            
            <TextField
              label="Notas"
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
              helperText="Información adicional sobre el usuario"
            />
            
            {editingUser && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        is_active: e.target.checked
                      });
                    }}
                  />
                }
                label="Usuario activo"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {editingUser ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar usuario */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar al usuario "{deletingUser?.first_name} {deletingUser?.last_name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={confirmDeleteUser} variant="contained" color="error">
            Eliminar
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

export default UsersManagement;
