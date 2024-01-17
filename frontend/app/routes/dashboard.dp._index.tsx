import React from 'react';
import { Link as RouterLink } from '@remix-run/react';
import { Typography, List, Paper, styled } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 'bold',
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledLink = styled(RouterLink)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.secondary.main,
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const DashboardIndex = () => {
  return (
    <StyledPaper elevation={3}>
      <StyledTypography variant="h4">
        Welcome to the Dashboard
      </StyledTypography>
      <Typography variant="body1" paragraph>
        Select a category from the navigation to get started.
      </Typography>
      
      <List component="nav">
        <StyledListItemButton>
          <StyledLink to="dp/tabulardata">
            Tabular Data
          </StyledLink>
        </StyledListItemButton>
        <StyledListItemButton>
          <StyledLink to="dp/imagedata">
            Image Data
          </StyledLink>
        </StyledListItemButton>
        <StyledListItemButton>
          <StyledLink to="dp/syntheticdatasets">
            Synthetic Datasets
          </StyledLink>
        </StyledListItemButton>
        {/* Add more links to other sub-routes as needed */}
      </List>
    </StyledPaper>
  );
};

export default DashboardIndex;