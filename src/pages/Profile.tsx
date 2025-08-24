import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { PhotoCamera, Edit, Save, Cancel } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { UserProfile } from '../types';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me');
      const profileData = response.data;
      setProfile(profileData);
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await api.put('/users/profile', formData);
      const updatedProfile = response.data;
      
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccess('Perfil actualizado exitosamente');
      
      // Update user in auth context
      if (updateUser) {
        updateUser(updatedProfile);
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.detail || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
    setIsEditing(false);
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten archivos JPEG, PNG o GIF');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo debe ser menor a 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setPhotoDialogOpen(true);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await api.post('/files/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refresh profile to get updated picture
      await fetchProfile();
      
      // Update user in auth context with new profile picture
      if (updateUser && user) {
        // Extract just the path from the full URL for consistency with backend format
        const profilePicturePath = response.data.profile_picture_url.replace('/uploads/', '');
        const updatedUser = { ...user, profile_picture: profilePicturePath };
        updateUser(updatedUser);
      }
      
      setPhotoDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setSuccess('Foto de perfil actualizada exitosamente');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      setError(error.response?.data?.detail || 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDialogClose = () => {
    setPhotoDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const getAvatarSrc = () => {
    if (profile?.profile_picture) {
      // If it's already a full URL, use it as is
      if (profile.profile_picture.startsWith('http')) {
        return profile.profile_picture;
      }
      // Otherwise, construct the full URL with /uploads/ prefix
      // Remove /api/v1 from base URL since uploads are served directly from root
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
      const baseUrl = apiUrl.replace('/api/v1', '');
      return `${baseUrl}/uploads/${profile.profile_picture}`;
    }
    return undefined;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            {/* Profile Picture Section */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Box position="relative">
                  <Avatar
                    src={getAvatarSrc()}
                    sx={{ width: 150, height: 150, mb: 2 }}
                  >
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </Avatar>
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: -8,
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    <PhotoCamera />
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleFileSelect}
                    />
                  </IconButton>
                </Box>
                <Typography variant="h6" textAlign="center">
                  {profile?.first_name} {profile?.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {profile?.role}
                </Typography>
              </Box>
            </Grid>
            
            {/* Profile Information Section */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Información Personal
                </Typography>
                {!isEditing ? (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(true)}
                    variant="outlined"
                  >
                    Editar
                  </Button>
                ) : (
                  <Box>
                    <Button
                      startIcon={<Save />}
                      onClick={handleSave}
                      variant="contained"
                      disabled={saving}
                      sx={{ mr: 1 }}
                    >
                      {saving ? <CircularProgress size={20} /> : 'Guardar'}
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      variant="outlined"
                    >
                      Cancelar
                    </Button>
                  </Box>
                )}
              </Box>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Apellido"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onClose={handlePhotoDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Actualizar Foto de Perfil</DialogTitle>
        <DialogContent>
          {previewUrl && (
            <Box display="flex" justifyContent="center" mb={2}>
              <Avatar
                src={previewUrl}
                sx={{ width: 200, height: 200 }}
              />
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Formatos permitidos: JPEG, PNG, GIF (máximo 5MB)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePhotoDialogClose}>Cancelar</Button>
          <Button
            onClick={handlePhotoUpload}
            variant="contained"
            disabled={uploading || !selectedFile}
          >
            {uploading ? <CircularProgress size={20} /> : 'Subir Foto'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;