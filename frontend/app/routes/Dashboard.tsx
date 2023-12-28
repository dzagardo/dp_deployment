import React, { useState } from 'react';
import { json, redirect, ActionFunction, LoaderFunction } from '@remix-run/node';
import Button from '@mui/material/Button';
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
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { MainListItems, DataSetListItems } from './listItems';
import DashboardHE from './dashboard.he';
import DashboardDP from './dashboard.dp';
import DashboardPE from './dashboard.pe';
import DashboardPSI from './dashboard.psi';
import DashboardSMPC from './dashboard.smpc';
import { requireUserId } from '~/session.server';
import { createDataset } from '~/models/dataset.server';
import { useLoaderData } from "@remix-run/react";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Link } from 'react-router-dom';

// Type for the loader data
type LoaderData = {
  userId: string | undefined;
};

export const loader: LoaderFunction = async ({ request }: { request: Request }): Promise<Response> => {
  const userId = await requireUserId(request);
  // You can handle redirection or errors if the user is not logged in.
  return json({ userId });
};

const drawerWidth: number = 320;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

export const action: ActionFunction = async ({ request }) => {
  console.log("Action function called");

  try {
    // Ensure the user is authenticated and get their ID
    const userId = await requireUserId(request);
    console.log(`User ID: ${userId}`);

    // Extract form data
    const formData = await request.formData();
    console.log('Form Data:', Object.fromEntries(formData));

    const fileName = formData.get('filename');
    const fileType = formData.get('fileType');
    const filePath = formData.get('filePath');
    const privacyBudgetEntry = formData.get('privacyBudget');

    console.log({ fileName, fileType, filePath, privacyBudgetEntry });

    // Validate and convert fileName to a string
    if (typeof fileName !== 'string' || !fileName.trim()) {
      console.error('Filename validation failed');
      return new Response('Filename is required and must be a non-empty string', { status: 400 });
    }

    // Validate and convert fileType to a string
    if (typeof fileType !== 'string') {
      console.error('File type validation failed');
      return new Response('File type must be a string', { status: 400 });
    }

    // Validate and convert filePath to a string
    if (typeof filePath !== 'string') {
      console.error('File path validation failed');
      return new Response('File path must be a string', { status: 400 });
    }

    // Validate and convert privacyBudget to a number
    const privacyBudget = privacyBudgetEntry ? parseFloat(privacyBudgetEntry.toString()) : null;
    if (privacyBudget === null || isNaN(privacyBudget)) {
      console.error('Privacy budget validation failed');
      return new Response('Privacy budget must be a valid number', { status: 400 });
    }

    // Perform your logic (e.g., creating a dataset)
    const dataset = await createDataset({
      fileName,
      fileType,
      filePath,
      privacyBudget,
      userId,
    });

    console.log(`Dataset created with ID: ${dataset.id}`);
    return redirect(`/dashboard/dp/datasets/${dataset.id}`);

  } catch (error) {
    console.error('Failed to process the action:', error);
    return new Response('Failed to create the dataset', { status: 500 });
  }
};


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
  const [currentView, setCurrentView] = useState('Differential Privacy');
  const { userId } = useLoaderData<LoaderData>(); // Specify the type of loader data
  const [selectedTab, setSelectedTab] = React.useState(0);
  const handleTabChange = (event: any, newValue: React.SetStateAction<number>) => {
    setSelectedTab(newValue);
  };
  // Render the current view based on state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'Differential Privacy':
        return <DashboardDP />;
      case 'Homomorphic Encryption':
        return <DashboardHE />;
      case 'Polymorphic Encryption':
        return <DashboardPE />;
      case 'Private Set Intersection':
        return <DashboardPSI />;
      case 'Secure Multiparty Computation':
        return <DashboardSMPC />;
      // Add cases for other views
      default:
        return <div>Selected view not found</div>;
    }
  };

  const handleListItemClick = (viewName: React.SetStateAction<string>) => {
    setCurrentView(viewName);
  };

  const toggleDrawer = () => {
    setOpen(!open);
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
            {/* Here we add the Tabs */}
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              aria-label="Dashboard Tabs"
              sx={{
                marginLeft: 'auto',
                '.MuiTab-root': { // Style for the default (non-selected) tabs
                  color: 'dodgerblue', // Text color for the default tabs
                  borderBottom: '3px solid white',
                  borderTop: '2px solid white',
                  borderLeft: '1px solid white',
                  borderRight: '1px solid white',
                  marginRight: '10px',
                  '.MuiTabs-indicator': { // Hides the indicator
                    display: 'none',
                  },
                  borderRadius: '10px',
                  backgroundColor: 'white', // Background color for the default tabs
                  '&:hover': {
                    // backgroundColor: 'pink', // Optional: Change background on hover
                  },
                  '&.Mui-selected': { // Style for the selected tab
                    color: 'black', // Text color for the selected tab
                    backgroundColor: 'white', // Background color for the selected tab
                    indicatorColor: 'none',
                  },
                }
              }}
            >
              <Tab label="Tabular Data" component={Link} to="/dashboard/dp/tabulardata" />
              <Tab label="Image Data" component={Link} to="/dashboard/dp/imagedata" />
              <Tab label="Synthetic Datasets" component={Link} to="/dashboard/dp/syntheticdatasets" />
              <Tab label="Statistics" component={Link} to="/dashboard/dp/statistics" />
              <Tab label="Dataset Management" component={Link} to="/dashboard/dp/datasets/management" />
              {/* ... add more tabs as needed */}
            </Tabs>
            <form action={`/user/${userId}`} method="get">
              <Button type="submit" color="inherit">
                Profile
              </Button>
            </form>
            <form action="/logout" method="post">
              <Button type="submit" color="inherit">
                Logout
              </Button>
            </form>
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
            <MainListItems onListItemClick={handleListItemClick} />
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
          {renderCurrentView()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
