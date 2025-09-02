import {
  Search,
  Refresh,
  RestartAlt,
  Visibility,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Button,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CircularProgress,
  Grid,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';

interface UserEvaluationResult {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  evaluation_id: number;
  evaluation_title: string;
  course_title: string;
  attempt_number: number;
  status: string;
  score: number | null;
  total_points: number | null;
  max_points: number | null;
  percentage: number | null;
  time_spent_minutes: number | null;
  passed: boolean;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface EvaluationResultsStats {
  total: number;
  completed: number;
  in_progress: number;
  passed: number;
  failed: number;
}

const EvaluationResults: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<UserEvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalResults, setTotalResults] = useState(0);
  const [stats, setStats] = useState<EvaluationResultsStats>({
    total: 0,
    completed: 0,
    in_progress: 0,
    passed: 0,
    failed: 0,
  });
  
  // Reassign evaluation states
  const [openReassignDialog, setOpenReassignDialog] = useState(false);
  const [reassigningResult, setReassigningResult] = useState<UserEvaluationResult | null>(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchEvaluationResults();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const fetchEvaluationResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        skip: (page * rowsPerPage).toString(),
        limit: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await api.get(`/evaluations/admin/all-results?${params}`);
      
      if (response.data.success) {
        setResults(response.data.data || []);
        setTotalResults(response.data.total || 0);
        
        // Calculate stats
        const allResults = response.data.data || [];
        const statsData = {
          total: allResults.length,
          completed: allResults.filter((r: UserEvaluationResult) => r.status === 'COMPLETED').length,
          in_progress: allResults.filter((r: UserEvaluationResult) => r.status === 'IN_PROGRESS').length,
          passed: allResults.filter((r: UserEvaluationResult) => r.passed === true).length,
          failed: allResults.filter((r: UserEvaluationResult) => r.status === 'COMPLETED' && r.passed === false).length,
        };
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching evaluation results:', error);
      showSnackbar('No se pudieron cargar los resultados de evaluaciones. Verifique su conexión e intente nuevamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReassignEvaluation = (result: UserEvaluationResult) => {
    setReassigningResult(result);
    setOpenReassignDialog(true);
  };

  const confirmReassignEvaluation = async () => {
    if (!reassigningResult) return;

    try {
      setReassignLoading(true);
      const response = await api.post(
        `/evaluations/${reassigningResult.evaluation_id}/reset-status/${reassigningResult.user_id}`
      );

      if (response.data.success) {
        showSnackbar('Evaluación reasignada exitosamente', 'success');
        fetchEvaluationResults(); // Refresh the data
      } else {
        showSnackbar('Error al reasignar la evaluación', 'error');
      }
    } catch (error) {
      console.error('Error reassigning evaluation:', error);
      showSnackbar('Error al reasignar la evaluación', 'error');
    } finally {
      setReassignLoading(false);
      setOpenReassignDialog(false);
      setReassigningResult(null);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      case 'NOT_STARTED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En Progreso';
      case 'not_started':
        return 'No Iniciada';
      case 'expired':
        return 'Expirada';
      case 'blocked':
        return 'Bloqueada';
      default:
        return status;
    }
  };

  const filteredResults = results.filter((result) => {
    const matchesSearch = 
      result.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.evaluation_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.course_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || result.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Check if user has admin or trainer permissions
  if (user?.role !== 'admin' && user?.role !== 'trainer') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a esta página.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Resultados de Evaluaciones
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Evaluaciones
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completadas
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                En Progreso
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.in_progress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Aprobadas
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.passed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Reprobadas
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.failed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Controls */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <TextField
          placeholder="Buscar por usuario, evaluación o curso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ minWidth: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Estado"
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="COMPLETED">Completada</MenuItem>
            <MenuItem value="IN_PROGRESS">En Progreso</MenuItem>
            <MenuItem value="NOT_STARTED">No Iniciada</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchEvaluationResults}
        >
          Actualizar
        </Button>
      </Box>

      {/* Results Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Evaluación</TableCell>
              <TableCell>Curso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Puntuación</TableCell>
              <TableCell>Porcentaje</TableCell>
              <TableCell>Resultado</TableCell>
              <TableCell>Fecha Completada</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No se encontraron resultados
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {result.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {result.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {result.evaluation_title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {result.course_title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(result.status)}
                      color={getStatusColor(result.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {result.score !== null ? `${result.score}/${result.max_points}` : '-'}
                  </TableCell>
                  <TableCell>
                    {result.percentage !== null ? `${result.percentage.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell>
                    {result.status === 'COMPLETED' && (
                      <Chip
                        label={result.passed ? 'Aprobada' : 'Reprobada'}
                        color={result.passed ? 'success' : 'error'}
                        size="small"
                        icon={result.passed ? <CheckCircle /> : <Cancel />}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {result.completed_at ? formatDateTime(result.completed_at) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Botón de reasignar solo para evaluaciones completadas y usuarios con permisos */}
                      {result.status === 'completed' && (user?.role === 'admin' || user?.role === 'trainer') && (
                        <IconButton
                          color="warning"
                          onClick={() => handleReassignEvaluation(result)}
                          size="small"
                          title="Reasignar evaluación"
                        >
                          <RestartAlt />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalResults}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />

      {/* Reassign Evaluation Dialog */}
      <Dialog open={openReassignDialog} onClose={() => setOpenReassignDialog(false)}>
        <DialogTitle>Reasignar Evaluación</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas reasignar esta evaluación?
          </Typography>
          {reassigningResult && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Usuario:</strong> {reassigningResult.full_name} ({reassigningResult.email})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Evaluación:</strong> {reassigningResult.evaluation_title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Curso:</strong> {reassigningResult.course_title}
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción cambiará el estado de la evaluación de "COMPLETADA" a "NO INICIADA" y 
            eliminará todas las respuestas del usuario. El empleado podrá volver a responder la evaluación.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReassignDialog(false)}>Cancelar</Button>
          <Button
            onClick={confirmReassignEvaluation}
            variant="contained"
            color="warning"
            disabled={reassignLoading}
            startIcon={reassignLoading ? <CircularProgress size={20} /> : <RestartAlt />}
          >
            {reassignLoading ? 'Reasignando...' : 'Reasignar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EvaluationResults;