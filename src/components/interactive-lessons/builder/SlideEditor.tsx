import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Radio,
  RadioGroup,
  Chip,
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  CheckCircle,
} from '@mui/icons-material';
import {
  LessonSlide,
  LessonSlideUpdate,
  SlideContentType,
  InlineQuizCreate,
  InlineQuizAnswerCreate,
  InlineQuestionType,
  TextContent,
  ImageContent,
  VideoContent,
  TextImageContent,
} from '../../../types/interactiveLesson';

interface SlideEditorProps {
  slide: LessonSlide;
  onUpdate: (data: LessonSlideUpdate) => void;
}

const SlideEditor: React.FC<SlideEditorProps> = ({ slide, onUpdate }) => {
  const [title, setTitle] = useState(slide.title || '');
  const [content, setContent] = useState(slide.content);
  const [isRequired, setIsRequired] = useState(slide.is_required);
  const [notes, setNotes] = useState(slide.notes || '');

  // Quiz state
  const [hasQuiz, setHasQuiz] = useState(!!slide.inline_quiz);
  const [quizQuestion, setQuizQuestion] = useState(slide.inline_quiz?.question_text || '');
  const [quizType, setQuizType] = useState<InlineQuestionType>(
    slide.inline_quiz?.question_type || 'multiple_choice'
  );
  const [quizPoints, setQuizPoints] = useState(slide.inline_quiz?.points || 1);
  const [quizExplanation, setQuizExplanation] = useState(slide.inline_quiz?.explanation || '');
  const [quizRequired, setQuizRequired] = useState(slide.inline_quiz?.required_to_continue || false);
  const [quizShowFeedback, setQuizShowFeedback] = useState(
    slide.inline_quiz?.show_feedback_immediately ?? true
  );
  const [quizAnswers, setQuizAnswers] = useState<InlineQuizAnswerCreate[]>(
    slide.inline_quiz?.answers.map((a) => ({
      answer_text: a.answer_text,
      is_correct: a.is_correct,
      order_index: a.order_index,
      explanation: a.explanation,
    })) || [
      { answer_text: '', is_correct: true, order_index: 0 },
      { answer_text: '', is_correct: false, order_index: 1 },
    ]
  );

  // Reset state when slide changes
  useEffect(() => {
    setTitle(slide.title || '');
    setContent(slide.content);
    setIsRequired(slide.is_required);
    setNotes(slide.notes || '');
    setHasQuiz(!!slide.inline_quiz);
    if (slide.inline_quiz) {
      setQuizQuestion(slide.inline_quiz.question_text);
      setQuizType(slide.inline_quiz.question_type);
      setQuizPoints(slide.inline_quiz.points);
      setQuizExplanation(slide.inline_quiz.explanation || '');
      setQuizRequired(slide.inline_quiz.required_to_continue);
      setQuizShowFeedback(slide.inline_quiz.show_feedback_immediately);
      setQuizAnswers(
        slide.inline_quiz.answers.map((a) => ({
          answer_text: a.answer_text,
          is_correct: a.is_correct,
          order_index: a.order_index,
          explanation: a.explanation,
        }))
      );
    } else {
      setQuizQuestion('');
      setQuizType('multiple_choice');
      setQuizPoints(1);
      setQuizExplanation('');
      setQuizRequired(false);
      setQuizShowFeedback(true);
      setQuizAnswers([
        { answer_text: '', is_correct: true, order_index: 0 },
        { answer_text: '', is_correct: false, order_index: 1 },
      ]);
    }
  }, [slide.id]);

  const handleSave = () => {
    const updateData: LessonSlideUpdate = {
      title,
      content,
      is_required: isRequired,
      notes: notes || undefined,
    };

    if (hasQuiz && quizQuestion) {
      updateData.inline_quiz = {
        question_text: quizQuestion,
        question_type: quizType,
        points: quizPoints,
        explanation: quizExplanation || undefined,
        required_to_continue: quizRequired,
        show_feedback_immediately: quizShowFeedback,
        answers: quizAnswers.filter((a) => a.answer_text.trim()),
      };
    }

    onUpdate(updateData);
  };

  const handleContentChange = (field: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAnswer = () => {
    setQuizAnswers([
      ...quizAnswers,
      { answer_text: '', is_correct: false, order_index: quizAnswers.length },
    ]);
  };

  const handleRemoveAnswer = (index: number) => {
    setQuizAnswers(quizAnswers.filter((_, i) => i !== index));
  };

  const handleAnswerChange = (index: number, field: string, value: unknown) => {
    setQuizAnswers(
      quizAnswers.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const handleSetCorrectAnswer = (index: number) => {
    setQuizAnswers(
      quizAnswers.map((a, i) => ({ ...a, is_correct: i === index }))
    );
  };

  const renderContentEditor = () => {
    switch (slide.slide_type) {
      case 'text':
        return (
          <TextField
            label="Contenido HTML"
            multiline
            rows={10}
            fullWidth
            value={(content as TextContent)?.html || ''}
            onChange={(e) => handleContentChange('html', e.target.value)}
            helperText="Puedes usar HTML básico para formatear el texto"
          />
        );

      case 'image':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="URL de la imagen"
              fullWidth
              value={(content as ImageContent)?.url || ''}
              onChange={(e) => handleContentChange('url', e.target.value)}
            />
            {(content as ImageContent)?.url && (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={(content as ImageContent).url}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: 300 }}
                />
              </Box>
            )}
            <TextField
              label="Texto alternativo"
              fullWidth
              value={(content as ImageContent)?.alt_text || ''}
              onChange={(e) => handleContentChange('alt_text', e.target.value)}
            />
            <TextField
              label="Pie de imagen"
              fullWidth
              value={(content as ImageContent)?.caption || ''}
              onChange={(e) => handleContentChange('caption', e.target.value)}
            />
          </Box>
        );

      case 'video':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="URL del video"
              fullWidth
              value={(content as VideoContent)?.url || ''}
              onChange={(e) => handleContentChange('url', e.target.value)}
              helperText="YouTube, Vimeo o URL directa"
            />
            <FormControl fullWidth>
              <InputLabel>Proveedor</InputLabel>
              <Select
                value={(content as VideoContent)?.provider || 'youtube'}
                label="Proveedor"
                onChange={(e) => handleContentChange('provider', e.target.value)}
              >
                <MenuItem value="youtube">YouTube</MenuItem>
                <MenuItem value="vimeo">Vimeo</MenuItem>
                <MenuItem value="local">Local/Directo</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={(content as VideoContent)?.autoplay || false}
                  onChange={(e) => handleContentChange('autoplay', e.target.checked)}
                />
              }
              label="Reproducir automáticamente"
            />
          </Box>
        );

      case 'text_image':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Texto"
              multiline
              rows={4}
              fullWidth
              value={(content as TextImageContent)?.text || ''}
              onChange={(e) => handleContentChange('text', e.target.value)}
            />
            <TextField
              label="URL de la imagen"
              fullWidth
              value={(content as TextImageContent)?.image_url || ''}
              onChange={(e) => handleContentChange('image_url', e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Disposición</InputLabel>
              <Select
                value={(content as TextImageContent)?.layout || 'left'}
                label="Disposición"
                onChange={(e) => handleContentChange('layout', e.target.value)}
              >
                <MenuItem value="left">Imagen a la izquierda</MenuItem>
                <MenuItem value="right">Imagen a la derecha</MenuItem>
                <MenuItem value="top">Imagen arriba</MenuItem>
                <MenuItem value="bottom">Imagen abajo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );

      default:
        return (
          <Typography color="text.secondary">
            Editor no disponible para este tipo de contenido
          </Typography>
        );
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Title and Settings */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Título del slide"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ flex: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
              />
            }
            label="Requerido"
          />
        </Box>

        <Chip label={slide.slide_type} size="small" sx={{ alignSelf: 'flex-start' }} />

        <Divider />

        {/* Content Editor */}
        <Typography variant="subtitle1" fontWeight="bold">
          Contenido
        </Typography>
        {renderContentEditor()}

        {/* Quiz Section */}
        <Accordion expanded={hasQuiz} onChange={(_, expanded) => setHasQuiz(expanded)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Quiz Integrado</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Pregunta"
                multiline
                rows={2}
                fullWidth
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
              />

              <FormControl fullWidth>
                <InputLabel>Tipo de pregunta</InputLabel>
                <Select
                  value={quizType}
                  label="Tipo de pregunta"
                  onChange={(e) => setQuizType(e.target.value as InlineQuestionType)}
                >
                  <MenuItem value="multiple_choice">Opción múltiple</MenuItem>
                  <MenuItem value="true_false">Verdadero/Falso</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Respuestas
              </Typography>

              <List>
                {quizAnswers.map((answer, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <Radio
                      checked={answer.is_correct}
                      onChange={() => handleSetCorrectAnswer(index)}
                    />
                    <ListItemText>
                      <TextField
                        fullWidth
                        size="small"
                        value={answer.answer_text}
                        onChange={(e) => handleAnswerChange(index, 'answer_text', e.target.value)}
                        placeholder={`Respuesta ${index + 1}`}
                        InputProps={{
                          endAdornment: answer.is_correct && (
                            <CheckCircle color="success" fontSize="small" />
                          ),
                        }}
                      />
                    </ListItemText>
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveAnswer(index)}
                        disabled={quizAnswers.length <= 2}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Button
                startIcon={<Add />}
                onClick={handleAddAnswer}
                disabled={quizAnswers.length >= 6}
              >
                Agregar respuesta
              </Button>

              <Divider />

              <TextField
                label="Explicación (mostrar después de responder)"
                multiline
                rows={2}
                fullWidth
                value={quizExplanation}
                onChange={(e) => setQuizExplanation(e.target.value)}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Puntos"
                  type="number"
                  value={quizPoints}
                  onChange={(e) => setQuizPoints(parseFloat(e.target.value) || 1)}
                  sx={{ width: 120 }}
                  inputProps={{ min: 0, step: 0.5 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={quizRequired}
                      onChange={(e) => setQuizRequired(e.target.checked)}
                    />
                  }
                  label="Requerido para continuar"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={quizShowFeedback}
                      onChange={(e) => setQuizShowFeedback(e.target.checked)}
                    />
                  }
                  label="Mostrar feedback inmediato"
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Notes */}
        <TextField
          label="Notas del instructor"
          multiline
          rows={2}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          helperText="Estas notas no se muestran a los estudiantes"
        />

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave}>
            Guardar cambios
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default SlideEditor;
