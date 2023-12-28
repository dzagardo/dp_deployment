import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, CircularProgress, Typography, Alert, Box } from '@mui/material';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import { getDatasetListItems } from '~/models/dataset.server';
import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node';
import { requireUserId } from '~/session.server';
import { useLoaderData } from '@remix-run/react';
import { createDataset } from '~/models/dataset.server';

interface FileUploaderProps {
  isUploading: boolean;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const fileName = formData.get("filename");
  const fileType = formData.get("fileType") || "csv"; // Default to "csv" if not provided

  // Validate fileName
  if (typeof fileName !== "string" || fileName.length === 0) {
    return json(
      { errors: { fileName: "Filename is required", fileType: null } },
      { status: 400 },
    );
  }

  // Construct filePath using the provided fileName or use a default filePath from formData
  const providedFilePath = formData.get("filePath");
  const filePath = typeof providedFilePath === "string" && providedFilePath.length > 0
    ? providedFilePath
    : `./data/${fileName}`; // Default to './data/' + fileName if no filePath is provided

  const privacyBudget = 1.0; // Replace with actual value or get from formData

  const dataset = await createDataset({
    fileName,
    fileType: typeof fileType === "string" ? fileType : "csv",
    filePath,
    privacyBudget,
    userId,
  });

  return json({ dataset });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const datasetListItems = await getDatasetListItems({ userId });
  return json({ datasetListItems, userId });  // Include userId in the response
};

export default function FileUploader({ isUploading }: FileUploaderProps) {
  const [fileUploaded, setFileUploaded] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const { datasetListItems, userId } = useLoaderData<typeof loader>();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadSuccess(false);
    setFileUploaded(acceptedFiles[0]);
  }, []);

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault(); // Prevent default form submission behavior

    if (fileUploaded) {
      console.log('Preparing to upload file:', fileUploaded.name); // Log the file name being uploaded
      setUploadSuccess(false); // Set the upload success state to false initially
      const formData = new FormData();
      formData.append('file', fileUploaded); // Append the file to the FormData object
      formData.append('filename', fileUploaded.name); // Append the filename
      // Append additional data if needed
      formData.append('fileType', fileUploaded.type || 'text/csv'); // Append the file type or default if not available
      formData.append('privacyBudget', '1.0'); // Append default privacy budget

      try {
        // Send the file to the server for upload

        const response = await fetch('/dashboard/dp/tabulardata', {
          method: 'POST',
          body: formData,
        });

        // Handle response
        if (response.ok) {
          // If the upload is successful, set uploadSuccess to true
          setUploadSuccess(true);


          // Extract the data from response if needed
          const data = await response.json();

          // Perform any additional actions with the response data
          console.log('File uploaded and dataset created', data);

          console.log('After createDataset call');

        } else {
          // Handle server errors
          console.log("here");

          console.error('Server error during file upload:', response.statusText);
          const errorText = await response.text(); // or response.json() if it returns JSON
          console.error('Server error during file upload:', errorText);
        }
      } catch (error) {
        // Handle network or other errors
        console.log("here");
        console.error('Network error during file upload:', error);
      }
    } else {
      // Handle the case where no file was uploaded
      console.log('No file selected for upload');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: fileUploaded !== null,
    noKeyboard: fileUploaded !== null
  });

  return (
    <form onSubmit={handleSubmit} method="post" encType="multipart/form-data">
      <div
        {...getRootProps()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: 128,
          border: '2px dashed #ccc',
          borderRadius: '4px',
          cursor: fileUploaded ? 'default' : 'pointer',
          backgroundColor: isDragActive ? '#e8f4ff' : fileUploaded ? '#f0f0f0' : 'white',
        }}
      >
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
                    <Button type="submit" variant="contained">
                      Upload
                    </Button>
                  </>
                ) : (
                  <Box textAlign="center">
                    <FileUploadRoundedIcon style={{ fontSize: 36 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Upload Your CSV File
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </div>
    </form>
  );
}
