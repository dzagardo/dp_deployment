import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, CircularProgress, Typography, Alert, Box } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined'; // Import the icon

interface FileUploaderProps {
  onFileUploaded: (file: File) => void;
  isUploading: boolean;
}

export default function FileUploader({ onFileUploaded, isUploading }: FileUploaderProps) {
  const [fileUploaded, setFileUploaded] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadSuccess(false);
    setFileUploaded(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: fileUploaded !== null,
    noKeyboard: fileUploaded !== null
  });

  const handleUploadClick = async () => {
    if (fileUploaded) {
      setUploadSuccess(false);
      const formData = new FormData();
      formData.append('file', fileUploaded);

      try {
        const response = await fetch('http://localhost:5000/upload_csv', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          setUploadSuccess(true);
          onFileUploaded(fileUploaded);
        } else {
          console.error('Server error during file upload');
        }
      } catch (error) {
        console.error('Network error during file upload:', error);
      }
    }
  };

  return (
    <div {...getRootProps()} style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      border: '2px dashed #ccc',
      borderRadius: '4px',
      cursor: fileUploaded ? 'default' : 'pointer',
      backgroundColor: isDragActive ? '#e8f4ff' : (fileUploaded ? '#f0f0f0' : 'white'), // Very light blue background when dragging
    }}>
      <input {...getInputProps()} />
      {isUploading ? (
        <CircularProgress />
      ) : (
        <>
          {uploadSuccess ? (
            <Alert severity="success">
              File "{fileUploaded?.name}" has been uploaded successfully!
            </Alert>
          ) : (
            <>
              {fileUploaded ? (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    {fileUploaded.name} ready to upload
                  </Typography>
                  <Button variant="contained" onClick={handleUploadClick}>
                    Upload
                  </Button>
                </>
              ) : (
                <Box textAlign="center">
                  <CloudUploadIcon style={{ fontSize: 64 }} /> {/* Adjust the icon size as needed */}
                  <Typography variant="subtitle1" gutterBottom>
                    Upload Your CSV File
                  </Typography>
                </Box>
              )}
            </>
          )}
        </>
      )
      }
    </div >
  );
}