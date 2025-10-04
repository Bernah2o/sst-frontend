import { Box, Typography, Paper, Divider } from '@mui/material';
import React, { useState } from 'react';

import {
  useUserAutocomplete,
  useWorkerAutocomplete,
  useCourseAutocomplete,
  useCargoAutocomplete,
} from '../hooks/useAutocomplete';

import AutocompleteField, { AutocompleteOption } from './AutocompleteField';


// Datos estáticos de ejemplo
const staticCountries: AutocompleteOption[] = [
  { id: 'co', label: 'Colombia', value: 'CO', description: 'República de Colombia', category: 'Sudamérica' },
  { id: 'ar', label: 'Argentina', value: 'AR', description: 'República Argentina', category: 'Sudamérica' },
  { id: 'br', label: 'Brasil', value: 'BR', description: 'República Federativa del Brasil', category: 'Sudamérica' },
  { id: 'mx', label: 'México', value: 'MX', description: 'Estados Unidos Mexicanos', category: 'Norteamérica' },
  { id: 'us', label: 'Estados Unidos', value: 'US', description: 'Estados Unidos de América', category: 'Norteamérica' },
  { id: 'ca', label: 'Canadá', value: 'CA', description: 'Canadá', category: 'Norteamérica' },
  { id: 'es', label: 'España', value: 'ES', description: 'Reino de España', category: 'Europa' },
  { id: 'fr', label: 'Francia', value: 'FR', description: 'República Francesa', category: 'Europa' },
  { id: 'de', label: 'Alemania', value: 'DE', description: 'República Federal de Alemania', category: 'Europa' },
  { id: 'it', label: 'Italia', value: 'IT', description: 'República Italiana', category: 'Europa' },
];

const staticSkills: AutocompleteOption[] = [
  { id: 'js', label: 'JavaScript', value: 'javascript', description: 'Lenguaje de programación', category: 'Frontend' },
  { id: 'ts', label: 'TypeScript', value: 'typescript', description: 'JavaScript con tipos', category: 'Frontend' },
  { id: 'react', label: 'React', value: 'react', description: 'Biblioteca de UI', category: 'Frontend' },
  { id: 'vue', label: 'Vue.js', value: 'vue', description: 'Framework progresivo', category: 'Frontend' },
  { id: 'angular', label: 'Angular', value: 'angular', description: 'Framework completo', category: 'Frontend' },
  { id: 'python', label: 'Python', value: 'python', description: 'Lenguaje de programación', category: 'Backend' },
  { id: 'django', label: 'Django', value: 'django', description: 'Framework web de Python', category: 'Backend' },
  { id: 'fastapi', label: 'FastAPI', value: 'fastapi', description: 'Framework moderno de Python', category: 'Backend' },
  { id: 'nodejs', label: 'Node.js', value: 'nodejs', description: 'Runtime de JavaScript', category: 'Backend' },
  { id: 'express', label: 'Express.js', value: 'express', description: 'Framework web de Node.js', category: 'Backend' },
];

