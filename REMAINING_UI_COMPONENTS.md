# Remaining UI Components to Add

## Status: Backend Complete ✅ | Handlers Complete ✅ | UI Implementation In Progress ⏳

All backend APIs, state management, and handler functions are now complete. The following UI components need to be added to SalesAndCRMModule.js:

## Critical UI Additions

### 1. Add to Leads Tab (after line ~520 where "Leads" Typography is)

**Search Bar & View Toggle:**
```javascript
<Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
    <TextField
        fullWidth
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
        sx={{ maxWidth: 500 }}
    />
    <Button
        variant="outlined"
        startIcon={<FilterListIcon />}
        onClick={() => setFilterDialog(true)}
    >
        Filters
    </Button>
    <ButtonGroup variant="outlined" sx={{ ml: 'auto' }}>
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
        onClick={() => setShowAnalytics(!showAnalytics)}
    >
        Analytics
    </Button>
</Box>
```

### 2. Kanban Board View (replace or add alongside existing table)

```javascript
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
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
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
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                                        <IconButton size="small" onClick={() => {
                                            setCurrentDeal(deal);
                                            setDealDialog(true);
                                        }}>
                                            <EditIcon fontSize="small" />
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
```

### 3. Update Lead Dialog to include Priority (add after Stage field)

```javascript
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
```

### 4. Analytics Dashboard (add after Kanban/Table view)

```javascript
{showAnalytics && analyticsData && (
    <Box sx={{ mt: 4 }}>
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Pipeline Analytics
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    {/* Stage Distribution Chart */}
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
                                <Bar dataKey="total_value" name="Total Value" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Grid>

                    {/* Metrics */}
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
                                    primary="Qualification → Proposal"
                                    secondary={`${(analyticsData.conversionRates?.qualification_to_proposal || 0).toFixed(1)}%`}
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
            </CardContent>
        </Card>
    </Box>
)}
```

### 5. Filter Dialog (add before closing return statement of main component)

```javascript
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
            Clear
        </Button>
        <Button onClick={() => setFilterDialog(false)}>Close</Button>
    </DialogActions>
</Dialog>
```

### 6. Task Dialog (add near other dialogs)

```javascript
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
        <Button onClick={handleSaveTask} variant="contained">Save</Button>
    </DialogActions>
</Dialog>
```

### 7. Email Dialog (add near other dialogs)

```javascript
{/* Email Dialog */}
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
                            if (template) {
                                setCurrentEmail({
                                    ...currentEmail,
                                    template_id: e.target.value,
                                    subject: template.subject,
                                    body: template.body
                                });
                            }
                        }}
                        label="Template"
                    >
                        <MenuItem value="">None (Blank)</MenuItem>
                        {emailTemplates.map(template => (
                            <MenuItem key={template.id} value={template.id}>
                                {template.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="To"
                    value={currentEmail?.to || selectedContactForDetails?.email || ''}
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
        <Button onClick={handleSendEmail} variant="contained" startIcon={<SendIcon />}>
            Send Email
        </Button>
    </DialogActions>
</Dialog>
```

### 8. Add to Contact Details Dialog - Tasks & Documents Sections

**Tasks Section (add after Communications section in Contact Details Dialog):**
```javascript
{/* Tasks Section */}
<Grid item xs={12}>
    <Card variant="outlined">
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Tasks</Typography>
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setCurrentTask({
                            contact_id: selectedContactForDetails?.id,
                            title: '',
                            description: '',
                            priority: 'medium',
                            type: 'task',
                            status: 'pending'
                        });
                        setTaskDialog(true);
                    }}
                >
                    Add Task
                </Button>
            </Box>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={showCompletedTasks}
                        onChange={(e) => setShowCompletedTasks(e.target.checked)}
                    />
                }
                label="Show completed"
            />
            <List>
                {tasks
                    .filter(task => showCompletedTasks || task.status !== 'completed')
                    .map(task => (
                        <ListItem key={task.id}>
                            <ListItemIcon>
                                <Checkbox
                                    checked={task.status === 'completed'}
                                    onChange={() => handleCompleteTask(task)}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary={task.title}
                                secondary={
                                    <>
                                        {task.description && <Typography variant="body2">{task.description}</Typography>}
                                        {task.due_date && (
                                            <Typography variant="caption" color="text.secondary">
                                                Due: {format(new Date(task.due_date), 'MMM dd, yyyy HH:mm')}
                                            </Typography>
                                        )}
                                    </>
                                }
                            />
                            <Chip
                                label={task.priority}
                                size="small"
                                color={getPriorityColor(task.priority)}
                                sx={{ mr: 1 }}
                            />
                            <IconButton size="small" onClick={() => {
                                setCurrentTask(task);
                                setTaskDialog(true);
                            }}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteTask(task.id)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </ListItem>
                    ))}
                {tasks.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                        No tasks yet
                    </Typography>
                )}
            </List>
        </CardContent>
    </Card>
</Grid>
```

**Documents Section:**
```javascript
{/* Documents Section */}
<Grid item xs={12}>
    <Card variant="outlined">
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Documents</Typography>
                <Button
                    size="small"
                    startIcon={<AttachFileIcon />}
                    onClick={() => {
                        setCurrentDocument({
                            contact_id: selectedContactForDetails?.id,
                            name: '',
                            type: '',
                            description: ''
                        });
                        setUploadDialog(true);
                    }}
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
                            secondary={`${doc.type || 'Document'} - ${format(new Date(doc.created_at), 'MMM dd, yyyy')}`}
                        />
                        <IconButton size="small">
                            <DownloadIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteDocument(doc.id)}>
                            <DeleteIcon />
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

**Add Email Button to Contact Details Header:**
```javascript
<Button
    size="small"
    variant="outlined"
    startIcon={<EmailIcon />}
    onClick={() => {
        setCurrentEmail({
            contact_id: selectedContactForDetails?.id,
            to: selectedContactForDetails?.email,
            subject: '',
            body: ''
        });
        setEmailDialog(true);
    }}
    sx={{ mr: 1 }}
>
    Send Email
</Button>
```

## Installation Required

No additional npm packages needed! All imports are from existing packages.

## Next Steps

1. Find the Leads tab section (mainTab === 0)
2. Add search bar and view toggle
3. Add Kanban board view
4. Add analytics section
5. Add all dialog components
6. Update Contact Details dialog with tasks and documents

Would you like me to apply these specific changes to the file now?
