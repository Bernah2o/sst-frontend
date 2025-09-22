import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PictureAsPdf as PdfIcon,
  Analytics as AnalyticsIcon,
  Poll as SurveyIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';

// Types
type SurveyStatus = 'draft' | 'published' | 'closed' | 'archived';
type SurveyQuestionType = 'multiple_choice' | 'single_choice' | 'text' | 'textarea' | 'rating' | 'yes_no' | 'scale';

interface Survey {
  id: number;
  title: string;
  description?: string;
  status: SurveyStatus;
  course_id?: number;
  course?: { id: number; title: string } | null;
  created_at: string;
  published_at?: string;
  closes_at?: string;
  total_responses: number;
  completion_rate: number;
  questions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: number;
  survey_id: number;
  question_text: string;
  question_type: SurveyQuestionType;
  options?: string;
  is_required: boolean;
  order_index: number;
  min_value?: number;
  max_value?: number;
}

interface QuestionStatistics {
  question_id: number;
  question_text: string;
  question_type: SurveyQuestionType;
  total_responses: number;
  response_rate: number;
  statistics: {
    options?: { option: string; count: number; percentage: number }[];
    average?: number;
    min?: number;
    max?: number;
    count?: number;
    text_responses?: string[];
    response_count?: number;
    yes_count?: number;
    no_count?: number;
    yes_percentage?: number;
    no_percentage?: number;
    total_responses?: number;
  };
}

