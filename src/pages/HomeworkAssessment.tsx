
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
  CircularProgress,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { 
  Save, 
  Download, 
  PhotoCamera, 
  Clear, 
  CheckCircle,
  AssignmentTurnedIn as ActionIcon,
  Timeline as FollowUpIcon
} from "@mui/icons-material";
import SignatureCanvas from "react-signature-canvas";
import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { getApiUrl } from "../config/env";

// Definición de tipos
interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  document_number: string;
  position: string;
  direccion: string;
}

const CHECKLIST_ITEMS = [
  { id: "lighting", label: "1. Iluminación Adecuada (natural/artificial, sin reflejos)" },
  { id: "ventilation", label: "2. Ventilación Aire fresco circulante" },
  { id: "desk", label: "3. Mesa de Trabajo Altura adecuada (70-80 cm), estable" },
  { id: "chair", label: "4. Silla Ergonómica con respaldo lumbar" },
  { id: "screen", label: "5. Posición Pantalla A nivel de ojos" },
  { id: "mouse_keyboard", label: "6. Teclado y Ratón Cercanos, sin torsiones" },
  { id: "space", label: "7. Espacio Disponible Libre para pies" },
  { id: "floor", label: "8. Piso Antideslizante, sin riesgos" },
  { id: "noise", label: "9. Ruido Ambiental Bajo (< 55 dB)" },
  { id: "connectivity", label: "10. Conectividad Internet estable" },
  { id: "equipment", label: "11. Seguridad Equipos Asegurados, cargadores OK" },
  { id: "confidentiality", label: "12. Confidencialidad Espacio privado" },
  { id: "active_breaks", label: "13. Pausas Activas Compromiso 5 min/hora" },
  { id: "psychosocial", label: "14. Riesgos Psicosociales Reporte de estrés" },
];

