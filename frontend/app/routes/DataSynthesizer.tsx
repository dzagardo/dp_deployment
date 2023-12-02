import React, { useState, useEffect } from 'react';
import { Select, MenuItem, SelectChangeEvent } from '@mui/material';
import Papa from 'papaparse';

interface DataSynthesizerProps {
    onSelectFile: (file: string) => void;
    onDataFetched: (data: any[]) => void;
    setSelectedFile: React.Dispatch<React.SetStateAction<string>>; // Add this line if setSelectedFile is used in DataSynthesizer
}

export default function DataSynthesizer({ onSelectFile, onDataFetched }: DataSynthesizerProps) {
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [fileList, setFileList] = useState<string[]>([]);

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

    const handleChange = async (event: SelectChangeEvent<string>) => {
        const file = event.target.value;
        setSelectedFile(file);
        onSelectFile(file);

        // Fetch the CSV content
        const response = await fetch(`http://localhost:5000/get_file/${file}`);
        const text = await response.text();
        // Parse CSV content
        Papa.parse(text, {
            header: true,
            complete: (results) => {
                onDataFetched(results.data); // Pass the parsed data up
            },
        });
    };


    return (
        <div style={{ flexGrow: 1 }}>
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
        </div>
    );
}
