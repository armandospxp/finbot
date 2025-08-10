import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  VpnKey as KeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Esquema de validación para actualizar perfil
const profileSchema = Yup.object().shape({
  first_name: Yup.string().required('El nombre es requerido'),
  last_name: Yup.string().required('El apellido es requerido'),
  email: Yup.string().email('Email inválido').required('El email es requerido'),
});

// Esquema de validación para cambiar contraseña
const passwordSchema = Yup.object().shape({
  current_password: Yup.string().required('La contraseña actual es requerida'),
  new_password: Yup.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/,
      'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
    )
    .required('La nueva contraseña es requerida'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('new_password'), null], 'Las contraseñas deben coincidir')
    .required('Confirme la nueva contraseña'),
});

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  
  // Estados para mostrar/ocultar contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estado para el diálogo de cambio de contraseña
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  
  // Estados para alertas
  const [profileAlert, setProfileAlert] = useState({ show: false, message: '', severity: 'success' });
  const [passwordAlert, setPasswordAlert] = useState({ show: false, message: '', severity: 'success' });
  
  // Formik para manejar el formulario de perfil
  const profileFormik = useFormik({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    },
    validationSchema: profileSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await updateProfile(values);
        setProfileAlert({
          show: true,
          message: 'Perfil actualizado exitosamente',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error al actualizar perfil:', error);
        setProfileAlert({
          show: true,
          message: error.response?.data?.detail || 'Error al actualizar perfil',
          severity: 'error',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });
  
  // Formik para manejar el formulario de cambio de contraseña
  const passwordFormik = useFormik({
    initialValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    validationSchema: passwordSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await changePassword(values.current_password, values.new_password);
        setPasswordAlert({
          show: true,
          message: 'Contraseña actualizada exitosamente',
          severity: 'success',
        });
        resetForm();
        setOpenPasswordDialog(false);
      } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        setPasswordAlert({
          show: true,
          message: error.response?.data?.detail || 'Error al cambiar contraseña',
          severity: 'error',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });
  
  // Actualizar valores iniciales cuando cambia el usuario
  useEffect(() => {
    if (user) {
      profileFormik.setValues({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);
  
  // Manejar apertura del diálogo de cambio de contraseña
  const handleOpenPasswordDialog = () => {
    passwordFormik.resetForm();
    setOpenPasswordDialog(true);
  };
  
  // Manejar cierre del diálogo de cambio de contraseña
  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
  };
  
  // Obtener iniciales para el avatar
  const getInitials = () => {
    if (!user) return '?';
    return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`;
  };
  
  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mi Perfil
      </Typography>
      
      <Grid container spacing={3}>
        {/* Tarjeta de información del usuario */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {getInitials()}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user?.first_name} {user?.last_name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rol: {user?.is_admin ? 'Administrador' : 'Usuario'}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<KeyIcon />}
                onClick={handleOpenPasswordDialog}
                sx={{ mt: 3 }}
              >
                Cambiar Contraseña
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Formulario de edición de perfil */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Editar Información Personal
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {profileAlert.show && (
              <Alert 
                severity={profileAlert.severity} 
                sx={{ mb: 3 }}
                onClose={() => setProfileAlert({ ...profileAlert, show: false })}
              >
                {profileAlert.message}
              </Alert>
            )}
            
            <form onSubmit={profileFormik.handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="first_name"
                    name="first_name"
                    label="Nombre"
                    value={profileFormik.values.first_name}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.first_name && Boolean(profileFormik.errors.first_name)}
                    helperText={profileFormik.touched.first_name && profileFormik.errors.first_name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="last_name"
                    name="last_name"
                    label="Apellido"
                    value={profileFormik.values.last_name}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.last_name && Boolean(profileFormik.errors.last_name)}
                    helperText={profileFormik.touched.last_name && profileFormik.errors.last_name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    value={profileFormik.values.email}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                    helperText={profileFormik.touched.email && profileFormik.errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={profileFormik.isSubmitting}
                    sx={{ mt: 1 }}
                  >
                    {profileFormik.isSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Guardar Cambios'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Diálogo de cambio de contraseña */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>Cambiar Contraseña</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Para cambiar su contraseña, ingrese su contraseña actual y la nueva contraseña.
          </DialogContentText>
          
          {passwordAlert.show && (
            <Alert 
              severity={passwordAlert.severity} 
              sx={{ mb: 3 }}
              onClose={() => setPasswordAlert({ ...passwordAlert, show: false })}
            >
              {passwordAlert.message}
            </Alert>
          )}
          
          <form onSubmit={passwordFormik.handleSubmit}>
            <TextField
              fullWidth
              margin="dense"
              id="current_password"
              name="current_password"
              label="Contraseña Actual"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordFormik.values.current_password}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.current_password && Boolean(passwordFormik.errors.current_password)}
              helperText={passwordFormik.touched.current_password && passwordFormik.errors.current_password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              margin="dense"
              id="new_password"
              name="new_password"
              label="Nueva Contraseña"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordFormik.values.new_password}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.new_password && Boolean(passwordFormik.errors.new_password)}
              helperText={passwordFormik.touched.new_password && passwordFormik.errors.new_password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              margin="dense"
              id="confirm_password"
              name="confirm_password"
              label="Confirmar Nueva Contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordFormik.values.confirm_password}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.confirm_password && Boolean(passwordFormik.errors.confirm_password)}
              helperText={passwordFormik.touched.confirm_password && passwordFormik.errors.confirm_password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancelar</Button>
          <Button
            onClick={passwordFormik.handleSubmit}
            color="primary"
            disabled={passwordFormik.isSubmitting}
          >
            {passwordFormik.isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Cambiar Contraseña'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;