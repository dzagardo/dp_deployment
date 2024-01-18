import React, { useState, useEffect } from 'react';
import { Box, Grid, Select, MenuItem, SelectChangeEvent, TextField, InputAdornment, Button, CircularProgress } from '@mui/material';
import Papa from 'papaparse';

interface AlgorithmSelectorImagesProps {
  datasetListItems: any[]; // Define the correct type based on your data
  onAlgorithmSelect: (algorithm: string, epsilon: number, delta: number, lowerClip: number, upperClip: number) => void;
  filename: string;
  onSelectFile: (file: string) => void;
  onDataFetched: (data: any[]) => void;
  setSelectedFile: React.Dispatch<React.SetStateAction<string>>;
  onColumnSelect: (columnName: string) => void;
  onGenerate: (filename: string) => void;
  isLoading: boolean;
  setTrainImages: React.Dispatch<React.SetStateAction<any[]>>;
  setTrainLabels: React.Dispatch<React.SetStateAction<any[]>>;
  setTestImages: React.Dispatch<React.SetStateAction<any[]>>;
  setTestLabels: React.Dispatch<React.SetStateAction<any[]>>;
  setTrainImagesFile: React.Dispatch<React.SetStateAction<string>>;
  setTrainLabelsFile: React.Dispatch<React.SetStateAction<string>>;
  setTestImagesFile: React.Dispatch<React.SetStateAction<string>>;
  setTestLabelsFile: React.Dispatch<React.SetStateAction<string>>;
}

