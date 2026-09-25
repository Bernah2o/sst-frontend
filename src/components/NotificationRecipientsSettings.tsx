import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ForwardToInbox as ForwardToInboxIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Stack,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import React, { useState, useEffect, useCallback } from "react";

import api from "../services/api";
import {
  NotificationRecipient,
  NotificationRecipientCreate,
  NotificationRecipientDelivery,
  NotificationTypeOption,
} from "../types";

import ConfirmDialog from "./ConfirmDialog";

const BASE_URL = "/admin/notifications/settings/recipients";

const emptyForm = (notificationType: string): NotificationRecipientCreate => ({
  notification_type: notificationType,
  email: "",
  name: "",
  delivery: "bcc",
});

const NotificationRecipientsSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [types, setTypes] = useState<NotificationTypeOption[]>([]);
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [form, setForm] = useState<NotificationRecipientCreate>(emptyForm(""));
  const [toDelete, setToDelete] = useState<NotificationRecipient | null>(null);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [typesRes, recipientsRes] = await Promise.all([
        api.get(`${BASE_URL}/types`),
        api.get(BASE_URL),
      ]);
      const typeOptions = typesRes.data as NotificationTypeOption[];
      setTypes(typeOptions);
      setRecipients(recipientsRes.data as NotificationRecipient[]);
      setForm(prev => (prev.notification_type ? prev : emptyForm(typeOptions[0]?.key ?? "")));
    } catch (err: any) {
      console.error("Error fetching notification recipients:", err);
      setError(err.response?.data?.detail || "Error al cargar los destinatarios de notificaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload: NotificationRecipientCreate = {
        ...form,
        email: form.email.trim(),
        name: form.name?.trim() || null,
      };
      const response = await api.post(BASE_URL, payload);
      setRecipients(prev => [...prev, response.data as NotificationRecipient]);
      setForm(emptyForm(form.notification_type));
      showSuccess("Destinatario agregado");
    } catch (err: any) {
      console.error("Error creating notification recipient:", err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Verifique que el correo sea válido");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (
    recipient: NotificationRecipient,
    changes: { is_active?: boolean; delivery?: NotificationRecipientDelivery }
  ) => {
    try {
      setBusyId(recipient.id);
      setError(null);
      const response = await api.put(`${BASE_URL}/${recipient.id}`, changes);
      const updated = response.data as NotificationRecipient;
      setRecipients(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      console.error("Error updating notification recipient:", err);
      setError(err.response?.data?.detail || "Error al actualizar el destinatario");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const recipient = toDelete;
    setToDelete(null);
    try {
      setBusyId(recipient.id);
      setError(null);
      await api.delete(`${BASE_URL}/${recipient.id}`);
      setRecipients(prev => prev.filter(r => r.id !== recipient.id));
      showSuccess("Destinatario eliminado");
    } catch (err: any) {
      console.error("Error deleting notification recipient:", err);
      setError(err.response?.data?.detail || "Error al eliminar el destinatario");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <ForwardToInboxIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6">Destinatarios en copia</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Correos de la empresa que reciben copia de las notificaciones enviadas a los trabajadores.
          La copia oculta (CCO) no es visible para el trabajador. Si un tipo no tiene destinatarios,
          el correo se envía solo al trabajador.
        </Typography>

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

        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Formulario para agregar */}
            <Box
              component="form"
              onSubmit={handleAdd}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
                mb: 3,
              }}
            >
              <TextField
                select
                size="small"
                label="Notificación"
                value={form.notification_type}
                onChange={e => setForm({ ...form, notification_type: e.target.value })}
                sx={{ minWidth: 260 }}
                required
              >
                {types.map(t => (
                  <MenuItem key={t.key} value={t.key}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="email"
                label="Correo"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                sx={{ flex: 1 }}
                required
              />
              <TextField
                size="small"
                label="Nombre (opcional)"
                value={form.name ?? ""}
                onChange={e => setForm({ ...form, name: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                size="small"
                label="Tipo de copia"
                value={form.delivery}
                onChange={e =>
                  setForm({ ...form, delivery: e.target.value as NotificationRecipientDelivery })
                }
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="bcc">Oculta (CCO)</MenuItem>
                <MenuItem value="cc">Visible (CC)</MenuItem>
              </TextField>
              <Button
                type="submit"
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                disabled={saving || !form.notification_type || !form.email.trim()}
              >
                Agregar
              </Button>
            </Box>

            {/* Destinatarios agrupados por tipo */}
            <Stack spacing={2}>
              {types.map(type => {
                const items = recipients.filter(r => r.notification_type === type.key);
                return (
                  <Box
                    key={type.key}
                    sx={{ p: 2, borderRadius: 1, border: 1, borderColor: "grey.300" }}
                  >
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
                      {type.name}
                    </Typography>
                    {items.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Sin destinatarios en copia.
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {items.map(r => (
                          <Box
                            key={r.id}
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              alignItems: { xs: "flex-start", sm: "center" },
                              gap: 1,
                              opacity: r.is_active ? 1 : 0.6,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                {r.email}
                              </Typography>
                              {r.name && (
                                <Typography variant="caption" color="text.secondary">
                                  {r.name}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Tooltip title="Cambiar tipo de copia">
                                <Chip
                                  size="small"
                                  label={r.delivery === "cc" ? "CC" : "CCO"}
                                  color={r.delivery === "cc" ? "warning" : "default"}
                                  variant="outlined"
                                  disabled={busyId === r.id}
                                  onClick={() =>
                                    handleUpdate(r, { delivery: r.delivery === "cc" ? "bcc" : "cc" })
                                  }
                                />
                              </Tooltip>
                              <Tooltip title={r.is_active ? "Activo" : "Inactivo"}>
                                <Switch
                                  size="small"
                                  checked={r.is_active}
                                  disabled={busyId === r.id}
                                  onChange={e => handleUpdate(r, { is_active: e.target.checked })}
                                  color="success"
                                />
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    disabled={busyId === r.id}
                                    onClick={() => setToDelete(r)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </>
        )}
      </CardContent>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar destinatario"
        message={`¿Eliminar ${toDelete?.email ?? ""} de las copias de esta notificación?`}
        confirmText="Eliminar"
        severity="warning"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </Card>
  );
};

export default NotificationRecipientsSettings;
