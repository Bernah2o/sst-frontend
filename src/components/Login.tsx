import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Paper,
  Typography,
  Alert,
  Card,
  CardContent,
  Box,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
  useTheme,
  alpha,
  Link,
  CssBaseline,
} from "@mui/material";
import { Email, Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  // Removido openErrorDialog - ahora solo usamos Alert
  const { login } = useAuth();
  const theme = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar estados cuando el usuario escriba
    if (success) {
      setSuccess(false);
    }
    if (isAccountLocked) {
      setIsAccountLocked(false);
    }
    // No limpiar automáticamente el error - el usuario debe cerrarlo manualmente
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar errores previos solo al iniciar un nuevo intento de login
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await login(formData);

      // Solo navegar si el login fue exitoso y tenemos una respuesta válida
      if (response && response.access_token) {
        setLoading(false);
        setSuccess(true);
        setIsRedirecting(true);

        // Prevenir que el AuthContext cause redirección automática
        // Esperar un poco más para que el usuario vea el mensaje de éxito
        setTimeout(() => {
          // Usar window.location.href para una redirección más limpia
          window.location.href = "/dashboard";
        }, 3000);
      }
    } catch (err: any) {
      // Establecer loading a false primero
      setLoading(false);

      // Manejar diferentes tipos de errores de autenticación
      let errorMessage = "Error al iniciar sesión";

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        switch (status) {
          case 401:
            errorMessage =
              "Credenciales incorrectas. Por favor, verifica tu correo electrónico y contraseña.";
            break;
          case 422:
            if (data.detail && Array.isArray(data.detail)) {
              errorMessage =
                "Por favor, verifica que el correo electrónico y la contraseña sean válidos.";
            } else {
              errorMessage = data.detail || "Datos de entrada inválidos.";
            }
            break;
          case 423:
            setIsAccountLocked(true);
            errorMessage =
              data.detail || "Su cuenta ha sido bloqueada por múltiples intentos de inicio de sesión fallidos. Para desbloquear su cuenta, debe restablecer su contraseña utilizando el enlace 'Olvidé mi contraseña'.";
            break;
          case 429:
            errorMessage =
              "Demasiados intentos de inicio de sesión. Por favor, espera un momento antes de intentar nuevamente.";
            break;
          case 500:
            errorMessage =
              "Error interno del servidor. Por favor, intenta más tarde.";
            break;
          default:
            errorMessage =
              data.detail || err.message || "Error al iniciar sesión";
        }
      } else if (err.request) {
        errorMessage =
          "No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.";
      } else {
        errorMessage = err.message || "Error inesperado al iniciar sesión";
      }

      // Establecer el error inmediatamente - se mostrará como Alert
      setError(errorMessage);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.secondary.main} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <CssBaseline />
      <Container
        component="main"
        maxWidth="sm"
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: "500px", md: "600px" },
        }}
      >
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <Card
            elevation={0}
            sx={{
              background: "transparent",
              boxShadow: "none",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 3, sm: 4, md: 6 },
                px: { xs: 2, sm: 4, md: 6 },
              }}
            >
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Box
                  sx={{
                    m: "auto",
                    mb: { xs: 2, sm: 3 },
                    width: { xs: 60, sm: 70, md: 80 },
                    height: { xs: 60, sm: 70, md: 80 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src="/logo.png"
                    alt="Logo SST"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography
                  variant="h4"
                  fontWeight="600"
                  color="primary.main"
                  gutterBottom
                  sx={{
                    fontSize: { xs: "1.75rem", sm: "2rem", md: "2.125rem" },
                  }}
                >
                  Iniciar Sesión
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    mb: { xs: 2, sm: 3 },
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  }}
                >
                  Accede a tu cuenta para continuar
                </Typography>
                <Divider sx={{ mb: { xs: 3, sm: 4 } }} />
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
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
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading || isRedirecting}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: { xs: 2, sm: 3 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      transition: "all 0.3s ease",
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.04
                        ),
                      },
                      "&.Mui-focused": {
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.06
                        ),
                        boxShadow: `0 0 0 2px ${alpha(
                          theme.palette.primary.main,
                          0.2
                        )}`,
                      },
                    },
                    "& .MuiInputLabel-root": {
                      fontWeight: 500,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    },
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading || isRedirecting}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          disabled={loading || isRedirecting}
                          sx={{
                            color: "action.active",
                            "&:hover": {
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.08
                              ),
                            },
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: { xs: 2, sm: 3 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      transition: "all 0.3s ease",
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.04
                        ),
                      },
                      "&.Mui-focused": {
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.06
                        ),
                        boxShadow: `0 0 0 2px ${alpha(
                          theme.palette.primary.main,
                          0.2
                        )}`,
                      },
                    },
                    "& .MuiInputLabel-root": {
                      fontWeight: 500,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || isRedirecting}
                  sx={{
                    mt: { xs: 1.5, sm: 2 },
                    mb: { xs: 2, sm: 3 },
                    py: { xs: 1.5, sm: 1.8 },
                    borderRadius: 2,
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    fontWeight: 600,
                    textTransform: "none",
                    background: loading
                      ? "linear-gradient(45deg, #ccc 30%, #ddd 90%)"
                      : "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                    boxShadow: loading
                      ? "none"
                      : "0 4px 20px rgba(25, 118, 210, 0.3)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: loading
                        ? "linear-gradient(45deg, #ccc 30%, #ddd 90%)"
                        : "linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)",
                      boxShadow: loading
                        ? "none"
                        : "0 6px 25px rgba(25, 118, 210, 0.4)",
                      transform: loading ? "none" : "translateY(-2px)",
                    },
                    "&:disabled": {
                      background: "linear-gradient(45deg, #ccc 30%, #ddd 90%)",
                      color: "#666",
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      Iniciando sesión...
                    </Box>
                  ) : isRedirecting ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      Redirigiendo...
                    </Box>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>

                {/* Alert para mostrar errores - permanece hasta que el usuario lo cierre */}
                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mt: 2,
                      mb: 2,
                      borderRadius: 2,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      animation: "fadeIn 0.3s ease-in",
                      "& .MuiAlert-message": {
                        width: "100%",
                        textAlign: "center",
                      },
                      "& .MuiAlert-icon": {
                        fontSize: "1.2rem",
                      },
                      "@keyframes fadeIn": {
                        "0%": {
                          opacity: 0,
                          transform: "translateY(-10px)",
                        },
                        "100%": {
                          opacity: 1,
                          transform: "translateY(0)",
                        },
                      },
                    }}
                    onClose={() => {
                      setError("");
                      setIsAccountLocked(false);
                    }}
                  >
                    <Box>
                      {error}
                      {isAccountLocked && (
                        <Box sx={{ mt: 1 }}>
                          <Link
                            component={RouterLink}
                            to="/forgot-password"
                            sx={{
                              color: "error.dark",
                              textDecoration: "underline",
                              fontWeight: 600,
                              "&:hover": {
                                color: "error.main",
                              },
                            }}
                          >
                            Restablecer contraseña ahora
                          </Link>
                        </Box>
                      )}
                    </Box>
                  </Alert>
                )}

                {/* Alert para mostrar éxito de login */}
                {success && (
                  <Alert
                    severity="success"
                    sx={{
                      mt: 2,
                      mb: 2,
                      borderRadius: 2,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      animation: "fadeIn 0.3s ease-in",
                      "& .MuiAlert-message": {
                        width: "100%",
                        textAlign: "center",
                      },
                      "& .MuiAlert-icon": {
                        fontSize: "1.2rem",
                      },
                      "@keyframes fadeIn": {
                        "0%": {
                          opacity: 0,
                          transform: "translateY(-10px)",
                        },
                        "100%": {
                          opacity: 1,
                          transform: "translateY(0)",
                        },
                      },
                    }}
                  >
                    ¡Inicio de sesión exitoso! Redirigiendo al dashboard...
                  </Alert>
                )}

                <Box sx={{ textAlign: "center", mt: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: { xs: 1.5, sm: 2 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    ¿Necesitas ayuda?
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: { xs: 2, sm: 3 },
                      flexWrap: "wrap",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: "center",
                    }}
                  >
                    <Link
                      component={RouterLink}
                      to="/forgot-password"
                      sx={{
                        color: "primary.main",
                        textDecoration: "none",
                        fontWeight: 500,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        transition: "all 0.3s ease",
                        "&:hover": {
                          color: "primary.dark",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      ¿Olvidó su contraseña?
                    </Link>
                    <Typography
                      variant="body2"
                      color="text.disabled"
                      sx={{
                        display: { xs: "none", sm: "block" },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      •
                    </Typography>
                    <Link
                      component={RouterLink}
                      to="/register"
                      sx={{
                        color: "primary.main",
                        textDecoration: "none",
                        fontWeight: 500,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        transition: "all 0.3s ease",
                        "&:hover": {
                          color: "primary.dark",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Crear cuenta
                    </Link>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{
              p: { xs: 2, sm: 3 },
              mt: { xs: 1, sm: 2 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            Plataforma de Capacitaciones en Seguridad y Salud en el Trabajo
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
