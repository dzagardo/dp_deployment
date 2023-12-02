import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, CircularProgress, Typography, Alert } from '@mui/material';

interface FileUploaderProps {
  onFileUploaded: (file: File) => void;
  isUploading: boolean; // New prop to indicate uploading state
}

export default function FileUploader({ onFileUploaded, isUploading }: FileUploaderProps) {
  const [fileUploaded, setFileUploaded] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false); // New state to track upload success

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Reset upload success state upon new file drop
    setUploadSuccess(false);
    // Immediately set the file to state when dropped
    setFileUploaded(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop,
    noClick: fileUploaded !== null,
    noKeyboard: fileUploaded !== null
  });

  const handleUploadClick = async () => {
    if (fileUploaded) {
      setUploadSuccess(false); // Reset upload success state before attempting upload
      const formData = new FormData();
      formData.append('file', fileUploaded);

      try {
        const response = await fetch('http://localhost:5000/upload_csv', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          setUploadSuccess(true); // Set upload success to true if response is ok
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
      backgroundColor: fileUploaded ? '#f0f0f0' : 'white',
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
                <Typography variant="subtitle1" gutterBottom>
                  Drag 'n' drop some files here, or click to select files
                </Typography>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
