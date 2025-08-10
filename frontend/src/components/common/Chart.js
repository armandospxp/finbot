import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Componente de gráfico reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título del gráfico
 * @param {string} props.subtitle - Subtítulo del gráfico (opcional)
 * @param {string} props.type - Tipo de gráfico: 'bar', 'line', 'pie' (opcional)
 * @param {Array<Object>} props.data - Datos para el gráfico
 * @param {string} props.dataKey - Clave para los datos en el eje X
 * @param {Array<{key: string, color: string}>} props.series - Series de datos para el gráfico
 * @param {boolean} props.loading - Indica si los datos están cargando (opcional)
 * @param {string} props.emptyMessage - Mensaje a mostrar cuando no hay datos (opcional)
 * @param {number} props.height - Altura del gráfico en píxeles (opcional)
 * @param {boolean} props.showGrid - Muestra la cuadrícula en gráficos cartesianos (opcional)
 * @param {boolean} props.showLegend - Muestra la leyenda (opcional)
 * @param {Object} props.sx - Estilos adicionales (opcional)
 */
const Chart = ({
  title,
  subtitle,
  type = 'bar',
  data = [],
  dataKey,
  series = [],
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  height = 300,
  showGrid = true,
  showLegend = true,
  sx = {},
}) => {
  const theme = useTheme();

  // Colores predeterminados para las series
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  // Asignar colores a las series si no tienen uno definido
  const seriesWithColors = series.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
  }));

  // Renderizar el gráfico según el tipo
  const renderChart = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!data || data.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        {type === 'bar' && (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={dataKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {seriesWithColors.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name || s.key} fill={s.color} />
            ))}
          </BarChart>
        )}

        {type === 'line' && (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={dataKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {seriesWithColors.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name || s.key}
                stroke={s.color}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        )}

        {type === 'pie' && (
          <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <Tooltip />
            {showLegend && <Legend />}
            <Pie
              data={data}
              nameKey={dataKey}
              dataKey={seriesWithColors[0]?.key}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={seriesWithColors[index % seriesWithColors.length]?.color || defaultColors[index % defaultColors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <Card sx={{ height: '100%', ...sx }} elevation={2}>
      <CardHeader
        title={title}
        subheader={subtitle}
        titleTypographyProps={{ variant: 'h6' }}
        subheaderTypographyProps={{ variant: 'body2' }}
      />
      <Divider />
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default Chart;