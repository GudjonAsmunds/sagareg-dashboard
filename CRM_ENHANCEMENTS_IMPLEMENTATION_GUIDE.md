# CRM Enhancements Implementation Guide

## ✅ Completed Backend Implementation

### Database Schema (migrate-crm-enhancements.js)
All database tables and fields have been created:
- ✅ `crm_tasks` table - Task management
- ✅ `crm_documents` table - Document storage
- ✅ `crm_email_templates` table - Email templates
- ✅ `crm_saved_filters` table - Saved filter views
- ✅ Enhanced `deals` table - Added priority, score, last_contact_date, lead_source, tags
- ✅ Enhanced `crm_communications` table - Added email tracking fields

### API Endpoints (server.js)
All backend routes are implemented:
- ✅ Tasks CRUD: GET/POST/PUT/DELETE `/api/crm/tasks`
- ✅ Documents CRUD: GET/POST/DELETE `/api/crm/documents`
- ✅ Email Templates: GET/POST `/api/crm/email-templates`
- ✅ Saved Filters: GET/POST/DELETE `/api/crm/saved-filters`
- ✅ Pipeline Analytics: GET `/api/crm/analytics/pipeline`

## 📋 Frontend Implementation Required

### 1. Pipeline Kanban Board 🎯

**Location**: SalesAndCRMModule.js - Leads Tab (mainTab === 0)

**Add State**:
```javascript
const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
const [draggedDeal, setDraggedDeal] = useState(null);
```

**Add View Toggle**:
```javascript
<ButtonGroup variant="outlined" sx={{ mb: 2 }}>
    <Button
        variant={viewMode === 'table' ? 'contained' : 'outlined'}
        onClick={() => setViewMode('table')}
    >
        <ViewListIcon /> Table
    </Button>
    <Button
        variant={viewMode === 'kanban' ? 'contained' : 'outlined'}
        onClick={() => setViewMode('kanban')}
    >
        <ViewKanbanIcon /> Kanban
    </Button>
</ButtonGroup>
```

**Kanban Board Component**:
```javascript
{viewMode === 'kanban' && (
    <Grid container spacing={2}>
        {['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'].map(stage => (
            <Grid item xs={12} md={2.4} key={stage}>
                <Paper
                    sx={{ p: 2, minHeight: 500, bgcolor: '#f9fafb' }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, stage)}
                >
                    <Typography variant="h6" gutterBottom>
                        {stage}
                        <Chip size="small" label={deals.filter(d => d.stage === stage).length} sx={{ ml: 1 }} />
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {deals.filter(d => d.stage === stage).map(deal => (
                        <Card
                            key={deal.id}
                            draggable
                            onDragStart={() => setDraggedDeal(deal)}
                            sx={{ mb: 2, cursor: 'move', '&:hover': { boxShadow: 3 } }}
                        >
                            <CardContent>
                                <Typography variant="subtitle2">{deal.company}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    ${parseFloat(deal.value || 0).toLocaleString()}
                                </Typography>
                                <Chip label={deal.priority} size="small" color={getPriorityColor(deal.priority)} sx={{ mt: 1 }} />
                            </CardContent>
                        </Card>
                    ))}
                </Paper>
            </Grid>
        ))}
    </Grid>
)}
```

**Drag & Drop Handler**:
```javascript
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
        case 'low': return 'default';
        default: return 'default';
    }
};
```

### 2. Activity Timeline & Task Management 📅

**Add State**:
```javascript
const [tasks, setTasks] = useState([]);
const [taskDialog, setTaskDialog] = useState(false);
const [currentTask, setCurrentTask] = useState(null);
```

**Fetch Tasks**:
```javascript
const fetchTasks = async (contactId) => {
    try {
        const response = await axios.get(`${CRM_API_URL}/tasks?contact_id=${contactId}`);
        setTasks(response.data);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
};
```

**Task Dialog**:
```javascript
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
                    >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={6}>
                <TextField
                    fullWidth
                    label="Due Date"
                    type="datetime-local"
                    value={currentTask?.due_date || ''}
                    onChange={(e) => setCurrentTask({ ...currentTask, due_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                />
            </Grid>
        </Grid>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setTaskDialog(false)}>Cancel</Button>
        <Button onClick={handleSaveTask} variant="contained">Save</Button>
    </DialogActions>
</Dialog>
```

