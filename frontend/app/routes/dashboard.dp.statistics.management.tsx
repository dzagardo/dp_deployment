
// frontend/app/routes/dashboard.datasets.lookup.tsx

import { Grid, Paper } from "@mui/material";
import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getDatasets } from "~/models/dataset.server"; // Adjust the import path to your actual function
import FileUploader from "./fileuploader";
import { useState } from "react";
import AlgorithmSelectorRemix from "./AlgorithmSelectorRemix";

export const loader: LoaderFunction = async () => {
  try {
    const datasets = await getDatasets(); // Fetch all datasets
    return json({ datasets });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw new Response('Error fetching datasets', { status: 500 });
  }
};

// Continue in the same file

const StatisticsDashboardPage = () => {
  const { datasets } = useLoaderData<{ datasets: Array<{ id: string; name: string }> }>();

  if (!datasets) {
    return <div>No datasets available</div>;
  }

  return (
    <div>
      <h1>Select a Dataset</h1>
    </div>
  );
};

export default StatisticsDashboardPage;
