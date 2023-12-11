import React, { useState } from 'react';
import { Select, MenuItem, SelectChangeEvent } from '@mui/material';

interface AlgorithmSelectorProps {
    onAlgorithmSelect: (algorithm: string) => void;
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({ onAlgorithmSelect }) => {
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');

    const algorithms = ['Gaussian Mechanism', 'Laplace Mechanism'];

    const handleChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        setSelectedAlgorithm(value);
        onAlgorithmSelect(value);
    };

    return (
        <Select
            value={selectedAlgorithm}
            onChange={handleChange}
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
    );
};

export default AlgorithmSelector;
