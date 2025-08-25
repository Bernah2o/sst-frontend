import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface UppercaseTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UppercaseTextField: React.FC<UppercaseTextFieldProps> = ({
  onChange,
  ...props
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Convertir el valor a mayúsculas
    const uppercaseValue = event.target.value.toUpperCase();
    
    // Crear un nuevo evento con el valor en mayúsculas
    const modifiedEvent = {
      ...event,
      target: {
        ...event.target,
        value: uppercaseValue
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    // Llamar al onChange original si existe
    if (onChange) {
      onChange(modifiedEvent);
    }
  };

  return (
    <TextField
      {...props}
      onChange={handleChange}
      inputProps={{
        ...props.inputProps,
        style: {
          textTransform: 'uppercase',
          ...props.inputProps?.style
        }
      }}
    />
  );
};

export default UppercaseTextField;