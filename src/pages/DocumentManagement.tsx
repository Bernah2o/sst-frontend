import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
  Grid,
  Avatar,
  Tabs,
  Tab,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Description as DocumentIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Upload as UploadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { committeeDocumentService } from '../services/committeeDocumentService';
import { committeeService } from '../services/committeeService';
import { committeePermissionService } from '../services/committeePermissionService';
import DocumentForm from '../components/DocumentForm';
import {
  CommitteeDocument,
  CommitteeDocumentType,
  CommitteeDocumentCreate,
  CommitteeDocumentUpdate,
  Committee,
} from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`document-tabpanel-${index}`}
      aria-labelledby={`document-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DocumentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { id: committeeId } = useParams<{ id: string }>();
  const [documents, setDocuments] = useState<CommitteeDocument[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<CommitteeDocument | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [documentFormOpen, setDocumentFormOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<CommitteeDocument | undefined>(undefined);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState<{ [key: number]: any }>({});
  const [tabValue, setTabValue] = useState(0);
  const [documentCounts, setDocumentCounts] = useState({
    meeting_minutes: 0,
    voting_record: 0,
    activity_report: 0,
    presentation: 0,
    agreement: 0,
    other: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState<number | undefined>(
    committeeId ? parseInt(committeeId) : undefined
  );
  const [selectedDocumentType, setSelectedDocumentType] = useState<CommitteeDocumentType | undefined>(undefined);
  const [recentDocuments, setRecentDocuments] = useState<CommitteeDocument[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadDocuments();
    loadDocumentCounts();
  }, [page, rowsPerPage, searchTerm, selectedCommittee, selectedDocumentType, tabValue]);

  const loadInitialData = async () => {
    try {
      // Get user's accessible committees
      const accessibleCommittees = await committeePermissionService.getUserAccessibleCommittees();
      const committeeData = await Promise.all(
        accessibleCommittees.map(async (ac) => {
          const committee = await committeeService.getCommittee(ac.committee_id);
          return committee;
        })
      );
      setCommittees(committeeData);

      // Load permissions for each committee
      const permissionsMap: { [key: number]: any } = {};
      for (const committee of committeeData) {
        const canView = await committeePermissionService.canView(committee.id);
        const canManageDocuments = await committeePermissionService.canUploadDocuments(committee.id);

        permissionsMap[committee.id] = {
          canView,
          canManageDocuments,
        };
      }
      setPermissions(permissionsMap);

      // Load recent documents from all committees
      const allRecentDocuments = await Promise.all(
        committeeData.map(committee => 
          committeeDocumentService.getRecentDocuments(committee.id, 5)
        )
      );
      
      // Flatten and sort by creation date, then take the most recent 5
      const flattenedRecent = allRecentDocuments.flat()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      setRecentDocuments(flattenedRecent);
    } catch (err) {
      setError('Error al cargar los datos iniciales');
      console.error('Initial data loading error:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const committeeIds = committees.map(c => c.id);
      if (committeeIds.length === 0) {
        setDocuments([]);
        setTotalCount(0);
        return;
      }

      // Apply tab-based filtering
      let typeFilter = selectedDocumentType;
      switch (tabValue) {
        case 1:
          typeFilter = CommitteeDocumentType.MEETING_MINUTES;
          break;
        case 2:
          typeFilter = CommitteeDocumentType.VOTING_RECORD;
          break;
        case 3:
          typeFilter = CommitteeDocumentType.ACTIVITY_REPORT;
          break;
        case 4:
          typeFilter = CommitteeDocumentType.PRESENTATION;
          break;
        case 5:
           typeFilter = CommitteeDocumentType.AGREEMENT;
           break;
         case 6:
           typeFilter = CommitteeDocumentType.OTHER;
           break;
      }

      const response = await committeeDocumentService.getDocuments({
        committee_id: selectedCommittee,
        document_type: typeFilter,
        search: searchTerm,
        page: page + 1,
        page_size: rowsPerPage,
      });

      setDocuments(response.items);
      setTotalCount(response.total);
    } catch (err) {
      setError('Error al cargar los documentos');
      console.error('Documents loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentCounts = async () => {
    try {
      const committeeIds = committees.map(c => c.id);
      if (committeeIds.length === 0) return;

      // Get statistics for each committee and aggregate
      const allStats = await Promise.all(
        committeeIds.map(id => committeeDocumentService.getDocumentStatistics(id))
      );

      // Aggregate the counts by type
      const aggregatedCounts = {
        meeting_minutes: 0,
        voting_record: 0,
        activity_report: 0,
        presentation: 0,
        agreement: 0,
        other: 0,
      };

      allStats.forEach(stats => {
        if (stats.by_type) {
          Object.keys(aggregatedCounts).forEach(key => {
            aggregatedCounts[key as keyof typeof aggregatedCounts] += stats.by_type[key] || 0;
          });
        }
      });

      setDocumentCounts(aggregatedCounts);
    } catch (err) {
      console.error('Document counts loading error:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, document: CommitteeDocument) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocument(undefined);
  };

  const handleView = async () => {
    if (selectedDocument) {
      try {
        const url = await committeeDocumentService.getDocumentUrl(selectedDocument.id);
        window.open(url, '_blank');
      } catch (err) {
        setError('Error al abrir el documento');
        console.error('Document view error:', err);
      }
    }
    handleMenuClose();
  };

  const handleViewDetails = () => {
    if (selectedDocument) {
      setDetailsDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDownload = async () => {
    if (selectedDocument) {
      try {
        await committeeDocumentService.downloadDocument(selectedDocument.id);
        // Increment download counter
        await committeeDocumentService.incrementDownloadCount(selectedDocument.id);
        loadDocuments();
      } catch (err) {
        setError('Error al descargar el documento');
        console.error('Document download error:', err);
      }
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedDocument) {
      setEditingDocument(selectedDocument);
      setDocumentFormOpen(true);
    }
    handleMenuClose();
  };

  const handleShareClick = () => {
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedDocument) {
      try {
        await committeeDocumentService.deleteDocument(selectedDocument.id);
        setDeleteDialogOpen(false);
        setSelectedDocument(undefined);
        loadDocuments();
        loadDocumentCounts();
      } catch (err) {
        setError('Error al eliminar el documento');
        console.error('Document deletion error:', err);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedDocument(undefined);
  };

  const handleCreateDocument = () => {
    setEditingDocument(undefined);
    setDocumentFormOpen(true);
  };

  const handleDocumentFormClose = () => {
    setDocumentFormOpen(false);
    setEditingDocument(undefined);
  };

  const handleDocumentSubmit = async (data: CommitteeDocumentCreate | CommitteeDocumentUpdate, file?: File) => {
    try {
      if (editingDocument) {
        // Editing existing document
        await committeeDocumentService.updateDocument(editingDocument.id, data as CommitteeDocumentUpdate, file);
      } else {
        // Creating new document
        await committeeDocumentService.createDocument(data as CommitteeDocumentCreate, file!);
      }
      
      loadDocuments();
      loadDocumentCounts();
      setDocumentFormOpen(false);
      setEditingDocument(undefined);
    } catch (err) {
      console.error('Document submit error:', err);
      throw err; // Let the form handle the error display
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleCommitteeFilterChange = (event: any) => {
    setSelectedCommittee(event.target.value || undefined);
    setPage(0);
  };

  const handleTypeFilterChange = (event: any) => {
    setSelectedDocumentType(event.target.value || undefined);
    setPage(0);
  };

  const handleFilterReset = () => {
    setSearchTerm('');
    setSelectedCommittee(undefined);
    setSelectedDocumentType(undefined);
    setPage(0);
  };

  const getDocumentTypeLabel = (type: CommitteeDocumentType): string => {
    switch (type) {
      case CommitteeDocumentType.MEETING_MINUTES:
        return 'Actas de Reunión';
      case CommitteeDocumentType.VOTING_RECORD:
        return 'Registros de Votación';
      case CommitteeDocumentType.ACTIVITY_REPORT:
        return 'Informes de Actividad';
      case CommitteeDocumentType.PRESENTATION:
        return 'Presentaciones';
      case CommitteeDocumentType.AGREEMENT:
        return 'Acuerdos';
      case CommitteeDocumentType.OTHER:
        return 'Otros';
      default:
        return type;
    }
  };

  const getDocumentTypeColor = (type: CommitteeDocumentType): 'default' | 'primary' | 'secondary' | 'success' | 'warning' => {
    switch (type) {
      case CommitteeDocumentType.MEETING_MINUTES:
        return 'primary';
      case CommitteeDocumentType.VOTING_RESULTS:
        return 'secondary';
      case CommitteeDocumentType.REPORTS:
        return 'success';
      case CommitteeDocumentType.POLICIES:
        return 'warning';
      case CommitteeDocumentType.OTHER:
        return 'default';
      default:
        return 'default';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon color="primary" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <VideoIcon color="secondary" />;
      case 'mp3':
      case 'wav':
        return <AudioIcon color="warning" />;
      default:
        return <FileIcon />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Allow any authenticated user to create documents
  const canCreateDocument = true;

  if (loading && documents.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Documentos
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateDocument}
            disabled={!canCreateDocument}
          >
            Nuevo Documento
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Recent Documents Sidebar */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Documentos Recientes
              </Typography>
              <List dense>
                {recentDocuments.map((doc) => (
                  <ListItem key={doc.id} disablePadding>
                    <ListItemButton onClick={() => handleView()}>
                      <ListItemIcon>
                        {getFileIcon(doc.file_name)}
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.title}
                        secondary={new Date(doc.created_at).toLocaleDateString('es-ES')}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Card>
            {/* Search and Filters */}
            <CardContent>
              <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Comité</InputLabel>
                    <Select
                      value={selectedCommittee || ''}
                      label="Comité"
                      onChange={handleCommitteeFilterChange}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {committees.map((committee) => (
                        <MenuItem key={committee.id} value={committee.id}>
                          {committee.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={selectedDocumentType || ''}
                      label="Tipo"
                      onChange={handleTypeFilterChange}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value={CommitteeDocumentType.MEETING_MINUTES}>Actas de Reunión</MenuItem>
                      <MenuItem value={CommitteeDocumentType.VOTING_RECORD}>Registros de Votación</MenuItem>
                      <MenuItem value={CommitteeDocumentType.ACTIVITY_REPORT}>Informes de Actividad</MenuItem>
                      <MenuItem value={CommitteeDocumentType.PRESENTATION}>Presentaciones</MenuItem>
                      <MenuItem value={CommitteeDocumentType.AGREEMENT}>Acuerdos</MenuItem>
                      <MenuItem value={CommitteeDocumentType.OTHER}>Otros</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>

            <Divider />

            {/* Document Type Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="document tabs">
                <Tab label="Todos" />
                <Tab
                  label={
                    <Badge badgeContent={documentCounts.meeting_minutes} color="primary">
                      Actas
                    </Badge>
                  }
                />
                <Tab
                  label={
                    <Badge badgeContent={documentCounts.voting_record} color="secondary">
                      Votaciones
                    </Badge>
                  }
                />
                <Tab
                  label={
                    <Badge badgeContent={documentCounts.activity_report} color="success">
                      Informes
                    </Badge>
                  }
                />
                <Tab
                  label={
                    <Badge badgeContent={documentCounts.presentation} color="warning">
                      Presentaciones
                    </Badge>
                  }
                />
                <Tab
                  label={
                    <Badge badgeContent={documentCounts.agreement} color="info">
                      Acuerdos
                    </Badge>
                  }
                />
                <Tab
                  label={
                    <Badge badgeContent={documentCounts.other} color="default">
                      Otros
                    </Badge>
                  }
                />
              </Tabs>
            </Box>

            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Documento</TableCell>
                      <TableCell>Comité</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Tamaño</TableCell>
                      <TableCell>Fecha de Subida</TableCell>
                      <TableCell>Descargas</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.map((document) => (
                      <TableRow key={document.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2 }}>
                              {getFileIcon(document.file_name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {document.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {document.file_name}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {committees.find(c => c.id === document.committee_id)?.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getDocumentTypeLabel(document.document_type)}
                            size="small"
                            color={getDocumentTypeColor(document.document_type)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatFileSize(document.file_size)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(document.created_at).toLocaleDateString('es-ES')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {document.download_count}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Más opciones">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, document)}
                              size="small"
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {documents.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary" py={4}>
                            No se encontraron documentos
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Documento
        </MenuItem>
        <MenuItem onClick={handleDownload}>
          <DownloadIcon sx={{ mr: 1 }} />
          Descargar
        </MenuItem>
        {selectedDocument && permissions[selectedDocument.committee_id]?.canManageDocuments && (
          <>
            <MenuItem onClick={handleEdit}>
              <EditIcon sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem onClick={handleShareClick}>
              <ShareIcon sx={{ mr: 1 }} />
              Compartir
            </MenuItem>
            <MenuItem
              onClick={handleDeleteClick}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              Eliminar
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el documento "{selectedDocument?.title}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filtros Avanzados</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Use los filtros de la parte superior de la tabla para refinar su búsqueda.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterReset}>Limpiar Filtros</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Document Form */}
      <DocumentForm
        open={documentFormOpen}
        onClose={handleDocumentFormClose}
        onSubmit={handleDocumentSubmit}
        document={editingDocument}
        committees={committees}
        loading={loading}
        error={error || undefined}
      />

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Compartir Documento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Funcionalidad de compartir documentos en desarrollo.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DocumentIcon />
            Detalles del Documento
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedDocument.title}
                  </Typography>
                </Grid>
                
                {selectedDocument.description && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Descripción:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {selectedDocument.description}
                    </Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Tipo:</strong>
                  </Typography>
                  <Chip 
                    label={selectedDocument.document_type} 
                    size="small" 
                    color="primary"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Comité:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {committees.find(c => c.id === selectedDocument.committee_id)?.name || 'N/A'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Tamaño del archivo:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedDocument.file_size ? `${(selectedDocument.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Tipo de archivo:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedDocument.mime_type || 'N/A'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Subido por:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedDocument.uploaded_by || 'N/A'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Fecha de subida:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedDocument.created_at ? new Date(selectedDocument.created_at).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>

                {selectedDocument.updated_at && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Última actualización:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedDocument.updated_at).toLocaleString()}
                    </Typography>
                  </Grid>
                )}

                {selectedDocument.file_path && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Acciones:</strong>
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => window.open(selectedDocument.file_path, '_blank')}
                      >
                        Ver Documento
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedDocument.file_path!;
                          link.download = selectedDocument.title;
                          link.click();
                        }}
                      >
                        Descargar
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManagement;