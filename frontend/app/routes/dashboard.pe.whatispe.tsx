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

function WhatIsPE() {
    return (
        <Box component="main" sx={{ /* styles */ }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Generating Private Tabular Data
                </Typography>
                <Box sx={{ marginBottom: 2 }}>
                    <Paper sx={{ padding: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            What is Synthetic Tabular Data?
                        </Typography>
                        <Typography paragraph>
                            Synthetic tabular data is artificially generated data that mimics the statistical properties of real-world data while preserving privacy. It's used to enable data analysis and machine learning without exposing sensitive information. Two common methods for generating private synthetic datasets are the Laplacian and Gaussian mechanisms, which are foundational in the realm of differential privacy.
                        </Typography>
                        <Typography variant="h6" gutterBottom>
                            Laplacian and Gaussian Mechanisms
                        </Typography>
                        <Typography paragraph>
                            The Laplacian mechanism adds Laplacian noise to the true query results, calibrated to the sensitivity of the query and the desired level of ε (epsilon), representing the privacy budget. On the other hand, the Gaussian mechanism adds Gaussian noise and is suitable when the privacy budget is defined as (ε, δ), where δ is a small probability of additional privacy loss. Both mechanisms aim to obfuscate the data enough to prevent the re-identification of individuals while maintaining the utility of the data for analysis. When applied to tabular data in CSV files, these mechanisms help generate datasets that are statistically similar to the original but with privacy guarantees, allowing for safer data sharing and analysis.
                        </Typography>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
}

export default WhatIsPE;