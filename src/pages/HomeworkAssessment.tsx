
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  // FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  // Divider,
  Alert,
  CircularProgress,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  // InputLabel,
} from "@mui/material";
import {
  Save,
  // Download,
  PhotoCamera,
  Clear,
  CheckCircle,
  // AssignmentTurnedIn as ActionIcon,
  Timeline as FollowUpIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import SignaturePad from "../components/SignaturePad";
import { useSnackbar } from "notistack";
import { useParams, useNavigate } from "react-router-dom";
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

// Opciones predefinidas de observación por ítem (cuando No Cumple)
const CHECKLIST_OBS_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  lighting: [
    { value: "insuf_natural", label: "Luz natural insuficiente" },
    { value: "reflejos_pantalla", label: "Reflejos en pantalla" },
    { value: "sin_lampara", label: "Sin lámpara auxiliar" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  ventilation: [
    { value: "sin_ventana", label: "Sin ventana o sin ventilación natural" },
    { value: "temperatura_inadecuada", label: "Temperatura inadecuada (frío/calor excesivo)" },
    { value: "olores", label: "Presencia de olores o contaminantes" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  desk: [
    { value: "altura_incorrecta", label: "Altura incorrecta (muy alta o muy baja)" },
    { value: "superficie_inestable", label: "Superficie inestable o inadecuada" },
    { value: "poco_espacio", label: "Poco espacio para trabajar cómodamente" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  chair: [
    { value: "silla_comedor", label: "Silla de comedor o plástica" },
    { value: "sin_respaldo", label: "Sin respaldo lumbar" },
    { value: "sin_regulacion", label: "Sin regulación de altura" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  screen: [
    { value: "pantalla_baja", label: "Pantalla muy baja (portátil en mesa)" },
    { value: "pantalla_alta", label: "Pantalla demasiado alta" },
    { value: "pantalla_lateral", label: "Pantalla en posición lateral" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  mouse_keyboard: [
    { value: "sin_mouse_externo", label: "Sin mouse externo" },
    { value: "teclado_lejos", label: "Teclado lejos del cuerpo" },
    { value: "posicion_torcida", label: "Torsión de muñecas / posición inadecuada" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  space: [
    { value: "espacio_reducido", label: "Espacio reducido para los pies" },
    { value: "objetos_obstruyendo", label: "Objetos o cajas obstruyendo el espacio" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  floor: [
    { value: "piso_resbaladizo", label: "Piso resbaladizo o irregular" },
    { value: "cables_en_piso", label: "Cables u objetos en el piso (riesgo de caída)" },
    { value: "sin_alfombra", label: "Sin alfombra antideslizante" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  noise: [
    { value: "ruido_vecinos", label: "Ruido de vecinos o calle" },
    { value: "ruido_familia", label: "Ruido de familia o convivientes" },
    { value: "musica_tv", label: "Música o televisión en el ambiente" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  connectivity: [
    { value: "internet_lento", label: "Internet lento o inestable" },
    { value: "cortes_frecuentes", label: "Cortes frecuentes de conexión" },
    { value: "solo_wifi", label: "Solo WiFi, sin cable ethernet disponible" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  equipment: [
    { value: "cables_danados", label: "Cables dañados o sin protección" },
    { value: "sin_cargador", label: "Sin cargador adecuado o en mal estado" },
    { value: "equipos_sin_soporte", label: "Equipos sin protección o sin soporte fijo" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  confidentiality: [
    { value: "espacio_compartido", label: "Espacio compartido con otras personas" },
    { value: "pantalla_visible", label: "Pantalla visible para terceros" },
    { value: "conversaciones_audibles", label: "Conversaciones de trabajo audibles para terceros" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  active_breaks: [
    { value: "no_realiza", label: "No realiza pausas activas" },
    { value: "sin_guia", label: "Las realiza pero sin guía ni rutina establecida" },
    { value: "olvida", label: "Olvida realizarlas durante la jornada" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  psychosocial: [
    { value: "carga_alta", label: "Carga de trabajo elevada" },
    { value: "aislamiento", label: "Sensación de aislamiento o soledad" },
    { value: "dificultad_desconexion", label: "Dificultad para desconectarse fuera del horario" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
};

// Opciones predefinidas de acción correctiva por ítem (para el admin)
const ACTION_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  lighting: [
    { value: "Instalar lámpara de escritorio con luz blanca fría (mínimo 500 lux)", label: "Instalar lámpara de escritorio con luz blanca fría (mínimo 500 lux)" },
    { value: "Reorientar el monitor para eliminar reflejos en pantalla", label: "Reorientar el monitor para eliminar reflejos en pantalla" },
    { value: "Informar al trabajador sobre uso adecuado de persianas o cortinas", label: "Informar al trabajador sobre uso adecuado de persianas o cortinas" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  ventilation: [
    { value: "Indicar al trabajador abrir ventanas periódicamente durante la jornada", label: "Indicar al trabajador abrir ventanas periódicamente durante la jornada" },
    { value: "Recomendar uso de ventilador o purificador de aire", label: "Recomendar uso de ventilador o purificador de aire" },
    { value: "Solicitar cambio de lugar de trabajo dentro del hogar", label: "Solicitar cambio de lugar de trabajo dentro del hogar" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  desk: [
    { value: "Capacitar al trabajador sobre ajuste correcto de la altura de la mesa", label: "Capacitar al trabajador sobre ajuste correcto de la altura de la mesa" },
    { value: "Evaluar suministro de mesa de trabajo adecuada por la empresa", label: "Evaluar suministro de mesa de trabajo adecuada por la empresa" },
    { value: "Indicar uso de superficies estables y despejar área de trabajo", label: "Indicar uso de superficies estables y despejar área de trabajo" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  chair: [
    { value: "Evaluar préstamo o dotación de silla ergonómica por la empresa", label: "Evaluar préstamo o dotación de silla ergonómica por la empresa" },
    { value: "Indicar uso de cojín lumbar provisional mientras se gestiona silla adecuada", label: "Indicar uso de cojín lumbar provisional mientras se gestiona silla adecuada" },
    { value: "Capacitar sobre postura correcta y ajustes con silla disponible", label: "Capacitar sobre postura correcta y ajustes con silla disponible" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  screen: [
    { value: "Indicar elevar pantalla con soporte, libros o resma de papel a nivel de ojos", label: "Indicar elevar pantalla con soporte, libros o resma de papel a nivel de ojos" },
    { value: "Evaluar suministro de soporte de portátil + teclado y mouse externos", label: "Evaluar suministro de soporte de portátil + teclado y mouse externos" },
    { value: "Verificar distancia visual adecuada (50-70 cm) frente a pantalla", label: "Verificar distancia visual adecuada (50-70 cm) frente a pantalla" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  mouse_keyboard: [
    { value: "Evaluar suministro de teclado y mouse externos por la empresa", label: "Evaluar suministro de teclado y mouse externos por la empresa" },
    { value: "Capacitar sobre posición neutra de muñecas y codos en ángulo de 90°", label: "Capacitar sobre posición neutra de muñecas y codos en ángulo de 90°" },
    { value: "Indicar uso de apoyamuñecas mientras se gestiona material adecuado", label: "Indicar uso de apoyamuñecas mientras se gestiona material adecuado" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  space: [
    { value: "Indicar al trabajador reorganizar mobiliario para liberar espacio bajo la mesa", label: "Indicar al trabajador reorganizar mobiliario para liberar espacio bajo la mesa" },
    { value: "Solicitar cambio de lugar de trabajo con mayor espacio disponible", label: "Solicitar cambio de lugar de trabajo con mayor espacio disponible" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  floor: [
    { value: "Indicar retirar cables del piso y fijarlos con canaletas o cinta", label: "Indicar retirar cables del piso y fijarlos con canaletas o cinta" },
    { value: "Recomendar uso de alfombra antideslizante bajo la silla", label: "Recomendar uso de alfombra antideslizante bajo la silla" },
    { value: "Solicitar inspección del estado del piso y correcciones necesarias", label: "Solicitar inspección del estado del piso y correcciones necesarias" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  noise: [
    { value: "Recomendar uso de auriculares con cancelación de ruido durante reuniones", label: "Recomendar uso de auriculares con cancelación de ruido durante reuniones" },
    { value: "Indicar acuerdo con convivientes sobre respeto a horarios de trabajo", label: "Indicar acuerdo con convivientes sobre respeto a horarios de trabajo" },
    { value: "Solicitar cambio de espacio de trabajo a zona más silenciosa del hogar", label: "Solicitar cambio de espacio de trabajo a zona más silenciosa del hogar" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  connectivity: [
    { value: "Recomendar conexión por cable ethernet en lugar de WiFi", label: "Recomendar conexión por cable ethernet en lugar de WiFi" },
    { value: "Solicitar al proveedor mejora del plan de internet", label: "Solicitar al proveedor mejora del plan de internet" },
    { value: "Evaluar apoyo económico de la empresa para mejora de conectividad (teletrabajo)", label: "Evaluar apoyo económico de la empresa para mejora de conectividad (teletrabajo)" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  equipment: [
    { value: "Indicar revisión y reemplazo de cables dañados de forma inmediata", label: "Indicar revisión y reemplazo de cables dañados de forma inmediata" },
    { value: "Gestionar con TI el suministro de cargadores y accesorios en buen estado", label: "Gestionar con TI el suministro de cargadores y accesorios en buen estado" },
    { value: "Capacitar sobre identificación de riesgos eléctricos en el hogar", label: "Capacitar sobre identificación de riesgos eléctricos en el hogar" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  confidentiality: [
    { value: "Capacitar sobre uso de bloqueador de pantalla y manejo seguro de información", label: "Capacitar sobre uso de bloqueador de pantalla y manejo seguro de información" },
    { value: "Indicar reubicación del puesto para evitar exposición de pantalla a terceros", label: "Indicar reubicación del puesto para evitar exposición de pantalla a terceros" },
    { value: "Recordar política de confidencialidad y firma de acuerdo de teletrabajo", label: "Recordar política de confidencialidad y firma de acuerdo de teletrabajo" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  active_breaks: [
    { value: "Programar alarmas o recordatorios cada 50 minutos para pausas activas", label: "Programar alarmas o recordatorios cada 50 minutos para pausas activas" },
    { value: "Compartir rutina guiada de pausas activas (infografía o video SST)", label: "Compartir rutina guiada de pausas activas (infografía o video SST)" },
    { value: "Incluir en capacitación virtual de ergonomía en casa", label: "Incluir en capacitación virtual de ergonomía en casa" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  psychosocial: [
    { value: "Programar seguimiento con bienestar laboral o psicología empresarial", label: "Programar seguimiento con bienestar laboral o psicología empresarial" },
    { value: "Revisar carga de trabajo y redistribuir tareas con el jefe directo", label: "Revisar carga de trabajo y redistribuir tareas con el jefe directo" },
    { value: "Informar sobre canales de apoyo: línea de bienestar, ARL, EPS", label: "Informar sobre canales de apoyo: línea de bienestar, ARL, EPS" },
    { value: "Escalar caso a ARL para asesoría en riesgo psicosocial", label: "Escalar caso a ARL para asesoría en riesgo psicosocial" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
};

const HomeworkAssessment: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
  const [obsPresets, setObsPresets] = useState<Record<string, string>>({});
  const [actionPresets, setActionPresets] = useState<Record<string, string>>({});
  
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
                        const parsed = JSON.parse(targetAssessment.sst_management_data);
                        setManagementData(parsed);
                        // Inicializar actionPresets: si la acción guardada coincide con una opción → seleccionarla, si no → "otro"
                        const presets: Record<string, string> = {};
                        Object.keys(parsed).forEach(itemId => {
                          const action = parsed[itemId]?.action || "";
                          const opts = ACTION_OPTIONS[itemId] || [];
                          const match = opts.find(o => o.value !== "otro" && o.value === action);
                          presets[itemId] = match ? match.value : (action ? "otro" : "");
                        });
                        setActionPresets(presets);
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

  // Inicializar obsPresets cuando cambia la evaluación cargada
  useEffect(() => {
    const presets: Record<string, string> = {};
    CHECKLIST_ITEMS.forEach(item => {
      const storedObs = formData[`${item.id}_obs`] || '';
      if (!storedObs) { presets[item.id] = ''; return; }
      const options = CHECKLIST_OBS_OPTIONS[item.id] || [];
      const match = options.find(o => o.value !== 'otro' && o.label === storedObs);
      presets[item.id] = match ? match.value : 'otro';
    });
    setObsPresets(presets);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.id]);

  const handleCheckChange = (id: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [`${id}_check`]: checked }));
    if (!checked) {
      // Re-derivar preset según el texto actual al pasar a No Cumple
      const currentObs = formData[`${id}_obs`] || '';
      const options = CHECKLIST_OBS_OPTIONS[id] || [];
      const match = options.find(o => o.value !== 'otro' && o.label === currentObs);
      setObsPresets(prev => ({ ...prev, [id]: match ? match.value : (currentObs ? 'otro' : '') }));
    }
  };

  const handleObsChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [`${id}_obs`]: value }));
  };

  const handlePresetChange = (id: string, presetValue: string) => {
    setObsPresets(prev => ({ ...prev, [id]: presetValue }));
    if (presetValue === 'otro') {
      handleObsChange(id, '');
    } else {
      const option = (CHECKLIST_OBS_OPTIONS[id] || []).find(o => o.value === presetValue);
      if (option) handleObsChange(id, option.label);
    }
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

    if (!formData.worker_signature) {
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
        worker_signature: formData.worker_signature,
      };

      if (formData.id) {
        await api.put(`/assessments/homework/${formData.id}`, payload);
      } else {
        await api.post("/assessments/homework", payload);
      }
      enqueueSnackbar("Autoevaluación guardada exitosamente", { variant: "success" });

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

  const handleActionPresetChange = (itemId: string, presetValue: string) => {
    setActionPresets(prev => ({ ...prev, [itemId]: presetValue }));
    if (presetValue !== "otro") {
      handleManagementChange(itemId, 'action', presetValue);
    } else {
      handleManagementChange(itemId, 'action', '');
    }
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" color="primary">
          Autoevaluación Trabajo en Casa
        </Typography>
        {(user?.role === 'admin' || user?.role === 'supervisor') && (
          <Button startIcon={<BackIcon />} variant="outlined" onClick={() => navigate("/admin/homework-assessments")}>
            Volver
          </Button>
        )}
      </Box>

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
                    {!formData[`${item.id}_check`] && CHECKLIST_OBS_OPTIONS[item.id] ? (
                      <Box>
                        <Select
                          size="small"
                          fullWidth
                          displayEmpty
                          value={obsPresets[item.id] || ""}
                          onChange={(e) => handlePresetChange(item.id, e.target.value as string)}
                          disabled={isReadOnly}
                          sx={{ mb: obsPresets[item.id] === "otro" ? 1 : 0 }}
                        >
                          <MenuItem value=""><em>Seleccione el motivo...</em></MenuItem>
                          {CHECKLIST_OBS_OPTIONS[item.id].map((o) => (
                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                          ))}
                        </Select>
                        {obsPresets[item.id] === "otro" && (
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Describa el motivo específico..."
                            value={formData[`${item.id}_obs`] || ""}
                            onChange={(e) => handleObsChange(item.id, e.target.value)}
                            disabled={isReadOnly}
                          />
                        )}
                      </Box>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Observación opcional..."
                        value={formData[`${item.id}_obs`] || ""}
                        onChange={(e) => handleObsChange(item.id, e.target.value)}
                        disabled={isReadOnly}
                      />
                    )}
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
        
        <SignaturePad
          value={formData.worker_signature ?? null}
          onChange={(dataUrl) => setFormData(prev => ({ ...prev, worker_signature: dataUrl }))}
          disabled={isReadOnly}
          resolveUrl={resolveImageUrl}
        />
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
                      <FormControl fullWidth size="small" sx={{ mb: actionPresets[item.id] === 'otro' ? 1 : 0 }}>
                        <Select
                          displayEmpty
                          value={actionPresets[item.id] || ""}
                          onChange={(e) => handleActionPresetChange(item.id, e.target.value)}
                          renderValue={(v) => v ? (ACTION_OPTIONS[item.id]?.find(o => o.value === v)?.label ?? v) : <em style={{ color: '#9e9e9e' }}>Seleccione acción...</em>}
                        >
                          <MenuItem value="" disabled><em>Seleccione acción...</em></MenuItem>
                          {(ACTION_OPTIONS[item.id] || []).map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {actionPresets[item.id] === 'otro' && (
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          placeholder="Describa la acción correctiva..."
                          value={managementData[item.id]?.action || ""}
                          onChange={(e) => handleManagementChange(item.id, 'action', e.target.value)}
                        />
                      )}
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
