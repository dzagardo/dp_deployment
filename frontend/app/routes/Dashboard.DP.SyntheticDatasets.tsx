import React, { useState, useEffect } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
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
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Slider } from '@mui/material';

interface Dataset {
    id: string;
    name: string;
    privacy_budget: number;
}

function SyntheticDatasetView() {
    // State to hold datasets and selected dataset details
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    // Fetch datasets when the component mounts
    useEffect(() => {
        // Define async function inside useEffect
        const fetchDatasets = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/datasets', {
                    method: 'GET',
                    credentials: 'include',  // Include credentials in the request
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setDatasets(data);  // Assuming the response is the array of datasets
            } catch (error) {
                console.error("Failed to fetch datasets:", error);
            }
        };

        // Call the fetch function
        fetchDatasets();
    }, []);

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5000/upload_csv', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log('File uploaded successfully');
            setUploadedFile(file);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
                Manage Datasets
            </Typography>
            <Grid container spacing={3}>
                {/* File Uploader */}
                <Grid item xs={12} md={8} lg={12}>
                    <Paper
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            height: 160,
                        }}
                    >
                        {/* <FileUploader onFileUploaded={handleFileUpload} isUploading={isUploading} /> */}
                    </Paper>
                </Grid>

                {/* Datasets Table */}
                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell align="right">Name</TableCell>
                                    <TableCell align="right">Privacy Budget</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {datasets.map((dataset) => (
                                    <TableRow key={dataset.id}>
                                        <TableCell component="th" scope="row">
                                            {dataset.id}
                                        </TableCell>
                                        <TableCell align="right">{dataset.name}</TableCell>
                                        <TableCell align="right">{dataset.privacy_budget}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Container>
    );
}

export default SyntheticDatasetView;
