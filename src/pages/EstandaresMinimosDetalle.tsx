import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FactCheck as FactCheckIcon,
  NavigateNext as NavigateNextIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import {
  AutoevaluacionEstandaresDetail,
  AutoevaluacionRespuesta,
  CicloPHVA,
  DashboardEstandaresMinimos,
  EstadoAutoevaluacion,
  ValorCumplimiento,
  CICLO_COLORS,
  ESTADO_LABELS,
  GRUPO_SHORT_LABELS,
  NIVEL_COLORS,
  NIVEL_LABELS,
  estandaresMinimosService,
} from '../services/estandaresMinimosService';

// ─── Tipos locales ─────────────────────────────────────────────────────────

type TabValue = 0 | 1;

const CICLOS: CicloPHVA[] = ['PLANEAR', 'HACER', 'VERIFICAR', 'ACTUAR'];

const CICLO_LABELS: Record<CicloPHVA, string> = {
  PLANEAR:   'I. PLANEAR',
  HACER:     'II. HACER',
  VERIFICAR: 'III. VERIFICAR',
  ACTUAR:    'IV. ACTUAR',
};

const CUMPLIMIENTO_LABELS: Record<ValorCumplimiento, string> = {
  cumple_totalmente: 'Cumple',
  no_cumple:         'No Cumple',
  no_aplica:         'No Aplica',
};

// ─── Generación de PDF ────────────────────────────────────────────────────

