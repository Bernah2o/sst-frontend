import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Container,
  alpha,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowBack,
  ArrowForward,
  Close,
  CheckCircle,
  Cancel,
  PlayArrow,
  TouchApp,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  InteractiveLesson,
  LessonSlide,
  UserLessonProgress,
  UserSlideProgress,
  QuizSubmitResponse,
  TextContent,
  ImageContent,
  VideoContent,
  TextImageContent,
} from '../../../types/interactiveLesson';
import interactiveLessonApi from '../../../services/interactiveLessonApi';

interface LessonViewerProps {
  lessonId?: number;
  isPreview?: boolean;
}

// Styled Components for Professional Look
const MainContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: '#f8fafc',
  backgroundImage: `radial-gradient(at 0% 0%, ${alpha(theme.palette.primary.light, 0.1)} 0, transparent 50%), 
                    radial-gradient(at 50% 0%, ${alpha(theme.palette.secondary.light, 0.05)} 0, transparent 50%)`,
}));

const HeaderPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  flexShrink: 0,
  zIndex: 10,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(4, 2),
  overflow: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
}));

const ViewerPaper = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: '900px',
  minHeight: '400px',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  transition: 'all 0.3s ease-in-out',
  display: 'flex',
  flexDirection: 'column',
}));

const SlideHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.02)} 30%, ${alpha(theme.palette.primary.main, 0.05)} 90%)`,
}));

const MediaWrapper = styled(Box)(({ theme }) => ({
  margin: theme.spacing(2, 0),
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
  boxShadow: theme.shadows[4],
  backgroundColor: theme.palette.common.black,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
}));

const StyledQuizOption = styled(FormControlLabel)<{ selected?: boolean; correct?: boolean; incorrect?: boolean }>(({ theme, selected, correct, incorrect }) => ({
  width: '100%',
  margin: theme.spacing(1, 0),
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(1),
  border: '2px solid',
  borderColor: correct 
    ? theme.palette.success.main 
    : incorrect 
      ? theme.palette.error.main 
      : selected 
        ? theme.palette.primary.main 
        : alpha(theme.palette.divider, 0.2),
  backgroundColor: correct 
    ? alpha(theme.palette.success.main, 0.05) 
    : incorrect 
      ? alpha(theme.palette.error.main, 0.05) 
      : selected 
        ? alpha(theme.palette.primary.main, 0.05) 
        : theme.palette.background.paper,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
    transform: 'translateX(4px)',
  },
  '& .MuiTypography-root': {
    fontWeight: selected ? 600 : 400,
    width: '100%',
  }
}));

const FooterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2, 4),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
  boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.1)',
}));

const LessonViewer: React.FC<LessonViewerProps> = ({ lessonId: propLessonId, isPreview = false }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const params = useParams<{ lessonId: string }>();
  const lessonId = propLessonId || (params.lessonId ? parseInt(params.lessonId) : undefined);

  // State
  const [lesson, setLesson] = useState<InteractiveLesson | null>(null);
  const [progress, setProgress] = useState<UserLessonProgress | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizSubmitResponse | null>(null);

  // Completion dialog
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  // Quiz not passed dialog
  const [showNotPassedDialog, setShowNotPassedDialog] = useState(false);
  const [notPassedMessage, setNotPassedMessage] = useState('');

  // Retry countdown state
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  const currentSlide = lesson?.slides[currentSlideIndex];

  const loadLesson = useCallback(async () => {
    if (!lessonId) return;

    setLoading(true);
    setError(null);

    try {
      // In preview mode, only load the lesson data (no progress tracking)
      if (isPreview) {
        const lessonData = await interactiveLessonApi.getLesson(lessonId);
        setLesson(lessonData);
        setLoading(false);
        return;
      }

      const [lessonData, progressData] = await Promise.all([
        interactiveLessonApi.getLesson(lessonId),
        interactiveLessonApi.getLessonProgress(lessonId).catch(() => null),
      ]);

      setLesson(lessonData);
      setProgress(progressData);

      // Start lesson if not started
      if (!progressData || progressData.status === 'not_started') {
        const newProgress = await interactiveLessonApi.startLesson(lessonId);
        setProgress(newProgress);
      } else if (progressData.current_slide_index > 0) {
        setCurrentSlideIndex(progressData.current_slide_index);
      }
    } catch (err) {
      console.error('Error loading lesson:', err);
      setError('No se pudo cargar la lección. Verifique que está inscrito en el curso.');
    } finally {
      setLoading(false);
    }
  }, [lessonId, isPreview]);

  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  // Reset quiz state when slide changes
  useEffect(() => {
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setQuizResult(null);
    setRetryCountdown(null);
  }, [currentSlideIndex]);

  // Countdown timer effect
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return;

    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null || prev <= 1) {
          // Countdown finished - reset quiz state to allow retry
          setQuizSubmitted(false);
          setQuizResult(null);
          setSelectedAnswer(null);
          // Reload progress from server
          if (lesson && !isPreview) {
            interactiveLessonApi.getLessonProgress(lesson.id).then(setProgress).catch(console.error);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryCountdown, lesson, isPreview]);

  const isSlideViewed = (slideId: number): boolean => {
    if (isPreview) return true; // In preview mode, all slides are "viewable"
    return progress?.slide_progress.some((sp) => sp.slide_id === slideId && sp.viewed) || false;
  };

  const isQuizAnswered = (slideId: number): boolean => {
    if (isPreview) return quizSubmitted; // In preview, use local state
    return progress?.slide_progress.some((sp) => sp.slide_id === slideId && sp.quiz_answered) || false;
  };

  const handleSlideView = async () => {
    // Skip progress tracking in preview mode
    if (isPreview) return;
    if (!lesson || !currentSlide || isSlideViewed(currentSlide.id)) return;

    try {
      await interactiveLessonApi.markSlideViewed(lesson.id, currentSlide.id);
      // Reload progress
      const newProgress = await interactiveLessonApi.getLessonProgress(lesson.id);
      setProgress(newProgress);
    } catch (err) {
      console.error('Error marking slide as viewed:', err);
    }
  };

  // Mark slide as viewed when it's displayed
  useEffect(() => {
    if (currentSlide && !isPreview) {
      handleSlideView();
    }
  }, [currentSlide?.id, isPreview]);

  const handleQuizSubmit = async () => {
    if (!lesson || !currentSlide || selectedAnswer === null) return;

    // In preview mode, just show local feedback without API call
    if (isPreview) {
      const quiz = currentSlide.inline_quiz;
      if (quiz) {
        const correctAnswer = quiz.answers.find(a => a.is_correct);
        const isCorrect = correctAnswer?.id === selectedAnswer;
        setQuizResult({
          is_correct: isCorrect,
          correct_answer_id: correctAnswer?.id || 0,
          points_earned: isCorrect ? quiz.points : 0,
          explanation: quiz.explanation,
          attempts_used: 1,
          attempts_remaining: 2,
          can_retry: !isCorrect,
        });
        setQuizSubmitted(true);
      }
      return;
    }

    try {
      const result = await interactiveLessonApi.submitQuizAnswer(lesson.id, currentSlide.id, {
        selected_answer_id: selectedAnswer,
      });
      setQuizResult(result);

      // Solo marcar como completado si es correcta O no quedan intentos
      if (result.is_correct || !result.can_retry) {
        setQuizSubmitted(true);

        // Si agotó intentos y hay tiempo de espera, iniciar countdown
        if (!result.is_correct && result.retry_available_in_seconds) {
          setRetryCountdown(result.retry_available_in_seconds);
        }
      }
      // Si puede reintentar, limpiar la selección después de mostrar el resultado
      if (result.can_retry) {
        setTimeout(() => {
          setSelectedAnswer(null);
        }, 2000);
      }

      // Reload progress
      const newProgress = await interactiveLessonApi.getLessonProgress(lesson.id);
      setProgress(newProgress);
    } catch (err: unknown) {
      console.error('Error submitting quiz:', err);
      // Check if error is about exhausted attempts or cooldown
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null;

      if (errorMessage) {
        // Check if it's a cooldown error (e.g., "Debe esperar X segundos para reintentar")
        const cooldownMatch = errorMessage.match(/esperar (\d+) segundos/);
        if (cooldownMatch) {
          const remainingSeconds = parseInt(cooldownMatch[1]);
          setRetryCountdown(remainingSeconds);
          setQuizResult({
            is_correct: false,
            points_earned: 0,
            attempts_used: 3,
            attempts_remaining: 0,
            can_retry: false,
            retry_available_in_seconds: remainingSeconds,
          });
          setQuizSubmitted(true);
        } else {
          setQuizResult({
            is_correct: false,
            points_earned: 0,
            attempts_used: 3,
            attempts_remaining: 0,
            can_retry: false,
          });
          setQuizSubmitted(true);
        }
      }
    }
  };

  const handleNext = () => {
    if (!lesson) return;

    // In preview mode, skip quiz requirement checks
    if (!isPreview) {
      // Check if quiz is required and not answered
      if (
        currentSlide?.inline_quiz?.required_to_continue &&
        !isQuizAnswered(currentSlide.id) &&
        !quizSubmitted
      ) {
        return;
      }
    }

    if (currentSlideIndex < lesson.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      // Last slide - try to complete (only if not preview)
      if (!isPreview) {
        handleComplete();
      } else {
        setShowCompletionDialog(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (!lesson) return;

    // In preview mode, allow free navigation
    if (isPreview) {
      setCurrentSlideIndex(index);
      return;
    }

    // Only allow navigation if lesson allows free navigation or slide is already viewed
    if (lesson.navigation_type === 'free' || isSlideViewed(lesson.slides[index].id)) {
      setCurrentSlideIndex(index);
    }
  };

  const handleComplete = async () => {
    if (!lesson) return;

    if (isPreview) {
      setShowCompletionDialog(true);
      return;
    }

    try {
      await interactiveLessonApi.completeLesson(lesson.id);
      setShowCompletionDialog(true);
    } catch (err: unknown) {
      console.error('Error completing lesson:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Error al completar la lección';

      // Check if it's a passing score error
      if (errorMessage && errorMessage.includes('puntaje mínimo requerido')) {
        setNotPassedMessage(errorMessage);
        setShowNotPassedDialog(true);
      } else {
        setError(errorMessage || 'Error al completar la lección');
      }
    }
  };

  const renderSlideContent = () => {
    if (!currentSlide) return null;

    switch (currentSlide.slide_type) {
      case 'text':
        return (
          <Box
            sx={{ 
              p: 4,
              '& p': { mb: 2, lineHeight: 1.7, fontSize: '1.1rem' },
              '& h1, & h2, & h3': { color: 'primary.main', mb: 2 }
            }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((currentSlide.content as TextContent)?.html || '') }}
          />
        );

      case 'image':
        const imageContent = currentSlide.content as ImageContent;
        return (
          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <MediaWrapper sx={{ width: 'fit-content', p: 1 }}>
              {imageContent?.url && (
                <img
                  src={imageContent.url}
                  alt={imageContent.alt_text || 'Imagen'}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '60vh',
                    borderRadius: '8px',
                    display: 'block'
                  }}
                />
              )}
            </MediaWrapper>
            {imageContent?.caption && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic', textAlign: 'center' }}>
                {imageContent.caption}
              </Typography>
            )}
          </Box>
        );

      case 'video':
        const videoContent = currentSlide.content as VideoContent;
        return (
          <Box sx={{ p: 4 }}>
            <MediaWrapper>
              {videoContent?.url && renderVideo(videoContent)}
            </MediaWrapper>
          </Box>
        );

      case 'text_image':
        const textImageContent = currentSlide.content as TextImageContent;
        const layout = textImageContent?.layout || 'left';
        const isHorizontal = layout === 'left' || layout === 'right';

        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: isHorizontal
                ? layout === 'left'
                  ? 'row'
                  : 'row-reverse'
                : layout === 'top'
                ? 'column'
                : 'column-reverse',
              gap: 4,
              p: 4,
              alignItems: isHorizontal ? 'center' : 'stretch',
            }}
          >
            {textImageContent?.image_url && (
              <Box sx={{ flex: isHorizontal ? '0 0 45%' : 'none' }}>
                <MediaWrapper sx={{ p: 0.5 }}>
                  <img
                    src={textImageContent.image_url}
                    alt=""
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: isHorizontal ? '50vh' : '40vh',
                      borderRadius: '4px',
                      display: 'block'
                    }}
                  />
                </MediaWrapper>
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.8, 
                  fontSize: '1.05rem',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {textImageContent?.text}
              </Typography>
            </Box>
          </Box>
        );

      case 'quiz':
        // Case for slides that are specifically for a quiz
        return (
          <Box
            sx={{ 
              p: 4,
              '& p': { mb: 2, lineHeight: 1.7, fontSize: '1.1rem' },
              '& h1, & h2, & h3': { color: 'primary.main', mb: 2 }
            }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((currentSlide.content as TextContent)?.html || '') }}
          />
        );

      case 'interactive':
        // Placeholder for interactive activities (to be implemented)
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <TouchApp sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary">
              Actividad Interactiva
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Esta actividad estará disponible próximamente.
            </Typography>
          </Box>
        );

      default:
        return (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">Contenido no disponible</Typography>
          </Box>
        );
    }
  };

  const renderVideo = (videoContent: VideoContent) => {
    const url = videoContent.url;
    const provider = videoContent.provider || 'youtube';

    if (provider === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
      if (videoId) {
        return (
          <iframe
            width="100%"
            height="400"
            src={`https://www.youtube.com/embed/${videoId}${videoContent.autoplay ? '?autoplay=1' : ''}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
    } else if (provider === 'vimeo') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${videoId}${videoContent.autoplay ? '?autoplay=1' : ''}`}
            width="100%"
            height="400"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        );
      }
    }

    return (
      <video width="100%" height="400" controls autoPlay={videoContent.autoplay}>
        <source src={url} />
        Tu navegador no soporta videos
      </video>
    );
  };

  const renderQuiz = () => {
    if (!currentSlide?.inline_quiz) return null;

    const quiz = currentSlide.inline_quiz;
    const alreadyAnswered = isQuizAnswered(currentSlide.id);

    if (alreadyAnswered && !quizSubmitted) {
      const slideProgress = progress?.slide_progress.find((sp) => sp.slide_id === currentSlide.id);
      return (
        <Box sx={{ p: 4, mt: 0, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Alert 
            severity={slideProgress?.quiz_correct ? 'success' : 'error'}
            variant="filled"
            sx={{ borderRadius: 2 }}
            icon={slideProgress?.quiz_correct ? <CheckCircle fontSize="inherit" /> : <Cancel fontSize="inherit" />}
          >
            <Typography fontWeight="bold">
              {slideProgress?.quiz_correct ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}
            </Typography>
            {quiz.explanation && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {quiz.explanation}
              </Typography>
            )}
          </Alert>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 4, mt: 0, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
          Mini-Evaluación
        </Typography>
        <Typography variant="subtitle1" fontWeight="500" gutterBottom sx={{ mb: 3 }}>
          {quiz.question_text}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {quiz.required_to_continue && (
            <Chip
              label="Requerido para continuar"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ borderStyle: 'dashed' }}
            />
          )}
          <Chip
            label={
              retryCountdown
                ? `Reintentar en ${retryCountdown}s`
                : `${quizResult ? 3 - (quizResult.attempts_used || 0) : 3} intentos restantes`
            }
            size="small"
            color={retryCountdown ? 'info' : (quizResult && quizResult.attempts_remaining === 0 ? 'error' : 'info')}
            variant="outlined"
          />
        </Box>

        <RadioGroup
          value={selectedAnswer}
          onChange={(e) => setSelectedAnswer(parseInt(e.target.value))}
        >
          {quiz.answers.map((answer) => {
            const isCorrect = answer.id === quizResult?.correct_answer_id;
            const isSelected = answer.id === selectedAnswer;
            const showCorrect = quizSubmitted && isCorrect;
            const showIncorrect = quizSubmitted && isSelected && !quizResult?.is_correct;

            return (
              <StyledQuizOption
                key={answer.id}
                value={answer.id}
                control={<Radio />}
                label={answer.answer_text}
                disabled={quizSubmitted}
                selected={isSelected}
                correct={showCorrect}
                incorrect={showIncorrect}
              />
            );
          })}
        </RadioGroup>

        {/* Mostrar resultado después de enviar */}
        {quizResult && (
          <Box sx={{ mt: 3 }}>
            <Alert
              severity={quizResult.is_correct ? 'success' : quizResult.can_retry ? 'warning' : retryCountdown ? 'info' : 'error'}
              variant="outlined"
              sx={{ borderRadius: 2, borderWidth: 2 }}
            >
              <Typography fontWeight="bold" gutterBottom>
                {quizResult.is_correct
                  ? `¡Increíble! +${quizResult.points_earned} puntos obtenidos.`
                  : quizResult.can_retry
                    ? `Respuesta incorrecta. Te quedan ${quizResult.attempts_remaining} intento(s).`
                    : retryCountdown
                      ? `Has agotado tus intentos. Podrás reintentar en ${retryCountdown} segundo(s).`
                      : 'Has agotado tus intentos.'}
              </Typography>
              {quizResult.explanation && (
                <Typography variant="body2">
                  {quizResult.explanation}
                </Typography>
              )}
              {quizResult.can_retry && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Selecciona otra respuesta e intenta de nuevo.
                </Typography>
              )}
              {retryCountdown && retryCountdown > 0 && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  La evaluación se habilitará automáticamente cuando termine el tiempo.
                </Typography>
              )}
            </Alert>
          </Box>
        )}

        {!quizSubmitted && (
          <Button
            variant="contained"
            size="large"
            onClick={handleQuizSubmit}
            disabled={selectedAnswer === null}
            sx={{ 
              mt: 3, 
              borderRadius: 2,
              px: 4,
              boxShadow: theme.shadows[4],
              '&:hover': {
                boxShadow: theme.shadows[8],
              }
            }}
          >
            Confirmar Respuesta
          </Button>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  if (!lesson) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Lección no encontrada</Alert>
      </Box>
    );
  }

  const progressPercentage = isPreview ? 0 : (progress?.progress_percentage || 0);
  const canGoNext = isPreview ||
    !currentSlide?.inline_quiz?.required_to_continue ||
    isQuizAnswered(currentSlide.id) ||
    quizSubmitted;

  return (
    <MainContainer>
      {/* Header */}
      <HeaderPaper elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton 
            onClick={() => navigate(-1)}
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
            }}
          >
            <ArrowBack color="primary" />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
              {lesson.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isPreview ? 'Vista Previa de Administrador' : 'Lección Interactiva'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {isPreview ? 'MODO PREVIEW' : `${Math.round(progressPercentage)}% completado`}
            </Typography>
            {!isPreview && (
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{ 
                  height: 6, 
                  borderRadius: 3, 
                  width: 150, 
                  mt: 0.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ overflowX: 'auto', pb: 1, pt: 1 }}>
          <Stepper activeStep={currentSlideIndex} nonLinear alternativeLabel>
            {lesson.slides.map((slide, index) => (
              <Step key={slide.id} completed={isSlideViewed(slide.id)}>
                <StepButton onClick={() => handleStepClick(index)}>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem' } }}>
                    {slide.title || `Slide ${index + 1}`}
                  </StepLabel>
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </Box>
      </HeaderPaper>

      {/* Content Area */}
      <ContentArea>
        <ViewerPaper elevation={0}>
          {currentSlide?.title && (
            <SlideHeader>
              <Typography variant="h4" fontWeight="800" color="primary.dark">
                {currentSlide.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  label={`Slide ${currentSlideIndex + 1} de ${lesson.slides.length}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ borderColor: alpha(theme.palette.primary.main, 0.3) }}
                />
                {currentSlide.is_required && (
                  <Chip label="Requerido" size="small" color="primary" variant="filled" />
                )}
              </Box>
            </SlideHeader>
          )}

          <Box sx={{ flex: 1 }}>
            {renderSlideContent()}
          </Box>
          
          {renderQuiz()}
        </ViewerPaper>
      </ContentArea>

      {/* Navigation Footer */}
      <FooterPaper elevation={0}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handlePrevious}
          disabled={currentSlideIndex === 0}
          variant="outlined"
          sx={{ borderRadius: 2, px: 3 }}
        >
          Anterior
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">
            PROGRESO
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {lesson.slides.map((_, idx) => (
              <Box 
                key={idx}
                sx={{ 
                  width: 20, 
                  height: 4, 
                  borderRadius: 2,
                  bgcolor: idx === currentSlideIndex 
                    ? 'primary.main' 
                    : idx < currentSlideIndex 
                      ? alpha(theme.palette.primary.main, 0.4) 
                      : alpha(theme.palette.divider, 0.3),
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Box>
        </Box>

        <Button
          endIcon={currentSlideIndex === lesson.slides.length - 1 ? <CheckCircle /> : <ArrowForward />}
          onClick={handleNext}
          disabled={!canGoNext}
          variant="contained"
          color={currentSlideIndex === lesson.slides.length - 1 ? 'success' : 'primary'}
          sx={{ 
            borderRadius: 2, 
            px: 4,
            boxShadow: currentSlideIndex === lesson.slides.length - 1 ? theme.shadows[4] : 'none'
          }}
        >
          {currentSlideIndex === lesson.slides.length - 1
            ? (isPreview ? 'Finalizar Vista Previa' : 'Finalizar Lección')
            : 'Siguiente Slide'}
        </Button>
      </FooterPaper>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onClose={() => navigate(-1)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold">
            {isPreview ? 'Vista Previa Finalizada' : '¡Lección Completada!'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          {isPreview ? (
            <Typography color="text.secondary">
              Has revisado todos los contenidos de "{lesson.title}".
              Recuerda que esta es una vista previa para administradores.
            </Typography>
          ) : (
            <>
              <Typography color="text.secondary" gutterBottom>
                ¡Felicidades! Has completado exitosamente esta lección.
              </Typography>
              {progress?.quiz_score !== undefined && progress.quiz_score !== null && (
                <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {Math.round(progress.quiz_score)}%
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    Calificación en Quizzes
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4 }}>
          <Button
            onClick={() => navigate(-1)}
            variant="contained"
            size="large"
            sx={{ borderRadius: 2, px: 6 }}
          >
            {isPreview ? 'Salir de Vista Previa' : 'Volver al Curso'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quiz Not Passed Dialog */}
      <Dialog open={showNotPassedDialog} onClose={() => setShowNotPassedDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Cancel sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold">
            Puntaje Insuficiente
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Typography color="text.secondary" gutterBottom>
            {notPassedMessage}
          </Typography>
          <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
            <Typography variant="body2" color="warning.dark">
              💡 <strong>Sugerencia:</strong> Revisa los slides con quizzes y asegúrate de responder correctamente para obtener el puntaje necesario.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4, flexDirection: 'column', gap: 1 }}>
          <Button
            onClick={() => {
              setShowNotPassedDialog(false);
              // Go back to first quiz slide
              const firstQuizIndex = lesson.slides.findIndex(s => s.inline_quiz);
              if (firstQuizIndex >= 0) {
                setCurrentSlideIndex(firstQuizIndex);
              }
            }}
            variant="contained"
            color="primary"
            size="large"
            sx={{ borderRadius: 2, px: 4 }}
          >
            Revisar Quizzes
          </Button>
          <Button
            onClick={() => setShowNotPassedDialog(false)}
            variant="text"
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Continuar revisando
          </Button>
        </DialogActions>
      </Dialog>
    </MainContainer>
  );
};

export default LessonViewer;
