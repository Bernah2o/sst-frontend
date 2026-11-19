import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowDownward,
  ArrowUpward,
  CheckCircle,
  Replay,
} from "@mui/icons-material";
import {
  ActivitySubmitResponse,
  InteractiveActivity,
} from "../../../types/interactiveLesson";
import interactiveLessonApi from "../../../services/interactiveLessonApi";
import { brand, condensed } from "../../../theme";

/** Configuración tal como la entrega el API al estudiante (sin respuestas). */
interface LearnerMatching { pairs: { id: string; left: string }[]; options: string[] }
interface LearnerOrdering { items: { id: string; content: string }[] }
interface LearnerDragDrop { zones: { id: string; label: string }[]; items: { id: string; content: string }[] }
interface LearnerFillBlanks { text: string; blanks: { id: string; position: number }[] }

export interface ActivityOutcome {
  resolved: boolean;
  isCorrect: boolean;
  score: number;
}

interface ActivityPlayerProps {
  lessonId: number;
  activity: InteractiveActivity;
  isPreview?: boolean;
  /** Resultado de una visita anterior al slide (evita gastar otro intento) */
  previousOutcome?: ActivityOutcome;
  onOutcome?: (activityId: number, outcome: ActivityOutcome) => void;
}

const TYPE_LABEL: Record<string, string> = {
  matching: "Emparejar",
  ordering: "Ordenar",
  drag_drop: "Clasificar",
  fill_blanks: "Completar",
  hotspot: "Identificar en imagen",
};

const BLANK = /_{3,}/;

const capsSx = {
  fontFamily: condensed,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
};

const errorDetail = (err: unknown): string | undefined =>
  err && typeof err === "object" && "response" in err
    ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
    : undefined;

