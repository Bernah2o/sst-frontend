import {
  Table,
  TableContainer,
  Paper,
  useTheme,
  useMediaQuery,
  Box
} from '@mui/material';
import React from 'react';

interface ResponsiveTableProps {
  children: React.ReactNode;
  minWidth?: number;
  className?: string;
  sx?: any;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  minWidth = 800,
  className = '',
  sx = {}
}) => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isExtraLargeScreen = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Adjust minimum width based on screen size
  const getMinWidth = () => {
    if (isExtraLargeScreen) {
      return Math.max(minWidth, 1200);
    }
    if (isLargeScreen) {
      return Math.max(minWidth, 1000);
    }
    return minWidth;
  };

  return (
    <Box className="responsive-table-container">
      <TableContainer 
        component={Paper} 
        className={`responsive-table-container ${className}`}
        sx={{
          width: '100%',
          overflowX: 'auto',
          ...sx
        }}
      >
        <Table 
          className="responsive-table custom-scrollbar"
          sx={{
            minWidth: getMinWidth(),
            width: '100%'
          }}
        >
          {children}
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ResponsiveTable;