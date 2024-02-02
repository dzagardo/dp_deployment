import React, { useEffect, useState } from 'react';
import { useUser } from '~/utils';
import {
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Container,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Paper,
  Grid,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search'; // Import the search icon

type MachineType = {
  id: string;
  name: string;
  description?: string;
  estimatedUsagePerHour?: string;
};

type AcceleratorType = {
  id: string;
  name: string;
  description?: string;
  estimatedUsagePerHour?: string;
};

function NCMLView() {
  const currentUser = useUser();
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [selectedMachineType, setSelectedMachineType] = useState('');
  const [selectedOptimizer, setSelectedOptimizer] = useState('adam'); // New state for optimizer
  const [selectedComputeZone, setSelectedComputeZone] = useState('us-west1-a'); // New state for optimizer
  const [datasetSource, setDatasetSource] = useState('yourDatasets'); // New state to track the dataset source
  const [huggingFaceDatasetQuery, setHuggingFaceDatasetQuery] = useState(''); // State to track the Hugging Face search query
  const [datasets, setDatasets] = useState<{ name: string; description: string }[]>([]);
  const [selectedDataset, setSelectedDataset] = useState(''); // Initialize with an empty string
  const [selectedModel, setSelectedModel] = useState(''); // Initialize with an empty string
  const [models, setModels] = useState<{ name: string; description: string }[]>([]);
  const [modelSource, setModelSource] = useState('yourModels'); // Initialize with 'yourModels'
  const [huggingFaceModelQuery, setHuggingFaceModelQuery] = useState(''); // State to track the Hugging Face model search query
  const [learningRate, setLearningRate] = useState(0.001); // Default learning rate
  const [batchSize, setBatchSize] = useState(10); // Default learning rate
  const [microBatchSize, setMicroBatchSize] = useState(1); // Default learning rate
  const [sampleSize, setSampleSize] = useState(1000); // Default learning rate
  const [gradAccum, setGradAccum] = useState(10); // Default learning rate
  const [numEpochs, setNumEpochs] = useState(10); // Default learning rate

  useEffect(() => {
    // Define the function inside the useEffect
    const handleGetResources = async () => {
      if (!currentUser || !currentUser.encryptedToken) {
        console.error("No user or encrypted token found");
        return;
      }

      try {
        // Send a POST request to your decrypt API route
        const decryptResponse = await fetch('/api/decrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ hash: currentUser.encryptedToken }),
        });

        const decryptData = await decryptResponse.json();

        if (!decryptResponse.ok) {
          throw new Error(decryptData.error || 'Decryption failed');
        }

        const accessToken = decryptData.decryptedToken;

        // Fetch machine types with the accessToken
        const machineTypesResponse = await fetch(`/api/machine-types`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        const machineTypesData = await machineTypesResponse.json();

        if (!machineTypesResponse.ok) {
          throw new Error(machineTypesData.error || 'Failed to fetch machine types');
        }

        setMachineTypes(machineTypesData.machineTypes);

      } catch (error) {
        console.error("Error in handleGetResources:", error);
      }
    };

    // Call the function
    handleGetResources();
  }, [currentUser]);

  async function fetchHuggingFaceDatasets(params: {
    query: string,
    author?: string,
    filter?: string,
    sort?: string,
    direction?: string,
    limit?: number,
    full?: boolean
  }) {
    const { query, author, filter, sort, direction, limit, full } = params;

    if (!query.trim()) {
      console.error("Query is empty");
      return [];
    }

    // Construct the query parameters
    const queryParams = new URLSearchParams({ search: query });
    if (author) queryParams.set("author", author);
    if (filter) queryParams.set("filter", filter);
    if (sort) queryParams.set("sort", sort);
    if (direction) queryParams.set("direction", direction);
    if (limit) queryParams.set("limit", limit.toString());
    if (full) queryParams.set("full", full.toString());
    queryParams.set("limit", "200");

    try {
      const response = await fetch(`https://huggingface.co/api/datasets?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log(data);

      // Process the data as per the structure you expect from the API
      // Extract and format the fields you need from each dataset
      const formattedData = data.map((dataset: any) => ({
        name: dataset.id, // Assuming 'id' field is equivalent to 'name'
        description: dataset.description,
        author: dataset.author,
        createdAt: dataset.createdAt,
        downloads: dataset.downloads,
        tags: dataset.tags.join(', '), // Convert tags array to a comma-separated string
        // Add more fields as needed
      }));

      return formattedData;
    } catch (error) {
      console.error("Error fetching Hugging Face datasets:", error);
      return [];
    }
  }

  // Function to fetch Hugging Face models with a limit of 500
  async function fetchHuggingFaceModels(params: {
    search: string,
    author?: string,
    filter?: string,
    sort?: string,
    direction?: string,
    limit?: number, // Set the limit to 500
    full?: boolean
  }) {
    const { search, author, filter, sort, direction, limit, full } = params;

    if (!search.trim()) {
      console.error("Search query is empty");
      return [];
    }

    // Construct the query parameters
    const queryParams = new URLSearchParams({ search });

    if (author) queryParams.set("author", author);
    if (filter) queryParams.set("filter", filter);
    if (sort) queryParams.set("sort", sort);
    if (direction) queryParams.set("direction", direction);

    // Set the limit to 500
    queryParams.set("limit", "200");

    if (full) queryParams.set("full", full.toString());

    try {
      const response = await fetch(`https://huggingface.co/api/models?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Process the data as per the structure you expect from the API
      const formattedData = data.map((model: any) => ({
        name: model.id,
        description: model.description,
        author: model.author,
        createdAt: model.createdAt,
        downloads: model.downloads,
        tags: model.tags.join(', '),
      }));

      return formattedData;
    } catch (error) {
      console.error("Error fetching Hugging Face models:", error);
      return [];
    }
  }

  const handleRunCode = async (event: { preventDefault: () => void; }) => {
    event.preventDefault(); // Prevent default form submission behavior
  
    console.log("Running code with the selected options...");
  
    // The URL of your Flask endpoint
    const url = 'http://localhost:5000/run-code';
  
    // Data to send in the POST request
    const postData = {
      numEpochs: numEpochs,
      gradAccum: gradAccum,
      sampleSize: sampleSize,
      microBatchSize: microBatchSize,
      learningRate: learningRate,
      batchSize: batchSize,
      selectedModel: selectedModel,
      selectedDataset: selectedDataset,
      selectedMachineType: selectedMachineType,
      selectedOptimizer: selectedOptimizer,
      selectedComputeZone: selectedComputeZone,
      modelSource: modelSource,
      datasetSource: datasetSource,
      encryptedHFAccessToken: currentUser.encryptedHFAccessToken
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        console.log("Code execution initiated successfully.");
      }
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }
  };  

  const handleOptimizerChange = (event: SelectChangeEvent<string>) => {
    setSelectedOptimizer(event.target.value);
  };

  const handleSelectComputeZone = (event: SelectChangeEvent<string>) => {
    setSelectedComputeZone(event.target.value);
  };

  const handleMachineTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedMachineType(event.target.value as string);
  };

  // Event handler for changing the dataset source
  const handleDatasetSourceChange = (event: SelectChangeEvent<string>) => {
    setDatasetSource(event.target.value);
  };

  // Event handler for the Hugging Face search query
  const handleHuggingFaceDatasetQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHuggingFaceDatasetQuery(event.target.value);
  };

  const handleDatasetSelect = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setSelectedDataset(event.target.value); // Update the selected dataset when the user selects an option
  };

  const handleHuggingFaceDatasetSearch = async () => {
    const searchParams = {
      query: huggingFaceDatasetQuery,
      // You can add more parameters here if needed, like author, filter, etc.
    };
    const searchResults = await fetchHuggingFaceDatasets(searchParams);
    setDatasets(searchResults);
  };

  const handleModelSelect = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setSelectedModel(event.target.value); // Update the selected dataset when the user selects an option
  };

  const handleModelSourceChange = (event: SelectChangeEvent<string>) => {
    setModelSource(event.target.value);
  };

  const handleHuggingFaceModelQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHuggingFaceModelQuery(event.target.value);
  };

  // Function to handle the Hugging Face model search
  const handleHuggingFaceModelSearch = async () => {
    if (huggingFaceModelQuery.trim() !== '') { // Check if the query is not empty or only whitespace
      const searchParams = {
        search: huggingFaceModelQuery,
        // You can add more parameters here if needed, like author, filter, etc.
      };
      const searchResults = await fetchHuggingFaceModels(searchParams);
      setModels(searchResults);
    } else {
      console.error("Search query is empty");
    }
  };

  const consistentMarginStyle = { margin: 'normal', mt: 2, mb: 2 }; // Define consistent margin

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        LLM Fine-Tuning Dashboard
      </Typography>

      <Box sx={{ marginBottom: 2 }}>
        <Paper elevation={3} sx={{ padding: 3 }}> {/* Add Paper component with elevation and padding */}
          <Typography variant="h5" gutterBottom>
            Choose Your Model
          </Typography>
          <form onSubmit={handleRunCode}>
            {/* Model Source Selection */}
            <FormControl fullWidth sx={consistentMarginStyle}>
              <InputLabel id="model-source-label">Model Source</InputLabel>
              <Select
                labelId="model-source-label"
                id="modelSource"
                name="modelSource"
                value={modelSource}
                onChange={handleModelSourceChange}
                label="Model Source"
              >
                <MenuItem value="yourModels">Your Models</MenuItem>
                <MenuItem value="huggingFace">Hugging Face Models</MenuItem>
              </Select>
            </FormControl>

            {modelSource === 'yourModels' && (
              <Typography></Typography>
            )}
            {modelSource === 'huggingFace' && (
              <div>
                <TextField
                  label="Search Hugging Face Models"
                  type="text"
                  id="huggingFaceModelQuery"
                  name="huggingFaceModelQuery"
                  value={huggingFaceModelQuery}
                  onChange={handleHuggingFaceModelQueryChange}
                  fullWidth
                  sx={consistentMarginStyle}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Search"
                          onClick={handleHuggingFaceModelSearch}
                          edge="end"
                          color="primary"
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Display search results here */}
                <div>
                  {models.length > 0 ? (
                    <FormControl fullWidth sx={consistentMarginStyle}>
                      <InputLabel htmlFor="huggingFaceModel-select">Select Hugging Face Model</InputLabel>
                      <Select
                        labelId="huggingFaceModel-select"
                        id="huggingFaceModel-select"
                        value={selectedModel}
                        onChange={handleModelSelect}
                      >
                        {models.map((model, index) => (
                          <MenuItem key={`${model.name}_${index}`} value={model.name}>
                            {model.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography></Typography>
                  )}
                </div>
              </div>
            )}
          </form>
        </Paper>
      </Box>

      <Box sx={{ marginBottom: 2 }}>
        <Paper elevation={3} sx={{ padding: 3 }}> {/* Add Paper component with elevation and padding */}
          <Typography variant="h5" gutterBottom>
            Choose Your Dataset
          </Typography>
          {/* Dataset Source Selection */}
          <FormControl fullWidth sx={consistentMarginStyle}>
            <InputLabel id="dataset-source-label">Dataset Source</InputLabel>
            <Select
              labelId="dataset-source-label"
              id="datasetSource"
              name="datasetSource"
              value={datasetSource}
              onChange={handleDatasetSourceChange}
              label="Dataset Source"
            >
              <MenuItem value="yourDatasets">Your Datasets</MenuItem>
              <MenuItem value="huggingFace">Hugging Face Datasets</MenuItem>
            </Select>
          </FormControl>

          {/* Conditional Rendering based on Dataset Source */}
          {datasetSource === 'yourDatasets' && (
            <Typography></Typography>
          )}
          {datasetSource === 'huggingFace' && (
            <div>
              <TextField
                label="Search Hugging Face Datasets"
                type="text"
                id="huggingFaceQuery"
                name="huggingFaceQuery"
                value={huggingFaceDatasetQuery}
                onChange={handleHuggingFaceDatasetQueryChange}
                fullWidth
                sx={consistentMarginStyle} // Ensure this is applied here as it is for the model TextField
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Search"
                        onClick={handleHuggingFaceDatasetSearch}
                        edge="end"
                        color="primary"
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Display search results here */}
              <div>
                {datasets.length > 0 ? (
                  <FormControl fullWidth sx={consistentMarginStyle}>
                    <InputLabel htmlFor="dataset-select">Select Dataset</InputLabel>
                    <Select
                      labelId="dataset-select"
                      id="dataset-select"
                      value={selectedDataset}
                      onChange={handleDatasetSelect}
                    >
                      {datasets.map((dataset, index) => (
                        <MenuItem key={`${dataset.name}_${index}`} value={dataset.name}>
                          {dataset.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Typography></Typography>
                )}
              </div>
            </div>
          )}
        </Paper>
      </Box>

      <Box sx={{ marginBottom: 2 }}>
        <Paper elevation={3} sx={{ padding: 3 }}> {/* Add Paper component with elevation and padding */}
          <Typography variant="h5" gutterBottom>
            Choose Your Hyperparameters
          </Typography>
          {/* Optimizer selection */}
          <FormControl fullWidth sx={consistentMarginStyle}>
            <InputLabel id="optimizer-label">Optimizer</InputLabel>
            <Select
              labelId="optimizer-label"
              id="optimizer"
              name="optimizer"
              value={selectedOptimizer}
              onChange={handleOptimizerChange}
              label="Optimizer"
            >
              <MenuItem value="adam">Adam</MenuItem>
              <MenuItem value="sgd">SGD</MenuItem>
              {/* Add more optimizers */}
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
              <TextField
                label="Epochs"
                type="number"
                id="numEpochs"
                name="numEpochs"
                value={numEpochs}
                onChange={(e) => setNumEpochs(Number(e.target.value))}
                fullWidth
                sx={consistentMarginStyle}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
              <TextField
                label="Learning Rate"
                type="number"
                id="learningRate"
                name="learningRate"
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
                fullWidth
                sx={consistentMarginStyle}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
              <TextField
                label="Batch Size"
                type="number"
                id="batchSize"
                name="batchSize"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                fullWidth
                sx={consistentMarginStyle}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
              <TextField
                label="Microbatch Size"
                type="number"
                id="microBatch"
                name="microBatch"
                value={microBatchSize}
                onChange={(e) => setMicroBatchSize(Number(e.target.value))}
                fullWidth
                sx={consistentMarginStyle}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
              <TextField
                label="Gradient Accumulation"
                type="number"
                id="gradAccum"
                name="gradAccum"
                value={gradAccum}
                onChange={(e) => setGradAccum(Number(e.target.value))}
                fullWidth
                sx={consistentMarginStyle}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
              <TextField
                label="Sample Size"
                type="number"
                id="sampleSize"
                name="sampleSize"
                value={sampleSize}
                onChange={(e) => setSampleSize(Number(e.target.value))}
                fullWidth
                sx={consistentMarginStyle}
              />
            </Grid>
          </Grid>

          <FormControl fullWidth sx={consistentMarginStyle}>
            <InputLabel id="zone-label">Compute Zone</InputLabel>
            <Select
              labelId="compute-zone"
              id="computeZone"
              name="computeZone"
              value={selectedComputeZone}
              onChange={handleSelectComputeZone}
              label="Compute Zone"
            >
              <MenuItem value="us-west1-a">us-west1-a</MenuItem>
              {/* Add more compute zones */}
            </Select>
          </FormControl>

          {/* Machine Types Selection */}
          {machineTypes.length > 0 && (
            <FormControl fullWidth sx={consistentMarginStyle}>
              <InputLabel id="machineType-label">Machine Type</InputLabel>
              <Select
                labelId="machineType-label"
                id="machineType"
                name="machineType"
                value={selectedMachineType}
                onChange={handleMachineTypeChange}
                label="Machine Type"
              >
                {machineTypes.map((type) => (
                  <MenuItem key={type.id} value={type.name}>
                    {`${type.name} - Description: ${type.description}, Estimated Usage: ${type.estimatedUsagePerHour}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button type="submit" variant="contained" color="primary" onClick={handleRunCode}>
            Train Model
          </Button>
        </Paper>
      </Box>
    </Container >
  );
}

export default NCMLView;