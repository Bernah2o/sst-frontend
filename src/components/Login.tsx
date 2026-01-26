import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Paper,
  Typography,
  Alert,
  Box,
  InputAdornment,
  IconButton,
  CircularProgress,
  useTheme,
  alpha,
  Link,
  CssBaseline,
  Chip,
} from "@mui/material";
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  HealthAndSafety,
  Shield,
  VerifiedUser,
  Security,
} from "@mui/icons-material";
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
  const { login } = useAuth();
  const theme = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (success) {
      setSuccess(false);
    }
    if (isAccountLocked) {
      setIsAccountLocked(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await login(formData);

      if (response && response.access_token) {
        setLoading(false);
        setSuccess(true);
        setIsRedirecting(true);

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 3000);
      }
    } catch (err: any) {
      setLoading(false);

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
              data.detail ||
              "Su cuenta ha sido bloqueada por múltiples intentos de inicio de sesión fallidos. Para desbloquear su cuenta, debe restablecer su contraseña utilizando el enlace 'Olvidé mi contraseña'.";
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

      setError(errorMessage);
    }
  };

  const features = [
    { icon: <HealthAndSafety sx={{ fontSize: 18 }} />, label: "Gestión SST" },
    { icon: <Shield sx={{ fontSize: 18 }} />, label: "Cumplimiento Legal" },
    { icon: <VerifiedUser sx={{ fontSize: 18 }} />, label: "Certificaciones" },
    { icon: <Security sx={{ fontSize: 18 }} />, label: "Datos Seguros" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, #0d47a1 0%, #1565c0 40%, #1976d2 70%, #42a5f5 100%)`,
        position: "relative",
        overflow: "hidden",
        p: 2,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        },
      }}
    >
      <CssBaseline />

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Header con gradiente */}
          <Box
            sx={{
              background: `linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)`,
              p: 4,
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #4caf50, #8bc34a, #cddc39)",
              },
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                width: 90,
                height: 90,
                mx: "auto",
                mb: 2,
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <img
                src="/logo.png"
                alt="Logo SST"
                style={{
                  width: "75%",
                  height: "75%",
                  objectFit: "contain",
                }}
              />
            </Box>

            <Typography
              variant="h4"
              fontWeight="700"
              color="white"
              gutterBottom
              sx={{ textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}
            >
              Plataforma SST
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "rgba(255, 255, 255, 0.85)", mb: 2 }}
            >
              Sistema Integral de Gestión en Seguridad y Salud en el Trabajo
            </Typography>

            {/* Feature chips */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 1,
              }}
            >
              {features.map((feature, index) => (
                <Chip
                  key={index}
                  icon={feature.icon}
                  label={feature.label}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    color: "white",
                    fontSize: "0.7rem",
                    height: 28,
                    "& .MuiChip-icon": {
                      color: "#90caf9",
                    },
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.25)",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Formulario */}
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h5"
              fontWeight="600"
              color="text.primary"
              gutterBottom
              sx={{ textAlign: "center" }}
            >
              Iniciar Sesión
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", mb: 3 }}
            >
              Ingresa tus credenciales para acceder
            </Typography>

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
                      <Email sx={{ color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "#f1f5f9",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "#fff",
                      boxShadow: `0 0 0 3px ${alpha(
                        theme.palette.primary.main,
                        0.12
                      )}`,
                    },
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
                      <Lock sx={{ color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={loading || isRedirecting}
                        sx={{ color: "text.disabled" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "#f1f5f9",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "#fff",
                      boxShadow: `0 0 0 3px ${alpha(
                        theme.palette.primary.main,
                        0.12
                      )}`,
                    },
                  },
                }}
              />

              <Box sx={{ textAlign: "right", mb: 2.5 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    color: "primary.main",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || isRedirecting}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: "1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  background: `linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)`,
                  boxShadow: "0 4px 14px rgba(21, 101, 192, 0.4)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(21, 101, 192, 0.5)",
                    transform: "translateY(-1px)",
                  },
                  "&:disabled": {
                    background: "#e0e0e0",
                    boxShadow: "none",
                  },
                }}
              >
                {loading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={20} sx={{ color: "inherit" }} />
                    Verificando...
                  </Box>
                ) : isRedirecting ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={20} sx={{ color: "inherit" }} />
                    Accediendo...
                  </Box>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>

              {/* Alertas */}
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    animation: "slideIn 0.3s ease",
                    "@keyframes slideIn": {
                      "0%": { opacity: 0, transform: "translateY(-10px)" },
                      "100%": { opacity: 1, transform: "translateY(0)" },
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
                          }}
                        >
                          Restablecer contraseña
                        </Link>
                      </Box>
                    )}
                  </Box>
                </Alert>
              )}

              {success && (
                <Alert
                  severity="success"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    animation: "slideIn 0.3s ease",
                    "@keyframes slideIn": {
                      "0%": { opacity: 0, transform: "translateY(-10px)" },
                      "100%": { opacity: 1, transform: "translateY(0)" },
                    },
                  }}
                >
                  ¡Inicio de sesión exitoso! Accediendo...
                </Alert>
              )}

              {/* Registro */}
              <Box
                sx={{
                  textAlign: "center",
                  mt: 3,
                  pt: 2.5,
                  borderTop: "1px solid #e0e0e0",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  ¿No tienes una cuenta?{" "}
                  <Link
                    component={RouterLink}
                    to="/register"
                    sx={{
                      color: "primary.main",
                      textDecoration: "none",
                      fontWeight: 600,
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Regístrate aquí
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 2,
              textAlign: "center",
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="caption" color="text.disabled">
              Decreto 1072 de 2015 • Resolución 0312 de 2019
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
