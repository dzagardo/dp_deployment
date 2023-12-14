import React, { useState } from 'react'; // Correct import statement
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { mainListItems, DataSetListItems } from './listItems';
import Chart from './Chart';
import Deposits from './Deposits';
import Orders from './Orders';
import FileUploader from './FileUploader';
import DataSynthesizer from './DataSynthesizer';
import DataGridDisplay from './DataGridDisplay';
import GenerateButton from './GenerateButton';
import Papa from 'papaparse';
import DatasetStatistics from './DatasetStatistics';
import AlgorithmSelector from './AlgorithmSelector';

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const drawerWidth: number = 320;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

export default function Dashboard() {
  const [open, setOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [gridData, setGridData] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [ratings, setRatings] = useState<number[]>([]); // State to hold ratings data
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>(''); // State to hold selected algorithm
  const [epsilon, setEpsilon] = useState<number>(1.0);
  const [delta, setDelta] = useState<number>(1e-5);
  const [lowerClip, setLowerClip] = useState<number>(0); // State to hold lower clip value
  const [upperClip, setUpperClip] = useState<number>(5); // State to hold upper clip value
  const [selectedColumn, setSelectedColumn] = useState('');

  const handleColumnSelect = (columnName: string) => {
    setSelectedColumn(columnName);
  };

  const handleAlgorithmSelect = (
    algorithm: string,
    epsilonValue: number,
    deltaValue: number,
    lowerClipValue: number,
    upperClipValue: number
  ) => {
    setSelectedAlgorithm(algorithm);
    setEpsilon(epsilonValue);
    setDelta(deltaValue);
    setLowerClip(lowerClipValue);
    setUpperClip(upperClipValue);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload_csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('File uploaded successfully');
      setUploadedFile(file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const onSelectFile = async (filename: string) => {
    setSelectedFile(filename); // Save the selected filename to state
    try {
      // Fetch the CSV content
      const response = await fetch(`http://localhost:5000/get_file/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const text = await response.text();
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          if (results.data) {
            handleDataFetched(results.data);

            // Now fetch the ratings column from the backend
            try {
              const ratingsResponse = await fetch(`http://localhost:5000/get_ratings/${filename}`);
              if (!ratingsResponse.ok) {
                throw new Error(`HTTP error! Status: ${ratingsResponse.status}`);
              }
              const ratingsData = await ratingsResponse.json();
              setRatings(ratingsData); // Update the ratings state
            } catch (error) {
              console.error('Error fetching ratings:', error);
            }
          }
        },
      });
    } catch (error) {
      console.error('Error fetching file:', error);
    }
  };

  const handleGenerateData = async (filename: string) => {
    if (!selectedAlgorithm || epsilon <= 0 || delta <= 0) {
      console.error('No algorithm selected or invalid epsilon/delta values');
      return;
    }
    if (filename.trim() !== '') {
      try {
        const response = await fetch(`http://localhost:5000/generate_data/${selectedAlgorithm}/${encodeURIComponent(filename)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            epsilon: epsilon,
            delta: delta,
            lowerClip: lowerClip,
            upperClip: upperClip,
            column_name: selectedColumn
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Synthetic data generation result:', result);
        // Handle the result as needed
      } catch (error) {
        console.error('Error generating synthetic data:', error);
      }
    } else {
      console.error('No file selected or invalid file name');
    }
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Define the onDataFetched function which will be called with the fetched data
  const handleDataFetched = (data: any[]) => {
    // Update the state with the fetched data
    setGridData(data);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: '24px', // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Dashboard
            </Typography>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            {mainListItems}
            <Divider sx={{ my: 1 }} />
            <DataSetListItems />
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* FileUploader */}
              <Grid item xs={12} md={8} lg={9}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 160,
                  }}
                >
                  <FileUploader onFileUploaded={handleFileUpload} isUploading={isUploading} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}> {/* Column 1 */}
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'row',
                    height: '100%',
                    justifyContent: 'space-between'
                  }}
                >
                  <DatasetStatistics data={ratings} />
                </Paper>
              </Grid>
              {/* DataSynthesizer */}
              <Grid item xs={12} md={4} lg={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    justifyContent: 'space-between'
                  }}
                >
                  <DataSynthesizer onSelectFile={onSelectFile} onDataFetched={handleDataFetched} setSelectedFile={setSelectedFile} onColumnSelect={handleColumnSelect} />
                  <GenerateButton onGenerate={() => handleGenerateData(selectedFile)} filename={selectedFile} />
                </Paper>
              </Grid>
              {/* AlgorithmSelector */}
              <Grid item xs={12} md={8} lg={6}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'row',
                    height: '100%',
                    justifyContent: 'space-between'
                  }}
                >
                  <AlgorithmSelector onAlgorithmSelect={handleAlgorithmSelect} />
                </Paper>
              </Grid>
              {/* AlgorithmSelector */}
              {/* DataGrid */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <DataGridDisplay data={gridData} />
                </Paper>
              </Grid>
            </Grid>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}