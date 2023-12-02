import React from 'react';
import { Button } from '@mui/material';

interface GenerateButtonProps {
    onGenerate: (filename: string) => void;
    filename: string;  // Pass filename as a prop
}

export default function GenerateButton({ onGenerate, filename }: GenerateButtonProps) {
    return (
        <Button
            variant="contained"
            onClick={() => onGenerate(filename)} // Pass filename to the onGenerate function
            sx={{ mt: 2, width: '100%', flexGrow: 1 }}
        >
            Generate Synthetic Data
        </Button>
    );
}
