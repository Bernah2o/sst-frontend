import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Poll as SurveyIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Assignment as AssignmentIcon,
  BarChart as AnalyticsIcon,
  QuestionAnswer as QuestionIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  FileCopy as CopyIcon,
  Share as ShareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
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
  Tooltip,
  Avatar,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
  Rating,
  Slider,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';

// Survey Status Enum
type SurveyStatus = 'draft' | 'published' | 'closed' | 'archived';

// Survey Question Type Enum
type SurveyQuestionType = 'multiple_choice' | 'single_choice' | 'text' | 'textarea' | 'rating' | 'yes_no' | 'scale';

// User Survey Status Enum
type UserSurveyStatus = 'not_started' | 'in_progress' | 'completed' | 'expired';

interface Survey {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  is_anonymous: boolean;
  allow_multiple_responses: boolean;
  closes_at?: string;
  expires_at?: string;
  status: SurveyStatus;
  course_id?: number;
  required_for_completion: boolean;
  course?: { id: number; title: string } | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  questions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: number;
  survey_id: number;
  question_text: string;
  question_type: SurveyQuestionType;
  options?: string; // JSON array
  is_required: boolean;
  order_index: number;
  min_value?: number;
  max_value?: number;
  placeholder_text?: string;
  created_at: string;
  updated_at: string;
}

// User Survey Answer Interface
interface UserSurveyAnswer {
  id: number;
  user_survey_id: number;
  question_id: number;
  answer_text?: string;
  answer_value?: number;
  selected_options?: string; // JSON array
  answered_at: string;
}

// User Survey Interface
interface UserSurvey {
  id: number;
  survey_id: number;
  user_id?: number;
  anonymous_token?: string;
  status: UserSurveyStatus;
  started_at?: string;
  completed_at?: string;
  answers: UserSurveyAnswer[];
  created_at: string;
  updated_at: string;
}

interface EmployeeResponse {
  user_id: number;
  employee_name: string;
  employee_email: string;
  cargo?: string;
  telefono?: string;
  submission_date?: string;
  submission_status: string;
  response_time_minutes?: number;
  answers: any[];
  completion_percentage: number;
}

// Survey Statistics Interface
interface SurveyStatistics {
  survey_id: number;
  total_responses: number;
  completion_rate: number;
  average_completion_time?: number;
  question_statistics: any[];
}

interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  document_number: string;
  position?: string;
  department?: string;
  is_active: boolean;
}

// Interface for employee survey view
interface EmployeeSurvey {
  survey_id: number;
  user_id: number;
  anonymous_token?: string;
  id: number;
  status: UserSurveyStatus;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  survey?: {
    id: number;
    title: string;
    description?: string;
    course?: { id: number; title: string } | null;
  };
}

