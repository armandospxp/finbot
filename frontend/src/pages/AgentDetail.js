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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  
  // Cargar datos del agente
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/agents/${id}`);
        setAgent(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos del agente:', err);
        setError('No se pudo cargar la información del agente. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgentData();
  }, [id]);
  
  // Cargar conversaciones cuando se selecciona la pestaña de historial
  useEffect(() => {
    if (tabValue === 1) {
      fetchConversations();
    }
  }, [tabValue]);
  
  const fetchConversations = async () => {
    try {
      setConversationsLoading(true);
      const response = await axios.get(`/api/agents/${id}/conversations`);
      setConversations(response.data);
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
    } finally {
      setConversationsLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleToggleStatus = async () => {
    try {
      const newStatus = !agent.is_active;
      await axios.patch(`/api/agents/${id}`, { is_active: newStatus });
      setAgent({ ...agent, is_active: newStatus });
    } catch (err) {
      console.error('Error al cambiar estado del agente:', err);
      setError('No se pudo cambiar el estado del agente. Por favor, intente nuevamente.');
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
          onClick={() => navigate('/agents')}
          sx={{ mt: 2 }}
        >
          Volver a Agentes
        </Button>
      </Container>
    );
  }
  
  if (!agent) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 3 }}>Agente no encontrado</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/agents')}
          sx={{ mt: 2 }}
        >
          Volver a Agentes
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/agents')}
        sx={{ mb: 2 }}
      >
        Volver a Agentes
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {agent.name}
          </Typography>
          <Box>
            <Chip 
              label={agent.is_active ? 'Activo' : 'Inactivo'} 
              color={agent.is_active ? 'success' : 'default'}
              sx={{ mr: 1 }}
            />
            <Button 
              variant="outlined" 
              color={agent.is_active ? 'error' : 'success'}
              onClick={handleToggleStatus}
            >
              {agent.is_active ? 'Desactivar' : 'Activar'}
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {agent.description}
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Información del Agente" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Tipo:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{agent.agent_type}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Creado:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Última actualización:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {new Date(agent.updated_at).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Estadísticas" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Total interacciones:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{agent.stats?.total_interactions || 0}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Conversaciones exitosas:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{agent.stats?.successful_conversations || 0}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Tasa de conversión:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {agent.stats?.conversion_rate ? `${agent.stats.conversion_rate}%` : 'N/A'}
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
          <Tab icon={<HistoryIcon />} label="Historial de Conversaciones" />
        </Tabs>
        
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Configuración del Agente</Typography>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardHeader title="Prompt del Sistema" />
              <Divider />
              <CardContent>
                <Typography variant="body2" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  backgroundColor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1 
                }}>
                  {agent.system_prompt}
                </Typography>
              </CardContent>
            </Card>
            
            <Typography variant="h6" gutterBottom>Herramientas Disponibles</Typography>
            <Grid container spacing={2}>
              {agent.tools && agent.tools.map((tool, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardHeader title={tool.name} />
                    <Divider />
                    <CardContent>
                      <Typography variant="body2" paragraph>
                        {tool.description}
                      </Typography>
                      {tool.parameters && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>Parámetros:</Typography>
                          <Typography variant="body2" component="pre" sx={{ 
                            whiteSpace: 'pre-wrap', 
                            backgroundColor: 'grey.100', 
                            p: 1, 
                            borderRadius: 1,
                            fontSize: '0.8rem'
                          }}>
                            {JSON.stringify(tool.parameters, null, 2)}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        
        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Historial de Conversaciones</Typography>
            
            {conversationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : conversations.length > 0 ? (
              <List>
                {conversations.map((conversation) => (
                  <Paper key={conversation.id} sx={{ mb: 2 }}>
                    <ListItem 
                      secondaryAction={
                        <Chip 
                          icon={conversation.status === 'completed' ? <CheckCircleIcon /> : 
                                conversation.status === 'failed' ? <ErrorIcon /> : <AccessTimeIcon />}
                          label={conversation.status}
                          color={conversation.status === 'completed' ? 'success' : 
                                conversation.status === 'failed' ? 'error' : 'default'}
                        />
                      }
                    >
                      <ListItemIcon>
                        <ChatIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Conversación #${conversation.id}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              Cliente: {conversation.client_name || 'No especificado'}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              Fecha: {new Date(conversation.created_at).toLocaleString()}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              Mensajes: {conversation.message_count || 0}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            ) : (
              <Alert severity="info">No hay conversaciones registradas para este agente.</Alert>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AgentDetail;