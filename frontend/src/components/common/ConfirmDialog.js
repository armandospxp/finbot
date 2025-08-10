import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

/**
 * Componente de diálogo de confirmación reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.open - Controla si el diálogo está abierto
 * @param {Function} props.onClose - Función para cerrar el diálogo
 * @param {Function} props.onConfirm - Función que se ejecuta al confirmar la acción
 * @param {string} props.title - Título del diálogo
 * @param {string} props.message - Mensaje de confirmación
 * @param {string} props.confirmButtonText - Texto del botón de confirmación (opcional)
 * @param {string} props.cancelButtonText - Texto del botón de cancelación (opcional)
 * @param {string} props.type - Tipo de confirmación: 'warning', 'error', 'info', 'question' (opcional)
 * @param {boolean} props.loading - Indica si hay una acción en progreso (opcional)
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
  type = 'warning',
  loading = false,
}) => {
  // Determinar el icono según el tipo
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <WarningIcon fontSize="large" color="warning" />;
      case 'error':
        return <ErrorIcon fontSize="large" color="error" />;
      case 'info':
        return <InfoIcon fontSize="large" color="info" />;
      case 'question':
        return <HelpIcon fontSize="large" color="primary" />;
      default:
        return <WarningIcon fontSize="large" color="warning" />;
    }
  };

  // Determinar el color del botón de confirmación según el tipo
  const getButtonColor = () => {
    switch (type) {
      case 'warning':
      case 'error':
        return 'error';
      case 'info':
      case 'question':
        return 'primary';
      default:
        return 'error';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? null : onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirm-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          {!loading && (
            <IconButton
              edge="end"
              color="inherit"
              onClick={onClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Box mr={2}>
            {getIcon()}
          </Box>
          <DialogContentText id="confirm-dialog-description">
            {message}
          </DialogContentText>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit" 
          disabled={loading}
        >
          {cancelButtonText}
        </Button>
        <Button
          onClick={onConfirm}
          color={getButtonColor()}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;