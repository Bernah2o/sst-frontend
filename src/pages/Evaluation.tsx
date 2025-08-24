import React, { useState, useEffect } from "react";
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
  CardActions,
  Divider,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  Slider,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Visibility,
  Quiz,
  ExpandMore,
  CheckCircle,
  Cancel,
  Send,
  RestartAlt,
  Save,
  Timer,
} from "@mui/icons-material";
import { formatDate, formatDateTime } from '../utils/dateUtils';
import api from "./../services/api";
import { useAuth } from '../contexts/AuthContext';

interface Evaluation {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  course_id: number;
  course?: {
    title: string;
  };
  status: "draft" | "published" | "archived";
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts: number;
  randomize_questions: boolean;
  show_results_immediately: boolean;
  allow_review: boolean;
  expires_at?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  questions?: Question[];
}

interface Question {
  id: number;
  evaluation_id: number;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "open_text" | "matching" | "ordering";
  points: number;
  order_index: number;
  explanation?: string;
  image_url?: string;
  required: boolean;
  created_at: string;
  updated_at: string;
  answers?: Answer[];
}

interface Answer {
  id: number;
  question_id: number;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
  explanation?: string;
  created_at: string;
}

interface EvaluationFormData {
  title: string;
  description?: string;
  instructions?: string;
  course_id: number;
  status: "draft" | "published" | "archived";
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts: number;
  randomize_questions?: boolean;
  show_results_immediately?: boolean;
  allow_review?: boolean;
  expires_at?: string;
  questions?: QuestionFormData[];
}

interface QuestionFormData {
  id?: number;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "open_text" | "matching" | "ordering";
  points: number;
  order_index: number;
  explanation?: string;
  image_url?: string;
  required: boolean;
  answers: AnswerFormData[];
}

interface AnswerFormData {
  id?: number;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
  explanation?: string;
}

interface Course {
  id: number;
  title: string;
}

