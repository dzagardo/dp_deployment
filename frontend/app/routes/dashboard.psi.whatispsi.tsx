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

function WhatIsPSI() {
    return (
        <Box component="main" sx={{ /* styles */ }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Private Set Intersection
                </Typography>
                <Box sx={{ marginBottom: 2 }}>
                    <Paper sx={{ padding: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            What is Private Set Intersection?
                        </Typography>
                        <Typography paragraph>
                            PSI is a cryptographic technique that allows two parties to compute the intersection of their sets without revealing anything else about the sets to each other. In the context of PPML, PSI can be useful when two organizations wish to collaborate on machine learning projects without sharing their actual data. For example, two medical institutions might want to train a model on patient data to identify common patterns in diseases. Using PSI, they can find common patients (or common data attributes) without exposing their entire datasets to each other. This ensures that sensitive or private data remains confidential.
                        </Typography>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
}

export default WhatIsPSI;