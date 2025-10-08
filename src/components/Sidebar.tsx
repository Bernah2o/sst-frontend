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
  MenuOpen,
  CheckCircle,
  Schedule,
  Group,
  Groups,
  Description,
  Healing,
  Poll,
  Refresh,
  TrendingUp,
  ManageAccounts,
  PersonSearch,
  BeachAccess,
  HowToVote,
  Business,
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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../hooks/usePermissions";

interface SidebarProps {
  open: boolean;
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

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const { user } = useAuth();
  const {
    canUpdateUsers,
    canViewCoursesPage,
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
  } = usePermissions();
  const navigate = useNavigate();
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
        JSON.stringify(expandedItems)
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
        : [...prev, itemId]
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onToggle();
    }
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
            id: "reinduction",
            label: "Reinducciones",
            icon: <Refresh />,
            path: "/admin/reinduction",
            roles: ["admin"],
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
            id: "admin-attendance",
            label: "Gestión de Asistencia",
            icon: <Group />,
            path: "/admin/admin-attendance",
            roles: ["admin"],
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
            id: "committees-votings",
            label: "Votaciones",
            icon: <Poll />,
            path: "/admin/committees/votings",
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
        ],
        roles: ["admin", "supervisor"],
      },
    ],
    []
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
            const permissionMap: Record<string, () => boolean> = {
              // Dashboard - acceso basado en rol y permisos personalizados
              dashboard: () => true, // Will be filtered by children
              "admin-dashboard": () => user.role === "admin",
              "trainer-dashboard": () => user.role === "trainer",
              "supervisor-dashboard": () => user.role === "supervisor",
              "employee-dashboard": () => user.role === "employee",

              // Employee sections - verificar permisos específicos
              "employee-courses": () =>
                user.role === "employee" && canViewCoursesPage(),
              "employee-surveys": () =>
                user.role === "employee" && canViewSurveysPage(),
              "employee-evaluations": () =>
                user.role === "employee" && canViewEvaluationsPage(),
              "employee-attendance": () =>
                user.role === "employee" && canViewAttendancePage(),
              "employee-certificates": () =>
                user.role === "employee" && canViewCertificatesPage(),
              "employee-vacations": () => user.role === "employee",
              "employee-votings": () => user.role === "employee",

              // Worker management
              "worker-management": () =>
                canViewWorkersPage() || canUpdateWorkers(),
              workers: canViewWorkersPage,
              "workers-list": canViewWorkersPage,
              "worker-detail": canViewWorkersPage,

              // Contractor management
              "contractor-management": () =>
                user.role === "admin" || user.role === "supervisor",
              contractors: () =>
                user.role === "admin" || user.role === "supervisor",
              "contractor-documents": () =>
                user.role === "admin" || user.role === "supervisor",

              // Course management - Solo para roles administrativos, no para employees
              courses: () => user.role !== "employee" && canViewCoursesPage(),
              "courses-list": () =>
                user.role !== "employee" && canViewCoursesPage(),
              enrollments: () =>
                user.role !== "employee" && canViewCoursesPage(),
              reinduction: () =>
                user.role !== "employee" && canViewReinductionPage(),

              // Evaluation management
              evaluations: canViewEvaluationsPage,
              "evaluations-list": canViewEvaluationsPage,
              "evaluation-results": canViewEvaluationsPage,
              surveys: canViewSurveysPage,
              "survey-tabulation": canViewSurveysPage,

              // Attendance
              attendance: canViewAttendancePage,
              "attendance-list": canViewAttendancePage,
              "admin-attendance": canUpdateAttendance,

              // Health/Medical
              health: () =>
                canViewOccupationalExamPage() || canViewSeguimientoPage(),
              "occupational-exams": () => canViewOccupationalExamPage(),
              "admin-notifications": () => user.role === "admin",
              seguimientos: () => canViewSeguimientoPage(),

              // Certificates - Solo para roles administrativos, no para employees
              certificates: () =>
                user.role !== "employee" && canViewCertificatesPage(),

              // Reports
              reports: canViewReportsPage,

              // Notifications
              notifications: canViewNotificationsPage,

              // Suppliers
              suppliers: canViewSuppliersPage,

              // Committees
              committees: () => true, // Will be filtered by children
              "committees-dashboard": () =>
                user.role === "admin" || user.role === "supervisor",
              "committees-management": () =>
                user.role === "admin" || user.role === "supervisor",
              "committees-meetings": () =>
                user.role === "admin" || user.role === "supervisor",
              "committees-activities": () =>
                user.role === "admin" || user.role === "supervisor",
              "committees-votings": () =>
                user.role === "admin" || user.role === "supervisor",
              "committees-documents": () =>
                user.role === "admin" || user.role === "supervisor",
              "candidate-voting": () =>
                user.role === "admin" ||
                user.role === "trainer" ||
                user.role === "supervisor",

              // Administration (always check individual permissions)
              administration: () => true, // Will be filtered by children
              audit: () => user.role === "admin", // Solo admins pueden ver auditoría
              config: () => canViewAdminConfigPage(),
              roles: () => user.role === "admin", // Solo admins pueden gestionar roles
              users: canUpdateUsers,
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
    ]
  );

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isItemActive = item.path ? isActive(item.path) : false;

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding className="sidebar-menu-item">
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleExpand(item.id);
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            selected={isItemActive}
            sx={{
              pl: 2 + level * 2,
              minHeight: 48,
              "&.Mui-selected": {
                backgroundColor: theme.palette.primary.main + "20",
                borderRight: `3px solid ${theme.palette.primary.main}`,
                "&:hover": {
                  backgroundColor: theme.palette.primary.main + "30",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isItemActive ? theme.palette.primary.main : "inherit",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: level > 0 ? "0.875rem" : "1rem",
                fontWeight: isItemActive ? 600 : 400,
                color: isItemActive ? theme.palette.primary.main : "inherit",
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
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
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" noWrap component="div">
          Plataforma SST
        </Typography>
        <IconButton onClick={onToggle} size="small">
          <MenuOpen />
        </IconButton>
      </Box>

      {/* User Info */}
      {user && (
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
            backgroundColor: theme.palette.grey[50],
          }}
        >
          <Typography variant="subtitle2" noWrap>
            {user.first_name} {user.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user.role === "admin"
              ? "Administrador"
              : user.role === "trainer"
              ? "Entrenador"
              : user.role === "supervisor"
              ? "Supervisor"
              : "Empleado"}
          </Typography>
        </Box>
      )}

      {/* Menu Items */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }} className="sidebar-content">
        <List>{filteredMenuItems.map((item) => renderMenuItem(item))}</List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © 2025 Plataforma SST
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      anchor="left"
      open={open}
      onClose={onToggle}
      sx={{
        width: 280,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 280,
          boxSizing: "border-box",
          borderRight: 1,
          borderColor: "divider",
          zIndex: 1200,
        },
      }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
