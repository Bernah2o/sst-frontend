import {
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  MedicalServices,
  School,
  Cake,
  Refresh,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import React, { useState, useEffect, useCallback } from "react";

import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

interface SchedulerStatus {
  key: string;
  name: string;
  description: string;
  schedule: string;
  is_enabled: boolean;
  updated_at: string | null;
  updated_by: number | null;
}

interface SchedulersResponse {
  schedulers: SchedulerStatus[];
}

// Iconos para cada scheduler
const getSchedulerIcon = (key: string) => {
  switch (key) {
    case "exam_notifications_enabled":
      return <MedicalServices />;
    case "reinduction_scheduler_enabled":
      return <Refresh />;
    case "birthday_scheduler_enabled":
      return <Cake />;
    case "course_reminder_scheduler_enabled":
      return <School />;
    default:
      return <ScheduleIcon />;
  }
};

const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [schedulers, setSchedulers] = useState<SchedulerStatus[]>([]);

  const fetchSchedulers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/admin/notifications/settings/schedulers");
      const data = response.data as SchedulersResponse;
      setSchedulers(data.schedulers);
    } catch (err: any) {
      console.error("Error fetching schedulers:", err);
      setError(err.response?.data?.detail || "Error al cargar la configuración de schedulers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedulers();
  }, [fetchSchedulers]);

  const handleToggleScheduler = async (key: string, enabled: boolean) => {
    try {
      setSavingKey(key);
      setError(null);
      setSuccess(null);

      const response = await api.put(`/admin/notifications/settings/schedulers/${key}?enabled=${enabled}`);

      // Actualizar el estado local
      setSchedulers(prev =>
        prev.map(s => s.key === key ? { ...s, is_enabled: enabled, updated_at: new Date().toISOString() } : s)
      );
      setSuccess(response.data.message);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error toggling scheduler:", err);
      setError(err.response?.data?.detail || "Error al actualizar el scheduler");
    } finally {
      setSavingKey(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca modificado";
    return new Date(dateString).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (user?.role !== "admin") {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta página.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 32, mr: 2, color: "primary.main" }} />
        <Box>
          <Typography variant="h4" component="h1">
            Configuración de Notificaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administre los procesos automáticos del sistema
          </Typography>
        </Box>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Sección de Schedulers */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <ScheduleIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">
                  Tareas Programadas (Schedulers)
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure qué procesos automáticos deben ejecutarse en el sistema. Desactivar un scheduler
                detendrá su ejecución automática, pero podrá ejecutarlo manualmente si es necesario.
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2}>
                {schedulers.map((scheduler) => (
                  <Box key={scheduler.key}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: { xs: "flex-start", md: "center" },
                        justifyContent: "space-between",
                        gap: 2,
                        p: 2,
                        bgcolor: scheduler.is_enabled ? "success.light" : "grey.100",
                        borderRadius: 1,
                        border: 1,
                        borderColor: scheduler.is_enabled ? "success.main" : "grey.300",
                        opacity: scheduler.is_enabled ? 1 : 0.8,
                        transition: "all 0.3s ease",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: scheduler.is_enabled ? "success.main" : "grey.400",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {getSchedulerIcon(scheduler.key)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {scheduler.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {scheduler.description}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
                            <Chip
                              size="small"
                              icon={<ScheduleIcon />}
                              label={scheduler.schedule}
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              Actualizado: {formatDate(scheduler.updated_at)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Chip
                          icon={scheduler.is_enabled ? <CheckIcon /> : <CloseIcon />}
                          label={scheduler.is_enabled ? "Activo" : "Inactivo"}
                          color={scheduler.is_enabled ? "success" : "default"}
                          variant="filled"
                          size="small"
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={scheduler.is_enabled}
                              onChange={(e) => handleToggleScheduler(scheduler.key, e.target.checked)}
                              disabled={savingKey === scheduler.key}
                              color="success"
                            />
                          }
                          label={
                            savingKey === scheduler.key ? (
                              <CircularProgress size={20} />
                            ) : (
                              ""
                            )
                          }
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Información importante
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  Los cambios en los schedulers toman efecto inmediatamente.
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Desactivar un scheduler no afecta los datos existentes ni las acciones manuales.
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Los horarios mostrados corresponden a la zona horaria de Colombia (America/Bogota).
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Se recomienda mantener los schedulers activos para el correcto funcionamiento del sistema.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default SystemSettings;
