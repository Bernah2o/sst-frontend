import React, { useState } from "react";
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
  Box,
  Typography,
  Alert,
  FormControlLabel,
  Switch,
  Grid,
  CircularProgress,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AttendanceStatus, AttendanceType } from "../types";
import api from "../services/api";
import { logger } from "../utils/logger";
import workerService from "../services/workerService";
import { WorkerList } from "../types/worker";

interface BulkAttendanceData {
  course_name: string;
  session_date: Date;
  user_ids: number[];
  // Almacenar ids de trabajadores seleccionados para resolver user_id al enviar
  worker_ids?: number[];
  status: AttendanceStatus;
  attendance_type: AttendanceType;
  location?: string;
  notes?: string;
  send_notifications: boolean;
  verified_by?: number;
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
    verified_by: undefined,
  });

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [workers, setWorkers] = useState<WorkerList[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Eliminado: carga inicial de trabajadores. AutocompleteField se encarga de la búsqueda.

  // Limpieza: se eliminaron logs de depuración innecesarios





  const handleSubmit = async () => {
    if (!formData.course_name.trim()) {
      onError("Por favor ingresa el nombre del curso");
      return;
    }

    if (selectedWorkerIds.length === 0) {
      onError("Por favor selecciona al menos un trabajador");
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Convertir la fecha a formato YYYY-MM-DD (compatibilidad backend)
      const sessionDate = formData.session_date
        .toISOString()
        .split("T")[0];

      // Resolver user_ids consultando el detalle del trabajador
      const resolvedUserIds: Array<{ workerId: number; userId: number | null }> = [];
      for (const workerId of selectedWorkerIds) {
        try {
          const detailResp = await api.get(`/workers/${workerId}`);
          const detail = detailResp.data;
          const uid = detail?.user_id ?? detail?.user?.id ?? null;
          resolvedUserIds.push({ workerId, userId: typeof uid === 'number' ? uid : null });
        } catch (e) {
          logger.error(`Error resolviendo user_id para trabajador ${workerId}`, e);
          resolvedUserIds.push({ workerId, userId: null });
        }
      }

      // Procesar cada usuario resuelto individualmente
      for (const item of resolvedUserIds) {
        const userId = item.userId;
        if (typeof userId !== 'number') {
          errorCount++;
          const workerName = workers.find((w) => w.id === item.workerId)?.full_name || `Trabajador ${item.workerId}`;
          errors.push(`${workerName}: sin usuario vinculado`);
          continue;
        }
        try {
          const payload = {
            user_id: userId,
            course_name: formData.course_name,
            session_date: sessionDate,
            status: formData.status,
            attendance_type: formData.attendance_type,
            location: formData.location || null,
            verified_by: formData.verified_by ?? null,
            notes: formData.notes || null,
            check_in_time: null,
            check_out_time: null,
            duration_minutes: null,
            scheduled_duration_minutes: null,
            completion_percentage: 100,
          };

          await api.post("/attendance/", payload);
          successCount++;
        } catch (error: any) {
          errorCount++;
          const workerName = workers.find((w) => w.id === item.workerId)?.full_name || `Trabajador ${item.workerId}`;
          errors.push(`${workerName}: ${error.response?.data?.detail || error.message}`);
          console.error(`Error creating attendance for worker/user ${userId}:`, error);
        }
      }

      // Mostrar resultado
      if (successCount > 0 && errorCount === 0) {
        onSuccess(`Asistencias registradas exitosamente: ${successCount} trabajadores`);
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
      verified_by: undefined,
    });
    setSelectedWorkerIds([]);
    setSearchTerm("");
    setWorkers([]);
    onClose();
  };

  // Eliminado: manejador de Autocomplete anterior (no usado)

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

            {/* Campos eliminados: Instructor y Duración (no usados por backend) */}

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

            {/* Selección de Trabajadores - búsqueda y tabla */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Buscar trabajadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outlined" onClick={async () => {
                  try {
                    setLoading(true);
                    const items = await workerService.searchWorkers(searchTerm);
                    setWorkers(items);
                  } catch (err) {
                    logger.error('Error buscando trabajadores:', err);
                    setWorkers([]);
                  } finally {
                    setLoading(false);
                  }
                }}>Buscar</Button>
                <Button variant="text" onClick={() => {
                  if (selectedWorkerIds.length === workers.length) {
                    setSelectedWorkerIds([]);
                  } else {
                    setSelectedWorkerIds(workers.map(w => w.id));
                  }
                }} disabled={workers.length === 0}>
                  {selectedWorkerIds.length === workers.length && workers.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Button>
              </Box>

              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Seleccionar Trabajadores ({selectedWorkerIds.length} seleccionados)
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Seleccionar</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Documento</TableCell>
                      <TableCell>Departamento</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} />
                            <Typography variant="body2">Cargando trabajadores...</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : workers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Alert severity="info">No hay resultados. Intenta otra búsqueda.</Alert>
                        </TableCell>
                      </TableRow>
                    ) : (
                      workers.map((w) => (
                        <TableRow key={w.id} hover>
                          <TableCell>
                            <Checkbox
                              checked={selectedWorkerIds.includes(w.id)}
                              onChange={() => setSelectedWorkerIds(prev => prev.includes(w.id) ? prev.filter(x => x !== w.id) : [...prev, w.id])}
                            />
                          </TableCell>
                          <TableCell>{w.full_name || `${w.first_name} ${w.last_name}`}</TableCell>
                          <TableCell>{w.document_number}</TableCell>
                          <TableCell>{w.department || '-'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.5, borderRadius: 1, bgcolor: w.is_registered ? 'success.light' : 'warning.light', color: w.is_registered ? 'success.dark' : 'warning.dark' }}>
                              {w.is_registered ? 'Registrado' : 'No vinculado'}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
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
              será omitida para evitar duplicados. El campo <em>Ubicación</em> es opcional; si no se especifica, el backend 
              aplicará sus valores por defecto y calculará la duración según corresponda.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
        <Button 
          variant="outlined" 
          onClick={async () => {
            try {
              setLoading(true);
              const items = await workerService.searchWorkers(searchTerm);
              setWorkers(items);
            } catch (err) {
              logger.error('Error buscando trabajadores:', err);
              setWorkers([]);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >Buscar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.course_name.trim() || selectedWorkerIds.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Registrando..." : `Registrar Asistencias (${selectedWorkerIds.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkAttendanceDialog;