import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, Typography, CircularProgress, Alert, List, ListItem,
    ListItemText, ListItemIcon, IconButton, Paper, Grid, Divider,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import MicrosoftIcon from '@mui/icons-material/Business';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8030';

export function EmailComposer({ contactId, contactEmail, contactName, open, onClose }) {
    const [emailData, setEmailData] = useState({
        to: contactEmail ? [contactEmail] : [],
        cc: [],
        bcc: [],
        subject: '',
        content: ''
    });
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    // Fetch email templates
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await axios.get(`${API_URL}/crm/email-templates`);
                setTemplates(response.data);
            } catch (err) {
                console.error('Error fetching templates:', err);
            }
        };
        fetchTemplates();
    }, []);

    // Update the "to" field when contactEmail changes
    useEffect(() => {
        if (contactEmail) {
            setEmailData(prev => ({
                ...prev,
                to: [contactEmail]
            }));
        }
    }, [contactEmail]);

    // Apply template
    const handleTemplateChange = (templateId) => {
        setSelectedTemplate(templateId);
        if (templateId) {
            const template = templates.find(t => t.id === templateId);
            if (template) {
                // Replace placeholders with actual values
                let subject = template.subject
                    .replace(/\{\{contact_name\}\}/g, contactName || '')
                    .replace(/\{\{company_name\}\}/g, '');

                let body = template.body
                    .replace(/\{\{contact_name\}\}/g, contactName || '')
                    .replace(/\{\{company_name\}\}/g, '');

                setEmailData(prev => ({
                    ...prev,
                    subject,
                    content: body
                }));
            }
        }
    };

    const handleSend = async () => {
        setSending(true);
        setError('');

        try {
            await axios.post(`${API_URL}/api/microsoft/email/send`, {
                ...emailData,
                contactId,
                userId: localStorage.getItem('userId') // Assuming you store userId
            });

            onClose();
            // Show success notification
        } catch (err) {
            if (err.response?.status === 401) {
                // Need to authenticate with Microsoft
                window.location.href = err.response.data.authUrl;
            } else {
                setError('Failed to send email: ' + err.message);
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box>
                    <Typography variant="h6" component="div">
                        Send Email as You
                    </Typography>
                    <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                        This email will be sent from your Microsoft account
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <FormControl fullWidth margin="normal">
                    <InputLabel>Template</InputLabel>
                    <Select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        label="Template"
                        disabled={sending}
                    >
                        <MenuItem value="">None (Blank)</MenuItem>
                        {templates.map(template => (
                            <MenuItem key={template.id} value={template.id}>
                                {template.name} - {template.category}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    label="To"
                    value={emailData.to.join(', ')}
                    onChange={(e) => setEmailData({
                        ...emailData,
                        to: e.target.value.split(',').map(email => email.trim())
                    })}
                    margin="normal"
                    disabled={sending}
                />

                <TextField
                    fullWidth
                    label="CC"
                    value={emailData.cc.join(', ')}
                    onChange={(e) => setEmailData({
                        ...emailData,
                        cc: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                    })}
                    margin="normal"
                    disabled={sending}
                />

                <TextField
                    fullWidth
                    label="Subject"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    margin="normal"
                    disabled={sending}
                    required
                />

                <TextField
                    fullWidth
                    label="Message"
                    value={emailData.content}
                    onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                    margin="normal"
                    multiline
                    rows={10}
                    disabled={sending}
                    required
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={sending}>Cancel</Button>
                <Button
                    onClick={handleSend}
                    variant="contained"
                    startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
                    disabled={sending || !emailData.subject || !emailData.content || emailData.to.length === 0}
                >
                    {sending ? 'Sending...' : 'Send Email'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function DocumentManager({ contactId, contactName, companyName }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Get user from localStorage (set during login)
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (contactId && userStr && token) {
            const user = JSON.parse(userStr);
            // Only fetch if we have authentication
            if (user.id) {
                fetchDocuments();
            }
        } else if (contactId && (!userStr || !token)) {
            setError('Please sign in to access documents.');
        }
    }, [contactId]);

    const fetchDocuments = async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            setError('Please sign in to access documents.');
            setLoading(false);
            return;
        }

        const user = JSON.parse(userStr);

        setLoading(true);
        try {
            const response = await axios.get(
                `${API_URL}/api/microsoft/documents/contact/${contactId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-user-id': user.id
                    }
                }
            );
            setDocuments(response.data.dbDocuments || []);
            setError(''); // Clear any previous errors
        } catch (err) {
            if (err.response?.status === 401) {
                const errorData = err.response?.data;
                if (errorData?.authUrl) {
                    // Microsoft authentication required
                    setError('Microsoft authentication required. Please connect your Microsoft account below.');
                    console.error('Auth error details:', errorData);
                } else {
                    setError('Authentication failed. Please sign in again.');
                }
            } else {
                setError('Failed to fetch documents: ' + (err.response?.data?.error || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            setError('Please sign in to upload documents.');
            return;
        }

        const user = JSON.parse(userStr);

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post(
                `${API_URL}/api/microsoft/documents/upload/${contactId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                        'x-user-id': user.id
                    }
                }
            );

            fetchDocuments(); // Refresh list
        } catch (err) {
            setError('Failed to upload document: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (fileId, fileName) => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            setError('Please sign in to download documents.');
            return;
        }

        const user = JSON.parse(userStr);

        try {
            const response = await axios.get(
                `${API_URL}/api/microsoft/documents/download/${fileId}`,
                {
                    responseType: 'blob',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-user-id': user.id
                    }
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Failed to download document');
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                    <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Documents
                </Typography>
                <Box>
                    <input
                        accept="*"
                        style={{ display: 'none' }}
                        id="file-upload"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    <label htmlFor="file-upload">
                        <Button
                            variant="contained"
                            component="span"
                            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                            disabled={uploading}
                            size="small"
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </label>
                    <IconButton onClick={fetchDocuments} disabled={loading} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            <Typography variant="caption" display="block" gutterBottom>
                Files are stored in Teams: General/SagaReg/Projects/{companyName}/Contacts/{contactName}
            </Typography>

            {error && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {error}
                    {error.includes('Microsoft authentication required') && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Please log out and log back in with your Microsoft account to access documents.
                        </Typography>
                    )}
                </Alert>
            )}

            {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            ) : (
                <List>
                    {documents.length === 0 ? (
                        <ListItem>
                            <ListItemText
                                primary="No documents yet"
                                secondary="Upload documents to store them in Microsoft Teams"
                            />
                        </ListItem>
                    ) : (
                        documents.map((doc) => (
                            <ListItem key={doc.id} divider>
                                <ListItemIcon>
                                    <AttachFileIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={doc.file_name}
                                    secondary={`${(doc.file_size / 1024).toFixed(2)} KB • Uploaded ${new Date(doc.created_at).toLocaleDateString()}`}
                                />
                                <IconButton
                                    onClick={() => handleDownload(doc.teams_file_id, doc.file_name)}
                                    size="small"
                                >
                                    <DownloadIcon />
                                </IconButton>
                            </ListItem>
                        ))
                    )}
                </List>
            )}
        </Paper>
    );
}

export function MicrosoftAuthButton() {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        // Check for auth callback parameters in URL
        const urlParams = new URLSearchParams(window.location.search);
        const authStatus = urlParams.get('auth');
        const userId = urlParams.get('userId');

        if (authStatus === 'success' && userId) {
            // Store userId in localStorage
            localStorage.setItem('userId', userId);
            setAuthenticated(true);

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);

            // Show success message
            console.log('Microsoft authentication successful');
            // Reload the page to refresh document list
            window.location.reload();
        } else if (authStatus === 'failed') {
            console.error('Microsoft authentication failed');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            setCheckingAuth(false);
            return;
        }

        try {
            const user = JSON.parse(userStr);
            // Check if user has Microsoft auth by calling the /me endpoint
            const response = await axios.get(`${API_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setAuthenticated(response.data.hasMicrosoftAuth || false);
        } catch (err) {
            console.error('Error checking Microsoft auth status:', err);
            setAuthenticated(false);
        } finally {
            setCheckingAuth(false);
        }
    };

    const handleAuth = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/microsoft/auth/microsoft`);
            window.location.href = response.data.authUrl;
        } catch (err) {
            console.error('Auth error:', err);
            alert('Failed to initiate Microsoft authentication. Please try again.');
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <Button variant="outlined" disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Checking...
            </Button>
        );
    }

    return (
        <Button
            variant={authenticated ? "outlined" : "contained"}
            color={authenticated ? "success" : "primary"}
            startIcon={loading ? <CircularProgress size={20} /> : <MicrosoftIcon />}
            onClick={handleAuth}
            disabled={loading}
        >
            {loading ? 'Connecting...' : authenticated ? 'Reconnect Microsoft Account' : 'Connect Microsoft Account'}
        </Button>
    );
}

export function ContactIntegrationPanel({ contact }) {
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);

    if (!contact) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Select a contact to view integration options</Typography>
            </Paper>
        );
    }

    return (
        <Grid container spacing={2}>

            <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        {contact.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        {contact.company_name || 'No Company'}
                    </Typography>

                    <Box mt={2}>
                        <Button
                            variant="contained"
                            startIcon={<EmailIcon />}
                            onClick={() => setEmailDialogOpen(true)}
                            sx={{ mr: 1 }}
                        >
                            Send Email
                        </Button>
                    </Box>
                </Paper>
            </Grid>

            <Grid item xs={12}>
                <DocumentManager
                    contactId={contact.id}
                    contactName={contact.name}
                    companyName={contact.company_name}
                />
            </Grid>

            <EmailComposer
                contactId={contact.id}
                contactEmail={contact.email}
                contactName={contact.name}
                open={emailDialogOpen}
                onClose={() => setEmailDialogOpen(false)}
            />
        </Grid>
    );
}