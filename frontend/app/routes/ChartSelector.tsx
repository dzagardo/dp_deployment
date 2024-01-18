import React, { useState } from 'react';
import { Paper, Typography, Select, MenuItem, Box } from '@mui/material';
// Define the type for the onChartTypeChange prop

type ChartSelectorProps = {
    onChartTypeChange?: (chartType: string) => void;
};

const ChartSelector: React.FC<ChartSelectorProps> = ({ onChartTypeChange }) => {
    const [chartType, setChartType] = useState('');

    const handleChartTypeChange = (event: { target: { value: any; }; }) => {
        const selectedType = event.target.value;
        setChartType(selectedType);
        if (onChartTypeChange) {
            onChartTypeChange(selectedType);
        }
    };

    return (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
                Select Chart Type
            </Typography>
            <Box sx={{ mb: 2 }}>
                <Select
                    label="Chart Type"
                    value={chartType}
                    onChange={handleChartTypeChange}
                    displayEmpty
                    fullWidth
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    <MenuItem value="pie">Pie Chart</MenuItem>
                    <MenuItem value="histogram">Histogram</MenuItem>
                    <MenuItem value="bar">Bar Chart</MenuItem>
                    {/* Add more chart types as needed */}
                </Select>
            </Box>
            {/* Placeholder for chart rendering based on the selected type */}
            {chartType && (
                <Typography>
                    {/* You can replace this with your chart rendering component */}
                    {`Selected chart type: ${chartType}`}
                </Typography>
            )}
        </Paper>
    );
};

export default ChartSelector;
