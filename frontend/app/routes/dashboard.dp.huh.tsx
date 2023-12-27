import React, { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import FileUploader from './fileuploader';
import DataGridDisplay from './DataGridDisplay';
import Papa from 'papaparse';
import DatasetStatistics from './DatasetStatistics';
import AlgorithmSelectorRemix from './AlgorithmSelectorRemix';
import { Box } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { requireUserId } from '~/session.server';
import { getDatasetListItems } from '~/models/dataset.server';
import { ActionFunction } from '@remix-run/node';
import { createDataset } from '~/models/dataset.server';


import { useLoaderData } from '@remix-run/react';

export const action: ActionFunction = async ({ request }) => {
    console.log('Action function called'); // Confirm the action function is being invoked
    const userId = await requireUserId(request);
    console.log('User ID:', userId); // Log the user ID

    const formData = await request.formData();
    console.log('All FormData:', Object.fromEntries(formData));
    formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });
    const file = formData.get('file');
    const fileName = formData.get('filename');
    const fileType = (formData.get("fileType") as string) || "csv";
    const privacyBudget = formData.get('privacyBudget') || 1.0;

    // Log the extracted data
    console.log('File:', file);
    console.log('FileName:', fileName);
    console.log('FileType:', fileType);
    console.log('PrivacyBudget:', privacyBudget);

    if (!file || typeof fileName !== 'string' || !fileName) {
        console.error('Validation failed: File and filename are required.');
        return json({ error: 'File and filename are required.' }, { status: 400 });
    }

    const filePath = `/data/${fileName}`;
    console.log('FilePath:', filePath); // Log the constructed file path

    try {
        const dataset = await createDataset({
            fileName,
            fileType,
            filePath,
            privacyBudget: Number(privacyBudget),
            userId,
        });

        console.log('Dataset created:', dataset); // Log the created dataset
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

function Huh() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [gridData, setGridData] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [ratings, setRatings] = useState<number[]>([]); // State to hold ratings data
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>(''); // State to hold selected algorithm
    const [epsilon, setEpsilon] = useState<number>(1.0);
    const [delta, setDelta] = useState<number>(1e-5);
    const [lowerClip, setLowerClip] = useState<number>(0); // State to hold lower clip value
    const [upperClip, setUpperClip] = useState<number>(5); // State to hold upper clip value
    const [selectedColumn, setSelectedColumn] = useState('');
    const { datasetListItems, userId } = useLoaderData<typeof loader>();


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
        if (filename.trim() !== '') {
            try {
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

                const result = await response.json();
                console.log('Synthetic data generation result:', result);
                // Handle the result as needed
            } catch (error) {
                console.error('Error generating synthetic data:', error);
            }
        } else {
            console.error('No file selected or invalid file name');
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
                {/* FileUploader */}
                <Grid item xs={12} md={8} lg={12}>
                    <Paper
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            height: 160,
                        }}
                    >
                        <FileUploader onFileUploaded={handleFileUpload} isUploading={isUploading} />
                    </Paper>
                </Grid>
                {/* AlgorithmSelector */}
                <Grid item xs={12} md={8} lg={12}>
                    <Paper
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'row',
                            height: '100%',
                            justifyContent: 'space-between'
                        }}
                    >
                        <AlgorithmSelectorRemix datasetListItems={datasetListItems} onAlgorithmSelect={handleAlgorithmSelect} onGenerate={() => handleGenerateData(selectedFile)} filename={selectedFile} onSelectFile={onSelectFile} onDataFetched={handleDataFetched} setSelectedFile={setSelectedFile} onColumnSelect={handleColumnSelect} />
                    </Paper>
                </Grid>
                {/* DataGrid */}
                <Grid item xs={9}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <DataGridDisplay data={gridData} />
                    </Paper>
                </Grid>
                {/* Dataset Stats */}
                <Grid item xs={12} md={6} lg={3}> {/* Column 1 */}
                    <Paper
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'row',
                            height: '100%',
                            justifyContent: 'space-between'
                        }}
                    >
                        <DatasetStatistics data={ratings} />
                    </Paper>
                </Grid>
            </Grid>
            <Copyright sx={{ pt: 4 }} />
        </Container>
    );
}

export default Huh;
