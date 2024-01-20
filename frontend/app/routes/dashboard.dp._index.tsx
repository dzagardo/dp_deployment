import React from 'react';
import { Outlet, Link as RouterLink } from '@remix-run/react';
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
    <div></div>
  );
};

export default DashboardIndex;