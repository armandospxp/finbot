import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Snackbar,
  Slide,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * Componente de alerta reutilizable para mostrar mensajes de éxito, error, advertencia o información
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.open - Controla si la alerta está visible
 * @param {Function} props.onClose - Función para cerrar la alerta
 * @param {string} props.message - Mensaje a mostrar
 * @param {string} props.title - Título de la alerta (opcional)
 * @param {string} props.severity - Tipo de alerta: 'success', 'error', 'warning', 'info' (opcional)
 * @param {number} props.autoHideDuration - Duración en ms antes de que la alerta se cierre automáticamente (opcional)
 * @param {boolean} props.fullWidth - Si la alerta debe ocupar todo el ancho disponible (opcional)
 * @param {string} props.position - Posición de la alerta: 'top', 'bottom', 'left', 'right' (opcional)
 * @param {Object} props.sx - Estilos adicionales para la alerta (opcional)
 */
const AlertMessage = ({
  open,
  onClose,
  message,
  title,
  severity = 'info',
  autoHideDuration = 6000,
  fullWidth = false,
  position = 'top',
  sx = {},
}) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Determinar la posición de la alerta
  const getPosition = () => {
    switch (position) {
      case 'top':
        return { vertical: 'top', horizontal: 'center' };
      case 'bottom':
        return { vertical: 'bottom', horizontal: 'center' };
      case 'left':
        return { vertical: 'bottom', horizontal: 'left' };
      case 'right':
        return { vertical: 'bottom', horizontal: 'right' };
      default:
        return { vertical: 'top', horizontal: 'center' };
    }
  };

  const { vertical, horizontal } = getPosition();

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical, horizontal }}
      TransitionComponent={Slide}
      sx={{
        width: fullWidth ? '100%' : 'auto',
        '& .MuiAlert-root': {
          width: fullWidth ? '100%' : 'auto',
          ...sx,
        },
      }}
    >
      <Alert
        severity={severity}
        variant="filled"
        elevation={6}
        onClose={handleClose}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AlertMessage;