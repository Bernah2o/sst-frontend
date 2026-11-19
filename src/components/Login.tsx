import React, { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  InputAdornment,
  IconButton,
  CircularProgress,
  Link,
} from "@mui/material";
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { brand, condensed } from "../theme";

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

  const busy = loading || isRedirecting;

  const capsSx = {
    fontFamily: condensed,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  };

  // Módulos reales de la plataforma, como itinerario del SG-SST
  const modules = [
    ["Planear", "Estándares mínimos · Plan anual · Matriz legal"],
    ["Hacer", "Capacitaciones · Comités · Exámenes · Inspecciones"],
    ["Verificar", "Auditoría · Indicadores · Ausentismo"],
    ["Actuar", "Planes de acción · Seguimiento"],
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 5fr) minmax(0, 4fr)" },
        gridTemplateRows: { xs: "auto 1fr", md: "1fr" },
        backgroundColor: brand.stock,
      }}
    >
      {/* ── Forro azul: la plataforma ── */}
      <Box
        component="section"
        aria-label="Plataforma SST"
        sx={{
          backgroundColor: brand.shell,
          color: "#fff",
          px: { xs: 3, sm: 6, lg: 9 },
          py: { xs: 4, md: 7 },
          display: "flex",
          flexDirection: "column",
          gap: { xs: 3, md: 5 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "3px",
              backgroundColor: brand.coupon,
              display: "grid",
              placeItems: "center",
              flex: "none",
            }}
          >
            <Box component="img" src="/logo.png" alt="Logo" sx={{ width: 34, height: 34, objectFit: "contain" }} />
          </Box>
          <Typography sx={{ ...capsSx, fontSize: "0.95rem", color: brand.shellText }}>
            Sistema de Gestión SST
          </Typography>
        </Box>

        <Box sx={{ my: { md: "auto" } }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: condensed,
              fontWeight: 700,
              textTransform: "uppercase",
              lineHeight: 0.92,
              letterSpacing: "0.005em",
              fontSize: { xs: "3rem", sm: "4.2rem", lg: "5.4rem" },
            }}
          >
            Plataforma
            <br />
            SST
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 440, color: brand.shellText, fontSize: { xs: "1rem", md: "1.1rem" } }}>
            Sistema Integral de Gestión en Seguridad y Salud en el Trabajo
          </Typography>

          <Box
            component="ol"
            sx={{
              display: { xs: "none", md: "block" },
              listStyle: "none",
              p: 0,
              mt: 5,
              maxWidth: 520,
              borderTop: "1px solid rgba(255,255,255,0.22)",
            }}
          >
            {modules.map(([phase, detail], i) => (
              <Box
                component="li"
                key={phase}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "36px 110px 1fr",
                  alignItems: "baseline",
                  py: 1.25,
                  borderBottom: "1px dashed rgba(255,255,255,0.22)",
                }}
              >
                <Typography sx={{ ...capsSx, color: "#B9A6E0", fontVariantNumeric: "tabular-nums" }}>
                  {String(i + 1).padStart(2, "0")}
                </Typography>
                <Typography sx={{ ...capsSx, fontSize: "1.05rem", color: "#fff" }}>{phase}</Typography>
                <Typography sx={{ fontSize: "0.9rem", color: brand.shellText }}>{detail}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography sx={{ ...capsSx, fontSize: "0.8rem", color: "rgba(201,211,234,0.75)", display: { xs: "none", md: "block" } }}>
          Decreto 1072 de 2015 · Resolución 0312 de 2019
        </Typography>
      </Box>

      {/* ── Cupón de acceso ── */}
      <Box
        component="main"
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "center",
          px: { xs: 2, sm: 4 },
          py: { xs: 3, md: 6 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 440,
            backgroundColor: brand.coupon,
            border: `1px solid ${brand.rule}`,
            borderRadius: "4px",
            position: "relative",
            boxShadow: "0 10px 30px rgba(17, 26, 46, 0.08)",
          }}
        >
          {/* Cabecera del cupón */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 3,
              py: 1.25,
              backgroundColor: brand.shell,
              color: "#fff",
              borderRadius: "3px 3px 0 0",
            }}
          >
            <Typography sx={{ ...capsSx, fontSize: "0.9rem" }}>Pase de acceso</Typography>
            <Typography sx={{ ...capsSx, fontSize: "0.9rem", color: brand.shellText }}>SG-SST</Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate={false} sx={{ px: { xs: 3, sm: 4 }, pt: 3.5, pb: 3 }}>
            <Typography component="h2" sx={{ fontFamily: condensed, fontWeight: 700, fontSize: "2rem", textTransform: "uppercase", letterSpacing: "0.01em", lineHeight: 1 }}>
              Iniciar sesión
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, mb: 3 }}>
              Ingresa tus credenciales para acceder
            </Typography>

            <TextField
              required
              fullWidth
              id="email"
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={busy}
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "text.secondary" }} fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={busy}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "text.secondary" }} fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      disabled={busy}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ textAlign: "right", mt: 1.25, mb: 3 }}>
              <Link component={RouterLink} to="/forgot-password" sx={{ fontWeight: 600, fontSize: "0.9rem", color: "secondary.main" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

            <Button type="submit" fullWidth variant="contained" size="large" disabled={busy} sx={{ minHeight: 50, fontSize: "1.1rem" }}>
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CircularProgress size={18} sx={{ color: "inherit" }} />
                  Verificando…
                </Box>
              ) : isRedirecting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CircularProgress size={18} sx={{ color: "inherit" }} />
                  Accediendo…
                </Box>
              ) : (
                "Iniciar sesión"
              )}
            </Button>

            {error && (
              <Alert
                severity="error"
                role="alert"
                sx={{ mt: 2 }}
                onClose={() => {
                  setError("");
                  setIsAccountLocked(false);
                }}
              >
                {error}
                {isAccountLocked && (
                  <Box sx={{ mt: 1 }}>
                    <Link component={RouterLink} to="/forgot-password" sx={{ color: "error.dark", fontWeight: 700 }}>
                      Restablecer contraseña
                    </Link>
                  </Box>
                )}
              </Alert>
            )}

            {success && (
              <Alert severity="success" role="status" sx={{ mt: 2 }}>
                ¡Inicio de sesión exitoso! Accediendo…
              </Alert>
            )}
          </Box>

          {/* Perforación y talón */}
          <Box
            aria-hidden
            sx={{
              position: "relative",
              borderTop: `2px dashed ${brand.rule}`,
              mx: 2.5,
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                top: -12,
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: brand.stock,
                border: `1px solid ${brand.rule}`,
              },
              "&::before": { left: -32, clipPath: "inset(0 0 0 50%)" },
              "&::after": { right: -32, clipPath: "inset(0 50% 0 0)" },
            }}
          />
          <Box sx={{ px: { xs: 3, sm: 4 }, py: 2, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ ...capsSx, fontSize: "0.72rem", color: "text.secondary" }}>Marco legal</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: brand.carbon }}>Decreto 1072 · Res. 0312</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ ...capsSx, fontSize: "0.72rem", color: "text.secondary" }}>Acceso</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: brand.carbon }}>Según tu rol</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
