import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { committeeService } from '../services/committeeService';
import { committeePermissionService } from '../services/committeePermissionService';
import {
  Committee,
  CommitteeType,
  CommitteeListFilters,
} from '../types';

const CommitteeList: React.FC = () => {
  const navigate = useNavigate();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState<{ [key: number]: any }>({});
  const [filters, setFilters] = useState<CommitteeListFilters>({
    committee_type: undefined,
    is_active: undefined,
    search: '',
  });



  const loadCommittees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's accessible committees
      const accessibleCommittees = await committeePermissionService.getUserAccessibleCommittees();
      const committeeIds = accessibleCommittees.map(ac => ac.committee_id);

      if (committeeIds.length === 0) {
        setCommittees([]);
        setTotalCount(0);
        return;
      }

      // Load committees with filters
      const response = await committeeService.getCommittees({
        ...filters,
        page: page + 1,
        page_size: rowsPerPage,
      });

      setCommittees(response.items);
      setTotalCount(response.total);

      // Load permissions for each committee
      const permissionsMap: { [key: number]: any } = {};
      for (const committee of response.items) {
        // Validate committee.id before making permission calls
        if (!committee.id || isNaN(committee.id) || committee.id <= 0) {
          console.warn('Invalid committee found:', committee);
          continue;
        }

        const canView = await committeePermissionService.canView(committee.id);
        const canEdit = await committeePermissionService.canEdit(committee.id);
        const canManageMembers = await committeePermissionService.canManageMembers(committee.id);

        permissionsMap[committee.id] = {
          canView,
          canEdit,
          canManageMembers,
        };
      }
      setPermissions(permissionsMap);
    } catch (err) {
      setError('Error al cargar los comités');
      console.error('Committee loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    loadCommittees();
  }, [page, rowsPerPage, filters, loadCommittees]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, committee: Committee) => {
    setAnchorEl(event.currentTarget);
    setSelectedCommittee(committee);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCommittee(null);
  };

  const handleView = () => {
    if (selectedCommittee) {
      navigate(`/admin/committees/${selectedCommittee.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedCommittee) {
      navigate(`/admin/committees/${selectedCommittee.id}/edit`);
    }
    handleMenuClose();
  };

  const handleSettings = () => {
    if (selectedCommittee) {
      navigate(`/admin/committees/${selectedCommittee.id}`);
    }
    handleMenuClose();
  };

  const handleManageMembers = () => {
    if (selectedCommittee) {
      navigate(`/admin/committees/${selectedCommittee.id}/members`);
    }
    handleMenuClose();
  };



  const handleDeleteConfirm = async () => {
    if (selectedCommittee) {
      try {
        await committeeService.deleteCommittee(selectedCommittee.id);
        setDeleteDialogOpen(false);
        setSelectedCommittee(null);
        loadCommittees();
      } catch (err) {
        setError('Error al eliminar el comité');
        console.error('Committee deletion error:', err);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedCommittee(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof CommitteeListFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPage(0);
  };

  const handleFilterReset = () => {
    setFilters({
      committee_type: undefined,
      is_active: undefined,
      search: '',
    });
    setPage(0);
  };

  const getCommitteeTypeLabel = (type: CommitteeType): string => {
    switch (type) {
      case CommitteeType.CONVIVENCIA:
        return 'Convivencia';
      case CommitteeType.COPASST:
        return 'COPASST';
      default:
        return type;
    }
  };

  const getCommitteeTypeColor = (type: CommitteeType): 'primary' | 'secondary' => {
    switch (type) {
      case CommitteeType.CONVIVENCIA:
        return 'primary';
      case CommitteeType.COPASST:
        return 'secondary';
      default:
        return 'primary';
    }
  };

  // Allow creating new committees regardless of existing committee permissions
  const canCreateCommittee = true;

  if (loading && committees.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Comités
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/committees/new')}
            disabled={!canCreateCommittee}
          >
            Nuevo Comité
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Miembros</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {committees.map((committee) => (
                  <TableRow key={committee.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <GroupIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight="medium">
                          {committee.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCommitteeTypeLabel(committee.committee_type)}
                        size="small"
                        color={getCommitteeTypeColor(committee.committee_type)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {committee.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={committee.is_active ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={committee.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {committee.members_count || 0} miembros
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(committee.created_at).toLocaleDateString('es-ES')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Más opciones">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, committee)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {committees.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" py={4}>
                        No se encontraron comités
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={handleView}
          disabled={!selectedCommittee || !permissions[selectedCommittee.id]?.canView}
        >
          <ViewIcon sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        <MenuItem
          onClick={handleEdit}
          disabled={!selectedCommittee || !permissions[selectedCommittee.id]?.canEdit}
        >
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem
          onClick={handleManageMembers}
          disabled={!selectedCommittee || !permissions[selectedCommittee.id]?.canManageMembers}
        >
          <GroupIcon sx={{ mr: 1 }} />
          Gestionar Miembros
        </MenuItem>
        <MenuItem
          onClick={handleSettings}
          disabled={!selectedCommittee || !permissions[selectedCommittee.id]?.canManageMembers}
        >
          <SettingsIcon sx={{ mr: 1 }} />
          Configuración
        </MenuItem>
        <MenuItem
          onClick={() => {
            const committeeToDelete = selectedCommittee;
            handleMenuClose();
            if (committeeToDelete) {
              setSelectedCommittee(committeeToDelete);
              setDeleteDialogOpen(true);
            }
          }}
          disabled={!selectedCommittee || !permissions[selectedCommittee.id]?.canEdit}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el comité "{selectedCommittee?.name}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filtros de Búsqueda</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Buscar por nombre"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tipo de Comité</InputLabel>
              <Select
                value={filters.committee_type || ''}
                label="Tipo de Comité"
                onChange={(e) => handleFilterChange('committee_type', e.target.value || undefined)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={CommitteeType.CONVIVENCIA}>Convivencia</MenuItem>
                <MenuItem value={CommitteeType.COPASST}>COPASST</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.is_active !== undefined ? filters.is_active.toString() : ''}
                label="Estado"
                onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Activo</MenuItem>
                <MenuItem value="false">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterReset}>Limpiar Filtros</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommitteeList;