import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, Paper, LinearProgress,
  Stack, Divider,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Psychology as BurnoutIcon,
  Warning as WarningIcon,
  CheckCircle as OkIcon,
  BarChart as ChartIcon,
  PieChart as PieIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../services/api';

interface SurveySummary {
  id: number;
  title: string;
  status: string;
  total_responses: number;
}

interface EmployeeScore {
  name: string;
  ee: number;
  dp: number;
  rp: number;
  level: 'bajo' | 'moderado' | 'alto';
}

interface BurnoutAnalysis {
  total: number;
  year: number;
  eeAvg: number; dpAvg: number; rpAvg: number;
  counts: { bajo: number; moderado: number; alto: number };
  employees: EmployeeScore[];
}

// MBI cutoffs
const EE_MAX = 54; const DP_MAX = 30; const RP_MAX = 48;

const burnoutLevel = (ee: number, dp: number, rp: number): 'bajo' | 'moderado' | 'alto' => {
  if (ee >= 27 && dp >= 13 && rp <= 33) return 'alto';
  if (ee >= 17 || dp >= 7 || rp <= 39) return 'moderado';
  return 'bajo';
};

const levelColor = (l: 'bajo' | 'moderado' | 'alto') =>
  ({ bajo: '#2e7d32', moderado: '#f57c00', alto: '#c62828' }[l]);
const levelChipColor = (l: 'bajo' | 'moderado' | 'alto'): 'success' | 'warning' | 'error' =>
  ({ bajo: 'success', moderado: 'warning', alto: 'error' }[l] as any);

const eeLevel = (v: number) => v >= 27 ? 'alto' : v >= 17 ? 'moderado' : 'bajo';
const dpLevel = (v: number) => v >= 13 ? 'alto' : v >= 7 ? 'moderado' : 'bajo';
const rpLevel = (v: number) => v <= 33 ? 'alto' : v <= 39 ? 'moderado' : 'bajo';

const DimCard = ({ label, abbr, value, max, getLevel }: {
  label: string; abbr: string; value: number; max: number;
  getLevel: (v: number) => 'bajo' | 'moderado' | 'alto';
}) => {
  const lv = getLevel(value);
  const pct = Math.min((value / max) * 100, 100);
  const colors = { bajo: '#2e7d32', moderado: '#f57c00', alto: '#c62828' };
  const bgs = { bajo: '#e8f5e9', moderado: '#fff8e1', alto: '#ffebee' };
  const borders = { bajo: '#2e7d32', moderado: '#f57c00', alto: '#c62828' };
  return (
    <Card sx={{ border: `2px solid ${borders[lv]}`, bgcolor: bgs[lv], flex: 1 }}>
      <CardContent sx={{ textAlign: 'center', pb: '12px !important' }}>
        <Chip label={abbr} size="small" sx={{ mb: 1, bgcolor: borders[lv], color: '#fff', fontWeight: 'bold' }} />
        <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>{label}</Typography>
        <Typography variant="h3" fontWeight="bold" sx={{ color: colors[lv] }}>
          {value} <Typography component="span" variant="body1" color="text.secondary">/ {max}</Typography>
        </Typography>
        <LinearProgress
          variant="determinate" value={pct}
          sx={{ mt: 1, mb: 0.5, height: 8, borderRadius: 4,
            '& .MuiLinearProgress-bar': { bgcolor: colors[lv] } }}
        />
        <Chip
          label={abbr === 'RP' ? (lv === 'alto' ? 'BAJO burnout' : lv === 'bajo' ? 'ALTO burnout' : 'MODERADO') : lv.toUpperCase()}
          color={abbr === 'RP' ? (lv === 'bajo' ? 'error' : lv === 'moderado' ? 'warning' : 'success') : levelChipColor(lv)}
          size="small" sx={{ mt: 0.5 }}
        />
      </CardContent>
    </Card>
  );
};

