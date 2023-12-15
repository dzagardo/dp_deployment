// DatasetStatistics.tsx
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

// Define the types for the props
interface DatasetStatisticsProps {
    data: number[]; // Assuming 'data' is an array of numbers representing the dataset.
}

const DatasetStatistics: React.FC<DatasetStatisticsProps> = ({ data }) => {
    // Function to calculate the minimum value
    const calculateMin = (numbers: number[]) => Math.min(...numbers);

    // Function to calculate the maximum value
    const calculateMax = (numbers: number[]) => Math.max(...numbers);

    // Function to calculate the mean value
    const calculateMean = (numbers: number[]) => {
        if (numbers.length === 0) return NaN;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    };

    // Function to calculate the median value
    const calculateMedian = (numbers: number[]) => {
        if (numbers.length === 0) return NaN;
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    // Function to calculate the mode value
    const calculateMode = (numbers: number[]) => {
        const frequency: { [key: number]: number } = {};
        let maxFreq = 0;
        let modes: number[] = [];
        numbers.forEach((number) => {
            frequency[number] = (frequency[number] || 0) + 1;
            if (frequency[number] > maxFreq) {
                maxFreq = frequency[number];
                modes = [number];
            } else if (frequency[number] === maxFreq && !modes.includes(number)) {
                modes.push(number);
            }
        });
        return modes;
    };

    // Calculating statistics
    const min = calculateMin(data);
    const max = calculateMax(data);
    const mean = calculateMean(data);
    const median = calculateMedian(data);
    const modes = calculateMode(data);

    // Function to format the display of the statistic
    const formatStatistic = (value: number | number[]) => {
        if (Array.isArray(value)) {
            return value.length > 0 ? value.join(', ') : 'N/A';
        } else {
            return !isNaN(value) ? value.toFixed(2) : 'N/A';
        }
    };

    return (
        <TableContainer component={Paper}>
            <Table sx={{ maxWidth: 225 }} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell align="left">Dataset Statistics</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left">Min</TableCell>
                        <TableCell align="left">{formatStatistic(min)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left">Max</TableCell>
                        <TableCell align="left">{formatStatistic(max)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left">Mean</TableCell>
                        <TableCell align="left">{formatStatistic(mean)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left">Median</TableCell>
                        <TableCell align="left">{formatStatistic(median)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="left">Mode</TableCell>
                        <TableCell align="left">{formatStatistic(modes)}</TableCell>
                    </TableRow>
                </TableHead>
            </Table>
        </TableContainer >
    );
}

export default DatasetStatistics;
