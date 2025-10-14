import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Alert,
  Snackbar,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import React, { useState, useEffect } from "react";

import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { formatDateTime } from "../utils/dateUtils";
import { AuditAction } from "../types";

interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: number;
  resource_name?: string;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  details?: string;
  success: string;
  error_message?: string;
  duration_ms?: number;
  created_at: string;
}

interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const Audit: React.FC = () => {
  useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableResourceTypes, setAvailableResourceTypes] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    resource_type: "",
    start_date: null as Date | null,
    end_date: null as Date | null,
    search: "",
  });

  const actionTypes = [
    { value: "create", label: "Crear", color: "success" },
    { value: "read", label: "Leer", color: "info" },
    { value: "update", label: "Actualizar", color: "warning" },
    { value: "delete", label: "Eliminar", color: "error" },
    { value: "login", label: "Inicio de Sesión", color: "info" },
    { value: "logout", label: "Cierre de Sesión", color: "default" },
    { value: "export", label: "Exportar", color: "primary" },
    { value: "import", label: "Importar", color: "primary" },
    { value: "download", label: "Descargar", color: "secondary" },
    { value: "upload", label: "Subir", color: "secondary" },
    { value: "approve", label: "Aprobar", color: "success" },
    { value: "reject", label: "Rechazar", color: "error" },
    { value: "submit", label: "Enviar", color: "info" },
    { value: "complete", label: "Completar", color: "success" },
    { value: "cancel", label: "Cancelar", color: "warning" },
  ];

  const fetchAuditLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");

      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.action) params.append("action", filters.action);
      if (filters.resource_type) params.append("resource_type", filters.resource_type);
      if (filters.start_date)
        params.append("start_date", filters.start_date.toISOString().split('T')[0]);
      if (filters.end_date)
        params.append("end_date", filters.end_date.toISOString().split('T')[0]);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/audit/?${params.toString()}`);
      const data: AuditLogListResponse = response.data;
      
      setAuditLogs(data.items || []);
      setTotalPages(data.total_pages || Math.ceil((data.total || 0) / 20));
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      setError(error.response?.data?.detail || "Error al cargar los logs de auditoría");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchAuditLogs();
    fetchAvailableFilters();
  }, [page, filters, fetchAuditLogs]);

  const fetchAvailableFilters = async () => {
    try {
      const [actionsResponse, resourceTypesResponse] = await Promise.all([
        api.get('/audit/actions/list'),
        api.get('/audit/resources/list')
      ]);
      setAvailableActions(actionsResponse.data.actions || []);
      setAvailableResourceTypes(resourceTypesResponse.data.resource_types || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      user_id: "",
      action: "",
      resource_type: "",
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
        label={actionType?.label || action || 'Sin acción'}
        color={(actionType?.color as any) || "default"}
        size="small"
      />
    );
  };

  const handleShowDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedLog(null);
  };

  const parseJsonSafely = (jsonString: string | undefined) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  };

  const handleCloseError = () => {
    setError(null);
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

        {/* Error Snackbar */}
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box sx={{ minWidth: { xs: '100%', md: '250px' }, flex: { md: '1 1 250px' } }}>
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
              </Box>
              <Box sx={{ minWidth: { xs: '100%', md: '150px' }, flex: { md: '1 1 150px' } }}>
                <FormControl fullWidth>
                  <InputLabel>Acción</InputLabel>
                  <Select
                    value={filters.action}
                    onChange={(e) =>
                      handleFilterChange("action", e.target.value)
                    }
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {availableActions.map((action) => {
                      const actionType = actionTypes.find(type => type.value === action);
                      return (
                        <MenuItem key={action} value={action}>
                          {actionType?.label || action}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ minWidth: { xs: '100%', md: '150px' }, flex: { md: '1 1 150px' } }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Recurso</InputLabel>
                  <Select
                    value={filters.resource_type}
                    onChange={(e) =>
                      handleFilterChange("resource_type", e.target.value)
                    }
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {availableResourceTypes.map((resourceType) => (
                      <MenuItem key={resourceType} value={resourceType}>
                        {resourceType}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ minWidth: { xs: '100%', md: '150px' }, flex: { md: '1 1 150px' } }}>
                <DatePicker
                  label="Fecha Inicio"
                  value={filters.start_date}
                  onChange={(date) => handleFilterChange("start_date", date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
              <Box sx={{ minWidth: { xs: '100%', md: '150px' }, flex: { md: '1 1 150px' } }}>
                <DatePicker
                  label="Fecha Fin"
                  value={filters.end_date}
                  onChange={(date) => handleFilterChange("end_date", date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
              <Box sx={{ minWidth: { xs: '100%', md: 'auto' } }}>
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
              </Box>
            </Box>
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
                    <TableCell>Recurso</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Detalles</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Cargando logs de auditoría...
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No se encontraron logs de auditoría
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDateTime(log.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.user_name || 'Sistema'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.user_email || (log.user_id ? `ID: ${log.user_id}` : 'Sistema')}
                          </Typography>
                        </TableCell>
                        <TableCell>{getActionChip(log.action)}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {log.resource_type}
                          </Typography>
                          {log.resource_id && (
                            <Typography variant="caption" color="text.secondary">
                              ID: {log.resource_id}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.resource_name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.success === 'true' ? 'Éxito' : log.success === 'false' ? 'Error' : 'Parcial'}
                            color={log.success === 'true' ? 'success' : log.success === 'false' ? 'error' : 'warning'}
                            size="small"
                          />
                          {log.duration_ms && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {log.duration_ms}ms
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {log.ip_address || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleShowDetails(log)}
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

        {/* Modal de Detalles */}
        <Dialog
          open={detailsModalOpen}
          onClose={handleCloseDetails}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Detalles de Auditoría - ID: {selectedLog?.id}
              </Typography>
              <IconButton onClick={handleCloseDetails}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedLog && (
              <Box>
                {/* Información General */}
                <Typography variant="h6" gutterBottom>
                  Información General
                </Typography>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Usuario:
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.user_name || 'Sistema'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedLog.user_email || (selectedLog.user_id ? `ID: ${selectedLog.user_id}` : 'Sistema')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Fecha y Hora:
                    </Typography>
                    <Typography variant="body1">
                      {formatDateTime(selectedLog.created_at)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Acción:
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {getActionChip(selectedLog.action)}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Estado:
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedLog.success === 'true' ? 'Éxito' : selectedLog.success === 'false' ? 'Error' : 'Parcial'}
                        color={selectedLog.success === 'true' ? 'success' : selectedLog.success === 'false' ? 'error' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Información del Recurso */}
                <Typography variant="h6" gutterBottom>
                  Recurso Afectado
                </Typography>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tipo:
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {selectedLog.resource_type}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      ID:
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.resource_id || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="body2" color="text.secondary">
                      Nombre:
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.resource_name || '-'}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Información Técnica */}
                <Typography variant="h6" gutterBottom>
                  Información Técnica
                </Typography>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      IP:
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {selectedLog.ip_address || '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Duración:
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.duration_ms ? `${selectedLog.duration_ms}ms` : '-'}
                    </Typography>
                  </Box>
                  {selectedLog.session_id && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Session ID:
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {selectedLog.session_id}
                      </Typography>
                    </Box>
                  )}
                  {selectedLog.request_id && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Request ID:
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {selectedLog.request_id}
                      </Typography>
                    </Box>
                  )}
                  {selectedLog.user_agent && (
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Typography variant="body2" color="text.secondary">
                        User Agent:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                        {selectedLog.user_agent}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Detalles adicionales */}
                {selectedLog.details && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Detalles Adicionales
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {selectedLog.details}
                      </Typography>
                    </Paper>
                  </>
                )}

                {/* Error message */}
                {selectedLog.error_message && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom color="error">
                      Mensaje de Error
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {selectedLog.error_message}
                      </Typography>
                    </Paper>
                  </>
                )}

                {/* Valores anteriores y nuevos */}
                {(selectedLog.old_values || selectedLog.new_values) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Cambios de Datos
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
                      {selectedLog.old_values && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Valores Anteriores:
                          </Typography>
                          <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(parseJsonSafely(selectedLog.old_values), null, 2)}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                      {selectedLog.new_values && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Valores Nuevos:
                          </Typography>
                          <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(parseJsonSafely(selectedLog.new_values), null, 2)}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetails}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Audit;
