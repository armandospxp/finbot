import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Divider,
  Box,
  IconButton,
  Collapse,
  Button,
  Tooltip,
  Chip,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

/**
 * Componente de tarjeta de información reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título de la tarjeta
 * @param {string} props.subtitle - Subtítulo de la tarjeta (opcional)
 * @param {React.ReactNode} props.avatar - Avatar o icono para la tarjeta (opcional)
 * @param {React.ReactNode} props.action - Acción personalizada para la esquina superior derecha (opcional)
 * @param {React.ReactNode} props.content - Contenido principal de la tarjeta
 * @param {React.ReactNode} props.expandedContent - Contenido expandible (opcional)
 * @param {boolean} props.expanded - Controla si el contenido expandible está visible (opcional)
 * @param {Function} props.onExpandChange - Función que se ejecuta al expandir/contraer (opcional)
 * @param {boolean} props.showEditButton - Muestra el botón de editar (opcional)
 * @param {Function} props.onEdit - Función que se ejecuta al hacer clic en editar (opcional)
 * @param {boolean} props.showDeleteButton - Muestra el botón de eliminar (opcional)
 * @param {Function} props.onDelete - Función que se ejecuta al hacer clic en eliminar (opcional)
 * @param {React.ReactNode} props.footer - Contenido del pie de la tarjeta (opcional)
 * @param {string} props.status - Estado para mostrar como chip (opcional)
 * @param {string} props.statusColor - Color del chip de estado (opcional)
 * @param {Object} props.sx - Estilos adicionales (opcional)
 */
const InfoCard = ({
  title,
  subtitle,
  avatar,
  action,
  content,
  expandedContent,
  expanded = false,
  onExpandChange,
  showEditButton = false,
  onEdit,
  showDeleteButton = false,
  onDelete,
  footer,
  status,
  statusColor = 'default',
  sx = {},
}) => {
  const theme = useTheme();

  // Renderizar el contenido principal
  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <Typography variant="body2" color="text.secondary">
          {content}
        </Typography>
      );
    }
    return content;
  };

  // Renderizar el contenido expandible
  const renderExpandedContent = () => {
    if (!expandedContent) return null;
    
    return (
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent>
          {typeof expandedContent === 'string' ? (
            <Typography variant="body2" color="text.secondary">
              {expandedContent}
            </Typography>
          ) : (
            expandedContent
          )}
        </CardContent>
      </Collapse>
    );
  };

  // Renderizar las acciones de la tarjeta
  const renderActions = () => {
    const hasActions = showEditButton || showDeleteButton || expandedContent || footer;
    
    if (!hasActions) return null;
    
    return (
      <>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Box>
            {showEditButton && (
              <Tooltip title="Editar">
                <IconButton onClick={onEdit} size="small" color="primary">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {showDeleteButton && (
              <Tooltip title="Eliminar">
                <IconButton onClick={onDelete} size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          <Box>
            {footer}
            
            {expandedContent && (
              <Tooltip title={expanded ? "Contraer" : "Expandir"}>
                <IconButton
                  onClick={onExpandChange}
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: theme.transitions.create('transform', {
                      duration: theme.transitions.duration.shortest,
                    }),
                  }}
                  size="small"
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </CardActions>
      </>
    );
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...sx }} elevation={2}>
      <CardHeader
        avatar={avatar}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {status && (
              <Chip
                label={status}
                color={statusColor}
                size="small"
                sx={{ height: 20 }}
              />
            )}
          </Box>
        }
        subheader={subtitle}
        action={action}
      />
      <Divider />
      <CardContent sx={{ flexGrow: 1 }}>
        {renderContent()}
      </CardContent>
      {renderExpandedContent()}
      {renderActions()}
    </Card>
  );
};

/**
 * Componente de tarjeta de información con datos en formato clave-valor
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título de la tarjeta
 * @param {Array<{label: string, value: string|number|React.ReactNode}>} props.items - Array de objetos con etiqueta y valor
 * @param {Object} props.cardProps - Propiedades adicionales para el componente InfoCard
 */
export const KeyValueCard = ({ title, items, cardProps = {} }) => {
  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {items.map((item, index) => (
        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mr: 2 }}>
            {item.label}:
          </Typography>
          {typeof item.value === 'string' || typeof item.value === 'number' ? (
            <Typography variant="body2" sx={{ textAlign: 'right', wordBreak: 'break-word' }}>
              {item.value || '-'}
            </Typography>
          ) : (
            item.value || '-'
          )}
        </Box>
      ))}
    </Box>
  );

  return <InfoCard title={title} content={content} {...cardProps} />;
};

export default InfoCard;