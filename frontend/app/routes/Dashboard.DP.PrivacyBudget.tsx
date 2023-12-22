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
import FileUploader from './FileUploader';
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

function PrivacyBudgetView() {
    // State to hold datasets and selected dataset details
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [privacyBudget, setPrivacyBudget] = useState(0);
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

    // Function to handle selecting a dataset
    const handleSelectDataset = (datasetId: string) => {
        const dataset = datasets.find(ds => ds.id === datasetId);
        if (dataset) {
            setSelectedDataset(dataset);
            setPrivacyBudget(dataset.privacy_budget); // Set initial value for slider/input
        }
    };

    // Function to handle privacy budget change
    const handlePrivacyBudgetChange = (event: Event, newValue: number | number[]) => {
        // If the slider uses a range, newValue will be an array. Handle accordingly.
        const newBudget = Array.isArray(newValue) ? newValue[0] : newValue;
        setPrivacyBudget(newBudget);
    };


    // Function to save the updated privacy budget
    const savePrivacyBudget = async () => {
        if (!selectedDataset) {
            console.error("No dataset selected");
            return;
        }
        try {
            const response = await fetch(`/api/datasets/${selectedDataset.id}/updatePrivacyBudget`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ privacy_budget: privacyBudget }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log("Privacy budget updated successfully!");
            // Optionally, refetch datasets to get the updated values
        } catch (error) {
            console.error("Failed to save new privacy budget:", error);
        }
    };

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
                Manage Privacy Budgets
            </Typography>
            <TableContainer component={Paper}>
                <Table aria-label="datasets table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Privacy Budget</TableCell>
                            <TableCell align="right">Select</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {datasets.map((dataset) => (
                            <TableRow
                                key={dataset.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {dataset.name}
                                </TableCell>
                                <TableCell align="right">{dataset.privacy_budget}</TableCell>
                                <TableCell align="right">
                                    <Button variant="outlined" onClick={() => handleSelectDataset(dataset.id)}>
                                        Select
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {selectedDataset && (
                <div>
                    <Typography variant="h6" gutterBottom>
                        Set Privacy Budget for {selectedDataset.name}
                    </Typography>
                    <Slider
                        value={privacyBudget}
                        onChange={handlePrivacyBudgetChange}
                        aria-labelledby="privacy-budget-slider"
                        step={0.01}
                        min={0}
                        max={1}
                        valueLabelDisplay="auto"
                    />
                    <Button variant="contained" color="primary" onClick={savePrivacyBudget}>
                        Save
                    </Button>
                </div>
            )}
        </Container>
    );
}

export default PrivacyBudgetView;
