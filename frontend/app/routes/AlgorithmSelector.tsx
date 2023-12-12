import React, { useState } from 'react';
import { Box, Select, MenuItem, SelectChangeEvent, TextField, InputAdornment } from '@mui/material';

interface AlgorithmSelectorProps {
  onAlgorithmSelect: (algorithm: string, epsilon: number, delta: number, lowerClip: number, upperClip: number) => void;
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({ onAlgorithmSelect }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
  const [epsilon, setEpsilon] = useState<number>(1.0);
  const [delta, setDelta] = useState<number>(1e-5);
  const [lowerClip, setLowerClip] = useState<number>(0);
  const [upperClip, setUpperClip] = useState<number>(5);

  const algorithms = ['Gaussian Mechanism', 'Laplace Mechanism'];

  const handleAlgorithmChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedAlgorithm(value);
    onAlgorithmSelect(value, epsilon, delta, lowerClip, upperClip);
  };

  const handleEpsilonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEpsilon(Number(event.target.value));
  };

  const handleDeltaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDelta(Number(event.target.value));
  };

  const handleLowerClipChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLowerClip(Number(event.target.value));
  };

  const handleUpperClipChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUpperClip(Number(event.target.value));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
      <TextField
        label="Lower Clip Value"
        type="number"
        value={lowerClip}
        onChange={handleLowerClipChange}
        fullWidth
      />
      <TextField
        label="Upper Clip Value"
        type="number"
        value={upperClip}
        onChange={handleUpperClipChange}
        fullWidth
      />
    </Box>
  );
};

export default AlgorithmSelector;