const HomeworkAssessment: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState<Record<string, any>>({
    evaluation_date: new Date().toISOString().split("T")[0],
  });
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [managementData, setManagementData] = useState<Record<string, any>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  
  // Función reutilizable para cargar datos
  const fetchInitialData = useCallback(async () => {
    setIsInitializing(true);
    try {
      let currentWorkerList: Worker[] = [];
      let myProfile: Worker | null = null;

      // 1. Cargar datos del trabajador(es) según el rol
      if (user?.role === 'employee') {
          try {
              // Empleado: cargar solo su perfil
              const profileRes = await api.get("/workers/profile");
              myProfile = profileRes.data;
              currentWorkerList = [myProfile!];
              setWorkers(currentWorkerList);
              setSelectedWorker(myProfile); // Seleccionar automáticamente
          } catch (err) {
              console.error("Error loading worker profile:", err);
          }
      } else {
          // Admin/Supervisor: cargar todos los trabajadores
          try {
              const workersRes = await api.get("/workers");
              currentWorkerList = workersRes.data;
              setWorkers(currentWorkerList);
          } catch (err) {
              console.error("Error loading workers list:", err);
          }
      }

      // 2. Intentar cargar evaluación (por ID o pendiente)
      try {
          let targetAssessment: any = null;

          if (id) {
              // Modo Admin: Cargar evaluación específica
              const assessmentsRes = await api.get("/assessments/homework");
              targetAssessment = assessmentsRes.data.find((a: any) => a.id === parseInt(id));
          } else {
               // Modo Empleado: Buscar pendiente
               const assessmentsRes = await api.get("/assessments/homework");
               targetAssessment = assessmentsRes.data.find((a: any) => a.status === 'PENDING');
          }

          if (targetAssessment) {
            // Pre-llenar datos
            setFormData(prev => ({
              ...prev,
              ...targetAssessment, // Cargar todo lo que coincida
              evaluation_date: targetAssessment.evaluation_date,
              id: targetAssessment.id
            }));

            // Si está completada, activar modo solo lectura
            if (targetAssessment.status === "COMPLETED") {
                setIsReadOnly(true);
                setHasPending(false);
            } else if (targetAssessment.status === "PENDING") {
                setHasPending(true);
                setIsReadOnly(false);
            }

            // Cargar fotos existentes si las hay
            if (targetAssessment.photos_data) {
              try {
                  const savedPhotos = JSON.parse(targetAssessment.photos_data);
                  setPhotos(savedPhotos);
                  
                  if (targetAssessment.sst_management_data) {
                    try {
                        setManagementData(JSON.parse(targetAssessment.sst_management_data));
                    } catch (e) {
                        console.error("Error parsing management data", e);
                    }
                  }
              } catch (e) {
                  console.error("Error parsing photos", e);
              }
            }

            // Asegurar que el worker esté seleccionado
            if (targetAssessment.worker_id) {
                const worker = currentWorkerList.find((w: Worker) => w.id === targetAssessment.worker_id);
                if (worker) {
                  setSelectedWorker(worker);
                }
            }
          } else {
            // No hay evaluación pendiente o específica
            setHasPending(false);
            setIsReadOnly(false);
            // Limpiar formulario
            setFormData({ evaluation_date: new Date().toISOString().split("T")[0] });
            setPhotos({});
            if (user?.role === 'employee') {
              setSelectedWorker(myProfile); // Mantener perfil seleccionado para empleado
            } else {
              setSelectedWorker(null);
            }
          }
      } catch (err) {
          console.log("No assessments found or error fetching them", err);
          setHasPending(false);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsInitializing(false);
    }
  }, [user, id]);

  // Cargar trabajadores y evaluaciones pendientes
  useEffect(() => {
    if (user) {
        fetchInitialData();
    }
  }, [user, id, fetchInitialData]);

  
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!selectedWorker) {
        enqueueSnackbar("Seleccione un trabajador primero", { variant: "warning" });
        return;
    }

    const file = event.target.files[0];
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("worker_id", selectedWorker.id.toString());
    uploadFormData.append("photo_type", type);

    setUploadingPhoto(type);
    try {
        const response = await api.post("/assessments/homework/upload", uploadFormData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        
        setPhotos((prev: Record<string, string>) => ({
            ...prev,
            [type]: response.data.url
        }));
        
        enqueueSnackbar("Foto subida exitosamente", { variant: "success" });
    } catch (error) {
        console.error("Error uploading photo:", error);
        enqueueSnackbar("Error al subir la foto", { variant: "error" });
    } finally {
        setUploadingPhoto(null);
    }
  };

  const handleCheckChange = (id: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [`${id}_check`]: checked }));
  };

  const handleObsChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [`${id}_obs`]: value }));
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };


  const resolveImageUrl = (url: string) => {
    if (!url) return "";
    // Usar proxy del backend para URLs externas (Contabo) para evitar problemas de CORS/Auth
    if (url.startsWith("http")) {
        const token = localStorage.getItem("token");
        return `${getApiUrl()}/assessments/homework/proxy-image?url=${encodeURIComponent(url)}&token=${token}`;
    }
    if (url.startsWith("/static")) return `${getApiUrl().replace("/api/v1", "")}${url}`;
    if (url.startsWith("/uploads")) return `${getApiUrl().replace("/api/v1", "")}${url}`;
    return url;
  };

  const handleSubmit = async () => {
    if (!selectedWorker) {
      enqueueSnackbar("Seleccione un trabajador", { variant: "warning" });
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      enqueueSnackbar("La firma del trabajador es obligatoria", { variant: "warning" });
      return;
    }

    // Validar evidencias obligatorias
    const requiredPhotos = ["general", "desk", "chair", "lighting"];
    const missingPhotos = requiredPhotos.filter(type => !photos[type]);
    
    if (missingPhotos.length > 0) {
        enqueueSnackbar(`Faltan evidencias fotográficas: ${missingPhotos.join(", ")}`, { variant: "warning" });
        return;
    }

    // Validar observaciones obligatorias si no cumple
    const missingObservations = CHECKLIST_ITEMS.filter(item => {
        const isCompliant = formData[`${item.id}_check`];
        const observation = formData[`${item.id}_obs`];
        // Si no cumple (unchecked o false) y no tiene observación, es error
        return !isCompliant && (!observation || observation.trim() === "");
    });

    if (missingObservations.length > 0) {
        enqueueSnackbar(`Debe ingresar observaciones para los ítems que NO cumplen: ${missingObservations.map(i => i.label.split('.')[0]).join(", ")}`, { variant: "warning" });
        return;
    }

    setLoading(true);
    try {
      const payload = {
        
        ...formData,
        photos: photos,
        worker_id: selectedWorker.id,
        worker_signature: sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png"),
      };

      if (formData.id) {
        await api.put(`/assessments/homework/${formData.id}`, payload);
      } else {
        await api.post("/assessments/homework", payload);
      }
      enqueueSnackbar("Autoevaluación guardada exitosamente", { variant: "success" });

      // Limpiar firma
      clearSignature();

      // Recargar datos para reflejar el nuevo estado
      await fetchInitialData();
      
    } catch (error: any) {
      console.error("Error saving assessment:", error);
      const errorMessage = error.response?.data?.detail || "Error al guardar la evaluación";
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManagement = async () => {
    if (!formData.id) return;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        sst_management_data: JSON.stringify(managementData),
        photos: photos // Mantener fotos actuales
      };
      await api.put(`/assessments/homework/${formData.id}`, payload);
      enqueueSnackbar("Gestión SST guardada exitosamente", { variant: "success" });
      await fetchInitialData();
    } catch (error: any) {
      console.error("Error saving management:", error);
      enqueueSnackbar("Error al guardar la gestión", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleManagementChange = (itemId: string, field: string, value: any) => {
    setManagementData(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { status: 'OPEN', action: '', date: '' }),
        [field]: value
      }
    }));
  };

  if (isInitializing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user?.role === 'employee' && !hasPending && !isReadOnly && !id) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: "60vh" }}>
        <Paper sx={{ p: 5, textAlign: 'center', maxWidth: 500, borderRadius: 3, boxShadow: 3 }}>
          <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>¡Excelente!</Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            No tienes autoevaluaciones de trabajo en casa pendientes.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Te notificaremos cuando sea necesario realizar una nueva evaluación.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom color="primary">
        Autoevaluación Trabajo en Casa
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Instrucciones:</Typography>
        Lea cuidadosamente cada ítem y marque con una <strong>X</strong> si cumple (Sí) o no cumple (No). En la columna de observaciones, describa el estado actual, deficiencias identificadas y acciones correctivas que implementará. Esta evaluación es confidencial y forma parte del registro SST del trabajador.
      </Alert>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}>
          Información del Trabajador
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Si es empleado o ya está seleccionado y bloqueado, mostrar solo lectura */}
            {(user?.role === 'employee' && selectedWorker) ? (
                 <TextField
                    label="Trabajador"
                    value={`${selectedWorker.first_name} ${selectedWorker.last_name} - ${selectedWorker.document_number}`}
                    fullWidth
                    disabled
                 />
            ) : (
                <Autocomplete
                  options={workers}
                  getOptionLabel={(option) => `${option.first_name} ${option.last_name} - ${option.document_number}`}
                  value={selectedWorker}
                  onChange={(_, newValue) => setSelectedWorker(newValue)}
                  renderInput={(params) => <TextField {...params} label="Buscar Trabajador" fullWidth />}
                />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Fecha de Evaluación"
              type="date"
              fullWidth
              value={formData.evaluation_date}
              onChange={(e) => setFormData({ 
        ...formData,
        evaluation_date: e.target.value })}
              InputLabelProps={{ shrink: true }} disabled={isReadOnly}
            />
          </Grid>
          
          {selectedWorker && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Cargo" value={selectedWorker.position} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Dirección Registrada" value={selectedWorker.direccion || "No registrada"} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <TextField 
                  label="Dirección del Trabajo Remoto (Si es diferente)" 
                  value={formData.home_address || ""} 
                  onChange={(e) => setFormData({ 
        ...formData,
        home_address: e.target.value })}
                  placeholder="Ingrese la dirección donde realiza el trabajo en casa"
                  fullWidth 
                />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}>
          Lista de Chequeo
        </Typography>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="40%"><strong>Aspecto Evaluado</strong></TableCell>
                <TableCell width="10%" align="center"><strong>Cumple</strong></TableCell>
                <TableCell width="50%"><strong>Observaciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {CHECKLIST_ITEMS.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={formData[`${item.id}_check`] || false}
                      onChange={(e) => handleCheckChange(item.id, e.target.checked)} disabled={isReadOnly}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Observaciones o acciones correctivas..."
                      value={formData[`${item.id}_obs`] || ""}
                      onChange={(e) => handleObsChange(item.id, e.target.value)} disabled={isReadOnly}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Evidencias Fotográficas
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Adjunto fotografías del puesto de trabajo en casa (vista general, escritorio, silla, iluminación):
        </Typography>
        
        <Grid container spacing={2}>
          {[
            { label: "Vista General", key: "general" },
            { label: "Escritorio", key: "desk" },
            { label: "Silla", key: "chair" },
            { label: "Iluminación", key: "lighting" }
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.key}>
              <Box sx={{ border: "1px dashed #ccc", p: 2, borderRadius: 2, textAlign: "center", position: "relative" }}>
                  <Typography variant="subtitle2" gutterBottom>{item.label}</Typography>
                  
                  {photos[item.key] ? (
                      <Box sx={{ position: "relative", width: "100%", height: 100, mb: 1 }}>
                          <img 
                            src={resolveImageUrl(photos[item.key])} 
                            alt={item.label} 
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} 
                          />
                          {!isReadOnly && (
                          <Button 
                            size="small" 
                            color="error" 
                            variant="contained"
                            sx={{ position: "absolute", top: -5, right: -5, minWidth: 24, p: 0.5, borderRadius: "50%" }}
                            onClick={() => {
                                const newPhotos = {...photos};
                                delete newPhotos[item.key];
                                setPhotos(newPhotos);
                            }}
                          >
                            <Clear fontSize="small" />
                          </Button>
                          )}
                      </Box>
                  ) : (
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        startIcon={uploadingPhoto === item.key ? <CircularProgress size={20} /> : <PhotoCamera />}
                        disabled={uploadingPhoto === item.key || !selectedWorker || isReadOnly}
                        sx={{ height: 100, flexDirection: "column" }}
                      >
                        {uploadingPhoto === item.key ? "Subiendo..." : "Subir Foto"}
                        <input 
                            type="file" 
                            hidden 
                            accept="image/*" 
                            onChange={(e) => handlePhotoUpload(e, item.key)}
                        />
                      </Button>
                  )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Declaración y Firma
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography paragraph>
            Declaro que he revisado y evaluado las condiciones de mi puesto de trabajo en casa. Confirmo que las condiciones son adecuadas para el desempeño seguro de mis funciones, conforme a los estándares de SST de ROWL UNITED COLOMBIA S.A.S.
          </Typography>
          <Typography variant="subtitle2">Me comprometo a:</Typography>
          <ul>
            <li>Mantener el puesto en condiciones seguras</li>
            <li>Realizar pausas activas y estiramientos regularmente</li>
            <li>Reportar de inmediato cualquier cambio de condiciones o incidente</li>
            <li>Usar correctamente los equipos asignados</li>
            <li>Mantener la confidencialidad de la información</li>
          </ul>
        </Alert>
        
        <Box sx={{ border: "1px dashed grey", borderRadius: 2, p: 2, bgcolor: "#f9f9f9", maxWidth: 500 }}>
          <Typography variant="subtitle2" gutterBottom>Firma del Trabajador:</Typography>
          {isReadOnly && formData.worker_signature ? (
              <img src={resolveImageUrl(formData.worker_signature)} alt="Firma" style={{ maxWidth: "100%", maxHeight: 150 }} />
          ) : (
              <>
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ width: 450, height: 150, className: "sigCanvas" }}
                    backgroundColor="white"
                  />
                  <Button size="small" onClick={clearSignature} startIcon={<Clear />} sx={{ mt: 1 }} disabled={isReadOnly}>
                    Borrar Firma
                  </Button>
              </>
          )}
        </Box>
      </Paper>

      {/* Gestión SST y Plan de Acción (Solo para Admin/Supervisor y cuando ya está completada por el trabajador) */}
      {(user?.role === 'admin' || user?.role === 'supervisor') && isReadOnly && (
        <Paper sx={{ p: 3, mb: 3, borderTop: 6, borderTopColor: "secondary.main" }}>
          <Typography variant="h6" gutterBottom color="secondary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FollowUpIcon /> Documentación de Hallazgos y Seguimiento SST
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Como administrador, registre aquí las acciones tomadas para resolver los hallazgos identificados en esta autoevaluación.
          </Typography>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "grey.50" }}>
                <TableRow>
                  <TableCell><strong>Ítem con Hallazgo</strong></TableCell>
                  <TableCell><strong>Observación del Trabajador</strong></TableCell>
                  <TableCell width="20%"><strong>Acción Documentada</strong></TableCell>
                  <TableCell width="15%"><strong>Estado Seguimiento</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CHECKLIST_ITEMS.filter(item => !formData[`${item.id}_check`]).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontWeight: 'medium' }}>{item.label}</TableCell>
                    <TableCell color="text.secondary">
                      {formData[`${item.id}_obs`] || "Sin observación"}
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        placeholder="Describa la acción correctiva..."
                        value={managementData[item.id]?.action || ""}
                        onChange={(e) => handleManagementChange(item.id, 'action', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={managementData[item.id]?.status || "OPEN"}
                          onChange={(e) => handleManagementChange(item.id, 'status', e.target.value)}
                          sx={{ 
                            color: managementData[item.id]?.status === 'CLOSED' ? 'success.main' : 
                                   managementData[item.id]?.status === 'IN_PROGRESS' ? 'warning.main' : 'error.main' 
                          }}
                        >
                          <MenuItem value="OPEN">Abierto / Pendiente</MenuItem>
                          <MenuItem value="IN_PROGRESS">En Ejecución</MenuItem>
                          <MenuItem value="CLOSED">Cerrado / Verificado</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
                {CHECKLIST_ITEMS.filter(item => !formData[`${item.id}_check`]).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="success.main" sx={{ py: 2 }}>
                        No se identificaron hallazgos que requieran plan de acción.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Observaciones Generales de la Gestión SST"
                fullWidth
                multiline
                rows={3}
                value={formData.sst_observations || ""}
                onChange={(e) => setFormData({...formData, sst_observations: e.target.value})}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<Save />} 
              onClick={handleSaveManagement}
              disabled={loading}
            >
              Guardar Gestión y Seguimiento
            </Button>
          </Box>
        </Paper>
      )}

      {!isReadOnly && (
      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button variant="contained" color="primary" size="large" startIcon={<Save />} onClick={handleSubmit} disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </Box>
      )}
    </Box>
  );
};

export default HomeworkAssessment;
