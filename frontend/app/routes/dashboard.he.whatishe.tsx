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

function WhatIsHE() {
    return (
        <Box component="main" sx={{ /* styles */ }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Homomorphic Encryption
                </Typography>
                <Box sx={{ marginBottom: 2 }}>
                    <Paper sx={{ padding: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            What is Homomorphic Encryption?
                        </Typography>
                        <Typography paragraph>
                            Homomorphic Encryption allows computations to be performed directly on encrypted data. The data is never decrypted during the process, ensuring its privacy. This method is particularly useful for sensitive data like medical or financial records.
                        </Typography>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
}

export default WhatIsHE;