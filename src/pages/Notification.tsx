import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip,
  Switch,
  FormControlLabel,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDateTime } from '../utils/dateUtils';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  channel: 'email' | 'sms' | 'push' | 'system';
  recipient_type: 'all' | 'role' | 'specific';
  recipient_ids?: number[];
  scheduled_at?: string;
  sent_at?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  created_by: number;
  created_by_name: string;
  created_at: string;
  read_count?: number;
  total_recipients?: number;
}

interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

const Notification: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    channel: '',
    status: '',
    search: ''
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    channel: 'system' as 'email' | 'sms' | 'push' | 'system',
    recipient_type: 'all' as 'all' | 'role' | 'specific',
    recipient_ids: [] as number[],
    recipient_role: '',
    scheduled_at: null as Date | null,
    send_immediately: true
  });

  const notificationTypes = [
    { value: 'info', label: 'Información', icon: <InfoIcon />, color: 'info' },
    { value: 'warning', label: 'Advertencia', icon: <WarningIcon />, color: 'warning' },
    { value: 'error', label: 'Error', icon: <ErrorIcon />, color: 'error' },
    { value: 'success', label: 'Éxito', icon: <SuccessIcon />, color: 'success' }
  ];

  const channels = [
    { value: 'system', label: 'Sistema', icon: <NotificationsIcon /> },
    { value: 'email', label: 'Email', icon: <EmailIcon /> },
    { value: 'sms', label: 'SMS', icon: <SmsIcon /> },
    { value: 'push', label: 'Push', icon: <NotificationsIcon /> }
  ];

  const statusConfig = {
    draft: { label: 'Borrador', color: 'default' },
    scheduled: { label: 'Programada', color: 'warning' },
    sent: { label: 'Enviada', color: 'success' },
    failed: { label: 'Fallida', color: 'error' }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, [page, filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      
      if (filters.type) params.append('type', filters.type);
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/notifications/?${params.toString()}`);
      setNotifications(response.data.items || []);
      // Use the 'pages' field directly from API response instead of calculating
      setTotalPages(response.data.pages || Math.ceil((response.data.total || 0) / 20));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/list');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const handleSaveNotification = async () => {
    try {
      if (editingNotification) {
        // For editing, use the original endpoint
        const payload = {
          ...formData,
          recipient_ids: formData.recipient_type === 'specific' ? formData.recipient_ids : undefined,
          recipient_role: formData.recipient_type === 'role' ? formData.recipient_role : undefined,
          scheduled_at: !formData.send_immediately ? formData.scheduled_at?.toISOString() : undefined
        };
        await api.put(`/notifications/${editingNotification.id}`, payload);
      } else {
        // For creating new notifications, use the bulk endpoint
        // Map frontend channel values to backend notification_type
        const notificationTypeMap: { [key: string]: string } = {
          'system': 'in_app',
          'email': 'email',
          'sms': 'sms',
          'push': 'push'
        };
        
        // Map frontend type to backend priority
        const priorityMap: { [key: string]: string } = {
          'info': 'normal',
          'warning': 'high',
          'error': 'urgent',
          'success': 'normal'
        };
        
        const bulkPayload = {
          title: formData.title,
          message: formData.message,
          notification_type: notificationTypeMap[formData.channel] || 'in_app',
          priority: priorityMap[formData.type] || 'normal',
          user_ids: formData.recipient_type === 'specific' ? formData.recipient_ids : undefined,
          user_roles: formData.recipient_type === 'role' ? [formData.recipient_role] : undefined,
          scheduled_at: !formData.send_immediately ? formData.scheduled_at?.toISOString() : undefined
        };
        await api.post('/notifications/bulk', bulkPayload);
      }
      fetchNotifications();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  const handleSendNotification = async (id: number) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar envío',
      message: '¿Está seguro de que desea enviar esta notificación?',
      onConfirm: async () => {
        try {
          await api.post(`/notifications/${id}/send`);
          fetchNotifications();
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (error) {
          console.error('Error sending notification:', error);
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      }
    });
  };

  const handleDeleteNotification = async (id: number) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      message: '¿Está seguro de que desea eliminar esta notificación?',
      onConfirm: async () => {
        try {
          await api.delete(`/notifications/${id}`);
          fetchNotifications();
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (error) {
          console.error('Error deleting notification:', error);
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      }
    });
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleOpenDialog = (notification?: Notification) => {
    if (notification) {
      setEditingNotification(notification);
      setFormData({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        channel: notification.channel,
        recipient_type: notification.recipient_type,
        recipient_ids: notification.recipient_ids || [],
        recipient_role: '',
        scheduled_at: notification.scheduled_at ? new Date(notification.scheduled_at) : null,
        send_immediately: !notification.scheduled_at
      });
    } else {
      setEditingNotification(null);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        channel: 'system',
        recipient_type: 'all',
        recipient_ids: [],
        recipient_role: '',
        scheduled_at: null,
        send_immediately: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNotification(null);
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = notificationTypes.find(t => t.value === type);
    return typeConfig?.icon || <InfoIcon />;
  };

  const getChannelIcon = (channel: string) => {
    const channelConfig = channels.find(c => c.value === channel);
    return channelConfig?.icon || <NotificationsIcon />;
  };



  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Notificaciones
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Crear y administrar notificaciones del sistema
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
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Título, mensaje..."
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {notificationTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Canal</InputLabel>
                  <Select
                    value={filters.channel}
                    onChange={(e) => handleFilterChange('channel', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {channels.map((channel) => (
                      <MenuItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box display="flex" gap={1}>
                  <Tooltip title="Actualizar">
                    <IconButton onClick={fetchNotifications}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Nueva Notificación
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de Notificaciones */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Título</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Canal</TableCell>
                    <TableCell>Destinatarios</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Programada</TableCell>
                    <TableCell>Creada por</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Cargando notificaciones...
                      </TableCell>
                    </TableRow>
                  ) : notifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No se encontraron notificaciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    notifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getTypeIcon(notification.type)}
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {notification.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {notification.message ? notification.message.substring(0, 50) + '...' : 'Sin mensaje'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={notificationTypes.find(t => t.value === notification.type)?.label}
                            color={notificationTypes.find(t => t.value === notification.type)?.color as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getChannelIcon(notification.channel)}
                            <Typography variant="body2">
                              {channels.find(c => c.value === notification.channel)?.label}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {notification.recipient_type === 'all' ? 'Todos' : 
                             notification.recipient_type === 'role' ? 'Por rol' : 'Específicos'}
                          </Typography>
                          {notification.read_count !== undefined && notification.total_recipients && (
                            <Typography variant="caption" color="text.secondary">
                              {notification.read_count}/{notification.total_recipients} leídas
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusConfig[notification.status as keyof typeof statusConfig]?.label}
                            color={statusConfig[notification.status as keyof typeof statusConfig]?.color as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {notification.scheduled_at ? formatDateTime(notification.scheduled_at) : 'Inmediata'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {notification.created_by_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(notification.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            {notification.status === 'draft' && (
                              <Tooltip title="Enviar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleSendNotification(notification.id)}
                                >
                                  <SendIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {(notification.status === 'draft' || notification.status === 'scheduled') && (
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(notification)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteNotification(notification.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
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

        {/* Dialog para Crear/Editar Notificación */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingNotification ? 'Editar Notificación' : 'Nueva Notificación'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Título"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Mensaje"
                  multiline
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    {notificationTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Canal</InputLabel>
                  <Select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
                  >
                    {channels.map((channel) => (
                      <MenuItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Destinatarios</InputLabel>
                  <Select
                    value={formData.recipient_type}
                    onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value as any })}
                  >
                    <MenuItem value="all">Todos los usuarios</MenuItem>
                    <MenuItem value="role">Por rol</MenuItem>
                    <MenuItem value="specific">Usuarios específicos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {formData.recipient_type === 'role' && (
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Rol</InputLabel>
                    <Select
                      value={formData.recipient_role}
                      onChange={(e) => setFormData({ ...formData, recipient_role: e.target.value })}
                    >
                      <MenuItem value="admin">Administrador</MenuItem>
                      <MenuItem value="trainer">Entrenador</MenuItem>
                      <MenuItem value="employee">Empleado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {formData.recipient_type === 'specific' && (
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Usuarios</InputLabel>
                    <Select
                      multiple
                      value={formData.recipient_ids.map(String)}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        recipient_ids: (e.target.value as string[]).map(Number) 
                      })}
                    >
                      {Array.isArray(users) && users.map((user) => (
                        <MenuItem key={user.id} value={user.id.toString()}>
                          {user.nombre} {user.apellido} - {user.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid size={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.send_immediately}
                      onChange={(e) => setFormData({ ...formData, send_immediately: e.target.checked })}
                    />
                  }
                  label="Enviar inmediatamente"
                />
              </Grid>
              {!formData.send_immediately && (
                <Grid size={12}>
                  <DateTimePicker
                    label="Programar para"
                    value={formData.scheduled_at}
                    onChange={(date) => setFormData({ ...formData, scheduled_at: date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button 
              onClick={handleSaveNotification} 
              variant="contained"
              disabled={!formData.title || !formData.message}
            >
              {editingNotification ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmación */}
        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <Typography>{confirmDialog.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              color="inherit"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmDialog.onConfirm}
              variant="contained"
              color="primary"
            >
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Notification;