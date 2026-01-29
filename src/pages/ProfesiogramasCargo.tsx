import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Button,
  TextField,
  Chip,
  OutlinedInput,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Autocomplete,
  Alert,
  InputAdornment,
  Switch,
} from "@mui/material";
import { CheckCircle, ContentCopy } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import cargoService, { CargoOption, Cargo } from "../services/cargoService";
import profesiogramaService, {
  FactorRiesgo,
  TipoExamen,
  CriterioExclusion,
  Inmunizacion,
  ProfesiogramaDuplicateResult,
} from "../services/profesiogramaService";

type TipoEvaluacionExamen =
  | "ingreso"
  | "periodico"
  | "retiro"
  | "cambio_cargo"
  | "post_incapacidad"
  | "reincorporacion";

type Gtc45ND = 2 | 6 | 10;
type Gtc45NE = 1 | 2 | 3 | 4;
type Gtc45NC = 10 | 25 | 60 | 100;

type FactorMatrizConfig = {
  proceso?: string;
  actividad?: string;
  tarea?: string;
  rutinario?: boolean;
  // Identificación del peligro
  zona_lugar?: string;
  tipo_peligro?: string;
  clasificacion_peligro?: string;
  descripcion_peligro?: string;
  efectos_posibles?: string;
  // Evaluación GTC 45
  nd?: Gtc45ND;
  ne?: Gtc45NE;
  nc?: Gtc45NC;
  tiempo_exposicion_horas?: number;
  valor_medido?: string;  // Puede ser numérico o texto descriptivo (ej: "No aplica", "Contacto directo con agua")
  valor_limite_permisible?: string;  // Puede ser numérico o texto (ej: "No aplica (evaluación cualitativa)")
  unidad_medida?: string;
  // Controles existentes
  controles_existentes?: string;
  fuente?: string;
  medio?: string;
  individuo?: string;
  peor_consecuencia?: string;
  requisito_legal?: string;
  // Jerarquía de controles (ESIAE)
  eliminacion?: string;
  sustitucion?: string;
  controles_ingenieria?: string;
  controles_administrativos?: string;
  senalizacion?: string;
  epp_requerido?: string;
};

// Diccionario de clasificaciones de peligros según GTC 45 y normativa colombiana
const CLASIFICACIONES_POR_TIPO_PELIGRO: Record<string, string[]> = {
  "Físico": [
    "Ruido",
    "Vibraciones",
    "Iluminación inadecuada",
    "Temperaturas extremas (calor o frío)",
    "Radiaciones ionizantes y no ionizantes",
    "Presiones anormales"
  ],
  "Químico": [
    "Polvos",
    "Vapores",
    "Gases",
    "Humos metálicos",
    "Líquidos (solventes, ácidos, bases)",
    "Nieblas"
  ],
  "Biológico": [
    "Virus",
    "Bacterias",
    "Hongos",
    "Parásitos",
    "Picaduras y mordeduras",
    "Material biológico contaminado"
  ],
  "Ergonómico/Biomecánico": [
    "Posturas forzadas",
    "Movimientos repetitivos",
    "Manipulación manual de cargas",
    "Sobreesfuerzo",
    "Trabajo prolongado en posición de pie o sentado"
  ],
  "Psicosocial": [
    "Estrés laboral",
    "Carga mental",
    "Turnos extensos o rotativos",
    "Trabajo bajo presión",
    "Falta de control sobre la tarea",
    "Acoso laboral"
  ],
  "Condiciones de Seguridad": [
    "Trabajo en alturas",
    "Riesgo eléctrico",
    "Máquinas sin protección",
    "Herramientas defectuosas",
    "Superficies resbaladizas",
    "Caídas a mismo o distinto nivel",
    "Espacios confinados"
  ],
  "Público": [
    "Robos",
    "Atracos",
    "Disturbios",
    "Accidentes de tránsito",
    "Violencia externa"
  ],
  "Fenómenos Naturales": [
    "Sismos",
    "Inundaciones",
    "Deslizamientos",
    "Tormentas eléctricas",
    "Vientos fuertes"
  ]
};

// Opciones para CONTROLES EXISTENTES (descripción general)
const OPCIONES_CONTROLES_EXISTENTES: string[] = [
  "Controles de fuente: Mantenimiento preventivo, sustitución de equipos",
  "Controles de medio: Ventilación, barreras físicas, señalización",
  "Controles administrativos: Capacitación, rotación de personal, procedimientos seguros",
  "EPP: Uso de elementos de protección personal certificados",
  "Programa de pausas activas y ejercicios de estiramiento",
  "Protocolo de bioseguridad y desinfección",
  "Sistema de ventilación localizada y extracción",
  "Señalización y demarcación de áreas de riesgo",
  "Exámenes médicos ocupacionales periódicos",
  "Programa de vigilancia epidemiológica",
  "Inspecciones de seguridad programadas",
  "Sin controles implementados actualmente"
];

// Opciones para controles en la FUENTE
const OPCIONES_CONTROL_FUENTE: string[] = [
  "Aislamiento acústico de maquinaria",
  "Mantenimiento preventivo de equipos",
  "Sustitución por sustancias menos peligrosas",
  "Procesos cerrados o automatizados",
  "Esterilización y desinfección de áreas",
  "Rediseño ergonómico de estaciones de trabajo",
  "Reducir peso de cargas",
  "Aislar fuentes de calor",
  "Mejorar luminarias y potencia",
  "Rediseño de tareas para reducir repetitividad",
  "Ventilación natural",
  "Eliminación del agente químico del proceso",
  "Instalación de guardas de seguridad en maquinaria"
];

// Opciones para controles en el MEDIO
const OPCIONES_CONTROL_MEDIO: string[] = [
  "Barreras acústicas y mamparas",
  "Encerramientos y tratamiento acústico",
  "Ventilación localizada",
  "Extracción de vapores y cabinas",
  "Barreras físicas",
  "Mobiliario ergonómico ajustable",
  "Ayudas mecánicas (carretillas, montacargas)",
  "Ventilación forzada y aire acondicionado",
  "Redistribución de puntos de luz",
  "Herramientas ergonómicas",
  "Sistemas de extracción localizada",
  "Cabinas de bioseguridad",
  "Señalización de áreas de riesgo"
];

// Opciones para controles en el INDIVIDUO
const OPCIONES_CONTROL_INDIVIDUO: string[] = [
  "Protectores auditivos (copa o inserción)",
  "Rotación de personal",
  "EPP respiratorio certificado",
  "Capacitación en manejo seguro",
  "Inmunizaciones y vacunación",
  "Higiene personal estricta",
  "Pausas activas cada hora",
  "Ejercicios de estiramiento",
  "Descansos visuales cada 2 horas",
  "Hidratación constante",
  "Aclimatación gradual",
  "Capacitación en técnica de levantamiento",
  "Exámenes médicos periódicos",
  "Guantes de protección certificados",
  "Gafas de seguridad",
  "Ropa de trabajo protectora"
];

// Opciones para PEOR CONSECUENCIA
const OPCIONES_PEOR_CONSECUENCIA: string[] = [
  "Hipoacusia neurosensorial irreversible",
  "Fatiga visual crónica y disminución de agudeza visual",
  "Desórdenes musculoesqueléticos",
  "Hernias discales",
  "Lesiones lumbares crónicas",
  "Síndrome de túnel carpiano",
  "Tendinitis crónica",
  "Golpe de calor",
  "Deshidratación severa",
  "Intoxicación aguda",
  "Enfermedades respiratorias crónicas",
  "Infecciones graves",
  "Enfermedades transmisibles",
  "Estrés laboral crónico",
  "Trastornos de ansiedad",
  "Síndrome de Burnout",
  "Fracturas y politraumatismos",
  "Quemaduras graves",
  "Electrocución",
  "Muerte"
];

// Opciones para REQUISITO LEGAL (normativa colombiana)
const OPCIONES_REQUISITO_LEGAL: string[] = [
  "Resolución 1530/1996 - Ruido ocupacional",
  "Resolución 0773/2021 - Sílice cristalina",
  "Resolución 1409/2012 - Sustancias químicas",
  "Resolución 2400/1979 - Estatuto de Seguridad",
  "Resolución 0312/2019 - Estándares Mínimos SG-SST",
  "Ley 1562/2012 - Sistema de Riesgos Laborales",
  "Decreto 1072/2015 - Decreto Único Reglamentario Sector Trabajo",
  "Resolución 2646/2008 - Riesgo psicosocial",
  "Resolución 1016/1989 - Programas de Salud Ocupacional",
  "GTC 45:2012 - Guía Técnica Colombiana",
  "ISO 45001:2018 - Sistema de Gestión SST",
  "Resolución 1995/1999 - Historia clínica ocupacional",
  "Decreto 1443/2014 - Sistema de Gestión SST",
  "Circular 070/2009 - Batería de riesgo psicosocial",
  "NTC 3701 - Higiene y seguridad: Guía para la clasificación"
];

// Valores Límite Permisibles (VLP) según normativa colombiana
type VLPData = {
  valor_limite_permisible?: number;
  valor_limite_min?: number;  // Para rangos como temperatura (17-27°C)
  valor_limite_max?: number;
  unidad_medida: string;
  normativa: string;
  observaciones?: string;
};

const VALORES_LIMITE_PERMISIBLE: Record<string, VLPData> = {
  // Peligros Físicos
  "Ruido": {
    valor_limite_permisible: 85,
    unidad_medida: "dB",
    normativa: "Resolución 1530/1996 - Ruido ocupacional",
    observaciones: "85 dB para jornada de 8 horas/día"
  },
  "Vibraciones": {
    unidad_medida: "m/s²",
    normativa: "ISO 20816 - Vibración mecánica",
    observaciones: "Según tipo de vibración (cuerpo entero o segmentaria)"
  },
  "Iluminación inadecuada": {
    valor_limite_min: 300,
    valor_limite_max: 500,
    unidad_medida: "lux",
    normativa: "Resolución 0312/2019 - Estándares Mínimos SG-SST",
    observaciones: "300-500 lux para oficinas"
  },
  "Temperaturas extremas (calor o frío)": {
    valor_limite_min: 17,
    valor_limite_max: 27,
    unidad_medida: "°C",
    normativa: "Resolución 0312/2019 - Estándares Mínimos SG-SST",
    observaciones: "17-27°C para oficinas"
  },
  "Radiaciones ionizantes y no ionizantes": {
    unidad_medida: "mSv/año",
    normativa: "Resolución 2400/1979 - Estatuto de Seguridad",
    observaciones: "Según tipo de radiación"
  },
  "Presiones anormales": {
    unidad_medida: "kPa",
    normativa: "Resolución 2400/1979 - Estatuto de Seguridad",
    observaciones: "Según condición de presión"
  },

  // Peligros Químicos
  "Polvos": {
    valor_limite_permisible: 10,
    unidad_medida: "mg/m³",
    normativa: "GTC 45 / Resolución 0773/2021",
    observaciones: "10 mg/m³ polvo total"
  },
  "Vapores": {
    unidad_medida: "ppm",
    normativa: "Resolución 1409/2012 - Sustancias químicas",
    observaciones: "Según MSDS de la sustancia"
  },
  "Gases": {
    unidad_medida: "ppm",
    normativa: "Resolución 1409/2012 - Sustancias químicas",
    observaciones: "Según MSDS de la sustancia"
  },
  "Humos metálicos": {
    unidad_medida: "mg/m³",
    normativa: "Resolución 1409/2012 - Sustancias químicas",
    observaciones: "Según tipo de metal"
  },
  "Líquidos (solventes, ácidos, bases)": {
    unidad_medida: "ppm",
    normativa: "Resolución 1409/2012 - Sustancias químicas",
    observaciones: "Según MSDS de la sustancia"
  },
  "Nieblas": {
    unidad_medida: "mg/m³",
    normativa: "Resolución 1409/2012 - Sustancias químicas",
    observaciones: "Según composición"
  },

  // Peligros Biomecánicos/Ergonómicos
  "Posturas forzadas": {
    unidad_medida: "horas/día",
    normativa: "GTC 45:2012 - Guía Técnica Colombiana",
    observaciones: "Tiempo de exposición a postura"
  },
  "Movimientos repetitivos": {
    unidad_medida: "repeticiones/min",
    normativa: "GTC 45:2012 - Guía Técnica Colombiana",
    observaciones: "Frecuencia de movimiento"
  },
  "Manipulación manual de cargas": {
    valor_limite_permisible: 25,
    unidad_medida: "kg",
    normativa: "Resolución 2400/1979 - Estatuto de Seguridad",
    observaciones: "25 kg máximo por persona"
  },
  "Sobreesfuerzo": {
    unidad_medida: "kg",
    normativa: "GTC 45:2012 - Guía Técnica Colombiana",
    observaciones: "Según tipo de esfuerzo"
  },
  "Trabajo prolongado en posición de pie o sentado": {
    valor_limite_permisible: 4,
    unidad_medida: "horas/día",
    normativa: "Resolución 2400/1997 - Video terminales",
    observaciones: "4 horas continuas máximo para videoterminales"
  },

  // Peligros Psicosociales
  "Estrés laboral": {
    unidad_medida: "puntaje batería",
    normativa: "Resolución 2646/2008 - Riesgo psicosocial",
    observaciones: "Según batería de riesgo psicosocial"
  },
  "Carga mental": {
    unidad_medida: "puntaje batería",
    normativa: "Resolución 2646/2008 - Riesgo psicosocial",
    observaciones: "Según batería de riesgo psicosocial"
  },
  "Turnos extensos o rotativos": {
    valor_limite_permisible: 8,
    unidad_medida: "horas/día",
    normativa: "Ley 1562/2012 - Sistema de Riesgos Laborales",
    observaciones: "Jornada laboral máxima"
  },
  "Trabajo bajo presión": {
    unidad_medida: "puntaje batería",
    normativa: "Resolución 2646/2008 - Riesgo psicosocial",
    observaciones: "Según batería de riesgo psicosocial"
  },
  "Falta de control sobre la tarea": {
    unidad_medida: "puntaje batería",
    normativa: "Resolución 2646/2008 - Riesgo psicosocial",
    observaciones: "Según batería de riesgo psicosocial"
  },
  "Acoso laboral": {
    unidad_medida: "cualitativa",
    normativa: "Ley 1010/2006 - Acoso laboral",
    observaciones: "Presencia o ausencia"
  }
};

