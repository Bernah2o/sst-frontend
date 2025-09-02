import { EmailOutlined } from '@mui/icons-material';
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
import { useNavigate, Link } from 'react-router-dom';

import { apiService } from '../services/api';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Por favor, ingrese su correo electrónico');
      return;
    }

    setLoading(true);
    try {
      await apiService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Error al enviar el correo de recuperación. Verifique que el correo sea válido.'
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
            <EmailOutlined />
          </Avatar>
          <Typography component="h1" variant="h4" gutterBottom>
            Plataforma SST
          </Typography>
          <Typography component="h2" variant="h6" color="textSecondary" gutterBottom>
            Correo Enviado
          </Typography>
          
          <Card sx={{ mt: 2, width: '100%' }}>
            <CardContent>
              <Alert severity="success" sx={{ mb: 2 }}>
                Se ha enviado un correo electrónico con las instrucciones para restablecer su contraseña.
              </Alert>
              
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
                Revise su bandeja de entrada y siga las instrucciones del correo.
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ mt: 2 }}
              >
                Volver al Inicio de Sesión
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
          <EmailOutlined />
        </Avatar>
        <Typography component="h1" variant="h4" gutterBottom>
          Plataforma SST
        </Typography>
        <Typography component="h2" variant="h6" color="textSecondary" gutterBottom>
          Recuperar Contraseña
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
                Ingrese su correo electrónico y le enviaremos las instrucciones para restablecer su contraseña.
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Correo Electrónico"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Correo de Recuperación'}
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

export default ForgotPassword;