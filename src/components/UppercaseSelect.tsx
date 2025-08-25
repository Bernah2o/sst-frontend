import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectProps } from '@mui/material';

interface UppercaseSelectProps extends Omit<SelectProps, 'onChange'> {
  label: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  fullWidth?: boolean;
  required?: boolean;
}

const UppercaseSelect: React.FC<UppercaseSelectProps> = ({
  label,
  options,
  onChange,
  fullWidth = false,
  required = false,
  value,
  ...props
}) => {
  const handleChange = (event: any) => {
    // Convertir el valor a mayúsculas
    const uppercaseValue = event.target.value.toString().toUpperCase();
    
    // Llamar al onChange original si existe
    if (onChange) {
      onChange(uppercaseValue);
    }
  };

  return (
    <FormControl fullWidth={fullWidth} required={required}>
      <InputLabel>{label}</InputLabel>
      <Select
        {...props}
        value={value}
        onChange={handleChange}
        label={label}
        sx={{
          '& .MuiSelect-select': {
            textTransform: 'uppercase'
          },
          ...props.sx
        }}
      >
        {options.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
            sx={{ textTransform: 'uppercase' }}
          >
            {option.label.toUpperCase()}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default UppercaseSelect;