import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, NavLink, Outlet } from "@remix-run/react";
import { useState } from "react";
import { Box, Button, Container, Divider, Grid, List, ListItem, ListItemButton, ListItemText, Paper, Typography } from "@mui/material";
import { requireUserId } from "~/session.server";
import { getDatasetListItems } from "~/models/dataset.server";
import React from "react";
import AlgorithmSelectorRemix from "./AlgorithmSelectorRemix";

type Dataset = {
  id: string;
  fileName: string;
  privacyBudget: number;
  columns: string[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const datasetListItems = await getDatasetListItems({ userId });
  return json({ datasetListItems });
};

export default function StatisticsDashboard() {
  const { datasetListItems } = useLoaderData<{ datasetListItems: Dataset[] }>();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ marginBottom: 2, letterSpacing: 1 }}>
        Understanding Privacy Budgets in Differential Privacy
      </Typography>
      <Grid container direction="column" spacing={3}>

        {/* Dataset Selection List */}
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
                Select Dataset for Statistics
              </Typography>
              {datasetListItems.length === 0 ? (
                <Typography variant="h6" gutterBottom>
                  No datasets yet
                </Typography>
              ) : (
                <List sx={{ width: '100%' }}>
                  {datasetListItems.map((dataset) => (
                    <React.Fragment key={dataset.id}>
                      <ListItem disableGutters sx={{ width: '100%', padding: 0 }}>
                        <NavLink to={`/dashboard/dp/statistics/${dataset.id}`} style={{ textDecoration: 'none', width: '100%' }}>
                          <ListItemButton sx={{ justifyContent: 'space-between' }}>
                            <ListItemText primary={`📊 ${dataset.fileName}`} secondary={`Privacy Budget: ${dataset.privacyBudget}`} sx={{ margin: 0 }} />
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

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, height: 'calc(25vh', overflow: 'hidden' }}>
            <AlgorithmSelectorRemix datasetListItems={[]} onAlgorithmSelect={function (algorithm: string, epsilon: number, delta: number, lowerClip: number, upperClip: number): void {
              throw new Error("Function not implemented.");
            }} onGenerate={function (filename: string): void {
              throw new Error("Function not implemented.");
            }} filename={""} onSelectFile={function (file: string): void {
              throw new Error("Function not implemented.");
            }} onDataFetched={function (data: any[]): void {
              throw new Error("Function not implemented.");
            }} setSelectedFile={function (value: React.SetStateAction<string>): void {
              throw new Error("Function not implemented.");
            }} onColumnSelect={function (columnName: string): void {
              throw new Error("Function not implemented.");
            }} />
          </Paper>
        </Grid>


        {/* Third Row: Main Content Area */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Outlet />
          </Paper>
        </Grid>
      </Grid>
    </Container >
  );
}
