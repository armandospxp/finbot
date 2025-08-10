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
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Esquema de validación para el formulario de cliente
const clientSchema = Yup.object().shape({
  first_name: Yup.string().required('El nombre es requerido'),
  last_name: Yup.string().required('El apellido es requerido'),
  email: Yup.string().email('Email inválido').required('El email es requerido'),
  phone: Yup.string().required('El teléfono es requerido'),
  identification: Yup.string().required('La identificación es requerida'),
  address: Yup.string(),
  employment_status: Yup.string().required('El estado laboral es requerido'),
  monthly_income: Yup.number().positive('El ingreso debe ser positivo').required('El ingreso mensual es requerido'),
  employment_years: Yup.number().min(0, 'No puede ser negativo').required('Los años de empleo son requeridos'),
});

const Clients = () => {
  const { isAdmin } = useAuth();
  
  // Estados para la lista de clientes
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para el diálogo de cliente
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' o 'edit'
  const [currentClient, setCurrentClient] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Estado para el diálogo de confirmación de eliminación
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  
  // Estados para el diálogo de detalles del cliente
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  
  // Cargar clientes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/clients');
        setClients(response.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        setError('Error al cargar clientes. Por favor, intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchClients();
  }, []);
  
  // Formik para manejar el formulario
  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      identification: '',
      address: '',
      employment_status: 'EMPLOYED', // Valor por defecto
      monthly_income: '',
      employment_years: '',
    },
    validationSchema: clientSchema,
    onSubmit: async (values) => {
      try {
        setFormSubmitting(true);
        
        if (dialogMode === 'create') {
          // Crear cliente
          const response = await axios.post('/api/clients', values);
          setClients([...clients, response.data]);
        } else {
          // Actualizar cliente
          const response = await axios.put(`/api/clients/${currentClient.id}`, values);
          setClients(clients.map(client => client.id === currentClient.id ? response.data : client));
        }
        
        setFormSubmitting(false);
        handleCloseDialog();
      } catch (err) {
        console.error('Error al guardar cliente:', err);
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
          formik.setStatus({ error: 'Error al guardar cliente. Por favor, intente nuevamente.' });
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
  
  // Abrir diálogo para crear cliente
  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    formik.resetForm();
    setOpenDialog(true);
  };
  
  // Abrir diálogo para editar cliente
  const handleOpenEditDialog = (client) => {
    setDialogMode('edit');
    setCurrentClient(client);
    
    // Establecer valores iniciales del formulario
    formik.setValues({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone,
      identification: client.identification,
      address: client.address || '',
      employment_status: client.employment_status,
      monthly_income: client.monthly_income,
      employment_years: client.employment_years,
    });
    
    setOpenDialog(true);
  };
  
  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    formik.resetForm();
  };
  
  // Abrir diálogo de confirmación de eliminación
  const handleOpenDeleteDialog = (client) => {
    setClientToDelete(client);
    setOpenDeleteDialog(true);
  };
  
  // Cerrar diálogo de confirmación de eliminación
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setClientToDelete(null);
  };
  
  // Eliminar cliente
  const handleDeleteClient = async () => {
    try {
      await axios.delete(`/api/clients/${clientToDelete.id}`);
      setClients(clients.filter(client => client.id !== clientToDelete.id));
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      setError('Error al eliminar cliente. Por favor, intente nuevamente.');
      handleCloseDeleteDialog();
    }
  };
  
  // Abrir diálogo de detalles del cliente
  const handleOpenDetailsDialog = async (client) => {
    setSelectedClient(client);
    setOpenDetailsDialog(true);
    setDetailsTab(0);
    setClientDetails(null);
    
    try {
      setLoadingDetails(true);
      
      // Cargar detalles del cliente
      const response = await axios.get(`/api/clients/${client.id}/details`);
      setClientDetails(response.data);
      
      setLoadingDetails(false);
    } catch (err) {
      console.error('Error al cargar detalles del cliente:', err);
      setLoadingDetails(false);
    }
  };
  
  // Cerrar diálogo de detalles del cliente
  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedClient(null);
    setClientDetails(null);
  };
  
  // Cambiar pestaña en el diálogo de detalles
  const handleChangeDetailsTab = (event, newValue) => {
    setDetailsTab(newValue);
  };
  
  // Obtener etiqueta de estado laboral
  const getEmploymentStatusLabel = (status) => {
    switch (status) {
      case 'EMPLOYED': return 'Empleado';
      case 'SELF_EMPLOYED': return 'Autónomo';
      case 'UNEMPLOYED': return 'Desempleado';
      case 'RETIRED': return 'Jubilado';
      default: return status;
    }
  };
  
  // Obtener color de estado laboral
  const getEmploymentStatusColor = (status) => {
    switch (status) {
      case 'EMPLOYED': return 'success';
      case 'SELF_EMPLOYED': return 'info';
      case 'UNEMPLOYED': return 'error';
      case 'RETIRED': return 'warning';
      default: return 'default';
    }
  };
  
  // Obtener etiqueta de estado de solicitud
  const getApplicationStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobada';
      case 'REJECTED': return 'Rechazada';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };
  
  // Obtener color de estado de solicitud
  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };
  
  // Obtener icono de estado de solicitud
  const getApplicationStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <PendingIcon />;
      case 'APPROVED': return <CheckCircleIcon />;
      case 'REJECTED': return <CancelIcon />;
      case 'CANCELLED': return <CancelIcon />;
      default: return null;
    }
  };
  
  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
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
          Clientes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nuevo Cliente
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Identificación</TableCell>
                <TableCell>Estado Laboral</TableCell>
                <TableCell>Ingreso Mensual</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.length > 0 ? (
                clients
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((client) => (
                    <TableRow hover key={client.id}>
                      <TableCell>{`${client.first_name} ${client.last_name}`}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.identification}</TableCell>
                      <TableCell>
                        <Chip
                          label={getEmploymentStatusLabel(client.employment_status)}
                          color={getEmploymentStatusColor(client.employment_status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(client.monthly_income)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalles">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenDetailsDialog(client)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEditDialog(client)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {isAdmin() && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleOpenDeleteDialog(client)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay clientes disponibles. Cree un nuevo cliente para comenzar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={clients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
      
      {/* Diálogo para crear/editar cliente */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Crear Nuevo Cliente' : 'Editar Cliente'}
        </DialogTitle>
        <DialogContent>
          {formik.status?.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formik.status.error}
            </Alert>
          )}
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="first_name"
                  label="Nombre"
                  fullWidth
                  value={formik.values.first_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.first_name && Boolean(formik.errors.first_name)}
                  helperText={formik.touched.first_name && formik.errors.first_name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="last_name"
                  label="Apellido"
                  fullWidth
                  value={formik.values.last_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.last_name && Boolean(formik.errors.last_name)}
                  helperText={formik.touched.last_name && formik.errors.last_name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="Email"
                  fullWidth
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Teléfono"
                  fullWidth
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="identification"
                  label="Identificación"
                  fullWidth
                  value={formik.values.identification}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.identification && Boolean(formik.errors.identification)}
                  helperText={formik.touched.identification && formik.errors.identification}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="address"
                  label="Dirección"
                  fullWidth
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.address && Boolean(formik.errors.address)}
                  helperText={formik.touched.address && formik.errors.address}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="employment_status"
                  label="Estado Laboral"
                  select
                  fullWidth
                  value={formik.values.employment_status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.employment_status && Boolean(formik.errors.employment_status)}
                  helperText={formik.touched.employment_status && formik.errors.employment_status}
                >
                  <MenuItem value="EMPLOYED">Empleado</MenuItem>
                  <MenuItem value="SELF_EMPLOYED">Autónomo</MenuItem>
                  <MenuItem value="UNEMPLOYED">Desempleado</MenuItem>
                  <MenuItem value="RETIRED">Jubilado</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="monthly_income"
                  label="Ingreso Mensual"
                  fullWidth
                  type="number"
                  value={formik.values.monthly_income}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.monthly_income && Boolean(formik.errors.monthly_income)}
                  helperText={formik.touched.monthly_income && formik.errors.monthly_income}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="employment_years"
                  label="Años de Empleo"
                  fullWidth
                  type="number"
                  value={formik.values.employment_years}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.employment_years && Boolean(formik.errors.employment_years)}
                  helperText={formik.touched.employment_years && formik.errors.employment_years}
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
            ¿Está seguro de que desea eliminar al cliente "{clientToDelete?.first_name} {clientToDelete?.last_name}"? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDeleteClient} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de detalles del cliente */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles del Cliente: {selectedClient?.first_name} {selectedClient?.last_name}
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Tabs
                value={detailsTab}
                onChange={handleChangeDetailsTab}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab icon={<PersonIcon />} label="Información Personal" />
                <Tab icon={<AssignmentIcon />} label="Solicitudes de Crédito" />
                <Tab icon={<HistoryIcon />} label="Historial de Interacciones" />
              </Tabs>
              
              {/* Pestaña de Información Personal */}
              {detailsTab === 0 && clientDetails && (
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Información de Contacto
                          </Typography>
                          <List dense>
                            <ListItem>
                              <ListItemIcon>
                                <PersonIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary="Nombre Completo"
                                secondary={`${clientDetails.first_name} ${clientDetails.last_name}`}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <EmailIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary="Email"
                                secondary={clientDetails.email}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <PhoneIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary="Teléfono"
                                secondary={clientDetails.phone}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <PersonIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary="Identificación"
                                secondary={clientDetails.identification}
                              />
                            </ListItem>
                            {clientDetails.address && (
                              <ListItem>
                                <ListItemIcon>
                                  <PersonIcon />
                                </ListItemIcon>
                                <ListItemText
                                  primary="Dirección"
                                  secondary={clientDetails.address}
                                />
                              </ListItem>
                            )}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Información Financiera
                          </Typography>
                          <List dense>
                            <ListItem>
                              <ListItemIcon>
                                <PersonIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary="Estado Laboral"
                                secondary={
                                  <Chip
                                    label={getEmploymentStatusLabel(clientDetails.employment_status)}
                                    color={getEmploymentStatusColor(clientDetails.employment_status)}
                                    size="small"
                                  />
                                }
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <MoneyIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary="Ingreso Mensual"
                                secondary={formatCurrency(clientDetails.monthly_income)}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <PersonIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary="Años de Empleo"
                                secondary={clientDetails.employment_years}
                              />
                            </ListItem>
                            {clientDetails.credit_score && (
                              <ListItem>
                                <ListItemIcon>
                                  <MoneyIcon />
                                </ListItemIcon>
                                <ListItemText
                                  primary="Puntaje Crediticio"
                                  secondary={clientDetails.credit_score}
                                />
                              </ListItem>
                            )}
                            {clientDetails.pre_approved_amount && (
                              <ListItem>
                                <ListItemIcon>
                                  <MoneyIcon />
                                </ListItemIcon>
                                <ListItemText
                                  primary="Monto Pre-aprobado"
                                  secondary={formatCurrency(clientDetails.pre_approved_amount)}
                                />
                              </ListItem>
                            )}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Pestaña de Solicitudes de Crédito */}
              {detailsTab === 1 && clientDetails && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Solicitudes de Crédito
                  </Typography>
                  
                  {clientDetails.credit_applications && clientDetails.credit_applications.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Monto</TableCell>
                            <TableCell>Plazo</TableCell>
                            <TableCell>Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {clientDetails.credit_applications.map((application) => (
                            <TableRow key={application.id}>
                              <TableCell>{application.id}</TableCell>
                              <TableCell>{new Date(application.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>{formatCurrency(application.amount)}</TableCell>
                              <TableCell>{application.term} meses</TableCell>
                              <TableCell>
                                <Chip
                                  icon={getApplicationStatusIcon(application.status)}
                                  label={getApplicationStatusLabel(application.status)}
                                  color={getApplicationStatusColor(application.status)}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Este cliente no tiene solicitudes de crédito.
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* Pestaña de Historial de Interacciones */}
              {detailsTab === 2 && clientDetails && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Historial de Interacciones
                  </Typography>
                  
                  {clientDetails.interactions && clientDetails.interactions.length > 0 ? (
                    <List>
                      {clientDetails.interactions.map((interaction, index) => (
                        <React.Fragment key={interaction.id}>
                          {index > 0 && <Divider variant="inset" component="li" />}
                          <ListItem alignItems="flex-start">
                            <ListItemIcon>
                              {interaction.channel === 'WHATSAPP' ? (
                                <PhoneIcon color="primary" />
                              ) : interaction.channel === 'EMAIL' ? (
                                <EmailIcon color="primary" />
                              ) : (
                                <PhoneIcon color="primary" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2">
                                  {new Date(interaction.timestamp).toLocaleString()} - {interaction.agent_name}
                                </Typography>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography
                                    variant="body2"
                                    color="textPrimary"
                                    component="span"
                                  >
                                    {interaction.message}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                    component="div"
                                    sx={{ mt: 1 }}
                                  >
                                    Canal: {interaction.channel} | Campaña: {interaction.campaign_name || 'N/A'}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Este cliente no tiene interacciones registradas.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Cerrar</Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => handleOpenEditDialog(selectedClient)}
          >
            Editar Cliente
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Clients;