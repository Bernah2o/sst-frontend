import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  BeachAccess,
  Add,
  CalendarToday,
  CheckCircle,
  Pending,
  Cancel,
  Event,
  Warning,
  DateRange,
  Refresh,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { format, isWeekend, eachDayOfInterval } from "date-fns";
import { parseDateOnlyToLocal } from "../utils/dateUtils";

import vacationService from "../services/vacationService";
import type {
  WorkerVacation,
  VacationBalance,
  VacationAvailability,
  OccupiedDatesResponse,
} from "../services/vacationService";

interface Notification {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

const EmployeeVacations: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Estados
  const [vacationRequests, setVacationRequests] = useState<WorkerVacation[]>(
    []
  );
  const [vacationBalance, setVacationBalance] =
    useState<VacationBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: "",
    severity: "info",
  });

  // Estados del formulario
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estados para diálogo de conflictos
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{
    conflicts: Array<{
      worker_name: string;
      start_date: string;
      end_date: string;
    }>;
    requestedDates: {
      start: string;
      end: string;
    };
  } | null>(null);

  // Estados para el calendario de disponibilidad
  const [showCalendar, setShowCalendar] = useState(false);
  const [occupiedDates, setOccupiedDates] =
    useState<OccupiedDatesResponse | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Años disponibles en base a las solicitudes y el año actual
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    const nowYear = new Date().getFullYear();
    yearsSet.add(nowYear);
    yearsSet.add(nowYear - 1);
    yearsSet.add(nowYear + 1);
    vacationRequests.forEach((req) => {
      const s =
        parseDateOnlyToLocal(req.start_date) || new Date(req.start_date);
      const e = parseDateOnlyToLocal(req.end_date) || new Date(req.end_date);
      yearsSet.add(s.getFullYear());
      yearsSet.add(e.getFullYear());
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [vacationRequests]);

  // Cálculo local de días pendientes por año seleccionado
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

  // Cargar datos al montar el componente
  const fetchVacationData = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);

        // Intentar cargar las solicitudes de vacaciones primero
        let requests: WorkerVacation[] = [];
        let balance: VacationBalance | null = null;

        try {
          requests = await vacationService.getEmployeeVacationRequests();
          setVacationRequests(requests);
        } catch (requestError: any) {
          console.error("Error fetching vacation requests:", requestError);
          // Si falla cargar las solicitudes, mostrar mensaje específico pero continuar
          showNotification(
            "📋 No se pudieron cargar las solicitudes de vacaciones. Puede continuar usando otras funciones.",
            "warning"
          );
        }

        // Intentar cargar el balance de vacaciones
        try {
          balance = await vacationService.getEmployeeVacationBalance(
            selectedYear
          );
          setVacationBalance(balance);
        } catch (balanceError: any) {
          console.error("Error fetching vacation balance:", balanceError);

          // Analizar el tipo de error para mostrar un mensaje más específico
          let errorMessage = "⚠️ No se pudo cargar el balance de vacaciones.";

          if (balanceError?.response?.status === 500) {
            // Error del servidor - probablemente problema de base de datos
            const errorDetail = balanceError?.response?.data?.detail || "";
            if (
              errorDetail.includes("pending_days") ||
              errorDetail.includes("column") ||
              errorDetail.includes("does not exist")
            ) {
              errorMessage =
                "🔧 El sistema de vacaciones está siendo actualizado. Algunas funciones pueden estar temporalmente limitadas. Las solicitudes de vacaciones siguen funcionando normalmente.";
            } else {
              errorMessage =
                "🔧 Error técnico temporal en el balance de vacaciones. Por favor, intente nuevamente en unos minutos.";
            }
          } else if (balanceError?.response?.status === 404) {
            errorMessage =
              "📊 No se encontró información de balance de vacaciones. Contacte a recursos humanos para configurar su información.";
          } else if (balanceError?.response?.status === 403) {
            errorMessage =
              "🔒 No tiene permisos para ver el balance de vacaciones. Contacte al administrador.";
          } else if (balanceError?.response?.status === 401) {
            errorMessage =
              "🔐 Su sesión ha expirado. Por favor, inicie sesión nuevamente.";
          } else if (!balanceError?.response) {
            errorMessage =
              "🌐 Error de conexión. Verifique su conexión a internet e intente nuevamente.";
          }

          showNotification(errorMessage, "warning");

          // Establecer un balance por defecto para que la interfaz siga funcionando
          setVacationBalance({
            worker_id: 0,
            total_days: 0,
            used_days: 0,
            pending_days: 0,
            available_days: 0,
            year: selectedYear,
          });
        }
      } catch (error: any) {
        console.error("Error fetching vacation data:", error);
        showNotification(
          "🔄 Error general al cargar los datos de vacaciones. Por favor, recargue la página.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedYear]
  );

  useEffect(() => {
    fetchVacationData();
  }, [fetchVacationData]);

  const calculateBusinessDays = (
    start: Date | null,
    end: Date | null
  ): number => {
    if (!start || !end) return 0;
    try {
      const days = eachDayOfInterval({ start, end });
      return days.filter((day) => !isWeekend(day)).length;
    } catch (error) {
      return 0;
    }
  };

  const loadOccupiedDates = async (startDate: Date, endDate: Date) => {
    try {
      setCalendarLoading(true);
      // Obtener el trabajador actual para filtrar por su área
      const currentWorker = await vacationService.getCurrentWorker();
      const response = await vacationService.getFilteredOccupiedDates(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
        currentWorker?.id
      );
      setOccupiedDates(response);
    } catch (error) {
      console.error("Error loading occupied dates:", error);
      showNotification(
        "📅 No se pudo cargar el calendario de disponibilidad. Puede continuar con su solicitud, pero recomendamos verificar las fechas disponibles más tarde.",
        "warning"
      );
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setStartDate(null);
    setEndDate(null);
    setComments("");
    setShowCalendar(false);
    setOccupiedDates(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setStartDate(null);
    setEndDate(null);
    setComments("");
    setShowCalendar(false);
    setOccupiedDates(null);
  };

  const handleShowCalendar = async () => {
    const today = new Date();
    const nextYear = new Date(
      today.getFullYear() + 1,
      today.getMonth(),
      today.getDate()
    );

    setShowCalendar(true);
    await loadOccupiedDates(today, nextYear);
  };

  const handleSubmitRequest = async () => {
    if (!startDate || !endDate || !comments.trim()) {
      showNotification("Por favor complete todos los campos", "warning");
      return;
    }

    if (startDate >= endDate) {
      showNotification(
        "La fecha de fin debe ser posterior a la fecha de inicio",
        "warning"
      );
      return;
    }

    const workingDays = calculateBusinessDays(startDate, endDate);

    if (vacationBalance && workingDays > vacationBalance.available_days) {
      showNotification(
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

    // Helpers de validación por aniversario
    const addYearsSafe = (d: Date, years: number): Date => {
      const next = new Date(d);
      next.setFullYear(d.getFullYear() + years);
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
      let yearsSince = refStart.getFullYear() - hireDate.getFullYear();
      const refMonthDay = refStart.getMonth() * 100 + refStart.getDate();
      const hireMonthDay = hireDate.getMonth() * 100 + hireDate.getDate();
      if (refMonthDay < hireMonthDay) yearsSince -= 1;
      const periodStart = addYearsSafe(hireDate, Math.max(1, yearsSince));
      const periodEnd = addYearsSafe(periodStart, 1);
      periodEnd.setDate(periodEnd.getDate() - 1);
      return { start: periodStart, end: periodEnd };
    };

    try {
      setSubmitting(true);

      // Verificar disponibilidad de fechas
      const currentWorker = await vacationService.getCurrentWorker();

      // Validación por aniversario con la fecha de ingreso del trabajador
      if (!currentWorker?.fecha_de_ingreso) {
        showNotification(
          "Falta la fecha de ingreso del trabajador. Actualice su ficha antes de solicitar vacaciones.",
          "error"
        );
        setSubmitting(false);
        return;
      }
      const hireDate = new Date(currentWorker.fecha_de_ingreso);
      const firstEligible = addYearsSafe(hireDate, 1);
      if (startDate < firstEligible) {
        showNotification(
          `Aún no cumple un (1) año desde el ingreso (${format(
            hireDate,
            "yyyy-MM-dd"
          )}). Podrá solicitar a partir de ${format(
            firstEligible,
            "yyyy-MM-dd"
          )}.`,
          "error"
        );
        setSubmitting(false);
        return;
      }
      const period = getAnniversaryPeriod(hireDate, startDate);
      if (startDate < period.start || endDate > period.end) {
        showNotification(
          `Las fechas deben estar dentro del periodo anual por aniversario: ${format(
            period.start,
            "yyyy-MM-dd"
          )} a ${format(period.end, "yyyy-MM-dd")}.`,
          "error"
        );
        setSubmitting(false);
        return;
      }
      const availability: VacationAvailability =
        await vacationService.checkAvailability(
          currentWorker.id,
          format(startDate, "yyyy-MM-dd"),
          format(endDate, "yyyy-MM-dd")
        );

      if (!availability.is_available) {
        // Configurar datos del conflicto para el diálogo
        setConflictData({
          conflicts: availability.conflicts,
          requestedDates: {
            start: format(startDate, "yyyy-MM-dd"),
            end: format(endDate, "yyyy-MM-dd"),
          },
        });

        // Mostrar diálogo de conflictos
        setConflictDialogOpen(true);
        return;
      }

      await vacationService.createEmployeeVacationRequest({
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        working_days: workingDays,
        comments: comments.trim(),
      });

      showNotification(
        "Solicitud de vacaciones enviada exitosamente",
        "success"
      );
      handleCloseDialog();
      fetchVacationData(true); // Recargar datos forzando actualización
    } catch (error: any) {
      console.error("Error creating vacation request:", error);

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
          detail.includes("asignad")
        ) {
          errorMessage =
            "⚠️ Fechas no disponibles: Las fechas seleccionadas ya están asignadas a otro trabajador. Por favor, seleccione fechas diferentes.";
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

      showNotification(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const showNotification = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => {
    setNotification({
      open: true,
      message,
      severity,
    });
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
        return <CheckCircle />;
      case "rejected":
        return <Cancel />;
      case "pending":
        return <Pending />;
      default:
        return <Event />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobada";
      case "rejected":
        return "Rechazada";
      case "pending":
        return "Pendiente";
      default:
        return status;
    }
  };

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
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <BeachAccess sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
            Mis Vacaciones
          </Typography>
        </Box>

        {/* Balance de Vacaciones */}
        {vacationBalance ? (
          <Card
            sx={{
              mb: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CalendarToday />
                  Balance de Vacaciones {vacationBalance.year}
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel
                    id="employee-year-select-label"
                    sx={{ color: "white" }}
                  >
                    Año
                  </InputLabel>
                  <Select
                    labelId="employee-year-select-label"
                    value={selectedYear}
                    label="Año"
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    sx={{
                      color: "white",
                      ".MuiSvgIcon-root": { color: "white" },
                    }}
                  >
                    {availableYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h3"
                      sx={{ color: "white", fontWeight: "bold" }}
                    >
                      {vacationBalance.total_days}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      Días Totales
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h3"
                      sx={{ color: "white", fontWeight: "bold" }}
                    >
                      {vacationBalance.used_days}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      Días Utilizados
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h3"
                      sx={{ color: "white", fontWeight: "bold" }}
                    >
                      {pendingDaysInSelectedYear}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      Días Pendientes
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h3"
                      sx={{ color: "white", fontWeight: "bold" }}
                    >
                      {availableDaysDisplay}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      Días Disponibles
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Alert
                severity="info"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  "& .MuiAlert-message": {
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  },
                }}
              >
                <CalendarToday sx={{ mr: 1 }} />
                <Box>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: "medium", mb: 0.5 }}
                  >
                    Balance de vacaciones temporalmente no disponible
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Puede continuar creando solicitudes de vacaciones. El
                    sistema calculará automáticamente los días disponibles al
                    procesar su solicitud.
                  </Typography>
                </Box>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Botones de Acción */}
        <Box
          sx={{ mb: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchVacationData(true)}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            sx={{
              background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
              boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
            }}
          >
            Nueva Solicitud
          </Button>
        </Box>

        {/* Tabla de Solicitudes */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Historial de Solicitudes
            </Typography>
            {vacationRequests.length === 0 ? (
              <Alert
                severity="info"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  "& .MuiAlert-message": {
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  },
                }}
              >
                <BeachAccess sx={{ mr: 1 }} />
                ¡Aún no has solicitado vacaciones! Cuando tengas días
                disponibles, puedes crear tu primera solicitud usando el botón
                "Nueva Solicitud".
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha Inicio</TableCell>
                      <TableCell>Fecha Fin</TableCell>
                      <TableCell>Días Hábiles</TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha Solicitud</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vacationRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {format(
                            parseDateOnlyToLocal(request.start_date) ||
                              new Date(request.start_date),
                            "dd/MM/yyyy"
                          )}
                        </TableCell>
                        <TableCell>
                          {format(
                            parseDateOnlyToLocal(request.end_date) ||
                              new Date(request.end_date),
                            "dd/MM/yyyy"
                          )}
                        </TableCell>
                        <TableCell>
                          {calculateBusinessDays(
                            parseDateOnlyToLocal(request.start_date) ||
                              new Date(request.start_date),
                            parseDateOnlyToLocal(request.end_date) ||
                              new Date(request.end_date)
                          )}
                        </TableCell>
                        <TableCell>{request.comments}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(request.status)}
                            label={getStatusText(request.status)}
                            color={getStatusColor(request.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(request.created_at),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Dialog Nueva Solicitud */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Nueva Solicitud de Vacaciones</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* Botón para mostrar calendario */}
              <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
                <Button
                  variant="outlined"
                  startIcon={<CalendarToday />}
                  onClick={handleShowCalendar}
                  disabled={calendarLoading}
                  sx={{ mb: 2 }}
                >
                  {calendarLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Ver Fechas Disponibles"
                  )}
                </Button>
              </Box>

              {/* Calendario de disponibilidad */}
              {showCalendar && occupiedDates && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <CalendarToday color="primary" />
                    Calendario de Disponibilidad
                  </Typography>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Información:</strong> Se muestran únicamente las
                      fechas ocupadas por solicitudes de vacaciones aprobadas y
                      pendientes. Las solicitudes rechazadas o canceladas no
                      bloquean fechas. Las fechas no mostradas están disponibles
                      para solicitar.
                    </Typography>
                  </Alert>

                  <Paper sx={{ p: 2, maxHeight: 300, overflow: "auto" }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Fechas Ocupadas ({occupiedDates.total_occupied_days}{" "}
                      días):
                    </Typography>

                    {occupiedDates.occupied_dates.length === 0 ? (
                      <Alert severity="success">
                        ¡Excelente! No hay fechas ocupadas en el año. Todas las
                        fechas están disponibles.
                      </Alert>
                    ) : (
                      <Box>
                        {/* Agrupar fechas por períodos sin mostrar información personal */}
                        {Object.entries(
                          occupiedDates.occupied_dates.reduce((acc, date) => {
                            const key = `${date.start_date}-${date.end_date}`;
                            if (!acc[key]) {
                              acc[key] = {
                                start_date: date.start_date,
                                end_date: date.end_date,
                                dates: [],
                              };
                            }
                            acc[key].dates.push(date.date);
                            return acc;
                          }, {} as any)
                        ).map(([key, period]: [string, any]) => (
                          <Paper
                            key={key}
                            sx={{
                              p: 2,
                              mb: 1,
                              backgroundColor: "warning.lighter",
                              border: "1px solid",
                              borderColor: "warning.light",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "medium",
                                color: "warning.dark",
                              }}
                            >
                              <CalendarToday
                                sx={{
                                  fontSize: 16,
                                  mr: 1,
                                  verticalAlign: "middle",
                                }}
                              />
                              Período Ocupado
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Fechas:</strong>{" "}
                              {format(
                                parseDateOnlyToLocal(period.start_date) ||
                                  new Date(period.start_date),
                                "dd/MM/yyyy"
                              )}{" "}
                              -{" "}
                              {format(
                                parseDateOnlyToLocal(period.end_date) ||
                                  new Date(period.end_date),
                                "dd/MM/yyyy"
                              )}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Días no disponibles:</strong>{" "}
                              {period.dates.length}
                            </Typography>
                          </Paper>
                        ))}

                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Nota:</strong> Por políticas de privacidad,
                            no se muestra información personal de otros
                            empleados. Solo se indican las fechas que ya están
                            ocupadas.
                          </Typography>
                        </Alert>
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Fecha de Inicio"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                    minDate={new Date()}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Fecha de Fin"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                    minDate={startDate || new Date()}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Motivo de la Solicitud"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    required
                    placeholder="Describe el motivo de tu solicitud de vacaciones..."
                  />
                </Grid>
                {startDate && endDate && (
                  <Grid size={{ xs: 12 }}>
                    {(() => {
                      const requestedDays = calculateBusinessDays(
                        startDate,
                        endDate
                      );
                      const availableDays =
                        vacationBalance?.available_days || 0;
                      const isExceeding = requestedDays > availableDays;
                      const excess = requestedDays - availableDays;

                      return (
                        <Alert
                          severity={isExceeding ? "error" : "info"}
                          sx={{
                            "& .MuiAlert-message": {
                              width: "100%",
                            },
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "medium", mb: 1 }}
                            >
                              📊 Resumen de Solicitud
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 1,
                              }}
                            >
                              <span>📅 Días hábiles solicitados:</span>
                              <strong>{requestedDays} días</strong>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 1,
                              }}
                            >
                              <span>✅ Días disponibles:</span>
                              <strong>{availableDays} días</strong>
                            </Box>
                            {isExceeding && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  mb: 1,
                                }}
                              >
                                <span>⚠️ Exceso:</span>
                                <strong style={{ color: "error.main" }}>
                                  {excess} días
                                </strong>
                              </Box>
                            )}
                            <Box
                              sx={{
                                mt: 2,
                                pt: 1,
                                borderTop: "1px solid",
                                borderColor: "divider",
                              }}
                            >
                              {isExceeding ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "error.main",
                                    fontWeight: "medium",
                                  }}
                                >
                                  ❌ No se puede enviar esta solicitud. Reduce
                                  los días o espera a que se aprueben
                                  solicitudes pendientes.
                                </Typography>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "success.main",
                                    fontWeight: "medium",
                                  }}
                                >
                                  ✅ Solicitud válida. Puedes enviarla.
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Alert>
                      );
                    })()}
                  </Grid>
                )}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleSubmitRequest}
              variant="contained"
              disabled={
                submitting ||
                !startDate ||
                !endDate ||
                !comments.trim() ||
                Boolean(
                  startDate &&
                    endDate &&
                    vacationBalance &&
                    (calculateBusinessDays(startDate, endDate) || 0) >
                      vacationBalance.available_days
                )
              }
            >
              {submitting ? <CircularProgress size={20} /> : "Enviar Solicitud"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Conflictos de Fechas */}
        <Dialog
          open={conflictDialogOpen}
          onClose={() => setConflictDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              backgroundColor: "warning.light",
              color: "warning.contrastText",
            }}
          >
            <Warning />
            Conflicto de Fechas Detectado
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {conflictData && (
              <Box>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: "medium", mb: 1 }}
                  >
                    Las fechas que has seleccionado no están disponibles debido
                    a conflictos con otras solicitudes de vacaciones activas
                    (aprobadas o pendientes).
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, fontStyle: "italic" }}
                  >
                    Nota: Las solicitudes canceladas o rechazadas no bloquean
                    las fechas.
                  </Typography>
                </Alert>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <DateRange color="primary" />
                    Fechas Solicitadas
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: "grey.50" }}>
                    <Typography variant="body1">
                      <strong>Desde:</strong>{" "}
                      {format(
                        parseDateOnlyToLocal(
                          conflictData.requestedDates.start
                        ) || new Date(conflictData.requestedDates.start),
                        "dd/MM/yyyy"
                      )}{" "}
                      <strong>Hasta:</strong>{" "}
                      {format(
                        parseDateOnlyToLocal(conflictData.requestedDates.end) ||
                          new Date(conflictData.requestedDates.end),
                        "dd/MM/yyyy"
                      )}
                    </Typography>
                  </Paper>
                </Box>

                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Warning color="error" />
                    Fechas No Disponibles
                  </Typography>
                  {conflictData.conflicts.map((conflict, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: "1px solid",
                        borderColor: "error.light",
                        backgroundColor: "error.lighter",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="error.main"
                        sx={{ fontWeight: "medium", mb: 1 }}
                      >
                        <CalendarToday
                          sx={{ fontSize: 16, mr: 1, verticalAlign: "middle" }}
                        />
                        Período Ocupado #{index + 1}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Fechas:</strong>{" "}
                        {format(
                          parseDateOnlyToLocal(conflict.start_date) ||
                            new Date(conflict.start_date),
                          "dd/MM/yyyy"
                        )}{" "}
                        -{" "}
                        {format(
                          parseDateOnlyToLocal(conflict.end_date) ||
                            new Date(conflict.end_date),
                          "dd/MM/yyyy"
                        )}
                      </Typography>
                    </Paper>
                  ))}

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Privacidad:</strong> Por políticas de
                      confidencialidad, no se muestra información personal de
                      otros empleados.
                    </Typography>
                  </Alert>
                </Box>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Sugerencia:</strong> Por favor, selecciona fechas
                    diferentes que no se solapen con las solicitudes existentes.
                    Puedes consultar con tu supervisor o recursos humanos para
                    conocer la disponibilidad de fechas.
                  </Typography>
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setConflictDialogOpen(false)}
              variant="contained"
              color="primary"
              fullWidth={isMobile}
            >
              Entendido
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notificaciones */}
        {notification && (
          <Snackbar
            open={notification.open}
            autoHideDuration={6000}
            onClose={() => setNotification({ ...notification, open: false })}
          >
            <Alert
              onClose={() => setNotification({ ...notification, open: false })}
              severity={notification.severity}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default EmployeeVacations;
