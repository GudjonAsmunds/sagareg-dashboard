import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import App from './App';
import LoginMicrosoft from './components/Auth/LoginMicrosoft';
import { CircularProgress, Box } from '@mui/material';

const theme = createTheme({
    typography: {
        fontFamily: 'Inter, sans-serif',
    },
    palette: {
        primary: {
            main: '#C94A3C',
        },
        secondary: {
            main: '#2B2D42',
        }
    }
});

function AuthenticatedApp() {
    const { isAuthenticated, loading, login } = useAuth();

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <LoginMicrosoft onLoginSuccess={login} />;
    }

    return <App />;
}

export default function AppWithAuth() {
    return (
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <AuthenticatedApp />
            </AuthProvider>
        </ThemeProvider>
    );
}