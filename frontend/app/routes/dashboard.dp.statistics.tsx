import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, NavLink, Outlet } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Box, Button, Container, Divider, FormControl, Grid, InputLabel, List, ListItem, ListItemButton, ListItemText, MenuItem, Paper, Select, SelectChangeEvent, Typography } from "@mui/material";
import { requireUserId } from "~/session.server";
import { getDataset, getDatasetListItems } from "~/models/dataset.server";
import React from "react";
import AlgorithmSelectorRemix from "./AlgorithmSelectorRemix";
import invariant from "tiny-invariant";
import { updateDataset } from "~/models/dataset.server";

const operations = ["mean", "median", "mode", "min", "max"];

type Dataset = {
  id: string;
  fileName: string;
  privacyBudget: number;
  columns: string[];
  totalQueries: number;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  console.log("Params received:", params); // Check what params are received

  const userId = await requireUserId(request);
  // invariant(params.datasetId, "datasetId not found");
  const datasetListItems = await getDatasetListItems({ userId });

  // Capture action return data
  const url = new URL(request.url);
  const result = url.searchParams.get("result");
  const updatedPrivacyBudget = url.searchParams.get("updatedPrivacyBudget");

  console.log(result, updatedPrivacyBudget);
  return json({ datasetListItems, result, updatedPrivacyBudget, userId });
};

export default function StatisticsDashboard() {
  const { datasetListItems, dataset, userId } = useLoaderData<{ datasetListItems: Dataset[], dataset: Dataset, userId: string }>();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState(''); // State to track the selected column
  const [selectedOperation, setSelectedOperation] = useState('');
  const [statisticResult, setStatisticResult] = useState(null);

  // Fetch column names when a dataset is selected
  useEffect(() => {
    if (selectedDataset) {
      (async () => {
        const response = await fetch(`http://localhost:5000/get_column_names/${selectedDataset.fileName}`);
        if (response.ok) {
          const columns = await response.json();
          setColumnNames(columns); // Update the column names state
        } else {
          console.error(`Failed to fetch column names, status: ${response.status}`);
        }
      })();
    }
  }, [selectedDataset]);

  const handleDatasetSelect = async (dataset: Dataset) => {
    setSelectedDataset(dataset);
  };

  const handleColumnChange = (event: SelectChangeEvent<string>) => {
    setSelectedColumn(event.target.value as string); // Update the selected column state
  };

  // Function to handle selection of an operation
  const handleOperationChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setSelectedOperation(event.target.value);
  };

  // Function to fetch and display the statistic
  const handleCalculateStatistic = async () => {
    if (!selectedColumn || !selectedDataset) {
      alert("Please select a column first!");
      return;
    }

    const url = `http://localhost:5000/get_noisy/${selectedOperation}`;
    const data = {
      privacyBudget: selectedDataset.privacyBudget,
      fileName: selectedDataset.fileName,
      columnName: selectedColumn,
      totalQueries: selectedDataset.totalQueries,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setStatisticResult(result.statisticValue); // Update the state with the fetched result

        // Update the privacy budget and totalQueries in the dataset
        const updatedDataset = await updateDataset({
          id: selectedDataset.id,
          userId: userId,
          data: {
            fileName: selectedDataset.fileName, // Keep existing fileName
            privacyBudget: result.updatedPrivacyBudget, // Update the privacy budget
            totalQueries: selectedDataset.totalQueries + 1, // Increment the totalQueries
          },
          resetQueries: false // Indicate not to reset the totalQueries
        });
        console.log(`Updated Privacy Budget: ${result.updatedPrivacyBudget}`);
      } else {
        console.error(`Failed to fetch statistic, status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to perform operation:', error);
    }
  };

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
                        <NavLink
                          to={`/dashboard/dp/statistics/${dataset.id}`}
                          style={{ textDecoration: 'none', width: '100%' }}
                          onClick={() => handleDatasetSelect(dataset)} // Update the selected dataset on click
                        >
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

        {/* Second Row: Column Selection List */}
        {selectedDataset && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" component="div" sx={{ marginBottom: 2 }}>
                Select Column for {selectedDataset.fileName}
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="column-select-label">Column</InputLabel>
                <Select
                  labelId="column-select-label"
                  id="column-select"
                  value={selectedColumn}
                  label="Column"
                  onChange={handleColumnChange}
                >
                  {columnNames.length === 0 ? (
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                  ) : (
                    columnNames.map((columnName, index) => (
                      <MenuItem key={index} value={columnName}>
                        {columnName}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ padding: 2, margin: '20px 0' }}>
            <Grid container spacing={2} alignItems="left">

              {/* Operations */}
              <Grid item xs={8}>
                <Grid container spacing={2} justifyContent="left">
                  {operations.map((operation, index) => (
                    <Grid item key={index}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          setSelectedOperation(operation);
                          handleCalculateStatistic();
                        }}
                        sx={{
                          minWidth: '100px',
                          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
                          textTransform: 'capitalize',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
                          },
                        }}
                      >
                        {operation.charAt(0).toUpperCase() + operation.slice(1)}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Result Display */}
              <Grid item xs={4}>
                <Typography variant="h6" textAlign="center">
                  Result: {statisticResult !== null ? statisticResult : "No result calculated yet"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>


        {/* Third Row: Main Content Area */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Outlet context={{ selectedDataset }} /> {/* Provide selectedDataset as context */}
          </Paper>
        </Grid>
      </Grid>
    </Container >
  );
}
