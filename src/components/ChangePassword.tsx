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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

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

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Por favor, complete todos los campos');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setLoading(true);
    try {
      await apiService.changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });
      setSuccess(true);
      // Limpiar el formulario
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Error al cambiar la contraseña. Verifique que la contraseña actual sea correcta.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Volver a la página anterior
  };

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
        <Box sx={{ 
          m: 1, 
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src="/logo.png"
            alt="Logo SST"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>
        <Typography component="h1" variant="h4" gutterBottom>
          Plataforma SST
        </Typography>
        <Typography component="h2" variant="h6" color="textSecondary" gutterBottom>
          Cambiar Contraseña
        </Typography>
        
        {user && (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Usuario: {user.email}
          </Typography>
        )}
        
        <Card sx={{ mt: 2, width: '100%' }}>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Su contraseña ha sido cambiada exitosamente.
                </Alert>
              )}
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="currentPassword"
                label="Contraseña Actual"
                type="password"
                id="currentPassword"
                autoComplete="current-password"
                autoFocus
                value={formData.currentPassword}
                onChange={handleChange}
                disabled={loading}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="Nueva Contraseña"
                type="password"
                id="newPassword"
                autoComplete="new-password"
                value={formData.newPassword}
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
                disabled={loading}
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoBack}
                disabled={loading}
              >
                Cancelar
              </Button>
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

export default ChangePassword;