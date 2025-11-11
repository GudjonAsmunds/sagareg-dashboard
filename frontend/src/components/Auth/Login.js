import React, { useState } from 'react';
import axios from 'axios';
import {
    Box, Paper, TextField, Button, Typography, Alert, Container,
    InputAdornment, IconButton, Divider, Link
} from '@mui/material';
import {
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    Login as LoginIcon,
    PersonAdd as PersonAddIcon
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8030';

export default function Login({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (!formData.email || !formData.password) {
            setError('Email and password are required');
            setLoading(false);
            return;
        }

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const response = await axios.post(`${API_URL}${endpoint}`, {
                email: formData.email,
                password: formData.password,
                name: !isLogin ? formData.name : undefined
            });

            if (response.data.success) {
                // Store token and user info
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('userId', response.data.user.id);

                // Call the success callback
                onLoginSuccess(response.data.user, response.data.token);
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.response?.data?.error || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error when user types
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({
            email: '',
            password: '',
            name: '',
            confirmPassword: ''
        });
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                            bgcolor: 'primary.main',
                            borderRadius: 2,
                            p: 1,
                            display: 'flex',
                            mr: 2
                        }}>
                            {isLogin ?
                                <LoginIcon sx={{ color: 'white' }} /> :
                                <PersonAddIcon sx={{ color: 'white' }} />
                            }
                        </Box>
                        <Typography component="h1" variant="h5">
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </Typography>
                    </Box>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        {isLogin ?
                            'Welcome back! Please login to your account.' :
                            'Welcome! Create your account to get started.'
                        }
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <TextField
                                fullWidth
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                margin="normal"
                                variant="outlined"
                                autoComplete="name"
                            />
                        )}

                        <TextField
                            fullWidth
                            required
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            margin="normal"
                            variant="outlined"
                            autoComplete="email"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            required
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            margin="normal"
                            variant="outlined"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {!isLogin && (
                            <TextField
                                fullWidth
                                required
                                label="Confirm Password"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                margin="normal"
                                variant="outlined"
                                autoComplete="new-password"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </Button>

                        {isLogin && (
                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                <Typography variant="caption" color="textSecondary">
                                    Demo credentials: admin@sagareg.com / admin123
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ my: 2 }}>OR</Divider>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleMode();
                                    }}
                                    sx={{ fontWeight: 'bold' }}
                                >
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </Link>
                            </Typography>
                        </Box>
                    </form>
                </Paper>

                <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 3 }}>
                    SagaReg Dashboard © {new Date().getFullYear()}
                </Typography>
            </Box>
        </Container>
    );
}