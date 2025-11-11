import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Grid, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow,
    TableContainer, Paper, Select, MenuItem, FormControl, InputLabel, Chip, Tabs, Tab,
    Alert, Snackbar, IconButton, Divider
} from '@mui/material';
import { format } from 'date-fns';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { ContactIntegrationPanel, MicrosoftAuthButton } from './components/MicrosoftIntegration';

const API_URL = 'http://localhost:8030/api/crm';

function CRMModule() {
    const [tabValue, setTabValue] = useState(0);
    const [contacts, setContacts] = useState([]);
    const [leads, setLeads] = useState([]);
    const [communications, setCommunications] = useState([]);
    const [stats, setStats] = useState({});
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    // Contact Dialog State
    const [contactDialog, setContactDialog] = useState(false);
    const [currentContact, setCurrentContact] = useState(null);
    const [scanDialog, setScanDialog] = useState(false);
    const [scanning, setScanning] = useState(false);

    // Lead Dialog State
    const [leadDialog, setLeadDialog] = useState(false);
    const [currentLead, setCurrentLead] = useState(null);

    // Communication Dialog State
    const [commDialog, setCommDialog] = useState(false);
    const [currentComm, setCurrentComm] = useState(null);

    // Microsoft Integration State
    const [selectedContact, setSelectedContact] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [contactsRes, leadsRes, statsRes, companiesRes] = await Promise.all([
                axios.get(`${API_URL}/contacts`),
                axios.get(`${API_URL}/leads`),
                axios.get(`${API_URL}/stats`),
                axios.get(`${API_URL}/companies`)
            ]);
            setContacts(contactsRes.data);
            setLeads(leadsRes.data);
            setStats(statsRes.data);
            setCompanies(companiesRes.data);
        } catch (error) {
            console.error('Error fetching CRM data:', error);
            setAlert({ open: true, message: 'Error loading CRM data', severity: 'error' });
        }
        setLoading(false);
    };

    // Business Card Scanning
    const handleScanBusinessCard = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setScanning(true);
        const formData = new FormData();
        formData.append('card', file);

        try {
            const response = await axios.post(`${API_URL}/scan-business-card`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setCurrentContact({
                    ...response.data.data,
                    status: 'active'
                });
                setScanDialog(false);
                setContactDialog(true);
                setAlert({
                    open: true,
                    message: `Business card scanned successfully! Confidence: ${(response.data.confidence * 100).toFixed(1)}%`,
                    severity: 'success'
                });
            } else {
                setAlert({ open: true, message: response.data.error, severity: 'error' });
            }
        } catch (error) {
            setAlert({ open: true, message: 'Error scanning business card', severity: 'error' });
        }
        setScanning(false);
    };

    // Contact CRUD
    const handleSaveContact = async () => {
        try {
            if (currentContact?.id) {
                await axios.put(`${API_URL}/contacts/${currentContact.id}`, currentContact);
            } else {
                await axios.post(`${API_URL}/contacts`, currentContact);
            }
            fetchData();
            setContactDialog(false);
            setCurrentContact(null);
            setAlert({ open: true, message: 'Contact saved successfully', severity: 'success' });
        } catch (error) {
            setAlert({ open: true, message: 'Error saving contact', severity: 'error' });
        }
    };

    const handleDeleteContact = async (id) => {
        if (window.confirm('Delete this contact?')) {
            try {
                await axios.delete(`${API_URL}/contacts/${id}`);
                fetchData();
                setAlert({ open: true, message: 'Contact deleted', severity: 'success' });
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting contact', severity: 'error' });
            }
        }
    };

    // Lead CRUD
    const handleSaveLead = async () => {
        try {
            if (currentLead?.id) {
                await axios.put(`${API_URL}/leads/${currentLead.id}`, currentLead);
            } else {
                await axios.post(`${API_URL}/leads`, currentLead);
            }
            fetchData();
            setLeadDialog(false);
            setCurrentLead(null);
            setAlert({ open: true, message: 'Lead saved successfully', severity: 'success' });
        } catch (error) {
            setAlert({ open: true, message: 'Error saving lead', severity: 'error' });
        }
    };

    const handleDeleteLead = async (id) => {
        if (window.confirm('Delete this lead?')) {
            try {
                await axios.delete(`${API_URL}/leads/${id}`);
                fetchData();
                setAlert({ open: true, message: 'Lead deleted', severity: 'success' });
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting lead', severity: 'error' });
            }
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            active: 'success',
            new: 'info',
            qualified: 'primary',
            contacted: 'warning',
            won: 'success',
            lost: 'error'
        };
        return colors[status] || 'default';
    };

    return (
        <Box>
            {/* CRM Statistics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>
                                {stats.contacts || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Active Contacts
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h3" sx={{ fontWeight: 300, color: '#C94A3C' }}>
                                {stats.leads || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Total Leads
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h3" sx={{ fontWeight: 300, color: '#10b981' }}>
                                ${(stats.leadsValue || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Pipeline Value
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h3" sx={{ fontWeight: 300, color: '#8b5cf6' }}>
                                {stats.recentActivities || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Activities (30d)
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* CRM Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Contacts" />
                    <Tab label="Leads" />
                </Tabs>
            </Paper>

            {/* Contacts Tab */}
            {tabValue === 0 && (
                <Box>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">Microsoft Integration</Typography>
                            <MicrosoftAuthButton />
                        </Box>
                    </Paper>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6">Contacts</Typography>
                                    <Box>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="business-card-upload"
                                type="file"
                                onChange={handleScanBusinessCard}
                            />
                            <label htmlFor="business-card-upload">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<CameraAltIcon />}
                                    sx={{ mr: 1 }}
                                    disabled={scanning}
                                >
                                    {scanning ? 'Scanning...' : 'Scan Business Card'}
                                </Button>
                            </label>
                            <Button
                                variant="contained"
                                startIcon={<PersonAddIcon />}
                                onClick={() => {
                                    setCurrentContact({
                                        first_name: '', last_name: '', full_name: '', company: '', company_id: null,
                                        job_title: '', email: '', phone: '', mobile: '', website: '',
                                        address: '', notes: '', status: 'active', source: 'manual'
                                    });
                                    setContactDialog(true);
                                }}
                            >
                                Add Contact
                            </Button>
                        </Box>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Company</TableCell>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell>Source</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {contacts.map((contact) => (
                                    <TableRow
                                        key={contact.id}
                                        hover
                                        sx={{ cursor: 'pointer', bgcolor: selectedContact?.id === contact.id ? 'action.selected' : 'inherit' }}
                                        onClick={() => setSelectedContact(contact)}
                                    >
                                        <TableCell>{contact.full_name || `${contact.first_name} ${contact.last_name}`}</TableCell>
                                        <TableCell>{contact.company_name || contact.company}</TableCell>
                                        <TableCell>{contact.job_title}</TableCell>
                                        <TableCell>{contact.email}</TableCell>
                                        <TableCell>{contact.phone || contact.mobile}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={contact.source}
                                                size="small"
                                                color={contact.source === 'business_card_scan' ? 'primary' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={contact.status} size="small" color={getStatusColor(contact.status)} />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => { setCurrentContact(contact); setContactDialog(true); }}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteContact(contact.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
                        </Grid>

                        {/* Microsoft Integration Panel */}
                        <Grid item xs={12} md={4}>
                            <ContactIntegrationPanel
                                contact={selectedContact ? {
                                    ...selectedContact,
                                    company_name: selectedContact.company_name || selectedContact.company
                                } : null}
                            />
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Leads Tab */}
            {tabValue === 1 && (
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Leads</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setCurrentLead({
                                    company: '', contact_name: '', email: '', phone: '',
                                    status: 'new', stage: 'prospecting', value: 0, probability: 0,
                                    notes: ''
                                });
                                setLeadDialog(true);
                            }}
                        >
                            Add Lead
                        </Button>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Company</TableCell>
                                    <TableCell>Contact</TableCell>
                                    <TableCell>Stage</TableCell>
                                    <TableCell>Value</TableCell>
                                    <TableCell>Probability</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Next Action</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>{lead.company}</TableCell>
                                        <TableCell>{lead.contact_name}</TableCell>
                                        <TableCell>{lead.stage}</TableCell>
                                        <TableCell>${(lead.value || 0).toLocaleString()}</TableCell>
                                        <TableCell>{lead.probability}%</TableCell>
                                        <TableCell>
                                            <Chip label={lead.status} size="small" color={getStatusColor(lead.status)} />
                                        </TableCell>
                                        <TableCell>{lead.next_action}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => { setCurrentLead(lead); setLeadDialog(true); }}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteLead(lead.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Contact Dialog */}
            <Dialog open={contactDialog} onClose={() => setContactDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{currentContact?.id ? 'Edit Contact' : 'New Contact'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={currentContact?.first_name || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, first_name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={currentContact?.last_name || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, last_name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={currentContact?.full_name || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, full_name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Company</InputLabel>
                                <Select
                                    value={currentContact?.company_id || ''}
                                    onChange={(e) => {
                                        const selectedCompany = companies.find(c => c.id === e.target.value);
                                        setCurrentContact({
                                            ...currentContact,
                                            company_id: e.target.value,
                                            company: selectedCompany?.name || ''
                                        });
                                    }}
                                    label="Company"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {companies.map((company) => (
                                        <MenuItem key={company.id} value={company.id}>
                                            {company.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Job Title"
                                value={currentContact?.job_title || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, job_title: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={currentContact?.email || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, email: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={currentContact?.phone || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, phone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Mobile"
                                value={currentContact?.mobile || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, mobile: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Website"
                                value={currentContact?.website || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, website: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={currentContact?.status || 'active'}
                                    onChange={(e) => setCurrentContact({ ...currentContact, status: e.target.value })}
                                    label="Status"
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                value={currentContact?.address || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, address: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={3}
                                value={currentContact?.notes || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setContactDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveContact} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Lead Dialog */}
            <Dialog open={leadDialog} onClose={() => setLeadDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{currentLead?.id ? 'Edit Lead' : 'New Lead'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Company"
                                value={currentLead?.company || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, company: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Contact Name"
                                value={currentLead?.contact_name || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, contact_name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={currentLead?.email || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, email: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={currentLead?.phone || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, phone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Stage</InputLabel>
                                <Select
                                    value={currentLead?.stage || 'prospecting'}
                                    onChange={(e) => setCurrentLead({ ...currentLead, stage: e.target.value })}
                                    label="Stage"
                                >
                                    <MenuItem value="prospecting">Prospecting</MenuItem>
                                    <MenuItem value="qualified">Qualified</MenuItem>
                                    <MenuItem value="demo">Demo</MenuItem>
                                    <MenuItem value="proposal">Proposal</MenuItem>
                                    <MenuItem value="negotiation">Negotiation</MenuItem>
                                    <MenuItem value="closed">Closed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={currentLead?.status || 'new'}
                                    onChange={(e) => setCurrentLead({ ...currentLead, status: e.target.value })}
                                    label="Status"
                                >
                                    <MenuItem value="new">New</MenuItem>
                                    <MenuItem value="contacted">Contacted</MenuItem>
                                    <MenuItem value="qualified">Qualified</MenuItem>
                                    <MenuItem value="won">Won</MenuItem>
                                    <MenuItem value="lost">Lost</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Value"
                                type="number"
                                value={currentLead?.value || 0}
                                onChange={(e) => setCurrentLead({ ...currentLead, value: parseFloat(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Probability (%)"
                                type="number"
                                value={currentLead?.probability || 0}
                                onChange={(e) => setCurrentLead({ ...currentLead, probability: parseInt(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Source"
                                value={currentLead?.source || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, source: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Industry"
                                value={currentLead?.industry || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, industry: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Next Action"
                                value={currentLead?.next_action || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, next_action: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={3}
                                value={currentLead?.notes || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLeadDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveLead} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Alert Snackbar */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={() => setAlert({ ...alert, open: false })}
            >
                <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default CRMModule;
