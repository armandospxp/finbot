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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Campaign as CampaignIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Componente para mostrar el icono del canal de comunicación
const ChannelIcon = ({ channel }) => {
  switch (channel) {
    case 'whatsapp':
      return <WhatsAppIcon color="success" />;
    case 'email':
      return <EmailIcon color="info" />;
    case 'sms':
      return <SmsIcon color="primary" />;
    default:
      return null;
  }
};

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Cargar datos de la campaña
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/campaigns/${id}`);
        setCampaign(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos de la campaña:', err);
        setError('No se pudo cargar la información de la campaña. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaignData();
  }, [id]);
  
  // Cargar destinatarios cuando se selecciona la pestaña de destinatarios
  useEffect(() => {
    if (tabValue === 1 && campaign) {
      fetchRecipients();
    } else if (tabValue === 2 && campaign) {
      fetchStats();
    }
  }, [tabValue, campaign]);
  
  const fetchRecipients = async () => {
    try {
      setRecipientsLoading(true);
      const response = await axios.get(`/api/campaigns/${id}/recipients`);
      setRecipients(response.data);
    } catch (err) {
      console.error('Error al cargar destinatarios:', err);
    } finally {
      setRecipientsLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get(`/api/campaigns/${id}/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    } finally {
      setStatsLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleToggleStatus = async () => {
    try {
      const newStatus = !campaign.is_active;
      await axios.patch(`/api/campaigns/${id}`, { is_active: newStatus });
      setCampaign({ ...campaign, is_active: newStatus });
    } catch (err) {
      console.error('Error al cambiar estado de la campaña:', err);
      setError('No se pudo cambiar el estado de la campaña. Por favor, intente nuevamente.');
    }
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
          onClick={() => navigate('/campaigns')}
          sx={{ mt: 2 }}
        >
          Volver a Campañas
        </Button>
      </Container>
    );
  }
  
  if (!campaign) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 3 }}>Campaña no encontrada</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/campaigns')}
          sx={{ mt: 2 }}
        >
          Volver a Campañas
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/campaigns')}
        sx={{ mb: 2 }}
      >
        Volver a Campañas
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {campaign.name}
          </Typography>
          <Box>
            <Chip 
              label={campaign.status} 
              color={
                campaign.status === 'completed' ? 'success' : 
                campaign.status === 'scheduled' ? 'info' : 
                campaign.status === 'in_progress' ? 'warning' : 
                campaign.status === 'failed' ? 'error' : 'default'
              }
              sx={{ mr: 1 }}
            />
            {campaign.status !== 'completed' && campaign.status !== 'failed' && (
              <Button 
                variant="outlined" 
                color={campaign.is_active ? 'error' : 'success'}
                onClick={handleToggleStatus}
              >
                {campaign.is_active ? 'Desactivar' : 'Activar'}
              </Button>
            )}
          </Box>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {campaign.description}
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Información de la Campaña" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Tipo:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{campaign.campaign_type}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Canal:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ChannelIcon channel={campaign.channel} />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {campaign.channel === 'whatsapp' ? 'WhatsApp' : 
                         campaign.channel === 'email' ? 'Email' : 
                         campaign.channel === 'sms' ? 'SMS' : campaign.channel}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Programada para:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : 'No programada'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Creada:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Última actualización:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {new Date(campaign.updated_at).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Estadísticas Rápidas" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Total destinatarios:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{campaign.total_recipients || 0}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Mensajes enviados:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{campaign.messages_sent || 0}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Tasa de entrega:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {campaign.delivery_rate ? `${campaign.delivery_rate}%` : 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Tasa de respuesta:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {campaign.response_rate ? `${campaign.response_rate}%` : 'N/A'}
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
          <Tab icon={<SettingsIcon />} label="Configuración" />
          <Tab icon={<GroupIcon />} label="Destinatarios" />
          <Tab icon={<AssessmentIcon />} label="Estadísticas Detalladas" />
        </Tabs>
        
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Configuración de la Campaña</Typography>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardHeader title="Plantilla de Mensaje" />
              <Divider />
              <CardContent>
                <Typography variant="body2" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  backgroundColor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1 
                }}>
                  {campaign.message_template}
                </Typography>
              </CardContent>
            </Card>
            
            {campaign.agent_id && (
              <Card variant="outlined">
                <CardHeader title="Agente Asociado" />
                <Divider />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CampaignIcon sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {campaign.agent_name || `Agente ID: ${campaign.agent_id}`}
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => navigate(`/agents/${campaign.agent_id}`)}
                  >
                    Ver Agente
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
        
        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Destinatarios de la Campaña</Typography>
            
            {recipientsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : recipients.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Contacto</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Enviado</TableCell>
                      <TableCell>Respuesta</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recipients.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell>
                          <Button 
                            variant="text" 
                            onClick={() => navigate(`/clients/${recipient.client_id}`)}
                          >
                            {recipient.client_name}
                          </Button>
                        </TableCell>
                        <TableCell>{recipient.contact_info}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small"
                            label={recipient.status}
                            color={
                              recipient.status === 'delivered' ? 'success' : 
                              recipient.status === 'failed' ? 'error' : 
                              recipient.status === 'pending' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {recipient.sent_at ? new Date(recipient.sent_at).toLocaleString() : 'No enviado'}
                        </TableCell>
                        <TableCell>
                          {recipient.has_response ? (
                            <Chip size="small" icon={<CheckCircleIcon />} label="Respondido" color="success" />
                          ) : (
                            <Chip size="small" label="Sin respuesta" variant="outlined" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No hay destinatarios registrados para esta campaña.</Alert>
            )}
          </Box>
        )}
        
        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Estadísticas Detalladas</Typography>
            
            {statsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : stats ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="Rendimiento de Entrega" />
                    <Divider />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Enviados:</Typography>
                          <Typography variant="h6">{stats.sent}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Entregados:</Typography>
                          <Typography variant="h6">{stats.delivered}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Fallidos:</Typography>
                          <Typography variant="h6">{stats.failed}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Pendientes:</Typography>
                          <Typography variant="h6">{stats.pending}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2">Tasa de entrega:</Typography>
                          <Typography variant="h6">
                            {stats.delivery_rate ? `${stats.delivery_rate}%` : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="Interacción" />
                    <Divider />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Respuestas:</Typography>
                          <Typography variant="h6">{stats.responses}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Tasa de respuesta:</Typography>
                          <Typography variant="h6">
                            {stats.response_rate ? `${stats.response_rate}%` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Conversiones:</Typography>
                          <Typography variant="h6">{stats.conversions || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Tasa de conversión:</Typography>
                          <Typography variant="h6">
                            {stats.conversion_rate ? `${stats.conversion_rate}%` : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                {stats.timeline && stats.timeline.length > 0 && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardHeader title="Cronología de Actividad" />
                      <Divider />
                      <CardContent>
                        <List>
                          {stats.timeline.map((event, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                {event.type === 'start' ? <CampaignIcon color="primary" /> :
                                 event.type === 'complete' ? <CheckCircleIcon color="success" /> :
                                 event.type === 'error' ? <ErrorIcon color="error" /> :
                                 <AccessTimeIcon />}
                              </ListItemIcon>
                              <ListItemText
                                primary={event.description}
                                secondary={new Date(event.timestamp).toLocaleString()}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Alert severity="info">No hay estadísticas disponibles para esta campaña.</Alert>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CampaignDetail;