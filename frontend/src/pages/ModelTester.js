import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ModelTester = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const messagesEndRef = useRef(null);

  // Cargar agentes disponibles
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get('/api/agents');
        setAgents(response.data.filter(agent => agent.status === 'active'));
        setLoadingAgents(false);
      } catch (error) {
        console.error('Error al cargar agentes:', error);
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, []);

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleAgentChange = (event) => {
    setSelectedAgent(event.target.value);
    // Limpiar la conversación al cambiar de agente
    setConversation([]);
  };

  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedAgent) return;

    // Agregar mensaje del usuario a la conversación
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setConversation(prev => [...prev, userMessage]);
    setLoading(true);
    setMessage('');

    try {
      // Enviar mensaje al backend para procesamiento
      const response = await axios.post('/api/chat/test', {
        agent_id: selectedAgent,
        message: message.trim(),
      });

      // Agregar respuesta del agente a la conversación
      const agentMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };

      setConversation(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      // Agregar mensaje de error a la conversación
      const errorMessage = {
        role: 'system',
        content: 'Error al procesar el mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date().toISOString(),
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setConversation([]);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Probador de Modelo
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Simula conversaciones con agentes virtuales sin usar la API de Twilio
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuración
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="agent-select-label">Seleccionar Agente</InputLabel>
                <Select
                  labelId="agent-select-label"
                  id="agent-select"
                  value={selectedAgent}
                  label="Seleccionar Agente"
                  onChange={handleAgentChange}
                  disabled={loadingAgents}
                >
                  {loadingAgents ? (
                    <MenuItem value="">
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Cargando agentes...
                    </MenuItem>
                  ) : (
                    agents.map((agent) => (
                      <MenuItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={clearConversation}
                fullWidth
                sx={{ mb: 2 }}
              >
                Limpiar Conversación
              </Button>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
                Esta herramienta te permite probar las respuestas del modelo sin necesidad de usar
                la API de Twilio. Selecciona un agente y comienza a chatear para evaluar la calidad
                de las respuestas.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper
            elevation={3}
            sx={{
              height: '70vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
                backgroundColor: '#f5f5f5',
              }}
            >
              {conversation.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <BotIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6">
                    Selecciona un agente y comienza a chatear
                  </Typography>
                  <Typography variant="body2">
                    Las respuestas se generarán usando el modelo de IA configurado
                  </Typography>
                </Box>
              ) : (
                conversation.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    {msg.role !== 'user' && (
                      <Avatar
                        sx={{
                          bgcolor: msg.role === 'assistant' ? 'primary.main' : 'grey.500',
                          width: 32,
                          height: 32,
                          mr: 1,
                        }}
                      >
                        {msg.role === 'assistant' ? <BotIcon /> : 'S'}
                      </Avatar>
                    )}
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        borderRadius: 2,
                        backgroundColor:
                          msg.role === 'user'
                            ? 'primary.main'
                            : msg.role === 'system'
                            ? 'error.light'
                            : 'white',
                        color: msg.role === 'user' ? 'white' : 'text.primary',
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: 'right',
                          mt: 1,
                          opacity: 0.7,
                        }}
                      >
                        {formatTimestamp(msg.timestamp)}
                      </Typography>
                    </Paper>
                    {msg.role === 'user' && (
                      <Avatar
                        sx={{
                          bgcolor: 'secondary.main',
                          width: 32,
                          height: 32,
                          ml: 1,
                        }}
                      >
                        <PersonIcon />
                      </Avatar>
                    )}
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>

            <Box
              sx={{
                p: 2,
                backgroundColor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs>
                  <TextField
                    fullWidth
                    placeholder="Escribe un mensaje..."
                    variant="outlined"
                    value={message}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                    disabled={!selectedAgent || loading}
                    multiline
                    maxRows={4}
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                    onClick={handleSendMessage}
                    disabled={!selectedAgent || !message.trim() || loading}
                    sx={{ height: '100%' }}
                  >
                    Enviar
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModelTester;