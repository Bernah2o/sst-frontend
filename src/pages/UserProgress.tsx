import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  TextField,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  BookmarkBorder as BookmarkIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import api from '../services/api';

interface UserProgress {
  id: number;
  user_id: number;
  user_name: string;
  user_document: string;
  user_position: string;
  user_area: string;
  course_id: number;
  course_title: string;
  course_type: string;
  enrollment_date: string;
  completion_date?: string;
  status: 'no_iniciado' | 'en_progreso' | 'completado' | 'vencido' | 'suspendido';
  progress_percentage: number;
  time_spent_minutes: number;
  modules_completed: number;
  total_modules: number;
}

interface Course {
  id: number;
  titulo: string;
  tipo: string;
  duracion_horas: number;
  descripcion: string;
}

interface User {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  cargo: string;
  area: string;
}

const UserProgress: React.FC = () => {
  const { user } = useAuth();
  const [userProgresses, setUserProgresses] = useState<UserProgress[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    course_id: '',
    user_id: '',
    search: ''
  });

  const statusConfig = {
    no_iniciado: { label: 'No Iniciado', color: 'default' },
    en_progreso: { label: 'En Progreso', color: 'info' },
    completado: { label: 'Completado', color: 'success' },
    vencido: { label: 'Vencido', color: 'error' },
    suspendido: { label: 'Suspendido', color: 'warning' }
  };

  useEffect(() => {
    fetchUserProgresses();
    fetchCourses();
    fetchUsers();
  }, [page, filters]);

  const fetchUserProgresses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      
      if (filters.status) params.append('status', filters.status);
      if (filters.course_id) params.append('course_id', filters.course_id);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/user-progress/?${params.toString()}`);
      setUserProgresses(response.data.items || []);
      // Use the 'pages' field directly from API response instead of calculating
      setTotalPages(response.data.pages || Math.ceil((response.data.total || 0) / 20));
    } catch (error) {
      console.error('Error fetching user progresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };



  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const getStatusColor = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.color || 'default';
  };

  const getStatusLabel = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.label || status;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Progreso de Usuarios
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Seguimiento del progreso de capacitación y desarrollo
      </Typography>

      {/* Tabla de Progreso */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Curso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Progreso</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Cargando progreso de usuarios...
                </TableCell>
              </TableRow>
            ) : userProgresses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No se encontraron registros de progreso
                </TableCell>
              </TableRow>
            ) : (
              userProgresses.map((progress) => (
                <TableRow key={progress.id}>
                  <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {progress.user_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {progress.user_document}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {progress.course_title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {progress.course_type}
                      </Typography>
                    </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(progress.status)}
                      color={getStatusColor(progress.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                     <Box sx={{ width: '100%' }}>
                       <LinearProgress 
                         variant="determinate" 
                         value={progress.progress_percentage || 0} 
                       />
                       <Typography variant="caption" color="text.secondary">
                         {progress.progress_percentage || 0}%
                       </Typography>
                     </Box>
                   </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

      </TableContainer>

      {/* Paginación */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default UserProgress;