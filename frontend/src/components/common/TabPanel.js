import React from 'react';
import { Box, Tabs, Tab, Typography, useTheme, useMediaQuery } from '@mui/material';

/**
 * Componente de panel de pestañas
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido del panel
 * @param {number} props.value - Índice de la pestaña actual
 * @param {number} props.index - Índice de este panel
 * @param {string} props.dir - Dirección del texto (opcional)
 * @param {Object} props.sx - Estilos adicionales (opcional)
 */
export const TabPanel = (props) => {
  const { children, value, index, dir, sx = {}, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, ...sx }}>
          {children}
        </Box>
      )}
    </div>
  );
};

/**
 * Función para obtener propiedades de accesibilidad para las pestañas
 * 
 * @param {number} index - Índice de la pestaña
 * @returns {Object} Propiedades de accesibilidad
 */
export const a11yProps = (index) => {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
};

/**
 * Componente de pestañas reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {number} props.value - Índice de la pestaña actual
 * @param {Function} props.onChange - Función que se ejecuta al cambiar de pestaña
 * @param {Array<{label: string, icon?: React.ReactNode, disabled?: boolean}>} props.tabs - Array de objetos con información de las pestañas
 * @param {React.ReactNode} props.children - Contenido de los paneles de pestañas
 * @param {string} props.orientation - Orientación de las pestañas: 'horizontal' o 'vertical' (opcional)
 * @param {string} props.variant - Variante de las pestañas: 'standard', 'fullWidth', 'scrollable' (opcional)
 * @param {string} props.textColor - Color del texto: 'primary', 'secondary', 'inherit' (opcional)
 * @param {string} props.indicatorColor - Color del indicador: 'primary', 'secondary' (opcional)
 * @param {Object} props.sx - Estilos adicionales (opcional)
 */
const TabsComponent = ({
  value,
  onChange,
  tabs,
  children,
  orientation = 'horizontal',
  variant = 'standard',
  textColor = 'primary',
  indicatorColor = 'primary',
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Ajustar variante en dispositivos móviles para permitir desplazamiento
  const mobileVariant = isMobile ? 'scrollable' : variant;

  return (
    <Box sx={{ width: '100%', ...sx }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={onChange}
          orientation={orientation}
          variant={mobileVariant}
          scrollButtons={isMobile ? 'auto' : false}
          textColor={textColor}
          indicatorColor={indicatorColor}
          aria-label="tabs"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              disabled={tab.disabled}
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Box>
      {children}
    </Box>
  );
};

export default TabsComponent;