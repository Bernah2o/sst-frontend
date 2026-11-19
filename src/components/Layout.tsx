import {
  Menu as MenuIcon,
  AccountCircle,
  ExitToApp,
} from '@mui/icons-material';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiUrl } from '../config/env';
import { useAuth } from '../contexts/AuthContext';
import { brand, condensed } from '../theme';

import PermissionRefreshNotification from './PermissionRefreshNotification';
import Sidebar from './Sidebar';
import SuperadminEmpresaSwitcher from './SuperadminEmpresaSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Sidebar siempre abierto en desktop, cerrado en móvil
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showPermissionNotification, setShowPermissionNotification] = useState(false);

  // Simular recepción de notificación de actualización de permisos
  useEffect(() => {
    const handlePermissionUpdate = () => {
      setShowPermissionNotification(true);
    };

    // Escuchar eventos personalizados para notificaciones de permisos
    window.addEventListener('permission-update', handlePermissionUpdate);
    
    return () => {
      window.removeEventListener('permission-update', handlePermissionUpdate);
    };
  }, []);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      const next = !sidebarCollapsed;
      setSidebarCollapsed(next);
      try { localStorage.setItem("sidebar-collapsed", String(next)); } catch { /* noop */ }
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'admin':
        return 'Administrador';
      case 'trainer':
        return 'Entrenador';
      case 'supervisor':
        return 'Supervisor';
      case 'employee':
        return 'Empleado';
      default:
        return role;
    }
  };

  // Manejar cambios entre móvil y desktop
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);


  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        collapsed={!isMobile && sidebarCollapsed}
        onToggle={handleSidebarToggle}
      />
      
      {/* Main Content */}
      <Box
        component="main"
        className="sidebar-transition"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: 0,
        }}
      >
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          color="primary"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56, sm: 60 }, gap: 1.5 }}>
            <Tooltip title={isMobile ? 'Abrir menú' : sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}>
              <IconButton
                color="inherit"
                aria-label={isMobile ? 'Abrir menú' : sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
                onClick={handleSidebarToggle}
                edge="start"
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>

            <Typography
              component="div"
              sx={{
                flexGrow: 1,
                fontFamily: condensed,
                fontWeight: 700,
                fontSize: '1.2rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              Plataforma SST
            </Typography>

            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                {/* Selector de empresa (solo superadmin) */}
                {(user.role || user.rol) === 'superadmin' && <SuperadminEmpresaSwitcher />}

                {/* Rol del usuario, como sello */}
                <Chip
                  label={user.custom_role?.display_name || getRoleLabel(user.role || user.rol)}
                  size="small"
                  variant="outlined"
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    color: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.55)',
                  }}
                />

                {/* User Menu */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ display: { xs: 'none', md: 'block' }, color: brand.shellText, fontWeight: 500 }}
                  >
                    {user.nombre} {user.apellido}
                  </Typography>
                  <IconButton
                    aria-label="Cuenta del usuario"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                  >
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: brand.coupon,
                        color: brand.shell,
                        fontFamily: condensed,
                        fontWeight: 700,
                        fontSize: '0.95rem',
                      }}
                      src={user.profile_picture ? 
                        (user.profile_picture.startsWith('http') ? 
                          user.profile_picture : 
                          `${getApiUrl().replace('/api/v1', '')}/uploads/${user.profile_picture}`
                        ) : undefined
                      }
                    >
                      {`${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase() || <AccountCircle />}
                    </Avatar>
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                      <AccountCircle sx={{ mr: 1.5, color: 'text.secondary' }} fontSize="small" />
                      Mi perfil
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <ExitToApp sx={{ mr: 1.5, color: 'text.secondary' }} fontSize="small" />
                      Cerrar sesión
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>
            )}
          </Toolbar>
        </AppBar>
        
        {/* Page Content */}
        <Box
          className="content-wrapper"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            backgroundColor: 'background.default',
            minHeight: 'calc(100vh - 60px)',
            minWidth: 0,
          }}
        >
          <div className="main-content">
            {children}
          </div>
        </Box>
      </Box>
      
      {/* Notificación de actualización de permisos */}
      <PermissionRefreshNotification
        open={showPermissionNotification}
        onClose={() => setShowPermissionNotification(false)}
      />
    </Box>
  );
};

export default Layout;