import React, { useEffect, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
// import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { MainListItems, DataSetListItems } from './listItems';
import FileUploader from './fileuploader';
import DataGridDisplay from './DataGridDisplay';
import Papa from 'papaparse';
import DatasetStatistics from './DatasetStatistics';
import AlgorithmSelector from './AlgorithmSelector';
import { Outlet, useLocation } from '@remix-run/react';

function DashboardHE() {
    const location = useLocation();
    const [tabValue, setTabValue] = useState(0);

    // Define the routes corresponding to each tab
    const tabRoutes = [
        '/dashboard/he/test',
        // ... add more routes as needed
    ];

    useEffect(() => {
        // Set the active tab based on the current route
        const currentTabIndex = tabRoutes.findIndex(route => location.pathname.startsWith(route));

        if (currentTabIndex !== -1 && currentTabIndex !== tabValue) {
            setTabValue(currentTabIndex);
        } else if (currentTabIndex === -1 && tabValue !== -1) {
            setTabValue(-1); // Set to -1 to indicate no tab is selected
        }
        // Ensuring that tabValue is not in the dependency array to avoid a loop
    }, [location, tabRoutes]);
    return (
        <Box component="main" sx={{ /* styles */ }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {/* Render the content of the current route */}
                <Outlet />
            </Container>
        </Box>
    );
}

export default DashboardHE;