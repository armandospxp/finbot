import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Search as SearchIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { LoadingContainer } from '../components/common/LoadingOverlay';
import AlertMessage from '../components/common/AlertMessage';
import FileUpload from '../components/common/FileUpload';

/**
 * Componente de formulario para crear o editar aplicaciones de crédito
 */
const ApplicationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  // Estados
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [activeStep, setActiveStep] = useState(0);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [creditPolicies, setCreditPolicies] = useState([]);
  const [calculatedPayment, setCalculatedPayment] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Pasos del formulario
  const steps = ['Información del Cliente', 'Detalles del Préstamo', 'Documentos', 'Revisión'];

  // Cargar datos iniciales
  useEffect(() => {
    fetchCreditPolicies();
    fetchClients();
    
    if (isEditMode) {
      fetchApplicationData();
    }
  }, [id]);

  // Cargar datos de la aplicación para edición
  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/applications/${id}`);
      setApplication(response.data);
      setSelectedClient(response.data.client);
      setCalculatedPayment(response.data.monthlyPayment);
      
      // Cargar documentos si existen
      if (response.data.documents && response.data.documents.length > 0) {
        setUploadedFiles(response.data.documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          size: doc.size,
          type: doc.type,
          url: doc.url,
          status: 'uploaded'
        })));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar los datos de la aplicación:', error);
      setAlert({
        open: true,
        message: 'Error al cargar los datos de la aplicación. Por favor, intente nuevamente.',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  // Cargar políticas de crédito
  const fetchCreditPolicies = async () => {
    try {
      const response = await axios.get('/api/credit-policies');
      setCreditPolicies(response.data);
    } catch (error) {
      console.error('Error al cargar las políticas de crédito:', error);
      setAlert({
        open: true,
        message: 'Error al cargar las políticas de crédito. Por favor, intente nuevamente.',
        severity: 'error',
      });
    }
  };

  // Cargar clientes
  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error al cargar los clientes:', error);
      setAlert({
        open: true,
        message: 'Error al cargar los clientes. Por favor, intente nuevamente.',
        severity: 'error',
      });
    }
  };

  // Buscar clientes
  const searchClients = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      const response = await axios.get(`/api/clients/search?term=${searchTerm}`);
      setClients(response.data);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      setAlert({
        open: true,
        message: 'Error al buscar clientes. Por favor, intente nuevamente.',
        severity: 'error',
      });
    }
  };

  // Calcular pago mensual
  const calculateMonthlyPayment = (loanAmount, interestRate, term) => {
    if (!loanAmount || !interestRate || !term) return null;
    
    const monthlyRate = interestRate / 100 / 12;
    const payment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1);
    
    return Math.round(payment * 100) / 100;
  };

  // Manejar cambio de paso
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Manejar carga de archivos
  const handleFileUpload = async (files) => {
    // Simular carga de archivos al servidor
    const newFiles = [...files];
    
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      file.status = 'uploading';
      setUploadedFiles([...uploadedFiles, file]);
      
      try {
        // Aquí iría la lógica real de carga al servidor
        // Simulamos una carga exitosa después de un tiempo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        file.status = 'uploaded';
        file.id = `file-${Date.now()}-${i}`;
        file.url = URL.createObjectURL(file);
        
        setUploadedFiles(prev => {
          const updated = [...prev];
          const index = updated.findIndex(f => f.name === file.name && f.size === file.size);
          if (index !== -1) {
            updated[index] = file;
          }
          return updated;
        });
      } catch (error) {
        console.error('Error al cargar el archivo:', error);
        file.status = 'error';
        file.error = 'Error al cargar el archivo';
        
        setUploadedFiles(prev => {
          const updated = [...prev];
          const index = updated.findIndex(f => f.name === file.name && f.size === file.size);
          if (index !== -1) {
            updated[index] = file;
          }
          return updated;
        });
      }
    }
  };

  // Manejar eliminación de archivos
  const handleFileDelete = (file) => {
    setUploadedFiles(prev => prev.filter(f => f !== file));
  };

  // Esquema de validación
  const validationSchema = Yup.object({
    clientId: Yup.string().required('El cliente es requerido'),
    loanAmount: Yup.number()
      .required('El monto del préstamo es requerido')
      .positive('El monto debe ser positivo')
      .min(1000, 'El monto mínimo es $1,000'),
    term: Yup.number()
      .required('El plazo es requerido')
      .positive('El plazo debe ser positivo')
      .integer('El plazo debe ser un número entero'),
    interestRate: Yup.number()
      .required('La tasa de interés es requerida')
      .positive('La tasa debe ser positiva'),
    purpose: Yup.string().required('El propósito del préstamo es requerido'),
    creditPolicyId: Yup.string().required('La política de crédito es requerida'),
  });

  // Valores iniciales del formulario
  const initialValues = {
    clientId: application?.client?.id || (selectedClient?.id || ''),
    loanAmount: application?.loanAmount || '',
    term: application?.term || 12,
    interestRate: application?.interestRate || 10,
    purpose: application?.purpose || '',
    creditPolicyId: application?.creditPolicy?.id || '',
    additionalComments: application?.additionalComments || '',
  };

  // Manejar envío del formulario
  const handleSubmit = async (values) => {
    setSubmitting(true);
    
    try {
      const formData = {
        ...values,
        monthlyPayment: calculatedPayment,
        documents: uploadedFiles.filter(file => file.status === 'uploaded').map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.url
        }))
      };
      
      let response;
      
      if (isEditMode) {
        response = await axios.put(`/api/applications/${id}`, formData);
      } else {
        response = await axios.post('/api/applications', formData);
      }
      
      setAlert({
        open: true,
        message: `Solicitud ${isEditMode ? 'actualizada' : 'creada'} correctamente`,
        severity: 'success',
      });
      
      // Redirigir a la página de detalle después de guardar
      setTimeout(() => navigate(`/applications/${response.data.id || id}`), 1500);
    } catch (error) {
      console.error('Error al guardar la solicitud:', error);
      setAlert({
        open: true,
        message: `Error al ${isEditMode ? 'actualizar' : 'crear'} la solicitud. Por favor, intente nuevamente.`,
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Renderizar paso de información del cliente
  const renderClientStep = (formikProps) => {
    const { values, errors, touched, handleChange, setFieldValue } = formikProps;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Seleccione un cliente existente o cree uno nuevo
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              label="Buscar cliente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={searchClients}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mr: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/clients/new', { state: { returnTo: `/applications${isEditMode ? `/${id}/edit` : '/new'}` } })}
            >
              Nuevo Cliente
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Autocomplete
            id="client-select"
            options={clients}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} - ${option.email}`}
            value={selectedClient}
            onChange={(event, newValue) => {
              setSelectedClient(newValue);
              setFieldValue('clientId', newValue?.id || '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cliente"
                error={touched.clientId && Boolean(errors.clientId)}
                helperText={touched.clientId && errors.clientId}
              />
            )}
          />
        </Grid>
        
        {selectedClient && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Información del cliente seleccionado
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nombre completo
                  </Typography>
                  <Typography variant="body1">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{selectedClient.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Teléfono
                  </Typography>
                  <Typography variant="body1">{selectedClient.phone}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Dirección
                  </Typography>
                  <Typography variant="body1">{selectedClient.address}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  // Renderizar paso de detalles del préstamo
  const renderLoanDetailsStep = (formikProps) => {
    const { values, errors, touched, handleChange, setFieldValue } = formikProps;
    
    // Calcular pago mensual cuando cambian los valores relevantes
    useEffect(() => {
      if (values.loanAmount && values.interestRate && values.term) {
        const payment = calculateMonthlyPayment(
          parseFloat(values.loanAmount),
          parseFloat(values.interestRate),
          parseInt(values.term)
        );
        setCalculatedPayment(payment);
      }
    }, [values.loanAmount, values.interestRate, values.term]);
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Detalles del préstamo
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="loanAmount"
            name="loanAmount"
            label="Monto del préstamo"
            value={values.loanAmount}
            onChange={handleChange}
            error={touched.loanAmount && Boolean(errors.loanAmount)}
            helperText={touched.loanAmount && errors.loanAmount}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="term"
            name="term"
            label="Plazo (meses)"
            type="number"
            value={values.term}
            onChange={handleChange}
            error={touched.term && Boolean(errors.term)}
            helperText={touched.term && errors.term}
            InputProps={{
              inputProps: { min: 1, max: 60 }
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="interestRate"
            name="interestRate"
            label="Tasa de interés anual"
            value={values.interestRate}
            onChange={handleChange}
            error={touched.interestRate && Boolean(errors.interestRate)}
            helperText={touched.interestRate && errors.interestRate}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="monthlyPayment"
            label="Pago mensual estimado"
            value={calculatedPayment ? `$${calculatedPayment.toLocaleString()}` : 'Calculando...'}
            InputProps={{
              readOnly: true,
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="purpose"
            name="purpose"
            label="Propósito del préstamo"
            value={values.purpose}
            onChange={handleChange}
            error={touched.purpose && Boolean(errors.purpose)}
            helperText={touched.purpose && errors.purpose}
            select
          >
            <MenuItem value="personal">Personal</MenuItem>
            <MenuItem value="business">Negocio</MenuItem>
            <MenuItem value="education">Educación</MenuItem>
            <MenuItem value="home">Vivienda</MenuItem>
            <MenuItem value="vehicle">Vehículo</MenuItem>
            <MenuItem value="debt_consolidation">Consolidación de deudas</MenuItem>
            <MenuItem value="other">Otro</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth error={touched.creditPolicyId && Boolean(errors.creditPolicyId)}>
            <InputLabel id="credit-policy-label">Política de crédito</InputLabel>
            <Select
              labelId="credit-policy-label"
              id="creditPolicyId"
              name="creditPolicyId"
              value={values.creditPolicyId}
              onChange={handleChange}
              label="Política de crédito"
            >
              {creditPolicies.map((policy) => (
                <MenuItem key={policy.id} value={policy.id}>
                  {policy.name} - Tasa: {policy.baseInterestRate}% - Monto máx: ${policy.maxLoanAmount.toLocaleString()}
                </MenuItem>
              ))}
            </Select>
            {touched.creditPolicyId && errors.creditPolicyId && (
              <FormHelperText>{errors.creditPolicyId}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="additionalComments"
            name="additionalComments"
            label="Comentarios adicionales"
            multiline
            rows={4}
            value={values.additionalComments}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
    );
  };

  // Renderizar paso de documentos
  const renderDocumentsStep = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Documentos requeridos
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Suba los documentos necesarios para procesar la solicitud (identificación, comprobantes de ingresos, etc.)
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <FileUpload
            onFilesAdded={handleFileUpload}
            onFileDeleted={handleFileDelete}
            uploadedFiles={uploadedFiles}
            maxFiles={10}
            maxSize={5 * 1024 * 1024} // 5MB
            acceptedFileTypes={[
              'application/pdf',
              'image/jpeg',
              'image/png',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]}
          />
        </Grid>
      </Grid>
    );
  };

  // Renderizar paso de revisión
  const renderReviewStep = (formikProps) => {
    const { values } = formikProps;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Revisión de la solicitud
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Verifique que toda la información sea correcta antes de enviar la solicitud.
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Información del cliente
            </Typography>
            {selectedClient ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nombre completo
                  </Typography>
                  <Typography variant="body1">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{selectedClient.email}</Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body2" color="error">
                No se ha seleccionado un cliente. Por favor, regrese al paso 1.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Detalles del préstamo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Monto del préstamo
                </Typography>
                <Typography variant="body1">
                  ${parseFloat(values.loanAmount).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Plazo
                </Typography>
                <Typography variant="body1">
                  {values.term} {parseInt(values.term) === 1 ? 'mes' : 'meses'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Tasa de interés anual
                </Typography>
                <Typography variant="body1">{values.interestRate}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Pago mensual estimado
                </Typography>
                <Typography variant="body1">
                  ${calculatedPayment ? calculatedPayment.toLocaleString() : '0'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Propósito del préstamo
                </Typography>
                <Typography variant="body1">
                  {{
                    personal: 'Personal',
                    business: 'Negocio',
                    education: 'Educación',
                    home: 'Vivienda',
                    vehicle: 'Vehículo',
                    debt_consolidation: 'Consolidación de deudas',
                    other: 'Otro'
                  }[values.purpose] || values.purpose}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Documentos adjuntos
            </Typography>
            {uploadedFiles.length > 0 ? (
              <Grid container spacing={1}>
                {uploadedFiles.map((file, index) => (
                  <Grid item xs={12} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachFileIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">{file.name}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No se han adjuntado documentos.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Renderizar contenido del paso actual
  const getStepContent = (step, formikProps) => {
    switch (step) {
      case 0:
        return renderClientStep(formikProps);
      case 1:
        return renderLoanDetailsStep(formikProps);
      case 2:
        return renderDocumentsStep(formikProps);
      case 3:
        return renderReviewStep(formikProps);
      default:
        return 'Paso desconocido';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <LoadingContainer loading={loading}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/applications')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Editar Solicitud' : 'Nueva Solicitud de Crédito'}
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {(formikProps) => (
              <Form>
                {getStepContent(activeStep, formikProps)}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    startIcon={<PrevIcon />}
                  >
                    Anterior
                  </Button>
                  <Box>
                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        disabled={submitting}
                        startIcon={<SaveIcon />}
                      >
                        {submitting ? 'Guardando...' : 'Guardar Solicitud'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                        endIcon={<NextIcon />}
                      >
                        Siguiente
                      </Button>
                    )}
                  </Box>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>

        {/* Alerta */}
        <AlertMessage
          open={alert.open}
          message={alert.message}
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      </LoadingContainer>
    </Container>
  );
};

export default ApplicationForm;