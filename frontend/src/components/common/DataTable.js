import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

/**
 * Función para ordenar datos de tabla
 */
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

/**
 * Componente para el encabezado de la tabla con ordenamiento
 */
function EnhancedTableHead(props) {
  const { columns, order, orderBy, onRequestSort } = props;
  
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.align || 'left'}
            padding={column.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === column.id ? order : false}
            style={{ minWidth: column.minWidth }}
          >
            {column.sortable !== false ? (
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={createSortHandler(column.id)}
              >
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

/**
 * Componente de barra de herramientas para la tabla
 */
function EnhancedTableToolbar(props) {
  const { title, searchPlaceholder, searchValue, onSearchChange } = props;

  return (
    <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
      <Typography
        sx={{ flex: '1 1 100%' }}
        variant="h6"
        id="tableTitle"
        component="div"
      >
        {title}
      </Typography>

      {onSearchChange && (
        <TextField
          variant="outlined"
          size="small"
          placeholder={searchPlaceholder || 'Buscar...'}
          value={searchValue}
          onChange={onSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      )}
    </Toolbar>
  );
}

/**
 * Componente de tabla de datos reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.columns - Definición de columnas
 * @param {Array} props.data - Datos a mostrar
 * @param {string} props.title - Título de la tabla
 * @param {boolean} props.loading - Indica si los datos están cargando
 * @param {string} props.error - Mensaje de error si existe
 * @param {Function} props.renderRow - Función para renderizar filas personalizadas
 * @param {boolean} props.searchable - Indica si la tabla debe tener búsqueda
 * @param {string} props.searchPlaceholder - Texto de placeholder para la búsqueda
 * @param {string} props.defaultOrderBy - Campo por el que ordenar por defecto
 * @param {string} props.defaultOrder - Dirección de ordenamiento por defecto ('asc' o 'desc')
 * @param {string} props.emptyMessage - Mensaje a mostrar cuando no hay datos
 */
const DataTable = ({
  columns,
  data,
  title,
  loading = false,
  error = null,
  renderRow,
  searchable = true,
  searchPlaceholder,
  defaultOrderBy = 'id',
  defaultOrder = 'asc',
  emptyMessage = 'No hay datos disponibles',
}) => {
  // Estado para paginación y ordenamiento
  const [order, setOrder] = useState(defaultOrder);
  const [orderBy, setOrderBy] = useState(defaultOrderBy);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchValue, setSearchValue] = useState('');

  // Manejar cambio de ordenamiento
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Manejar cambio en la búsqueda
  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
    setPage(0);
  };

  // Filtrar datos según la búsqueda
  const filteredData = searchable && searchValue
    ? data.filter((row) =>
        Object.keys(row).some((key) =>
          row[key] && row[key].toString().toLowerCase().includes(searchValue.toLowerCase())
        )
      )
    : data;

  // Ordenar y paginar datos
  const sortedData = stableSort(filteredData, getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar
          title={title}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={searchable ? handleSearchChange : null}
        />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table
                sx={{ minWidth: 750 }}
                aria-labelledby="tableTitle"
                size="medium"
              >
                <EnhancedTableHead
                  columns={columns}
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                />
                <TableBody>
                  {sortedData.length > 0 ? (
                    sortedData.map((row, index) => {
                      return renderRow ? (
                        renderRow(row, index)
                      ) : (
                        <TableRow hover tabIndex={-1} key={row.id || index}>
                          {columns.map((column) => {
                            const value = row[column.id];
                            return (
                              <TableCell key={column.id} align={column.align || 'left'}>
                                {column.format ? column.format(value, row) : value}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default DataTable;