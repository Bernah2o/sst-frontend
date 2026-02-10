import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Slideshow,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import interactiveLessonApi from '../services/interactiveLessonApi';
import { InteractiveLessonListItem } from '../types/interactiveLesson';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const InteractiveLessons: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<InteractiveLessonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { dialogState, showConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const data = await interactiveLessonApi.getLessons();
      setLessons(data.items);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const lesson = lessons.find(l => l.id === id);
    const confirmed = await showConfirmDialog({
      title: 'Eliminar Lección',
      message: `¿Estás seguro de que deseas eliminar la lección "${lesson?.title}"? Esta acción no se puede deshacer.`,
      severity: 'error',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      try {
        await interactiveLessonApi.deleteLesson(id);
        setLessons(lessons.filter((l) => l.id !== id));
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Slideshow fontSize="large" color="primary" />
          Lecciones Interactivas
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Slides</TableCell>
              <TableCell align="center">Actividades</TableCell>
              <TableCell>Duración Est.</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                   No se encontraron lecciones. Gestiona las lecciones desde el detalle de cada curso/módulo.
                </TableCell>
              </TableRow>
            ) : (
              lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {lesson.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {lesson.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lesson.status === 'published' ? 'Publicado' : 'Borrador'}
                      color={lesson.status === 'published' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{lesson.slides_count}</TableCell>
                  <TableCell align="center">{lesson.activities_count}</TableCell>
                  <TableCell>
                    {lesson.estimated_duration_minutes ? `${lesson.estimated_duration_minutes} min` : 'N/A'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Vista Previa">
                        <IconButton
                          size="small"
                          onClick={() => window.open(`/admin/lesson/${lesson.id}/preview`, '_blank')}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/admin/lesson/${lesson.id}/edit`)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(lesson.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <ConfirmDialog {...dialogState} />
    </Box>
  );
};

export default InteractiveLessons;