const Survey: React.FC = () => {
  const { user } = useAuth();
  const { canCreateSurveys, canDeleteSurveys, canReadSurveys } = usePermissions();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [employeeSurveys, setEmployeeSurveys] = useState<EmployeeSurvey[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [viewingSurvey, setViewingSurvey] = useState<Survey | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openResponsesDialog, setOpenResponsesDialog] = useState(false);
  const [userSurveys, setUserSurveys] = useState<EmployeeResponse[]>([]);
  const [openDetailedResponseDialog, setOpenDetailedResponseDialog] = useState(false);
  const [selectedEmployeeResponse, setSelectedEmployeeResponse] = useState<EmployeeResponse | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);
  
  // Estados para modo de respuesta de empleado
  const [isEmployeeResponseMode, setIsEmployeeResponseMode] = useState(false);
  const [surveyToRespond, setSurveyToRespond] = useState<Survey | null>(null);
  const [employeeAnswers, setEmployeeAnswers] = useState<{[key: number]: any}>({});
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [filters, setFilters] = useState({
    status: '',
    course_id: '',
    search: '',
    survey_type: '' // 'general' for general surveys, 'course' for course surveys, '' for all
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    is_anonymous: true,
    allow_multiple_responses: false,
    closes_at: null as Date | null,
    expires_at: null as Date | null,
    status: 'draft' as SurveyStatus,
    course_id: undefined as number | undefined,
    required_for_completion: false,
    survey_type: 'course' as 'general' | 'course' // Nuevo campo para tipo de encuesta
  });
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'text' as SurveyQuestionType,
    options: '',
    is_required: false,
    min_value: undefined as number | undefined,
    max_value: undefined as number | undefined,
    placeholder_text: ''
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  
  // Estados para asignación de encuestas generales
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [assigningSurvey, setAssigningSurvey] = useState<Survey | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  
  // Estados para búsqueda y filtrado de usuarios
  const [userSearch, setUserSearch] = useState('');
  const [userAreaFilter, setUserAreaFilter] = useState('');
  const [userCargoFilter, setUserCargoFilter] = useState('');
  
  // Estados para selección de usuarios en formulario de creación
  const [formSelectedUsers, setFormSelectedUsers] = useState<number[]>([]);
  const [formUserSearch, setFormUserSearch] = useState('');
  const [formUserAreaFilter, setFormUserAreaFilter] = useState('');
  const [formUserCargoFilter, setFormUserCargoFilter] = useState('');

  const statusConfig = {
    draft: { label: 'Borrador', color: 'default', icon: <EditIcon /> },
    published: { label: 'Publicada', color: 'success', icon: <StartIcon /> },
    closed: { label: 'Cerrada', color: 'info', icon: <CompleteIcon /> },
    archived: { label: 'Archivada', color: 'error', icon: <StopIcon /> }
  };

  const questionTypes = [
    { value: 'text', label: 'Texto libre' },
    { value: 'textarea', label: 'Área de texto' },
    { value: 'multiple_choice', label: 'Opción múltiple' },
    { value: 'single_choice', label: 'Selección única' },
    { value: 'rating', label: 'Calificación' },
    { value: 'yes_no', label: 'Sí/No' },
    { value: 'scale', label: 'Escala de valoración' }
  ];

  useEffect(() => {
    // Detectar parámetro survey_id para modo de respuesta de empleado
    const urlParams = new URLSearchParams(window.location.search);
    const surveyId = urlParams.get('survey_id');
    
    if (surveyId && user?.role === 'employee') {
      setIsEmployeeResponseMode(true);
      fetchSurveyForResponse(parseInt(surveyId));
    } else {
      setIsEmployeeResponseMode(false);
      fetchSurveys();
      fetchWorkers();
      fetchCourses();
    }
  }, [page, filters, user]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'employee') {
        // For employees, get their assigned surveys
        const response = await api.get('/surveys/my-surveys');
        setEmployeeSurveys(response.data.items || []);
      } else {
        // For admin/capacitador, get surveys with pagination
        const params = new URLSearchParams();
        params.append('skip', ((page - 1) * 20).toString());
        params.append('limit', '20');
        
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);

        let endpoint = '/surveys/';
        
        // Use different endpoints based on survey type filter
        if (filters.survey_type === 'general') {
          endpoint = '/surveys/general';
        } else if (filters.survey_type === 'course') {
          endpoint = '/surveys/';
          if (filters.course_id) params.append('course_id', filters.course_id.toString());
        } else {
          // For 'all' surveys, we need to combine both endpoints
          if (filters.course_id) params.append('course_id', filters.course_id.toString());
        }

        const response = await api.get(`${endpoint}?${params.toString()}`);
        setSurveys(response.data.items || []);
        setTotalPages(response.data.pages || Math.ceil((response.data.total || 0) / 20));
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/workers/basic', {
        params: {
          is_active: true,
          limit: 1000
        }
      });
      setWorkers(response.data || []);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      // Obtener todos los cursos (no solo los publicados) para permitir asociación durante la creación
      const response = await api.get('/courses');
      setCourses(response.data.items || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchUserSurveys = async (surveyId: number) => {
    try {
      const response = await api.get(`/surveys/${surveyId}/detailed-results`);
      setUserSurveys(response.data.employee_responses || []);
    } catch (error) {
      console.error('Error fetching user surveys:', error);
      setUserSurveys([]);
    }
  };

  const fetchSurveyForResponse = async (surveyId: number) => {
    try {
      setLoadingSurvey(true);
      const response = await api.get(`/surveys/${surveyId}`);
      setSurveyToRespond(response.data);
      // Inicializar respuestas vacías para cada pregunta
      const initialAnswers: {[key: number]: any} = {};
      response.data.questions?.forEach((question: SurveyQuestion) => {
        initialAnswers[question.id] = {
          question_id: question.id,
          answer_text: null,
          answer_value: null,
          selected_options: null
        };
      });
      setEmployeeAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching survey for response:', error);
      setSurveyToRespond(null);
    } finally {
      setLoadingSurvey(false);
    }
  };

  // Function to submit employee survey responses
  const submitEmployeeResponse = async () => {
    if (!surveyToRespond) return;
    
    setSubmittingResponse(true);
    try {
      // Prepare answers array for submission
      const answers = Object.values(employeeAnswers).filter((answer: any) => {
        // Only include answers that have some value
        return answer.answer_text || answer.answer_value !== null || answer.selected_options;
      });
      
      const submissionData = {
        answers: answers
      };
      
      await api.post(`/surveys/${surveyToRespond.id}/submit`, submissionData);
      
      setSnackbar({
        open: true,
        message: 'Encuesta enviada exitosamente',
        severity: 'success'
      });
      
      // Reset state and redirect
      setIsEmployeeResponseMode(false);
      setSurveyToRespond(null);
      setEmployeeAnswers({});
      
      // Verificar si todas las encuestas requeridas para el curso están completadas
      if (surveyToRespond.course_id) {
        try {
          // Obtener el progreso del curso para verificar el estado de las encuestas
          const progressResponse = await api.get(`/progress/course/${surveyToRespond.course_id}`);
          const courseProgress = progressResponse.data;
          
          // Verificar si hay encuestas pendientes
          if (courseProgress.pending_surveys && courseProgress.pending_surveys.length === 0) {
            // Si no hay encuestas pendientes, habilitar la evaluación
            setSnackbar({
              open: true,
              message: '¡Todas las encuestas completadas! Ahora puedes acceder a la evaluación',
              severity: 'success'
            });
            
            // Habilitar la evaluación para el usuario
            try {
              await api.post(`/evaluations/enable-for-user/${surveyToRespond.course_id}`);
            } catch (evalError) {
              console.error('Error habilitando evaluación:', evalError);
            }
          }
        } catch (progressError) {
          console.error('Error verificando progreso del curso:', progressError);
        }
      }
      
      // Redirect to courses or surveys list
      window.location.href = '/employee/courses';
      
    } catch (error: any) {
      console.error('Error submitting survey response:', error);
      
      // Extract error message from backend response
      let errorMessage = 'Error al enviar la encuesta';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleSaveSurvey = async () => {
    try {
      const payload = {
        ...formData,
        questions: questions,
        closes_at: formData.closes_at?.toISOString(),
        expires_at: formData.expires_at?.toISOString()
      };

      let surveyResponse;
      if (editingSurvey) {
        surveyResponse = await api.put(`/surveys/${editingSurvey.id}`, payload);
      } else {
        surveyResponse = await api.post('/surveys/', payload);
      }

      // Si es una encuesta general y hay usuarios seleccionados, asignarlos
      if (formData.survey_type === 'general' && formSelectedUsers.length > 0) {
        const surveyId = editingSurvey ? editingSurvey.id : surveyResponse.data.id;
        await api.post('/surveys/assign', {
          survey_id: surveyId,
          user_ids: formSelectedUsers
        });
      }

      fetchSurveys();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving survey:', error);
    }
  };

  const handleDeleteSurvey = (survey: Survey) => {
    setDeletingSurvey(survey);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteSurvey = async () => {
    if (deletingSurvey) {
      try {
        await api.delete(`/surveys/${deletingSurvey.id}`);
        fetchSurveys();
        setOpenDeleteDialog(false);
        setDeletingSurvey(null);
        setSnackbar({
          open: true,
          message: 'Encuesta eliminada exitosamente',
          severity: 'success'
        });
      } catch (error: any) {
        console.error('Error deleting survey:', error);
        
        let errorMessage = 'Error al eliminar la encuesta';
        
        if (error.response?.status === 400) {
          // Error de integridad de datos
          errorMessage = error.response.data?.detail || 'No se puede eliminar la encuesta porque tiene respuestas asociadas';
        } else if (error.response?.status === 403) {
          errorMessage = 'No tienes permisos para eliminar esta encuesta';
        } else if (error.response?.status === 404) {
          errorMessage = 'La encuesta no fue encontrada';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Error interno del servidor. Inténtalo más tarde';
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
        
        setOpenDeleteDialog(false);
        setDeletingSurvey(null);
      }
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/surveys/${id}/status`, { status: newStatus });
      fetchSurveys();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDuplicateSurvey = async (survey: Survey) => {
    try {
      // Primero obtenemos los datos completos de la encuesta incluyendo las preguntas
      const response = await api.get(`/surveys/${survey.id}`);
      const fullSurveyData = response.data;
      
      // Preparamos las preguntas para la duplicación (sin IDs)
      const duplicatedQuestions = fullSurveyData.questions?.map((question: SurveyQuestion) => {
        const { id, survey_id, created_at, updated_at, ...questionData } = question;
        return questionData;
      }) || [];
      
      // Preparamos los datos de la encuesta para duplicar
      const { id, created_at, updated_at, published_at, questions, ...surveyData } = fullSurveyData;
      const payload = {
        ...surveyData,
        title: `${fullSurveyData.title} (Copia)`,
        status: 'draft' as SurveyStatus,
        closes_at: undefined,
        expires_at: undefined,
        questions: duplicatedQuestions
      };
      
      await api.post('/surveys/', payload);
      fetchSurveys();
    } catch (error) {
      console.error('Error duplicating survey:', error);
    }
  };

  const handleAssignSurvey = (survey: Survey) => {
    setAssigningSurvey(survey);
    setSelectedUsers([]);
    setOpenAssignDialog(true);
  };

  const handleAssignSurveyToUsers = async () => {
    if (!assigningSurvey || selectedUsers.length === 0) return;
    
    try {
      setAssignmentLoading(true);
      await api.post('/surveys/assign', {
        survey_id: assigningSurvey.id,
        user_ids: selectedUsers
      });
      
      setSnackbar({
        open: true,
        message: `Encuesta asignada exitosamente a ${selectedUsers.length} usuarios`,
        severity: 'success'
      });
      
      setOpenAssignDialog(false);
      setAssigningSurvey(null);
      setSelectedUsers([]);
      // Limpiar filtros
      setUserSearch('');
      setUserAreaFilter('');
      setUserCargoFilter('');
    } catch (error) {
      console.error('Error assigning survey:', error);
      setSnackbar({
        open: true,
        message: 'Error al asignar la encuesta',
        severity: 'error'
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Función para filtrar usuarios
  const getFilteredUsers = () => {
    return workers.filter(worker => {
      const matchesSearch = userSearch === '' || 
        `${worker.first_name} ${worker.last_name}`.toLowerCase().includes(userSearch.toLowerCase()) ||
        worker.document_number?.toLowerCase().includes(userSearch.toLowerCase());
      
      const matchesArea = userAreaFilter === '' || (worker.department || '') === userAreaFilter;
      const matchesCargo = userCargoFilter === '' || (worker.position || '') === userCargoFilter;
      
      return matchesSearch && matchesArea && matchesCargo;
    });
  };

  // Función para seleccionar todos los usuarios filtrados
  const handleSelectAllFiltered = () => {
    const filteredUsers = getFilteredUsers();
    const filteredUserIds = filteredUsers.map(worker => worker.id);
    setSelectedUsers(filteredUserIds);
  };

  // Función para filtrar usuarios en el formulario de creación
  const getFormFilteredUsers = () => {
    return workers.filter(worker => {
      const matchesSearch = formUserSearch === '' || 
        `${worker.first_name} ${worker.last_name}`.toLowerCase().includes(formUserSearch.toLowerCase()) ||
        worker.document_number?.toLowerCase().includes(formUserSearch.toLowerCase());
      
      const matchesArea = formUserAreaFilter === '' || (worker.department || '') === formUserAreaFilter;
      const matchesCargo = formUserCargoFilter === '' || (worker.position || '') === formUserCargoFilter;
      
      return matchesSearch && matchesArea && matchesCargo;
    });
  };

  // Función para deseleccionar todos los usuarios
  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  // Obtener áreas únicas
  const getUniqueAreas = () => {
    const areas = workers.map(worker => worker.department).filter(Boolean);
    return Array.from(new Set(areas)).sort();
  };

  // Obtener cargos únicos
  const getUniqueCargos = () => {
    const cargos = workers.map(worker => worker.position).filter(Boolean);
    return Array.from(new Set(cargos)).sort();
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question_text.trim()) return;
    
    const question: SurveyQuestion = {
      id: Date.now(), // Temporal ID
      survey_id: 0, // Will be set when saving
      question_text: newQuestion.question_text,
      question_type: newQuestion.question_type,
      options: ['multiple_choice', 'single_choice'].includes(newQuestion.question_type) ? 
        newQuestion.options : undefined,
      is_required: newQuestion.is_required,
      order_index: questions.length,
      min_value: ['rating', 'scale'].includes(newQuestion.question_type) ? newQuestion.min_value : undefined,
      max_value: ['rating', 'scale'].includes(newQuestion.question_type) ? newQuestion.max_value : undefined,
      placeholder_text: newQuestion.placeholder_text || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setQuestions([...questions, question]);
    setNewQuestion({
      question_text: '',
      question_type: 'text',
      options: '',
      is_required: false,
      min_value: undefined as number | undefined,
      max_value: undefined as number | undefined,
      placeholder_text: ''
    });
  };

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions.map((q, i) => ({ ...q, order_index: i })));
    // Si estamos editando esta pregunta, cancelar la edición
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
    }
  };

  const handleEditQuestion = (index: number) => {
    const question = questions[index];
    setNewQuestion({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || '',
      is_required: question.is_required,
      min_value: question.min_value,
      max_value: question.max_value,
      placeholder_text: question.placeholder_text || ''
    });
    setEditingQuestionIndex(index);
  };

  const handleUpdateQuestion = () => {
    if (editingQuestionIndex === null || !newQuestion.question_text.trim()) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[editingQuestionIndex] = {
      ...updatedQuestions[editingQuestionIndex],
      question_text: newQuestion.question_text,
      question_type: newQuestion.question_type,
      options: ['multiple_choice', 'single_choice'].includes(newQuestion.question_type) ? 
        newQuestion.options : undefined,
      is_required: newQuestion.is_required,
      min_value: ['rating', 'scale'].includes(newQuestion.question_type) ? newQuestion.min_value : undefined,
      max_value: ['rating', 'scale'].includes(newQuestion.question_type) ? newQuestion.max_value : undefined,
      placeholder_text: newQuestion.placeholder_text || undefined,
      updated_at: new Date().toISOString()
    };
    
    setQuestions(updatedQuestions);
    setEditingQuestionIndex(null);
    setNewQuestion({
      question_text: '',
      question_type: 'text',
      options: '',
      is_required: false,
      min_value: undefined as number | undefined,
      max_value: undefined as number | undefined,
      placeholder_text: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingQuestionIndex(null);
    setNewQuestion({
      question_text: '',
      question_type: 'text',
      options: '',
      is_required: false,
      min_value: undefined as number | undefined,
      max_value: undefined as number | undefined,
      placeholder_text: ''
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      setQuestions(newQuestions.map((q, i) => ({ ...q, order_index: i })));
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleOpenDialog = async (survey?: Survey) => {
    if (survey) {
      setEditingSurvey(survey);
      
      // Cargar los datos completos de la encuesta desde la API
      try {
        const response = await api.get(`/surveys/${survey.id}`);
        const surveyData = response.data;
        
        setFormData({
          title: surveyData.title,
          description: surveyData.description || '',
          instructions: surveyData.instructions || '',
          is_anonymous: surveyData.is_anonymous,
          allow_multiple_responses: surveyData.allow_multiple_responses,
          closes_at: surveyData.closes_at ? new Date(surveyData.closes_at) : null,
          expires_at: surveyData.expires_at ? new Date(surveyData.expires_at) : null,
          status: surveyData.status,
          course_id: surveyData.course_id,
          required_for_completion: surveyData.required_for_completion,
          survey_type: surveyData.course_id ? 'course' : 'general'
        });
        
        setQuestions(surveyData.questions || []);
      } catch (error) {
        console.error('Error loading survey data:', error);
        // Fallback a los datos del parámetro si falla la API
        setFormData({
          title: survey.title,
          description: survey.description || '',
          instructions: survey.instructions || '',
          is_anonymous: survey.is_anonymous,
          allow_multiple_responses: survey.allow_multiple_responses,
          closes_at: survey.closes_at ? new Date(survey.closes_at) : null,
          expires_at: survey.expires_at ? new Date(survey.expires_at) : null,
          status: survey.status,
          course_id: survey.course_id,
          required_for_completion: survey.required_for_completion,
          survey_type: survey.course_id ? 'course' : 'general'
        });
        setQuestions([]);
      }
    } else {
      setEditingSurvey(null);
      setFormData({
        title: '',
        description: '',
        instructions: '',
        is_anonymous: true,
        allow_multiple_responses: false,
        closes_at: null,
        expires_at: null,
        status: 'draft',
        course_id: undefined,
        required_for_completion: false,
        survey_type: 'course'
      });
      setQuestions([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSurvey(null);
    setEditingQuestionIndex(null);
    setNewQuestion({
      question_text: '',
      question_type: 'text',
      options: '',
      is_required: false,
      min_value: undefined as number | undefined,
      max_value: undefined as number | undefined,
      placeholder_text: ''
    });
    // Limpiar estados de selección de usuarios del formulario
    setFormSelectedUsers([]);
    setFormUserSearch('');
    setFormUserAreaFilter('');
    setFormUserCargoFilter('');
  };

  const handleViewSurvey = async (survey: Survey) => {
    try {
      const response = await api.get(`/surveys/${survey.id}`);
      setViewingSurvey(response.data);
      setOpenViewDialog(true);
    } catch (error) {
      console.error('Error fetching survey details:', error);
    }
  };

  const handleViewResponses = async (survey: Survey) => {
    setViewingSurvey(survey);
    await fetchUserSurveys(survey.id);
    setOpenResponsesDialog(true);
  };

  const handleViewDetailedResponse = (employeeResponse: EmployeeResponse) => {
    setSelectedEmployeeResponse(employeeResponse);
    setOpenDetailedResponseDialog(true);
  };



  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 50) return 'warning';
    return 'error';
  };

  const addOption = () => {
    const currentOptions = JSON.parse(newQuestion.options || '[]');
    setNewQuestion({
      ...newQuestion,
      options: JSON.stringify([...currentOptions, ''])
    });
  };

  const updateOption = (index: number, value: string) => {
    const currentOptions = JSON.parse(newQuestion.options || '[]');
    currentOptions[index] = value;
    setNewQuestion({
      ...newQuestion,
      options: JSON.stringify(currentOptions)
    });
  };

  const removeOption = (index: number) => {
    const currentOptions = JSON.parse(newQuestion.options || '[]');
    const updatedOptions = currentOptions.filter((_: string, i: number) => i !== index);
    setNewQuestion({
      ...newQuestion,
      options: JSON.stringify(updatedOptions)
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {isEmployeeResponseMode && surveyToRespond ? (
          // Employee Survey Response Form
          <Box>
            <Typography variant="h4" gutterBottom>
              Responder Encuesta
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {surveyToRespond.title}
            </Typography>
            
            {surveyToRespond.description && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {surveyToRespond.description}
              </Alert>
            )}
            
            {surveyToRespond.instructions && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Instrucciones
                  </Typography>
                  <Typography variant="body1">
                    {surveyToRespond.instructions}
                  </Typography>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Preguntas
                </Typography>
                
                {surveyToRespond.questions?.map((question, index) => (
                  <Box key={question.id} sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {index + 1}. {question.question_text}
                      {question.is_required && (
                        <Typography component="span" color="error"> *</Typography>
                      )}
                    </Typography>
                    
                    {/* Render different input types based on question type */}
                    {question.question_type === 'text' && (
                      <TextField
                        fullWidth
                        placeholder={question.placeholder_text || 'Escriba su respuesta...'}
                        value={employeeAnswers[question.id]?.answer_text || ''}
                        onChange={(e) => {
                          setEmployeeAnswers(prev => ({
                            ...prev,
                            [question.id]: {
                              ...prev[question.id],
                              answer_text: e.target.value
                            }
                          }));
                        }}
                      />
                    )}
                    
                    {question.question_type === 'textarea' && (
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder={question.placeholder_text || 'Escriba su respuesta...'}
                        value={employeeAnswers[question.id]?.answer_text || ''}
                        onChange={(e) => {
                          setEmployeeAnswers(prev => ({
                            ...prev,
                            [question.id]: {
                              ...prev[question.id],
                              answer_text: e.target.value
                            }
                          }));
                        }}
                      />
                    )}
                    
                    {question.question_type === 'single_choice' && question.options && (
                      <RadioGroup
                        value={employeeAnswers[question.id]?.answer_text || ''}
                        onChange={(e) => {
                          setEmployeeAnswers(prev => ({
                            ...prev,
                            [question.id]: {
                              ...prev[question.id],
                              answer_text: e.target.value
                            }
                          }));
                        }}
                      >
                        {JSON.parse(question.options).map((option: string, optionIndex: number) => (
                          <FormControlLabel
                            key={optionIndex}
                            value={option}
                            control={<Radio />}
                            label={option}
                          />
                        ))}
                      </RadioGroup>
                    )}
                    
                    {question.question_type === 'multiple_choice' && question.options && (
                      <FormGroup>
                        {JSON.parse(question.options).map((option: string, optionIndex: number) => {
                          const selectedOptions = employeeAnswers[question.id]?.selected_options ? 
                            JSON.parse(employeeAnswers[question.id].selected_options) : [];
                          
                          return (
                            <FormControlLabel
                              key={optionIndex}
                              control={
                                <Checkbox
                                  checked={selectedOptions.includes(option)}
                                  onChange={(e) => {
                                    let newSelectedOptions = [...selectedOptions];
                                    if (e.target.checked) {
                                      newSelectedOptions.push(option);
                                    } else {
                                      newSelectedOptions = newSelectedOptions.filter(o => o !== option);
                                    }
                                    
                                    setEmployeeAnswers(prev => ({
                                      ...prev,
                                      [question.id]: {
                                        ...prev[question.id],
                                        selected_options: JSON.stringify(newSelectedOptions)
                                      }
                                    }));
                                  }}
                                />
                              }
                              label={option}
                            />
                          );
                        })}
                      </FormGroup>
                    )}
                    
                    {question.question_type === 'rating' && (
                      <Box>
                        <Rating
                          value={employeeAnswers[question.id]?.answer_value || 0}
                          max={question.max_value || 5}
                          onChange={(event, newValue) => {
                            setEmployeeAnswers(prev => ({
                              ...prev,
                              [question.id]: {
                                ...prev[question.id],
                                answer_value: newValue
                              }
                            }));
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Calificación: {employeeAnswers[question.id]?.answer_value || 0} de {question.max_value || 5}
                        </Typography>
                      </Box>
                    )}
                    
                    {question.question_type === 'scale' && (
                      <Box>
                        <Slider
                          value={employeeAnswers[question.id]?.answer_value || question.min_value || 0}
                          min={question.min_value || 0}
                          max={question.max_value || 10}
                          step={1}
                          marks
                          valueLabelDisplay="on"
                          onChange={(event, newValue) => {
                            setEmployeeAnswers(prev => ({
                              ...prev,
                              [question.id]: {
                                ...prev[question.id],
                                answer_value: newValue as number
                              }
                            }));
                          }}
                        />
                      </Box>
                    )}
                    
                    {question.question_type === 'yes_no' && (
                      <RadioGroup
                        value={employeeAnswers[question.id]?.answer_text || ''}
                        onChange={(e) => {
                          setEmployeeAnswers(prev => ({
                            ...prev,
                            [question.id]: {
                              ...prev[question.id],
                              answer_text: e.target.value
                            }
                          }));
                        }}
                      >
                        <FormControlLabel value="Sí" control={<Radio />} label="Sí" />
                        <FormControlLabel value="No" control={<Radio />} label="No" />
                      </RadioGroup>
                    )}
                  </Box>
                ))}
                
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEmployeeResponseMode(false);
                      setSurveyToRespond(null);
                      setEmployeeAnswers({});
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={submitEmployeeResponse}
                    disabled={submittingResponse}
                    startIcon={submittingResponse ? <CircularProgress size={20} /> : <SendIcon />}
                  >
                    {submittingResponse ? 'Enviando...' : 'Enviar Respuestas'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ) : (
          // Admin Survey Management Interface
          <Box>
            <Typography variant="h4" gutterBottom>
              Encuestas
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Gestión de encuestas y recolección de feedback
            </Typography>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Buscar"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Título, descripción..."
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Curso</InputLabel>
                  <Select
                    value={filters.course_id}
                    onChange={(e) => handleFilterChange('course_id', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {/* Course options would be loaded from API */}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filters.survey_type}
                    onChange={(e) => handleFilterChange('survey_type', e.target.value)}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="general">Encuestas Generales</MenuItem>
                    <MenuItem value="course">Encuestas de Curso</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <Box display="flex" gap={1}>
                  <Tooltip title="Actualizar">
                    <IconButton onClick={fetchSurveys}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  {canCreateSurveys() && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                    >
                      Nueva Encuesta
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de Encuestas */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Título</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Curso</TableCell>
                    {canReadSurveys() && (
                      <>
                        <TableCell>Anónima</TableCell>
                        <TableCell>Respuestas Múltiples</TableCell>
                        <TableCell>Fechas</TableCell>
                      </>
                    )}
                    {user?.role === 'employee' && <TableCell>Fecha Completado</TableCell>}
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={user?.role === 'employee' ? 5 : 7} align="center">
                        Cargando encuestas...
                      </TableCell>
                    </TableRow>
                  ) : (user?.role === 'employee' ? employeeSurveys.length === 0 : surveys.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={user?.role === 'employee' ? 5 : 7} align="center">
                        No se encontraron encuestas
                      </TableCell>
                    </TableRow>
                  ) : user?.role === 'employee' ? (
                    // Employee view - show their assigned surveys
                    employeeSurveys.map((employeeSurvey) => (
                      <TableRow key={employeeSurvey.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {employeeSurvey.survey?.title || 'Encuesta sin título'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {employeeSurvey.survey?.description ? employeeSurvey.survey.description.substring(0, 50) + '...' : 'Sin descripción'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={employeeSurvey.status === 'completed' ? 'Completada' : 
                                   employeeSurvey.status === 'in_progress' ? 'En progreso' : 
                                   employeeSurvey.status === 'expired' ? 'Expirada' : 'No iniciada'}
                            color={employeeSurvey.status === 'completed' ? 'success' : 
                                   employeeSurvey.status === 'in_progress' ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {employeeSurvey.survey?.course?.title || 'Sin curso'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {employeeSurvey.completed_at ? formatDateTime(employeeSurvey.completed_at) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            {employeeSurvey.status === 'completed' ? (
                              <Chip
                                label="Completada"
                                color="success"
                                size="small"
                                icon={<CompleteIcon />}
                              />
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={loadingSurvey ? <CircularProgress size={16} color="inherit" /> : <AssignmentIcon />}
                                onClick={() => {
                                  // Navegar al modo de respuesta de encuesta
                                  setIsEmployeeResponseMode(true);
                                  fetchSurveyForResponse(employeeSurvey.survey_id);
                                }}
                                disabled={employeeSurvey.status === 'expired' || loadingSurvey}
                              >
                                {loadingSurvey ? 'Cargando...' : 'Contestar'}
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // Admin/Capacitador view - show all surveys with actions
                    surveys.map((survey) => (
                      <TableRow key={survey.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {survey.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {survey.description ? survey.description.substring(0, 50) + '...' : 'Sin descripción'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {statusConfig[survey.status as keyof typeof statusConfig]?.icon}
                            <Chip
                              label={statusConfig[survey.status as keyof typeof statusConfig]?.label}
                              color={statusConfig[survey.status as keyof typeof statusConfig]?.color as any}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {survey.course?.title || 'Sin curso'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={survey.is_anonymous ? 'Sí' : 'No'}
                            color={survey.is_anonymous ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={survey.allow_multiple_responses ? 'Sí' : 'No'}
                            color={survey.allow_multiple_responses ? 'info' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {survey.closes_at && (
                            <Typography variant="body2">
                              Cierre: {formatDate(survey.closes_at)}
                          </Typography>
                        )}
                        {survey.expires_at && (
                          <Typography variant="caption" color="text.secondary">
                            Expira: {formatDate(survey.expires_at)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {canReadSurveys() && (
                            <>
                              <Tooltip title="Ver detalles">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewSurvey(survey)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Ver respuestas">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewResponses(survey)}
                                >
                                  <AnalyticsIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Duplicar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDuplicateSurvey(survey)}
                                >
                                  <CopyIcon />
                                </IconButton>
                              </Tooltip>
                              {/* Botón de asignación solo para encuestas generales */}
                              {!survey.course_id && survey.status === 'published' && (
                                <Tooltip title="Asignar a usuarios">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAssignSurvey(survey)}
                                  >
                                    <AssignmentIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {canCreateSurveys() && (
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(survey)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {canDeleteSurveys() && (
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteSurvey(survey)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          )}
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
          </CardContent>
        </Card>

        {/* Dialog para Crear/Editar Encuesta */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
          <DialogTitle>
            {editingSurvey ? 'Editar Encuesta' : 'Nueva Encuesta'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Información General */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                  Información General
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Título"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Encuesta</InputLabel>
                  <Select
                    value={formData.survey_type}
                    onChange={(e) => {
                      const newType = e.target.value as 'general' | 'course';
                      setFormData({ 
                        ...formData, 
                        survey_type: newType,
                        course_id: newType === 'general' ? undefined : formData.course_id
                      });
                    }}
                  >
                    <MenuItem value="course">Encuesta de Curso</MenuItem>
                    <MenuItem value="general">Encuesta General</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SurveyStatus })}
                  >
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Instrucciones"
                  multiline
                  rows={2}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </Grid>
              
              {/* Configuración de Curso - Solo para encuestas de curso */}
              {formData.survey_type === 'course' && (
                <>
                  <Grid size={12}>
                    <Typography variant="h6" gutterBottom>
                      Configuración de Curso
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Curso {formData.survey_type === 'course' ? '(Requerido)' : '(Opcional)'}</InputLabel>
                      <Select
                        value={formData.course_id || ''}
                        onChange={(e) => setFormData({ ...formData, course_id: e.target.value ? Number(e.target.value) : undefined })}
                        required={formData.survey_type === 'course'}
                      >
                        {courses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>
                            {course.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
              
              {/* Configuración de Fechas */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                  Programación
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Fecha de Cierre (Opcional)"
                  value={formData.closes_at}
                  onChange={(date) => setFormData({ ...formData, closes_at: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Fecha de Expiración (Opcional)"
                  value={formData.expires_at}
                  onChange={(date) => setFormData({ ...formData, expires_at: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              
              {/* Configuración Avanzada */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                  Configuración
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_anonymous}
                      onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                    />
                  }
                  label="Respuestas anónimas"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.allow_multiple_responses}
                      onChange={(e) => setFormData({ ...formData, allow_multiple_responses: e.target.checked })}
                    />
                  }
                  label="Permitir múltiples respuestas"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.required_for_completion}
                      onChange={(e) => setFormData({ ...formData, required_for_completion: e.target.checked })}
                    />
                  }
                  label="Requerida para completar curso"
                />
              </Grid>
              
              {/* Selección de Usuarios - Solo para encuestas generales */}
              {formData.survey_type === 'general' && (
                <>
                  <Grid size={12}>
                    <Typography variant="h6" gutterBottom>
                      Selección de Usuarios
                    </Typography>
                  </Grid>
                  
                  {/* Filtros de búsqueda */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Buscar usuarios"
                      value={formUserSearch}
                      onChange={(e) => setFormUserSearch(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Filtrar por Área</InputLabel>
                      <Select
                        value={formUserAreaFilter}
                        onChange={(e) => setFormUserAreaFilter(e.target.value)}
                      >
                        <MenuItem value="">Todas las áreas</MenuItem>
                        {getUniqueAreas().map((area) => (
                          <MenuItem key={area} value={area}>
                            {area}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Filtrar por Cargo</InputLabel>
                      <Select
                        value={formUserCargoFilter}
                        onChange={(e) => setFormUserCargoFilter(e.target.value)}
                      >
                        <MenuItem value="">Todos los cargos</MenuItem>
                        {getUniqueCargos().map((cargo) => (
                          <MenuItem key={cargo} value={cargo}>
                            {cargo}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Lista de usuarios */}
                  <Grid size={12}>
                    <Card variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                           <Typography variant="subtitle1">
                             Usuarios Disponibles ({getFormFilteredUsers().length})
                           </Typography>
                           <Box display="flex" gap={1}>
                             <Button
                               size="small"
                               onClick={() => {
                                 const filteredUsers = getFormFilteredUsers();
                                 setFormSelectedUsers(filteredUsers.map(u => u.id));
                               }}
                             >
                               Seleccionar Todos
                             </Button>
                             <Button
                               size="small"
                               onClick={() => setFormSelectedUsers([])}
                             >
                               Deseleccionar Todos
                             </Button>
                           </Box>
                         </Box>
                         
                         <List dense>
                           {getFormFilteredUsers().map((worker) => (
                            <ListItem key={worker.id} disablePadding>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={formSelectedUsers.includes(worker.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormSelectedUsers(prev => [...prev, worker.id]);
                                      } else {
                                        setFormSelectedUsers(prev => prev.filter(id => id !== worker.id));
                                      }
                                    }}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="body2">
                                      {worker.first_name} {worker.last_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {worker.position || 'Sin cargo'} - {worker.department || 'Sin área'}
                                    </Typography>
                                  </Box>
                                }
                                sx={{ width: '100%' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                        
                        {formSelectedUsers.length > 0 && (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            {formSelectedUsers.length} usuario(s) seleccionado(s)
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
              
              {/* Preguntas */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                  Preguntas ({questions.length})
                </Typography>
              </Grid>
              
              {/* Lista de Preguntas Existentes */}
              {questions.map((question, index) => (
                <Grid size={12} key={question.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {index + 1}. {question.question_text}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tipo: {questionTypes.find(t => t.value === question.question_type)?.label}
                            {question.is_required && ' • Obligatoria'}
                          </Typography>
                          {question.options && (
                            <Box mt={1}>
                              <Typography variant="caption" color="text.secondary">
                                Opciones: {typeof question.options === 'string' ? JSON.parse(question.options).join(', ') : question.options}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditQuestion(index)}
                            disabled={editingQuestionIndex !== null}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveQuestion(index, 'up')}
                            disabled={index === 0 || editingQuestionIndex !== null}
                          >
                            ↑
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveQuestion(index, 'down')}
                            disabled={index === questions.length - 1 || editingQuestionIndex !== null}
                          >
                            ↓
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveQuestion(index)}
                            disabled={editingQuestionIndex !== null}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              {/* Formulario para Nueva Pregunta */}
              <Grid size={12}>
                <Card variant="outlined" sx={{ backgroundColor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {editingQuestionIndex !== null ? 'Editar Pregunta' : 'Agregar Nueva Pregunta'}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Texto de la pregunta"
                          value={newQuestion.question_text}
                          onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Tipo de pregunta</InputLabel>
                          <Select
                            value={newQuestion.question_type}
                            onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value as any })}
                          >
                            {questionTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={newQuestion.is_required}
                              onChange={(e) => setNewQuestion({ ...newQuestion, is_required: e.target.checked })}
                            />
                          }
                          label="Pregunta obligatoria"
                        />
                      </Grid>
                      
                      {/* Opciones para preguntas de selección */}
                      {['multiple_choice', 'single_choice'].includes(newQuestion.question_type) && (
                        <Grid size={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            Opciones
                          </Typography>
                          {JSON.parse(newQuestion.options || '[]').map((option: string, index: number) => (
                            <Box key={index} display="flex" gap={1} mb={1}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder={`Opción ${index + 1}`}
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeOption(index)}
                                disabled={JSON.parse(newQuestion.options || '[]').length <= 1}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          ))}
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={addOption}
                          >
                            Agregar opción
                          </Button>
                        </Grid>
                      )}
                      
                      {/* Configuración para escalas */}
                      {newQuestion.question_type === 'scale' && (
                        <Grid size={12}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 6, md: 3 }}>
                              <TextField
                                fullWidth
                                label="Valor mínimo"
                                type="number"
                                value={newQuestion.min_value || ''}
                                onChange={(e) => setNewQuestion({ ...newQuestion, min_value: e.target.value ? parseInt(e.target.value) : undefined })}
                              />
                            </Grid>
                            <Grid size={{ xs: 6, md: 3 }}>
                              <TextField
                                fullWidth
                                label="Valor máximo"
                                type="number"
                                value={newQuestion.max_value || ''}
                                onChange={(e) => setNewQuestion({ ...newQuestion, max_value: e.target.value ? parseInt(e.target.value) : undefined })}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                label="Texto de ayuda (opcional)"
                                value={newQuestion.placeholder_text || ''}
                                onChange={(e) => setNewQuestion({ ...newQuestion, placeholder_text: e.target.value })}
                              />
                            </Grid>
                          </Grid>
                        </Grid>
                      )}
                      
                      <Grid size={12}>
                        {editingQuestionIndex !== null ? (
                          <Box display="flex" gap={2}>
                            <Button
                              variant="contained"
                              startIcon={<EditIcon />}
                              onClick={handleUpdateQuestion}
                              disabled={!newQuestion.question_text.trim()}
                            >
                              Actualizar Pregunta
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={handleCancelEdit}
                            >
                              Cancelar
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddQuestion}
                            disabled={!newQuestion.question_text.trim()}
                          >
                            Agregar Pregunta
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button 
              onClick={handleSaveSurvey} 
              variant="contained"
              disabled={!formData.title || !formData.description || questions.length === 0}
            >
              {editingSurvey ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Ver Detalles de la Encuesta */}
        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Detalles de la Encuesta
          </DialogTitle>
          <DialogContent>
            {viewingSurvey && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Typography variant="h6">{viewingSurvey.title}</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {viewingSurvey.description}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2">Curso:</Typography>
                    <Typography variant="body2">
                      {viewingSurvey.course?.title || 'No asignado'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2">Estado:</Typography>
                    <Chip
                      label={statusConfig[viewingSurvey.status as keyof typeof statusConfig]?.label}
                      color={statusConfig[viewingSurvey.status as keyof typeof statusConfig]?.color as any}
                      icon={statusConfig[viewingSurvey.status as keyof typeof statusConfig]?.icon}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="h6" gutterBottom>
                      Preguntas ({viewingSurvey?.questions?.length || 0})
                    </Typography>
                    {viewingSurvey?.questions?.map((question, index) => (
                      <Accordion key={question.id}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1">
                            {index + 1}. {question.question_text}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" color="text.secondary">
                            Tipo: {questionTypes.find(t => t.value === question.question_type)?.label}
                            {question.is_required && ' • Obligatoria'}
                          </Typography>
                          {question.options && (
                            <Box mt={1}>
                              <Typography variant="subtitle2">Opciones:</Typography>
                              <List dense>
                                {JSON.parse(question.options).map((option: string, optIndex: number) => (
                                  <ListItem key={optIndex}>
                                    <ListItemText primary={option} />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                          {question.question_type === 'scale' && (
                            <Box mt={1}>
                              <Typography variant="subtitle2">
                                Escala: {question.min_value} - {question.max_value}
                              </Typography>
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Ver Respuestas */}
        <Dialog open={openResponsesDialog} onClose={() => setOpenResponsesDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Respuestas de la Encuesta
            {viewingSurvey && ` - ${viewingSurvey.title}`}
          </DialogTitle>
          <DialogContent>
            {userSurveys && userSurveys.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Completado</TableCell>
                    <TableCell>Tiempo Respuesta</TableCell>
                    <TableCell>Completitud</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userSurveys && userSurveys.map((employeeResponse, index) => (
                    <TableRow key={`${employeeResponse.user_id}-${index}`}>
                      <TableCell>
                        {employeeResponse.employee_name}
                      </TableCell>
                      <TableCell>
                        {employeeResponse.employee_email}
                      </TableCell>
                      <TableCell>
                        {employeeResponse.cargo || 'No especificado'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employeeResponse.submission_status === 'completed' ? 'Completada' : 
                                 employeeResponse.submission_status === 'in_progress' ? 'En progreso' : 
                                 employeeResponse.submission_status === 'expired' ? 'Expirada' : 'No iniciada'}
                          color={employeeResponse.submission_status === 'completed' ? 'success' : 
                                 employeeResponse.submission_status === 'in_progress' ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {employeeResponse.submission_date ? formatDateTime(employeeResponse.submission_date) : '-'}
                      </TableCell>
                      <TableCell>
                        {employeeResponse.response_time_minutes ? `${employeeResponse.response_time_minutes} min` : '-'}
                      </TableCell>
                      <TableCell>
                        {employeeResponse.completion_percentage}%
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver respuestas">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewDetailedResponse(employeeResponse)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                No hay respuestas registradas para esta encuesta
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenResponsesDialog(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Respuestas Detalladas */}
        <Dialog 
          open={openDetailedResponseDialog} 
          onClose={() => setOpenDetailedResponseDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon />
              <Typography variant="h6">
                Respuestas de {selectedEmployeeResponse?.employee_name}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedEmployeeResponse && (
              <Box>
                {/* Información del empleado */}
                 <Card sx={{ mb: 3 }}>
                   <CardContent>
                     <Box display="flex" flexDirection="column" gap={2}>
                       <Box display="flex" flexWrap="wrap" gap={2}>
                         <Box flex="1" minWidth="200px">
                           <Typography variant="body2" color="text.secondary">
                             Nombre
                           </Typography>
                           <Typography variant="body1">
                             {selectedEmployeeResponse.employee_name}
                           </Typography>
                         </Box>
                         <Box flex="1" minWidth="200px">
                           <Typography variant="body2" color="text.secondary">
                             Email
                           </Typography>
                           <Typography variant="body1">
                             {selectedEmployeeResponse.employee_email}
                           </Typography>
                         </Box>
                       </Box>
                       <Box display="flex" flexWrap="wrap" gap={2}>
                         <Box flex="1" minWidth="200px">
                           <Typography variant="body2" color="text.secondary">
                             Cargo
                           </Typography>
                           <Typography variant="body1">
                             {selectedEmployeeResponse.cargo || 'No especificado'}
                           </Typography>
                         </Box>
                         <Box flex="1" minWidth="200px">
                           <Typography variant="body2" color="text.secondary">
                             Estado
                           </Typography>
                           <Chip 
                             label={selectedEmployeeResponse.submission_status}
                             color={selectedEmployeeResponse.submission_status === 'completed' ? 'success' : 'warning'}
                             size="small"
                           />
                         </Box>
                       </Box>
                       <Box display="flex" flexWrap="wrap" gap={2}>
                         <Box flex="1" minWidth="200px">
                           <Typography variant="body2" color="text.secondary">
                             Fecha de envío
                           </Typography>
                           <Typography variant="body1">
                             {selectedEmployeeResponse.submission_date ? 
                               formatDateTime(selectedEmployeeResponse.submission_date) : 
                               'No completado'
                             }
                           </Typography>
                         </Box>
                         <Box flex="1" minWidth="200px">
                           <Typography variant="body2" color="text.secondary">
                             Tiempo de respuesta
                           </Typography>
                           <Typography variant="body1">
                             {selectedEmployeeResponse.response_time_minutes ? 
                               `${selectedEmployeeResponse.response_time_minutes} minutos` : 
                               'No disponible'
                             }
                           </Typography>
                         </Box>
                       </Box>
                       <Box>
                         <Typography variant="body2" color="text.secondary">
                           Porcentaje de completitud
                         </Typography>
                         <Box display="flex" alignItems="center" gap={1}>
                           <LinearProgress 
                             variant="determinate" 
                             value={selectedEmployeeResponse.completion_percentage}
                             sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                             color={getCompletionColor(selectedEmployeeResponse.completion_percentage)}
                           />
                           <Typography variant="body2">
                             {selectedEmployeeResponse.completion_percentage}%
                           </Typography>
                         </Box>
                       </Box>
                     </Box>
                   </CardContent>
                 </Card>

                {/* Respuestas */}
                <Typography variant="h6" gutterBottom>
                  Respuestas
                </Typography>
                {selectedEmployeeResponse.answers && selectedEmployeeResponse.answers.length > 0 ? (
                  <Box>
                    {selectedEmployeeResponse.answers.map((answer, index) => (
                      <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {answer.question_text}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Tipo: {answer.question_type}
                          </Typography>
                          <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body1">
                              {answer.display_value || 'Sin respuesta'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
                    No hay respuestas disponibles
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailedResponseDialog(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Assignment Dialog */}
        <Dialog
          open={openAssignDialog}
          onClose={() => setOpenAssignDialog(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { height: '80vh' }
          }}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Asignar Encuesta: {assigningSurvey?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedUsers.length} de {getFilteredUsers().length} usuarios seleccionados
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Selecciona los usuarios a los que deseas asignar esta encuesta general.
            </Typography>
            
            {/* Filtros y búsqueda */}
            <Box sx={{ mt: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Buscar usuario"
                    placeholder="Nombre, apellido o documento"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Área</InputLabel>
                    <Select
                      value={userAreaFilter}
                      label="Área"
                      onChange={(e) => setUserAreaFilter(e.target.value)}
                    >
                      <MenuItem value="">Todas las áreas</MenuItem>
                      {getUniqueAreas().map((area) => (
                        <MenuItem key={area} value={area}>
                          {area}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cargo</InputLabel>
                    <Select
                      value={userCargoFilter}
                      label="Cargo"
                      onChange={(e) => setUserCargoFilter(e.target.value)}
                    >
                      <MenuItem value="">Todos los cargos</MenuItem>
                      {getUniqueCargos().map((cargo) => (
                        <MenuItem key={cargo} value={cargo}>
                          {cargo}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleSelectAllFiltered}
                      disabled={getFilteredUsers().length === 0}
                    >
                      Todos
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleDeselectAll}
                      disabled={selectedUsers.length === 0}
                    >
                      Ninguno
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Lista de usuarios */}
            <Box sx={{ 
              maxHeight: '400px', 
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1
            }}>
              {getFilteredUsers().length > 0 ? (
                <FormGroup>
                  {getFilteredUsers().map((worker) => (
                    <FormControlLabel
                      key={worker.id}
                      sx={{ 
                        mb: 1,
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                      control={
                        <Checkbox
                          checked={selectedUsers.includes(worker.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, worker.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== worker.id));
                            }
                          }}
                        />
                      }
                      label={
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {worker.first_name} {worker.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {worker.position || 'Sin cargo'} - {worker.department || 'Sin área'}
                          </Typography>
                          {worker.document_number && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                              Doc: {worker.document_number}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron usuarios con los filtros aplicados
                  </Typography>
                </Box>
              )}
            </Box>
            
            {selectedUsers.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>{selectedUsers.length}</strong> usuario(s) seleccionado(s) para asignar la encuesta
                </Typography>
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => {
                setOpenAssignDialog(false);
                setUserSearch('');
                setUserAreaFilter('');
                setUserCargoFilter('');
                setSelectedUsers([]);
              }}
              disabled={assignmentLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignSurveyToUsers}
              variant="contained"
              disabled={selectedUsers.length === 0 || assignmentLoading}
              startIcon={assignmentLoading ? <CircularProgress size={20} /> : <AssignmentIcon />}
            >
              {assignmentLoading ? 'Asignando...' : `Asignar a ${selectedUsers.length} usuario(s)`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle id="delete-dialog-title" sx={{ pb: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <DeleteIcon color="error" />
              Confirmar Eliminación
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography id="delete-dialog-description" variant="body1" sx={{ mb: 2 }}>
              ¿Está seguro de que desea eliminar la encuesta <strong>"{deletingSurvey?.title}"</strong>?
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Importante:</strong> Esta acción no se puede deshacer.
              </Typography>
            </Alert>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Nota:</strong> Si la encuesta tiene respuestas de usuarios, no podrá ser eliminada. 
                En ese caso, considere cambiar su estado a "Archivada" en lugar de eliminarla.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => setOpenDeleteDialog(false)} 
              color="primary"
              variant="outlined"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmDeleteSurvey} 
              color="error" 
              variant="contained"
              startIcon={<DeleteIcon />}
            >
              Eliminar Encuesta
            </Button>
          </DialogActions>
        </Dialog>
          </Box>
        )}
        
        {/* Snackbar for notifications */}
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
    </LocalizationProvider>
  );
};

export default Survey;