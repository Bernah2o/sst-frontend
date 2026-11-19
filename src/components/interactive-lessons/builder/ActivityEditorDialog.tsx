import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, ArrowDownward, ArrowUpward, Close } from "@mui/icons-material";
import {
  ActivityType,
  InteractiveActivity,
  InteractiveActivityCreate,
  LessonSlide,
} from "../../../types/interactiveLesson";
import { condensed } from "../../../theme";

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  matching: "Emparejar conceptos",
  ordering: "Ordenar pasos",
  drag_drop: "Clasificar en categorías",
  fill_blanks: "Completar espacios",
  hotspot: "Zonas en imagen",
};

const EDITABLE_TYPES: ActivityType[] = ["matching", "ordering", "drag_drop", "fill_blanks"];
const BLANK = /_{3,}/g;

interface Pair { left: string; right: string }
interface Zone { id: string; label: string }
interface Item { content: string; zone: string }
interface BlankDraft { answer: string; alternatives: string }

interface ActivityEditorDialogProps {
  open: boolean;
  activity: InteractiveActivity | null; // null = nueva
  slides: LessonSlide[];
  nextOrderIndex: number;
  onClose: () => void;
  onSave: (data: InteractiveActivityCreate) => Promise<void>;
}

const sectionTitleSx = {
  fontFamily: condensed,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  fontSize: "0.9rem",
  mb: 1,
};

/** Fila con campos y botón para quitarla */
const RowShell: React.FC<{ onRemove?: () => void; removeLabel: string; children: React.ReactNode; actions?: React.ReactNode }> = ({
  onRemove,
  removeLabel,
  children,
  actions,
}) => (
  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 1.25 }}>
    <Box sx={{ flex: 1, display: "flex", gap: 1, flexWrap: { xs: "wrap", sm: "nowrap" } }}>{children}</Box>
    {actions}
    <Tooltip title={removeLabel}>
      <span>
        <IconButton onClick={onRemove} disabled={!onRemove} aria-label={removeLabel} size="small" sx={{ mt: 0.75 }}>
          <Close fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  </Box>
);

