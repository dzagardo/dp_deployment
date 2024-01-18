import React, { useEffect, useState } from 'react';
import { json, redirect, ActionFunction, LoaderFunction } from '@remix-run/node';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
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
import { MainListItems, DataSetListItems } from './listItems';
import DashboardHE from './dashboard.he';
import DashboardDP from './dashboard.dp';
import DashboardPE from './dashboard.pe';
import DashboardPSI from './dashboard.psi';
import DashboardSMPC from './dashboard.smpc';
import { requireUserId } from '~/session.server';
import { createDataset } from '~/models/dataset.server';
import { useLoaderData } from "@remix-run/react";
import { Paper } from '@mui/material';
import { useLocation } from '@remix-run/react'; // Make sure to import from @remix-run/react


// Type for the loader data
type LoaderData = {
  userId: string | undefined;
};

const gradientStart = '#000000';
const gradientEnd = '#111111';

export const loader: LoaderFunction = async ({ request }: { request: Request }): Promise<Response> => {
  const userId = await requireUserId(request);
  // You can handle redirection or errors if the user is not logged in.
  return json({ userId });
};

const drawerWidth: number = 360;

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
  backgroundColor: `linear-gradient(180deg, ${gradientStart} 0%, ${gradientEnd} 100%)`, // Apply gradient background
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  // If you have additional AppBar styles, include them here
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
      boxShadow: theme.shadows[3], // Apply some shadow for an inset effect
      marginBottom: '20px', // Bottom margin
      background: `linear-gradient(180deg, ${gradientStart} 0%, ${gradientEnd} 100%)`, // Gradient background
      overflowY: 'auto', // Make overflow scrollable
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

export default function Dashboard() {
  const [open, setOpen] = useState(true);
  const { userId } = useLoaderData<LoaderData>(); // Specify the type of loader data
  const location = useLocation(); // Use the useLocation hook to get the location object
  const [currentView, setCurrentView] = useState('');

  // Function to determine the initial view based on the current path
  const getViewFromPath = (path: string) => {
    if (path.includes('/dashboard/dp')) return 'Differential Privacy';
    if (path.includes('/dashboard/he')) return 'Homomorphic Encryption';
    if (path.includes('/dashboard/pe')) return 'Polymorphic Encryption';
    if (path.includes('/dashboard/psi')) return 'Private Set Intersection';
    if (path.includes('/dashboard/smpc')) return 'Secure Multiparty Computation';
    // Add more checks for other paths
    return 'default'; // Fallback to default view
  };

  useEffect(() => {
    // Set the current view based on the current route when the component mounts
    setCurrentView(getViewFromPath(location.pathname));
  }, [location]); // Only re-run the effect if the location changes

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
        return <div></div>;
    }
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
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
            The Privacy Toolbox
          </Typography>
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
        <Divider />
        <Box
          sx={{
            overflow: 'auto', // Apply overflow here for the entire drawer content
            backgroundColor: 'transparent',
          }}
        >
          <List
            component="nav"
            sx={{
              overflowY: 'auto', // This will enable scrolling on the List
              height: 'calc(100vh - [ToolbarHeight]px)', // Adjust [ToolbarHeight] with actual height
              '& .MuiListItemButton-root': {
                // Style for ListItemButton, if necessary
              },
              // ...other styles
            }}
          >
            <MainListItems onListItemClick={(viewName) => setCurrentView(viewName)} />
            <Divider sx={{ my: 1 }} />
            <DataSetListItems />
          </List>
        </Box>
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
  );
}
