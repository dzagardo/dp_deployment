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
import { List, ListItem, ListItemText, Link as MuiLink } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder'; // Added for datasets
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';


interface MainListItemsProps {
  onListItemClick: (viewName: string) => void;
}

export const MainListItems = ({ onListItemClick }: MainListItemsProps) => {
  // State to handle the collapsible section
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open); // Toggle the state to show or hide the nested items
  };

  return (
    <React.Fragment>
      {/* Differential Privacy Section */}
      <ListItemButton onClick={handleClick}>
        <ListItemIcon>
          <DashboardIcon />
        </ListItemIcon>
        <ListItemText primary="Differential Privacy" />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      {/* Collapsible Section for Differential Privacy */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemButton sx={{ pl: 4 }} component={Link} to="/dashboard/dp/tabulardata">
            <ListItemText primary="Generating Tabular Data" />
          </ListItemButton>
          <ListItemButton sx={{ pl: 4 }} component={Link} to="/dashboard/dp/imagedata">
            <ListItemText primary="Generating Image Data" />
          </ListItemButton>
          <ListItemButton sx={{ pl: 4 }} component={Link} to="/dashboard/dp/syntheticdatasets">
            <ListItemText primary="Manage Synthetic Datasets" />
          </ListItemButton>
          <ListItemButton sx={{ pl: 4 }} component={Link} to="/dashboard/dp/privacybudgets">
            <ListItemText primary="Manage Privacy Budgets" />
          </ListItemButton>
          <ListItemButton sx={{ pl: 4 }} component={Link} to="/dashboard/dp/datasets/lookup">
            <ListItemText primary="Lookup Datasets" />
          </ListItemButton>
        </List>
      </Collapse>

      <ListItemButton onClick={() => onListItemClick('Homomorphic Encryption')}>
        <ListItemIcon>
          <ShoppingCartIcon />
        </ListItemIcon>
        <ListItemText primary="Homomorphic Encryption" />
      </ListItemButton>
      <ListItemButton onClick={() => onListItemClick('Polymorphic Encryption')}>
        <ListItemIcon>
          <PeopleIcon />
        </ListItemIcon>
        <ListItemText primary="Polymorphic Encryption" />
      </ListItemButton>
      <ListItemButton onClick={() => onListItemClick('Private Set Intersection')}>
        <ListItemIcon>
          <BarChartIcon />
        </ListItemIcon>
        <ListItemText primary="Private Set Intersection" />
      </ListItemButton>
      <ListItemButton onClick={() => onListItemClick('Secure Multiparty Computation')}>
        <ListItemIcon>
          <LayersIcon />
        </ListItemIcon>
        <ListItemText primary="Secure Multiparty Computation" />
      </ListItemButton>
    </React.Fragment>
  );
};

export const secondaryListItems = (
  <React.Fragment>
    <ListSubheader component="div" inset>
      Saved reports
    </ListSubheader>
    <ListItemButton>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Current month" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Last quarter" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Year-end sale" />
    </ListItemButton>
  </React.Fragment>
);

export const DataSetListItems = () => {
  const [datasets, setDatasets] = useState<string[]>([]);

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

  return (
    <React.Fragment>
      <ListSubheader component="div" inset>
        Data Sets
      </ListSubheader>
      {datasets.map((dataset, index) => (
        <ListItemButton key={index} component={Link} to={`/dashboard/datasets/${dataset}`}>
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText
            primary={dataset}
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '320px', // Adjust as needed
            }}
          />
        </ListItemButton>
      ))}
    </React.Fragment>
  );
};