import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Agents = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para el diálogo de creación/edición
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' o 'edit'
  const [currentAgent, setCurrentAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agent_type: 'credit_sales',
    max_interactions: 100,
    status: 'INACTIVE',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Estado para el diálogo de confirmación de eliminación
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState(null);
  
  // Cargar agentes
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/agents');
        setAgents(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar agentes:', err);
        setError('Error al cargar agentes. Por favor, intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchAgents();
  }, []);
  
  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Abrir diálogo para crear agente
  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      description: '',
      agent_type: 'credit_sales',
      max_interactions: 100,
      status: 'INACTIVE',
    });
    setFormErrors({});
    setOpenDialog(true);
  };
  
  // Abrir diálogo para editar agente
  const handleOpenEditDialog = (agent) => {
    setDialogMode('edit');
    setCurrentAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description || '',
      agent_type: agent.agent_type,
      max_interactions: agent.max_interactions,
      status: agent.status,
    });
    setFormErrors({});
    setOpenDialog(true);
  };
  
  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };
  
  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }
    
    if (!formData.agent_type) {
      errors.agent_type = 'El tipo de agente es requerido';
    }
    
    if (formData.max_interactions <= 0) {
      errors.max_interactions = 'El número máximo de interacciones debe ser mayor a 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Enviar formulario
  const handleSubmitForm = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setFormSubmitting(true);
      
      if (dialogMode === 'create') {
        // Crear agente
        const response = await axios.post('/api/agents', formData);
        setAgents([...agents, response.data]);
      } else {
        // Actualizar agente
        const response = await axios.put(`/api/agents/${currentAgent.id}`, formData);
        setAgents(agents.map(agent => agent.id === currentAgent.id ? response.data : agent));
      }
      
      setFormSubmitting(false);
      handleCloseDialog();
    } catch (err) {
      console.error('Error al guardar agente:', err);
      setFormSubmitting(false);
      
      // Manejar errores de validación del servidor
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'object') {
          setFormErrors(err.response.data.detail);
        } else {
          setFormErrors({ general: err.response.data.detail });
        }
      } else {
        setFormErrors({ general: 'Error al guardar agente. Por favor, intente nuevamente.' });
      }
    }
  };
  
  // Abrir diálogo de confirmación de eliminación
  const handleOpenDeleteDialog = (agent) => {
    setAgentToDelete(agent);
    setOpenDeleteDialog(true);
  };
  
  // Cerrar diálogo de confirmación de eliminación
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setAgentToDelete(null);
  };
  
  // Eliminar agente
  const handleDeleteAgent = async () => {
    try {
      await axios.delete(`/api/agents/${agentToDelete.id}`);
      setAgents(agents.filter(agent => agent.id !== agentToDelete.id));
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error al eliminar agente:', err);
      setError('Error al eliminar agente. Por favor, intente nuevamente.');
      handleCloseDeleteDialog();
    }
  };
  
  // Activar/desactivar agente
  const handleToggleAgentStatus = async (agent) => {
    try {
      const newStatus = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const endpoint = newStatus === 'ACTIVE' ? `/api/agents/${agent.id}/activate` : `/api/agents/${agent.id}/deactivate`;
      
      const response = await axios.post(endpoint);
      setAgents(agents.map(a => a.id === agent.id ? response.data : a));
    } catch (err) {
      console.error('Error al cambiar estado del agente:', err);
      setError('Error al cambiar estado del agente. Por favor, intente nuevamente.');
    }
  };
  
  // Ver detalles del agente
  const handleViewAgent = (agent) => {
    navigate(`/agents/${agent.id}`);
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
          Agentes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nuevo Agente
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
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Interacciones</TableCell>
                <TableCell>Préstamos Aprobados</TableCell>
                <TableCell>Tasa de Conversión</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agents.length > 0 ? (
                agents
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((agent) => (
                    <TableRow hover key={agent.id}>
                      <TableCell>{agent.name}</TableCell>
                      <TableCell>
                        {agent.agent_type === 'credit_sales' ? 'Ventas de Crédito' : agent.agent_type}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={agent.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                          color={agent.status === 'ACTIVE' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{agent.performance?.interactions_count || 0}</TableCell>
                      <TableCell>{agent.performance?.approved_loans_count || 0}</TableCell>
                      <TableCell>
                        {agent.performance?.conversion_rate ? `${(agent.performance.conversion_rate * 100).toFixed(1)}%` : '0%'}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalles">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewAgent(agent)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEditDialog(agent)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={agent.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}>
                          <IconButton
                            color={agent.status === 'ACTIVE' ? 'error' : 'success'}
                            size="small"
                            onClick={() => handleToggleAgentStatus(agent)}
                          >
                            {agent.status === 'ACTIVE' ? <StopIcon /> : <PlayIcon />}
                          </IconButton>
                        </Tooltip>
                        {isAdmin() && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleOpenDeleteDialog(agent)}
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
                    No hay agentes disponibles. Cree un nuevo agente para comenzar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={agents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
      
      {/* Diálogo para crear/editar agente */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Crear Nuevo Agente' : 'Editar Agente'}
        </DialogTitle>
        <DialogContent>
          {formErrors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.general}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Nombre"
                fullWidth
                value={formData.name}
                onChange={handleFormChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descripción"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={handleFormChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.agent_type}>
                <InputLabel>Tipo de Agente</InputLabel>
                <Select
                  name="agent_type"
                  value={formData.agent_type}
                  onChange={handleFormChange}
                  label="Tipo de Agente"
                >
                  <MenuItem value="credit_sales">Ventas de Crédito</MenuItem>
                  <MenuItem value="customer_support">Atención al Cliente</MenuItem>
                </Select>
                {formErrors.agent_type && (
                  <Typography variant="caption" color="error">
                    {formErrors.agent_type}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="max_interactions"
                label="Máximo de Interacciones"
                type="number"
                fullWidth
                value={formData.max_interactions}
                onChange={handleFormChange}
                error={!!formErrors.max_interactions}
                helperText={formErrors.max_interactions}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.status}>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Estado"
                >
                  <MenuItem value="ACTIVE">Activo</MenuItem>
                  <MenuItem value="INACTIVE">Inactivo</MenuItem>
                </Select>
                {formErrors.status && (
                  <Typography variant="caption" color="error">
                    {formErrors.status}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmitForm}
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
          <DialogContentText>
            ¿Está seguro de que desea eliminar el agente "{agentToDelete?.name}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDeleteAgent} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Agents;