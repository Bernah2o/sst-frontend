# Componentes y Hook para Texto en Mayúsculas

Este conjunto de utilidades permite convertir automáticamente cualquier texto ingresado a mayúsculas en formularios.

## Componentes Disponibles

### 1. UppercaseTextField

Componente que extiende `TextField` de Material-UI para convertir automáticamente el texto a mayúsculas.

```tsx
import UppercaseTextField from '../components/UppercaseTextField';

// Uso básico
<UppercaseTextField
  label="Número de Documento"
  value={formData.document_number}
  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
  fullWidth
  required
/>
```

### 2. UppercaseSelect

Componente Select que convierte las opciones y el valor seleccionado a mayúsculas.

```tsx
import UppercaseSelect from '../components/UppercaseSelect';

const options = [
  { value: 'opcion1', label: 'Opción 1' },
  { value: 'opcion2', label: 'Opción 2' }
];

<UppercaseSelect
  label="Seleccionar Opción"
  options={options}
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  fullWidth
  required
/>
```

### 3. Hook useUppercase

Hook personalizado que puede ser usado con cualquier componente para manejar texto en mayúsculas.

```tsx
import { useUppercase } from '../hooks/useUppercase';

const MyComponent = () => {
  const { value, setValue, handleChange } = useUppercase('valor inicial');

  return (
    <TextField
      label="Campo de Texto"
      value={value}
      onChange={handleChange}
      inputProps={{
        style: { textTransform: 'uppercase' }
      }}
    />
  );
};
```

## Características

- **Conversión automática**: Todo el texto se convierte a mayúsculas mientras el usuario escribe
- **Estilo visual**: Los campos muestran el texto en mayúsculas usando CSS `textTransform`
- **Compatibilidad**: Mantiene todas las props originales de los componentes de Material-UI
- **TypeScript**: Completamente tipado para mejor experiencia de desarrollo
- **Reutilizable**: Puede ser usado en cualquier formulario del proyecto

## Casos de Uso

- Números de documento (cédulas, pasaportes)
- Códigos de referencia
- Nombres de usuario
- Campos que requieren formato estándar en mayúsculas
- Cualquier campo donde se necesite consistencia en el formato del texto

## Implementación en Formularios Existentes

Para convertir un campo existente:

1. **TextField normal** → **UppercaseTextField**:
```tsx
// Antes
<TextField label="Campo" value={value} onChange={handleChange} />

// Después
<UppercaseTextField label="Campo" value={value} onChange={handleChange} />
```

2. **Select normal** → **UppercaseSelect**:
```tsx
// Antes
<FormControl>
  <InputLabel>Campo</InputLabel>
  <Select value={value} onChange={handleChange}>
    <MenuItem value="opcion1">Opción 1</MenuItem>
  </Select>
</FormControl>

// Después
<UppercaseSelect
  label="Campo"
  options={[{ value: 'opcion1', label: 'Opción 1' }]}
  value={value}
  onChange={handleChange}
/>
```

3. **Usando el hook**:
```tsx
// En lugar de useState normal
const [value, setValue] = useState('');

// Usar el hook
const { value, setValue, handleChange } = useUppercase('');
```