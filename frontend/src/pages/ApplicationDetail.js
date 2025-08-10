import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LoadingContainer } from '../components/common/LoadingOverlay';
import AlertMessage from '../components/common/AlertMessage';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TabsComponent from '../components/common/TabPanel';
import InfoCard from '../components/common/InfoCard';

/**
 * Componente de página de detalle de una aplicación de crédito
 */
const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useContext(AuthContext);
  
  // Estados
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });
  const [openReviewDialog, setOpenReviewDialog] = useState(false);

  // Cargar datos de la aplicación
  useEffect(() => {
    fetchApplicationData();
  }, [id]);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/applications/${id}`);
      setApplication(response.data);
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

  // Manejar eliminación
  const handleDeleteClick = () => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar la solicitud #${id}?`,
      action: handleDeleteConfirm,
      type: 'error',
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/applications/${id}`);
      setConfirmDialog({ ...confirmDialog, open: false });
      setAlert({
        open: true,
        message: 'Solicitud eliminada correctamente',
        severity: 'success',
      });
      // Redirigir a la lista de aplicaciones después de eliminar
      setTimeout(() => navigate('/applications'), 1500);
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
    setOpenReviewDialog(true);
  };

  const handleReviewSubmit = async (values) => {
    try {
      await axios.put(`/api/applications/${id}/review`, values);
      setOpenReviewDialog(false);
      setAlert({
        open: true,
        message: `Solicitud ${values.status === 'approved' ? 'aprobada' : 'rechazada'} correctamente`,
        severity: 'success',
      });
      fetchApplicationData();
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

  // Función para obtener el color del chip de estado
  const getStatusChip = (status) => {
    let color = 'default';
    let label = 'Desconocido';
    
    switch (status?.toLowerCase()) {
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
  };

  // Renderizar historial de actividad
  const renderActivityHistory = () => {
    if (!application?.activityHistory || application.activityHistory.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay actividad registrada para esta solicitud.
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {application.activityHistory.map((activity, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={
                  <Typography variant="subtitle2">
                    {activity.action}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {activity.comments}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(activity.timestamp).toLocaleString()} - {activity.user}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            {index < application.activityHistory.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  // Renderizar documentos
  const renderDocuments = () => {
    if (!application?.documents || application.documents.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay documentos adjuntos a esta solicitud.
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {application.documents.map((document, index) => (
          <React.Fragment key={index}>
            <ListItem
              alignItems="flex-start"
              button
              onClick={() => window.open(document.url, '_blank')}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle2">
                    {document.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Subido el {new Date(document.uploadDate).toLocaleDateString()}
                  </Typography>
                }
              />
            </ListItem>
            {index < application.documents.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  // Renderizar información del préstamo
  const renderLoanDetails = () => {
    if (!application) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <InfoCard
            title="Detalles del Préstamo"
            icon={<MoneyIcon color="primary" />}
            content={
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Monto solicitado</Typography>
                  <Typography variant="body1">${application.loanAmount?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Plazo</Typography>
                  <Typography variant="body1">{application.term} {application.term === 1 ? 'mes' : 'meses'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Tasa de interés</Typography>
                  <Typography variant="body1">{application.interestRate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Cuota mensual</Typography>
                  <Typography variant="body1">${application.monthlyPayment?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Propósito del préstamo</Typography>
                  <Typography variant="body1">{application.purpose || 'No especificado'}</Typography>
                </Grid>
              </Grid>
            }
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <InfoCard
            title="Información del Cliente"
            icon={<PersonIcon color="primary" />}
            content={
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Nombre completo</Typography>
                  <Typography variant="body1">
                    {application.client?.firstName} {application.client?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body1">{application.client?.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Teléfono</Typography>
                  <Typography variant="body1">{application.client?.phone}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Dirección</Typography>
                  <Typography variant="body1">{application.client?.address}</Typography>
                </Grid>
              </Grid>
            }
            actions={
              <Button
                size="small"
                onClick={() => navigate(`/clients/${application.client?.id}`)}
              >
                Ver perfil completo
              </Button>
            }
          />
        </Grid>

        {application.status === 'approved' && (
          <Grid item xs={12}>
            <InfoCard
              title="Detalles de Aprobación"
              icon={<CheckCircle color="success" />}
              content={
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Fecha de aprobación</Typography>
                    <Typography variant="body1">
                      {new Date(application.approvalDetails?.date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Aprobado por</Typography>
                    <Typography variant="body1">{application.approvalDetails?.approvedBy}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Comentarios</Typography>
                    <Typography variant="body1">{application.approvalDetails?.comments}</Typography>
                  </Grid>
                </Grid>
              }
            />
          </Grid>
        )}

        {application.status === 'rejected' && (
          <Grid item xs={12}>
            <InfoCard
              title="Detalles de Rechazo"
              icon={<Cancel color="error" />}
              content={
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Fecha de rechazo</Typography>
                    <Typography variant="body1">
                      {new Date(application.rejectionDetails?.date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Rechazado por</Typography>
                    <Typography variant="body1">{application.rejectionDetails?.rejectedBy}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Motivo</Typography>
                    <Typography variant="body1">{application.rejectionDetails?.reason}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Comentarios</Typography>
                    <Typography variant="body1">{application.rejectionDetails?.comments}</Typography>
                  </Grid>
                </Grid>
              }
            />
          </Grid>
        )}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <LoadingContainer loading={loading}>
        {application && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => navigate('/applications')} sx={{ mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1">
                  Solicitud #{application.id}
                </Typography>
                <Box sx={{ ml: 2 }}>
                  {getStatusChip(application.status)}
                </Box>
              </Box>
              <Box>
                {application.status === 'pending' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AssignmentIcon />}
                    onClick={handleReviewClick}
                    sx={{ mr: 1 }}
                  >
                    Revisar
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/applications/${id}/edit`)}
                  sx={{ mr: 1 }}
                >
                  Editar
                </Button>
                {isAdmin && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteClick}
                  >
                    Eliminar
                  </Button>
                )}
              </Box>
            </Box>

            <Paper sx={{ mb: 3 }}>
              <TabsComponent
                tabs={[
                  {
                    label: 'Información General',
                    icon: <DescriptionIcon />,
                    content: renderLoanDetails(),
                  },
                  {
                    label: 'Historial de Actividad',
                    icon: <TimelineIcon />,
                    content: renderActivityHistory(),
                  },
                  {
                    label: 'Documentos',
                    icon: <CalendarIcon />,
                    content: renderDocuments(),
                  },
                ]}
              />
            </Paper>

            {/* Diálogo de revisión */}
            <Dialog open={openReviewDialog} onClose={() => setOpenReviewDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Revisar Solicitud #{id}</DialogTitle>
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
          </>
        )}

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

export default ApplicationDetail;