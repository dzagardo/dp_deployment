import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, Outlet } from "@remix-run/react";
import { getDatasetListItems } from "~/models/dataset.server";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TabularDataView from './Dashboard.DP.TabularData';
import ImageDataView from './Dashboard.DP.ImageData';
import SyntheticDatasetsView from './Dashboard.DP.SyntheticDatasets';
import DataSetIndexPage from './dashboard.datasets._index';
import { redirect, ActionFunction } from '@remix-run/node';
import { requireUserId } from '~/session.server'; // If you're using authentication
import { createDataset } from '~/models/dataset.server'; // Adjust the path as necessary

// Define an interface for the loader data
interface LoaderData {
  datasetListItems: Array<{
    id: string;
    name: string;
    // add other properties that datasetListItems might have
  }>;
}

export const loader: LoaderFunction = async ({ request }) => {
  try {
    // Retrieve the user ID from the session or request context
    const userId = "somehow-obtain-the-user-id-here"; // Update this line accordingly
    const datasetListItems = await getDatasetListItems({ userId });
    console.log('Dataset list items fetched:', datasetListItems);
    return json({ datasetListItems });
  } catch (error) {
    console.error('Error fetching dataset list items:', error);
    throw new Response('Error fetching data', { status: 500 });
  }
};

function DashboardDP() {
  const [tabValue, setTabValue] = useState(0);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box component="main" sx={{ /* styles */ }}>
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Dashboard Tabs">
        <Tab label="Generating Tabular Data" />
        <Tab label="Generating Image Data" />
        <Tab label="Manage Synthetic Datasets" />
        <Tab label="Privacy Budget" />
        {/* Add more tabs as needed */}
      </Tabs>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Render content based on the selected tab */}
        {tabValue === 0 && <TabularDataView />}
        {tabValue === 1 && <ImageDataView />}
        {tabValue === 2 && <SyntheticDatasetsView />}
        {tabValue === 3 && <DataSetIndexPage />}
        {/* More views for additional tabs */}
      </Container>
    </Box>
  );
}

export default DashboardDP;
