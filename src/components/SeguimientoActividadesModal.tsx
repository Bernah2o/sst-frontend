import React, { useState, useEffect } from 'react';
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
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  Tooltip,
  FormControlLabel,
  RadioGroup,
  Radio,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AttachFile as AttachFileIcon,
  PictureAsPdf as PdfIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

import seguimientoActividadesService, {
  SeguimientoActividad,
  SeguimientoActividadCreate,
  SeguimientoActividadUpdate
} from '../services/seguimientoActividadesService';
import ConfirmDialog from './ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

interface SeguimientoActividadesModalProps {
  open: boolean;
  onClose: () => void;
  seguimientoId: number;
  onActividadChange?: () => void;
}

const SeguimientoActividadesModal: React.FC<SeguimientoActividadesModalProps> = ({
  open,
  onClose,
  seguimientoId,
  onActividadChange
}) => {
  const [actividades, setActividades] = useState<SeguimientoActividad[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingActividad, setEditingActividad] = useState<SeguimientoActividad | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo_fecha: 'unica' as 'rango' | 'unica',
    fecha_inicio: null as Date | null,
    fecha_fin: null as Date | null,
    fecha_unica: null as Date | null,
    estado: 'pendiente' as 'pendiente' | 'en_progreso' | 'completada' | 'cancelada',
    prioridad: 'media' as 'baja' | 'media' | 'alta' | 'critica',
    observaciones: ''
  });

  const estadosConfig = {
    pendiente: { label: 'Pendiente', color: 'default', icon: <ScheduleIcon /> },
    en_progreso: { label: 'En Progreso', color: 'info', icon: <ScheduleIcon /> },
    completada: { label: 'Completada', color: 'success', icon: <CheckCircleIcon /> },
    cancelada: { label: 'Cancelada', color: 'error', icon: <CancelIcon /> }
  };

  const prioridadesConfig = {
    baja: { label: 'Baja', color: 'success', icon: <FlagIcon /> },
    media: { label: 'Media', color: 'warning', icon: <FlagIcon /> },
    alta: { label: 'Alta', color: 'error', icon: <FlagIcon /> },
    critica: { label: 'Crítica', color: 'error', icon: <WarningIcon /> }
  };

  // Hook para el diálogo de confirmación
  const { dialogState, showConfirmDialog, hideConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (open && seguimientoId) {
      fetchActividades();
    }
  }, [open, seguimientoId]);

  const fetchActividades = async () => {
    try {
      setLoading(true);
      const data = await seguimientoActividadesService.getActividadesBySeguimiento(seguimientoId);
      setActividades(data);
    } catch (error) {
      console.error('Error fetching actividades:', error);
      setError('Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActividad = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload: SeguimientoActividadCreate | SeguimientoActividadUpdate = {
        titulo: formData.titulo,
        descripcion: formData.descripcion || undefined,
        tipo_fecha: formData.tipo_fecha,
        fecha_inicio: formData.tipo_fecha === 'rango' && formData.fecha_inicio 
          ? formData.fecha_inicio.toISOString().split('T')[0] 
          : undefined,
        fecha_fin: formData.tipo_fecha === 'rango' && formData.fecha_fin 
          ? formData.fecha_fin.toISOString().split('T')[0] 
          : undefined,
        fecha_unica: formData.tipo_fecha === 'unica' && formData.fecha_unica 
          ? formData.fecha_unica.toISOString().split('T')[0] 
          : undefined,
        estado: formData.estado,
        prioridad: formData.prioridad,
        observaciones: formData.observaciones || undefined
      };

      if (editingActividad) {
        await seguimientoActividadesService.updateActividad(editingActividad.id, payload);
        setSuccess('Actividad actualizada exitosamente');
      } else {
        const createPayload = { ...payload, seguimiento_id: seguimientoId } as SeguimientoActividadCreate;
        await seguimientoActividadesService.createActividad(createPayload);
        setSuccess('Actividad creada exitosamente');
      }

      await fetchActividades();
      handleCancelForm();
      onActividadChange?.();
    } catch (error) {
      console.error('Error saving actividad:', error);
      setError('Error al guardar la actividad');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActividad = async (id: number) => {
    const confirmed = await showConfirmDialog({
      title: 'Eliminar Actividad',
      message: '¿Está seguro de que desea eliminar esta actividad? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      severity: 'warning'
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      await seguimientoActividadesService.deleteActividad(id);
      await fetchActividades();
      setSuccess('Actividad eliminada exitosamente');
      onActividadChange?.();
    } catch (error) {
      console.error('Error deleting actividad:', error);
      setError('Error al eliminar la actividad');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (actividadId: number, file: File) => {
    try {
      setUploadingFile(actividadId);
      setError(null);

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Solo se permiten archivos PDF');
        return;
      }

      await seguimientoActividadesService.uploadArchivoSoporte(actividadId, file);
      await fetchActividades();
      setSuccess('Archivo subido exitosamente');
      onActividadChange?.();
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error al subir el archivo');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDeleteFile = async (actividadId: number) => {
    const confirmed = await showConfirmDialog({
      title: 'Eliminar Archivo',
      message: '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      severity: 'warning'
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      await seguimientoActividadesService.deleteArchivoSoporte(actividadId);
      await fetchActividades();
      setSuccess('Archivo eliminado exitosamente');
      onActividadChange?.();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Error al eliminar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleEditActividad = (actividad: SeguimientoActividad) => {
    setEditingActividad(actividad);
    setFormData({
      titulo: actividad.titulo,
      descripcion: actividad.descripcion || '',
      tipo_fecha: actividad.tipo_fecha,
      fecha_inicio: actividad.fecha_inicio ? new Date(actividad.fecha_inicio) : null,
      fecha_fin: actividad.fecha_fin ? new Date(actividad.fecha_fin) : null,
      fecha_unica: actividad.fecha_unica ? new Date(actividad.fecha_unica) : null,
      estado: actividad.estado,
      prioridad: actividad.prioridad,
      observaciones: actividad.observaciones || ''
    });
    setShowForm(true);
  };

  const handleNewActividad = () => {
    setEditingActividad(null);
    setFormData({
      titulo: '',
      descripcion: '',
      tipo_fecha: 'unica',
      fecha_inicio: null,
      fecha_fin: null,
      fecha_unica: null,
      estado: 'pendiente',
      prioridad: 'media',
      observaciones: ''
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingActividad(null);
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Gestión de Actividades</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {loading && <LinearProgress />}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {!showForm ? (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Actividades del Seguimiento</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNewActividad}
                  disabled={loading}
                >
                  Nueva Actividad
                </Button>
              </Box>

              {actividades.length === 0 ? (
                <Alert severity="info">
                  No hay actividades registradas para este seguimiento.
                </Alert>
              ) : (
                <List>
                  {actividades.map((actividad, index) => (
                    <React.Fragment key={actividad.id}>
                      <ListItem>
                        <Card sx={{ width: '100%' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                              <Box sx={{ flex: { xs: 1, md: 2 } }}>
                                <Typography variant="h6" gutterBottom>
                                  {actividad.titulo}
                                </Typography>
                                {actividad.descripcion && (
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {actividad.descripcion}
                                  </Typography>
                                )}
                                
                                <Box display="flex" gap={1} mb={1}>
                                  <Chip
                                    label={estadosConfig[actividad.estado].label}
                                    color={estadosConfig[actividad.estado].color as any}
                                    size="small"
                                    icon={estadosConfig[actividad.estado].icon}
                                  />
                                  <Chip
                                    label={prioridadesConfig[actividad.prioridad].label}
                                    color={prioridadesConfig[actividad.prioridad].color as any}
                                    size="small"
                                    icon={<FlagIcon />}
                                  />
                                </Box>

                                <Typography variant="body2" color="text.secondary">
                                  {actividad.tipo_fecha === 'unica' 
                                    ? `Fecha: ${actividad.fecha_unica ? formatDate(actividad.fecha_unica) : 'No definida'}`
                                    : `Desde: ${actividad.fecha_inicio ? formatDate(actividad.fecha_inicio) : 'No definida'} - Hasta: ${actividad.fecha_fin ? formatDate(actividad.fecha_fin) : 'No definida'}`
                                  }
                                </Typography>

                                {actividad.observaciones && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <strong>Observaciones:</strong> {actividad.observaciones}
                                  </Typography>
                                )}
                              </Box>

                              <Box sx={{ flex: { xs: 1, md: 1 } }}>
                                <Box display="flex" flexDirection="column" gap={1}>
                                  <Box display="flex" gap={1}>
                                    <Tooltip title="Editar">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditActividad(actividad)}
                                        disabled={loading}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteActividad(actividad.id)}
                                        disabled={loading}
                                        color="error"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>

                                  {actividad.archivo_soporte_url ? (
                                    <Box>
                                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <PdfIcon color="error" />
                                        <Typography variant="body2" noWrap>
                                          {actividad.archivo_soporte_nombre}
                                        </Typography>
                                      </Box>
                                      <Box display="flex" gap={1}>
                                        <Button
                                          size="small"
                                          startIcon={<DownloadIcon />}
                                          onClick={() => window.open(actividad.archivo_soporte_url, '_blank')}
                                        >
                                          Ver
                                        </Button>
                                        <Button
                                          size="small"
                                          color="error"
                                          startIcon={<DeleteIcon />}
                                          onClick={() => handleDeleteFile(actividad.id)}
                                          disabled={loading}
                                        >
                                          Eliminar
                                        </Button>
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Box>
                                      <input
                                        accept=".pdf"
                                        style={{ display: 'none' }}
                                        id={`file-upload-${actividad.id}`}
                                        type="file"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleFileUpload(actividad.id, file);
                                          }
                                        }}
                                      />
                                      <label htmlFor={`file-upload-${actividad.id}`}>
                                        <Button
                                          variant="outlined"
                                          component="span"
                                          startIcon={uploadingFile === actividad.id ? <LinearProgress /> : <UploadIcon />}
                                          disabled={uploadingFile === actividad.id || loading}
                                          size="small"
                                        >
                                          Subir PDF
                                        </Button>
                                      </label>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </ListItem>
                      {index < actividades.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                {editingActividad ? 'Editar Actividad' : 'Nueva Actividad'}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Título"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />

                <TextField
                  fullWidth
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  multiline
                  rows={3}
                />

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                    >
                      {Object.entries(estadosConfig).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                          {config.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Prioridad</InputLabel>
                    <Select
                      value={formData.prioridad}
                      onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as any })}
                    >
                      {Object.entries(prioridadesConfig).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                          {config.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Tipo de Fecha
                  </Typography>
                  <RadioGroup
                    row
                    value={formData.tipo_fecha}
                    onChange={(e) => setFormData({ ...formData, tipo_fecha: e.target.value as any })}
                  >
                    <FormControlLabel value="unica" control={<Radio />} label="Fecha Única" />
                    <FormControlLabel value="rango" control={<Radio />} label="Rango de Fechas" />
                  </RadioGroup>
                </Box>

                {formData.tipo_fecha === 'unica' ? (
                  <Box sx={{ maxWidth: { xs: '100%', md: '50%' } }}>
                    <DatePicker
                      label="Fecha"
                      value={formData.fecha_unica}
                      onChange={(date) => setFormData({ ...formData, fecha_unica: date })}
                      slotProps={{
                        textField: {
                          fullWidth: true
                        }
                      }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <DatePicker
                      label="Fecha Inicio"
                      value={formData.fecha_inicio}
                      onChange={(date) => setFormData({ ...formData, fecha_inicio: date })}
                      slotProps={{
                        textField: {
                          fullWidth: true
                        }
                      }}
                    />
                    <DatePicker
                      label="Fecha Fin"
                      value={formData.fecha_fin}
                      onChange={(date) => setFormData({ ...formData, fecha_fin: date })}
                      slotProps={{
                        textField: {
                          fullWidth: true
                        }
                      }}
                    />
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  multiline
                  rows={3}
                />
              </Box>

              <Box display="flex" gap={2} mt={3}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveActividad}
                  disabled={loading || !formData.titulo}
                >
                  {editingActividad ? 'Actualizar' : 'Crear'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelForm}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        severity={dialogState.severity}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </LocalizationProvider>
  );
};

export default SeguimientoActividadesModal;