const EvaluationsManagement: React.FC = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEvaluations, setTotalEvaluations] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [formData, setFormData] = useState<EvaluationFormData>({
    title: "",
    description: "",
    instructions: "",
    course_id: 0,
    status: "draft",
    passing_score: 70,
    max_attempts: 3,
    randomize_questions: false,
    show_results_immediately: true,
    allow_review: true,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [viewingEvaluation, setViewingEvaluation] = useState<Evaluation | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingEvaluation, setDeletingEvaluation] = useState<Evaluation | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Employee response mode states
  const [isEmployeeResponseMode, setIsEmployeeResponseMode] = useState(false);
  const [evaluationToRespond, setEvaluationToRespond] = useState<Evaluation | null>(null);
  const [employeeAnswers, setEmployeeAnswers] = useState<{[key: number]: string}>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [employeeResponses, setEmployeeResponses] = useState<{[key: number]: any}>({});
  
  // Timer states
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  
  // Question management states
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionFormData | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number>(-1);
  const [questionFormData, setQuestionFormData] = useState<QuestionFormData>({
    question_text: "",
    question_type: "multiple_choice",
    points: 1,
    order_index: 0,
    required: true,
    answers: []
  });
  const [openDeleteQuestionDialog, setOpenDeleteQuestionDialog] = useState(false);
  const [deletingQuestionIndex, setDeletingQuestionIndex] = useState<number>(-1);
  
  // Answer management states
  const [openDeleteAnswerDialog, setOpenDeleteAnswerDialog] = useState(false);
  const [deletingAnswerIndex, setDeletingAnswerIndex] = useState<number>(-1);
  
  // Reset evaluation states
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [resettingEvaluation, setResettingEvaluation] = useState<Evaluation | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    // Detectar parámetro evaluation_id para modo de respuesta de empleado
    const urlParams = new URLSearchParams(window.location.search);
    const evaluationId = urlParams.get('evaluation_id');
    
    if (evaluationId && user?.rol === 'employee') {
      setIsEmployeeResponseMode(true);
      fetchEvaluationToRespond(parseInt(evaluationId));
    } else {
      setIsEmployeeResponseMode(false);
      fetchEvaluations();
      fetchCourses();
      if (user?.rol === 'employee') {
        fetchEmployeeResponses();
      }
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, user]);

  // Cleanup timer on component unmount or when exiting employee response mode
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Cleanup timer when exiting employee response mode
  useEffect(() => {
    if (!isEmployeeResponseMode && timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
      setTimeRemaining(null);
      setTimeExpired(false);
    }
  }, [isEmployeeResponseMode, timerInterval]);

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/');
      setCourses(response.data.items || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        skip: (page * rowsPerPage).toString(),
        limit: rowsPerPage.toString(),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await api.get(`/evaluations/?${params}`);
      setEvaluations(response.data.items || []);
      setTotalEvaluations(response.data.total || 0);
      
      // Calculate stats
      const statsResponse = await api.get('/evaluations/stats');
      setStats(statsResponse.data || {
        total: 0,
        draft: 0,
        published: 0,
        archived: 0,
      });
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      showSnackbar('Error al cargar las evaluaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine status priority
  const getStatusPriority = (status: string): number => {
    switch (status) {
      case 'completed': return 4;
      case 'in_progress': return 3;
      case 'blocked': return 2;
      case 'not_started': return 1;
      default: return 0;
    }
  };

  const fetchEmployeeResponses = async () => {
    try {
      const response = await api.get('/evaluations/my-results');
      const responses: {[key: number]: any} = {};
      
      // Check if response has the expected structure
      const results = response.data.success ? response.data.data : response.data;
      
      if (Array.isArray(results)) {
        results.forEach((result: any) => {
          const evaluationId = result.evaluation_id;
          
          // If we already have a response for this evaluation, keep the most relevant one
          if (responses[evaluationId]) {
            // Priority: completed > in_progress > blocked > not_started
            const currentPriority = getStatusPriority(responses[evaluationId].status);
            const newPriority = getStatusPriority(result.status);
            
            // Only update if the new result has higher priority or if it's completed
            if (newPriority > currentPriority || result.status === 'completed') {
              responses[evaluationId] = {
                responded: result.responded,
                passed: result.passed,
                status: result.status
              };
            }
          } else {
            responses[evaluationId] = {
              responded: result.responded,
              passed: result.passed,
              status: result.status
            };
          }
        });
      }
      
      setEmployeeResponses(responses);
    } catch (error) {
      console.error('Error fetching employee responses:', error);
    }
  };

  const fetchEvaluationToRespond = async (evaluationId: number) => {
    try {
      setLoading(true);
      
      // First, get the evaluation details
      const evaluationResponse = await api.get(`/evaluations/${evaluationId}`);
      
      // Check if there's already an in-progress evaluation
      const isInProgress = employeeResponses[evaluationId]?.status === 'in_progress';
      
      if (!isInProgress) {
        // Only start a new evaluation attempt if not already in progress
        const startResponse = await api.post(`/evaluations/${evaluationId}/start`);
        setEmployeeAnswers({});
      } else {
        // Load saved answers for evaluation in progress
        try {
          const savedAnswersResponse = await api.get(`/evaluations/${evaluationId}/user-answers`);
          if (savedAnswersResponse.data.success && savedAnswersResponse.data.data.user_answers) {
            const savedAnswers: { [key: number]: any } = {};
            savedAnswersResponse.data.data.user_answers.forEach((answer: any) => {
              if (answer.selected_answer_ids) {
                // For multiple choice questions
                try {
                  const selectedIds = JSON.parse(answer.selected_answer_ids);
                  savedAnswers[answer.question_id] = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
                } catch {
                  // If it's a single ID as string
                  savedAnswers[answer.question_id] = [parseInt(answer.selected_answer_ids)];
                }
              } else if (answer.answer_text) {
                // For open text questions
                savedAnswers[answer.question_id] = answer.answer_text;
              }
            });
            setEmployeeAnswers(savedAnswers);
          } else {
            setEmployeeAnswers({});
          }
        } catch (error) {
          console.error('Error loading saved answers:', error);
          setEmployeeAnswers({});
        }
      }
      
      setEvaluationToRespond(evaluationResponse.data);
      setIsEmployeeResponseMode(true);
      setStartTime(new Date());
      
      // Initialize timer if evaluation has time limit
      if (evaluationResponse.data.time_limit_minutes) {
        const timeInSeconds = evaluationResponse.data.time_limit_minutes * 60;
        setTimeRemaining(timeInSeconds);
        setTimeExpired(false);
        
        // Clear any existing timer
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        
        // Start countdown timer
        const interval = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(interval);
              setTimeExpired(true);
              // Auto-save evaluation when time expires
              handleSubmitEvaluation(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setTimerInterval(interval);
      } else {
        setTimeRemaining(null);
        setTimeExpired(false);
      }
    } catch (error: any) {
      console.error('Error fetching evaluation to respond:', error);
      console.error('Error details:', error.response?.data);
      showSnackbar(
        error.response?.data?.detail || 'Error al cargar la evaluación',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetEvaluation = (evaluation: Evaluation) => {
    setResettingEvaluation(evaluation);
    setOpenResetDialog(true);
  };

  const confirmResetEvaluation = async () => {
    if (!resettingEvaluation || !user) return;
    
    try {
      setResetLoading(true);
      await api.post(`/evaluations/${resettingEvaluation.id}/reset-status/${user.id}`);
      
      showSnackbar('Evaluación reiniciada exitosamente', 'success');
      setOpenResetDialog(false);
      setResettingEvaluation(null);
      
      // Refresh data
      fetchEvaluations();
      if (user.rol === 'employee') {
        fetchEmployeeResponses();
      }
    } catch (error: any) {
      console.error('Error resetting evaluation:', error);
      showSnackbar(
        error.response?.data?.detail || 'Error al reiniciar la evaluación',
        'error'
      );
    } finally {
      setResetLoading(false);
    }
  };

  const saveEvaluationProgress = async (showMessage: boolean = false) => {
    if (!evaluationToRespond) return;

    try {
      // Prepare user_answers for saving progress
      const user_answers = Object.entries(employeeAnswers).map(([questionId, answer]) => {
        const question = evaluationToRespond.questions?.find(q => q.id === parseInt(questionId));
        
        if (question?.question_type === 'multiple_choice' || question?.question_type === 'true_false') {
          return {
            question_id: parseInt(questionId),
            selected_answer_ids: JSON.stringify([parseInt(answer)]),
            time_spent_seconds: Math.floor((new Date().getTime() - (startTime?.getTime() || new Date().getTime())) / 1000)
          };
        } else {
          return {
            question_id: parseInt(questionId),
            answer_text: answer,
            time_spent_seconds: Math.floor((new Date().getTime() - (startTime?.getTime() || new Date().getTime())) / 1000)
          };
        }
      });

      const response = await api.post(`/evaluations/${evaluationToRespond.id}/save-progress`, {
        user_answers: user_answers
      });
      
      if (showMessage) {
        showSnackbar('Progreso guardado exitosamente', 'success');
      }
      
    } catch (error: any) {
      console.error('Error saving evaluation progress:', error);
      console.error('Error details:', error.response?.data);
      if (showMessage) {
        showSnackbar(
          error.response?.data?.detail || 'Error al guardar el progreso',
          'error'
        );
      }
    }
  };

  const handleSubmitEvaluation = async (isAutoSubmit: boolean = false) => {
    if (!evaluationToRespond || !user) return;

    // Validate required questions only if not auto-submit
    if (!isAutoSubmit) {
      const requiredQuestions = (evaluationToRespond.questions || []).filter(q => q.required);
      const missingAnswers = requiredQuestions.filter(q => !employeeAnswers[q.id]);
      
      if (missingAnswers.length > 0) {
        showSnackbar('Por favor responde todas las preguntas obligatorias', 'error');
        return;
      }
    }

    try {
      setLoading(true);
      
      // Prepare user_answers for submission
      const user_answers = Object.entries(employeeAnswers).map(([questionId, answer]) => {
        const question = evaluationToRespond.questions?.find(q => q.id === parseInt(questionId));
        
        if (question?.question_type === 'multiple_choice' || question?.question_type === 'true_false') {
          return {
            question_id: parseInt(questionId),
            selected_answer_ids: JSON.stringify([parseInt(answer)]),
            time_spent_seconds: Math.floor((new Date().getTime() - (startTime?.getTime() || new Date().getTime())) / 1000)
          };
        } else {
          return {
            question_id: parseInt(questionId),
            answer_text: answer,
            time_spent_seconds: Math.floor((new Date().getTime() - (startTime?.getTime() || new Date().getTime())) / 1000)
          };
        }
      });

      const response = await api.post(`/evaluations/${evaluationToRespond.id}/submit`, {
        user_answers: user_answers
      });

      if (response.data.success) {
        const message = isAutoSubmit ? 'Evaluación guardada automáticamente por tiempo expirado' : 'Evaluación enviada exitosamente';
        showSnackbar(message, 'success');
        
        // Clear timer
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
        setTimeRemaining(null);
        setTimeExpired(false);
        
        // Return to evaluation list
        setIsEmployeeResponseMode(false);
        setEvaluationToRespond(null);
        setEmployeeAnswers({});
        
        // Refresh data
        if (user.rol === 'employee') {
          fetchEmployeeResponses();
        }
      } else {
        showSnackbar('Error al enviar la evaluación', 'error');
      }
    } catch (error: any) {
      console.error('Error submitting evaluation:', error);
      showSnackbar(
        error.response?.data?.detail || 'Error al enviar la evaluación',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvaluation = () => {
    setEditingEvaluation(null);
    setFormData({
      title: "",
      description: "",
      instructions: "",
      course_id: 0,
      status: "draft",
      passing_score: 70,
      max_attempts: 3,
      randomize_questions: false,
      show_results_immediately: true,
      allow_review: true,
      questions: [],
    });
    setOpenDialog(true);
  };

  const handleEditEvaluation = async (evaluation: Evaluation) => {
    try {
      const response = await api.get(`/evaluations/${evaluation.id}`);
      const evaluationData = response.data;
      
      setEditingEvaluation(evaluation);
      setFormData({
        title: evaluationData.title,
        description: evaluationData.description || "",
        instructions: evaluationData.instructions || "",
        course_id: evaluationData.course_id,
        status: evaluationData.status,
        time_limit_minutes: evaluationData.time_limit_minutes,
        passing_score: evaluationData.passing_score,
        max_attempts: evaluationData.max_attempts,
        randomize_questions: evaluationData.randomize_questions,
        show_results_immediately: evaluationData.show_results_immediately,
        allow_review: evaluationData.allow_review,
        expires_at: evaluationData.expires_at ? evaluationData.expires_at.split('T')[0] : "",
        questions: evaluationData.questions?.map((q: Question) => {
          // Transform backend question format to frontend format
          const frontendQuestion: QuestionFormData = {
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            points: q.points,
            order_index: q.order_index,
            explanation: q.explanation || "",
            image_url: q.image_url || "",
            required: q.required,
            answers: []
          };

          // Transform answers based on question type
          if (q.answers && q.answers.length > 0) {
            frontendQuestion.answers = q.answers.map((a: Answer) => ({
              id: a.id,
              answer_text: a.answer_text,
              is_correct: a.is_correct,
              order_index: a.order_index,
              explanation: a.explanation || ""
            }));
          } else if (q.question_type === 'true_false') {
            // For true/false questions, ensure we have the standard answers
            frontendQuestion.answers = [
              { answer_text: 'Verdadero', is_correct: false, order_index: 0 },
              { answer_text: 'Falso', is_correct: false, order_index: 1 }
            ];
          }

          return frontendQuestion;
        }) || []
      });
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching evaluation details:', error);
      showSnackbar('Error al cargar los detalles de la evaluación', 'error');
    }
  };

  const handleSaveEvaluation = async () => {
    try {
      setLoading(true);
      
      // Transform questions to match backend schema
      const transformedQuestions = (formData.questions || []).map(question => {
        const transformedQuestion: any = {
          question_text: question.question_text,
          question_type: question.question_type,
          points: question.points,
          order_index: question.order_index,
          explanation: question.explanation || null,
          image_url: question.image_url || null,
          required: question.required
        };

        // Transform answers based on question type
        if (question.question_type === 'multiple_choice') {
          transformedQuestion.options = question.answers.map(answer => answer.answer_text);
          const correctAnswer = question.answers.find(answer => answer.is_correct);
          transformedQuestion.correct_answer = correctAnswer ? correctAnswer.answer_text : null;
        } else if (question.question_type === 'true_false') {
          transformedQuestion.options = ['Verdadero', 'Falso'];
          const correctAnswer = question.answers.find(answer => answer.is_correct);
          transformedQuestion.correct_answer = correctAnswer ? correctAnswer.answer_text : null;
        } else {
          // For open_text, matching, ordering - no options needed
          transformedQuestion.options = [];
          transformedQuestion.correct_answer = null;
        }

        return transformedQuestion;
      });

      const payload = {
        ...formData,
        expires_at: formData.expires_at ? `${formData.expires_at}T23:59:59` : null,
        questions: transformedQuestions
      };

      if (editingEvaluation) {
        await api.put(`/evaluations/${editingEvaluation.id}`, payload);
        showSnackbar('Evaluación actualizada exitosamente', 'success');
      } else {
        await api.post('/evaluations', payload);
        showSnackbar('Evaluación creada exitosamente', 'success');
      }

      setOpenDialog(false);
      fetchEvaluations();
    } catch (error: any) {
      console.error('Error saving evaluation:', error);
      showSnackbar(
        error.response?.data?.detail || 'Error al guardar la evaluación',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvaluation = (evaluation: Evaluation) => {
    setDeletingEvaluation(evaluation);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteEvaluation = async () => {
    if (!deletingEvaluation) return;

    try {
      await api.delete(`/evaluations/${deletingEvaluation.id}`);
      showSnackbar('Evaluación eliminada exitosamente', 'success');
      setOpenDeleteDialog(false);
      setDeletingEvaluation(null);
      fetchEvaluations();
    } catch (error: any) {
      console.error('Error deleting evaluation:', error);
      showSnackbar(
        error.response?.data?.detail || 'Error al eliminar la evaluación',
        'error'
      );
    }
  };

  const handleToggleStatus = async (
    evaluationId: number,
    currentStatus: string
  ) => {
    try {
      const newStatus = currentStatus === "published" ? "archived" : "published";
      await api.patch(`/evaluations/${evaluationId}/status`, {
        status: newStatus,
      });
      showSnackbar(
        `Evaluación ${newStatus === "published" ? "publicada" : "archivada"} exitosamente`,
        'success'
      );
      fetchEvaluations();
    } catch (error: any) {
      console.error('Error updating evaluation status:', error);
      showSnackbar('Error al actualizar el estado de la evaluación', 'error');
    }
  };

  const handleViewEvaluation = async (evaluation: Evaluation) => {
    try {
      const response = await api.get(`/evaluations/${evaluation.id}`);
      setViewingEvaluation(response.data);
    } catch (error) {
      console.error('Error fetching evaluation details:', error);
      showSnackbar('Error al cargar los detalles de la evaluación', 'error');
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const submitEmployeeEvaluationResponse = async () => {
    if (!evaluationToRespond || !startTime) return;
    
    try {
      setLoading(true);
      
      const user_answers = Object.entries(employeeAnswers).map(([questionId, answer]) => {
        const question = evaluationToRespond.questions?.find(q => q.id === parseInt(questionId));
        
        if (question?.question_type === 'multiple_choice' || question?.question_type === 'true_false') {
          return {
            question_id: parseInt(questionId),
            selected_answer_ids: JSON.stringify([parseInt(answer)]),
            time_spent_seconds: Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
          };
        } else {
          return {
            question_id: parseInt(questionId),
            answer_text: answer,
            time_spent_seconds: Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
          };
        }
      });
      
      const payload = {
        user_answers: user_answers
      };
      
      await api.post(`/evaluations/${evaluationToRespond.id}/submit`, payload);
      
      showSnackbar('Evaluación enviada exitosamente', 'success');
      setIsEmployeeResponseMode(false);
      setEvaluationToRespond(null);
      setEmployeeAnswers({});
      setStartTime(null);
      
      // Refresh employee responses
      fetchEmployeeResponses();
      
    } catch (error: any) {
      console.error('Error submitting evaluation response:', error);
      showSnackbar(
        error.response?.data?.detail || 'Error al enviar la evaluación',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Question management functions
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setEditingQuestionIndex(-1);
    setQuestionFormData({
      question_text: "",
      question_type: "multiple_choice",
      points: 1,
      order_index: (formData.questions?.length || 0),
      required: true,
      answers: []
    });
    setOpenQuestionDialog(true);
  };

  const handleEditQuestion = (question: QuestionFormData, index: number) => {
    setEditingQuestion(question);
    setEditingQuestionIndex(index);
    setQuestionFormData({ ...question });
    setOpenQuestionDialog(true);
  };

  const handleSaveQuestion = () => {
    const updatedQuestions = [...(formData.questions || [])];
    
    if (editingQuestionIndex >= 0) {
      updatedQuestions[editingQuestionIndex] = questionFormData;
    } else {
      updatedQuestions.push(questionFormData);
    }
    
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
    
    setOpenQuestionDialog(false);
    setEditingQuestion(null);
    setEditingQuestionIndex(-1);
    setQuestionFormData({
      question_text: "",
      question_type: "multiple_choice",
      points: 1,
      order_index: 0,
      required: true,
      answers: []
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setDeletingQuestionIndex(index);
    setOpenDeleteQuestionDialog(true);
  };

  const confirmDeleteQuestion = () => {
    if (deletingQuestionIndex >= 0) {
      const updatedQuestions = [...(formData.questions || [])];
      updatedQuestions.splice(deletingQuestionIndex, 1);
      
      setFormData({
        ...formData,
        questions: updatedQuestions
      });
    }
    
    setOpenDeleteQuestionDialog(false);
    setDeletingQuestionIndex(-1);
  };

  // Answer management functions
  const handleAddAnswer = () => {
    const newAnswer: AnswerFormData = {
      answer_text: "",
      is_correct: false,
      order_index: questionFormData.answers.length
    };
    
    setQuestionFormData({
      ...questionFormData,
      answers: [...questionFormData.answers, newAnswer]
    });
  };

  const handleUpdateAnswer = (index: number, field: keyof AnswerFormData, value: any) => {
    const updatedAnswers = [...questionFormData.answers];
    updatedAnswers[index] = { ...updatedAnswers[index], [field]: value };
    setQuestionFormData({ ...questionFormData, answers: updatedAnswers });
  };

  const handleDeleteAnswer = (index: number) => {
    setDeletingAnswerIndex(index);
    setOpenDeleteAnswerDialog(true);
  };

  const confirmDeleteAnswer = () => {
    if (deletingAnswerIndex >= 0) {
      const updatedAnswers = [...questionFormData.answers];
      updatedAnswers.splice(deletingAnswerIndex, 1);
      setQuestionFormData({ ...questionFormData, answers: updatedAnswers });
    }
    
    setOpenDeleteAnswerDialog(false);
    setDeletingAnswerIndex(-1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published":
        return "Publicada";
      case "draft":
        return "Borrador";
      case "archived":
        return "Archivada";
      default:
        return status;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {!isEmployeeResponseMode && (
        <>
          <Typography variant="h4" gutterBottom>
            Gestión de Evaluaciones
          </Typography>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Evaluaciones
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Borradores
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.draft}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Publicadas
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.published}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Archivadas
              </Typography>
              <Typography variant="h4" color="default">
                {stats.archived}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

          {/* Search and Filter Controls */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <TextField
          placeholder="Buscar evaluaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
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
            <MenuItem value="draft">Borrador</MenuItem>
            <MenuItem value="published">Publicada</MenuItem>
            <MenuItem value="archived">Archivada</MenuItem>
          </Select>
        </FormControl>
        {user?.rol !== 'employee' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateEvaluation}
          >
            Nueva Evaluación
          </Button>
        )}

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchEvaluations}
        >
          Actualizar
        </Button>
      </Box>

          {/* Evaluations Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Curso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Puntuación Mínima</TableCell>
              <TableCell>Intentos Máximos</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Cargando evaluaciones...
                </TableCell>
              </TableRow>
            ) : evaluations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron evaluaciones
                </TableCell>
              </TableRow>
            ) : (
              evaluations
                .filter((evaluation) => {
                  const matchesSearch = evaluation.title.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = !statusFilter || evaluation.status === statusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell>{evaluation.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {evaluation.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {evaluation.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {evaluation.course
                      ? evaluation.course.title
                      : "Curso no encontrado"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(evaluation.status)}
                      color={getStatusColor(evaluation.status) as any}
                      size="small"
                      icon={<Quiz />}
                    />
                  </TableCell>
                  <TableCell>{evaluation.passing_score}</TableCell>
                  <TableCell>{evaluation.max_attempts}</TableCell>
                  <TableCell align="center">
                    {user?.rol === 'employee' && employeeResponses[evaluation.id]?.status === 'in_progress' ? (
                      <IconButton
                        color="warning"
                        onClick={() => fetchEvaluationToRespond(evaluation.id)}
                        size="small"
                        title="Continuar evaluación en progreso"
                      >
                        <Quiz />
                      </IconButton>
                    ) : user?.rol === 'employee' && employeeResponses[evaluation.id]?.responded ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={employeeResponses[evaluation.id]?.passed ? "Aprobada" : "Reprobada"}
                          color={employeeResponses[evaluation.id]?.passed ? "success" : "error"}
                          size="small"
                        />
                      </Box>
                    ) : user?.rol === 'employee' && evaluation.status === 'published' ? (
                      <IconButton
                        color="primary"
                        onClick={() => fetchEvaluationToRespond(evaluation.id)}
                        size="small"
                        title="Responder evaluación"
                      >
                        <Quiz />
                      </IconButton>
                    ) : user?.rol === 'employee' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label="No disponible"
                          color="default"
                          size="small"
                        />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          color="info"
                          onClick={() => handleViewEvaluation(evaluation)}
                          size="small"
                          title="Ver detalles"
                        >
                          <Visibility />
                        </IconButton>
                        {/* Botón de reinicio para administradores y capacitadores */}
                        {(user?.rol === 'admin' || user?.rol === 'trainer') && 
                         employeeResponses[evaluation.id]?.responded &&
                         !employeeResponses[evaluation.id]?.passed && (
                          <IconButton
                            color="warning"
                            onClick={() => handleResetEvaluation(evaluation)}
                            size="small"
                            title="Reiniciar evaluación"
                          >
                            <RestartAlt />
                          </IconButton>
                        )}
                      </Box>
                    )}

                    {user?.rol !== 'employee' && (
                      <>
                        <IconButton
                          color="primary"
                          onClick={() => handleEditEvaluation(evaluation)}
                          size="small"
                          title="Editar"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color={evaluation.status === "published" ? "warning" : "success"}
                          onClick={() =>
                            handleToggleStatus(evaluation.id, evaluation.status)
                          }
                          size="small"
                          title={evaluation.status === "published" ? "Archivar" : "Publicar"}
                        >
                          {evaluation.status === "published" ? <Cancel /> : <CheckCircle />}
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteEvaluation(evaluation)}
                          size="small"
                          title="Eliminar"
                        >
                          <Delete />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalEvaluations}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
        />
      </TableContainer>

      {/* Dialog para crear/editar evaluación */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingEvaluation ? 'Editar Evaluación' : 'Nueva Evaluación'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Título"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Curso</InputLabel>
                  <Select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value as number })}
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Instrucciones"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "published" | "archived" })}
                  >
                    <MenuItem value="draft">Borrador</MenuItem>
                    <MenuItem value="published">Publicado</MenuItem>
                    <MenuItem value="archived">Archivado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Puntuación mínima (%)"
                  type="number"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Máximo intentos"
                  type="number"
                  value={formData.max_attempts}
                  onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Tiempo límite (minutos)"
                  type="number"
                  value={formData.time_limit_minutes || ''}
                  onChange={(e) => setFormData({ ...formData, time_limit_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                  inputProps={{ min: 1 }}
                  helperText="Dejar vacío para sin límite de tiempo"
                />
              </Grid>
            </Grid>

            {/* Sección de Preguntas */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Preguntas</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddQuestion}
                >
                  Agregar Pregunta
                </Button>
              </Box>

              {formData.questions && formData.questions.length > 0 ? (
                <Box>
                  {formData.questions.map((question, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            {index + 1}. {question.question_text}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tipo: {question.question_type} | Puntos: {question.points}
                            {question.required && ' | Obligatoria'}
                          </Typography>
                          {question.answers && question.answers.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Respuestas: {question.answers.length}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleEditQuestion(question, index)}
                            title="Editar pregunta"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteQuestion(index)}
                            title="Eliminar pregunta"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No hay preguntas agregadas. Haz clic en "Agregar Pregunta" para comenzar.
                </Alert>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveEvaluation} variant="contained">
            {editingEvaluation ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver detalles de evaluación */}
      <Dialog
        open={!!viewingEvaluation}
        onClose={() => setViewingEvaluation(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles de la Evaluación
        </DialogTitle>
        <DialogContent>
          {viewingEvaluation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viewingEvaluation.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Curso: {viewingEvaluation.course?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Estado: <Chip label={getStatusLabel(viewingEvaluation.status)} color={getStatusColor(viewingEvaluation.status)} size="small" />
              </Typography>
              {viewingEvaluation.description && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  <strong>Descripción:</strong> {viewingEvaluation.description}
                </Typography>
              )}
              {viewingEvaluation.instructions && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  <strong>Instrucciones:</strong> {viewingEvaluation.instructions}
                </Typography>
              )}
              <Typography variant="body1" sx={{ mt: 2 }}>
                <strong>Puntuación mínima:</strong> {viewingEvaluation.passing_score}%
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Máximo intentos:</strong> {viewingEvaluation.max_attempts}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Creado:</strong> {formatDateTime(viewingEvaluation.created_at)}
              </Typography>
              {viewingEvaluation.questions && viewingEvaluation.questions.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Preguntas ({viewingEvaluation.questions.length})
                  </Typography>
                  {viewingEvaluation.questions.map((question, index) => (
                    <Paper key={question.id} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1">
                        {index + 1}. {question.question_text}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tipo: {question.question_type} | Puntos: {question.points}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingEvaluation(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar la evaluación "{deletingEvaluation?.title}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={confirmDeleteEvaluation} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para reinicio de evaluación */}
      <Dialog
        open={openResetDialog}
        onClose={() => setOpenResetDialog(false)}
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
      >
        <DialogTitle id="reset-dialog-title">
          Confirmar Reinicio de Evaluación
        </DialogTitle>
        <DialogContent>
          <Typography id="reset-dialog-description">
            ¿Está seguro de que desea reiniciar esta evaluación? Esto cambiará el estado de la evaluación a "No iniciada" y eliminará todas las respuestas y puntuaciones previas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={confirmResetEvaluation} 
            color="warning" 
            variant="contained"
            disabled={resetLoading}
            startIcon={resetLoading ? <CircularProgress size={20} /> : <RestartAlt />}
          >
            {resetLoading ? 'Reiniciando...' : 'Reiniciar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear/editar pregunta */}
      <Dialog
        open={openQuestionDialog}
        onClose={() => setOpenQuestionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Texto de la pregunta"
                  value={questionFormData.question_text}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, question_text: e.target.value })}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de pregunta</InputLabel>
                  <Select
                    value={questionFormData.question_type}
                    onChange={(e) => {
                      const newQuestionType = e.target.value as any;
                      const updatedFormData = { ...questionFormData, question_type: newQuestionType };
                      
                      // Initialize answers for true/false questions
                      if (newQuestionType === 'true_false') {
                        updatedFormData.answers = [
                          { answer_text: 'Verdadero', is_correct: false, order_index: 0 },
                          { answer_text: 'Falso', is_correct: false, order_index: 1 }
                        ];
                      } else if (newQuestionType === 'multiple_choice' && questionFormData.question_type === 'true_false') {
                        // Clear answers when switching from true_false to multiple_choice
                        updatedFormData.answers = [];
                      } else if (newQuestionType === 'open_text') {
                        // Clear answers for open text questions
                        updatedFormData.answers = [];
                      }
                      
                      setQuestionFormData(updatedFormData);
                    }}
                  >
                    <MenuItem value="multiple_choice">Opción múltiple</MenuItem>
                    <MenuItem value="true_false">Verdadero/Falso</MenuItem>
                    <MenuItem value="open_text">Texto abierto</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Puntos"
                  type="number"
                  value={questionFormData.points}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, points: parseInt(e.target.value) })}
                  inputProps={{ min: 1 }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={questionFormData.required}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, required: e.target.checked })}
                    />
                  }
                  label="Obligatoria"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Explicación (opcional)"
                  value={questionFormData.explanation || ''}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Sección de respuestas para preguntas de opción múltiple */}
              {(questionFormData.question_type === 'multiple_choice' || questionFormData.question_type === 'true_false') && (
                <Grid size={12}>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Respuestas</Typography>
                      {questionFormData.question_type === 'multiple_choice' && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Add />}
                          onClick={handleAddAnswer}
                        >
                          Agregar Respuesta
                        </Button>
                      )}
                    </Box>

                    {questionFormData.question_type === 'true_false' ? (
                      <Box>
                        <FormControl component="fieldset">
                          <RadioGroup
                            value={questionFormData.answers.find(a => a.is_correct)?.answer_text || ''}
                            onChange={(e) => {
                              const updatedAnswers = [
                                { answer_text: 'Verdadero', is_correct: e.target.value === 'Verdadero', order_index: 0 },
                                { answer_text: 'Falso', is_correct: e.target.value === 'Falso', order_index: 1 }
                              ];
                              setQuestionFormData({ ...questionFormData, answers: updatedAnswers });
                            }}
                          >
                            <FormControlLabel value="Verdadero" control={<Radio />} label="Verdadero" />
                            <FormControlLabel value="Falso" control={<Radio />} label="Falso" />
                          </RadioGroup>
                        </FormControl>
                      </Box>
                    ) : (
                      <Box>
                        {questionFormData.answers.map((answer, index) => (
                          <Paper key={index} sx={{ p: 2, mb: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid size={1}>
                                <Radio
                                  checked={answer.is_correct}
                                  onChange={(e) => {
                                    const updatedAnswers = [...questionFormData.answers];
                                    updatedAnswers.forEach((a, i) => {
                                      a.is_correct = i === index;
                                    });
                                    setQuestionFormData({ ...questionFormData, answers: updatedAnswers });
                                  }}
                                />
                              </Grid>
                              <Grid size={9}>
                                <TextField
                                  fullWidth
                                  label={`Respuesta ${index + 1}`}
                                  value={answer.answer_text}
                                  onChange={(e) => handleUpdateAnswer(index, 'answer_text', e.target.value)}
                                  required
                                />
                              </Grid>
                              <Grid size={2}>
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteAnswer(index)}
                                  disabled={questionFormData.answers.length <= 2}
                                >
                                  <Delete />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                        {questionFormData.answers.length === 0 && (
                          <Alert severity="warning">
                            Agrega al menos 2 respuestas para esta pregunta.
                          </Alert>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQuestionDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveQuestion} 
            variant="contained"
            disabled={
              !questionFormData.question_text.trim() ||
              (questionFormData.question_type === 'multiple_choice' && questionFormData.answers.length < 2) ||
              (questionFormData.question_type === 'multiple_choice' && !questionFormData.answers.some(a => a.is_correct))
            }
          >
            {editingQuestion ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación de pregunta */}
      <Dialog
        open={openDeleteQuestionDialog}
        onClose={() => setOpenDeleteQuestionDialog(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar esta pregunta?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteQuestionDialog(false)}>Cancelar</Button>
          <Button onClick={confirmDeleteQuestion} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación de respuesta */}
      <Dialog
        open={openDeleteAnswerDialog}
        onClose={() => setOpenDeleteAnswerDialog(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar esta respuesta?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteAnswerDialog(false)}>Cancelar</Button>
          <Button onClick={confirmDeleteAnswer} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}

      {/* Employee Response Mode */}
      {isEmployeeResponseMode && evaluationToRespond && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button
              onClick={() => {
                setIsEmployeeResponseMode(false);
                setEvaluationToRespond(null);
                setEmployeeAnswers({});
              }}
              sx={{ mr: 2 }}
            >
              ← Volver
            </Button>
            <Typography variant="h4" gutterBottom>
              {evaluationToRespond.title}
            </Typography>
          </Box>

          {/* Timer Display */}
          {timeRemaining !== null && (
            <Alert 
              severity={timeRemaining <= 300 ? "warning" : timeRemaining <= 60 ? "error" : "info"} 
              sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
            >
              <Timer sx={{ mr: 1 }} />
              <Typography variant="h6" component="span">
                Tiempo restante: {formatTimeRemaining(timeRemaining)}
              </Typography>
              {timeRemaining <= 300 && (
                <Typography variant="body2" sx={{ ml: 2 }}>
                  {timeRemaining <= 60 ? "¡Último minuto!" : "¡Quedan menos de 5 minutos!"}
                </Typography>
              )}
            </Alert>
          )}

          {timeExpired && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6">
                ⏰ El tiempo ha expirado. La evaluación se ha guardado automáticamente.
              </Typography>
            </Alert>
          )}

          {evaluationToRespond.description && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {evaluationToRespond.description}
            </Alert>
          )}

          {evaluationToRespond.instructions && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Instrucciones:
              </Typography>
              <Typography variant="body1">
                {evaluationToRespond.instructions}
              </Typography>
            </Paper>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper sx={{ p: 3 }}>
              {(evaluationToRespond.questions || []).length > 0 ? (
                <>
                  {(evaluationToRespond.questions || [])
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((question, index) => (
                      <Box key={question.id} sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                          {index + 1}. {question.question_text}
                          {question.required && (
                            <Typography component="span" color="error">
                              *
                            </Typography>
                          )}
                        </Typography>

                        {question.image_url && (
                          <Box sx={{ mb: 2 }}>
                            <img
                              src={question.image_url}
                              alt="Imagen de la pregunta"
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                          </Box>
                        )}

                        {/* Multiple Choice Questions */}
                        {question.question_type === 'multiple_choice' && (
                          <RadioGroup
                            value={employeeAnswers[question.id] || ''}
                            onChange={(e) => {
                              setEmployeeAnswers({
                                ...employeeAnswers,
                                [question.id]: e.target.value
                              });
                              // Auto-save progress after a short delay
                              setTimeout(() => saveEvaluationProgress(false), 1000);
                            }}
                          >
                            {(question.answers || [])
                              .sort((a, b) => a.order_index - b.order_index)
                              .map((answer) => (
                                <FormControlLabel
                                  key={answer.id}
                                  value={answer.id.toString()}
                                  control={<Radio />}
                                  label={answer.answer_text}
                                />
                              ))}
                          </RadioGroup>
                        )}

                        {/* True/False Questions */}
                        {question.question_type === 'true_false' && (
                          <RadioGroup
                            value={employeeAnswers[question.id] || ''}
                            onChange={(e) => {
                              setEmployeeAnswers({
                                ...employeeAnswers,
                                [question.id]: e.target.value
                              });
                              // Auto-save progress after a short delay
                              setTimeout(() => saveEvaluationProgress(false), 1000);
                            }}
                          >
                            <FormControlLabel
                              value="true"
                              control={<Radio />}
                              label="Verdadero"
                            />
                            <FormControlLabel
                              value="false"
                              control={<Radio />}
                              label="Falso"
                            />
                          </RadioGroup>
                        )}

                        {/* Open Text Questions */}
                        {question.question_type === 'open_text' && (
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={employeeAnswers[question.id] || ''}
                            onChange={(e) => {
                              setEmployeeAnswers({
                                ...employeeAnswers,
                                [question.id]: e.target.value
                              });
                              // Auto-save progress after a short delay
                              setTimeout(() => saveEvaluationProgress(false), 2000);
                            }}
                            placeholder="Escribe tu respuesta aquí..."
                          />
                        )}

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Puntos: {question.points}
                        </Typography>

                        {index < (evaluationToRespond.questions || []).length - 1 && (
                          <Divider sx={{ mt: 3 }} />
                        )}
                      </Box>
                    ))}

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="large"
                      onClick={() => saveEvaluationProgress(true)}
                      disabled={loading || timeExpired}
                      startIcon={<Save />}
                    >
                      Guardar Progreso
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={() => handleSubmitEvaluation(false)}
                      disabled={loading || timeExpired}
                      startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                    >
                      {loading ? 'Enviando...' : timeExpired ? 'Tiempo Expirado' : 'Enviar Evaluación'}
                    </Button>
                  </Box>
                </>
              ) : (
                <Alert severity="warning">
                  Esta evaluación no tiene preguntas configuradas.
                </Alert>
              )}
            </Paper>
          )}
        </>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EvaluationsManagement;