// Tipo para valores medidos sugeridos
type ValorMedidoRango = {
  nivel: string;
  min?: number;
  max?: number;
  descripcion: string;
};

type ValorMedidoSugerido = {
  valores_tipicos: number[];
  rangos: ValorMedidoRango[];
  unidad: string;
};

type ValorMedidoOption = {
  tipo: 'valor' | 'rango' | 'texto';
  valor: string;  // Puede ser numérico (como string) o texto descriptivo
  label: string;
  descripcion: string;
};

// Opciones de texto descriptivo para valor medido (cuando no aplica medición numérica)
const OPCIONES_VALOR_MEDIDO_TEXTO: ValorMedidoOption[] = [
  { tipo: 'texto', valor: 'No aplica', label: 'No aplica', descripcion: 'No requiere medición cuantitativa' },
  { tipo: 'texto', valor: 'No definido', label: 'No definido', descripcion: 'Pendiente de medición' },
  { tipo: 'texto', valor: 'Evaluación cualitativa', label: 'Evaluación cualitativa', descripcion: 'Se evalúa cualitativamente' },
  { tipo: 'texto', valor: 'Contacto directo con agua durante las labores de aseo', label: 'Contacto directo con agua (aseo)', descripcion: 'Exposición por contacto' },
  { tipo: 'texto', valor: 'Superficies húmedas durante labores de aseo', label: 'Superficies húmedas (aseo)', descripcion: 'Condición ambiental' },
  { tipo: 'texto', valor: 'Presencia confirmada', label: 'Presencia confirmada', descripcion: 'Se confirma presencia del peligro' },
  { tipo: 'texto', valor: 'Presencia ocasional', label: 'Presencia ocasional', descripcion: 'Presencia intermitente del peligro' },
];

// Opciones de texto descriptivo para valor límite permisible
const OPCIONES_VLP_TEXTO: string[] = [
  'No aplica',
  'No aplica (evaluación cualitativa)',
  'No definido',
  'No definido por normativa',
  'Según criterio técnico',
  'Ver ficha de seguridad',
];

// Valores medidos sugeridos y rangos de referencia por clasificación
const VALORES_MEDIDOS_SUGERIDOS: Record<string, ValorMedidoSugerido> = {
  // Peligros Físicos
  "Ruido": {
    valores_tipicos: [70, 75, 80, 85, 90, 95],
    rangos: [
      { nivel: "Bajo", max: 70, descripcion: "< 70 dB - Nivel aceptable" },
      { nivel: "Medio", min: 70, max: 80, descripcion: "70-80 dB - Moderado" },
      { nivel: "Alto", min: 80, max: 85, descripcion: "80-85 dB - Precaución" },
      { nivel: "Muy Alto", min: 85, descripcion: "> 85 dB - Excede VLP" }
    ],
    unidad: "dB"
  },
  "Vibraciones": {
    valores_tipicos: [0.5, 1, 2, 2.5, 5, 10],
    rangos: [
      { nivel: "Bajo", max: 0.5, descripcion: "< 0.5 m/s² - Aceptable" },
      { nivel: "Medio", min: 0.5, max: 2.5, descripcion: "0.5-2.5 m/s² - Moderado" },
      { nivel: "Alto", min: 2.5, max: 5, descripcion: "2.5-5 m/s² - Precaución" },
      { nivel: "Muy Alto", min: 5, descripcion: "> 5 m/s² - Alto riesgo" }
    ],
    unidad: "m/s²"
  },
  "Iluminación inadecuada": {
    valores_tipicos: [100, 200, 300, 400, 500, 600, 750, 1000],
    rangos: [
      { nivel: "Muy Alto", max: 200, descripcion: "< 200 lux - Muy bajo" },
      { nivel: "Alto", min: 200, max: 300, descripcion: "200-300 lux - Bajo" },
      { nivel: "Medio", min: 300, max: 500, descripcion: "300-500 lux - Aceptable (oficinas)" },
      { nivel: "Bajo", min: 500, descripcion: "> 500 lux - Óptimo" }
    ],
    unidad: "lux"
  },
  "Temperaturas extremas (calor o frío)": {
    valores_tipicos: [15, 17, 20, 22, 24, 27, 30, 35],
    rangos: [
      { nivel: "Alto", max: 17, descripcion: "< 17°C - Frío" },
      { nivel: "Bajo", min: 17, max: 27, descripcion: "17-27°C - Rango aceptable" },
      { nivel: "Alto", min: 27, descripcion: "> 27°C - Calor" }
    ],
    unidad: "°C"
  },
  "Radiaciones ionizantes y no ionizantes": {
    valores_tipicos: [0.1, 0.5, 1, 5, 10, 20],
    rangos: [
      { nivel: "Bajo", max: 1, descripcion: "< 1 mSv/año - Público general" },
      { nivel: "Medio", min: 1, max: 6, descripcion: "1-6 mSv/año - Moderado" },
      { nivel: "Alto", min: 6, max: 20, descripcion: "6-20 mSv/año - Ocupacional" },
      { nivel: "Muy Alto", min: 20, descripcion: "> 20 mSv/año - Excede límite" }
    ],
    unidad: "mSv/año"
  },
  // Peligros Químicos
  "Polvos": {
    valores_tipicos: [2, 5, 8, 10, 15, 20],
    rangos: [
      { nivel: "Bajo", max: 5, descripcion: "< 5 mg/m³ - Aceptable" },
      { nivel: "Medio", min: 5, max: 8, descripcion: "5-8 mg/m³ - Moderado" },
      { nivel: "Alto", min: 8, max: 10, descripcion: "8-10 mg/m³ - Precaución" },
      { nivel: "Muy Alto", min: 10, descripcion: "> 10 mg/m³ - Excede VLP" }
    ],
    unidad: "mg/m³"
  },
  "Vapores": {
    valores_tipicos: [25, 50, 100, 200, 500],
    rangos: [
      { nivel: "Bajo", max: 50, descripcion: "< 50 ppm - Bajo" },
      { nivel: "Medio", min: 50, max: 200, descripcion: "50-200 ppm - Moderado" },
      { nivel: "Alto", min: 200, descripcion: "> 200 ppm - Verificar MSDS" }
    ],
    unidad: "ppm"
  },
  "Gases": {
    valores_tipicos: [25, 50, 100, 200, 500],
    rangos: [
      { nivel: "Bajo", max: 50, descripcion: "< 50 ppm - Bajo" },
      { nivel: "Medio", min: 50, max: 200, descripcion: "50-200 ppm - Moderado" },
      { nivel: "Alto", min: 200, descripcion: "> 200 ppm - Verificar MSDS" }
    ],
    unidad: "ppm"
  },
  "Humos metálicos": {
    valores_tipicos: [1, 2, 5, 10],
    rangos: [
      { nivel: "Bajo", max: 2, descripcion: "< 2 mg/m³ - Aceptable" },
      { nivel: "Medio", min: 2, max: 5, descripcion: "2-5 mg/m³ - Moderado" },
      { nivel: "Alto", min: 5, descripcion: "> 5 mg/m³ - Alto" }
    ],
    unidad: "mg/m³"
  },
  // Peligros Biomecánicos/Ergonómicos
  "Posturas forzadas": {
    valores_tipicos: [1, 2, 3, 4, 6, 8],
    rangos: [
      { nivel: "Bajo", max: 2, descripcion: "< 2 h/día - Aceptable" },
      { nivel: "Medio", min: 2, max: 4, descripcion: "2-4 h/día - Moderado" },
      { nivel: "Alto", min: 4, max: 6, descripcion: "4-6 h/día - Alto" },
      { nivel: "Muy Alto", min: 6, descripcion: "> 6 h/día - Muy alto" }
    ],
    unidad: "horas/día"
  },
  "Movimientos repetitivos": {
    valores_tipicos: [10, 15, 20, 25, 30, 40],
    rangos: [
      { nivel: "Bajo", max: 15, descripcion: "< 15 rep/min - Aceptable" },
      { nivel: "Medio", min: 15, max: 25, descripcion: "15-25 rep/min - Moderado" },
      { nivel: "Alto", min: 25, descripcion: "> 25 rep/min - Alto riesgo" }
    ],
    unidad: "repeticiones/min"
  },
  "Manipulación manual de cargas": {
    valores_tipicos: [5, 10, 15, 20, 25, 30],
    rangos: [
      { nivel: "Bajo", max: 15, descripcion: "< 15 kg - Aceptable" },
      { nivel: "Medio", min: 15, max: 20, descripcion: "15-20 kg - Moderado" },
      { nivel: "Alto", min: 20, max: 25, descripcion: "20-25 kg - Precaución" },
      { nivel: "Muy Alto", min: 25, descripcion: "> 25 kg - Excede VLP" }
    ],
    unidad: "kg"
  },
  "Sobreesfuerzo": {
    valores_tipicos: [5, 10, 15, 20, 25],
    rangos: [
      { nivel: "Bajo", max: 10, descripcion: "< 10 kg - Aceptable" },
      { nivel: "Medio", min: 10, max: 20, descripcion: "10-20 kg - Moderado" },
      { nivel: "Alto", min: 20, descripcion: "> 20 kg - Alto" }
    ],
    unidad: "kg"
  },
  "Trabajo prolongado en posición de pie o sentado": {
    valores_tipicos: [2, 3, 4, 5, 6, 8],
    rangos: [
      { nivel: "Bajo", max: 2, descripcion: "< 2 h continuas - Aceptable" },
      { nivel: "Medio", min: 2, max: 4, descripcion: "2-4 h continuas - Moderado" },
      { nivel: "Alto", min: 4, descripcion: "> 4 h continuas - Excede VLP" }
    ],
    unidad: "horas/día"
  },
  // Peligros Psicosociales
  "Estrés laboral": {
    valores_tipicos: [10, 20, 30, 40, 50, 60, 70, 80],
    rangos: [
      { nivel: "Bajo", max: 25, descripcion: "< 25 - Sin riesgo" },
      { nivel: "Medio", min: 25, max: 50, descripcion: "25-50 - Riesgo bajo" },
      { nivel: "Alto", min: 50, max: 75, descripcion: "50-75 - Riesgo medio" },
      { nivel: "Muy Alto", min: 75, descripcion: "> 75 - Riesgo alto" }
    ],
    unidad: "puntaje batería"
  },
  "Carga mental": {
    valores_tipicos: [10, 20, 30, 40, 50, 60, 70, 80],
    rangos: [
      { nivel: "Bajo", max: 25, descripcion: "< 25 - Sin riesgo" },
      { nivel: "Medio", min: 25, max: 50, descripcion: "25-50 - Riesgo bajo" },
      { nivel: "Alto", min: 50, max: 75, descripcion: "50-75 - Riesgo medio" },
      { nivel: "Muy Alto", min: 75, descripcion: "> 75 - Riesgo alto" }
    ],
    unidad: "puntaje batería"
  },
  "Turnos extensos o rotativos": {
    valores_tipicos: [6, 8, 10, 12],
    rangos: [
      { nivel: "Bajo", max: 8, descripcion: "<= 8 h/día - Jornada normal" },
      { nivel: "Medio", min: 8, max: 10, descripcion: "8-10 h/día - Extendida" },
      { nivel: "Alto", min: 10, descripcion: "> 10 h/día - Excede límite" }
    ],
    unidad: "horas/día"
  },
  "Trabajo bajo presión": {
    valores_tipicos: [10, 20, 30, 40, 50, 60, 70, 80],
    rangos: [
      { nivel: "Bajo", max: 25, descripcion: "< 25 - Sin riesgo" },
      { nivel: "Medio", min: 25, max: 50, descripcion: "25-50 - Riesgo bajo" },
      { nivel: "Alto", min: 50, max: 75, descripcion: "50-75 - Riesgo medio" },
      { nivel: "Muy Alto", min: 75, descripcion: "> 75 - Riesgo alto" }
    ],
    unidad: "puntaje batería"
  }
};

// Función helper para generar opciones de valor medido
const getValorMedidoOptions = (clasificacion: string | undefined): ValorMedidoOption[] => {
  const options: ValorMedidoOption[] = [];

  // Siempre incluir opciones de texto descriptivo al inicio
  options.push(...OPCIONES_VALOR_MEDIDO_TEXTO);

  // Si hay clasificación con valores sugeridos, agregar opciones numéricas
  if (clasificacion && VALORES_MEDIDOS_SUGERIDOS[clasificacion]) {
    const data = VALORES_MEDIDOS_SUGERIDOS[clasificacion];

    // Agregar valores típicos
    data.valores_tipicos.forEach(v => {
      options.push({
        tipo: 'valor',
        valor: String(v),
        label: `${v} ${data.unidad}`,
        descripcion: ''
      });
    });

    // Agregar rangos de referencia
    data.rangos.forEach(r => {
      options.push({
        tipo: 'rango',
        valor: String(r.min ?? r.max ?? 0),
        label: r.descripcion,
        descripcion: `Nivel ${r.nivel}`
      });
    });
  }

  return options;
};

