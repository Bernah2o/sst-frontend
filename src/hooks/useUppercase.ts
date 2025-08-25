import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar valores de texto en mayúsculas
 * @param initialValue - Valor inicial del campo
 * @returns [value, setValue, handleChange] - Estado del valor, función para establecer valor, y manejador de cambio
 */
export const useUppercase = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue.toUpperCase());

  const setUppercaseValue = useCallback((newValue: string) => {
    setValue(newValue.toUpperCase());
  }, []);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const uppercaseValue = event.target.value.toUpperCase();
    setValue(uppercaseValue);
    return uppercaseValue;
  }, []);

  const handleSelectChange = useCallback((event: any) => {
    const uppercaseValue = event.target.value.toString().toUpperCase();
    setValue(uppercaseValue);
    return uppercaseValue;
  }, []);

  return {
    value,
    setValue: setUppercaseValue,
    handleChange,
    handleSelectChange
  };
};

export default useUppercase;