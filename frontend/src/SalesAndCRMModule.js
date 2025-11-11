import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Grid, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow,
    TableContainer, Paper, Select, MenuItem, FormControl, InputLabel, Chip, Tabs, Tab,
    Alert, Snackbar, IconButton, Divider, List, ListItem, ListItemText, ButtonGroup,
    ListItemIcon, Badge, Checkbox, FormControlLabel, InputAdornment, Autocomplete
} from '@mui/material';
import { format } from 'date-fns';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CommentIcon from '@mui/icons-material/Comment';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import WarningIcon from '@mui/icons-material/Warning';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import { ContactIntegrationPanel, MicrosoftAuthButton, EmailComposer, DocumentManager } from './components/MicrosoftIntegration';
import SendIcon from '@mui/icons-material/Send';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';

const API_URL = 'http://localhost:8030/api';
const CRM_API_URL = 'http://localhost:8030/api/crm';

function SalesAndCRMModule() {
    const [mainTab, setMainTab] = useState(0); // 0: Pipeline, 1: CRM, 2: Companies
    const [crmSubTab, setCrmSubTab] = useState(0); // 0: Contacts, 1: Leads
    const [companySubTab, setCompanySubTab] = useState(0); // 0: Contacts, 1: Communications

    // Data State
    const [deals, setDeals] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [leads, setLeads] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyContacts, setCompanyContacts] = useState([]);
    const [companyCommunications, setCompanyCommunications] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    // Deal Dialog State
    const [dealDialog, setDealDialog] = useState(false);
    const [currentDeal, setCurrentDeal] = useState(null);

    // Contact Dialog State
    const [contactDialog, setContactDialog] = useState(false);
    const [currentContact, setCurrentContact] = useState(null);
    const [scanning, setScanning] = useState(false);

    // Lead Dialog State
    const [leadDialog, setLeadDialog] = useState(false);
    const [currentLead, setCurrentLead] = useState(null);

    // Company Dialog State
    const [companyDialog, setCompanyDialog] = useState(false);
    const [currentCompany, setCurrentCompany] = useState(null);

    // Communication Dialog State
    const [commDialog, setCommDialog] = useState(false);
    const [currentComm, setCurrentComm] = useState(null);

    // Microsoft Integration State
    const [selectedContact, setSelectedContact] = useState(null);

    // Contact Details Dialog State
    const [contactDetailsDialog, setContactDetailsDialog] = useState(false);
    const [selectedContactForDetails, setSelectedContactForDetails] = useState(null);
    const [contactCommunications, setContactCommunications] = useState([]);

    // Pipeline View State
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
    const [draggedDeal, setDraggedDeal] = useState(null);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDialog, setFilterDialog] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        priority: '',
        stage: '',
        status: ''
    });
    const [savedFilters, setSavedFilters] = useState([]);

    // Task Management State
    const [tasks, setTasks] = useState([]);
    const [taskDialog, setTaskDialog] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [showCompletedTasks, setShowCompletedTasks] = useState(false);

    // Email Integration State
    const [emailDialog, setEmailDialog] = useState(false);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [currentEmail, setCurrentEmail] = useState(null);
    const [templateDialog, setTemplateDialog] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);

    // Document Management State
    const [documents, setDocuments] = useState([]);
    const [uploadDialog, setUploadDialog] = useState(false);
    const [currentDocument, setCurrentDocument] = useState(null);

    // Analytics State
    const [analyticsData, setAnalyticsData] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [dealsRes, contactsRes, leadsRes, statsRes, companiesRes] = await Promise.all([
                axios.get(`${API_URL}/deals`),
                axios.get(`${CRM_API_URL}/contacts`),
                axios.get(`${CRM_API_URL}/leads`),
                axios.get(`${CRM_API_URL}/stats`),
                axios.get(`${CRM_API_URL}/companies`)
            ]);
            setDeals(dealsRes.data);
            setContacts(contactsRes.data);
            setLeads(leadsRes.data);
            setStats(statsRes.data);
            setCompanies(companiesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlert({ open: true, message: 'Error loading data', severity: 'error' });
        }
        setLoading(false);
    };

    const fetchCompanyDetails = async (companyId) => {
        try {
            const [contactsRes, commsRes] = await Promise.all([
                axios.get(`${CRM_API_URL}/companies/${companyId}/contacts`),
                axios.get(`${CRM_API_URL}/companies/${companyId}/communications`)
            ]);
            setCompanyContacts(contactsRes.data);
            setCompanyCommunications(commsRes.data);
        } catch (error) {
            console.error('Error fetching company details:', error);
        }
    };

    const fetchContactCommunications = async (contactId) => {
        try {
            const response = await axios.get(`${CRM_API_URL}/communications?contact_id=${contactId}`);
            setContactCommunications(response.data);
        } catch (error) {
            console.error('Error fetching contact communications:', error);
            setContactCommunications([]);
        }
    };

    const handleOpenContactDetails = async (contact) => {
        setSelectedContactForDetails(contact);
        setContactDetailsDialog(true);
        await fetchContactCommunications(contact.id);
    };

    // Fetch Tasks
    const fetchTasks = async (contactId) => {
        try {
            const params = contactId ? `?contact_id=${contactId}` : '';
            const response = await axios.get(`${CRM_API_URL}/tasks${params}`);
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setTasks([]);
        }
    };

    // Fetch Email Templates
    const fetchEmailTemplates = async () => {
        try {
            const response = await axios.get(`${CRM_API_URL}/email-templates`);
            setEmailTemplates(response.data);
        } catch (error) {
            console.error('Error fetching email templates:', error);
        }
    };

    // Save Email Template
    const handleSaveTemplate = async () => {
        try {
            if (currentTemplate?.id) {
                // Update existing template
                await axios.put(`${CRM_API_URL}/email-templates/${currentTemplate.id}`, currentTemplate);
            } else {
                // Create new template
                await axios.post(`${CRM_API_URL}/email-templates`, currentTemplate);
            }
            setTemplateDialog(false);
            setCurrentTemplate(null);
            fetchEmailTemplates();
            setAlert({ open: true, message: 'Template saved successfully', severity: 'success' });
        } catch (error) {
            setAlert({ open: true, message: 'Failed to save template', severity: 'error' });
        }
    };

    // Delete Email Template
    const handleDeleteTemplate = async (templateId) => {
        if (!window.confirm('Delete this template?')) return;
        try {
            await axios.delete(`${CRM_API_URL}/email-templates/${templateId}`);
            fetchEmailTemplates();
            setAlert({ open: true, message: 'Template deleted successfully', severity: 'success' });
        } catch (error) {
            setAlert({ open: true, message: 'Failed to delete template', severity: 'error' });
        }
    };

    // Fetch Documents
    const fetchDocuments = async (contactId) => {
        try {
            const params = contactId ? `?contact_id=${contactId}` : '';
            const response = await axios.get(`${CRM_API_URL}/documents${params}`);
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
            setDocuments([]);
        }
    };

    // Fetch Analytics
    const fetchAnalytics = async () => {
        try {
            const response = await axios.get(`${CRM_API_URL}/analytics/pipeline`);
            console.log('Analytics data:', response.data);
            setAnalyticsData(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setAnalyticsData({}); // Set empty object to prevent null issues
        }
    };

    // Load email templates on mount
    useEffect(() => {
        fetchEmailTemplates();
        fetchAnalytics();
    }, []);

    // Calculate Lead Score
    const calculateLeadScore = (deal) => {
        let score = 0;

        // Value-based scoring
        const value = parseFloat(deal.value) || 0;
        if (value > 100000) score += 30;
        else if (value > 50000) score += 20;
        else if (value > 10000) score += 10;

        // Stage-based scoring
        const stageScores = {
            'Discovery': 10,
            'Qualification': 20,
            'Proposal': 40,
            'Negotiation': 60,
            'Closed Won': 100
        };
        score += stageScores[deal.stage] || 0;

        // Priority-based scoring
        if (deal.priority === 'high') score += 15;
        else if (deal.priority === 'medium') score += 5;

        return Math.max(0, Math.min(100, score));
    };

    // Filter deals based on search and filters
    const getFilteredDeals = () => {
        let filtered = [...deals];

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(deal =>
                deal.company?.toLowerCase().includes(query) ||
                deal.contact?.toLowerCase().includes(query) ||
                deal.notes?.toLowerCase().includes(query)
            );
        }

        // Filters
        if (filters.priority) {
            filtered = filtered.filter(deal => deal.priority === filters.priority);
        }
        if (filters.stage) {
            filtered = filtered.filter(deal => deal.stage === filters.stage);
        }
        if (filters.status) {
            filtered = filtered.filter(deal => deal.status === filters.status);
        }

        return filtered;
    };

    // Drag & Drop Handler for Kanban
    const handleDrop = async (e, newStage) => {
        e.preventDefault();
        if (!draggedDeal) return;

        try {
            await axios.put(`${API_URL}/deals/${draggedDeal.id}`, {
                ...draggedDeal,
                stage: newStage
            });
            setAlert({ open: true, message: 'Lead moved successfully', severity: 'success' });
            fetchAllData();
        } catch (error) {
            setAlert({ open: true, message: 'Error moving lead', severity: 'error' });
        }
        setDraggedDeal(null);
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    // Deal CRUD
    const handleSaveDeal = async () => {
        try {
            if (currentDeal?.id) {
                await axios.put(`${API_URL}/deals/${currentDeal.id}`, currentDeal);
                setAlert({ open: true, message: 'Deal updated successfully', severity: 'success' });
            } else {
                await axios.post(`${API_URL}/deals`, currentDeal);
                setAlert({ open: true, message: 'Deal created successfully', severity: 'success' });
            }
            setDealDialog(false);
            setCurrentDeal(null);
            fetchAllData();
        } catch (error) {
            setAlert({ open: true, message: 'Error saving deal', severity: 'error' });
        }
    };

    const handleDeleteDeal = async (id) => {
        if (window.confirm('Are you sure you want to delete this deal?')) {
            try {
                await axios.delete(`${API_URL}/deals/${id}`);
                setAlert({ open: true, message: 'Deal deleted successfully', severity: 'success' });
                fetchAllData();
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting deal', severity: 'error' });
            }
        }
    };

    // Business Card Scanning
    const handleScanBusinessCard = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setScanning(true);
        const formData = new FormData();
        formData.append('card', file);

        try {
            const response = await axios.post(`${CRM_API_URL}/scan-business-card`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setCurrentContact({
                    ...response.data.data,
                    status: 'active'
                });
                setContactDialog(true);
                setAlert({
                    open: true,
                    message: `Business card scanned successfully! Confidence: ${(response.data.confidence * 100).toFixed(1)}%`,
                    severity: 'success'
                });
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
                await axios.put(`${CRM_API_URL}/contacts/${currentContact.id}`, currentContact);
                setAlert({ open: true, message: 'Contact updated successfully', severity: 'success' });
            } else {
                await axios.post(`${CRM_API_URL}/contacts`, currentContact);
                setAlert({ open: true, message: 'Contact created successfully', severity: 'success' });
            }
            setContactDialog(false);
            setCurrentContact(null);
            fetchAllData();
        } catch (error) {
            setAlert({ open: true, message: 'Error saving contact', severity: 'error' });
        }
    };

    const handleDeleteContact = async (id) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            try {
                await axios.delete(`${CRM_API_URL}/contacts/${id}`);
                setAlert({ open: true, message: 'Contact deleted successfully', severity: 'success' });
                fetchAllData();
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting contact', severity: 'error' });
            }
        }
    };

    // Lead CRUD
    const handleSaveLead = async () => {
        try {
            if (currentLead?.id) {
                await axios.put(`${CRM_API_URL}/leads/${currentLead.id}`, currentLead);
                setAlert({ open: true, message: 'Lead updated successfully', severity: 'success' });
            } else {
                await axios.post(`${CRM_API_URL}/leads`, currentLead);
                setAlert({ open: true, message: 'Lead created successfully', severity: 'success' });
            }
            setLeadDialog(false);
            setCurrentLead(null);
            fetchAllData();
        } catch (error) {
            setAlert({ open: true, message: 'Error saving lead', severity: 'error' });
        }
    };

    const handleDeleteLead = async (id) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                await axios.delete(`${CRM_API_URL}/leads/${id}`);
                setAlert({ open: true, message: 'Lead deleted successfully', severity: 'success' });
                fetchAllData();
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting lead', severity: 'error' });
            }
        }
    };

    // Company CRUD
    const handleSelectCompany = async (company) => {
        setSelectedCompany(company);
        await fetchCompanyDetails(company.id);
    };

    const handleSaveCompany = async () => {
        try {
            if (currentCompany?.id) {
                await axios.put(`${CRM_API_URL}/companies/${currentCompany.id}`, currentCompany);
                setAlert({ open: true, message: 'Company updated successfully', severity: 'success' });
            } else {
                await axios.post(`${CRM_API_URL}/companies`, currentCompany);
                setAlert({ open: true, message: 'Company created successfully', severity: 'success' });
            }
            setCompanyDialog(false);
            setCurrentCompany(null);
            fetchAllData();
        } catch (error) {
            setAlert({ open: true, message: 'Error saving company', severity: 'error' });
        }
    };

    const handleDeleteCompany = async (id) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            try {
                await axios.delete(`${CRM_API_URL}/companies/${id}`);
                setAlert({ open: true, message: 'Company deleted successfully', severity: 'success' });
                fetchAllData();
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

    // Task CRUD
    const handleSaveTask = async () => {
        try {
            if (currentTask?.id) {
                await axios.put(`${CRM_API_URL}/tasks/${currentTask.id}`, currentTask);
                setAlert({ open: true, message: 'Task updated successfully', severity: 'success' });
            } else {
                await axios.post(`${CRM_API_URL}/tasks`, currentTask);
                setAlert({ open: true, message: 'Task created successfully', severity: 'success' });
            }
            setTaskDialog(false);
            setCurrentTask(null);
            if (selectedContactForDetails?.id) {
                await fetchTasks(selectedContactForDetails.id);
            }
        } catch (error) {
            setAlert({ open: true, message: 'Error saving task', severity: 'error' });
        }
    };

    const handleDeleteTask = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await axios.delete(`${CRM_API_URL}/tasks/${id}`);
                setAlert({ open: true, message: 'Task deleted successfully', severity: 'success' });
                if (selectedContactForDetails?.id) {
                    await fetchTasks(selectedContactForDetails.id);
                }
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting task', severity: 'error' });
            }
        }
    };

    const handleCompleteTask = async (task) => {
        try {
            await axios.put(`${CRM_API_URL}/tasks/${task.id}`, {
                ...task,
                status: 'completed',
                completed_date: new Date().toISOString()
            });
            setAlert({ open: true, message: 'Task completed', severity: 'success' });
            if (selectedContactForDetails?.id) {
                await fetchTasks(selectedContactForDetails.id);
            }
        } catch (error) {
            setAlert({ open: true, message: 'Error completing task', severity: 'error' });
        }
    };

    // Email Handlers
    const handleSendEmail = async () => {
        try {
            // Log as communication
            await axios.post(`${CRM_API_URL}/communications`, {
                contact_id: currentEmail.contact_id,
                type: 'email',
                subject: currentEmail.subject,
                description: currentEmail.body,
                date: new Date().toISOString(),
                email_sent_date: new Date().toISOString()
            });
            setAlert({ open: true, message: 'Email sent and logged', severity: 'success' });
            setEmailDialog(false);
            setCurrentEmail(null);
            if (selectedContactForDetails?.id) {
                await fetchContactCommunications(selectedContactForDetails.id);
            }
        } catch (error) {
            setAlert({ open: true, message: 'Error sending email', severity: 'error' });
        }
    };

    // Document Handlers
    const handleUploadDocument = async () => {
        try {
            await axios.post(`${CRM_API_URL}/documents`, {
                ...currentDocument,
                contact_id: selectedContactForDetails?.id
            });
            setAlert({ open: true, message: 'Document uploaded successfully', severity: 'success' });
            setUploadDialog(false);
            setCurrentDocument(null);
            if (selectedContactForDetails?.id) {
                await fetchDocuments(selectedContactForDetails.id);
            }
        } catch (error) {
            setAlert({ open: true, message: 'Error uploading document', severity: 'error' });
        }
    };

    const handleDeleteDocument = async (id) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await axios.delete(`${CRM_API_URL}/documents/${id}`);
                setAlert({ open: true, message: 'Document deleted successfully', severity: 'success' });
                if (selectedContactForDetails?.id) {
                    await fetchDocuments(selectedContactForDetails.id);
                }
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting document', severity: 'error' });
            }
        }
    };

    // Communication CRUD
    const handleSaveCommunication = async () => {
        try {
            const commData = {
                ...currentComm,
                company_id: selectedCompany?.id
            };
            await axios.post(`${CRM_API_URL}/communications`, commData);
            setAlert({ open: true, message: 'Communication logged successfully', severity: 'success' });
            setCommDialog(false);
            setCurrentComm(null);

            // Refresh data based on context
            if (selectedCompany?.id) {
                fetchCompanyDetails(selectedCompany.id);
            }
            if (selectedContactForDetails?.id && contactDetailsDialog) {
                fetchContactCommunications(selectedContactForDetails.id);
            }
        } catch (error) {
            setAlert({ open: true, message: 'Error saving communication', severity: 'error' });
        }
    };

    const handleDeleteCommunication = async (id) => {
        if (window.confirm('Are you sure you want to delete this communication?')) {
            try {
                await axios.delete(`${CRM_API_URL}/communications/${id}`);
                setAlert({ open: true, message: 'Communication deleted successfully', severity: 'success' });
                fetchCompanyDetails(selectedCompany.id);
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting communication', severity: 'error' });
            }
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'active': return 'success';
            case 'inactive': return 'default';
            case 'qualified': return 'primary';
            case 'new': return 'info';
            case 'contacted': return 'warning';
            case 'won': return 'success';
            case 'lost': return 'error';
            default: return 'default';
        }
    };

    // Calculate pipeline metrics
    const pipelineValue = deals.reduce((sum, deal) => sum + (deal.status !== 'lost' ? parseFloat(deal.value || 0) : 0), 0);
    const activeDealsCount = deals.filter(d => d.status === 'active').length;

    return (
        <Box sx={{ p: 3 }}>
            {/* Main Stats Overview */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={2.4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" sx={{ fontWeight: 300, color: '#C94A3C' }}>
                                ${pipelineValue.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Pipeline Value
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={2.4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" sx={{ fontWeight: 300, color: '#2B2D42' }}>
                                {activeDealsCount}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Active Deals
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={2.4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" sx={{ fontWeight: 300, color: '#10b981' }}>
                                {stats.contacts || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Contacts
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={2.4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" sx={{ fontWeight: 300, color: '#f59e0b' }}>
                                {stats.leads || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Leads
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={2.4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" sx={{ fontWeight: 300, color: '#8b5cf6' }}>
                                {companies.length}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                Companies
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={mainTab} onChange={(e, v) => setMainTab(v)}>
                    <Tab label="CRM (Contacts)" />
                    <Tab label="Companies" />
                    <Tab label="Leads" />
                    <Tab label="Settings" />
                </Tabs>
            </Paper>

            {/* Leads Tab */}
            {mainTab === 2 && (
                <Box>
                    {/* Search & View Controls */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <TextField
                                    placeholder="Search leads by company, contact, or notes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ flexGrow: 1, minWidth: 300 }}
                                    size="small"
                                />
                                <Button
                                    variant="outlined"
                                    startIcon={<FilterListIcon />}
                                    onClick={() => setFilterDialog(true)}
                                    size="small"
                                >
                                    Filters
                                </Button>
                                <ButtonGroup variant="outlined" size="small">
                                    <Button
                                        variant={viewMode === 'table' ? 'contained' : 'outlined'}
                                        onClick={() => setViewMode('table')}
                                        startIcon={<ViewListIcon />}
                                    >
                                        Table
                                    </Button>
                                    <Button
                                        variant={viewMode === 'kanban' ? 'contained' : 'outlined'}
                                        onClick={() => setViewMode('kanban')}
                                        startIcon={<ViewKanbanIcon />}
                                    >
                                        Kanban
                                    </Button>
                                </ButtonGroup>
                                <Button
                                    variant="outlined"
                                    startIcon={<BarChartIcon />}
                                    onClick={() => {
                                        console.log('Analytics button clicked, current state:', showAnalytics);
                                        setShowAnalytics(!showAnalytics);
                                        if (!analyticsData) {
                                            fetchAnalytics();
                                        }
                                    }}
                                    size="small"
                                >
                                    {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => {
                                        setCurrentDeal({
                                            company: '', contact: '', stage: 'Discovery',
                                            value: 0, probability: 50, notes: '', next_step: '', priority: 'medium'
                                        });
                                        setDealDialog(true);
                                    }}
                                    size="small"
                                >
                                    Add Lead
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Kanban View */}
                    {viewMode === 'kanban' && (
                        <Grid container spacing={2}>
                            {['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'].map(stage => {
                                const stageDeals = getFilteredDeals().filter(d => d.stage === stage);
                                const stageValue = stageDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);

                                return (
                                    <Grid item xs={12} md={2.4} key={stage}>
                                        <Paper
                                            sx={{
                                                p: 2,
                                                minHeight: 600,
                                                bgcolor: '#f9fafb',
                                                border: '2px dashed #e0e0e0'
                                            }}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, stage)}
                                        >
                                            <Box sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {stage}
                                                    </Typography>
                                                    <Chip size="small" label={stageDeals.length} color="primary" />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    ${stageValue.toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Divider sx={{ mb: 2 }} />

                                            {stageDeals.map(deal => (
                                                <Card
                                                    key={deal.id}
                                                    draggable
                                                    onDragStart={() => setDraggedDeal(deal)}
                                                    sx={{
                                                        mb: 2,
                                                        cursor: 'move',
                                                        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <CardContent sx={{ p: 2 }}>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            {deal.company}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                                            {deal.contact}
                                                        </Typography>
                                                        <Typography variant="h6" color="primary" gutterBottom>
                                                            ${parseFloat(deal.value || 0).toLocaleString()}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                                            <Chip
                                                                label={deal.priority || 'medium'}
                                                                size="small"
                                                                color={getPriorityColor(deal.priority)}
                                                                sx={{ fontSize: '0.7rem' }}
                                                            />
                                                            <Chip
                                                                label={`Score: ${calculateLeadScore(deal)}`}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.7rem' }}
                                                            />
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                            <IconButton size="small" onClick={() => {
                                                                setCurrentDeal(deal);
                                                                setDealDialog(true);
                                                            }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteDeal(deal.id)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            ))}

                                            {stageDeals.length === 0 && (
                                                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                                    No leads in this stage
                                                </Typography>
                                            )}
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}

                    {/* Table View */}
                    {viewMode === 'table' && (
                        <Card>
                            <CardContent>
                                <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Company</TableCell>
                                        <TableCell>Contact</TableCell>
                                        <TableCell>Stage</TableCell>
                                        <TableCell>Value</TableCell>
                                        <TableCell>Priority</TableCell>
                                        <TableCell>Score</TableCell>
                                        <TableCell>Next Step</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {getFilteredDeals().map((deal) => (
                                        <TableRow key={deal.id}>
                                            <TableCell>{deal.company}</TableCell>
                                            <TableCell>{deal.contact}</TableCell>
                                            <TableCell>
                                                <Chip label={deal.stage} size="small" />
                                            </TableCell>
                                            <TableCell>${parseFloat(deal.value || 0).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={deal.priority || 'medium'}
                                                    size="small"
                                                    color={getPriorityColor(deal.priority)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={calculateLeadScore(deal)}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{deal.next_step}</TableCell>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => {
                                                    setCurrentDeal(deal);
                                                    setDealDialog(true);
                                                }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteDeal(deal.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {getFilteredDeals().length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">
                                                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                                    No leads match your filters
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

                    {/* Analytics Dashboard */}
                    {showAnalytics && (
                        <Card sx={{ mt: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Pipeline Analytics
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                {!analyticsData || !analyticsData.stageDistribution ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Loading analytics data...
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={7}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Stage Distribution
                                            </Typography>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={analyticsData.stageDistribution}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Bar dataKey="count" name="Count" fill="#C94A3C" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Grid>

                                        <Grid item xs={12} md={5}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Key Metrics
                                            </Typography>
                                            <List>
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Win Rate"
                                                        secondary={`${(analyticsData.conversionRates?.win_rate || 0).toFixed(1)}%`}
                                                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                        secondaryTypographyProps={{ variant: 'h6', color: 'primary' }}
                                                    />
                                                </ListItem>
                                                <Divider />
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Discovery → Qualification"
                                                        secondary={`${(analyticsData.conversionRates?.discovery_to_qualification || 0).toFixed(1)}%`}
                                                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                        secondaryTypographyProps={{ variant: 'h6' }}
                                                    />
                                                </ListItem>
                                                <Divider />
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Proposal → Negotiation"
                                                        secondary={`${(analyticsData.conversionRates?.proposal_to_negotiation || 0).toFixed(1)}%`}
                                                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                        secondaryTypographyProps={{ variant: 'h6' }}
                                                    />
                                                </ListItem>
                                                <Divider />
                                                <ListItem>
                                                    <ListItemText
                                                        primary="Average Deal Cycle"
                                                        secondary={`${Math.round(analyticsData.avgDealCycle || 0)} days`}
                                                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                        secondaryTypographyProps={{ variant: 'h6' }}
                                                    />
                                                </ListItem>
                                            </List>
                                        </Grid>
                                    </Grid>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </Box>
            )}

            {/* CRM Tab (Contacts) */}
            {mainTab === 0 && (
                <Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
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
                                                {scanning ? 'Scanning...' : 'Scan Card'}
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
                                                    <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                                                        <Button
                                                            variant="text"
                                                            size="small"
                                                            onClick={() => handleOpenContactDetails(contact)}
                                                            sx={{
                                                                textTransform: 'none',
                                                                p: 0,
                                                                minWidth: 0,
                                                                color: 'primary.main',
                                                                '&:hover': { textDecoration: 'underline' },
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                maxWidth: '100%',
                                                                display: 'block'
                                                            }}
                                                        >
                                                            {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{contact.company_name || contact.company}</TableCell>
                                                    <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{contact.job_title}</TableCell>
                                                    <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{contact.email}</TableCell>
                                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{contact.phone || contact.mobile}</TableCell>
                                                    <TableCell>
                                                        <Chip label={contact.status} size="small" color={getStatusColor(contact.status)} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                            <IconButton size="small" onClick={() => {
                                                                setCurrentContact(contact);
                                                                setContactDialog(true);
                                                            }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => {
                                                                setCurrentComm({
                                                                    contact_id: contact.id,
                                                                    type: 'call',
                                                                    subject: '',
                                                                    description: '',
                                                                    date: new Date().toISOString().slice(0, 16),
                                                                    duration_minutes: 0,
                                                                    outcome: '',
                                                                    follow_up_required: false
                                                                });
                                                                setCommDialog(true);
                                                            }}>
                                                                <CommentIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteContact(contact.id)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {contacts.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} align="center">
                                                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                                            No contacts yet. Add your first contact!
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
            )}

            {/* Companies Tab */}
            {mainTab === 1 && (
                <Grid container spacing={3}>
                    {/* Companies List */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6">Companies</Typography>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            setCurrentCompany({
                                                name: '', industry: '', website: '', phone: '', email: '',
                                                address: '', city: '', state: '', country: '', postal_code: '',
                                                employee_count: '', revenue_range: '', linkedin_url: '',
                                                description: '', notes: '', status: 'active'
                                            });
                                            setCompanyDialog(true);
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Box>
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
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                    {companies.length === 0 && (
                                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                                            No companies yet
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
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                <Tabs value={companySubTab} onChange={(e, v) => setCompanySubTab(v)} sx={{ mb: 2 }}>
                                    <Tab label={`Contacts (${companyContacts.length})`} />
                                    <Tab label={`Communications (${companyCommunications.length})`} />
                                </Tabs>

                                {/* Company Contacts */}
                                {companySubTab === 0 && (
                                    <Card>
                                        <CardContent>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Name</TableCell>
                                                            <TableCell>Title</TableCell>
                                                            <TableCell>Email</TableCell>
                                                            <TableCell>Phone</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {companyContacts.map((contact) => (
                                                            <TableRow key={contact.id}>
                                                                <TableCell>{contact.full_name}</TableCell>
                                                                <TableCell>{contact.job_title}</TableCell>
                                                                <TableCell>{contact.email}</TableCell>
                                                                <TableCell>{contact.phone || contact.mobile}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {companyContacts.length === 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={4} align="center">
                                                                    <Typography variant="body2" color="text.secondary">No contacts</Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Company Communications */}
                                {companySubTab === 1 && (
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
                                                            type: 'call', subject: '', description: '',
                                                            date: new Date().toISOString().slice(0, 16),
                                                            duration_minutes: 0, outcome: ''
                                                        });
                                                        setCommDialog(true);
                                                    }}
                                                >
                                                    Log
                                                </Button>
                                            </Box>
                                            <TableContainer>
                                                <Table size="small">
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
                                                                <TableCell><Chip label={comm.type} size="small" /></TableCell>
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
                                                                    <Typography variant="body2" color="text.secondary">No communications</Typography>
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
            )}

            {/* Settings Tab */}
            {mainTab === 3 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6">Email Templates</Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            setCurrentTemplate({
                                                name: '',
                                                subject: '',
                                                body: '',
                                                category: 'general'
                                            });
                                            setTemplateDialog(true);
                                        }}
                                    >
                                        Add Template
                                    </Button>
                                </Box>

                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Category</TableCell>
                                                <TableCell>Subject</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {emailTemplates.map((template) => (
                                                <TableRow key={template.id}>
                                                    <TableCell>{template.name}</TableCell>
                                                    <TableCell>
                                                        <Chip label={template.category} size="small" />
                                                    </TableCell>
                                                    <TableCell>{template.subject}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setCurrentTemplate(template);
                                                                setTemplateDialog(true);
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteTemplate(template.id)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Lead Dialog */}
            <Dialog open={dealDialog} onClose={() => setDealDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{currentDeal?.id ? 'Edit Lead' : 'New Lead'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Company</InputLabel>
                                <Select
                                    value={currentDeal?.company || ''}
                                    onChange={(e) => setCurrentDeal({ ...currentDeal, company: e.target.value, contact: '' })}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {companies.map((company) => (
                                        <MenuItem key={company.id} value={company.name}>
                                            {company.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Contact</InputLabel>
                                <Select
                                    value={currentDeal?.contact || ''}
                                    onChange={(e) => setCurrentDeal({ ...currentDeal, contact: e.target.value })}
                                    disabled={!currentDeal?.company}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {contacts
                                        .filter((contact) => !currentDeal?.company || contact.company === currentDeal.company)
                                        .map((contact) => (
                                            <MenuItem key={contact.id} value={contact.full_name || `${contact.first_name} ${contact.last_name}`}>
                                                {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Stage</InputLabel>
                                <Select
                                    value={currentDeal?.stage || 'Discovery'}
                                    onChange={(e) => setCurrentDeal({ ...currentDeal, stage: e.target.value })}
                                >
                                    <MenuItem value="Discovery">Discovery</MenuItem>
                                    <MenuItem value="Qualification">Qualification</MenuItem>
                                    <MenuItem value="Proposal">Proposal</MenuItem>
                                    <MenuItem value="Negotiation">Negotiation</MenuItem>
                                    <MenuItem value="Closed Won">Closed Won</MenuItem>
                                    <MenuItem value="Closed Lost">Closed Lost</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={currentDeal?.priority || 'medium'}
                                    onChange={(e) => setCurrentDeal({ ...currentDeal, priority: e.target.value })}
                                    label="Priority"
                                >
                                    <MenuItem value="low">Low</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Value"
                                type="number"
                                value={currentDeal?.value || ''}
                                onChange={(e) => setCurrentDeal({ ...currentDeal, value: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Probability (%)"
                                type="number"
                                value={currentDeal?.probability || ''}
                                onChange={(e) => setCurrentDeal({ ...currentDeal, probability: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Next Step"
                                value={currentDeal?.next_step || ''}
                                onChange={(e) => setCurrentDeal({ ...currentDeal, next_step: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={3}
                                value={currentDeal?.notes || ''}
                                onChange={(e) => setCurrentDeal({ ...currentDeal, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDealDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveDeal} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

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
                                onChange={(e) => {
                                    const firstName = e.target.value;
                                    const lastName = currentContact?.last_name || '';
                                    const fullName = `${firstName} ${lastName}`.trim();
                                    setCurrentContact({
                                        ...currentContact,
                                        first_name: firstName,
                                        full_name: fullName
                                    });
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={currentContact?.last_name || ''}
                                onChange={(e) => {
                                    const lastName = e.target.value;
                                    const firstName = currentContact?.first_name || '';
                                    const fullName = `${firstName} ${lastName}`.trim();
                                    setCurrentContact({
                                        ...currentContact,
                                        last_name: lastName,
                                        full_name: fullName
                                    });
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={currentContact?.full_name || ''}
                                onChange={(e) => setCurrentContact({ ...currentContact, full_name: e.target.value })}
                                helperText="Auto-populated from First + Last Name"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Autocomplete
                                fullWidth
                                freeSolo
                                options={companies}
                                getOptionLabel={(option) => {
                                    if (typeof option === 'string') return option;
                                    return option.name || '';
                                }}
                                value={companies.find(c => c.id === currentContact?.company_id) || currentContact?.company || null}
                                onChange={(event, newValue) => {
                                    if (typeof newValue === 'string') {
                                        // User typed a new company name
                                        setCurrentContact({
                                            ...currentContact,
                                            company: newValue,
                                            company_id: null
                                        });
                                    } else if (newValue && newValue.id) {
                                        // User selected an existing company
                                        setCurrentContact({
                                            ...currentContact,
                                            company: newValue.name,
                                            company_id: newValue.id
                                        });
                                    } else {
                                        // User cleared the field
                                        setCurrentContact({
                                            ...currentContact,
                                            company: '',
                                            company_id: null
                                        });
                                    }
                                }}
                                onInputChange={(event, newInputValue) => {
                                    // Update company name when typing
                                    if (event && event.type === 'change') {
                                        setCurrentContact({
                                            ...currentContact,
                                            company: newInputValue,
                                            company_id: null
                                        });
                                    }
                                }}
                                renderInput={(params) => <TextField {...params} label="Company" />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={currentContact?.category || ''}
                                    onChange={(e) => setCurrentContact({ ...currentContact, category: e.target.value })}
                                    label="Category"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    <MenuItem value="Generic">Generic</MenuItem>
                                    <MenuItem value="BioSimilar">BioSimilar</MenuItem>
                                    <MenuItem value="Investor">Investor</MenuItem>
                                    <MenuItem value="Contractor">Contractor</MenuItem>
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
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Company"
                                value={currentLead?.company || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, company: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact Name"
                                value={currentLead?.contact_name || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, contact_name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={currentLead?.email || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, email: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={currentLead?.phone || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, phone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Stage</InputLabel>
                                <Select
                                    value={currentLead?.stage || 'prospecting'}
                                    onChange={(e) => setCurrentLead({ ...currentLead, stage: e.target.value })}
                                >
                                    <MenuItem value="prospecting">Prospecting</MenuItem>
                                    <MenuItem value="qualification">Qualification</MenuItem>
                                    <MenuItem value="proposal">Proposal</MenuItem>
                                    <MenuItem value="negotiation">Negotiation</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={currentLead?.status || 'new'}
                                    onChange={(e) => setCurrentLead({ ...currentLead, status: e.target.value })}
                                >
                                    <MenuItem value="new">New</MenuItem>
                                    <MenuItem value="contacted">Contacted</MenuItem>
                                    <MenuItem value="qualified">Qualified</MenuItem>
                                    <MenuItem value="won">Won</MenuItem>
                                    <MenuItem value="lost">Lost</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Value"
                                type="number"
                                value={currentLead?.value || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, value: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Source"
                                value={currentLead?.source || ''}
                                onChange={(e) => setCurrentLead({ ...currentLead, source: e.target.value })}
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
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Industry"
                                value={currentCompany?.industry || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, industry: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={currentCompany?.category || ''}
                                    onChange={(e) => setCurrentCompany({ ...currentCompany, category: e.target.value })}
                                    label="Category"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    <MenuItem value="Generic">Generic</MenuItem>
                                    <MenuItem value="BioSimilar">BioSimilar</MenuItem>
                                    <MenuItem value="Investor">Investor</MenuItem>
                                    <MenuItem value="Contractor">Contractor</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
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
                                label="Description"
                                multiline
                                rows={3}
                                value={currentCompany?.description || ''}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, description: e.target.value })}
                            />
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

            {/* Filter Dialog */}
            <Dialog open={filterDialog} onClose={() => setFilterDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Filter Leads</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={filters.priority}
                                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                                    label="Priority"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="low">Low</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Stage</InputLabel>
                                <Select
                                    value={filters.stage}
                                    onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                                    label="Stage"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="Discovery">Discovery</MenuItem>
                                    <MenuItem value="Qualification">Qualification</MenuItem>
                                    <MenuItem value="Proposal">Proposal</MenuItem>
                                    <MenuItem value="Negotiation">Negotiation</MenuItem>
                                    <MenuItem value="Closed Won">Closed Won</MenuItem>
                                    <MenuItem value="Closed Lost">Closed Lost</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                    label="Category"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="Generic">Generic</MenuItem>
                                    <MenuItem value="BioSimilar">BioSimilar</MenuItem>
                                    <MenuItem value="Investor">Investor</MenuItem>
                                    <MenuItem value="Contractor">Contractor</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setFilters({ category: '', priority: '', stage: '', status: '' });
                        setFilterDialog(false);
                    }}>
                        Clear All
                    </Button>
                    <Button onClick={() => setFilterDialog(false)} variant="contained">Apply</Button>
                </DialogActions>
            </Dialog>

            {/* Task Dialog */}
            <Dialog open={taskDialog} onClose={() => setTaskDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{currentTask?.id ? 'Edit Task' : 'New Task'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Task Title"
                                value={currentTask?.title || ''}
                                onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={currentTask?.description || ''}
                                onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={currentTask?.priority || 'medium'}
                                    onChange={(e) => setCurrentTask({ ...currentTask, priority: e.target.value })}
                                    label="Priority"
                                >
                                    <MenuItem value="low">Low</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={currentTask?.type || 'task'}
                                    onChange={(e) => setCurrentTask({ ...currentTask, type: e.target.value })}
                                    label="Type"
                                >
                                    <MenuItem value="task">Task</MenuItem>
                                    <MenuItem value="call">Call</MenuItem>
                                    <MenuItem value="email">Email</MenuItem>
                                    <MenuItem value="meeting">Meeting</MenuItem>
                                    <MenuItem value="followup">Follow-up</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Due Date"
                                type="datetime-local"
                                value={currentTask?.due_date ? currentTask.due_date.slice(0, 16) : ''}
                                onChange={(e) => setCurrentTask({ ...currentTask, due_date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTaskDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveTask} variant="contained">Save Task</Button>
                </DialogActions>
            </Dialog>

            {/* Email Composer - Using Microsoft Integration */}
            <EmailComposer
                contactId={selectedContactForDetails?.id}
                contactEmail={selectedContactForDetails?.email}
                contactName={selectedContactForDetails?.full_name || `${selectedContactForDetails?.first_name} ${selectedContactForDetails?.last_name}`}
                open={emailDialog}
                onClose={() => setEmailDialog(false)}
            />

            {/* Document Upload Dialog */}
            <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Document Name"
                                value={currentDocument?.name || ''}
                                onChange={(e) => setCurrentDocument({ ...currentDocument, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Type"
                                value={currentDocument?.type || ''}
                                onChange={(e) => setCurrentDocument({ ...currentDocument, type: e.target.value })}
                                placeholder="e.g., Proposal, Contract, Presentation"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={currentDocument?.description || ''}
                                onChange={(e) => setCurrentDocument({ ...currentDocument, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="File Path/URL"
                                value={currentDocument?.file_path || ''}
                                onChange={(e) => setCurrentDocument({ ...currentDocument, file_path: e.target.value })}
                                placeholder="Enter file path or URL"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
                    <Button onClick={handleUploadDocument} variant="contained" startIcon={<AttachFileIcon />}>
                        Save Document
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Contact Details Dialog */}
            <Dialog
                open={contactDetailsDialog}
                onClose={() => setContactDetailsDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            {selectedContactForDetails?.full_name || `${selectedContactForDetails?.first_name} ${selectedContactForDetails?.last_name}`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EmailIcon />}
                                onClick={() => setEmailDialog(true)}
                            >
                                Send Email
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setCurrentComm({
                                        contact_id: selectedContactForDetails?.id,
                                        type: 'call',
                                        subject: '',
                                        description: '',
                                        date: new Date().toISOString().slice(0, 16),
                                        duration_minutes: 0,
                                        outcome: '',
                                        follow_up_required: false
                                    });
                                    setCommDialog(true);
                                }}
                            >
                                Log Communication
                            </Button>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3}>
                        {/* Contact Information Section */}
                        <Grid item xs={12} md={5}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Contact Information</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Company</Typography>
                                            <Typography variant="body1">{selectedContactForDetails?.company_name || selectedContactForDetails?.company || '-'}</Typography>
                                        </Grid>
                                        {selectedContactForDetails?.category && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">Category</Typography>
                                                <Chip label={selectedContactForDetails.category} size="small" color="primary" />
                                            </Grid>
                                        )}
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Job Title</Typography>
                                            <Typography variant="body1">{selectedContactForDetails?.job_title || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Email</Typography>
                                            <Typography variant="body1">{selectedContactForDetails?.email || '-'}</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Phone</Typography>
                                            <Typography variant="body1">{selectedContactForDetails?.phone || '-'}</Typography>
                                        </Grid>
                                        {selectedContactForDetails?.mobile && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">Mobile</Typography>
                                                <Typography variant="body1">{selectedContactForDetails.mobile}</Typography>
                                            </Grid>
                                        )}
                                        {selectedContactForDetails?.address && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">Address</Typography>
                                                <Typography variant="body1">{selectedContactForDetails.address}</Typography>
                                            </Grid>
                                        )}
                                        {selectedContactForDetails?.notes && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">Notes</Typography>
                                                <Typography variant="body1">{selectedContactForDetails.notes}</Typography>
                                            </Grid>
                                        )}
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Status</Typography>
                                            <Chip label={selectedContactForDetails?.status} size="small" color={getStatusColor(selectedContactForDetails?.status)} />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Communications Section */}
                        <Grid item xs={12} md={7}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Communications History</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    {contactCommunications.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                                            No communications logged yet
                                        </Typography>
                                    ) : (
                                        <List>
                                            {contactCommunications.map((comm) => (
                                                <ListItem key={comm.id} divider>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography variant="subtitle2">{comm.subject || comm.type}</Typography>
                                                                <Chip label={comm.type} size="small" />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {comm.date ? format(new Date(comm.date), 'MMM dd, yyyy HH:mm') : '-'}
                                                                </Typography>
                                                                {comm.description && (
                                                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                                                        {comm.description}
                                                                    </Typography>
                                                                )}
                                                                {comm.outcome && (
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                        Outcome: {comm.outcome}
                                                                    </Typography>
                                                                )}
                                                            </>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Microsoft Documents Section */}
                        <Grid item xs={12} md={6}>
                            <DocumentManager
                                contactId={selectedContactForDetails?.id}
                                contactName={selectedContactForDetails?.full_name || `${selectedContactForDetails?.first_name} ${selectedContactForDetails?.last_name}`}
                                companyName={selectedContactForDetails?.company_name || selectedContactForDetails?.company || 'No Company'}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setContactDetailsDialog(false)}>Close</Button>
                    <Button
                        onClick={() => {
                            setCurrentContact(selectedContactForDetails);
                            setContactDialog(true);
                        }}
                        variant="outlined"
                    >
                        Edit Contact
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Email Template Dialog */}
            <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{currentTemplate?.id ? 'Edit Template' : 'New Template'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="Template Name"
                                value={currentTemplate?.name || ''}
                                onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={currentTemplate?.category || 'general'}
                                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, category: e.target.value })}
                                    label="Category"
                                >
                                    <MenuItem value="intro">Introduction</MenuItem>
                                    <MenuItem value="followup">Follow Up</MenuItem>
                                    <MenuItem value="proposal">Proposal</MenuItem>
                                    <MenuItem value="meeting">Meeting</MenuItem>
                                    <MenuItem value="general">General</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Subject"
                                value={currentTemplate?.subject || ''}
                                onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
                                helperText="Use {{contact_name}} and {{company_name}} as placeholders"
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Message Body"
                                value={currentTemplate?.body || ''}
                                onChange={(e) => setCurrentTemplate({ ...currentTemplate, body: e.target.value })}
                                multiline
                                rows={12}
                                helperText="Use {{contact_name}}, {{company_name}}, {{topic}}, {{project_name}} as placeholders"
                                required
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTemplateDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveTemplate} variant="contained">
                        {currentTemplate?.id ? 'Update' : 'Create'} Template
                    </Button>
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

export default SalesAndCRMModule;
