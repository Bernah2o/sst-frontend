import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Alert,
  Autocomplete,
  FormControlLabel,
  Switch,
  Grid,
  CircularProgress,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AttendanceStatus, AttendanceType } from "../types";
import api from "../services/api";
import { logger } from "../utils/logger";

interface User {
  id: number;
  full_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface BulkAttendanceData {
  course_name: string;
  session_date: Date;
  user_ids: number[];
  status: AttendanceStatus;
  attendance_type: AttendanceType;
  location?: string;
  notes?: string;
  send_notifications: boolean;
}

interface BulkAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const BulkAttendanceDialog: React.FC<BulkAttendanceDialogProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState<BulkAttendanceData>({
    course_name: "",
    session_date: new Date(),
    user_ids: [],
    status: AttendanceStatus.PRESENT,
    attendance_type: AttendanceType.IN_PERSON,
    location: "",
    notes: "",
    send_notifications: false,
  });

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Cargar usuarios al abrir el diálogo
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  // Debug: Log users state changes
  useEffect(() => {
    logger.debug("Users state updated:", users);
    logger.debug("Users length:", users.length);
  }, [users]);



  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get("/users/");
      logger.debug("Response from /users/:", response.data);
      const usersData = response.data.items || response.data;
      logger.debug("Users data:", usersData);
      logger.debug("Is array?", Array.isArray(usersData));
      logger.debug("Data length:", usersData?.length);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      logger.error("Error fetching users:", error);
      setUsers([]);
      onError("Error al cargar los usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.course_name.trim()) {
      onError("Por favor ingresa el nombre del curso");
      return;
    }

    if (formData.user_ids.length === 0) {
      onError("Por favor selecciona al menos un usuario");
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Convertir la fecha a formato datetime ISO
      const sessionDate = formData.session_date.toISOString();

      // Procesar cada usuario individualmente
      for (const userId of formData.user_ids) {
        try {
          const payload = {
             user_id: userId,
             course_name: formData.course_name,
             session_date: sessionDate,
             status: formData.status,
             attendance_type: formData.attendance_type,
             notes: formData.notes || null,
             check_in_time: null,
             check_out_time: null,
             completion_percentage: 100,
           };

          await api.post("/attendance/", payload);
          successCount++;
        } catch (error: any) {
          errorCount++;
          const userName = users.find(u => u.id === userId)?.full_name || `Usuario ${userId}`;
          errors.push(`${userName}: ${error.response?.data?.detail || error.message}`);
          console.error(`Error creating attendance for user ${userId}:`, error);
        }
      }

      // Mostrar resultado
      if (successCount > 0 && errorCount === 0) {
        onSuccess(`Asistencias registradas exitosamente: ${successCount} usuarios`);
      } else if (successCount > 0 && errorCount > 0) {
        onError(`Registro parcial: ${successCount} exitosos, ${errorCount} errores. Errores: ${errors.join(", ")}`);
      } else {
        onError(`Error al registrar asistencias: ${errors.join(", ")}`);
      }
      
      handleClose();
    } catch (error: any) {
      console.error("Error creating bulk attendance:", error);
      onError(
        error.response?.data?.detail || "Error al registrar las asistencias"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      course_name: "",
      session_date: new Date(),
      user_ids: [],
      status: AttendanceStatus.PRESENT,
      attendance_type: AttendanceType.IN_PERSON,
      location: "",
      notes: "",
      send_notifications: false,
    });
    setSelectedUsers([]);
    onClose();
  };

  const handleUserChange = (event: any, newValue: User[]) => {
    setSelectedUsers(newValue);
    setFormData(prev => ({
      ...prev,
      user_ids: newValue.map(user => user.id),
    }));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Registro Masivo de Asistencias</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Nombre del Curso */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre del Curso"
                value={formData.course_name}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, course_name: e.target.value }))
                }
                required
              />
            </Grid>



            {/* Fecha y Hora de la Sesión */}
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Fecha y Hora de la Sesión"
                  value={formData.session_date}
                  onChange={(newValue) =>
                    setFormData(prev => ({ 
                      ...prev, 
                      session_date: newValue || new Date() 
                    }))
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Estado de Asistencia */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  label="Estado"
                  onChange={(e) =>
                    setFormData(prev => ({ 
                      ...prev, 
                      status: e.target.value as AttendanceStatus 
                    }))
                  }
                >
                  <MenuItem value={AttendanceStatus.PRESENT}>Presente</MenuItem>
                  <MenuItem value={AttendanceStatus.ABSENT}>Ausente</MenuItem>
                  <MenuItem value={AttendanceStatus.LATE}>Tardío</MenuItem>
                  <MenuItem value={AttendanceStatus.EXCUSED}>Justificado</MenuItem>
                  <MenuItem value={AttendanceStatus.PARTIAL}>Parcial</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Tipo de Asistencia */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Asistencia</InputLabel>
                <Select
                  value={formData.attendance_type}
                  label="Tipo de Asistencia"
                  onChange={(e) =>
                    setFormData(prev => ({ 
                      ...prev, 
                      attendance_type: e.target.value as AttendanceType 
                    }))
                  }
                >
                  <MenuItem value={AttendanceType.IN_PERSON}>Presencial</MenuItem>
                  <MenuItem value={AttendanceType.VIRTUAL}>Virtual</MenuItem>
                  <MenuItem value={AttendanceType.HYBRID}>Híbrido</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Ubicación */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Ubicación (Opcional)"
                value={formData.location}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, location: e.target.value }))
                }
              />
            </Grid>

            {/* Selección de Usuarios */}
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                multiple
                options={users}
                getOptionLabel={(option) => {
                  logger.debug("Option in getOptionLabel:", option);
                  return `${option.full_name || 'Sin nombre'} (${option.email || 'Sin email'})`;
                }}
                value={selectedUsers}
                onChange={handleUserChange}
                loading={loadingUsers}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.full_name}
                      {...getTagProps({ index })}
                      key={option.id}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar Usuarios"
                    placeholder="Buscar usuarios..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <Typography variant="caption" color="textSecondary">
                {selectedUsers.length} usuario(s) seleccionado(s)
              </Typography>
            </Grid>

            {/* Notas */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas (Opcional)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
              />
            </Grid>

            {/* Enviar Notificaciones */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.send_notifications}
                    onChange={(e) =>
                      setFormData(prev => ({ 
                        ...prev, 
                        send_notifications: e.target.checked 
                      }))
                    }
                  />
                }
                label="Enviar notificaciones por email"
              />
            </Grid>
          </Grid>

          {/* Información adicional */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Información:</strong> El registro masivo creará asistencias para todos los usuarios seleccionados 
              con los mismos parámetros. Si ya existe una asistencia para un usuario en la fecha especificada, 
              será omitida para evitar duplicados.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.course_name.trim() || formData.user_ids.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Registrando..." : "Registrar Asistencias"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkAttendanceDialog;