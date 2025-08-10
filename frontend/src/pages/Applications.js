import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import { SearchBarWithFilters } from '../components/common/SearchBar';
import AlertMessage from '../components/common/AlertMessage';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { LoadingContainer } from '../components/common/LoadingOverlay';

/**
 * Componente de página de aplicaciones de crédito
 */
const Applications = () => {
  const navigate = useNavigate();
  const { isAdmin } = useContext(AuthContext);
  
  // Estados
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);

  // Cargar aplicaciones
  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await axios.get('/api/applications', { params });
      setApplications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar aplicaciones:', error);
      setAlert({
        open: true,
        message: 'Error al cargar las aplicaciones. Por favor, intente nuevamente.',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  // Manejar menú de acciones
  const handleMenuOpen = (event, application) => {
    setAnchorEl(event.currentTarget);
    setSelectedApplication(application);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Manejar eliminación
  const handleDeleteClick = () => {
    handleMenuClose();
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar la solicitud #${selectedApplication.id}?`,
      action: handleDeleteConfirm,
      type: 'error',
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/applications/${selectedApplication.id}`);
      setConfirmDialog({ ...confirmDialog, open: false });
      setAlert({
        open: true,
        message: 'Solicitud eliminada correctamente',
        severity: 'success',
      });
      fetchApplications();
    } catch (error) {
      console.error('Error al eliminar la solicitud:', error);
      setConfirmDialog({ ...confirmDialog, open: false });
      setAlert({
        open: true,
        message: 'Error al eliminar la solicitud. Por favor, intente nuevamente.',
        severity: 'error',
      });
    }
  };

  // Manejar revisión de solicitud
  const handleReviewClick = () => {
    handleMenuClose();
    setOpenReviewDialog(true);
  };

  const handleReviewSubmit = async (values) => {
    try {
      await axios.put(`/api/applications/${selectedApplication.id}/review`, values);
      setOpenReviewDialog(false);
      setAlert({
        open: true,
        message: `Solicitud ${values.status === 'approved' ? 'aprobada' : 'rechazada'} correctamente`,
        severity: 'success',
      });
      fetchApplications();
    } catch (error) {
      console.error('Error al revisar la solicitud:', error);
      setAlert({
        open: true,
        message: 'Error al procesar la solicitud. Por favor, intente nuevamente.',
        severity: 'error',
      });
    }
  };

  // Esquema de validación para revisión
  const reviewValidationSchema = Yup.object({
    status: Yup.string().required('El estado es requerido'),
    comments: Yup.string().required('Los comentarios son requeridos'),
  });

  // Filtrar aplicaciones por término de búsqueda
  const filteredApplications = applications.filter((application) => {
    const searchFields = [
      application.id.toString(),
      application.client?.firstName,
      application.client?.lastName,
      application.client?.email,
      application.loanAmount?.toString(),
      application.status,
    ];
    
    return searchFields.some(
      (field) => field && field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Columnas para la tabla
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'client',
      headerName: 'Cliente',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">
            {params.client?.firstName} {params.client?.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.client?.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'loanAmount',
      headerName: 'Monto',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          ${params.loanAmount?.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'term',
      headerName: 'Plazo',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.term} {params.term === 1 ? 'mes' : 'meses'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 150,
      renderCell: (params) => {
        let color = 'default';
        let label = 'Desconocido';
        
        switch (params.status?.toLowerCase()) {
          case 'pending':
            color = 'warning';
            label = 'Pendiente';
            break;
          case 'approved':
            color = 'success';
            label = 'Aprobada';
            break;
          case 'rejected':
            color = 'error';
            label = 'Rechazada';
            break;
          case 'review':
            color = 'info';
            label = 'En revisión';
            break;
          default:
            break;
        }
        
        return <Chip label={label} color={color} size="small" />;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Fecha',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.createdAt).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Acciones">
            <IconButton
              size="small"
              onClick={(event) => handleMenuOpen(event, params)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <LoadingContainer loading={loading}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Solicitudes de Crédito
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/applications/new')}
          >
            Nueva Solicitud
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <SearchBarWithFilters
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por ID, cliente, monto..."
            filters={
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="status-filter-label">Estado</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="pending">Pendientes</MenuItem>
                  <MenuItem value="review">En revisión</MenuItem>
                  <MenuItem value="approved">Aprobadas</MenuItem>
                  <MenuItem value="rejected">Rechazadas</MenuItem>
                </Select>
              </FormControl>
            }
          />

          <DataTable
            columns={columns}
            data={filteredApplications}
            loading={loading}
            onRowClick={(row) => navigate(`/applications/${row.id}`)}
            emptyMessage="No hay solicitudes de crédito que coincidan con los criterios de búsqueda"
          />
        </Paper>

        {/* Menú de acciones */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            handleMenuClose();
            navigate(`/applications/${selectedApplication?.id}`);
          }}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver detalles</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            handleMenuClose();
            navigate(`/applications/${selectedApplication?.id}/edit`);
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          {selectedApplication?.status === 'pending' && (
            <MenuItem onClick={handleReviewClick}>
              <ListItemIcon>
                <AssignmentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Revisar</ListItemText>
            </MenuItem>
          )}
          {isAdmin && (
            <MenuItem onClick={handleDeleteClick}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Eliminar</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Diálogo de revisión */}
        <Dialog open={openReviewDialog} onClose={() => setOpenReviewDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Revisar Solicitud #{selectedApplication?.id}</DialogTitle>
          <Formik
            initialValues={{
              status: '',
              comments: '',
            }}
            validationSchema={reviewValidationSchema}
            onSubmit={handleReviewSubmit}
          >
            {({ errors, touched, values, handleChange }) => (
              <Form>
                <DialogContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth error={touched.status && Boolean(errors.status)}>
                        <InputLabel>Decisión</InputLabel>
                        <Select
                          name="status"
                          value={values.status}
                          onChange={handleChange}
                          label="Decisión"
                        >
                          <MenuItem value="approved">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ApproveIcon color="success" sx={{ mr: 1 }} />
                              Aprobar
                            </Box>
                          </MenuItem>
                          <MenuItem value="rejected">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <RejectIcon color="error" sx={{ mr: 1 }} />
                              Rechazar
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        name="comments"
                        label="Comentarios"
                        multiline
                        rows={4}
                        fullWidth
                        error={touched.comments && Boolean(errors.comments)}
                        helperText={touched.comments && errors.comments}
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenReviewDialog(false)}>Cancelar</Button>
                  <Button type="submit" variant="contained" color="primary">
                    Guardar
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </Dialog>

        {/* Diálogo de confirmación */}
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.action}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
          type={confirmDialog.type}
        />

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

export default Applications;