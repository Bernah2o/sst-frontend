import {
  Dashboard,
  People,
  School,
  Assignment,
  Assessment,
  CardMembership,
  Notifications,
  Settings,
  ExpandLess,
  ExpandMore,
  Person,
  Work,
  Timeline,
  BarChart,
  Security,
  MedicalServices,
  Quiz,
  Folder,
  AdminPanelSettings,
  SupervisorAccount,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Schedule,
  Groups,
  Description,
  Healing,
  Poll,
  Refresh,
  TrendingUp,
  AccessibilityNew,
  Psychology,
  ManageAccounts,
  PersonSearch,
  BeachAccess,
  HowToVote,
  Business,
  Tune,
  Gavel,
  Category,
  Apartment,
  Slideshow,
  EventNote,
  AccountBalance,
  FactCheck,
  VerifiedUser,
  CloudUpload,
} from "@mui/icons-material";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { brand, condensed } from "../theme";

const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 64;

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ open, collapsed, onToggle }) => {
  const { user } = useAuth();
  const {
    canUpdateUsers,
    canViewCoursesPage,
    canUpdateCourses,
    canViewEvaluationsPage,
    canViewSurveysPage,
    canViewAttendancePage,
    canUpdateAttendance,
    canViewWorkersPage,
    canUpdateWorkers,
    canViewCertificatesPage,
    canViewReportsPage,
    canViewNotificationsPage,
    canViewOccupationalExamPage,
    canViewSeguimientoPage,
    canViewAdminConfigPage,
    canViewReinductionPage,
    canViewSuppliersPage,
    canViewEnrollmentPage,
    canViewProgressPage,
    canViewAuditPage,
    canViewAbsenteeismPage,
    canViewCommitteePage,
    canViewCommitteeDashboardPage,
    canViewCommitteeMeetingsPage,
    canViewCommitteeActivitiesPage,
    canViewCommitteeDocumentsPage,
    canViewCommitteeActasPage,
    canViewCommitteeVotingPage,
  } = usePermissions();

  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Persistir estado de expansión en localStorage
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("sidebar-expanded-items");
      return saved ? JSON.parse(saved) : ["dashboard"];
    } catch (error) {
      console.warn("Error loading sidebar state from localStorage:", error);
      return ["dashboard"];
    }
  });

  // Guardar estado de expansión cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(
        "sidebar-expanded-items",
        JSON.stringify(expandedItems),
      );
    } catch (error) {
      console.warn("Error saving sidebar state to localStorage:", error);
    }
  }, [expandedItems]);

  // Listener para refrescar el sidebar cuando se actualicen permisos
  useEffect(() => {
    const handleSidebarRefresh = () => {
      // Forzar re-render limpiando y recargando el estado
      setExpandedItems((prev) => [...prev]);
    };

    window.addEventListener("sidebar-refresh", handleSidebarRefresh);

    return () => {
      window.removeEventListener("sidebar-refresh", handleSidebarRefresh);
    };
  }, []);

  const handleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const menuItems: MenuItem[] = React.useMemo(
    () => [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <Dashboard />,
        children: [
          {
            id: "admin-dashboard",
            label: "Panel Administrativo",
            icon: <AdminPanelSettings />,
            path: "/admin/dashboard",
            roles: ["admin"],
          },
          {
            id: "trainer-dashboard",
            label: "Panel Entrenador",
            icon: <SupervisorAccount />,
            path: "/trainer/dashboard",
            roles: ["trainer"],
          },
          {
            id: "supervisor-dashboard",
            label: "Panel Supervisor",
            icon: <SupervisorAccount />,
            path: "/supervisor/dashboard",
            roles: ["supervisor"],
          },
          {
            id: "employee-dashboard",
            label: "Panel Empleado",
            icon: <Person />,
            path: "/employee/dashboard",
            roles: ["employee"],
          },
        ],
      },
      {
        id: "employee-courses",
        label: "Mis Cursos",
        icon: <School />,
        path: "/employee/courses",
        roles: ["employee"],
      },
      {
        id: "employee-surveys",
        label: "Mis Encuestas",
        icon: <Poll />,
        path: "/employee/surveys",
        roles: ["employee"],
      },
      {
        id: "employee-evaluations",
        label: "Mis Evaluaciones",
        icon: <Quiz />,
        path: "/employee/evaluations",
        roles: ["employee"],
      },

      {
        id: "employee-attendance",
        label: "Mi Asistencia",
        icon: <Schedule />,
        path: "/employee/attendance",
        roles: ["employee"],
      },
      {
        id: "employee-homework-assessments",
        label: "Autoevaluación Trabajo en Casa",
        icon: <Assessment />,
        path: "/employee/homework-assessments",
        roles: ["employee"],
      },

      {
        id: "employee-ergonomic-self-inspections",
        label: "Autoinspección Puesto Ergonómico",
        icon: <Assessment />,
        path: "/employee/ergonomic-self-inspections",
        roles: ["employee"],
      },

      {
        id: "employee-certificates",
        label: "Mis Certificados",
        icon: <CardMembership />,
        path: "/employee/certificates",
        roles: ["employee"],
      },
      {
        id: "employee-vacations",
        label: "Mis Vacaciones",
        icon: <BeachAccess />,
        path: "/employee/vacations",
        roles: ["employee"],
      },
      {
        id: "employee-votings",
        label: "Mis Votaciones",
        icon: <HowToVote />,
        path: "/employee/votings",
        roles: ["employee"],
      },
      {
        id: "worker-management",
        label: "Gestión de Trabajadores",
        icon: <ManageAccounts />,
        children: [
          {
            id: "workers",
            label: "Trabajadores",
            icon: <Work />,
            path: "/admin/workers",
            roles: ["admin", "supervisor"],
          },
          {
            id: "worker-detail",
            label: "Consulta Individual",
            icon: <PersonSearch />,
            path: "/admin/workers/detail",
            roles: ["admin", "supervisor"],
          },
          {
            id: "worker-vacations",
            label: "Gestión de Vacaciones",
            icon: <BeachAccess />,
            path: "/admin/workers/vacations",
            roles: ["admin", "supervisor"],
          },
        ],
        roles: ["admin", "supervisor"],
      },
      {
        id: "contractor-management",
        label: "Gestión de Contratistas",
        icon: <Business />,
        children: [
          {
            id: "contractors",
            label: "Contratistas",
            icon: <Business />,
            path: "/admin/contractors",
            roles: ["admin", "supervisor"],
          },
          {
            id: "contractor-documents",
            label: "Documentos",
            icon: <Description />,
            path: "/admin/contractors/documents",
            roles: ["admin", "supervisor"],
          },
        ],
        roles: ["admin", "supervisor"],
      },
      {
        id: "courses",
        label: "Gestión de Cursos",
        icon: <School />,
        children: [
          {
            id: "courses-list",
            label: "Cursos",
            icon: <Folder />,
            path: "/admin/courses",
            roles: ["admin", "trainer"],
          },
          {
            id: "enrollments",
            label: "Inscripciones",
            icon: <Assignment />,
            path: "/admin/enrollments",
            roles: ["admin", "trainer", "supervisor"],
          },
          {
            id: "user-progress",
            label: "Progreso Cursos",
            icon: <TrendingUp />,
            path: "/admin/user-progress",
            roles: ["admin", "trainer", "supervisor"],
          },
          {
            id: "reinduction",
            label: "Reinducciones",
            icon: <Refresh />,
            path: "/admin/reinduction",
            roles: ["admin"],
          },
          {
            id: "interactive-lessons",
            label: "Lecciones Interactivas",
            icon: <Slideshow />,
            path: "/admin/interactive-lessons",
            roles: ["admin", "trainer"],
          },
        ],
        roles: ["admin", "trainer", "supervisor"],
      },
      {
        id: "evaluations",
        label: "Evaluaciones y Encuestas",
        icon: <Assessment />,
        children: [
          {
            id: "evaluations-list",
            label: "Evaluaciones",
            icon: <Quiz />,
            path: "/admin/evaluations",
            roles: ["admin", "trainer"],
          },
          {
            id: "evaluation-results",
            label: "Resultados de Evaluaciones",
            icon: <BarChart />,
            path: "/admin/evaluation-results",
            roles: ["admin", "trainer"],
          },
          {
            id: "surveys",
            label: "Encuestas",
            icon: <Poll />,
            path: "/admin/surveys",
            roles: ["admin", "trainer"],
          },
          {
            id: "survey-tabulation",
            label: "Tabulación de Encuestas",
            icon: <TrendingUp />,
            path: "/admin/survey-tabulation",
            roles: ["admin"],
          },
          {
            id: "nordico-tabulation",
            label: "Tabulación Nórdico",
            icon: <AccessibilityNew />,
            path: "/admin/nordico-tabulation",
            roles: ["admin"],
          },
          {
            id: "burnout-tabulation",
            label: "Tabulación Burnout",
            icon: <Psychology />,
            path: "/admin/burnout-tabulation",
            roles: ["admin"],
          },
          {
            id: "certificates",
            label: "Certificados",
            icon: <CardMembership />,
            path: "/admin/certificates",
            roles: ["admin", "trainer", "supervisor"],
          },
          {
            id: "reports",
            label: "Reportes",
            icon: <Description />,
            path: "/admin/reports",
            roles: ["admin"],
          },
          {
            id: "notifications",
            label: "Notificaciones Generales",
            icon: <Notifications />,
            path: "/admin/notifications",
            roles: ["admin", "trainer", "supervisor"],
          },
        ],
        roles: ["admin", "trainer", "supervisor"],
      },
      {
        id: "attendance",
        label: "Asistencia",
        icon: <CheckCircle />,
        children: [
          {
            id: "attendance-list",
            label: "Registro de Asistencia",
            icon: <Schedule />,
            path: "/admin/attendance",
            roles: ["admin", "trainer", "supervisor"],
          },
          {
            id: "programa-capacitaciones",
            label: "Programa de Capacitaciones",
            icon: <School />,
            path: "/admin/programa-capacitaciones",
            roles: ["admin", "supervisor"],
          },
        ],
        roles: ["admin", "trainer", "supervisor"],
      },
      {
        id: "health",
        label: "Salud Ocupacional",
        icon: <MedicalServices />,
        children: [
          {
            id: "occupational-exams",
            label: "Exámenes Ocupacionales",
            icon: <Healing />,
            path: "/admin/occupational-exams",
            roles: ["admin", "supervisor"],
          },
          {
            id: "admin-notifications",
            label: "Notificaciones",
            icon: <Notifications />,
            path: "/admin/notification-acknowledgment",
            roles: ["admin"],
          },
          {
            id: "seguimientos",
            label: "Seguimientos",
            icon: <Timeline />,
            path: "/admin/seguimientos",
            roles: ["admin", "supervisor"],
          },
          {
            id: "absenteeism",
            label: "Ausentismo",
            icon: <MedicalServices />,
            path: "/admin/absenteeism",
            roles: ["admin", "supervisor"],
          },
          {
            id: "profesiogramas",
            label: "Profesiogramas",
            icon: <Assignment />,
            children: [
              {
                id: "profesiogramas-catalogos",
                label: "Catálogos",
                icon: <Description />,
                path: "/profesiogramas/catalogos",
                roles: ["admin"],
              },
              {
                id: "profesiogramas-cargo",
                label: "Por Cargo",
                icon: <Work />,
                path: "/profesiogramas/cargo",
                roles: ["admin", "supervisor"],
              },
              {
                id: "profesiogramas-trabajador",
                label: "Por Trabajador",
                icon: <PersonSearch />,
                path: "/profesiogramas/trabajador",
                roles: ["admin", "supervisor"],
              },
              {
                id: "profesiogramas-admin",
                label: "Administrar",
                icon: <AdminPanelSettings />,
                path: "/profesiogramas/admin",
                roles: ["admin"],
              },
            ],
            roles: ["admin", "supervisor"],
          },
          {
            id: "homework-assessments",
            label: "Autoevaluaciones",
            icon: <Assessment />,
            path: "/admin/homework-assessments",
            roles: ["admin", "supervisor"],
          },
          {
            id: "ergonomic-self-inspections",
            label: "Autoinspección Ergonómica",
            icon: <Assessment />,
            path: "/admin/ergonomic-self-inspections",
            roles: ["admin", "supervisor"],
          },
        ],
        roles: ["admin", "supervisor"],
      },
      {
        id: "committees",
        label: "Comités",
        icon: <Groups />,
        children: [
          {
            id: "committees-dashboard",
            label: "Dashboard de Comités",
            icon: <Dashboard />,
            path: "/admin/committees/dashboard",
            roles: ["admin", "supervisor"],
          },
          {
            id: "committees-management",
            label: "Gestión de Comités",
            icon: <Groups />,
            path: "/admin/committees",
            roles: ["admin", "supervisor"],
          },
          {
            id: "committees-meetings",
            label: "Reuniones",
            icon: <Schedule />,
            path: "/admin/committees/meetings",
            roles: ["admin", "supervisor"],
          },
          {
            id: "committees-activities",
            label: "Actividades",
            icon: <Assignment />,
            path: "/admin/committees/activities",
            roles: ["admin", "supervisor"],
          },

          {
            id: "committees-documents",
            label: "Documentos",
            icon: <Description />,
            path: "/admin/committees/documents",
            roles: ["admin", "supervisor"],
          },
          {
            id: "committees-actas",
            label: "Actas de Reunión",
            icon: <EventNote />,
            path: "/admin/committees/actas",
            roles: ["admin", "supervisor"],
          },
          {
            id: "candidate-voting",
            label: "Votaciones de Candidatos",
            icon: <HowToVote />,
            path: "/admin/candidate-votings",
            roles: ["admin"],
          },
        ],
        roles: ["admin", "trainer", "supervisor"],
      },
      {
        id: "matriz-legal",
        label: "Matriz Legal",
        icon: <Gavel />,
        children: [
          {
            id: "matriz-dashboard",
            label: "Dashboard",
            icon: <Dashboard />,
            path: "/admin/matriz-legal",
            roles: ["admin", "supervisor", "superadmin"],
          },
          {
            id: "matriz-normas",
            label: "Normas",
            icon: <Gavel />,
            path: "/admin/matriz-legal/normas",
            roles: ["admin", "supervisor", "superadmin"],
          },
          {
            id: "matriz-empresas",
            label: "Perfil de la Empresa",
            icon: <Apartment />,
            path: "/admin/matriz-legal/empresas",
            roles: ["admin", "supervisor", "superadmin"],
          },
          {
            id: "matriz-sectores",
            label: "Sectores Económicos",
            icon: <Category />,
            path: "/admin/matriz-legal/sectores",
            roles: ["admin", "superadmin"],
          },
          {
            id: "matriz-importar",
            label: "Importar Excel ARL",
            icon: <CloudUpload />,
            path: "/admin/matriz-legal/importar",
            // Sin superadmin a propósito: es un rol técnico de plataforma,
            // no gestiona matrices de ninguna empresa (ver también la guarda
            // en MatrizLegalImport.tsx, que bloquea el acceso por URL).
            roles: ["admin"],
          },
        ],
        // Incluye superadmin: el filtrado del sidebar es un includes estricto
        // sobre user.role y no tiene bypass, así que sin esto el superadmin no
        // vería el módulo (necesita Dashboard/Normas/Empresas/Sectores, solo
        // se le excluye explícitamente de Importar arriba).
        roles: ["admin", "supervisor", "superadmin"],
      },
      {
        id: "plan-trabajo-anual",
        label: "Plan de Trabajo Anual",
        icon: <EventNote />,
        roles: ["admin", "supervisor"],
        children: [
          {
            id: "plan-trabajo",
            label: "Plan de Trabajo",
            icon: <EventNote />,
            path: "/admin/plan-trabajo-anual",
            roles: ["admin", "supervisor"],
          },
          {
            id: "cronograma-pyp",
            label: "Cronograma PYP",
            icon: <Schedule />,
            path: "/admin/cronograma-pyp",
            roles: ["admin", "supervisor"],
          },
          {
            id: "presupuesto-sst",
            label: "Presupuesto SST",
            icon: <AccountBalance />,
            path: "/admin/presupuesto-sst",
            roles: ["admin", "supervisor"],
          },
          {
            id: "estandares-minimos",
            label: "Estándares Mínimos SST",
            icon: <FactCheck />,
            path: "/admin/estandares-minimos",
            roles: ["admin", "supervisor"],
          },
          {
            id: "programa-inspecciones",
            label: "Programa de Inspecciones",
            icon: <Assignment />,
            path: "/admin/programa-inspecciones",
            roles: ["admin", "supervisor"],
          },
          {
            id: "auditoria-sst",
            label: "Auditoría SST",
            icon: <VerifiedUser />,
            path: "/admin/auditoria-sst",
            roles: ["admin", "supervisor"],
          },
          {
            id: "master-documents",
            label: "Listado Maestro de Documentos",
            icon: <Description />,
            path: "/master-documents",
            roles: ["admin", "supervisor"],
          },
        ],
      },
      {
        id: "administration",
        label: "Administración",
        icon: <AdminPanelSettings />,
        children: [
          {
            id: "audit",
            label: "Auditoría",
            icon: <Security />,
            path: "/admin/audit",
            roles: ["admin"],
          },
          {
            id: "config",
            label: "Configuración",
            icon: <Settings />,
            path: "/admin/config",
            roles: ["admin"],
          },
          {
            id: "roles",
            label: "Gestión de Roles",
            icon: <ManageAccounts />,
            path: "/admin/roles",
            roles: ["admin"],
          },
          {
            id: "users",
            label: "Gestión de Usuarios",
            icon: <People />,
            path: "/admin/users",
            roles: ["admin"],
          },
          {
            id: "suppliers",
            label: "Proveedores",
            icon: <MedicalServices />,
            path: "/admin/suppliers",
            roles: ["admin", "supervisor"],
          },
          {
            id: "system-settings",
            label: "Configuración del Notificaciones",
            icon: <Tune />,
            path: "/admin/system-settings",
            roles: ["admin"],
          },
        ],
        roles: ["admin", "supervisor"],
      },
      {
        id: "platform-admin",
        label: "Plataforma",
        icon: <AdminPanelSettings />,
        roles: ["superadmin"],
        children: [
          {
            id: "platform-empresas",
            label: "Empresas",
            icon: <Business />,
            path: "/superadmin/empresas",
            roles: ["superadmin"],
          },
        ],
      },
    ],
    [],
  );

  const filterMenuByRole = React.useCallback(
    (items: MenuItem[]): MenuItem[] => {
      if (!user) return [];

      return items
        .map((item) => {
          // Crear una copia profunda del item para evitar mutaciones
          const newItem: MenuItem = {
            ...item,
            children: item.children ? [...item.children] : undefined,
          };

          // Verificación granular por permisos específicos para usuarios con rol personalizado
          if (user.custom_role_id) {
            // Mapeo de elementos del menú a permisos específicos
            // Para usuarios con custom_role_id:
            // - Ítems de empleado: solo verifican user.role (acceso básico siempre disponible)
            // - Ítems de gestión: verifican permisos del rol personalizado (canViewXPage)
            //   + fallback al rol base para roles no-employee
            // Nota: canViewXPage() refleja SOLO permisos del rol personalizado para
            //   usuarios con custom_role_id (el backend no mezcla permisos base)
            const isNotEmployee = user.role !== "employee";
            const permissionMap: Record<string, () => boolean> = {
              // Dashboard - acceso basado en rol
              dashboard: () => true, // Will be filtered by children
              "admin-dashboard": () => user.role === "admin",
              "trainer-dashboard": () => user.role === "trainer",
              "supervisor-dashboard": () => user.role === "supervisor",
              "employee-dashboard": () => user.role === "employee",

              // Employee sections - solo verifican rol base (acceso básico del empleado)
              "employee-courses": () => user.role === "employee",
              "employee-surveys": () => user.role === "employee",
              "employee-evaluations": () => user.role === "employee",
              "employee-attendance": () => user.role === "employee",
              "employee-homework-assessments": () => user.role === "employee",
              "employee-ergonomic-self-inspections": () =>
                user.role === "employee",
              "employee-certificates": () => user.role === "employee",
              "employee-vacations": () => user.role === "employee",
              "employee-votings": () => user.role === "employee",

              // Worker management - permiso del rol personalizado O rol base no-employee
              "worker-management": () =>
                canViewWorkersPage() || canUpdateWorkers() || isNotEmployee,
              workers: () => canViewWorkersPage() || isNotEmployee,
              "workers-list": () => canViewWorkersPage() || isNotEmployee,
              "worker-detail": () => canViewWorkersPage() || isNotEmployee,

              // Contractor management
              "contractor-management": () =>
                user.role === "admin" || user.role === "supervisor",
              contractors: () =>
                user.role === "admin" || user.role === "supervisor",
              "contractor-documents": () =>
                user.role === "admin" || user.role === "supervisor",

              // Course management - permiso del rol personalizado O rol base no-employee
              courses: () => canViewCoursesPage() || isNotEmployee,
              "courses-list": () => canViewCoursesPage() || isNotEmployee,
              enrollments: () =>
                canViewCoursesPage() ||
                canViewEnrollmentPage() ||
                isNotEmployee,
              reinduction: () => canViewReinductionPage() || isNotEmployee,
              "user-progress": () =>
                canViewProgressPage() ||
                user.role === "admin" ||
                user.role === "trainer" ||
                user.role === "supervisor",
              "interactive-lessons": () =>
                user.role === "admin" ||
                user.role === "trainer" ||
                canUpdateCourses(),

              // Evaluation management
              evaluations: () => canViewEvaluationsPage() || isNotEmployee,
              "evaluations-list": () =>
                canViewEvaluationsPage() || isNotEmployee,
              "evaluation-results": () =>
                canViewEvaluationsPage() || isNotEmployee,
              surveys: () => canViewSurveysPage() || isNotEmployee,
              "survey-tabulation": () => canViewSurveysPage() || isNotEmployee,
              "nordico-tabulation": () => canViewSurveysPage() || isNotEmployee,
              "burnout-tabulation": () => canViewSurveysPage() || isNotEmployee,

              // Attendance
              attendance: () => canViewAttendancePage() || isNotEmployee,
              "attendance-list": () => canViewAttendancePage() || isNotEmployee,
              "admin-attendance": () => canUpdateAttendance() || isNotEmployee,
              "programa-capacitaciones": () => isNotEmployee,

              // Health/Medical
              health: () =>
                canViewOccupationalExamPage() ||
                canViewSeguimientoPage() ||
                user.role === "admin" ||
                user.role === "supervisor",
              "occupational-exams": () =>
                canViewOccupationalExamPage() || isNotEmployee,
              "admin-notifications": () => user.role === "admin",
              seguimientos: () => canViewSeguimientoPage() || isNotEmployee,
              // Profesiogramas
              profesiogramas: () =>
                user.role === "admin" || user.role === "supervisor",
              "profesiogramas-catalogos": () => user.role === "admin",
              "profesiogramas-cargo": () =>
                user.role === "admin" || user.role === "supervisor",
              "profesiogramas-trabajador": () =>
                user.role === "admin" || user.role === "supervisor",
              "profesiogramas-admin": () => user.role === "admin",
              "homework-assessments": () =>
                user.role === "admin" || user.role === "supervisor",
              "ergonomic-self-inspections": () =>
                user.role === "admin" || user.role === "supervisor",

              // Certificates - permiso del rol personalizado O rol base no-employee
              certificates: () => canViewCertificatesPage() || isNotEmployee,

              // Reports
              reports: () => canViewReportsPage() || isNotEmployee,

              // Notifications
              notifications: () => canViewNotificationsPage() || isNotEmployee,

              // Absenteeism
              absenteeism: () => canViewAbsenteeismPage() || isNotEmployee,

              // Suppliers
              suppliers: () => canViewSuppliersPage() || isNotEmployee,

              // Committees
              committees: () => true, // Will be filtered by children
              "committees-dashboard": () =>
                user.role === "admin" || user.role === "supervisor" || canViewCommitteeDashboardPage(),
              "committees-management": () =>
                user.role === "admin" || user.role === "supervisor" || canViewCommitteePage(),
              "committees-meetings": () =>
                user.role === "admin" || user.role === "supervisor" || canViewCommitteeMeetingsPage(),
              "committees-activities": () =>
                user.role === "admin" || user.role === "supervisor" || canViewCommitteeActivitiesPage(),
              "committees-documents": () =>
                user.role === "admin" || user.role === "supervisor" || canViewCommitteeDocumentsPage(),
              "committees-actas": () =>
                user.role === "admin" || user.role === "supervisor" || canViewCommitteeActasPage(),
              "candidate-voting": () =>
                user.role === "admin" ||
                user.role === "trainer" ||
                user.role === "supervisor" ||
                canViewCommitteeVotingPage(),

              // Matriz Legal
              "matriz-legal": () =>
                user.role === "admin" || user.role === "supervisor",
              "matriz-dashboard": () =>
                user.role === "admin" || user.role === "supervisor",
              "matriz-normas": () =>
                user.role === "admin" || user.role === "supervisor",
              "matriz-empresas": () =>
                user.role === "admin" || user.role === "supervisor",
              "matriz-sectores": () => user.role === "admin",

              // Plan de Trabajo Anual SG-SST
              "plan-trabajo-anual": () =>
                user.role === "admin" || user.role === "supervisor",
              "plan-trabajo": () =>
                user.role === "admin" || user.role === "supervisor",
              "cronograma-pyp": () =>
                user.role === "admin" || user.role === "supervisor",
              "presupuesto-sst": () =>
                user.role === "admin" || user.role === "supervisor",
              "estandares-minimos": () =>
                user.role === "admin" || user.role === "supervisor",
              "programa-inspecciones": () =>
                user.role === "admin" || user.role === "supervisor",
              "auditoria-sst": () =>
                user.role === "admin" || user.role === "supervisor",

              // Administration (check individual permissions or role)
              administration: () => true, // Will be filtered by children
              audit: () => user.role === "admin" || canViewAuditPage(),
              config: () => canViewAdminConfigPage() || isNotEmployee,
              roles: () => user.role === "admin",
              users: () => canUpdateUsers() || isNotEmployee,
              "system-settings": () => user.role === "admin",
              "master-documents": () =>
                user.role === "admin" || user.role === "supervisor",
            };

            const permissionCheck = permissionMap[newItem.id];
            if (permissionCheck && !permissionCheck()) {
              return null;
            }
          } else {
            // Verificación tradicional por roles del sistema para usuarios sin rol personalizado
            if (newItem.roles && !newItem.roles.includes(user.role)) {
              return null;
            }
          }

          // Para elementos con hijos, filtrar recursivamente sin mutar el original
          if (newItem.children) {
            const filteredChildren = filterMenuByRole(newItem.children);
            newItem.children = filteredChildren;
            return filteredChildren.length > 0 ? newItem : null;
          }

          return newItem;
        })
        .filter((item): item is MenuItem => item !== null);
    },
    [
      user,
      canViewCoursesPage,
      canUpdateCourses,
      canViewSurveysPage,
      canViewEvaluationsPage,
      canViewAttendancePage,
      canUpdateAttendance,
      canViewWorkersPage,
      canUpdateWorkers,
      canViewCertificatesPage,
      canViewReportsPage,
      canViewNotificationsPage,
      canViewOccupationalExamPage,
      canViewSeguimientoPage,
      canViewAdminConfigPage,
      canUpdateUsers,
      canViewSuppliersPage,
      canViewReinductionPage,
      canViewEnrollmentPage,
      canViewProgressPage,
      canViewAuditPage,
      canViewAbsenteeismPage,
      canViewCommitteePage,
      canViewCommitteeDashboardPage,
      canViewCommitteeMeetingsPage,
      canViewCommitteeActivitiesPage,
      canViewCommitteeDocumentsPage,
      canViewCommitteeActasPage,
      canViewCommitteeVotingPage,
    ],
  );

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = !collapsed && expandedItems.includes(item.id);
    const isItemActive = item.path ? isActive(item.path) : false;

    const handleItemClick = () => {
      if (hasChildren) {
        if (collapsed) {
          onToggle(); // expandir sidebar
          if (!expandedItems.includes(item.id)) handleExpand(item.id);
        } else {
          handleExpand(item.id);
        }
      } else if (item.path && isMobile) {
        onToggle();
      }
    };

    const button = (
      <ListItemButton
        {...(!hasChildren && item.path
          ? ({ component: Link, to: item.path } as any)
          : {})}
        onClick={handleItemClick}
        selected={isItemActive}
        aria-current={isItemActive ? "page" : undefined}
        aria-expanded={hasChildren && !collapsed ? isExpanded : undefined}
        sx={{
          mx: collapsed ? 0.75 : 1.25,
          pl: collapsed ? 0 : 1.5 + level * 2,
          pr: collapsed ? 0 : 1.25,
          minHeight: level > 0 ? 36 : 42,
          borderRadius: "3px",
          justifyContent: collapsed ? "center" : "flex-start",
          color: brand.shellText,
          transition: "background-color 120ms ease-out, color 120ms ease-out",
          "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.08)", color: "#fff" },
          "&.Mui-focusVisible": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            outline: "2px solid #fff",
            outlineOffset: -2,
          },
          // Ítem activo: un cupón blanco que sobresale del forro azul
          "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: brand.coupon,
            color: brand.shell,
          },
          ...(isExpanded && !isItemActive ? { color: "#fff" } : {}),
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? "auto" : 34,
            justifyContent: collapsed ? "center" : "flex-start",
            color: "inherit",
            opacity: isItemActive ? 1 : 0.85,
            "& .MuiSvgIcon-root": { fontSize: level > 0 ? 18 : 20 },
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={
                level === 0 && hasChildren
                  ? {
                      fontFamily: condensed,
                      fontWeight: 600,
                      fontSize: "0.92rem",
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      noWrap: true,
                    }
                  : {
                      fontSize: level > 0 ? "0.88rem" : "0.95rem",
                      fontWeight: isItemActive ? 700 : 500,
                      noWrap: true,
                    }
              }
            />
            {hasChildren &&
              (isExpanded ? (
                <ExpandLess fontSize="small" sx={{ opacity: 0.7 }} />
              ) : (
                <ExpandMore fontSize="small" sx={{ opacity: 0.7 }} />
              ))}
          </>
        )}
      </ListItemButton>
    );

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding className="sidebar-menu-item">
          {collapsed ? (
            <Tooltip title={item.label} placement="right" arrow>
              {button}
            </Tooltip>
          ) : (
            button
          )}
        </ListItem>
        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  // Memoizar los elementos filtrados para evitar duplicaciones en re-renders
  const filteredMenuItems = React.useMemo(() => {
    return filterMenuByRole(menuItems);
  }, [filterMenuByRole, menuItems]);

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        backgroundColor: brand.shell,
        color: brand.shellText,
      }}
    >
      {/* Encabezado: espacio de marca (hoy la plataforma, luego la empresa) */}
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.14)",
          minHeight: 60,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                flex: "none",
                borderRadius: "3px",
                backgroundColor: brand.coupon,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Box component="img" src="/logo.png" alt="" sx={{ width: 26, height: 26, objectFit: "contain" }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontFamily: condensed,
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#fff",
                  lineHeight: 1.1,
                }}
              >
                SG-SST
              </Typography>
              {user && (
                <Typography noWrap sx={{ fontSize: "0.8rem", color: brand.shellText }}>
                  {user.first_name} {user.last_name}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        <Tooltip title={collapsed ? "Expandir menú" : "Contraer menú"} placement="right">
          <IconButton
            onClick={onToggle}
            size="small"
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            sx={{ color: brand.shellText, "&:hover": { color: "#fff", backgroundColor: "rgba(255,255,255,0.08)" } }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Menu Items */}
      <Box
        component="nav"
        aria-label="Menú principal"
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          py: 1,
          scrollbarColor: "rgba(255,255,255,0.25) transparent",
          "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(255,255,255,0.25)" },
        }}
        className="sidebar-content"
      >
        <List disablePadding>{filteredMenuItems.map((item) => renderMenuItem(item))}</List>
      </Box>

      {/* Footer */}
      {!collapsed && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: "1px dashed rgba(255, 255, 255, 0.22)",
          }}
        >
          <Typography
            sx={{
              fontFamily: condensed,
              fontWeight: 600,
              fontSize: "0.78rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(201, 211, 234, 0.75)",
            }}
          >
            Decreto 1072 · Res. 0312
          </Typography>
        </Box>
      )}
    </Box>
  );

  const drawerWidth = collapsed ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;
  const widthTransition = theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: collapsed
      ? theme.transitions.duration.leavingScreen
      : theme.transitions.duration.enteringScreen,
  });

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            backgroundColor: brand.shell,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      open
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        transition: widthTransition,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          overflowX: "hidden",
          backgroundColor: brand.shell,
          borderRight: "1px solid rgba(255, 255, 255, 0.14)",
          transition: widthTransition,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