async function generarPDF(
  evaluacion: AutoevaluacionEstandaresDetail,
  dashboard: DashboardEstandaresMinimos,
) {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF;
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  const nivelColor: [number, number, number] =
    evaluacion.nivel_cumplimiento === 'aceptable'       ? [46, 125, 50]
    : evaluacion.nivel_cumplimiento === 'moderadamente_aceptable' ? [230, 119, 0]
    : [198, 40, 40];

  const nivelLabel = evaluacion.nivel_cumplimiento
    ? { critico: 'CRÍTICO', moderadamente_aceptable: 'MODERADAMENTE ACEPTABLE', aceptable: 'ACEPTABLE' }[evaluacion.nivel_cumplimiento]
    : '—';

  // ── Encabezado ──────────────────────────────────────────────────────────
  doc.setFillColor(25, 118, 210);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTOEVALUACIÓN DE ESTÁNDARES MÍNIMOS SG-SST', pageW / 2, 11, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Resolución 0312 de 2019 — Ministerio del Trabajo de Colombia', pageW / 2, 17, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 23, { align: 'center' });

  y = 35;

  // ── Información general ─────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN GENERAL', margin, y);
  y += 4;
  doc.setDrawColor(25, 118, 210);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentW, y);
  y += 5;

  const infoRows = [
    ['Año de evaluación:', String(evaluacion.año),            'N.º trabajadores:', String(evaluacion.num_trabajadores)],
    ['Nivel de riesgo:', `Riesgo ${evaluacion.nivel_riesgo}`, 'Grupo aplicable:', GRUPO_SHORT_LABELS[evaluacion.grupo]],
    ['Encargado SG-SST:', evaluacion.encargado_sgsst || 'No especificado', 'Estado:', { borrador: 'Borrador', en_proceso: 'En Proceso', finalizada: 'Finalizada' }[evaluacion.estado]],
  ];

  doc.setFontSize(8.5);
  infoRows.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], margin + 35, y);
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], margin + contentW / 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(row[3], margin + contentW / 2 + 35, y);
    y += 6;
  });

  y += 3;

  // ── Resultado global ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESULTADO GLOBAL', margin, y);
  y += 4;
  doc.line(margin, y, margin + contentW, y);
  y += 5;

  // Caja de puntaje
  const scoreBoxW = 55;
  const scoreBoxH = 22;
  doc.setFillColor(...nivelColor);
  doc.roundedRect(margin, y, scoreBoxW, scoreBoxH, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dashboard.puntaje_total.toFixed(1)}`, margin + scoreBoxW / 2, y + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.text('/ 100 puntos', margin + scoreBoxW / 2, y + 18, { align: 'center' });

  // Nivel de cumplimiento
  const nivelBoxX = margin + scoreBoxW + 8;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(nivelBoxX, y, contentW - scoreBoxW - 8, scoreBoxH, 3, 3, 'F');
  doc.setTextColor(...nivelColor);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(nivelLabel, nivelBoxX + (contentW - scoreBoxW - 8) / 2, y + 10, { align: 'center' });
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const nivelDesc =
    evaluacion.nivel_cumplimiento === 'critico'
      ? 'Elaborar plan de mejora inmediato y reportar al Ministerio de Trabajo'
      : evaluacion.nivel_cumplimiento === 'moderadamente_aceptable'
      ? 'Elaborar plan de mejora y reportar a la ARL en máximo 6 meses'
      : 'Mantener evidencias e incluir mejoras en el Plan Anual de Trabajo';
  const descLines = doc.splitTextToSize(nivelDesc, contentW - scoreBoxW - 16);
  doc.text(descLines, nivelBoxX + (contentW - scoreBoxW - 8) / 2, y + 16, { align: 'center' });

  doc.setTextColor(30, 30, 30);
  y += scoreBoxH + 8;

  // ── Resumen por ciclo PHVA ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESUMEN POR CICLO PHVA', margin, y);
  y += 4;
  doc.setDrawColor(25, 118, 210);
  doc.line(margin, y, margin + contentW, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Ciclo', 'Puntaje Máx.', 'Puntaje Obtenido', '% Cumplimiento', 'Cumple', 'No Cumple', 'No Aplica']],
    body: dashboard.ciclos.map((c) => [
      c.label,
      c.puntaje_maximo.toFixed(2),
      c.puntaje_obtenido.toFixed(2),
      `${c.porcentaje.toFixed(1)}%`,
      String(c.cumplen),
      String(c.no_cumplen),
      String(c.no_aplican),
    ]),
    headStyles: { fillColor: [25, 118, 210], fontSize: 8, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 8, halign: 'center' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    foot: [[
      'TOTAL',
      '100.00',
      dashboard.puntaje_total.toFixed(2),
      `${dashboard.puntaje_total.toFixed(1)}%`,
      String(dashboard.total_cumplen),
      String(dashboard.total_no_cumplen),
      String(dashboard.total_no_aplican),
    ]],
    footStyles: { fillColor: [230, 235, 245], fontStyle: 'bold', fontSize: 8, halign: 'center' },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Detalle de estándares por ciclo ─────────────────────────────────────
  for (const ciclo of CICLOS) {
    const items = evaluacion.respuestas
      .filter((r) => r.ciclo === ciclo)
      .sort((a, b) => a.orden - b.orden);
    if (items.length === 0) continue;

    const cicloInfo = dashboard.ciclos.find((c) => c.ciclo === ciclo);
    const cicloColor: [number, number, number] =
      ciclo === 'PLANEAR' ? [25, 118, 210]
      : ciclo === 'HACER' ? [56, 142, 60]
      : ciclo === 'VERIFICAR' ? [245, 124, 0]
      : [123, 31, 162];

    // Verificar si hay espacio suficiente; si no, nueva página
    if (y > pageH - 60) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setFillColor(...cicloColor);
    doc.roundedRect(margin, y - 1, contentW, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(
      `${CICLO_LABELS[ciclo]}   |   ${cicloInfo?.puntaje_obtenido.toFixed(2)} / ${cicloInfo?.puntaje_maximo.toFixed(2)} pts  (${cicloInfo?.porcentaje.toFixed(1)}%)`,
      margin + 3, y + 4,
    );
    doc.setTextColor(30, 30, 30);
    y += 9;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Código', 'Descripción del Estándar', 'Peso', 'Cumplimiento', 'Pts. Obtenidos']],
      body: items.map((r) => [
        r.estandar_codigo,
        r.descripcion,
        r.valor_maximo_ajustado.toFixed(2),
        CUMPLIMIENTO_LABELS[r.cumplimiento],
        r.valor_obtenido.toFixed(2),
      ]),
      headStyles: { fillColor: cicloColor, fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 28, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
      },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = items[data.row.index]?.cumplimiento;
          if (val === 'cumple_totalmente') {
            doc.setTextColor(46, 125, 50);
          } else if (val === 'no_cumple') {
            doc.setTextColor(198, 40, 40);
          } else {
            doc.setTextColor(230, 119, 0);
          }
        } else {
          doc.setTextColor(30, 30, 30);
        }
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Plan de mejora ──────────────────────────────────────────────────────
  if (dashboard.estandares_criticos.length > 0) {
    if (y > pageH - 60) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(198, 40, 40);
    doc.roundedRect(margin, y - 1, contentW, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`PLAN DE MEJORA — ${dashboard.estandares_criticos.length} ESTÁNDARES NO CUMPLIDOS`, margin + 3, y + 4);
    doc.setTextColor(30, 30, 30);
    y += 9;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Código', 'Descripción', 'Ciclo', 'Peso', 'Justificación / Acción requerida']],
      body: dashboard.estandares_criticos.map((codigo) => {
        const r = evaluacion.respuestas.find((rr) => rr.estandar_codigo === codigo);
        return [
          codigo,
          r?.descripcion ?? '',
          r?.ciclo ?? '',
          r ? r.valor_maximo_ajustado.toFixed(2) : '',
          r?.observaciones || '(Sin observaciones registradas)',
        ];
      }),
      headStyles: { fillColor: [198, 40, 40], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 45 },
      },
      alternateRowStyles: { fillColor: [255, 245, 245] },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Pie de página en todas las páginas ──────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 10, pageW - margin, pageH - 10);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Autoevaluación Estándares Mínimos SG-SST — Res. 0312/2019', margin, pageH - 6);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
  }

  doc.save(`EstandaresMinimos_${evaluacion.año}_Grupo${evaluacion.grupo.replace('GRUPO_', '')}.pdf`);
}

// ─── Componente principal ──────────────────────────────────────────────────

export default function EstandaresMinimosDetalle() {
  const { evalId } = useParams<{ evalId: string }>();
  const navigate = useNavigate();

  const [evaluacion, setEvaluacion] = useState<AutoevaluacionEstandaresDetail | null>(null);
  const [dashboard, setDashboard] = useState<DashboardEstandaresMinimos | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>(0);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [expandedCiclos, setExpandedCiclos] = useState<Record<string, boolean>>({
    PLANEAR: true, HACER: true, VERIFICAR: true, ACTUAR: true,
  });

  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // Refs para debounce de observaciones
  const debounceRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // ─── Carga ─────────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    if (!evalId) return;
    try {
      setLoading(true);
      const [ev, dash] = await Promise.all([
        estandaresMinimosService.obtener(parseInt(evalId, 10)),
        estandaresMinimosService.obtenerDashboard(parseInt(evalId, 10)),
      ]);
      setEvaluacion(ev);
      setDashboard(dash);
      setError(null);
    } catch {
      setError('Error al cargar la autoevaluación');
    } finally {
      setLoading(false);
    }
  }, [evalId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ─── Actualizar respuesta ──────────────────────────────────────────────

  const actualizarRespuesta = useCallback(async (
    respuesta: AutoevaluacionRespuesta,
    cumplimiento: ValorCumplimiento,
    justificacion?: string,
    observaciones?: string,
  ) => {
    if (!evalId) return;
    if (cumplimiento === 'no_aplica' && !justificacion) return; // esperar justificación
    setSavingId(respuesta.id);
    try {
      const updated = await estandaresMinimosService.actualizarRespuesta(
        parseInt(evalId, 10),
        respuesta.id,
        { cumplimiento, justificacion_no_aplica: justificacion, observaciones },
      );
      // Actualizar estado local sin reload completo
      setEvaluacion((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          respuestas: prev.respuestas.map((r) => r.id === updated.id ? updated : r),
        };
      });
      // Refrescar dashboard
      const dash = await estandaresMinimosService.obtenerDashboard(parseInt(evalId, 10));
      setDashboard(dash);
      // Actualizar scores del padre localmente
      setEvaluacion((prev) => {
        if (!prev || !dash) return prev;
        return {
          ...prev,
          puntaje_total: dash.puntaje_total,
          puntaje_planear: dash.ciclos.find((c) => c.ciclo === 'PLANEAR')?.puntaje_obtenido ?? prev.puntaje_planear,
          puntaje_hacer: dash.ciclos.find((c) => c.ciclo === 'HACER')?.puntaje_obtenido ?? prev.puntaje_hacer,
          puntaje_verificar: dash.ciclos.find((c) => c.ciclo === 'VERIFICAR')?.puntaje_obtenido ?? prev.puntaje_verificar,
          puntaje_actuar: dash.ciclos.find((c) => c.ciclo === 'ACTUAR')?.puntaje_obtenido ?? prev.puntaje_actuar,
          nivel_cumplimiento: dash.nivel_cumplimiento,
        };
      });
    } catch {
      setError('Error al guardar la respuesta');
    } finally {
      setSavingId(null);
    }
  }, [evalId]);

  const handleCumplimientoChange = (
    respuesta: AutoevaluacionRespuesta,
    nuevoCumplimiento: ValorCumplimiento,
  ) => {
    if (nuevoCumplimiento === 'no_aplica') {
      // Actualizar localmente para mostrar el campo de justificación
      setEvaluacion((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          respuestas: prev.respuestas.map((r) =>
            r.id === respuesta.id ? { ...r, cumplimiento: nuevoCumplimiento, justificacion_no_aplica: '' } : r
          ),
        };
      });
    } else {
      actualizarRespuesta(respuesta, nuevoCumplimiento, undefined, respuesta.observaciones ?? undefined);
    }
  };

  const handleJustificacionChange = (respuesta: AutoevaluacionRespuesta, valor: string) => {
    setEvaluacion((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        respuestas: prev.respuestas.map((r) =>
          r.id === respuesta.id ? { ...r, justificacion_no_aplica: valor } : r
        ),
      };
    });
    // Debounce: guardar tras 600ms
    clearTimeout(debounceRef.current[respuesta.id]);
    debounceRef.current[respuesta.id] = setTimeout(() => {
      if (valor.trim()) {
        actualizarRespuesta(respuesta, 'no_aplica', valor, respuesta.observaciones ?? undefined);
      }
    }, 600);
  };

  const handleObservacionesChange = (respuesta: AutoevaluacionRespuesta, valor: string) => {
    setEvaluacion((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        respuestas: prev.respuestas.map((r) =>
          r.id === respuesta.id ? { ...r, observaciones: valor } : r
        ),
      };
    });
    clearTimeout(debounceRef.current[`obs_${respuesta.id}` as unknown as number]);
    debounceRef.current[`obs_${respuesta.id}` as unknown as number] = setTimeout(() => {
      actualizarRespuesta(
        respuesta,
        respuesta.cumplimiento,
        respuesta.justificacion_no_aplica ?? undefined,
        valor,
      );
    }, 600);
  };

  // ─── Cambiar estado ────────────────────────────────────────────────────

  const handleCambiarEstado = async (nuevoEstado: EstadoAutoevaluacion) => {
    if (!evalId || !evaluacion || nuevoEstado === evaluacion.estado) return;
    setActualizandoEstado(true);
    try {
      const actualizada = await estandaresMinimosService.actualizar(parseInt(evalId, 10), { estado: nuevoEstado });
      setEvaluacion((prev) => prev ? { ...prev, estado: actualizada.estado } : prev);
    } catch {
      setError('Error al cambiar el estado');
    } finally {
      setActualizandoEstado(false);
    }
  };

  // ─── Agrupar respuestas por ciclo ─────────────────────────────────────

  const respuestasPorCiclo = evaluacion
    ? CICLOS.reduce((acc, ciclo) => {
        acc[ciclo] = evaluacion.respuestas
          .filter((r) => r.ciclo === ciclo)
          .sort((a, b) => a.orden - b.orden);
        return acc;
      }, {} as Record<CicloPHVA, AutoevaluacionRespuesta[]>)
    : null;

  // ─── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!evaluacion) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Autoevaluación no encontrada.</Alert>
      </Box>
    );
  }

  const nivelColor = evaluacion.nivel_cumplimiento
    ? NIVEL_COLORS[evaluacion.nivel_cumplimiento]
    : 'default';

  const progressColor =
    evaluacion.puntaje_total >= 85 ? 'success' :
    evaluacion.puntaje_total >= 60 ? 'warning' : 'error';

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/admin/estandares-minimos')}
          underline="hover"
          color="inherit"
        >
          Estándares Mínimos SST
        </Link>
        <Typography variant="body2" color="text.primary">
          Autoevaluación {evaluacion.año}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FactCheckIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>
              Autoevaluación {evaluacion.año}
            </Typography>
            <Chip label={GRUPO_SHORT_LABELS[evaluacion.grupo]} color="primary" size="small" />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                value={evaluacion.estado}
                onChange={(e) => handleCambiarEstado(e.target.value as EstadoAutoevaluacion)}
                disabled={actualizandoEstado}
                sx={{
                  '& .MuiSelect-select': { py: 0.5 },
                  color: evaluacion.estado === 'finalizada' ? 'success.main'
                    : evaluacion.estado === 'en_proceso' ? 'info.main'
                    : 'text.secondary',
                }}
              >
                <MenuItem value="borrador">{ESTADO_LABELS['borrador']}</MenuItem>
                <MenuItem value="en_proceso">{ESTADO_LABELS['en_proceso']}</MenuItem>
                <MenuItem value="finalizada">{ESTADO_LABELS['finalizada']}</MenuItem>
              </Select>
            </FormControl>
            {actualizandoEstado && <CircularProgress size={16} />}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {evaluacion.num_trabajadores} trabajadores • Riesgo {evaluacion.nivel_riesgo}
            {evaluacion.encargado_sgsst && ` • ${evaluacion.encargado_sgsst}`}
          </Typography>
        </Box>

        {/* Score badge + PDF */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={generandoPDF ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdfIcon />}
            disabled={generandoPDF || !dashboard}
            onClick={async () => {
              if (!dashboard) return;
              setGenerandoPDF(true);
              try { await generarPDF(evaluacion, dashboard); }
              catch { setError('Error al generar el PDF'); }
              finally { setGenerandoPDF(false); }
            }}
          >
            {generandoPDF ? 'Generando...' : 'Exportar PDF'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color={`${progressColor}.main`}>
              {evaluacion.puntaje_total.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">/ 100 puntos</Typography>
            {evaluacion.nivel_cumplimiento && (
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={NIVEL_LABELS[evaluacion.nivel_cumplimiento]}
                  color={nivelColor as 'error' | 'warning' | 'success'}
                  size="small"
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Banner nivel */}
      {evaluacion.nivel_cumplimiento && (
        <Alert
          severity={nivelColor as 'error' | 'warning' | 'success'}
          icon={evaluacion.nivel_cumplimiento === 'critico' ? <WarningIcon /> : <CheckCircleIcon />}
          sx={{ mb: 3 }}
        >
          <strong>{NIVEL_LABELS[evaluacion.nivel_cumplimiento]}</strong>
          {evaluacion.nivel_cumplimiento === 'critico' && ' — Elaborar plan de mejora inmediato y reportar a Ministerio de Trabajo.'}
          {evaluacion.nivel_cumplimiento === 'moderadamente_aceptable' && ' — Elaborar plan de mejora y reportar a la ARL en máximo 6 meses.'}
          {evaluacion.nivel_cumplimiento === 'aceptable' && ' — Mantener evidencias e incluir mejoras en el Plan Anual de Trabajo.'}
        </Alert>
      )}

      {/* Alerta de error */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v as TabValue)}>
          <Tab label="Evaluación PHVA" />
          <Tab label="Dashboard" />
        </Tabs>
      </Box>

      {/* TAB 0: Evaluación PHVA ─────────────────────────────────────────── */}
      {tab === 0 && respuestasPorCiclo && (
        <Box>
          {CICLOS.map((ciclo) => {
            const items = respuestasPorCiclo[ciclo];
            if (items.length === 0) return null;
            const cicloData = dashboard?.ciclos.find((c) => c.ciclo === ciclo);
            const expanded = expandedCiclos[ciclo];

            return (
              <Paper key={ciclo} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                {/* Sección header */}
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2, py: 1.5,
                    bgcolor: CICLO_COLORS[ciclo],
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedCiclos((p) => ({ ...p, [ciclo]: !p[ciclo] }))}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="white">
                      {CICLO_LABELS[ciclo]}
                    </Typography>
                    <Chip
                      label={`${items.length} estándares`}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {cicloData && (
                      <Typography variant="body2" color="white">
                        {cicloData.puntaje_obtenido.toFixed(2)} / {cicloData.puntaje_maximo.toFixed(2)} pts
                        ({cicloData.porcentaje.toFixed(1)}%)
                      </Typography>
                    )}
                    {expanded ? <ExpandLessIcon sx={{ color: 'white' }} /> : <ExpandMoreIcon sx={{ color: 'white' }} />}
                  </Box>
                </Box>

                <Collapse in={expanded}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell width={60}><Typography variant="caption" fontWeight={600}>Código</Typography></TableCell>
                          <TableCell><Typography variant="caption" fontWeight={600}>Descripción</Typography></TableCell>
                          <TableCell width={60} align="center"><Typography variant="caption" fontWeight={600}>Peso</Typography></TableCell>
                          <TableCell width={260} align="center"><Typography variant="caption" fontWeight={600}>Cumplimiento</Typography></TableCell>
                          <TableCell width={60} align="center"><Typography variant="caption" fontWeight={600}>Pts.</Typography></TableCell>
                          <TableCell width={180}><Typography variant="caption" fontWeight={600}>Observaciones</Typography></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((respuesta) => {
                          const isSaving = savingId === respuesta.id;
                          return (
                            <React.Fragment key={respuesta.id}>
                              <TableRow hover>
                                <TableCell>
                                  <Typography variant="caption" fontWeight={600} color="primary">
                                    {respuesta.estandar_codigo}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{respuesta.descripcion}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="caption">
                                    {respuesta.valor_maximo_ajustado.toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                                    <ButtonGroup size="small" variant="outlined">
                                      {(['cumple_totalmente', 'no_cumple', 'no_aplica'] as ValorCumplimiento[]).map((val) => (
                                        <Tooltip key={val} title={CUMPLIMIENTO_LABELS[val]}>
                                          <Button
                                            onClick={() => handleCumplimientoChange(respuesta, val)}
                                            variant={respuesta.cumplimiento === val ? 'contained' : 'outlined'}
                                            color={
                                              val === 'cumple_totalmente' ? 'success' :
                                              val === 'no_cumple' ? 'error' : 'warning'
                                            }
                                            sx={{ minWidth: 36, px: 0.5 }}
                                          >
                                            {val === 'cumple_totalmente' && <CheckCircleIcon fontSize="small" />}
                                            {val === 'no_cumple' && <CancelIcon fontSize="small" />}
                                            {val === 'no_aplica' && <HelpIcon fontSize="small" />}
                                          </Button>
                                        </Tooltip>
                                      ))}
                                    </ButtonGroup>
                                    {isSaving && <CircularProgress size={14} />}
                                    {!isSaving && respuesta.cumplimiento !== 'no_cumple' && (
                                      <SaveIcon fontSize="small" color="success" sx={{ opacity: 0.5 }} />
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography
                                    variant="caption"
                                    fontWeight={600}
                                    color={
                                      respuesta.valor_obtenido > 0 ? 'success.main' : 'text.secondary'
                                    }
                                  >
                                    {respuesta.valor_obtenido.toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    multiline
                                    maxRows={2}
                                    fullWidth
                                    placeholder="Observaciones..."
                                    value={respuesta.observaciones ?? ''}
                                    onChange={(e) => handleObservacionesChange(respuesta, e.target.value)}
                                    inputProps={{ style: { fontSize: '0.75rem' } }}
                                  />
                                </TableCell>
                              </TableRow>
                              {/* Justificación NO APLICA */}
                              {respuesta.cumplimiento === 'no_aplica' && (
                                <TableRow>
                                  <TableCell colSpan={6} sx={{ pt: 0, pb: 1, bgcolor: 'warning.50' }}>
                                    <TextField
                                      size="small"
                                      fullWidth
                                      required
                                      label="Justificación (requerida para No Aplica)"
                                      value={respuesta.justificacion_no_aplica ?? ''}
                                      onChange={(e) => handleJustificacionChange(respuesta, e.target.value)}
                                      error={!respuesta.justificacion_no_aplica}
                                      helperText={!respuesta.justificacion_no_aplica ? 'La justificación es obligatoria según la Resolución 0312/2019' : ''}
                                      sx={{ bgcolor: 'background.paper' }}
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* TAB 1: Dashboard ───────────────────────────────────────────────── */}
      {tab === 1 && dashboard && (
        <Box>
          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {dashboard.ciclos.map((c) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={c.ciclo}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderLeft: `4px solid ${CICLO_COLORS[c.ciclo as CicloPHVA]}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {c.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                    {c.puntaje_obtenido.toFixed(2)}
                    <Typography component="span" variant="body2" color="text.secondary">
                      {' '}/ {c.puntaje_maximo.toFixed(2)}
                    </Typography>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={c.porcentaje}
                    sx={{
                      height: 6, borderRadius: 3, mt: 0.5, mb: 1,
                      '& .MuiLinearProgress-bar': { bgcolor: CICLO_COLORS[c.ciclo as CicloPHVA] },
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={`${c.cumplen} Cumple`} size="small" color="success" />
                    <Chip label={`${c.no_cumplen} No Cumple`} size="small" color="error" />
                    {c.no_aplican > 0 && (
                      <Chip label={`${c.no_aplican} N/A`} size="small" color="warning" />
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* Gauge de puntaje total */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Puntaje Total
                </Typography>
                <Box sx={{ position: 'relative', height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="60%"
                      outerRadius="90%"
                      data={[{
                        name: 'Puntaje',
                        value: dashboard.puntaje_total,
                        fill: dashboard.nivel_cumplimiento === 'aceptable' ? '#4caf50'
                          : dashboard.nivel_cumplimiento === 'moderadamente_aceptable' ? '#ff9800'
                          : '#f44336',
                      }]}
                      startAngle={180}
                      endAngle={-180}
                    >
                      <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#eee' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <Box sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}>
                    <Typography variant="h4" fontWeight={700}>
                      {dashboard.puntaje_total.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">/ 100</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Radar Chart por ciclo */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Desempeño por Ciclo PHVA
                </Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={dashboard.ciclos.map((c) => ({
                    ciclo: c.ciclo,
                    Obtenido: c.porcentaje,
                    Máximo: 100,
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="ciclo" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar name="Máximo" dataKey="Máximo" stroke="#e0e0e0" fill="#e0e0e0" fillOpacity={0.2} />
                    <Radar name="Obtenido" dataKey="Obtenido" stroke="#1976d2" fill="#1976d2" fillOpacity={0.4} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <RechartsTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Pie Chart distribución global */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Distribución Global
                </Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Cumple', value: dashboard.total_cumplen, fill: '#4caf50' },
                        { name: 'No Cumple', value: dashboard.total_no_cumplen, fill: '#f44336' },
                        { name: 'No Aplica', value: dashboard.total_no_aplican, fill: '#ff9800' },
                      ].filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {[
                        { fill: '#4caf50' },
                        { fill: '#f44336' },
                        { fill: '#ff9800' },
                      ].map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Bar Chart: cumplimiento por ciclo */}
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Cumplimiento por Ciclo PHVA
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dashboard.ciclos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="cumplen" name="Cumple" stackId="a" fill="#4caf50" />
                    <Bar dataKey="no_cumplen" name="No Cumple" stackId="a" fill="#f44336" />
                    <Bar dataKey="no_aplican" name="No Aplica" stackId="a" fill="#ff9800" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Tabla de estándares críticos */}
            {dashboard.estandares_criticos.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom color="error">
                    Estándares No Cumplidos — Plan de Mejora Requerido
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {dashboard.estandares_criticos.map((codigo) => {
                      const resp = evaluacion?.respuestas.find((r) => r.estandar_codigo === codigo);
                      return (
                        <Tooltip key={codigo} title={resp?.descripcion ?? ''}>
                          <Chip
                            label={codigo}
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                  {evaluacion && (
                    <Box sx={{ mt: 2 }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell width={60}>Código</TableCell>
                              <TableCell>Descripción</TableCell>
                              <TableCell width={80}>Ciclo</TableCell>
                              <TableCell width={80} align="right">Peso</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dashboard.estandares_criticos.map((codigo) => {
                              const resp = evaluacion.respuestas.find((r) => r.estandar_codigo === codigo);
                              if (!resp) return null;
                              return (
                                <TableRow key={codigo}>
                                  <TableCell>
                                    <Typography variant="caption" fontWeight={600} color="error">
                                      {codigo}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">{resp.descripcion}</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={resp.ciclo}
                                      size="small"
                                      sx={{ bgcolor: CICLO_COLORS[resp.ciclo], color: 'white', fontSize: 10 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="caption">
                                      {resp.valor_maximo_ajustado.toFixed(2)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
