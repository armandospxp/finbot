import React, { useState, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Box,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

/**
 * Componente de barra de búsqueda reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.value - Valor actual de la búsqueda
 * @param {Function} props.onChange - Función que se ejecuta al cambiar el valor de búsqueda
 * @param {string} props.placeholder - Texto de placeholder (opcional)
 * @param {number} props.debounceTime - Tiempo de espera en ms antes de ejecutar la búsqueda (opcional)
 * @param {boolean} props.fullWidth - Si la barra de búsqueda debe ocupar todo el ancho disponible (opcional)
 * @param {string} props.variant - Variante del campo de texto: 'outlined', 'filled', 'standard' (opcional)
 * @param {Object} props.sx - Estilos adicionales (opcional)
 */
const SearchBar = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  debounceTime = 300,
  fullWidth = true,
  variant = 'outlined',
  sx = {},
}) => {
  const [searchTerm, setSearchTerm] = useState(value || '');

  // Actualizar el estado local cuando cambia el valor externo
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Aplicar debounce para evitar demasiadas búsquedas mientras se escribe
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== value) {
        onChange(searchTerm);
      }
    }, debounceTime);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, value, onChange, debounceTime]);

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  return (
    <Paper
      component="form"
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: fullWidth ? '100%' : 'auto',
        ...sx,
      }}
      elevation={0}
      onSubmit={(e) => e.preventDefault()}
    >
      <TextField
        value={searchTerm}
        onChange={handleChange}
        placeholder={placeholder}
        variant={variant}
        fullWidth={fullWidth}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={handleClear}
                edge="end"
                size="small"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />
    </Paper>
  );
};

/**
 * Componente de barra de búsqueda con filtros adicionales
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.value - Valor actual de la búsqueda
 * @param {Function} props.onChange - Función que se ejecuta al cambiar el valor de búsqueda
 * @param {React.ReactNode} props.filters - Componentes de filtro adicionales
 * @param {string} props.placeholder - Texto de placeholder (opcional)
 * @param {number} props.debounceTime - Tiempo de espera en ms antes de ejecutar la búsqueda (opcional)
 * @param {Object} props.sx - Estilos adicionales (opcional)
 */
export const SearchBarWithFilters = ({
  value,
  onChange,
  filters,
  placeholder = 'Buscar...',
  debounceTime = 300,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        width: '100%',
        mb: 2,
        ...sx,
      }}
    >
      <SearchBar
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        debounceTime={debounceTime}
        fullWidth
      />
      {filters && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            flex: { xs: '1 1 100%', sm: '0 0 auto' },
          }}
        >
          {filters}
        </Box>
      )}
    </Box>
  );
};

export default SearchBar;