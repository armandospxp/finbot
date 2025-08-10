import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  Campaign as CampaignIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';

// Registrar componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [dailyInteractions, setDailyInteractions] = useState([]);
  const [agentsPerformance, setAgentsPerformance] = useState([]);
  const [campaignsPerformance, setCampaignsPerformance] = useState([]);
  const [creditApplicationsStatus, setCreditApplicationsStatus] = useState([]);
  
  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener resumen del dashboard
        const summaryResponse = await axios.get('/api/dashboard/summary');
        setSummary(summaryResponse.data);
        
        // Obtener interacciones diarias (últimos 30 días)
        const dailyInteractionsResponse = await axios.get('/api/dashboard/daily-interactions', {
          params: { days: 30 }
        });
        setDailyInteractions(dailyInteractionsResponse.data);
        
        // Obtener rendimiento de agentes
        const agentsPerformanceResponse = await axios.get('/api/dashboard/agents-performance');
        setAgentsPerformance(agentsPerformanceResponse.data);
        
        // Obtener rendimiento de campañas
        const campaignsPerformanceResponse = await axios.get('/api/dashboard/campaigns-performance');
        setCampaignsPerformance(campaignsPerformanceResponse.data);
        
        // Obtener estado de solicitudes de crédito
        const creditApplicationsStatusResponse = await axios.get('/api/dashboard/credit-applications-status');
        setCreditApplicationsStatus(creditApplicationsStatusResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar datos del dashboard. Por favor, intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Preparar datos para gráfico de interacciones diarias
  const dailyInteractionsData = {
    labels: dailyInteractions.map(item => item.date),
    datasets: [
      {
        label: 'Interacciones',
        data: dailyInteractions.map(item => item.count),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // Preparar datos para gráfico de rendimiento de agentes
  const agentsPerformanceData = {
    labels: agentsPerformance.map(agent => agent.agent_name),
    datasets: [
      {
        label: 'Interacciones',
        data: agentsPerformance.map(agent => agent.interactions_count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Solicitudes',
        data: agentsPerformance.map(agent => agent.applications_count),
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
      },
      {
        label: 'Préstamos Aprobados',
        data: agentsPerformance.map(agent => agent.approved_loans_count),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Preparar datos para gráfico de estado de solicitudes de crédito
  const creditApplicationsStatusData = {
    labels: creditApplicationsStatus.map(status => status.status),
    datasets: [
      {
        data: creditApplicationsStatus.map(status => status.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',  // Aprobado
          'rgba(255, 99, 132, 0.5)',   // Rechazado
          'rgba(255, 206, 86, 0.5)',   // Pendiente
          'rgba(153, 102, 255, 0.5)',  // En revisión
          'rgba(54, 162, 235, 0.5)',   // Otros
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(54, 162, 235, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div">
                  {summary?.active_agents || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Agentes Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CampaignIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div">
                  {summary?.active_campaigns || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Campañas Activas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MessageIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div">
                  {summary?.total_interactions || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Interacciones Totales
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div">
                  {summary?.approved_loans || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Préstamos Aprobados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Gráfico de interacciones diarias */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Interacciones Diarias (Últimos 30 días)
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line 
                data={dailyInteractionsData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Gráfico de estado de solicitudes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estado de Solicitudes
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie 
                data={creditApplicationsStatusData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Rendimiento de agentes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Rendimiento de Agentes
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/agents')}
              >
                Ver todos
              </Button>
            </Box>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={agentsPerformanceData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Campañas activas */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Campañas Activas
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/campaigns')}
              >
                Ver todas
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {campaignsPerformance.length > 0 ? (
              <Grid container spacing={2}>
                {campaignsPerformance.slice(0, 4).map((campaign) => (
                  <Grid item xs={12} sm={6} md={3} key={campaign.id}>
                    <Card variant="outlined">
                      <CardHeader
                        title={campaign.name}
                        subheader={`Tipo: ${campaign.type}`}
                        titleTypographyProps={{ variant: 'subtitle1' }}
                        subheaderTypographyProps={{ variant: 'body2' }}
                        action={
                          <Chip 
                            label={campaign.status} 
                            size="small" 
                            color={campaign.status === 'ACTIVE' ? 'success' : 'default'}
                          />
                        }
                      />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Interacciones: {campaign.interactions_count}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay campañas activas en este momento.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;