export default function BurnoutTabulation() {
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [analysis, setAnalysis] = useState<BurnoutAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchSurveys = useCallback(async () => {
    setSurveysLoading(true);
    try {
      const res = await api.get('/surveys/by-template/burnout');
      setSurveys(res.data);
    } catch (e) { console.error(e); }
    finally { setSurveysLoading(false); }
  }, []);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  const fetchYears = useCallback(async (surveyId: number) => {
    try {
      const res = await api.get(`/surveys/${surveyId}/available-years`);
      setAvailableYears(res.data);
      if (res.data.length > 0) setSelectedYear(res.data[0]);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (selectedId) fetchYears(selectedId as number);
    else { setAvailableYears([]); setSelectedYear(''); setAnalysis(null); }
  }, [selectedId, fetchYears]);

  const fetchAnalysis = useCallback(async (surveyId: number, year: number) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await api.get(`/surveys/${surveyId}/detailed-results`, { params: { year } });
      const detailed = res.data;
      const questions: any[] = detailed.questions || [];
      const completed = (detailed.employee_responses || []).filter(
        (e: any) => e.submission_status === 'completed'
      );
      const total = completed.length;

      // EE: questions 0-8, DP: 9-13, RP: 14-21
      const eeQIds = questions.slice(0, 9).map((q: any) => q.id);
      const dpQIds = questions.slice(9, 14).map((q: any) => q.id);
      const rpQIds = questions.slice(14, 22).map((q: any) => q.id);

      const sumAnswers = (emp: any, qIds: number[]) =>
        qIds.reduce((acc, qId) => {
          const ans = emp.answers.find((a: any) => a.question_id === qId);
          return acc + (ans?.answer_value ?? 0);
        }, 0);

      let eeTot = 0, dpTot = 0, rpTot = 0;
      const counts = { bajo: 0, moderado: 0, alto: 0 };
      const employees: EmployeeScore[] = completed.map((emp: any) => {
        const ee = sumAnswers(emp, eeQIds);
        const dp = sumAnswers(emp, dpQIds);
        const rp = sumAnswers(emp, rpQIds);
        eeTot += ee; dpTot += dp; rpTot += rp;
        const level = burnoutLevel(ee, dp, rp);
        counts[level]++;
        return { name: emp.employee_name, ee, dp, rp, level };
      });

      setAnalysis({
        total,
        year,
        eeAvg: total > 0 ? Math.round((eeTot / total) * 10) / 10 : 0,
        dpAvg: total > 0 ? Math.round((dpTot / total) * 10) / 10 : 0,
        rpAvg: total > 0 ? Math.round((rpTot / total) * 10) / 10 : 0,
        counts,
        employees,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedId && selectedYear) fetchAnalysis(selectedId as number, selectedYear as number);
  }, [selectedId, selectedYear, fetchAnalysis]);

  const handleExportPdf = async () => {
    if (!selectedId || !selectedYear) return;
    setPdfLoading(true);
    try {
      const res = await api.get(`/surveys/${selectedId}/report/burnout-pdf`, {
        params: { year: selectedYear }, responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `burnout_${selectedId}_${selectedYear}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setPdfLoading(false); }
  };

  const pieData = analysis ? [
    { name: 'Bajo', value: analysis.counts.bajo, color: '#2e7d32' },
    { name: 'Moderado', value: analysis.counts.moderado, color: '#f57c00' },
    { name: 'Alto', value: analysis.counts.alto, color: '#c62828' },
  ] : [];

  const barData = analysis ? [
    { dim: 'Agotamiento\nEmocional (EE)', avg: analysis.eeAvg, max: EE_MAX, pct: Math.round((analysis.eeAvg / EE_MAX) * 100) },
    { dim: 'Despersonalización\n(DP)', avg: analysis.dpAvg, max: DP_MAX, pct: Math.round((analysis.dpAvg / DP_MAX) * 100) },
    { dim: 'Realización\nPersonal (RP)', avg: analysis.rpAvg, max: RP_MAX, pct: Math.round((analysis.rpAvg / RP_MAX) * 100) },
  ] : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <BurnoutIcon sx={{ fontSize: 36, color: '#6a1b9a' }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Tabulación — Síndrome de Burnout
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis MBI: Agotamiento Emocional · Despersonalización · Realización Personal · Maslach (1981)
          </Typography>
        </Box>
      </Box>

      {/* Selectores */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Encuesta de Burnout</InputLabel>
                <Select
                  value={selectedId} label="Encuesta de Burnout"
                  onChange={e => { setSelectedId(e.target.value as number); setAnalysis(null); }}
                >
                  {surveysLoading
                    ? <MenuItem disabled><CircularProgress size={16} sx={{ mr: 1 }} /> Cargando...</MenuItem>
                    : surveys.length === 0
                      ? <MenuItem disabled>No hay encuestas de burnout</MenuItem>
                      : surveys.map(s => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.title} — {s.status} ({s.total_responses} resp.)
                        </MenuItem>
                      ))
                  }
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small" disabled={availableYears.length === 0}>
                <InputLabel>Año</InputLabel>
                <Select value={selectedYear} label="Año" onChange={e => setSelectedYear(e.target.value as number)}>
                  {availableYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchSurveys} fullWidth size="small">
                Actualizar
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                variant="contained" color="error"
                startIcon={pdfLoading ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
                onClick={handleExportPdf}
                disabled={!analysis || pdfLoading}
                fullWidth size="small"
              >
                Exportar PDF
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!selectedId && (
        <Alert severity="info">Seleccione una encuesta de burnout para ver el análisis MBI.</Alert>
      )}
      {loading && <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>}

      {analysis && !loading && (
        <>
          {/* KPIs */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">{analysis.total}</Typography>
                  <Typography variant="body2" color="text.secondary">Respondentes</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card sx={{ bgcolor: '#ffebee' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="error.main">{analysis.counts.alto}</Typography>
                  <Typography variant="body2" color="text.secondary">Burnout Alto</Typography>
                  <Typography variant="caption" color="error">
                    {analysis.total > 0 ? Math.round((analysis.counts.alto / analysis.total) * 100) : 0}% del total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card sx={{ bgcolor: '#fff8e1' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">{analysis.counts.moderado}</Typography>
                  <Typography variant="body2" color="text.secondary">Riesgo Moderado</Typography>
                  <Typography variant="caption" color="warning.main">
                    {analysis.total > 0 ? Math.round((analysis.counts.moderado / analysis.total) * 100) : 0}% del total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card sx={{ bgcolor: '#e8f5e9' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{analysis.counts.bajo}</Typography>
                  <Typography variant="body2" color="text.secondary">Nivel Bajo</Typography>
                  <Typography variant="caption" color="success.main">
                    {analysis.total > 0 ? Math.round((analysis.counts.bajo / analysis.total) * 100) : 0}% del total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Dimensiones */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Promedios por Dimensión MBI — Año {analysis.year}</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <DimCard label="Agotamiento Emocional" abbr="EE" value={analysis.eeAvg} max={EE_MAX} getLevel={eeLevel} />
                <DimCard label="Despersonalización" abbr="DP" value={analysis.dpAvg} max={DP_MAX} getLevel={dpLevel} />
                <DimCard label="Realización Personal" abbr="RP" value={analysis.rpAvg} max={RP_MAX} getLevel={rpLevel} />
              </Stack>
              <Alert severity="info" sx={{ mt: 2, fontSize: '12px' }}>
                <strong>Interpretación:</strong> EE Alto ≥ 27 | DP Alto ≥ 13 | RP Bajo ≤ 33 (indica burnout alto).
                La RP es un indicador invertido: puntaje bajo = mayor burnout.
              </Alert>
            </CardContent>
          </Card>

          {/* Gráficos */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PieIcon sx={{ color: '#6a1b9a' }} />
                    <Typography variant="h6">Distribución por Nivel</Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <ChartIcon sx={{ color: '#6a1b9a' }} />
                    <Typography variant="h6">% Promedio por Dimensión</Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ top: 4, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dim" tick={{ fontSize: 9 }} />
                      <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <RechartsTooltip formatter={(v: any, n: any, p: any) => [`${p.payload.avg} / ${p.payload.max} (${v}%)`, 'Promedio']} />
                      <Bar dataKey="pct" name="% del máximo" radius={[4, 4, 0, 0]} fill="#6a1b9a" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabla individual */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Resultados por Trabajador</Typography>
              <Paper variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#37474f' }}>
                      <TableCell sx={{ color: '#fff' }}>#</TableCell>
                      <TableCell sx={{ color: '#fff' }}>Trabajador</TableCell>
                      <TableCell sx={{ color: '#fff', textAlign: 'center' }}>EE / 54</TableCell>
                      <TableCell sx={{ color: '#fff', textAlign: 'center' }}>DP / 30</TableCell>
                      <TableCell sx={{ color: '#fff', textAlign: 'center' }}>RP / 48</TableCell>
                      <TableCell sx={{ color: '#fff', textAlign: 'center' }}>Nivel Burnout</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.employees.map((emp, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{emp.name}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography fontWeight="bold" sx={{ color: levelColor(eeLevel(emp.ee)) }}>
                            {emp.ee}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography fontWeight="bold" sx={{ color: levelColor(dpLevel(emp.dp)) }}>
                            {emp.dp}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography fontWeight="bold" sx={{ color: levelColor(rpLevel(emp.rp)) }}>
                            {emp.rp}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            label={emp.level.toUpperCase()}
                            color={levelChipColor(emp.level)}
                            size="small"
                            icon={emp.level === 'alto' ? <WarningIcon /> : <OkIcon />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
