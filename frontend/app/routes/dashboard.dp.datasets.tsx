import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { getDatasetListItems } from "~/models/dataset.server"; // Adjust this import to your actual function
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import { Button, List, ListItem, ListItemText, Divider, Box, Container, Typography, Grid, Paper } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import { Link as RouterLink } from 'react-router-dom';
import FileUploader from "./fileuploader";
import { useState } from "react";
import React from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const userId = await requireUserId(request);
    // Get dataset list items with user information
    const datasetListItems = await getDatasetListItems({ userId });
    return json({ datasetListItems });
};

export default function DatasetView() {
    const { datasetListItems } = useLoaderData<typeof loader>();
    const [isUploading, setIsUploading] = useState(false);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* FileUploader */}
                <Grid item xs={12} md={4} lg={3}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <FileUploader isUploading={isUploading} />
                    </Paper>
                </Grid>

                {/* Dataset List */}
                <Grid item xs={12} md={8} lg={9}>
                    <Paper elevation={3} sx={{ p: 2, height: 'calc(50vh - 96px)', overflow: 'hidden' }}>
                        <Box sx={{ maxHeight: 'calc(50vh - 96px)', overflowY: 'auto' }}>
                            {datasetListItems.length === 0 ? (
                                <Typography variant="h6" gutterBottom>
                                    No datasets yet
                                </Typography>
                            ) : (
                                <List>
                                    {datasetListItems.map((item) => (
                                        <React.Fragment key={item.id}>
                                            <ListItem disablePadding>
                                                <NavLink to={`/dashboard/dp/datasets/${item.id}`} style={{ textDecoration: 'none' }}>
                                                    <ListItemButton>
                                                        <ListItemText primary={`📊 ${item.fileName}`} secondary={item.user?.id} />
                                                    </ListItemButton>
                                                </NavLink>
                                            </ListItem>
                                            <Divider variant="inset" component="li" />
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </Paper>
                </Grid>


                {/* Main Content Area */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        {/* Outlet will render the matched child route component. */}
                        <Outlet />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}