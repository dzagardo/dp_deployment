import React, { useState } from 'react';
// import { createTheme, ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import FileUploader from './fileuploader';
import DataGridDisplay from './DataGridDisplay';
import Papa from 'papaparse';
import DatasetStatistics from './DatasetStatistics';
import AlgorithmSelectorRemix from './AlgorithmSelectorTabular';
import { Box } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { requireUserId } from '~/session.server';
import { getDatasetListItems } from '~/models/dataset.server';
import { ActionFunction } from '@remix-run/node';
import { createDataset } from '~/models/dataset.server';
import { useLoaderData } from '@remix-run/react';
import CircularProgress from '@mui/material/CircularProgress';

export const action: ActionFunction = async ({ request }) => {
    console.log('Action function called');
    const userId = await requireUserId(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const privacyBudget = formData.get('privacyBudget') || '1.0';

    if (!file || file.name === '') {
        console.error('Validation failed: File and filename are required.');
        return json({ error: 'File and filename are required.' }, { status: 400 });
    }

    // Prepare the form data to send to Flask backend
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('privacyBudget', privacyBudget);

    try {
        // Send the file to the Flask backend for upload
        const uploadResponse = await fetch('http://localhost:5000/upload_csv', {
            method: 'POST',
            body: uploadFormData,
        });

        if (!uploadResponse.ok) {
            // Handle server errors
            console.error('Server error during file upload:', uploadResponse.statusText);
            const errorText = await uploadResponse.text();
            return json({ error: 'Failed to upload file.' }, { status: uploadResponse.status });
        }

        // Extract the actual saved file name from Flask backend response
        const uploadData = await uploadResponse.json();
        const actualSavedFileName = uploadData.fileName;
        const filePath = uploadData.filePath;

        // Now create the dataset entry with the actual saved file name
        const dataset = await createDataset({
            fileName: actualSavedFileName,
            fileType: file.type || 'text/csv',
            filePath,
            privacyBudget: Number(privacyBudget),
            userId,
        });

        console.log('Dataset created:', dataset);
        return json({ dataset });
    } catch (error) {
        console.error('Failed to create dataset:', error);
        return json({ error: 'Failed to create dataset.' }, { status: 500 });
    }
};

function Copyright(props: any) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="https://davidzagardo.com">
                www.davidzagardo.com
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const userId = await requireUserId(request);
    const datasetListItems = await getDatasetListItems({ userId });
    return json({ datasetListItems, userId });  // Include userId in the response
};

function TabularDataView() {
    const [gridData, setGridData] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [ratings, setRatings] = useState<number[]>([]); // State to hold ratings data
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>(''); // State to hold selected algorithm
    const [epsilon, setEpsilon] = useState<number>(1.0);
    const [delta, setDelta] = useState<number>(1e-5);
    const [lowerClip, setLowerClip] = useState<number | ''>('');
    const [upperClip, setUpperClip] = useState<number | ''>('');
    const [selectedColumn, setSelectedColumn] = useState('');
    const { datasetListItems, userId } = useLoaderData<typeof loader>();
    const [isLoading, setIsLoading] = useState(false);

    const handleColumnSelect = (columnName: string) => {
        setSelectedColumn(columnName);
    };

    const handleAlgorithmSelect = (
        algorithm: string,
        epsilonValue: number,
        deltaValue: number,
        lowerClipValue: number,
        upperClipValue: number
    ) => {
        setSelectedAlgorithm(algorithm);
        setEpsilon(epsilonValue);
        setDelta(deltaValue);
        setLowerClip(lowerClipValue);
        setUpperClip(upperClipValue);
    };

    const onSelectFile = async (filename: string) => {
        setSelectedFile(filename); // Save the selected filename to state
        try {
            // Fetch the CSV content
            const response = await fetch(`http://localhost:5000/get_file/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const text = await response.text();
            Papa.parse(text, {
                header: true,
                complete: async (results) => {
                    if (results.data) {
                        handleDataFetched(results.data);

                        // Now fetch the ratings column from the backend
                        try {
                            const ratingsResponse = await fetch(`http://localhost:5000/get_ratings/${filename}`);
                            if (!ratingsResponse.ok) {
                                throw new Error(`HTTP error! Status: ${ratingsResponse.status}`);
                            }
                            const ratingsData = await ratingsResponse.json();
                            setRatings(ratingsData); // Update the ratings state
                        } catch (error) {
                            console.error('Error fetching ratings:', error);
                        }
                    }
                },
            });
        } catch (error) {
            console.error('Error fetching file:', error);
        }
    };

    const handleGenerateData = async (filename: string) => {
        if (!selectedAlgorithm || epsilon <= 0 || delta <= 0) {
            console.error('No algorithm selected or invalid epsilon/delta values');
            return;
        }
        setIsLoading(true); // Start loading

        if (filename.trim() !== '') {
            try {
                console.log('Sending data with:', {
                    epsilon: epsilon,
                    delta: delta,
                    lowerClip: lowerClip,
                    upperClip: upperClip,
                    column_name: selectedColumn
                });
                const response = await fetch(`http://localhost:5000/generate_data/${selectedAlgorithm}/${encodeURIComponent(filename)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        epsilon: epsilon,
                        delta: delta,
                        lowerClip: lowerClip,
                        upperClip: upperClip,
                        column_name: selectedColumn
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                // Check if the response is JSON
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const result = await response.json();
                    console.log('Synthetic data generation result:', result);

                    const formData = new FormData();
                    formData.append('filename', result.file_name);
                    formData.append('filePath', result.file_path);
                    formData.append('privacyBudget', String(epsilon));
                    formData.append('fileType', 'csv');

                    console.log(formData);
                    console.log(result);

                    const newDatasetResponse = await fetch('/dashboard/dp/datasets/new', {
                        method: 'POST',
                        body: formData
                    });

                    if (newDatasetResponse.ok) {
                        // If response is OK, it's likely a redirect, get the new location
                        const newLocation = newDatasetResponse.headers.get('Location');
                        if (newLocation) {
                            // Programmatically navigate to the new URL
                            window.location.href = newLocation;
                        }
                    } else {
                        // Handle error
                        const errorText = await newDatasetResponse.text();
                        console.error('Error creating new dataset:', errorText);
                    }
                } else {
                    const text = await response.text();
                    throw new Error(`Unexpected response type: ${text}`);
                }
            } catch (error) {
                console.error('Error generating synthetic data:', error);
            } finally {
                setIsLoading(false); // Stop loading regardless of success or error
            }
        } else {
            console.error('No file selected or invalid file name');
            setIsLoading(false); // Stop loading as there was no file selected
        }
    };

    // Define the onDataFetched function which will be called with the fetched data
    const handleDataFetched = (data: any[]) => {
        // Update the state with the fetched data
        setGridData(data);
    };

    return (
        <Container maxWidth="lg">
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
            <Grid container spacing={2}> {/* Adjusted spacing */}
                {/* AlgorithmSelector */}
                <Grid item xs={12} md={8} lg={12}> {/* Adjusted size to take up 9/12 of the space at large screen sizes */}
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'row', height: '100%', justifyContent: 'space-between' }}>
                        <AlgorithmSelectorRemix datasetListItems={datasetListItems} onAlgorithmSelect={handleAlgorithmSelect} onGenerate={handleGenerateData} filename={selectedFile} onSelectFile={onSelectFile} onDataFetched={handleDataFetched} setSelectedFile={setSelectedFile} onColumnSelect={handleColumnSelect} isLoading={isLoading} />
                    </Paper>
                </Grid>
                {/* DataGrid */}
                <Grid item xs={12} md={4} lg={9}> {/* Adjusted size to take up 9/12 of the space at large screen sizes */}
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <DataGridDisplay data={gridData} />
                    </Paper>
                </Grid>
                {/* Dataset Stats */}
                <Grid item xs={12} md={6} lg={3}> {/* This can remain as a column */}
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                        <DatasetStatistics data={ratings} />
                    </Paper>
                </Grid>
            </Grid>
            <Copyright sx={{ pt: 4 }} />
        </Container>
    );
}

export default TabularDataView;
