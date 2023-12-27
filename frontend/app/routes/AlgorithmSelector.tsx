import React, { useState, useEffect } from 'react';
import { Box, Grid, Select, MenuItem, SelectChangeEvent, TextField, InputAdornment, Button } from '@mui/material';
import Papa from 'papaparse';


interface AlgorithmSelectorProps {
  onAlgorithmSelect: (algorithm: string, epsilon: number, delta: number, lowerClip: number, upperClip: number) => void;
  onGenerate: (filename: string) => void;
  filename: string;
  onSelectFile: (file: string) => void;
  onDataFetched: (data: any[]) => void;
  setSelectedFile: React.Dispatch<React.SetStateAction<string>>;
  onColumnSelect: (columnName: string) => void;
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({ onAlgorithmSelect, onGenerate, filename, onSelectFile, onDataFetched, setSelectedFile, onColumnSelect }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
  const [epsilon, setEpsilon] = useState<number>(1.0);
  const [delta, setDelta] = useState<number>(1e-5);
  const [lowerClip, setLowerClip] = useState<number | ''>('');
  const [upperClip, setUpperClip] = useState<number | ''>('');
  const [selectedFile, setFileSelection] = useState<string>(''); // Renamed this line
  const [fileList, setFileList] = useState<string[]>([]);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [selectedColumnName, setSelectedColumnName] = useState<string>('');
  const algorithms = ['Gaussian Mechanism', 'Laplace Mechanism'];

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
    
    // Convert lowerClip and upperClip to numbers, use a default value if they are empty strings
    const numLowerClip = lowerClip === '' ? 0 : lowerClip;
    const numUpperClip = upperClip === '' ? 5 : upperClip;
    
    onAlgorithmSelect(value, epsilon, delta, numLowerClip, numUpperClip);
  };
  

  const handleEpsilonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEpsilon(Number(event.target.value));
  };

  const handleDeltaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDelta(Number(event.target.value));
  };

  const handleLowerClipChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLowerClip(value === '' ? value : Number(value));
  };
  
  const handleUpperClipChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setUpperClip(value === '' ? value : Number(value));
  };

  const handleColumnChange = (event: SelectChangeEvent<string>) => {
    const columnName = event.target.value as string;
    setSelectedColumnName(columnName);
    onColumnSelect(columnName); // Call the method passed via props
  };

  const handleChange = async (event: SelectChangeEvent<string>) => {
    const file = event.target.value as string;
    setFileSelection(file); // Changed this line to use the new setter
    onSelectFile(file);

    // Fetch the CSV content
    const response = await fetch(`http://localhost:5000/get_file/${file}`);
    const text = await response.text();

    // Fetch the column names for the selected file
    const colResponse = await fetch(`http://localhost:5000/get_column_names/${file}`);
    if (colResponse.ok) {
      const columns = await colResponse.json();
      setColumnNames(columns); // Save the column names in the state
    } else {
      console.error(`HTTP error! Status: ${colResponse.status}`);
      // Handle the error appropriately
    }

    // Parse CSV content
    Papa.parse(text, {
      header: true,
      complete: async (results) => {
        onDataFetched(results.data); // Pass the parsed data up

        // Now fetch the ratings column from the backend
        try {
          const ratingsResponse = await fetch(`http://localhost:5000/get_ratings/${file}`);
          if (!ratingsResponse.ok) {
            throw new Error(`HTTP error! Status: ${ratingsResponse.status}`);
          }
          const ratings = await ratingsResponse.json();
          // Here you would pass the ratings to the DatasetStatistics component
          // You might need to set it in the state or use another method to pass this data down
        } catch (error) {
          console.error('Error fetching ratings:', error);
        }
      },
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}> {/* Column 1 */}
          <Box sx={{ marginBottom: '20px' }}> {/* Add bottom margin to the Box */}
            <Select
              value={selectedFile}
              onChange={handleChange}
              displayEmpty
              fullWidth
              inputProps={{ 'aria-label': 'Select file' }}
            >
              <MenuItem disabled value="">
                Select a file
              </MenuItem>
              {fileList.map((file) => (
                <MenuItem key={file} value={file}>{file}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{}}> {/* Add bottom margin to the Box */}
            <Select
              value={selectedColumnName}
              onChange={handleColumnChange}
              displayEmpty
              fullWidth
              inputProps={{ 'aria-label': 'Select column' }}
            >
              <MenuItem disabled value="">
                {/* Conditional display based on columnNames length */}
                {columnNames.length > 0 ? 'Select a column' : 'No columns available'}
              </MenuItem>
              {columnNames.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </Box>
        </Grid>
        <Grid item xs={12} md={3}> {/* Column 2 */}
          <Box sx={{ marginBottom: '20px' }}> {/* Add bottom margin to the Box */}
            <TextField
              label="Lower Clip Value"
              type="number"
              value={lowerClip}
              onChange={handleLowerClipChange}
              fullWidth
            />
          </Box>
          <Box sx={{}}> {/* Add bottom margin to the Box */}
            <TextField
              label="Upper Clip Value"
              type="number"
              value={upperClip}
              onChange={handleUpperClipChange}
              fullWidth
            />
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
              sx={{ width: '100%', height: '55px' }}
            >
              Generate Data
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AlgorithmSelector;
