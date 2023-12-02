import React from 'react';
import { Button } from '@mui/material';

interface GenerateButtonProps {
    onGenerate: () => void;
}

export default function GenerateButton({ onGenerate }: GenerateButtonProps) {
    return (
        <Button
            variant="contained"
            onClick={onGenerate}
            sx={{ mt: 2, width: '100%', flexGrow: 1 }} // Add flexGrow here
        >
            Generate Synthetic Data
        </Button>

    );
}
