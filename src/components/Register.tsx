import React, { useState } from 'react';
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
  MenuItem,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  phone?: string;
  department?: string;
  position?: string;
}



const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    document_type: 'CC',
    document_number: '',
    phone: '',
    department: '',
    position: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || !formData.document_number) {
      setError('Por favor, complete todos los campos obligatorios');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, ingrese un email válido');
      return false;
    }

    // Validar que el documento solo contenga números
    if (!/^\d+$/.test(formData.document_number)) {
      setError('El número de documento debe contener solo números');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para enviar (sin confirmPassword)
      const { confirmPassword, ...registerData } = formData;
      
      await api.post('/auth/register', registerData);
      
      setSuccess('Registro completado exitosamente. Puede iniciar sesión ahora.');
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Error al registrarse. Por favor, intente nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <PersonAdd />
        </Avatar>
        <Typography component="h1" variant="h4" gutterBottom>
          Plataforma SST
        </Typography>
        <Typography component="h2" variant="h6" color="textSecondary" gutterBottom>
          Completar Registro
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
          Ingrese su cédula y correo electrónico para completar su registro
        </Typography>
        
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
                  {success}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="first_name"
                  label="Nombres"
                  name="first_name"
                  autoComplete="given-name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={loading}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="last_name"
                  label="Apellidos"
                  name="last_name"
                  autoComplete="family-name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />

              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  select
                  id="document_type"
                  label="Tipo de Documento"
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <MenuItem value="CC">Cédula de Ciudadanía</MenuItem>
                  <MenuItem value="CE">Cédula de Extranjería</MenuItem>
                  <MenuItem value="PA">Pasaporte</MenuItem>
                  <MenuItem value="TI">Tarjeta de Identidad</MenuItem>
                </TextField>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="document_number"
                  label="Número de Documento"
                  name="document_number"
                  value={formData.document_number}
                  onChange={handleChange}
                  disabled={loading}
                  helperText="Ingrese su número de documento sin puntos ni espacios"
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="phone"
                  label="Teléfono (Opcional)"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  id="department"
                  label="Departamento (Opcional)"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Box>
              
              <TextField
                margin="normal"
                fullWidth
                id="position"
                label="Cargo (Opcional)"
                name="position"
                value={formData.position}
                onChange={handleChange}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  helperText="Mínimo 8 caracteres, debe incluir letras, números y símbolos"
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirmar Contraseña"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Box>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Completando registro...' : 'Completar Registro'}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">
                  ¿Ya tienes una cuenta?{' '}
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

export default Register;