import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import LayersIcon from '@mui/icons-material/Layers';
import AssignmentIcon from '@mui/icons-material/Assignment';
import React, { useEffect, useState } from 'react';

export const mainListItems = (
  <React.Fragment>
    <ListItemButton>
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Differential Privacy" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <ShoppingCartIcon />
      </ListItemIcon>
      <ListItemText primary="Homomorphic Encryption" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <PeopleIcon />
      </ListItemIcon>
      <ListItemText primary="Polymorphic Encryption" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <BarChartIcon />
      </ListItemIcon>
      <ListItemText primary="Private Set Intersection" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <LayersIcon />
      </ListItemIcon>
      <ListItemText primary="Secure Multiparty Computation" />
    </ListItemButton>
  </React.Fragment>
);

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
        <ListItemButton key={index}>
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText 
            primary={dataset} 
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '320px', // Adjust the width as needed
            }} 
          />
        </ListItemButton>
      ))}
    </React.Fragment>
  );
};
