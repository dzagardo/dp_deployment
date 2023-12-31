import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { getDatasetListItems } from "~/models/dataset.server";
import { requireUserId } from "~/session.server";
import { Box, Container, Divider, Grid, List, ListItem, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';
import FileUploader from "./fileuploader";
import { useState } from "react";
import React from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const userId = await requireUserId(request);
    const datasetListItems = await getDatasetListItems({ userId });
    return json({ datasetListItems });
};

export default function DatasetView() {
    const { datasetListItems } = useLoaderData<typeof loader>();
    const [isUploading, setIsUploading] = useState(false);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" sx={{ marginBottom: 2, letterSpacing: 1 }}>
                Dataset Management
            </Typography>
            <Grid container direction="column" spacing={3}>
                {/* Second Row: Dataset List */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2, height: 'calc(50vh - 96px)', overflow: 'hidden' }}>
                        <Box sx={{ maxHeight: 'calc(50vh - 96px)', overflowY: 'auto' }}>
                            <Typography variant="h6" component="div" sx={{
                                padding: 2,
                                backgroundColor: 'secondary.main',
                                color: 'common.white',
                                borderRadius: 1,
                                textAlign: 'center',
                                boxShadow: 1,
                            }}>
                                Available Datasets
                            </Typography>
                            {datasetListItems.length === 0 ? (
                                <Typography variant="h6" gutterBottom>
                                    No datasets yet
                                </Typography>
                            ) : (
                                <List sx={{ width: '100%' }}>
                                    {datasetListItems.map((item) => (
                                        <React.Fragment key={item.id}>
                                            <ListItem disableGutters sx={{ width: '100%', padding: 0 }}>
                                                <NavLink to={`/dashboard/dp/datasets/${item.id}`} style={{ textDecoration: 'none', width: '100%' }}>
                                                    <ListItemButton sx={{ justifyContent: 'space-between' }}>
                                                        <ListItemText primary={`📊 ${item.fileName}`} secondary={item.user?.id} sx={{ margin: 0 }} />
                                                    </ListItemButton>
                                                </NavLink>
                                            </ListItem>
                                            <Divider variant="fullWidth" component="li" />
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* First Row: File Uploader */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <FileUploader isUploading={isUploading} />
                    </Paper>
                </Grid>
                
                {/* Third Row: Main Content Area */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                        <Outlet />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
