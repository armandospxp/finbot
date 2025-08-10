import React from 'react';
import {
  Backdrop,
  CircularProgress,
  Typography,
  Box,
  Paper,
  useTheme,
} from '@mui/material';

/**
 * Componente de superposición de carga reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.open - Controla si la superposición está visible
 * @param {string} props.message - Mensaje a mostrar durante la carga (opcional)
 * @param {boolean} props.fullScreen - Si la superposición debe cubrir toda la pantalla (opcional)
 * @param {number} props.size - Tamaño del indicador de carga (opcional)
 * @param {Object} props.sx - Estilos adicionales para la superposición (opcional)
 */
const LoadingOverlay = ({
  open,
  message = 'Cargando...',
  fullScreen = false,
  size = 40,
  sx = {},
}) => {
  const theme = useTheme();

  if (!open) return null;

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: theme.zIndex.drawer + 1,
        position: fullScreen ? 'fixed' : 'absolute',
        ...sx,
      }}
      open={open}
    >
      <Paper
        elevation={4}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <CircularProgress size={size} color="primary" />
        {message && (
          <Box mt={2}>
            <Typography variant="body1" color="textPrimary">
              {message}
            </Typography>
          </Box>
        )}
      </Paper>
    </Backdrop>
  );
};

/**
 * Componente de contenedor con estado de carga
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.loading - Indica si el contenido está cargando
 * @param {React.ReactNode} props.children - Contenido a mostrar cuando no está cargando
 * @param {string} props.message - Mensaje a mostrar durante la carga (opcional)
 * @param {boolean} props.fullScreen - Si la superposición debe cubrir toda la pantalla (opcional)
 * @param {Object} props.sx - Estilos adicionales para el contenedor (opcional)
 */
export const LoadingContainer = ({
  loading,
  children,
  message = 'Cargando...',
  fullScreen = false,
  sx = {},
}) => {
  return (
    <Box sx={{ position: 'relative', ...sx }}>
      {children}
      <LoadingOverlay
        open={loading}
        message={message}
        fullScreen={fullScreen}
      />
    </Box>
  );
};

export default LoadingOverlay;