const ActivityPlayer: React.FC<ActivityPlayerProps> = ({
  lessonId,
  activity,
  isPreview = false,
  previousOutcome,
  onOutcome,
}) => {
  const config = activity.config as unknown as Record<string, any>;
  const startedAt = useRef(Date.now());

  // Respuestas por tipo
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[]>(() =>
    ((config as LearnerOrdering).items ?? []).map((i) => i.id),
  );
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ActivitySubmitResponse | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doneBefore = !result && Boolean(previousOutcome?.resolved);
  const resolved = Boolean(result?.is_correct) || exhausted || doneBefore;
  const locked = resolved || submitting;

  const itemsById = useMemo(() => {
    const map: Record<string, string> = {};
    ((config.items as { id: string; content: string }[]) ?? []).forEach((i) => {
      map[i.id] = i.content;
    });
    return map;
  }, [config.items]);

  const isComplete = (): boolean => {
    switch (activity.activity_type) {
      case "matching":
        return (config as LearnerMatching).pairs.every((p) => matches[p.id]);
      case "ordering":
        return order.length > 0;
      case "drag_drop":
        return (config as LearnerDragDrop).items.every((i) => placements[i.id]);
      case "fill_blanks":
        return (config as LearnerFillBlanks).blanks.every((b) => (answers[b.id] ?? "").trim());
      default:
        return false;
    }
  };

  const buildResponse = (): Record<string, unknown> => {
    switch (activity.activity_type) {
      case "matching":
        return { matches };
      case "ordering":
        return { order };
      case "drag_drop":
        return { placements };
      case "fill_blanks":
        return { answers };
      default:
        return {};
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const payload = {
      response: buildResponse(),
      time_spent_seconds: Math.round((Date.now() - startedAt.current) / 1000),
    };
    try {
      const res = isPreview
        ? await interactiveLessonApi.previewActivityResponse(lessonId, activity.id, payload)
        : await interactiveLessonApi.submitActivityResponse(lessonId, activity.id, payload);
      setResult(res);
      const done = res.is_correct || (!isPreview && res.attempts_remaining <= 0);
      if (!isPreview && res.attempts_remaining <= 0) setExhausted(true);
      onOutcome?.(activity.id, { resolved: done, isCorrect: res.is_correct, score: res.score });
    } catch (err) {
      const detail = errorDetail(err);
      if (detail && detail.toLowerCase().includes("máximo de intentos")) {
        // Ya había agotado los intentos en una visita anterior
        setExhausted(true);
        onOutcome?.(activity.id, { resolved: true, isCorrect: false, score: 0 });
      } else {
        setError(detail || "No se pudo enviar la respuesta. Intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setError(null);
    startedAt.current = Date.now();
  };

  const move = (index: number, delta: number) => {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const solution = result?.correct_solution;

  // ── Cuerpo según el tipo ──
  const renderBody = () => {
    switch (activity.activity_type) {
      case "matching": {
        const cfg = config as LearnerMatching;
        const used = new Set(Object.values(matches));
        return (
          <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
            {cfg.pairs.map((pair) => (
              <Box
                component="li"
                key={pair.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1.2fr)" },
                  gap: { xs: 1, sm: 2 },
                  alignItems: "center",
                  py: 1.5,
                  borderBottom: `1px dashed ${brand.ruleSoft}`,
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>{pair.left}</Typography>
                <Box>
                  <FormControl fullWidth size="small" disabled={locked}>
                    <InputLabel id={`m-${activity.id}-${pair.id}`}>Elige la pareja</InputLabel>
                    <Select
                      labelId={`m-${activity.id}-${pair.id}`}
                      label="Elige la pareja"
                      value={matches[pair.id] ?? ""}
                      onChange={(e) => setMatches((m) => ({ ...m, [pair.id]: String(e.target.value) }))}
                      inputProps={{ "aria-label": `Pareja para ${pair.left}` }}
                    >
                      {cfg.options.map((opt) => (
                        <MenuItem
                          key={opt}
                          value={opt}
                          sx={{ whiteSpace: "normal", color: used.has(opt) && matches[pair.id] !== opt ? "text.secondary" : undefined }}
                        >
                          {opt}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {solution && !Array.isArray(solution) && solution[pair.id] && (
                    <Typography variant="body2" sx={{ mt: 0.5, color: "success.main" }}>
                      Respuesta: {solution[pair.id]}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        );
      }

      case "ordering":
        return (
          <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }} aria-label="Pasos a ordenar">
            {order.map((id, index) => (
              <Box
                component="li"
                key={id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.25,
                  mb: 1,
                  border: `1px solid ${brand.rule}`,
                  borderRadius: "3px",
                  backgroundColor: brand.coupon,
                }}
              >
                <Typography
                  sx={{ fontFamily: condensed, fontWeight: 700, fontSize: "1.3rem", color: brand.carbon, width: 28, textAlign: "center", flex: "none" }}
                  aria-hidden
                >
                  {index + 1}
                </Typography>
                <Typography sx={{ flex: 1 }}>{itemsById[id]}</Typography>
                <Box sx={{ display: "flex", flex: "none" }}>
                  <Tooltip title="Subir">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => move(index, -1)}
                        disabled={locked || index === 0}
                        aria-label={`Subir: ${itemsById[id]}`}
                      >
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Bajar">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => move(index, 1)}
                        disabled={locked || index === order.length - 1}
                        aria-label={`Bajar: ${itemsById[id]}`}
                      >
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            ))}
            {Array.isArray(solution) && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Orden correcto</Typography>
                <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                  {solution.map((sid) => (
                    <li key={sid}>{itemsById[sid] ?? sid}</li>
                  ))}
                </Box>
              </Alert>
            )}
          </Box>
        );

      case "drag_drop": {
        const cfg = config as LearnerDragDrop;
        const zoneLabel = (zid: string) => cfg.zones.find((z) => z.id === zid)?.label ?? zid;
        return (
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
            {cfg.items.map((item) => (
              <Box
                component="li"
                key={item.id}
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  py: 1.5,
                  borderBottom: `1px dashed ${brand.ruleSoft}`,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{item.content}</Typography>
                  {solution && !Array.isArray(solution) && solution[item.id] && (
                    <Typography variant="body2" sx={{ color: "success.main" }}>
                      Va en: {zoneLabel(solution[item.id])}
                    </Typography>
                  )}
                </Box>
                {cfg.zones.length <= 4 ? (
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={placements[item.id] ?? null}
                    onChange={(_, v) => v && setPlacements((p) => ({ ...p, [item.id]: v }))}
                    disabled={locked}
                    aria-label={`Categoría para ${item.content}`}
                  >
                    {cfg.zones.map((z) => (
                      <ToggleButton key={z.id} value={z.id} sx={{ textTransform: "none", px: 1.5 }}>
                        {z.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                ) : (
                  <FormControl size="small" sx={{ minWidth: 200 }} disabled={locked}>
                    <InputLabel id={`d-${activity.id}-${item.id}`}>Categoría</InputLabel>
                    <Select
                      labelId={`d-${activity.id}-${item.id}`}
                      label="Categoría"
                      value={placements[item.id] ?? ""}
                      onChange={(e) => setPlacements((p) => ({ ...p, [item.id]: String(e.target.value) }))}
                    >
                      {cfg.zones.map((z) => (
                        <MenuItem key={z.id} value={z.id}>{z.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            ))}
          </Box>
        );
      }

      case "fill_blanks": {
        const cfg = config as LearnerFillBlanks;
        const parts = (cfg.text ?? "").split(BLANK);
        return (
          <Typography component="div" sx={{ lineHeight: 2.6, fontSize: "1.05rem" }}>
            {parts.map((part, i) => {
              const blank = cfg.blanks[i];
              return (
                <React.Fragment key={i}>
                  {part}
                  {i < parts.length - 1 && blank && (
                    <Box component="span" sx={{ display: "inline-flex", flexDirection: "column", verticalAlign: "middle", mx: 0.5 }}>
                      <TextField
                        size="small"
                        value={answers[blank.id] ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [blank.id]: e.target.value }))}
                        disabled={locked}
                        inputProps={{ "aria-label": `Espacio ${i + 1}`, style: { padding: "4px 8px" } }}
                        sx={{ width: 170 }}
                      />
                      {solution && !Array.isArray(solution) && solution[blank.id] && (
                        <Typography component="span" variant="caption" sx={{ color: "success.main", lineHeight: 1.4 }}>
                          {solution[blank.id]}
                        </Typography>
                      )}
                    </Box>
                  )}
                </React.Fragment>
              );
            })}
          </Typography>
        );
      }

      default:
        return (
          <Alert severity="info">
            Este tipo de actividad todavía no está disponible en el visor. Puedes continuar con la lección.
          </Alert>
        );
    }
  };

  const supported = ["matching", "ordering", "drag_drop", "fill_blanks"].includes(activity.activity_type);

  return (
    <Box
      component="section"
      aria-label={`Actividad: ${activity.title}`}
      sx={{ border: `1px solid ${brand.rule}`, borderRadius: "4px", backgroundColor: brand.coupon, overflow: "hidden" }}
    >
      {/* Cabecera tipo cupón */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          px: { xs: 2, sm: 3 },
          py: 1.25,
          backgroundColor: brand.shell,
          color: "#fff",
        }}
      >
        <Typography sx={{ ...capsSx, fontSize: "0.9rem" }}>
          Actividad · {TYPE_LABEL[activity.activity_type] ?? activity.activity_type}
        </Typography>
        <Typography sx={{ ...capsSx, fontSize: "0.85rem", color: brand.shellText }}>
          {activity.points} {activity.points === 1 ? "punto" : "puntos"}
          {!isPreview && supported ? ` · ${activity.max_attempts} intentos` : ""}
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Typography component="h3" sx={{ fontFamily: condensed, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.15 }}>
          {activity.title}
        </Typography>
        {activity.instructions && (
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            {activity.instructions}
          </Typography>
        )}

        {renderBody()}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert
            severity={result.is_correct ? "success" : resolved ? "warning" : "info"}
            icon={result.is_correct ? <CheckCircle /> : undefined}
            sx={{ mt: 2 }}
            role="status"
          >
            <Typography sx={{ fontWeight: 700 }}>
              {String(result.feedback?.message ?? (result.is_correct ? "¡Correcto!" : "Revisa tus respuestas."))}
            </Typography>
            <Typography variant="body2">
              {result.is_correct
                ? `Obtuviste ${Math.round(result.points_earned * 10) / 10} ${result.points_earned === 1 ? "punto" : "puntos"}.`
                : isPreview
                  ? "Vista previa: los intentos no se registran."
                  : result.attempts_remaining > 0
                    ? `Te ${result.attempts_remaining === 1 ? "queda 1 intento" : `quedan ${result.attempts_remaining} intentos`}.`
                    : "Agotaste los intentos. Arriba ves las respuestas correctas."}
            </Typography>
          </Alert>
        )}

        {doneBefore && !exhausted && (
          <Alert severity={previousOutcome?.isCorrect ? "success" : "warning"} sx={{ mt: 2 }}>
            {previousOutcome?.isCorrect
              ? "Ya resolviste esta actividad."
              : "Ya agotaste los intentos de esta actividad. Puedes continuar con la lección."}
          </Alert>
        )}

        {exhausted && !result && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Ya agotaste los intentos de esta actividad. Puedes continuar con la lección.
          </Alert>
        )}

        {supported && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 2.5 }}>
            {result && !result.is_correct && !resolved && (
              <Button variant="outlined" startIcon={<Replay />} onClick={handleRetry}>
                Intentar de nuevo
              </Button>
            )}
            {!result && !resolved && (
              <Button variant="contained" onClick={handleSubmit} disabled={submitting || !isComplete()}>
                {submitting ? "Revisando…" : "Revisar respuesta"}
              </Button>
            )}
            {resolved && (
              <Chip
                color={result?.is_correct || (doneBefore && previousOutcome?.isCorrect) ? "success" : "warning"}
                label={result?.is_correct || (doneBefore && previousOutcome?.isCorrect) ? "Resuelta" : "Intentos agotados"}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ActivityPlayer;
