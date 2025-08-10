import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  CreditCard as CreditCardIcon,
  History as HistoryIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  
  // Cargar datos del cliente
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/clients/${id}`);
        setClient(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos del cliente:', err);
        setError('No se pudo cargar la información del cliente. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientData();
  }, [id]);
  
  // Cargar datos adicionales según la pestaña seleccionada
  useEffect(() => {
    if (tabValue === 1 && client) {
      fetchApplications();
    } else if (tabValue === 2 && client) {
      fetchInteractions();
    }
  }, [tabValue, client]);
  
  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true);
      const response = await axios.get(`/api/clients/${id}/applications`);
      setApplications(response.data);
    } catch (err) {
      console.error('Error al cargar solicitudes de crédito:', err);
    } finally {
      setApplicationsLoading(false);
    }
  };
  
  const fetchInteractions = async () => {
    try {
      setInteractionsLoading(true);
      const response = await axios.get(`/api/clients/${id}/interactions`);
      setInteractions(response.data);
    } catch (err) {
      console.error('Error al cargar interacciones:', err);
    } finally {
      setInteractionsLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/clients')}
          sx={{ mt: 2 }}
        >
          Volver a Clientes
        </Button>
      </Container>
    );
  }
  
  if (!client) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 3 }}>Cliente no encontrado</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/clients')}
          sx={{ mt: 2 }}
        >
          Volver a Clientes
        </Button>
      </Container>
    );
  }
  
  // Función para formatear el estado de la solicitud
  const getStatusChip = (status) => {
    let color, icon;
    
    switch (status) {
      case 'approved':
        color = 'success';
        icon = <CheckCircleIcon />;
        break;
      case 'rejected':
        color = 'error';
        icon = <CancelIcon />;
        break;
      case 'pending':
        color = 'warning';
        icon = <AccessTimeIcon />;
        break;
      default:
        color = 'default';
        icon = <AccessTimeIcon />;
    }
    
    return (
      <Chip 
        icon={icon}
        label={status === 'approved' ? 'Aprobado' : 
               status === 'rejected' ? 'Rechazado' : 
               status === 'pending' ? 'Pendiente' : status}
        color={color}
        size="small"
      />
    );
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/clients')}
        sx={{ mb: 2 }}
      >
        Volver a Clientes
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {client.first_name} {client.last_name}
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/clients/edit/${id}`)}
              sx={{ mr: 1 }}
            >
              Editar
            </Button>
            {isAdmin() && (
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (window.confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
                    // Lógica para eliminar cliente
                    axios.delete(`/api/clients/${id}`)
                      .then(() => navigate('/clients'))
                      .catch(err => console.error('Error al eliminar cliente:', err));
                  }
                }}
              >
                Eliminar
              </Button>
            )}
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Información Personal" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {client.first_name} {client.last_name}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {client.email}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {client.phone}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {client.whatsapp && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WhatsAppIcon sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="body1">
                          {client.whatsapp}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {client.address && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">
                          {client.address}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Información Financiera" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Ingresos mensuales:</Typography>
                    <Typography variant="body1">
                      ${client.monthly_income ? client.monthly_income.toLocaleString() : 'No especificado'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Puntaje crediticio:</Typography>
                    <Typography variant="body1">
                      {client.credit_score || 'No especificado'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Empleador:</Typography>
                    <Typography variant="body1">
                      {client.employer || 'No especificado'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Ocupación:</Typography>
                    <Typography variant="body1">
                      {client.occupation || 'No especificado'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Notas:</Typography>
                    <Typography variant="body1">
                      {client.notes || 'Sin notas'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab icon={<PersonIcon />} label="Resumen" />
          <Tab icon={<CreditCardIcon />} label="Solicitudes de Crédito" />
          <Tab icon={<HistoryIcon />} label="Historial de Interacciones" />
        </Tabs>
        
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Resumen del Cliente</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Actividad Reciente" />
                  <Divider />
                  <CardContent>
                    {client.recent_activity && client.recent_activity.length > 0 ? (
                      <List>
                        {client.recent_activity.slice(0, 5).map((activity, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              {activity.type === 'application' ? <CreditCardIcon /> : 
                               activity.type === 'interaction' ? <HistoryIcon /> : 
                               <PersonIcon />}
                            </ListItemIcon>
                            <ListItemText
                              primary={activity.description}
                              secondary={new Date(activity.timestamp).toLocaleString()}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2">No hay actividad reciente registrada.</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Estadísticas" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Total solicitudes:</Typography>
                        <Typography variant="h6">{client.stats?.total_applications || 0}</Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Solicitudes aprobadas:</Typography>
                        <Typography variant="h6">{client.stats?.approved_applications || 0}</Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Total interacciones:</Typography>
                        <Typography variant="h6">{client.stats?.total_interactions || 0}</Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Cliente desde:</Typography>
                        <Typography variant="h6">
                          {new Date(client.created_at).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Solicitudes de Crédito</Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate(`/applications/new?client_id=${id}`)}
              >
                Nueva Solicitud
              </Button>
            </Box>
            
            {applicationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : applications.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Tipo de Préstamo</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Plazo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>{application.id}</TableCell>
                        <TableCell>{application.loan_type}</TableCell>
                        <TableCell>${application.amount.toLocaleString()}</TableCell>
                        <TableCell>{application.term} meses</TableCell>
                        <TableCell>{getStatusChip(application.status)}</TableCell>
                        <TableCell>{new Date(application.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Tooltip title="Ver detalles">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/applications/${application.id}`)}
                            >
                              <CreditCardIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No hay solicitudes de crédito registradas para este cliente.</Alert>
            )}
          </Box>
        )}
        
        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Historial de Interacciones</Typography>
            
            {interactionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : interactions.length > 0 ? (
              <List>
                {interactions.map((interaction) => (
                  <Paper key={interaction.id} sx={{ mb: 2 }}>
                    <ListItem>
                      <ListItemIcon>
                        {interaction.channel === 'whatsapp' ? <WhatsAppIcon color="success" /> :
                         interaction.channel === 'email' ? <EmailIcon color="info" /> :
                         interaction.channel === 'sms' ? <PhoneIcon color="primary" /> :
                         <HistoryIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {interaction.channel === 'whatsapp' ? 'WhatsApp' :
                             interaction.channel === 'email' ? 'Email' :
                             interaction.channel === 'sms' ? 'SMS' :
                             interaction.channel}
                            {interaction.agent_name && ` - Agente: ${interaction.agent_name}`}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {new Date(interaction.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {interaction.content}
                            </Typography>
                            {interaction.response && (
                              <Typography variant="body2" sx={{ mt: 1, pl: 2, borderLeft: '2px solid #1976d2' }}>
                                <strong>Respuesta:</strong> {interaction.response}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            ) : (
              <Alert severity="info">No hay interacciones registradas para este cliente.</Alert>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ClientDetail;