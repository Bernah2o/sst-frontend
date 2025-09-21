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
          <Box sx={{ 
          m: { xs: 1, sm: 1.5, md: 2 }, 
          width: { xs: 40, sm: 48, md: 56 },
          height: { xs: 40, sm: 48, md: 56 },
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
          <Typography 
          component="h1" 
          variant="h4" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            textAlign: 'center'
          }}
        >
          Plataforma SST
        </Typography>
        <Typography 
          component="h2" 
          variant="h6" 
          color="textSecondary" 
          gutterBottom
          sx={{
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            textAlign: 'center'
          }}
        >
          Correo Enviado
        </Typography>
          
          <Card sx={{ 
          mt: { xs: 2, sm: 3, md: 4 }, 
          width: '100%',
          boxShadow: { xs: 1, sm: 2, md: 3 }
        }}>
            <CardContent sx={{
            p: { xs: 2, sm: 3, md: 4 },
            '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } }
          }}>
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
          marginTop: { xs: 4, sm: 6, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { xs: 2, sm: 3, md: 0 },
        }}
      >
        <Box sx={{ 
          m: { xs: 1, sm: 1.5, md: 2 }, 
          width: { xs: 40, sm: 48, md: 56 },
          height: { xs: 40, sm: 48, md: 56 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src="/logo512.png"
            alt="Logo SST"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>
        <Typography 
          component="h1" 
          variant="h4" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            textAlign: 'center'
          }}
        >
          Plataforma SST
        </Typography>
        <Typography 
          component="h2" 
          variant="h6" 
          color="textSecondary" 
          gutterBottom
          sx={{
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            textAlign: 'center'
          }}
        >
          Recuperar Contraseña
        </Typography>
        
        <Card sx={{ 
          mt: { xs: 2, sm: 3, md: 4 }, 
          width: '100%',
          boxShadow: { xs: 1, sm: 2, md: 3 }
        }}>
          <CardContent sx={{
            p: { xs: 2, sm: 3, md: 4 },
            '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } }
          }}>
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
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    padding: { xs: '12px 14px', sm: '16.5px 14px' }
                  }
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: { xs: 2, sm: 3 }, 
                  mb: { xs: 1.5, sm: 2 },
                  py: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Correo de Recuperación'}
              </Button>
              
              <Box sx={{ 
                textAlign: 'center', 
                mt: { xs: 1.5, sm: 2 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 1 }
              }}>
                <Typography 
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'block', sm: 'inline' }
                  }}
                >
                  ¿Recordó su contraseña?{' '}
                  <Link 
                    to="/login" 
                    style={{ 
                      textDecoration: 'none', 
                      color: '#1976d2',
                      fontSize: 'inherit'
                    }}
                  >
                    Iniciar Sesión
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Typography 
          variant="body2" 
          color="textSecondary" 
          align="center" 
          sx={{ 
            mt: { xs: 3, sm: 4 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            px: { xs: 1, sm: 0 }
          }}
        >
          Plataforma de Capacitaciones en Seguridad y Salud en el Trabajo
        </Typography>
      </Box>
    </Container>
  );
};

export default ForgotPassword;