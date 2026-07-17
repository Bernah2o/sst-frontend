/**
 * Panel de superadministración de la plataforma.
 * Gestión de empresas (tenants): listado con conteos, creación de empresa
 * con su primer administrador, y suspensión/activación.
 * Solo accesible para el rol superadmin.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconButton } from "@mui/material";
import {
  Add as AddIcon,
  AutoFixHigh as AutoFixHighIcon,
  Block as BlockIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LockOpen as LockOpenIcon,
  PersonAdd as PersonAddIcon,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";
import { MenuItem } from "@mui/material";
import apiService from "../../services/api";

interface EmpresaPlataforma {
  id: number;
  nombre: string;
  nit?: string | null;
  razon_social?: string | null;
  email?: string | null;
  telefono?: string | null;
  num_trabajadores?: number | null;
  nivel_riesgo?: string | null;
  activo: boolean;
  total_usuarios: number;
  total_trabajadores: number;
}

interface AprovisionamientoResumen {
  grupo?: string | null;
  creado: string[];
  omitido: string[];
}

const NIVELES_RIESGO = ["I", "II", "III", "IV", "V"];

// Espejo de determinar_grupo() del backend (Res. 0312/2019)
const calcularGrupo = (num: number | null, riesgo: string): string | null => {
  if (riesgo === "IV" || riesgo === "V") return "GRUPO_60";
  if (!num || !riesgo) return null;
  return num <= 10 ? "GRUPO_7" : num <= 50 ? "GRUPO_21" : "GRUPO_60";
};

const etiquetaGrupo = (grupo: string | null): string =>
  grupo
    ? `Grupo de ${grupo.split("_")[1]} estándares mínimos (Res. 0312/2019)`
    : "";

interface UsuarioBloqueado {
  id: number;
  email: string;
  full_name: string;
  role: string;
  empresa_id?: number | null;
  empresa_nombre?: string | null;
  failed_login_attempts: number;
  last_failed_login?: string | null;
}

interface NuevaEmpresaForm {
  nombre: string;
  nit: string;
  razon_social: string;
  email: string;
  telefono: string;
  num_trabajadores: string;
  nivel_riesgo: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_document_number: string;
  admin_password: string;
}

const FORM_INICIAL: NuevaEmpresaForm = {
  nombre: "",
  nit: "",
  razon_social: "",
  email: "",
  telefono: "",
  num_trabajadores: "",
  nivel_riesgo: "",
  admin_first_name: "",
  admin_last_name: "",
  admin_email: "",
  admin_document_number: "",
  admin_password: "",
};

const EmpresasAdmin: React.FC = () => {
  const [empresas, setEmpresas] = useState<EmpresaPlataforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NuevaEmpresaForm>(FORM_INICIAL);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<EmpresaPlataforma | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    nit: "",
    razon_social: "",
    email: "",
    telefono: "",
    num_trabajadores: "",
    nivel_riesgo: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<EmpresaPlataforma | null>(null);
  const [adminTarget, setAdminTarget] = useState<EmpresaPlataforma | null>(null);
  const [bloqueadosOpen, setBloqueadosOpen] = useState(false);
  const [bloqueados, setBloqueados] = useState<UsuarioBloqueado[]>([]);
  const [loadingBloqueados, setLoadingBloqueados] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ email: "", new_password: "" });
  const [resumenAprov, setResumenAprov] = useState<{
    titulo: string;
    resumen: AprovisionamientoResumen;
  } | null>(null);
  const [adminForm, setAdminForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    document_number: "",
    password: "",
  });
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  const cargarEmpresas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.get("/superadmin/empresas");
      setEmpresas(response.data);
    } catch (error: any) {
      setSnackbar({
        message:
          error?.response?.data?.detail || "Error cargando las empresas",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEmpresas();
  }, [cargarEmpresas]);

  const handleFormChange =
    (field: keyof NuevaEmpresaForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const formValido =
    form.nombre.trim() &&
    form.admin_first_name.trim() &&
    form.admin_last_name.trim() &&
    form.admin_email.trim() &&
    form.admin_document_number.trim() &&
    form.admin_password.length >= 8;

  const crearEmpresa = async () => {
    setSaving(true);
    try {
      const response = await apiService.post("/superadmin/empresas", {
        empresa: {
          nombre: form.nombre.trim(),
          nit: form.nit.trim() || null,
          razon_social: form.razon_social.trim() || null,
          email: form.email.trim() || null,
          telefono: form.telefono.trim() || null,
          num_trabajadores: form.num_trabajadores
            ? parseInt(form.num_trabajadores, 10)
            : null,
          nivel_riesgo: form.nivel_riesgo || null,
        },
        admin: {
          first_name: form.admin_first_name.trim(),
          last_name: form.admin_last_name.trim(),
          email: form.admin_email.trim(),
          document_number: form.admin_document_number.trim(),
          password: form.admin_password,
        },
      });
      setSnackbar({
        message: `Empresa "${form.nombre}" creada con su administrador`,
        severity: "success",
      });
      setDialogOpen(false);
      if (response.data?.aprovisionamiento) {
        setResumenAprov({
          titulo: `Aprovisionamiento SST — ${form.nombre}`,
          resumen: response.data.aprovisionamiento,
        });
      }
      setForm(FORM_INICIAL);
      cargarEmpresas();
    } catch (error: any) {
      setSnackbar({
        message:
          error?.response?.data?.detail || "Error creando la empresa",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const abrirEditar = (empresa: EmpresaPlataforma) => {
    setEditForm({
      nombre: empresa.nombre || "",
      nit: empresa.nit || "",
      razon_social: empresa.razon_social || "",
      email: empresa.email || "",
      telefono: empresa.telefono || "",
      num_trabajadores: empresa.num_trabajadores
        ? String(empresa.num_trabajadores)
        : "",
      nivel_riesgo: empresa.nivel_riesgo || "",
    });
    setEditTarget(empresa);
  };

  const guardarEdicion = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await apiService.put(`/empresas/${editTarget.id}`, {
        nombre: editForm.nombre.trim(),
        nit: editForm.nit.trim() || null,
        razon_social: editForm.razon_social.trim() || null,
        email: editForm.email.trim() || null,
        telefono: editForm.telefono.trim() || null,
        num_trabajadores: editForm.num_trabajadores
          ? parseInt(editForm.num_trabajadores, 10)
          : null,
        nivel_riesgo: editForm.nivel_riesgo || null,
      });
      setSnackbar({
        message: `Empresa "${editForm.nombre}" actualizada`,
        severity: "success",
      });
      setEditTarget(null);
      cargarEmpresas();
    } catch (error: any) {
      setSnackbar({
        message:
          error?.response?.data?.detail || "Error actualizando la empresa",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const eliminarEmpresa = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiService.delete(`/empresas/${deleteTarget.id}`);
      setSnackbar({
        message: `Empresa "${deleteTarget.nombre}" eliminada`,
        severity: "success",
      });
      setDeleteTarget(null);
      cargarEmpresas();
    } catch (error: any) {
      setSnackbar({
        message:
          error?.response?.data?.detail || "Error eliminando la empresa",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const adminFormValido =
    adminForm.first_name.trim() &&
    adminForm.last_name.trim() &&
    adminForm.email.trim() &&
    adminForm.document_number.trim() &&
    adminForm.password.length >= 8;

  const crearAdmin = async () => {
    if (!adminTarget) return;
    setSaving(true);
    try {
      await apiService.post(`/superadmin/empresas/${adminTarget.id}/admins`, {
        first_name: adminForm.first_name.trim(),
        last_name: adminForm.last_name.trim(),
        email: adminForm.email.trim(),
        document_number: adminForm.document_number.trim(),
        password: adminForm.password,
      });
      setSnackbar({
        message: `Administrador ${adminForm.email} creado para "${adminTarget.nombre}"`,
        severity: "success",
      });
      setAdminTarget(null);
      setAdminForm({
        first_name: "",
        last_name: "",
        email: "",
        document_number: "",
        password: "",
      });
      cargarEmpresas();
    } catch (error: any) {
      setSnackbar({
        message:
          error?.response?.data?.detail || "Error creando el administrador",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const cargarBloqueados = useCallback(async () => {
    setLoadingBloqueados(true);
    try {
      const response = await apiService.get("/superadmin/usuarios-bloqueados");
      setBloqueados(response.data);
    } catch (error: any) {
      setSnackbar({
        message:
          error?.response?.data?.detail ||
          "Error cargando los usuarios bloqueados",
        severity: "error",
      });
    } finally {
      setLoadingBloqueados(false);
    }
  }, []);

  const abrirBloqueados = () => {
    setBloqueadosOpen(true);
    cargarBloqueados();
  };

  const desbloquearUsuario = async (usuario: UsuarioBloqueado) => {
    try {
      const response = await apiService.post(
        `/superadmin/usuarios/${usuario.id}/desbloquear`,
        {},
      );
      setSnackbar({
        message: response.data?.message || `Cuenta de ${usuario.email} desbloqueada`,
        severity: "success",
      });
      cargarBloqueados();
    } catch (error: any) {
      setSnackbar({
        message:
          error?.response?.data?.detail || "Error desbloqueando la cuenta",
        severity: "error",
      });
    }
  };

  const aprovisionarEmpresa = async (empresa: EmpresaPlataforma) => {
    try {
      const response = await apiService.post(
        `/superadmin/empresas/${empresa.id}/aprovisionar`,
        {},
      );
      setResumenAprov({
        titulo: `Aprovisionamiento SST — ${empresa.nombre}`,
        resumen: response.data,
      });
    } catch (error: any) {
      setSnackbar({
        message:
          error?.response?.data?.detail ||
          "Error aprovisionando los instrumentos SST",
        severity: "error",
      });
    }
  };

  const abrirReset = (email: string = "") => {
    setResetForm({ email, new_password: "" });
    setResetOpen(true);
  };

  const resetearPassword = async () => {
    setSaving(true);
    try {
      const response = await apiService.post("/superadmin/usuarios/reset-password", {
        email: resetForm.email.trim(),
        new_password: resetForm.new_password,
      });
      setSnackbar({
        message: response.data?.message || "Contraseña reseteada",
        severity: "success",
      });
      setResetOpen(false);
      setResetForm({ email: "", new_password: "" });
      if (bloqueadosOpen) cargarBloqueados();
    } catch (error: any) {
      setSnackbar({
        message:
          error?.response?.data?.detail || "Error reseteando la contraseña",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (empresa: EmpresaPlataforma) => {
    const accion = empresa.activo ? "suspender" : "activar";
    try {
      await apiService.patch(`/superadmin/empresas/${empresa.id}/${accion}`, {});
      setSnackbar({
        message: `Empresa "${empresa.nombre}" ${
          empresa.activo ? "suspendida" : "activada"
        }`,
        severity: "success",
      });
      cargarEmpresas();
    } catch (error: any) {
      setSnackbar({
        message:
          error?.response?.data?.detail ||
          `Error al ${accion} la empresa`,
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BusinessIcon color="primary" fontSize="large" />
          <Typography variant="h4">Empresas de la Plataforma</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<VpnKeyIcon />}
            onClick={() => abrirReset()}
          >
            Resetear Contraseña
          </Button>
          <Button
            variant="outlined"
            startIcon={<LockOpenIcon />}
            onClick={abrirBloqueados}
          >
            Usuarios Bloqueados
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Nueva Empresa
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empresa</TableCell>
                <TableCell>NIT</TableCell>
                <TableCell align="center">Usuarios</TableCell>
                <TableCell align="center">Trabajadores</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empresas.map((empresa) => (
                <TableRow key={empresa.id} hover>
                  <TableCell>
                    <Typography variant="body1">{empresa.nombre}</Typography>
                    {empresa.razon_social && (
                      <Typography variant="caption" color="text.secondary">
                        {empresa.razon_social}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{empresa.nit || "—"}</TableCell>
                  <TableCell align="center">{empresa.total_usuarios}</TableCell>
                  <TableCell align="center">
                    {empresa.total_trabajadores}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={empresa.activo ? "Activa" : "Suspendida"}
                      color={empresa.activo ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar datos de la empresa">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => abrirEditar(empresa)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Agregar administrador a esta empresa">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setAdminTarget(empresa)}
                      >
                        <PersonAddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Aprovisionar instrumentos SST (encuestas, plan anual, autoevaluación) según su grupo de estándares">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => aprovisionarEmpresa(empresa)}
                      >
                        <AutoFixHighIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        empresa.activo
                          ? "Suspender empresa (sus usuarios pierden acceso)"
                          : "Reactivar empresa"
                      }
                    >
                      <Button
                        size="small"
                        color={empresa.activo ? "error" : "success"}
                        startIcon={
                          empresa.activo ? <BlockIcon /> : <CheckCircleIcon />
                        }
                        onClick={() => cambiarEstado(empresa)}
                      >
                        {empresa.activo ? "Suspender" : "Activar"}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Eliminar empresa (solo si no tiene datos)">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(empresa)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {empresas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay empresas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nueva Empresa</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
            Datos de la empresa
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nombre *"
                fullWidth
                value={form.nombre}
                onChange={handleFormChange("nombre")}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="NIT"
                fullWidth
                value={form.nit}
                onChange={handleFormChange("nit")}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Razón social"
                fullWidth
                value={form.razon_social}
                onChange={handleFormChange("razon_social")}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Email"
                fullWidth
                value={form.email}
                onChange={handleFormChange("email")}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Teléfono"
                fullWidth
                value={form.telefono}
                onChange={handleFormChange("telefono")}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Número de trabajadores"
                type="number"
                fullWidth
                value={form.num_trabajadores}
                onChange={handleFormChange("num_trabajadores")}
                helperText="Determina el grupo de estándares mínimos"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nivel de riesgo ARL"
                select
                fullWidth
                value={form.nivel_riesgo}
                onChange={handleFormChange("nivel_riesgo")}
              >
                {NIVELES_RIESGO.map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {calcularGrupo(
              form.num_trabajadores ? parseInt(form.num_trabajadores, 10) : null,
              form.nivel_riesgo,
            ) && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info">
                  {etiquetaGrupo(
                    calcularGrupo(
                      form.num_trabajadores
                        ? parseInt(form.num_trabajadores, 10)
                        : null,
                      form.nivel_riesgo,
                    ),
                  )}
                  {" — al crear la empresa se aprovisionarán automáticamente las encuestas, el plan de trabajo anual y la autoevaluación que le aplican."}
                </Alert>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Administrador inicial de la empresa
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nombres *"
                fullWidth
                value={form.admin_first_name}
                onChange={handleFormChange("admin_first_name")}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Apellidos *"
                fullWidth
                value={form.admin_last_name}
                onChange={handleFormChange("admin_last_name")}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email *"
                type="email"
                fullWidth
                value={form.admin_email}
                onChange={handleFormChange("admin_email")}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Número de documento *"
                fullWidth
                value={form.admin_document_number}
                onChange={handleFormChange("admin_document_number")}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Contraseña temporal *"
                type="password"
                fullWidth
                value={form.admin_password}
                onChange={handleFormChange("admin_password")}
                helperText="Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={crearEmpresa}
            disabled={!formValido || saving}
          >
            {saving ? <CircularProgress size={22} /> : "Crear Empresa"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de edición */}
      <Dialog
        open={!!editTarget}
        onClose={() => !saving && setEditTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Empresa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Nombre *"
                fullWidth
                value={editForm.nombre}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, nombre: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="NIT"
                fullWidth
                value={editForm.nit}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, nit: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Razón social"
                fullWidth
                value={editForm.razon_social}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, razon_social: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email"
                fullWidth
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Teléfono"
                fullWidth
                value={editForm.telefono}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, telefono: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Número de trabajadores"
                type="number"
                fullWidth
                value={editForm.num_trabajadores}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    num_trabajadores: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nivel de riesgo ARL"
                select
                fullWidth
                value={editForm.nivel_riesgo}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, nivel_riesgo: e.target.value }))
                }
              >
                {NIVELES_RIESGO.map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {calcularGrupo(
              editForm.num_trabajadores
                ? parseInt(editForm.num_trabajadores, 10)
                : null,
              editForm.nivel_riesgo,
            ) && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info">
                  {etiquetaGrupo(
                    calcularGrupo(
                      editForm.num_trabajadores
                        ? parseInt(editForm.num_trabajadores, 10)
                        : null,
                      editForm.nivel_riesgo,
                    ),
                  )}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={guardarEdicion}
            disabled={!editForm.nombre.trim() || saving}
          >
            {saving ? <CircularProgress size={22} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar administrador */}
      <Dialog
        open={!!adminTarget}
        onClose={() => !saving && setAdminTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Agregar Administrador — {adminTarget?.nombre}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nombres *"
                fullWidth
                value={adminForm.first_name}
                onChange={(e) =>
                  setAdminForm((p) => ({ ...p, first_name: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Apellidos *"
                fullWidth
                value={adminForm.last_name}
                onChange={(e) =>
                  setAdminForm((p) => ({ ...p, last_name: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email *"
                type="email"
                fullWidth
                value={adminForm.email}
                onChange={(e) =>
                  setAdminForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Número de documento *"
                fullWidth
                value={adminForm.document_number}
                onChange={(e) =>
                  setAdminForm((p) => ({
                    ...p,
                    document_number: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Contraseña temporal *"
                type="password"
                fullWidth
                value={adminForm.password}
                onChange={(e) =>
                  setAdminForm((p) => ({ ...p, password: e.target.value }))
                }
                helperText="Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminTarget(null)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={crearAdmin}
            disabled={!adminFormValido || saving}
          >
            {saving ? <CircularProgress size={22} /> : "Crear Administrador"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Usuarios bloqueados por intentos fallidos */}
      <Dialog
        open={bloqueadosOpen}
        onClose={() => setBloqueadosOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Usuarios Bloqueados</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cuentas bloqueadas por 3 o más intentos fallidos de inicio de
            sesión. Al desbloquear, el usuario podrá volver a intentar con su
            contraseña actual.
          </Typography>
          {loadingBloqueados ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : bloqueados.length === 0 ? (
            <Typography sx={{ py: 2 }} align="center">
              No hay usuarios bloqueados 🎉
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Empresa</TableCell>
                    <TableCell align="center">Intentos</TableCell>
                    <TableCell>Último intento fallido</TableCell>
                    <TableCell align="center">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bloqueados.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Typography variant="body2">{u.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {u.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{u.empresa_nombre || "—"}</TableCell>
                      <TableCell align="center">
                        {u.failed_login_attempts}
                      </TableCell>
                      <TableCell>
                        {u.last_failed_login
                          ? new Date(u.last_failed_login).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          color="success"
                          startIcon={<LockOpenIcon />}
                          onClick={() => desbloquearUsuario(u)}
                        >
                          Desbloquear
                        </Button>
                        <Tooltip title="Asignar contraseña nueva (además desbloquea)">
                          <Button
                            size="small"
                            startIcon={<VpnKeyIcon />}
                            onClick={() => abrirReset(u.email)}
                          >
                            Resetear clave
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBloqueadosOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Resumen de aprovisionamiento SST */}
      <Dialog
        open={!!resumenAprov}
        onClose={() => setResumenAprov(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{resumenAprov?.titulo}</DialogTitle>
        <DialogContent>
          {resumenAprov?.resumen.grupo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {etiquetaGrupo(resumenAprov.resumen.grupo)}
            </Alert>
          )}
          {(resumenAprov?.resumen.creado?.length ?? 0) > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Creado
              </Typography>
              <Box component="ul" sx={{ mt: 0, mb: 2, pl: 3 }}>
                {resumenAprov?.resumen.creado.map((item, i) => (
                  <li key={i}>
                    <Typography variant="body2">{item}</Typography>
                  </li>
                ))}
              </Box>
            </>
          )}
          {(resumenAprov?.resumen.omitido?.length ?? 0) > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Ya existía u omitido
              </Typography>
              <Box component="ul" sx={{ mt: 0, mb: 0, pl: 3 }}>
                {resumenAprov?.resumen.omitido.map((item, i) => (
                  <li key={i}>
                    <Typography variant="body2" color="text.secondary">
                      {item}
                    </Typography>
                  </li>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setResumenAprov(null)}>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset de contraseña */}
      <Dialog
        open={resetOpen}
        onClose={() => !saving && setResetOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Resetear Contraseña</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Asigna una contraseña temporal al usuario y desbloquea su cuenta.
            Indícale que la cambie al iniciar sesión.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Email del usuario *"
                type="email"
                fullWidth
                value={resetForm.email}
                onChange={(e) =>
                  setResetForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Contraseña temporal *"
                type="password"
                fullWidth
                value={resetForm.new_password}
                onChange={(e) =>
                  setResetForm((p) => ({ ...p, new_password: e.target.value }))
                }
                helperText="Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={resetearPassword}
            disabled={
              !resetForm.email.trim() ||
              resetForm.new_password.length < 8 ||
              saving
            }
          >
            {saving ? <CircularProgress size={22} /> : "Resetear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !saving && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar Empresa</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Seguro que deseas eliminar{" "}
            <strong>{deleteTarget?.nombre}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Solo se puede eliminar una empresa sin usuarios, trabajadores ni
            datos asociados. Si ya tiene información, usa "Suspender".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={eliminarEmpresa}
            disabled={saving}
          >
            {saving ? <CircularProgress size={22} /> : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={5000}
        onClose={() => setSnackbar(null)}
      >
        <Alert
          severity={snackbar?.severity || "success"}
          onClose={() => setSnackbar(null)}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmpresasAdmin;
