import React, { useState, useEffect } from 'react';
import { Select, MenuItem, SelectChangeEvent, List, ListItem } from '@mui/material';
import Papa from 'papaparse';

interface DataSynthesizerProps {
    onSelectFile: (file: string) => void;
    onDataFetched: (data: any[]) => void;
    setSelectedFile: React.Dispatch<React.SetStateAction<string>>;
    onColumnSelect: (columnName: string) => void;
}

export default function DataSynthesizer({
    onSelectFile, onDataFetched, setSelectedFile, onColumnSelect
}: DataSynthesizerProps) {
    const [selectedFile, setFileSelection] = useState<string>(''); // Renamed this line
    const [fileList, setFileList] = useState<string[]>([]);
    const [columnNames, setColumnNames] = useState<string[]>([]);
    const [selectedColumnName, setSelectedColumnName] = useState<string>('');

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
        <div>
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
        </div>
    );
};