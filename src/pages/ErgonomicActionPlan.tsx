import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import apiService from "../services/api";
import { getApiUrl } from "../config/env";
import {
  ErgonomicActionPlan as ErgonomicActionPlanType,
  ErgonomicMeasure,
  ERGONOMIC_ITEMS_LABELS,
  PRIMARY_RISK_OPTIONS,
  WORK_FREQUENCY_OPTIONS,
  SST_CONCLUSION_OPTIONS,
  MEASURE_TYPE_OPTIONS,
  MEASURE_RESPONSIBLE_OPTIONS,
  MEASURE_STATUS_OPTIONS,
  FOLLOWUP_RESULT_OPTIONS,
  FOLLOWUP_DECISION_OPTIONS,
} from "../types";

const PLAN_STATUS_COLOR: Record<
  string,
  "default" | "warning" | "success" | "error"
> = {
  OPEN: "warning",
  IN_PROGRESS: "default",
  CLOSED: "success",
};
const PLAN_STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En seguimiento",
  CLOSED: "Cerrado",
};

const emptyMeasure = (): ErgonomicMeasure => ({
  measure_type: "inmediata_sin_costo",
  description: "",
  responsible: "trabajador",
  commitment_date: null,
  status: "pendiente",
});

const CLAUSE_TEXT =
  "Habiendo revisado conjuntamente los hallazgos identificados en la autoevaluación de trabajo en casa y las medidas de control propuestas, el trabajador declara conocer sus compromisos y acepta implementar las acciones a su cargo en los plazos establecidos. El área SST se compromete a hacer seguimiento y a gestionar los recursos necesarios según lo acordado.";

