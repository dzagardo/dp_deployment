// DatasetStatistics.tsx
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

// Define the types for the props
interface DatasetStatisticsProps {
    data: number[]; // Assuming 'data' is an array of numbers representing the ratings.
}

const DatasetStatistics: React.FC<DatasetStatisticsProps> = ({ data }) => {
    // Placeholder functions to calculate statistics
    const calculateMean = (numbers: number[]) => {
        if (numbers.length === 0) return NaN;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    };
    const calculateMedian = (numbers: number[]) => {
        if (numbers.length === 0) return NaN;
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };
    // const calculateMode = (numbers: number[]) => {
    //     if (numbers.length === 0) return [];
    //     const frequency: { [key: number]: number } = {};
    //     let maxFreq = 0;
    //     let modes: number[] = [];
    //     numbers.forEach((number) => {
    //         frequency[number] = (frequency[number] || 0) + 1;
    //         if (frequency[number] > maxFreq) {
    //             maxFreq = frequency[number];
    //             modes = [number];
    //         } else if (frequency[number] === maxFreq && !modes.includes(number)) {
    //             modes.push(number);
    //         }
    //     });
    //     return modes;
    // };

    // Calculating statistics using placeholder functions
    const mean = calculateMean(data);
    const median = calculateMedian(data);
    // const modes = calculateMode(data);

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
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell align="left">Mean</TableCell>
                        <TableCell align="left">Median</TableCell>
                        {/* <TableCell align="left">Mode</TableCell> */}
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                        <TableCell align="left">{formatStatistic(mean)}</TableCell>
                        <TableCell align="left">{formatStatistic(median)}</TableCell>
                        {/* <TableCell align="left">{modes.length > 0 ? modes.join(', ') : 'N/A'}</TableCell> */}
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default DatasetStatistics;
