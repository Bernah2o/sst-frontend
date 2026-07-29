/**
 * Perfil SST de la empresa (tenant) para la Matriz Legal.
 *
 * Sustituye al antiguo CRUD de empresas: con multi-tenancy cada admin gestiona
 * únicamente su propia empresa (crear/eliminar empresas es del superadmin).
 * Esta es la única pantalla que expone Sector Económico, Código CIIU y las 17
 * características de riesgo, que son las que determinan qué normas legales
 * aplican a la empresa.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import matrizLegalService, {
  Empresa,
  SectorEconomicoSimple,
  getSeccionCIIU,
} from "../../services/matrizLegalService";

interface EmpresaPerfilFormData {
  sector_economico_id: number | "";
  codigo_ciiu: string;
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

const initialFormData: EmpresaPerfilFormData = {
  sector_economico_id: "",
  codigo_ciiu: "",
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

const caracteristicasConfig: { key: keyof EmpresaPerfilFormData; label: string }[] = [
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

const EmpresaPerfil: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [sectores, setSectores] = useState<SectorEconomicoSimple[]>([]);
  const [formData, setFormData] = useState<EmpresaPerfilFormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorCarga(null);
      const [empresaData, sectoresData] = await Promise.all([
        matrizLegalService.getMiEmpresa(),
        matrizLegalService.listSectoresActivos(),
      ]);
      setEmpresa(empresaData);
      setSectores(sectoresData);
      setFormData({
        sector_economico_id: empresaData.sector_economico_id ?? "",
        codigo_ciiu: empresaData.codigo_ciiu ?? "",
        tiene_trabajadores_independientes: empresaData.tiene_trabajadores_independientes,
        tiene_teletrabajo: empresaData.tiene_teletrabajo,
        tiene_trabajo_alturas: empresaData.tiene_trabajo_alturas,
        tiene_trabajo_espacios_confinados: empresaData.tiene_trabajo_espacios_confinados,
        tiene_trabajo_caliente: empresaData.tiene_trabajo_caliente,
        tiene_sustancias_quimicas: empresaData.tiene_sustancias_quimicas,
        tiene_radiaciones: empresaData.tiene_radiaciones,
        tiene_trabajo_nocturno: empresaData.tiene_trabajo_nocturno,
        tiene_menores_edad: empresaData.tiene_menores_edad,
        tiene_mujeres_embarazadas: empresaData.tiene_mujeres_embarazadas,
        tiene_conductores: empresaData.tiene_conductores,
        tiene_manipulacion_alimentos: empresaData.tiene_manipulacion_alimentos,
        tiene_maquinaria_pesada: empresaData.tiene_maquinaria_pesada,
        tiene_riesgo_electrico: empresaData.tiene_riesgo_electrico,
        tiene_riesgo_biologico: empresaData.tiene_riesgo_biologico,
        tiene_trabajo_excavaciones: empresaData.tiene_trabajo_excavaciones,
        tiene_trabajo_administrativo: empresaData.tiene_trabajo_administrativo,
      });
      setCambiosPendientes(false);
    } catch (error: unknown) {
      console.error("Error cargando el perfil de la empresa:", error);
      // El superadmin no tiene empresa propia: debe scoparse con el selector
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setErrorCarga(
          "Su usuario no tiene una empresa asociada. Si es superadministrador, " +
            "seleccione una empresa en el selector de la barra superior para " +
            "gestionar su perfil SST.",
        );
      } else {
        setErrorCarga("No se pudo cargar el perfil de la empresa.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckChange =
    (key: keyof EmpresaPerfilFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [key]: e.target.checked }));
      setCambiosPendientes(true);
    };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...formData,
        sector_economico_id:
          formData.sector_economico_id === "" ? null : formData.sector_economico_id,
        codigo_ciiu: formData.codigo_ciiu || null,
      };
      const actualizada = await matrizLegalService.updateMiEmpresa(
        payload as Partial<Empresa>,
      );
      setEmpresa(actualizada);
      setCambiosPendientes(false);
      enqueueSnackbar(
        "Perfil actualizado. Sincronice las normas para aplicar los cambios.",
        { variant: "success" },
      );
    } catch (error) {
      console.error("Error guardando el perfil:", error);
      enqueueSnackbar("Error al guardar el perfil", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSincronizar = async () => {
    if (!empresa) return;
    try {
      setSincronizando(true);
      const res = await matrizLegalService.sincronizarNormasEmpresa(empresa.id);
      enqueueSnackbar(res.message || "Normas sincronizadas", { variant: "success" });
    } catch (error) {
      console.error("Error sincronizando normas:", error);
      enqueueSnackbar("Error al sincronizar normas", { variant: "error" });
    } finally {
      setSincronizando(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (errorCarga || !empresa) {
    return (
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Perfil de la Empresa
        </Typography>
        <Alert severity="info">{errorCarga}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Perfil de la Empresa
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Estos datos determinan qué normas legales aplican a su empresa en la
        Matriz Legal.
      </Typography>

      {/* Datos de identificación: los gestiona el superadministrador */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Identificación
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nombre"
                fullWidth
                value={empresa.nombre}
                InputProps={{ readOnly: true }}
                helperText="Gestionado por el superadministrador"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="NIT"
                fullWidth
                value={empresa.nit || "—"}
                InputProps={{ readOnly: true }}
                helperText="Gestionado por el superadministrador"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Actividad económica */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Actividad Económica
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Sector Económico"
                fullWidth
                value={formData.sector_economico_id}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    sector_economico_id: e.target.value as number | "",
                  });
                  setCambiosPendientes(true);
                }}
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
              <TextField
                label="Código CIIU principal"
                fullWidth
                value={formData.codigo_ciiu}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    codigo_ciiu: e.target.value.replace(/\D/g, "").slice(0, 4),
                  });
                  setCambiosPendientes(true);
                }}
                placeholder="Ej: 4111"
                helperText={
                  formData.codigo_ciiu.length >= 2
                    ? (() => {
                        const seccion = getSeccionCIIU(formData.codigo_ciiu);
                        return seccion
                          ? `Sección ${seccion.letra} — ${seccion.nombre}`
                          : "División CIIU no reconocida";
                      })()
                    : "Actividad económica principal según el RUT (2-4 dígitos)"
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Características de Riesgo */}
      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" color="primary">
            Características y Riesgos
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="textSecondary" paragraph>
            Seleccione las características que aplican a la empresa. Esto
            determinará automáticamente qué normas legales debe cumplir.
          </Typography>
          <Grid container spacing={1}>
            {caracteristicasConfig.map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!formData[item.key]}
                      onChange={handleCheckChange(item.key)}
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

      {cambiosPendientes && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Tiene cambios sin guardar. Al guardar, sincronice las normas para que
          la matriz refleje el nuevo perfil.
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={handleSincronizar}
            disabled={sincronizando || saving}
          >
            {sincronizando ? "Sincronizando..." : "Sincronizar Normas"}
          </Button>
        </Box>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
          Sincronizar recalcula qué normas aplican a la empresa y crea los
          registros de cumplimiento pendientes que falten.
        </Typography>
      </Paper>
    </Box>
  );
};

export default EmpresaPerfil;