const AutocompleteExamples: React.FC = () => {
  // Estados para los ejemplos
  const [selectedCountry, setSelectedCountry] = useState<AutocompleteOption | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<AutocompleteOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<AutocompleteOption | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<AutocompleteOption | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<AutocompleteOption | null>(null);
  const [selectedCargo, setSelectedCargo] = useState<AutocompleteOption | null>(null);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Ejemplos de AutocompleteField
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Estos ejemplos muestran diferentes configuraciones y usos del componente AutocompleteField.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Ejemplo 1: Autocompletado simple con datos estáticos */}
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              1. Selección Simple - Datos Estáticos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Autocompletado básico con lista de países predefinida.
            </Typography>
            
            <AutocompleteField
              label="País"
              placeholder="Buscar país..."
              value={selectedCountry}
              onChange={(value) => setSelectedCountry(value as AutocompleteOption | null)}
              autocompleteOptions={{
                staticOptions: staticCountries,
                minSearchLength: 1,
                caseSensitive: false,
              }}
              groupBy={(option) => option.category || 'Otros'}
            />
            
            {selectedCountry && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Seleccionado:</strong> {selectedCountry.label} ({selectedCountry.value})
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Ejemplo 2: Autocompletado múltiple */}
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              2. Selección Múltiple
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Permite seleccionar múltiples habilidades técnicas.
            </Typography>
            
            <AutocompleteField
              label="Habilidades Técnicas"
              placeholder="Buscar habilidades..."
              value={selectedSkills}
              onChange={(value) => setSelectedSkills(value as AutocompleteOption[])}
              multiple
              limitTags={3}
              autocompleteOptions={{
                staticOptions: staticSkills,
                minSearchLength: 1,
              }}
              groupBy={(option) => option.category || 'Otros'}
            />
            
            {selectedSkills.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Seleccionadas:</strong> {selectedSkills.map(s => s.label).join(', ')}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Ejemplo 3: Búsqueda de usuarios */}
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              3. Búsqueda de Usuarios (API)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Busca usuarios en tiempo real desde la API.
            </Typography>
            
            <UserAutocompleteExample 
              value={selectedUser}
              onChange={setSelectedUser}
            />
            
            {selectedUser && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Usuario:</strong> {selectedUser.label}
                  <br />
                  <strong>Email:</strong> {selectedUser.description}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Ejemplo 4: Búsqueda de trabajadores */}
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              4. Búsqueda de Trabajadores
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Busca trabajadores con información de cargo.
            </Typography>
            
            <WorkerAutocompleteExample 
              value={selectedWorker}
              onChange={setSelectedWorker}
            />
            
            {selectedWorker && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Trabajador:</strong> {selectedWorker.label}
                  <br />
                  <strong>Info:</strong> {selectedWorker.description}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Ejemplo 5: Búsqueda de cursos */}
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              5. Búsqueda de Cursos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Busca cursos disponibles en el sistema.
            </Typography>
            
            <CourseAutocompleteExample 
              value={selectedCourse}
              onChange={setSelectedCourse}
            />
            
            {selectedCourse && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Curso:</strong> {selectedCourse.label}
                  <br />
                  <strong>Descripción:</strong> {selectedCourse.description}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Ejemplo 6: Búsqueda de cargos */}
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              6. Búsqueda de Cargos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Busca cargos disponibles en la organización.
            </Typography>
            
            <CargoAutocompleteExample 
              value={selectedCargo}
              onChange={setSelectedCargo}
            />
            
            {selectedCargo && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Cargo:</strong> {selectedCargo.label}
                  <br />
                  <strong>Descripción:</strong> {selectedCargo.description}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Código de Ejemplo
      </Typography>
      
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`// Ejemplo básico de uso
import AutocompleteField from './components/AutocompleteField';
import { useUserAutocomplete } from './hooks/useAutocomplete';

const MyComponent = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  
  return (
    <AutocompleteField
      label="Usuario"
      placeholder="Buscar usuario..."
      value={selectedUser}
      onChange={setSelectedUser}
      autocompleteOptions={{
        apiEndpoint: '/users/search',
        minSearchLength: 2,
        searchDelay: 300,
      }}
    />
  );
};`}
        </Typography>
      </Paper>
    </Box>
  );
};

// Componentes auxiliares para los ejemplos con hooks especializados
const UserAutocompleteExample: React.FC<{
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
}> = ({ value, onChange }) => {
  const { options, error } = useUserAutocomplete();
  
  const handleChange = (value: AutocompleteOption | AutocompleteOption[] | null) => {
    if (Array.isArray(value)) {
      onChange(value[0] || null);
    } else {
      onChange(value);
    }
  };
  
  return (
    <AutocompleteField
      label="Usuario"
      placeholder="Buscar usuario por nombre o email..."
      value={value}
      onChange={handleChange}
      autocompleteOptions={{
        staticOptions: options,
        minSearchLength: 2,
      }}
      helperText={error || "Busca usuarios registrados en el sistema"}
    />
  );
};

const WorkerAutocompleteExample: React.FC<{
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
}> = ({ value, onChange }) => {
  const { options, error } = useWorkerAutocomplete();
  
  const handleChange = (value: AutocompleteOption | AutocompleteOption[] | null) => {
    if (Array.isArray(value)) {
      onChange(value[0] || null);
    } else {
      onChange(value);
    }
  };
  
  return (
    <AutocompleteField
      label="Trabajador"
      placeholder="Buscar trabajador..."
      value={value}
      onChange={handleChange}
      autocompleteOptions={{
        staticOptions: options,
        minSearchLength: 2,
      }}
      helperText={error || "Busca trabajadores por nombre, apellido o documento"}
    />
  );
};

const CourseAutocompleteExample: React.FC<{
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
}> = ({ value, onChange }) => {
  const { options, error } = useCourseAutocomplete();
  
  const handleChange = (value: AutocompleteOption | AutocompleteOption[] | null) => {
    if (Array.isArray(value)) {
      onChange(value[0] || null);
    } else {
      onChange(value);
    }
  };
  
  return (
    <AutocompleteField
      label="Curso"
      placeholder="Buscar curso..."
      value={value}
      onChange={handleChange}
      autocompleteOptions={{
        staticOptions: options,
        minSearchLength: 2,
      }}
      helperText={error || "Busca cursos disponibles"}
    />
  );
};

const CargoAutocompleteExample: React.FC<{
  value: AutocompleteOption | null;
  onChange: (value: AutocompleteOption | null) => void;
}> = ({ value, onChange }) => {
  const { options, error } = useCargoAutocomplete();
  
  const handleChange = (value: AutocompleteOption | AutocompleteOption[] | null) => {
    if (Array.isArray(value)) {
      onChange(value[0] || null);
    } else {
      onChange(value);
    }
  };
  
  return (
    <AutocompleteField
      label="Cargo"
      placeholder="Buscar cargo..."
      value={value}
      onChange={handleChange}
      autocompleteOptions={{
        staticOptions: options,
        minSearchLength: 1,
      }}
      helperText={error || "Busca cargos de la organización"}
    />
  );
};

export default AutocompleteExamples;