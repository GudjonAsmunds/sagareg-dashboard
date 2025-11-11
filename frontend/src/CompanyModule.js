import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Grid, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow,
    TableContainer, Paper, Select, MenuItem, FormControl, InputLabel, Chip, Tabs, Tab,
    Alert, Snackbar, IconButton, Divider, List, ListItem, ListItemText
} from '@mui/material';
import { format } from 'date-fns';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

const API_URL = 'http://localhost:8030/api/crm';

function CompanyModule() {
    const [tabValue, setTabValue] = useState(0);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyContacts, setCompanyContacts] = useState([]);
    const [companyCommunications, setCompanyCommunications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    // Company Dialog State
    const [companyDialog, setCompanyDialog] = useState(false);
    const [currentCompany, setCurrentCompany] = useState(null);

    // Communication Dialog State
    const [commDialog, setCommDialog] = useState(false);
    const [currentComm, setCurrentComm] = useState(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/companies`);
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
            setAlert({ open: true, message: 'Error loading companies', severity: 'error' });
        }
        setLoading(false);
    };

    const fetchCompanyDetails = async (companyId) => {
        try {
            const [contactsRes, commsRes] = await Promise.all([
                axios.get(`${API_URL}/companies/${companyId}/contacts`),
                axios.get(`${API_URL}/companies/${companyId}/communications`)
            ]);
            setCompanyContacts(contactsRes.data);
            setCompanyCommunications(commsRes.data);
        } catch (error) {
            console.error('Error fetching company details:', error);
            setAlert({ open: true, message: 'Error loading company details', severity: 'error' });
        }
    };

    const handleSelectCompany = async (company) => {
        setSelectedCompany(company);
        await fetchCompanyDetails(company.id);
    };

    const handleSaveCompany = async () => {
        try {
            if (currentCompany?.id) {
                await axios.put(`${API_URL}/companies/${currentCompany.id}`, currentCompany);
                setAlert({ open: true, message: 'Company updated successfully', severity: 'success' });
            } else {
                await axios.post(`${API_URL}/companies`, currentCompany);
                setAlert({ open: true, message: 'Company created successfully', severity: 'success' });
            }
            setCompanyDialog(false);
            setCurrentCompany(null);
            fetchCompanies();
        } catch (error) {
            setAlert({ open: true, message: 'Error saving company', severity: 'error' });
        }
    };

    const handleDeleteCompany = async (id) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            try {
                await axios.delete(`${API_URL}/companies/${id}`);
                setAlert({ open: true, message: 'Company deleted successfully', severity: 'success' });
                fetchCompanies();
                if (selectedCompany?.id === id) {
                    setSelectedCompany(null);
                    setCompanyContacts([]);
                    setCompanyCommunications([]);
                }
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting company', severity: 'error' });
            }
        }
    };

    const handleSaveCommunication = async () => {
        try {
            const commData = {
                ...currentComm,
                company_id: selectedCompany.id
            };
            await axios.post(`${API_URL}/communications`, commData);
            setAlert({ open: true, message: 'Communication logged successfully', severity: 'success' });
            setCommDialog(false);
            setCurrentComm(null);
            fetchCompanyDetails(selectedCompany.id);
        } catch (error) {
            setAlert({ open: true, message: 'Error saving communication', severity: 'error' });
        }
    };

    const handleDeleteCommunication = async (id) => {
        if (window.confirm('Are you sure you want to delete this communication?')) {
            try {
                await axios.delete(`${API_URL}/communications/${id}`);
                setAlert({ open: true, message: 'Communication deleted successfully', severity: 'success' });
                fetchCompanyDetails(selectedCompany.id);
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting communication', severity: 'error' });
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">
                    <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Company Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setCurrentCompany({
                            name: '',
                            industry: '',
                            website: '',
                            phone: '',
                            email: '',
                            address: '',
                            city: '',
                            state: '',
                            country: '',
                            postal_code: '',
                            employee_count: '',
                            revenue_range: '',
                            linkedin_url: '',
                            description: '',
                            notes: '',
                            status: 'active'
                        });
                        setCompanyDialog(true);
                    }}
                >
                    Add Company
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Companies List */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Companies</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <List>
                                {companies.map((company) => (
                                    <ListItem
                                        key={company.id}
                                        button
                                        selected={selectedCompany?.id === company.id}
                                        onClick={() => handleSelectCompany(company)}
                                        sx={{
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            mb: 1,
                                            '&:hover': { bgcolor: '#f5f5f5' }
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="subtitle1">{company.name}</Typography>
                                                    <Box>
                                                        <IconButton size="small" onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCurrentCompany(company);
                                                            setCompanyDialog(true);
                                                        }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCompany(company.id);
                                                        }}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    {company.industry && <Typography variant="caption" display="block">{company.industry}</Typography>}
                                                    <Box sx={{ mt: 0.5 }}>
                                                        <Chip label={`${company.contact_count || 0} contacts`} size="small" sx={{ mr: 0.5 }} />
                                                        <Chip label={`${company.lead_count || 0} leads`} size="small" />
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                                {companies.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                                        No companies yet. Add your first company!
                                    </Typography>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Company Details */}
                <Grid item xs={12} md={8}>
                    {selectedCompany ? (
                        <Box>
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom>{selectedCompany.name}</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            {selectedCompany.industry && (
                                                <Typography variant="body2" gutterBottom>
                                                    <strong>Industry:</strong> {selectedCompany.industry}
                                                </Typography>
                                            )}
                                            {selectedCompany.website && (
                                                <Typography variant="body2" gutterBottom>
                                                    <strong>Website:</strong> <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">{selectedCompany.website}</a>
                                                </Typography>
                                            )}
                                            {selectedCompany.phone && (
                                                <Typography variant="body2" gutterBottom>
                                                    <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                                    {selectedCompany.phone}
                                                </Typography>
                                            )}
                                            {selectedCompany.email && (
                                                <Typography variant="body2" gutterBottom>
                                                    <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                                    {selectedCompany.email}
                                                </Typography>
                                            )}
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            {selectedCompany.employee_count && (
                                                <Typography variant="body2" gutterBottom>
                                                    <strong>Employees:</strong> {selectedCompany.employee_count}
                                                </Typography>
                                            )}
                                            {selectedCompany.revenue_range && (
                                                <Typography variant="body2" gutterBottom>
                                                    <strong>Revenue:</strong> {selectedCompany.revenue_range}
                                                </Typography>
                                            )}
                                            {selectedCompany.address && (
                                                <Typography variant="body2" gutterBottom>
                                                    <strong>Address:</strong> {selectedCompany.address}
                                                    {selectedCompany.city && `, ${selectedCompany.city}`}
                                                    {selectedCompany.state && `, ${selectedCompany.state}`}
                                                    {selectedCompany.country && `, ${selectedCompany.country}`}
                                                </Typography>
                                            )}
                                        </Grid>
                                        {selectedCompany.description && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2">
                                                    <strong>Description:</strong> {selectedCompany.description}
                                                </Typography>
                                            </Grid>
                                        )}
                                        {selectedCompany.notes && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2">
                                                    <strong>Notes:</strong> {selectedCompany.notes}
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </CardContent>
                            </Card>

                            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                                <Tab label={`Contacts (${companyContacts.length})`} />
                                <Tab label={`Communications (${companyCommunications.length})`} />
                            </Tabs>

                            {/* Contacts Tab */}
                            {tabValue === 0 && (
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="h6">Contacts</Typography>
                                        </Box>
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>Job Title</TableCell>
                                                        <TableCell>Email</TableCell>
                                                        <TableCell>Phone</TableCell>
                                                        <TableCell>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {companyContacts.map((contact) => (
                                                        <TableRow key={contact.id}>
                                                            <TableCell>{contact.full_name || `${contact.first_name} ${contact.last_name}`}</TableCell>
                                                            <TableCell>{contact.job_title}</TableCell>
                                                            <TableCell>{contact.email}</TableCell>
                                                            <TableCell>{contact.phone || contact.mobile}</TableCell>
                                                            <TableCell>
                                                                <Chip label={contact.status} size="small" color={contact.status === 'active' ? 'success' : 'default'} />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {companyContacts.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={5} align="center">
                                                                <Typography variant="body2" color="text.secondary">
                                                                    No contacts for this company
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Communications Tab */}
                            {tabValue === 1 && (
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="h6">Communications</Typography>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={() => {
                                                    setCurrentComm({
                                                        type: 'call',
                                                        subject: '',
                                                        description: '',
                                                        date: new Date().toISOString().slice(0, 16),
                                                        duration_minutes: 0,
                                                        outcome: '',
                                                        follow_up_required: false,
                                                        follow_up_date: '',
                                                        created_by: ''
                                                    });
                                                    setCommDialog(true);
                                                }}
                                            >
                                                Log Communication
                                            </Button>
                                        </Box>
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Date</TableCell>
                                                        <TableCell>Type</TableCell>
                                                        <TableCell>Subject</TableCell>
                                                        <TableCell>Outcome</TableCell>
                                                        <TableCell>Actions</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {companyCommunications.map((comm) => (
                                                        <TableRow key={comm.id}>
                                                            <TableCell>{format(new Date(comm.date), 'MMM dd, yyyy')}</TableCell>
                                                            <TableCell>
                                                                <Chip label={comm.type} size="small" />
                                                            </TableCell>
                                                            <TableCell>{comm.subject}</TableCell>
                                                            <TableCell>{comm.outcome}</TableCell>
                                                            <TableCell>
                                                                <IconButton size="small" onClick={() => handleDeleteCommunication(comm.id)}>
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {companyCommunications.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={5} align="center">
                                                                <Typography variant="body2" color="text.secondary">
                                                                    No communications logged
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </CardContent>
                                </Card>
                            )}
                        </Box>
                    ) : (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="text.secondary" align="center" sx={{ py: 10 }}>
                                    Select a company to view details
                                </Typography>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Company Dialog */}
            <Dialog open={companyDialog} onClose={() => setCompanyDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{currentCompany?.id ? 'Edit Company' : 'Add Company'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Company Name"
                                required
                                value={currentCompany?.name || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Industry"
                                value={currentCompany?.industry || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, industry: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Website"
                                value={currentCompany?.website || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, website: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={currentCompany?.phone || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, phone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={currentCompany?.email || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, email: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                value={currentCompany?.address || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, address: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="City"
                                value={currentCompany?.city || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, city: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="State"
                                value={currentCompany?.state || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, state: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Country"
                                value={currentCompany?.country || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, country: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Employee Count"
                                value={currentCompany?.employee_count || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, employee_count: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Revenue Range"
                                value={currentCompany?.revenue_range || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, revenue_range: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="LinkedIn URL"
                                value={currentCompany?.linkedin_url || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, linkedin_url: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={currentCompany?.description || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={3}
                                value={currentCompany?.notes || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, notes: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={currentCompany?.status || 'active'}
                                    onChange={(e) => setCurrentCompany({ ...currentCompany, status: e.target.value })}
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                    <MenuItem value="prospect">Prospect</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCompanyDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveCompany} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Communication Dialog */}
            <Dialog open={commDialog} onClose={() => setCommDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Log Communication</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={currentComm?.type || 'call'}
                                    onChange={(e) => setCurrentComm({ ...currentComm, type: e.target.value })}
                                >
                                    <MenuItem value="call">Call</MenuItem>
                                    <MenuItem value="email">Email</MenuItem>
                                    <MenuItem value="meeting">Meeting</MenuItem>
                                    <MenuItem value="note">Note</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Date & Time"
                                type="datetime-local"
                                value={currentComm?.date || ''}
                                onChange={(e) => setCurrentComm({ ...currentComm, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Subject"
                                value={currentComm?.subject || ''}
                                onChange={(e) => setCurrentComm({ ...currentComm, subject: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={4}
                                value={currentComm?.description || ''}
                                onChange={(e) => setCurrentComm({ ...currentComm, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Duration (minutes)"
                                type="number"
                                value={currentComm?.duration_minutes || ''}
                                onChange={(e) => setCurrentComm({ ...currentComm, duration_minutes: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Outcome"
                                value={currentComm?.outcome || ''}
                                onChange={(e) => setCurrentComm({ ...currentComm, outcome: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCommDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveCommunication} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Alert Snackbar */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={() => setAlert({ ...alert, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.severity}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default CompanyModule;
