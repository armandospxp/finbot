import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Form, Formik } from 'formik';

/**
 * Componente de diálogo de formulario reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.open - Controla si el diálogo está abierto
 * @param {Function} props.onClose - Función para cerrar el diálogo
 * @param {string} props.title - Título del diálogo
 * @param {Object} props.initialValues - Valores iniciales del formulario
 * @param {Object} props.validationSchema - Esquema de validación de Yup
 * @param {Function} props.onSubmit - Función que se ejecuta al enviar el formulario
 * @param {React.ReactNode} props.children - Contenido del formulario
 * @param {string} props.submitButtonText - Texto del botón de envío (opcional)
 * @param {boolean} props.fullWidth - Si el diálogo debe ocupar todo el ancho disponible (opcional)
 * @param {string} props.maxWidth - Tamaño máximo del diálogo (opcional)
 */
const FormDialog = ({
  open,
  onClose,
  title,
  initialValues,
  validationSchema,
  onSubmit,
  children,
  submitButtonText = 'Guardar',
  fullWidth = true,
  maxWidth = 'sm',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, handleSubmit }) => (
          <Form>
            <DialogContent dividers>
              {children}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={onClose} color="inherit">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                color="primary"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {submitButtonText}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default FormDialog;