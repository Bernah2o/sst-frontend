/**
 * Gestión de Cumplimiento de Matriz Legal por Empresa.
 * Permite evaluar y gestionar el cumplimiento de normas legales.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Grid,
  MenuItem,
  Chip,
  Checkbox,
  FormControlLabel,
  Collapse,
  Alert,
  LinearProgress,
  Divider,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  HourglassEmpty as ProcessIcon,
  Block as BlockIcon,
  Sync as SyncIcon,
  AssignmentInd as AssignmentIndIcon,
  CloudUpload as UploadCumplimientoIcon,
  AutoAwesome as AIIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import matrizLegalService, {
  MatrizLegalNormaConCumplimiento,
  MatrizLegalEstadisticas,
  EmpresaResumen,
  EstadoCumplimiento,
  BulkUpdatePayload,
  FiltrosBulkUpdatePayload,
  SugerenciasIABulkPayload,
  SugerenciasIAJobStatus,
  SUGERENCIAS_RESPONSABLES,
  ImportarCumplimientoResult,
} from "../../services/matrizLegalService";

interface CumplimientoFormData {
  estado: EstadoCumplimiento;
  evidencia_cumplimiento: string;
  observaciones: string;
  plan_accion: string;
  responsable: string;
  fecha_compromiso: string | null;
  aplica_empresa: boolean;
  justificacion_no_aplica: string;
}

const initialFormData: CumplimientoFormData = {
  estado: "pendiente",
  evidencia_cumplimiento: "",
  observaciones: "",
  plan_accion: "",
  responsable: "",
  fecha_compromiso: null,
  aplica_empresa: true,
  justificacion_no_aplica: "",
};

interface BulkFormData {
  estado: EstadoCumplimiento;
  evidencia_cumplimiento: string;
  plan_accion: string;
  responsable: string;
  fecha_compromiso: string | null;
  observaciones: string;
  aplica_empresa: boolean;
  justificacion_no_aplica: string;
}

const initialBulkFormData: BulkFormData = {
  estado: "pendiente",
  evidencia_cumplimiento: "",
  plan_accion: "",
  responsable: "",
  fecha_compromiso: null,
  observaciones: "",
  aplica_empresa: true,
  justificacion_no_aplica: "",
};


const MatrizLegalEmpresa: React.FC = () => {
  const navigate = useNavigate();
  const { empresaId } = useParams<{ empresaId: string }>();
  const { enqueueSnackbar } = useSnackbar();

  // Estados de datos
  const [normas, setNormas] = useState<MatrizLegalNormaConCumplimiento[]>([]);
  const [estadisticas, setEstadisticas] = useState<MatrizLegalEstadisticas | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [autoasignandoResponsables, setAutoasignandoResponsables] = useState(false);
  const [importandoCumplimiento, setImportandoCumplimiento] = useState(false);
  const [resultadoImportCumplimiento, setResultadoImportCumplimiento] =
    useState<ImportarCumplimientoResult | null>(null);
  const importCumplimientoInputRef = useRef<HTMLInputElement>(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [estadoCumplimiento, setEstadoCumplimiento] = useState("");
  const [clasificacion, setClasificacion] = useState("");
  const [temaGeneral, setTemaGeneral] = useState("");
  const [soloAplicables, setSoloAplicables] = useState(true);

  // Catálogos
  const [clasificaciones, setClasificaciones] = useState<string[]>([]);
  const [temas, setTemas] = useState<string[]>([]);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Selección múltiple
  const [selected, setSelected] = useState<number[]>([]);

  // Dialog de edición
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNorma, setEditingNorma] = useState<MatrizLegalNormaConCumplimiento | null>(null);
  const [formData, setFormData] = useState<CumplimientoFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [loadingIAField, setLoadingIAField] = useState<string | null>(null);
  const [sugerenciasCache, setSugerenciasCache] = useState<{evidencia: string; observaciones: string; plan_accion: string} | null>(null);

  // Bulk extendido (ítems seleccionados)
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [bulkFormData, setBulkFormData] = useState<BulkFormData>(initialBulkFormData);
  const [savingBulk, setSavingBulk] = useState(false);

  // Aplicar a todos los filtrados
  const [openFiltrosDialog, setOpenFiltrosDialog] = useState(false);
  const [savingFiltros, setSavingFiltros] = useState(false);

  // Inline estado (click en chip)
  const [inlineAnchorEl, setInlineAnchorEl] = useState<HTMLElement | null>(null);
  const [inlineNorma, setInlineNorma] = useState<MatrizLegalNormaConCumplimiento | null>(null);
  const [savingInline, setSavingInline] = useState(false);

  // Generación de evidencias con IA (una sugerencia por norma, en background)
  const [openIADialog, setOpenIADialog] = useState(false);
  const [iaSoloVacios, setIaSoloVacios] = useState(true);
  const [iaIncluirObservaciones, setIaIncluirObservaciones] = useState(false);
  const [iaLanzando, setIaLanzando] = useState(false);
  const [iaJob, setIaJob] = useState<SugerenciasIAJobStatus | null>(null);
  const [openIAProgreso, setOpenIAProgreso] = useState(false);
  // Tandas automáticas: cuando hay más de IA_MAX_NORMAS_POR_JOB normas, se
  // trocean y se lanzan en jobs sucesivos sin selección manual.
  const [iaTandas, setIaTandas] = useState<number[][]>([]);
  const [iaTandaIndex, setIaTandaIndex] = useState(0);
  const [iaTandaTotal, setIaTandaTotal] = useState(0);
  const [iaTotalGeneral, setIaTotalGeneral] = useState(0);
  const [iaAcumulado, setIaAcumulado] = useState<{
    procesadas: number;
    exitosas: number;
    fallidas: number;
    logErrores: string[];
  }>({ procesadas: 0, exitosas: 0, fallidas: 0, logErrores: [] });

  const numEmpresaId = Number(empresaId);

  const loadInitialData = useCallback(async () => {
    try {
      const [empresasData, clasificacionesData] = await Promise.all([
        matrizLegalService.listEmpresas(),
        matrizLegalService.getCatalogosClasificaciones(),
      ]);

      const empresaData = empresasData.find(e => e.id === numEmpresaId);
      setEmpresa(empresaData || null);
      setClasificaciones(clasificacionesData);

      // Cargar estadísticas
      const stats = await matrizLegalService.getEstadisticasEmpresa(numEmpresaId);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error loading initial data:", error);
      enqueueSnackbar("Error al cargar datos", { variant: "error" });
    }
  }, [numEmpresaId, enqueueSnackbar]);

  // El catálogo de temas se filtra por la clasificación elegida — si no, el
  // dropdown ofrece combinaciones imposibles (temas de OTRA clasificación)
  // y el usuario termina filtrando a una combinación que nunca tiene normas.
  useEffect(() => {
    let cancelado = false;
    matrizLegalService.getCatalogosTemas(clasificacion || undefined)
      .then((data) => {
        if (cancelado) return;
        setTemas(data);
        // Si el tema ya elegido no pertenece a la nueva clasificación, se
        // limpia para no dejar seleccionada una combinación imposible.
        setTemaGeneral((actual) => (actual && !data.includes(actual) ? "" : actual));
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [clasificacion]);

  const loadNormas = useCallback(async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      const data = await matrizLegalService.getNormasEmpresa(numEmpresaId, {
        page: page + 1,
        size: rowsPerPage,
        q: searchTerm || undefined,
        estado_cumplimiento: estadoCumplimiento || undefined,
        clasificacion: clasificacion || undefined,
        tema_general: temaGeneral || undefined,
        solo_aplicables: soloAplicables,
      });
      setNormas(data.items);
      setTotal(data.total);
      setSelected([]);
    } catch (error) {
      console.error("Error loading normas:", error);
      enqueueSnackbar("Error al cargar normas", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [empresaId, numEmpresaId, page, rowsPerPage, searchTerm, estadoCumplimiento, clasificacion, temaGeneral, soloAplicables, enqueueSnackbar]);

  // Cargar datos iniciales
  useEffect(() => {
    if (empresaId) {
      loadInitialData();
    }
  }, [empresaId, loadInitialData]);

  // Cargar normas con filtros
  useEffect(() => {
    if (empresaId) {
      loadNormas();
    }
  }, [empresaId, loadNormas]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (empresaId && searchTerm !== undefined) {
        if (page === 0) {
          loadNormas();
        } else {
          setPage(0);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      const result = await matrizLegalService.sincronizarNormasEmpresa(numEmpresaId);
      enqueueSnackbar(result.message, { variant: "success" });
      loadNormas();
      const stats = await matrizLegalService.getEstadisticasEmpresa(numEmpresaId);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error sincronizando:", error);
      enqueueSnackbar("Error al sincronizar normas", { variant: "error" });
    } finally {
      setSincronizando(false);
    }
  };

  const handleAutoasignarResponsables = async () => {
    try {
      setAutoasignandoResponsables(true);
      const res = await matrizLegalService.autoasignarResponsables(numEmpresaId);
      enqueueSnackbar(
        `Se asignó responsable a ${res.actualizados} norma(s) pendiente(s)` +
          (res.sin_mapeo > 0
            ? `. ${res.sin_mapeo} quedaron sin mapeo de clasificación.`
            : "."),
        { variant: res.actualizados > 0 ? "success" : "info" },
      );
      if (res.actualizados > 0) loadNormas();
    } catch (error) {
      console.error("Error autoasignando responsables:", error);
      enqueueSnackbar("Error al autoasignar responsables", { variant: "error" });
    } finally {
      setAutoasignandoResponsables(false);
    }
  };

  const handleImportarCumplimientoClick = () => {
    importCumplimientoInputRef.current?.click();
  };

  const handleImportarCumplimientoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!file) return;

    try {
      setImportandoCumplimiento(true);
      const resultado = await matrizLegalService.importarCumplimientoExcel(numEmpresaId, file);
      setResultadoImportCumplimiento(resultado);
      if (resultado.actualizados > 0) {
        loadNormas();
        matrizLegalService
          .getEstadisticasEmpresa(numEmpresaId)
          .then(setEstadisticas)
          .catch(() => undefined);
      }
    } catch (error: unknown) {
      console.error("Error importando cumplimiento:", error);
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      enqueueSnackbar(detail || "Error al importar el archivo", { variant: "error" });
    } finally {
      setImportandoCumplimiento(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await matrizLegalService.exportMatrizEmpresa(numEmpresaId, !soloAplicables);
      const filename = `matriz_legal_${empresa?.nombre.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      matrizLegalService.downloadBlob(blob, filename);
      enqueueSnackbar("Exportación completada", { variant: "success" });
    } catch (error) {
      console.error("Error exporting:", error);
      enqueueSnackbar("Error al exportar", { variant: "error" });
    }
  };

  const handleOpenDialog = (norma: MatrizLegalNormaConCumplimiento) => {
    setEditingNorma(norma);
    setSugerenciasCache(null); // Limpiar cache de sugerencias para la nueva norma
    setFormData({
      estado: norma.estado_cumplimiento || "pendiente",
      evidencia_cumplimiento: norma.evidencia_cumplimiento || "",
      observaciones: norma.observaciones || "",
      plan_accion: norma.plan_accion || "",
      responsable: norma.responsable || "",
      fecha_compromiso: norma.fecha_compromiso || null,
      aplica_empresa: norma.aplica_empresa,
      justificacion_no_aplica: "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNorma(null);
    setSugerenciasCache(null); // Limpiar cache al cerrar
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    if (!editingNorma) return;

    try {
      setSaving(true);
      await matrizLegalService.updateCumplimiento(numEmpresaId, editingNorma.id, {
        estado: formData.estado,
        evidencia_cumplimiento: formData.evidencia_cumplimiento || null,
        observaciones: formData.observaciones || null,
        plan_accion: formData.plan_accion || null,
        responsable: formData.responsable || null,
        fecha_compromiso: formData.fecha_compromiso || null,
        aplica_empresa: formData.aplica_empresa,
        justificacion_no_aplica: formData.justificacion_no_aplica || null,
      });
      enqueueSnackbar("Cumplimiento actualizado", { variant: "success" });
      handleCloseDialog();
      loadNormas();
      // Actualizar estadísticas
      const stats = await matrizLegalService.getEstadisticasEmpresa(numEmpresaId);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error saving:", error);
      enqueueSnackbar("Error al guardar", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSolicitarSugerenciaIA = async (campo: "evidencia" | "observaciones" | "plan_accion") => {
    if (!editingNorma) return;

    try {
      setLoadingIAField(campo);

      // Si ya tenemos sugerencias en caché, usarlas
      if (sugerenciasCache) {
        const valor = sugerenciasCache[campo];
        if (valor) {
          const fieldMap = {
            evidencia: "evidencia_cumplimiento",
            observaciones: "observaciones",
            plan_accion: "plan_accion",
          };
          setFormData({ ...formData, [fieldMap[campo]]: valor });
          enqueueSnackbar("Sugerencia aplicada", { variant: "success" });
        }
        setLoadingIAField(null);
        return;
      }

      // Solicitar nuevas sugerencias
      const response = await matrizLegalService.getSugerenciasIA(editingNorma.id);

      if (response.success && response.sugerencias) {
        // Guardar en caché
        setSugerenciasCache(response.sugerencias);

        // Aplicar solo el campo solicitado
        const fieldMap = {
          evidencia: "evidencia_cumplimiento",
          observaciones: "observaciones",
          plan_accion: "plan_accion",
        };
        const valor = response.sugerencias[campo];
        if (valor) {
          setFormData({ ...formData, [fieldMap[campo]]: valor });
          enqueueSnackbar("Sugerencia de IA aplicada", { variant: "success" });
        }
      }
    } catch (error: unknown) {
      console.error("Error obteniendo sugerencias IA:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      if (errorMessage.includes("503") || errorMessage.includes("no configurado")) {
        enqueueSnackbar("Servicio de IA no configurado", { variant: "warning" });
      } else {
        enqueueSnackbar("Error al obtener sugerencia", { variant: "error" });
      }
    } finally {
      setLoadingIAField(null);
    }
  };

  // --- Generación de evidencias con IA: una sugerencia por norma ---
  // A diferencia de las acciones masivas (que aplican un texto único), aquí
  // cada norma recibe una evidencia redactada para su propio artículo. Como son
  // N llamadas a la IA, corre en el servidor y aquí solo se consulta el avance.

  /** Nº de normas sobre las que actuaría: la selección, o todo lo filtrado. */
  const iaAlcance = selected.length > 0 ? selected.length : total;
  // Debe coincidir con MAX_NORMAS_POR_JOB en app/api/matriz_legal.py — cada
  // norma es una llamada a Claude, así que el backend rechaza jobs más grandes.
  // Por eso, cuando el alcance supera este tamaño, se trocea en varios jobs
  // automáticos (ver handleLanzarJobIA) en vez de exigir selección manual.
  const IA_MAX_NORMAS_POR_JOB = 200;
  const iaTandasPreview = Math.max(1, Math.ceil(iaAlcance / IA_MAX_NORMAS_POR_JOB));

  const handleOpenIADialog = () => {
    setIaSoloVacios(true);
    setIaIncluirObservaciones(false);
    setOpenIADialog(true);
  };

  const chunk = (ids: number[], size: number): number[][] => {
    const tandas: number[][] = [];
    for (let i = 0; i < ids.length; i += size) tandas.push(ids.slice(i, i + size));
    return tandas;
  };

  /** Lanza el job de una tanda y lo deja como job "en curso" para el polling. */
  const lanzarTanda = useCallback(
    async (ids: number[]) => {
      const payload: SugerenciasIABulkPayload = {
        cumplimiento_ids: ids,
        solo_vacios: iaSoloVacios,
        sobrescribir_observaciones: iaIncluirObservaciones,
      };
      const { job_id, total: totalJob } = await matrizLegalService.generarSugerenciasIABulk(
        numEmpresaId,
        payload,
      );
      setIaJob({
        id: job_id,
        estado: "en_proceso",
        total: totalJob,
        procesadas: 0,
        exitosas: 0,
        fallidas: 0,
        log_errores: null,
        created_at: new Date().toISOString(),
        finished_at: null,
      });
    },
    [iaSoloVacios, iaIncluirObservaciones, numEmpresaId],
  );

  const handleLanzarJobIA = async () => {
    try {
      setIaLanzando(true);

      let ids: number[];
      if (selected.length > 0) {
        ids = selected;
      } else {
        ids = await matrizLegalService.listarIdsSugerenciasIA(numEmpresaId, {
          estado_cumplimiento: estadoCumplimiento || undefined,
          clasificacion: clasificacion || undefined,
          tema_general: temaGeneral || undefined,
          q: searchTerm || undefined,
          solo_aplicables: soloAplicables,
        });
      }

      if (ids.length === 0) {
        enqueueSnackbar("No hay normas que coincidan con la selección o los filtros", { variant: "warning" });
        return;
      }

      const tandas = chunk(ids, IA_MAX_NORMAS_POR_JOB);
      setIaTandaTotal(tandas.length);
      setIaTandaIndex(1);
      setIaTotalGeneral(ids.length);
      setIaAcumulado({ procesadas: 0, exitosas: 0, fallidas: 0, logErrores: [] });
      setIaTandas(tandas.slice(1));

      setOpenIADialog(false);
      await lanzarTanda(tandas[0]);
      setOpenIAProgreso(true);
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      enqueueSnackbar(detail || "Error al iniciar la generación con IA", { variant: "error" });
    } finally {
      setIaLanzando(false);
    }
  };

  const handleCerrarProgresoIA = () => {
    setOpenIAProgreso(false);
    setIaJob(null);
    setIaTandas([]);
    setIaTandaIndex(0);
    setIaTandaTotal(0);
    setIaTotalGeneral(0);
    setIaAcumulado({ procesadas: 0, exitosas: 0, fallidas: 0, logErrores: [] });
  };

  // Polling del progreso del job. Al terminar una tanda, si quedan más en la
  // cola, lanza la siguiente automáticamente (acumulando el progreso total).
  // El intervalo se limpia al desmontar, al cerrar el diálogo y en cuanto el
  // job deja de estar en proceso.
  useEffect(() => {
    if (!openIAProgreso || !iaJob || iaJob.estado !== "en_proceso") return;

    const jobId = iaJob.id;
    let cancelado = false;

    const intervalo = setInterval(async () => {
      try {
        const estado = await matrizLegalService.getSugerenciasIAJob(numEmpresaId, jobId);
        if (cancelado) return;
        setIaJob(estado);

        if (estado.estado !== "en_proceso") {
          clearInterval(intervalo);
          setIaAcumulado((prev) => ({
            procesadas: prev.procesadas + estado.procesadas,
            exitosas: prev.exitosas + estado.exitosas,
            fallidas: prev.fallidas + estado.fallidas,
            logErrores: estado.log_errores ? [...prev.logErrores, estado.log_errores] : prev.logErrores,
          }));

          if (iaTandas.length > 0) {
            const [siguiente, ...resto] = iaTandas;
            setIaTandas(resto);
            setIaTandaIndex((i) => i + 1);
            try {
              await lanzarTanda(siguiente);
            } catch (err) {
              console.error("Error lanzando la siguiente tanda de IA:", err);
              enqueueSnackbar("No se pudo iniciar la siguiente tanda de IA", { variant: "error" });
            }
            return;
          }

          loadNormas();
          matrizLegalService
            .getEstadisticasEmpresa(numEmpresaId)
            .then(setEstadisticas)
            .catch(() => undefined);
          setSelected([]);
        }
      } catch (error) {
        console.error("Error consultando el job de IA:", error);
      }
    }, 2000);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [openIAProgreso, iaJob, numEmpresaId, loadNormas, iaTandas, lanzarTanda, enqueueSnackbar]);

  // --- Handlers bulk extendido (ítems seleccionados) ---
  const handleOpenBulkDialog = () => {
    if (selected.length === 0) return;
    setBulkFormData(initialBulkFormData);
    setOpenBulkDialog(true);
  };

  const handleQuickNoAplica = () => {
    if (selected.length === 0) return;
    setBulkFormData({ ...initialBulkFormData, estado: "no_aplica", aplica_empresa: false });
    setOpenBulkDialog(true);
  };

  const handleSaveBulkDialog = async () => {
    if (selected.length === 0) return;
    try {
      setSavingBulk(true);
      const payload: BulkUpdatePayload = {
        cumplimiento_ids: selected,
        estado: bulkFormData.estado,
        evidencia_cumplimiento: bulkFormData.evidencia_cumplimiento || null,
        plan_accion: bulkFormData.plan_accion || null,
        responsable: bulkFormData.responsable || null,
        fecha_compromiso: bulkFormData.fecha_compromiso || null,
        observaciones: bulkFormData.observaciones || null,
        aplica_empresa: bulkFormData.aplica_empresa,
        justificacion_no_aplica: bulkFormData.justificacion_no_aplica || null,
      };
      const result = await matrizLegalService.bulkUpdateCumplimiento(numEmpresaId, payload);
      enqueueSnackbar(result.message || `${selected.length} normas actualizadas`, { variant: "success" });
      setOpenBulkDialog(false);
      setSelected([]);
      loadNormas();
      const stats = await matrizLegalService.getEstadisticasEmpresa(numEmpresaId);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error bulk update:", error);
      enqueueSnackbar("Error al actualizar", { variant: "error" });
    } finally {
      setSavingBulk(false);
    }
  };

  // --- Handlers aplicar a todos los filtrados ---
  const handleOpenFiltrosDialog = () => {
    setBulkFormData(initialBulkFormData);
    setOpenFiltrosDialog(true);
  };

  const handleSaveFiltros = async () => {
    try {
      setSavingFiltros(true);
      const payload: FiltrosBulkUpdatePayload = {
        estado_cumplimiento: estadoCumplimiento || undefined,
        clasificacion: clasificacion || undefined,
        tema_general: temaGeneral || undefined,
        q: searchTerm || undefined,
        solo_aplicables: soloAplicables,
        estado: bulkFormData.estado,
        evidencia_cumplimiento: bulkFormData.evidencia_cumplimiento || null,
        plan_accion: bulkFormData.plan_accion || null,
        responsable: bulkFormData.responsable || null,
        fecha_compromiso: bulkFormData.fecha_compromiso || null,
        observaciones: bulkFormData.observaciones || null,
        aplica_empresa: bulkFormData.aplica_empresa,
        justificacion_no_aplica: bulkFormData.justificacion_no_aplica || null,
      };
      const result = await matrizLegalService.bulkUpdatePorFiltros(numEmpresaId, payload);
      enqueueSnackbar(result.message, { variant: "success" });
      setOpenFiltrosDialog(false);
      setSelected([]);
      loadNormas();
      const stats = await matrizLegalService.getEstadisticasEmpresa(numEmpresaId);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error bulk filtros:", error);
      enqueueSnackbar("Error al aplicar a filtrados", { variant: "error" });
    } finally {
      setSavingFiltros(false);
    }
  };

  // --- Handlers inline estado ---
  const handleInlineEstadoClick = (event: React.MouseEvent<HTMLElement>, norma: MatrizLegalNormaConCumplimiento) => {
    event.stopPropagation();
    setInlineAnchorEl(event.currentTarget);
    setInlineNorma(norma);
  };

  const handleInlineEstadoClose = () => {
    setInlineAnchorEl(null);
    setInlineNorma(null);
  };

  const handleInlineEstadoSelect = async (nuevoEstado: EstadoCumplimiento) => {
    if (!inlineNorma) return;
    try {
      setSavingInline(true);
      await matrizLegalService.inlineUpdateEstado(numEmpresaId, inlineNorma.id, nuevoEstado);
      enqueueSnackbar("Estado actualizado", { variant: "success" });
      // Actualización optimista local
      setNormas(prev =>
        prev.map(n => n.id === inlineNorma.id ? { ...n, estado_cumplimiento: nuevoEstado } : n)
      );
      handleInlineEstadoClose();
      const stats = await matrizLegalService.getEstadisticasEmpresa(numEmpresaId);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error inline estado:", error);
      enqueueSnackbar("Error al actualizar estado", { variant: "error" });
    } finally {
      setSavingInline(false);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = normas
        .filter(n => n.cumplimiento_id)
        .map(n => n.cumplimiento_id!);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (cumplimientoId: number | null) => {
    if (!cumplimientoId) return;

    const selectedIndex = selected.indexOf(cumplimientoId);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, cumplimientoId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (cumplimientoId: number | null) => cumplimientoId ? selected.indexOf(cumplimientoId) !== -1 : false;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getEstadoIcon = (estado: EstadoCumplimiento | null) => {
    switch (estado) {
      case "cumple":
        return <CheckIcon fontSize="small" sx={{ color: "success.main" }} />;
      case "no_cumple":
        return <CancelIcon fontSize="small" sx={{ color: "error.main" }} />;
      case "pendiente":
        return <PendingIcon fontSize="small" sx={{ color: "warning.main" }} />;
      case "en_proceso":
        return <ProcessIcon fontSize="small" sx={{ color: "info.main" }} />;
      case "no_aplica":
        return <BlockIcon fontSize="small" sx={{ color: "grey.500" }} />;
      default:
        return <PendingIcon fontSize="small" sx={{ color: "warning.main" }} />;
    }
  };

  const getEstadoColor = (estado: EstadoCumplimiento | null): string => {
    return matrizLegalService.getColorEstadoCumplimiento(estado);
  };

  const hasActiveFilters = estadoCumplimiento || clasificacion || temaGeneral;

  if (!empresaId) {
    return (
      <Box p={3}>
        <Alert severity="error">ID de empresa no especificado</Alert>
      </Box>
    );
  }

  return (
      <Box p={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate("/admin/matriz-legal")}
          sx={{ mb: 2 }}
        >
          Volver al Dashboard
        </Button>

        <Typography variant="h4" gutterBottom>
          Cumplimiento de Matriz Legal
        </Typography>

        {empresa && (
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {empresa.nombre}
          </Typography>
        )}

        {/* Estadísticas */}
        {estadisticas && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Porcentaje de Cumplimiento
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box flexGrow={1}>
                      <LinearProgress
                        variant="determinate"
                        value={estadisticas.porcentaje_cumplimiento}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          bgcolor: "#e0e0e0",
                          "& .MuiLinearProgress-bar": {
                            bgcolor:
                              estadisticas.porcentaje_cumplimiento >= 80
                                ? "success.main"
                                : estadisticas.porcentaje_cumplimiento >= 50
                                ? "warning.main"
                                : "error.main",
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ minWidth: 60 }}>
                      {estadisticas.porcentaje_cumplimiento.toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <Typography variant="subtitle2" color="textSecondary">Cumple</Typography>
                  <Typography variant="h5" color="success.main">{estadisticas.por_estado.cumple}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <Typography variant="subtitle2" color="textSecondary">No Cumple</Typography>
                  <Typography variant="h5" color="error.main">{estadisticas.por_estado.no_cumple}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <Typography variant="subtitle2" color="textSecondary">Pendiente</Typography>
                  <Typography variant="h5" color="warning.main">{estadisticas.por_estado.pendiente}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <Typography variant="subtitle2" color="textSecondary">En Proceso</Typography>
                  <Typography variant="h5" color="info.main">{estadisticas.por_estado.en_proceso}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Normas heredadas de un perfil anterior: siguen en la base pero ya no
            aplican, e inflan la matriz si se navega sin "Solo aplicables". */}
        {estadisticas && (estadisticas.normas_no_aplicables ?? 0) > 0 && soloAplicables && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setSoloAplicables(false);
                  setPage(0);
                }}
              >
                Ver cuáles
              </Button>
            }
          >
            Hay <strong>{estadisticas.normas_no_aplicables}</strong> normas que ya
            no aplican a su perfil actual (quedaron de una configuración anterior).
            Están ocultas por el filtro «Solo aplicables».
          </Alert>
        )}

        {/* Normas que aplican pero cuyo cumplimiento depende del perfil */}
        {estadisticas &&
          ((estadisticas.normas_revision_tamano ?? 0) > 0 ||
            (estadisticas.normas_revision_riesgo ?? 0) > 0) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Revisión manual recomendada:{" "}
              {(estadisticas.normas_revision_tamano ?? 0) > 0 && (
                <>
                  <strong>{estadisticas.normas_revision_tamano}</strong> normas
                  dependen del número de trabajadores
                </>
              )}
              {(estadisticas.normas_revision_tamano ?? 0) > 0 &&
                (estadisticas.normas_revision_riesgo ?? 0) > 0 &&
                " y "}
              {(estadisticas.normas_revision_riesgo ?? 0) > 0 && (
                <>
                  <strong>{estadisticas.normas_revision_riesgo}</strong> dependen
                  de la clase de riesgo
                </>
              )}
              . Todas aplican a su empresa; lo que cambia es <em>cómo</em> se
              cumplen (por ejemplo COPASST frente a Vigía de SST). Están marcadas
              en la tabla.
            </Alert>
          )}

        {/* Barra de herramientas */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <TextField
                  placeholder="Buscar norma..."
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: "100%", sm: 250 } }}
                />
                <Button
                  startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  color={hasActiveFilters ? "primary" : "inherit"}
                >
                  Filtros
                </Button>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Tooltip title={`Aplicar una acción a las ${total} normas que coinciden con los filtros actuales`}>
                  <Button
                    startIcon={<CheckIcon />}
                    variant="outlined"
                    color="warning"
                    onClick={handleOpenFiltrosDialog}
                  >
                    Aplicar a todos ({total})
                  </Button>
                </Tooltip>
                <Tooltip
                  title={
                    selected.length > 0
                      ? `Generar una evidencia distinta con IA para cada una de las ${selected.length} normas seleccionadas`
                      : `Generar una evidencia distinta con IA para cada una de las ${total} normas filtradas`
                  }
                >
                  <Button
                    startIcon={<AIIcon />}
                    variant="outlined"
                    color="secondary"
                    onClick={handleOpenIADialog}
                    disabled={iaAlcance === 0}
                  >
                    Generar evidencias con IA ({iaAlcance})
                  </Button>
                </Tooltip>
                <Button
                  startIcon={<SyncIcon />}
                  onClick={handleSincronizar}
                  disabled={sincronizando}
                >
                  {sincronizando ? "Sincronizando..." : "Sincronizar"}
                </Button>
                <Tooltip title='Asigna el responsable configurado por clasificación (Perfil de la Empresa) a los pendientes sin responsable. No sobrescribe los que ya tienen uno.'>
                  <span>
                    <Button
                      startIcon={<AssignmentIndIcon />}
                      onClick={handleAutoasignarResponsables}
                      disabled={autoasignandoResponsables}
                    >
                      {autoasignandoResponsables ? "Autoasignando..." : "Autoasignar responsables"}
                    </Button>
                  </span>
                </Tooltip>
                <Button startIcon={<RefreshIcon />} onClick={loadNormas}>
                  Recargar
                </Button>
                <Button startIcon={<DownloadIcon />} variant="outlined" onClick={handleExport}>
                  Exportar
                </Button>
                <Tooltip title="Sube el mismo Excel exportado, ya diligenciado con evidencia, observaciones, plan de acción, responsable, fecha compromiso y seguimiento. Solo actualiza celdas con contenido — no borra nada con celdas vacías.">
                  <span>
                    <Button
                      startIcon={<UploadCumplimientoIcon />}
                      variant="outlined"
                      onClick={handleImportarCumplimientoClick}
                      disabled={importandoCumplimiento}
                    >
                      {importandoCumplimiento ? "Importando..." : "Importar Cumplimiento"}
                    </Button>
                  </span>
                </Tooltip>
                <input
                  ref={importCumplimientoInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={handleImportarCumplimientoFile}
                />
              </Box>
            </Box>

            {/* Acciones bulk */}
            {selected.length > 0 && (
              <Box mt={2} p={2} bgcolor="primary.light" borderRadius={1}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {selected.length} norma(s) seleccionada(s)
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button size="small" variant="contained" startIcon={<EditIcon />} onClick={handleOpenBulkDialog}>
                    Evaluar seleccionadas
                  </Button>
                  <Button size="small" variant="outlined" color="inherit" startIcon={<BlockIcon />} onClick={handleQuickNoAplica}>
                    Marcar No Aplica
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => setSelected([])}>
                    Cancelar ({selected.length})
                  </Button>
                </Box>
              </Box>
            )}

            {/* Filtros */}
            <Collapse in={showFilters}>
              <Box mt={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      label="Estado Cumplimiento"
                      fullWidth
                      size="small"
                      value={estadoCumplimiento}
                      onChange={(e) => { setEstadoCumplimiento(e.target.value); setPage(0); }}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="cumple">Cumple</MenuItem>
                      <MenuItem value="no_cumple">No Cumple</MenuItem>
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="en_proceso">En Proceso</MenuItem>
                      <MenuItem value="no_aplica">No Aplica</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      label="Clasificación"
                      fullWidth
                      size="small"
                      value={clasificacion}
                      onChange={(e) => { setClasificacion(e.target.value); setPage(0); }}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {clasificaciones.map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      select
                      label="Tema"
                      fullWidth
                      size="small"
                      value={temaGeneral}
                      onChange={(e) => { setTemaGeneral(e.target.value); setPage(0); }}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {temas.map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={soloAplicables}
                          onChange={(e) => { setSoloAplicables(e.target.checked); setPage(0); }}
                        />
                      }
                      label="Solo aplicables"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* Tabla de normas */}
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < normas.filter(n => n.cumplimiento_id).length}
                      checked={normas.length > 0 && selected.length === normas.filter(n => n.cumplimiento_id).length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Norma</TableCell>
                  <TableCell>Clasificación</TableCell>
                  <TableCell>Tema</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell>Responsable</TableCell>
                  <TableCell>F. Compromiso</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : normas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      No se encontraron normas
                    </TableCell>
                  </TableRow>
                ) : (
                  normas.map((norma) => {
                    const isItemSelected = isSelected(norma.cumplimiento_id);
                    return (
                      <TableRow
                        key={norma.id}
                        hover
                        selected={isItemSelected}
                        sx={{
                          bgcolor: !norma.aplica_empresa ? "grey.100" : "inherit",
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isItemSelected}
                            onChange={() => handleSelect(norma.cumplimiento_id)}
                            disabled={!norma.cumplimiento_id}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={norma.descripcion_norma || ""}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {norma.tipo_norma} {norma.numero_norma}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {norma.articulo || "Todo"} - {norma.anio}
                              </Typography>
                            </Box>
                          </Tooltip>
                          {/* Avisos: la norma aplica igual, pero cómo se cumple
                              depende del perfil de la empresa */}
                          {(norma.requiere_revision_tamano || norma.requiere_revision_riesgo) && (
                            <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                              {norma.requiere_revision_tamano && (() => {
                                // Si revision_hint arranca con "Aplica" es el caso
                                // COPASST/Vigía, resuelto con el nº de trabajadores
                                // de la empresa — se puede mostrar como definitivo.
                                const resuelto = norma.revision_hint?.startsWith("Aplica");
                                return (
                                  <Tooltip
                                    title={
                                      norma.revision_hint ||
                                      "Cómo se cumple esta norma depende del número de trabajadores (p. ej. COPASST si son 10 o más, Vigía de SST si son menos). Revísela contra su nómina."
                                    }
                                  >
                                    <Chip
                                      size="small"
                                      variant={resuelto ? "filled" : "outlined"}
                                      color={resuelto ? "success" : "info"}
                                      label={
                                        resuelto
                                          ? norma.revision_hint!.replace(/\s*\(.*\)$/, "")
                                          : "Revisar: nº trabajadores"
                                      }
                                      sx={{ height: 18, fontSize: "0.65rem" }}
                                    />
                                  </Tooltip>
                                );
                              })()}
                              {norma.requiere_revision_riesgo && (
                                <Tooltip
                                  title={
                                    norma.revision_hint ||
                                    "Cómo se cumple esta norma depende de la clase de riesgo de la empresa (I a V). Revísela contra su clasificación ante la ARL."
                                  }
                                >
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    label="Revisar: clase de riesgo"
                                    sx={{ height: 18, fontSize: "0.65rem" }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={norma.clasificacion_norma} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {norma.tema_general}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Clic para cambiar estado rápidamente">
                            <Chip
                              size="small"
                              icon={getEstadoIcon(norma.estado_cumplimiento)}
                              label={matrizLegalService.getLabelEstadoCumplimiento(norma.estado_cumplimiento)}
                              onClick={(e) => handleInlineEstadoClick(e, norma)}
                              sx={{
                                bgcolor: getEstadoColor(norma.estado_cumplimiento),
                                color: "white",
                                cursor: "pointer",
                                "&:hover": { opacity: 0.85, transform: "scale(1.05)" },
                                transition: "all 0.15s",
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{norma.responsable || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          {norma.fecha_compromiso
                            ? new Date(norma.fecha_compromiso).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Evaluar Cumplimiento">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(norma)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
          />
        </Paper>

        {/* Dialog de edición de cumplimiento */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Evaluar Cumplimiento
            {editingNorma && (
              <Typography variant="subtitle2" color="textSecondary">
                {editingNorma.tipo_norma} {editingNorma.numero_norma} - {editingNorma.articulo || "Todo"}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent dividers>
            {editingNorma && (
              <Box display="flex" flexDirection="column" gap={3}>
                {/* Info de la norma */}
                <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Typography variant="subtitle2" color="textSecondary">Descripción</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {editingNorma.descripcion_norma || "Sin descripción"}
                  </Typography>
                  {editingNorma.descripcion_articulo_exigencias && (
                    <>
                      <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>Exigencias</Typography>
                      <Typography variant="body2">
                        {editingNorma.descripcion_articulo_exigencias}
                      </Typography>
                    </>
                  )}
                </Paper>

                <Divider />

                {/* Formulario */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      label="Estado de Cumplimiento"
                      fullWidth
                      required
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoCumplimiento })}
                    >
                      <MenuItem value="cumple">Cumple</MenuItem>
                      <MenuItem value="no_cumple">No Cumple</MenuItem>
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="en_proceso">En Proceso</MenuItem>
                      <MenuItem value="no_aplica">No Aplica</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.aplica_empresa}
                          onChange={(e) => setFormData({ ...formData, aplica_empresa: e.target.checked })}
                        />
                      }
                      label="Esta norma aplica a la empresa"
                    />
                  </Grid>

                  {!formData.aplica_empresa && (
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Justificación (por qué no aplica)"
                        fullWidth
                        multiline
                        rows={2}
                        value={formData.justificacion_no_aplica}
                        onChange={(e) => setFormData({ ...formData, justificacion_no_aplica: e.target.value })}
                      />
                    </Grid>
                  )}

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <TextField
                        label="Evidencia de Cumplimiento"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.evidencia_cumplimiento}
                        onChange={(e) => setFormData({ ...formData, evidencia_cumplimiento: e.target.value })}
                        helperText="Describa las evidencias que demuestran el cumplimiento"
                      />
                      <Tooltip title="Generar sugerencia con IA">
                        <IconButton
                          size="small"
                          onClick={() => handleSolicitarSugerenciaIA("evidencia")}
                          disabled={loadingIAField === "evidencia"}
                          sx={{
                            mt: 1,
                            bgcolor: "secondary.main",
                            color: "white",
                            "&:hover": { bgcolor: "secondary.dark" },
                            "&:disabled": { bgcolor: "grey.300" },
                          }}
                        >
                          {loadingIAField === "evidencia" ? <CircularProgress size={18} color="inherit" /> : <AIIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <TextField
                        label="Observaciones"
                        fullWidth
                        multiline
                        rows={2}
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      />
                      <Tooltip title="Generar sugerencia con IA">
                        <IconButton
                          size="small"
                          onClick={() => handleSolicitarSugerenciaIA("observaciones")}
                          disabled={loadingIAField === "observaciones"}
                          sx={{
                            mt: 1,
                            bgcolor: "secondary.main",
                            color: "white",
                            "&:hover": { bgcolor: "secondary.dark" },
                            "&:disabled": { bgcolor: "grey.300" },
                          }}
                        >
                          {loadingIAField === "observaciones" ? <CircularProgress size={18} color="inherit" /> : <AIIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                      freeSolo
                      options={SUGERENCIAS_RESPONSABLES}
                      value={formData.responsable}
                      onChange={(_event, newValue) => {
                        setFormData({ ...formData, responsable: newValue || "" });
                      }}
                      onInputChange={(_event, newInputValue) => {
                        setFormData({ ...formData, responsable: newInputValue });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Responsable"
                          fullWidth
                          placeholder="Seleccione o escriba el responsable"
                          helperText="Opcional — puede seleccionar de la lista o escribir un nombre"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Fecha Compromiso"
                      type="date"
                      fullWidth
                      value={formData.fecha_compromiso || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha_compromiso: e.target.value || null,
                        })
                      }
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>

                  {(formData.estado === "no_cumple" || formData.estado === "en_proceso") && (
                    <>
                      <Grid size={{ xs: 12 }}>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Complete el plan de acción para las normas que no cumplen
                        </Alert>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                          <TextField
                            label="Plan de Acción"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.plan_accion}
                            onChange={(e) => setFormData({ ...formData, plan_accion: e.target.value })}
                            helperText="Describa las acciones a implementar para lograr el cumplimiento"
                          />
                          <Tooltip title="Generar sugerencia con IA">
                            <IconButton
                              size="small"
                              onClick={() => handleSolicitarSugerenciaIA("plan_accion")}
                              disabled={loadingIAField === "plan_accion"}
                              sx={{
                                mt: 1,
                                bgcolor: "secondary.main",
                                color: "white",
                                "&:hover": { bgcolor: "secondary.dark" },
                                "&:disabled": { bgcolor: "grey.300" },
                              }}
                            >
                              {loadingIAField === "plan_accion" ? <CircularProgress size={18} color="inherit" /> : <AIIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Popover inline — cambio rápido de estado */}
        <Popover
          open={Boolean(inlineAnchorEl)}
          anchorEl={inlineAnchorEl}
          onClose={handleInlineEstadoClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Paper sx={{ p: 1, minWidth: 170 }}>
            <Typography variant="caption" color="textSecondary" sx={{ px: 1, display: "block", mb: 0.5 }}>
              Cambiar estado:
            </Typography>
            {savingInline && <LinearProgress sx={{ mb: 1 }} />}
            {(["cumple", "no_cumple", "pendiente", "en_proceso", "no_aplica"] as EstadoCumplimiento[]).map((estado) => (
              <MenuItem
                key={estado}
                onClick={() => handleInlineEstadoSelect(estado)}
                disabled={savingInline || estado === inlineNorma?.estado_cumplimiento}
                dense
                sx={{
                  borderRadius: 1,
                  mb: 0.25,
                  bgcolor: estado === inlineNorma?.estado_cumplimiento ? "action.selected" : "inherit",
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  {getEstadoIcon(estado)}
                  <Typography variant="body2">
                    {matrizLegalService.getLabelEstadoCumplimiento(estado)}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Paper>
        </Popover>

        {/* Dialog bulk extendido — ítems seleccionados */}
        <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Evaluar {selected.length} norma(s) seleccionada(s)
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Los campos completados se aplicarán a todas las normas seleccionadas. Deja en blanco los que no quieras modificar.
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                select
                label="Estado de Cumplimiento"
                fullWidth
                required
                value={bulkFormData.estado}
                onChange={(e) => setBulkFormData({ ...bulkFormData, estado: e.target.value as EstadoCumplimiento })}
              >
                <MenuItem value="cumple">Cumple</MenuItem>
                <MenuItem value="no_cumple">No Cumple</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="en_proceso">En Proceso</MenuItem>
                <MenuItem value="no_aplica">No Aplica</MenuItem>
              </TextField>

              {bulkFormData.estado === "no_aplica" && (
                <TextField
                  label="Justificación (por qué no aplica)"
                  fullWidth
                  multiline
                  rows={2}
                  value={bulkFormData.justificacion_no_aplica}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, justificacion_no_aplica: e.target.value })}
                  helperText="Se aplicará a todas las normas seleccionadas"
                />
              )}

              {(bulkFormData.estado === "no_cumple" || bulkFormData.estado === "en_proceso") && (
                <Alert severity="info">
                  El plan de acción es opcional en la actualización masiva. Puedes completarlo individualmente después.
                </Alert>
              )}

              {/* Evidencia de cumplimiento */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" color="textSecondary">Evidencia de Cumplimiento (opcional)</Typography>
                  <Tooltip title='Este texto se aplica IGUAL a todas las normas. Para una evidencia distinta por norma use "Generar evidencias con IA".'>
                    <Chip size="small" variant="outlined" label="Texto único" />
                  </Tooltip>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={bulkFormData.evidencia_cumplimiento}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, evidencia_cumplimiento: e.target.value })}
                  placeholder="Documentos, registros o procedimientos que demuestren el cumplimiento..."
                />
              </Box>

              <Autocomplete
                freeSolo
                options={SUGERENCIAS_RESPONSABLES}
                value={bulkFormData.responsable}
                onChange={(_e, v) => setBulkFormData({ ...bulkFormData, responsable: v || "" })}
                onInputChange={(_e, v) => setBulkFormData({ ...bulkFormData, responsable: v })}
                renderInput={(params) => (
                  <TextField {...params} label="Responsable (opcional)" fullWidth />
                )}
              />

              <TextField
                label="Fecha Compromiso (opcional)"
                type="date"
                fullWidth
                value={bulkFormData.fecha_compromiso || ""}
                onChange={(e) => setBulkFormData({ ...bulkFormData, fecha_compromiso: e.target.value || null })}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label="Observaciones compartidas (opcional)"
                fullWidth
                multiline
                rows={2}
                value={bulkFormData.observaciones}
                onChange={(e) => setBulkFormData({ ...bulkFormData, observaciones: e.target.value })}
              />

              {(bulkFormData.estado === "no_cumple" || bulkFormData.estado === "en_proceso") && (
                <TextField
                  label="Plan de Acción (opcional)"
                  fullWidth
                  multiline
                  rows={2}
                  value={bulkFormData.plan_accion}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, plan_accion: e.target.value })}
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBulkDialog(false)} color="inherit">Cancelar</Button>
            <Button onClick={handleSaveBulkDialog} variant="contained" disabled={savingBulk}>
              {savingBulk ? "Guardando..." : `Aplicar a ${selected.length} normas`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog aplicar a todos los filtrados */}
        <Dialog open={openFiltrosDialog} onClose={() => setOpenFiltrosDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Aplicar a todos los filtrados</DialogTitle>
          <DialogContent dividers>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Esta acción afectará <strong>{total} normas</strong>
              {(estadoCumplimiento || clasificacion || temaGeneral || searchTerm)
                ? " que coinciden con los filtros activos"
                : " (toda la matriz aplicable)"}. Incluye registros en páginas que no estás viendo actualmente.
            </Alert>

            {/* Resumen de filtros activos */}
            {(estadoCumplimiento || clasificacion || temaGeneral || searchTerm) && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>Filtros activos:</Typography>
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  {estadoCumplimiento && (
                    <Chip label={`Estado: ${estadoCumplimiento}`} size="small" onDelete={() => setEstadoCumplimiento("")} />
                  )}
                  {clasificacion && (
                    <Chip label={`Clasificación: ${clasificacion}`} size="small" onDelete={() => setClasificacion("")} />
                  )}
                  {temaGeneral && (
                    <Chip label={`Tema: ${temaGeneral}`} size="small" onDelete={() => setTemaGeneral("")} />
                  )}
                  {searchTerm && (
                    <Chip label={`Búsqueda: "${searchTerm}"`} size="small" onDelete={() => setSearchTerm("")} />
                  )}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                select
                label="Estado de Cumplimiento"
                fullWidth
                required
                value={bulkFormData.estado}
                onChange={(e) => setBulkFormData({ ...bulkFormData, estado: e.target.value as EstadoCumplimiento })}
              >
                <MenuItem value="cumple">Cumple</MenuItem>
                <MenuItem value="no_cumple">No Cumple</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="en_proceso">En Proceso</MenuItem>
                <MenuItem value="no_aplica">No Aplica</MenuItem>
              </TextField>

              {bulkFormData.estado === "no_aplica" && (
                <TextField
                  label="Justificación"
                  fullWidth
                  multiline
                  rows={2}
                  value={bulkFormData.justificacion_no_aplica}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, justificacion_no_aplica: e.target.value })}
                />
              )}

              {/* Evidencia de cumplimiento con IA */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" color="textSecondary">Evidencia de Cumplimiento (opcional)</Typography>
                  <Tooltip title='Este texto se aplica IGUAL a todas las normas. Para una evidencia distinta por norma use "Generar evidencias con IA".'>
                    <Chip size="small" variant="outlined" label="Texto único" />
                  </Tooltip>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={bulkFormData.evidencia_cumplimiento}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, evidencia_cumplimiento: e.target.value })}
                  placeholder="Documentos, registros o procedimientos que demuestren el cumplimiento..."
                />
              </Box>

              <Autocomplete
                freeSolo
                options={SUGERENCIAS_RESPONSABLES}
                value={bulkFormData.responsable}
                onChange={(_e, v) => setBulkFormData({ ...bulkFormData, responsable: v || "" })}
                onInputChange={(_e, v) => setBulkFormData({ ...bulkFormData, responsable: v })}
                renderInput={(params) => (
                  <TextField {...params} label="Responsable (opcional)" fullWidth />
                )}
              />

              <TextField
                label="Fecha Compromiso (opcional)"
                type="date"
                fullWidth
                value={bulkFormData.fecha_compromiso || ""}
                onChange={(e) => setBulkFormData({ ...bulkFormData, fecha_compromiso: e.target.value || null })}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label="Observaciones (opcional)"
                fullWidth
                multiline
                rows={2}
                value={bulkFormData.observaciones}
                onChange={(e) => setBulkFormData({ ...bulkFormData, observaciones: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenFiltrosDialog(false)} color="inherit">Cancelar</Button>
            <Button onClick={handleSaveFiltros} variant="contained" color="warning" disabled={savingFiltros}>
              {savingFiltros ? "Procesando..." : `Confirmar: aplicar a ${total} normas`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo: confirmar generación de evidencias con IA (una por norma) */}
        <Dialog open={openIADialog} onClose={() => setOpenIADialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <AIIcon color="secondary" />
              Generar evidencias con IA
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2 }}>
              Se generará una evidencia <strong>distinta para cada norma</strong>,
              redactada a partir del artículo de esa norma y del perfil de su
              empresa (sector, CIIU, clase de riesgo y características de riesgo).
            </Alert>

            <Typography variant="body2" paragraph>
              Normas a procesar: <strong>{iaAlcance}</strong>{" "}
              {selected.length > 0
                ? "(seleccionadas en la tabla)"
                : "(todas las que coinciden con los filtros actuales)"}
            </Typography>

            {iaTandasPreview > 1 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Claude procesa como máximo {IA_MAX_NORMAS_POR_JOB} normas por
                tanda, así que esto se va a lanzar automáticamente en{" "}
                <strong>{iaTandasPreview} tandas</strong> sucesivas — no hace
                falta seleccionar manualmente. La ventana de progreso muestra
                el avance acumulado de todas las tandas.
              </Alert>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={iaSoloVacios}
                  onChange={(e) => setIaSoloVacios(e.target.checked)}
                />
              }
              label="Solo rellenar campos vacíos (no sobrescribir lo ya escrito)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={iaIncluirObservaciones}
                  onChange={(e) => setIaIncluirObservaciones(e.target.checked)}
                />
              }
              label="Generar también las observaciones"
            />

            {!iaSoloVacios && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Se sobrescribirán las evidencias existentes. El texto anterior
                queda guardado en el historial de cada norma.
              </Alert>
            )}

            <Alert severity="warning" sx={{ mt: 2 }}>
              El proceso corre en el servidor y puede tardar varios minutos.
              Puede cerrar la ventana de progreso sin detenerlo.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenIADialog(false)} color="inherit">
              Cancelar
            </Button>
            <Button
              onClick={handleLanzarJobIA}
              variant="contained"
              color="secondary"
              disabled={iaLanzando}
              startIcon={iaLanzando ? <CircularProgress size={16} /> : <AIIcon />}
            >
              {iaLanzando ? "Iniciando..." : `Generar para ${iaAlcance} normas`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo: progreso del job de IA */}
        <Dialog open={openIAProgreso} onClose={handleCerrarProgresoIA} maxWidth="sm" fullWidth>
          <DialogTitle>Generando evidencias con IA</DialogTitle>
          <DialogContent dividers>
            {iaJob && (() => {
              const procesadas = iaAcumulado.procesadas + iaJob.procesadas;
              const exitosas = iaAcumulado.exitosas + iaJob.exitosas;
              const fallidas = iaAcumulado.fallidas + iaJob.fallidas;
              const totalGeneral = iaTotalGeneral || iaJob.total;
              const procesoTerminado = iaJob.estado !== "en_proceso" && iaTandas.length === 0;
              const logErroresCombinado = [...iaAcumulado.logErrores, ...(iaJob.log_errores ? [iaJob.log_errores] : [])];

              return (
                <Box>
                  {iaTandaTotal > 1 && (
                    <Typography variant="caption" color="textSecondary" display="block" mb={1}>
                      Tanda {iaTandaIndex} de {iaTandaTotal}
                    </Typography>
                  )}
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {procesadas} de {totalGeneral} normas procesadas
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {totalGeneral > 0 ? Math.round((procesadas / totalGeneral) * 100) : 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant={totalGeneral > 0 ? "determinate" : "indeterminate"}
                    value={totalGeneral > 0 ? (procesadas / totalGeneral) * 100 : 0}
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />

                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    <Chip size="small" color="success" label={`${exitosas} generadas`} />
                    {fallidas > 0 && (
                      <Chip size="small" color="error" label={`${fallidas} fallidas`} />
                    )}
                  </Box>

                  {!procesoTerminado && (
                    <Alert severity="info">
                      Puede cerrar esta ventana: el proceso continúa en el servidor.
                    </Alert>
                  )}
                  {procesoTerminado && iaJob.estado === "completada" && (
                    <Alert severity="success">
                      Listo. Se generaron {exitosas} evidencias.
                    </Alert>
                  )}
                  {procesoTerminado && iaJob.estado === "parcial" && (
                    <Alert severity="warning">
                      Terminó con errores: {exitosas} generadas, {fallidas} fallidas.
                    </Alert>
                  )}
                  {procesoTerminado && iaJob.estado === "fallida" && fallidas > 0 && exitosas === 0 && (
                    <Alert severity="error">
                      No se pudo generar ninguna evidencia. Revise la configuración
                      del servicio de IA.
                    </Alert>
                  )}

                  {logErroresCombinado.length > 0 && (
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2">Detalle de errores</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography
                          variant="caption"
                          component="pre"
                          sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                        >
                          {logErroresCombinado.join("\n")}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCerrarProgresoIA} variant="contained">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Resultado de importar el Excel de cumplimiento diligenciado */}
        <Dialog
          open={!!resultadoImportCumplimiento}
          onClose={() => setResultadoImportCumplimiento(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Resultado de la importación</DialogTitle>
          <DialogContent dividers>
            {resultadoImportCumplimiento && (
              <Box>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  <Chip
                    size="small"
                    label={`${resultadoImportCumplimiento.total_filas} filas leídas`}
                  />
                  <Chip
                    size="small"
                    color="success"
                    label={`${resultadoImportCumplimiento.actualizados} actualizadas`}
                  />
                  <Chip
                    size="small"
                    label={`${resultadoImportCumplimiento.sin_cambios} sin cambios`}
                  />
                  {resultadoImportCumplimiento.errores > 0 && (
                    <Chip
                      size="small"
                      color="error"
                      label={`${resultadoImportCumplimiento.errores} con error`}
                    />
                  )}
                </Box>

                {resultadoImportCumplimiento.actualizados > 0 && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Se actualizaron {resultadoImportCumplimiento.actualizados} normas.
                  </Alert>
                )}

                {resultadoImportCumplimiento.log_errores.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2">
                        Detalle ({resultadoImportCumplimiento.log_errores.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                      >
                        {resultadoImportCumplimiento.log_errores.join("\n")}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResultadoImportCumplimiento(null)} variant="contained">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
  );
};

export default MatrizLegalEmpresa;
