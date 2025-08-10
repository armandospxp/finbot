import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  CardActions,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Esquema de validación para el formulario de política de crédito
const policySchema = Yup.object().shape({
  name: Yup.string().required('El nombre es requerido'),
  description: Yup.string().required('La descripción es requerida'),
  version: Yup.string().required('La versión es requerida'),
  is_active: Yup.boolean(),
});

const CreditPolicies = () => {
  const { isAdmin } = useAuth();
  
  // Estados para la lista de políticas
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para el diálogo de política
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' o 'edit'
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Estado para el diálogo de confirmación de eliminación
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null);
  
  // Estados para el diálogo de carga de documento
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [policyToUpload, setPolicyToUpload] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Estados para el diálogo de visualización de política
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [policyContent, setPolicyContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Cargar políticas
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/credit-policies');
        setPolicies(response.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar políticas:', err);
        setError('Error al cargar políticas. Por favor, intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchPolicies();
  }, []);
  
  // Formik para manejar el formulario
  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      version: '',
      is_active: false,
    },
    validationSchema: policySchema,
    onSubmit: async (values) => {
      try {
        setFormSubmitting(true);
        
        if (dialogMode === 'create') {
          // Crear política
          const response = await axios.post('/api/credit-policies', values);
          setPolicies([...policies, response.data]);
          showSnackbar('Política creada exitosamente', 'success');
        } else {
          // Actualizar política
          const response = await axios.put(`/api/credit-policies/${currentPolicy.id}`, values);
          setPolicies(policies.map(policy => policy.id === currentPolicy.id ? response.data : policy));
          showSnackbar('Política actualizada exitosamente', 'success');
        }
        
        setFormSubmitting(false);
        handleCloseDialog();
      } catch (err) {
        console.error('Error al guardar política:', err);
        setFormSubmitting(false);
        
        // Manejar errores de validación del servidor
        if (err.response?.data?.detail) {
          if (typeof err.response.data.detail === 'object') {
            // Convertir errores del backend al formato de Formik
            const serverErrors = {};
            Object.entries(err.response.data.detail).forEach(([key, value]) => {
              serverErrors[key] = Array.isArray(value) ? value[0] : value;
            });
            formik.setErrors(serverErrors);
          } else {
            formik.setStatus({ error: err.response.data.detail });
          }
        } else {
          formik.setStatus({ error: 'Error al guardar política. Por favor, intente nuevamente.' });
        }
      }
    },
  });
  
  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Abrir diálogo para crear política
  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    formik.resetForm();
    setOpenDialog(true);
  };
  
  // Abrir diálogo para editar política
  const handleOpenEditDialog = (policy) => {
    setDialogMode('edit');
    setCurrentPolicy(policy);
    
    // Establecer valores iniciales del formulario
    formik.setValues({
      name: policy.name,
      description: policy.description,
      version: policy.version,
      is_active: policy.is_active,
    });
    
    setOpenDialog(true);
  };
  
  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    formik.resetForm();
  };
  
  // Abrir diálogo de confirmación de eliminación
  const handleOpenDeleteDialog = (policy) => {
    setPolicyToDelete(policy);
    setOpenDeleteDialog(true);
  };
  
  // Cerrar diálogo de confirmación de eliminación
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setPolicyToDelete(null);
  };
  
  // Eliminar política
  const handleDeletePolicy = async () => {
    try {
      await axios.delete(`/api/credit-policies/${policyToDelete.id}`);
      setPolicies(policies.filter(policy => policy.id !== policyToDelete.id));
      handleCloseDeleteDialog();
      showSnackbar('Política eliminada exitosamente', 'success');
    } catch (err) {
      console.error('Error al eliminar política:', err);
      showSnackbar('Error al eliminar política', 'error');
      handleCloseDeleteDialog();
    }
  };
  
  // Abrir diálogo de carga de documento
  const handleOpenUploadDialog = (policy) => {
    setPolicyToUpload(policy);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setOpenUploadDialog(true);
  };
  
  // Cerrar diálogo de carga de documento
  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
    setPolicyToUpload(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
  };
  
  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadError(null);
    } else {
      setSelectedFile(null);
      setUploadError('Por favor, seleccione un archivo PDF válido.');
    }
  };
  
  // Cargar documento
  const handleUploadDocument = async () => {
    if (!selectedFile) {
      setUploadError('Por favor, seleccione un archivo PDF válido.');
      return;
    }
    
    try {
      setUploading(true);
      setUploadError(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Configurar el seguimiento del progreso
      const config = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      };
      
      await axios.post(`/api/credit-policies/${policyToUpload.id}/upload`, formData, config);
      
      // Actualizar la política en la lista
      const updatedPolicy = await axios.get(`/api/credit-policies/${policyToUpload.id}`);
      setPolicies(policies.map(policy => policy.id === policyToUpload.id ? updatedPolicy.data : policy));
      
      setUploading(false);
      handleCloseUploadDialog();
      showSnackbar('Documento cargado exitosamente', 'success');
    } catch (err) {
      console.error('Error al cargar documento:', err);
      setUploading(false);
      setUploadError('Error al cargar documento. Por favor, intente nuevamente.');
    }
  };
  
  // Abrir diálogo de visualización de política
  const handleOpenViewDialog = async (policy) => {
    setSelectedPolicy(policy);
    setPolicyContent('');
    setLoadingContent(true);
    setOpenViewDialog(true);
    
    try {
      const response = await axios.get(`/api/credit-policies/${policy.id}/content`);
      setPolicyContent(response.data.content);
      setLoadingContent(false);
    } catch (err) {
      console.error('Error al cargar contenido de la política:', err);
      setPolicyContent('Error al cargar contenido de la política.');
      setLoadingContent(false);
    }
  };
  
  // Cerrar diálogo de visualización de política
  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedPolicy(null);
    setPolicyContent('');
  };
  
  // Cambiar estado de activación de política
  const handleToggleActivation = async (policy) => {
    try {
      const endpoint = policy.is_active
        ? `/api/credit-policies/${policy.id}/deactivate`
        : `/api/credit-policies/${policy.id}/activate`;
      
      const response = await axios.post(endpoint);
      setPolicies(policies.map(p => p.id === policy.id ? response.data : p));
      
      showSnackbar(
        `Política ${policy.is_active ? 'desactivada' : 'activada'} exitosamente`,
        'success'
      );
    } catch (err) {
      console.error('Error al cambiar estado de la política:', err);
      showSnackbar('Error al cambiar estado de la política', 'error');
    }
  };
  
  // Mostrar notificación
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };
  
  // Cerrar notificación
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Políticas de Crédito
        </Typography>
        {isAdmin() && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Nueva Política
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {policies.length > 0 ? (
          policies
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((policy) => (
              <Grid item xs={12} sm={6} md={4} key={policy.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {policy.name}
                      </Typography>
                      <Chip
                        label={policy.is_active ? 'Activa' : 'Inactiva'}
                        color={policy.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Versión: {policy.version}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {policy.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <DescriptionIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {policy.has_document ? 'Documento cargado' : 'Sin documento'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Tooltip title="Ver contenido">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenViewDialog(policy)}
                        disabled={!policy.has_document}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    {isAdmin() && (
                      <>
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEditDialog(policy)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cargar documento">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenUploadDialog(policy)}
                          >
                            <UploadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={policy.is_active ? 'Desactivar' : 'Activar'}>
                          <IconButton
                            color={policy.is_active ? 'error' : 'success'}
                            size="small"
                            onClick={() => handleToggleActivation(policy)}
                          >
                            {policy.is_active ? <CancelIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleOpenDeleteDialog(policy)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No hay políticas de crédito disponibles.
                {isAdmin() && ' Cree una nueva política para comenzar.'}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {policies.length > 0 && (
        <TablePagination
          component="div"
          count={policies.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[3, 6, 9, 12]}
          labelRowsPerPage="Políticas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{ mt: 2 }}
        />
      )}
      
      {/* Diálogo para crear/editar política */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Crear Nueva Política' : 'Editar Política'}
        </DialogTitle>
        <DialogContent>
          {formik.status?.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formik.status.error}
            </Alert>
          )}
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nombre"
                  fullWidth
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Descripción"
                  fullWidth
                  multiline
                  rows={3}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="version"
                  label="Versión"
                  fullWidth
                  value={formik.values.version}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.version && Boolean(formik.errors.version)}
                  helperText={formik.touched.version && formik.errors.version}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_active"
                      checked={formik.values.is_active}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label="Política Activa"
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={formik.handleSubmit}
            variant="contained"
            color="primary"
            disabled={formSubmitting}
          >
            {formSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              dialogMode === 'create' ? 'Crear' : 'Guardar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar la política "{policyToDelete?.name}"? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDeletePolicy} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de carga de documento */}
      <Dialog
        open={openUploadDialog}
        onClose={handleCloseUploadDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cargar Documento de Política</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Política: {policyToUpload?.name}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Seleccione un archivo PDF que contenga la política de crédito completa.
          </Typography>
          
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <input
              accept="application/pdf"
              style={{ display: 'none' }}
              id="policy-file-upload"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="policy-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                disabled={uploading}
              >
                Seleccionar PDF
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Archivo seleccionado: {selectedFile.name}
              </Typography>
            )}
          </Box>
          
          {uploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Cargando: {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUploadDocument}
            variant="contained"
            color="primary"
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Cargando...' : 'Cargar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de visualización de política */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Política: {selectedPolicy?.name} (v{selectedPolicy?.version})
        </DialogTitle>
        <DialogContent dividers>
          {loadingContent ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {policyContent}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Notificación */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Componente LinearProgress para la barra de progreso
const LinearProgress = ({ variant, value }) => {
  return (
    <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 1, height: 8 }}>
      <Box
        sx={{
          width: `${value}%`,
          bgcolor: 'primary.main',
          borderRadius: 1,
          height: 8,
          transition: 'width 0.3s ease-in-out',
        }}
      />
    </Box>
  );
};

export default CreditPolicies;