import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';

/**
 * Componente de carga de archivos reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onFileSelect - Función que se ejecuta cuando se selecciona un archivo
 * @param {Function} props.onFileRemove - Función que se ejecuta cuando se elimina un archivo
 * @param {Array<string>} props.acceptedFileTypes - Tipos de archivo aceptados (opcional)
 * @param {number} props.maxFileSize - Tamaño máximo del archivo en bytes (opcional)
 * @param {boolean} props.multiple - Permite seleccionar múltiples archivos (opcional)
 * @param {Array<Object>} props.files - Lista de archivos ya cargados (opcional)
 * @param {boolean} props.disabled - Deshabilita el componente (opcional)
 * @param {string} props.label - Etiqueta del botón de carga (opcional)
 * @param {string} props.dropzoneText - Texto de la zona de arrastrar y soltar (opcional)
 * @param {Object} props.sx - Estilos adicionales (opcional)
 */
const FileUpload = ({
  onFileSelect,
  onFileRemove,
  acceptedFileTypes = [],
  maxFileSize = 5242880, // 5MB por defecto
  multiple = false,
  files = [],
  disabled = false,
  label = 'Seleccionar archivo',
  dropzoneText = 'Arrastra y suelta archivos aquí o haz clic para seleccionar',
  sx = {},
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Formatear el tamaño del archivo para mostrarlo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validar el tipo de archivo
  const isValidFileType = (file) => {
    if (acceptedFileTypes.length === 0) return true;
    return acceptedFileTypes.some(type => {
      // Manejar tipos como 'image/*'
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(`${category}/`);
      }
      return file.type === type;
    });
  };

  // Validar el tamaño del archivo
  const isValidFileSize = (file) => {
    return file.size <= maxFileSize;
  };

  // Manejar la selección de archivos
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    selectedFiles.forEach(file => {
      const isValidType = isValidFileType(file);
      const isValidSize = isValidFileSize(file);
      
      if (!isValidType) {
        alert(`Tipo de archivo no válido: ${file.name}. Tipos aceptados: ${acceptedFileTypes.join(', ')}`);
        return;
      }
      
      if (!isValidSize) {
        alert(`El archivo ${file.name} excede el tamaño máximo de ${formatFileSize(maxFileSize)}`);
        return;
      }
      
      onFileSelect(file);
    });
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = null;
  };

  // Manejar el arrastrar y soltar
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    
    droppedFiles.forEach(file => {
      const isValidType = isValidFileType(file);
      const isValidSize = isValidFileSize(file);
      
      if (!isValidType) {
        alert(`Tipo de archivo no válido: ${file.name}. Tipos aceptados: ${acceptedFileTypes.join(', ')}`);
        return;
      }
      
      if (!isValidSize) {
        alert(`El archivo ${file.name} excede el tamaño máximo de ${formatFileSize(maxFileSize)}`);
        return;
      }
      
      onFileSelect(file);
    });
  };

  // Obtener la extensión del archivo
  const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  };

  return (
    <Box sx={{ ...sx }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept={acceptedFileTypes.join(',')}
        multiple={multiple}
        disabled={disabled}
      />
      
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          border: isDragging ? '2px dashed' : '1px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={() => !disabled && fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="body1" align="center" gutterBottom>
          {dropzoneText}
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current.click();
          }}
          disabled={disabled}
          sx={{ mt: 1 }}
        >
          {label}
        </Button>
        
        {acceptedFileTypes.length > 0 && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            Tipos de archivo aceptados: {acceptedFileTypes.join(', ')}
          </Typography>
        )}
        
        <Typography variant="caption" color="textSecondary">
          Tamaño máximo: {formatFileSize(maxFileSize)}
        </Typography>
      </Paper>
      
      {files.length > 0 && (
        <List>
          {files.map((file, index) => (
            <ListItem
              key={index}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                backgroundColor: file.error ? 'error.light' : file.uploaded ? 'success.light' : 'background.paper',
              }}
            >
              <ListItemIcon>
                {file.loading ? (
                  <CircularProgress size={24} />
                ) : file.error ? (
                  <ErrorIcon color="error" />
                ) : file.uploaded ? (
                  <SuccessIcon color="success" />
                ) : (
                  <FileIcon />
                )}
              </ListItemIcon>
              
              <ListItemText
                primary={file.name}
                secondary={
                  <>
                    {formatFileSize(file.size)}
                    {file.error && (
                      <Typography variant="caption" color="error" component="span" sx={{ ml: 1 }}>
                        {file.error}
                      </Typography>
                    )}
                  </>
                }
              />
              
              <ListItemSecondaryAction>
                {file.type && (
                  <Chip
                    label={getFileExtension(file.name).toUpperCase()}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                )}
                
                <Tooltip title="Eliminar archivo">
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onFileRemove(file, index)}
                    disabled={disabled || file.loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileUpload;