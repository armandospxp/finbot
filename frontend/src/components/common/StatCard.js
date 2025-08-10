import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

/**
 * Componente de tarjeta de estadísticas reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título de la estadística
 * @param {string|number} props.value - Valor de la estadística
 * @param {string} props.subtitle - Subtítulo o descripción adicional (opcional)
 * @param {React.ReactNode} props.icon - Icono a mostrar (opcional)
 * @param {string} props.color - Color del icono (opcional)
 * @param {boolean} props.loading - Indica si los datos están cargando (opcional)
 * @param {string} props.tooltipText - Texto para el tooltip de información (opcional)
 * @param {Function} props.onClick - Función a ejecutar al hacer clic en la tarjeta (opcional)
 * @param {Object} props.sx - Estilos adicionales para la tarjeta (opcional)
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary.main',
  loading = false,
  tooltipText,
  onClick,
  sx = {},
}) => {
  return (
    <Card 
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        } : {},
        ...sx
      }}
      onClick={onClick}
      elevation={3}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {tooltipText && (
            <Tooltip title={tooltipText} arrow placement="top">
              <IconButton size="small" sx={{ p: 0, ml: 1 }}>
                <InfoIcon fontSize="small" color="action" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon && (
            <Box 
              sx={{ 
                mr: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: color,
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" component="div" sx={{ fontWeight: 'medium' }}>
                {value}
              </Typography>
            )}
          </Box>
        </Box>
        
        {subtitle && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;