// Descripciones de peligros y efectos posibles por clasificación
const DESCRIPCIONES_PELIGROS: Record<string, { descripciones: string[], efectos: string[] }> = {
  // Peligros Físicos
  "Ruido": {
    descripciones: [
      "Exposición continua a ruido generado por maquinaria, equipos y procesos industriales",
      "Ruido intermitente producido por herramientas neumáticas y eléctricas",
      "Ruido de impacto generado por operaciones de martillado, troquelado o prensado"
    ],
    efectos: [
      "Hipoacusia neurosensorial (pérdida auditiva inducida por ruido)",
      "Trauma acústico, fatiga auditiva temporal",
      "Estrés, irritabilidad, trastornos del sueño",
      "Dificultad para comunicarse, disminución de la concentración"
    ]
  },
  "Vibraciones": {
    descripciones: [
      "Vibración transmitida al sistema mano-brazo por herramientas vibratorias",
      "Vibración de cuerpo entero transmitida por vehículos y maquinaria pesada"
    ],
    efectos: [
      "Síndrome de vibración mano-brazo, enfermedad de Raynaud",
      "Trastornos musculoesqueléticos en columna vertebral",
      "Alteraciones circulatorias, entumecimiento y hormigueo"
    ]
  },
  "Iluminación inadecuada": {
    descripciones: [
      "Iluminación insuficiente en áreas de trabajo que requieren precisión visual",
      "Deslumbramiento directo o reflejado en pantallas y superficies brillantes"
    ],
    efectos: [
      "Fatiga visual, astenopía, ojo seco",
      "Cefalea tensional, dolor ocular",
      "Errores en tareas de precisión"
    ]
  },
  "Temperaturas extremas (calor o frío)": {
    descripciones: [
      "Exposición a altas temperaturas en procesos de fundición, hornos y calderas",
      "Trabajo en ambientes fríos como cámaras de refrigeración"
    ],
    efectos: [
      "Golpe de calor, agotamiento por calor, deshidratación",
      "Hipotermia, congelamiento de extremidades",
      "Enfermedades cardiovasculares exacerbadas"
    ]
  },
  "Video terminales": {
    descripciones: [
      "Uso prolongado de computadores sin pausas activas",
      "Mala postura frente a pantallas de visualización de datos (PVD)"
    ],
    efectos: [
      "Síndrome visual informático, ojo seco",
      "Trastornos musculoesqueléticos cervicales y de hombros",
      "Síndrome del túnel carpiano por uso prolongado de mouse/teclado"
    ]
  },
  // Peligros Químicos
  "Polvo (mineral, vegetal, orgánico)": {
    descripciones: [
      "Inhalación de polvo de madera, fibras vegetales",
      "Exposición a polvo mineral en minería y construcción"
    ],
    efectos: [
      "Neumoconiosis (silicosis, asbestosis)",
      "Enfermedad pulmonar obstructiva crónica (EPOC)",
      "Asma ocupacional, rinitis alérgica"
    ]
  },
  "Sílice cristalina": {
    descripciones: [
      "Inhalación de polvo de sílice en operaciones de corte, pulido de piedra",
      "Chorreado con arena, demolición de concreto"
    ],
    efectos: [
      "Silicosis (fibrosis pulmonar irreversible)",
      "Mayor riesgo de tuberculosis pulmonar",
      "Cáncer de pulmón, EPOC"
    ]
  },
  "Vapores y gases tóxicos": {
    descripciones: [
      "Exposición a vapores de solventes orgánicos (tolueno, xileno, acetona)",
      "Inhalación de gases tóxicos (monóxido de carbono, cloro, amoníaco)"
    ],
    efectos: [
      "Intoxicación aguda, mareo, náuseas",
      "Daño hepático y renal crónico",
      "Irritación de vías respiratorias, edema pulmonar"
    ]
  },
  // Peligros Biomecánicos
  "Posturas forzadas (sedente, bipedestación prolongada)": {
    descripciones: [
      "Permanecer sentado más de 6 horas continuas sin pausas",
      "Bipedestación prolongada en labores de atención al público"
    ],
    efectos: [
      "Dolor lumbar crónico, lumbago",
      "Trastornos circulatorios (varices, edema)",
      "Fatiga muscular, contracturas cervicales"
    ]
  },
  "Movimientos repetitivos": {
    descripciones: [
      "Movimientos repetitivos de muñeca y dedos en digitación",
      "Ciclos de trabajo menores a 30 segundos repetidos continuamente"
    ],
    efectos: [
      "Síndrome del túnel carpiano",
      "Tendinitis de muñeca, codo (epicondilitis)",
      "Lesiones por trauma acumulativo"
    ]
  },
  "Manipulación manual de cargas": {
    descripciones: [
      "Levantamiento de objetos pesados (>25 kg) sin ayudas mecánicas",
      "Transporte manual de cargas en distancias prolongadas"
    ],
    efectos: [
      "Hernia discal lumbar",
      "Lumbalgia mecánica aguda o crónica",
      "Lesiones musculoesqueléticas de hombro y espalda"
    ]
  },
  // Peligros Psicosociales
  "Estrés laboral": {
    descripciones: [
      "Altas demandas laborales con bajo control sobre el trabajo",
      "Presión de tiempo constante, plazos ajustados"
    ],
    efectos: [
      "Síndrome de burnout (agotamiento profesional)",
      "Trastornos de ansiedad y depresión",
      "Hipertensión arterial, enfermedades cardiovasculares"
    ]
  },
  "Carga mental": {
    descripciones: [
      "Procesamiento continuo de información compleja",
      "Toma de decisiones críticas bajo presión"
    ],
    efectos: [
      "Fatiga mental, dificultad de concentración",
      "Cefalea tensional, irritabilidad",
      "Trastornos de ansiedad"
    ]
  },
};

// Diccionario de controles estándar por tipo de factor
const CONTROLES_ESTANDAR: Record<string, {
  fuente?: string;
  medio?: string;
  individuo?: string;
  peor_consecuencia?: string;
  eliminacion?: string;
  sustitucion?: string;
  controles_ingenieria?: string;
  controles_administrativos?: string;
  senalizacion?: string;
  epp_requerido?: string;
}> = {
  "Ruido": {
    fuente: "Aislamiento acústico de maquinaria, mantenimiento preventivo de equipos ruidosos",
    medio: "Barreras acústicas, mamparas, encerramientos, tratamiento acústico de paredes",
    individuo: "Protectores auditivos tipo copa o inserción, rotación de personal",
    peor_consecuencia: "Hipoacusia neurosensorial irreversible",
    controles_ingenieria: "Instalar silenciadores, aislar fuentes de ruido, reemplazar equipos ruidosos",
    controles_administrativos: "Reducir tiempo de exposición, rotación de puestos, pausas activas",
    senalizacion: "Señalización de áreas con alto nivel de ruido, demarcación de zonas",
    epp_requerido: "Protectores auditivos certificados (copa o inserción) con NRR adecuado"
  },
  "Iluminación": {
    fuente: "Mejorar luminarias, aumentar potencia, luz natural",
    medio: "Redistribución de puntos de luz, superficies reflectantes",
    individuo: "Descansos visuales cada 2 horas, exámenes visuales periódicos",
    peor_consecuencia: "Fatiga visual crónica, disminución de agudeza visual",
    controles_ingenieria: "Instalar iluminación LED adecuada, aprovechamiento de luz natural",
    controles_administrativos: "Pausas visuales, mantenimiento de luminarias",
    senalizacion: "No aplica",
    epp_requerido: "No aplica"
  },
  "Posturas prolongadas": {
    fuente: "Rediseño ergonómico de estaciones de trabajo",
    medio: "Mobiliario ergonómico ajustable",
    individuo: "Pausas activas cada hora, ejercicios de estiramiento",
    peor_consecuencia: "Desórdenes musculoesqueléticos, hernias discales",
    eliminacion: "Automatización de tareas repetitivas",
    sustitucion: "Rotación de puestos de trabajo",
    controles_ingenieria: "Sillas ergonómicas, escritorios ajustables, soportes para monitor",
    controles_administrativos: "Programa de pausas activas, capacitación en higiene postural",
    epp_requerido: "No aplica"
  },
  "Manipulación manual de cargas": {
    fuente: "Reducir peso de cargas, dividir cargas pesadas",
    medio: "Ayudas mecánicas (carretillas, montacargas)",
    individuo: "Capacitación en técnica de levantamiento, fortalecimiento muscular",
    peor_consecuencia: "Hernias discales, lesiones lumbares crónicas",
    eliminacion: "Automatización de procesos de carga",
    sustitucion: "Uso de equipos mecánicos para manipulación",
    controles_ingenieria: "Transpaletas, montacargas, grúas",
    controles_administrativos: "Límite de peso por persona (25 kg), trabajo en equipo para cargas pesadas",
    senalizacion: "Señalización de peso de cargas",
    epp_requerido: "Faja lumbar (como complemento, no como control principal), guantes antideslizantes"
  },
  "Movimiento repetitivo": {
    fuente: "Rediseño de tareas para reducir repetitividad",
    medio: "Herramientas ergonómicas, automatización parcial",
    individuo: "Rotación de tareas, pausas activas, ejercicios de estiramiento",
    peor_consecuencia: "Síndrome de túnel carpiano, tendinitis crónica",
    sustitucion: "Automatización de movimientos repetitivos",
    controles_ingenieria: "Herramientas con diseño ergonómico, reducción de fuerza requerida",
    controles_administrativos: "Rotación de puestos cada 2 horas, micropausas cada 30 minutos",
    epp_requerido: "Muñequeras ergonómicas (solo como complemento)"
  },
  "Estrés térmico": {
    fuente: "Aislar fuentes de calor, ventilación natural",
    medio: "Ventilación forzada, aire acondicionado, barreras térmicas",
    individuo: "Hidratación constante, aclimatación gradual, rotación",
    peor_consecuencia: "Golpe de calor, deshidratación severa",
    controles_ingenieria: "Ventilación mecánica, aire acondicionado, aislamiento térmico",
    controles_administrativos: "Reducir tiempo de exposición, pausas en áreas frescas, hidratación",
    epp_requerido: "Ropa de trabajo liviana y transpirable, gorras con protección solar"
  },
  "Químico": {
    fuente: "Sustitución por sustancias menos peligrosas, procesos cerrados",
    medio: "Ventilación localizada, extracción de vapores, cabinas",
    individuo: "EPP respiratorio, capacitación en manejo de químicos",
    peor_consecuencia: "Intoxicación aguda, enfermedades respiratorias crónicas",
    eliminacion: "Eliminación del agente químico del proceso",
    sustitucion: "Reemplazo por productos menos tóxicos",
    controles_ingenieria: "Sistemas de extracción localizada, procesos cerrados, cabinas de flujo laminar",
    controles_administrativos: "Procedimientos seguros de trabajo, fichas de seguridad disponibles, capacitación",
    senalizacion: "Señalización de riesgo químico, etiquetado de sustancias",
    epp_requerido: "Respirador con filtros apropiados, guantes químicos, gafas de seguridad, ropa protectora"
  },
  "Biológico": {
    fuente: "Esterilización, desinfección de áreas",
    medio: "Barreras físicas, ventilación adecuada",
    individuo: "Inmunizaciones, higiene personal, EPP",
    peor_consecuencia: "Infecciones graves, enfermedades transmisibles",
    eliminacion: "Eliminar la fuente de exposición cuando sea posible",
    sustitucion: "Procesos que minimicen el contacto con agentes biológicos",
    controles_ingenieria: "Cabinas de bioseguridad, autoclave, sistemas de ventilación",
    controles_administrativos: "Protocolos de bioseguridad, programa de vacunación, lavado de manos",
    senalizacion: "Señalización de riesgo biológico, áreas restringidas",
    epp_requerido: "Guantes, mascarilla, bata, gafas de protección"
  }
};

