import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Avatar,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import UppercaseTextField from '../components/UppercaseTextField';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Worker } from '../types';

const WorkerSearch: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (!workers || workers.length === 0) {
      setFilteredWorkers([]);
      return;
    }
    
    if (searchTerm.trim() === '') {
      setFilteredWorkers(workers);
    } else {
      const filtered = workers.filter(worker =>
        worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.document_number?.includes(searchTerm) ||
        worker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWorkers(filtered);
    }
  }, [searchTerm, workers]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workers');
      setWorkers(response.data);
      setFilteredWorkers(response.data);
    } catch (err) {
      setError('Error al cargar los trabajadores');
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerSelect = (worker: Worker) => {
    navigate(`/admin/workers/${worker.id}`);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Consulta Individual de Trabajadores
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Busca y selecciona un trabajador para ver su información detallada, cursos, encuestas y evaluaciones.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <UppercaseTextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por nombre, apellido, cédula, email o cargo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <Typography variant="h6" gutterBottom>
        Resultados ({filteredWorkers?.length || 0} trabajadores)
      </Typography>

      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 2
        }}
      >
        {filteredWorkers && filteredWorkers.map((worker) => (
          <Card 
            key={worker.id}
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => handleWorkerSelect(worker)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" noWrap>
                    {worker.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {worker.document_number}
                  </Typography>
                </Box>
                <Chip 
                  label={worker.is_active ? 'Activo' : 'Inactivo'}
                  color={getStatusColor(worker.is_active) as any}
                  size="small"
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WorkIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {worker.position || 'Sin cargo'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {worker.email}
                </Typography>
              </Box>

              {worker.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {worker.phone}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {(!filteredWorkers || filteredWorkers.length === 0) && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron trabajadores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Intenta con otros términos de búsqueda
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default WorkerSearch;