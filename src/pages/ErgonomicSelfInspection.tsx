import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Assignment as FollowUpIcon,
  Save,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useNavigate, useParams } from "react-router-dom";
import SignaturePad from "../components/SignaturePad";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { getApiUrl } from "../config/env";

interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  document_number: string;
  position: string;
  direccion?: string;
}

type CheckValue = boolean | null;

type ChecklistItem = {
  number: number;
  label: string;
  checkField: string;
  obsField: string;
  group: string;
};

type ObsOption = { value: string; label: string };
type ActionOption = { value: string; label: string };

const CHECKLIST: ChecklistItem[] = [
  {
    number: 1,
    group: "Mi silla",
    label:
      "Puedo ajustar la altura de mi silla y mis pies apoyan completamente en el suelo.",
    checkField: "chair_height_check",
    obsField: "chair_height_obs",
  },
  {
    number: 2,
    group: "Mi silla",
    label:
      "El respaldo tiene soporte en la zona lumbar (o uso soporte adicional).",
    checkField: "chair_lumbar_check",
    obsField: "chair_lumbar_obs",
  },
  {
    number: 3,
    group: "Mi silla",
    label:
      "Los reposabrazos (si los tiene) permiten que mis hombros estén relajados.",
    checkField: "chair_armrests_check",
    obsField: "chair_armrests_obs",
  },
  {
    number: 4,
    group: "Mi silla",
    label:
      "La silla está en buen estado (sin piezas sueltas, ruedas o desgaste excesivo).",
    checkField: "chair_condition_check",
    obsField: "chair_condition_obs",
  },
  {
    number: 5,
    group: "Mi escritorio / mesa",
    label:
      "Puedo apoyar los codos a 90° con los antebrazos horizontales al digitar.",
    checkField: "desk_elbows_90_check",
    obsField: "desk_elbows_90_obs",
  },
  {
    number: 6,
    group: "Mi escritorio / mesa",
    label:
      "Tengo espacio suficiente para mover las piernas libremente bajo el escritorio.",
    checkField: "desk_leg_space_check",
    obsField: "desk_leg_space_obs",
  },
  {
    number: 7,
    group: "Mi escritorio / mesa",
    label:
      "La superficie no tiene bordes pronunciados que me presionen los antebrazos.",
    checkField: "desk_edges_check",
    obsField: "desk_edges_obs",
  },
  {
    number: 8,
    group: "Mi monitor / pantalla",
    label: "La parte superior de mi pantalla está al nivel de mis ojos.",
    checkField: "monitor_eye_level_check",
    obsField: "monitor_eye_level_obs",
  },
  {
    number: 9,
    group: "Mi monitor / pantalla",
    label:
      "La distancia de mis ojos a la pantalla es de aprox. un brazo extendido (50–70 cm).",
    checkField: "monitor_distance_check",
    obsField: "monitor_distance_obs",
  },
  {
    number: 10,
    group: "Mi monitor / pantalla",
    label:
      "La pantalla no genera reflejos de ventanas ni luminarias detrás de mí.",
    checkField: "monitor_glare_check",
    obsField: "monitor_glare_obs",
  },
  {
    number: 11,
    group: "Mi monitor / pantalla",
    label:
      "Si uso laptop: tengo soporte elevador + teclado y mouse externos para jornadas largas.",
    checkField: "laptop_setup_check",
    obsField: "laptop_setup_obs",
  },
  {
    number: 12,
    group: "Mi teclado y mouse",
    label: "El teclado y el mouse están al mismo nivel y cerca de mi cuerpo.",
    checkField: "keyboard_mouse_level_check",
    obsField: "keyboard_mouse_level_obs",
  },
  {
    number: 13,
    group: "Mi teclado y mouse",
    label:
      "Uso reposamuñecas al digitar (gel o espuma, no borde rígido del escritorio).",
    checkField: "wrist_rest_check",
    obsField: "wrist_rest_obs",
  },
  {
    number: 14,
    group: "Mi teclado y mouse",
    label:
      "Mis muñecas están neutras (ni dobladas hacia arriba ni hacia los lados) al digitar.",
    checkField: "wrists_neutral_check",
    obsField: "wrists_neutral_obs",
  },
  {
    number: 15,
    group: "Mi postura e iluminación",
    label: "La iluminación es suficiente y no genera reflejos en mi pantalla.",
    checkField: "lighting_reflection_check",
    obsField: "lighting_reflection_obs",
  },
  {
    number: 16,
    group: "Mi postura e iluminación",
    label:
      "Evito cruzar las piernas y apoyo los pies en el suelo durante la jornada.",
    checkField: "feet_on_floor_check",
    obsField: "feet_on_floor_obs",
  },
  {
    number: 17,
    group: "Mi postura e iluminación",
    label: "Realizo las 3 pausas activas programadas durante el día.",
    checkField: "active_breaks_check",
    obsField: "active_breaks_obs",
  },
  {
    number: 18,
    group: "Mi postura e iluminación",
    label:
      "No siento dolor o molestia persistente en cuello, espalda, brazos o muñecas.",
    checkField: "no_pain_check",
    obsField: "no_pain_obs",
  },
];