const ProfesiogramasCargo: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Data sources
  const [cargos, setCargos] = useState<CargoOption[]>([]);
  const [fullCargos, setFullCargos] = useState<Cargo[]>([]);
  const [factoresList, setFactoresList] = useState<FactorRiesgo[]>([]);
  const [examenesList, setExamenesList] = useState<TipoExamen[]>([]);
  const [criteriosList, setCriteriosList] = useState<CriterioExclusion[]>([]);
  const [inmunizacionesList, setInmunizacionesList] = useState<Inmunizacion[]>(
    [],
  );

  // Selection state
  const [selectedCargoId, setSelectedCargoId] = useState<number | "">("");
  const [currentProfesiogramaId, setCurrentProfesiogramaId] = useState<
    number | null
  >(null);
  const [currentProfesiogramaVersion, setCurrentProfesiogramaVersion] =
    useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Duplicate dialog state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateTargetCargos, setDuplicateTargetCargos] = useState<number[]>([]);
  const [duplicateResults, setDuplicateResults] = useState<ProfesiogramaDuplicateResult[]>([]);
  const [duplicateAsActive, setDuplicateAsActive] = useState(true);

  // Form state
  const [selectedFactores, setSelectedFactores] = useState<number[]>([]);
  const [factoresConfig, setFactoresConfig] = useState<
    Record<number, FactorMatrizConfig>
  >({});
  const [selectedExamenes, setSelectedExamenes] = useState<number[]>([]);
  const [examenesConfig, setExamenesConfig] = useState<
    Record<
      number,
      Record<
        TipoEvaluacionExamen,
        { enabled: boolean; obligatorio: boolean; periodicidad_meses?: number }
      >
    >
  >({});
  const [selectedCriterios, setSelectedCriterios] = useState<number[]>([]);
  const [selectedInmunizaciones, setSelectedInmunizaciones] = useState<
    number[]
  >([]);
  const [observaciones, setObservaciones] = useState("");

  // New compliance fields
  const [posicionPredominante, setPosicionPredominante] = useState("");
  const [descripcionActividades, setDescripcionActividades] = useState("");
  const [periodicidadEmo, setPeriodicidadEmo] = useState(12);
  const [justificacionPeriodicidad, setJustificacionPeriodicidad] =
    useState("");
  const [justificacionTouched, setJustificacionTouched] = useState(false);
  const lastAutoJustificacionSignatureRef = useRef<string | null>(null);
  const [nivelRiesgo, setNivelRiesgo] = useState("medio");
  const [fechaRevision, setFechaRevision] = useState(
    new Date().toISOString().split("T")[0],
  );

  const normalizeMultiSelect = (value: unknown): number[] => {
    if (!Array.isArray(value)) return [];
    return value.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
  };

  const getFactorDefaults = (): FactorMatrizConfig => ({
    tiempo_exposicion_horas: 8,
  });

  const upsertFactorConfig = (
    factorId: number,
    patch: Partial<FactorMatrizConfig>,
  ) => {
    setFactoresConfig((prev) => ({
      ...prev,
      [factorId]: { ...getFactorDefaults(), ...prev[factorId], ...patch },
    }));
  };

  const computeNP = (nd?: number, ne?: number) => {
    if (nd == null || ne == null) return null;
    return nd * ne;
  };

  const computeNR = (nd?: number, ne?: number, nc?: number) => {
    if (nd == null || ne == null || nc == null) return null;
    return nd * ne * nc;
  };

  const classifyIntervention = (nr: number | null) => {
    if (nr == null) return null;
    if (nr >= 600) return "I - Crítico";
    if (nr >= 150) return "II - Urgente";
    if (nr >= 40) return "III - Mejorar";
    return "IV - Aceptable";
  };

  const classifyAceptabilidad = (nr: number | null) => {
    if (nr == null) return null;
    if (nr >= 150) return "No aceptable";
    if (nr >= 40) return "Aceptable con controles";
    return "Aceptable";
  };

  const mapNivelExposicionFromNR = (
    nr: number | null,
  ): "bajo" | "medio" | "alto" | "muy_alto" => {
    if (nr == null) return "bajo";
    if (nr >= 600) return "muy_alto";
    if (nr >= 150) return "alto";
    if (nr >= 40) return "medio";
    return "bajo";
  };

  const sugerirControlesTipicos = (factorId: number) => {
    const factor = factoresList.find((f) => f.id === factorId);
    if (!factor) return;

    const nombreFactor = factor.nombre;
    const controles = CONTROLES_ESTANDAR[nombreFactor];

    if (!controles) {
      enqueueSnackbar(`No hay controles predefinidos para "${nombreFactor}". Puede ingresarlos manualmente.`, {
        variant: "info",
      });
      return;
    }

    // Aplicar solo los controles que no estén ya completados
    const currentConfig = factoresConfig[factorId] || {};
    const updates: Partial<FactorMatrizConfig> = {};

    if (controles.fuente && (!currentConfig.fuente || currentConfig.fuente.trim().length === 0)) {
      updates.fuente = controles.fuente;
    }
    if (controles.medio && (!currentConfig.medio || currentConfig.medio.trim().length === 0)) {
      updates.medio = controles.medio;
    }
    if (controles.individuo && (!currentConfig.individuo || currentConfig.individuo.trim().length === 0)) {
      updates.individuo = controles.individuo;
    }
    if (controles.peor_consecuencia && (!currentConfig.peor_consecuencia || currentConfig.peor_consecuencia.trim().length === 0)) {
      updates.peor_consecuencia = controles.peor_consecuencia;
    }
    if (controles.eliminacion && (!currentConfig.eliminacion || currentConfig.eliminacion.trim().length === 0)) {
      updates.eliminacion = controles.eliminacion;
    }
    if (controles.sustitucion && (!currentConfig.sustitucion || currentConfig.sustitucion.trim().length === 0)) {
      updates.sustitucion = controles.sustitucion;
    }
    if (controles.controles_ingenieria && (!currentConfig.controles_ingenieria || currentConfig.controles_ingenieria.trim().length === 0)) {
      updates.controles_ingenieria = controles.controles_ingenieria;
    }
    if (controles.controles_administrativos && (!currentConfig.controles_administrativos || currentConfig.controles_administrativos.trim().length === 0)) {
      updates.controles_administrativos = controles.controles_administrativos;
    }
    if (controles.senalizacion && (!currentConfig.senalizacion || currentConfig.senalizacion.trim().length === 0)) {
      updates.senalizacion = controles.senalizacion;
    }
    if (controles.epp_requerido && (!currentConfig.epp_requerido || currentConfig.epp_requerido.trim().length === 0)) {
      updates.epp_requerido = controles.epp_requerido;
    }

    if (Object.keys(updates).length > 0) {
      upsertFactorConfig(factorId, updates);
      enqueueSnackbar("Controles típicos aplicados correctamente", {
        variant: "success",
      });
    } else {
      enqueueSnackbar("Los campos ya están completados", {
        variant: "info",
      });
    }
  };

  const computeNextVersion = (versions: Array<string | undefined | null>) => {
    const numeric = versions
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean)
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));
    const max = numeric.length > 0 ? Math.max(...numeric) : 1.0;
    const next = Math.round((max + 0.1) * 10) / 10;
    return next.toFixed(1);
  };

  const createDefaultExamenConfig = (ingresoEnabled: boolean) =>
    ({
      ingreso: { enabled: ingresoEnabled, obligatorio: true },
      periodico: { enabled: false, obligatorio: true, periodicidad_meses: 12 },
      retiro: { enabled: false, obligatorio: true },
      cambio_cargo: { enabled: false, obligatorio: true },
      post_incapacidad: { enabled: false, obligatorio: true },
      reincorporacion: { enabled: false, obligatorio: true },
    }) as Record<
      TipoEvaluacionExamen,
      { enabled: boolean; obligatorio: boolean; periodicidad_meses?: number }
    >;

  const loadInitialData = useCallback(async () => {
    try {
      const [
        cargosList,
        factoresData,
        examenesData,
        criteriosData,
        inmunizacionesData,
      ] = await Promise.all([
        cargoService.getActiveCargos(),
        profesiogramaService.listFactoresRiesgo({ activo: true }),
        profesiogramaService.listTiposExamen({ activo: true }),
        profesiogramaService.listCriteriosExclusion({ activo: true }),
        profesiogramaService.listInmunizaciones({ activo: true }),
      ]);
      setFullCargos(cargosList);
      setCargos(cargoService.convertCargosToOptions(cargosList));
      setFactoresList(factoresData);
      setExamenesList(examenesData);
      setCriteriosList(criteriosData);
      setInmunizacionesList(inmunizacionesData);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al cargar datos iniciales", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedCargoId) {
      loadProfesiograma(selectedCargoId as number);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCargoId]);

  useEffect(() => {
    setExamenesConfig((prev) => {
      const next: Record<
        number,
        Record<
          TipoEvaluacionExamen,
          {
            enabled: boolean;
            obligatorio: boolean;
            periodicidad_meses?: number;
          }
        >
      > = {};
      selectedExamenes.forEach((examenId) => {
        const current = prev[examenId];
        next[examenId] = current
          ? { ...createDefaultExamenConfig(false), ...current }
          : createDefaultExamenConfig(true);
        if (next[examenId].periodico.periodicidad_meses == null) {
          next[examenId].periodico.periodicidad_meses = 12;
        }
      });
      return next;
    });
  }, [selectedExamenes]);

  useEffect(() => {
    const getUnidadFromCatalogo = (factorId: number) => {
      const factor = factoresList.find((f) => f.id === factorId);
      const unidad = (factor as any)?.unidad_medida;
      const simbolo = (factor as any)?.simbolo_unidad;
      const value = (unidad || simbolo || "").toString();
      return value;
    };

    const autoCompleteFromCatalogo = (factorId: number, prevConfig: FactorMatrizConfig): FactorMatrizConfig => {
      const factor = factoresList.find((f) => f.id === factorId);
      if (!factor) return prevConfig;

      const config = { ...prevConfig };

      // Auto-completar zona_lugar desde el cargo seleccionado
      if (!config.zona_lugar || config.zona_lugar.trim().length === 0) {
        const cargo = fullCargos.find((c) => c.id === selectedCargoId);
        if (cargo) {
          const area = (cargo as any)?.area;
          const ubicacion = (cargo as any)?.ubicacion;
          const departamento = (cargo as any)?.departamento;
          config.zona_lugar = area || ubicacion || departamento || "";
        }
      }

      // Auto-completar tipo_peligro desde categoria
      if (!config.tipo_peligro || config.tipo_peligro.trim().length === 0) {
        const categoria = (factor as any)?.categoria;
        if (categoria) {
          // Convertir de "fisico" a "Físico"
          const categoriaMap: Record<string, string> = {
            fisico: "Físico",
            quimico: "Químico",
            biologico: "Biológico",
            ergonomico: "Ergonómico/Biomecánico",
            psicosocial: "Psicosocial",
            seguridad: "Condiciones de Seguridad",
          };
          config.tipo_peligro = categoriaMap[categoria] || categoria;
        }
      }

      // Auto-completar clasificacion_peligro desde nombre
      if (!config.clasificacion_peligro || config.clasificacion_peligro.trim().length === 0) {
        config.clasificacion_peligro = (factor as any)?.nombre || "";
      }

      // Auto-completar descripcion_peligro desde descripcion
      if (!config.descripcion_peligro || config.descripcion_peligro.trim().length === 0) {
        config.descripcion_peligro = (factor as any)?.descripcion || "";
      }

      // Auto-completar requisito_legal desde normativa_aplicable
      if (!config.requisito_legal || config.requisito_legal.trim().length === 0) {
        config.requisito_legal = (factor as any)?.normativa_aplicable || "";
      }

      return config;
    };

    setFactoresConfig((prev) => {
      const next: Record<number, FactorMatrizConfig> = {};

      selectedFactores.forEach((factorId) => {
        const merged: FactorMatrizConfig = {
          ...getFactorDefaults(),
          ...(prev[factorId] || {}),
        };

        // Auto-completar unidad_medida
        const unidadCatalogo = getUnidadFromCatalogo(factorId);
        const unidadActual = (merged.unidad_medida || "").toString();

        if (
          unidadActual.trim().length === 0 &&
          unidadCatalogo.trim().length > 0
        ) {
          merged.unidad_medida = unidadCatalogo;
        }

        // Auto-completar campos de identificación del peligro desde catálogo
        const autoCompleted = autoCompleteFromCatalogo(factorId, merged);

        next[factorId] = autoCompleted;
      });

      return next;
    });
  }, [selectedFactores, factoresList, fullCargos, selectedCargoId]);

  useEffect(() => {
    const cargoId =
      typeof selectedCargoId === "number" ? selectedCargoId : null;
    if (!cargoId) return;

    if (periodicidadEmo <= 12) {
      lastAutoJustificacionSignatureRef.current = null;
      setJustificacionTouched(false);
      setJustificacionPeriodicidad("");
      return;
    }

    if (justificacionTouched) return;

    const idsSorted = [...selectedFactores].sort((a, b) => a - b);
    const factorParts = idsSorted.map((id) => {
      const cfg = factoresConfig[id] || {};
      return `${id}:${cfg.nd ?? ""}:${cfg.ne ?? ""}:${cfg.nc ?? ""}`;
    });
    const signature = `${cargoId}|${periodicidadEmo}|${factorParts.join("|")}`;

    if (lastAutoJustificacionSignatureRef.current === signature) return;

    let cancelled = false;

    (async () => {
      try {
        const sug = await profesiogramaService.buildEmoJustificacion(cargoId, {
          periodicidad_emo_meses: periodicidadEmo,
          factores: idsSorted.map((id) => {
            const cfg = factoresConfig[id] || {};
            return {
              factor_riesgo_id: id,
              nd: cfg.nd,
              ne: cfg.ne,
              nc: cfg.nc,
            };
          }),
        });

        if (cancelled) return;

        lastAutoJustificacionSignatureRef.current = signature;
        setJustificacionPeriodicidad(
          sug.justificacion_periodicidad_emo_borrador || "",
        );
      } catch (e) {
        // opcional: snackbar warning
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    selectedCargoId,
    periodicidadEmo,
    selectedFactores,
    factoresConfig,
    justificacionTouched,
    justificacionPeriodicidad,
  ]);

  const getPeriodicidadFromCargo = (cargo: Cargo): number => {
    if (!cargo.periodicidad_emo) return 12; // Default

    const p = cargo.periodicidad_emo.toLowerCase();
    if (p.includes("semestral") || p.includes("6")) return 6;
    if (p.includes("anual") || p.includes("12")) return 12;
    if (p.includes("bianual") || p.includes("24")) return 24;
    if (p.includes("trienal") || p.includes("36")) return 36;

    return 12;
  };

  const applyCargoDefaults = (cargoId: number) => {
    const cargo = fullCargos.find((c) => c.id === cargoId);
    if (cargo) {
      setPeriodicidadEmo(getPeriodicidadFromCargo(cargo));
    }
  };

  const loadProfesiograma = async (cargoId: number) => {
    setLoading(true);
    try {
      const prof = await profesiogramaService.getProfesiogramaByCargo(cargoId);
      if (prof) {
        setCurrentProfesiogramaId(prof.id);
        setCurrentProfesiogramaVersion(prof.version);
        // Updated to use the new association structure
        const factores =
          (prof as any).profesiograma_factores || (prof as any).factores || [];
        const factorIds = factores
          .map((pf: any) => pf.factor_riesgo?.id ?? pf.factor_riesgo_id)
          .filter((id: any) => id != null);
        setSelectedFactores(factorIds);
        setFactoresConfig(() => {
          const next: Record<number, FactorMatrizConfig> = {};
          factores.forEach((pf: any) => {
            const factorId = pf.factor_riesgo?.id ?? pf.factor_riesgo_id;
            if (factorId == null) return;
            next[factorId] = {
              ...getFactorDefaults(),
              proceso: pf.proceso ?? "",
              actividad: pf.actividad ?? "",
              tarea: pf.tarea ?? "",
              rutinario: pf.rutinario ?? undefined,
              // Identificación del peligro
              zona_lugar: pf.zona_lugar ?? "",
              tipo_peligro: pf.tipo_peligro ?? "",
              clasificacion_peligro: pf.clasificacion_peligro ?? "",
              descripcion_peligro: pf.descripcion_peligro ?? "",
              efectos_posibles: pf.efectos_posibles ?? "",
              // Evaluación GTC 45
              nd: pf.nd ?? undefined,
              ne: pf.ne ?? undefined,
              nc: pf.nc ?? undefined,
              tiempo_exposicion_horas:
                pf.tiempo_exposicion_horas != null
                  ? Number(pf.tiempo_exposicion_horas)
                  : 8,
              valor_medido:
                pf.valor_medido != null ? String(pf.valor_medido) : undefined,
              valor_limite_permisible:
                pf.valor_limite_permisible != null
                  ? String(pf.valor_limite_permisible)
                  : undefined,
              unidad_medida: pf.unidad_medida ?? "",
              // Controles existentes
              controles_existentes: pf.controles_existentes ?? "",
              fuente: pf.fuente ?? "",
              medio: pf.medio ?? "",
              individuo: pf.individuo ?? "",
              peor_consecuencia: pf.peor_consecuencia ?? "",
              requisito_legal: pf.requisito_legal ?? "",
              // Jerarquía de controles
              eliminacion: pf.eliminacion ?? "",
              sustitucion: pf.sustitucion ?? "",
              controles_ingenieria: pf.controles_ingenieria ?? "",
              controles_administrativos: pf.controles_administrativos ?? "",
              senalizacion: pf.senalizacion ?? "",
              epp_requerido: pf.epp_requerido ?? "",
            };
          });
          return next;
        });
        const profExamenes = prof.examenes || [];
        const examenIds = Array.from(
          new Set(
            profExamenes
              .map((pe: any) => pe.tipo_examen?.id ?? pe.tipo_examen_id)
              .filter((id: any) => id != null),
          ),
        );
        setSelectedExamenes(examenIds);
        setExamenesConfig(() => {
          const next: Record<
            number,
            Record<
              TipoEvaluacionExamen,
              {
                enabled: boolean;
                obligatorio: boolean;
                periodicidad_meses?: number;
              }
            >
          > = {};
          profExamenes.forEach((pe) => {
            const examenId =
              (pe as any).tipo_examen?.id ?? (pe as any).tipo_examen_id;
            if (examenId == null) return;
            if (!next[examenId]) {
              next[examenId] = createDefaultExamenConfig(false);
            }
            next[examenId] = {
              ...next[examenId],
              [pe.tipo_evaluacion]: {
                enabled: true,
                obligatorio: pe.obligatorio ?? true,
                periodicidad_meses:
                  pe.tipo_evaluacion === "periodico"
                    ? (pe.periodicidad_meses ?? 12)
                    : undefined,
              },
            };
          });
          return next;
        });
        setSelectedCriterios(
          (prof as any).criterios_exclusion_ids ||
            (prof as any).criterios_exclusion?.map((c: any) => c.id) ||
            [],
        );
        // Map inmunizaciones (if they exist in response, they have id, nombre, etc)
        // We only store IDs in selectedInmunizaciones for the UI
        setSelectedInmunizaciones(
          prof.inmunizaciones?.map(
            (i: any) => i.inmunizacion_id ?? i.inmunizacion?.id ?? i.id,
          ) || [],
        );

        setObservaciones(prof.observaciones || "");
        setPosicionPredominante(prof.posicion_predominante || "");
        setDescripcionActividades(prof.descripcion_actividades || "");
        setPeriodicidadEmo(prof.periodicidad_emo_meses || 12);
        setJustificacionPeriodicidad(prof.justificacion_periodicidad_emo || "");
        setNivelRiesgo(prof.nivel_riesgo_cargo || "medio");
        setFechaRevision(
          prof.fecha_ultima_revision || new Date().toISOString().split("T")[0],
        );
      } else {
        resetForm();
        applyCargoDefaults(cargoId);
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al cargar profesiograma del cargo", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFactores([]);
    setFactoresConfig({});
    setSelectedExamenes([]);
    setExamenesConfig({});
    setSelectedCriterios([]);
    setSelectedInmunizaciones([]);
    setObservaciones("");
    setPosicionPredominante("");
    setDescripcionActividades("");
    setPeriodicidadEmo(12);
    setJustificacionPeriodicidad("");
    setNivelRiesgo("medio");
    setFechaRevision(new Date().toISOString().split("T")[0]);
    setCurrentProfesiogramaId(null);
    setCurrentProfesiogramaVersion(null);
  };

  const handleDelete = () => {
    if (!currentProfesiogramaId) return;
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentProfesiogramaId) return;
    setDeleting(true);
    try {
      await profesiogramaService.deleteProfesiograma(currentProfesiogramaId);
      enqueueSnackbar("Profesiograma eliminado", { variant: "success" });
      setDeleteDialogOpen(false);
      resetForm();
      if (selectedCargoId) {
        applyCargoDefaults(selectedCargoId as number);
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al eliminar profesiograma", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenDuplicateDialog = () => {
    if (!currentProfesiogramaId) return;
    setDuplicateTargetCargos([]);
    setDuplicateResults([]);
    setDuplicateAsActive(true);
    setDuplicateDialogOpen(true);
  };

  const handleCloseDuplicateDialog = () => {
    setDuplicateDialogOpen(false);
    setDuplicateTargetCargos([]);
    setDuplicateResults([]);
    setDuplicateAsActive(true);
  };

  const handleConfirmDuplicate = async () => {
    if (!currentProfesiogramaId || duplicateTargetCargos.length === 0) return;
    setDuplicating(true);
    try {
      const results = await profesiogramaService.duplicateProfesiograma(
        currentProfesiogramaId,
        {
          cargo_ids: duplicateTargetCargos,
          estado: duplicateAsActive ? "activo" : "borrador",
        }
      );
      setDuplicateResults(results);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (successCount > 0 && failCount === 0) {
        enqueueSnackbar(
          `Profesiograma duplicado exitosamente a ${successCount} cargo(s)`,
          { variant: "success" }
        );
      } else if (successCount > 0 && failCount > 0) {
        enqueueSnackbar(
          `${successCount} exitoso(s), ${failCount} con errores`,
          { variant: "warning" }
        );
      } else {
        enqueueSnackbar("Error al duplicar profesiograma", { variant: "error" });
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al duplicar profesiograma", { variant: "error" });
    } finally {
      setDuplicating(false);
    }
  };

  const handleExportMatriz = async () => {
    if (!currentProfesiogramaId) return;
    setExportingExcel(true);
    try {
      const blob = await profesiogramaService.exportMatrizExcel(
        currentProfesiogramaId,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `matriz_gtc45_profesiograma_${currentProfesiogramaId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al exportar la matriz a Excel", {
        variant: "error",
      });
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedCargoId) return;
    setExportingPdf(true);
    try {
      const cargoId = selectedCargoId as number;
      const blob = await profesiogramaService.exportProfesiogramaPdfByCargo(
        cargoId,
        true,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profesiograma_cargo_${cargoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al exportar profesiograma a PDF", {
        variant: "error",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCargoId) return;

    const allowedPeriodicidades = [6, 12, 24, 36];
    if (!allowedPeriodicidades.includes(periodicidadEmo)) {
      enqueueSnackbar("La periodicidad EMO debe ser 6, 12, 24 o 36 meses", {
        variant: "error",
      });
      return;
    }

    if (periodicidadEmo > 12 && justificacionPeriodicidad.trim().length < 50) {
      enqueueSnackbar(
        "La justificación técnica es obligatoria (mínimo 50 caracteres) si la periodicidad es mayor a 12 meses",
        { variant: "error" },
      );
      return;
    }

    const allowedND: number[] = [2, 6, 10];
    const allowedNE: number[] = [1, 2, 3, 4];
    const allowedNC: number[] = [10, 25, 60, 100];

    for (const factorId of selectedFactores) {
      const cfg = factoresConfig[factorId] || {};
      const nd = cfg.nd as number | undefined;
      const ne = cfg.ne as number | undefined;
      const nc = cfg.nc as number | undefined;
      if (nd == null || ne == null || nc == null) {
        enqueueSnackbar(
          "Complete ND, NE y NC para todos los factores seleccionados (GTC 45)",
          { variant: "error" },
        );
        return;
      }
      if (
        !allowedND.includes(nd) ||
        !allowedNE.includes(ne) ||
        !allowedNC.includes(nc)
      ) {
        enqueueSnackbar(
          "Valores ND/NE/NC inválidos. Verifique la metodología GTC 45.",
          {
            variant: "error",
          },
        );
        return;
      }
      const horas = Number(cfg.tiempo_exposicion_horas ?? 0);
      if (!Number.isFinite(horas) || horas <= 0) {
        enqueueSnackbar(
          "Defina tiempo de exposición (h/día) válido para todos los factores.",
          {
            variant: "error",
          },
        );
        return;
      }
    }

    for (const examenId of selectedExamenes) {
      const cfgByTipo =
        examenesConfig[examenId] || createDefaultExamenConfig(true);
      const enabledTipos = Object.values(cfgByTipo).filter((c) => c.enabled);
      if (enabledTipos.length === 0) {
        enqueueSnackbar(
          "Debe seleccionar al menos un tipo de evaluación por cada examen",
          { variant: "error" },
        );
        return;
      }
      if (cfgByTipo.periodico.enabled) {
        const allowed = [6, 12, 24, 36];
        const p = cfgByTipo.periodico.periodicidad_meses;
        if (!p || !allowed.includes(p)) {
          enqueueSnackbar(
            "Debe definir periodicidad (6, 12, 24 o 36) para los exámenes periódicos",
            { variant: "error" },
          );
          return;
        }
      }
    }

    // Validación de VLP - verificar valores que exceden el límite permisible (solo si ambos son numéricos)
    const factoresExcedenVLP: string[] = [];
    for (const factorId of selectedFactores) {
      const cfg = factoresConfig[factorId] || {};
      if (cfg.valor_medido != null && cfg.valor_limite_permisible != null) {
        const numValorMedido = parseFloat(cfg.valor_medido);
        const numVLP = parseFloat(cfg.valor_limite_permisible);
        // Solo comparar si ambos valores son numéricos
        if (!isNaN(numValorMedido) && !isNaN(numVLP) && numValorMedido > numVLP) {
          const factorNombre =
            factoresList.find((f: FactorRiesgo) => f.id === factorId)?.nombre ||
            `Factor ${factorId}`;
          factoresExcedenVLP.push(
            `${factorNombre} (${cfg.valor_medido} > ${cfg.valor_limite_permisible} ${cfg.unidad_medida || ''})`
          );
        }
      }
    }

    if (factoresExcedenVLP.length > 0) {
      const confirmacion = window.confirm(
        `⚠️ ADVERTENCIA: Los siguientes factores de riesgo tienen valores medidos que EXCEDEN el Valor Límite Permisible:\n\n` +
        factoresExcedenVLP.map(f => `• ${f}`).join('\n') +
        `\n\nEsto indica una situación de riesgo que requiere:\n` +
        `- Implementación inmediata de controles\n` +
        `- Reducción de exposición\n` +
        `- Evaluación de reubicación de trabajadores\n` +
        `- ND debe ser 10 (Muy Alto) según GTC 45\n\n` +
        `¿Desea continuar guardando el profesiograma de todos modos?\n` +
        `(Se recomienda corregir los valores o implementar controles antes de guardar)`
      );

      if (!confirmacion) {
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        posicion_predominante: posicionPredominante,
        descripcion_actividades: descripcionActividades,
        periodicidad_emo_meses: periodicidadEmo,
        justificacion_periodicidad_emo: justificacionPeriodicidad,
        fecha_ultima_revision: fechaRevision,
        nivel_riesgo_cargo: nivelRiesgo,
        factores: selectedFactores.map((id) => {
          const cfg = { ...getFactorDefaults(), ...(factoresConfig[id] || {}) };
          const nr = computeNR(cfg.nd, cfg.ne, cfg.nc);
          const clean = (v?: string) =>
            v && v.trim().length > 0 ? v.trim() : undefined;
          return {
            factor_riesgo_id: id,
            nivel_exposicion: mapNivelExposicionFromNR(nr),
            tiempo_exposicion_horas: Number(cfg.tiempo_exposicion_horas ?? 8),
            valor_medido: clean(cfg.valor_medido),
            valor_limite_permisible: clean(cfg.valor_limite_permisible),
            unidad_medida: clean(cfg.unidad_medida),
            proceso: clean(cfg.proceso),
            actividad: clean(cfg.actividad),
            tarea: clean(cfg.tarea),
            rutinario: cfg.rutinario ?? undefined,
            // Identificación del peligro
            zona_lugar: clean(cfg.zona_lugar),
            tipo_peligro: clean(cfg.tipo_peligro),
            clasificacion_peligro: clean(cfg.clasificacion_peligro),
            descripcion_peligro: clean(cfg.descripcion_peligro),
            efectos_posibles: clean(cfg.efectos_posibles),
            // Evaluación GTC 45
            nd: cfg.nd,
            ne: cfg.ne,
            nc: cfg.nc,
            // Controles existentes
            controles_existentes: clean(cfg.controles_existentes),
            fuente: clean(cfg.fuente),
            medio: clean(cfg.medio),
            individuo: clean(cfg.individuo),
            peor_consecuencia: clean(cfg.peor_consecuencia),
            requisito_legal: clean(cfg.requisito_legal),
            // Jerarquía de controles
            eliminacion: clean(cfg.eliminacion),
            sustitucion: clean(cfg.sustitucion),
            controles_ingenieria: clean(cfg.controles_ingenieria),
            controles_administrativos: clean(cfg.controles_administrativos),
            senalizacion: clean(cfg.senalizacion),
            epp_requerido: clean(cfg.epp_requerido),
          };
        }),
        examenes: selectedExamenes.flatMap((id) => {
          const cfgByTipo =
            examenesConfig[id] || createDefaultExamenConfig(true);
          const tipos = Object.entries(cfgByTipo).filter(
            ([, c]) => c.enabled,
          ) as Array<
            [
              TipoEvaluacionExamen,
              {
                enabled: boolean;
                obligatorio: boolean;
                periodicidad_meses?: number;
              },
            ]
          >;
          return tipos.map(([tipo, cfg]) => ({
            tipo_examen_id: id,
            tipo_evaluacion: tipo,
            periodicidad_meses:
              tipo === "periodico" ? cfg.periodicidad_meses : undefined,
            obligatorio: cfg.obligatorio,
          }));
        }),
        criterios_exclusion_ids: selectedCriterios,
        inmunizaciones: selectedInmunizaciones.map((id) => ({
          inmunizacion_id: id,
        })),
        observaciones,
      };

      const versions = (
        await profesiogramaService.listProfesiogramasByCargo(
          selectedCargoId as number,
        )
      ).map((p) => p.version);
      const nextVersion =
        versions.length > 0 ? computeNextVersion(versions) : undefined;

      const saved = await profesiogramaService.createOrUpdateForCargo({
        cargo_id: selectedCargoId as number,
        estado: "activo",
        version: nextVersion,
        ...payload,
      } as any);

      resetForm();
      applyCargoDefaults(selectedCargoId as number);
      setCurrentProfesiogramaId(saved.id);
      setCurrentProfesiogramaVersion(saved.version);
      enqueueSnackbar("Profesiograma guardado exitosamente", {
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al guardar profesiograma", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const selectedCargo = fullCargos.find((c) => c.id === selectedCargoId);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configuración de Profesiograma por Cargo
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Seleccionar Cargo</InputLabel>
              <Select
                value={selectedCargoId}
                label="Seleccionar Cargo"
                onChange={(e) => setSelectedCargoId(e.target.value as number)}
              >
                {cargos.map((cargo) => (
                  <MenuItem key={cargo.value} value={cargo.value}>
                    {cargo.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {selectedCargoId && (
        <Paper sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Campos Generales Normativos */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Posición Predominante</InputLabel>
                  <Select
                    value={posicionPredominante}
                    label="Posición Predominante"
                    onChange={(e) => setPosicionPredominante(e.target.value)}
                  >
                    <MenuItem value="BÍPEDA">
                      <ListItemText
                        primary="BÍPEDA"
                        secondary="Riesgo varices, dolor lumbar, fatiga piernas"
                      />
                    </MenuItem>
                    <MenuItem value="SEDENTE">
                      <ListItemText
                        primary="SEDENTE"
                        secondary="Riesgo síndrome túnel carpiano, problemas columna"
                      />
                    </MenuItem>
                    <MenuItem value="MIXTA">
                      <ListItemText
                        primary="MIXTA"
                        secondary="Rotación postural insuficiente"
                      />
                    </MenuItem>
                    <MenuItem value="DECÚBITO">
                      <ListItemText
                        primary="DECÚBITO"
                        secondary="Compresión nerviosa, problemas cervicales"
                      />
                    </MenuItem>
                    <MenuItem value="FORZADA">
                      <ListItemText
                        primary="FORZADA"
                        secondary="Lesiones musculoesqueléticas específicas"
                      />
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Nivel de Riesgo</InputLabel>
                  <Select
                    value={nivelRiesgo}
                    label="Nivel de Riesgo"
                    onChange={(e) => setNivelRiesgo(e.target.value)}
                  >
                    <MenuItem value="bajo">Bajo (I)</MenuItem>
                    <MenuItem value="medio">Medio (II, III)</MenuItem>
                    <MenuItem value="alto">Alto (IV)</MenuItem>
                    <MenuItem value="muy_alto">Muy Alto (V)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción de Actividades"
                  value={descripcionActividades}
                  onChange={(e) => setDescripcionActividades(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Periodicidad EMO (Meses)</InputLabel>
                  <Select
                    value={periodicidadEmo}
                    label="Periodicidad EMO (Meses)"
                    onChange={(e) => setPeriodicidadEmo(Number(e.target.value))}
                  >
                    <MenuItem value={6}>6 Meses</MenuItem>
                    <MenuItem value={12}>12 Meses (Anual)</MenuItem>
                    <MenuItem value={24}>24 Meses (Bianual)</MenuItem>
                    <MenuItem value={36}>
                      36 Meses (Trienal - Máximo legal)
                    </MenuItem>
                  </Select>
                  {selectedCargo && selectedCargo.periodicidad_emo && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ mt: 0.5, ml: 1 }}
                    >
                      Configuración Cargo: {selectedCargo.periodicidad_emo}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  required={periodicidadEmo > 12}
                  label="Justificación Técnica"
                  value={justificacionPeriodicidad}
                  onChange={(e) => {
                    setJustificacionTouched(true);
                    setJustificacionPeriodicidad(e.target.value);
                  }}
                  disabled={periodicidadEmo <= 12}
                  helperText={
                    periodicidadEmo > 12
                      ? "Obligatoria si la periodicidad es mayor a 12 meses (mínimo 50 caracteres)"
                      : ""
                  }
                  inputProps={{
                    minLength: periodicidadEmo > 12 ? 50 : undefined,
                  }}
                />
              </Grid>

              {/* Factores de Riesgo */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Factores de Riesgo
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Seleccionar Factores</InputLabel>
                  <Select
                    multiple
                    value={selectedFactores}
                    onChange={(e) =>
                      setSelectedFactores(normalizeMultiSelect(e.target.value))
                    }
                    input={<OutlinedInput label="Seleccionar Factores" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={
                              factoresList.find((f) => f.id === value)?.nombre
                            }
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {factoresList.map((factor) => (
                      <MenuItem key={factor.id} value={factor.id}>
                        <Checkbox
                          checked={selectedFactores.indexOf(factor.id) > -1}
                        />
                        <ListItemText
                          primary={factor.nombre}
                          secondary={factor.descripcion}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedFactores.length > 0 && (
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    {selectedFactores.map((factorId) => {
                      const factor = factoresList.find(
                        (f) => f.id === factorId,
                      );
                      const cfg = {
                        ...getFactorDefaults(),
                        ...(factoresConfig[factorId] || {}),
                      };
                      const np = computeNP(cfg.nd, cfg.ne);
                      const nr = computeNR(cfg.nd, cfg.ne, cfg.nc);
                      const intervencion = classifyIntervention(nr);
                      const aceptabilidad = classifyAceptabilidad(nr);
                      return (
                        <Paper key={factorId} variant="outlined" sx={{ p: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography variant="subtitle1">
                              {factor?.nombre || `Factor ${factorId}`}
                            </Typography>
                            <Box
                              sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                            >
                              {np != null && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`NP ${np}`}
                                />
                              )}
                              {nr != null && (
                                <Chip
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  label={`NR ${nr}`}
                                />
                              )}
                              {intervencion && (
                                <Chip
                                  size="small"
                                  label={`Intervención ${intervencion}`}
                                />
                              )}
                              {aceptabilidad && (
                                <Chip size="small" label={aceptabilidad} />
                              )}
                            </Box>
                          </Box>

                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField
                                fullWidth
                                label="Proceso"
                                value={cfg.proceso ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    proceso: e.target.value,
                                  })
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField
                                fullWidth
                                label="Actividad"
                                value={cfg.actividad ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    actividad: e.target.value,
                                  })
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField
                                fullWidth
                                label="Tarea"
                                value={cfg.tarea ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    tarea: e.target.value,
                                  })
                                }
                              />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={!!cfg.rutinario}
                                    onChange={(e) =>
                                      upsertFactorConfig(factorId, {
                                        rutinario: e.target.checked,
                                      })
                                    }
                                  />
                                }
                                label="Rutinario"
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField
                                fullWidth
                                select
                                label="ND (Nivel de Deficiencia)"
                                value={cfg.nd ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    nd:
                                      e.target.value === ""
                                        ? undefined
                                        : (Number(e.target.value) as any),
                                  })
                                }
                                helperText="2=Medio, 6=Alto, 10=Muy Alto"
                              >
                                <MenuItem value="">Seleccionar</MenuItem>
                                <MenuItem value={2}>2 - Medio (Control incompleto)</MenuItem>
                                <MenuItem value={6}>6 - Alto (Control deficiente)</MenuItem>
                                <MenuItem value={10}>10 - Muy Alto (Sin control)</MenuItem>
                              </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField
                                fullWidth
                                select
                                label="NE"
                                value={cfg.ne ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    ne:
                                      e.target.value === ""
                                        ? undefined
                                        : (Number(e.target.value) as any),
                                  })
                                }
                              >
                                <MenuItem value="">Seleccionar</MenuItem>
                                <MenuItem value={1}>1</MenuItem>
                                <MenuItem value={2}>2</MenuItem>
                                <MenuItem value={3}>3</MenuItem>
                                <MenuItem value={4}>4</MenuItem>
                              </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField
                                fullWidth
                                select
                                label="NC"
                                value={cfg.nc ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    nc:
                                      e.target.value === ""
                                        ? undefined
                                        : (Number(e.target.value) as any),
                                  })
                                }
                              >
                                <MenuItem value="">Seleccionar</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={25}>25</MenuItem>
                                <MenuItem value={60}>60</MenuItem>
                                <MenuItem value={100}>100</MenuItem>
                              </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Tiempo exposición (h/día)"
                                value={cfg.tiempo_exposicion_horas ?? 8}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    tiempo_exposicion_horas: Number(
                                      e.target.value,
                                    ),
                                  })
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Autocomplete<ValorMedidoOption, false, false, true>
                                freeSolo
                                options={getValorMedidoOptions(cfg.clasificacion_peligro)}
                                groupBy={(option) => {
                                  if (option.tipo === 'texto') return 'Opciones descriptivas';
                                  if (option.tipo === 'valor') return 'Valores típicos';
                                  return 'Rangos de referencia';
                                }}
                                getOptionLabel={(option) => {
                                  if (typeof option === 'string') return option;
                                  return option.label;
                                }}
                                inputValue={cfg.valor_medido || ''}
                                onInputChange={(_, newInputValue) => {
                                  if (newInputValue === '') {
                                    upsertFactorConfig(factorId, { valor_medido: undefined });
                                  } else {
                                    // Guardar como string (puede ser número o texto)
                                    upsertFactorConfig(factorId, { valor_medido: newInputValue });
                                  }
                                }}
                                onChange={(_, newValue) => {
                                  if (typeof newValue === 'object' && newValue !== null && 'valor' in newValue) {
                                    upsertFactorConfig(factorId, { valor_medido: newValue.valor });
                                  } else if (typeof newValue === 'string') {
                                    upsertFactorConfig(factorId, { valor_medido: newValue });
                                  }
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Valor medido"
                                    error={
                                      (() => {
                                        if (cfg.valor_medido == null || cfg.valor_medido === '') return false;

                                        // Intentar convertir a número para validación
                                        const numValorMedido = parseFloat(cfg.valor_medido);
                                        if (isNaN(numValorMedido)) return false; // Es texto, no validar numéricamente

                                        const vlpData = cfg.clasificacion_peligro
                                          ? VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro]
                                          : null;

                                        if (vlpData?.valor_limite_min != null && vlpData?.valor_limite_max != null) {
                                          return numValorMedido < vlpData.valor_limite_min ||
                                                 numValorMedido > vlpData.valor_limite_max;
                                        }

                                        // Validar contra VLP personalizado si es numérico
                                        if (cfg.valor_limite_permisible != null) {
                                          const numVLP = parseFloat(cfg.valor_limite_permisible);
                                          if (!isNaN(numVLP)) {
                                            return numValorMedido > numVLP;
                                          }
                                        }

                                        return false;
                                      })()
                                    }
                                    helperText={
                                      (() => {
                                        if (cfg.valor_medido == null || cfg.valor_medido === '') {
                                          return "Valor numérico o texto descriptivo";
                                        }

                                        // Intentar convertir a número para validación
                                        const numValorMedido = parseFloat(cfg.valor_medido);
                                        if (isNaN(numValorMedido)) {
                                          return "Valor descriptivo (sin validación numérica)";
                                        }

                                        const vlpData = cfg.clasificacion_peligro
                                          ? VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro]
                                          : null;

                                        if (vlpData?.valor_limite_min != null && vlpData?.valor_limite_max != null) {
                                          if (numValorMedido < vlpData.valor_limite_min) {
                                            return "⚠️ Por debajo del mínimo permisible";
                                          }
                                          if (numValorMedido > vlpData.valor_limite_max) {
                                            return "⚠️ Excede el máximo permisible";
                                          }
                                          return "✓ Dentro del rango permisible";
                                        }

                                        if (cfg.valor_limite_permisible != null) {
                                          const numVLP = parseFloat(cfg.valor_limite_permisible);
                                          if (!isNaN(numVLP)) {
                                            if (numValorMedido > numVLP) {
                                              return "⚠️ Excede el VLP";
                                            }
                                            return "✓ Dentro del límite";
                                          }
                                        }

                                        return "Valor obtenido en medición";
                                      })()
                                    }
                                  />
                                )}
                                renderOption={(props, option) => {
                                  const { key, ...otherProps } = props as any;
                                  return (
                                    <li key={`${option.tipo}-${option.valor}-${option.label}`} {...otherProps}>
                                      <Box sx={{ width: '100%' }}>
                                        <Typography variant="body2">{option.label}</Typography>
                                        {option.descripcion && (
                                          <Typography variant="caption" color="text.secondary">
                                            {option.descripcion}
                                          </Typography>
                                        )}
                                      </Box>
                                    </li>
                                  );
                                }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Autocomplete
                                freeSolo
                                options={OPCIONES_VLP_TEXTO}
                                value={cfg.valor_limite_permisible || ''}
                                onChange={(_, newValue) => {
                                  upsertFactorConfig(factorId, {
                                    valor_limite_permisible: newValue || undefined
                                  });
                                }}
                                onInputChange={(_, newInputValue) => {
                                  if (newInputValue === '') {
                                    // Si se borra, intentar auto-poblar desde VLP
                                    const vlpData = cfg.clasificacion_peligro
                                      ? VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro]
                                      : null;
                                    if (vlpData?.valor_limite_permisible != null) {
                                      upsertFactorConfig(factorId, {
                                        valor_limite_permisible: String(vlpData.valor_limite_permisible)
                                      });
                                    } else if (vlpData?.valor_limite_max != null) {
                                      upsertFactorConfig(factorId, {
                                        valor_limite_permisible: `${vlpData.valor_limite_min}-${vlpData.valor_limite_max}`
                                      });
                                    } else {
                                      upsertFactorConfig(factorId, { valor_limite_permisible: undefined });
                                    }
                                  } else {
                                    upsertFactorConfig(factorId, { valor_limite_permisible: newInputValue });
                                  }
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    fullWidth
                                    label="Valor límite permisible"
                                    helperText={
                                      (() => {
                                        const vlpData = cfg.clasificacion_peligro
                                          ? VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro]
                                          : null;
                                        if (vlpData) {
                                          return `Ref: ${vlpData.normativa}`;
                                        }
                                        return "Ingrese valor o seleccione opción";
                                      })()
                                    }
                                    slotProps={{
                                      input: {
                                        ...params.InputProps,
                                        startAdornment: cfg.valor_limite_permisible ? (
                                          <InputAdornment position="start">
                                            <CheckCircle color="success" fontSize="small" />
                                          </InputAdornment>
                                        ) : null
                                      }
                                    }}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField
                                fullWidth
                                label="Unidad de medida"
                                value={cfg.unidad_medida ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    unidad_medida: e.target.value,
                                  })
                                }
                                helperText={
                                  cfg.clasificacion_peligro && VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro]
                                    ? "✓ Auto-poblado según normativa"
                                    : "Ej: dB, mg/m³, lux, °C, kg"
                                }
                              />
                            </Grid>

                            {/* Alerta de VLP - maneja rangos y valores únicos (solo para valores numéricos) */}
                            {(() => {
                              if (cfg.valor_medido == null || cfg.valor_medido === '') return null;

                              // Intentar convertir a número - si no es numérico, mostrar info descriptiva
                              const numValorMedido = parseFloat(cfg.valor_medido);
                              if (isNaN(numValorMedido)) {
                                // Valor descriptivo (texto), mostrar información sin validación numérica
                                return (
                                  <Grid size={{ xs: 12 }}>
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        ℹ️ Valor descriptivo registrado
                                      </Typography>
                                      <Typography variant="body2">
                                        Valor medido: {cfg.valor_medido}
                                        {cfg.valor_limite_permisible && ` | VLP: ${cfg.valor_limite_permisible}`}
                                      </Typography>
                                      <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                        Este valor no requiere validación numérica contra el VLP.
                                      </Typography>
                                    </Alert>
                                  </Grid>
                                );
                              }

                              const vlpData = cfg.clasificacion_peligro
                                ? VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro]
                                : null;

                              // Manejo de rangos (min/max)
                              if (vlpData?.valor_limite_min != null && vlpData?.valor_limite_max != null) {
                                const dentroRango =
                                  numValorMedido >= vlpData.valor_limite_min &&
                                  numValorMedido <= vlpData.valor_limite_max;

                                if (!dentroRango) {
                                  return (
                                    <Grid size={{ xs: 12 }}>
                                      <Alert severity="error" sx={{ mt: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          ⚠️ VALOR MEDIDO FUERA DEL RANGO PERMISIBLE
                                        </Typography>
                                        <Typography variant="body2">
                                          El valor medido ({cfg.valor_medido} {cfg.unidad_medida || ''}) está fuera del rango permisible
                                          ({vlpData.valor_limite_min}-{vlpData.valor_limite_max} {cfg.unidad_medida || ''}).
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                                          Acción requerida:
                                        </Typography>
                                        <Typography variant="body2" component="ul" sx={{ mt: 0.5, pl: 2 }}>
                                          <li>Implementar controles ambientales inmediatos</li>
                                          <li>Ajustar sistemas de ventilación/iluminación/climatización</li>
                                          <li>Reducir tiempo de exposición</li>
                                          <li>Actualizar matriz de riesgos con ND=10 (Muy Alto)</li>
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                                          Normativa: {vlpData.normativa}
                                        </Typography>
                                        {vlpData.observaciones && (
                                          <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                            {vlpData.observaciones}
                                          </Typography>
                                        )}
                                      </Alert>
                                    </Grid>
                                  );
                                } else {
                                  return (
                                    <Grid size={{ xs: 12 }}>
                                      <Alert severity="success" sx={{ mt: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          ✓ Valor dentro del rango permisible
                                        </Typography>
                                        <Typography variant="body2">
                                          El valor medido ({cfg.valor_medido} {cfg.unidad_medida || ''}) cumple con el rango establecido
                                          ({vlpData.valor_limite_min}-{vlpData.valor_limite_max} {cfg.unidad_medida || ''}).
                                        </Typography>
                                      </Alert>
                                    </Grid>
                                  );
                                }
                              }

                              // Manejo de VLP simple (solo si el VLP también es numérico)
                              if (cfg.valor_limite_permisible != null && cfg.valor_limite_permisible !== '') {
                                const numVLP = parseFloat(cfg.valor_limite_permisible);

                                // Si el VLP es texto, mostrar info sin validación
                                if (isNaN(numVLP)) {
                                  return (
                                    <Grid size={{ xs: 12 }}>
                                      <Alert severity="info" sx={{ mt: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          ℹ️ VLP descriptivo
                                        </Typography>
                                        <Typography variant="body2">
                                          Valor medido: {cfg.valor_medido} {cfg.unidad_medida || ''} | VLP: {cfg.valor_limite_permisible}
                                        </Typography>
                                      </Alert>
                                    </Grid>
                                  );
                                }

                                const excedeVLP = numValorMedido > numVLP;

                                if (excedeVLP) {
                                  return (
                                    <Grid size={{ xs: 12 }}>
                                      <Alert severity="error" sx={{ mt: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          ⚠️ VALOR MEDIDO EXCEDE EL LÍMITE PERMISIBLE
                                        </Typography>
                                        <Typography variant="body2">
                                          El valor medido ({cfg.valor_medido} {cfg.unidad_medida || ''}) supera el Valor Límite Permisible
                                          ({cfg.valor_limite_permisible} {cfg.unidad_medida || ''}).
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                                          Acción requerida:
                                        </Typography>
                                        <Typography variant="body2" component="ul" sx={{ mt: 0.5, pl: 2 }}>
                                          <li>Implementar controles de ingeniería inmediatos</li>
                                          <li>Reforzar medidas de protección (EPP)</li>
                                          <li>Reducir tiempo de exposición</li>
                                          <li>Considerar reubicación del trabajador si no se puede controlar</li>
                                          <li>Actualizar matriz de riesgos con ND=10 (Muy Alto)</li>
                                        </Typography>
                                        {vlpData && (
                                          <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                                            Normativa: {vlpData.normativa}
                                          </Typography>
                                        )}
                                      </Alert>
                                    </Grid>
                                  );
                                } else {
                                  return (
                                    <Grid size={{ xs: 12 }}>
                                      <Alert severity="success" sx={{ mt: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          ✓ Valor dentro del límite permisible
                                        </Typography>
                                        <Typography variant="body2">
                                          El valor medido ({cfg.valor_medido} {cfg.unidad_medida || ''}) cumple con el VLP establecido
                                          ({cfg.valor_limite_permisible} {cfg.unidad_medida || ''}).
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                          Continuar con controles actuales y monitoreo periódico.
                                        </Typography>
                                      </Alert>
                                    </Grid>
                                  );
                                }
                              }

                              return null;
                            })()}

                            {/* Identificación del Peligro */}
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                                Identificación del Peligro
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                label="Zona/Lugar"
                                value={cfg.zona_lugar ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    zona_lugar: e.target.value,
                                  })
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <FormControl fullWidth>
                                <InputLabel>Tipo de Peligro</InputLabel>
                                <Select
                                  value={cfg.tipo_peligro ?? ""}
                                  onChange={(e) =>
                                    upsertFactorConfig(factorId, {
                                      tipo_peligro: e.target.value,
                                      // Limpiar clasificacion_peligro si cambia el tipo
                                      clasificacion_peligro: "",
                                    })
                                  }
                                  label="Tipo de Peligro"
                                >
                                  <MenuItem value="">
                                    <em>Seleccione...</em>
                                  </MenuItem>
                                  {Object.keys(CLASIFICACIONES_POR_TIPO_PELIGRO).map((tipo) => (
                                    <MenuItem key={tipo} value={tipo}>
                                      {tipo}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <FormControl fullWidth disabled={!cfg.tipo_peligro}>
                                <InputLabel>Clasificación del Peligro</InputLabel>
                                <Select
                                  value={cfg.clasificacion_peligro ?? ""}
                                  onChange={(e) => {
                                    const selectedClasificacion = e.target.value;
                                    const vlpData = VALORES_LIMITE_PERMISIBLE[selectedClasificacion];
                                    const descripcionesData = DESCRIPCIONES_PELIGROS[selectedClasificacion];

                                    const updates: any = {
                                      clasificacion_peligro: selectedClasificacion,
                                    };

                                    // Auto-poblar VLP si existe
                                    if (vlpData) {
                                      updates.valor_limite_permisible = vlpData.valor_limite_permisible || vlpData.valor_limite_max;
                                      updates.unidad_medida = vlpData.unidad_medida;
                                      updates.requisito_legal = vlpData.normativa;
                                    }

                                    // Auto-sugerir descripción y efectos si están vacíos
                                    if (descripcionesData) {
                                      if (!cfg.descripcion_peligro || cfg.descripcion_peligro.trim() === '') {
                                        updates.descripcion_peligro = descripcionesData.descripciones[0];
                                      }
                                      if (!cfg.efectos_posibles || cfg.efectos_posibles.trim() === '') {
                                        updates.efectos_posibles = descripcionesData.efectos[0];
                                      }
                                    }

                                    upsertFactorConfig(factorId, updates);
                                  }}
                                  label="Clasificación del Peligro"
                                >
                                  <MenuItem value="">
                                    <em>Seleccione...</em>
                                  </MenuItem>
                                  {cfg.tipo_peligro &&
                                    CLASIFICACIONES_POR_TIPO_PELIGRO[cfg.tipo_peligro]?.map((clasificacion) => {
                                      const hasVLP = VALORES_LIMITE_PERMISIBLE[clasificacion];
                                      const hasDescripciones = DESCRIPCIONES_PELIGROS[clasificacion];
                                      return (
                                        <MenuItem key={clasificacion} value={clasificacion}>
                                          {clasificacion}
                                          {hasVLP && " 📊"}
                                          {hasDescripciones && " 📝"}
                                        </MenuItem>
                                      );
                                    })}
                                </Select>
                              </FormControl>
                            </Grid>

                            {/* Mostrar información de VLP cuando esté disponible */}
                            {cfg.clasificacion_peligro && VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro] && (
                              <Grid size={{ xs: 12 }}>
                                <Alert severity="info" sx={{ mt: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Valor Límite Permisible (VLP) según normativa:
                                  </Typography>
                                  <Typography variant="body2">
                                    {(() => {
                                      const vlp = VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro];
                                      if (vlp.valor_limite_min && vlp.valor_limite_max) {
                                        return `${vlp.valor_limite_min}-${vlp.valor_limite_max} ${vlp.unidad_medida}`;
                                      }
                                      return `${vlp.valor_limite_permisible} ${vlp.unidad_medida}`;
                                    })()}
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    {VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro].normativa}
                                  </Typography>
                                  {VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro].observaciones && (
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                      {VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro].observaciones}
                                    </Typography>
                                  )}
                                </Alert>
                              </Grid>
                            )}

                            {/* Mostrar información de descripciones disponibles */}
                            {cfg.clasificacion_peligro && DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro] && (
                              <Grid size={{ xs: 12 }}>
                                <Alert severity="success" sx={{ mt: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    📝 Descripciones y efectos predefinidos disponibles:
                                  </Typography>
                                  <Typography variant="body2">
                                    • {DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro].descripciones.length} descripciones típicas del peligro
                                  </Typography>
                                  <Typography variant="body2">
                                    • {DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro].efectos.length} efectos posibles en la salud
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                    Seleccione de las opciones o escriba una descripción personalizada
                                  </Typography>
                                </Alert>
                              </Grid>
                            )}

                            <Grid size={{ xs: 12 }}>
                              <Autocomplete
                                freeSolo
                                options={
                                  cfg.clasificacion_peligro && DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro]
                                    ? DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro].descripciones
                                    : []
                                }
                                value={cfg.descripcion_peligro ?? ""}
                                onChange={(_, newValue) => {
                                  upsertFactorConfig(factorId, {
                                    descripcion_peligro: newValue || "",
                                  });
                                }}
                                onInputChange={(_, newInputValue) => {
                                  upsertFactorConfig(factorId, {
                                    descripcion_peligro: newInputValue,
                                  });
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Descripción del peligro"
                                    multiline
                                    rows={2}
                                    helperText={
                                      cfg.clasificacion_peligro && DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro]
                                        ? `✓ ${DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro].descripciones.length} opciones disponibles`
                                        : "Seleccione una clasificación para ver opciones predefinidas"
                                    }
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Autocomplete
                                freeSolo
                                options={
                                  cfg.clasificacion_peligro && DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro]
                                    ? DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro].efectos
                                    : []
                                }
                                value={cfg.efectos_posibles ?? ""}
                                onChange={(_, newValue) => {
                                  upsertFactorConfig(factorId, {
                                    efectos_posibles: newValue || "",
                                  });
                                }}
                                onInputChange={(_, newInputValue) => {
                                  upsertFactorConfig(factorId, {
                                    efectos_posibles: newInputValue,
                                  });
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Efectos posibles"
                                    multiline
                                    rows={2}
                                    helperText={
                                      cfg.clasificacion_peligro && DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro]
                                        ? `✓ ${DESCRIPCIONES_PELIGROS[cfg.clasificacion_peligro].efectos.length} opciones disponibles`
                                        : "Seleccione una clasificación para ver efectos típicos"
                                    }
                                  />
                                )}
                              />
                            </Grid>

                            {/* Controles Existentes */}
                            <Grid size={{ xs: 12 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  Controles Existentes
                                </Typography>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => sugerirControlesTipicos(factorId)}
                                  sx={{ textTransform: "none" }}
                                >
                                  ✨ Sugerir controles típicos
                                </Button>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Autocomplete
                                freeSolo
                                options={OPCIONES_CONTROLES_EXISTENTES}
                                value={cfg.controles_existentes ?? ""}
                                onChange={(_, newValue) =>
                                  upsertFactorConfig(factorId, {
                                    controles_existentes: newValue ?? "",
                                  })
                                }
                                onInputChange={(_, newInputValue) =>
                                  upsertFactorConfig(factorId, {
                                    controles_existentes: newInputValue,
                                  })
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Controles existentes"
                                    multiline
                                    rows={2}
                                    helperText="Descripción de los controles actualmente implementados"
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Autocomplete
                                freeSolo
                                options={OPCIONES_CONTROL_FUENTE}
                                value={cfg.fuente ?? ""}
                                onChange={(_, newValue) =>
                                  upsertFactorConfig(factorId, {
                                    fuente: newValue ?? "",
                                  })
                                }
                                onInputChange={(_, newInputValue) =>
                                  upsertFactorConfig(factorId, {
                                    fuente: newInputValue,
                                  })
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Fuente"
                                    multiline
                                    rows={2}
                                    helperText="Control en la fuente del peligro"
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Autocomplete
                                freeSolo
                                options={OPCIONES_CONTROL_MEDIO}
                                value={cfg.medio ?? ""}
                                onChange={(_, newValue) =>
                                  upsertFactorConfig(factorId, {
                                    medio: newValue ?? "",
                                  })
                                }
                                onInputChange={(_, newInputValue) =>
                                  upsertFactorConfig(factorId, {
                                    medio: newInputValue,
                                  })
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Medio"
                                    multiline
                                    rows={2}
                                    helperText="Control en el medio de transmisión"
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Autocomplete
                                freeSolo
                                options={OPCIONES_CONTROL_INDIVIDUO}
                                value={cfg.individuo ?? ""}
                                onChange={(_, newValue) =>
                                  upsertFactorConfig(factorId, {
                                    individuo: newValue ?? "",
                                  })
                                }
                                onInputChange={(_, newInputValue) =>
                                  upsertFactorConfig(factorId, {
                                    individuo: newInputValue,
                                  })
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Individuo"
                                    multiline
                                    rows={2}
                                    helperText="Control en el trabajador"
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Autocomplete
                                freeSolo
                                options={OPCIONES_PEOR_CONSECUENCIA}
                                value={cfg.peor_consecuencia ?? ""}
                                onChange={(_, newValue) =>
                                  upsertFactorConfig(factorId, {
                                    peor_consecuencia: newValue ?? "",
                                  })
                                }
                                onInputChange={(_, newInputValue) =>
                                  upsertFactorConfig(factorId, {
                                    peor_consecuencia: newInputValue,
                                  })
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Peor consecuencia"
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Autocomplete
                                freeSolo
                                options={OPCIONES_REQUISITO_LEGAL}
                                value={cfg.requisito_legal ?? ""}
                                onChange={(_, newValue) =>
                                  upsertFactorConfig(factorId, {
                                    requisito_legal: newValue ?? "",
                                  })
                                }
                                onInputChange={(_, newInputValue) =>
                                  upsertFactorConfig(factorId, {
                                    requisito_legal: newInputValue,
                                  })
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Requisito legal"
                                    helperText={
                                      cfg.clasificacion_peligro && VALORES_LIMITE_PERMISIBLE[cfg.clasificacion_peligro]
                                        ? "✓ Auto-poblado desde VLP normativo"
                                        : "Normativa o requisito legal asociado"
                                    }
                                  />
                                )}
                              />
                            </Grid>

                            {/* Jerarquía de Controles (ESIAE) */}
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                                Jerarquía de Controles Propuestos (ESIAE)
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Eliminación"
                                value={cfg.eliminacion ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    eliminacion: e.target.value,
                                  })
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Sustitución"
                                value={cfg.sustitucion ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    sustitucion: e.target.value,
                                  })
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Controles de ingeniería"
                                value={cfg.controles_ingenieria ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    controles_ingenieria: e.target.value,
                                  })
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Controles administrativos"
                                value={cfg.controles_administrativos ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    controles_administrativos: e.target.value,
                                  })
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Señalización"
                                value={cfg.senalizacion ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    senalizacion: e.target.value,
                                  })
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="EPP requerido"
                                value={cfg.epp_requerido ?? ""}
                                onChange={(e) =>
                                  upsertFactorConfig(factorId, {
                                    epp_requerido: e.target.value,
                                  })
                                }
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Grid>

              {/* Exámenes Médicos */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Exámenes Médicos
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Seleccionar Exámenes</InputLabel>
                  <Select
                    multiple
                    value={selectedExamenes}
                    onChange={(e) =>
                      setSelectedExamenes(normalizeMultiSelect(e.target.value))
                    }
                    input={<OutlinedInput label="Seleccionar Exámenes" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={
                              examenesList.find((e) => e.id === value)?.nombre
                            }
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {examenesList.map((examen) => (
                      <MenuItem key={examen.id} value={examen.id}>
                        <Checkbox
                          checked={selectedExamenes.indexOf(examen.id) > -1}
                        />
                        <ListItemText
                          primary={examen.nombre}
                          secondary={examen.descripcion}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  Selecciona exámenes para habilitar el tipo de evaluación por
                  examen.
                </Typography>
                {selectedExamenes.length > 0 && (
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    {selectedExamenes.map((examenId) => {
                      const examen = examenesList.find(
                        (e) => e.id === examenId,
                      );
                      const cfgByTipo =
                        examenesConfig[examenId] ||
                        createDefaultExamenConfig(true);
                      const options: Array<{
                        value: TipoEvaluacionExamen;
                        label: string;
                      }> = [
                        { value: "ingreso", label: "Ingreso" },
                        { value: "periodico", label: "Periódico" },
                        { value: "retiro", label: "Retiro" },
                        { value: "cambio_cargo", label: "Cambio de Cargo" },
                        {
                          value: "post_incapacidad",
                          label: "Post Incapacidad",
                        },
                        { value: "reincorporacion", label: "Reincorporación" },
                      ];
                      return (
                        <Paper key={examenId} variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle1">
                            {examen?.nombre || `Examen ${examenId}`}
                          </Typography>
                          <Box
                            sx={{
                              mt: 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            {options.map((opt) => {
                              const cfg = cfgByTipo[opt.value];
                              const enabled = !!cfg?.enabled;
                              return (
                                <Grid
                                  key={opt.value}
                                  container
                                  spacing={2}
                                  alignItems="center"
                                >
                                  <Grid size={{ xs: 12, md: 4 }}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={enabled}
                                          onChange={(e) => {
                                            const checked = e.target.checked;
                                            setExamenesConfig((prev) => {
                                              const current =
                                                prev[examenId] ||
                                                createDefaultExamenConfig(true);
                                              return {
                                                ...prev,
                                                [examenId]: {
                                                  ...current,
                                                  [opt.value]: {
                                                    ...current[opt.value],
                                                    enabled: checked,
                                                    periodicidad_meses:
                                                      opt.value === "periodico"
                                                        ? (current[opt.value]
                                                            .periodicidad_meses ??
                                                          12)
                                                        : undefined,
                                                  },
                                                },
                                              };
                                            });
                                          }}
                                        />
                                      }
                                      label={opt.label}
                                    />
                                  </Grid>
                                  {enabled && (
                                    <>
                                      <Grid size={{ xs: 12, md: 4 }}>
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              checked={cfg.obligatorio}
                                              onChange={(e) => {
                                                const checked =
                                                  e.target.checked;
                                                setExamenesConfig((prev) => {
                                                  const current =
                                                    prev[examenId] ||
                                                    createDefaultExamenConfig(
                                                      true,
                                                    );
                                                  return {
                                                    ...prev,
                                                    [examenId]: {
                                                      ...current,
                                                      [opt.value]: {
                                                        ...current[opt.value],
                                                        obligatorio: checked,
                                                      },
                                                    },
                                                  };
                                                });
                                              }}
                                            />
                                          }
                                          label="Obligatorio"
                                        />
                                      </Grid>
                                      {opt.value === "periodico" && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                          <FormControl fullWidth>
                                            <InputLabel>
                                              Periodicidad (Meses)
                                            </InputLabel>
                                            <Select
                                              value={
                                                cfg.periodicidad_meses ?? 12
                                              }
                                              label="Periodicidad (Meses)"
                                              onChange={(e) => {
                                                const value = Number(
                                                  e.target.value,
                                                );
                                                setExamenesConfig((prev) => {
                                                  const current =
                                                    prev[examenId] ||
                                                    createDefaultExamenConfig(
                                                      true,
                                                    );
                                                  return {
                                                    ...prev,
                                                    [examenId]: {
                                                      ...current,
                                                      periodico: {
                                                        ...current.periodico,
                                                        enabled: true,
                                                        periodicidad_meses:
                                                          value,
                                                      },
                                                    },
                                                  };
                                                });
                                              }}
                                            >
                                              <MenuItem value={6}>6</MenuItem>
                                              <MenuItem value={12}>12</MenuItem>
                                              <MenuItem value={24}>24</MenuItem>
                                              <MenuItem value={36}>36</MenuItem>
                                            </Select>
                                          </FormControl>
                                        </Grid>
                                      )}
                                    </>
                                  )}
                                </Grid>
                              );
                            })}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Grid>

              {/* Inmunizaciones */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Inmunizaciones (Vacunas)
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Seleccionar Inmunizaciones</InputLabel>
                  <Select
                    multiple
                    value={selectedInmunizaciones}
                    onChange={(e) =>
                      setSelectedInmunizaciones(
                        normalizeMultiSelect(e.target.value),
                      )
                    }
                    input={<OutlinedInput label="Seleccionar Inmunizaciones" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={
                              inmunizacionesList.find((i) => i.id === value)
                                ?.nombre
                            }
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {inmunizacionesList.map((inmunizacion) => (
                      <MenuItem key={inmunizacion.id} value={inmunizacion.id}>
                        <Checkbox
                          checked={
                            selectedInmunizaciones.indexOf(inmunizacion.id) > -1
                          }
                        />
                        <ListItemText
                          primary={inmunizacion.nombre}
                          secondary={inmunizacion.descripcion}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Criterios de Exclusión */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Criterios de Exclusión Médica
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Seleccionar Criterios</InputLabel>
                  <Select
                    multiple
                    value={selectedCriterios}
                    onChange={(e) =>
                      setSelectedCriterios(normalizeMultiSelect(e.target.value))
                    }
                    input={<OutlinedInput label="Seleccionar Criterios" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={
                              criteriosList.find((c) => c.id === value)?.nombre
                            }
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {criteriosList.map((criterio) => (
                      <MenuItem key={criterio.id} value={criterio.id}>
                        <Checkbox
                          checked={selectedCriterios.indexOf(criterio.id) > -1}
                        />
                        <ListItemText
                          primary={criterio.nombre}
                          secondary={criterio.descripcion}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Observaciones Generales"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                {/* Alerta de factores que exceden VLP antes de guardar (solo valores numéricos) */}
                {(() => {
                  const factoresConExcesoVLP = selectedFactores.filter((factorId) => {
                    const cfg = factoresConfig[factorId] || {};
                    if (cfg.valor_medido == null || cfg.valor_limite_permisible == null) return false;
                    const numValorMedido = parseFloat(cfg.valor_medido);
                    const numVLP = parseFloat(cfg.valor_limite_permisible);
                    // Solo comparar si ambos valores son numéricos
                    return !isNaN(numValorMedido) && !isNaN(numVLP) && numValorMedido > numVLP;
                  });

                  if (factoresConExcesoVLP.length > 0) {
                    return (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ⚠️ {factoresConExcesoVLP.length} factor(es) de riesgo con valores que exceden el VLP
                        </Typography>
                        <Typography variant="body2">
                          Revise los factores de riesgo marcados en rojo antes de guardar. Se requieren controles inmediatos.
                        </Typography>
                      </Alert>
                    );
                  }
                  return null;
                })()}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {currentProfesiogramaVersion && (
                    <Chip
                      label={`Versión actual: ${currentProfesiogramaVersion}`}
                      variant="outlined"
                    />
                  )}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleSave}
                        disabled={saving}
                        fullWidth
                      >
                        {saving ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Guardar (nueva versión)"
                        )}
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="large"
                        onClick={handleExportMatriz}
                        disabled={exportingExcel || !currentProfesiogramaId}
                        fullWidth
                      >
                        {exportingExcel ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Exportar Matriz (Excel)"
                        )}
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="large"
                        onClick={handleExportPdf}
                        disabled={exportingPdf || !selectedCargoId}
                        fullWidth
                      >
                        {exportingPdf ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Descargar Profesiograma (PDF)"
                        )}
                      </Button>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="large"
                        onClick={handleOpenDuplicateDialog}
                        disabled={saving || !currentProfesiogramaId}
                        fullWidth
                        startIcon={<ContentCopy />}
                      >
                        Duplicar a otros cargos
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="large"
                        onClick={handleDelete}
                        disabled={saving || !currentProfesiogramaId}
                        fullWidth
                      >
                        Eliminar versión actual
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                <Dialog
                  open={deleteDialogOpen}
                  onClose={() => setDeleteDialogOpen(false)}
                >
                  <DialogTitle>Eliminar profesiograma</DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      ¿Deseas eliminar la versión actual del profesiograma? Esta
                      acción no se puede deshacer.
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={deleting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConfirmDelete}
                      color="error"
                      variant="contained"
                      disabled={deleting}
                    >
                      {deleting ? <CircularProgress size={20} /> : "Eliminar"}
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Dialog para duplicar profesiograma */}
                <Dialog
                  open={duplicateDialogOpen}
                  onClose={handleCloseDuplicateDialog}
                  maxWidth="sm"
                  fullWidth
                >
                  <DialogTitle>Duplicar profesiograma a otros cargos</DialogTitle>
                  <DialogContent>
                    {duplicateResults.length === 0 ? (
                      <>
                        <DialogContentText sx={{ mb: 2 }}>
                          Seleccione los cargos a los cuales desea copiar este
                          profesiograma.
                        </DialogContentText>
                        <Autocomplete
                          multiple
                          options={cargos.filter(
                            (c) => c.value !== selectedCargoId
                          )}
                          getOptionLabel={(option) => option.label}
                          value={cargos.filter((c) =>
                            duplicateTargetCargos.includes(c.value)
                          )}
                          onChange={(_, newValue) => {
                            setDuplicateTargetCargos(
                              newValue.map((c) => c.value)
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Cargos destino"
                              placeholder="Seleccione cargos..."
                            />
                          )}
                          renderOption={(props, option) => {
                            const { key, ...otherProps } = props as any;
                            return (
                              <li key={option.value} {...otherProps}>
                                {option.label}
                              </li>
                            );
                          }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={duplicateAsActive}
                              onChange={(e) => setDuplicateAsActive(e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Activar inmediatamente (visible para trabajadores)"
                          sx={{ mt: 2 }}
                        />
                        {duplicateAsActive && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            Los profesiogramas se crearán como <strong>activos</strong> y serán
                            visibles inmediatamente para los trabajadores de los cargos seleccionados.
                          </Alert>
                        )}
                        {!duplicateAsActive && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            Los profesiogramas se crearán como <strong>borrador</strong> y deberán
                            activarse manualmente para que sean visibles a los trabajadores.
                          </Alert>
                        )}
                      </>
                    ) : (
                      <>
                        <DialogContentText sx={{ mb: 2 }}>
                          Resultados de la duplicación:
                        </DialogContentText>
                        {duplicateResults.map((result) => (
                          <Alert
                            key={result.cargo_id}
                            severity={result.success ? "success" : "error"}
                            sx={{ mb: 1 }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              {result.cargo_nombre}
                            </Typography>
                            <Typography variant="body2">
                              {result.success
                                ? `Versión ${result.version} creada exitosamente`
                                : result.message}
                            </Typography>
                          </Alert>
                        ))}
                      </>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={handleCloseDuplicateDialog}
                      disabled={duplicating}
                    >
                      {duplicateResults.length > 0 ? "Cerrar" : "Cancelar"}
                    </Button>
                    {duplicateResults.length === 0 && (
                      <Button
                        onClick={handleConfirmDuplicate}
                        color="primary"
                        variant="contained"
                        disabled={
                          duplicating || duplicateTargetCargos.length === 0
                        }
                        startIcon={
                          duplicating ? (
                            <CircularProgress size={20} />
                          ) : (
                            <ContentCopy />
                          )
                        }
                      >
                        {duplicating ? "Duplicando..." : "Duplicar"}
                      </Button>
                    )}
                  </DialogActions>
                </Dialog>
              </Grid>
            </Grid>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ProfesiogramasCargo;
