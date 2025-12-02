import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
} from "@mui/material";
import {
  CalendarToday as Calendar,
  Event as EventIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Pending as PendingIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import {
  format,
  differenceInDays,
  isWeekend,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { useParams } from "react-router-dom";
import { parseDateOnlyToLocal } from "../utils/dateUtils";

// Services and types
import vacationService from "../services/vacationService";
import workerService from "../services/workerService";
import {
  WorkerVacation,
  VacationRequest,
  VacationApproval,
  VacationBalance,
  VacationUpdate,
} from "../types/worker";

// Interfaces
interface WorkerVacationsProps {
  workerId?: string;
  isAdmin?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isOccupied: boolean;
  isPending: boolean;
  isSelected: boolean;
  occupiedBy?: string;
}

const WorkerVacations: React.FC<WorkerVacationsProps> = ({
  workerId: propWorkerId,
  isAdmin = false,
}) => {
  const { workerId: paramWorkerId } = useParams<{ workerId: string }>();
  const workerId = propWorkerId || paramWorkerId;

  // Estados principales
  const [vacationRequests, setVacationRequests] = useState<WorkerVacation[]>(
    []
  );
  const [vacationBalance, setVacationBalance] =
    useState<VacationBalance | null>(null);
  const [workerHireDate, setWorkerHireDate] = useState<Date | null>(null);
  // Eliminado estado no utilizado para estadísticas de vacaciones
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  // Filtro por año (visible para admin/supervisor)
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Años disponibles en base a las solicitudes y el año actual
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    yearsSet.add(new Date().getFullYear() - 1);
    yearsSet.add(new Date().getFullYear() + 1);
    vacationRequests.forEach((req) => {
      yearsSet.add(new Date(req.start_date).getFullYear());
      yearsSet.add(new Date(req.end_date).getFullYear());
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [vacationRequests]);

  // Cálculo local de días pendientes dentro del año seleccionado
  const countWorkingDaysInYear = useCallback(
    (startStr: string, endStr: string, year: number): number => {
      const s = parseDateOnlyToLocal(startStr) || new Date(startStr);
      const e = parseDateOnlyToLocal(endStr) || new Date(endStr);
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      const start = s < yearStart ? yearStart : s;
      const end = e > yearEnd ? yearEnd : e;
      if (end < yearStart || start > yearEnd) return 0;
      const days = eachDayOfInterval({ start, end });
      return days.filter((d) => !isWeekend(d)).length;
    },
    []
  );

  const pendingDaysInSelectedYear = useMemo(() => {
    return vacationRequests
      .filter((r) => r.status === "pending")
      .reduce(
        (sum, r) =>
          sum + countWorkingDaysInYear(r.start_date, r.end_date, selectedYear),
        0
      );
  }, [vacationRequests, selectedYear, countWorkingDaysInYear]);

  const availableDaysDisplay = useMemo(() => {
    const total = vacationBalance?.total_days ?? 0;
    const used = vacationBalance?.used_days ?? 0;
    return Math.max(0, total - used - pendingDaysInSelectedYear);
  }, [vacationBalance, pendingDaysInSelectedYear]);

  // Guardia para evitar múltiples fetch simultáneos o repetidos
  const fetchInProgressRef = useRef(false);

  // Estados para el diálogo de nueva solicitud
  const [openDialog, setOpenDialog] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estados para edición
  const [editingRequest, setEditingRequest] = useState<WorkerVacation | null>(
    null
  );
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editStartDate, setEditStartDate] = useState<Date | null>(null);
  const [editEndDate, setEditEndDate] = useState<Date | null>(null);
  const [editComments, setEditComments] = useState("");

  // Estados para confirmación de eliminación
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<WorkerVacation | null>(
    null
  );

  // Estados para el menú de acciones
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequestForMenu, setSelectedRequestForMenu] =
    useState<WorkerVacation | null>(null);

  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  // Estados para el calendario
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedRange, setSelectedRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Nombre del trabajador para mostrar en la lista (fallback si no viene en las solicitudes)
  const [workerFullName, setWorkerFullName] = useState<string>("");

  // Cargar datos iniciales
  const fetchVacationData = useCallback(async () => {
    if (!workerId) return;
    // Evitar llamadas repetidas si un fetch está en curso
    if (fetchInProgressRef.current) return;
    try {
      setLoading(true);
      fetchInProgressRef.current = true;
      const workerIdNum = parseInt(workerId);
      const [requests, balance, worker] = await Promise.all([
        vacationService.getWorkerVacations(workerIdNum),
        vacationService.getVacationBalance(workerIdNum, selectedYear),
        workerService.getWorker(workerIdNum),
      ]);
      setVacationRequests(requests);
      setVacationBalance(balance);
      if (worker?.fecha_de_ingreso) {
        try {
          setWorkerHireDate(new Date(worker.fecha_de_ingreso));
        } catch (_) {
          setWorkerHireDate(null);
        }
      } else {
        setWorkerHireDate(null);
      }
      if (worker?.first_name || worker?.last_name) {
        setWorkerFullName(
          `${worker.first_name ?? ""} ${worker.last_name ?? ""}`.trim()
        );
      }
    } catch (error: any) {
      let errorMessage = "No se pudieron cargar los datos de vacaciones";
      if (error?.response?.status === 404) {
        errorMessage =
          "👤 Trabajador no encontrado: No se encontró información de vacaciones para este empleado.";
      } else if (error?.response?.status === 403) {
        errorMessage =
          "🔒 Sin permisos: No tiene autorización para ver la información de vacaciones de este empleado.";
      } else if (error?.response?.status === 401) {
        errorMessage =
          "🔐 Sesión expirada: Por favor, inicie sesión nuevamente para continuar.";
      } else if (error?.response?.status >= 500) {
        errorMessage =
          "🔧 Error del servidor: Ocurrió un problema técnico. Por favor, intente nuevamente en unos minutos.";
      } else if (error?.code === "NETWORK_ERROR" || !error?.response) {
        errorMessage =
          "🌐 Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.";
      }
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [workerId, selectedYear]);

  const generateCalendarDays = useCallback(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const calendarDays: CalendarDay[] = days.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const occupiedRequest = vacationRequests.find(
        (req) =>
          req.status === "approved" &&
          dateStr >= req.start_date &&
          dateStr <= req.end_date
      );
      const pendingRequest = vacationRequests.find(
        (req) =>
          req.status === "pending" &&
          dateStr >= req.start_date &&
          dateStr <= req.end_date
      );
      // Aplicar filtro por año: solo marcar ocupado/pendiente si la fecha del día pertenece al año seleccionado
      const dayYear = date.getFullYear();
      const isInSelectedYear = dayYear === selectedYear;
      return {
        date,
        isCurrentMonth: true,
        isToday:
          format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
        isWeekend: isWeekend(date),
        isOccupied: isInSelectedYear ? !!occupiedRequest : false,
        isPending: isInSelectedYear ? !!pendingRequest : false,
        isSelected:
          selectedRange.start && selectedRange.end
            ? date >= selectedRange.start && date <= selectedRange.end
            : false,
        occupiedBy: occupiedRequest
          ? `Worker ${occupiedRequest.worker_id}`
          : undefined,
      };
    });
    setCalendarDays(calendarDays);
  }, [currentDate, vacationRequests, selectedRange, selectedYear]);

  // Efecto para cargar datos iniciales y cuando cambie el trabajador
  useEffect(() => {
    fetchVacationData();
  }, [fetchVacationData]);

  // Efecto independiente para regenerar el calendario cuando cambien sus dependencias
  useEffect(() => {
    generateCalendarDays();
  }, [generateCalendarDays]);

  // Ajustar el mes mostrado cuando cambia el año seleccionado
  useEffect(() => {
    setCurrentDate((prev) => new Date(selectedYear, prev.getMonth(), 1));
  }, [selectedYear]);

  const handleDateClick = (date: Date) => {
    if (isWeekend(date) || date < new Date()) return;

    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date, end: null });
    } else if (selectedRange.start && !selectedRange.end) {
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start });
      } else {
        setSelectedRange({ start: selectedRange.start, end: date });
      }
    }
  };

  const handleNewRequest = () => {
    if (selectedRange.start && selectedRange.end) {
      setStartDate(selectedRange.start);
      setEndDate(selectedRange.end);
    }
    setOpenDialog(true);
  };

  const addYearsSafe = (d: Date, years: number): Date => {
    const next = new Date(d);
    next.setFullYear(d.getFullYear() + years);
    // Ajuste para 29/02 en años no bisiestos
    if (d.getMonth() === 1 && d.getDate() === 29 && next.getMonth() !== 1) {
      next.setMonth(1);
      next.setDate(28);
    }
    return next;
  };

  const getAnniversaryPeriod = (
    hireDate: Date,
    refStart: Date
  ): { start: Date; end: Date } => {
    // calcular años completos transcurridos al inicio solicitado
    let yearsSince = refStart.getFullYear() - hireDate.getFullYear();
    const refMonthDay = refStart.getMonth() * 100 + refStart.getDate();
    const hireMonthDay = hireDate.getMonth() * 100 + hireDate.getDate();
    if (refMonthDay < hireMonthDay) yearsSince -= 1;
    const periodStart = addYearsSafe(hireDate, Math.max(1, yearsSince));
    const periodEnd = addYearsSafe(periodStart, 1);
    periodEnd.setDate(periodEnd.getDate() - 1);
    return { start: periodStart, end: periodEnd };
  };

  const handleSubmitRequest = async () => {
    if (!startDate || !endDate || !comments.trim() || !workerId) {
      showSnackbar("Por favor completa todos los campos", "warning");
      return;
    }

    // Validación de periodo por aniversario
    if (!workerHireDate) {
      showSnackbar(
        "Falta la fecha de ingreso del trabajador. Actualice la ficha antes de solicitar vacaciones.",
        "error"
      );
      return;
    }
    const firstEligible = addYearsSafe(workerHireDate, 1);
    if (startDate < firstEligible) {
      showSnackbar(
        `Aún no cumple un (1) año desde el ingreso (${format(
          workerHireDate,
          "yyyy-MM-dd"
        )}). Podrá solicitar a partir de ${format(
          firstEligible,
          "yyyy-MM-dd"
        )}.`,
        "error"
      );
      return;
    }
    const period = getAnniversaryPeriod(workerHireDate, startDate);
    if (startDate < period.start || endDate > period.end) {
      showSnackbar(
        `Las fechas deben estar dentro del periodo anual por aniversario: ${format(
          period.start,
          "yyyy-MM-dd"
        )} a ${format(period.end, "yyyy-MM-dd")}.`,
        "error"
      );
      return;
    }

    const days = differenceInDays(endDate, startDate) + 1;
    const weekendDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    }).filter((date) => isWeekend(date)).length;
    const workingDays = days - weekendDays;

    if (vacationBalance && workingDays > vacationBalance.available_days) {
      showSnackbar(
        `❌ Solicitud excede días disponibles\n\n` +
          `📅 Días solicitados: ${workingDays} días hábiles\n` +
          `✅ Días disponibles: ${vacationBalance.available_days} días\n` +
          `⚠️ Exceso: ${
            workingDays - vacationBalance.available_days
          } días\n\n` +
          `Por favor, ajuste las fechas o espere a que se aprueben solicitudes pendientes.`,
        "error"
      );
      return;
    }

    try {
      setSubmitting(true);

      const requestData: VacationRequest = {
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        comments: comments,
      };

      const newRequest = await vacationService.createVacationRequest(
        parseInt(workerId),
        requestData
      );

      setVacationRequests((prev) => [...prev, newRequest]);
      setOpenDialog(false);
      setStartDate(null);
      setEndDate(null);
      setComments("");
      setSelectedRange({ start: null, end: null });

      // Actualizar balance después de crear la solicitud
      await fetchVacationData();

      showSnackbar("Solicitud de vacaciones enviada correctamente", "success");
    } catch (error: any) {
      // Mejorar el mensaje de error basado en el tipo de error
      let errorMessage = "Error al enviar la solicitud de vacaciones";

      if (error?.response?.status === 400) {
        const detail = error.response.data?.detail || "";

        if (detail.includes("días disponibles")) {
          errorMessage =
            "❌ Solicitud rechazada: No tiene suficientes días de vacaciones disponibles. Por favor, verifique su balance y ajuste las fechas solicitadas.";
        } else if (detail.includes("día laboral")) {
          errorMessage =
            "📅 Solicitud inválida: Debe incluir al menos un día laboral en el período seleccionado.";
        } else if (
          detail.includes("conflicto") ||
          detail.includes("ocupad") ||
          detail.includes("asignad") ||
          detail.includes("área")
        ) {
          errorMessage =
            "⚠️ Fechas no disponibles: Las fechas seleccionadas ya están asignadas a un trabajador de tu área. Por favor, elige un período distinto o coordina con tu equipo.";
        } else {
          errorMessage = `❌ Solicitud rechazada: ${detail}`;
        }
      } else if (error?.response?.status === 403) {
        errorMessage =
          "🔒 Sin permisos: No tiene autorización para crear solicitudes de vacaciones.";
      } else if (error?.response?.status === 404) {
        errorMessage =
          "👤 Error de usuario: No se pudo encontrar la información del trabajador.";
      } else if (error?.response?.status >= 500) {
        errorMessage =
          "🔧 Error del servidor: Ocurrió un problema técnico. Por favor, intente nuevamente en unos minutos o contacte al administrador.";
      } else if (error?.code === "NETWORK_ERROR" || !error?.response) {
        errorMessage =
          "🌐 Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet e intente nuevamente.";
      } else {
        errorMessage =
          "❌ Error inesperado: Ocurrió un problema al procesar su solicitud. Por favor, intente nuevamente o contacte al administrador.";
      }

      showSnackbar(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    if (!workerId) return;

    try {
      const approvalData: VacationApproval = {
        status: "approved",
        admin_comments: "Aprobado por administrador",
      };

      await vacationService.approveVacationRequest(
        parseInt(workerId),
        requestId,
        approvalData
      );

      // Actualizar la lista local
      setVacationRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: "approved",
                admin_comments: approvalData.admin_comments,
              }
            : req
        )
      );

      // Actualizar balance después de la aprobación
      await fetchVacationData();

      showSnackbar("Solicitud aprobada correctamente", "success");
    } catch (error: any) {
      let errorMessage = "No se pudo aprobar la solicitud de vacaciones";

      if (error?.response?.status === 404) {
        errorMessage =
          "📋 Solicitud no encontrada: La solicitud de vacaciones ya no existe o fue eliminada.";
      } else if (error?.response?.status === 403) {
        errorMessage =
          "🔒 Sin permisos: No tiene autorización para aprobar solicitudes de vacaciones.";
      } else if (error?.response?.status === 400) {
        const detail = error.response.data?.detail || "";
        if (
          detail.includes("ya aprobada") ||
          detail.includes("already approved")
        ) {
          errorMessage =
            "✅ Solicitud ya procesada: Esta solicitud ya fue aprobada anteriormente.";
        } else if (
          detail.includes("conflicto") ||
          detail.includes("conflict") ||
          detail.includes("área")
        ) {
          errorMessage =
            "⚠️ Conflicto de fechas: En tu área ya hay una persona con vacaciones en ese período.";
        } else {
          errorMessage = `❌ Error de validación: ${detail}`;
        }
      } else if (error?.response?.status >= 500) {
        errorMessage =
          "🔧 Error del servidor: No se pudo procesar la aprobación. Intente nuevamente en unos minutos.";
      } else if (error?.code === "NETWORK_ERROR" || !error?.response) {
        errorMessage =
          "🌐 Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.";
      }

      showSnackbar(errorMessage, "error");
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!workerId) return;

    try {
      const rejectionData: VacationApproval = {
        status: "rejected",
        admin_comments: "No aprobado por administración",
      };

      await vacationService.approveVacationRequest(
        parseInt(workerId),
        requestId,
        rejectionData
      );

      // Actualizar la lista local
      setVacationRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: "rejected",
                admin_comments: rejectionData.admin_comments,
              }
            : req
        )
      );

      // Actualizar balance después del rechazo
      await fetchVacationData();

      showSnackbar("Solicitud rechazada", "warning");
    } catch (error: any) {
      let errorMessage = "No se pudo rechazar la solicitud de vacaciones";

      if (error?.response?.status === 404) {
        errorMessage =
          "📋 Solicitud no encontrada: La solicitud de vacaciones ya no existe o fue eliminada.";
      } else if (error?.response?.status === 403) {
        errorMessage =
          "🔒 Sin permisos: No tiene autorización para rechazar solicitudes de vacaciones.";
      } else if (error?.response?.status === 400) {
        const detail = error.response.data?.detail || "";
        if (
          detail.includes("ya rechazada") ||
          detail.includes("already rejected")
        ) {
          errorMessage =
            "❌ Solicitud ya procesada: Esta solicitud ya fue rechazada anteriormente.";
        } else if (
          detail.includes("ya aprobada") ||
          detail.includes("already approved")
        ) {
          errorMessage =
            "✅ Solicitud ya aprobada: No se puede rechazar una solicitud que ya fue aprobada.";
        } else {
          errorMessage = `❌ Error de validación: ${detail}`;
        }
      } else if (error?.response?.status >= 500) {
        errorMessage =
          "🔧 Error del servidor: No se pudo procesar el rechazo. Intente nuevamente en unos minutos.";
      } else if (error?.code === "NETWORK_ERROR" || !error?.response) {
        errorMessage =
          "🌐 Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.";
      }

      showSnackbar(errorMessage, "error");
    }
  };

  // Nuevas funciones para edición y eliminación
  const handleEditRequest = (request: WorkerVacation) => {
    setEditingRequest(request);
    setEditStartDate(
      parseDateOnlyToLocal(request.start_date) || new Date(request.start_date)
    );
    setEditEndDate(
      parseDateOnlyToLocal(request.end_date) || new Date(request.end_date)
    );
    setEditComments(request.comments || "");
    setOpenEditDialog(true);
    handleCloseMenu();
  };

  const handleUpdateRequest = async () => {
    if (
      !editingRequest ||
      !editStartDate ||
      !editEndDate ||
      !editComments.trim() ||
      !workerId
    ) {
      showSnackbar("Por favor completa todos los campos", "warning");
      return;
    }

    try {
      setSubmitting(true);

      const updateData: VacationUpdate = {
        start_date: format(editStartDate, "yyyy-MM-dd"),
        end_date: format(editEndDate, "yyyy-MM-dd"),
        comments: editComments.trim(),
      };

      const updatedRequest = await vacationService.updateVacationRequest(
        parseInt(workerId),
        editingRequest.id,
        updateData
      );

      // Actualizar la lista local
      setVacationRequests((prev) =>
        prev.map((req) => (req.id === editingRequest.id ? updatedRequest : req))
      );

      setOpenEditDialog(false);
      setEditingRequest(null);
      setEditStartDate(null);
      setEditEndDate(null);
      setEditComments("");

      // Actualizar balance después de la edición
      await fetchVacationData();

      showSnackbar("Solicitud actualizada correctamente", "success");
    } catch (error: any) {
      let errorMessage = "No se pudo actualizar la solicitud de vacaciones";

      if (error?.response?.status === 404) {
        errorMessage =
          "📋 Solicitud no encontrada: La solicitud de vacaciones ya no existe o fue eliminada.";
      } else if (error?.response?.status === 403) {
        errorMessage =
          "🔒 Sin permisos: No tiene autorización para modificar esta solicitud de vacaciones.";
      } else if (error?.response?.status === 400) {
        const detail = error.response.data?.detail || "";
        if (
          detail.includes("ya aprobada") ||
          detail.includes("already approved")
        ) {
          errorMessage =
            "✅ Solicitud ya aprobada: No se puede modificar una solicitud que ya fue aprobada.";
        } else if (detail.includes("fechas") || detail.includes("dates")) {
          errorMessage =
            "📅 Error de fechas: Las fechas seleccionadas no son válidas o están en conflicto.";
        } else if (detail.includes("balance") || detail.includes("días")) {
          errorMessage =
            "⏰ Balance insuficiente: No tiene suficientes días de vacaciones disponibles.";
        } else {
          errorMessage = `❌ Error de validación: ${detail}`;
        }
      } else if (error?.response?.status >= 500) {
        errorMessage =
          "🔧 Error del servidor: No se pudo procesar la actualización. Intente nuevamente en unos minutos.";
      } else if (error?.code === "NETWORK_ERROR" || !error?.response) {
        errorMessage =
          "🌐 Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.";
      }

      showSnackbar(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = (request: WorkerVacation) => {
    setRequestToDelete(request);
    setDeleteConfirmOpen(true);
    handleCloseMenu();
  };

  const confirmDeleteRequest = async () => {
    if (!requestToDelete || !workerId) return;

    try {
      await vacationService.cancelVacationRequest(
        parseInt(workerId),
        requestToDelete.id
      );

      setDeleteConfirmOpen(false);
      setRequestToDelete(null);

      // Actualizar datos después de la cancelación
      await fetchVacationData();

      showSnackbar("Solicitud cancelada correctamente", "success");
    } catch (error: any) {
      let errorMessage = "Error al cancelar la solicitud";

      // Extraer mensaje específico del backend si está disponible
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showSnackbar(errorMessage, "error");
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    request: WorkerVacation
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequestForMenu(request);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedRequestForMenu(null);
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckIcon />;
      case "rejected":
        return <CloseIcon />;
      case "pending":
        return <PendingIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // Helper: una solicitud intersecta el año seleccionado si cualquier parte del rango cae en ese año
  const intersectsYear = (req: WorkerVacation, year: number): boolean => {
    const startDate =
      parseDateOnlyToLocal(req.start_date) || new Date(req.start_date);
    const endDate =
      parseDateOnlyToLocal(req.end_date) || new Date(req.end_date);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    return startYear <= year && endYear >= year;
  };

  const filteredRequests = vacationRequests
    .filter((req) => intersectsYear(req, selectedYear))
    .filter((req) => statusFilter === "all" || req.status === statusFilter);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: "bold", color: "primary.main" }}
          >
            <EventIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Gestión de Vacaciones
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewRequest}
            disabled={!vacationBalance || vacationBalance.available_days <= 0}
            sx={{ borderRadius: 2 }}
          >
            Nueva Solicitud
          </Button>
        </Box>

        {/* Balance de Vacaciones */}
        {vacationBalance && (
          <Card
            sx={{
              mb: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Balance de Vacaciones
              </Typography>
              <Box display="flex" gap={2} justifyContent="space-around">
                <Box textAlign="center" flex={1}>
                  <Typography variant="h3" fontWeight="bold">
                    {vacationBalance.total_days}
                  </Typography>
                  <Typography variant="body2">Total</Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    color="error.light"
                  >
                    {vacationBalance.used_days}
                  </Typography>
                  <Typography variant="body2">Usados</Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    color="warning.light"
                  >
                    {pendingDaysInSelectedYear}
                  </Typography>
                  <Typography variant="body2">Pendientes</Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    color="success.light"
                  >
                    {availableDaysDisplay}
                  </Typography>
                  <Typography variant="body2">Disponibles</Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h3" fontWeight="bold" color="info.light">
                    {vacationBalance.year}
                  </Typography>
                  <Typography variant="body2">Año</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box display="flex" gap={3} flexDirection={{ xs: "column", md: "row" }}>
          {/* Calendario */}
          <Box flex={{ xs: 1, md: 2 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">
                    <Calendar sx={{ mr: 1, verticalAlign: "middle" }} />
                    Calendario de Vacaciones
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {/* Selector de Año (visible para admin/supervisor y empleados, no es intrusivo) */}
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel>Año</InputLabel>
                      <Select
                        value={selectedYear}
                        label="Año"
                        onChange={(e) =>
                          setSelectedYear(Number(e.target.value))
                        }
                      >
                        {availableYears.map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      onClick={() => setCurrentDate(addDays(currentDate, -30))}
                    >
                      ‹
                    </Button>
                    <Typography variant="h6" component="span" sx={{ mx: 2 }}>
                      {format(currentDate, "MMMM yyyy", { locale: es })}
                    </Typography>
                    <Button
                      onClick={() => setCurrentDate(addDays(currentDate, 30))}
                    >
                      ›
                    </Button>
                  </Box>
                </Box>

                {/* Leyenda */}
                <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
                  <Chip
                    size="small"
                    label="Disponible"
                    sx={{ bgcolor: "success.light", color: "white" }}
                  />
                  <Chip
                    size="small"
                    label="Ocupado"
                    sx={{ bgcolor: "error.light", color: "white" }}
                  />
                  <Chip
                    size="small"
                    label="Pendiente"
                    sx={{ bgcolor: "warning.light", color: "white" }}
                  />
                  <Chip
                    size="small"
                    label="Seleccionado"
                    sx={{ bgcolor: "primary.light", color: "white" }}
                  />
                  <Chip
                    size="small"
                    label="Fin de semana"
                    sx={{ bgcolor: "grey.400", color: "white" }}
                  />
                </Box>

                {/* Grid del calendario */}
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(7, 1fr)"
                  gap={1}
                >
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
                    (day) => (
                      <Box key={day}>
                        <Typography
                          variant="body2"
                          textAlign="center"
                          fontWeight="bold"
                          color="text.secondary"
                        >
                          {day}
                        </Typography>
                      </Box>
                    )
                  )}
                  {calendarDays.map((day, index) => (
                    <Box key={index}>
                      <Paper
                        sx={{
                          p: 1,
                          textAlign: "center",
                          cursor:
                            day.isWeekend || day.date < new Date()
                              ? "not-allowed"
                              : "pointer",
                          bgcolor: day.isSelected
                            ? "primary.light"
                            : day.isOccupied
                            ? "error.light"
                            : day.isPending
                            ? "warning.light"
                            : day.isWeekend
                            ? "grey.300"
                            : "background.paper",
                          color:
                            day.isSelected || day.isOccupied || day.isPending
                              ? "white"
                              : "text.primary",
                          border: day.isToday ? "2px solid" : "1px solid",
                          borderColor: day.isToday ? "primary.main" : "divider",
                          "&:hover": {
                            bgcolor:
                              day.isWeekend || day.date < new Date()
                                ? undefined
                                : "action.hover",
                          },
                        }}
                        onClick={() => handleDateClick(day.date)}
                      >
                        <Typography variant="body2">
                          {format(day.date, "d")}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Lista de Solicitudes */}
          <Box flex={{ xs: 1, md: 1 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">
                    <ScheduleIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    Solicitudes
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Estado"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="pending">Pendientes</MenuItem>
                      <MenuItem value="approved">Aprobadas</MenuItem>
                      <MenuItem value="rejected">Rechazadas</MenuItem>
                    </Select>
                  </FormControl>
                  {/* Selector de Año también en la lista para consistencia */}
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Año</InputLabel>
                    <Select
                      value={selectedYear}
                      label="Año"
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                      {availableYears.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <List>
                  {filteredRequests.map((request, index) => (
                    <React.Fragment key={request.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Badge
                            badgeContent={request.days_requested}
                            color="primary"
                            sx={{ "& .MuiBadge-badge": { fontSize: "0.7rem" } }}
                          >
                            {getStatusIcon(request.status)}
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography variant="body2" fontWeight="bold">
                                {request.worker_name ||
                                  workerFullName ||
                                  `Trabajador #${request.worker_id}`}{" "}
                                —{" "}
                                {format(
                                  parseDateOnlyToLocal(request.start_date) ||
                                    new Date(request.start_date),
                                  "dd/MM"
                                )}{" "}
                                -{" "}
                                {format(
                                  parseDateOnlyToLocal(request.end_date) ||
                                    new Date(request.end_date),
                                  "dd/MM"
                                )}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Chip
                                  size="small"
                                  label={request.status}
                                  color={getStatusColor(request.status) as any}
                                  variant="outlined"
                                />
                                {isAdmin && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleMenuClick(e, request)}
                                  >
                                    <MoreVertIcon />
                                  </IconButton>
                                )}
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <strong>Motivo:</strong> {request.comments}
                              </Typography>
                              {isAdmin && request.status === "pending" && (
                                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() =>
                                      handleApproveRequest(request.id)
                                    }
                                  >
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() =>
                                      handleRejectRequest(request.id)
                                    }
                                  >
                                    Rechazar
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < filteredRequests.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {filteredRequests.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No hay solicitudes"
                        secondary="No se encontraron solicitudes con los filtros aplicados"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Menú de acciones para administradores */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
        >
          <MenuItem
            onClick={() =>
              selectedRequestForMenu &&
              handleEditRequest(selectedRequestForMenu)
            }
          >
            <EditIcon sx={{ mr: 1 }} />
            Editar
          </MenuItem>
          <MenuItem
            onClick={() =>
              selectedRequestForMenu &&
              handleDeleteRequest(selectedRequestForMenu)
            }
            disabled={
              !selectedRequestForMenu ||
              !["pending", "approved"].includes(selectedRequestForMenu.status)
            }
            sx={{
              color:
                selectedRequestForMenu &&
                ["pending", "approved"].includes(selectedRequestForMenu.status)
                  ? "error.main"
                  : "text.disabled",
            }}
          >
            <DeleteIcon
              sx={{
                mr: 1,
                color:
                  selectedRequestForMenu &&
                  ["pending", "approved"].includes(
                    selectedRequestForMenu.status
                  )
                    ? "error.main"
                    : "text.disabled",
              }}
            />
            {selectedRequestForMenu &&
            ["pending", "approved"].includes(selectedRequestForMenu.status)
              ? "Cancelar"
              : "No se puede cancelar"}
          </MenuItem>
        </Menu>

        {/* Diálogo de nueva solicitud */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography
              variant="h6"
              component="div"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <AddIcon sx={{ mr: 1 }} />
              Nueva Solicitud de Vacaciones
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Box flex={1}>
                  <DatePicker
                    label="Fecha de inicio"
                    value={startDate}
                    onChange={setStartDate}
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Box>
                <Box flex={1}>
                  <DatePicker
                    label="Fecha de fin"
                    value={endDate}
                    onChange={setEndDate}
                    minDate={startDate || new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Box>
              </Box>
              <TextField
                fullWidth
                label="Motivo de la solicitud"
                multiline
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Describe el motivo de tu solicitud de vacaciones..."
              />
              {startDate && endDate && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Días solicitados: {differenceInDays(endDate, startDate) + 1}
                    (excluyendo fines de semana:{" "}
                    {differenceInDays(endDate, startDate) +
                      1 -
                      eachDayOfInterval({
                        start: startDate,
                        end: endDate,
                      }).filter((date) => isWeekend(date)).length}
                    )
                  </Typography>
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmitRequest}
              variant="contained"
              disabled={
                submitting || !startDate || !endDate || !comments.trim()
              }
            >
              {submitting ? <CircularProgress size={20} /> : "Enviar Solicitud"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de edición */}
        <Dialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography
              variant="h6"
              component="div"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <EditIcon sx={{ mr: 1 }} />
              Editar Solicitud de Vacaciones
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Box flex={1}>
                  <DatePicker
                    label="Fecha de inicio"
                    value={editStartDate}
                    onChange={setEditStartDate}
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Box>
                <Box flex={1}>
                  <DatePicker
                    label="Fecha de fin"
                    value={editEndDate}
                    onChange={setEditEndDate}
                    minDate={editStartDate || new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Box>
              </Box>
              <TextField
                fullWidth
                label="Motivo de la solicitud"
                multiline
                rows={3}
                value={editComments}
                onChange={(e) => setEditComments(e.target.value)}
                placeholder="Describe el motivo de tu solicitud de vacaciones..."
              />
              {editStartDate && editEndDate && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Días solicitados:{" "}
                    {differenceInDays(editEndDate, editStartDate) + 1}
                    (excluyendo fines de semana:{" "}
                    {differenceInDays(editEndDate, editStartDate) +
                      1 -
                      eachDayOfInterval({
                        start: editStartDate,
                        end: editEndDate,
                      }).filter((date) => isWeekend(date)).length}
                    )
                  </Typography>
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleUpdateRequest}
              variant="contained"
              disabled={
                submitting ||
                !editStartDate ||
                !editEndDate ||
                !editComments.trim()
              }
            >
              {submitting ? (
                <CircularProgress size={20} />
              ) : (
                "Actualizar Solicitud"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmación de cancelación */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>
            <Typography
              variant="h6"
              component="div"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <DeleteIcon sx={{ mr: 1, color: "error.main" }} />
              Confirmar Cancelación
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas cancelar esta solicitud de vacaciones?
            </Typography>
            {requestToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  Fechas:{" "}
                  {format(
                    parseDateOnlyToLocal(requestToDelete.start_date) ||
                      new Date(requestToDelete.start_date),
                    "dd/MM/yyyy"
                  )}{" "}
                  -{" "}
                  {format(
                    parseDateOnlyToLocal(requestToDelete.end_date) ||
                      new Date(requestToDelete.end_date),
                    "dd/MM/yyyy"
                  )}
                </Typography>
                <Typography variant="body2">
                  Motivo: {requestToDelete.comments}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Estado:{" "}
                  {requestToDelete.status === "pending"
                    ? "Pendiente"
                    : requestToDelete.status === "approved"
                    ? "Aprobada"
                    : requestToDelete.status === "rejected"
                    ? "Rechazada"
                    : "Cancelada"}
                </Typography>
              </Box>
            )}

            {/* Información sobre qué solicitudes se pueden cancelar */}
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>Nota:</strong> Solo se pueden cancelar solicitudes que
                estén en estado "Pendiente" o "Aprobada".
              </Typography>
            </Alert>

            <Alert severity="warning" sx={{ mt: 2 }}>
              La solicitud será marcada como cancelada y no se podrá revertir.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>
              No cancelar
            </Button>
            <Button
              onClick={confirmDeleteRequest}
              variant="contained"
              color="error"
            >
              Cancelar solicitud
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default WorkerVacations;
