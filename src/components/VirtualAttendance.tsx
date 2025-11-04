import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckInIcon,
  ExitToApp as CheckOutIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import virtualAttendanceService from '../services/virtualAttendanceService';
import { VirtualAttendanceResponse } from '../types';

interface VirtualAttendanceProps {
  open: boolean;
  onClose: () => void;
  courseName?: string;
  sessionDate?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}



interface SessionCodeData {
  session_code: string;
  course_name: string;
  session_date: string;
  valid_until: string;
  generated_by: number;
  message: string;
}

const VirtualAttendance: React.FC<VirtualAttendanceProps> = ({
  open,
  onClose,
  courseName = '',
  sessionDate = '',
  onSuccess,
  onError,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<SessionCodeData | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<VirtualAttendanceResponse | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [notes, setNotes] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [validDurationMinutes, setValidDurationMinutes] = useState(30);
  const [selectedCourse, setSelectedCourse] = useState<{ id: number; title: string } | null>(null);
  const [localCourseName, setLocalCourseName] = useState(courseName);
  const [validatedSession, setValidatedSession] = useState<{
    course_name: string;
    session_date: string;
    virtual_session_link: string;
  } | null>(null);

  // Estados para el formulario de entrada
  const [checkInForm, setCheckInForm] = useState({
    session_date: sessionDate || new Date().toISOString().split('T')[0],
    session_code: '',
    virtual_session_link: '',
  });

  useEffect(() => {
    if (open && user) {
      setCheckInForm(prev => ({
        ...prev,
        session_date: sessionDate || new Date().toISOString().split('T')[0],
      }));
      // Set default course if courseName is provided
      if (courseName) {
        setLocalCourseName(courseName);
        setSelectedCourse({ id: 1, title: courseName });
        setCheckInForm(prev => ({ ...prev, course_id: 1 }));
      }
    }
  }, [open, user, courseName, sessionDate]);

  const fetchAttendanceStatus = useCallback(async () => {
    if (!user || !localCourseName || !checkInForm.session_date) return;

    try {
      setLoading(true);
      const response = await virtualAttendanceService.getStatus(user.id, checkInForm.session_date);
      setAttendanceStatus(response);
    } catch (error: any) {
      console.error('Error fetching attendance status:', error);
      setAlert({
        type: 'error',
        message: 'Error al consultar el estado de asistencia',
      });
    } finally {
      setLoading(false);
    }
  }, [user, localCourseName, checkInForm.session_date]);

  // Separate useEffect for fetching attendance status
  useEffect(() => {
    if (open && user && localCourseName && checkInForm.session_date) {
      fetchAttendanceStatus();
    }
  }, [open, user, localCourseName, checkInForm.session_date, fetchAttendanceStatus]);

  const generateSessionCode = async () => {
    try {
      setLoading(true);
      const response = await virtualAttendanceService.generateSessionCode({
        course_name: localCourseName || 'Curso Virtual',
        session_date: checkInForm.session_date,
        valid_duration_minutes: validDurationMinutes,
        facilitator_id: user?.id || 0,
      });
      setGeneratedCode({
        session_code: response.session_code,
        course_name: selectedCourse?.title || localCourseName || 'Curso Virtual',
        session_date: checkInForm.session_date,
        valid_until: response.expires_at,
        generated_by: user?.id || 0,
        message: 'Código generado exitosamente'
      });
      setAlert({
        type: 'success',
        message: `Código generado: ${response.session_code}`,
      });
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.response?.data?.detail || 'Error al generar código de sesión',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateSessionCode = async () => {
    try {
      setLoading(true);
      const response = await virtualAttendanceService.validateSessionCode({
        session_code: sessionCode,
        user_id: user?.id || 0,
        course_name: localCourseName || 'Curso Virtual',
        session_date: checkInForm.session_date,
      });
      
      if (response.valid) {
        setAlert({
          type: 'success',
          message: 'Código de sesión válido',
        });
        setCheckInForm(prev => ({ 
          ...prev, 
          session_code: sessionCode,
          session_date: response.session_date || prev.session_date,
          virtual_session_link: response.virtual_session_link || ''
        }));
        // Set the course name from the response to enable the button
        if (response.course_name) {
          setLocalCourseName(response.course_name);
        }
        // Store validated session information
        setValidatedSession({
          course_name: response.course_name || localCourseName || 'Curso Virtual',
          session_date: response.session_date || checkInForm.session_date,
          virtual_session_link: response.virtual_session_link || ''
        });
      } else {
        setAlert({
          type: 'error',
          message: 'Código de sesión inválido o expirado',
        });
      }
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.response?.data?.detail || 'Error al validar código',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user?.id || !localCourseName || !checkInForm.session_date) {
      setAlert({
        type: "error",
        message: "Faltan datos requeridos para el check-in",
      });
      return;
    }

    try {
      setLoading(true);

      // Capturar la hora del sistema del empleado
      const systemTime = new Date();
      const systemTimeISO = systemTime.toISOString();
      const localTimeString = systemTime.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const response = await virtualAttendanceService.checkIn({
        user_id: user.id,
        course_name: localCourseName,
        session_date: checkInForm.session_date,
        session_code: checkInForm.session_code,
        virtual_session_link: checkInForm.virtual_session_link,
        device_fingerprint: await virtualAttendanceService.getDeviceFingerprint(),
        browser_info: virtualAttendanceService.getBrowserInfo(),
        // Agregar información de tiempo del sistema del empleado
        employee_system_time: systemTimeISO,
        employee_local_time: localTimeString,
        employee_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      setAttendanceStatus(response);
      setAlert({
        type: "success",
        message: `Check-in realizado exitosamente a las ${localTimeString}`,
      });
      onSuccess?.(`Check-in realizado exitosamente a las ${localTimeString}`);
    } catch (error) {
      console.error("Error during check-in:", error);
      setAlert({
        type: "error",
        message: "Error al realizar el check-in",
      });
      onError?.("Error al realizar el check-in");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendanceStatus?.id) return;

    try {
      setLoading(true);
      await virtualAttendanceService.checkOut({
        attendance_id: attendanceStatus.id,
        connection_quality: connectionQuality,
        virtual_evidence: JSON.stringify({
          final_browser_info: {
            name: getBrowserName(),
            version: getBrowserVersion(),
            onlineStatus: navigator.onLine,
          },
          session_duration: attendanceStatus.duration_minutes || 0,
          quality_rating: connectionQuality,
          notes: notes,
        }),
      });

      setAlert({
        type: 'success',
        message: "Check-out realizado exitosamente",
      });
      onSuccess?.("Check-out realizado exitosamente");
      
      await fetchAttendanceStatus();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.response?.data?.detail || 'Error al registrar salida',
      });
      onError?.(error.response?.data?.detail || 'Error al registrar salida');
    } finally {
      setLoading(false);
    }
  };

  const getBrowserName = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const getBrowserVersion = (): string => {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  };



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setAlert({
      type: 'success',
      message: 'Código copiado al portapapeles',
    });
  };

  const formatDuration = (minutes?: number): string => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const canGenerateCode = user?.role && ['admin', 'trainer', 'supervisor'].includes(user.role);
  const isCheckedIn = Boolean(attendanceStatus?.check_in_time && !attendanceStatus?.check_out_time);
  const isCompleted = Boolean(attendanceStatus?.check_in_time && attendanceStatus?.check_out_time);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <VideoCallIcon color="primary" />
          <Typography variant="h6">Asistencia Virtual</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {alert && (
          <Alert 
            severity={alert.type} 
            onClose={() => setAlert(null)}
            sx={{ mb: 2 }}
          >
            {alert.message}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Información de la sesión (solo para facilitadores) */}
          {canGenerateCode && (
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información de la Sesión
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Curso"
                        value={localCourseName}
                        onChange={(e) => setLocalCourseName(e.target.value)}
                        disabled={isCheckedIn || isCompleted}
                        placeholder="Ingrese el nombre del curso"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Fecha de Sesión"
                        type="date"
                        value={checkInForm.session_date}
                        onChange={(e) => setCheckInForm(prev => ({ ...prev, session_date: e.target.value }))}
                        disabled={isCheckedIn || isCompleted}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Enlace de Sesión Virtual"
                        value={checkInForm.virtual_session_link}
                        onChange={(e) => setCheckInForm(prev => ({ ...prev, virtual_session_link: e.target.value }))}
                        disabled={isCheckedIn || isCompleted}
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Generación de código (solo para facilitadores) */}
          {canGenerateCode && (
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Generar Código de Sesión
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Duración válida (minutos)"
                        type="number"
                        value={validDurationMinutes}
                        onChange={(e) => setValidDurationMinutes(Number(e.target.value))}
                        inputProps={{ min: 5, max: 120 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={generateSessionCode}
                        disabled={loading || !localCourseName}
                        startIcon={<CodeIcon />}
                      >
                        Generar Código
                      </Button>
                    </Grid>
                  </Grid>
                  
                  {generatedCode && (
                    <Box mt={2}>
                      <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="h4" fontFamily="monospace">
                            {generatedCode.session_code}
                          </Typography>
                          <IconButton 
                            onClick={() => copyToClipboard(generatedCode.session_code)}
                            sx={{ color: 'inherit' }}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Válido hasta: {new Date(generatedCode.valid_until).toLocaleString()}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Validación de código y check-in */}
          {!isCheckedIn && !isCompleted && (
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Registrar Entrada
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        fullWidth
                        label="Código de Sesión"
                        value={sessionCode}
                        onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                        placeholder="Ingresa el código de 8 caracteres"
                        inputProps={{ maxLength: 8 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={validateSessionCode}
                        disabled={loading || sessionCode.length !== 8}
                      >
                        Validar
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleCheckIn}
                        disabled={loading || !checkInForm.session_code || !localCourseName}
                        startIcon={<CheckInIcon />}
                        size="large"
                      >
                        Registrar Entrada
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Información de la sesión validada */}
          {validatedSession && !canGenerateCode && (
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined" sx={{ backgroundColor: '#f8f9fa' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Información de la Sesión Virtual
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body1" gutterBottom>
                        <strong>Curso:</strong> {validatedSession.course_name}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body1" gutterBottom>
                        <strong>Fecha de Sesión:</strong> {new Date(validatedSession.session_date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    {validatedSession.virtual_session_link && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" gutterBottom>
                          <strong>Enlace de la Sesión Virtual:</strong>
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<VideoCallIcon />}
                          onClick={() => window.open(validatedSession.virtual_session_link, '_blank')}
                          fullWidth
                          sx={{ mt: 1 }}
                        >
                          Unirse a la Sesión Virtual
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Estado actual de asistencia */}
          {attendanceStatus && (
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estado de Asistencia
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckInIcon color={attendanceStatus.check_in_time ? 'success' : 'disabled'} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Entrada registrada"
                        secondary={attendanceStatus.check_in_time ? 
                          new Date(attendanceStatus.check_in_time).toLocaleString() : 
                          'No registrada'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckOutIcon color={attendanceStatus.check_out_time ? 'success' : 'disabled'} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Salida registrada"
                        secondary={attendanceStatus.check_out_time ? 
                          new Date(attendanceStatus.check_out_time).toLocaleString() : 
                          'No registrada'
                        }
                      />
                    </ListItem>
                    {attendanceStatus.duration_minutes !== undefined && (
                      <ListItem>
                        <ListItemIcon>
                          <TimeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Duración"
                          secondary={formatDuration(attendanceStatus.duration_minutes)}
                        />
                      </ListItem>
                    )}
                  </List>
                  
                  {attendanceStatus.completion_percentage !== undefined && (
                    <Box mt={2}>
                      <Chip
                        label={`${attendanceStatus.completion_percentage}% completado`}
                        color={attendanceStatus.completion_percentage >= 80 ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Check-out */}
          {isCheckedIn && (
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Registrar Salida
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Calidad de Conexión</InputLabel>
                        <Select
                          value={connectionQuality}
                          onChange={(e) => setConnectionQuality(e.target.value as any)}
                        >
                          <MenuItem value="excellent">Excelente</MenuItem>
                          <MenuItem value="good">Buena</MenuItem>
                          <MenuItem value="fair">Regular</MenuItem>
                          <MenuItem value="poor">Mala</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Notas adicionales (opcional)"
                        multiline
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Comentarios sobre la sesión..."
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={handleCheckOut}
                        disabled={loading}
                        startIcon={<CheckOutIcon />}
                        size="large"
                      >
                        Registrar Salida
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {loading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button onClick={fetchAttendanceStatus} startIcon={<RefreshIcon />}>
          Actualizar Estado
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VirtualAttendance;