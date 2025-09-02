import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  className?: string;
  sx?: any;
  disableGutters?: boolean;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  className = '',
  sx = {},
  disableGutters = false
}) => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isExtraLargeScreen = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Determine the appropriate max width based on screen size
  const getMaxWidth = () => {
    if (maxWidth === false) return false;
    
    if (isExtraLargeScreen) {
      return 'xl';
    }
    if (isLargeScreen) {
      return 'lg';
    }
    return maxWidth;
  };

  const getPadding = () => {
    if (disableGutters) return 0;
    
    if (isExtraLargeScreen) {
      return { px: 6, py: 4 };
    }
    if (isLargeScreen) {
      return { px: 4, py: 3 };
    }
    return { px: 3, py: 2 };
  };

  return (
    <Container
      maxWidth={getMaxWidth()}
      className={`main-content ${className}`}
      sx={{
        ...getPadding(),
        ...sx
      }}
    >
      <Box className="content-wrapper">
        {children}
      </Box>
    </Container>
  );
};

export default ResponsiveContainer;