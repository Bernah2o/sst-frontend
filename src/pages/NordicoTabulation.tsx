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
  AccessibilityNew as BodyIcon,
  BarChart as ChartIcon,
  Warning as WarningIcon,
  CheckCircle as OkIcon,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import api from '../services/api';

interface SurveySummary {
  id: number;
  title: string;
  status: string;
  created_at: string;
  total_responses: number;
  survey_template: string;
}

const REGIONS = [
  'Cuello', 'Hombros', 'Codos', 'Muñecas/Manos',
  'Región Dorsal/Lumbar Alta', 'Zona Lumbar Baja',
  'Caderas/Muslos', 'Rodillas', 'Tobillos/Pies',
];

interface RegionData {
  region: string;
  q12m: number; pct12m: number;
  qimp: number; pctimp: number;
  q7d: number; pct7d: number;
}

interface AnalysisData {
  total_responses: number;
  regions: RegionData[];
  year: number;
}

const riskColor = (pct: number) => {
  if (pct >= 50) return '#c62828';
  if (pct >= 25) return '#f57c00';
  return '#2e7d32';
};
const riskLabel = (pct: number) => {
  if (pct >= 50) return 'Alto';
  if (pct >= 25) return 'Moderado';
  return 'Bajo';
};
const riskChipColor = (pct: number): 'error' | 'warning' | 'success' => {
  if (pct >= 50) return 'error';
  if (pct >= 25) return 'warning';
  return 'success';
};

export default function NordicoTabulation() {
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchSurveys = useCallback(async () => {
    setSurveysLoading(true);
    try {
      const res = await api.get('/surveys/by-template/nordico');
      setSurveys(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSurveysLoading(false);
    }
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
      const questions = detailed.questions || [];
      const completedResponses = detailed.employee_responses?.filter(
        (e: any) => e.submission_status === 'completed'
      ) || [];
      const total = completedResponses.length;

      const regionData: RegionData[] = REGIONS.map((region, i) => {
        const base = i * 3;
        const qIds = questions.slice(base, base + 3).map((q: any) => q.id);

        const countYes = (qIdx: number) => {
          if (!qIds[qIdx]) return 0;
          return completedResponses.filter((emp: any) => {
            const ans = emp.answers.find((a: any) => a.question_id === qIds[qIdx]);
            return ans && ans.answer_text?.toLowerCase() === 'sí';
          }).length;
        };

        const q12m = countYes(0);
        const qimp = countYes(1);
        const q7d = countYes(2);
        return {
          region,
          q12m, pct12m: total > 0 ? Math.round((q12m / total) * 1000) / 10 : 0,
          qimp, pctimp: total > 0 ? Math.round((qimp / total) * 1000) / 10 : 0,
          q7d, pct7d: total > 0 ? Math.round((q7d / total) * 1000) / 10 : 0,
        };
      });

      setAnalysis({ total_responses: total, regions: regionData, year });
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
      const res = await api.get(`/surveys/${selectedId}/report/nordic-pdf`, {
        params: { year: selectedYear }, responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `nordico_${selectedId}_${selectedYear}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setPdfLoading(false); }
  };

  const sorted = analysis ? [...analysis.regions].sort((a, b) => b.pct12m - a.pct12m) : [];
  const chartData = sorted.map(r => ({ name: r.region.split('/')[0], pct: r.pct12m }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <BodyIcon sx={{ fontSize: 36, color: '#1565c0' }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Tabulación — Cuestionario Nórdico
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis de síntomas musculoesqueléticos por región corporal · Kuorinka (1987)
          </Typography>
        </Box>
      </Box>

      {/* Selectores */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Encuesta Nórdica</InputLabel>
                <Select
                  value={selectedId}
                  label="Encuesta Nórdica"
                  onChange={e => { setSelectedId(e.target.value as number); setAnalysis(null); }}
                >
                  {surveysLoading
                    ? <MenuItem disabled><CircularProgress size={16} sx={{ mr: 1 }} /> Cargando...</MenuItem>
                    : surveys.length === 0
                      ? <MenuItem disabled>No hay encuestas nórdicas</MenuItem>
                      : surveys.map(s => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.title} — {s.status === 'published' ? 'Publicada' : s.status}
                          &nbsp;({s.total_responses} resp.)
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
        <Alert severity="info">Seleccione una encuesta nórdica para ver el análisis.</Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {analysis && !loading && (
        <>
          {/* KPIs */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">{analysis.total_responses}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Respondentes</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {Math.max(...analysis.regions.map(r => r.pct12m))}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Mayor prevalencia 12m</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {analysis.regions.filter(r => r.pct12m >= 50).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Regiones Alto Riesgo</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {sorted[0]?.region.split('/')[0] ?? '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Región más afectada</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabla principal */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <BodyIcon color="primary" />
                <Typography variant="h6">Análisis por Región Corporal — Año {analysis.year}</Typography>
              </Box>
              <Paper variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#1565c0' }}>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Región Corporal</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                        Molestias 12 meses
                      </TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                        Impedimento funcional
                      </TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                        Molestias 7 días
                      </TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                        Riesgo
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.regions.map((row) => (
                      <TableRow key={row.region} hover>
                        <TableCell sx={{ fontWeight: 'medium' }}>{row.region}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">{row.pct12m}%</Typography>
                            <LinearProgress
                              variant="determinate" value={row.pct12m}
                              sx={{ mt: 0.5, height: 6, borderRadius: 3,
                                '& .MuiLinearProgress-bar': { bgcolor: riskColor(row.pct12m) } }}
                            />
                            <Typography variant="caption" color="text.secondary">{row.q12m} de {analysis.total_responses}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2">{row.pctimp}%</Typography>
                          <Typography variant="caption" color="text.secondary">{row.qimp} de {analysis.total_responses}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2">{row.pct7d}%</Typography>
                          <Typography variant="caption" color="text.secondary">{row.q7d} de {analysis.total_responses}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            label={riskLabel(row.pct12m)}
                            color={riskChipColor(row.pct12m)}
                            size="small"
                            icon={row.pct12m >= 50 ? <WarningIcon /> : <OkIcon />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </CardContent>
          </Card>

          {/* Gráfico de barras */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ChartIcon color="primary" />
                <Typography variant="h6">Prevalencia por Región — Molestias últimos 12 meses</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis unit="%" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <RechartsTooltip formatter={(v: any) => [`${v}%`, 'Prevalencia']} />
                  <Bar dataKey="pct" name="% con molestias" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={riskColor(entry.pct)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Stack direction="row" spacing={2} justifyContent="center" mt={1}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#c62828', borderRadius: '50%' }} />
                  <Typography variant="caption">Alto riesgo ≥ 50%</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#f57c00', borderRadius: '50%' }} />
                  <Typography variant="caption">Moderado 25–49%</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#2e7d32', borderRadius: '50%' }} />
                  <Typography variant="caption">Bajo &lt; 25%</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Ranking */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Ranking por Prevalencia (12 meses)</Typography>
              <Divider sx={{ mb: 2 }} />
              {sorted.map((row, i) => (
                <Box key={row.region} display="flex" alignItems="center" gap={2} mb={1.5}>
                  <Typography fontWeight="bold" sx={{ minWidth: 20, color: '#666' }}>{i + 1}</Typography>
                  <Typography sx={{ minWidth: 180 }}>{row.region}</Typography>
                  <Box flex={1}>
                    <LinearProgress
                      variant="determinate" value={row.pct12m}
                      sx={{ height: 12, borderRadius: 6,
                        '& .MuiLinearProgress-bar': { bgcolor: riskColor(row.pct12m) } }}
                    />
                  </Box>
                  <Typography fontWeight="bold" sx={{ minWidth: 45, color: riskColor(row.pct12m) }}>
                    {row.pct12m}%
                  </Typography>
                  <Chip label={riskLabel(row.pct12m)} color={riskChipColor(row.pct12m)} size="small" />
                </Box>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
