import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListSubheader from '@mui/material/ListSubheader';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import LayersIcon from '@mui/icons-material/Layers';
import AssignmentIcon from '@mui/icons-material/Assignment';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconButton, List, ListItem, ListItemText, Link as MuiLink, Toolbar, useTheme } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder'; // Added for datasets
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useLocation } from '@remix-run/react';
import { Layers } from '@mui/icons-material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface MainListItemsProps {
  onListItemClick: (viewName: string) => void;
}

const dodgerBlue = '#1E90FF'; // Dodger blue color

export const MainListItems = ({ onListItemClick }: MainListItemsProps) => {
  const [open, setOpen] = useState(false);
  const location = useLocation(); // Hook to get the current pathname
  const theme = useTheme(); // Access the theme
  const [openSections, setOpenSections] = useState({
    dp: false,
    he: false,
    pe: false,
    psi: false,
    smpc: false,
    // Add more sections as needed
  });

  type SectionKey = 'dp' | 'he' | 'pe' | 'psi' | 'smpc'; // Add more keys as needed

  // Update handleClick to also set the current view
  const handleClick = (section: SectionKey, viewName: string) => {
    setOpenSections(prevState => ({
      ...prevState,
      [section]: !prevState[section] // Toggle the specific section
    }));
    onListItemClick(viewName); // Set the current view
  };

  const isActive = (route: string) => {
    return location.pathname === route;
  };

  // Function to get the color based on the active route
  const getIconColor = (route: string) => {
    // Check if the current location pathname starts with the given route
    return location.pathname.startsWith(route) ? theme.palette.secondary.main : dodgerBlue;
  };

  const getBackgroundColor = (route: string) => {
    return isActive(route) ? '#222222' : 'transparent'; // Adjust the color based on your theme
  };

  // You can now use a function to set styles dynamically
  const listItemButtonStyles = (route: string) => ({
    borderRadius: 3,
    my: 1,
    mx: 3,
    '.MuiListItemIcon-root': {
      color: dodgerBlue,
    },
    color: 'gray',
    backgroundColor: getBackgroundColor(route),
    '&:hover': {
      backgroundColor: 'lightgray',
      '.MuiListItemIcon-root': {
        color: 'white',
      },
      '.MuiListItemText-primary': {
        color: 'black',
      },
    }
  });

  return (
    <React.Fragment>
      {/* Differential Privacy Section */}
      <ListItemButton
        sx={{
          borderRadius: 2, // Adjust for rounded corners
          my: 1, // Margin top and bottom for spacing between items
          mx: 1, // Margin left and right for spacing from the drawer edges
          '.MuiListItemIcon-root': {
            color: () => getIconColor('/dashboard/dp'), // Use a function to determine the color based on the route
          },
          color: 'white',
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            '.MuiListItemIcon-root': {
              color: 'white',
            },
            '.MuiListItemText-primary': {
              color: 'white',
            },
          }
        }}
        onClick={() => handleClick('dp', 'Differential Privacy')}
        component={Link}
        to="/dashboard/dp"
      >
        <ListItemIcon>
          <DashboardIcon />
        </ListItemIcon>
        <ListItemText primary="Differential Privacy" />
        {openSections.dp ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      {/* Collapsible Section for Differential Privacy */}
      <Collapse in={openSections.dp} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemButton sx={listItemButtonStyles('/dashboard/dp/tabulardata')} component={Link} to="/dashboard/dp/tabulardata">
            <ListItemText primary="Generating Tabular Data" />
          </ListItemButton>
          <ListItemButton sx={listItemButtonStyles('/dashboard/dp/imagedata')} component={Link} to="/dashboard/dp/imagedata">
            <ListItemText primary="Generating Image Data" />
          </ListItemButton>
          <ListItemButton sx={listItemButtonStyles('/dashboard/dp/statistics')} component={Link} to="/dashboard/dp/statistics">
            <ListItemText primary="Statistics" />
          </ListItemButton>
          <ListItemButton sx={listItemButtonStyles('/dashboard/dp/datasets/management')} component={Link} to="/dashboard/dp/datasets/management">
            <ListItemText primary="Dataset Management" />
          </ListItemButton>
          <ListItemButton sx={listItemButtonStyles('/dashboard/dp/whatisdp')} component={Link} to="/dashboard/dp/whatisdp">
            <ListItemText primary="What is Differential Privacy?" />
          </ListItemButton>
        </List>
      </Collapse>

      <ListItemButton
        sx={{
          borderRadius: 2, // Adjust for rounded corners
          my: 1, // Margin top and bottom for spacing between items
          mx: 1, // Margin left and right for spacing from the drawer edges
          '.MuiListItemIcon-root': {
            color: () => getIconColor('/dashboard/he'), // Use a function to determine the color based on the route
          },
          color: 'white',
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            '.MuiListItemIcon-root': {
              color: 'white',
            },
            '.MuiListItemText-primary': {
              color: 'white',
            },
          }
        }}
        onClick={() => handleClick('he', 'Homomorphic Encryption')}
        component={Link}
        to="/dashboard/he"
      >
        <ListItemIcon>
          <ShoppingCartIcon />
        </ListItemIcon>
        <ListItemText primary="Homomorphic Encryption" />
        {openSections.he ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      {/* Collapsible Section for Homomorphic Encryption */}
      <Collapse in={openSections.he} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemButton sx={listItemButtonStyles('/dashboard/he/whatishe')} component={Link} to="/dashboard/he/whatishe">
            <ListItemText primary="What is Homomorphic Encryption?" />
          </ListItemButton>
        </List>
      </Collapse>

      <ListItemButton
        sx={{
          borderRadius: 2, // Adjust for rounded corners
          my: 1, // Margin top and bottom for spacing between items
          mx: 1, // Margin left and right for spacing from the drawer edges
          '.MuiListItemIcon-root': {
            color: () => getIconColor('/dashboard/pe'), // Use a function to determine the color based on the route
          },
          color: 'white',
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            '.MuiListItemIcon-root': {
              color: 'white',
            },
            '.MuiListItemText-primary': {
              color: 'white',
            },
          }
        }}
        onClick={() => handleClick('pe', 'Polymorphic Encryption')}
        component={Link}
        to="/dashboard/pe"
      >
        <ListItemIcon>
          <PeopleIcon />
        </ListItemIcon>
        <ListItemText primary="Polymorphic Encryption" />
        {openSections.pe ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      {/* Collapsible Section for Polymorphic Encryption */}
      <Collapse in={openSections.pe} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemButton sx={listItemButtonStyles('/dashboard/pe/whatispe')} component={Link} to="/dashboard/pe/whatispe">
            <ListItemText primary="What is Polymorphic Encryption?" />
          </ListItemButton>
        </List>
      </Collapse>

      <ListItemButton
        sx={{
          borderRadius: 2, // Adjust for rounded corners
          my: 1, // Margin top and bottom for spacing between items
          mx: 1, // Margin left and right for spacing from the drawer edges
          '.MuiListItemIcon-root': {
            color: () => getIconColor('/dashboard/psi'), // Use a function to determine the color based on the route
          },
          color: 'white',
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            '.MuiListItemIcon-root': {
              color: 'white',
            },
            '.MuiListItemText-primary': {
              color: 'white',
            },
          }
        }}
        onClick={() => handleClick('psi', 'Private Set Intersection')}
        component={Link}
        to="/dashboard/psi"
      >
        <ListItemIcon>
          <BarChartIcon />
        </ListItemIcon>
        <ListItemText primary="Private Set Intersection" />
        {openSections.psi ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      {/* Collapsible Section for Private Set Intersection */}
      <Collapse in={openSections.psi} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemButton sx={listItemButtonStyles('/dashboard/psi/whatispsi')} component={Link} to="/dashboard/psi/whatispsi">
            <ListItemText primary="What is Private Set Intersection?" />
          </ListItemButton>
        </List>
      </Collapse>

      <ListItemButton
        sx={{
          borderRadius: 2, // Adjust for rounded corners
          my: 1, // Margin top and bottom for spacing between items
          mx: 1, // Margin left and right for spacing from the drawer edges
          '.MuiListItemIcon-root': {
            color: () => getIconColor('/dashboard/smpc'), // Use a function to determine the color based on the route
          },
          color: 'white',
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            '.MuiListItemIcon-root': {
              color: 'white',
            },
            '.MuiListItemText-primary': {
              color: 'white',
            },
          }
        }}
        onClick={() => handleClick('smpc', 'Secure Multiparty Computation')}
        component={Link}
        to="/dashboard/smpc"
      >
        <ListItemIcon>
          <LayersIcon />
        </ListItemIcon>
        <ListItemText primary="Secure Multiparty Computation" />
        {openSections.smpc ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      {/* Collapsible Section for Secure Multiparty Computation */}
      <Collapse in={openSections.smpc} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemButton sx={listItemButtonStyles('/dashboard/smpc/whatissmpc')} component={Link} to="/dashboard/smpc/whatissmpc">
            <ListItemText primary="What is Secure Multiparty Computation?" />
          </ListItemButton>
        </List>
      </Collapse>

    </React.Fragment>
  );
};

export const secondaryListItems = (
  <React.Fragment>
  </React.Fragment>
);

export const DataSetListItems = () => {
  const [datasets, setDatasets] = useState<string[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch('http://localhost:5000/list_files');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const files: string[] = await response.json();
        setDatasets(files);
      } catch (error) {
        console.error('Failed to fetch datasets:', error);
      }
    };

    fetchDatasets();
  }, []);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <React.Fragment>
      {/* <ListSubheader component="div" inset>
        Data Sets
      </ListSubheader> */}
      {datasets.map((dataset, index) => (
        <ListItemButton key={index} component={Link} to={`/dashboard/dp/datasets/${dataset}`}>
          <ListItemIcon sx={{ color: 'white' }}> {/* Set icon color to white */}
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText
            primary={dataset}
            sx={{
              color: 'white',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '320px', // Adjust as needed
            }}
          />
        </ListItemButton>
      ))}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
        }}
      >
        <IconButton onClick={toggleDrawer}>
          <ChevronLeftIcon sx={{
            color: "white",
          }} />
        </IconButton>
      </Toolbar>
    </React.Fragment>
  );
};