### 3. Email Integration 📧

**Add State**:
```javascript
const [emailDialog, setEmailDialog] = useState(false);
const [emailTemplates, setEmailTemplates] = useState([]);
const [currentEmail, setCurrentEmail] = useState(null);
```

**Fetch Templates**:
```javascript
const fetchEmailTemplates = async () => {
    try {
        const response = await axios.get(`${CRM_API_URL}/email-templates`);
        setEmailTemplates(response.data);
    } catch (error) {
        console.error('Error fetching email templates:', error);
    }
};
```

**Email Dialog**:
```javascript
<Dialog open={emailDialog} onClose={() => setEmailDialog(false)} maxWidth="md" fullWidth>
    <DialogTitle>Send Email</DialogTitle>
    <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
                <FormControl fullWidth>
                    <InputLabel>Template</InputLabel>
                    <Select
                        value={currentEmail?.template_id || ''}
                        onChange={(e) => {
                            const template = emailTemplates.find(t => t.id === e.target.value);
                            setCurrentEmail({
                                ...currentEmail,
                                template_id: e.target.value,
                                subject: template?.subject || '',
                                body: template?.body || ''
                            });
                        }}
                    >
                        <MenuItem value="">None</MenuItem>
                        {emailTemplates.map(template => (
                            <MenuItem key={template.id} value={template.id}>{template.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="To"
                    value={currentEmail?.to || ''}
                    onChange={(e) => setCurrentEmail({ ...currentEmail, to: e.target.value })}
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Subject"
                    value={currentEmail?.subject || ''}
                    onChange={(e) => setCurrentEmail({ ...currentEmail, subject: e.target.value })}
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={10}
                    value={currentEmail?.body || ''}
                    onChange={(e) => setCurrentEmail({ ...currentEmail, body: e.target.value })}
                />
            </Grid>
        </Grid>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setEmailDialog(false)}>Cancel</Button>
        <Button onClick={handleSendEmail} variant="contained" startIcon={<EmailIcon />}>Send</Button>
    </DialogActions>
</Dialog>
```

### 4. Advanced Search & Filtering 🔍

**Add State**:
```javascript
const [searchQuery, setSearchQuery] = useState('');
const [filters, setFilters] = useState({
    category: '',
    priority: '',
    stage: '',
    dateRange: ''
});
const [savedFilters, setSavedFilters] = useState([]);
```

**Search Bar**:
```javascript
<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
    <TextField
        fullWidth
        placeholder="Search contacts, companies, leads..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
            startAdornment: <SearchIcon />
        }}
    />
    <Button variant="outlined" onClick={() => setFilterDialog(true)}>
        <FilterListIcon /> Filters
    </Button>
    <Button variant="outlined" onClick={() => setSavedFiltersDialog(true)}>
        Saved Views
    </Button>
</Box>
```

**Filter Dialog**:
```javascript
<Dialog open={filterDialog} onClose={() => setFilterDialog(false)}>
    <DialogTitle>Advanced Filters</DialogTitle>
    <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
                <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="Generic">Generic</MenuItem>
                        <MenuItem value="BioSimilar">BioSimilar</MenuItem>
                        <MenuItem value="Investor">Investor</MenuItem>
                        <MenuItem value="Contractor">Contractor</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setFilterDialog(false)}>Cancel</Button>
        <Button onClick={handleSaveFilter}>Save Filter</Button>
        <Button onClick={handleApplyFilters} variant="contained">Apply</Button>
    </DialogActions>
</Dialog>
```

### 5. Lead Scoring & Priority ⭐

**Add Priority Badge to Deal Cards**:
```javascript
<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
    <Chip
        label={deal.priority || 'medium'}
        size="small"
        color={getPriorityColor(deal.priority)}
        icon={deal.priority === 'high' ? <PriorityHighIcon /> : undefined}
    />
    <Chip
        label={`Score: ${deal.score || 0}`}
        size="small"
        variant="outlined"
    />
    {deal.days_since_contact > 30 && (
        <Chip
            label="Follow-up overdue"
            size="small"
            color="error"
            icon={<WarningIcon />}
        />
    )}
</Box>
```

