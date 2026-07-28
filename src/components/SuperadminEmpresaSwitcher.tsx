import { Business as BusinessIcon } from '@mui/icons-material';
import { Box, Chip, FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React, { useEffect, useState } from 'react';

import api from '../services/api';

interface EmpresaOption {
  id: number;
  nombre: string;
  activo: boolean;
}

const GLOBAL_VALUE = 'ALL';

/**
 * Selector visible solo para superadmin: elige en qué empresa "entra" a operar
 * (envía X-Empresa-Id en todas las peticiones, vía el interceptor de api.ts).
 * Sin selección, el backend corre en modo cross-tenant (ve todas las empresas
 * mezcladas) — antes esto pasaba de forma silenciosa; ahora queda explícito
 * con el chip de advertencia. El valor cambia solo vía handleChange (que
 * siempre recarga la página), así que no hace falta un setter de estado.
 */
const SuperadminEmpresaSwitcher: React.FC = () => {
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const selected = localStorage.getItem('active_empresa_id') || GLOBAL_VALUE;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/superadmin/empresas');
        if (mounted) setEmpresas(res.data);
      } catch {
        // Silencioso: si falla la carga, el selector solo mostrará "Todas las empresas".
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    if (value === GLOBAL_VALUE) {
      localStorage.removeItem('active_empresa_id');
    } else {
      localStorage.setItem('active_empresa_id', value);
    }
    // Recarga completa a propósito: evita mezclar en la UI datos/caché de la
    // empresa anterior con los de la nueva selección.
    window.location.reload();
  };

  const empresaActual = empresas.find((e) => String(e.id) === selected);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <Select
          value={selected}
          onChange={handleChange}
          displayEmpty
          sx={{ height: 36 }}
          renderValue={() => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BusinessIcon fontSize="small" />
              <span>{selected === GLOBAL_VALUE ? 'Todas las empresas' : empresaActual?.nombre || `Empresa #${selected}`}</span>
            </Box>
          )}
        >
          <MenuItem value={GLOBAL_VALUE}>Todas las empresas (vista global)</MenuItem>
          {empresas.map((empresa) => (
            <MenuItem key={empresa.id} value={String(empresa.id)}>
              {empresa.nombre}
              {!empresa.activo ? ' (inactiva)' : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selected === GLOBAL_VALUE && (
        <Chip
          label="Modo global: viendo datos de todas las empresas"
          color="warning"
          size="small"
          variant="outlined"
        />
      )}
    </Box>
  );
};

export default SuperadminEmpresaSwitcher;
