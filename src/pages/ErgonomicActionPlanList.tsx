import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, IconButton, Button, CircularProgress, Alert,
  Tooltip, TextField, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import apiService from '../services/api';
import { ErgonomicActionPlan, ERGONOMIC_ITEMS_LABELS } from '../types';

const STATUS_COLOR: Record<string, 'warning' | 'default' | 'success'> = {
  OPEN: 'warning', IN_PROGRESS: 'default', CLOSED: 'success',
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Abierto', IN_PROGRESS: 'En seguimiento', CLOSED: 'Cerrado',
};

const ErgonomicActionPlanList: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ErgonomicActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchWorker, setSearchWorker] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.listErgonomicPlans(
        filterStatus ? { plan_status: filterStatus } : undefined
      );
      setPlans(data);
    } catch (e: any) {
      setError('Error al cargar los planes ergonómicos.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const handleDelete = async (planId: number) => {
    if (!window.confirm('¿Eliminar este plan ergonómico? Esta acción no se puede deshacer.')) return;
    setDeleting(planId);
    try {
      await apiService.deleteErgonomicPlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch {
      setError('Error al eliminar el plan.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = plans.filter((p) => {
    if (!searchWorker) return true;
    const name = p.worker
      ? `${p.worker.first_name} ${p.worker.last_name}`.toLowerCase()
      : '';
    return name.includes(searchWorker.toLowerCase()) ||
      String(p.worker?.document_number || '').includes(searchWorker);
  });

  const getNonCompliantLabels = (jsonStr: string | null | undefined): string => {
    try {
      const keys: string[] = JSON.parse(jsonStr || '[]');
      return keys.map((k) => ERGONOMIC_ITEMS_LABELS[k] || k).join(', ') || '–';
    } catch {
      return '–';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h5" fontWeight={700} flex={1}>
          Planes de Acción Ergonómicos
        </Typography>
        <Tooltip title="Actualizar">
          <IconButton onClick={loadPlans}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Buscar trabajador"
            size="small"
            value={searchWorker}
            onChange={(e) => setSearchWorker(e.target.value)}
            placeholder="Nombre o cédula"
            sx={{ minWidth: 220 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Estado del plan</InputLabel>
            <Select
              value={filterStatus}
              label="Estado del plan"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="OPEN">Abierto</MenuItem>
              <MenuItem value="IN_PROGRESS">En seguimiento</MenuItem>
              <MenuItem value="CLOSED">Cerrado</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <Typography>No hay planes ergonómicos registrados.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell>#</TableCell>
                <TableCell>Trabajador</TableCell>
                <TableCell>Cédula</TableCell>
                <TableCell>Ítems con hallazgo</TableCell>
                <TableCell>Frecuencia</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Creado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => {
                const workerName = p.worker
                  ? `${p.worker.first_name} ${p.worker.last_name}`
                  : `Trabajador #${p.worker_id}`;
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{workerName}</Typography>
                      {p.worker?.position && (
                        <Typography variant="caption" color="text.secondary">{p.worker.position}</Typography>
                      )}
                    </TableCell>
                    <TableCell>{p.worker?.document_number || '–'}</TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {getNonCompliantLabels(p.non_compliant_items)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {p.work_frequency === 'ocasional' && 'Ocasional'}
                        {p.work_frequency === 'frecuente_semanal' && 'Frecuente'}
                        {p.work_frequency === 'teletrabajo_total' && 'Teletrabajo total'}
                        {!p.work_frequency && '–'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[p.plan_status] || p.plan_status}
                        color={STATUS_COLOR[p.plan_status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('es-CO') : '–'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver / editar plan">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/admin/ergonomic-plans/${p.id}`)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar plan">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(p.id!)}
                            disabled={deleting === p.id}
                          >
                            {deleting === p.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

export default ErgonomicActionPlanList;
