// File: app/routes/dashboard.dp.statistics.$datasetId.tsx

import { json, LoaderFunction, ActionFunction, redirect } from "@remix-run/node";
import { useLoaderData, useRouteError, isRouteErrorResponse, Outlet } from "@remix-run/react";
import { Grid, Paper, SelectChangeEvent } from "@mui/material";
import invariant from "tiny-invariant";

import { getDataset, deleteDataset, updateDataset } from "~/models/dataset.server"; // Adjust this import to your actual function
import { requireUserId } from "~/session.server";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import { useState } from "react";
import { useNavigate } from "@remix-run/react";

import {
    Typography,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    List,
    ListItem
} from '@mui/material';

const theme = createTheme();

// Combine loader functions to handle undefined datasetId and fetch the dataset
export const loader: LoaderFunction = async ({ params, request }) => {
    const userId = await requireUserId(request);
    invariant(params.datasetId, "datasetId not found");

    const datasetId = params.datasetId;
    if (typeof datasetId !== 'string') {
        throw new Response("Not Found", { status: 404 });
    }

    const dataset = await getDataset({ id: datasetId, userId });
    if (!dataset) {
        throw new Response("Not Found", { status: 404 });
    }
    // Fetch column names for the dataset
    let columnNames = [];
    try {
        const colResponse = await fetch(`http://localhost:5000/get_column_names/${dataset.fileName}`);
        if (colResponse.ok) {
            columnNames = await colResponse.json();
        } else {
            console.error(`Failed to fetch column names, status: ${colResponse.status}`);
        }
    } catch (error) {
        console.error('Failed to fetch column names:', error);
    }

    // Return both dataset and column names
    return json({ dataset, columnNames });
};

// Action function to handle dataset deletion
export const action: ActionFunction = async ({ params, request }) => {
    const userId = await requireUserId(request);
    invariant(params.datasetId, "datasetId not found");

    await deleteDataset({ id: params.datasetId, userId });

    return redirect("/dashboard/dp/datasets/edit");
};

export default function DatasetStatistics() {
    const { dataset, columnNames } = useLoaderData<typeof loader>();
    const navigate = useNavigate();

    return (
        <ThemeProvider theme={theme}>
            <div>
                <h3 className="text-2xl font-bold">{dataset.fileName}</h3>
                <p className="py-2">File Type: {dataset.fileType}</p>
                <p className="py-2">Privacy Budget: {dataset.privacyBudget}</p>
                <p className="py-2">Total queries: {dataset.totalQueries}</p>
                <p className="py-2">Data Owner: {dataset.user?.id || 'Unknown'}</p>
                <hr className="my-4" />

                <div style={{ display: 'flex', gap: '16px' }}>
                    <ListItemButton onClick={() => navigate(`/dashboard/dp/statistics/${dataset.id}/calculate`)} style={{ backgroundColor: '#1976D2', color: 'white' }}>
                        Calculate
                    </ListItemButton>
                </div>

            </div>

            {/* Second Row: Main Content Area for Child Routes */}
            <Outlet />
        </ThemeProvider>

    );
}

export function ErrorBoundary() {
    const error = useRouteError();

    if (error instanceof Error) {
        return <div>An unexpected error occurred: {error.message}</div>;
    }

    if (!isRouteErrorResponse(error)) {
        return <h1>Unknown Error</h1>;
    }

    if (error.status === 404) {
        return <div>Dataset not found</div>;
    }

    return <div>An unexpected error occurred: {error.statusText}</div>;
}
