import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  presupuestoSSTService,
  PresupuestoSSTDetail,
  PresupuestoCategoria,
  PresupuestoItem,
  CategoriaPresupuesto,
  CATEGORIA_LABELS,
  CATEGORIAS_ORDER,
  CAT_COLORS,
  CAT_LIGHT_COLORS,
  computeItemTotals,
  formatMoney,
} from '../services/presupuestoSSTService';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

// ────────────────────────────────────────────
// Celda editable de monto mensual
// ────────────────────────────────────────────
interface MontoCellProps {
  itemId: number;
  mes: number;
  field: 'proyectado' | 'ejecutado';
  initialValue: number;
  onSaved: (itemId: number, mes: number, field: 'proyectado' | 'ejecutado', value: number) => void;
}

const MontoCell: React.FC<MontoCellProps> = ({
  itemId, mes, field, initialValue, onSaved,
}) => {
  const [value, setValue] = useState(initialValue === 0 ? '' : String(initialValue));
  const [saving, setSaving] = useState(false);
  const prevRef = useRef(initialValue);

  // Sync si el prop cambia externamente
  useEffect(() => {
    if (prevRef.current !== initialValue) {
      prevRef.current = initialValue;
      setValue(initialValue === 0 ? '' : String(initialValue));
    }
  }, [initialValue]);

  const handleBlur = async () => {
    const num = parseFloat(value.replace(/,/g, '')) || 0;
    if (num === prevRef.current) return;
    setSaving(true);
    try {
      await presupuestoSSTService.actualizarMensual(itemId, mes, { [field]: num });
      prevRef.current = num;
      onSaved(itemId, mes, field, num);
    } catch {
      // revert
      setValue(prevRef.current === 0 ? '' : String(prevRef.current));
    } finally {
      setSaving(false);
    }
  };

  const bg = field === 'proyectado' ? '#FFFDE7' : '#F1F8E9';

  return (
    <TableCell
      sx={{
        p: 0,
        minWidth: 80,
        background: bg,
        border: '1px solid #E0E0E0',
      }}
    >
      <TextField
        variant="standard"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="0"
        InputProps={{
          disableUnderline: true,
          endAdornment: saving ? (
            <CircularProgress size={10} sx={{ mr: 0.5 }} />
          ) : null,
          sx: {
            fontSize: '0.72rem',
            px: 0.5,
            textAlign: 'right',
          },
        }}
        inputProps={{
          style: { textAlign: 'right', padding: '3px 2px' },
        }}
        sx={{ width: '100%' }}
      />
    </TableCell>
  );
};

