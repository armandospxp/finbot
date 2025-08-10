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
  FormHelperText,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Campaigns = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para el diálogo de creación/edición
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' o 'edit'
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'WHATSAPP',
    agent_id: '',
    template: '',
    target_audience: '',
    scheduled_start: null,
    status: 'DRAFT',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Estado para el diálogo de confirmación de eliminación
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  
  // Cargar campañas y agentes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar campañas
        const campaignsResponse = await axios.get('/api/campaigns');
        setCampaigns(campaignsResponse.data);
        
        // Cargar agentes activos
        const agentsResponse = await axios.get('/api/agents', {
          params: { status: 'ACTIVE' }
        });
        setAgents(agentsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar datos. Por favor, intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchData();
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
  
  // Abrir diálogo para crear campaña
  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      description: '',
      campaign_type: 'WHATSAPP',
      agent_id: '',
      template: '',
      target_audience: '',
      scheduled_start: null,
      status: 'DRAFT',
    });
    setFormErrors({});
    setOpenDialog(true);
  };
  
  // Abrir diálogo para editar campaña
  const handleOpenEditDialog = (campaign) => {
    setDialogMode('edit');
    setCurrentCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      campaign_type: campaign.campaign_type,
      agent_id: campaign.agent_id,
      template: campaign.template || '',
      target_audience: campaign.target_audience || '',
      scheduled_start: campaign.scheduled_start ? new Date(campaign.scheduled_start) : null,
      status: campaign.status,
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
  
  // Manejar cambio de fecha programada
  const handleDateChange = (newValue) => {
    setFormData({
      ...formData,
      scheduled_start: newValue,
    });
    
    // Limpiar error del campo
    if (formErrors.scheduled_start) {
      setFormErrors({
        ...formErrors,
        scheduled_start: null,
      });
    }
  };
  
  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }
    
    if (!formData.campaign_type) {
      errors.campaign_type = 'El tipo de campaña es requerido';
    }
    
    if (!formData.agent_id) {
      errors.agent_id = 'El agente es requerido';
    }
    
    if (!formData.template.trim()) {
      errors.template = 'La plantilla de mensaje es requerida';
    }
    
    if (!formData.target_audience.trim()) {
      errors.target_audience = 'La audiencia objetivo es requerida';
    } else {
      try {
        // Verificar que la audiencia objetivo sea un JSON válido
        JSON.parse(formData.target_audience);
      } catch (e) {
        errors.target_audience = 'La audiencia objetivo debe ser un JSON válido';
      }
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
      
      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        target_audience: JSON.parse(formData.target_audience),
      };
      
      if (dialogMode === 'create') {
        // Crear campaña
        const response = await axios.post('/api/campaigns', dataToSend);
        setCampaigns([...campaigns, response.data]);
      } else {
        // Actualizar campaña
        const response = await axios.put(`/api/campaigns/${currentCampaign.id}`, dataToSend);
        setCampaigns(campaigns.map(campaign => campaign.id === currentCampaign.id ? response.data : campaign));
      }
      
      setFormSubmitting(false);
      handleCloseDialog();
    } catch (err) {
      console.error('Error al guardar campaña:', err);
      setFormSubmitting(false);
      
      // Manejar errores de validación del servidor
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'object') {
          setFormErrors(err.response.data.detail);
        } else {
          setFormErrors({ general: err.response.data.detail });
        }
      } else {
        setFormErrors({ general: 'Error al guardar campaña. Por favor, intente nuevamente.' });
      }
    }
  };
  
  // Abrir diálogo de confirmación de eliminación
  const handleOpenDeleteDialog = (campaign) => {
    setCampaignToDelete(campaign);
    setOpenDeleteDialog(true);
  };
  
  // Cerrar diálogo de confirmación de eliminación
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setCampaignToDelete(null);
  };
  
  // Eliminar campaña
  const handleDeleteCampaign = async () => {
    try {
      await axios.delete(`/api/campaigns/${campaignToDelete.id}`);
      setCampaigns(campaigns.filter(campaign => campaign.id !== campaignToDelete.id));
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error al eliminar campaña:', err);
      setError('Error al eliminar campaña. Por favor, intente nuevamente.');
      handleCloseDeleteDialog();
    }
  };
  
  // Iniciar/detener campaña
  const handleToggleCampaignStatus = async (campaign) => {
    try {
      let endpoint;
      
      if (campaign.status === 'ACTIVE') {
        endpoint = `/api/campaigns/${campaign.id}/stop`;
      } else if (campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' || campaign.status === 'PAUSED') {
        endpoint = `/api/campaigns/${campaign.id}/start`;
      } else {
        return; // No hacer nada para campañas completadas o fallidas
      }
      
      const response = await axios.post(endpoint);
      setCampaigns(campaigns.map(c => c.id === campaign.id ? response.data : c));
    } catch (err) {
      console.error('Error al cambiar estado de la campaña:', err);
      setError('Error al cambiar estado de la campaña. Por favor, intente nuevamente.');
    }
  };
  
  // Ver detalles de la campaña
  const handleViewCampaign = (campaign) => {
    navigate(`/campaigns/${campaign.id}`);
  };
  
  // Obtener etiqueta de estado
  const getStatusLabel = (status) => {
    switch (status) {
      case 'DRAFT': return 'Borrador';
      case 'SCHEDULED': return 'Programada';
      case 'ACTIVE': return 'Activa';
      case 'PAUSED': return 'Pausada';
      case 'COMPLETED': return 'Completada';
      case 'FAILED': return 'Fallida';
      default: return status;
    }
  };
  
  // Obtener color de estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SCHEDULED': return 'info';
      case 'PAUSED': return 'warning';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      default: return 'default';
    }
  };
  
  // Obtener etiqueta de tipo de campaña
  const getCampaignTypeLabel = (type) => {
    switch (type) {
      case 'WHATSAPP': return 'WhatsApp';
      case 'EMAIL': return 'Email';
      case 'SMS': return 'SMS';
      default: return type;
    }
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
          Campañas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nueva Campaña
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
                <TableCell>Agente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Programada para</TableCell>
                <TableCell>Interacciones</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.length > 0 ? (
                campaigns
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((campaign) => {
                    const agent = agents.find(a => a.id === campaign.agent_id);
                    return (
                      <TableRow hover key={campaign.id}>
                        <TableCell>{campaign.name}</TableCell>
                        <TableCell>{getCampaignTypeLabel(campaign.campaign_type)}</TableCell>
                        <TableCell>{agent?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(campaign.status)}
                            color={getStatusColor(campaign.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {campaign.scheduled_start ? new Date(campaign.scheduled_start).toLocaleString() : 'No programada'}
                        </TableCell>
                        <TableCell>{campaign.interactions_count || 0}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver detalles">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleViewCampaign(campaign)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {campaign.status !== 'COMPLETED' && campaign.status !== 'FAILED' && (
                            <Tooltip title="Editar">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleOpenEditDialog(campaign)}
                                disabled={campaign.status === 'ACTIVE'}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {campaign.status !== 'COMPLETED' && campaign.status !== 'FAILED' && (
                            <Tooltip title={campaign.status === 'ACTIVE' ? 'Detener' : 'Iniciar'}>
                              <IconButton
                                color={campaign.status === 'ACTIVE' ? 'error' : 'success'}
                                size="small"
                                onClick={() => handleToggleCampaignStatus(campaign)}
                              >
                                {campaign.status === 'ACTIVE' ? <StopIcon /> : <PlayIcon />}
                              </IconButton>
                            </Tooltip>
                          )}
                          {isAdmin() && campaign.status !== 'ACTIVE' && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleOpenDeleteDialog(campaign)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay campañas disponibles. Cree una nueva campaña para comenzar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={campaigns.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
      
      {/* Diálogo para crear/editar campaña */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Crear Nueva Campaña' : 'Editar Campaña'}
        </DialogTitle>
        <DialogContent>
          {formErrors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.general}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.campaign_type}>
                <InputLabel>Tipo de Campaña</InputLabel>
                <Select
                  name="campaign_type"
                  value={formData.campaign_type}
                  onChange={handleFormChange}
                  label="Tipo de Campaña"
                >
                  <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                </Select>
                {formErrors.campaign_type && (
                  <FormHelperText error>{formErrors.campaign_type}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descripción"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={handleFormChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.agent_id}>
                <InputLabel>Agente</InputLabel>
                <Select
                  name="agent_id"
                  value={formData.agent_id}
                  onChange={handleFormChange}
                  label="Agente"
                >
                  {agents.map(agent => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.agent_id && (
                  <FormHelperText error>{formErrors.agent_id}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DateTimePicker
                  label="Programar Inicio"
                  value={formData.scheduled_start}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!formErrors.scheduled_start}
                      helperText={formErrors.scheduled_start}
                    />
                  )}
                  minDateTime={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="template"
                label="Plantilla de Mensaje"
                fullWidth
                multiline
                rows={4}
                value={formData.template}
                onChange={handleFormChange}
                error={!!formErrors.template}
                helperText={formErrors.template || 'Utilice {{variable}} para incluir variables dinámicas'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="target_audience"
                label="Audiencia Objetivo (JSON)"
                fullWidth
                multiline
                rows={4}
                value={formData.target_audience}
                onChange={handleFormChange}
                error={!!formErrors.target_audience}
                helperText={formErrors.target_audience || 'Formato: [{"phone": "+1234567890", "vars": {"nombre": "Juan", "monto": 5000}}]'}
              />
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
            ¿Está seguro de que desea eliminar la campaña "{campaignToDelete?.name}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDeleteCampaign} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Campaigns;