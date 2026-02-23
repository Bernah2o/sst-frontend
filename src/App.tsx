import { CssBaseline, Box } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
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
import HomeworkAssessment from "./pages/HomeworkAssessment";
import HomeworkAssessmentAdmin from "./pages/HomeworkAssessmentAdmin";
import HomeworkAssessmentDashboard from "./pages/HomeworkAssessmentDashboard";
import Suppliers from "./pages/Suppliers";
import SystemSettings from "./pages/SystemSettings";
import Contractors from "./pages/Contractors";
import ContractorDetail from "./pages/ContractorDetail";
import ContractorDocuments from "./pages/ContractorDocuments";
import ContractorForm from "./pages/ContractorForm";

// Committee components
import CommitteeList from "./pages/CommitteeList";
import CommitteeDetail from "./pages/CommitteeDetail";
import CommitteeDashboard from "./pages/CommitteeDashboard";
import CommitteeForm from "./pages/CommitteeForm";
import ActivityManagement from "./pages/ActivityManagement";
import DocumentManagement from "./pages/DocumentManagement";
import MeetingManagement from "./pages/MeetingManagement";
import MeetingAttendancePage from "./pages/MeetingAttendance";
import MemberManagement from "./pages/MemberManagement";
import CandidateVotingAdmin from "./pages/CandidateVotingAdmin";
import CandidateVotingForm from "./pages/CandidateVotingForm";
import CandidateVoting from "./pages/CandidateVoting";

// Absenteeism components
import Audit from "./pages/Audit";
import Files from "./pages/Files";
import Profile from "./pages/Profile";
import RoleManagement from "./pages/RoleManagement";

// Dashboard pages
import TrainerDashboard from "./pages/TrainerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeVacations from "./pages/EmployeeVacations";
import EmployeeVotings from "./pages/EmployeeVotings";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import User from "./pages/User";
import Worker from "./pages/Worker";
import WorkerDetail from "./pages/WorkerDetail";
import WorkerSearch from "./pages/WorkerSearch";
import WorkerVacations from "./pages/WorkerVacations";
import VacationsManagement from "./pages/VacationsManagement";

import ProfesiogramaCatalogos from "./pages/ProfesiogramaCatalogos";
import ProfesiogramasAdmin from "./pages/ProfesiogramasAdmin";
import ProfesiogramasCargo from "./pages/ProfesiogramasCargo";
import WorkerProfesiograma from "./pages/WorkerProfesiograma";
import WorkerProfesiogramaSearch from "./pages/WorkerProfesiogramaSearch";
import RestriccionesMedicas from "./pages/RestriccionesMedicas";
import MatrizLegalDashboard from "./pages/MatrizLegal/MatrizLegalDashboard";
import EmpresaList from "./pages/MatrizLegal/EmpresaList";
import SectorEconomicoList from "./pages/MatrizLegal/SectorEconomicoList";
import MatrizLegalImport from "./pages/MatrizLegal/MatrizLegalImport";
import MatrizLegalNormas from "./pages/MatrizLegal/MatrizLegalNormas";
import MatrizLegalEmpresa from "./pages/MatrizLegal/MatrizLegalEmpresa";
import MasterDocuments from "./pages/MasterDocuments";
import InteractiveLessons from "./pages/InteractiveLessons";
import { LessonBuilder, LessonViewer } from "./components/interactive-lessons";
import PlanTrabajoAnual from "./pages/PlanTrabajoAnual";
import PlanTrabajoAnualDetail from "./pages/PlanTrabajoAnualDetail";
import PresupuestoSST from "./pages/PresupuestoSST";
import PresupuestoSSTDetail from "./pages/PresupuestoSSTDetail";
import ProgramaCapacitaciones from "./pages/ProgramaCapacitaciones";
import ProgramaCapacitacionesDetail from "./pages/ProgramaCapacitacionesDetail";
import EstandaresMinimos from "./pages/EstandaresMinimos";
import EstandaresMinimosDetalle from "./pages/EstandaresMinimosDetalle";
import CronogramaPyp from "./pages/CronogramaPyp";
import CronogramaPypDetail from "./pages/CronogramaPypDetail";
import { UserRole } from "./types";
import { checkPagePermission, PAGE_PERMISSIONS } from "./utils/pagePermissions";

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
  const location = useLocation();

  if (loading || permissions.loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}>Cargando...</Box>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin siempre tiene acceso
  const userRole = user?.role || user?.rol;
  if (userRole === UserRole.ADMIN) {
    return <>{children}</>;
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
    if (userRole === UserRole.SUPERVISOR) {
      if (!permissions.canUpdateUsers()) {
        return <Navigate to="/unauthorized" replace />;
      }
      return <>{children}</>;
    }
    // Usuarios con rol personalizado: verificar permisos
    if (user.custom_role_id && permissions.canUpdateUsers()) {
      return <>{children}</>;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificación tradicional por roles (mantener compatibilidad)
  if (allowedRoles) {
    if (allowedRoles.includes(userRole)) {
      return <>{children}</>;
    }

    // Si el usuario tiene rol personalizado, verificar permisos vía pagePermissions
    // Solo si existe una configuración de permisos para esta ruta (conservador)
    if (user.custom_role_id) {
      const currentPath = location.pathname;
      const pageConfig = PAGE_PERMISSIONS.find((p) => {
        const routePattern = p.route.replace(/:[^/]+/g, "[^/]+");
        const regex = new RegExp(`^${routePattern}$`);
        return regex.test(currentPath);
      });
      if (pageConfig) {
        const hasPermission = checkPagePermission(
          currentPath,
          user,
          permissions,
        );
        if (hasPermission) {
          return <>{children}</>;
        }
      }
    }

    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Componente especial para la ruta de login que evita redirecciones automáticas
const LoginRoute: React.FC = () => {
  const { loading } = useAuth();

  // Si está cargando, mostrar el componente de login (evita parpadeos)
  if (loading) {
    return <Login />;
  }

  // Solo mostrar el componente de login sin redirecciones automáticas
  return <Login />;
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
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />
          }
        />
        <Route
          path="/reset-password"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />
          }
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
                      <ProtectedRoute route="/admin/workers/detail">
                        <WorkerSearch />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/workers/vacations"
                    element={
                      <ProtectedRoute route="/admin/workers/vacations">
                        <VacationsManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/workers/:workerId"
                    element={
                      <ProtectedRoute route="/admin/workers/:workerId">
                        <WorkerDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/workers/:workerId/vacations"
                    element={
                      <ProtectedRoute route="/admin/workers/:workerId/vacations">
                        <WorkerVacations />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de contratistas */}
                  <Route
                    path="/admin/contractors"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <Contractors />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/contractors/new"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <ContractorForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/contractors/:id/documents"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <ContractorDocuments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/contractors/:id"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <ContractorDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/contractors/edit/:id"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <ContractorForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/contractors/documents"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <ContractorDocuments />
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
                      <ProtectedRoute route="/admin/suppliers">
                        <Suppliers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/system-settings"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <SystemSettings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de comités */}
                  <Route
                    path="/admin/committees"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <CommitteeList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/committees/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <CommitteeDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/committees/:id"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <CommitteeDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/committees/new"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <CommitteeForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/committees/:id/edit"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <CommitteeForm />
                      </ProtectedRoute>
                    }
                  />
                  {/* Rutas específicas para comités individuales */}
                  <Route
                    path="/admin/committees/:id/meetings/new"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <MeetingManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/committees/:id/activities/new"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <ActivityManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/committees/:id/documents/new"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <DocumentManagement />
                      </ProtectedRoute>
                    }
                  />
                  {/* Rutas genéricas para gestión de comités */}
                  <Route
                    path="/admin/committees/meetings"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <MeetingManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/meetings/:meetingId/attendance"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <MeetingAttendancePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/committees/activities"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <ActivityManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/committees/documents"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <DocumentManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/committees/:id/members"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <MemberManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de votaciones de candidatos */}
                  <Route
                    path="/admin/candidate-votings"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <CandidateVotingAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/candidate-votings/new"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <CandidateVotingForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/candidate-votings/:id/edit"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <CandidateVotingForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/candidate-voting"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "supervisor", "employee"]}
                      >
                        <CandidateVoting />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de Documentos Maestros */}
                  <Route
                    path="/master-documents"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <MasterDocuments />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de Profesiograma */}
                  <Route
                    path="/profesiogramas/catalogos"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <ProfesiogramaCatalogos />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profesiogramas/cargo"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <ProfesiogramasCargo />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profesiogramas/admin"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <ProfesiogramasAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profesiogramas/trabajador"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <WorkerProfesiogramaSearch />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/worker/:workerId/profesiograma"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin", "supervisor", "employee"]}
                      >
                        <WorkerProfesiograma />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profesiogramas/restricciones"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <RestriccionesMedicas />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas de Matriz Legal */}
                  <Route
                    path="/admin/matriz-legal"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <MatrizLegalDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/matriz-legal/normas"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <MatrizLegalNormas />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/matriz-legal/empresas/:empresaId"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <MatrizLegalEmpresa />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/matriz-legal/empresas"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <EmpresaList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/matriz-legal/sectores"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <SectorEconomicoList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/matriz-legal/importar"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <MatrizLegalImport />
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
                    path="/admin/interactive-lessons"
                    element={
                      <ProtectedRoute route="/admin/interactive-lessons">
                        <InteractiveLessons />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/plan-trabajo-anual"
                    element={
                      <ProtectedRoute route="/admin/plan-trabajo-anual">
                        <PlanTrabajoAnual />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/plan-trabajo-anual/:planId"
                    element={
                      <ProtectedRoute route="/admin/plan-trabajo-anual/:planId">
                        <PlanTrabajoAnualDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/presupuesto-sst"
                    element={
                      <ProtectedRoute route="/admin/presupuesto-sst">
                        <PresupuestoSST />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/presupuesto-sst/:presupuestoId"
                    element={
                      <ProtectedRoute route="/admin/presupuesto-sst/:presupuestoId">
                        <PresupuestoSSTDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/programa-capacitaciones"
                    element={
                      <ProtectedRoute route="/admin/programa-capacitaciones">
                        <ProgramaCapacitaciones />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/programa-capacitaciones/:programaId"
                    element={
                      <ProtectedRoute route="/admin/programa-capacitaciones/:programaId">
                        <ProgramaCapacitacionesDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/estandares-minimos"
                    element={
                      <ProtectedRoute route="/admin/estandares-minimos">
                        <EstandaresMinimos />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/estandares-minimos/:evalId"
                    element={
                      <ProtectedRoute route="/admin/estandares-minimos/:evalId">
                        <EstandaresMinimosDetalle />
                      </ProtectedRoute>
                    }
                  />
                  {/* Rutas de Cronograma PYP */}
                  <Route
                    path="/admin/cronograma-pyp"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <CronogramaPyp />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/cronograma-pyp/:planId"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                        <CronogramaPypDetail />
                      </ProtectedRoute>
                    }
                  />
                  {/* Rutas de lecciones interactivas - Builder */}
                  <Route
                    path="/admin/module/:moduleId/lesson/new"
                    element={
                      <ProtectedRoute route="/admin/module/:moduleId/lesson/new">
                        <LessonBuilder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/lesson/:lessonId/edit"
                    element={
                      <ProtectedRoute route="/admin/lesson/:lessonId/edit">
                        <LessonBuilder />
                      </ProtectedRoute>
                    }
                  />
                  {/* Admin/Trainer preview route for interactive lessons */}
                  <Route
                    path="/admin/lesson/:lessonId/preview"
                    element={
                      <ProtectedRoute route="/admin/lesson/:lessonId/preview">
                        <LessonViewer isPreview={true} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/enrollments"
                    element={
                      <ProtectedRoute route="/admin/enrollments">
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
                      <ProtectedRoute route="/admin/evaluation-results">
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
                      <ProtectedRoute route="/admin/progress">
                        <UserProgress />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/user-progress"
                    element={
                      <ProtectedRoute route="/admin/user-progress">
                        <UserProgress />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/attendance"
                    element={
                      <ProtectedRoute route="/admin/attendance">
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
                  <Route
                    path="/admin/homework-assessments"
                    element={
                      <ProtectedRoute route="/admin/homework-assessments">
                        <HomeworkAssessmentAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/homework-assessments/dashboard"
                    element={
                      <ProtectedRoute route="/admin/homework-assessments">
                        <HomeworkAssessmentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/homework-assessments/:id"
                    element={
                      <ProtectedRoute route="/admin/homework-assessments">
                        <HomeworkAssessment />
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
                      <ProtectedRoute route="/admin/audit">
                        <Audit />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/files"
                    element={
                      <ProtectedRoute route="/admin/files">
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
                  {/* Ruta de lecciones interactivas - Viewer */}
                  <Route
                    path="/employee/lesson/:lessonId"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <LessonViewer />
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
                    path="/employee/vacations"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <EmployeeVacations />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employee/votings"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <EmployeeVotings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employee/homework-assessments"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <HomeworkAssessment />
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
  const { user, loading } = useAuth();

  // Mostrar loading mientras se verifica el usuario
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
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
