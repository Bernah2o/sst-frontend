import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "../contexts/AuthContext";
import { formatDateTime } from "../utils/dateUtils";
import api from "../services/api";

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  table_name: string;
  record_id: number;
  old_values?: any;
  new_values?: any;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

const Audit: React.FC = () => {
  useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    table_name: "",
    start_date: null as Date | null,
    end_date: null as Date | null,
    search: "",
  });

  const actionTypes = [
    { value: "CREATE", label: "Crear", color: "success" },
    { value: "UPDATE", label: "Actualizar", color: "warning" },
    { value: "DELETE", label: "Eliminar", color: "error" },
    { value: "LOGIN", label: "Inicio de Sesión", color: "info" },
    { value: "LOGOUT", label: "Cierre de Sesión", color: "default" },
  ];

  const fetchAuditLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");

      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.action) params.append("action", filters.action);
      if (filters.table_name) params.append("table_name", filters.table_name);
      if (filters.start_date)
        params.append("start_date", filters.start_date.toISOString());
      if (filters.end_date)
        params.append("end_date", filters.end_date.toISOString());
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/audit/?${params.toString()}`);
      setAuditLogs(response.data.items || []);
      // Use the 'pages' field directly from API response instead of calculating
      setTotalPages(
        response.data.pages || Math.ceil((response.data.total || 0) / 20)
      );
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchAuditLogs();
  }, [page, filters, fetchAuditLogs]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      user_id: "",
      action: "",
      table_name: "",
      start_date: null,
      end_date: null,
      search: "",
    });
    setPage(1);
  };

  const getActionChip = (action: string) => {
    const actionType = actionTypes.find((type) => type.value === action);
    return (
      <Chip
        label={actionType?.label || action}
        color={(actionType?.color as any) || "default"}
        size="small"
      />
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Auditoría del Sistema
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Registro de todas las acciones realizadas en el sistema
        </Typography>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Buscar"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Usuario, tabla, IP..."
                  InputProps={{
                    startAdornment: (
                      <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Acción</InputLabel>
                  <Select
                    value={filters.action}
                    onChange={(e) =>
                      handleFilterChange("action", e.target.value)
                    }
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {actionTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Tabla"
                  value={filters.table_name}
                  onChange={(e) =>
                    handleFilterChange("table_name", e.target.value)
                  }
                  placeholder="Nombre de tabla"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <DatePicker
                  label="Fecha Inicio"
                  value={filters.start_date}
                  onChange={(date) => handleFilterChange("start_date", date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <DatePicker
                  label="Fecha Fin"
                  value={filters.end_date}
                  onChange={(date) => handleFilterChange("end_date", date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <Box display="flex" gap={1}>
                  <Tooltip title="Actualizar">
                    <IconButton onClick={fetchAuditLogs}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Limpiar filtros">
                    <IconButton onClick={handleClearFilters}>
                      <FilterIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de Logs */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha/Hora</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Acción</TableCell>
                    <TableCell>Tabla</TableCell>
                    <TableCell>Registro ID</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Detalles</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Cargando logs de auditoría...
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No se encontraron logs de auditoría
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDateTime(log.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.user_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {log.user_id}
                          </Typography>
                        </TableCell>
                        <TableCell>{getActionChip(log.action)}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {log.table_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.record_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {log.ip_address}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const details = {
                                  user_agent: log.user_agent,
                                  old_values: log.old_values,
                                  new_values: log.new_values,
                                };
                                alert(JSON.stringify(details, null, 2));
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default Audit;