**Calculate Lead Score (add to handleSaveDeal)**:
```javascript
const calculateLeadScore = (deal) => {
    let score = 0;

    // Value-based scoring
    if (deal.value > 100000) score += 30;
    else if (deal.value > 50000) score += 20;
    else if (deal.value > 10000) score += 10;

    // Stage-based scoring
    const stageScores = {
        'Discovery': 10,
        'Qualification': 20,
        'Proposal': 40,
        'Negotiation': 60,
        'Closed Won': 100
    };
    score += stageScores[deal.stage] || 0;

    // Recency scoring
    const daysSinceContact = deal.days_since_contact || 999;
    if (daysSinceContact < 7) score += 20;
    else if (daysSinceContact < 14) score += 10;
    else if (daysSinceContact > 30) score -= 20;

    return Math.max(0, Math.min(100, score));
};
```

### 6. Pipeline Analytics Dashboard 📊

**Add Analytics Tab**:
```javascript
const [analyticsData, setAnalyticsData] = useState(null);

const fetchAnalytics = async () => {
    try {
        const response = await axios.get(`${CRM_API_URL}/analytics/pipeline`);
        setAnalyticsData(response.data);
    } catch (error) {
        console.error('Error fetching analytics:', error);
    }
};

// Add Analytics View
{mainTab === 0 && (
    <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>Pipeline Analytics</Typography>
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Stage Distribution</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analyticsData?.stageDistribution || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="stage" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#C94A3C" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Conversion Rates</Typography>
                        <List>
                            <ListItem>
                                <ListItemText
                                    primary="Discovery → Qualification"
                                    secondary={`${analyticsData?.conversionRates?.discovery_to_qualification?.toFixed(1) || 0}%`}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Win Rate"
                                    secondary={`${analyticsData?.conversionRates?.win_rate?.toFixed(1) || 0}%`}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Avg Deal Cycle"
                                    secondary={`${Math.round(analyticsData?.avgDealCycle || 0)} days`}
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    </Box>
)}
```

### 7. Document Management 📎

**Add to Contact Details Dialog**:
```javascript
const [documents, setDocuments] = useState([]);
const [uploadDialog, setUploadDialog] = useState(false);

const fetchDocuments = async (contactId) => {
    try {
        const response = await axios.get(`${CRM_API_URL}/documents?contact_id=${contactId}`);
        setDocuments(response.data);
    } catch (error) {
        console.error('Error fetching documents:', error);
    }
};

// Add Documents Section to Contact Details Dialog
<Grid item xs={12}>
    <Card variant="outlined">
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Documents</Typography>
                <Button
                    size="small"
                    startIcon={<AttachFileIcon />}
                    onClick={() => setUploadDialog(true)}
                >
                    Upload
                </Button>
            </Box>
            <List>
                {documents.map(doc => (
                    <ListItem key={doc.id}>
                        <ListItemIcon>
                            <InsertDriveFileIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={doc.name}
                            secondary={`${doc.type} - ${format(new Date(doc.created_at), 'MMM dd, yyyy')}`}
                        />
                        <IconButton size="small">
                            <DownloadIcon />
                        </IconButton>
                    </ListItem>
                ))}
                {documents.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                        No documents uploaded
                    </Typography>
                )}
            </List>
        </CardContent>
    </Card>
</Grid>
```

## 🎯 Implementation Priority

1. **Kanban Board** - Most visual impact
2. **Search & Filters** - Critical for finding data
3. **Lead Scoring** - Quick to implement, high value
4. **Task Management** - Essential for follow-ups
5. **Analytics** - Good for reporting
6. **Email Integration** - Nice to have
7. **Documents** - Can be added later

## 📦 Required Imports

Add to SalesAndCRMModule.js:
```javascript
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import WarningIcon from '@mui/icons-material/Warning';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ButtonGroup } from '@mui/material';
```

## ✅ To Run Database Migrations

```bash
node backend/migrate-crm-enhancements.js
```

This will create all necessary tables and seed default email templates.