const OBS_OPTIONS: Record<string, ObsOption[]> = {
  chair_height_check: [
    { value: "no_ajuste", label: "Silla sin ajuste de altura" },
    { value: "pies_no_apoyan", label: "Los pies no apoyan completamente" },
    { value: "requiere_reposapies", label: "Requiere reposapiés" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  chair_lumbar_check: [
    { value: "sin_lumbar", label: "Sin soporte lumbar" },
    { value: "requiere_cojin", label: "Requiere cojín/soporte lumbar" },
    { value: "respaldo_insuf", label: "Respaldo insuficiente" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  chair_armrests_check: [
    { value: "no_tiene", label: "No tiene reposabrazos" },
    { value: "muy_altos", label: "Reposabrazos muy altos" },
    { value: "tension", label: "Hombros tensos / postura inadecuada" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  chair_condition_check: [
    { value: "inestable", label: "Silla inestable" },
    { value: "ruedas_danadas", label: "Ruedas o base dañadas" },
    { value: "piezas_sueltas", label: "Piezas sueltas / desgaste excesivo" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  desk_elbows_90_check: [
    { value: "altura_inad", label: "Altura inadecuada" },
    { value: "no_90", label: "No permite postura a 90°" },
    { value: "requiere_ajuste", label: "Requiere ajuste de silla/mesa" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  desk_leg_space_check: [
    { value: "espacio_reducido", label: "Espacio reducido" },
    { value: "obstrucciones", label: "Objetos obstruyen el espacio" },
    { value: "sin_mov", label: "No permite movimiento libre" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  desk_edges_check: [
    { value: "bordes", label: "Bordes pronunciados" },
    { value: "presion", label: "Presión en antebrazos" },
    { value: "requiere_protector", label: "Requiere protector / ajuste" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  monitor_eye_level_check: [
    { value: "pantalla_baja", label: "Pantalla muy baja" },
    { value: "pantalla_alta", label: "Pantalla demasiado alta" },
    { value: "requiere_soporte", label: "Requiere soporte elevador" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  monitor_distance_check: [
    { value: "muy_cerca", label: "Distancia muy corta" },
    { value: "muy_lejos", label: "Distancia muy larga" },
    { value: "reubicar", label: "Requiere reubicar el monitor" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  monitor_glare_check: [
    { value: "ref_ventana", label: "Reflejos de ventana" },
    { value: "ref_luz", label: "Reflejos de luminaria" },
    { value: "reorientar", label: "Reorientar monitor / cortinas" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  laptop_setup_check: [
    { value: "sin_soporte", label: "No tiene soporte elevador" },
    { value: "sin_teclado", label: "Sin teclado externo" },
    { value: "sin_mouse", label: "Sin mouse externo" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  keyboard_mouse_level_check: [
    { value: "mouse_lejos", label: "Mouse lejos del cuerpo" },
    { value: "distinta_altura", label: "Diferente altura teclado/mouse" },
    { value: "requiere_bandeja", label: "Requiere bandeja/ajuste" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  wrist_rest_check: [
    { value: "no_usa", label: "No usa reposamuñecas" },
    { value: "borde_rigido", label: "Usa borde rígido del escritorio" },
    { value: "requiere_gel", label: "Requiere reposamuñecas gel/espuma" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  wrists_neutral_check: [
    { value: "dobladas", label: "Muñecas dobladas" },
    { value: "teclado_alto", label: "Teclado demasiado alto" },
    { value: "ajustar", label: "Requiere ajuste de posición" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  lighting_reflection_check: [
    { value: "insuf", label: "Iluminación insuficiente" },
    { value: "reflejos", label: "Reflejos en pantalla" },
    { value: "requiere_lampara", label: "Requiere lámpara / reubicación" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  feet_on_floor_check: [
    { value: "cruza", label: "Cruza las piernas" },
    { value: "pies_no", label: "Pies no apoyan" },
    { value: "reposapies", label: "Requiere reposapiés" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  active_breaks_check: [
    { value: "no_realiza", label: "No realiza pausas activas" },
    { value: "olvida", label: "Olvida realizarlas" },
    { value: "recordatorio", label: "Requiere recordatorios" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  no_pain_check: [
    { value: "dolor_cuello", label: "Dolor en cuello" },
    { value: "dolor_espalda", label: "Dolor en espalda" },
    { value: "dolor_munecas", label: "Dolor en brazos/muñecas" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
};

const ACTION_OPTIONS: Record<string, ActionOption[]> = {
  "1": [
    {
      value: "ajuste_altura",
      label: "Ajustar altura de la silla / reposapiés",
    },
    { value: "dotacion_silla", label: "Gestionar dotación de silla ajustable" },
    { value: "capacitacion", label: "Capacitación en ajuste de puesto" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "2": [
    { value: "soporte_lumbar", label: "Gestionar soporte lumbar / cojín" },
    { value: "dotacion_silla", label: "Gestionar silla con soporte lumbar" },
    { value: "capacitacion", label: "Capacitación en postura" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "3": [
    { value: "ajuste_reposabrazos", label: "Ajustar reposabrazos / postura" },
    { value: "dotacion_silla", label: "Gestionar silla con reposabrazos" },
    { value: "capacitacion", label: "Capacitación en ergonomía" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "4": [
    { value: "mantenimiento", label: "Mantenimiento / reparación de silla" },
    { value: "reemplazo", label: "Reemplazo de silla" },
    { value: "inspeccion", label: "Inspección y verificación del estado" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "5": [
    { value: "ajuste_altura", label: "Ajustar altura mesa/silla para 90°" },
    { value: "dotacion_mesa", label: "Gestionar mesa/soporte adecuado" },
    { value: "capacitacion", label: "Capacitación en digitación segura" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "6": [
    { value: "reorganizar", label: "Reorganizar espacio bajo el escritorio" },
    { value: "dotacion_mesa", label: "Gestionar escritorio con espacio" },
    { value: "visita", label: "Verificación remota/visita de SST" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "7": [
    { value: "protector_borde", label: "Instalar protector de borde" },
    { value: "ajuste", label: "Ajustar posición de antebrazos/apoyo" },
    { value: "dotacion_mesa", label: "Gestionar mesa con bordes adecuados" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "8": [
    {
      value: "soporte_monitor",
      label: "Instalar soporte elevador de pantalla",
    },
    { value: "ajustar_altura", label: "Ajustar altura/posición del monitor" },
    { value: "capacitacion", label: "Capacitación en ajuste visual" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "9": [
    { value: "reubicar_monitor", label: "Reubicar monitor a 50–70 cm" },
    { value: "ajuste", label: "Ajustar distancia/posición de trabajo" },
    { value: "visita", label: "Verificación remota/visita de SST" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "10": [
    { value: "reorientar", label: "Reorientar monitor / cortinas" },
    { value: "iluminacion", label: "Ajustar iluminación para evitar reflejos" },
    { value: "capacitacion", label: "Capacitación en confort visual" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "11": [
    { value: "dotacion", label: "Gestionar soporte + teclado/mouse externos" },
    { value: "capacitacion", label: "Capacitación en uso de laptop" },
    { value: "verificacion", label: "Verificación de jornada y setup" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "12": [
    { value: "ajustar_posicion", label: "Ajustar posición de teclado/mouse" },
    { value: "bandeja", label: "Gestionar bandeja o mesa adecuada" },
    { value: "capacitacion", label: "Capacitación en postura de brazos" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "13": [
    { value: "reposamunecas", label: "Gestionar reposamuñecas (gel/espuma)" },
    { value: "ajuste", label: "Ajustar apoyo de muñecas" },
    { value: "capacitacion", label: "Capacitación en digitación" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "14": [
    { value: "ajuste_teclado", label: "Ajustar altura/posición del teclado" },
    { value: "reposamunecas", label: "Gestionar reposamuñecas" },
    { value: "capacitacion", label: "Capacitación en muñeca neutra" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "15": [
    { value: "lampara", label: "Gestionar lámpara / mejorar iluminación" },
    { value: "reubicar", label: "Reubicar puesto para evitar reflejos" },
    { value: "capacitacion", label: "Capacitación en iluminación" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "16": [
    { value: "reposapies", label: "Gestionar reposapiés / ajuste silla" },
    { value: "habito", label: "Reforzar hábito de postura (pies al piso)" },
    { value: "capacitacion", label: "Capacitación en postura" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "17": [
    {
      value: "recordatorios",
      label: "Configurar recordatorios de pausas activas",
    },
    { value: "rutina", label: "Implementar rutina guiada de pausas" },
    { value: "capacitacion", label: "Capacitación en pausas activas" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
  "18": [
    { value: "seguimiento_med", label: "Seguimiento por SST/medicina laboral" },
    { value: "ajuste_puesto", label: "Ajuste del puesto de trabajo" },
    { value: "pausas", label: "Pausas activas y estiramientos" },
    { value: "otro", label: "Otro (especifique...)" },
  ],
};

const toMonthYear = (isoDate: string) => {
  if (!isoDate) return "";
  const [y, m] = isoDate.split("-");
  if (!y || !m) return "";
  return `${m}/${y}`;
};

const initialFormState = () => {
  const todayIso = new Date().toISOString().split("T")[0];
  const base: Record<string, any> = {
    evaluation_date: todayIso,
    month_year: toMonthYear(todayIso),
    modality: "",
    evaluator_name: "",
    pain_discomfort: null as null | boolean,
    pain_region: "",
    pain_intensity: "",
    report_description: "",
    needs_medical_attention: null as null | boolean,
    worker_signature: "",
  };
  CHECKLIST.forEach((i) => {
    base[i.checkField] = null as CheckValue;
    base[i.obsField] = "";
  });
  return base;
};

const ErgonomicSelfInspection: React.FC = () => {
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

  const [formData, setFormData] =
    useState<Record<string, any>>(initialFormState());

  const [obsPresets, setObsPresets] = useState<Record<string, string>>({});
  const [managementData, setManagementData] = useState<Record<string, any>>({});
  const [actionPresets, setActionPresets] = useState<Record<string, string>>(
    {},
  );

  const resolveImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("data:image")) return url;
    if (url.startsWith("http")) {
      const token = localStorage.getItem("token");
      return `${getApiUrl()}/assessments/homework/proxy-image?url=${encodeURIComponent(
        url,
      )}&token=${token}`;
    }
    if (url.startsWith("/static"))
      return `${getApiUrl().replace("/api/v1", "")}${url}`;
    if (url.startsWith("/uploads"))
      return `${getApiUrl().replace("/api/v1", "")}${url}`;
    return url;
  };

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    CHECKLIST.forEach((item) => {
      const arr = map.get(item.group) || [];
      arr.push(item);
      map.set(item.group, arr);
    });
    return Array.from(map.entries());
  }, []);

  const computeTotals = useCallback(() => {
    const values = CHECKLIST.map((i) => formData[i.checkField] as CheckValue);
    const compliant = values.filter((v) => v === true).length;
    const nonCompliant = values
      .map((v, idx) => ({ v, num: CHECKLIST[idx].number }))
      .filter((x) => x.v === false)
      .map((x) => x.num);
    return { compliant, nonCompliant };
  }, [formData]);

  const fetchInitialData = useCallback(async () => {
    setIsInitializing(true);
    try {
      let currentWorkerList: Worker[] = [];
      let myProfile: Worker | null = null;

      if (user?.role === "employee") {
        const profileRes = await api.get("/workers/profile");
        const profile = profileRes.data as Worker;
        myProfile = profile;
        currentWorkerList = [profile];
        setWorkers(currentWorkerList);
        setSelectedWorker(profile);
      } else {
        const workersRes = await api.get("/workers");
        currentWorkerList = workersRes.data;
        setWorkers(currentWorkerList);
      }

      const inspectionsRes = await api.get("/assessments/ergonomic");

      let target: any = null;
      if (id) {
        target = inspectionsRes.data.find((a: any) => a.id === parseInt(id));
      } else {
        target = inspectionsRes.data.find((a: any) => a.status === "PENDING");
      }

      if (target) {
        setFormData((prev) => ({
          ...prev,
          ...target,
          evaluation_date: target.evaluation_date,
          id: target.id,
        }));

        if (target.sst_management_data) {
          try {
            const parsed = JSON.parse(target.sst_management_data);
            setManagementData(parsed || {});
          } catch (e) {
            setManagementData({});
          }
        } else {
          setManagementData({});
        }

        if (target.status === "COMPLETED") {
          setIsReadOnly(true);
          setHasPending(false);
        } else {
          setIsReadOnly(false);
          setHasPending(true);
        }

        if (target.worker_id) {
          const w =
            currentWorkerList.find((x) => x.id === target.worker_id) || null;
          setSelectedWorker(w);
        }
      } else {
        setHasPending(false);
        setIsReadOnly(user?.role === "employee");
        setFormData(initialFormState());
        setManagementData({});
        if (user?.role === "employee") {
          setSelectedWorker(myProfile);
        } else {
          setSelectedWorker(null);
        }
      }
    } catch (e) {
      setHasPending(false);
      setIsReadOnly(user?.role === "employee");
      setFormData(initialFormState());
      setManagementData({});
    } finally {
      setIsInitializing(false);
    }
  }, [id, user?.role]);

  useEffect(() => {
    if (user) fetchInitialData();
  }, [user, fetchInitialData]);

  useEffect(() => {
    const next = toMonthYear(formData.evaluation_date);
    if (next && next !== formData.month_year) {
      setFormData((p) => ({ ...p, month_year: next }));
    }
  }, [formData.evaluation_date]);

  useEffect(() => {
    const presets: Record<string, string> = {};
    CHECKLIST.forEach((item) => {
      const storedObs = (formData[item.obsField] as string) || "";
      const options = OBS_OPTIONS[item.checkField] || [];
      const match = options.find(
        (o) => o.value !== "otro" && o.label === storedObs,
      );
      presets[item.checkField] = match ? match.value : storedObs ? "otro" : "";
    });
    setObsPresets(presets);
  }, [formData.id]);

  useEffect(() => {
    const presets: Record<string, string> = {};
    CHECKLIST.forEach((item) => {
      const key = String(item.number);
      const storedAction = (managementData[key]?.action as string) || "";
      const options = ACTION_OPTIONS[key] || [];
      const match = options.find(
        (o) => o.value !== "otro" && o.label === storedAction,
      );
      presets[key] = match ? match.value : storedAction ? "otro" : "";
    });
    setActionPresets(presets);
  }, [formData.id, managementData]);

  const handleObsPresetChange = (item: ChecklistItem, presetValue: string) => {
    setObsPresets((prev) => ({ ...prev, [item.checkField]: presetValue }));
    if (presetValue === "otro") {
      setFormData((p) => ({ ...p, [item.obsField]: "" }));
      return;
    }
    const option = (OBS_OPTIONS[item.checkField] || []).find(
      (o) => o.value === presetValue,
    );
    if (option) {
      setFormData((p) => ({ ...p, [item.obsField]: option.label }));
    }
  };

  const handleActionPresetChange = (key: string, presetValue: string) => {
    setActionPresets((prev) => ({ ...prev, [key]: presetValue }));
    if (presetValue === "otro") {
      handleManagementChange(key, "action", "");
      return;
    }
    const option = (ACTION_OPTIONS[key] || []).find(
      (o) => o.value === presetValue,
    );
    if (option) {
      handleManagementChange(key, "action", option.label);
    }
  };

  const setCheckValue = (
    field: string,
    targetValue: boolean,
    checked: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked ? targetValue : null,
    }));
  };

  const buildAutoReport = () => {
    const lines: string[] = [];
    CHECKLIST.forEach((item) => {
      if (formData[item.checkField] === false) {
        const obs = (formData[item.obsField] as string) || "";
        lines.push(`${item.number}. ${item.label}${obs ? ` — ${obs}` : ""}`);
      }
    });

    if (formData.pain_discomfort === true) {
      const region = (formData.pain_region as string) || "";
      const intensity = formData.pain_intensity ?? "";
      lines.push(
        `Dolor/malestar: Sí${region ? ` — Región: ${region}` : ""}${
          intensity !== "" ? ` — Intensidad: ${intensity}/10` : ""
        }`,
      );
      if (formData.needs_medical_attention === true) {
        lines.push("Requiere atención médica: Sí");
      }
      if (formData.needs_medical_attention === false) {
        lines.push("Requiere atención médica: No");
      }
    }

    return lines.join("\n");
  };

  const handleManagementChange = (
    itemKey: string,
    field: "action" | "status" | "date",
    value: any,
  ) => {
    setManagementData((prev) => ({
      ...prev,
      [itemKey]: {
        ...(prev[itemKey] || { status: "OPEN", action: "", date: "" }),
        [field]: value,
      },
    }));
  };

  const handleSaveManagement = async () => {
    if (!formData.id) return;

    const workerId = selectedWorker?.id ?? formData.worker_id;
    if (!workerId) return;

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        ...formData,
        worker_id: workerId,
        sst_management_data: JSON.stringify(managementData),
        report_description: formData.report_description || "",
        pain_intensity:
          formData.pain_intensity === "" || formData.pain_intensity === null
            ? null
            : Number(formData.pain_intensity),
      };

      await api.put(`/assessments/ergonomic/${formData.id}`, payload);
      enqueueSnackbar("Seguimiento SST guardado exitosamente", {
        variant: "success",
      });
      await fetchInitialData();
    } catch (e) {
      enqueueSnackbar("Error al guardar el seguimiento SST", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedWorker) {
      enqueueSnackbar("Seleccione un trabajador", { variant: "warning" });
      return;
    }

    if (user?.role === "employee" && !formData.id) {
      enqueueSnackbar(
        "No tienes una autoinspección asignada. Espera a que SST te la asigne.",
        { variant: "warning" },
      );
      return;
    }

    if (!formData.modality) {
      enqueueSnackbar("Seleccione la modalidad", { variant: "warning" });
      return;
    }

    const unanswered = CHECKLIST.filter((i) => formData[i.checkField] === null);
    if (unanswered.length > 0) {
      enqueueSnackbar("Responda todos los ítems (√ o X)", {
        variant: "warning",
      });
      return;
    }

    if (!formData.worker_signature) {
      enqueueSnackbar("La firma del trabajador es obligatoria", {
        variant: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const autoReport = buildAutoReport();
      const normalizedPain =
        formData.pain_discomfort === true
          ? {
              pain_region: formData.pain_region || null,
              pain_intensity: formData.pain_intensity,
              needs_medical_attention: formData.needs_medical_attention,
            }
          : {
              pain_region: null,
              pain_intensity: null,
              needs_medical_attention: null,
            };

      const payload: Record<string, any> = {
        ...formData,
        worker_id: selectedWorker.id,
        report_description: autoReport,
        pain_region: normalizedPain.pain_region,
        pain_intensity:
          normalizedPain.pain_intensity === "" ||
          normalizedPain.pain_intensity === null ||
          normalizedPain.pain_intensity === undefined
            ? null
            : Number(normalizedPain.pain_intensity),
        needs_medical_attention: normalizedPain.needs_medical_attention,
      };

      const isUpdate = Boolean(formData.id);

      if (isUpdate) {
        await api.put(`/assessments/ergonomic/${formData.id}`, payload);
      } else {
        await api.post("/assessments/ergonomic", payload);
      }

      enqueueSnackbar("Autoinspección guardada exitosamente", {
        variant: "success",
      });
      await fetchInitialData();
      if (user?.role === "employee") {
        setHasPending(false);
        setIsReadOnly(true);
      }
    } catch (e) {
      enqueueSnackbar("Error al guardar la autoinspección", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const { compliant, nonCompliant } = computeTotals();

  if (isInitializing) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (user?.role === "employee" && !hasPending && !id) {
    return (
      <Box p={3}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Autoinspección del Trabajador – Puesto Ergonómico
        </Typography>
        <Alert severity="info">
          No tienes una autoinspección pendiente. Solo aparecerá cuando SST te
          la asigne.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h5" fontWeight="bold">
          Autoinspección del Trabajador – Puesto Ergonómico
        </Typography>
        {user?.role !== "employee" && (
          <Button
            startIcon={<BackIcon />}
            variant="outlined"
            onClick={() => navigate("/admin/ergonomic-self-inspections")}
          >
            Volver
          </Button>
        )}
      </Box>

      {user?.role === "employee" && !hasPending && !formData.id && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No tienes una autoinspección pendiente.
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {user?.role !== "employee" && (
            <Box sx={{ flex: "1 1 420px", minWidth: 300 }}>
              <TextField
                label="Trabajador"
                value={
                  selectedWorker
                    ? `${selectedWorker.first_name} ${selectedWorker.last_name} (${selectedWorker.document_number})`
                    : ""
                }
                fullWidth
                disabled
              />
            </Box>
          )}

          <Box sx={{ flex: "1 1 220px", minWidth: 220 }}>
            <TextField
              label="Fecha"
              type="date"
              value={formData.evaluation_date || ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, evaluation_date: e.target.value }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={isReadOnly}
            />
          </Box>
          <Box sx={{ flex: "1 1 220px", minWidth: 220 }}>
            <TextField
              label="Mes / Año"
              value={formData.month_year || ""}
              fullWidth
              disabled
            />
          </Box>
          <Box sx={{ flex: "1 1 220px", minWidth: 220 }}>
            <FormControl fullWidth>
              <Select
                displayEmpty
                value={formData.modality || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, modality: e.target.value }))
                }
                disabled={isReadOnly}
              >
                <MenuItem value="" disabled>
                  Modalidad
                </MenuItem>
                <MenuItem value="PRESENCIAL">Presencial</MenuItem>
                <MenuItem value="TRABAJO_EN_CASA">Trabajo en casa</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: "1 1 220px", minWidth: 220 }}>
            <TextField
              label="Evaluador (SST)"
              value={formData.evaluator_name || ""}
              fullWidth
              disabled
            />
          </Box>
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Instrucciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Revisa tu puesto de trabajo una vez al mes y marca con √ si el
            criterio se cumple, o con X si NO se cumple. Si marcas X en algún
            ítem, repórtalo al Responsable SG-SST a través del correo
            corporativo o Teams. Esta autoinspección te protege a ti.
          </Typography>
        </Box>

        <Box mt={2}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={40} align="center">
                    #
                  </TableCell>
                  <TableCell>CRITERIO DE VERIFICACIÓN</TableCell>
                  <TableCell width={120} align="center">
                    √ / X
                  </TableCell>
                  <TableCell width={320}>OBSERVACIÓN / ACCIÓN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grouped.map(([groupName, items]) => (
                  <React.Fragment key={groupName}>
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        sx={{
                          backgroundColor: "#1b3a6b",
                          color: "white",
                          fontWeight: "bold",
                        }}
                      >
                        {groupName}
                      </TableCell>
                    </TableRow>
                    {items.map((item) => (
                      <TableRow key={item.checkField}>
                        <TableCell align="center" sx={{ fontWeight: "bold" }}>
                          {item.number}
                        </TableCell>
                        <TableCell>{item.label}</TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={1}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Checkbox
                                size="small"
                                checked={
                                  (formData[item.checkField] as CheckValue) ===
                                  true
                                }
                                onChange={(e) =>
                                  setCheckValue(
                                    item.checkField,
                                    true,
                                    e.target.checked,
                                  )
                                }
                                disabled={isReadOnly}
                              />
                              <Typography variant="caption">√</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Checkbox
                                size="small"
                                checked={
                                  (formData[item.checkField] as CheckValue) ===
                                  false
                                }
                                onChange={(e) =>
                                  setCheckValue(
                                    item.checkField,
                                    false,
                                    e.target.checked,
                                  )
                                }
                                disabled={isReadOnly}
                              />
                              <Typography variant="caption">X</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {OBS_OPTIONS[item.checkField]?.length ? (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              <FormControl fullWidth size="small">
                                <Select
                                  displayEmpty
                                  value={obsPresets[item.checkField] || ""}
                                  onChange={(e) =>
                                    handleObsPresetChange(
                                      item,
                                      String(e.target.value),
                                    )
                                  }
                                  disabled={isReadOnly}
                                >
                                  <MenuItem value="">Seleccione...</MenuItem>
                                  {OBS_OPTIONS[item.checkField].map((o) => (
                                    <MenuItem key={o.value} value={o.value}>
                                      {o.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              {(obsPresets[item.checkField] || "") ===
                                "otro" && (
                                <TextField
                                  value={formData[item.obsField] || ""}
                                  onChange={(e) =>
                                    setFormData((p) => ({
                                      ...p,
                                      [item.obsField]: e.target.value,
                                    }))
                                  }
                                  fullWidth
                                  size="small"
                                  disabled={isReadOnly}
                                />
                              )}
                            </Box>
                          ) : (
                            <TextField
                              value={formData[item.obsField] || ""}
                              onChange={(e) =>
                                setFormData((p) => ({
                                  ...p,
                                  [item.obsField]: e.target.value,
                                }))
                              }
                              fullWidth
                              size="small"
                              disabled={isReadOnly}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Resumen y reporte
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            El reporte se genera automáticamente con los ítems marcados con X y
            la acción seleccionada.
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 320px", minWidth: 260 }}>
              <TextField
                label="Total ítems que cumplen (√)"
                value={`${compliant} / 18`}
                fullWidth
                disabled
              />
            </Box>
            <Box sx={{ flex: "1 1 320px", minWidth: 260 }}>
              <TextField
                label="Ítems que no cumplen (X)"
                value={
                  nonCompliant.length ? nonCompliant.join(", ") : "Ninguno"
                }
                fullWidth
                disabled
              />
            </Box>
            <Box sx={{ flex: "1 1 420px", minWidth: 320 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ¿Sientes dolor o molestia músculo-esquelética?
              </Typography>
              <Box display="flex" gap={2}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Checkbox
                    checked={formData.pain_discomfort === true}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        pain_discomfort: e.target.checked ? true : null,
                      }))
                    }
                    disabled={isReadOnly}
                  />
                  <Typography variant="body2">Sí</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Checkbox
                    checked={formData.pain_discomfort === false}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        pain_discomfort: e.target.checked ? false : null,
                      }))
                    }
                    disabled={isReadOnly}
                  />
                  <Typography variant="body2">No</Typography>
                </Box>
              </Box>
            </Box>
            {formData.pain_discomfort === true && (
              <>
                <Box sx={{ flex: "1 1 220px", minWidth: 200 }}>
                  <TextField
                    label="Región"
                    value={formData.pain_region || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        pain_region: e.target.value,
                      }))
                    }
                    fullWidth
                    disabled={isReadOnly}
                  />
                </Box>
                <Box sx={{ flex: "1 1 220px", minWidth: 200 }}>
                  <TextField
                    label="Intensidad (1–10)"
                    type="number"
                    value={formData.pain_intensity ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        pain_intensity: e.target.value,
                      }))
                    }
                    fullWidth
                    inputProps={{ min: 1, max: 10 }}
                    disabled={isReadOnly}
                  />
                </Box>
                <Box sx={{ flex: "1 1 420px", minWidth: 320 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    ¿Requieres atención médica?
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Checkbox
                        checked={formData.needs_medical_attention === true}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            needs_medical_attention: e.target.checked
                              ? true
                              : null,
                          }))
                        }
                        disabled={isReadOnly}
                      />
                      <Typography variant="body2">Sí</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Checkbox
                        checked={formData.needs_medical_attention === false}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            needs_medical_attention: e.target.checked
                              ? false
                              : null,
                          }))
                        }
                        disabled={isReadOnly}
                      />
                      <Typography variant="body2">No</Typography>
                    </Box>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Firma del trabajador
          </Typography>
          <SignaturePad
            onChange={(dataUrl) =>
              setFormData((p) => ({ ...p, worker_signature: dataUrl }))
            }
            value={formData.worker_signature || null}
            disabled={isReadOnly}
            resolveUrl={resolveImageUrl}
          />
        </Box>

        {(user?.role === "admin" || user?.role === "supervisor") &&
          isReadOnly && (
            <Paper
              sx={{
                p: 3,
                mt: 3,
                borderTop: 6,
                borderTopColor: "secondary.main",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                color="secondary.main"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <FollowUpIcon /> Seguimiento SST de Hallazgos
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Registre el estado de seguimiento para cada ítem marcado con X
                en la autoinspección. El dashboard consolida estos estados.
              </Typography>

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ mb: 3 }}
              >
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.50" }}>
                    <TableRow>
                      <TableCell>
                        <strong>Ítem con Hallazgo</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Observación / Acción del Trabajador</strong>
                      </TableCell>
                      <TableCell width="28%">
                        <strong>Acción SST</strong>
                      </TableCell>
                      <TableCell width="18%">
                        <strong>Estado Seguimiento</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {CHECKLIST.filter(
                      (item) => formData[item.checkField] === false,
                    ).map((item) => {
                      const key = String(item.number);
                      return (
                        <TableRow key={key}>
                          <TableCell sx={{ fontWeight: "medium" }}>
                            {item.number}. {item.label}
                          </TableCell>
                          <TableCell color="text.secondary">
                            {formData[item.obsField] || "Sin observación"}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              <FormControl fullWidth size="small">
                                <Select
                                  displayEmpty
                                  value={actionPresets[key] || ""}
                                  onChange={(e) =>
                                    handleActionPresetChange(
                                      key,
                                      String(e.target.value),
                                    )
                                  }
                                >
                                  <MenuItem value="">Seleccione...</MenuItem>
                                  {(ACTION_OPTIONS[key] || []).map((o) => (
                                    <MenuItem key={o.value} value={o.value}>
                                      {o.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              {(actionPresets[key] || "") === "otro" && (
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={2}
                                  size="small"
                                  placeholder="Acción correctiva / preventiva..."
                                  value={managementData[key]?.action || ""}
                                  onChange={(e) =>
                                    handleManagementChange(
                                      key,
                                      "action",
                                      e.target.value,
                                    )
                                  }
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={managementData[key]?.status || "OPEN"}
                                onChange={(e) =>
                                  handleManagementChange(
                                    key,
                                    "status",
                                    String(e.target.value),
                                  )
                                }
                                sx={{
                                  color:
                                    managementData[key]?.status === "CLOSED"
                                      ? "success.main"
                                      : managementData[key]?.status ===
                                          "IN_PROGRESS"
                                        ? "warning.main"
                                        : "error.main",
                                }}
                              >
                                <MenuItem value="OPEN">
                                  Abierto / Pendiente
                                </MenuItem>
                                <MenuItem value="IN_PROGRESS">
                                  En Ejecución
                                </MenuItem>
                                <MenuItem value="CLOSED">
                                  Cerrado / Verificado
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {CHECKLIST.filter(
                      (item) => formData[item.checkField] === false,
                    ).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography
                            variant="body2"
                            color="success.main"
                            sx={{ py: 2 }}
                          >
                            No se identificaron hallazgos que requieran
                            seguimiento.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Save />}
                  onClick={handleSaveManagement}
                  disabled={loading}
                >
                  Guardar Seguimiento SST
                </Button>
              </Box>
            </Paper>
          )}

        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          {user?.role !== "employee" && (
            <Button
              variant="outlined"
              onClick={() => navigate("/admin/ergonomic-self-inspections")}
              disabled={loading}
            >
              Volver
            </Button>
          )}
          {!isReadOnly && (
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} /> : <Save />}
              onClick={handleSubmit}
              disabled={loading}
            >
              Guardar
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ErgonomicSelfInspection;
