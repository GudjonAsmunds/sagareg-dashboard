import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, AppBar, Toolbar, Typography, Tabs, Tab, Box, Paper,
  Grid, Card, CardContent, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer, Select, MenuItem,
  FormControl, InputLabel, Alert, Snackbar, Chip, LinearProgress, ThemeProvider, createTheme,
  Menu, IconButton, Avatar
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { format } from 'date-fns';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SalesAndCRMModule from './SalesAndCRMModule';
import Login from './components/Auth/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const API_URL = 'http://localhost:8030/api';
const COLORS = ['#C94A3C', '#2B2D42', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const theme = createTheme({
    typography: {
        fontFamily: 'Inter, sans-serif',
    },
});

function App() {
    const { user, logout } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [adminMenuAnchor, setAdminMenuAnchor] = useState(null);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [deals, setDeals] = useState([]);
    const [team, setTeam] = useState([]);
    const [hires, setHires] = useState([]);
    const [investors, setInvestors] = useState([]);
    const [marketingChannels, setMarketingChannels] = useState([]);
    const [roadmapItems, setRoadmapItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState('All');
    const [roadmapStatusFilter, setRoadmapStatusFilter] = useState('All');

    // Financial Model State
    const [financialInputs, setFinancialInputs] = useState({
        acv: 350000,
        customers: 3,
        growthRate: 25,
        churnRate: 10,
        teamSize: 8,
        avgSalary: 140000,
        infraCost: 10000,
        marketingCost: 20000
    });

    // Team Hiring State
    const [hiringInputs, setHiringInputs] = useState({
        q4Hires: 6,
        q1Hires: 6,
        newHireSalary: 150000,
        equityPerHire: 0.5
    });

    // Funding State
    const [fundingInputs, setFundingInputs] = useState({
        targetRaise: 8,
        preMoney: 24,
        leadCheck: 3,
        esopPool: 20,
        productPercent: 40,
        gtmPercent: 30,
        teamPercent: 20,
        reservePercent: 10
    });

    // 3-Year Funding Calculator State
    const [threeYearInputs, setThreeYearInputs] = useState({
        year2TeamSize: 15,
        year3TeamSize: 25,
        avgSalary: 140000,
        year2Marketing: 50000,
        year3Marketing: 50000,
        year2Infra: 15000,
        year3Infra: 20000
    });

    // Deal Dialog State
    const [dealDialog, setDealDialog] = useState(false);
    const [currentDeal, setCurrentDeal] = useState(null);

    // Team Dialog State
    const [teamDialog, setTeamDialog] = useState(false);
    const [currentTeamMember, setCurrentTeamMember] = useState(null);

    // Marketing Channel Dialog State
    const [channelDialog, setChannelDialog] = useState(false);
    const [currentChannel, setCurrentChannel] = useState(null);

    // Roadmap Dialog State
    const [roadmapDialog, setRoadmapDialog] = useState(false);
    const [currentRoadmapItem, setCurrentRoadmapItem] = useState(null);

    // Hires Dialog State
    const [hireDialog, setHireDialog] = useState(false);
    const [currentHire, setCurrentHire] = useState(null);

    // Investor Dialog State
    const [investorDialog, setInvestorDialog] = useState(false);
    const [currentInvestor, setCurrentInvestor] = useState(null);

    // Gadgets State
    const [selectedGadget, setSelectedGadget] = useState(null);
    const [roiInputs, setRoiInputs] = useState({
        currentTime: 12,
        currentCost: 2000000,
        currentOpportunityCost: 8000000,
        sagaTime: 2,
        sagaCost: 350000,
        sagaOpportunityCost: 1300000
    });

    // Social Media Manager State
    const [socialMediaTab, setSocialMediaTab] = useState(0);
    const [socialPost, setSocialPost] = useState({
        content: '',
        platforms: { linkedin: false, twitter: false, instagram: false, facebook: false },
        scheduleDate: '',
        scheduleTime: '',
        imageUrl: ''
    });
    const [socialPosts, setSocialPosts] = useState([]);
    const [apiKeys, setApiKeys] = useState({
        linkedin: '',
        twitter: '',
        instagram: '',
        facebook: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    // Helper function to format numbers with commas
    const formatNumber = (num) => {
        if (!num && num !== 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Helper function to parse formatted numbers
    const parseFormattedNumber = (str) => {
        if (!str) return 0;
        return parseFloat(str.toString().replace(/,/g, ''));
    };

    // Custom Tooltip formatter for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '5px 0', color: entry.color }}>
                            {entry.name}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dealsRes, teamRes, hiresRes, investorsRes, channelsRes, roadmapRes] = await Promise.all([
                axios.get(`${API_URL}/deals`),
                axios.get(`${API_URL}/team`),
                axios.get(`${API_URL}/hires`),
                axios.get(`${API_URL}/investors`),
                axios.get(`${API_URL}/marketing-channels`),
                axios.get(`${API_URL}/roadmap`)
            ]);
            setDeals(dealsRes.data);
            setTeam(teamRes.data);
            setHires(hiresRes.data);
            setInvestors(investorsRes.data);
            setMarketingChannels(channelsRes.data);
            setRoadmapItems(roadmapRes.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlert({ open: true, message: 'Error loading data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Financial Calculations
    const calculateMetrics = () => {
        const { acv, customers, churnRate, teamSize, avgSalary, infraCost, marketingCost, growthRate } = financialInputs;
        const monthlyBurn = (teamSize * avgSalary / 12) + infraCost + marketingCost;
        const ltv = acv * (1 / (churnRate / 100)) * 0.85;
        const cac = 35000;
        const arr = customers * acv;
        const runway = Math.floor(165000 / monthlyBurn);
        const ltvCac = (ltv / cac).toFixed(1);
        const payback = (cac / (acv * 0.85 / 12)).toFixed(1);
        const grossMargin = 85;

        return { monthlyBurn, ltv, cac, arr, runway, ltvCac, payback, grossMargin, growthRate };
    };

    // Team Cost Calculations
    const calculateTeamCosts = () => {
        const { q4Hires, q1Hires, newHireSalary, equityPerHire } = hiringInputs;
        const currentCost = (2 * 100000) / 12;
        const q4Cost = ((2 * 100000) + (q4Hires * newHireSalary)) / 12;
        const q1Cost = ((2 * 100000) + ((q4Hires + q1Hires) * newHireSalary)) / 12;
        const totalEquity = (q4Hires + q1Hires) * equityPerHire;

        return { currentCost, q4Cost, q1Cost, totalEquity, totalTeamSize: 2 + q4Hires };
    };

    // Funding Calculations
    const calculateFunding = () => {
        const { targetRaise, preMoney, esopPool } = fundingInputs;
        const postMoney = preMoney + targetRaise;
        const dilution = (targetRaise / postMoney) * 100;
        const founderOwnership = (31.5 * (1 - dilution/100)).toFixed(1);

        return { postMoney, dilution, founderOwnership };
    };

    // 3-Year Fundraising Calculator
    const calculate3YearFunding = () => {
        const year1Burn = metrics.monthlyBurn * 12;
        const year2MonthlyBurn = (threeYearInputs.year2TeamSize * threeYearInputs.avgSalary / 12) + threeYearInputs.year2Marketing + threeYearInputs.year2Infra;
        const year3MonthlyBurn = (threeYearInputs.year3TeamSize * threeYearInputs.avgSalary / 12) + threeYearInputs.year3Marketing + threeYearInputs.year3Infra;
        const year2Burn = year2MonthlyBurn * 12;
        const year3Burn = year3MonthlyBurn * 12;
        const totalBurn = year1Burn + year2Burn + year3Burn;
        const currentCash = 165000;
        const buffer = totalBurn * 0.2;
        const totalToRaise = (totalBurn + buffer - currentCash);
        const recommendedRaise = Math.ceil(totalToRaise / 1000000);

        return { year1Burn, year2Burn, year3Burn, year2MonthlyBurn, year3MonthlyBurn, totalBurn, buffer, totalToRaise, recommendedRaise };
    };

    // Revenue Projections
    const calculateProjections = () => {
        const { acv, customers, growthRate } = financialInputs;
        const { monthlyBurn } = calculateMetrics();
        const periods = [
            'Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026',
            'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027',
            'Q1 2028', 'Q2 2028', 'Q3 2028', 'Q4 2028'
        ];

        let currentCustomers = customers;
        return periods.map(period => {
            const arr = currentCustomers * acv;
            const monthlyRevenue = arr / 12;
            const netBurn = monthlyBurn - monthlyRevenue;
            currentCustomers *= (1 + growthRate / 100);

            return { period, customers: Math.round(currentCustomers / (1 + growthRate / 100)), arr, monthlyBurn, netBurn };
        });
    };

    const metrics = calculateMetrics();
    const teamCosts = calculateTeamCosts();
    const funding = calculateFunding();
    const projections = calculateProjections();
    const threeYearFunding = calculate3YearFunding();

    // Pipeline Metrics
    const pipelineValue = deals.reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0);
    const activeDealsCount = deals.filter(d => d.status === 'active').length;
    const hiredTeamCount = team.filter(t => t.status === 'hired').length;
    const closedDeals = deals.filter(d => d.stage === 'Closed');
    const actualARR = closedDeals.reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0);
    const actualCustomerCount = closedDeals.length;

    // Deals CRUD
    const handleSaveDeal = async () => {
        try {
            if (currentDeal?.id) {
                await axios.put(`${API_URL}/deals/${currentDeal.id}`, currentDeal);
            } else {
                await axios.post(`${API_URL}/deals`, currentDeal);
            }
            fetchData();
            setDealDialog(false);
            setCurrentDeal(null);
            setAlert({ open: true, message: 'Deal saved successfully', severity: 'success' });
        } catch (error) {
            setAlert({ open: true, message: 'Error saving deal', severity: 'error' });
        }
    };

    const handleDeleteDeal = async (id) => {
        if (window.confirm('Delete this deal?')) {
            try {
                await axios.delete(`${API_URL}/deals/${id}`);
                fetchData();
                setAlert({ open: true, message: 'Deal deleted', severity: 'success' });
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting deal', severity: 'error' });
            }
        }
    };

    // Team CRUD
    const handleSaveTeamMember = async () => {
        try {
            if (currentTeamMember?.id) {
                await axios.put(`${API_URL}/team/${currentTeamMember.id}`, currentTeamMember);
            } else {
                await axios.post(`${API_URL}/team`, currentTeamMember);
            }
            fetchData();
            setTeamDialog(false);
            setCurrentTeamMember(null);
            setAlert({ open: true, message: 'Team member saved successfully', severity: 'success' });
        } catch (error) {
            setAlert({ open: true, message: 'Error saving team member', severity: 'error' });
        }
    };

    const handleDeleteTeamMember = async (id) => {
        if (window.confirm('Delete this team member?')) {
            try {
                await axios.delete(`${API_URL}/team/${id}`);
                fetchData();
                setAlert({ open: true, message: 'Team member deleted', severity: 'success' });
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting team member', severity: 'error' });
            }
        }
    };

    // Marketing Channels CRUD
    const handleSaveChannel = async () => {
        try {
            if (currentChannel?.id) {
                await axios.put(`${API_URL}/marketing-channels/${currentChannel.id}`, currentChannel);
            } else {
                await axios.post(`${API_URL}/marketing-channels`, currentChannel);
            }
            fetchData();
            setChannelDialog(false);
            setCurrentChannel(null);
            setAlert({ open: true, message: 'Marketing channel saved successfully', severity: 'success' });
        } catch (error) {
            setAlert({ open: true, message: 'Error saving marketing channel', severity: 'error' });
        }
    };

    const handleDeleteChannel = async (id) => {
        if (window.confirm('Delete this marketing channel?')) {
            try {
                await axios.delete(`${API_URL}/marketing-channels/${id}`);
                fetchData();
                setAlert({ open: true, message: 'Marketing channel deleted', severity: 'success' });
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting marketing channel', severity: 'error' });
            }
        }
    };

    // Filter marketing channels by status
    const filteredChannels = statusFilter === 'All'
        ? marketingChannels
        : marketingChannels.filter(ch => ch.status === statusFilter);

    // Roadmap CRUD
    const handleSaveRoadmapItem = async () => {
        try {
            if (currentRoadmapItem?.id) {
                await axios.put(`${API_URL}/roadmap/${currentRoadmapItem.id}`, currentRoadmapItem);
            } else {
                await axios.post(`${API_URL}/roadmap`, currentRoadmapItem);
            }
            fetchData();
            setRoadmapDialog(false);
            setCurrentRoadmapItem(null);
            setAlert({ open: true, message: 'Roadmap item saved successfully', severity: 'success' });
        } catch (error) {
            setAlert({ open: true, message: 'Error saving roadmap item', severity: 'error' });
        }
    };

    const handleDeleteRoadmapItem = async (id) => {
        if (window.confirm('Delete this roadmap item?')) {
            try {
                await axios.delete(`${API_URL}/roadmap/${id}`);
                fetchData();
                setAlert({ open: true, message: 'Roadmap item deleted', severity: 'success' });
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting roadmap item', severity: 'error' });
            }
        }
    };

    // Filter roadmap items by status
    const filteredRoadmapItems = roadmapStatusFilter === 'All'
        ? roadmapItems
        : roadmapItems.filter(item => item.status === roadmapStatusFilter);

    // ROI Calculator functions
    const calculateCurrentTotal = () => {
        return roiInputs.currentCost + roiInputs.currentOpportunityCost;
    };

    const calculateSagaTotal = () => {
        return roiInputs.sagaCost + roiInputs.sagaOpportunityCost;
    };

    const calculateSavings = () => {
        return calculateCurrentTotal() - calculateSagaTotal();
    };

    const calculateROI = () => {
        const savings = calculateSavings();
        return ((savings / roiInputs.sagaCost) * 100).toFixed(0);
    };

    // Gadgets list
    const gadgets = [
        // Sales Gadgets
        { id: 'roi-calculator', title: '💰 Value-Based Pricing Calculator', description: 'Calculate ROI and cost savings for prospects', category: 'sales' },
        { id: 'email-templates', title: '📧 Email Templates', description: 'Pre-written templates for outreach, follow-ups, and LOI requests', category: 'sales' },
        { id: 'closing-strategies', title: '🎯 Closing Strategies', description: '4 proven closing techniques for different scenarios', category: 'sales' },
        { id: 'elevator-pitch', title: '🎤 Elevator Pitch Generator', description: '30/60/90 second pitches for different audiences', category: 'sales' },
        { id: 'objection-handler', title: '❓ Objection Handler', description: 'Responses to 5 common sales objections', category: 'sales' },
        { id: 'demo-script', title: '📊 Demo Script & Flow', description: 'Step-by-step demo process with timing and talking points', category: 'sales' },
        { id: 'competitor-comparison', title: '🔍 Competitor Comparison Matrix', description: 'Feature comparison: SagaReg vs consultants vs legacy tech', category: 'sales' },
        { id: 'sales-cadence', title: '📅 Sales Cadence Tracker', description: '7-touchpoint follow-up sequence for cold outreach', category: 'sales' },
        { id: 'customer-success', title: '💼 Customer Success Playbook', description: 'Pilot phase timeline and success milestones', category: 'sales' },
        { id: 'quarterly-goals', title: '📈 Quarterly Goal Calculator', description: 'ARR targets broken down by quarter', category: 'business' },
        { id: 'icp-scorecard', title: '🎯 ICP Scorecard', description: 'Lead qualification scoring system', category: 'sales' },

        // Social Media & Marketing
        { id: 'social-media-manager', title: '📱 Social Media Manager', description: 'Schedule and post to LinkedIn, Twitter, Instagram, Facebook via API', category: 'marketing' }
    ];

    // Hires CRUD
    const handleSaveHire = async () => {
        try {
            if (currentHire?.id) {
                await axios.put(`${API_URL}/hires/${currentHire.id}`, currentHire);
            } else {
                await axios.post(`${API_URL}/hires`, currentHire);
            }
            fetchData();
            setHireDialog(false);
            setCurrentHire(null);
            setAlert({ open: true, message: 'Hire saved successfully', severity: 'success' });
        } catch (error) {
            setAlert({ open: true, message: 'Error saving hire', severity: 'error' });
        }
    };

    const handleDeleteHire = async (id) => {
        if (window.confirm('Delete this hire?')) {
            try {
                await axios.delete(`${API_URL}/hires/${id}`);
                fetchData();
                setAlert({ open: true, message: 'Hire deleted', severity: 'success' });
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting hire', severity: 'error' });
            }
        }
    };

    // Investors CRUD
    const handleSaveInvestor = async () => {
        try {
            if (currentInvestor?.id) {
                await axios.put(`${API_URL}/investors/${currentInvestor.id}`, currentInvestor);
            } else {
                await axios.post(`${API_URL}/investors`, currentInvestor);
            }
            fetchData();
            setInvestorDialog(false);
            setCurrentInvestor(null);
            setAlert({ open: true, message: 'Investor saved successfully', severity: 'success' });
        } catch (error) {
            setAlert({ open: true, message: 'Error saving investor', severity: 'error' });
        }
    };

    const handleDeleteInvestor = async (id) => {
        if (window.confirm('Delete this investor?')) {
            try {
                await axios.delete(`${API_URL}/investors/${id}`);
                fetchData();
                setAlert({ open: true, message: 'Investor deleted', severity: 'success' });
            } catch (error) {
                setAlert({ open: true, message: 'Error deleting investor', severity: 'error' });
            }
        }
    };

    return (
        <ThemeProvider theme={theme}>
        <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f7', minHeight: '100vh' }}>
            <AppBar position="static" sx={{ backgroundColor: '#2B2D42' }}>
                <Toolbar>
                    <Typography variant="h4" sx={{ flexGrow: 1 }}>
                        <span style={{ color: 'white', fontWeight: 300, letterSpacing: 2 }}>SAGA</span>
                        <span style={{ color: '#C94A3C', fontWeight: 300, letterSpacing: 2 }}>REG</span>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Interactive Business Dashboard
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                Last Updated: {lastUpdated.toLocaleString()}
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                            sx={{ color: 'white' }}
                        >
                            <Avatar sx={{ bgcolor: '#C94A3C', width: 32, height: 32 }}>
                                {user?.name?.charAt(0) || 'U'}
                            </Avatar>
                        </IconButton>
                    </Box>
                    <Menu
                        anchorEl={userMenuAnchor}
                        open={Boolean(userMenuAnchor)}
                        onClose={() => setUserMenuAnchor(null)}
                    >
                        <MenuItem disabled>
                            <PersonIcon sx={{ mr: 1 }} />
                            {user?.email}
                        </MenuItem>
                        <MenuItem onClick={() => {
                            logout();
                            setUserMenuAnchor(null);
                        }}>
                            <LogoutIcon sx={{ mr: 1 }} />
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
                <Paper sx={{ width: '100%', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tabs
                            value={tabValue >= 10 ? false : tabValue}
                            onChange={(e, v) => setTabValue(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ flexGrow: 1 }}
                        >
                            <Tab label="Overview" />
                            <Tab label="Leads & CRM" />
                            <Tab label="Key Metrics" />
                            <Tab label="Gadgets" />
                        </Tabs>
                        <Button
                            endIcon={<ArrowDropDownIcon />}
                            onClick={(e) => setAdminMenuAnchor(e.currentTarget)}
                            sx={{
                                mr: 2,
                                textTransform: 'none',
                                color: tabValue >= 10 ? 'primary.main' : 'text.primary',
                                fontWeight: tabValue >= 10 ? 600 : 400,
                                borderBottom: tabValue >= 10 ? '2px solid' : 'none',
                                borderRadius: 0,
                                pb: 1.5,
                                pt: 1.5
                            }}
                        >
                            Administration
                        </Button>
                        <Menu
                            anchorEl={adminMenuAnchor}
                            open={Boolean(adminMenuAnchor)}
                            onClose={() => setAdminMenuAnchor(null)}
                        >
                            <MenuItem onClick={() => { setTabValue(10); setAdminMenuAnchor(null); }}>
                                Financial Model
                            </MenuItem>
                            <MenuItem onClick={() => { setTabValue(11); setAdminMenuAnchor(null); }}>
                                Team & Hiring
                            </MenuItem>
                            <MenuItem onClick={() => { setTabValue(12); setAdminMenuAnchor(null); }}>
                                Funding Strategy
                            </MenuItem>
                            <MenuItem onClick={() => { setTabValue(13); setAdminMenuAnchor(null); }}>
                                Product Roadmap
                            </MenuItem>
                            <MenuItem onClick={() => { setTabValue(14); setAdminMenuAnchor(null); }}>
                                Marketing
                            </MenuItem>
                        </Menu>
                    </Box>
                </Paper>

                {/* Overview Tab */}
                {tabValue === 0 && (
                    <Box>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>
                                            ${actualARR.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Annual Recurring Revenue
                                        </Typography>
                                        <Chip label="Target: $450K by Q4 2025" color="primary" size="small" sx={{ mt: 1 }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>
                                            {actualCustomerCount}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Paying Customers
                                        </Typography>
                                        <Chip label="Target: 3 by Q4 2025" color="primary" size="small" sx={{ mt: 1 }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>
                                            {metrics.runway}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Months Runway
                                        </Typography>
                                        <Chip label="With $165K grant" color="warning" size="small" sx={{ mt: 1 }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>
                                            {hiredTeamCount}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Team Size
                                        </Typography>
                                        <Chip label="Target: 8 by Q4 2025" color="primary" size="small" sx={{ mt: 1 }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Company Status
                                        </Typography>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell><strong>Stage</strong></TableCell>
                                                        <TableCell>Pre-revenue → Seed</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell><strong>Founded</strong></TableCell>
                                                        <TableCell>November 2024</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell><strong>Location</strong></TableCell>
                                                        <TableCell>Reykjavik, Iceland</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell><strong>Market</strong></TableCell>
                                                        <TableCell>$4.2B Regulatory Documentation</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell><strong>Product</strong></TableCell>
                                                        <TableCell>AI-Powered Dossier Generation</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell><strong>Traction</strong></TableCell>
                                                        <TableCell>Gulleggið Winner, Coripharma POC</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Key Milestones
                                        </Typography>
                                        <Box sx={{ pl: 3, position: 'relative' }}>
                                            {[
                                                { date: 'February 2025', text: 'Win Gulleggið ✓' },
                                                { date: 'June 2025', text: 'Coripharma POC ✓' },
                                                { date: 'October 2025', text: 'Close Seed Round' },
                                                { date: 'October 2025', text: 'CPHI Frankfurt Launch' },
                                                { date: 'December 2025', text: '3 Paying Customers' },
                                                { date: 'Q4 2026', text: '$4.2M ARR' }
                                            ].map((milestone, i) => (
                                                <Box key={i} sx={{ pb: 2, position: 'relative' }}>
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        left: -22,
                                                        top: 6,
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: '50%',
                                                        bgcolor: '#C94A3C'
                                                    }} />
                                                    {i < 5 && (
                                                        <Box sx={{
                                                            position: 'absolute',
                                                            left: -17,
                                                            top: 18,
                                                            bottom: -20,
                                                            width: 2,
                                                            bgcolor: '#e0e0e0'
                                                        }} />
                                                    )}
                                                    <Typography variant="body2">
                                                        <strong>{milestone.date}</strong> - {milestone.text}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Paying Customers Section */}
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999', mb: 2 }}>
                                            💰 Paying Customers
                                        </Typography>
                                        {closedDeals.length === 0 ? (
                                            <Box sx={{ textAlign: 'center', py: 4, color: '#666' }}>
                                                <Typography variant="body1">No paying customers yet. Close deals in the Sales Pipeline to see them here.</Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Contract Value</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {closedDeals.map((deal) => (
                                                            <TableRow key={deal.id}>
                                                                <TableCell>{deal.company}</TableCell>
                                                                <TableCell>{deal.contact}</TableCell>
                                                                <TableCell>
                                                                    <Typography sx={{ fontWeight: 600, color: '#10b981' }}>
                                                                        ${parseFloat(deal.value || 0).toLocaleString()}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell sx={{ maxWidth: 300 }}>{deal.notes || '-'}</TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        size="small"
                                                                        onClick={() => {
                                                                            setCurrentDeal(deal);
                                                                            setDealDialog(true);
                                                                        }}
                                                                        sx={{ color: '#C94A3C' }}
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        <TableRow>
                                                            <TableCell colSpan={2} sx={{ fontWeight: 600, bgcolor: '#f9fafb' }}>
                                                                Total ARR
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 600, bgcolor: '#f9fafb', color: '#C94A3C', fontSize: '1.1rem' }}>
                                                                ${actualARR.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell colSpan={2} sx={{ bgcolor: '#f9fafb' }}></TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* Financial Model Tab */}
                {tabValue === 10 && (
                    <Box>
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            💡 Adjust the inputs below to see how changes affect your financial projections
                        </Alert>

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Revenue Inputs
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            label="Average Contract Value ($)"
                                            value={formatNumber(financialInputs.acv)}
                                            onChange={(e) => setFinancialInputs({...financialInputs, acv: parseFormattedNumber(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Customers by Q4 2025"
                                            type="number"
                                            value={financialInputs.customers}
                                            onChange={(e) => setFinancialInputs({...financialInputs, customers: parseFloat(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Monthly Growth Rate (%)"
                                            type="number"
                                            value={financialInputs.growthRate}
                                            onChange={(e) => setFinancialInputs({...financialInputs, growthRate: parseFloat(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Annual Churn Rate (%)"
                                            type="number"
                                            value={financialInputs.churnRate}
                                            onChange={(e) => setFinancialInputs({...financialInputs, churnRate: parseFloat(e.target.value)})}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Cost Inputs
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            label="Team Size"
                                            type="number"
                                            value={financialInputs.teamSize}
                                            onChange={(e) => setFinancialInputs({...financialInputs, teamSize: parseFloat(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Average Salary ($)"
                                            value={formatNumber(financialInputs.avgSalary)}
                                            onChange={(e) => setFinancialInputs({...financialInputs, avgSalary: parseFormattedNumber(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Monthly Infrastructure ($)"
                                            value={formatNumber(financialInputs.infraCost)}
                                            onChange={(e) => setFinancialInputs({...financialInputs, infraCost: parseFormattedNumber(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Monthly Marketing ($)"
                                            value={formatNumber(financialInputs.marketingCost)}
                                            onChange={(e) => setFinancialInputs({...financialInputs, marketingCost: parseFormattedNumber(e.target.value)})}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Calculated Metrics
                                        </Typography>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell><strong>Monthly Burn</strong></TableCell>
                                                    <TableCell>${metrics.monthlyBurn.toLocaleString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>CAC</strong></TableCell>
                                                    <TableCell>${metrics.cac.toLocaleString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>LTV</strong></TableCell>
                                                    <TableCell>${metrics.ltv.toLocaleString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>LTV/CAC Ratio</strong></TableCell>
                                                    <TableCell>{metrics.ltvCac}x</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>Gross Margin</strong></TableCell>
                                                    <TableCell>{metrics.grossMargin}%</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>Payback Period</strong></TableCell>
                                                    <TableCell>{metrics.payback} months</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                    Revenue Projections
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Period</TableCell>
                                                <TableCell>Customers</TableCell>
                                                <TableCell>ARR</TableCell>
                                                <TableCell>Monthly Burn</TableCell>
                                                <TableCell>Net Burn</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {projections.map((proj, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{proj.period}</TableCell>
                                                    <TableCell>{proj.customers}</TableCell>
                                                    <TableCell>${proj.arr.toLocaleString()}</TableCell>
                                                    <TableCell>${proj.monthlyBurn.toLocaleString()}</TableCell>
                                                    <TableCell sx={{ color: proj.netBurn > 0 ? '#ef4444' : '#10b981' }}>
                                                        {proj.netBurn > 0 ? '-' : '+'}${Math.abs(proj.netBurn).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>

                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            ARR Growth Projection
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={projections}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="period" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }} />
                                                <YAxis
                                                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }} />
                                                <Line type="monotone" dataKey="arr" stroke="#C94A3C" strokeWidth={2} name="ARR" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Burn vs Revenue
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={projections}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="period" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }} />
                                                <YAxis
                                                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }} />
                                                <Bar dataKey="monthlyBurn" fill="#ef4444" name="Monthly Burn" />
                                                <Bar dataKey="arr" fill="#10b981" name="ARR" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* Leads & CRM Tab */}
                {tabValue === 1 && (
                    <SalesAndCRMModule />
                )}

                {/* Team & Hiring Tab */}
                {tabValue === 11 && (
                    <Box>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>
                                            ${pipelineValue.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Pipeline Value
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>
                                            {deals.length}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Qualified Leads
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>
                                            {activeDealsCount}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Active Deals
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>
                                            0%
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Conversion Rate
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                        Sales Pipeline
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        sx={{ bgcolor: '#C94A3C' }}
                                        onClick={() => {
                                            setCurrentDeal({company: '', contact: '', stage: 'Discovery', value: 0, probability: 50, notes: '', next_step: ''});
                                            setDealDialog(true);
                                        }}
                                    >
                                        + Add New Deal
                                    </Button>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Company</TableCell>
                                                <TableCell>Stage</TableCell>
                                                <TableCell>Value</TableCell>
                                                <TableCell>Probability</TableCell>
                                                <TableCell>Next Step</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {deals.map((deal) => (
                                                <TableRow key={deal.id}>
                                                    <TableCell>{deal.company}</TableCell>
                                                    <TableCell>
                                                        <Chip label={deal.stage} size="small" />
                                                    </TableCell>
                                                    <TableCell>${parseFloat(deal.value).toLocaleString()}</TableCell>
                                                    <TableCell>{deal.probability}%</TableCell>
                                                    <TableCell>{deal.next_step}</TableCell>
                                                    <TableCell>
                                                        <Button size="small" onClick={() => { setCurrentDeal(deal); setDealDialog(true); }}>
                                                            Edit
                                                        </Button>
                                                        <Button size="small" color="error" onClick={() => handleDeleteDeal(deal.id)}>
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Team & Hiring Tab */}
                {tabValue === 11 && (
                    <Box>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Current Team
                                        </Typography>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableBody>
                                                    {team.filter(t => t.status === 'hired').map((member) => (
                                                        <TableRow key={member.id}>
                                                            <TableCell><strong>{member.role}</strong></TableCell>
                                                            <TableCell>{member.name}</TableCell>
                                                            <TableCell>${member.salary?.toLocaleString()} + {member.equity}%</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        <Button
                                            variant="contained"
                                            sx={{ mt: 2, bgcolor: '#C94A3C' }}
                                            onClick={() => {
                                                setCurrentTeamMember({name: '', role: '', department: '', salary: 0, equity: 0, start_date: '', status: 'hired'});
                                                setTeamDialog(true);
                                            }}
                                        >
                                            + Add Team Member
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Hiring Plan
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            label="Q4 2025 Hires"
                                            type="number"
                                            value={hiringInputs.q4Hires}
                                            onChange={(e) => setHiringInputs({...hiringInputs, q4Hires: parseInt(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Q1 2026 Hires"
                                            type="number"
                                            value={hiringInputs.q1Hires}
                                            onChange={(e) => setHiringInputs({...hiringInputs, q1Hires: parseInt(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Average New Hire Salary"
                                            type="number"
                                            value={hiringInputs.newHireSalary}
                                            onChange={(e) => setHiringInputs({...hiringInputs, newHireSalary: parseInt(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Equity per Early Hire (%)"
                                            type="number"
                                            value={hiringInputs.equityPerHire}
                                            onChange={(e) => setHiringInputs({...hiringInputs, equityPerHire: parseFloat(e.target.value)})}
                                            inputProps={{ step: 0.1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                        Priority Hires
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        sx={{ bgcolor: '#C94A3C' }}
                                        onClick={() => {
                                            setCurrentHire({role: '', priority: 'High', start_date: '', salary_range: '', equity: '', status: 'Not Started'});
                                            setHireDialog(true);
                                        }}
                                    >
                                        + Add New Hire
                                    </Button>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Role</TableCell>
                                                <TableCell>Priority</TableCell>
                                                <TableCell>Start Date</TableCell>
                                                <TableCell>Salary Range</TableCell>
                                                <TableCell>Equity</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {hires.map((hire) => (
                                                <TableRow key={hire.id}>
                                                    <TableCell>{hire.role}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={hire.priority}
                                                            color={hire.priority === 'Critical' ? 'error' : 'warning'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{hire.start_date}</TableCell>
                                                    <TableCell>{hire.salary_range}</TableCell>
                                                    <TableCell>{hire.equity}</TableCell>
                                                    <TableCell>
                                                        <Chip label={hire.status} size="small" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button size="small" onClick={() => { setCurrentHire(hire); setHireDialog(true); }}>
                                                            Edit
                                                        </Button>
                                                        <Button size="small" color="error" onClick={() => handleDeleteHire(hire.id)}>
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                    Team Cost Projections
                                </Typography>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><strong>Current Monthly Cost</strong></TableCell>
                                            <TableCell>${teamCosts.currentCost.toLocaleString()}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Q4 2025 Monthly Cost</strong></TableCell>
                                            <TableCell>${teamCosts.q4Cost.toLocaleString()}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Q1 2026 Monthly Cost</strong></TableCell>
                                            <TableCell>${teamCosts.q1Cost.toLocaleString()}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Total Equity Allocated</strong></TableCell>
                                            <TableCell>{teamCosts.totalEquity.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Funding Strategy Tab */}
                {tabValue === 12 && (
                    <Box>
                        {/* 3-Year Fundraising Calculator */}
                        <Card sx={{ mb: 3, bgcolor: '#f0f9ff', border: '2px solid #C94A3C' }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#C94A3C', mb: 3 }}>
                                    💰 3-Year Fundraising Calculator
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                                    Calculate how much capital you need to raise based on your burn rate, growth plans, and target runway.
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Assumptions</Typography>
                                        <TextField
                                            fullWidth
                                            label="Current Monthly Burn ($)"
                                            value={formatNumber(metrics.monthlyBurn)}
                                            disabled
                                            sx={{ mb: 2, bgcolor: '#f5f5f5' }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Year 2 Team Size"
                                            type="number"
                                            value={threeYearInputs.year2TeamSize}
                                            onChange={(e) => setThreeYearInputs({...threeYearInputs, year2TeamSize: parseFloat(e.target.value)})}
                                            sx={{ mb: 2, bgcolor: 'white' }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Year 3 Team Size"
                                            type="number"
                                            value={threeYearInputs.year3TeamSize}
                                            onChange={(e) => setThreeYearInputs({...threeYearInputs, year3TeamSize: parseFloat(e.target.value)})}
                                            sx={{ mb: 2, bgcolor: 'white' }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Avg Salary ($)"
                                            value={formatNumber(threeYearInputs.avgSalary)}
                                            onChange={(e) => setThreeYearInputs({...threeYearInputs, avgSalary: parseFormattedNumber(e.target.value)})}
                                            sx={{ mb: 2, bgcolor: 'white' }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Year 2 Monthly Marketing ($)"
                                            value={formatNumber(threeYearInputs.year2Marketing)}
                                            onChange={(e) => setThreeYearInputs({...threeYearInputs, year2Marketing: parseFormattedNumber(e.target.value)})}
                                            sx={{ mb: 2, bgcolor: 'white' }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Year 3 Monthly Marketing ($)"
                                            value={formatNumber(threeYearInputs.year3Marketing)}
                                            onChange={(e) => setThreeYearInputs({...threeYearInputs, year3Marketing: parseFormattedNumber(e.target.value)})}
                                            sx={{ bgcolor: 'white' }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>3-Year Burn Projection</Typography>
                                        <Table size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell><strong>Year 1 (Current)</strong></TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ pl: 3 }}>Team Size</TableCell>
                                                    <TableCell>{hiredTeamCount} people</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ pl: 3 }}>Monthly Burn</TableCell>
                                                    <TableCell>${metrics.monthlyBurn.toLocaleString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ pl: 3 }}>Annual Burn</TableCell>
                                                    <TableCell><strong>${threeYearFunding.year1Burn.toLocaleString()}</strong></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>Year 2</strong></TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ pl: 3 }}>Team Size</TableCell>
                                                    <TableCell>{threeYearInputs.year2TeamSize} people</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ pl: 3 }}>Est. Monthly Burn</TableCell>
                                                    <TableCell>${threeYearFunding.year2MonthlyBurn.toLocaleString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ pl: 3 }}>Annual Burn</TableCell>
                                                    <TableCell><strong>${threeYearFunding.year2Burn.toLocaleString()}</strong></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>Year 3</strong></TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ pl: 3 }}>Team Size</TableCell>
                                                    <TableCell>{threeYearInputs.year3TeamSize} people</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ pl: 3 }}>Est. Monthly Burn</TableCell>
                                                    <TableCell>${threeYearFunding.year3MonthlyBurn.toLocaleString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ pl: 3 }}>Annual Burn</TableCell>
                                                    <TableCell><strong>${threeYearFunding.year3Burn.toLocaleString()}</strong></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Funding Required</Typography>
                                        <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: '2px solid #C94A3C' }}>
                                            <Typography variant="h3" sx={{ color: '#C94A3C', fontWeight: 600, mb: 2 }}>
                                                ${threeYearFunding.totalBurn.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                                                Total Capital Needed (3 Years)
                                            </Typography>

                                            <Table size="small">
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell>Year 1 Burn</TableCell>
                                                        <TableCell>${threeYearFunding.year1Burn.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell>Year 2 Burn</TableCell>
                                                        <TableCell>${threeYearFunding.year2Burn.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell>Year 3 Burn</TableCell>
                                                        <TableCell>${threeYearFunding.year3Burn.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell>Current Cash</TableCell>
                                                        <TableCell>-$165,000</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell>Buffer (20%)</TableCell>
                                                        <TableCell>${threeYearFunding.buffer.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell><strong>Total to Raise</strong></TableCell>
                                                        <TableCell>
                                                            <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>
                                                                ${threeYearFunding.totalToRaise.toLocaleString()}
                                                            </strong>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Box>

                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            💡 Recommendation: Raise <strong>${threeYearFunding.recommendedRaise}M</strong> to cover 3 years of runway with buffer
                                        </Alert>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Funding Parameters
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            label="Target Raise ($M)"
                                            type="number"
                                            value={fundingInputs.targetRaise}
                                            onChange={(e) => setFundingInputs({...fundingInputs, targetRaise: parseFloat(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Pre-Money Valuation ($M)"
                                            type="number"
                                            value={fundingInputs.preMoney}
                                            onChange={(e) => setFundingInputs({...fundingInputs, preMoney: parseFloat(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Lead Investor Check ($M)"
                                            type="number"
                                            value={fundingInputs.leadCheck}
                                            onChange={(e) => setFundingInputs({...fundingInputs, leadCheck: parseFloat(e.target.value)})}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="ESOP Pool (%)"
                                            type="number"
                                            value={fundingInputs.esopPool}
                                            onChange={(e) => setFundingInputs({...fundingInputs, esopPool: parseFloat(e.target.value)})}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Cap Table (Post-Seed)
                                        </Typography>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>Ómar (CEO)</TableCell>
                                                    <TableCell>{funding.founderOwnership}%</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Guðjón (CTO)</TableCell>
                                                    <TableCell>{funding.founderOwnership}%</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Investors</TableCell>
                                                    <TableCell>{funding.dilution.toFixed(1)}%</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>ESOP</TableCell>
                                                    <TableCell>{fundingInputs.esopPool}%</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>Post-Money Val</strong></TableCell>
                                                    <TableCell><strong>${funding.postMoney}M</strong></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Use of Funds
                                        </Typography>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell><strong>Product</strong></TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <TextField
                                                                type="number"
                                                                value={fundingInputs.productPercent}
                                                                onChange={(e) => setFundingInputs({...fundingInputs, productPercent: parseFloat(e.target.value)})}
                                                                size="small"
                                                                sx={{
                                                                    width: '60px',
                                                                    mr: 0.5,
                                                                    '& .MuiInputBase-input': {
                                                                        fontSize: '0.875rem'
                                                                    }
                                                                }}
                                                            />
                                                            <Typography variant="body2">%</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>${(fundingInputs.targetRaise * fundingInputs.productPercent / 100).toFixed(1)}M</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>GTM</strong></TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <TextField
                                                                type="number"
                                                                value={fundingInputs.gtmPercent}
                                                                onChange={(e) => setFundingInputs({...fundingInputs, gtmPercent: parseFloat(e.target.value)})}
                                                                size="small"
                                                                sx={{
                                                                    width: '60px',
                                                                    mr: 0.5,
                                                                    '& .MuiInputBase-input': {
                                                                        fontSize: '0.875rem'
                                                                    }
                                                                }}
                                                            />
                                                            <Typography variant="body2">%</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>${(fundingInputs.targetRaise * fundingInputs.gtmPercent / 100).toFixed(1)}M</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>Team</strong></TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <TextField
                                                                type="number"
                                                                value={fundingInputs.teamPercent}
                                                                onChange={(e) => setFundingInputs({...fundingInputs, teamPercent: parseFloat(e.target.value)})}
                                                                size="small"
                                                                sx={{
                                                                    width: '60px',
                                                                    mr: 0.5,
                                                                    '& .MuiInputBase-input': {
                                                                        fontSize: '0.875rem'
                                                                    }
                                                                }}
                                                            />
                                                            <Typography variant="body2">%</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>${(fundingInputs.targetRaise * fundingInputs.teamPercent / 100).toFixed(1)}M</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell><strong>Reserve</strong></TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <TextField
                                                                type="number"
                                                                value={fundingInputs.reservePercent}
                                                                onChange={(e) => setFundingInputs({...fundingInputs, reservePercent: parseFloat(e.target.value)})}
                                                                size="small"
                                                                sx={{
                                                                    width: '60px',
                                                                    mr: 0.5,
                                                                    '& .MuiInputBase-input': {
                                                                        fontSize: '0.875rem'
                                                                    }
                                                                }}
                                                            />
                                                            <Typography variant="body2">%</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>${(fundingInputs.targetRaise * fundingInputs.reservePercent / 100).toFixed(1)}M</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell colSpan={2}><strong>Total</strong></TableCell>
                                                    <TableCell>
                                                        <strong style={{
                                                            color: (fundingInputs.productPercent + fundingInputs.gtmPercent + fundingInputs.teamPercent + fundingInputs.reservePercent) === 100 ? '#10b981' : '#ef4444'
                                                        }}>
                                                            {(fundingInputs.productPercent + fundingInputs.gtmPercent + fundingInputs.teamPercent + fundingInputs.reservePercent)}%
                                                        </strong>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Cap Table Distribution
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Founders', value: parseFloat(funding.founderOwnership) * 2 },
                                                        { name: 'Investors', value: funding.dilution },
                                                        { name: 'ESOP', value: fundingInputs.esopPool }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                                                >
                                                    {[0, 1, 2].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                            Use of Funds
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart
                                                data={[
                                                    { category: 'Product', amount: fundingInputs.targetRaise * fundingInputs.productPercent / 100 },
                                                    { category: 'GTM', amount: fundingInputs.targetRaise * fundingInputs.gtmPercent / 100 },
                                                    { category: 'Team', amount: fundingInputs.targetRaise * fundingInputs.teamPercent / 100 },
                                                    { category: 'Reserve', amount: fundingInputs.targetRaise * fundingInputs.reservePercent / 100 }
                                                ]}
                                                layout="vertical"
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }} />
                                                <YAxis type="category" dataKey="category" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }} />
                                                <Tooltip contentStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }} />
                                                <Bar dataKey="amount" fill="#2B2D42" name="Amount ($M)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                        Investor Pipeline
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        sx={{ bgcolor: '#C94A3C' }}
                                        onClick={() => {
                                            setCurrentInvestor({name: '', type: 'Follow', check_size: '', status: 'Not Contacted', notes: '', contact: '', next_step: ''});
                                            setInvestorDialog(true);
                                        }}
                                    >
                                        + Add New Investor
                                    </Button>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Investor</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Check Size</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Next Step</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {investors.map((investor) => (
                                                <TableRow key={investor.id}>
                                                    <TableCell>{investor.name}</TableCell>
                                                    <TableCell><Chip label={investor.type} size="small" /></TableCell>
                                                    <TableCell>{investor.check_size}</TableCell>
                                                    <TableCell>
                                                        <Chip label={investor.status} size="small" />
                                                    </TableCell>
                                                    <TableCell>{investor.next_step}</TableCell>
                                                    <TableCell>
                                                        <Button size="small" onClick={() => { setCurrentInvestor(investor); setInvestorDialog(true); }}>
                                                            Edit
                                                        </Button>
                                                        <Button size="small" color="error" onClick={() => handleDeleteInvestor(investor.id)}>
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Marketing Tab */}
                {tabValue === 14 && (
                    <Box>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>0</Typography>
                                        <Typography variant="body2" color="textSecondary">Website Visitors/Month</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>0</Typography>
                                        <Typography variant="body2" color="textSecondary">Leads Generated</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h3" sx={{ fontWeight: 300, color: '#2B2D42' }}>0%</Typography>
                                        <Typography variant="body2" color="textSecondary">Conversion Rate</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                        Marketing Channels & Budget
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <InputLabel>Filter by Status</InputLabel>
                                            <Select
                                                value={statusFilter}
                                                label="Filter by Status"
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <MenuItem value="All">All</MenuItem>
                                                <MenuItem value="Not Started">Not Started</MenuItem>
                                                <MenuItem value="In Progress">In Progress</MenuItem>
                                                <MenuItem value="Active">Active</MenuItem>
                                                <MenuItem value="Booked">Booked</MenuItem>
                                                <MenuItem value="Paused">Paused</MenuItem>
                                                <MenuItem value="Completed">Completed</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Button
                                            variant="contained"
                                            sx={{ bgcolor: '#C94A3C' }}
                                            onClick={() => {
                                                setCurrentChannel({channel: '', monthly_budget: 0, cpl: 0, leads_per_month: 0, status: 'Not Started'});
                                                setChannelDialog(true);
                                            }}
                                        >
                                            + Add Channel
                                        </Button>
                                    </Box>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Channel</TableCell>
                                                <TableCell>Monthly Budget</TableCell>
                                                <TableCell>CPL</TableCell>
                                                <TableCell>Leads/Month</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredChannels.map((channel) => (
                                                <TableRow key={channel.id}>
                                                    <TableCell>{channel.channel}</TableCell>
                                                    <TableCell>${parseFloat(channel.monthly_budget).toLocaleString()}</TableCell>
                                                    <TableCell>${parseFloat(channel.cpl).toLocaleString()}</TableCell>
                                                    <TableCell>{channel.leads_per_month}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={channel.status}
                                                            color={
                                                                channel.status === 'Active' || channel.status === 'Booked' ? 'success' :
                                                                channel.status === 'In Progress' ? 'primary' :
                                                                channel.status === 'Paused' ? 'warning' :
                                                                'default'
                                                            }
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button size="small" onClick={() => { setCurrentChannel(channel); setChannelDialog(true); }}>
                                                            Edit
                                                        </Button>
                                                        <Button size="small" color="error" onClick={() => handleDeleteChannel(channel.id)}>
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Product Roadmap Tab */}
                {tabValue === 13 && (
                    <Box>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                        Product Roadmap
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <InputLabel>Filter by Status</InputLabel>
                                            <Select
                                                value={roadmapStatusFilter}
                                                label="Filter by Status"
                                                onChange={(e) => setRoadmapStatusFilter(e.target.value)}
                                            >
                                                <MenuItem value="All">All</MenuItem>
                                                <MenuItem value="Planned">Planned</MenuItem>
                                                <MenuItem value="In Progress">In Progress</MenuItem>
                                                <MenuItem value="Completed">Completed</MenuItem>
                                                <MenuItem value="On Hold">On Hold</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Button
                                            variant="contained"
                                            sx={{ bgcolor: '#C94A3C' }}
                                            onClick={() => {
                                                setCurrentRoadmapItem({quarter: '', focus: '', features: '', target_customers: 0, status: 'Planned'});
                                                setRoadmapDialog(true);
                                            }}
                                        >
                                            + Add Roadmap Item
                                        </Button>
                                    </Box>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Quarter</TableCell>
                                                <TableCell>Focus</TableCell>
                                                <TableCell>Key Features</TableCell>
                                                <TableCell>Target Customers</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredRoadmapItems.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.quarter}</TableCell>
                                                    <TableCell>{item.focus}</TableCell>
                                                    <TableCell>{item.features}</TableCell>
                                                    <TableCell>{item.target_customers}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={item.status}
                                                            color={
                                                                item.status === 'Completed' ? 'success' :
                                                                item.status === 'In Progress' ? 'primary' :
                                                                item.status === 'On Hold' ? 'warning' :
                                                                'default'
                                                            }
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button size="small" onClick={() => { setCurrentRoadmapItem(item); setRoadmapDialog(true); }}>
                                                            Edit
                                                        </Button>
                                                        <Button size="small" color="error" onClick={() => handleDeleteRoadmapItem(item.id)}>
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Key Metrics Tab */}
                {tabValue === 2 && (
                    <Box>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            {[
                                { title: 'Growth Metrics', data: [['MoM Growth', actualARR > 0 ? 'Track monthly' : '0%'], ['YoY Growth', actualARR > 0 ? 'Track annually' : '0%'], ['CMGR', actualARR > 0 ? 'Track monthly' : '0%']] },
                                { title: 'Unit Economics', data: [['CAC', `$${metrics.cac.toLocaleString()}`], ['LTV', `$${metrics.ltv.toLocaleString()}`], ['Payback', `${metrics.payback} mo`]] },
                                { title: 'Efficiency Metrics', data: [['Burn Multiple', actualARR > 0 ? (metrics.monthlyBurn / (actualARR / 12)).toFixed(1) + 'x' : '∞'], ['Rule of 40', actualARR > 0 ? 'Track over time' : 'N/A'], ['Magic Number', actualARR > 0 ? 'Track quarterly' : '0']] },
                                { title: 'Customer Metrics', data: [['Active Customers', actualCustomerCount], ['Churn Rate', `${financialInputs.churnRate}%`], ['Avg Contract Value', actualCustomerCount > 0 ? `$${(actualARR / actualCustomerCount).toLocaleString(undefined, {maximumFractionDigits: 0})}` : '$0']] }
                            ].map((section, i) => (
                                <Grid item xs={12} md={3} key={i}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                                {section.title}
                                            </Typography>
                                            <Table size="small">
                                                <TableBody>
                                                    {section.data.map((row, j) => (
                                                        <TableRow key={j}>
                                                            <TableCell>{row[0]}</TableCell>
                                                            <TableCell>{row[1]}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.875rem', color: '#999' }}>
                                    SaaS Metrics Dashboard
                                </Typography>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    🎯 Target: Reach $450K ARR with 3 customers by Q4 2025
                                </Alert>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Metric</TableCell>
                                                <TableCell>Current</TableCell>
                                                <TableCell>Target (Q4 2025)</TableCell>
                                                <TableCell>Target (Q4 2026)</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {[
                                                { metric: 'ARR', current: `$${actualARR.toLocaleString()}`, q4_2025: '$450K', q4_2026: '$4.2M', progress: (actualARR / 450000 * 100).toFixed(0) },
                                                { metric: 'Customers', current: actualCustomerCount, q4_2025: '3', q4_2026: '15', progress: (actualCustomerCount / 3 * 100).toFixed(0) },
                                                { metric: 'Team Size', current: hiredTeamCount, q4_2025: '8', q4_2026: '25', progress: (hiredTeamCount / 8 * 100).toFixed(0) },
                                                { metric: 'Pipeline Value', current: `$${pipelineValue.toLocaleString()}`, q4_2025: '$2M', q4_2026: '$10M', progress: (pipelineValue / 2000000 * 100).toFixed(0) }
                                            ].map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{row.metric}</TableCell>
                                                    <TableCell>{row.current}</TableCell>
                                                    <TableCell>{row.q4_2025}</TableCell>
                                                    <TableCell>{row.q4_2026}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ width: '100%' }}>
                                                            <LinearProgress variant="determinate" value={Math.min(row.progress, 100)} sx={{ height: 8, borderRadius: 4 }} />
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Gadgets Tab */}
                {tabValue === 3 && (
                    <Box>
                        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                            Sales & Business Gadgets
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
                            Quick-access tools to help with sales, demos, customer success, and business planning.
                        </Typography>

                        <Grid container spacing={3}>
                            {gadgets.map((gadget) => (
                                <Grid item xs={12} sm={6} md={4} key={gadget.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            bgcolor: 'white',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 4
                                            }
                                        }}
                                        onClick={() => setSelectedGadget(gadget.id)}
                                    >
                                        <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 3 }}>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                                    {gadget.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {gadget.description}
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="text"
                                                sx={{ mt: 'auto', color: '#C94A3C', alignSelf: 'flex-start', p: 0 }}
                                            >
                                                Open →
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Container>

            {/* Gadget Dialogs */}

            {/* ROI Calculator Dialog */}
            <Dialog
                open={selectedGadget === 'roi-calculator'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
                            💰 Value-Based Pricing Calculator
                        </Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ bgcolor: '#fef3f2', p: 3, borderRadius: 2 }}>
                                <Typography variant="h6" sx={{ color: '#ef4444', mb: 2, fontWeight: 600 }}>
                                    Current State
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Time to dossier (months)"
                                    type="number"
                                    value={roiInputs.currentTime}
                                    onChange={(e) => setRoiInputs({...roiInputs, currentTime: parseFloat(e.target.value)})}
                                    sx={{ mb: 2, bgcolor: 'white' }}
                                />
                                <TextField
                                    fullWidth
                                    label="Cost (consultants)"
                                    type="number"
                                    value={roiInputs.currentCost}
                                    onChange={(e) => setRoiInputs({...roiInputs, currentCost: parseFloat(e.target.value)})}
                                    sx={{ mb: 2, bgcolor: 'white' }}
                                    InputProps={{ startAdornment: '$' }}
                                />
                                <TextField
                                    fullWidth
                                    label="Opportunity cost of delay"
                                    type="number"
                                    value={roiInputs.currentOpportunityCost}
                                    onChange={(e) => setRoiInputs({...roiInputs, currentOpportunityCost: parseFloat(e.target.value)})}
                                    sx={{ mb: 2, bgcolor: 'white' }}
                                    InputProps={{ startAdornment: '$' }}
                                />
                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                                    <Typography variant="body2" color="text.secondary">Total Cost</Typography>
                                    <Typography variant="h5" sx={{ color: '#ef4444', fontWeight: 700 }}>
                                        ${calculateCurrentTotal().toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box sx={{ bgcolor: '#f0fdf4', p: 3, borderRadius: 2 }}>
                                <Typography variant="h6" sx={{ color: '#10b981', mb: 2, fontWeight: 600 }}>
                                    With SagaReg
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Time to dossier (months)"
                                    type="number"
                                    value={roiInputs.sagaTime}
                                    onChange={(e) => setRoiInputs({...roiInputs, sagaTime: parseFloat(e.target.value)})}
                                    sx={{ mb: 2, bgcolor: 'white' }}
                                />
                                <TextField
                                    fullWidth
                                    label="Cost (SagaReg)"
                                    type="number"
                                    value={roiInputs.sagaCost}
                                    onChange={(e) => setRoiInputs({...roiInputs, sagaCost: parseFloat(e.target.value)})}
                                    sx={{ mb: 2, bgcolor: 'white' }}
                                    InputProps={{ startAdornment: '$' }}
                                />
                                <TextField
                                    fullWidth
                                    label="Opportunity cost of delay"
                                    type="number"
                                    value={roiInputs.sagaOpportunityCost}
                                    onChange={(e) => setRoiInputs({...roiInputs, sagaOpportunityCost: parseFloat(e.target.value)})}
                                    sx={{ mb: 2, bgcolor: 'white' }}
                                    InputProps={{ startAdornment: '$' }}
                                />
                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                                    <Typography variant="body2" color="text.secondary">Total Cost</Typography>
                                    <Typography variant="h5" sx={{ color: '#10b981', fontWeight: 700 }}>
                                        ${calculateSagaTotal().toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ bgcolor: '#f0f9ff', p: 3, borderRadius: 2 }}>
                                <Typography variant="h6" sx={{ color: '#2196f3', mb: 2, fontWeight: 600 }}>
                                    Summary
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">Savings per dossier</Typography>
                                        <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 700 }}>
                                            ${calculateSavings().toLocaleString()}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">ROI</Typography>
                                        <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 700 }}>
                                            {calculateROI()}%
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Email Templates Dialog */}
            <Dialog
                open={selectedGadget === 'email-templates'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>📧 Email Templates</Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#C94A3C' }}>Initial Outreach</Typography>
                        <Box sx={{ bgcolor: '#f5f5f7', p: 2, borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            <Typography variant="body2" sx={{ mb: 1 }}><strong>Subject:</strong> 85% faster regulatory submissions - 15 min chat?</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
{`Hi [Name],

I noticed [Company] submitted [X] generic applications last year.

We've built an AI platform that generates regulatory dossiers 85% faster than traditional methods. Coripharma just validated our approach with stellar results.

Given you're competing with [Competitor] for [Drug] market entry, speed could mean $50M+ in additional revenue.

Worth a 15-minute call this week to explore?

Best,
Ómar`}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#C94A3C' }}>Follow-up After Demo</Typography>
                        <Box sx={{ bgcolor: '#f5f5f7', p: 2, borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            <Typography variant="body2" sx={{ mb: 1 }}><strong>Subject:</strong> Re: SagaReg demo - ROI calculation attached</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
{`[Name],

Thanks for your time yesterday. As promised, I've attached:
1. ROI calculation for [Company] - $8M savings per dossier
2. Coripharma case study - 85% time reduction achieved
3. FDA AI guidance - regulatory acceptance confirmed

You mentioned [specific pain point]. Our platform specifically addresses this by [solution].

Are you available Thursday to discuss a pilot program?

Best,
Ómar`}
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#C94A3C' }}>LOI Request</Typography>
                        <Box sx={{ bgcolor: '#f5f5f7', p: 2, borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            <Typography variant="body2" sx={{ mb: 1 }}><strong>Subject:</strong> SagaReg partnership - LOI for investor discussions</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
{`[Name],

As we discussed, we're raising our seed round in October. Having [Company]'s commitment would be powerful validation.

I've attached a simple LOI template indicating interest in:
- 3-month pilot ($25K)
- Potential annual contract ($XXX K)

This is non-binding and contingent on pilot success. It would tremendously help our fundraising while securing [Company]'s position as an early adopter with preferred pricing.

Could you sign by Friday?

Best,
Ómar`}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Closing Strategies Dialog */}
            <Dialog
                open={selectedGadget === 'closing-strategies'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>🎯 Closing Strategies</Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 3, bgcolor: '#fef3f2', borderRadius: 2, height: '100%' }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#C94A3C' }}>The Assumptive Close</Typography>
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    "Based on everything we've discussed, I'll set up pilot kickoff for October 1st. Does that timeline work for your team?"
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 3, bgcolor: '#fff7ed', borderRadius: 2, height: '100%' }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#f59e0b' }}>The Urgency Close</Typography>
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    "We're limiting pilots to 10 companies to ensure quality support. Alvotech and two others have already committed. Should I reserve a spot for [Company]?"
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 3, bgcolor: '#f0fdf4', borderRadius: 2, height: '100%' }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#10b981' }}>The ROI Close</Typography>
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    "You're currently spending $2M per dossier. At $350K, our platform pays for itself with just one submission. How many dossiers do you have planned for 2026?"
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 3, bgcolor: '#f0f9ff', borderRadius: 2, height: '100%' }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2196f3' }}>The Competitive Close</Typography>
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    "[Competitor] is evaluating similar solutions. First-movers in AI-powered regulatory will have significant advantage. Ready to lead or follow?"
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Elevator Pitch Dialog */}
            <Dialog
                open={selectedGadget === 'elevator-pitch'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>🎤 Elevator Pitch Generator</Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#C94A3C' }}>30 Second Pitch</Typography>
                        <Box sx={{ bgcolor: '#f0fdf4', p: 2, borderRadius: 2, borderLeft: '4px solid #10b981' }}>
                            <Typography variant="body2">
                                "SagaReg uses AI to generate regulatory dossiers 85% faster than traditional methods. We help generic drug manufacturers submit to FDA and EMA in 2 months instead of 12, saving $8M per dossier. Coripharma validated our approach with stellar results."
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#C94A3C' }}>60 Second Pitch</Typography>
                        <Box sx={{ bgcolor: '#fff7ed', p: 2, borderRadius: 2, borderLeft: '4px solid #f59e0b' }}>
                            <Typography variant="body2">
                                "Generic drug manufacturers spend 12 months and $2M per regulatory dossier using consultants. SagaReg's AI platform automates this process, generating submission-ready dossiers in just 2 months for $350K - an 83% cost reduction. Beyond cost, speed is critical. The first three generic manufacturers to market capture 90% of profits. Our 10-month time advantage translates to tens of millions in additional revenue. Coripharma has already validated our approach with stellar results, and FDA AI guidance confirms regulatory acceptance. We're backed by strong technical talent and working with major pharma companies."
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#C94A3C' }}>90 Second Pitch (Investor Focus)</Typography>
                        <Box sx={{ bgcolor: '#f0f9ff', p: 2, borderRadius: 2, borderLeft: '4px solid #2196f3' }}>
                            <Typography variant="body2">
                                "The generic drug market is $450B annually, but regulatory submissions are painfully slow and expensive. Companies spend 12 months and $2M per dossier using consultants and manual processes. SagaReg's AI platform automates regulatory document generation, delivering submission-ready dossiers in 2 months for $350K - 83% cost savings and 10 months faster. This speed advantage is worth tens of millions because the first three to market capture 90% of profits. We have strong technical validation - Coripharma is using our platform with excellent results. FDA published AI guidance confirming regulatory acceptance. Our founders are domain experts with deep pharma backgrounds. We're raising $8M to scale from 1 to 15 customers over 18 months, targeting $4.2M ARR. The TAM is massive - 10,000 generic applications annually in US/EU alone, representing $20B in regulatory spend we can capture."
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Objection Handler Dialog */}
            <Dialog
                open={selectedGadget === 'objection-handler'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>❓ Objection Handler</Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {[
                        {
                            objection: '"Will FDA accept AI-generated submissions?"',
                            response: 'FDA published explicit guidance in January 2025 on AI in regulatory submissions. We follow their frameworks exactly. Coripharma submitted our dossiers and received positive feedback. The AI doesn\'t replace human review - it accelerates document generation while your team maintains final approval.'
                        },
                        {
                            objection: '"We already have consultants we trust"',
                            response: 'We\'re not replacing your consultants - we\'re giving them superpowers. Your team still reviews everything, but instead of spending 12 months writing from scratch, they spend 2 months reviewing and refining AI-generated drafts. Most clients use us alongside their existing consultants to dramatically accelerate timelines.'
                        },
                        {
                            objection: '"This seems risky for our first submission"',
                            response: 'That\'s exactly why we offer a 3-month pilot for $25K. Submit one non-critical dossier first, validate the quality, then scale to your priority submissions. Coripharma took the same approach and is now expanding usage. We also maintain $5M in E&O insurance for your peace of mind.'
                        },
                        {
                            objection: '"The price seems high"',
                            response: 'Compare to your current spend: $2M per dossier with consultants versus $350K with SagaReg - that\'s 83% cost savings. Plus, you get to market 10 months faster. In generics, where first-to-market captures 90% of profits, that speed advantage is worth $50M+ in additional revenue. The platform pays for itself with just one submission.'
                        },
                        {
                            objection: '"We need to think about it"',
                            response: 'Absolutely, this is a significant decision. What specific concerns should we address? I can set up calls with our FDA regulatory expert or connect you with Coripharma to discuss their experience. Also, [Competitor] is evaluating similar solutions - we have limited pilot slots to ensure quality support. Can we schedule a follow-up for Friday to address your specific concerns?'
                        }
                    ].map((item, i) => (
                        <Box key={i} sx={{ mb: 2, pb: 2, borderBottom: i < 4 ? '1px solid #eee' : 'none' }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#C94A3C', mb: 1 }}>{item.objection}</Typography>
                            <Typography variant="body2" sx={{ color: '#555' }}>{item.response}</Typography>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Demo Script Dialog */}
            <Dialog
                open={selectedGadget === 'demo-script'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>📊 Demo Script & Flow</Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {[
                            { step: '1. Opening (2 min)', points: ['Thank them for their time', 'Confirm agenda: 30-min overview, 15-min Q&A', 'Ask: "What prompted you to explore AI solutions for regulatory?"', 'Listen carefully - tailor demo to their pain points'] },
                            { step: '2. Problem Statement (3 min)', points: ['Current process: 12 months, $2M per dossier', 'Speed matters: First 3 to market = 90% profits', 'Consultant bottlenecks and quality inconsistencies', 'Ask: "Does this match your experience?"'] },
                            { step: '3. Solution Overview (5 min)', points: ['SagaReg platform architecture', 'AI-powered document generation', 'Human-in-loop quality controls', 'FDA compliance framework', 'Show: Dashboard and module selection'] },
                            { step: '4. Live Demo (15 min)', points: ['Upload source documents (show drag & drop)', 'Select dossier sections to generate', 'AI generation in real-time (2-3 min)', 'Review generated content quality', 'Export options (PDF, eCTD)', 'Highlight: Time stamp showing 2 months vs 12'] },
                            { step: '5. Results & Validation (3 min)', points: ['Coripharma case study results', 'FDA AI guidance compliance', 'Quality metrics: 95% acceptance rate', 'Show: Before/after timelines comparison'] },
                            { step: '6. Closing (2 min)', points: ['Recap: 85% faster, $8M savings per dossier', 'Next steps: 3-month pilot ($25K)', 'Ask: "What concerns would prevent you from moving forward?"', 'Schedule: Follow-up meeting or pilot kickoff'] }
                        ].map((section, i) => (
                            <Grid item xs={12} md={6} key={i}>
                                <Box sx={{ bgcolor: i % 2 === 0 ? '#fef3f2' : '#f0fdf4', p: 3, borderRadius: 2, height: '100%' }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#C94A3C' }}>{section.step}</Typography>
                                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                        {section.points.map((point, j) => (
                                            <li key={j}><Typography variant="body2" sx={{ mb: 0.5 }}>{point}</Typography></li>
                                        ))}
                                    </ul>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Competitor Comparison Dialog */}
            <Dialog
                open={selectedGadget === 'competitor-comparison'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>Competitor Comparison</Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f0fdf4' }}>SagaReg</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Traditional Consultants</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Legacy RegTech</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Time to Dossier</TableCell>
                                    <TableCell sx={{ bgcolor: '#f0fdf4' }}>2 months</TableCell>
                                    <TableCell>12 months</TableCell>
                                    <TableCell>6-8 months</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Cost per Dossier</TableCell>
                                    <TableCell sx={{ bgcolor: '#f0fdf4' }}>$350K</TableCell>
                                    <TableCell>$2M</TableCell>
                                    <TableCell>$800K</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>AI-Powered</TableCell>
                                    <TableCell sx={{ bgcolor: '#f0fdf4' }}>✅ Yes</TableCell>
                                    <TableCell>❌ No</TableCell>
                                    <TableCell>⚠️ Limited</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>FDA AI Compliant</TableCell>
                                    <TableCell sx={{ bgcolor: '#f0fdf4' }}>✅ Yes (2025 guidance)</TableCell>
                                    <TableCell>N/A</TableCell>
                                    <TableCell>⚠️ Uncertain</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Scalability</TableCell>
                                    <TableCell sx={{ bgcolor: '#f0fdf4' }}>✅ Unlimited dossiers</TableCell>
                                    <TableCell>❌ Limited by headcount</TableCell>
                                    <TableCell>✅ High</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Quality Consistency</TableCell>
                                    <TableCell sx={{ bgcolor: '#f0fdf4' }}>✅ 95% acceptance</TableCell>
                                    <TableCell>⚠️ Variable</TableCell>
                                    <TableCell>⚠️ Moderate</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Pilot Available</TableCell>
                                    <TableCell sx={{ bgcolor: '#f0fdf4' }}>✅ $25K (3 months)</TableCell>
                                    <TableCell>❌ Full commitment</TableCell>
                                    <TableCell>⚠️ Varies</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Sales Cadence Tracker Dialog */}
            <Dialog
                open={selectedGadget === 'sales-cadence'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>Sales Cadence Tracker</Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
                        Recommended follow-up sequence for cold outreach:
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Day</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Channel</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Purpose</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Day 0</TableCell>
                                    <TableCell>Initial outreach</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Introduce value prop</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Day 2</TableCell>
                                    <TableCell>LinkedIn connection</TableCell>
                                    <TableCell>LinkedIn</TableCell>
                                    <TableCell>Build rapport</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Day 4</TableCell>
                                    <TableCell>Follow-up email</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Share case study</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Day 7</TableCell>
                                    <TableCell>Value-add content</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Send FDA AI guidance</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Day 10</TableCell>
                                    <TableCell>Phone call</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell>Direct conversation</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Day 14</TableCell>
                                    <TableCell>Break-up email</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>"Should I close your file?"</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Day 30</TableCell>
                                    <TableCell>Re-engagement</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>New trigger event</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Alert severity="info" sx={{ mt: 3 }}>
                        💡 Pro Tip: Personalize each touchpoint with recent company news, competitor actions, or industry trends.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Customer Success Playbook Dialog */}
            <Dialog
                open={selectedGadget === 'customer-success'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>Customer Success Playbook</Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#C94A3C' }}>
                        Pilot Phase (Months 1-3)
                    </Typography>
                    <TableContainer sx={{ mb: 4 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Week</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Activities</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Week 1</TableCell>
                                    <TableCell>Kickoff call, platform training, access setup</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Week 2-4</TableCell>
                                    <TableCell>First dossier generation, daily check-ins</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Week 5-8</TableCell>
                                    <TableCell>Quality review, refinement cycles, weekly syncs</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Week 9-12</TableCell>
                                    <TableCell>Submission prep, pilot review, expansion planning</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#C94A3C' }}>
                        Success Milestones
                    </Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                        <li><Typography variant="body2" sx={{ mb: 1 }}><strong>Platform access configured</strong> - Day 1</Typography></li>
                        <li><Typography variant="body2" sx={{ mb: 1 }}><strong>First document uploaded</strong> - Week 1</Typography></li>
                        <li><Typography variant="body2" sx={{ mb: 1 }}><strong>First section generated</strong> - Week 2</Typography></li>
                        <li><Typography variant="body2" sx={{ mb: 1 }}><strong>Complete dossier draft</strong> - Week 4</Typography></li>
                        <li><Typography variant="body2" sx={{ mb: 1 }}><strong>Quality acceptance &gt;90%</strong> - Week 8</Typography></li>
                        <li><Typography variant="body2" sx={{ mb: 1 }}><strong>Submission ready</strong> - Week 12</Typography></li>
                        <li><Typography variant="body2" sx={{ mb: 1 }}><strong>Contract expansion</strong> - Month 4</Typography></li>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Quarterly Goal Calculator Dialog */}
            <Dialog
                open={selectedGadget === 'quarterly-goals'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>Quarterly Goal Calculator</Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ bgcolor: '#f0fdf4', p: 3, borderRadius: 2, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#C94A3C' }}>
                            Annual Target: $4.2M ARR (Q4 2026)
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Based on 15 customers × $280K ACV
                        </Typography>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Quarter</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>New Customers</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>ARR Target</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Cumulative</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Q4 2025</TableCell>
                                    <TableCell>3</TableCell>
                                    <TableCell>$450K</TableCell>
                                    <TableCell>$450K</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Q1 2026</TableCell>
                                    <TableCell>2</TableCell>
                                    <TableCell>$560K</TableCell>
                                    <TableCell>$1.01M</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Q2 2026</TableCell>
                                    <TableCell>3</TableCell>
                                    <TableCell>$840K</TableCell>
                                    <TableCell>$1.85M</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Q3 2026</TableCell>
                                    <TableCell>4</TableCell>
                                    <TableCell>$1.12M</TableCell>
                                    <TableCell>$2.97M</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Q4 2026</TableCell>
                                    <TableCell>3</TableCell>
                                    <TableCell>$840K</TableCell>
                                    <TableCell>$4.2M ✓</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Alert severity="success" sx={{ mt: 3 }}>
                        🎯 Pipeline coverage needed: 3x ARR target = $12.6M in qualified opportunities
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ICP Scorecard Dialog */}
            <Dialog
                open={selectedGadget === 'icp-scorecard'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { maxHeight: '90vh' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>ICP Scorecard</Box>
                        <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
                        Score each prospect 0-2 per criterion. 14+ = Ideal, 10-13 = Good, &lt;10 = Deprioritize
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Criterion</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>0 Points</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>1 Point</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>2 Points</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Company Type</TableCell>
                                    <TableCell>Service provider</TableCell>
                                    <TableCell>Small biopharma</TableCell>
                                    <TableCell>Mid-large biopharma</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Annual Submissions</TableCell>
                                    <TableCell>&lt;2 per year</TableCell>
                                    <TableCell>2-4 per year</TableCell>
                                    <TableCell>5+ per year</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Current Process</TableCell>
                                    <TableCell>In-house only</TableCell>
                                    <TableCell>Mix of in-house/consultants</TableCell>
                                    <TableCell>Heavy consultant reliance</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Tech Adoption</TableCell>
                                    <TableCell>Manual/paper-based</TableCell>
                                    <TableCell>Basic software tools</TableCell>
                                    <TableCell>Cloud-native, AI-curious</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Pain Level</TableCell>
                                    <TableCell>Satisfied with status quo</TableCell>
                                    <TableCell>Aware of inefficiencies</TableCell>
                                    <TableCell>Urgent deadline pressure</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Budget Authority</TableCell>
                                    <TableCell>No budget visibility</TableCell>
                                    <TableCell>Influencer</TableCell>
                                    <TableCell>Decision-maker</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Timeline</TableCell>
                                    <TableCell>Exploring (&gt;6 months)</TableCell>
                                    <TableCell>Active search (3-6 months)</TableCell>
                                    <TableCell>Urgent need (&lt;3 months)</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Geographic Focus</TableCell>
                                    <TableCell>Non-US markets only</TableCell>
                                    <TableCell>Some US presence</TableCell>
                                    <TableCell>US/EU primary markets</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ bgcolor: '#fef3f2', p: 3, borderRadius: 2, mt: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#C94A3C' }}>
                            Qualification Questions to Ask:
                        </Typography>
                        <Box component="ul" sx={{ pl: 3, m: 0 }}>
                            <li><Typography variant="body2" sx={{ mb: 1 }}>How many regulatory submissions do you target per year?</Typography></li>
                            <li><Typography variant="body2" sx={{ mb: 1 }}>What's your current process? In-house team, consultants, or both?</Typography></li>
                            <li><Typography variant="body2" sx={{ mb: 1 }}>What's the biggest bottleneck in your regulatory workflow today?</Typography></li>
                            <li><Typography variant="body2" sx={{ mb: 1 }}>What's driving your interest in AI solutions right now?</Typography></li>
                            <li><Typography variant="body2" sx={{ mb: 1 }}>Who would be involved in evaluating and approving a new solution?</Typography></li>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Social Media Manager Dialog */}
            <Dialog
                open={selectedGadget === 'social-media-manager'}
                onClose={() => setSelectedGadget(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f0f9ff' }}>
                    <Box sx={{ fontWeight: 600, fontSize: '1.5rem' }}>📱 Social Media Manager</Box>
                    <Button onClick={() => setSelectedGadget(null)}>✕</Button>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Tabs value={socialMediaTab} onChange={(e, v) => setSocialMediaTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                        <Tab label="Create Post" />
                        <Tab label="Scheduled Posts" />
                        <Tab label="API Settings" />
                    </Tabs>

                    {/* Create Post Tab */}
                    {socialMediaTab === 0 && <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Create New Post</Typography>

                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            label="Post Content"
                            placeholder="Write your social media post here..."
                            value={socialPost.content}
                            onChange={(e) => setSocialPost({...socialPost, content: e.target.value})}
                            sx={{ mb: 3 }}
                        />

                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Select Platforms:</Typography>
                        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: socialPost.platforms.linkedin ? '#0077b5' : '#f5f5f5', p: 2, borderRadius: 2, cursor: 'pointer', minWidth: '150px' }}
                                onClick={() => setSocialPost({...socialPost, platforms: {...socialPost.platforms, linkedin: !socialPost.platforms.linkedin}})}>
                                <Typography sx={{ color: socialPost.platforms.linkedin ? 'white' : '#666', fontWeight: 600 }}>
                                    LinkedIn {socialPost.platforms.linkedin ? '✓' : ''}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: socialPost.platforms.twitter ? '#1DA1F2' : '#f5f5f5', p: 2, borderRadius: 2, cursor: 'pointer', minWidth: '150px' }}
                                onClick={() => setSocialPost({...socialPost, platforms: {...socialPost.platforms, twitter: !socialPost.platforms.twitter}})}>
                                <Typography sx={{ color: socialPost.platforms.twitter ? 'white' : '#666', fontWeight: 600 }}>
                                    Twitter {socialPost.platforms.twitter ? '✓' : ''}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: socialPost.platforms.instagram ? '#E4405F' : '#f5f5f5', p: 2, borderRadius: 2, cursor: 'pointer', minWidth: '150px' }}
                                onClick={() => setSocialPost({...socialPost, platforms: {...socialPost.platforms, instagram: !socialPost.platforms.instagram}})}>
                                <Typography sx={{ color: socialPost.platforms.instagram ? 'white' : '#666', fontWeight: 600 }}>
                                    Instagram {socialPost.platforms.instagram ? '✓' : ''}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: socialPost.platforms.facebook ? '#1877F2' : '#f5f5f5', p: 2, borderRadius: 2, cursor: 'pointer', minWidth: '150px' }}
                                onClick={() => setSocialPost({...socialPost, platforms: {...socialPost.platforms, facebook: !socialPost.platforms.facebook}})}>
                                <Typography sx={{ color: socialPost.platforms.facebook ? 'white' : '#666', fontWeight: 600 }}>
                                    Facebook {socialPost.platforms.facebook ? '✓' : ''}
                                </Typography>
                            </Box>
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Schedule Date"
                                    value={socialPost.scheduleDate}
                                    onChange={(e) => setSocialPost({...socialPost, scheduleDate: e.target.value})}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="time"
                                    label="Schedule Time"
                                    value={socialPost.scheduleTime}
                                    onChange={(e) => setSocialPost({...socialPost, scheduleTime: e.target.value})}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            fullWidth
                            label="Image URL (optional)"
                            placeholder="https://example.com/image.jpg"
                            value={socialPost.imageUrl}
                            onChange={(e) => setSocialPost({...socialPost, imageUrl: e.target.value})}
                            sx={{ mb: 3 }}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                                onClick={() => {
                                    if (socialPost.content && Object.values(socialPost.platforms).some(p => p)) {
                                        setSocialPosts([...socialPosts, {...socialPost, id: Date.now(), status: 'scheduled'}]);
                                        setSocialPost({
                                            content: '',
                                            platforms: { linkedin: false, twitter: false, instagram: false, facebook: false },
                                            scheduleDate: '',
                                            scheduleTime: '',
                                            imageUrl: ''
                                        });
                                        setAlert({ open: true, message: 'Post scheduled successfully!', severity: 'success' });
                                    } else {
                                        setAlert({ open: true, message: 'Please add content and select at least one platform', severity: 'error' });
                                    }
                                }}
                            >
                                Schedule Post
                            </Button>
                            <Button
                                variant="outlined"
                                sx={{ borderColor: '#C94A3C', color: '#C94A3C' }}
                                onClick={() => {
                                    if (socialPost.content && Object.values(socialPost.platforms).some(p => p)) {
                                        setAlert({ open: true, message: 'Post published immediately! (API integration required)', severity: 'info' });
                                    } else {
                                        setAlert({ open: true, message: 'Please add content and select at least one platform', severity: 'error' });
                                    }
                                }}
                            >
                                Post Now
                            </Button>
                        </Box>
                    </Box>}

                    {/* Scheduled Posts Tab */}
                    {socialMediaTab === 1 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Scheduled Posts ({socialPosts.length})</Typography>
                            {socialPosts.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 8, color: '#666' }}>
                                    <Typography variant="body1">No scheduled posts yet. Create your first post in the "Create Post" tab.</Typography>
                                </Box>
                            ) : (
                                socialPosts.map((post) => (
                                    <Box key={post.id} sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 2, mb: 2, border: '1px solid #e5e7eb' }}>
                                        <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                                            {post.scheduleDate} {post.scheduleTime ? `at ${post.scheduleTime}` : ''}
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 2 }}>{post.content}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {post.platforms.linkedin && <Box sx={{ bgcolor: '#0077b5', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem' }}>LinkedIn</Box>}
                                            {post.platforms.twitter && <Box sx={{ bgcolor: '#1DA1F2', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem' }}>Twitter</Box>}
                                            {post.platforms.instagram && <Box sx={{ bgcolor: '#E4405F', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem' }}>Instagram</Box>}
                                            {post.platforms.facebook && <Box sx={{ bgcolor: '#1877F2', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem' }}>Facebook</Box>}
                                        </Box>
                                        <Button
                                            size="small"
                                            sx={{ mt: 2, color: '#ef4444' }}
                                            onClick={() => setSocialPosts(socialPosts.filter(p => p.id !== post.id))}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                ))
                            )}
                        </Box>
                    )}

                    {/* API Settings Tab */}
                    {socialMediaTab === 2 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#C94A3C' }}>
                                🔑 API Integration Setup
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 3 }}>
                                To enable posting to social media platforms, you'll need to configure API credentials:
                            </Typography>

                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    label="LinkedIn API Key"
                                    value={apiKeys.linkedin}
                                    onChange={(e) => setApiKeys({...apiKeys, linkedin: e.target.value})}
                                    placeholder="Enter your LinkedIn API key"
                                    sx={{ mb: 2 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Create an app at <a href="https://www.linkedin.com/developers/" target="_blank" rel="noopener">LinkedIn Developers</a>
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Twitter API Key"
                                    value={apiKeys.twitter}
                                    onChange={(e) => setApiKeys({...apiKeys, twitter: e.target.value})}
                                    placeholder="Enter your Twitter API key"
                                    sx={{ mb: 2 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Get API access at <a href="https://developer.twitter.com/" target="_blank" rel="noopener">Twitter Developer Portal</a>
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Instagram API Key"
                                    value={apiKeys.instagram}
                                    onChange={(e) => setApiKeys({...apiKeys, instagram: e.target.value})}
                                    placeholder="Enter your Instagram API key"
                                    sx={{ mb: 2 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Use Facebook Graph API at <a href="https://developers.facebook.com/" target="_blank" rel="noopener">Meta for Developers</a>
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Facebook API Key"
                                    value={apiKeys.facebook}
                                    onChange={(e) => setApiKeys({...apiKeys, facebook: e.target.value})}
                                    placeholder="Enter your Facebook API key"
                                    sx={{ mb: 2 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Create an app at <a href="https://developers.facebook.com/" target="_blank" rel="noopener">Meta for Developers</a>
                                </Typography>
                            </Box>

                            <Box sx={{ bgcolor: '#fff7ed', p: 3, borderRadius: 2, mt: 4 }}>
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    ⚠️ Store your API keys securely in environment variables on your backend server. Never commit API keys to version control.
                                </Typography>
                            </Box>

                            <Button
                                variant="contained"
                                sx={{ mt: 3, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                                onClick={() => setAlert({ open: true, message: 'API settings saved! (Backend integration required)', severity: 'success' })}
                            >
                                Save API Settings
                            </Button>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGadget(null)} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Deal Dialog */}
        <Dialog open={dealDialog} onClose={() => setDealDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{currentDeal?.id ? 'Edit Deal' : 'New Deal'}</DialogTitle>
            <DialogContent>
                <TextField fullWidth label="Company" value={currentDeal?.company || ''} onChange={(e) => setCurrentDeal({...currentDeal, company: e.target.value})} sx={{ mt: 2, mb: 2 }} />
                <TextField fullWidth label="Contact" value={currentDeal?.contact || ''} onChange={(e) => setCurrentDeal({...currentDeal, contact: e.target.value})} sx={{ mb: 2 }} />
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Stage</InputLabel>
                    <Select value={currentDeal?.stage || 'Discovery'} onChange={(e) => setCurrentDeal({...currentDeal, stage: e.target.value})}>
                        <MenuItem value="Discovery">Discovery</MenuItem>
                        <MenuItem value="Demo">Demo</MenuItem>
                        <MenuItem value="Pilot">Pilot</MenuItem>
                        <MenuItem value="Negotiation">Negotiation</MenuItem>
                        <MenuItem value="Closed">Closed</MenuItem>
                    </Select>
                </FormControl>
                <TextField fullWidth label="Value ($)" value={formatNumber(currentDeal?.value || 0)} onChange={(e) => setCurrentDeal({...currentDeal, value: parseFormattedNumber(e.target.value)})} sx={{ mb: 2 }} />
                <TextField fullWidth type="number" label="Probability (%)" value={currentDeal?.probability || 50} onChange={(e) => setCurrentDeal({...currentDeal, probability: e.target.value})} sx={{ mb: 2 }} />
                <TextField fullWidth label="Next Step" value={currentDeal?.next_step || ''} onChange={(e) => setCurrentDeal({...currentDeal, next_step: e.target.value})} sx={{ mb: 2 }} />
                <TextField fullWidth multiline rows={3} label="Notes" value={currentDeal?.notes || ''} onChange={(e) => setCurrentDeal({...currentDeal, notes: e.target.value})} />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDealDialog(false)}>Cancel</Button>
                <Button onClick={handleSaveDeal} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Save</Button>
            </DialogActions>
        </Dialog>

        {/* Team Dialog */}
        <Dialog open={teamDialog} onClose={() => setTeamDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{currentTeamMember?.id ? 'Edit Team Member' : 'New Team Member'}</DialogTitle>
            <DialogContent>
                <TextField fullWidth label="Name" value={currentTeamMember?.name || ''} onChange={(e) => setCurrentTeamMember({...currentTeamMember, name: e.target.value})} sx={{ mt: 2, mb: 2 }} />
                <TextField fullWidth label="Role" value={currentTeamMember?.role || ''} onChange={(e) => setCurrentTeamMember({...currentTeamMember, role: e.target.value})} sx={{ mb: 2 }} />
                <TextField fullWidth label="Department" value={currentTeamMember?.department || ''} onChange={(e) => setCurrentTeamMember({...currentTeamMember, department: e.target.value})} sx={{ mb: 2 }} />
                <TextField fullWidth label="Salary ($)" value={formatNumber(currentTeamMember?.salary || 0)} onChange={(e) => setCurrentTeamMember({...currentTeamMember, salary: parseFormattedNumber(e.target.value)})} sx={{ mb: 2 }} />
                <TextField fullWidth type="number" label="Equity (%)" value={currentTeamMember?.equity || 0} onChange={(e) => setCurrentTeamMember({...currentTeamMember, equity: e.target.value})} sx={{ mb: 2 }} />
                <TextField fullWidth type="date" label="Start Date" value={currentTeamMember?.start_date || ''} onChange={(e) => setCurrentTeamMember({...currentTeamMember, start_date: e.target.value})} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
                <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select value={currentTeamMember?.status || 'hired'} onChange={(e) => setCurrentTeamMember({...currentTeamMember, status: e.target.value})}>
                        <MenuItem value="hired">Hired</MenuItem>
                        <MenuItem value="recruiting">Recruiting</MenuItem>
                        <MenuItem value="interviewing">Interviewing</MenuItem>
                        <MenuItem value="offer">Offer Made</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setTeamDialog(false)}>Cancel</Button>
                <Button onClick={handleSaveTeamMember} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Save</Button>
            </DialogActions>
        </Dialog>

        {/* Marketing Channel Dialog */}
        <Dialog open={channelDialog} onClose={() => setChannelDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{currentChannel?.id ? 'Edit Marketing Channel' : 'New Marketing Channel'}</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Channel Name"
                    value={currentChannel?.channel || ''}
                    onChange={(e) => setCurrentChannel({...currentChannel, channel: e.target.value})}
                    sx={{ mt: 2, mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Monthly Budget ($)"
                    value={formatNumber(currentChannel?.monthly_budget || 0)}
                    onChange={(e) => setCurrentChannel({...currentChannel, monthly_budget: parseFormattedNumber(e.target.value)})}
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Cost Per Lead ($)"
                    value={formatNumber(currentChannel?.cpl || 0)}
                    onChange={(e) => setCurrentChannel({...currentChannel, cpl: parseFormattedNumber(e.target.value)})}
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    type="number"
                    label="Leads Per Month"
                    value={currentChannel?.leads_per_month || 0}
                    onChange={(e) => setCurrentChannel({...currentChannel, leads_per_month: parseInt(e.target.value)})}
                    sx={{ mb: 2 }}
                />
                <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={currentChannel?.status || 'Not Started'}
                        label="Status"
                        onChange={(e) => setCurrentChannel({...currentChannel, status: e.target.value})}
                    >
                        <MenuItem value="Not Started">Not Started</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Booked">Booked</MenuItem>
                        <MenuItem value="Paused">Paused</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setChannelDialog(false)}>Cancel</Button>
                <Button onClick={handleSaveChannel} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Save</Button>
            </DialogActions>
        </Dialog>

        {/* Roadmap Dialog */}
        <Dialog open={roadmapDialog} onClose={() => setRoadmapDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{currentRoadmapItem?.id ? 'Edit Roadmap Item' : 'New Roadmap Item'}</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Quarter (e.g., Q1 2026)"
                    value={currentRoadmapItem?.quarter || ''}
                    onChange={(e) => setCurrentRoadmapItem({...currentRoadmapItem, quarter: e.target.value})}
                    sx={{ mt: 2, mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Focus Area"
                    value={currentRoadmapItem?.focus || ''}
                    onChange={(e) => setCurrentRoadmapItem({...currentRoadmapItem, focus: e.target.value})}
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                        multiline
                        rows={3}
                        label="Key Features"
                        value={currentRoadmapItem?.features || ''}
                        onChange={(e) => setCurrentRoadmapItem({...currentRoadmapItem, features: e.target.value})}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        type="number"
                        label="Target Customers"
                        value={currentRoadmapItem?.target_customers || 0}
                        onChange={(e) => setCurrentRoadmapItem({...currentRoadmapItem, target_customers: parseInt(e.target.value)})}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={currentRoadmapItem?.status || 'Planned'}
                            label="Status"
                            onChange={(e) => setCurrentRoadmapItem({...currentRoadmapItem, status: e.target.value})}
                        >
                            <MenuItem value="Planned">Planned</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="On Hold">On Hold</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRoadmapDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveRoadmapItem} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* Hire Dialog */}
            <Dialog open={hireDialog} onClose={() => setHireDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{currentHire?.id ? 'Edit Hire' : 'New Hire'}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Role"
                        value={currentHire?.role || ''}
                        onChange={(e) => setCurrentHire({...currentHire, role: e.target.value})}
                        sx={{ mt: 2, mb: 2 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Priority</InputLabel>
                        <Select
                            value={currentHire?.priority || 'High'}
                            label="Priority"
                            onChange={(e) => setCurrentHire({...currentHire, priority: e.target.value})}
                        >
                            <MenuItem value="Critical">Critical</MenuItem>
                            <MenuItem value="High">High</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="Low">Low</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Start Date"
                        value={currentHire?.start_date || ''}
                        onChange={(e) => setCurrentHire({...currentHire, start_date: e.target.value})}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Salary Range"
                        value={currentHire?.salary_range || ''}
                        onChange={(e) => setCurrentHire({...currentHire, salary_range: e.target.value})}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Equity"
                        value={currentHire?.equity || ''}
                        onChange={(e) => setCurrentHire({...currentHire, equity: e.target.value})}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={currentHire?.status || 'Not Started'}
                            label="Status"
                            onChange={(e) => setCurrentHire({...currentHire, status: e.target.value})}
                        >
                            <MenuItem value="Not Started">Not Started</MenuItem>
                            <MenuItem value="Recruiting">Recruiting</MenuItem>
                            <MenuItem value="Interviewing">Interviewing</MenuItem>
                            <MenuItem value="Offer Made">Offer Made</MenuItem>
                            <MenuItem value="Hired">Hired</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHireDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveHire} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* Investor Dialog */}
            <Dialog open={investorDialog} onClose={() => setInvestorDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{currentInvestor?.id ? 'Edit Investor' : 'New Investor'}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Investor Name"
                        value={currentInvestor?.name || ''}
                        onChange={(e) => setCurrentInvestor({...currentInvestor, name: e.target.value})}
                        sx={{ mt: 2, mb: 2 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={currentInvestor?.type || 'Follow'}
                            label="Type"
                            onChange={(e) => setCurrentInvestor({...currentInvestor, type: e.target.value})}
                        >
                            <MenuItem value="Lead">Lead</MenuItem>
                            <MenuItem value="Follow">Follow</MenuItem>
                            <MenuItem value="Angel">Angel</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Check Size ($)"
                        value={formatNumber(currentInvestor?.check_size || '')}
                        onChange={(e) => setCurrentInvestor({...currentInvestor, check_size: parseFormattedNumber(e.target.value)})}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={currentInvestor?.status || 'Not Contacted'}
                            label="Status"
                            onChange={(e) => setCurrentInvestor({...currentInvestor, status: e.target.value})}
                        >
                            <MenuItem value="Not Contacted">Not Contacted</MenuItem>
                            <MenuItem value="Initial Contact">Initial Contact</MenuItem>
                            <MenuItem value="First Meeting">First Meeting</MenuItem>
                            <MenuItem value="Partner Meeting">Partner Meeting</MenuItem>
                            <MenuItem value="Due Diligence">Due Diligence</MenuItem>
                            <MenuItem value="Term Sheet">Term Sheet</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Contact"
                        value={currentInvestor?.contact || ''}
                        onChange={(e) => setCurrentInvestor({...currentInvestor, contact: e.target.value})}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Next Step"
                        value={currentInvestor?.next_step || ''}
                        onChange={(e) => setCurrentInvestor({...currentInvestor, next_step: e.target.value})}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes"
                        value={currentInvestor?.notes || ''}
                        onChange={(e) => setCurrentInvestor({...currentInvestor, notes: e.target.value})}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInvestorDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveInvestor} variant="contained" sx={{ bgcolor: '#C94A3C' }}>Save</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={alert.open} autoHideDuration={6000} onClose={() => setAlert({ ...alert, open: false })}>
                <Alert severity={alert.severity} sx={{ width: '100%' }}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
        </ThemeProvider>
    );
}

export default App;