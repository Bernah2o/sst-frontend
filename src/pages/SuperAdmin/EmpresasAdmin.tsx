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
import {
  Add as AddIcon,
  Block as BlockIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import apiService from "../../services/api";

interface EmpresaPlataforma {
  id: number;
  nombre: string;
  nit?: string | null;
  razon_social?: string | null;
  email?: string | null;
  telefono?: string | null;
  activo: boolean;
  total_usuarios: number;
  total_trabajadores: number;
}

interface NuevaEmpresaForm {
  nombre: string;
  nit: string;
  razon_social: string;
  email: string;
  telefono: string;
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
      await apiService.post("/superadmin/empresas", {
        empresa: {
          nombre: form.nombre.trim(),
          nit: form.nit.trim() || null,
          razon_social: form.razon_social.trim() || null,
          email: form.email.trim() || null,
          telefono: form.telefono.trim() || null,
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Nueva Empresa
        </Button>
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
