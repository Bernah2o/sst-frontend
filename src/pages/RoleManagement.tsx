import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  ExpandMore,
  Security,
  Group,
  Assignment,
  Notifications,
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
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormGroup,
  Divider,
} from "@mui/material";
import React, { useState, useEffect } from "react";

import UppercaseTextField from "../components/UppercaseTextField";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { formatDateTime } from "../utils/dateUtils";
// Remove unused import

// Interfaces
interface CustomRole {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: number;
  resource_type: string;
  action: string;
  description?: string;
  is_active: boolean;
}

interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  permission: Permission;
}

interface RoleFormData {
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  permission_ids: number[];
}

const RoleManagement: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [rolesPermissionsMap, setRolesPermissionsMap] = useState<Record<number, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    display_name: "",
    description: "",
    is_active: true,
    permission_ids: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<CustomRole | null>(null);
  const [notifyingUsers, setNotifyingUsers] = useState(false);

  // Mapeo de nombres amigables para recursos/páginas
  const resourceNames: Record<string, string> = {
    user: "👤 Usuarios",
    course: "📚 Cursos",
    modules: "📖 Módulos de Cursos",
    materials: "📄 Materiales de Cursos",
    evaluation: "📝 Evaluaciones",
    survey: "📊 Encuestas",
    certificate: "🏆 Certificados",
    attendance: "📅 Asistencia",
    report: "📈 Reportes",
    notification: "🔔 Notificaciones",
    worker: "👷 Trabajadores",
    reinduction: "🔄 Reinducciones",
    admin_config: "⚙️ Configuración Administrativa",
    seguimiento: "🏥 Seguimiento de Salud",
    role: "🔐 Gestión de Roles",
    file: "📁 Gestión de Archivos",
    dashboard: "📊 Panel de Control",
    profile: "👤 Perfil de Usuario",
    audit: "🔍 Auditoría",
    absenteeism: "📉 Ausentismo",
    enrollment: "📝 Inscripciones",
    occupational_exam: "🩺 Exámenes Ocupacionales",
    progress: "📈 Progreso de Usuarios"
  };

  // Agrupar permisos por recurso
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource_type]) {
      acc[permission.resource_type] = [];
    }
    acc[permission.resource_type].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Agrupar permisos por recurso para mostrar en acordeones

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (roles.length > 0) {
      fetchAllRolePermissions();
    }
  }, [roles]);

  const fetchRoles = async () => {
    try {
      const response = await api.get("/permissions/roles/");
      setRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      showSnackbar("Error al cargar los roles", "error");
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get("/permissions/?is_active=true&limit=500");
      setPermissions(response.data);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      showSnackbar("Error al cargar los permisos", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRolePermissions = async () => {
    try {
      const permissionsMap: Record<number, Permission[]> = {};
      
      for (const role of roles) {
        try {
          const response = await api.get(`/permissions/roles/${role.id}/permissions/`);
          permissionsMap[role.id] = response.data;
        } catch (error) {
          console.warn(`Error fetching permissions for role ${role.id}:`, error);
          permissionsMap[role.id] = [];
        }
      }
      
      setRolesPermissionsMap(permissionsMap);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
    }
  };

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      view: <Search sx={{ fontSize: 16, color: 'primary.main' }} />,
      create: <Add sx={{ fontSize: 16, color: 'success.main' }} />,
      read: <Search sx={{ fontSize: 16, color: 'info.main' }} />,
      update: <Edit sx={{ fontSize: 16, color: 'warning.main' }} />,
      delete: <Delete sx={{ fontSize: 16, color: 'error.main' }} />,
      enroll: <Assignment sx={{ fontSize: 16, color: 'secondary.main' }} />,
      submit: <Assignment sx={{ fontSize: 16, color: 'secondary.main' }} />,
      download: <Assignment sx={{ fontSize: 16, color: 'info.main' }} />,
      assign_permissions: <Security sx={{ fontSize: 16, color: 'primary.main' }} />,
      export: <Assignment sx={{ fontSize: 16, color: 'info.main' }} />
    };
    return iconMap[action] || <Assignment sx={{ fontSize: 16, color: 'grey.500' }} />;
  };

  const renderPermissionIcons = (roleId: number) => {
    const rolePerms = rolesPermissionsMap[roleId] || [];
    const actionsSet = new Set(rolePerms.map(p => p.action));
    const uniqueActions = Array.from(actionsSet);
    
    if (uniqueActions.length === 0) {
      return <Typography variant="caption" color="text.secondary">Sin permisos</Typography>;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 120 }}>
        {uniqueActions.slice(0, 6).map((action, index) => (
          <Box
            key={action}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: 'grey.100',
              border: '1px solid',
              borderColor: 'grey.300'
            }}
            title={`Permiso: ${action}`}
          >
            {getActionIcon(action)}
          </Box>
        ))}
        {uniqueActions.length > 6 && (
          <Typography variant="caption" color="text.secondary">
            +{uniqueActions.length - 6}
          </Typography>
        )}
      </Box>
    );
  };



  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleNotifyUsers = async () => {
    setNotifyingUsers(true);
    try {
      // Disparar evento personalizado para mostrar notificación local
      window.dispatchEvent(new CustomEvent('permission-update'));
      
      // Opcional: También enviar notificación por API si el endpoint existe
      try {
        await api.post('/notifications/broadcast', {
          title: 'Actualización de Permisos',
          message: 'Se han actualizado los permisos del sistema. Por favor, actualiza tu sesión para aplicar los cambios.',
          type: 'info',
          target_roles: ['supervisor', 'trainer', 'employee']
        });
      } catch (apiError) {
        // API de notificaciones no disponible, usando notificación local
      }
      
      showSnackbar('Los usuarios han sido notificados para refrescar sus permisos', 'success');
    } catch (error) {
      console.error('Error al notificar usuarios:', error);
      showSnackbar('Error al notificar a los usuarios', 'error');
    } finally {
      setNotifyingUsers(false);
    }
  };

  const handleOpenDialog = async (role?: CustomRole) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || "",
        is_active: role.is_active,
        permission_ids: [],
      });
      // Cargar permisos existentes del rol
      try {
        const response = await api.get(`/permissions/roles/${role.id}/permissions/`);
        const existingPermissions = response.data;
        setRolePermissions(existingPermissions);
        
        // Establecer los permission_ids existentes en el formulario
        const existingPermissionIds = existingPermissions.map((permission: Permission) => permission.id);
        setFormData(prev => ({
          ...prev,
          permission_ids: existingPermissionIds
        }));
      } catch (error) {
        console.error("Error fetching role permissions:", error);
      }
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        display_name: "",
        description: "",
        is_active: true,
        permission_ids: [],
      });
      setRolePermissions([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
    setRolePermissions([]);
  };

  const handleSubmit = async () => {
    try {
      if (editingRole) {
        await api.put(`/permissions/roles/${editingRole.id}`, {
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description,
          is_active: formData.is_active,
        });

        // Primero eliminar todos los permisos existentes del rol
        try {
          await api.delete(`/permissions/roles/${editingRole.id}/permissions/`);
        } catch (error) {
          console.warn("No existing permissions to remove or error removing:", error);
        }

        // Luego asignar los nuevos permisos seleccionados
        if (formData.permission_ids.length > 0) {
          await api.post(`/permissions/roles/${editingRole.id}/bulk-assign-permissions`, {
            permission_ids: formData.permission_ids,
          });
        }

        showSnackbar("Rol actualizado exitosamente", "success");
      } else {
        const response = await api.post("/permissions/roles/", {
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description,
          is_active: formData.is_active,
        });

        // Asignar permisos al nuevo rol usando el endpoint correcto
        if (formData.permission_ids.length > 0) {
          await api.post(`/permissions/roles/${response.data.id}/bulk-assign-permissions`, {
            permission_ids: formData.permission_ids,
          });
        }

        showSnackbar("Rol creado exitosamente", "success");
      }
      handleCloseDialog();
      fetchRoles();
    } catch (error: any) {
      console.error("Error saving role:", error);
      showSnackbar(
        error.response?.data?.detail || "Error al guardar el rol",
        "error"
      );
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      await api.delete(`/permissions/roles/${roleToDelete.id}`);
      showSnackbar("Rol eliminado exitosamente", "success");
      fetchRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      showSnackbar(
        error.response?.data?.detail || "Error al eliminar el rol",
        "error"
      );
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: checked
        ? [...prev.permission_ids, permissionId]
        : prev.permission_ids.filter((id) => id !== permissionId),
    }));
  };

  const isPermissionSelected = (permissionId: number) => {
    return formData.permission_ids.includes(permissionId);
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRoles = filteredRoles.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <Security sx={{ mr: 1, verticalAlign: "middle" }} />
            Gestión de Roles Personalizados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crea y gestiona roles personalizados con permisos específicos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          disabled={user?.role !== "admin"}
        >
          Crear Rol
        </Button>
      </Box>

      {/* Ejemplo de permisos granulares */}
      <Card
        sx={{
          mb: 3,
          bgcolor: "primary.50",
          border: "1px solid",
          borderColor: "primary.200",
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            💡 Sistema de Permisos Granulares por Página/Módulo
          </Typography>
          <Typography variant="body2" paragraph>
            Ahora puedes asignar permisos específicos por página y acción. Ejemplos:
          </Typography>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Box sx={{ flex: 1, minWidth: "300px" }}>
              <Typography variant="subtitle2" gutterBottom>
                📝 Evaluaciones - Permisos Granulares:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li><strong>VIEW:</strong> Acceder a la página de evaluaciones</li>
                <li><strong>READ:</strong> Ver evaluaciones existentes</li>
                <li><strong>submit:</strong> Responder/completar evaluaciones</li>
                <li><strong>create:</strong> Crear nuevas evaluaciones</li>
                <li><strong>update:</strong> Modificar evaluaciones</li>
                <li><strong>delete:</strong> Eliminar evaluaciones</li>
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: "300px" }}>
              <Typography variant="subtitle2" gutterBottom>
                📚 Cursos - Control de Acceso:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li><strong>VIEW:</strong> Acceder a la página de cursos</li>
                <li><strong>read:</strong> Ver cursos disponibles</li>
                <li><strong>create:</strong> Crear nuevos cursos</li>
                <li><strong>update:</strong> Editar contenido de cursos</li>
                <li><strong>delete:</strong> Eliminar cursos</li>
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            ⚡ <strong>Nuevo:</strong> Cada página/módulo tiene permisos independientes para máximo control.
          </Typography>
        </CardContent>
      </Card>

      {/* Search and Actions */}
      <Box display="flex" gap={2} mb={3}>
        <UppercaseTextField
          placeholder="Buscar roles..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchRoles}>
          Actualizar
        </Button>
        <Button 
          variant="outlined" 
          color="info"
          startIcon={<Notifications />} 
          onClick={handleNotifyUsers}
          disabled={notifyingUsers || user?.role !== "admin"}
        >
          {notifyingUsers ? 'Notificando...' : 'Notificar Usuarios'}
        </Button>
      </Box>

      {/* Roles Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre del Rol</TableCell>
                <TableCell>Nombre Técnico</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha de Creación</TableCell>
                <TableCell align="center">Permisos</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRoles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {role.display_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {role.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {role.description || "Sin descripción"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={role.is_system_role ? "Sistema" : "Personalizado"}
                      color={role.is_system_role ? "default" : "primary"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={role.is_active ? "Activo" : "Inactivo"}
                      color={role.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDateTime(role.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {renderPermissionIcons(role.id)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(role)}
                      disabled={user?.role !== "admin"}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setRoleToDelete(role);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={user?.role !== "admin" || role.is_system_role}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredRoles.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>

      {/* Create/Edit Role Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Group sx={{ mr: 1 }} />
            {editingRole ? "Editar Rol" : "Crear Nuevo Rol"}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <UppercaseTextField
                fullWidth
                label="Nombre Técnico"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="empleado_avanzado"
                helperText="Nombre único sin espacios (ej: empleado_avanzado)"
              />
              <UppercaseTextField
                fullWidth
                label="Nombre para Mostrar"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                placeholder="Empleado Avanzado"
                helperText="Nombre que verán los usuarios"
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <UppercaseTextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe las responsabilidades y alcance de este rol..."
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                }
                label="Rol Activo"
              />
            </Box>

            {/* Permisos */}
            <Box sx={{ width: "100%", mt: 2 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                <Assignment sx={{ mr: 1, verticalAlign: "middle" }} />
                Permisos del Rol
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Selecciona los permisos que tendrá este rol:
              </Typography>

              {Object.entries(groupedPermissions).map(
                ([resource, resourcePermissions]) => (
                  <Accordion key={resource} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 'medium' }}
                      >
                        {resourceNames[resource] || resource.replace("_", " ")} (
                        {resourcePermissions.length} permisos)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormGroup>
                        {resourcePermissions.map((permission) => (
                          <FormControlLabel
                            key={permission.id}
                            control={
                              <Checkbox
                                checked={isPermissionSelected(permission.id)}
                                onChange={(e) =>
                                  handlePermissionChange(
                                    permission.id,
                                    e.target.checked
                                  )
                                }
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2">
                                  {permission.action
                                    .replace("_", " ")
                                    .toUpperCase()}
                                </Typography>
                                {permission.description && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {permission.description}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        ))}
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>
                )
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.display_name}
          >
            {editingRole ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el rol "
            {roleToDelete?.display_name}"? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleManagement;