const ActivityEditorDialog: React.FC<ActivityEditorDialogProps> = ({
  open,
  activity,
  slides,
  nextOrderIndex,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [type, setType] = useState<ActivityType>("matching");
  const [slideId, setSlideId] = useState<number | "">("");
  const [points, setPoints] = useState(5);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [showFeedback, setShowFeedback] = useState(true);

  const [pairs, setPairs] = useState<Pair[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState("");
  const [blanks, setBlanks] = useState<BlankDraft[]>([]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Cargar la actividad (o valores por defecto) al abrir
  useEffect(() => {
    if (!open) return;
    const cfg = (activity?.config ?? {}) as Record<string, any>;
    setTitle(activity?.title ?? "");
    setInstructions(activity?.instructions ?? "");
    setType(activity?.activity_type ?? "matching");
    setSlideId(activity?.slide_id ?? "");
    setPoints(activity?.points ?? 5);
    setMaxAttempts(activity?.max_attempts ?? 3);
    setShowFeedback(activity?.show_feedback ?? true);

    setPairs(
      cfg.pairs?.length
        ? cfg.pairs.map((p: any) => ({ left: p.left ?? "", right: p.right ?? "" }))
        : [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }],
    );
    setSteps(
      cfg.items?.length && (activity?.activity_type === "ordering")
        ? [...cfg.items]
            .sort((a: any, b: any) => (a.correct_position ?? 0) - (b.correct_position ?? 0))
            .map((i: any) => i.content ?? "")
        : ["", "", ""],
    );
    setZones(cfg.zones?.length ? cfg.zones.map((z: any) => ({ id: z.id, label: z.label })) : [{ id: "z1", label: "" }, { id: "z2", label: "" }]);
    setItems(
      cfg.items?.length && activity?.activity_type === "drag_drop"
        ? cfg.items.map((i: any) => ({ content: i.content ?? "", zone: i.correct_zone ?? "" }))
        : [{ content: "", zone: "" }, { content: "", zone: "" }],
    );
    setText(cfg.text ?? "");
    setBlanks(
      (cfg.blanks ?? []).map((b: any) => ({
        answer: b.correct_answer ?? "",
        alternatives: (b.alternatives ?? []).join(", "),
      })),
    );
    setErrors([]);
  }, [open, activity]);

  // Completar: mantener un borrador por cada ___ del texto
  const blankCount = useMemo(() => (text.match(BLANK) ?? []).length, [text]);
  useEffect(() => {
    setBlanks((prev) => {
      if (prev.length === blankCount) return prev;
      return Array.from({ length: blankCount }, (_, i) => prev[i] ?? { answer: "", alternatives: "" });
    });
  }, [blankCount]);

  const buildConfig = (): Record<string, unknown> => {
    switch (type) {
      case "matching":
        return {
          pairs: pairs
            .filter((p) => p.left.trim() || p.right.trim())
            .map((p, i) => ({ id: `p${i + 1}`, left: p.left.trim(), right: p.right.trim() })),
        };
      case "ordering":
        return {
          items: steps
            .filter((s) => s.trim())
            .map((s, i) => ({ id: `o${i + 1}`, content: s.trim(), correct_position: i + 1 })),
        };
      case "drag_drop":
        return {
          zones: zones.filter((z) => z.label.trim()).map((z) => ({ id: z.id, label: z.label.trim() })),
          items: items
            .filter((it) => it.content.trim())
            .map((it, i) => ({ id: `i${i + 1}`, content: it.content.trim(), correct_zone: it.zone })),
        };
      case "fill_blanks":
        return {
          text,
          blanks: blanks.map((b, i) => ({
            id: `b${i + 1}`,
            position: i + 1,
            correct_answer: b.answer.trim(),
            alternatives: b.alternatives.split(",").map((a) => a.trim()).filter(Boolean),
          })),
        };
      default:
        return (activity?.config as unknown as Record<string, unknown>) ?? {};
    }
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!title.trim()) errs.push("Escribe un título.");
    switch (type) {
      case "matching": {
        const filled = pairs.filter((p) => p.left.trim() || p.right.trim());
        if (filled.length < 2) errs.push("Agrega al menos 2 pares.");
        if (filled.some((p) => !p.left.trim() || !p.right.trim())) errs.push("Cada par necesita los dos lados.");
        const rights = filled.map((p) => p.right.trim().toLowerCase());
        if (new Set(rights).size !== rights.length) errs.push("Las respuestas de la derecha no se pueden repetir.");
        break;
      }
      case "ordering":
        if (steps.filter((s) => s.trim()).length < 2) errs.push("Agrega al menos 2 pasos.");
        break;
      case "drag_drop": {
        const validZones = zones.filter((z) => z.label.trim());
        const filled = items.filter((it) => it.content.trim());
        if (validZones.length < 2) errs.push("Agrega al menos 2 categorías.");
        if (filled.length < 2) errs.push("Agrega al menos 2 elementos.");
        if (filled.some((it) => !validZones.some((z) => z.id === it.zone))) errs.push("Asigna una categoría a cada elemento.");
        break;
      }
      case "fill_blanks":
        if (blankCount === 0) errs.push("Marca al menos un espacio con ___ en el texto.");
        if (blanks.some((b) => !b.answer.trim())) errs.push("Escribe la respuesta de cada espacio.");
        break;
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        activity_type: type,
        order_index: activity?.order_index ?? nextOrderIndex,
        config: buildConfig() as any,
        points,
        max_attempts: maxAttempts,
        show_feedback: showFeedback,
        // null (no undefined) para que al editar se pueda quitar el vínculo
        slide_id: (slideId === "" ? null : slideId) as number | undefined,
      } as InteractiveActivityCreate);
    } catch {
      setErrors(["No se pudo guardar la actividad. Intenta de nuevo."]);
    } finally {
      setSaving(false);
    }
  };

  const addRowButton = (label: string, onClick: () => void) => (
    <Button size="small" startIcon={<Add />} onClick={onClick}>
      {label}
    </Button>
  );

  const renderConfig = () => {
    switch (type) {
      case "matching":
        return (
          <>
            <Typography sx={sectionTitleSx}>Pares</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              El trabajador verá la columna izquierda y elegirá la pareja de una lista mezclada.
            </Typography>
            {pairs.map((p, i) => (
              <RowShell
                key={i}
                removeLabel={`Quitar par ${i + 1}`}
                onRemove={pairs.length > 2 ? () => setPairs((ps) => ps.filter((_, j) => j !== i)) : undefined}
              >
                <TextField size="small" fullWidth label={`Concepto ${i + 1}`} value={p.left}
                  onChange={(e) => setPairs((ps) => ps.map((x, j) => (j === i ? { ...x, left: e.target.value } : x)))} />
                <TextField size="small" fullWidth label="Pareja correcta" value={p.right}
                  onChange={(e) => setPairs((ps) => ps.map((x, j) => (j === i ? { ...x, right: e.target.value } : x)))} />
              </RowShell>
            ))}
            {addRowButton("Agregar par", () => setPairs((ps) => [...ps, { left: "", right: "" }]))}
          </>
        );

      case "ordering":
        return (
          <>
            <Typography sx={sectionTitleSx}>Pasos en el orden correcto</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Escríbelos en el orden correcto; el trabajador los verá mezclados.
            </Typography>
            {steps.map((step, i) => (
              <RowShell
                key={i}
                removeLabel={`Quitar paso ${i + 1}`}
                onRemove={steps.length > 2 ? () => setSteps((ss) => ss.filter((_, j) => j !== i)) : undefined}
                actions={
                  <Box sx={{ display: "flex", mt: 0.5 }}>
                    <IconButton size="small" aria-label={`Subir paso ${i + 1}`} disabled={i === 0}
                      onClick={() => setSteps((ss) => { const n = [...ss]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}>
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label={`Bajar paso ${i + 1}`} disabled={i === steps.length - 1}
                      onClick={() => setSteps((ss) => { const n = [...ss]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })}>
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <TextField size="small" fullWidth label={`Paso ${i + 1}`} value={step}
                  onChange={(e) => setSteps((ss) => ss.map((x, j) => (j === i ? e.target.value : x)))} />
              </RowShell>
            ))}
            {addRowButton("Agregar paso", () => setSteps((ss) => [...ss, ""]))}
          </>
        );

      case "drag_drop":
        return (
          <>
            <Typography sx={sectionTitleSx}>Categorías</Typography>
            {zones.map((z, i) => (
              <RowShell
                key={z.id}
                removeLabel={`Quitar categoría ${i + 1}`}
                onRemove={zones.length > 2 ? () => {
                  setZones((zs) => zs.filter((x) => x.id !== z.id));
                  setItems((its) => its.map((it) => (it.zone === z.id ? { ...it, zone: "" } : it)));
                } : undefined}
              >
                <TextField size="small" fullWidth label={`Categoría ${i + 1}`} value={z.label}
                  onChange={(e) => setZones((zs) => zs.map((x) => (x.id === z.id ? { ...x, label: e.target.value } : x)))} />
              </RowShell>
            ))}
            {addRowButton("Agregar categoría", () => setZones((zs) => {
              const next = Math.max(0, ...zs.map((z) => parseInt(z.id.replace(/\D/g, ""), 10) || 0)) + 1;
              return [...zs, { id: `z${next}`, label: "" }];
            }))}

            <Divider sx={{ my: 2 }} />
            <Typography sx={sectionTitleSx}>Elementos a clasificar</Typography>
            {items.map((it, i) => (
              <RowShell
                key={i}
                removeLabel={`Quitar elemento ${i + 1}`}
                onRemove={items.length > 2 ? () => setItems((its) => its.filter((_, j) => j !== i)) : undefined}
              >
                <TextField size="small" fullWidth label={`Elemento ${i + 1}`} value={it.content}
                  onChange={(e) => setItems((its) => its.map((x, j) => (j === i ? { ...x, content: e.target.value } : x)))} />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id={`zone-${i}`}>Categoría correcta</InputLabel>
                  <Select labelId={`zone-${i}`} label="Categoría correcta" value={it.zone}
                    onChange={(e) => setItems((its) => its.map((x, j) => (j === i ? { ...x, zone: String(e.target.value) } : x)))}>
                    {zones.filter((z) => z.label.trim()).map((z) => (
                      <MenuItem key={z.id} value={z.id}>{z.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </RowShell>
            ))}
            {addRowButton("Agregar elemento", () => setItems((its) => [...its, { content: "", zone: "" }]))}
          </>
        );

      case "fill_blanks":
        return (
          <>
            <Typography sx={sectionTitleSx}>Texto</Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Antes de trabajar en alturas se debe usar ___ de cuerpo completo y verificar el ___."
              helperText="Escribe ___ (tres guiones bajos) donde va cada espacio en blanco."
            />
            {blanks.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={sectionTitleSx}>Respuestas</Typography>
                {blanks.map((b, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1, mb: 1.25, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                    <TextField size="small" fullWidth label={`Espacio ${i + 1}`} value={b.answer}
                      onChange={(e) => setBlanks((bs) => bs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
                    <TextField size="small" fullWidth label="Otras respuestas válidas (separadas por coma)" value={b.alternatives}
                      onChange={(e) => setBlanks((bs) => bs.map((x, j) => (j === i ? { ...x, alternatives: e.target.value } : x)))} />
                  </Box>
                ))}
                <Typography variant="caption" color="text.secondary">
                  No importan mayúsculas ni tildes al calificar.
                </Typography>
              </Box>
            )}
          </>
        );

      default:
        return (
          <Alert severity="info">
            La edición de este tipo de actividad todavía no está disponible. Se conserva su configuración actual.
          </Alert>
        );
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{activity ? "Editar actividad" : "Nueva actividad"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2, mt: 1 }}>
          <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
          <FormControl fullWidth>
            <InputLabel id="activity-type">Tipo</InputLabel>
            <Select
              labelId="activity-type"
              label="Tipo"
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
              disabled={Boolean(activity) && !EDITABLE_TYPES.includes(type)}
            >
              {(EDITABLE_TYPES.includes(type) ? EDITABLE_TYPES : [...EDITABLE_TYPES, type]).map((t) => (
                <MenuItem key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Instrucciones"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            fullWidth
            sx={{ gridColumn: "1 / -1" }}
            placeholder="Ej.: Une cada peligro con su control"
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" }, gap: 2, mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="activity-slide">Dónde se muestra</InputLabel>
            <Select
              labelId="activity-slide"
              label="Dónde se muestra"
              value={slideId}
              onChange={(e) => {
                const value = e.target.value as number | "";
                setSlideId(value === "" ? "" : Number(value));
              }}
            >
              <MenuItem value="">Automático (slide interactivo libre o al final)</MenuItem>
              {slides.map((s, i) => (
                <MenuItem key={s.id} value={s.id}>
                  {`Slide ${i + 1}: ${s.title || "Sin título"}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Puntos"
            type="number"
            value={points}
            onChange={(e) => setPoints(Math.max(0, Number(e.target.value)))}
            inputProps={{ min: 0, step: 1 }}
          />
          <TextField
            label="Intentos"
            type="number"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Math.max(1, Math.round(Number(e.target.value)) || 1))}
            inputProps={{ min: 1, step: 1 }}
          />
        </Box>
        <FormControlLabel
          sx={{ mt: 1 }}
          control={<Switch checked={showFeedback} onChange={(e) => setShowFeedback(e.target.checked)} />}
          label="Mostrar resultado y, al agotar los intentos, las respuestas correctas"
        />

        <Divider sx={{ my: 2 }} />
        {renderConfig()}

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar actividad"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityEditorDialog;
