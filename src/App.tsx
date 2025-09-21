import { CssBaseline, Box } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ChangePassword from "./components/ChangePassword";
import ForgotPassword from "./components/ForgotPassword";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Register from "./components/Register";
import ResetPassword from "./components/ResetPassword";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { usePermissions } from "./hooks/usePermissions";

// General pages
import Absenteeism from "./pages/Absenteeism";
import AdminConfig from "./pages/AdminConfig";
import AdminDashboard from "./pages/AdminDashboard";
import AdminNotifications from "./pages/AdminNotifications";
import Attendance from "./pages/Attendance";
import Course from "./pages/Course";
import CourseDetail from "./pages/CourseDetail";
import Enrollment from "./pages/Enrollment";
import Evaluation from "./pages/Evaluation";
import EvaluationResults from "./pages/EvaluationResults";
import Report from "./pages/Report";
// import Session from './pages/Session'; // Componente eliminado - funcionalidad de sesiones removida

import Survey from "./pages/Survey";
import SurveyTabulation from "./pages/SurveyTabulation";
import UserProgress from "./pages/UserProgress";
import Certificate from "./pages/Certificate";
import Notification from "./pages/Notification";
import EmployeeCourseSurveys from "./pages/EmployeeCourseSurveys";
import OccupationalExam from "./pages/OccupationalExam";
import Seguimiento from "./pages/Seguimiento";
import Reinduction from "./pages/Reinduction";
import Suppliers from "./pages/Suppliers";

// Absenteeism components
import Audit from "./pages/Audit";
import Files from "./pages/Files";
import Profile from "./pages/Profile";
import RoleManagement from "./pages/RoleManagement";

// Dashboard pages
import TrainerDashboard from "./pages/TrainerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import User from "./pages/User";
import Worker from "./pages/Worker";
import WorkerDetail from "./pages/WorkerDetail";
import WorkerSearch from "./pages/WorkerSearch";
import { UserRole } from "./types";
import { checkPagePermission } from "./utils/pagePermissions";

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

// Componente para rutas protegidas
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiresUserManagement?: boolean;
  route?: string; // Nueva prop para especificar la ruta
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiresUserManagement = false,
  route,
}) => {
  const { user, loading } = useAuth();
  const permissions = usePermissions();
  const location = window.location.pathname;

  if (loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}>Cargando...</Box>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifica una ruta, usar el nuevo sistema de permisos
  if (route) {
    const hasPermission = checkPagePermission(route, user, permissions);
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
    return <>{children}</>;
  }

  // Verificación especial para gestión de usuarios (mantener compatibilidad)
  if (requiresUserManagement) {
    const userRole = user?.role || user?.rol;
    if (userRole === UserRole.ADMIN) {
      // Los admins siempre pueden gestionar usuarios
      return <>{children}</>;
    }
    if (userRole === UserRole.SUPERVISOR) {
      // Los supervisores necesitan permisos granulares
      if (!permissions.canUpdateUsers()) {
        return <Navigate to="/unauthorized" replace />;
      }
      return <>{children}</>;
    }
    // Otros roles no pueden acceder
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificación tradicional por roles (mantener compatibilidad)
  if (allowedRoles) {
    const userRole = user?.role || user?.rol;
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

// Componente principal de la aplicación
const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Cargando...
      </Box>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rutas públicas sin Layout */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />}
        />

        {/* Rutas protegidas con Layout */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout>
                <Routes>
                  {/* Ruta raíz */}
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />

                  {/* Dashboard redirect */}
                  <Route path="/dashboard" element={<DashboardRedirect />} />

                  {/* Rutas de administración */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute route="/admin/users">
                        <User />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/workers"
                    element={
                      <ProtectedRoute route="/admin/workers">
                        <Worker />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/workers/detail"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <WorkerSearch />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/workers/:workerId"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <WorkerDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/config"
                    element={
                      <ProtectedRoute route="/admin/config">
                        <AdminConfig />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/roles"
                    element={
                      <ProtectedRoute route="/admin/roles">
                        <RoleManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/suppliers"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <Suppliers />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de ausentismo */}
                  <Route
                    path="/admin/absenteeism"
                    element={
                      <ProtectedRoute route="/admin/absenteeism">
                        <Absenteeism />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de cursos */}
                  {/* Redirección de /courses a /admin/courses */}
                  <Route
                    path="/courses"
                    element={<Navigate to="/admin/courses" replace />}
                  />
                  <Route
                    path="/admin/courses"
                    element={
                      <ProtectedRoute route="/admin/courses">
                        <Course />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/enrollments"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "trainer", "supervisor"]}
                      >
                        <Enrollment />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/evaluations"
                    element={
                      <ProtectedRoute route="/admin/evaluations">
                        <Evaluation />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/evaluation-results"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "trainer"]}>
                        <EvaluationResults />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/surveys"
                    element={
                      <ProtectedRoute route="/admin/surveys">
                        <Survey />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/survey-tabulation"
                    element={
                      <ProtectedRoute route="/admin/survey-tabulation">
                        <SurveyTabulation />
                      </ProtectedRoute>
                    }
                  />
                  {/* Ruta de sesiones eliminada - funcionalidad removida del sistema */}

                  {/* Rutas de progreso y seguimiento */}
                  <Route
                    path="/admin/progress"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "trainer", "supervisor"]}
                      >
                        <UserProgress />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/user-progress"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "trainer", "supervisor"]}
                      >
                        <UserProgress />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/attendance"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "trainer", "supervisor"]}
                      >
                        <Attendance />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de salud ocupacional */}
                  <Route
                    path="/admin/occupational-exams"
                    element={
                      <ProtectedRoute route="/admin/occupational-exams">
                        <OccupationalExam />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/seguimientos"
                    element={
                      <ProtectedRoute route="/admin/seguimientos">
                        <Seguimiento />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/reinduction"
                    element={
                      <ProtectedRoute route="/admin/reinduction">
                        <Reinduction />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de absenteeism */}
                  <Route
                    path="/admin/absenteeism"
                    element={
                      <ProtectedRoute route="/admin/absenteeism">
                        <Absenteeism />
                      </ProtectedRoute>
                    }
                  />


                  {/* Rutas de certificados y notificaciones */}
                  <Route
                    path="/admin/certificates"
                    element={
                      <ProtectedRoute route="/admin/certificates">
                        <Certificate />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/notifications"
                    element={
                      <ProtectedRoute route="/admin/notifications">
                        <Notification />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/notification-acknowledgment"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminNotifications />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de reportes y auditoría */}
                  <Route
                    path="/admin/reports"
                    element={
                      <ProtectedRoute route="/admin/reports">
                        <Report />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/audit"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Audit />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/files"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "trainer"]}>
                        <Files />
                      </ProtectedRoute>
                    }
                  />

                  {/* Dashboards específicos */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/trainer/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["trainer"]}>
                        <TrainerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employee/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <EmployeeDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/supervisor/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["supervisor"]}>
                        <SupervisorDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Ruta de perfil - accesible para todos los usuarios autenticados */}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/change-password" element={<ChangePassword />} />

                  {/* Rutas específicas para empleados */}
                  <Route
                    path="/employee/courses"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <Course />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employee/courses/:id"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <CourseDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employee/courses/:id/surveys"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <EmployeeCourseSurveys />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employee/courses/:id/evaluation"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <Evaluation />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employee/evaluations"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <Evaluation />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employee/surveys"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <Survey />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employee/certificates"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <Certificate />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employee/attendance"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <Attendance />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/supervisor/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["supervisor"]}>
                        <SupervisorDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Ruta para usuarios no autorizados */}
                  <Route
                    path="/unauthorized"
                    element={
                      <Box sx={{ p: 4, textAlign: "center" }}>
                        <h2>No autorizado</h2>
                        <p>No tienes permisos para acceder a esta página.</p>
                      </Box>
                    }
                  />

                  {/* Ruta por defecto */}
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

// Componente para redirigir al dashboard correcto según el rol
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Usar user.role en lugar de user.rol para consistencia
  const userRole = user.role || user.rol;
  
  switch (userRole) {
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "trainer":
      return <Navigate to="/trainer/dashboard" replace />;
    case "employee":
      return <Navigate to="/employee/dashboard" replace />;
    case "supervisor":
      return <Navigate to="/supervisor/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
