import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Business as BusinessIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import contractorService, { ContractorFilters } from '../services/contractorService';
import areaService, { Area } from '../services/areaService';
import {
  ContractorResponse,
  ContractorList,
  DOCUMENT_TYPES,
  GENDER_OPTIONS,

  EDUCATION_LEVELS,
  CONTRACT_TYPES,
} from '../types/contractor';
import { useAuth } from '../contexts/AuthContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const Contractors: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dialogState, showConfirmDialog } = useConfirmDialog();

  // State
  const [contractors, setContractors] = useState<ContractorResponse[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalContractors, setTotalContractors] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<ContractorFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load areas
  const loadAreas = useCallback(async () => {
    try {
      const areasData = await areaService.getActiveAreas();
      setAreas(areasData);
    } catch (err) {
      console.error('Error loading areas:', err);
      setAreas([]);
    }
  }, []);

  // Helper function to get area name by ID
  const getAreaName = (areaId: number | null | undefined): string => {
    if (!areaId) return '-';
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : `Área ${areaId}`;
  };

  // Helper function to format contract type
  const formatContractType = (contractType: string | null | undefined): string => {
    if (!contractType) return '-';
    return contractType.replace(/_/g, ' ').toUpperCase();
  };

  // Load contractors
  const loadContractors = useCallback(async () => {
    try {
      setLoading(true);
      const currentFilters: ContractorFilters = {
        ...filters,
        search: searchTerm || undefined,
        page: page + 1,
        size: rowsPerPage,
      };

      const response: ContractorList = await contractorService.getContractors(currentFilters);
      
      // Validación defensiva para evitar errores si response.contractors es undefined o null
      setContractors(response?.contractors || []);
      setTotalContractors(response?.total || 0);
    } catch (err) {
      setError('Error al cargar los contratistas');
      console.error('Error loading contractors:', err);
      // En caso de error, asegurar que contractors sea un array vacío
      setContractors([]);
      setTotalContractors(0);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, page, rowsPerPage]);

  useEffect(() => {
    loadAreas();
    loadContractors();
  }, [loadAreas, loadContractors]);

  // Handlers
  const handleSearch = () => {
    setPage(0);
    loadContractors();
  };

  const handleFilterChange = (field: keyof ContractorFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const handleApplyFilters = () => {
    setPage(0);
    setShowFilters(false);
    loadContractors();
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(0);
    setShowFilters(false);
    loadContractors();
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmDialog({
      title: 'Eliminar Contratista',
      message: '¿Está seguro de que desea eliminar este contratista? Esta acción no se puede deshacer.',
      severity: 'warning'
    });

    if (confirmed) {
      try {
        await contractorService.deleteContractor(id);
        setSuccess('Contratista eliminado exitosamente');
        loadContractors();
      } catch (err) {
        setError('Error al eliminar el contratista');
        console.error('Error deleting contractor:', err);
      }
    }
  };

  const handleExport = async () => {
    try {
      const blob = await contractorService.exportContractors(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contratistas_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Exportación completada exitosamente');
    } catch (err) {
      setError('Error al exportar los contratistas');
      console.error('Error exporting contractors:', err);
    }
  };

  const getStatusChip = (activo: boolean) => (
    <Chip
      label={activo ? 'Activo' : 'Inactivo'}
      color={activo ? 'success' : 'default'}
      size="small"
    />
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon />
          Gestión de Contratistas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(true)}
          >
            Filtros
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/contractors/new')}
          >
            Nuevo Contratista
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, documento, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Documento</TableCell>
                <TableCell>Nombre Completo</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>Área</TableCell>
                <TableCell>Tipo Contrato</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : !contractors || contractors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No se encontraron contratistas
                  </TableCell>
                </TableRow>
              ) : (
                contractors.map((contractor) => (
                  <TableRow key={contractor.id} hover>
                    <TableCell>
                      {(contractor.document_type || '').toUpperCase()} {contractor.document_number}
                    </TableCell>
                    <TableCell>
                      {`${contractor.first_name || ''} ${contractor.last_name || ''}`.trim()}
                    </TableCell>
                    <TableCell>{contractor.email}</TableCell>
                    <TableCell>{contractor.cargo}</TableCell>
                    <TableCell>{getAreaName(contractor.area_id)}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatContractType(contractor.tipo_contrato)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{getStatusChip(Boolean(contractor.activo))}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/contractors/${contractor.id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/contractors/edit/${contractor.id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Documentos">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/contractors/${contractor.id}/documents`)}
                        >
                          <DocumentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(contractor.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalContractors}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Filters Dialog */}
      <Dialog open={showFilters} onClose={() => setShowFilters(false)} maxWidth="md" fullWidth>
        <DialogTitle>Filtros de Búsqueda</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  value={filters.tipo_documento || ''}
                  onChange={(e) => handleFilterChange('tipo_documento', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {DOCUMENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Género</InputLabel>
                <Select
                  value={filters.genero || ''}
                  onChange={(e) => handleFilterChange('genero', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {GENDER_OPTIONS.map((gender) => (
                    <MenuItem key={gender} value={gender}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Nivel Educativo</InputLabel>
                <Select
                  value={filters.nivel_educativo || ''}
                  onChange={(e) => handleFilterChange('nivel_educativo', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {EDUCATION_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Contrato</InputLabel>
                <Select
                  value={filters.tipo_contrato || ''}
                  onChange={(e) => handleFilterChange('tipo_contrato', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {CONTRACT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.activo !== undefined ? filters.activo.toString() : ''}
                  onChange={(e) => handleFilterChange('activo', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Activo</MenuItem>
                  <MenuItem value="false">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearFilters}>Limpiar</Button>
          <Button onClick={() => setShowFilters(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleApplyFilters}>
            Aplicar Filtros
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      {/* Confirm Dialog */}
      <ConfirmDialog {...dialogState} />
    </Box>
  );
};

export default Contractors;