// ────────────────────────────────────────────────────────────────────────────
const ErgonomicActionPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { planId } = useParams<{ planId?: string }>();

  const assessmentIdParam = searchParams.get("assessment_id");
  const workerIdParam = searchParams.get("worker_id");
  const isNew = !planId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<any>(null);

  const [plan, setPlan] = useState<Partial<ErgonomicActionPlanType>>({
    assessment_id: assessmentIdParam ? Number(assessmentIdParam) : 0,
    worker_id: workerIdParam ? Number(workerIdParam) : 0,
    non_compliant_items: null,
    primary_risk: null,
    finding_description: "",
    work_frequency: null,
    sst_conclusion: null,
    sst_conclusion_custom: "",
    worker_accepts: false,
    worker_agreement_name: "",
    worker_agreement_date: null,
    worker_signature: null,
    sst_approver_name: "",
    sst_approval_date: null,
    sst_signature: null,
    verification_date: null,
    verification_method: "",
    followup_result: null,
    followup_decision: null,
    final_observations: "",
    plan_status: "OPEN",
    measures: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = getApiUrl();
      if (!isNew && planId) {
        const existingPlan = await apiService.getErgonomicPlan(Number(planId));
        setPlan((prev) => ({
          ...prev,
          ...existingPlan,
          worker_agreement_name:
            existingPlan.worker_agreement_name ||
            (existingPlan.worker
              ? `${existingPlan.worker.first_name} ${existingPlan.worker.last_name}`
              : ""),
        }));
        if (existingPlan.assessment_id) {
          try {
            const res = await fetch(`${apiBase}/assessments/homework`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
            if (res.ok) {
              const all = await res.json();
              const found = all.find(
                (a: any) => a.id === existingPlan.assessment_id,
              );
              if (found) setAssessment(found);
            }
          } catch {}
        }
      } else if (assessmentIdParam) {
        try {
          const res = await fetch(`${apiBase}/assessments/homework`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          if (res.ok) {
            const all = await res.json();
            const found = all.find(
              (a: any) => String(a.id) === assessmentIdParam,
            );
            if (found) {
              setAssessment(found);
              const nonCompliant = Object.keys(ERGONOMIC_ITEMS_LABELS).filter(
                (k) => found[k] === false,
              );
              const workerName = found.worker
                ? `${found.worker.first_name} ${found.worker.last_name}`
                : "";
              setPlan((p) => ({
                ...p,
                assessment_id: found.id,
                worker_id: found.worker_id,
                non_compliant_items: JSON.stringify(nonCompliant),
                worker_agreement_name: p.worker_agreement_name || workerName,
              }));
            }
          }
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [isNew, planId, assessmentIdParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const nonCompliantList: string[] = (() => {
    try {
      return JSON.parse(plan.non_compliant_items || "[]");
    } catch {
      return [];
    }
  })();

  useEffect(() => {
    if (!isNew) return;
    if ((plan.finding_description || "").trim()) return;
    if (nonCompliantList.length === 0) return;

    const hallazgos = nonCompliantList
      .map((k) => `- ${ERGONOMIC_ITEMS_LABELS[k] || k}`)
      .join("\n");

    setPlan((p) => ({
      ...p,
      finding_description: `Hallazgos ergonómicos identificados:\n${hallazgos}\n\nDescripción general del impacto y condiciones observadas: `,
    }));
  }, [isNew, nonCompliantList, plan.finding_description]);

  const handleField = (field: keyof ErgonomicActionPlanType, value: any) =>
    setPlan((p) => ({ ...p, [field]: value }));

  const handleMeasureChange = (
    idx: number,
    field: keyof ErgonomicMeasure,
    value: any,
  ) =>
    setPlan((p) => {
      const measures = [...(p.measures || [])];
      measures[idx] = { ...measures[idx], [field]: value };
      return { ...p, measures };
    });

  const addMeasure = () =>
    setPlan((p) => ({
      ...p,
      measures: [...(p.measures || []), emptyMeasure()],
    }));

  const removeMeasure = (idx: number) =>
    setPlan((p) => ({
      ...p,
      measures: (p.measures || []).filter((_, i) => i !== idx),
    }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isNew) {
        await apiService.createErgonomicPlan(plan);
        setSuccessMsg("Plan ergonómico creado exitosamente.");
        setTimeout(() => navigate("/admin/ergonomic-plans"), 1200);
      } else {
        await apiService.updateErgonomicPlan(Number(planId), plan);
        setSuccessMsg("Plan actualizado exitosamente.");
        await loadData();
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar el plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleFollowup = async () => {
    if (
      !plan.verification_date ||
      !plan.verification_method ||
      !plan.followup_result ||
      !plan.followup_decision
    ) {
      setError("Complete todos los campos de seguimiento antes de registrar.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiService.registerErgonomicFollowup(Number(planId), {
        verification_date: plan.verification_date,
        verification_method: plan.verification_method,
        followup_result: plan.followup_result,
        followup_decision: plan.followup_decision,
        final_observations: plan.final_observations,
        sst_approver_name: plan.sst_approver_name,
        sst_approval_date: plan.sst_approval_date,
      });
      setSuccessMsg("Seguimiento registrado exitosamente.");
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al registrar seguimiento.");
    } finally {
      setSaving(false);
    }
  };

  const isReadOnlyClosed = !isNew && plan.plan_status === "CLOSED";

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );

  const workerFullName = assessment?.worker
    ? `${assessment.worker.first_name} ${assessment.worker.last_name}`
    : (plan as any).worker
      ? `${(plan as any).worker.first_name} ${(plan as any).worker.last_name}`
      : "";

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate("/admin/ergonomic-plans")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700} flex={1}>
          Plan de Acción Ergonómico Individual
        </Typography>
        {!isNew && (
          <Chip
            label={PLAN_STATUS_LABEL[plan.plan_status || "OPEN"]}
            color={PLAN_STATUS_COLOR[plan.plan_status || "OPEN"]}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMsg(null)}
        >
          {successMsg}
        </Alert>
      )}

      {/* ── SECCIÓN A ────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>
          A. Encabezado
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Trabajador"
              value={workerFullName}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="filled"
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Cargo / Área"
              value={
                assessment?.worker?.position ||
                (plan as any).worker?.position ||
                ""
              }
              fullWidth
              InputProps={{ readOnly: true }}
              variant="filled"
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Fecha de autoevaluación"
              value={assessment?.evaluation_date || ""}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="filled"
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="N.° Autoevaluación"
              value={plan.assessment_id || ""}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="filled"
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>
              Ítems con hallazgo (No cumple)
            </Typography>
            {nonCompliantList.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Sin ítems ergonómicos no conformes registrados.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {nonCompliantList.map((k) => (
                  <Chip
                    key={k}
                    icon={<WarningIcon />}
                    label={ERGONOMIC_ITEMS_LABELS[k] || k}
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* ── SECCIÓN B ────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>
          B. Descripción del Hallazgo
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Riesgo principal *</InputLabel>
              <Select
                value={plan.primary_risk || ""}
                label="Riesgo principal *"
                onChange={(e) => handleField("primary_risk", e.target.value)}
                disabled={isReadOnlyClosed}
              >
                {PRIMARY_RISK_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              Este campo es el riesgo prioritario. Los demás hallazgos se
              gestionan en la descripción y en las medidas de control.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Descripción del hallazgo *"
              multiline
              rows={4}
              fullWidth
              value={plan.finding_description || ""}
              onChange={(e) =>
                handleField("finding_description", e.target.value)
              }
              disabled={isReadOnlyClosed}
              placeholder="Ej.: Trabaja con silla de comedor sin apoyo lumbar; pantalla del portátil muy baja, genera flexión de cuello de aprox. 40°."
              helperText="Describa las condiciones observadas en el puesto de trabajo en casa"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── SECCIÓN C ────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary" flex={1}>
            C. Medidas de Control Acordadas
          </Typography>
          {!isReadOnlyClosed && (
            <Button
              startIcon={<AddIcon />}
              size="small"
              variant="outlined"
              onClick={addMeasure}
            >
              Agregar medida
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.50" }}>
                <TableCell sx={{ minWidth: 180 }}>Tipo de medida</TableCell>
                <TableCell sx={{ minWidth: 260 }}>Descripción</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Responsable</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Fecha compromiso</TableCell>
                <TableCell sx={{ minWidth: 130 }}>Estado</TableCell>
                {!isReadOnlyClosed && <TableCell width={48} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {(plan.measures || []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ color: "text.secondary", py: 3 }}
                  >
                    No hay medidas. Haga clic en "Agregar medida" para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                (plan.measures || []).map((m, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Select
                        value={m.measure_type}
                        onChange={(e) =>
                          handleMeasureChange(
                            idx,
                            "measure_type",
                            e.target.value,
                          )
                        }
                        size="small"
                        fullWidth
                        disabled={isReadOnlyClosed}
                      >
                        {MEASURE_TYPE_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={m.description}
                        onChange={(e) =>
                          handleMeasureChange(
                            idx,
                            "description",
                            e.target.value,
                          )
                        }
                        size="small"
                        fullWidth
                        multiline
                        maxRows={3}
                        placeholder="Describa la acción concreta"
                        disabled={isReadOnlyClosed}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={m.responsible}
                        onChange={(e) =>
                          handleMeasureChange(
                            idx,
                            "responsible",
                            e.target.value,
                          )
                        }
                        size="small"
                        fullWidth
                        disabled={isReadOnlyClosed}
                      >
                        {MEASURE_RESPONSIBLE_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        value={m.commitment_date || ""}
                        onChange={(e) =>
                          handleMeasureChange(
                            idx,
                            "commitment_date",
                            e.target.value || null,
                          )
                        }
                        size="small"
                        fullWidth
                        disabled={isReadOnlyClosed}
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={m.status}
                        onChange={(e) =>
                          handleMeasureChange(idx, "status", e.target.value)
                        }
                        size="small"
                        fullWidth
                      >
                        {MEASURE_STATUS_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    {!isReadOnlyClosed && (
                      <TableCell>
                        <Tooltip title="Eliminar medida">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeMeasure(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* ── SECCIÓN D ────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>
          D. Análisis de Decisión de la Empresa
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Frecuencia de trabajo en casa *</InputLabel>
              <Select
                value={plan.work_frequency || ""}
                label="Frecuencia de trabajo en casa *"
                onChange={(e) => handleField("work_frequency", e.target.value)}
                disabled={isReadOnlyClosed}
              >
                {WORK_FREQUENCY_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControl component="fieldset" disabled={isReadOnlyClosed}>
              <FormLabel component="legend" sx={{ fontSize: 14, mb: 1 }}>
                Conclusión SST *
              </FormLabel>
              <RadioGroup
                value={plan.sst_conclusion || ""}
                onChange={(e) => handleField("sst_conclusion", e.target.value)}
              >
                {SST_CONCLUSION_OPTIONS.map((o) => (
                  <FormControlLabel
                    key={o.value}
                    value={o.value}
                    control={<Radio size="small" />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {o.label}
                        </Typography>
                        {o.description && (
                          <Typography variant="caption" color="text.secondary">
                            {o.description}
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{ mb: 1, alignItems: "flex-start" }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>
          {plan.sst_conclusion === "otro" && (
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Especifique la conclusión"
                multiline
                rows={3}
                fullWidth
                value={plan.sst_conclusion_custom || ""}
                onChange={(e) =>
                  handleField("sst_conclusion_custom", e.target.value)
                }
                disabled={isReadOnlyClosed}
                placeholder="Ingrese la conclusión particular del área SST..."
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* ── SECCIÓN E ────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>
          E. Acuerdo y Compromiso
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Alert
          severity="info"
          variant="outlined"
          sx={{ mb: 3, fontStyle: "italic" }}
        >
          {CLAUSE_TEXT}
        </Alert>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!plan.worker_accepts}
                  onChange={(e) =>
                    handleField("worker_accepts", e.target.checked)
                  }
                  disabled={isReadOnlyClosed}
                />
              }
              label="El trabajador acepta las medidas a su cargo y se compromete a implementarlas"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Nombre completo del trabajador *"
              fullWidth
              size="small"
              value={plan.worker_agreement_name || ""}
              onChange={(e) =>
                handleField("worker_agreement_name", e.target.value)
              }
              disabled={isReadOnlyClosed}
              placeholder="Nombre completo del trabajador"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Fecha de acuerdo del trabajador"
              type="date"
              fullWidth
              size="small"
              value={plan.worker_agreement_date || ""}
              onChange={(e) =>
                handleField("worker_agreement_date", e.target.value || null)
              }
              disabled={isReadOnlyClosed}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Nombre responsable SST que aprueba *"
              fullWidth
              size="small"
              value={plan.sst_approver_name || ""}
              onChange={(e) => handleField("sst_approver_name", e.target.value)}
              disabled={isReadOnlyClosed}
              placeholder="Nombre del responsable SST"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Fecha de aprobación SST"
              type="date"
              fullWidth
              size="small"
              value={plan.sst_approval_date || ""}
              onChange={(e) =>
                handleField("sst_approval_date", e.target.value || null)
              }
              disabled={isReadOnlyClosed}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── SECCIÓN F ────────────────────────────────────────────────────── */}
      {!isNew && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="h6" fontWeight={700} color="primary" flex={1}>
              F. Seguimiento y Cierre del Hallazgo
            </Typography>
            {plan.plan_status === "CLOSED" && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Hallazgo cerrado"
                color="success"
                size="small"
              />
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                label="Fecha de verificación"
                type="date"
                fullWidth
                size="small"
                value={plan.verification_date || ""}
                onChange={(e) =>
                  handleField("verification_date", e.target.value || null)
                }
                disabled={plan.plan_status === "CLOSED"}
                InputLabelProps={{ shrink: true }}
                helperText="Fecha en que se verifica el cumplimiento"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <TextField
                label="Medio de verificación"
                fullWidth
                size="small"
                value={plan.verification_method || ""}
                onChange={(e) =>
                  handleField("verification_method", e.target.value)
                }
                disabled={plan.plan_status === "CLOSED"}
                placeholder="Ej.: Nueva autoevaluación, fotos del puesto, videollamada Teams"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Resultado de verificación</InputLabel>
                <Select
                  value={plan.followup_result || ""}
                  label="Resultado de verificación"
                  onChange={(e) =>
                    handleField("followup_result", e.target.value)
                  }
                  disabled={plan.plan_status === "CLOSED"}
                >
                  {FOLLOWUP_RESULT_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Decisión SST</InputLabel>
                <Select
                  value={plan.followup_decision || ""}
                  label="Decisión SST"
                  onChange={(e) =>
                    handleField("followup_decision", e.target.value)
                  }
                  disabled={plan.plan_status === "CLOSED"}
                >
                  {FOLLOWUP_DECISION_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Observaciones finales"
                multiline
                rows={3}
                fullWidth
                value={plan.final_observations || ""}
                onChange={(e) =>
                  handleField("final_observations", e.target.value)
                }
                disabled={plan.plan_status === "CLOSED"}
                placeholder="Observaciones finales, compromisos adicionales, fecha próxima revisión..."
              />
            </Grid>
          </Grid>
          {plan.plan_status !== "CLOSED" && (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleFollowup}
                disabled={saving}
                startIcon={
                  saving ? <CircularProgress size={16} /> : <CheckCircleIcon />
                }
              >
                Registrar seguimiento / Cerrar hallazgo
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* ── Save ─────────────────────────────────────────────────────────── */}
      {!isReadOnlyClosed && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/admin/ergonomic-plans")}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {isNew ? "Crear plan" : "Guardar cambios"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ErgonomicActionPlanPage;
