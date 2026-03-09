import React, { useState, useEffect, useCallback } from 'react';
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
  Paper,
  Stack,
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
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';

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
  response_trends: { date: string; responses: number }[];
  year?: number;
}

const COLORS = ['#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#00838F', '#AD1457', '#F9A825', '#37474F'];
const CURRENT_YEAR = new Date().getFullYear();

const SurveyTabulation: React.FC = () => {
  const { canReadSurveys, loading: permissionsLoading } = usePermissions();

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyAnalysis, setSurveyAnalysis] = useState<SurveyAnalysis | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all');
  const [pdfExporting, setPdfExporting] = useState(false);

  useEffect(() => {
    if (canReadSurveys()) fetchSurveys();
  }, [canReadSurveys]);

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

  const fetchAvailableYears = async (surveyId: number) => {
    try {
      setYearsLoading(true);
      const response = await api.get(`/surveys/${surveyId}/available-years`);
      const years: number[] = response.data || [];
      setAvailableYears(years);
      // Select the most recent year, or current year if no data
      if (years.length > 0) {
        setSelectedYear(years[0]);
      } else {
        setSelectedYear(CURRENT_YEAR);
      }
    } catch (error) {
      console.error('Error fetching available years:', error);
      setAvailableYears([]);
      setSelectedYear(CURRENT_YEAR);
    } finally {
      setYearsLoading(false);
    }
  };

  const fetchSurveyAnalysis = useCallback(async (surveyId: number, year?: number) => {
    try {
      setAnalysisLoading(true);
      const params: Record<string, any> = {};
      if (year) params.year = year;

      const response = await api.get(`/surveys/${surveyId}/detailed-results`, { params });
      const detailedResults = response.data;

      const employeesWithResponses = detailedResults.employee_responses.filter((emp: any) =>
        emp.answers?.some((ans: any) =>
          ans.answer_text || ans.answer_value !== null || ans.selected_options || ans.is_answered
        )
      );
      const actualTotalResponses = employeesWithResponses.length;

      const questionStatistics = detailedResults.questions.map((question: any) => {
        const questionResponses = detailedResults.employee_responses
          .map((emp: any) => emp.answers.find((ans: any) => ans.question_id === question.id))
          .filter((ans: any) => ans && (ans.answer_text || ans.answer_value !== null || ans.selected_options || ans.is_answered));

        const totalResponses = questionResponses.length;
        return {
          question_id: question.id,
          question_text: question.question_text,
          question_type: question.question_type,
          total_responses: totalResponses,
          response_rate: actualTotalResponses > 0 ? (totalResponses / actualTotalResponses) * 100 : 0,
          statistics: calculateRealStatistics(question, questionResponses),
        };
      });

      const completedResponses = detailedResults.employee_responses.filter((emp: any) => emp.response_time_minutes);
      const averageCompletionTime = completedResponses.length > 0
        ? completedResponses.reduce((sum: number, emp: any) => sum + emp.response_time_minutes, 0) / completedResponses.length
        : 0;

      const actualCompletionRate = detailedResults.total_invited > 0
        ? (actualTotalResponses / detailedResults.total_invited) * 100
        : actualTotalResponses > 0 ? 100 : 0;

      setSurveyAnalysis({
        survey: {
          id: detailedResults.survey_id,
          title: detailedResults.survey_title,
          description: detailedResults.survey_description,
          status: 'published' as SurveyStatus,
          created_at: '',
          total_responses: actualTotalResponses,
          completion_rate: actualCompletionRate,
          questions: detailedResults.questions,
          course: detailedResults.course_title ? { id: 0, title: detailedResults.course_title } : null,
        },
        total_invited: detailedResults.total_invited || actualTotalResponses,
        total_responses: actualTotalResponses,
        completion_rate: actualCompletionRate,
        average_completion_time: averageCompletionTime,
        question_statistics: questionStatistics,
        response_trends: generateTrendsFromResponses(detailedResults.employee_responses),
        year,
      });
    } catch (error) {
      console.error('Error fetching survey analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  // Re-fetch analysis when year changes
  useEffect(() => {
    if (selectedSurvey) {
      fetchSurveyAnalysis(selectedSurvey.id, selectedYear);
    }
  }, [selectedYear, selectedSurvey, fetchSurveyAnalysis]);

  const calculateRealStatistics = (question: SurveyQuestion, responses: any[]) => {
    switch (question.question_type) {
      case 'multiple_choice':
      case 'single_choice': {
        const options = question.options ? JSON.parse(question.options) : [];
        const optionCounts: { [key: string]: number } = {};
        options.forEach((opt: string) => { optionCounts[opt] = 0; });
        responses.forEach((response: any) => {
          let selected: string[] = [];
          if (response.selected_options) {
            try {
              const parsed = JSON.parse(response.selected_options);
              selected = Array.isArray(parsed) ? parsed : [String(parsed)];
            } catch { selected = [response.selected_options]; }
          } else if (response.answer_text?.trim()) {
            selected = [response.answer_text];
          } else if (response.display_value && response.display_value !== 'Sin respuesta') {
            selected = [response.display_value];
          }
          selected.forEach((opt: string) => {
            const trimmed = opt.trim();
            if (Object.prototype.hasOwnProperty.call(optionCounts, trimmed)) {
              optionCounts[trimmed]++;
            } else {
              const match = options.find((o: string) => o.toLowerCase() === trimmed.toLowerCase());
              if (match) optionCounts[match]++;
            }
          });
        });
        const total = responses.length;
        return {
          options: options.map((opt: string) => ({
            option: opt,
            count: optionCounts[opt] || 0,
            percentage: total > 0 ? ((optionCounts[opt] || 0) / total) * 100 : 0,
          })),
        };
      }
      case 'rating':
      case 'scale': {
        const nums = responses.map((r: any) => r.answer_value).filter((v: any) => v !== null && v !== undefined && !isNaN(v));
        const avg = nums.length > 0 ? nums.reduce((s: number, v: number) => s + v, 0) / nums.length : 0;
        return { average: avg, min: nums.length > 0 ? Math.min(...nums) : 0, max: nums.length > 0 ? Math.max(...nums) : 0, count: nums.length };
      }
      case 'yes_no': {
        let yes = 0, no = 0;
        responses.forEach((r: any) => {
          const ans = (r.answer_text || r.display_value || '').toLowerCase();
          if (['sí', 'si', 'yes', 'true'].includes(ans)) yes++;
          else if (['no', 'false'].includes(ans)) no++;
        });
        const tot = yes + no;
        return { yes_count: yes, no_count: no, yes_percentage: tot > 0 ? (yes / tot) * 100 : 0, no_percentage: tot > 0 ? (no / tot) * 100 : 0 };
      }
      case 'text':
      case 'textarea': {
        const texts = responses.map((r: any) => r.answer_text || r.display_value).filter((t: any) => t?.trim().length > 0);
        return { text_responses: texts, response_count: texts.length };
      }
      default:
        return { total_responses: responses.length };
    }
  };

  const generateTrendsFromResponses = (employeeResponses: any[]) => {
    const byDate: { [k: string]: number } = {};
    employeeResponses.forEach((emp: any) => {
      if (emp.submission_date) {
        const date = emp.submission_date.split('T')[0];
        byDate[date] = (byDate[date] || 0) + 1;
      }
    });
    return Object.entries(byDate).map(([date, responses]) => ({ date, responses })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getStatusColor = (status: SurveyStatus) => {
    const map: Record<SurveyStatus, 'success' | 'warning' | 'info' | 'default'> = {
      published: 'success', draft: 'warning', closed: 'info', archived: 'default',
    };
    return map[status] || 'default';
  };

  const getStatusLabel = (status: SurveyStatus) => {
    const map: Record<SurveyStatus, string> = {
      published: 'Publicada', draft: 'Borrador', closed: 'Cerrada', archived: 'Archivada',
    };
    return map[status] || status;
  };

  const filteredSurveys = surveys.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSurveySelect = async (survey: Survey) => {
    setSelectedSurvey(survey);
    setSurveyAnalysis(null);
    await fetchAvailableYears(survey.id);
  };

  const exportToPDF = async () => {
    if (!selectedSurvey) return;
    try {
      setPdfExporting(true);
      const response = await api.get(`/surveys/${selectedSurvey.id}/report/pdf`, {
        params: { year: selectedYear },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_encuesta_${selectedSurvey.title.replace(/\s+/g, '_')}_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setPdfExporting(false);
    }
  };

  // Find best and worst performing question for decision support
  const getInsights = () => {
    if (!surveyAnalysis || surveyAnalysis.question_statistics.length === 0) return null;
    const ratingQuestions = surveyAnalysis.question_statistics.filter(
      q => (q.question_type === 'rating' || q.question_type === 'scale') && q.statistics.average !== undefined
    );
    const lowestRated = ratingQuestions.reduce<QuestionStatistics | null>((prev, curr) => {
      if (!prev || (curr.statistics.average ?? 0) < (prev.statistics.average ?? 0)) return curr;
      return prev;
    }, null);
    const highestRated = ratingQuestions.reduce<QuestionStatistics | null>((prev, curr) => {
      if (!prev || (curr.statistics.average ?? 0) > (prev.statistics.average ?? 0)) return curr;
      return prev;
    }, null);
    return { lowestRated, highestRated };
  };

  const renderQuestionAnalysis = (questionStat: QuestionStatistics) => {
    const { question_type, statistics } = questionStat;

    switch (question_type) {
      case 'multiple_choice':
      case 'single_choice':
        if (statistics.options) {
          const chartData = statistics.options.filter(o => o.count > 0).map(o => ({ name: o.option, value: o.count, percentage: o.percentage }));
          return (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`} outerRadius={90} dataKey="value">
                          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(value: any, name: any) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
                      <Typography color="text.secondary">Sin respuestas</Typography>
                    </Box>
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Opción</strong></TableCell>
                        <TableCell align="right"><strong>N°</strong></TableCell>
                        <TableCell align="right"><strong>%</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistics.options.map((opt, i) => (
                        <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length], flexShrink: 0 }} />
                              {opt.option}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{opt.count}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={opt.percentage} sx={{ width: 50, height: 6, borderRadius: 3 }} />
                              <Typography variant="body2">{opt.percentage.toFixed(1)}%</Typography>
                            </Box>
                          </TableCell>
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
          const maxValue = question_type === 'rating' ? 5 : 10;
          const pct = (statistics.average / maxValue) * 100;
          const color = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'error';
          return (
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: `${color}.light`, borderRadius: 2, color: `${color}.contrastText` }}>
                  <Typography variant="h2" sx={{ fontWeight: 700 }}>{statistics.average.toFixed(1)}</Typography>
                  <Typography variant="body2">de {maxValue} puntos</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Promedio</Typography>
                    <Typography variant="body2" fontWeight={700}>{statistics.average.toFixed(2)} / {maxValue}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={pct} color={color} sx={{ height: 12, borderRadius: 6 }} />
                </Box>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 4 }}>
                    <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Mínimo</Typography>
                      <Typography variant="h6">{statistics.min}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Máximo</Typography>
                      <Typography variant="h6">{statistics.max}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Respuestas</Typography>
                      <Typography variant="h6">{statistics.count}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          );
        }
        break;

      case 'yes_no':
        if (statistics.yes_count !== undefined && statistics.no_count !== undefined) {
          const total = statistics.yes_count + statistics.no_count;
          const chartData = [
            { name: 'Sí', value: statistics.yes_count, percentage: statistics.yes_percentage || 0 },
            { name: 'No', value: statistics.no_count, percentage: statistics.no_percentage || 0 },
          ];
          return (
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`} outerRadius={75} dataKey="value">
                      <Cell fill="#2E7D32" />
                      <Cell fill="#C62828" />
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
                    <CheckIcon sx={{ color: 'success.dark' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={700} color="success.dark">Sí: {statistics.yes_count} ({(statistics.yes_percentage || 0).toFixed(1)}%)</Typography>
                      <LinearProgress variant="determinate" value={statistics.yes_percentage || 0} color="success" sx={{ height: 8, borderRadius: 4, mt: 0.5 }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'error.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>✗</Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={700} color="error.dark">No: {statistics.no_count} ({(statistics.no_percentage || 0).toFixed(1)}%)</Typography>
                      <LinearProgress variant="determinate" value={statistics.no_percentage || 0} color="error" sx={{ height: 8, borderRadius: 4, mt: 0.5 }} />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">Total: {total} respuestas</Typography>
                </Stack>
              </Grid>
            </Grid>
          );
        }
        break;

      case 'text':
      case 'textarea':
        if (statistics.text_responses !== undefined) {
          const shown = statistics.text_responses.slice(0, 8);
          const remaining = (statistics.text_responses.length || 0) - shown.length;
          return (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip label={`${statistics.response_count || 0} respuestas`} color="primary" variant="outlined" size="small" />
              </Box>
              <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
                {shown.map((text, i) => (
                  <Paper key={i} variant="outlined" sx={{ mb: 1, p: 1.5, borderLeft: '3px solid', borderLeftColor: 'primary.main', bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{text}"</Typography>
                    <Typography variant="caption" color="text.secondary">Respuesta #{i + 1}</Typography>
                  </Paper>
                ))}
              </Box>
              {remaining > 0 && <Alert severity="info" sx={{ mt: 1 }}>+{remaining} respuestas adicionales disponibles en el informe PDF.</Alert>}
            </Box>
          );
        }
        break;
    }
    return <Typography variant="body2" color="text.secondary">Sin datos disponibles</Typography>;
  };

  if (permissionsLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}><CircularProgress /></Box>;
  }
  if (!canReadSurveys()) {
    return <Alert severity="error">No tienes permisos para ver las encuestas.</Alert>;
  }

  const insights = getInsights();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
            <AssessmentIcon fontSize="large" />
            Tabulación de Encuestas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Análisis de resultados agrupados por año para toma de decisiones
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchSurveys} disabled={loading}>
          Actualizar
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Lista de Encuestas */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={700}>
                Encuestas Disponibles
              </Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth size="small"
                  placeholder="Buscar encuestas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                  sx={{ mb: 1 }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select value={statusFilter} label="Estado" onChange={(e) => setStatusFilter(e.target.value as SurveyStatus | 'all')}>
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="published">Publicadas</MenuItem>
                    <MenuItem value="closed">Cerradas</MenuItem>
                    <MenuItem value="draft">Borradores</MenuItem>
                    <MenuItem value="archived">Archivadas</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
              ) : (
                <Box sx={{ maxHeight: 580, overflow: 'auto' }}>
                  {filteredSurveys.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No se encontraron encuestas
                    </Typography>
                  ) : filteredSurveys.map((survey) => (
                    <Card
                      key={survey.id}
                      sx={{
                        mb: 1, cursor: 'pointer',
                        border: selectedSurvey?.id === survey.id ? '2px solid' : '1px solid',
                        borderColor: selectedSurvey?.id === survey.id ? 'primary.main' : 'divider',
                        transition: 'all 0.15s',
                        '&:hover': { boxShadow: 2 },
                      }}
                      onClick={() => handleSurveySelect(survey)}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="subtitle2" noWrap fontWeight={selectedSurvey?.id === survey.id ? 700 : 400}>
                          {survey.title}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Chip size="small" label={getStatusLabel(survey.status)} color={getStatusColor(survey.status)} />
                          <Typography variant="caption" color="text.secondary">
                            {survey.total_responses || 0} resp.
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

        {/* Panel de Análisis */}
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedSurvey ? (
            <Card>
              <CardContent>
                {/* Encabezado del análisis */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{selectedSurvey.title}</Typography>
                    {selectedSurvey.course && (
                      <Typography variant="body2" color="text.secondary">Curso: {selectedSurvey.course.title}</Typography>
                    )}
                  </Box>
                  <Button
                    variant="contained" startIcon={pdfExporting ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
                    onClick={exportToPDF}
                    disabled={!surveyAnalysis || pdfExporting || availableYears.length === 0}
                    color="error"
                  >
                    {pdfExporting ? 'Generando...' : `PDF ${selectedYear}`}
                  </Button>
                </Box>

                {/* Selector de año */}
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarIcon fontSize="small" color="primary" />
                    <Typography variant="body2" fontWeight={700} color="primary">Año:</Typography>
                  </Box>
                  {yearsLoading ? (
                    <CircularProgress size={20} />
                  ) : availableYears.length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {availableYears.map(year => (
                        <Chip
                          key={year}
                          label={year}
                          size="small"
                          variant={selectedYear === year ? 'filled' : 'outlined'}
                          color={selectedYear === year ? 'primary' : 'default'}
                          onClick={() => setSelectedYear(year)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin respuestas registradas aún
                    </Typography>
                  )}
                </Box>

                {analysisLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                ) : surveyAnalysis ? (
                  <Box>
                    {/* KPI Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {[
                        { icon: <PeopleIcon sx={{ fontSize: 36 }} />, value: surveyAnalysis.total_responses, label: 'Respuestas', color: '#1565C0', bg: '#BBDEFB' },
                        { icon: <TrendingUpIcon sx={{ fontSize: 36 }} />, value: `${surveyAnalysis.completion_rate.toFixed(1)}%`, label: 'Tasa de Finalización', color: '#2E7D32', bg: '#C8E6C9' },
                        { icon: <AnalyticsIcon sx={{ fontSize: 36 }} />, value: `${surveyAnalysis.average_completion_time.toFixed(1)} min`, label: 'Tiempo Promedio', color: '#E65100', bg: '#FFE0B2' },
                        { icon: <SurveyIcon sx={{ fontSize: 36 }} />, value: surveyAnalysis.question_statistics.length, label: 'Preguntas', color: '#6A1B9A', bg: '#E1BEE7' },
                      ].map((kpi, i) => (
                        <Grid key={i} size={{ xs: 6, md: 3 }}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: kpi.bg, border: `1px solid ${kpi.color}22`, borderRadius: 2 }}>
                            <Box sx={{ color: kpi.color }}>{kpi.icon}</Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: kpi.color, mt: 0.5 }}>{kpi.value}</Typography>
                            <Typography variant="caption" sx={{ color: kpi.color, display: 'block' }}>{kpi.label}</Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Insights de decisión */}
                    {insights && (insights.lowestRated || insights.highestRated) && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderColor: 'info.main', bgcolor: 'info.light' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <InfoIcon color="info" />
                          <Typography variant="subtitle2" fontWeight={700} color="info.dark">
                            Puntos Clave para Decisiones — {selectedYear}
                          </Typography>
                        </Box>
                        <Grid container spacing={2}>
                          {insights.highestRated && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
                                <Typography variant="caption" color="success.dark" fontWeight={700}>FORTALEZA IDENTIFICADA</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>"{insights.highestRated.question_text}"</Typography>
                                <Typography variant="body2" color="success.dark" fontWeight={700}>
                                  Promedio: {insights.highestRated.statistics.average?.toFixed(2)}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          {insights.lowestRated && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ p: 1.5, bgcolor: 'error.light', borderRadius: 1 }}>
                                <Typography variant="caption" color="error.dark" fontWeight={700}>ÁREA DE MEJORA</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>"{insights.lowestRated.question_text}"</Typography>
                                <Typography variant="body2" color="error.dark" fontWeight={700}>
                                  Promedio: {insights.lowestRated.statistics.average?.toFixed(2)}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    )}

                    {/* Tendencia de respuestas */}
                    {surveyAnalysis.response_trends.length > 1 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                          Tendencia de Respuestas — {selectedYear}
                        </Typography>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={surveyAnalysis.response_trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                            <RechartsTooltip />
                            <Bar dataKey="responses" fill="#1565C0" name="Respuestas" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Análisis por Pregunta */}
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Análisis por Pregunta
                    </Typography>
                    {surveyAnalysis.question_statistics.length === 0 ? (
                      <Alert severity="info">No hay respuestas registradas para el año {selectedYear}.</Alert>
                    ) : surveyAnalysis.question_statistics.map((qStat, idx) => (
                      <Accordion key={qStat.question_id} sx={{ mb: 1, '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider', borderRadius: '8px !important' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ width: '100%', pr: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label={idx + 1} size="small" color="primary" sx={{ minWidth: 32 }} />
                              <Typography variant="subtitle2" fontWeight={600}>{qStat.question_text}</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 5 }}>
                              {qStat.total_responses} respuestas · {qStat.response_rate.toFixed(1)}% tasa de respuesta
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          {renderQuestionAnalysis(qStat)}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                ) : availableYears.length === 0 && !yearsLoading ? (
                  <Alert severity="info">Esta encuesta no tiene respuestas registradas aún.</Alert>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 10 }}>
                <AssessmentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Selecciona una encuesta
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Elige una encuesta de la lista para ver su análisis detallado agrupado por año.
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