interface SurveyAnalysis {
  survey: Survey;
  total_invited: number;
  total_responses: number;
  completion_rate: number;
  average_completion_time: number;
  question_statistics: QuestionStatistics[];
  response_trends: {
    date: string;
    responses: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const SurveyTabulation: React.FC = () => {
  const { canReadSurveys } = usePermissions();

  // State
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyAnalysis, setSurveyAnalysis] = useState<SurveyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all');
  const [pdfExporting, setPdfExporting] = useState(false);

  // Effects
  useEffect(() => {
    if (canReadSurveys()) {
      fetchSurveys();
    }
  }, [canReadSurveys]);

  // API Functions
  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await api.get('/surveys/');
      setSurveys(response.data.items || []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveyAnalysis = async (surveyId: number) => {
    try {
      setAnalysisLoading(true);
      
      // Get detailed survey results with actual responses
      const response = await api.get(`/surveys/${surveyId}/detailed-results`);
      const detailedResults = response.data;
      
      // Calculate real statistics from actual responses
      const questionStatistics = detailedResults.questions.map((question: any) => {
        // Get all responses for this question, including those with valid data
        const questionResponses = detailedResults.employee_responses
          .map((emp: any) => emp.answers.find((ans: any) => ans.question_id === question.id))
          .filter((ans: any) => {
            if (!ans) return false;
            
            // Include response if it has any valid data
            return (
              ans.answer_text || 
              ans.answer_value !== null || 
              ans.selected_options ||
              ans.is_answered
            );
          });
        
        const totalResponses = questionResponses.length;
        const responseRate = detailedResults.total_responses > 0 
          ? (totalResponses / detailedResults.total_responses) * 100 
          : 0;
        
        return {
          question_id: question.id,
          question_text: question.question_text,
          question_type: question.question_type,
          total_responses: totalResponses,
          response_rate: responseRate,
          statistics: calculateRealStatistics(question, questionResponses)
        };
      });
      
      // Calculate average completion time from actual data
      const completedResponses = detailedResults.employee_responses
        .filter((emp: any) => emp.response_time_minutes);
      const averageCompletionTime = completedResponses.length > 0
        ? completedResponses.reduce((sum: number, emp: any) => sum + emp.response_time_minutes, 0) / completedResponses.length
        : 0;
      
      const analysis: SurveyAnalysis = {
        survey: {
          id: detailedResults.survey_id,
          title: detailedResults.survey_title,
          description: detailedResults.survey_description,
          status: 'published' as SurveyStatus,
          created_at: '',
          total_responses: detailedResults.total_responses,
          completion_rate: detailedResults.completion_rate,
          questions: detailedResults.questions,
          course: detailedResults.course_title ? { id: 0, title: detailedResults.course_title } : null
        },
        total_invited: detailedResults.total_responses, // Assuming all responses are from invited users
        total_responses: detailedResults.completed_responses,
        completion_rate: detailedResults.completion_rate,
        average_completion_time: averageCompletionTime,
        question_statistics: questionStatistics,
        response_trends: generateTrendsFromResponses(detailedResults.employee_responses)
      };
      
      setSurveyAnalysis(analysis);
    } catch (error) {
      console.error('Error fetching survey analysis:', error);
      // Fallback: create analysis with available data
      const survey = surveys.find(s => s.id === surveyId);
      if (survey) {
        const fallbackAnalysis: SurveyAnalysis = {
          survey,
          total_invited: 0,
          total_responses: survey.total_responses || 0,
          completion_rate: survey.completion_rate || 0,
          average_completion_time: 0,
          question_statistics: (survey.questions || []).map(q => ({
            question_id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            total_responses: 0,
            response_rate: 0,
            statistics: {}
          })),
          response_trends: []
        };
        setSurveyAnalysis(fallbackAnalysis);
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Helper Functions for Real Statistics
  const calculateRealStatistics = (question: any, responses: any[]) => {
    switch (question.question_type) {
      case 'multiple_choice':
      case 'single_choice':
        const options = question.options ? JSON.parse(question.options) : [];
        const optionCounts: { [key: string]: number } = {};
        
        // Initialize counts
        options.forEach((option: string) => {
          optionCounts[option] = 0;
        });
        
        // Count responses
        responses.forEach((response: any, index: number) => {
          // Handle different response formats
          let selectedOptions: string[] = [];
          
          if (response.selected_options) {
            try {
              const parsed = JSON.parse(response.selected_options);
              if (Array.isArray(parsed)) {
                selectedOptions = parsed;
              } else {
                selectedOptions = [parsed];
              }
            } catch (e) {
              selectedOptions = [response.selected_options];
            }
          } else if (response.answer_text) {
            // Handle case where response comes in answer_text instead of selected_options
            selectedOptions = [response.answer_text];
          } else if (response.display_value) {
            // Fallback to display_value
            selectedOptions = [response.display_value];
          }
          
          // Count the selected options
          selectedOptions.forEach((option: string) => {
            if (optionCounts.hasOwnProperty(option)) {
              optionCounts[option]++;
            }
          });
        });
        
        const totalResponses = responses.length;
        
        const result = {
          options: options.map((option: string) => ({
            option,
            count: optionCounts[option] || 0,
            percentage: totalResponses > 0 ? ((optionCounts[option] || 0) / totalResponses) * 100 : 0
          }))
        };
        return result;
      case 'rating':
      case 'scale':
        const numericResponses = responses
          .map((r: any) => r.answer_value)
          .filter((val: any) => val !== null && val !== undefined && !isNaN(val));
        
        const average = numericResponses.length > 0
          ? numericResponses.reduce((sum: number, val: number) => sum + val, 0) / numericResponses.length
          : 0;
        
        return {
          average: average,
          min: numericResponses.length > 0 ? Math.min(...numericResponses) : 0,
          max: numericResponses.length > 0 ? Math.max(...numericResponses) : 0,
          count: numericResponses.length
        };
        
      case 'yes_no':
        let yesCount = 0;
        let noCount = 0;
        
        responses.forEach((response: any) => {
          const answer = response.answer_text?.toLowerCase() || response.display_value?.toLowerCase();
          if (answer === 'sí' || answer === 'si' || answer === 'yes' || answer === 'true') {
            yesCount++;
          } else if (answer === 'no' || answer === 'false') {
            noCount++;
          }
        });
        
        const total = yesCount + noCount;
        return {
          yes_count: yesCount,
          no_count: noCount,
          yes_percentage: total > 0 ? (yesCount / total) * 100 : 0,
          no_percentage: total > 0 ? (noCount / total) * 100 : 0
        };
        
      case 'text':
      case 'textarea':
        const textResponses = responses
          .map((r: any) => r.answer_text || r.display_value)
          .filter((text: any) => text && text.trim().length > 0);
        
        return {
          text_responses: textResponses,
          response_count: textResponses.length
        };
        
      default:
        return {
          total_responses: responses.length
        };
    }
  };

  const generateTrendsFromResponses = (employeeResponses: any[]) => {
    const responseDates: { [key: string]: number } = {};
    
    employeeResponses.forEach((emp: any) => {
      if (emp.submission_date) {
        const date = emp.submission_date.split('T')[0]; // Get date part only
        responseDates[date] = (responseDates[date] || 0) + 1;
      }
    });
    
    // Convert to array and sort by date
    const trends = Object.entries(responseDates)
      .map(([date, responses]) => ({ date, responses }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return trends;
  };

  const getStatusColor = (status: SurveyStatus) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'closed': return 'info';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: SurveyStatus) => {
    switch (status) {
      case 'published': return 'Publicada';
      case 'draft': return 'Borrador';
      case 'closed': return 'Cerrada';
      case 'archived': return 'Archivada';
      default: return status;
    }
  };

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || survey.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSurveySelect = (survey: Survey) => {
    setSelectedSurvey(survey);
    fetchSurveyAnalysis(survey.id);
  };

  const exportToPDF = async () => {
    if (!surveyAnalysis) return;

    try {
      setPdfExporting(true);
      
      // Create a temporary div with the content to export
      const exportContent = document.getElementById('survey-analysis-content');
      if (!exportContent) return;

      const canvas = await html2canvas(exportContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add title page
      pdf.setFontSize(20);
      pdf.text(`Tabulación de Encuesta: ${surveyAnalysis.survey.title}`, 20, 30);
      pdf.setFontSize(12);
      pdf.text(`Fecha de generación: ${formatDate(new Date().toISOString())}`, 20, 45);
      pdf.text(`Total de respuestas: ${surveyAnalysis.total_responses}`, 20, 55);
      pdf.text(`Tasa de finalización: ${surveyAnalysis.completion_rate.toFixed(1)}%`, 20, 65);

      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`tabulacion_encuesta_${surveyAnalysis.survey.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setPdfExporting(false);
    }
  };

  const renderQuestionAnalysis = (questionStat: QuestionStatistics) => {
    const { question_type, statistics } = questionStat;

    switch (question_type) {
      case 'multiple_choice':
      case 'single_choice':
        if (statistics.options) {
          const chartData = statistics.options.map((option, index) => ({
            name: option.option,
            value: option.count,
            percentage: option.percentage
          }));

          return (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Opción</TableCell>
                        <TableCell align="right">Respuestas</TableCell>
                        <TableCell align="right">Porcentaje</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistics.options.map((option, index) => (
                        <TableRow key={index}>
                          <TableCell>{option.option}</TableCell>
                          <TableCell align="right">{option.count}</TableCell>
                          <TableCell align="right">{option.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </Box>
          );
        }
        break;

      case 'rating':
      case 'scale':
        if (statistics.average !== undefined) {
          const maxValue = questionStat.question_type === 'rating' ? 5 : 10;
          const progressValue = (statistics.average / maxValue) * 100;
          
          return (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Estadísticas Numéricas
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      <strong>Promedio:</strong> {statistics.average.toFixed(2)} / {maxValue}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={progressValue}
                      sx={{ height: 10, borderRadius: 5, mt: 1 }}
                    />
                  </Box>
                  {statistics.min !== undefined && (
                    <Typography variant="body2">
                      <strong>Valor mínimo:</strong> {statistics.min}
                    </Typography>
                  )}
                  {statistics.max !== undefined && (
                    <Typography variant="body2">
                      <strong>Valor máximo:</strong> {statistics.max}
                    </Typography>
                  )}
                  {statistics.count !== undefined && (
                    <Typography variant="body2">
                      <strong>Total de respuestas:</strong> {statistics.count}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="primary">
                        {statistics.average.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Promedio General
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          );
        }
        break;

      case 'yes_no':
        if (statistics.yes_count !== undefined && statistics.no_count !== undefined) {
          const yesPercentage = statistics.yes_percentage || 0;
          const noPercentage = statistics.no_percentage || 0;
          const total = statistics.yes_count + statistics.no_count;

          const chartData = [
            { name: 'Sí', value: statistics.yes_count, percentage: yesPercentage },
            { name: 'No', value: statistics.no_count, percentage: noPercentage }
          ];

          return (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#4CAF50" />
                      <Cell fill="#F44336" />
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Resumen de Respuestas
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ width: 16, height: 16, bgcolor: '#4CAF50', borderRadius: '50%', mr: 1 }} />
                      <strong>Sí:</strong> {statistics.yes_count} respuestas ({yesPercentage.toFixed(1)}%)
                    </Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ width: 16, height: 16, bgcolor: '#F44336', borderRadius: '50%', mr: 1 }} />
                      <strong>No:</strong> {statistics.no_count} respuestas ({noPercentage.toFixed(1)}%)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Total:</strong> {total} respuestas
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          );
        }
        break;

      case 'text':
      case 'textarea':
        if (statistics.text_responses && statistics.response_count !== undefined) {
          const displayCount = Math.min(10, statistics.text_responses.length);
          const remainingCount = statistics.text_responses.length - displayCount;
          
          return (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Respuestas de texto 
                <Chip 
                  label={`${statistics.response_count} respuestas`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Typography>
              
              <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2 }}>
                {statistics.text_responses.slice(0, displayCount).map((response, index) => (
                  <Paper 
                    key={index} 
                    elevation={1}
                    sx={{ 
                      mb: 1, 
                      p: 2, 
                      bgcolor: 'grey.50', 
                      borderLeft: '4px solid',
                      borderLeftColor: 'primary.main'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      "{response}"
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Respuesta #{index + 1}
                    </Typography>
                  </Paper>
                ))}
              </Box>
              
              {remainingCount > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Se muestran las primeras {displayCount} respuestas. 
                    Hay {remainingCount} respuestas adicionales.
                  </Typography>
                </Alert>
              )}
              
              {statistics.response_count === 0 && (
                <Alert severity="warning">
                  <Typography variant="body2">
                    No se recibieron respuestas de texto para esta pregunta.
                  </Typography>
                </Alert>
              )}
            </Box>
          );
        }
        break;
    }

    return <Typography variant="body2" color="text.secondary">No hay datos disponibles</Typography>;
  };

  if (!canReadSurveys()) {
    return (
      <Alert severity="error">
        No tienes permisos para ver las encuestas.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon />
          Tabulación de Encuestas
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchSurveys}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Lista de Encuestas */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Encuestas Disponibles
              </Typography>
              
              {/* Filtros */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar encuestas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Estado"
                    onChange={(e) => setStatusFilter(e.target.value as SurveyStatus | 'all')}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="published">Publicadas</MenuItem>
                    <MenuItem value="closed">Cerradas</MenuItem>
                    <MenuItem value="draft">Borradores</MenuItem>
                    <MenuItem value="archived">Archivadas</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                  {filteredSurveys.map((survey) => (
                    <Card
                      key={survey.id}
                      sx={{
                        mb: 1,
                        cursor: 'pointer',
                        border: selectedSurvey?.id === survey.id ? 2 : 1,
                        borderColor: selectedSurvey?.id === survey.id ? 'primary.main' : 'divider',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => handleSurveySelect(survey)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" noWrap>
                          {survey.title}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Chip
                            size="small"
                            label={getStatusLabel(survey.status)}
                            color={getStatusColor(survey.status) as any}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {survey.total_responses || 0} respuestas
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Análisis de Encuesta */}
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedSurvey ? (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Análisis: {selectedSurvey.title}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PdfIcon />}
                    onClick={exportToPDF}
                    disabled={!surveyAnalysis || pdfExporting}
                  >
                    {pdfExporting ? 'Exportando...' : 'Exportar PDF'}
                  </Button>
                </Box>

                {analysisLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : surveyAnalysis ? (
                  <Box id="survey-analysis-content">
                    {/* Resumen General */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4">{surveyAnalysis.total_responses}</Typography>
                            <Typography variant="body2">Respuestas</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4">{surveyAnalysis.completion_rate.toFixed(1)}%</Typography>
                            <Typography variant="body2">Tasa de Finalización</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <AnalyticsIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4">{surveyAnalysis.average_completion_time.toFixed(1)}</Typography>
                            <Typography variant="body2">Tiempo Promedio (min)</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <SurveyIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4">{surveyAnalysis.question_statistics.length}</Typography>
                            <Typography variant="body2">Preguntas</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Análisis por Pregunta */}
                    <Typography variant="h6" gutterBottom>
                      Análisis por Pregunta
                    </Typography>
                    {surveyAnalysis.question_statistics.map((questionStat, index) => (
                      <Accordion key={questionStat.question_id} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle1">
                              Pregunta {index + 1}: {questionStat.question_text}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {questionStat.total_responses} respuestas • {questionStat.response_rate.toFixed(1)}% tasa de respuesta
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          {renderQuestionAnalysis(questionStat)}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">
                    Selecciona una encuesta para ver su análisis detallado.
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <AssessmentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Selecciona una encuesta para comenzar
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Elige una encuesta de la lista para ver su análisis detallado y estadísticas.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SurveyTabulation;