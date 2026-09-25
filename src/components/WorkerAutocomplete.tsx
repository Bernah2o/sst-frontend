import {
  Autocomplete,
  Box,
  Chip,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  createFilterOptions,
} from "@mui/material";
import { SxProps, Theme } from "@mui/material/styles";
import React, { useMemo, useState } from "react";

export interface WorkerOption {
  /** Valor que se guarda en el formulario/filtro (id del trabajador o del usuario) */
  id: number | string;
  name: string;
  document?: string | null;
  /** Texto secundario opcional (cargo, email...) */
  detail?: string | null;
  is_active?: boolean;
}

export interface WorkerAutocompleteProps {
  options: WorkerOption[];
  /** id seleccionado; "" o null = sin selección ("Todos" en filtros) */
  value: number | string | null | undefined;
  onChange: (id: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  size?: "small" | "medium";
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
  helperText?: string;
  /**
   * Filtros sobre historial (certificados, seguimientos): permite ver
   * trabajadores inactivos con un interruptor. En formularios de asignación
   * se deja en false y los inactivos nunca aparecen.
   */
  allowInactive?: boolean;
}

// Busca por nombre, documento y detalle, sin distinguir tildes ni mayúsculas
const filterOptions = createFilterOptions<WorkerOption>({
  ignoreAccents: true,
  ignoreCase: true,
  stringify: (option) =>
    [option.name, option.document, option.detail].filter(Boolean).join(" "),
});

const WorkerAutocomplete: React.FC<WorkerAutocompleteProps> = ({
  options,
  value,
  onChange,
  label = "Trabajador",
  placeholder = "Buscar por nombre o documento",
  required = false,
  disabled = false,
  size = "medium",
  fullWidth = true,
  sx,
  helperText,
  allowInactive = false,
}) => {
  const [showInactive, setShowInactive] = useState(false);

  const selected = useMemo(
    () =>
      value === null || value === undefined || value === ""
        ? null
        : options.find((o) => String(o.id) === String(value)) ?? null,
    [options, value],
  );

  const visibleOptions = useMemo(() => {
    const includeInactive = allowInactive && showInactive;
    return options
      .filter(
        (o) =>
          o.is_active !== false ||
          includeInactive ||
          // Conservar la opción ya seleccionada aunque esté inactiva
          (selected !== null && String(o.id) === String(selected.id)),
      )
      .sort((a, b) => {
        const activeDiff = Number(b.is_active !== false) - Number(a.is_active !== false);
        return activeDiff || a.name.localeCompare(b.name, "es", { sensitivity: "base" });
      });
  }, [options, allowInactive, showInactive, selected]);

  const inactiveCount = useMemo(
    () => options.filter((o) => o.is_active === false).length,
    [options],
  );

  return (
    <Box sx={sx}>
      <Autocomplete
        options={visibleOptions}
        value={selected}
        onChange={(_, option) => onChange(option ? String(option.id) : "")}
        filterOptions={filterOptions}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, val) => String(option.id) === String(val.id)}
        groupBy={
          allowInactive && showInactive
            ? (option) => (option.is_active === false ? "Inactivos" : "Activos")
            : undefined
        }
        renderOption={(props, option) => {
          const { key, ...optionProps } = props as typeof props & { key: React.Key };
          return (
            <Box component="li" key={key} {...optionProps}>
              <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap>
                  {option.name}
                </Typography>
                {(option.document || option.detail) && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {[option.document, option.detail].filter(Boolean).join(" · ")}
                  </Typography>
                )}
              </Box>
              {option.is_active === false && (
                <Chip label="Inactivo" size="small" sx={{ ml: 1 }} />
              )}
            </Box>
          );
        }}
        noOptionsText="Sin coincidencias"
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        autoHighlight
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            required={required}
            helperText={helperText}
          />
        )}
      />
      {allowInactive && inactiveCount > 0 && (
        <FormControlLabel
          sx={{ mt: 0.5, ml: 0 }}
          control={
            <Switch
              size="small"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              Incluir inactivos ({inactiveCount})
            </Typography>
          }
        />
      )}
    </Box>
  );
};

export default WorkerAutocomplete;
