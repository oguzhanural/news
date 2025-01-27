'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Box, Button, TextField, Typography, Container, Paper } from '@mui/material';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      password: '',
    };
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation (only if password field is not empty)
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
        isValid = false;
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
        isValid = false;
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one lowercase letter';
        isValid = false;
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one number';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const handleUpdate = async () => {
    if (isEditing) {
      if (!validateForm()) {
        showToast('Please fix the validation errors', 'error');
        return;
      }

      try {
        const updateData = {
          name: formData.name,
          email: formData.email,
          ...(formData.password ? { password: formData.password } : {})
        };
        
        await updateUser(updateData);
        setIsEditing(false);
        showToast('Profile updated successfully', 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Error updating profile', 'error');
      }
    } else {
      setIsEditing(true);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile Settings
        </Typography>
        
        <Box component="form" sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={!isEditing}
            margin="normal"
            error={!!errors.name}
            helperText={errors.name}
          />
          
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={!isEditing}
            margin="normal"
            error={!!errors.email}
            helperText={errors.email}
          />
          
          {isEditing && (
            <TextField
              fullWidth
              label="New Password (optional)"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              margin="normal"
              error={!!errors.password}
              helperText={errors.password || "Leave blank to keep current password. Password must be at least 6 characters long, contain uppercase, lowercase, and number."}
            />
          )}

          <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
            Role: {user?.role}
          </Typography>

          <Button
            variant="contained"
            color={isEditing ? "success" : "primary"}
            onClick={handleUpdate}
            sx={{ mt: 2 }}
          >
            {isEditing ? 'Save Changes' : 'Update Profile'}
          </Button>

          {isEditing && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  password: '',
                });
                setErrors({
                  name: '',
                  email: '',
                  password: '',
                });
              }}
              sx={{ mt: 2, ml: 2 }}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage; 