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
import AlgorithmSelectorImages from './AlgorithmSelectorImages';
import { Box } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { requireUserId } from '~/session.server';
import { getDatasetListItems } from '~/models/dataset.server';
import { ActionFunction } from '@remix-run/node';
import { createDataset } from '~/models/dataset.server';
import { useLoaderData } from '@remix-run/react';
import CircularProgress from '@mui/material/CircularProgress';
import ImageGridDisplay from './ImageGridDisplay';

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

function ImageDataView() {
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
    const [trainImages, setTrainImages] = useState<any[]>([]);
    const [trainLabels, setTrainLabels] = useState<any[]>([]);
    const [testImages, setTestImages] = useState<any[]>([]);
    const [testLabels, setTestLabels] = useState<any[]>([]);
    const [trainImagesFile, setTrainImagesFile] = useState<string>('');
    const [trainLabelsFile, setTrainLabelsFile] = useState<string>('');
    const [testImagesFile, setTestImagesFile] = useState<string>('');
    const [testLabelsFile, setTestLabelsFile] = useState<string>('');    

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

    const handleGenerateData = async () => {
        if (!selectedAlgorithm || epsilon <= 0 || delta <= 0) {
            console.error('No algorithm selected or invalid epsilon/delta values');
            return;
        }
        setIsLoading(true); // Start loading

        // Prepare the data to send, including the new image and label data
        const requestData = {
            epsilon: epsilon,
            delta: delta,
            lowerClip: lowerClip,
            upperClip: upperClip,
            trainImages: trainImagesFile, // You need to have the file paths for these datasets
            trainLabels: trainLabelsFile,
            testImages: testImagesFile,
            testLabels: testLabelsFile
        };

        console.log('Sending data with:', requestData);
        const response = await fetch(`http://localhost:5000/generate_image_data/${selectedAlgorithm}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
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
            setIsLoading(false); // Stop loading
            if (newDatasetResponse.ok) {
                setIsLoading(false); // Stop loading
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
            setIsLoading(false); // Stop loading
            throw new Error(`Unexpected response type: ${text}`);
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
                Generating Private Synthetic Image Data
            </Typography>
            <Box sx={{ marginBottom: 2 }}>
                <Paper sx={{ padding: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        What is Synthetic Image Data?
                    </Typography>
                    <Typography paragraph>
                        Synthetic image data refers to artificially generated images that are created using various algorithms, typically to resemble real-world imagery. In the context of machine learning and deep learning, synthetic image data is often used for training and testing models when actual real-world data is scarce, sensitive, or difficult to obtain. This approach helps in augmenting datasets, improving model robustness, and ensuring privacy.
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                        Convolutional Neural Networks (CNN) & Generative Adversarial Networks (GAN)
                    </Typography>
                    <Typography paragraph>
                        In a GAN approach, we have a Generator and a Discriminator.

                        The Generator network generates new synthetic images. It takes a random noise vector as input and outputs an image. In CNN-based generators, this often involves using Conv2DTranspose (deconvolutional) layers to upscale the input noise vector to the size of an image. The activation function tanh is commonly used in the output layer of the generator to normalize the pixel values.

                        The Discriminator network tries to distinguish between real and synthetic (generated) images. It is a typical CNN classifier consisting of Conv2D layers. The network takes an image as input and outputs the probability of the image being real. The sigmoid activation function is often used in the output layer for binary classification (real vs. fake).
                    </Typography>
                </Paper>
            </Box>
            <Box sx={{ marginBottom: 2 }}>
                <Grid container spacing={2}> {/* Adjusted spacing */}
                    {/* AlgorithmSelector */}
                    <Grid item xs={12} md={8} lg={12}> {/* Adjusted size to take up 9/12 of the space at large screen sizes */}
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'row', height: '100%', justifyContent: 'space-between' }}>
                            <AlgorithmSelectorImages
                                datasetListItems={datasetListItems}
                                onAlgorithmSelect={handleAlgorithmSelect}
                                onGenerate={handleGenerateData}
                                filename={selectedFile}
                                onSelectFile={onSelectFile}
                                onDataFetched={handleDataFetched}
                                setSelectedFile={setSelectedFile}
                                onColumnSelect={handleColumnSelect}
                                isLoading={isLoading}
                                setTrainImages={setTrainImages}
                                setTrainLabels={setTrainLabels}
                                setTestImages={setTestImages}
                                setTestLabels={setTestLabels}
                                setTrainImagesFile={setTrainImagesFile}
                                setTrainLabelsFile={setTrainLabelsFile}
                                setTestImagesFile={setTestImagesFile}
                                setTestLabelsFile={setTestLabelsFile}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
            <Box sx={{ marginBottom: 2 }}>
                <Grid container spacing={2}>
                    {/* Train Image Grid */}
                    <Grid item xs={12} md={6} lg={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6">Training Images</Typography>
                            <ImageGridDisplay data={trainImages} type="image" />
                        </Paper>
                    </Grid>
                    {/* Test Image Grid */}
                    <Grid item xs={12} md={6} lg={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6">Testing Images</Typography>
                            <ImageGridDisplay data={testImages} type="image" />
                        </Paper>
                    </Grid>
                    {/* Train Label Grid */}
                    <Grid item xs={12} md={6} lg={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6">Training Labels</Typography>
                            <ImageGridDisplay data={trainLabels} type="label" />
                        </Paper>
                    </Grid>
                    {/* Test Label Grid */}
                    <Grid item xs={12} md={6} lg={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6">Testing Labels</Typography>
                            <ImageGridDisplay data={testLabels} type="label" />
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
            <Copyright sx={{ pt: 4 }} />
        </Container>
    );
}

export default ImageDataView;