const AlgorithmSelectorImages: React.FC<AlgorithmSelectorImagesProps> = ({
  datasetListItems, onAlgorithmSelect, onGenerate, filename,
  onSelectFile, onDataFetched, setSelectedFile, onColumnSelect,
  isLoading,
  setTrainImages,
  setTrainLabels,
  setTestImages,
  setTestLabels,
  setTrainImagesFile,
  setTrainLabelsFile,
  setTestImagesFile,
  setTestLabelsFile,
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
  const [epsilon, setEpsilon] = useState<number>(1.0);
  const [delta, setDelta] = useState<number>(1e-5);
  const [lowerClip, setLowerClip] = useState<number | ''>('');
  const [upperClip, setUpperClip] = useState<number | ''>('');
  const [selectedFile, setFileSelection] = useState<string>(''); // Renamed this line
  const [selectedTrainImages, setTrainImagesSelection] = useState<string>(''); // Renamed this line
  const [selectedTrainLabels, setTrainLabelsSelection] = useState<string>(''); // Renamed this line
  const [selectedTestImages, setTestImagesSelection] = useState<string>(''); // Renamed this line
  const [selectedTestLabels, setTestLabelsSelection] = useState<string>(''); // Renamed this line
  const [fileList, setFileList] = useState<string[]>([]);
  const algorithms = ['DP-GAN Images'];

  useEffect(() => {
    const fetchFileList = async () => {
      try {
        const response = await fetch('http://localhost:5000/list_files');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const files = await response.json();
        setFileList(files);
      } catch (error) {
        console.error('Failed to fetch file list:', error);
      }
    };

    fetchFileList();
  }, []);

  const handleAlgorithmChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedAlgorithm(value);

    // Coerce to number, with 0 as fallback for empty strings
    const lowerClipNumber = lowerClip !== '' ? +lowerClip : Number.MIN_SAFE_INTEGER;
    const upperClipNumber = upperClip !== '' ? +upperClip : Number.MAX_SAFE_INTEGER;

    onAlgorithmSelect(value, epsilon, delta, lowerClipNumber, upperClipNumber);
  };

  const handleEpsilonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEpsilon(Number(event.target.value));
  };

  const handleDeltaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDelta(Number(event.target.value));
  };

  // Utility function to convert base64 strings to objects with id and image keys
  const convertBase64ToImageObjects = (base64Strings: any[]) => {
    return base64Strings.map((base64, index) => ({
      id: index, // Use the array index as a unique key for now
      image: base64,
    }));
  };

  const handleTrainImagesChange = async (event: SelectChangeEvent<string>) => {
    const file = event.target.value as string;
    setTrainImagesSelection(file); // Changed this line to use the new setter
    setTrainImagesFile(file); // This should be a string representing the filename

    const response = await fetch(`http://localhost:5000/get_train_images/${file}`);
    console.log(response)
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return;
    }
    const base64Strings = await response.json();
    const imageObjects = convertBase64ToImageObjects(base64Strings);
    setTrainImages(imageObjects); // Set the parent state with the formatted objects
  };

  const handleTrainLabelsChange = async (event: SelectChangeEvent<string>) => {
    const file = event.target.value as string;
    setTrainLabelsSelection(file); // Changed this line to use the new setter
    setTrainLabelsFile(file); // This should be a string representing the filename

    const response = await fetch(`http://localhost:5000/get_train_labels/${file}`);
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return;
    }
    const labelsBase64Strings = await response.json();
    const labelsObjects = convertBase64ToImageObjects(labelsBase64Strings);
    setTrainLabels(labelsObjects);
  };

  const handleTestImagesChange = async (event: SelectChangeEvent<string>) => {
    const file = event.target.value as string;
    setTestImagesSelection(file); // Changed this line to use the new setter
    setTestImagesFile(file); // This should be a string representing the filename

    const response = await fetch(`http://localhost:5000/get_test_images/${file}`);
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return;
    }
    const testImagesBase64Strings = await response.json();
    const testImagesObjects = convertBase64ToImageObjects(testImagesBase64Strings);
    setTestImages(testImagesObjects);
  };

  const handleTestLabelsChange = async (event: SelectChangeEvent<string>) => {
    const file = event.target.value as string;
    setTestLabelsSelection(file); // Changed this line to use the new setter
    setTestLabelsFile(file); // This should be a string representing the filename

    const response = await fetch(`http://localhost:5000/get_test_labels/${file}`);
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return;
    }
    const testLabelsBase64Strings = await response.json();
    const testLabelsObjects = convertBase64ToImageObjects(testLabelsBase64Strings);
    setTestLabels(testLabelsObjects);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}> {/* Column 1 */}
          <Box sx={{ marginBottom: '20px' }}>
            <Select
              value={selectedTrainImages}
              onChange={handleTrainImagesChange}
              displayEmpty
              fullWidth
              inputProps={{ 'aria-label': 'Select file' }}
            >
              <MenuItem disabled value="">
                {datasetListItems && datasetListItems.length === 0 ? "No datasets yet" : "Select training images"}
              </MenuItem>
              {/* Safely map over datasetListItems */}
              {datasetListItems && datasetListItems.map((item) => (
                <MenuItem key={item.id} value={item.fileName}>
                  📊 {item.fileName}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{}}>
            <Select
              value={selectedTrainLabels}
              onChange={handleTrainLabelsChange}
              displayEmpty
              fullWidth
              inputProps={{ 'aria-label': 'Select file' }}
            >
              <MenuItem disabled value="">
                {datasetListItems && datasetListItems.length === 0 ? "No datasets yet" : "Select training labels"}
              </MenuItem>
              {/* Safely map over datasetListItems */}
              {datasetListItems && datasetListItems.map((item) => (
                <MenuItem key={item.id} value={item.fileName}>
                  📊 {item.fileName}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Grid>
        <Grid item xs={12} md={3}> {/* Column 2 */}
          <Box sx={{ marginBottom: '20px' }}>
            <Select
              value={selectedTestImages}
              onChange={handleTestImagesChange}
              displayEmpty
              fullWidth
              inputProps={{ 'aria-label': 'Select file' }}
            >
              <MenuItem disabled value="">
                {datasetListItems && datasetListItems.length === 0 ? "No datasets yet" : "Select test images"}
              </MenuItem>
              {/* Safely map over datasetListItems */}
              {datasetListItems && datasetListItems.map((item) => (
                <MenuItem key={item.id} value={item.fileName}>
                  📊 {item.fileName}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{}}>
            <Select
              value={selectedTestLabels}
              onChange={handleTestLabelsChange}
              displayEmpty
              fullWidth
              inputProps={{ 'aria-label': 'Select file' }}
            >
              <MenuItem disabled value="">
                {datasetListItems && datasetListItems.length === 0 ? "No datasets yet" : "Select test labels"}
              </MenuItem>
              {/* Safely map over datasetListItems */}
              {datasetListItems && datasetListItems.map((item) => (
                <MenuItem key={item.id} value={item.fileName}>
                  📊 {item.fileName}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Grid>
        <Grid item xs={12} md={3}> {/* Column 2 */}
          <Box sx={{ marginBottom: '20px' }}> {/* Add bottom margin to the Box */}
            <TextField
              label="Epsilon (ε)"
              type="number"
              value={epsilon}
              onChange={handleEpsilonChange}
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">ε</InputAdornment>,
              }}
            />
          </Box>
          <Box>
            <TextField
              label="Delta (δ)"
              type="number"
              value={delta}
              onChange={handleDeltaChange}
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">δ</InputAdornment>,
              }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={3}> {/* Column 2 */}
          <Box sx={{ marginBottom: '20px' }}> {/* Add bottom margin to the Box */}
            <Select
              value={selectedAlgorithm}
              onChange={handleAlgorithmChange}
              displayEmpty
              fullWidth
              inputProps={{ 'aria-label': 'Select algorithm' }}
            >
              <MenuItem disabled value="">
                Select an algorithm
              </MenuItem>
              {algorithms.map((algorithm) => (
                <MenuItem key={algorithm} value={algorithm}>{algorithm}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{}}> {/* Add bottom margin to the Box */}
            <Button
              variant="contained"
              onClick={() => onGenerate(filename)} // Pass filename to the onGenerate function
              disabled={isLoading} // Disable the button while loading
              sx={{ width: '100%', height: '55px' }}
            >
              {isLoading ? <CircularProgress size={24} /> : "Generate Data"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AlgorithmSelectorImages;
