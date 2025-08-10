import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

// Crear contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configurar interceptor de axios para incluir el token en las peticiones
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      config => {
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          // Verificar si el token ha expirado
          const decodedToken = jwt_decode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token expirado
            logout();
          } else {
            // Token válido, obtener información del usuario
            const response = await axios.get('/api/users/me');
            setCurrentUser(response.data);
          }
        } catch (error) {
          console.error('Error al verificar token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  // Función para iniciar sesión
  const login = async (username, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/token', 
        new URLSearchParams({
          'username': username,
          'password': password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);

      // Obtener información del usuario
      const userResponse = await axios.get('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      setCurrentUser(userResponse.data);

      return true;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError(error.response?.data?.detail || 'Error al iniciar sesión');
      return false;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  // Función para registrar un nuevo usuario
  const register = async (first_name, last_name, email, password) => {
    try {
      setError(null);
      const userData = {
        first_name,
        last_name,
        email,
        password
      };
      const response = await axios.post('/api/users', userData);
      
      // Iniciar sesión automáticamente después del registro
      return await login(email, password);
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      setError(error.response?.data?.detail || 'Error al registrar usuario');
      throw error; // Lanzar el error para manejarlo en el componente
    }
  };

  // Función para actualizar perfil de usuario
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await axios.put(`/api/users/${currentUser.id}`, userData);
      setCurrentUser(response.data);
      return true;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setError(error.response?.data?.detail || 'Error al actualizar perfil');
      return false;
    }
  };

  // Función para cambiar contraseña
  const changePassword = async (oldPassword, newPassword) => {
    try {
      setError(null);
      await axios.post('/api/users/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      return true;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError(error.response?.data?.detail || 'Error al cambiar contraseña');
      return false;
    }
  };

  // Verificar si el usuario es administrador
  const isAdmin = () => {
    return currentUser?.is_admin || false;
  };

  // Valores del contexto
  const value = {
    currentUser,
    isAuthenticated: !!token,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};