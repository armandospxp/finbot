import React from 'react';
import {
  TablePagination,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  FirstPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  LastPage,
} from '@mui/icons-material';

/**
 * Componente de acciones de paginación personalizado
 */
function TablePaginationActions(props) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="primera página"
      >
        {theme.direction === 'rtl' ? <LastPage /> : <FirstPage />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="página anterior"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="página siguiente"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="última página"
      >
        {theme.direction === 'rtl' ? <FirstPage /> : <LastPage />}
      </IconButton>
    </Box>
  );
}

/**
 * Componente de paginación reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {number} props.count - Número total de elementos
 * @param {number} props.page - Página actual (base 0)
 * @param {Function} props.onPageChange - Función para cambiar de página
 * @param {number} props.rowsPerPage - Número de elementos por página
 * @param {Function} props.onRowsPerPageChange - Función para cambiar el número de elementos por página
 * @param {Array<number>} props.rowsPerPageOptions - Opciones de elementos por página (opcional)
 * @param {Object} props.sx - Estilos adicionales (opcional)
 */
const Pagination = ({
  count,
  page,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={onPageChange}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={onRowsPerPageChange}
      rowsPerPageOptions={rowsPerPageOptions}
      ActionsComponent={TablePaginationActions}
      labelRowsPerPage={isMobile ? 'Filas:' : 'Filas por página:'}
      labelDisplayedRows={({ from, to, count }) => 
        `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
      }
      sx={{
        '.MuiTablePagination-selectLabel': {
          margin: 0,
        },
        '.MuiTablePagination-displayedRows': {
          margin: 0,
        },
        ...sx
      }}
    />
  );
};

export default Pagination;