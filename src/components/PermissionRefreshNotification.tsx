import React, { useState, useEffect } from 'react';
import {
  Alert,
  Button,
  Snackbar,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Refresh, Close } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import usePermissions from '../hooks/usePermissions';

interface PermissionRefreshNotificationProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

const PermissionRefreshNotification: React.FC<PermissionRefreshNotificationProps> = ({
  open,
  onClose,
  message = 'Se han actualizado los permisos del sistema. Actualiza tu sesión para aplicar los cambios.'
}) => {
  const { refreshUserData } = useAuth();
  const { refreshPermissions } = usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refrescar datos del usuario y permisos
      await refreshUserData();
      await refreshPermissions();
      setRefreshed(true);
      
      // Auto-cerrar después de 2 segundos
      setTimeout(() => {
        onClose();
        setRefreshed(false);
      }, 2000);
    } catch (error) {
      console.error('Error al refrescar permisos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 8 }}
    >
      <Alert
        severity={refreshed ? 'success' : 'info'}
        sx={{ width: '100%', maxWidth: 500 }}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {!refreshed && (
              <Button
                color="inherit"
                size="small"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            )}
            <IconButton
              size="small"
              color="inherit"
              onClick={onClose}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <Typography variant="body2">
          {refreshed ? '¡Permisos actualizados correctamente!' : message}
        </Typography>
      </Alert>
    </Snackbar>
  );
};

export default PermissionRefreshNotification;