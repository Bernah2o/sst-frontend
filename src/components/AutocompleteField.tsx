import React, { useState, useRef, useMemo } from 'react';
import {
  TextField,
  Autocomplete,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Box,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { SxProps, Theme } from '@mui/material/styles';
import { useAutocomplete, UseAutocompleteOptions } from '../hooks/useAutocomplete';

export interface AutocompleteOption {
  id: string | number;
  label: string;
  value: any;
  description?: string;
  category?: string;
  disabled?: boolean;
}

export interface AutocompleteFieldProps {
  // Configuración básica
  label: string;
  placeholder?: string;
  value?: AutocompleteOption | AutocompleteOption[] | null;
  onChange: (value: AutocompleteOption | AutocompleteOption[] | null) => void;
  
  // Configuración de autocompletado
  autocompleteOptions?: UseAutocompleteOptions;
  
  // Configuración de selección
  multiple?: boolean;
  limitTags?: number;
  
  // Configuración de visualización
  groupBy?: (option: AutocompleteOption) => string;
  renderOption?: (props: any, option: AutocompleteOption) => React.ReactNode;
  renderTags?: (value: AutocompleteOption[], getTagProps: any) => React.ReactNode;
  
  // Estados
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  
  // Estilos
  sx?: SxProps<Theme>;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  
  // Eventos adicionales
  onFocus?: () => void;
  onBlur?: () => void;
}

const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  autocompleteOptions = {},
  multiple = false,
  limitTags = 2,
  groupBy,
  renderOption,
  renderTags,
  helperText,
  required = false,
  disabled = false,
  sx,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  onFocus,
  onBlur,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  
  // Usar el hook de autocompletado
  const {
    options,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    clearCache,
    refetch,
  } = useAutocomplete(autocompleteOptions);
  
  // Renderizar opción por defecto
  const defaultRenderOption = (props: any, option: AutocompleteOption) => (
    <Box component="li" {...props} key={option.id}>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Typography variant="body1">
          {option.label}
        </Typography>
        {option.description && (
          <Typography variant="body2" color="text.secondary">
            {option.description}
          </Typography>
        )}
        {option.category && (
          <Typography variant="caption" color="primary">
            {option.category}
          </Typography>
        )}
      </Box>
    </Box>
  );
  
  // Renderizar tags por defecto
  const defaultRenderTags = (value: AutocompleteOption[], getTagProps: any) =>
    value.map((option, index) => (
      <Chip
        {...getTagProps({ index })}
        key={option.id}
        label={option.label}
        size={size}
        variant="outlined"
      />
    ));
  
  // Manejar limpieza del campo
  const handleClear = () => {
    onChange(multiple ? [] : null);
    setSearchTerm('');
  };
  
  return (
    <Box>
      <Autocomplete
        multiple={multiple}
        options={options}
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
        open={open}
        onOpen={() => {
          setOpen(true);
          onFocus?.();
        }}
        onClose={() => {
          setOpen(false);
          onBlur?.();
        }}
        loading={loading}
        disabled={disabled}
        limitTags={limitTags}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionDisabled={(option) => option.disabled || false}
        groupBy={groupBy}
        renderOption={renderOption || defaultRenderOption}
        renderTags={multiple ? (renderTags || defaultRenderTags) : undefined}
        filterOptions={(options) => options} // Deshabilitamos el filtro interno
        PaperComponent={(props) => (
          <Paper {...props} sx={{ mt: 1, maxHeight: 300 }} />
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            variant={variant}
            size={size}
            fullWidth={fullWidth}
            required={required}
            error={!!error}
            helperText={error || helperText}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <React.Fragment>
                  {loading && <CircularProgress color="inherit" size={20} />}
                  {error && (
                    <IconButton
                      size="small"
                      onClick={refetch}
                      title="Reintentar búsqueda"
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  )}
                  {(value || searchTerm) && (
                    <IconButton
                      size="small"
                      onClick={handleClear}
                      title="Limpiar"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
        sx={{
          '& .MuiAutocomplete-listbox': {
            maxHeight: 200,
          },
          '& .MuiAutocomplete-option': {
            padding: '8px 12px',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
          '& .MuiAutocomplete-groupLabel': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 'bold',
          },
          ...sx,
        }}
      />
      
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
          <IconButton
            size="small"
            onClick={refetch}
            sx={{ ml: 1 }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Alert>
      )}
    </Box>
  );
};

export default AutocompleteField;