// ────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────
const PresupuestoSSTDetailPage: React.FC = () => {
  const { presupuestoId } = useParams<{ presupuestoId: string }>();
  const navigate = useNavigate();
  const { dialogState, showConfirmDialog } = useConfirmDialog();

  const [presupuesto, setPresupuesto] = useState<PresupuestoSSTDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  // Dialog agregar ítem
  const [addDialog, setAddDialog] = useState<{
    open: boolean;
    categoria: CategoriaPresupuesto | null;
  }>({ open: false, categoria: null });
  const [newActividad, setNewActividad] = useState('');
  const [adding, setAdding] = useState(false);

  const cargar = useCallback(async () => {
    if (!presupuestoId) return;
    try {
      setLoading(true);
      const data = await presupuestoSSTService.obtener(Number(presupuestoId));
      setPresupuesto(data);
    } catch {
      setError('Error al cargar el presupuesto');
    } finally {
      setLoading(false);
    }
  }, [presupuestoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Actualiza el estado local tras guardar un monto (sin refetch)
  const handleMensualSaved = useCallback(
    (itemId: number, mes: number, field: 'proyectado' | 'ejecutado', value: number) => {
      setPresupuesto((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categorias: prev.categorias.map((cat) => ({
            ...cat,
            items: cat.items.map((item) => {
              if (item.id !== itemId) return item;
              return {
                ...item,
                montos_mensuales: item.montos_mensuales.map((m) =>
                  m.mes === mes ? { ...m, [field]: value } : m
                ),
              };
            }),
          })),
        };
      });
    },
    []
  );

  // Grand totals
  const grandTotals = useMemo(() => {
    if (!presupuesto) return null;
    let totalProy = 0;
    let totalEjec = 0;
    for (const cat of presupuesto.categorias) {
      for (const item of cat.items) {
        const t = computeItemTotals(item);
        totalProy += t.totalProy;
        totalEjec += t.totalEjec;
      }
    }
    const pct = totalProy > 0 ? (totalEjec / totalProy) * 100 : 0;
    return { totalProy, totalEjec, pct, porEjecutar: totalProy - totalEjec };
  }, [presupuesto]);

  const handleExportExcel = async () => {
    if (!presupuesto) return;
    setExporting('excel');
    try {
      await presupuestoSSTService.exportarExcel(presupuesto.id, presupuesto.año);
    } catch {
      setError('Error al exportar a Excel');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!presupuesto) return;
    setExporting('pdf');
    try {
      await presupuestoSSTService.exportarPdf(presupuesto.id, presupuesto.año);
    } catch {
      setError('Error al exportar a PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleAgregarItem = async () => {
    if (!presupuesto || !addDialog.categoria || !newActividad.trim()) return;
    setAdding(true);
    try {
      const nuevoItem = await presupuestoSSTService.agregarItem(
        presupuesto.id,
        addDialog.categoria,
        newActividad.trim()
      );
      setPresupuesto((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categorias: prev.categorias.map((cat) => {
            if (cat.categoria !== addDialog.categoria) return cat;
            return { ...cat, items: [...cat.items, nuevoItem] };
          }),
        };
      });
      setAddDialog({ open: false, categoria: null });
      setNewActividad('');
    } catch {
      setError('Error al agregar el ítem');
    } finally {
      setAdding(false);
    }
  };

  const handleEliminarItem = async (item: PresupuestoItem) => {
    const confirmed = await showConfirmDialog({
      title: 'Eliminar ítem',
      message: `¿Eliminar "${item.actividad}"? Se borrarán todos los montos mensuales asociados.`,
      confirmText: 'Eliminar',
      severity: 'error',
    });
    if (!confirmed) return;
    try {
      await presupuestoSSTService.eliminarItem(item.id);
      setPresupuesto((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categorias: prev.categorias.map((cat) => ({
            ...cat,
            items: cat.items.filter((i) => i.id !== item.id),
          })),
        };
      });
    } catch {
      setError('Error al eliminar el ítem');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!presupuesto) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Presupuesto no encontrado</Alert>
      </Box>
    );
  }

  // Ordenar categorías según CATEGORIAS_ORDER
  const categoriasOrdenadas = CATEGORIAS_ORDER
    .map((catKey) =>
      presupuesto.categorias.find((c) => c.categoria === catKey)
    )
    .filter(Boolean) as PresupuestoCategoria[];

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/admin/presupuesto-sst')}
        >
          Presupuesto SST
        </Link>
        <Typography color="text.primary">Año {presupuesto.año}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigate('/admin/presupuesto-sst')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              Presupuesto SST {presupuesto.año}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
            {presupuesto.codigo} • v{presupuesto.version}
            {presupuesto.encargado_sgsst && ` • ${presupuesto.encargado_sgsst}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={
              exporting === 'excel' ? (
                <CircularProgress size={16} />
              ) : (
                <FileDownloadIcon />
              )
            }
            onClick={handleExportExcel}
            disabled={exporting !== null}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={
              exporting === 'pdf' ? (
                <CircularProgress size={16} />
              ) : (
                <PdfIcon />
              )
            }
            onClick={handleExportPdf}
            disabled={exporting !== null}
          >
            PDF
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary cards */}
      {grandTotals && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <SummaryCard
            label="Total Proyectado"
            value={formatMoney(grandTotals.totalProy)}
            color="#1565C0"
          />
          <SummaryCard
            label="Total Ejecutado"
            value={formatMoney(grandTotals.totalEjec)}
            color="#2E7D32"
          />
          <SummaryCard
            label="% Ejecutado"
            value={`${grandTotals.pct.toFixed(1)}%`}
            color={grandTotals.pct >= 80 ? '#2E7D32' : '#E65100'}
          />
          <SummaryCard
            label="Por Ejecutar"
            value={formatMoney(grandTotals.porEjecutar)}
            color="#6A1B9A"
          />
        </Box>
      )}

      {/* Tabla presupuestal */}
      <TableContainer
        component={Paper}
        sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: 2 }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            {/* Fila 1: agrupadores */}
            <TableRow>
              <TableCell
                rowSpan={2}
                sx={{
                  minWidth: 200,
                  fontWeight: 'bold',
                  background: '#37474F',
                  color: '#fff',
                  position: 'sticky',
                  left: 0,
                  zIndex: 4,
                  border: '1px solid #546E7A',
                }}
              >
                ACTIVIDADES
              </TableCell>
              <TableCell
                rowSpan={2}
                align="right"
                sx={hdrStyle}
              >
                PRES. PROYECTADO
              </TableCell>
              <TableCell rowSpan={2} align="right" sx={hdrStyle}>
                PRES. EJECUTADO
              </TableCell>
              <TableCell rowSpan={2} align="center" sx={hdrStyle}>
                %
              </TableCell>
              <TableCell rowSpan={2} align="right" sx={hdrStyle}>
                POR EJECUTAR
              </TableCell>
              <TableCell rowSpan={2} align="center" sx={hdrStyle}>
                %
              </TableCell>
              {MESES.map((m) => (
                <TableCell
                  key={m}
                  colSpan={2}
                  align="center"
                  sx={{ ...hdrStyle, fontSize: '0.7rem' }}
                >
                  {m}
                </TableCell>
              ))}
            </TableRow>
            {/* Fila 2: P / E por mes */}
            <TableRow>
              {MESES.map((m) => (
                <React.Fragment key={m}>
                  <TableCell align="center" sx={{ ...hdrStyle, fontSize: '0.65rem', py: 0.5 }}>
                    P
                  </TableCell>
                  <TableCell align="center" sx={{ ...hdrStyle, fontSize: '0.65rem', py: 0.5, background: '#455A64' }}>
                    E
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {categoriasOrdenadas.map((cat) => {
              const catKey = cat.categoria as CategoriaPresupuesto;
              const bgDark = CAT_COLORS[catKey] ?? '#37474F';
              const bgLight = CAT_LIGHT_COLORS[catKey] ?? '#FAFAFA';

              // Calcular totales de categoría
              const catTotals = cat.items.reduce(
                (acc, item) => {
                  const t = computeItemTotals(item);
                  return {
                    totalProy: acc.totalProy + t.totalProy,
                    totalEjec: acc.totalEjec + t.totalEjec,
                  };
                },
                { totalProy: 0, totalEjec: 0 }
              );
              const catPorEj = catTotals.totalProy - catTotals.totalEjec;
              const catPct =
                catTotals.totalProy > 0
                  ? (catTotals.totalEjec / catTotals.totalProy) * 100
                  : 0;

              return (
                <React.Fragment key={cat.id}>
                  {/* Fila de categoría */}
                  <TableRow>
                    <TableCell
                      colSpan={6 + 24}
                      sx={{
                        background: bgDark,
                        color: '#fff',
                        fontWeight: 'bold',
                        py: 0.75,
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{CATEGORIA_LABELS[catKey]}</span>
                        <Tooltip title="Agregar ítem a esta categoría">
                          <IconButton
                            size="small"
                            sx={{ color: '#fff' }}
                            onClick={() =>
                              setAddDialog({ open: true, categoria: catKey })
                            }
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* Filas de ítems */}
                  {cat.items.map((item) => {
                    const t = computeItemTotals(item);
                    const pctEjec =
                      t.totalProy > 0
                        ? (t.totalEjec / t.totalProy) * 100
                        : 0;
                    const pctPor =
                      t.totalProy > 0
                        ? (t.porEjecutar / t.totalProy) * 100
                        : 0;

                    return (
                      <TableRow key={item.id} hover>
                        {/* Columna actividad sticky */}
                        <TableCell
                          sx={{
                            background: bgLight,
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            fontSize: '0.75rem',
                            minWidth: 200,
                            maxWidth: 280,
                            border: '1px solid #E0E0E0',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <span>{item.actividad}</span>
                            <Tooltip title="Eliminar ítem">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleEliminarItem(item)}
                                sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        {/* Totales calculados (solo lectura) */}
                        <ReadonlyCell value={formatMoney(t.totalProy)} bg={bgLight} align="right" />
                        <ReadonlyCell value={formatMoney(t.totalEjec)} bg={bgLight} align="right" />
                        <ReadonlyCell
                          value={`${pctEjec.toFixed(0)}%`}
                          bg={pctEjec >= 80 ? '#C8E6C9' : pctEjec > 0 ? '#FFF9C4' : bgLight}
                          align="center"
                        />
                        <ReadonlyCell value={formatMoney(t.porEjecutar)} bg={bgLight} align="right" />
                        <ReadonlyCell
                          value={`${pctPor.toFixed(0)}%`}
                          bg={bgLight}
                          align="center"
                        />

                        {/* Celdas mensuales editables */}
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
                          const m = item.montos_mensuales.find((x) => x.mes === mes);
                          return (
                            <React.Fragment key={mes}>
                              <MontoCell
                                itemId={item.id}
                                mes={mes}
                                field="proyectado"
                                initialValue={Number(m?.proyectado ?? 0)}
                                onSaved={handleMensualSaved}
                              />
                              <MontoCell
                                itemId={item.id}
                                mes={mes}
                                field="ejecutado"
                                initialValue={Number(m?.ejecutado ?? 0)}
                                onSaved={handleMensualSaved}
                              />
                            </React.Fragment>
                          );
                        })}
                      </TableRow>
                    );
                  })}

                  {/* Fila subtotal de categoría */}
                  <TableRow>
                    <TableCell
                      sx={{
                        background: bgDark,
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.72rem',
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                      }}
                    >
                      Total {CATEGORIA_LABELS[catKey]}
                    </TableCell>
                    <TableCell align="right" sx={{ background: bgDark, color: '#fff', fontWeight: 'bold', fontSize: '0.72rem' }}>
                      {formatMoney(catTotals.totalProy)}
                    </TableCell>
                    <TableCell align="right" sx={{ background: bgDark, color: '#fff', fontWeight: 'bold', fontSize: '0.72rem' }}>
                      {formatMoney(catTotals.totalEjec)}
                    </TableCell>
                    <TableCell align="center" sx={{ background: bgDark, color: '#fff', fontWeight: 'bold', fontSize: '0.72rem' }}>
                      {catPct.toFixed(0)}%
                    </TableCell>
                    <TableCell align="right" sx={{ background: bgDark, color: '#fff', fontWeight: 'bold', fontSize: '0.72rem' }}>
                      {formatMoney(catPorEj)}
                    </TableCell>
                    <TableCell align="center" sx={{ background: bgDark, color: '#fff', fontWeight: 'bold', fontSize: '0.72rem' }}>
                      {catTotals.totalProy > 0 ? ((catPorEj / catTotals.totalProy) * 100).toFixed(0) : 0}%
                    </TableCell>
                    {Array.from({ length: 24 }, (_, i) => (
                      <TableCell key={i} sx={{ background: bgDark }} />
                    ))}
                  </TableRow>
                </React.Fragment>
              );
            })}

            {/* Fila Gran Total */}
            {grandTotals && (
              <TableRow>
                <TableCell
                  sx={{
                    background: '#1A237E',
                    color: '#fff',
                    fontWeight: 'bold',
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                  }}
                >
                  GRAN TOTAL PRESUPUESTO SST
                </TableCell>
                <TableCell align="right" sx={{ background: '#1A237E', color: '#fff', fontWeight: 'bold' }}>
                  {formatMoney(grandTotals.totalProy)}
                </TableCell>
                <TableCell align="right" sx={{ background: '#1A237E', color: '#fff', fontWeight: 'bold' }}>
                  {formatMoney(grandTotals.totalEjec)}
                </TableCell>
                <TableCell align="center" sx={{ background: '#1A237E', color: '#fff', fontWeight: 'bold' }}>
                  {grandTotals.pct.toFixed(1)}%
                </TableCell>
                <TableCell align="right" sx={{ background: '#1A237E', color: '#fff', fontWeight: 'bold' }}>
                  {formatMoney(grandTotals.porEjecutar)}
                </TableCell>
                <TableCell align="center" sx={{ background: '#1A237E', color: '#fff', fontWeight: 'bold' }}>
                  {grandTotals.totalProy > 0
                    ? ((grandTotals.porEjecutar / grandTotals.totalProy) * 100).toFixed(1)
                    : 0}%
                </TableCell>
                {Array.from({ length: 24 }, (_, i) => (
                  <TableCell key={i} sx={{ background: '#1A237E' }} />
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog agregar ítem */}
      <Dialog
        open={addDialog.open}
        onClose={() => !adding && setAddDialog({ open: false, categoria: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Agregar actividad a{' '}
          {addDialog.categoria ? CATEGORIA_LABELS[addDialog.categoria] : ''}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Nombre de la actividad"
            fullWidth
            value={newActividad}
            onChange={(e) => setNewActividad(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAgregarItem()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAddDialog({ open: false, categoria: null })}
            disabled={adding}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAgregarItem}
            disabled={adding || !newActividad.trim()}
            startIcon={adding ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {adding ? 'Agregando...' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        severity={dialogState.severity}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </Box>
  );
};

// ── Helpers de celda ──
const hdrStyle = {
  background: '#37474F',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '0.7rem',
  border: '1px solid #546E7A',
  py: 1,
  whiteSpace: 'nowrap',
} as const;

interface ReadonlyCellProps {
  value: string;
  bg?: string;
  align?: 'left' | 'center' | 'right';
}

const ReadonlyCell: React.FC<ReadonlyCellProps> = ({ value, bg, align = 'left' }) => (
  <TableCell
    align={align}
    sx={{
      background: bg ?? '#FAFAFA',
      fontSize: '0.72rem',
      fontWeight: 500,
      border: '1px solid #E0E0E0',
      whiteSpace: 'nowrap',
      px: 1,
    }}
  >
    {value}
  </TableCell>
);

// ── Summary card ──
interface SummaryCardProps {
  label: string;
  value: string;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, color }) => (
  <Card sx={{ flex: '1 1 180px', minWidth: 160 }}>
    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight="bold" sx={{ color }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default PresupuestoSSTDetailPage;
