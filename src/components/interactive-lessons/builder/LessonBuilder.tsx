import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  DragIndicator,
  TextFields,
  Image,
  VideoLibrary,
  Quiz,
  TouchApp,
  Save,
  Publish,
  ArrowBack,
  Visibility,
  Settings,
  AutoAwesome,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  InteractiveLesson,
  InteractiveLessonCreate,
  InteractiveLessonUpdate,
  LessonSlide,
  LessonSlideCreate,
  LessonSlideUpdate,
  SlideContentType,
  LessonNavigationType,
  LessonStatus,
} from '../../../types/interactiveLesson';
import interactiveLessonApi from '../../../services/interactiveLessonApi';
import SlideEditor from './SlideEditor';

interface LessonBuilderProps {
  moduleId?: number;
  lessonId?: number;
}

const LessonBuilder: React.FC<LessonBuilderProps> = ({ moduleId: propModuleId, lessonId: propLessonId }) => {
  const navigate = useNavigate();
  const params = useParams<{ moduleId?: string; lessonId?: string }>();

  const moduleId = propModuleId || (params.moduleId ? parseInt(params.moduleId) : undefined);
  const lessonId = propLessonId || (params.lessonId ? parseInt(params.lessonId) : undefined);

  // State
  const [lesson, setLesson] = useState<InteractiveLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddSlideDialog, setShowAddSlideDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // AI Generation State
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    tema: '',
    descripcion: '',
    num_slides: 5,
    incluir_quiz: true,
    incluir_actividad: true,
  });

  // Form state for new/edit lesson
  const [formData, setFormData] = useState<InteractiveLessonCreate | InteractiveLessonUpdate>({
    title: '',
    description: '',
    navigation_type: 'sequential' as LessonNavigationType,
    is_required: true,
    estimated_duration_minutes: undefined,
    passing_score: 70,
  });

  // Load lesson if editing
  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  const loadLesson = async () => {
    if (!lessonId) return;

    setLoading(true);
    try {
      const data = await interactiveLessonApi.getLesson(lessonId);
      setLesson(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        navigation_type: data.navigation_type,
        is_required: data.is_required,
        estimated_duration_minutes: data.estimated_duration_minutes,
        passing_score: data.passing_score,
      });
      if (data.slides.length > 0) {
        setSelectedSlideIndex(0);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      setSnackbar({ open: true, message: 'Error al cargar la lección', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (lessonId && lesson) {
        // Update existing lesson
        const updated = await interactiveLessonApi.updateLesson(lessonId, formData);
        setLesson({ ...lesson, ...updated });
        setSnackbar({ open: true, message: 'Lección guardada exitosamente', severity: 'success' });
      } else if (moduleId) {
        // Create new lesson
        const created = await interactiveLessonApi.createLesson({
          ...formData,
          module_id: moduleId,
        } as InteractiveLessonCreate);
        setLesson(created);
        navigate(`/admin/lesson/${created.id}/edit`, { replace: true });
        setSnackbar({ open: true, message: 'Lección creada exitosamente', severity: 'success' });
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      setSnackbar({ open: true, message: 'Error al guardar la lección', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!lessonId) return;

    setSaving(true);
    try {
      const updated = await interactiveLessonApi.publishLesson(lessonId);
      setLesson((prev) => prev ? { ...prev, status: updated.status } : null);
      setSnackbar({ open: true, message: 'Lección publicada exitosamente', severity: 'success' });
    } catch (error) {
      console.error('Error publishing lesson:', error);
      setSnackbar({ open: true, message: 'Error al publicar la lección', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlide = async (slideType: SlideContentType) => {
    if (!lesson) return;

    const newSlide: LessonSlideCreate = {
      slide_type: slideType,
      order_index: lesson.slides.length,
      content: getDefaultContentForType(slideType),
      is_required: true,
    };

    try {
      const created = await interactiveLessonApi.createSlide(lesson.id, newSlide);
      setLesson({
        ...lesson,
        slides: [...lesson.slides, created],
      });
      setSelectedSlideIndex(lesson.slides.length);
      setShowAddSlideDialog(false);
    } catch (error) {
      console.error('Error creating slide:', error);
      setSnackbar({ open: true, message: 'Error al crear el slide', severity: 'error' });
    }
  };

  const handleUpdateSlide = async (slideId: number, data: LessonSlideUpdate) => {
    if (!lesson) return;

    try {
      const updated = await interactiveLessonApi.updateSlide(slideId, data);
      setLesson({
        ...lesson,
        slides: lesson.slides.map((s) => (s.id === slideId ? updated : s)),
      });
    } catch (error) {
      console.error('Error updating slide:', error);
      setSnackbar({ open: true, message: 'Error al actualizar el slide', severity: 'error' });
    }
  };

  const handleDeleteSlide = async (slideId: number) => {
    if (!lesson) return;

    try {
      await interactiveLessonApi.deleteSlide(slideId);
      const newSlides = lesson.slides.filter((s) => s.id !== slideId);
      setLesson({ ...lesson, slides: newSlides });

      if (selectedSlideIndex !== null && selectedSlideIndex >= newSlides.length) {
        setSelectedSlideIndex(newSlides.length > 0 ? newSlides.length - 1 : null);
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
      setSnackbar({ open: true, message: 'Error al eliminar el slide', severity: 'error' });
    }
  };

  const handleGenerateContent = async () => {
    if (!lesson || !aiFormData.tema.trim()) return;

    setGenerating(true);
    try {
      const result = await interactiveLessonApi.generateContent(lesson.id, {
        tema: aiFormData.tema,
        descripcion: aiFormData.descripcion || undefined,
        num_slides: aiFormData.num_slides,
        incluir_quiz: aiFormData.incluir_quiz,
        incluir_actividad: aiFormData.incluir_actividad,
      });

      // Reload the lesson to get the new slides
      await loadLesson();

      setShowAIDialog(false);
      setSnackbar({
        open: true,
        message: result.message,
        severity: 'success',
      });

      // Reset AI form
      setAiFormData({
        tema: '',
        descripcion: '',
        num_slides: 5,
        incluir_quiz: true,
        incluir_actividad: true,
      });
    } catch (error: any) {
      console.error('Error generating content:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Error al generar contenido con IA',
        severity: 'error',
      });
    } finally {
      setGenerating(false);
    }
  };

  const getDefaultContentForType = (type: SlideContentType): Record<string, unknown> => {
    switch (type) {
      case 'text':
        return { html: '<p>Escribe tu contenido aquí...</p>' };
      case 'image':
        return { url: '', alt_text: '', caption: '' };
      case 'video':
        return { url: '', provider: 'youtube', autoplay: false };
      case 'text_image':
        return { text: '', image_url: '', layout: 'left' };
      case 'quiz':
        return { html: '' };
      case 'interactive':
        return {};
      default:
        return {};
    }
  };

  const getSlideIcon = (type: SlideContentType) => {
    switch (type) {
      case 'text':
        return <TextFields />;
      case 'image':
        return <Image />;
      case 'video':
        return <VideoLibrary />;
      case 'text_image':
        return <TextFields />;
      case 'quiz':
        return <Quiz />;
      case 'interactive':
        return <TouchApp />;
      default:
        return <TextFields />;
    }
  };

  const selectedSlide = selectedSlideIndex !== null && lesson ? lesson.slides[selectedSlideIndex] : null;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>

        <TextField
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Título de la lección"
          variant="standard"
          sx={{ flex: 1 }}
          InputProps={{ sx: { fontSize: '1.5rem' } }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          {lesson?.status === 'draft' && (
            <Chip label="Borrador" color="warning" size="small" />
          )}
          {lesson?.status === 'published' && (
            <Chip label="Publicado" color="success" size="small" />
          )}

          <Tooltip title="Configuración">
            <IconButton onClick={() => setShowSettings(true)}>
              <Settings />
            </IconButton>
          </Tooltip>

          {lesson && (
            <Tooltip title="Vista previa">
              <IconButton onClick={() => window.open(`/admin/lesson/${lesson.id}/preview`, '_blank')}>
                <Visibility />
              </IconButton>
            </Tooltip>
          )}

          {lesson && (
            <Tooltip title="Generar contenido con IA">
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<AutoAwesome />}
                onClick={() => setShowAIDialog(true)}
                disabled={saving || generating}
              >
                IA
              </Button>
            </Tooltip>
          )}

          <Button
            variant="outlined"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving}
          >
            Guardar
          </Button>

          {lesson && lesson.status === 'draft' && (
            <Button
              variant="contained"
              startIcon={<Publish />}
              onClick={handlePublish}
              disabled={saving || lesson.slides.length === 0}
            >
              Publicar
            </Button>
          )}
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar - Slide List */}
        <Paper sx={{ width: 280, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Slides ({lesson?.slides.length || 0})
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => setShowAddSlideDialog(true)}
              disabled={!lesson}
            >
              Agregar
            </Button>
          </Box>

          <Divider />

          <List sx={{ py: 0 }}>
            {lesson?.slides.map((slide, index) => (
              <ListItemButton
                key={slide.id}
                selected={selectedSlideIndex === index}
                onClick={() => setSelectedSlideIndex(index)}
                sx={{
                  borderLeft: selectedSlideIndex === index ? 3 : 0,
                  borderColor: 'primary.main',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <DragIndicator sx={{ cursor: 'grab', color: 'text.disabled' }} />
                </ListItemIcon>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getSlideIcon(slide.slide_type)}
                </ListItemIcon>
                <ListItemText
                  primary={slide.title || `Slide ${index + 1}`}
                  secondary={slide.slide_type}
                  primaryTypographyProps={{ noWrap: true }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSlide(slide.id);
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItemButton>
            ))}
          </List>

          {lesson && lesson.slides.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                No hay slides
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AutoAwesome />}
                  onClick={() => setShowAIDialog(true)}
                  sx={{ bgcolor: 'secondary.main' }}
                >
                  Generar con IA
                </Button>
                <Typography variant="caption" color="text.secondary">
                  o
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setShowAddSlideDialog(true)}
                >
                  Agregar manualmente
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Main Editor Area */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto', bgcolor: 'grey.100' }}>
          {selectedSlide ? (
            <SlideEditor
              slide={selectedSlide}
              onUpdate={(data) => handleUpdateSlide(selectedSlide.id, data)}
            />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="text.secondary">
                {lesson ? 'Selecciona un slide para editar' : 'Guarda la lección para agregar slides'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Add Slide Dialog */}
      <Dialog open={showAddSlideDialog} onClose={() => setShowAddSlideDialog(false)}>
        <DialogTitle>Agregar Slide</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, pt: 1 }}>
            {[
              { type: 'text' as SlideContentType, label: 'Texto', icon: <TextFields /> },
              { type: 'image' as SlideContentType, label: 'Imagen', icon: <Image /> },
              { type: 'video' as SlideContentType, label: 'Video', icon: <VideoLibrary /> },
              { type: 'text_image' as SlideContentType, label: 'Texto + Imagen', icon: <TextFields /> },
              { type: 'quiz' as SlideContentType, label: 'Quiz', icon: <Quiz /> },
            ].map(({ type, label, icon }) => (
              <Paper
                key={type}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => handleAddSlide(type)}
              >
                {icon}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {label}
                </Typography>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddSlideDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configuración de la Lección</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Descripción"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Navegación</InputLabel>
              <Select
                value={formData.navigation_type || 'sequential'}
                label="Tipo de Navegación"
                onChange={(e) =>
                  setFormData({ ...formData, navigation_type: e.target.value as LessonNavigationType })
                }
              >
                <MenuItem value="sequential">Secuencial (siguiente/anterior)</MenuItem>
                <MenuItem value="free">Libre (navegación libre)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Duración estimada (minutos)"
              type="number"
              value={formData.estimated_duration_minutes || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimated_duration_minutes: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              fullWidth
            />

            <TextField
              label="Puntaje mínimo para aprobar (%)"
              type="number"
              value={formData.passing_score || 70}
              onChange={(e) =>
                setFormData({ ...formData, passing_score: parseInt(e.target.value) || 70 })
              }
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_required ?? true}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                />
              }
              label="Lección requerida"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onClose={() => !generating && setShowAIDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="secondary" />
            Generar Contenido con IA
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Ingresa el tema y la IA generará automáticamente slides, quizzes y actividades
              interactivas para tu lección.
            </Alert>

            <TextField
              label="Tema principal *"
              value={aiFormData.tema}
              onChange={(e) => setAiFormData({ ...aiFormData, tema: e.target.value })}
              placeholder="Ej: Uso correcto de EPP, Trabajo en alturas, Ergonomía..."
              fullWidth
              required
              disabled={generating}
            />

            <TextField
              label="Descripción adicional (opcional)"
              value={aiFormData.descripcion}
              onChange={(e) => setAiFormData({ ...aiFormData, descripcion: e.target.value })}
              placeholder="Detalles específicos que deseas incluir..."
              multiline
              rows={2}
              fullWidth
              disabled={generating}
            />

            <TextField
              label="Número de slides"
              type="number"
              value={aiFormData.num_slides}
              onChange={(e) =>
                setAiFormData({
                  ...aiFormData,
                  num_slides: Math.max(3, Math.min(10, parseInt(e.target.value) || 5)),
                })
              }
              fullWidth
              inputProps={{ min: 3, max: 10 }}
              helperText="Entre 3 y 10 slides"
              disabled={generating}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={aiFormData.incluir_quiz}
                  onChange={(e) => setAiFormData({ ...aiFormData, incluir_quiz: e.target.checked })}
                  disabled={generating}
                />
              }
              label="Incluir preguntas de quiz"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={aiFormData.incluir_actividad}
                  onChange={(e) => setAiFormData({ ...aiFormData, incluir_actividad: e.target.checked })}
                  disabled={generating}
                />
              }
              label="Incluir actividad interactiva"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAIDialog(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleGenerateContent}
            disabled={generating || !aiFormData.tema.trim()}
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
          >
            {generating ? 'Generando...' : 'Generar Contenido'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LessonBuilder;
