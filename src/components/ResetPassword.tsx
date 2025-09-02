import { LockResetOutlined } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
  CssBaseline,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

import { apiService } from '../services/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Token de recuperación no válido o expirado');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.password || !formData.confirmPassword) {
      setError('Por favor, complete todos los campos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!token) {
      setError('Token de recuperación no válido');
      return;
    }

    setLoading(true);
    try {
      await apiService.resetPassword({
        token,
        new_password: formData.password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Error al restablecer la contraseña. El token puede haber expirado.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'success.main' }}>
            <LockResetOutlined />
          </Avatar>
          <Typography component="h1" variant="h4" gutterBottom>
            Plataforma SST
          </Typography>
          <Typography component="h2" variant="h6" color="textSecondary" gutterBottom>
            Contraseña Restablecida
          </Typography>
          
          <Card sx={{ mt: 2, width: '100%' }}>
            <CardContent>
              <Alert severity="success" sx={{ mb: 2 }}>
                Su contraseña ha sido restablecida exitosamente.
              </Alert>
              
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
                Ya puede iniciar sesión con su nueva contraseña.
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ mt: 2 }}
              >
                Iniciar Sesión
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockResetOutlined />
        </Avatar>
        <Typography component="h1" variant="h4" gutterBottom>
          Plataforma SST
        </Typography>
        <Typography component="h2" variant="h6" color="textSecondary" gutterBottom>
          Restablecer Contraseña
        </Typography>
        
        <Card sx={{ mt: 2, width: '100%' }}>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Ingrese su nueva contraseña.
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Nueva Contraseña"
                type="password"
                id="password"
                autoComplete="new-password"
                autoFocus
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                helperText="Mínimo 8 caracteres"
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar Nueva Contraseña"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !token}
              >
                {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">
                  ¿Recordó su contraseña?{' '}
                  <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
                    Iniciar Sesión
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
          Plataforma de Capacitaciones en Seguridad y Salud en el Trabajo
        </Typography>
      </Box>
    </Container>
  );
};

export default ResetPassword;