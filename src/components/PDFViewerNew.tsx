import {
  GetApp,
  Fullscreen,
  OpenInNew,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Alert,
  Button,
  IconButton,
  Toolbar,
  Paper,
} from '@mui/material';
import React from 'react';

interface PDFViewerNewProps {
  url: string;
  title?: string;
  height?: string | number;
}

const PDFViewerNew: React.FC<PDFViewerNewProps> = ({
  url,
  title = 'PDF Document',
  height = '600px',
}) => {
  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title || 'document.pdf';
    link.click();
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  const toggleFullscreen = () => {
    const element = document.getElementById('pdf-container');
    if (element) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        element.requestFullscreen();
      }
    }
  };

  // Verificar si la URL es válida
  if (!url) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Error
          </Typography>
          <Typography variant="body2">No se proporcionó una URL válida para el PDF.</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Paper
      id="pdf-container"
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <Toolbar
        variant="dense"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: '48px !important',
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        
        <IconButton onClick={openInNewTab} size="small" title="Abrir en nueva pestaña">
          <OpenInNew />
        </IconButton>
        
        <IconButton onClick={toggleFullscreen} size="small" title="Pantalla completa">
          <Fullscreen />
        </IconButton>
        
        <IconButton onClick={downloadPDF} size="small" title="Descargar">
          <GetApp />
        </IconButton>
      </Toolbar>

      {/* Contenedor del PDF */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <iframe
          src={url}
          width="100%"
          height="100%"
          style={{
            border: 'none',
            display: 'block',
          }}
          title={title}
          onError={() => {
            console.error('Error al cargar PDF en iframe');
          }}
        />
      </Box>
    </Paper>
  );
};

export default PDFViewerNew;