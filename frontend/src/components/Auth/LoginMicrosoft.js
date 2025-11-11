import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Paper, Typography, Container, Button, CircularProgress, Alert
} from '@mui/material';
import MicrosoftIcon from '@mui/icons-material/Business';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8030';

export default function LoginMicrosoft({ onLoginSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check for Microsoft OAuth callback parameters
        const urlParams = new URLSearchParams(window.location.search);
        const authStatus = urlParams.get('auth');
        const userId = urlParams.get('userId');

        if (authStatus === 'success' && userId) {
            // Microsoft authentication successful
            handleMicrosoftSuccess(userId);
        } else if (authStatus === 'failed') {
            setError('Microsoft authentication failed. Please try again.');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleMicrosoftSuccess = async (userId) => {
        try {
            // Get user details from backend using userId
            const response = await axios.get(`${API_URL}/api/auth/microsoft/user/${userId}`);

            if (response.data.success) {
                // Store auth data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('userId', response.data.user.id);

                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);

                // Call success callback
                onLoginSuccess(response.data.user, response.data.token);
            }
        } catch (err) {
            console.error('Error fetching user details:', err);
            setError('Failed to complete login. Please try again.');
        }
    };

    const handleMicrosoftLogin = async () => {
        setLoading(true);
        setError('');

        try {
            // Get Microsoft OAuth URL from backend
            const response = await axios.get(`${API_URL}/api/auth/microsoft/login`);

            // Redirect to Microsoft login
            window.location.href = response.data.authUrl;
        } catch (err) {
            console.error('Microsoft login error:', err);
            setError('Failed to initiate Microsoft login. Please try again.');
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ padding: 5, width: '100%', textAlign: 'center' }}>
                    {/* Logo */}
                    <Typography variant="h3" sx={{ mb: 1 }}>
                        <span style={{ color: '#2B2D42', fontWeight: 300, letterSpacing: 2 }}>SAGA</span>
                        <span style={{ color: '#C94A3C', fontWeight: 300, letterSpacing: 2 }}>REG</span>
                    </Typography>

                    <Typography variant="h5" component="h1" gutterBottom sx={{ mt: 3 }}>
                        Welcome to SagaReg
                    </Typography>

                    <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                        Sign in with your Microsoft account to continue
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mt: 4 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleMicrosoftLogin}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <MicrosoftIcon />}
                            sx={{
                                py: 1.5,
                                bgcolor: '#0078d4',
                                '&:hover': {
                                    bgcolor: '#106ebe'
                                },
                                textTransform: 'none',
                                fontSize: '1rem'
                            }}
                        >
                            {loading ? 'Connecting...' : 'Sign in with Microsoft'}
                        </Button>
                    </Box>

                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 4 }}>
                        By signing in, you agree to use Microsoft authentication for accessing SagaReg Dashboard.
                    </Typography>

                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
                        Your Microsoft account will be used for:
                        <br />• Authentication & Authorization
                        <br />• Document Management via Teams/SharePoint
                        <br />• Email Integration via Outlook
                    </Typography>
                </Paper>

                <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 3 }}>
                    SagaReg Dashboard © {new Date().getFullYear()}
                </Typography>
            </Box>
        </Container>
    );
}